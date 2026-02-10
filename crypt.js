const crypto = require('crypto');
const { decode, encode } = require('@msgpack/msgpack');

const key = Buffer.from('df384214b29a3adfbf1bd9ee5b16f884', 'hex');
const iv = Buffer.from('7e856c907987f8aec6afc0c54738fc7e', 'hex');

function encrypt(json) {
    const msgpackBuffer = Buffer.from(encode(json));
    const algorithm = key.length === 32 ? 'aes-256-cbc' : 'aes-128-cbc';
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    
    cipher.setAutoPadding(true);
    
    return Buffer.concat([
        cipher.update(msgpackBuffer),
        cipher.final()
    ]);
}

function decrypt(buffer) {
    const algorithm = key.length === 32 ? 'aes-256-cbc' : 'aes-128-cbc';
    const decipher = crypto.createDecipheriv(algorithm, key, iv);

    decipher.setAutoPadding(true);
    
    const decrypted = Buffer.concat([
        decipher.update(buffer),
        decipher.final()
    ]);

    return decode(decrypted);
}

function parseBuffer(str) {
    return Buffer.from(str.trim().split(/\s+/).map(x => parseInt(x, 16)));
}

module.exports = {
    encrypt,
    decrypt,
    parseBuffer
};