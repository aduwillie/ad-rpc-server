"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestDataSchema = exports.ServiceSchema = exports.MethodSchema = exports.ParamSchema = exports.ReturnInfoSchema = void 0;
const Joi = require("@hapi/joi");
const OBJECT_KEY_PATTERN = /^[a-z].*$/;
exports.ReturnInfoSchema = Joi.object({
    description: Joi.string().optional(),
    type: Joi.string().required(),
});
exports.ParamSchema = Joi.object({
    order: Joi.number().required(),
    description: Joi.string().optional(),
    type: Joi.string().valid("string", "number", "boolean", "object").required(),
    optional: Joi.boolean().optional(),
    defaultValue: Joi.when("type", {
        switch: [
            { is: "string", then: Joi.string().required() },
            { is: "number", then: Joi.number().required() },
            { is: "boolean", then: Joi.boolean().required() },
            { is: "object", then: Joi.object().required() },
        ],
        otherwise: Joi.any().optional(),
    }).optional(),
});
exports.MethodSchema = Joi.object({
    description: Joi.string().optional(),
    params: Joi.object().pattern(OBJECT_KEY_PATTERN, exports.ParamSchema),
});
exports.ServiceSchema = Joi.object({
    class: Joi.object().required(),
    methods: Joi.object().pattern(OBJECT_KEY_PATTERN, exports.MethodSchema),
});
exports.RequestDataSchema = Joi.object({
    serviceName: Joi.string().required(),
    methodName: Joi.string().required(),
    args: Joi.object().pattern(OBJECT_KEY_PATTERN, Joi.alternatives().try(Joi.string(), Joi.number(), Joi.boolean(), Joi.object()))
        .required(),
});
//# sourceMappingURL=service-validator.js.map