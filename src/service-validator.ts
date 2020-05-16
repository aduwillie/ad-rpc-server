import * as Joi from "@hapi/joi";

const OBJECT_KEY_PATTERN = /^[a-z].*$/;

export type ParamType = "string" | "number" | "boolean" | "object";
export type ValueType = string | number | boolean | object;

export interface ClassMethodType {
    (...args: ValueType[]): ValueType;
}

export type ServiceClass =  {
    [methodName: string]: ClassMethodType;
}

export interface ServiceClassConstructible {
    new(): ServiceClass;
}

export interface ServiceMethod {
    description?: string;
    params: {
        [paramName: string]: {
            order: number;
            description?: string;
            type: ParamType;
            optional: boolean;
            defaultValue: ValueType;
        };
    };
    returnInfo: {
        description?: string;
        type: ParamType;
    };
}


export interface ServiceInfo {
    class: ServiceClassConstructible;
    methods: {
        [methodName: string]: ServiceMethod;
    };
}

export interface ServiceDefintion {
    [serviceName: string]: ServiceInfo;
}

export const ReturnInfoSchema = Joi.object({
    description: Joi.string().optional(),
    type: Joi.string().required(),
});

export const ParamSchema = Joi.object({
    order: Joi.number().required(),
    description: Joi.string().optional(),
    type: Joi.string().valid("string", "number", "boolean", "object").required(),
    optional: Joi.boolean().optional(),
    defaultValue: Joi.when("type", {
        switch: [
            { is: "string", then: Joi.string().required() },
            { is: "number", then: Joi.number().required() },
            { is: "boolean", then: Joi.boolean().required() },
            { is: "object", then: Joi.object().required () },
        ],
        otherwise: Joi.any().optional(),
    }).optional(),
});

export const MethodSchema = Joi.object({
    description: Joi.string().optional(),
    params: Joi.object().pattern(OBJECT_KEY_PATTERN, ParamSchema),
});

export const ServiceSchema = Joi.object({
    class: Joi.object().required(),
    methods: Joi.object().pattern(OBJECT_KEY_PATTERN, MethodSchema),
});

export interface JsonResult {
    data: {
        type: ParamType;
        value: ValueType;
    };
}
