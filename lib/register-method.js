"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class MethodMapHandler {
    constructor(map) {
        this.map = map;
    }
    add(key, callback) {
        this.map[key] = callback;
    }
    get(key) {
        return this.map[key];
    }
}
exports.default = MethodMapHandler;
//# sourceMappingURL=register-method.js.map