// Cek apakah format @lid adalah linked device
// Kemungkinan nomor asli harus diambil dari sumber lain

const testNumber = '161447921340608';

console.log(`\nAnalysis of: ${testNumber}`);
console.log(`Length: ${testNumber.length}`);
console.log(`First 2 chars: ${testNumber.substring(0, 2)}`);
console.log(`Last 10 chars: ${testNumber.substring(testNumber.length - 10)}`);

// Coba decode base32 atau format lain
const Buffer = require('buffer').Buffer;
console.log(`\nHex: ${Buffer.from(testNumber).toString('hex')}`);
console.log(`Base64: ${Buffer.from(testNumber).toString('base64')}`);

// Format Indonesia seharusnya 62XXXXXXXXXX (10-13 digit after 62)
// Jadi 628965354491 (12 digit) atau 6289653544913 (13 digit)
// 161447921340608 terlalu banyak digit (15 digit)

console.log(`\nMungkin nomor ini sudah corrupted atau encoding khusus dari WhatsApp`);
