import { randomFillSync, randomUUID } from "crypto";

export function createCredential(userId: bigint): string {
    const buffer = Buffer.alloc(32);
    randomFillSync(buffer, 0, 32);
    return `${btoa(JSON.stringify({ typ: 'JWT', alg: 'HS256' }))}.${btoa(JSON.stringify({ credential: randomUUID(), userId: userId.toString() }))}.${buffer.toString('base64url')}`;
}

export function createSignature(userId: bigint): string {
    const buffer = Buffer.alloc(32);
    randomFillSync(buffer, 0, 32);
    return `${btoa(JSON.stringify({ typ: 'JWT', alg: 'HS256' }))}.${btoa(JSON.stringify({ userId: userId.toString() }))}.${buffer.toString('base64url')}`;
}