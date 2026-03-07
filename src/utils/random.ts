import { randomInt } from "crypto";

export function generateUserId(): number | bigint {
    var str = '';
    for (let i = 0; i < 12; i++) {
        str += randomInt(10).toString();
    }
    return BigInt(str);
}