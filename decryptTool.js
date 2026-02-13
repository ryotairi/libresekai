const { parseBuffer, decrypt } = require("./crypt");
const fs = require('fs');

// const data = parseBuffer(fs.readFileSync('data.txt', 'utf-8'));
const data = fs.readFileSync('data2.txt');

console.log(JSON.stringify(decrypt(data), false, '\t'));
