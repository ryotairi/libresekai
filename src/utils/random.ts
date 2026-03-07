import { randomInt } from "crypto";

export function generateUserId(): bigint {
    var str = '';
    for (let i = 0; i < 18; i++) {
        str += randomInt(10).toString();
    }
    return BigInt(str);
}
