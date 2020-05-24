import * as Http from "http";
import { EventEmitter } from "events";
import { createLogger, Logger, LoggerOptions, format, transports } from "winston";
import { ServiceDefintion, RequestData, RequestDataSchema, ValueType, ParamType } from "./service-validator";
import { Service } from "./service";
import MethodMapHandler from "./register-method";

type LogLevel = "debug" | "warn" | "info" | "error";

interface ServerConfig {
    port?: number;
    host?: string;
    logLevel?: LogLevel;
    serviceDefinition: ServiceDefintion;
    endpoint: string;
}

interface WinstonTransport {
    name: "console" | "file" | "http";
    logLevel: LogLevel;
    fileName?: string;
    host?: string;
    port?: string;
}

export class Server {
    private server: Http.Server;
    private logger: Logger;
    private loggerTransports: WinstonTransport[];
    private isStarted = false;
    private emitter: EventEmitter;
    private methodMap: MethodMapHandler;

    constructor(private config: ServerConfig) {
        this.loggerTransports = [];
        this.emitter = new EventEmitter();
        this.methodMap = new MethodMapHandler({});

        this.initializeServices = this.initializeServices.bind(this);
        this.parseMessage = this.parseMessage.bind(this);
    }

    public addFunction(fn: Function, fnName?: string): Server {
        const name = fnName || fn.name;
        if (!name) {
            throw new Error('Function name is required!');
        }
        this.methodMap.add(name, fn);
        return this;
    }

    public addConsoleLogger(logLevel: LogLevel): Server {
        if (this.isStarted) {
            throw new Error("Unable to add file logger after server started");
        }
        this.loggerTransports.push({
            name: "console",
            logLevel: logLevel,
        })
        return this;
    }

    public addFileLogger(filename: string, logLevel: LogLevel): Server {
        if (this.isStarted) {
            throw new Error("Unable to add file logger after server started");
        }
        this.loggerTransports.push({
            name: "file",
            logLevel: logLevel,
            fileName: filename,
        })
        return this;
    }

    public addHttpLogger(host: string, port = "80", logLevel: LogLevel): Server {
        if (this.isStarted) {
            throw new Error("Unable to add file logger after server started");
        }
        this.loggerTransports.push({
            name: "http",
            logLevel: logLevel,
            host,
            port,
        })
        return this;
    }

    private initializeServices(): void {
        const serviceNames = Object.keys(this.config.serviceDefinition);

        serviceNames.forEach((serviceName) => {
            const service = new Service(serviceName, this.config.serviceDefinition[serviceName], this.logger);
            service.subscribeToMethods(this.emitter, this.methodMap);
        });
    }

    private setupLogger(): void {
        // set up logger
        const loggerOptions: LoggerOptions = {
            level: this.config.logLevel || "debug",
            format: format.json(),
            transports: [
                ...(this.loggerTransports.map((transport) => {
                    if (transport.name === "console") {
                        return new transports.Console({
                            level: transport.logLevel,
                            format: format.combine(
                                format.colorize(),
                                format.simple()
                            )
                        });
                    } else if (transport.name === "file") {
                        return new transports.File({
                            filename: transport.fileName || "error.log",
                            level: transport.logLevel,
                            format: format.json()
                        });
                    } else if (transport.name === "http") {
                        return new transports.Http({
                            level: 'warn',
                            format: format.json(),
                            host: transport.host,
                            port: +transport.port,
                        });
                    }
                    else return null;
                })).filter(transport => !!transport)
            ],
        };
        this.logger = createLogger(loggerOptions);
    }

    public start(callback?: Function): void {
        const { port, host, endpoint } = this.config;
        if (!endpoint) {
            this.config.endpoint = '/messages';
        }
        this.setupLogger();
        this.initializeServices();
        this.server = Http.createServer(this.parseMessage);
        this.server.listen(port, host, () => {
            this.logger.info(`Server started at http://${host || 'localhost'}:${port}`);
            this.logger.info(`Endpoint: ${this.config.endpoint}`);
            if (callback) {
                callback();
            }
        });
    }

    private parseMessage(request: Http.IncomingMessage, response: Http.ServerResponse): void {
        const { method, url } = request;
        this.logger.debug(`Parsing message: /${method} ${url}`);

        if (method.toUpperCase() !== "POST" || url !== this.config.endpoint) {
            // return bad request
            this.logger.debug(`Bad Request: /${method} ${url}`);
            response.statusCode = 400;
            return response.end("Bad Request");
        }

        // read request body content
        const buffer: Uint8Array[] = [];

        // subscribe to emitter with results
        this.emitter.on('result', (resultData: string) => {
            this.logger.debug(`Received emitted result: ${resultData}`);
            const parsedResults: {
                statusCode: number;
                message?: string;
                value?: {
                    data: {
                        type: ParamType;
                        value: ValueType;
                    };
                };
            } = JSON.parse(resultData);
            response.setHeader("Content-Type", "application/json");
            response.statusCode = parsedResults.statusCode;
            response.end(parsedResults.message || JSON.stringify(parsedResults.value));
            this.logger.info(` /${method} ${url} - ${parsedResults.statusCode}`);
        });

        request
            .on("data", chunk => buffer.push(chunk))
            .on("end", () => {
                const rawData = Buffer.concat(buffer).toString();
                try {
                    const parsed: RequestData = JSON.parse(rawData);
                    this.logger.debug(`Parsed data: ${JSON.stringify(parsed)}`);

                    const { error: validationError } = RequestDataSchema.validate(parsed);
                    if (validationError) {
                        // return bad request
                        this.logger.error(validationError);
                        this.logger.debug(`Bad Request: /${method} ${url}`);
                        response.statusCode = 400;
                        return response.end("Bad Request");
                    }
                    const { serviceName, methodName, args } = parsed;
                    this.logger.debug(`Emitting to key: ${serviceName}_${methodName}`);
                    this.emitter.emit(`${serviceName}_${methodName}`, { args });
                } catch (error) {
                    this.logger.debug(error);
                    this.logger.error(error);
                    this.emitter.emit('result', JSON.stringify({
                        statusCode: 500,
                        message: 'Internal server error',
                    }));
                }
            });
    }
}
