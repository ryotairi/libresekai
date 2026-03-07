import { randomInt } from "crypto";

export function generateUserId(): number {
    var str = '';
    for (let i = 0; i < 14; i++) {
        str += randomInt(10).toString();
    }
    return parseInt(str);
}