"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Service = void 0;
class Service {
    constructor(name, serviceInfo, logger) {
        this.name = name;
        this.logger = logger;
        this.methods = serviceInfo.methods;
    }
    subscribeToMethods(emitter, methodMap) {
        const methodNames = Object.keys(this.methods);
        methodNames.forEach((methodName) => {
            const eventKey = `${this.name}_${methodName}`;
            this.logger.debug(`Subscribing to: ${eventKey}`);
            emitter.on(eventKey, (data) => {
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
                    const jsonResult = {
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
                }
                catch (error) {
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
exports.Service = Service;
//# sourceMappingURL=service.js.map