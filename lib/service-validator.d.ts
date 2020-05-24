/// <reference types="hapi__joi" />
import * as Joi from "@hapi/joi";
export declare type ParamType = "string" | "number" | "boolean" | "object";
export declare type ValueType = string | number | boolean | object;
export interface ClassMethodType {
    (...args: ValueType[]): ValueType;
}
export declare type ServiceClass = {
    [methodName: string]: ClassMethodType;
};
export interface ServiceClassConstructible {
    new (): ServiceClass;
}
export interface ServiceMethod {
    description?: string;
    params: {
        [paramName: string]: {
            order: number;
            description?: string;
            type: ParamType;
            optional?: boolean;
            defaultValue?: ValueType;
        };
    };
    returnInfo: {
        description?: string;
        type: ParamType;
    };
}
export interface ServiceInfo {
    methods: {
        [methodName: string]: ServiceMethod;
    };
}
export interface ServiceDefintion {
    [serviceName: string]: ServiceInfo;
}
export declare const ReturnInfoSchema: Joi.ObjectSchema<any>;
export declare const ParamSchema: Joi.ObjectSchema<any>;
export declare const MethodSchema: Joi.ObjectSchema<any>;
export declare const ServiceSchema: Joi.ObjectSchema<any>;
export interface JsonResult {
    data: {
        type: ParamType;
        value: ValueType;
    };
}
export interface RequestData {
    serviceName: string;
    methodName: string;
    args: {
        [key: string]: ValueType;
    };
}
export declare const RequestDataSchema: Joi.ObjectSchema<any>;
//# sourceMappingURL=service-validator.d.ts.map