interface MethodMap {
  [key: string]: Function;
}

export interface MethodMapHandlerInterface {
    add: (key: string, callback: Function) => void;
    get: (key: string) => Function;
}

class MethodMapHandler implements MethodMapHandlerInterface {
  constructor(private map: MethodMap){}

  add(key: string, callback: Function): void {
    this.map[key] = callback;
  }

  get(key: string): Function {
    return this.map[key];
  }
}

export default MethodMapHandler;
