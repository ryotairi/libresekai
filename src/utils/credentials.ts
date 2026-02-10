import { randomFillSync } from "crypto";

export function randomCredentialString(): string {
    const buffer = Buffer.alloc(32);
    randomFillSync(buffer, 0, 32);
    return buffer.toString('base64url');
}