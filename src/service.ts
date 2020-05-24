import { EventEmitter } from "events";
import { Logger } from "winston";
import {
    ServiceInfo,
    ServiceMethod,
    ValueType,
    JsonResult
} from "./service-validator";
import { MethodMapHandlerInterface } from "./register-method";

export class Service {
    private methods: { [methodName: string]: ServiceMethod };

    constructor(private name: string, serviceInfo: ServiceInfo, private logger: Logger) {
        this.methods = serviceInfo.methods;
        // validate method names
    }

    subscribeToMethods(emitter: EventEmitter, methodMap: MethodMapHandlerInterface): void {
        const methodNames = Object.keys(this.methods);

        methodNames.forEach((methodName) => {
            const eventKey = `${this.name}_${methodName}`;
            this.logger.debug(`Subscribing to: ${eventKey}`);
            emitter.on(eventKey, (data: {
                    args: {
                        [key: string]: ValueType;
                    };
            }) => {
                const { args } = data;
                this.logger.debug('Emitter got some data', args);

                try {
                    const expectedParams = Object.keys(this.methods[methodName].params);
                    const actualParamValues = expectedParams.map(param => args[param]);

                    const availableMethod = methodMap.get(methodName);
                    this.logger.debug(`Available method: ${availableMethod}`);
                    this.logger.debug(`Method params: ${actualParamValues}`);
                    const result = availableMethod(...actualParamValues);
                    this.logger.debug(`Method result: ${result}`);
                    const jsonResult: JsonResult = {
                        data: {
                            type: this.methods[methodName].returnInfo.type,
                            value: result,
                        },
                    };
                    const stringResult = JSON.stringify({
                        statusCode: 200,
                        value: jsonResult,
                    });

                    this.logger.debug(`Emitting json result: ${stringResult}`);
                    return emitter.emit('result', stringResult);
                } catch (error) {
                    this.logger.debug(`Emitter error: ${error}`);
                    return emitter.emit('result', JSON.stringify({
                        statusCode: 500,
                        message: 'Internal server error',
                    }));
                }
            });
        });
    }
}
