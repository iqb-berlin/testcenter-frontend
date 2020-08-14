export class Uuid {
    static create(parts: number = 4): string {
        // tslint:disable-next-line:no-bitwise
        return [...Array(parts).keys()].map(() => (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1)).join('-');
    }
}
