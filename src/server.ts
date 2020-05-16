import * as Http from "http";
import { EventEmitter } from "events";
import { createLogger, Logger, LoggerOptions, format, transports } from "winston";
import { ServiceDefintion } from "./service-validator";
import { Service } from "./service";

interface ServerConfig {
    port?: number;
    host?: string;
    logLevel?: string;
    serviceDefinition: ServiceDefintion;
    endpoint: string;
}

type LogLevel = "debug" | "warn" | "info" | "error";

interface WinstonTransport {
    name: "console" | "file" | "http";
    logLevel: LogLevel;
    fileName?: string;
    host?: string;
    port?: string;
}

export class Server extends EventEmitter {
    private server: Http.Server;
    private logger: Logger;
    private loggerTransports: WinstonTransport[];
    private isStarted = false;

    constructor(private config: ServerConfig) {
        super();
        this.loggerTransports = [];
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
            service.subscribeToMethods(this);
        });
    }

    public start(callback?: Function): void {
        const { port, host, logLevel } = this.config;

        // set up logger
        const loggerOptions: LoggerOptions = {
            level: logLevel || "debug",
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

        // set up server instance
        this.server = Http.createServer(this.parseMessage);
        this.server.listen(port, host, () => {
            this.logger.info(`Server started at ${host}:${port}`);
            if (callback) {
                callback();
            }
        });
    }

    private parseMessage(request: Http.IncomingMessage, response: Http.ServerResponse): void {
        const { method, url } = request;
        this.logger.debug(`Parsing message: /${method} ${url}`);

        if (method.toUpperCase() !== "POST") {
            // return bad request
            response.statusCode = 400;
            return response.end("Bad Request");
        }

        if (url === this.config.endpoint) {
            // read request body content
            const buffer: Uint8Array[] = [];
            request
                .on("data", chunk => buffer.push(chunk))
                .on("end", () => {
                    const rawData = Buffer.concat(buffer).toString();
                    try {
                        const parsed = JSON.parse(rawData);
                        this.logger.debug(parsed);

                        const requiredFields = ["args", "methodName", "name"];
                        const missingFields = requiredFields.filter(field => !parsed[field]);
                        if (missingFields.length) {
                            const errorMessage = `Missing fields: ${missingFields}`;
                            this.logger.debug(errorMessage);
                            throw new Error(errorMessage);
                        }
                        return parsed;
                    } catch (error) {
                        this.logger.error(error);
                        response.statusCode = 500;
                        return response.end(`Error parsing data: ${JSON.stringify(error)}`);
                    }
                });
        }
    }
}
