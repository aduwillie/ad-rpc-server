interface MethodMap {
    [key: string]: Function;
}
export interface MethodMapHandlerInterface {
    add: (key: string, callback: Function) => void;
    get: (key: string) => Function;
}
declare class MethodMapHandler implements MethodMapHandlerInterface {
    private map;
    constructor(map: MethodMap);
    add(key: string, callback: Function): void;
    get(key: string): Function;
}
export default MethodMapHandler;
