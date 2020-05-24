"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const server_1 = require("./server");
const add = (first, second) => {
    console.log('Adding numbers: ', first, second);
    return first + second;
};
const serviceDefinition = {
    arithmethic: {
        methods: {
            add: {
                description: 'Adds 2 numbers and return their sum',
                params: {
                    first: {
                        type: 'number',
                        order: 1,
                    },
                    second: {
                        type: 'number',
                        order: 2,
                    },
                },
                returnInfo: {
                    type: 'number'
                }
            }
        },
    },
};
(() => new server_1.Server({
    endpoint: '/messages',
    serviceDefinition,
    port: 3000,
    logLevel: 'debug',
})
    .addConsoleLogger('debug')
    .addFunction(add)
    .start())();
//# sourceMappingURL=test.js.map