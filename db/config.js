require('dotenv').config();
const fs = require('fs');
const chalk = require('chalk');

// BOT & OWNER INFO
global.owner = (process.env.OWNER_NUMBERS || '6281224258870,6285871756001').split(',').map(n => n.trim());
global.nomerOwner = process.env.OWNER_PRIMARY || '6281224258870,6285871756001';
global.nomerBot = process.env.BOT_NUMBER || '6285166328091';
global.botName = process.env.BOT_NAME || 'Atlana';
global.ownerName = process.env.OWNER_NAME || 'Reyvan';
global.sessionName = 'session';
global.namaStore = process.env.STORE_NAME || 'AtlanticGate';

// PAYMENT GATEWAY
global.keyorkut = process.env.ORKUT_API_KEY || "753042817460416692404581OKCTDAAF6D7F4FF45EF977E8E23A46FD0165";
global.merchant = process.env.MERCHANT_ID || "OK2404581";
global.codeqr = process.env.QRIS_CODE || "00020101021126670016COM.NOBUBANK.WWW01189360050300000879140214130265043333880303UMI51440014ID.CO.QRIS.WWW0215ID20253994953110303UMI5204541153033605802ID5921ZALFA STORE OK24045816007CIANJUR61054321162070703A01630443E7";

// BOT MESSAGES
global.bot = process.env.BOT_STATUS_MESSAGE || "ON WOI";
global.min = process.env.ADMIN_TAG_MESSAGE || "tag aja etminnya kalo ngartis";

// ASSETS & LINKS
global.linkLOGO = process.env.LINK_LOGO || 'https://i.imgur.com/KkGFs3d.jpeg';
global.linkQRIS = process.env.LINK_QRIS || 'https://img1.pixhost.to/images/6509/611367557_pay.jpg';
global.linkGC = process.env.LINK_GROUP || 'https://chat.whatsapp.com/LtMNZXHdsjXJYPUcgWhINb';
global.poster1 = process.env.LINK_POSTER1 || 'https://i.imgur.com/9U3l7BE.jpeg';
global.linksl = process.env.LINK_SL || 'https://img1.pixhost.to/images/6052/604544698_slfinal.png';

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