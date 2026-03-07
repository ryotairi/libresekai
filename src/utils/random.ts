import { randomInt } from "crypto";

export function generateUserId(): number {
    var str = '';
    for (let i = 0; i < 18; i++) {
        str += randomInt(10).toString();
    }
    return parseInt(str);
}