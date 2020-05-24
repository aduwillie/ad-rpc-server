"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Server = void 0;
const Http = require("http");
const events_1 = require("events");
const winston_1 = require("winston");
const service_validator_1 = require("./service-validator");
const service_1 = require("./service");
const register_method_1 = require("./register-method");
class Server {
    constructor(config) {
        this.config = config;
        this.isStarted = false;
        this.loggerTransports = [];
        this.emitter = new events_1.EventEmitter();
        this.methodMap = new register_method_1.default({});
        this.initializeServices = this.initializeServices.bind(this);
        this.parseMessage = this.parseMessage.bind(this);
    }
    addFunction(fn, fnName) {
        const name = fnName || fn.name;
        if (!name) {
            throw new Error('Function name is required!');
        }
        this.methodMap.add(name, fn);
        return this;
    }
    addConsoleLogger(logLevel) {
        if (this.isStarted) {
            throw new Error("Unable to add file logger after server started");
        }
        this.loggerTransports.push({
            name: "console",
            logLevel: logLevel,
        });
        return this;
    }
    addFileLogger(filename, logLevel) {
        if (this.isStarted) {
            throw new Error("Unable to add file logger after server started");
        }
        this.loggerTransports.push({
            name: "file",
            logLevel: logLevel,
            fileName: filename,
        });
        return this;
    }
    addHttpLogger(host, port = "80", logLevel) {
        if (this.isStarted) {
            throw new Error("Unable to add file logger after server started");
        }
        this.loggerTransports.push({
            name: "http",
            logLevel: logLevel,
            host,
            port,
        });
        return this;
    }
    initializeServices() {
        const serviceNames = Object.keys(this.config.serviceDefinition);
        serviceNames.forEach((serviceName) => {
            const service = new service_1.Service(serviceName, this.config.serviceDefinition[serviceName], this.logger);
            service.subscribeToMethods(this.emitter, this.methodMap);
        });
    }
    setupLogger() {
        const loggerOptions = {
            level: this.config.logLevel || "debug",
            format: winston_1.format.json(),
            transports: [
                ...(this.loggerTransports.map((transport) => {
                    if (transport.name === "console") {
                        return new winston_1.transports.Console({
                            level: transport.logLevel,
                            format: winston_1.format.combine(winston_1.format.colorize(), winston_1.format.simple())
                        });
                    }
                    else if (transport.name === "file") {
                        return new winston_1.transports.File({
                            filename: transport.fileName || "error.log",
                            level: transport.logLevel,
                            format: winston_1.format.json()
                        });
                    }
                    else if (transport.name === "http") {
                        return new winston_1.transports.Http({
                            level: 'warn',
                            format: winston_1.format.json(),
                            host: transport.host,
                            port: +transport.port,
                        });
                    }
                    else
                        return null;
                })).filter(transport => !!transport)
            ],
        };
        this.logger = winston_1.createLogger(loggerOptions);
    }
    start(callback) {
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
    parseMessage(request, response) {
        const { method, url } = request;
        this.logger.debug(`Parsing message: /${method} ${url}`);
        if (method.toUpperCase() !== "POST" || url !== this.config.endpoint) {
            this.logger.debug(`Bad Request: /${method} ${url}`);
            response.statusCode = 400;
            return response.end("Bad Request");
        }
        const buffer = [];
        this.emitter.on('result', (resultData) => {
            this.logger.debug(`Received emitted result: ${resultData}`);
            const parsedResults = JSON.parse(resultData);
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
                const parsed = JSON.parse(rawData);
                this.logger.debug(`Parsed data: ${JSON.stringify(parsed)}`);
                const { error: validationError } = service_validator_1.RequestDataSchema.validate(parsed);
                if (validationError) {
                    this.logger.error(validationError);
                    this.logger.debug(`Bad Request: /${method} ${url}`);
                    response.statusCode = 400;
                    return response.end("Bad Request");
                }
                const { serviceName, methodName, args } = parsed;
                this.logger.debug(`Emitting to key: ${serviceName}_${methodName}`);
                this.emitter.emit(`${serviceName}_${methodName}`, { args });
            }
            catch (error) {
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
exports.Server = Server;
//# sourceMappingURL=server.js.map