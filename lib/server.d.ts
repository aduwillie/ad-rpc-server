import { ServiceDefintion } from "./service-validator";
declare type LogLevel = "debug" | "warn" | "info" | "error";
interface ServerConfig {
    port?: number;
    host?: string;
    logLevel?: LogLevel;
    serviceDefinition: ServiceDefintion;
    endpoint: string;
}
export declare class Server {
    private config;
    private server;
    private logger;
    private loggerTransports;
    private isStarted;
    private emitter;
    private methodMap;
    constructor(config: ServerConfig);
    addFunction(fn: Function, fnName?: string): Server;
    addConsoleLogger(logLevel: LogLevel): Server;
    addFileLogger(filename: string, logLevel: LogLevel): Server;
    addHttpLogger(host: string, port: string, logLevel: LogLevel): Server;
    private initializeServices;
    private setupLogger;
    start(callback?: Function): void;
    private parseMessage;
}
export {};
//# sourceMappingURL=server.d.ts.map