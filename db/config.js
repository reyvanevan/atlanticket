const fs = require('fs');
const chalk = require('chalk');

global.owner = ['6281224258870', '6289653544913'];
global.nomerOwner = '6281224258870';
global.nomerBot = '6285166328091';
global.botName = 'Atlana';
global.ownerName = 'Reyvan';
global.sessionName = 'session';
global.namaStore = 'AtlanticGate';

// PAYDISINI
global.APIKEY_PAYDISINI = 'kosong';
global.keyorkut = "753042817460416692404581OKCTDAAF6D7F4FF45EF977E8E23A46FD0165";
global.merchant = "OK2404581";
global.codeqr = "00020101021126670016COM.NOBUBANK.WWW01189360050300000879140214130265043333880303UMI51440014ID.CO.QRIS.WWW0215ID20253994953110303UMI5204541153033605802ID5921ZALFA STORE OK24045816007CIANJUR61054321162070703A01630443E7";
global.username = 'wakefiopR22W';
global.apiKey = 'a4b50385-36c2-55d8-a765-b69e89705cc1';

global.bot = "ON WOI";
global.min = `tag aja etminnya kalo ngartis`;

global.linkLOGO = 'https://i.imgur.com/KkGFs3d.jpeg';
global.linkQRIS = 'https://img1.pixhost.to/images/6509/611367557_pay.jpg';
global.linkGC = 'https://chat.whatsapp.com/LtMNZXHdsjXJYPUcgWhINb';
global.poster1 = 'https://i.imgur.com/9U3l7BE.jpeg';
global.linksl = 'https://img1.pixhost.to/images/6052/604544698_slfinal.png';

global.mess = {
  wait: "Loading...",
  owner: "Maaf kak, fitur ini khusus Owner",
  waitdata: "Melihat Data Terkini...",
  admin: "Fitur Khusus Admin Group!",
  group: "Fitur Khusus Group!",
  private: 'Silahkan menggunakan Fitur ini di Private Chat!',
  botAdmin: "Bot Harus Menjadi Admin Terlebih Dahulu!",
};

let file = require.resolve(__filename);
fs.watchFile(file, () => {
  fs.unwatchFile(file);
  console.log(chalk.yellowBright(`Update File Terbaru ${__filename}`));
  delete require.cache[file];
  require(file);
});