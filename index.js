const {pack, unpack} = require('msgpackr');
const lz4 = require('lz4');

/**
 * @param {Buffer} input - Сжатые данные
 * @param {number} uncompressedSize - Размер после распаковки (обычно передается в заголовке пакета)
 */
function decompressSekai(input, uncompressedSize) {
    const output = Buffer.alloc(uncompressedSize);
    try {
        // Попытка распаковать как сырой блок (Block Decoder)
        const bytesRead = lz4.decodeBlock(input, output);
        return output.slice(0, bytesRead);
    } catch (e) {
        console.error("LZ4 Block decode failed, trying Frame decode...", e);
        try {
            // Попытка распаковать как стандартный файл/кадр
            return lz4.decode(input);
        } catch (e2) {
            console.error("All LZ4 attempts failed.");
            return null;
        }
    }
}

/**
 * @param {string} str
 * @returns {Buffer}
 */
function parseBuffer(str) {
    const arr = str.split(' ');
    return Buffer.from(arr.map(x => parseInt(x, 16)));
}

const buffer = parseBuffer(`E5 1E F2 53 F9 FC 9D 1E 41 58 54 8C C5 52 E1 9E F2 A8 E2 25 A1 A0 B1 FB 68 C2 29 57 8F 67 6D E8`);

console.log(unpack(lz4.decode(buffer)));