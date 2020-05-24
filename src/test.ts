import { Server } from "./server";
import { ServiceDefintion } from "./service-validator";

const add = (first: number, second: number): number => {
  console.log('Adding numbers: ', first, second); // eslint-disable-line no-console
  return first + second;
};

const serviceDefinition: ServiceDefintion = {
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

((): void => new Server({
  endpoint: '/messages',
  serviceDefinition,
  port: 3000,
  logLevel: 'debug',
})
  .addConsoleLogger('debug')
  .addFunction(add)
  .start())();
