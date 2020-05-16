import { ServerResponse } from "http";
import { EventEmitter } from "events";
import {
    ServiceClassConstructible,
    ServiceInfo,
    ServiceMethod,
    ValueType,
    JsonResult
} from "./service-validator";
import { Logger } from "winston";

export class Service {
    private class: ServiceClassConstructible;
    private methods: { [methodName: string]: ServiceMethod };

    constructor(private name: string, serviceInfo: ServiceInfo, private logger: Logger) {
        this.class = serviceInfo.class;
        this.methods = serviceInfo.methods;
    }

    subscribeToMethods(emitter: EventEmitter): void {
        const methodNames = Object.keys(this.methods);
        const classInstance = new (this.class)();

        methodNames.forEach((methodName) => {
            const eventKey = `${this.name}_${methodName}`;

            this.logger.info(`Subscribing to: ${eventKey}`);
            emitter.on(eventKey, (data:
                {
                    response: ServerResponse;
                    args: {
                        [key: string]: ValueType;
                    }; }) => {
                const { response, args } = data;

                const expectedParams = Object.keys(this.methods[methodName].params);
                const actualParamValues = expectedParams.map(param => args[param]);

                const result = classInstance[methodName](...actualParamValues);
                const jsonResult: JsonResult = {
                    data: {
                        type: this.methods[methodName].returnInfo.type,
                        value: result,
                    },
                };

                response.setHeader("Content-Type", "application/json");
                response.end(jsonResult);
            });
        });
    }
}
