/// <reference types="node" />
import { EventEmitter } from "events";
import { Logger } from "winston";
import { ServiceInfo } from "./service-validator";
import { MethodMapHandlerInterface } from "./register-method";
export declare class Service {
    private name;
    private logger;
    private methods;
    constructor(name: string, serviceInfo: ServiceInfo, logger: Logger);
    subscribeToMethods(emitter: EventEmitter, methodMap: MethodMapHandlerInterface): void;
}
//# sourceMappingURL=service.d.ts.map