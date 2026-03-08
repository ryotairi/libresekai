import crypto from 'crypto';
import { decode, encode } from 'algorand-msgpack';

const key = Buffer.from('df384214b29a3adfbf1bd9ee5b16f884', 'hex');
const iv = Buffer.from('7e856c907987f8aec6afc0c54738fc7e', 'hex');

function PKCS7_pad(data: Buffer, bs: number): Buffer {
    const size = bs - (data.length % bs);
    const padding = Buffer.alloc(size, size);
    return Buffer.concat([data, padding]);
}

function PKCS7_unpad(data: Buffer, bs: number): Buffer {
    const pad = data[data.length - 1];
    return data.subarray(0, data.length - pad);
}

function encrypt(json: any) {
    const msgpackBuffer = Buffer.from(encode(json, {
        forceFloat32: true,
        sortKeys: true,
        forceBigIntToInt64: true,
    }));
    const algorithm = key.length === 32 ? 'aes-256-cbc' : 'aes-128-cbc';
    const cipher = crypto.createCipheriv(algorithm, key, iv);

    cipher.setAutoPadding(false);

    const padded = PKCS7_pad(msgpackBuffer, 16);
    return Buffer.concat([
        cipher.update(padded),
        cipher.final()
    ]);
}

function decrypt(buffer: Buffer) {
    const algorithm = key.length === 32 ? 'aes-256-cbc' : 'aes-128-cbc';
    const decipher = crypto.createDecipheriv(algorithm, key, iv);

    decipher.setAutoPadding(false);

    const decrypted = Buffer.concat([
        decipher.update(buffer),
        decipher.final()
    ]);

    const unpadded = PKCS7_unpad(decrypted, 16);
    return decode(unpadded);
}

function parseBuffer(str: string) {
    return Buffer.from(str.trim().split(/\s+/).map(x => parseInt(x, 16)));
}

export {
    PKCS7_pad,
    PKCS7_unpad,
    encrypt,
    decrypt,
    parseBuffer
};
