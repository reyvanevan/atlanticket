require('./db/config')
let autoGetLayanan = false;
let intervalId;
let antilinkEnabled = false;

const { BufferJSON, WA_DEFAULT_EPHEMERAL, makeWASocket, useMultiFileAuthState, getAggregateVotesInPollMessage, generateWAMessageFromContent, proto, generateWAMessageContent, generateWAMessage, prepareWAMessageMedia, downloadContentFromMessage, areJidsSameUser, getContentType } = require("@whiskeysockets/baileys")
const fs = require('fs')
const pino = require('pino')
const pushname = m.pushName || "No Name"
let defaultMarkupPercentage = 0.01; 
const { firefox } = require('playwright');
const { handleManualCleanup, handleCheckAllPending, handleDailyReport } = require('./scheduler');
const { handleOrderCompleteCommand } = require('./ordercomplete_handler');

const admin = require('firebase-admin');
const serviceAccount = require('./db/serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://your-project-id.firebaseio.com',
  });
}

//const admin = require('firebase-admin');
//const serviceAccount = require('./db/serviceAccountKey.json');
//admin.initializeApp({
  //credential: admin.credential.cert(serviceAccount),
  //databaseURL: 'https://your-project-id.firebaseio.com',
// });
//=========== DATABASE ===========//
try {
    // Pastikan global.db sudah ada
    if (!global.db) {
        global.db = {};
    }

    // Fungsi utilitas untuk memeriksa apakah nilai adalah angka
    let isNumber = x => typeof x === 'number' && !isNaN(x);

    // Inisialisasi database pengguna
    let user = global.db.users?.[m.sender];
    if (typeof user !== 'object') {
        global.db.users = global.db.users || {}; // Pastikan users sudah ada
        global.db.users[m.sender] = {};
    }

    // Isi data pengguna dengan default jika belum ada
    let userData = global.db.users[m.sender];
    if (userData) {
        if (!('daftar' in userData)) userData.daftar = false; // Status pendaftaran
        if (!('nama' in userData)) userData.nama = `${pushname}`; // Nama pengguna
        if (!('saldo' in userData)) userData.saldo = 0; // Default saldo awal
        if (!('level' in userData)) userData.level = 'member'; // Default level adalah member
        if (!('transaksi' in userData)) userData.transaksi = null; // Tidak ada transaksi aktif
        if (!('history' in userData)) userData.history = []; // Riwayat transaksi kosong
        if (!('purchases' in userData)) userData.purchases = []; // Riwayat pembelian kosong
    } else {
        global.db.users[m.sender] = {
            daftar: false,
            nama: `${pushname}`,
            saldo: 0, // Default saldo awal
            level: 'member',
            transaksi: null,
            history: [],
            purchases: []
        };
    }
} catch (err) {
    console.error("Error saat menginisialisasi database:", err);
}
const antilink = JSON.parse(fs.readFileSync('./src/antilink.json'));
const md5 = require('md5');
const isCreator = [nomerBot, ...global.owner].map(v => v.replace(/[^0-9]/g, '') + '@s.whatsapp.net').includes(m.sender)
const firestore = admin.firestore();
const path = require('path');
const util = require('util')
const chalk = require('chalk')
const os = require('os')
const axios = require('axios')
const fsx = require('fs-extra')
const crypto = require('crypto')
const moment = require('moment-timezone')
const { color, bgcolor } = require('./lib/color')

const jsonFilePath = './db/custom_commands.json';
const botgroupFile = './db/botgroup.json';
const configPath = './db/groupConfig.json';
const { exec, spawn, execSync } = require("child_process")
const { smsg, tanggal, getTime, isUrl, sleep, clockString, runtime, fetchJson, getBuffer, jsonformat, format, parseMention, getRandom, getGroupAdmins, generateUniqueRefID, connect } = require('./lib/myfunc')

//const mlbbHelpers = require('./lib/mlbb-helpers');
// Kemudian gunakan fungsi-fungsinya
//const { getMLBBAccount, updateMLBBAccountStatus, findAvailableAccount } = mlbbHelpers;

module.exports = client = async (client, m, chatUpdate, store, db_respon_list) => {
  try {
      // Parsing normal message types
      const chath = (m.mtype === 'conversation' && m.message.conversation) ? m.message.conversation 
      : (m.mtype == 'imageMessage') && m.message.imageMessage.caption ? m.message.imageMessage.caption 
      : (m.mtype == 'documentMessage') && m.message.documentMessage.caption ? m.message.documentMessage.caption 
      : (m.mtype == 'videoMessage') && m.message.videoMessage.caption ? m.message.videoMessage.caption 
      : (m.mtype == 'extendedTextMessage') && m.message.extendedTextMessage.text ? m.message.extendedTextMessage.text 
      : (m.mtype == 'buttonsResponseMessage' && m.message.buttonsResponseMessage.selectedButtonId) ? m.message.buttonsResponseMessage.selectedButtonId 
      : (m.mtype == 'templateButtonReplyMessage') && m.message.templateButtonReplyMessage.selectedId ? m.message.templateButtonReplyMessage.selectedId 
      : (m.mtype == "listResponseMessage") ? m.message.listResponseMessage.singleSelectReply.selectedRowId 
      : (m.mtype == "nativeFlowResponseMessage") ? m.message.nativeFlowResponseMessage.selectedRowId
      : (m.mtype === 'messageContextInfo') ? (m.message.listResponseMessage?.singleSelectReply.selectedRowId || m.text) : ''
      
      // Tambahan parsing untuk nativeFlow
      const nativeFlowId = m.mtype === 'buttonsResponseMessage' && 
                         m.message.buttonsResponseMessage.nativeFlowResponseMessage ? 
                         JSON.parse(m.message.buttonsResponseMessage.nativeFlowResponseMessage.paramsJson).id : ''

      var body = (m.mtype === 'conversation') ? m.message.conversation 
      : (m.mtype == 'imageMessage') ? m.message.imageMessage.caption 
      : (m.mtype == 'videoMessage') ? m.message.videoMessage.caption 
      : (m.mtype == 'extendedTextMessage') ? m.message.extendedTextMessage.text 
      : (m.mtype === 'messageContextInfo') ? (m.text) : ''
      var budy = (typeof m.text == 'string' ? m.text : '')
      
      // Handler untuk buttonsResponseMessage
      if (m.mtype == 'buttonsResponseMessage') {
          const buttonId = m.message.buttonsResponseMessage.selectedButtonId;
          console.log("Button clicked:", buttonId);
          
          if (buttonId && buttonId.startsWith('confirm_order_')) {
              const token = buttonId.split('confirm_order_')[1];
              // Override command dan args untuk diproses di switch case
              budy = ".confirm_order " + token;
              body = ".confirm_order " + token;
              command = "confirm_order";
              args = [token];
              text = token;
              isCmd = true;
          } 
          else if (buttonId && buttonId.startsWith('cancel_order_')) {
              const token = buttonId.split('cancel_order_')[1];
              budy = ".cancel_order " + token;
              body = ".cancel_order " + token;
              command = "cancel_order";
              args = [token];
              text = token;
              isCmd = true;
          }
      }
      
      // Handler untuk nativeFlowResponseMessage
      if (m.mtype === 'nativeFlowResponseMessage' || nativeFlowId) {
          const flowId = m.mtype === 'nativeFlowResponseMessage' ? 
                        m.message.nativeFlowResponseMessage.selectedRowId : 
                        nativeFlowId;
          
          console.log("NativeFlow response:", flowId);
          
          if (flowId && flowId.startsWith('.')) {
              // Override command untuk diproses di switch case
              budy = flowId;
              body = flowId;
              command = flowId.slice(1); // Hapus titik di awal
              args = [];
              text = "";
              isCmd = true;
          }
      }
      var prefix = "."
    const hariini = moment.tz('Asia/Jakarta').locale('id').format('dddd,DD MMMM YYYY');
    const productData = './db/datadigi.json';
      const productData2 = './db/dataevilbee.json';
    const db = admin.firestore();
    const pathUser = './db/user_down.json'
    const afk = require('./lib/afk');
    const _afk = JSON.parse(fs.readFileSync('./db/afk.json'));
      const ms = require('parse-ms');
      const fetch = require('node-fetch');
      const { createCanvas, loadImage } = require("canvas");
      const { prepareWAMessageMedia } = require('@whiskeysockets/baileys');
      const moment2 = require('moment-timezone');
      const QRCode = require('qrcode');
    let localUserData = [];
if (fs.existsSync(pathUser)) {
  const rawData = fs.readFileSync(pathUser, 'utf8');
  localUserData = JSON.parse(rawData);
}
      
//  const isCmd = body.startsWith(prefix)
      const isCmd = (body || '').startsWith(prefix)

    const cleanBody = typeof body === 'string' ? body : ''
const command = cleanBody.replace(prefix, '').trim().split(/ +/).shift().toLowerCase()
    //const args = body.trim().split(/ +/).slice(1)
    const args = (typeof body === 'string') ? body.trim().split(/ +/).slice(1) : [];
    const pushname = m.pushName || "No Name"
    const text = q = args.join(" ")
    const { type, quotedMsg, mentioned, now, fromMe } = m
    const quoted = m.quoted ? m.quoted : m
    const mime = (quoted.msg || quoted).mimetype || ''
    const from = mek.key.remoteJid
    const botNumber = await client.decodeJid(client.user.id)
    const isOwner = [botNumber, ...global.owner].map(v => v.replace(/[^0-9]/g, '') + '@s.whatsapp.net').includes(m.sender)
    const sender = m.isGroup ? (m.key.participant ? m.key.participant : m.participant) : m.key.remoteJid
    const groupMetadata = m.isGroup ? await client.groupMetadata(from).catch(e => {}) : ''
    const groupName = m.isGroup ? groupMetadata.subject : ''
    const participants = m.isGroup ? await groupMetadata.participants : ''
    const groupAdmins = m.isGroup ? await getGroupAdmins(participants) : ''
    const isBotAdmins = m.isGroup ? groupAdmins.includes(botNumber) : false
    const isAdmins = m.isGroup ? groupAdmins.includes(m.sender) : false
    const isGroup = m.key.remoteJid.endsWith('@g.us')
    const isAfkOn = afk.checkAfkUser(m.sender, _afk)
    const time = moment(Date.now()).tz('Asia/Jakarta').locale('id').format('HH:mm z')
    const harisekarang = moment.tz('Asia/Jakarta').format('DD MMMM YYYY')
    const time1 = moment().tz('Asia/Jakarta').format('HH:mm:ss');
    if (time1 < "23:59:00") {
      var ucapanWaktu1 = 'Malam'
    }
    if (time1 < "19:00:00") {
      var ucapanWaktu1 = 'Malam'
    }
    if (time1 < "18:00:00") {
      var ucapanWaktu1 = 'Sore'
    }
    if (time1 < "15:00:00") {
      var ucapanWaktu1 = 'Siang'
    }
    if (time1 < "10:00:00") {
      var ucapanWaktu1 = 'Pagi'
    }
    if (time1 < "05:00:00") {
      var ucapanWaktu1 = 'Pagi'
    }
    if (time1 < "03:00:00") {
      var ucapanWaktu1 = 'Malam'
    }
    const poster = fs.readFileSync('./lib/poster.jpg')
    const content = JSON.stringify(m.message)
   
    const fdocc = {
      key: {
        participant: '0@s.whatsapp.net',
        ...(m.chat ? {
          remoteJid: `status@broadcast`
        } : {})
      },
 
      message: {
        documentMessage: {
          title: `*Selamat ${ucapanWaktu1} ${pushname}*`,
          jpegThumbnail: m,
        }
      }
    }
    

// Fungsi helper - generate string acak untuk token
// Tambahkan ini jika belum ada di file Anda

// Fungsi helper - generate string acak untuk token
function generateRandomString(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}
      
// Order cache functions
function readOrderCache() {
    try {
        const data = fs.readFileSync('./db/order_cache.json', 'utf8');
        return JSON.parse(data);
    } catch (e) {
        return { orders: {} };
    }
}

function saveOrderCache(data) {
    try {
        fs.writeFileSync('./db/order_cache.json', JSON.stringify(data, null, 2), 'utf8');
    } catch (e) {
        console.error('Error saving order cache:', e);
    }
}
    
      
// Utility: pad angka jadi fixed width, misal 6 digit
function padCounter(n, width = 6) {
  return String(n).padStart(width, '0');
}      
function wrapText(text, maxLineLength) {
  const lines = [];
  while (text.length > maxLineLength) {
    let spaceIndex = text.lastIndexOf(" ", maxLineLength);
    if (spaceIndex === -1) {
      spaceIndex = maxLineLength; // Jika tidak ada spasi, potong pada batas maksimum
    }
    lines.push(text.substring(0, spaceIndex));
    text = text.substring(spaceIndex).trim(); // Hilangkan spasi yang tidak perlu
  }
  lines.push(text); // Tambahkan sisa teks
  return lines;
}
      function loadGroupConfig() {
  try {
    if (!fs.existsSync(configPath)) return {};
    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch (e) {
    console.error('âŒ Gagal load config grup:', e);
    return {};
  }
}

function saveGroupConfig(config) {
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  } catch (e) {
    console.error('âŒ Gagal simpan config grup:', e);
  }
}

function saveGroupConfig(config) {
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

async function generateInvoiceWithBackground(data, backgroundPath, logoPath = null) {
  const canvas = createCanvas(600, 400); // Ukuran canvas
  const ctx = canvas.getContext("2d");

  // Muat gambar latar belakang
  if (backgroundPath && fs.existsSync(backgroundPath)) {
    const backgroundImage = await loadImage(backgroundPath);
    ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height); // Gambar latar belakang
  } else {
    // Jika tidak ada gambar latar belakang, gunakan warna solid
    ctx.fillStyle = "#FFFFFF"; // Warna default
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

 // Tambahkan logo jika ada
  if (logoPath && fs.existsSync(logoPath)) {
    const logo = await loadImage(logoPath);

    const logoOriginalWidth = logo.width; // Lebar asli logo
    const logoOriginalHeight = logo.height; // Tinggi asli logo

    // Tentukan ukuran maksimal untuk logo
    const maxWidth = 100; // Lebar maksimum untuk logo
    const maxHeight = 100; // Tinggi maksimum untuk logo

    // Hitung skala untuk menjaga rasio aspek
    const widthRatio = maxWidth / logoOriginalWidth;
    const heightRatio = maxHeight / logoOriginalHeight;

    // Pilih skala yang lebih kecil untuk mempertahankan rasio
    const scale = Math.min(widthRatio, heightRatio);

    // Hitung ukuran baru berdasarkan skala
    const logoWidth = logoOriginalWidth * scale;
    const logoHeight = logoOriginalHeight * scale;

    // Gambar logo dengan ukuran proporsional
    ctx.drawImage(logo, 10, 10, logoWidth, logoHeight); // Tempatkan logo di sudut kiri atas
  }

  // Teks invoice dan detail lainnya
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 10px Arial";

  ctx.fillText(`${data.invoice}`, 259, 134); // Lokasi invoice
  ctx.fillText(`${data.product}`, 177, 188); // Produk
  ctx.fillText(`${data.tujuan}`, 177, 228); // Tujuan
  ctx.fillText(`${data.nickname}`, 177, 270); // Nickname
  ctx.fillText(`${data.waktu}`, 86, 134); // Waktu

  // Serial number (SN), dengan pembungkus teks
  ctx.fillStyle = "#FCD201";
  const snLines = wrapText(data.sn, 50); // Maksimal 40 karakter per baris
  let startY = 313; // Titik awal untuk teks SN
  const lineSpacing = 20; // Jarak antar baris untuk SN

  snLines.forEach((line, index) => {
    ctx.fillText(line, 177, startY + (index * lineSpacing)); // Tambahkan teks pada setiap baris
  });

  // Simpan gambar invoice ke direktori
  const outputPath = path.join(__dirname, "db/invoice/", `${data.invoice}.png`);
  const buffer = canvas.toBuffer("image/png");
  fs.writeFileSync(outputPath, buffer);

  return outputPath;
}


    
     async function downloadAndSaveMediaMessage (type_file, path_file) {
        	if (type_file === 'image') {
                var stream = await downloadContentFromMessage(m.message.imageMessage || m.message.extendedTextMessage?.contextInfo.quotedMessage.imageMessage, 'image')
                let buffer = Buffer.from([])
                for await(const chunk of stream) {
                	buffer = Buffer.concat([buffer, chunk])
                }
                fs.writeFileSync(path_file, buffer)
                return path_file
        	} else if (type_file === 'video') {
                var stream = await downloadContentFromMessage(m.message.videoMessage || m.message.extendedTextMessage?.contextInfo.quotedMessage.videoMessage, 'video')
                let buffer = Buffer.from([])
                for await(const chunk of stream) {
                	buffer = Buffer.concat([buffer, chunk])
                }
                fs.writeFileSync(path_file, buffer)
                return path_file
        	} else if (type_file === 'sticker') {
                var stream = await downloadContentFromMessage(m.message.stickerMessage || m.message.extendedTextMessage?.contextInfo.quotedMessage.stickerMessage, 'sticker')
                let buffer = Buffer.from([])
                for await(const chunk of stream) {
                	buffer = Buffer.concat([buffer, chunk])
                }
                fs.writeFileSync(path_file, buffer)
                return path_file
        	} else if (type_file === 'audio') {
                var stream = await downloadContentFromMessage(m.message.audioMessage || m.message.extendedTextMessage?.contextInfo.quotedMessage.audioMessage, 'audio')
                let buffer = Buffer.from([])
                for await(const chunk of stream) {
                	buffer = Buffer.concat([buffer, chunk])
                }
                fs.writeFileSync(path_file, buffer)
                return path_file
        	}
        }
      
    const sendContact = (jid, numbers, name, quoted, mn) => {
      let number = numbers.replace(/[^0-9]/g, '')
      const vcard = 'BEGIN:VCARD\n' +
        'VERSION:3.0\n' +
        'FN:' + name + '\n' +
        'ORG:;\n' +
        'TEL;type=CELL;type=VOICE;waid=' + number + ':+' + number + '\n' +
        'END:VCARD'
      return client.sendMessage(from, { contacts: { displayName: name, contacts: [{ vcard }] }, mentions: mn ? mn : [] }, { quoted: quoted })
    }
    const owned = `${global.nomerOwner}@s.whatsapp.net`
    const numberQuery = text.replace(new RegExp("[()+-/ +/]", "gi"), "") + "@s.whatsapp.net"
    const kiw = sender.split("@")[0]
    const isUser = pathUser.includes(m.kiw)
   const mentionByTag = (m && m.mtype === "extendedTextMessage" && m.message && m.message.extendedTextMessage && m.message.extendedTextMessage.contextInfo && m.message.extendedTextMessage.contextInfo.mentionedJid) ? m.message.extendedTextMessage.contextInfo.mentionedJid : [];
	
const Input = Array.isArray(mentionByTag) && mentionByTag.length > 0 ? mentionByTag[0] : (q ? numberQuery : false);
	
    if (!client.public) {
      if (!m.key.fromMe) return
    }
    if (m.message) {
      console.log(chalk.red(chalk.bgBlack('[ PESAN ] => ')), chalk.white(chalk.bgBlack(budy || m.mtype)) + '\n' + chalk.magenta('=> Dari'), chalk.green(pushname), chalk.yellow(m.sender.split("@")[0]) + '\n' + chalk.blueBright('=> Di'), chalk.green(m.isGroup ? pushname : 'Private Chat'), chalk.magenta(`\nJam :`) + time1)
    }

      function getOrderFormat(aliasKey) {
  if (!aliasKey) return '[KODE] [TUJUAN]';

  const key = aliasKey.toLowerCase();
  const info = aliasMap[key];
  if (!info) return '[KODE] [TUJUAN]';

  const brand = info.brand.toUpperCase();
  const category = info.category.toLowerCase();

  if (brand.includes('MOBILE LEGENDS')) {
    return '[KODE] [ID] [SERVER]';
  } else if (['pulsa', 'e-money', 'pln', 'masa aktif', 'paket sms & telpon'].includes(category)) {
    return '[KODE] [NOHP]';
  } else {
    return '[KODE] [ID]'; // Default format untuk game umum
  }
}

function getContoh(aliasKey) {
  const format = getOrderFormat(aliasKey);
  // Contoh dinamis
  if (format === '[KODE] [ID] [SERVER]') return 'QR ML5 972066397 12864';
  if (format === '[KODE] [ID]') return 'QR FF10 123456789';
  if (format === '[KODE] [NOHP]') return 'QR PTL5 085123456789';
  return '`QR KODE TUJUAN`'; // fallback default
}

/*
    function readCustomCommands() {
      try {
        const data = fs.readFileSync(jsonFilePath, 'utf8');
        return JSON.parse(data);
      } catch (error) {
        return {};
      }
    }
      
      function generateSignature(key, unique_code, service, amount, valid_time) {
    return md5(key + unique_code + service + amount + valid_time + 'NewTransaction');
}
    function saveCustomCommands(commands) {
      fs.writeFileSync(jsonFilePath, JSON.stringify(commands, null, 2), 'utf8');
    }
function addCustomCommand(groupID, command, response) {
      const customCommands = readCustomCommands();
      if (!customCommands[groupID]) {
        customCommands[groupID] = {};
      }
      customCommands[groupID][command] = response;
      saveCustomCommands(customCommands);
    }
*/

      // Antilink
const isAntiLink = isGroup ? antilink.includes(from) : false
if (isGroup && isAntiLink && !isOwner && !isAdmins && isBotAdmins){
            if (chath.includes(`https://chat.whatsapp.com`)) {
                await client.sendMessage(from, { delete: m.key })
                m.reply(`ðŸ›¡ *GROUP LINK DETECTOR* ðŸ›¡\n\nBudayakan baca Deskribsi grup ka, mari saling menghargai sesama seller`)
                let number = sender
client.groupParticipantsUpdate(from, [number], "remove")
            }
    }   
// Map untuk alias
const aliasMap = {
	// PRODUK GAMES
  "ml": { category: "Games", brand: "MOBILE LEGENDS", type: "Umum" },
  "wdp": { category: "Games", brand: "MOBILE LEGENDS", type: "Membership" },
  "dmganda": { category: "Games", brand: "MOBILE LEGENDS", type: "Indonesia" },
  "mlph": { category: "Games", brand: "MOBILE LEGENDS", type: "Filipina" },
  "mlsg": { category: "Games", brand: "MOBILE LEGENDS", type: "Singapore" },
  "mlbr": { category: "Games", brand: "MOBILE LEGENDS", type: "Brazil" },
  "mlmy": { category: "Games", brand: "MOBILE LEGENDS", type: "Malaysia" },
  "mlg": { category: "Games", brand: "MOBILE LEGENDS", type: "Global" },
  "mlru": { category: "Games", brand: "MOBILE LEGENDS", type: "Russia" },
  "lita": { category: "Games", brand: "Lita", type: "Umum" },
  "ff": { category: "Games", brand: "FREE FIRE", types: ["Umum", "Membership"] },
  "rbx": { category: "Voucher", brand: "Roblox", type: "Umum" },
  "pb": { category: "Games", brand: "POINT BLANK", type: "Umum" },
  "aov": { category: "Games", brand: "ARENA OF VALOR", type: "Umum" },
  "vl": { category: "Games", brand: "Valorant", type: "Umum" },
  "dr": { category: "Games", brand: "DRAGON RAJA - SEA", type: "Umum" },  
  "sm": { category: "Games", brand: "Sausage Man", type: "Umum" },  
  "giw": { category: "Games", brand: "Genshin Impact", type: "Membership" },
  "gi": { category: "Games", brand: "Genshin Impact", types: ["Umum", "Membership"] },
  "8bp": { category: "Games", brand: "8 Ball Pool", type: "Cash" },
  "lol": { category: "Games", brand: "League of Legends Wild Rift", type: "Umum" },
  "coc": { category: "Games", brand: "Clash of Clans", type: "Umum" },  
  "ss": { category: "Games", brand: "Super Sus", type: "Umum" },
  "tof": { category: "Games", brand: "Tower of Fantasy", type: "Umum" },
  //"hsr": { category: "Games", brand: "Honkai Star Rail", types: ["Umum", "Membership"] },
  "hsr": { category: "Games", brand: "Honkai Star Rail", types: ["Umum", "Membership"] },
  "udw": { category: "Games", brand: "Undawn", type: "Umum" },
  "zpt": { category: "Games", brand: "Zepeto", type: "Umum" },  
  "ab": { category: "Games", brand: "Arena Breakout", type: "Umum" },  
  "msa": { category: "Games", brand: "Metal Slug Awakening", type: "Umum" },
  "hok": { category: "Games", brand: "Honor of Kings", types: ["Umum", "Membership"] },
  "bs": { category: "Games", brand: "Blood Strike", type: "Umum" },
  "bcm": { category: "Games", brand: "Black Clover M", type: "Umum" },  
  "pgr": { category: "Games", brand: "Punishing Gray Raven", type: "Umum" },
  "pubg": { category: "Games", brand: "PUBG MOBILE", type: "Umum" },
 "pubgg": { category: "Games", brand: "PUBG MOBILE", type: "global" },
 "codm": { category: "Games", brand: "Call of Duty MOBILE", type: "Umum" },
 "mcgg": { category: "Games", brand: "Magic Chess", types: ["Umum", "Membership"] },
    
    // PRODUK PULSA
 "ptl": { category: "Pulsa", brand: "TELKOMSEL", type: "Umum" },
 "pis": { category: "Pulsa", brand: "INDOSAT", type: "Umum" },
 "pax": { category: "Pulsa", brand: "AXIS", type: "Umum" },
 "psm": { category: "Pulsa", brand: "SMARTFREN", type: "Umum" }, 
 "ptr": { category: "Pulsa", brand: "TRI", type: "Umum" },
 "pxl": { category: "Pulsa", brand: "XL", type: "Umum" }, 
 "pby": { category: "Pulsa", brand: "by.U", type: "Umum" },
   
 // PRODUK DATA
 "tld": { category: "Data", brand: "TELKOMSEL", types: ["Mini", "Cek Paket"] },
 "pid": { category: "Data", brand: "INDOSAT", types: ["Umum"] },
 "axd": { category: "Data", brand: "Axis", types: ["Mini", "Bronet", "Sulutra"] },
 "sfd": { category: "Data", brand: "SMARTFREN", types: ["Minii", "Nonstopi", "Unlimited Nonstopi", "Kuota"] },
 "trd": { category: "Data", brand: "TRI", types: ["AlwaysOn", "Happy"] },
 "xld": { category: "Data", brand: "XL", types: ["Mini", "Xtra Combo Flex"] },
    
 // PRODUK VOUCHER
 "vgp": { category: "Voucher", brand: "GOOGLE PLAY INDONESIA", type: "Umum" },
 "vgs": { category: "Voucher", brand: "GARENA", type: "Umum" },
 "vrz": { category: "Voucher", brand: "Razer Gold", type: "Umum" },
 "vst": { category: "Voucher", brand: "Steam Wallet (IDR)", type: "Umum" },
 "vup": { category: "Voucher", brand: "Unipin Voucher", type: "Umum" },
    
 // PRODUK E-MONEY
 "gpy": { category: "E-Money", brand: "GO PAY", type: "Customer" },
 "ovo": { category: "E-Money", brand: "OVO", type: "Umum" },
 "dna": { category: "E-Money", brand: "DANA", type: "Umum" },
 "spy": { category: "E-Money", brand: "SHOPEE PAY", type: "Umum" },
    
// PRODUK PLN
 "pln": { category: "PLN", brand: "PLN", type: "Umum" },    
   
// PRODUK TELPON & SMS
 "tlt": { category: "Paket SMS & Telpon", brand: "TELKOMSEL", types: ["Umum", "Telepon Pas"] },  
 "pid": { category: "Paket SMS & Telpon", brand: "INDOSAT", type: "Umum"},   
 "trt": { category: "Paket SMS & Telpon", brand: "TRI", type: "Umum" },  
 "axt": { category: "Paket SMS & Telpon", brand: "AXIS", types: ["Umum", "Mabrur"] },
 "xlt": { category: "Paket SMS & Telpon", brand: "XL", types: ["Umum", "Sesama", "Anynet"] },  

 // PRODUK MASA AKTIF
"mtl": { category: "Masa Aktif", brand: "TELKOMSEL", type: "Umum" }, 
"mis": { category: "Masa Aktif", brand: "INDOSAT", type: "Umum" },
"max": { category: "Masa Aktif", brand: "AXIS", type: "Umum" }, 
"mtr": { category: "Masa Aktif", brand: "TRI", type: "Umum" },
"mxl": { category: "Masa Aktif", brand: "XL", type: "Umum" },
  // Tambahkan alias lainnya jika diperlukan
};
  /*    
    function handleCustomCommands(groupID, command, reply) {
      const customCommands = readCustomCommands();
      if (customCommands[groupID]) {
        const customResponse = customCommands[groupID][command.toUpperCase()];
        if (customResponse) {
          m.reply(customResponse);
        }
      }
    }

   if (isGroup && !isCmd) {
  const groupID = from;
  const customCommand = (body || '').trim().toLowerCase();
  handleCustomCommands(groupID, customCommand, m.reply);
}
*/
 
// Fungsi retry untuk groupMetadata
const retry = async (fn, maxRetries = 3, delay = 2000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (e) {
      if (i === maxRetries - 1) throw e;
      console.log(`Retry ${i + 1}/${maxRetries} failed: ${e.message}`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};
      
// Fungsi utilitas untuk membaca database
function readDatabase() {
    try {
        const rawData = fs.readFileSync('database.json', 'utf8');
        return JSON.parse(rawData);
    } catch (err) {
        console.error("Error reading database:", err.message);
        return { issuerRefs: [] }; // Return default jika file tidak ada atau error
    }
}
      
// Fungsi utilitas untuk menyimpan database
function saveDatabase(db) {
    try {
        fs.writeFileSync('database.json', JSON.stringify(db, null, 2), 'utf8');
    } catch (err) {
        console.error("Error saving database:", err.message);
    }
}
/*
      function listCustomCommands(groupID, reply) {
      const customCommands = readCustomCommands();
      if (customCommands[groupID]) {
        const commands = Object.keys(customCommands[groupID]);
        if (commands.length > 0) {
          let responseText =
            `Ꮺ ָ࣪ ۰ 𝗁𝖾𝗅𝗅𝗈 𝖽𝖾𝖺𝗋 *${pushname}* ‹！𝗐𝖾𝗅𝖼𝗈𝗆𝖾 𖦆 𝗍𝗁𝗂𝗌 𝗂𝗌 𝗐𝗁𝖺𝗍 𝗐𝖾 𝗍𝗁𝖾 𝗉𝗋𝗈𝗏𝗂𝖽𝖾 ┈─ ꒱ 𝆬

᪤ ٠ 𝖽𝖺𝗍𝖾 ⦂ ${harisekarang}
᪤ ٠ 𝗍𝗂𝗆𝖾 ⦂ ${time}

╭───┈ \`𝖼𝖺𝗍𝖺𝗅𝗈𝗀𝗎𝖾\` 𝗈𝗇 𝗍𝗁𝖾 𝖻𝖾𝗅𝗈𝗐\n`;

          commands.forEach((command, index) => {

            responseText += `𑣿 ꒰ 🥧 ${command}\n`;

          });
                   responseText += `╰──━

*${namaStore}*
ⓘ 𝗺𝗶𝗻𝗶 𝗻𝗼𝘁𝗲 ⦂
⊹ 𝗄𝖾𝗍𝗂𝗄 𝗅𝗂𝗌𝗍 𝖽𝗂𝖺𝗍𝖺𝗌 𝗎𝗇𝗍𝗎𝗄 𝗆𝖾𝗅𝗂𝗁𝖺𝗍 𝗉𝗋𝗈𝖽𝗎𝗄`
          m.reply(responseText)
        } else {
          m.reply("Custom Command belum ditambah di group ini");
        }
      } else {
        m.reply("Custom Command belum ditambah di group ini");
      }
    }
*/
//FITUR AFK
if (m.isGroup && !m.key.fromMe) {
    let mentionUser = [...new Set([...(m.mentionedJid || []), ...(m.quoted ? [m.quoted.sender] : [])])]
    for (let ment of mentionUser) {
    if (afk.checkAfkUser(ment, _afk)) {
    let getId2 = afk.getAfkId(ment, _afk)
    let getReason2 = afk.getAfkReason(getId2, _afk)
    let getTimee = Date.now() - afk.getAfkTime(getId2, _afk)
    let heheh2 = ms(getTimee)
    m.reply(`Jangan tag dia bang, orangnya lagi afk.\n\n*Alasan :* ${getReason2}\n*Sejak :* ${heheh2.hours} jam, ${heheh2.minutes} menit, ${heheh2.seconds} detik yg lalu\n`)
    }
    }
	if (afk.checkAfkUser(m.sender, _afk)) {
    let getId = afk.getAfkId(m.sender, _afk)
    let getReason = afk.getAfkReason(getId, _afk)
    let getTime = Date.now() - afk.getAfkTime(getId, _afk)
    let heheh = ms(getTime)
    _afk.splice(afk.getAfkPosition(m.sender, _afk), 1)
    fs.writeFileSync('./db/afk.json', JSON.stringify(_afk))
    client.sendTextWithMentions(m.chat, `@${m.sender.split('@')[0]} telah kembali dari afk\n\n*Alasan :* ${getReason}\n*Selama :* ${heheh.hours} jam ${heheh.minutes} menit ${heheh.seconds} detik\n`, m)
    }
}

      // middleware semua command di private chat, kecuali admin/owner
     /*
      if (!m.isGroup && ! global.owner.includes(m.sender.split("@")[0])) {
          return;
      }
      */
      //  Middleware untuk blokir command berdasarkan config grup
const groupConfigs = loadGroupConfig();
if (m.isGroup && groupConfigs[m.chat] && groupConfigs[m.chat].lockedCommands?.includes(command.toLowerCase())) {
  return ;
    //m.reply(`‼️ Command *${command}* sedang dinonaktifkan di grup ini.\n_Silahkan hubungi *Owner* untuk meminta group khusus Topup Otomatis_`);
}
      m.body = m.body || ''
      
    switch (command) {
  		
            case 'setcmd': {
  if (!m.isGroup) return m.reply('‼️ Hanya bisa digunakan dalam grup.');
  if (!isAdmins) return m.reply('‼️ Hanya admin grup yang bisa mengatur command.');

  const [cmdName, status] = args;
  if (!cmdName || !status) return m.reply('Format: *setcmd [namaCommand] [on/off]*');

  const groupConfigs = loadGroupConfig();
  const groupSetting = groupConfigs[m.chat] || { lockedCommands: [], allowedCommands: [] };

  const cmd = cmdName.toLowerCase();
  const mode = status.toLowerCase();

  if (mode === 'off') {
    if (!groupSetting.lockedCommands.includes(cmd)) {
      groupSetting.lockedCommands.push(cmd);
    }
    groupSetting.allowedCommands = groupSetting.allowedCommands.filter(c => c !== cmd);
  } else if (mode === 'on') {
    if (!groupSetting.allowedCommands.includes(cmd)) {
      groupSetting.allowedCommands.push(cmd);
    }
    groupSetting.lockedCommands = groupSetting.lockedCommands.filter(c => c !== cmd);
  } else {
    return m.reply('‼️ Status hanya bisa "on" atau "off".');
  }

  groupConfigs[m.chat] = groupSetting;
  saveGroupConfig(groupConfigs);

  return m.reply(`✅ Command *${cmd}* telah di *${mode.toUpperCase()}* kan untuk grup ini.`);
}

            case 'listcmd': {
  const groupConfigs = loadGroupConfig();
  const groupSetting = groupConfigs[m.chat] || {};
  const locked = groupSetting.lockedCommands || [];
  const allowed = groupSetting.allowedCommands || [];

  return m.reply(
    `📝 *Status Command Grup*\n\n` +
    `🔒 *Terkunci* : ${locked.length ? locked.join(', ') : 'Tidak ada'}\n`
      
  );
}


      case 'help': {
         
        const capt =
          `╭─ ꒰  *${namaStore}*  ꒱ ─ ʚɞ⸼─╮ 

ⓘ 𝗆𝖾𝗅𝖺𝗒𝖺𝗇𝗂 𝗄𝖾𝖻𝗎𝗍𝗎𝗁𝖺𝗇 𝗍𝗈𝗉 𝗎𝗉 𝖺𝗅𝗅 𝗀𝖺𝗆𝖾
𝖽𝖾𝗇𝗀𝖺𝗇 𝗉𝖾𝗅𝖺𝗒𝖺𝗇𝖺𝗇 𝗒𝖺𝗇𝗀 𝗆𝖾𝗇𝗀𝗀𝖾𝗆𝖺𝗌𝗄𝖺𝗇

─── • ┈ ┈ ୨♡୧  ┈ ┈ • ───

ꕮ ࣪ ׅ  *Bot Name* : ${global.botName}
ꕮ ࣪ ׅ  *Owner Name* : ${global.ownerName}

╭─ ꒰ *menu utama* ꒱ ─ ʚɞ⸼─╮ 
│☍ ࣪ ׅ  *produk*
│☍ ࣪ ׅ  *list*
│☍ ࣪ ׅ  *order*
│☍ ࣪ ׅ  *tpo*
│☍ ࣪ ׅ  *bukti*
│☍ ࣪ ׅ  *profile*
│☍ ࣪ ׅ  *riwayat*
│☍ ࣪ ׅ  *cek*
│☍ ࣪ ׅ  *rank*
│☍ ࣪ ׅ  *owner*
│☍ ࣪ ׅ  *cekml*
│☍ ࣪ ׅ  *mlreg*
│☍ ࣪ ׅ  *cekff*
│☍ ࣪ ׅ  *cekpln*
╰── ʚɞ  ⸼────────────╯

╭─ ꒰ *menu owner* ꒱ ─ ʚɞ⸼─╮ 
│☍ ࣪ ׅ  *addsaldo*
│☍ ࣪ ׅ  *kurangsaldo*
│☍ ࣪ ׅ  *accdepo*
│☍ ࣪ ׅ  *ubahrole*
│☍ ࣪ ׅ  *daftarmember*
│☍ ࣪ ׅ  *dashboard*
│☍ ࣪ ׅ  *getlayanan*
│☍ ࣪ ׅ  *profit*
│☍ ࣪ ׅ  *delinv*
╰── ʚɞ  ⸼────────────╯

╭─ ꒰ *menu group* ꒱ ─ ʚɞ⸼─╮ 
│☍ ࣪ ׅ  *proses*
│☍ ࣪ ׅ  *done*
│☍ ࣪ ׅ  *linkgc*
│☍ ࣪ ׅ  *hidetag*
│☍ ࣪ ׅ  *open*
│☍ ࣪ ׅ  *close*
│☍ ࣪ ׅ  *join*
│☍ ࣪ ׅ  *kick*
│☍ ࣪ ׅ  *antilink*
│☍ ࣪ ׅ  *mlreg*
╰── ʚɞ  ⸼────────────╯`
        client.sendMessage(m.chat, {
          text: capt,
          contextInfo: {
            externalAdReply: {
              title: `${global.botName}`,
              thumbnailUrl: `${poster1}`,
              sourceUrl: `${linkGC}`,
              mediaType: 1,
              renderLargerThumbnail: true
            }
          }
        }, )
      }
      break
         
          case 'produk':
case 'lpo': {
  const response = `
┏━━『 *❄️ Atlantic Gate ❄️* 』━◧
┣» *‼️ LAYANAN OTOMATIS ‼️*
┣» _Silahkan Ketik *GET* Sebelum Kode Produk_
   » Contoh : *GET ML*

┣» [ MENU GAME ]
┃🔮 *GET ML*    [ ML INDO ]
┃🔮 *GET DMGANDA*    [ INDO ]
┃🔮 *GET WDP*    [ WDP INDO ]
┃🔮 *GET MLBR*    [ ML BRAZIL ]
┃🔮 *GET MLMY*    [ ML MALAYSIA ]
┃🔮 *GET MLPH*    [ ML FILIPINA ]
┃🔮 *GET MLSG*    [ ML SINGAPURA ]
┃🔮 *GET MLG*   [ ML GLOBAL ]
┃🔮 *GET MLRU*    [ ML RUSIA ]
┃🔮 *GET PUBG*    [ PUBG ]
┃🔮 *GET PUBGG*    [ PUBG GLOBAL ]
┃🔮 *GET GI*    [ GENSHIN IMPACT ]
┃🔮 *GET FF*   [ FREE FIRE ]
┃🔮 *GET HOK*    [ HONOR OF KINGS ]
┃🔮 *GET CODM*    [ CALL OF DUTY ]
┃🔮 *GET AOV*    [ ARENA OF VALOR ]
┃🔮 *GET MCGG*    [ MAGIC CHESS ]
┃🔮 *GET HSR*    [ HONKAI STAR RAIL ]
┃🔮 *GET PB*    [ POINT BLANK ]
┃🔮 *GET RBX*    [ VOUCHER ROBLOX ]
┃🔮 *GET VL*    [ VALORANT ID ]

┣» [ PULSA REGULER ]
┃🔮 *GET PTL*    [ PULSA TSEL ]
┃🔮 *GET PIS*    [ PULSA INDOSAT ]
┃🔮 *GET PAX*    [ PULSA AXIS ]
┃🔮 *GET PSM*    [ PULSA SMARTFREN ]
┃🔮 *GET PTR*    [ PULSA TRI ]
┃🔮 *GET PXL*    [ PULSA XL ]
┃🔮 *GET PBY*    [ PULSA by.U ]

┣» [ TOKEN LISTRIK ]
┃🔮 *GET PLN*    [ TOKEN LISTRIK ]

┣» [ TOPUP E MONEY ]
┃🔮 *GET DNA*    [ DANA ]
┃🔮 *GET GPY*    [ GOPAY ]
┃🔮 *GET OVO*    [ OVO ]
┃🔮 *GET SPY*    [ SHOPEE PAY ]

—

Gunakan perintah *get* diikuti kode produk untuk melihat detail harga dan cara order.  
Selalu pastikan ID dan tujuan benar sebelum melakukan transaksi.

🛡️ *AtlanticGate – Solusi Topup Otomatis Aman & Cepat*`
  client.sendMessage(m.chat, {
          text: response,
          contextInfo: {
            externalAdReply: {
              title: `${global.botName}`,
              thumbnailUrl: `${poster1}`,
              sourceUrl: `${linkGC}`,
              mediaType: 1,
              renderLargerThumbnail: true
            }
          }
        }, )
      }
      break
            
      case 'lpm':
         case 'list':
        case 'lml':
           // case 'ml':
            {
  const response = `┏━━『 *❄️ Atlantic Gate ❄️* 』━◧
┣» *‼️ LAYANAN MANUAL ‼️*
┣» _Silahkan Ketik List yang Tersedia_
   » Contoh : *SL*

┣» [ *BEST SELLER* ]
┃🔥 *SL*        [ STARLIGHT ]
┃🔥 *VILOG* [ VIA LOGIN ]
┃🔥 *PO*       [ WDP & DM ]
┃🔥 *GIFT*    [ ML GIFT ]
┃🔥 *JOKI*    [ ML JOKI ]

┣» [ *APK PREM* ]
┃🔥 *NETFLIX*        [ IYA NETFLIX ]
┃🔥 *CAPCUT*        [ IYA CAPCUT ]
┃🔥 *AM*        [ ALIGHT MOTION ]
  
*AtlanticGate*`
  client.sendMessage(m.chat, {
          text: response,
          contextInfo: {
            externalAdReply: {
              title: `${global.botName}`,
              thumbnailUrl: `${poster1}`,
              sourceUrl: `${linkGC}`,
              mediaType: 1,
              renderLargerThumbnail: true
            }
          }
        }, )
      }
      break
            
            case 'gift' :           
case 'gift': 
            {
    // Langsung mengembalikan respons format yang diinginkan
    const response =`ׅ       ִ     ׄ   ⋰  ⋱      ⋯     ⋰  ⋱   ׄ    ׅ
                    ꒰ \`𝗴𝗶𝗳𝘁 𝘀𝗵𝗼𝗽\` ꒱
      ┈─۟─┈─ִ──ׄ┈ ꒱꒰̸ ┈ׄ──ִ─┈─۫─┈
          ֺ  ֪💎 𝟤𝟥𝟫    ⸼ 𝖱𝗉 𝟥𝟣.𝟢𝟢𝟢 ׄ ⚭ ִ 
          ֺ  ֪💎 𝟤𝟨𝟫    ⸼ 𝖱𝗉 𝟥𝟧.𝟢𝟢𝟢 ׄ ⚭ ִ 
          ֺ  ֪💎 𝟥𝟫𝟫    ⸼ 𝖱𝗉 𝟧𝟤.𝟢𝟢𝟢 ׄ ⚭ ִ           
          ֺֺ  ֪💎 𝟧𝟫𝟫    ⸼ 𝖱𝗉 𝟩𝟪.𝟢𝟢𝟢 ׄ ⚭ ִ 
          ֺ  ֪💎 𝟩𝟦𝟫    ⸼ 𝖱𝗉 𝟫𝟩.𝟧𝟢𝟢 ׄ ⚭ ִ
          ֺ  ֪💎 𝟪𝟫𝟫    ⸼ 𝖱𝗉 𝟣𝟣𝟩.𝟢𝟢𝟢 ׄ ⚭ ִ
          ֺ  ֪💎 𝟣𝟢𝟪𝟫  ⸼ 𝖱𝗉 𝟣𝟦𝟤.𝟢𝟢𝟢 ׄ ⚭ ִ
       ┈─۟─┈─ִ──ׄ┈ ꒱꒰̸ ┈ׄ──ִ─┈─۫─┈
> 𝗏𝗂𝖺 𝗀𝗂𝖿𝗍 𝖽𝖾𝗅𝖺𝗒 8𝗁
> 𝗍𝖾𝗅𝖺𝗍 𝖺𝖼𝖼/𝗎𝗇𝖿𝗈𝗅𝗅 𝖣𝖤𝖭𝖣𝖠
> 𝖼𝗇 𝗐𝖺𝗃𝗂𝖻 𝗄𝗈𝗇𝖿𝗂𝗋
> 𝖼𝖺𝗇𝖼𝖾𝗅 𝗋𝖾𝖿𝖿 𝗁𝖺𝗇𝗒𝖺 𝟩𝟧%
> 𝗋𝖾𝗌𝖾𝗅𝗅𝖾𝗋 𝗋𝖺𝗍𝖾: 𝟣𝟤𝟢/💎

                    ꒰ \`𝖼𝗁𝖺𝗋𝗂𝗌𝗆𝖺𝖺\` ꒱
       ┈─۟─┈─ִ──ׄ┈ ꒱꒰̸ ┈ׄ──ִ─┈─۫─┈
          ֺ  ֪💎 𝟪      ⸼ 𝖱𝗉 𝟣.𝟤𝟢𝟢 ׄ ⚭ ִ 
          ֺ  ֪💎 𝟤𝟢    ⸼ 𝖱𝗉 𝟤.𝟧𝟢𝟢 ׄ ⚭ ִ  
          ֺ  ֪💎 𝟦𝟫𝟫  ⸼ 𝖱𝗉 𝟨𝟧.𝟢𝟢𝟢 ׄ ⚭ ִ 
          ֺ  ֪💎 𝟫𝟫𝟫  ⸼ 𝖱𝗉 𝟣𝟤𝟧.𝟢𝟢𝟢 ׄ ⚭ ִ
       ┈─۟─┈─ִ──ׄ┈ ꒱꒰̸ ┈ׄ──ִ─┈─۫─┈
> 𝗉𝗋𝗈𝗌𝖾𝗌 1-30 𝗆𝖾𝗇𝗂𝗍
> 𝗍𝖾𝗋𝗀𝖺𝗇𝗍𝗎𝗇𝗀 𝗄𝖾𝗌𝗂𝖻𝗎𝗄𝖺𝗇 𝖺𝖽𝗆𝗂𝗇
> 𝗋𝖾𝗌𝖾𝗅𝗅𝖾𝗋 𝗋𝖺𝗍𝖾: 𝟣𝟤𝟢/💎`;

    // Mengirimkan respons
    m.reply(response);
    return;
}
            case 'po' :           
//case 'gift': 
            {
    // Langsung mengembalikan respons format yang diinginkan
    const response =`ׅ       ִ     ׄ   ⋰  ⋱      ⋯     ⋰  ⋱   ׄ    ׅ
       ┈─۟─┈─ִ──ׄ┈ ꒱꒰̸ ┈ׄ──ִ─┈─۫─┈
                    ꒰ \`𝗽𝗼 𝘄𝗱𝗽\` ꒱
     ┄۪ 𐚁 𝖱𝗉 𝟤𝟦.𝟢𝟢𝟢 ─۫┄۪╌۫ _𝗆𝖾𝗆𝖻𝖾𝗋_ 
     ┄۪ 𐚁 𝖱𝗉 𝟤𝟤.𝟧𝟢𝟢 ─۫┄۪╌۫ _𝗋𝖾𝗌𝗌_

                   ꒰ \`𝗽𝗼 𝟤𝟫𝟧\`💎 ꒱
     ┄۪ 𐚁 𝖱𝗉 𝟨𝟫.𝟢𝟢𝟢 ─۫┄۪╌۫ _𝗆𝖾𝗆𝖻𝖾𝗋_ 
     ┄۪ 𐚁 𝖱𝗉 𝟨𝟧.𝟢𝟢𝟢 ─۫┄۪╌۫ _𝗋𝖾𝗌𝗌_

                   ꒰ \`𝗽𝗼 𝟣𝟢𝟢𝟢\`💎 ꒱
     ┄۪ 𐚁 𝖱𝗉 𝟤𝟤𝟢.𝟢𝟢𝟢 ─۫┄۪╌۫ _𝗆𝖾𝗆𝖻𝖾𝗋_ 
     ┄۪ 𐚁 𝖱𝗉 𝟤𝟣𝟢.𝟢𝟢𝟢 ─۫┄۪╌۫ _𝗋𝖾𝗌𝗌_
       ┈─۟─┈─ִ──ׄ┈ ꒱꒰̸ ┈ׄ──ִ─┈─۫─┈

> 𝗄𝗁𝗎𝗌𝗎𝗌 𝗋𝖾𝗀𝗂𝗈𝗇 𝗂𝗇𝖽𝗈!
> 𝗁𝖺𝗋𝗀𝖺 𝖻𝗂𝗌𝖺 𝗇𝖺𝗂𝗄 𝗍𝗎𝗋𝗎𝗇
> 𝗌𝖾𝗆𝗎𝖺 𝗂𝗍𝖾𝗆 𝖽𝗂𝖺𝗍𝖺𝗌 𝖾𝗌𝗍𝗂𝗆𝖺𝗌𝗂 𝖽𝗈𝗇𝖾 𝟣-𝟥 𝗁𝖺𝗋𝗂!`;
    // Mengirimkan respons
    m.reply(response);
    return;
}
            case 'joki' :           
//case 'gift': 
            {
    // Langsung mengembalikan respons format yang diinginkan
    const response =`_sementara pricelist pc admin ya sayangku_`;

    // Mengirimkan respons
    m.reply(response);
    return;
}
            case 'vilog' :           
//case 'gift': 
            {
    // Langsung mengembalikan respons format yang diinginkan
    const response =`_boleh_`;

    // Mengirimkan respons
    m.reply(response);
    return;
}
             case 'netflix' :           
//case 'gift': 
            {
    // Langsung mengembalikan respons format yang diinginkan
    const response =`_boleh_`;

    // Mengirimkan respons
    m.reply(response);
    return;
}
            case 'am' :           
//case 'gift': 
            {
    // Langsung mengembalikan respons format yang diinginkan
    const response =`_boleh_`;

    // Mengirimkan respons
    m.reply(response);
    return;
}
            case 'capcut' :           
//case 'gift': 
            {
    // Langsung mengembalikan respons format yang diinginkan
    const response =`_besok_`;

    // Mengirimkan respons
    m.reply(response);
    return;
}
            
      case 'show':
case 'get': {
  const nomor = sender.split("@")[0];
  console.log('Sender:', sender);
  console.log('User Nomor:', nomor);

  // Ambil data pengguna dari Firestore
  const userRef = db.collection('users').doc(nomor);

  let userDoc;
  try {
    userDoc = await userRef.get();
  } catch (error) {
    console.error('Error accessing Firestore:', error);
    return m.reply('Terjadi kesalahan saat mengakses data pengguna. Silakan coba lagi nanti.');
  }

  if (!userDoc.exists) {
    return m.reply('Kamu belum terdaftar. Silakan ketik: *Daftar* untuk bisa mengakses.');
  }

  const userData = userDoc.data();

  // Ambil data produk dari file JSON
  let productData;
  try {
    productData = JSON.parse(fs.readFileSync('./db/datadigi.json', 'utf8'));
  } catch (error) {
    console.error('Error reading product data:', error);
    return m.reply('Terjadi kesalahan saat mengakses data produk. Silakan coba lagi nanti.');
  }

  let aliasKey = args[0] ? args[0].toLowerCase() : null;

  if (!aliasKey || !aliasMap.hasOwnProperty(aliasKey)) {
    return m.reply(`Key produk "${aliasKey}" tidak dikenali. Masukkan yang valid.`);
  }
  
  //const { marginBronze, marginSilver, marginGold, marginOwner } = require('./db/config')
  const { category, brand, type, types } = aliasMap[aliasKey];
  const requestedCategory = category.toUpperCase();
  const requestedBrand = brand.toUpperCase();

  // Filter produk berdasarkan kategori, brand, dan tipe
  let matchingProducts = productData.filter(item =>
    item.brand.toUpperCase() === requestedBrand &&
    item.category.toUpperCase() === requestedCategory &&
    (types ? types.includes(item.type) : item.type.toUpperCase() === type.toUpperCase())
  );

  if (matchingProducts.length === 0) {
    return m.reply(`Tidak ada produk ditemukan untuk Produk "${aliasKey}".`);
  }

  matchingProducts.sort((a, b) => a.price - b.price);

  const configData = require('./db/config.js');
  const defaultMarkupPercentage = configData.defaultMarkupPercentage;
  const formatOrder = getOrderFormat(aliasKey);
  const contohOrder = getContoh(aliasKey);

  let formattedResponse = `━═━═━┤❄️ *${requestedBrand}* ├━═━═━\n\n*Status* : ✅ = Ready\n*Status* : ❌ = Close\n*Order Dengan QR ketik* :\n\`QR ${formatOrder}\`\n*Order Dengan Saldo ketik* :\n\`TP ${formatOrder}\`\n*Contoh* :\n${contohOrder}\n━━═━═━━═━═━━═━═━͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏\n`;
	
    //modified
    matchingProducts.forEach(product => {
  const originalPrice = parseFloat(product.price || 0);
  if (isNaN(originalPrice) || originalPrice === 0) return;

  const statusEmoji = product.seller_product_status && product.buyer_product_status ? '✅' : '❌';

  const hargaSilver = Math.floor(originalPrice * (1 + marginSilver)).toLocaleString();
  const hargaGold = Math.floor(originalPrice * (1 + marginGold)).toLocaleString();
  const hargaOwner = Math.floor(originalPrice * (1 + marginOwner)).toLocaleString();

  // Awal teks produk
  formattedResponse += `\n❄️ *${product.product_name}*\n`;

  // Harga ditampilkan sesuai role
  if (["BRONZE", "SILVER", "GOLD"].includes(userData.role)) {
    formattedResponse += `> Harga Silver : Rp. ${hargaSilver}\n`;
    formattedResponse += `> Harga Gold : Rp. ${hargaGold}\n`;
  } else if (userData.role === "OWNER") {
    formattedResponse += `> Harga Silver : Rp. ${hargaSilver}\n`;
    formattedResponse += `> Harga Gold : Rp. ${hargaGold}\n`;
    formattedResponse += `> Harga Owner : Rp. ${hargaOwner}\n`;
  }

  formattedResponse += `> Kode : \`${product.buyer_sku_code}\`\n`;
  formattedResponse += `> Status : ${statusEmoji}\n┈ׅ──ׄ─꯭─꯭──────꯭ׄ──ׅ┈\n`;
});

    /*default
  matchingProducts.forEach(product => {
    const originalPrice = parseFloat(product.price || 0);
if (isNaN(originalPrice) || originalPrice === 0) return; // skip produk invalid

    let markupPercentage = defaultMarkupPercentage;

    // Ambil markup berdasarkan role pengguna
    if (userData) {
      switch (userData.role) {
        case "GOLD":
          markupPercentage = marginGold;
          break;
        case "SILVER":
          markupPercentage = marginSilver;
          break;
        case "BRONZE":
          markupPercentage = marginBronze;
          break;
        case "OWNER":
          markupPercentage = marginOwner;
          break;
        default:
          break;
      }
    }
	
    const increasedPrice = originalPrice * (1 + markupPercentage);
    let adjustedPrice;
    
    // Pembulatan harga berdasarkan role pengguna
    if (userData.role === "BRONZE" || userData.role === "OWNER") {
      adjustedPrice =  Math.floor(increasedPrice);
    } else if (userData.role === "SILVER" || userData.role === "GOLD") {
      adjustedPrice = Math.floor(increasedPrice);
    } else {
      adjustedPrice = increasedPrice; // Jika role tidak dikenali, gunakan harga asli tanpa pembulatan
    }

 const statusEmoji = product.seller_product_status && product.buyer_product_status ? '✅' : '❌';

//> *Harga Owner* : Rp. ${Math.floor(originalPrice * (1 + marginOwner)).toLocaleString()}
//Harga Bronze : Rp. ${Math.floor(originalPrice * (1 + marginBronze)).toLocaleString()}      
    formattedResponse += `\n❄️ *${product.product_name}*\n > Harga Silver : Rp. ${Math.floor(originalPrice * (1 + marginSilver)).toLocaleString()}
> Harga Gold : Rp. ${Math.floor(originalPrice * (1 + marginGold)).toLocaleString()}
> Harga Owner : Rp. ${Math.floor(originalPrice * (1 + marginOwner)).toLocaleString()}
> Kode : \`${product.buyer_sku_code}\`
> Status : ${statusEmoji}\n┈ׅ──ׄ─꯭─꯭──────꯭ׄ──ׅ┈\n`;
  });
*/
  m.reply(formattedResponse);
}
break;






    
        
      case 'ket':
case 'detail': {
  // Ambil data produk dari file JSON
  let productData;
  try {
    productData = JSON.parse(fs.readFileSync('./db/datadigi.json', 'utf8'));
  } catch (error) {
    console.error('Error reading product data:', error);
    return m.reply('Terjadi kesalahan saat mengakses data produk. Silakan coba lagi nanti.');
  }

  // Ambil alias key dari argumen
  let aliasKey = args[0] ? args[0].toLowerCase() : null;

  if (!aliasKey || !aliasMap.hasOwnProperty(aliasKey)) {
    return m.reply(`Produk "${aliasKey}" tidak dikenali. Masukkan yang valid.`);
  }

  // Ambil detail kategori, brand, tipe, dan tipe lain dari aliasMap
  const { category, brand, type, types } = aliasMap[aliasKey];
  const requestedCategory = category.toUpperCase();
  const requestedBrand = brand.toUpperCase();

  // Filter produk berdasarkan kategori, brand, dan tipe
  let matchingProducts = productData.filter(item =>
    item.brand.toUpperCase() === requestedBrand &&
    item.category.toUpperCase() === requestedCategory &&
    (types ? types.includes(item.type) : item.type.toUpperCase() === type.toUpperCase())
  );

  if (matchingProducts.length === 0) {
    return m.reply(`Tidak ada produk ditemukan untuk Produk "${aliasKey}".`);
  }

  // Mengurutkan produk berdasarkan harga terendah
  matchingProducts.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));

  // Markup percentages
  const bronzeMarkup = marginBronze;
  const silverMarkup = marginSilver;
  const goldMarkup = marginGold;

  // Fungsi untuk memformat harga
  const formatSaldo = (amount) => `${amount.toLocaleString()}`;

  // Membuat respons terformat
  let formattedResponse = `──〔  *${requestedBrand}* 〕──\n_Perbandingan Harga Setiap Role Reseller_\n\n`;

  matchingProducts.forEach(product => {
    const originalPrice = parseFloat(product.price);

    const bronzePrice = originalPrice * (1 + bronzeMarkup);
    const silverPrice = originalPrice * (1 + silverMarkup);
    const goldPrice = originalPrice * (1 + goldMarkup);

    const bronze = Math.round(bronzePrice / 100) * 100;
    const silver = Math.floor(silverPrice);
    const gold = Math.floor(goldPrice);

    formattedResponse += `» *${product.product_name}*\n  - *Bronze*: Rp. ${formatSaldo(bronze)}\n  - *Silver*: Rp. ${formatSaldo(silver)}\n  - *Gold*: Rp. ${formatSaldo(gold)}\n\n`;
  });

  m.reply(formattedResponse);
}
break;
           
            
case "mlreg": 
case "mlid":
case "idml":
case "regml": {
  const { format } = require("util");
  if (Array.from(text).filter((x) => (x == "(" || x == ")")).length == 2) {
    if (isNaN(parseInt(text)) || !isNaN(parseInt(text)) && (format(parseInt(text)).length < 6 || format(parseInt(text)).length > 10)) {
      return m.reply("Invalid users id");
    } else if (!text.includes("(") && !text.includes(")") || text.includes("(") && text.includes(")") && !isNaN(parseInt(text.split("(")[1])) && (format(parseInt(text.split("(")[1])).length < 4 || format(parseInt(text.split("(")[1])).length > 5)) {
      return m.reply("Invalid servers id");
    }
    var userId = format(parseInt(text)).trim();
    var serverId = format(parseInt(text.split("(")[1])).trim();
  } else if (text.split(" ").filter((x) => (x !== "" && !isNaN(parseInt(x)))).length == 2) {
    const getdata = text.split(" ").filter((x) => (x !== "" && !isNaN(parseInt(x)))).map((x) => x.trim());
    if (getdata[0].length < 6 || getdata[0].length > 10) {
      return m.reply("Invalid users id");
    } else if (getdata[1].length < 4 || getdata[1].length > 5) {
      return m.reply("Invalid servers id");
    }
    var userId = format(parseInt(getdata[0])).trim();
    var serverId = format(parseInt(getdata[1])).trim();
  } else {
    return m.reply("Example not found!!");
  }

  // Kirim pesan awal dan simpen key
  const initialMsg = await m.reply('dih, kepo amat dah');
  const msgKey = initialMsg.key;

  const fetch = require("node-fetch");
  const url = `https://dev.luckycat.my.id/api/stalker/mobile-legend?users=${userId}&servers=${serverId}`;

  try {
    const response = await fetch(url);
    const result = await response.json();

    if (result.status && result.data) {
      const { nickname, country } = result.data;
      // Edit pesan awal dengan hasil
      await client.sendMessage(msgKey.remoteJid, {
        text: `Mobile Legends\n\n> *Nickname:* ${nickname}\n> *Country:* ${country}\n\n© AtlanticGate`,
        edit: msgKey
      });
    } else {
      // Edit pesan awal dengan error
      await client.sendMessage(msgKey.remoteJid, {
        text: "*_ID Salah_*",
        edit: msgKey
      });
    }
  } catch (error) {
    console.error('Error fetching API:', error.message);
    // Edit pesan awal dengan error
    await client.sendMessage(msgKey.remoteJid, {
      text: "*_ID Salah_*",
      edit: msgKey
    });
  }

  break;
}
            
            //latest update cekganda
            case 'cekml':
//case 'cekganda': 
            {
  if (!q) return m.reply(`🔍CEK NICK MLBB & FIRST TOPUP\nContoh: cekganda 566055979 8250`);
  const [gameId, server] = text.split(' ');
  if (!gameId || !server) return m.reply('Game ID dan Server wajib di isi');

  // Kirim pesan awal dan simpen key
  const initialMsg = await m.reply('Sedang mengecek data akun MLBB...');
  const msgKey = initialMsg.key;

  // Queue sederhana di dalam case
  const queue = [];
  let isProcessing = false;

  const processQueue = async () => {
    if (isProcessing || queue.length === 0) return;
    isProcessing = true;
    const { msg, gameId, server, msgKey } = queue.shift();
    try {
      await handleCekganda(msg, gameId, server, msgKey);
    } catch (error) {
      console.error(`Error in queue: ${error.message}`);
      // Edit pesan awal dengan error
      await client.sendMessage(msgKey.remoteJid, {
        text: 'Proses gagal, coba lagi nanti. Server mungkin sibuk.',
        edit: msgKey
      }, { quoted: m });
    }
    isProcessing = false;
    processQueue();
  };

  const handleCekganda = async (msg, gameId, server, msgKey) => {
    const browser = await firefox.launch({ headless: true });
    const page = await browser.newPage();

    try {
      console.log(`Mengisi Game ID: ${gameId} dan Server: ${server}...`);
      await page.setExtraHTTPHeaders({ 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' });
      await page.goto('https://www.mobapay.com/mlbb/?r=ID', { waitUntil: 'domcontentloaded', timeout: 10000 });

      const gameIdInput = await page.waitForSelector('#userInput', { timeout: 10000 })
        .catch(() => console.log('Elemen #userInput nggak ditemukan.'));
      if (!gameIdInput) throw new Error('Elemen Game ID nggak ketemu');

      const serverInput = await page.waitForSelector('#serverInput', { timeout: 10000 })
        .catch(() => console.log('Elemen #serverInput nggak ditemukan.'));
      if (!serverInput) throw new Error('Elemen Server nggak ketemu');

      await page.fill('#userInput', gameId);
      await page.fill('#serverInput', server);

      await page.dispatchEvent('#userInput', 'blur');
      await page.dispatchEvent('#serverInput', 'blur');

      const firstItem = await page.waitForSelector('.tracker-recharge-item', { timeout: 10000 });
      if (firstItem) {
        await firstItem.click({ timeout: 5000 }).catch(async (e) => {
          console.log('Klik gagal, coba tutup modal:', e.message);
          const modal = await page.$('.mobapay-modal-body', { timeout: 5000 });
          if (modal) {
            const closeButton = await page.$('.mobapay-modal-close', { timeout: 5000 });
            if (closeButton) await closeButton.click({ timeout: 5000 });
          }
          await firstItem.click({ timeout: 5000 });
        });
      } else throw new Error('Elemen item top-up nggak ketemu');

      await page.waitForFunction(
        () => !document.querySelector('.mobapay-user-character-name')?.textContent.includes('Display after verification'),
        { timeout: 30000, polling: 500 }
      ).catch(() => console.log('Verifikasi belum selesai dalam 30 detik.'));

      await page.waitForTimeout(3000);
      await page.waitForSelector('.mobapay-user-character-name', { timeout: 10000 });
      await page.waitForSelector('.mobapay-recharge-wrapper', { timeout: 10000 });
      await page.waitForSelector('.tracker-recharge-item', { timeout: 10000 });

      let nickname = '[Cek di Mobapay]';
      const nicknameElement = await page.$('.mobapay-user-character-name')
        .catch(() => console.log('Elemen nickname nggak ditemukan.'));
      if (nicknameElement) nickname = await nicknameElement.innerText();

      let isValidData = true;
      try {
        const apiUrl = `https://dev.luckycat.my.id/api/stalker/mobile-legend?users=${gameId}&servers=${server}`;
        const apiResponse = await page.evaluate(async (url) => {
          const response = await fetch(url);
          return response.json();
        }, apiUrl);
        if (!apiResponse.status || !apiResponse.data) {
          console.log('API gagal atau data tidak lengkap:', apiResponse.msg);
          isValidData = false;
          // Edit pesan awal dengan error
          await client.sendMessage(msgKey.remoteJid, {
            text: 'Data akun tidak valid: ' + apiResponse.msg,
            edit: msgKey
          }, { quoted: m });
          return;
        }
        nickname = apiResponse.data.nickname || nickname;
        const country = `${apiResponse.data.country} ${apiResponse.data.emoji}`;
        let output = `👤 *Nickname:* ${nickname}\n`;
        output += `🆔 *User ID:* ${gameId}\n`;
        output += `🌐 *Zone ID:* ${server}\n`;
        output += `🌍 *Negara:* ${country}\n`;

        if (isValidData) {
          output += `\n💎 *First Topup Status:*\n`;
          const rechargeItems = await page.$$('.tracker-recharge-item');
          const firstTopupTiers = [50, 150, 250, 500];
          for (const item of rechargeItems) {
            const diamonds = parseInt(await item.getAttribute('data-diamonds') || '0');
            const bonus = await item.getAttribute('data-bonus') || '';
            if (firstTopupTiers.includes(diamonds)) {
              const hasActive = await item.$('.mobapay-recharge-item-active') !== null;
              let hasReachLimit = false;
              const limitElement = await item.$('.mobapay-recharge-item-reachlimit');
              if (limitElement) {
                const limitText = await limitElement.innerText();
                hasReachLimit = limitText.includes('Purchase limit reached');
              }
              const status = hasReachLimit ? '❌' : (hasActive ? '✅' : '✅');
              output += `• ${diamonds} + ${bonus.replace('+', '')} ${status}\n`;
            }
          }
        }
        // Edit pesan awal dengan hasil
        await client.sendMessage(msgKey.remoteJid, {
          text: output,
          edit: msgKey
        });
      } catch (error) {
        console.log('Error mengakses API:', error.message);
        isValidData = false;
        // Edit pesan awal dengan error
        await client.sendMessage(msgKey.remoteJid, {
          text: 'Data akun tidak valid: Error saat mengakses.',
          edit: msgKey
        });
      }
    } catch (error) {
      console.log('error:', error);
      // Edit pesan awal dengan error
      await client.sendMessage(msgKey.remoteJid, {
        text: 'Sabar sayang aku ga kemana, satu-satu gw prosesnya ini pelerrr!\n\n> Usahakan jeda beberapa detik sebelum input data baru ya sayang...\n> Atau mungkin orang lain sedang menggunakan fitur ini juga dalam waktu bersamaan.\n> Coba lagi dalam beberapa saat.',
        edit: msgKey
      });
    } finally {
      await browser.close();
    }
  };

  // Tambah ke queue
  queue.push({ msg: m, gameId, server, msgKey });
  processQueue();
  break;
}
            
            /*default cekganda
	case 'cekml':
     case 'cekganda': {
  if (!q) return m.reply(`🔍CEK NICK MLBB & FIRST TOPUP\nContoh: cekganda 566055979 8250`);
  const [gameId, server] = text.split(' ');
  if (!gameId || !server) return m.reply('Game ID dan Server wajib di isi');

  // Kirim pesan awal dan simpen key
  const initialMsg = await m.reply('Sedang mengecek data akun MLBB...');
  const msgKey = initialMsg.key;

  // Queue sederhana di dalam case
  const queue = [];
  let isProcessing = false;

  const processQueue = async () => {
    if (isProcessing || queue.length === 0) return;
    isProcessing = true;
    const { msg, gameId, server, msgKey } = queue.shift();
    try {
      await handleCekganda(msg, gameId, server, msgKey);
    } catch (error) {
      console.error(`Error in queue: ${error.message}`);
      await client.sendMessage(msgKey.remoteJid, { text: 'Proses gagal, coba lagi nanti. Server mungkin sibuk.' }, { quoted: m });
    }
    isProcessing = false;
    processQueue();
  };

  const handleCekganda = async (msg, gameId, server, msgKey) => {
    const browser = await firefox.launch({ headless: true });
    const page = await browser.newPage();

    try {
      console.log(`Mengisi Game ID: ${gameId} dan Server: ${server}...`);
      await page.setExtraHTTPHeaders({ 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' });
      await page.goto('https://www.mobapay.com/mlbb/?r=ID', { waitUntil: 'domcontentloaded', timeout: 10000 });

      const gameIdInput = await page.waitForSelector('#userInput', { timeout: 10000 })
        .catch(() => console.log('Elemen #userInput nggak ditemukan.'));
      if (!gameIdInput) throw new Error('Elemen Game ID nggak ketemu');

      const serverInput = await page.waitForSelector('#serverInput', { timeout: 10000 })
        .catch(() => console.log('Elemen #serverInput nggak ditemukan.'));
      if (!serverInput) throw new Error('Elemen Server nggak ketemu');

      await page.fill('#userInput', gameId);
      await page.fill('#serverInput', server);

      await page.dispatchEvent('#userInput', 'blur');
      await page.dispatchEvent('#serverInput', 'blur');

      const firstItem = await page.waitForSelector('.tracker-recharge-item', { timeout: 10000 });
      if (firstItem) {
        await firstItem.click({ timeout: 5000 }).catch(async (e) => {
          console.log('Klik gagal, coba tutup modal:', e.message);
          const modal = await page.$('.mobapay-modal-body', { timeout: 5000 });
          if (modal) {
            const closeButton = await page.$('.mobapay-modal-close', { timeout: 5000 });
            if (closeButton) await closeButton.click({ timeout: 5000 });
          }
          await firstItem.click({ timeout: 5000 });
        });
      } else throw new Error('Elemen item top-up nggak ketemu');

      await page.waitForFunction(
        () => !document.querySelector('.mobapay-user-character-name')?.textContent.includes('Display after verification'),
        { timeout: 30000, polling: 500 }
      ).catch(() => console.log('Verifikasi belum selesai dalam 30 detik.'));

      await page.waitForTimeout(3000);
      await page.waitForSelector('.mobapay-user-character-name', { timeout: 10000 });
      await page.waitForSelector('.mobapay-recharge-wrapper', { timeout: 10000 });
      await page.waitForSelector('.tracker-recharge-item', { timeout: 10000 });

      let nickname = '[Cek di Mobapay]';
      const nicknameElement = await page.$('.mobapay-user-character-name')
        .catch(() => console.log('Elemen nickname nggak ditemukan.'));
      if (nicknameElement) nickname = await nicknameElement.innerText();

      let isValidData = true;
      try {
        const apiUrl = `https://dev.luckycat.my.id/api/stalker/mobile-legend?users=${gameId}&servers=${server}`;
        const apiResponse = await page.evaluate(async (url) => {
          const response = await fetch(url);
          return response.json();
        }, apiUrl);
        if (!apiResponse.status || !apiResponse.data) {
          console.log('API gagal atau data tidak lengkap:', apiResponse.msg);
          isValidData = false;
          await client.sendMessage(msgKey.remoteJid, { text: 'Data akun tidak valid: ' + apiResponse.msg }, { quoted: m });
          return;
        }
        nickname = apiResponse.data.nickname || nickname;
        const country = `${apiResponse.data.country} ${apiResponse.data.emoji}`;
        let output = `👤 *Nickname:* ${nickname}\n`;
        output += `🆔 *User ID:* ${gameId}\n`;
        output += `🌐 *Zone ID:* ${server}\n`;
        output += `🌍 *Negara:* ${country}\n`;

        if (isValidData) {
          output += `\n💎 *First Topup Status:*\n`;
          const rechargeItems = await page.$$('.tracker-recharge-item');
          const firstTopupTiers = [50, 150, 250, 500];
          for (const item of rechargeItems) {
            const diamonds = parseInt(await item.getAttribute('data-diamonds') || '0');
            const bonus = await item.getAttribute('data-bonus') || '';
            if (firstTopupTiers.includes(diamonds)) {
              const hasActive = await item.$('.mobapay-recharge-item-active') !== null;
              let hasReachLimit = false;
              const limitElement = await item.$('.mobapay-recharge-item-reachlimit');
              if (limitElement) {
                const limitText = await limitElement.innerText();
                hasReachLimit = limitText.includes('Purchase limit reached');
              }
              const status = hasReachLimit ? '❌' : (hasActive ? '✅' : '✅');
              output += `• ${diamonds} + ${bonus.replace('+', '')} ${status}\n`;
            }
          }
        }
        await client.sendMessage(msgKey.remoteJid, { text: output }, { quoted: m });
      } catch (error) {
        console.log('Error mengakses API:', error.message);
        isValidData = false;
        await client.sendMessage(msgKey.remoteJid, { text: 'Data akun tidak valid: Error saat mengakses.' }, { quoted: m });
      }
    } catch (error) {
      console.error(`Error: ${error.message}`);
      await client.sendMessage(msgKey.remoteJid, { text: 'Sabar sayang aku ga kemana", satu-satu gw prosesnya ini pelerrr!\n> Usahakan jeda beberapa detik sebelum input data baru ya sayanggg...\n> Atau mungkin orang lain sedang menggunakan fitur ini juga dalam waktu bersamaan.\n> Coba lagi dalam beberapa saat.' }, { quoted: m });
    } finally {
      await browser.close();
    }
  };

  // Tambah ke queue
  queue.push({ msg: m, gameId, server, msgKey });
  processQueue();
  break;
}
*/



  case 'daftarmember': {
  if (!isOwner) return;

  // Ambil data pengguna dari Firestore
  const usersCollection = db.collection('users');
  const usersSnapshot = await usersCollection.get();

  if (usersSnapshot.empty) {
    m.reply('No users found.');
    return;
  }

  const formatSaldo = (amount) => `Rp. ${amount.toLocaleString()}`;
  let totalSaldo = 0;
  let totalMembers = 0;
  let userList = '';

  usersSnapshot.forEach(doc => {
    const user = doc.data();
    totalMembers++;
    if (user.nomor !== global.nomerOwner) {
      totalSaldo += user.saldo;
    }
    userList += `» *Nomer :* ${user.nomor}\n`;
    userList += `» *Saldo :* ${formatSaldo(user.saldo)}\n`;
    userList += `» *Role :* ${user.role}\n\n`;
  });

  const header = `──〔  *Daftar Member* 〕──\n` +
                 `*Halo Owner :* ${global.ownerName}\n` +
                 `*Total Saldo Member :* ${formatSaldo(totalSaldo)}\n` +
                 `*Total Member Aktif :* ${totalMembers}\n\n*Daftar Member Aktif :*͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏ \n`;

  const response = header + userList;
  m.reply(response);
}
break;
            
case 'infouser': {
  const commandArgs = m.body.slice(9).trim(); // Mengambil argumen setelah 'infouser '

  // Pengecekan apakah nomor pengguna ada
  const rawUserNumber = commandArgs.trim();
  const userNumber = rawUserNumber.startsWith('@') ? rawUserNumber.slice(1) : rawUserNumber;  // Menghapus simbol @ jika ada

  if (!userNumber) {
    m.reply('Format perintah salah. Gunakan format: infouser <nomor_pengguna>');
    return;
  }

  // Ambil data pengguna dari Firestore berdasarkan nomor pengguna
  const usersCollection = db.collection('users');
  const query = usersCollection.where('nomor', '==', userNumber);
  const userSnapshot = await query.get();

  if (userSnapshot.empty) {
    m.reply(`Pengguna dengan nomor ${userNumber} tidak ditemukan.`);
    return;
  }

  // Mendapatkan data pengguna dari snapshot
  let userData = '';
  userSnapshot.forEach(doc => {
    const user = doc.data();
    userData += `──〔 *Info Pengguna* 〕──\n\n`;
    userData += `» *Nomor :* ${user.nomor}\n`;
    userData += `» *Saldo :* Rp. ${user.saldo.toLocaleString()}\n`;
    userData += `» *Role :* ${user.role}`;
  });

  m.reply(userData);
}
break;
case 'deluser': {
  const commandArgs = m.body.slice(8).trim(); // Mengambil argumen setelah 'deluser '

  // Pengecekan apakah nomor pengguna ada
  const rawUserNumber = commandArgs.trim();
  const userNumber = rawUserNumber.startsWith('@') ? rawUserNumber.slice(1) : rawUserNumber;  // Menghapus simbol @ jika ada

  if (!userNumber) {
    m.reply('Format perintah salah. Gunakan format: deluser @tag/nomor');
    return;
  }

  // Ambil data pengguna dari Firestore berdasarkan nomor pengguna
  const usersCollection = db.collection('users');
  const query = usersCollection.where('nomor', '==', userNumber);
  const userSnapshot = await query.get();

  if (userSnapshot.empty) {
    m.reply(`Pengguna dengan nomor ${userNumber} tidak ditemukan.`);
    return;
  }

  // Hapus data pengguna dari Firestore
  const batch = db.batch();
  userSnapshot.forEach(doc => {
    batch.delete(doc.ref);
  });

  try {
    await batch.commit();
    m.reply(`Data pengguna dengan nomor ${userNumber} berhasil dihapus.`);
  } catch (error) {
    console.error('Error deleting user:', error);
    m.reply(`Terjadi kesalahan saat menghapus data pengguna.`);
  }
}
break;


		case 'uprole':
        case 'up':{
  const nomor = sender.split("@")[0]; // Mengambil nomor pengguna dari pengirim perintah

  // Ambil data pengguna dari Firestore berdasarkan nomor pengguna (nomor)
  const usersCollection = db.collection('users');
  const query = usersCollection.where('nomor', '==', nomor);
  const userSnapshot = await query.get();
    
    // Ambil data pengguna dari Firestore
  const userRef = db.collection('users').doc(nomor);
    
let userDoc;
  try {
    userDoc = await userRef.get();
  } catch (error) {
    console.error('Error accessing Firestore:', error);
    return m.reply('Terjadi kesalahan saat mengakses data pengguna. Silakan coba lagi nanti.');
  }
    
if (!userDoc.exists) {
    return m.reply('Kamu belum terdaftar. Silakan ketik: *Daftar* untuk bisa mengakses.');
  }

  // Mendapatkan data pengguna dari snapshot
  let userData;
  userSnapshot.forEach(doc => {
    userData = doc.data();
  });

  // Jika perintah hanya 'uprole', beri informasi biaya upgrade
  const commandArgs = m.body.slice(7).trim(); // Mengambil argumen setelah 'uprole '
  if (!commandArgs) { 
   m.reply(`*UPGRADE ROLE*
> SILVER : 30K
> GOLD : ~150K~ 50K
> OWNER : ~500K~ 200K
> LPM RESS : 99K (ketik *LPM*)

> 🔥 OWNER + LPM: ~290K~ 250K

💰 *Keuntungan Upgrade Role:*
- Harga lebih murah dibanding BRONZE
- Produk bisa dijual kembali (reseller friendly)
- Semakin tinggi role, semakin murah harga yang didapat

_JOIN GRUP KHUSUS MULAI DARI ROLE GOLD:_
https://chat.whatsapp.com/FPpiJIQoGdX5R2pFBPdvLH
> Hubungi Admin untuk informasi selengkapnya!`);
return;
  }

  // Jika ada argumen, cek untuk upgrade role
  let upgradeCost = 0;
  let newRole = '';

  switch (commandArgs.toLowerCase()) {
    case 'silver':
      upgradeCost = 30000;
      newRole = 'SILVER';
      break;
    case 'gold':
      upgradeCost = 50000;
      newRole = 'GOLD';
      break;
    default:
      m.reply('Perintah tidak valid. Gunakan "Uprole silver" atau "Uprole gold".');
      return;
  }

  // Mendapatkan saldo pengguna
  const currentBalance = userData.saldo;

  // Pengecekan saldo cukup untuk upgrade
  if (currentBalance < upgradeCost) {
    m.reply(`Kamu tidak mempunyai cukup saldo untuk upgrade ke ${newRole}. Biaya upgrade Rp ${upgradeCost.toLocaleString()}.\n\nSilahkan melakukan deposit saldo dengan cara ketik : Depo ${upgradeCost}`);
    return;
  }

  // Update saldo setelah upgrade
  const newBalance = currentBalance - upgradeCost;

  // Update data pengguna di Firestore
  await usersCollection.doc(userSnapshot.docs[0].id).update({
    saldo: newBalance,
    role: newRole
  });

  // Balas dengan konfirmasi upgrade
  m.reply(`Upgrade ke *Role ${newRole}* berhasil, saldo kamu terpotong sebesar *Rp ${upgradeCost.toLocaleString()}*.\n\nSilahkan ketik *Profil* untuk cek role terbaru`);
}
break;






 case 'less': {
  if (!isOwner) return;
  const rawTarget = args[0];
  const target = rawTarget.startsWith('@') ? rawTarget.slice(1) : rawTarget;  // Menghapus simbol @ jika ada
  const kiw = `${target}@s.whatsapp.net`;

  if (!target) return m.reply('Format Salah, yang benar : \n*Kurangsaldo Nomor Nominal*\n\nNomor Awali 62...\nNominal Hanya Angka Tanpa Simbol');

  const amountToRemove = parseFloat(args[1]);

  if (isNaN(amountToRemove) || amountToRemove <= 0) {
    return m.reply('Nilai saldo invalid');
  }

  try {
    // Ambil data pengguna dari Firestore
    const userRef = db.collection('users').doc(target);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return m.reply(`${target} belum terdaftar`);
    }

    const targetUser = userDoc.data();
    const sebelum = targetUser.saldo;
    const akhir = sebelum - amountToRemove;

    if (akhir < 0) {
      return m.reply('Saldo tidak mencukupi');
    }

    // Update data pengguna di Firestore
    await userRef.update({ saldo: akhir });

    const formatSaldo = (amount) => `${amount.toLocaleString()}`;
    const hariini = new Date().toLocaleDateString();
    const time1 = new Date().toLocaleTimeString();
    m.reply(`────〔 *Update Saldo* 〕────

*Nomor* : ${target}
*Saldo terakhir* : ${formatSaldo(sebelum)}
*Saldo sekarang* : ${formatSaldo(akhir)}
*Waktu* : ${hariini}, ${time1}`);

    const capt = `────〔 *Update Saldo* 〕────

*Nomor* : ${target}
*Saldo terakhir* : ${formatSaldo(sebelum)}
*Saldo sekarang* : ${formatSaldo(akhir)}
*Waktu* : ${hariini}, ${time1}`;

    // Kirim pesan ke target user
    client.sendMessage(kiw, {
      text: capt,
      contextInfo: {
        externalAdReply: {
          title: `${global.botName}`,
          thumbnailUrl: `${poster1}`,
          sourceUrl: `${linkGC}`,
          mediaType: 1,
          renderLargerThumbnail: true
        }
      }
    },);
  } catch (error) {
    m.reply(`Terjadi kesalahan: ${error.message}`);
  }
}
break;


case '+':
case 'addsaldo':{
  if (!isOwner) return;
  const rawTarget = args[0];
  const target = rawTarget.startsWith('@') ? rawTarget.slice(1) : rawTarget;  // Menghapus simbol @ jika ada
  const kiw = `${target}@s.whatsapp.net`;

  if (!target) return m.reply('Format Salah, yang benar : \n*Addsaldo Nomor Nominal*\n\nNomor Awali 62...\nNominal Hanya Angka Tanpa Simbol');

  const amountToAdd = parseFloat(args[1]);

  if (isNaN(amountToAdd) || amountToAdd <= 0) {
    return m.reply('Nilai saldo invalid');
  }

  try {
    // Ambil data pengguna dari Firestore
    const userRef = db.collection('users').doc(target);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return m.reply(`${target} belum terdaftar`);
    }

    const targetUser = userDoc.data();
    const sebelum = targetUser.saldo;
    const akhir = sebelum + amountToAdd;

    // Update data pengguna di Firestore
    await userRef.update({ saldo: akhir });

    const formatSaldo = (amount) => `${amount.toLocaleString()}`;
    const hariini = new Date().toLocaleDateString();
    const time1 = new Date().toLocaleTimeString();
    m.reply(`────〔 *Update Saldo* 〕────

*Nomor* : ${target}
*Saldo terakhir* : ${formatSaldo(sebelum)}
*Saldo sekarang* : ${formatSaldo(akhir)}
*Waktu* : ${hariini}, ${time1}`);

    const capt = `────〔 *Update Saldo* 〕──── 

*Nomor* : ${target}
*Saldo terakhir* : ${formatSaldo(sebelum)}
*Saldo sekarang* : ${formatSaldo(akhir)}
*Waktu* : ${hariini}, ${time1}`;

    // Kirim pesan ke target user
    client.sendMessage(kiw, {
      text: capt,
      contextInfo: {
        externalAdReply: {
          title: `${global.botName}`,
          thumbnailUrl: `${poster1}`,
          sourceUrl: `${linkGC}`,
          mediaType: 1,
          renderLargerThumbnail: true
        }
      }
    }, );
  } catch (error) {
    m.reply(`Terjadi kesalahan: ${error.message}`);
  }
}
break;

            case 'daftar': {
  const nomor = sender.split("@")[0];
  const userRef = db.collection('users').doc(nomor);
  const userDoc = await userRef.get();

  if (userDoc.exists) {
    return m.reply(`Kamu sudah terdaftar, cek data akunmu dengan ketik *me*`);
  }

  // Cek apakah dalam grup
  let defaultRole;
  if (isGroup) {
    defaultRole = 'SILVER';
  } else {
    defaultRole = 'BRONZE';
  }

  const newUser = {
    nomor,
    saldo: 0,
    role: defaultRole
  };

  await userRef.set(newUser);

  let ucapan = `──〔 *Registrasi Sukses!* 〕──

*Nomer* : ${nomor}
*Saldo Awal* : 0
*Role* : ${defaultRole}
  ͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏
💡 Sekarang kamu bisa menggunakan semua fitur Bot!

- *Order via QR* : ketik \`QR [KODE] [ID]\`
- *Order via Saldo* : ketik \`TP [KODE] [ID]\`
- *Deposit Saldo* : ketik \`deposit nominal\`

📝 *Cek saldo & status akun* : ketik \`me\`

────────────────────────────`;

  m.reply(ucapan);

  // Ucapan khusus di grup
  if (isGroup) {
    await client.sendMessage(m.chat, { text: `🎉 Selamat datang di *${namaStore}*! Kamu langsung dapat role *SILVER* gratis! 🎉` });
  }
  break;
}
            
/*
      case 'regist':
      case 'daftar': {
  const target = sender.split("@")[0];
  let userData = [];
  const db = admin.firestore();
  
  // Mendapatkan data user dari Firestore
  const userRef = db.collection('users').doc(target);
  const doc = await userRef.get();
  
  if (doc.exists) {
    return;
  }

  const defaultRole = 'BRONZE';
  const newUser = {
    nomor: target,
    saldo: 0,
    role: defaultRole,
  };

  // Menyimpan data user ke Firestore
  await userRef.set(newUser);

  return m.reply(`â”€â”€ã€” *Registrasi Sukses!* ã€•â”€â”€

*Nomer* : ${target}
*Saldo awal* : 0
*Role* : BRONZE

*_Anda sudah bisa menggunakan sistemp Top-Up dan fitur deposit saldo otomatis_*
> Ketik *Produk* untuk menampilkan produk otomatis

*_Contoh Penggunaan_*͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏ 
*Order Dengan QR ketik* : \`QR [KODE] [TUJUAN]\`
> Cocok buat kamu yang ingin topup cepat tanpa harus deposit saldo
*Order Dengan Saldo ketik* : \`TP [KODE] [TUJUAN]\`
> Cocok buat kamu yang ingin menyimpan saldo untuk TopUp di kemudian hari

*Deposit Saldo Otomatis ketik* : deposit nominal`);
}
break;
            */
      case 'ubahrole': {
  if (!isOwner) return;
  const rawTarget = args[0];
  const target = rawTarget.startsWith('@') ? rawTarget.slice(1) : rawTarget;  // Menghapus simbol @ jika ada
  const kiwi = `${target}@s.whatsapp.net`;

  if (!target) return m.reply('Format Salah, yang benar : \n*Ubahrole Nomor Role*\n\nNomor Awali 62...\nNominal Hanya Angka Tanpa Simbol');

  const newRole = args[1];

  if (!newRole) return;

  if (!['gold', 'silver', 'owner', 'bronze'].includes(newRole.toLowerCase())) {
    return m.reply(`Role ${newRole} belum tersedia\nRole yang tersedia: BRONZE, SILVER, dan GOLD`);
  }

  try {
    // Ambil data pengguna dari Firestore
    const userRef = db.collection('users').doc(target);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return m.reply(`${target} belum terdaftar`);
    }

    const targetUser = userDoc.data();
    const awal = targetUser.role;

    // Update data pengguna di Firestore
    await userRef.update({ role: newRole.toUpperCase() });

    m.reply(`──〔 *Update Role* 〕──

*Role awal* : ${awal}
*Role baru* : ${newRole.toUpperCase()}`);

    const capt = `──〔 *Update Role* 〕──

*Role awal* : ${awal}
*Role baru* : ${newRole.toUpperCase()}`;

    // Kirim pesan ke target user
    client.sendMessage(kiwi, {
      text: capt,
    });
  } catch (error) {
    m.reply(`Terjadi kesalahan: ${error.message}`);
  }
}
break;

//*${namaStore}*
      case 'profile':
      case 'profil':
        case 'me':
            case 'saldo': {
                try {
                    const userNomor = sender.split("@")[0];
            
                    // Ambil data pengguna dari Firestore
                    const userRef = db.collection('users').doc(userNomor);
                    const userDoc = await userRef.get();
            
                    if (!userDoc.exists) {
                        return m.reply('Silahkan daftar dahulu');
                    }
            
                    const userProfile = userDoc.data();
            
                    if (userProfile) {
                        // --- PERBAIKAN DI SINI ---
                        // Ambil 'jumlah_transaksi_sukses' langsung dari dokumen utama
                        const { nomor, saldo, role, total_spend, jumlah_transaksi_sukses } = userProfile;
                        const formatSaldo = (amount) => `Rp${(amount || 0).toLocaleString('id-ID')}`;
                        
                        // Gunakan nilai dari field itu, jika tidak ada, tampilkan 0
                        const jumlahTransaksi = jumlah_transaksi_sukses || 0;

                        // Siapkan pesan detail terlebih dahulu
                        const detailedProfileMessage = `────〔 *Detail Akun Anda* 〕────\n\n*Username* : ${pushname}\n*Nomor* : ${nomor}\n*Saldo* : ${formatSaldo(saldo)}\n*Transaksi Sukses* : ${jumlahTransaksi} Kali\n*Total Belanja* : ${formatSaldo(total_spend)}\n*Role* : ${role}\n\nTerima kasih telah menjadi\npelanggan setia *${namaStore}*!`;

                        // Cek apakah command dikirim di grup atau di chat pribadi
                        if (m.isGroup) {
                            // --- Jika di GRUP ---
                            const publicProfileMessage = `────〔 *Profile* 〕────\n\n*Username* : ${pushname}\n*Nomor* : ${nomor}\n*Saldo* : ${formatSaldo(saldo)}\n*Transaksi Sukses* : ${jumlahTransaksi} Kali\n*Role* : ${role}`;
                            await m.reply(publicProfileMessage);
                            await client.sendMessage(sender, { text: detailedProfileMessage }, { quoted: m });
                        } else {
                            // --- Jika di CHAT PRIBADI ---
                            await m.reply(detailedProfileMessage);
                        }
                    }
                } catch (error) {
                    console.error("Error di case 'me':", error);
                    m.reply("Terjadi kesalahan saat mengambil profil Anda.");
                }
            }
            break;

case 'tf': {
  const senderNomor = sender.split("@")[0];

  if (args.length < 2) {
    return m.reply('Format Salah, yang benar : \n*Tf @tag/nomor nominal*\n\nNomor Awali 62...\nNominal Hanya Angka Tanpa Simbol');
  }

  const rawTarget = args[0];
  const target = rawTarget.startsWith('@') ? rawTarget.slice(1) : rawTarget;
  const amountToTransfer = parseFloat(args[1]);

  if (isNaN(amountToTransfer) || amountToTransfer <= 0) {
    return m.reply('Nilai transfer invalid');
  }

  try {
    // Ambil data pengguna pengirim dari Firestore
    const senderRef = db.collection('users').doc(senderNomor);
    const senderDoc = await senderRef.get();

    if (!senderDoc.exists) {
      return m.reply('Anda belum terdaftar');
    }

    const senderUser = senderDoc.data();
    const saldoPengirim = senderUser.saldo;

    if (saldoPengirim < amountToTransfer) {
      return m.reply('Saldo tidak mencukupi untuk melakukan transfer');
    }

    // Ambil data pengguna penerima dari Firestore
    const targetRef = db.collection('users').doc(target);
    const targetDoc = await targetRef.get();

    if (!targetDoc.exists) {
      return m.reply(`Nomor tujuan ${target} belum terdaftar`);
    }

    const targetUser = targetDoc.data();
    const saldoPenerima = targetUser.saldo;
    const saldoPengirimAkhir = saldoPengirim - amountToTransfer;
    const saldoPenerimaAkhir = saldoPenerima + amountToTransfer;

    // Update data pengguna pengirim dan penerima di Firestore
    await senderRef.update({ saldo: saldoPengirimAkhir });
    await targetRef.update({ saldo: saldoPenerimaAkhir });

    const formatSaldo = (amount) => `Rp. ${amount.toLocaleString()}`;
    const hariini = new Date().toLocaleDateString();
    const time1 = moment().tz('Asia/Jakarta').format('HH:mm:ss');

    m.reply(`───〔 *Transfer Saldo Berhasil* 〕───

*Dari Nomor* : ${senderNomor} 
*Ke Nomor* : ${target}
*Jumlah Transfer* : ${formatSaldo(amountToTransfer)}
*Saldo Sekarang* : ${formatSaldo(saldoPengirimAkhir)}
*Waktu* : ${hariini}, ${time1}`);

    const capt = `────〔 *Saldo Masuk* 〕────\n\n*Dari Nomor :* ${senderNomor}\n*Jumlah :* Rp. ${formatSaldo(amountToTransfer)}\n*Saldo Sekarang :* Rp. ${formatSaldo(saldoPenerimaAkhir)}\n*Waktu :* ${hariini}, ${time1} WIB`;

    // Kirim pesan ke target user
    const kiw = `${target}@s.whatsapp.net`;
    client.sendMessage(kiw, {
      text: capt,
      contextInfo: {
        externalAdReply: {
          title: `${global.botName}`,
          thumbnailUrl: `${poster1}`,
          sourceUrl: `${linkGC}`,
          mediaType: 1,
          renderLargerThumbnail: true
        }
      }
    });

  } catch (error) {
    m.reply(`Terjadi kesalahan: ${error.message}`);
  }
}
break;

 
case 'rank': {
  const transactionsData = JSON.parse(fs.readFileSync('./db/trx.json', 'utf8'));

  // Create a map to store product sales data
  const productSales = new Map();

  // Populate the productSales map
  transactionsData.forEach((trx) => {
    const productName = trx.item;
    const quantity = trx.quantity || 1; // Assuming quantity is 1 if not specified
    const totalAmount = trx.harga * quantity;

    if (!productSales.has(productName)) {
      productSales.set(productName, { quantity: 0, totalAmount: 0 });
    }

    productSales.get(productName).quantity += quantity;
    productSales.get(productName).totalAmount += totalAmount;
  });

  // Sort products by total quantity sold
  const rankedProducts = [...productSales.entries()]
    .sort((a, b) => b[1].quantity - a[1].quantity);

  // Create the response message
  let responseMessage = `────〔 *RANKING PRODUK* 〕────\n*${namaStore}*͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏\n `;

  rankedProducts.forEach((entry, index) => {
    const productName = entry[0];
    const quantity = entry[1].quantity;
    const totalAmount = entry[1].totalAmount;

    responseMessage += `\n*#Rank ${index + 1}*\nProduk: ${productName}\nJumlah Dibeli: ${quantity}\nTotal: Rp ${totalAmount.toLocaleString()}\n`;
  });

  m.reply(responseMessage);
  break;
}
            
            
/*
case 'depom': {
    const paymentDepo = paymentKamu;
    const randomId = Math.floor(10000000 + Math.random() * 90000000);
    const depoCommand = m.text.split(' ');
    const isValidInput = depoCommand.length > 1 && /^\d+$/.test(depoCommand[1]);

    if (!isValidInput) {
        m.reply(`Format Salah atau Nominal Harus Angka\nFormat benar : \`\`\`Depo [Nominal]\`\`\`\n\`\`\`Contoh : Depo 1000\`\`\``);
        return;
    }

    const minimalNominal = 1000;
    const nominal = parseInt(depoCommand[1]);

    if (nominal < minimalNominal) {
        m.reply(`Nominal harus minimal ${minimalNominal}\nFormat benar : \`\`\`Depo [Nominal]\`\`\`\n\`\`\`Contoh : Depo 1000\`\`\``);
        return;
    }

    const biayaLayanan = nominal * 0.007;
    const saldoDiterima = nominal - biayaLayanan;
    const memberNumber = m.sender.split('@')[0];

    const depoData = {
        id: randomId,
        member: memberNumber,
        nominal: nominal,
        biayaLayanan: biayaLayanan,
        saldoDiterima: saldoDiterima,
        tanggal: new Date().toISOString(),
    };

    // Path file riwayat depo yang sudah ada
    const filePath = path.join(__dirname, 'db', 'riwayatdepo.json');

    let riwayatDepo = [];

    // Baca data yang sudah ada jika file riwayatdepo.json ada
    if (fs.existsSync(filePath)) {
        const existingData = fs.readFileSync(filePath, 'utf8');
        riwayatDepo = JSON.parse(existingData);
    }

    // Tambahkan data baru ke riwayat
    riwayatDepo.push(depoData);

    // Tulis kembali data ke file riwayatdepo.json
    fs.writeFileSync(filePath, JSON.stringify(riwayatDepo, null, 2));

    const formattedNominal = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(nominal);
    const formattedBiayaLayanan = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(biayaLayanan);
    const formattedSaldoDiterima = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(saldoDiterima);

    let depositInfo = `[ *INFORMASI DEPOSIT* ]\n\n`;
    depositInfo += `*Â» ID :* ${randomId}\n`;
    depositInfo += `*Â» Member :* ${memberNumber}\n`;
    depositInfo += `*Â» Jumlah Bayar :* ${formattedNominal}\n`;
    depositInfo += `*Â» PAYMENT :*\n${paymentDepo}\n\n`;

    depositInfo += `_Silahkan transfer ke pembayaran yang disediakan dan kirimkan bukti transfer ke Admin dengan cara ketik *BUKTI ID*_\n*ID = ID DEPOSIT KAMU YA*\n\n`;
    depositInfo += `*_${namaStore}_*`;

    client.sendMessage(m.chat, { image: { url: linkQRIS }, caption: depositInfo }, { quoted: m });

    break;
}
*/
			
case 'bot': {
  let pesanBot;
  if (isGroup) {
    // Cek apakah ada pesan bot spesifik untuk grup ini
    let botgroup = {};
    if (fs.existsSync(botgroupFile)) {
      botgroup = JSON.parse(fs.readFileSync(botgroupFile));
    }
    pesanBot = botgroup[m.chat] || global.bot; // fallback ke global.bot
  } else {
    pesanBot = global.bot;
  }

  client.sendMessage(m.chat, { text: pesanBot }, { quoted: m });
  break;
}

case 'setbot': {
  if (!isGroup) return m.reply('❌ Perintah ini hanya bisa dilakukan di dalam grup.');
  if (!isAdmins && !isOwner) return m.reply('❌ Hanya Admin/Owner yang bisa.');

  if (!text) return m.reply('Format salah!\nContoh:\n> setbot Halo semua!');

  // Baca file botgroup
  let botgroup = {};
  if (fs.existsSync(botgroupFile)) {
    botgroup = JSON.parse(fs.readFileSync(botgroupFile));
  }

  botgroup[m.chat] = text;
  fs.writeFileSync(botgroupFile, JSON.stringify(botgroup, null, 2));

  m.reply(`✅ Pesan bot grup berhasil diupdate:\n\n"${text}"`);
  break;
}
            
            case 'caraorder':
case 'tutorial': {
  const response = `📌 *Panduan Order di Bot Topup Atlantic*  Berikut adalah panduan lengkap agar kamu bisa melakukan pembelian produk secara otomatis melalui bot ini.
͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏
━━━━━━━━━━━━━━━━━━━━━━━
🔹 *1. Pendaftaran Awal*   Ketik *Daftar* untuk mendaftarkan nomor kamu ke sistem. Cukup dilakukan sekali. 

🔹 *2. Melihat Daftar Produk*  
Ketik *Produk* untuk melihat semua produk yang tersedia seperti:  
Mobile Legends, Free Fire, TikTok, Pulsa, dll.

🔹 *3. Cek Harga Produk*  
Gunakan perintah: *GET KODEPRODUK*  
Contoh: *GET ML*

━━━━━━━━━━━━━━━━━━━━━━━
💡 *Terdapat 2 metode order yang bisa kamu pilih:*

🔸 *A. TP – Order menggunakan saldo bot*  
• Format: *[TP] [KODEPRODUK] [TUJUAN]*  
• Contoh: *TP ML5 748418773 8988*  
Saldo kamu akan langsung terpotong dan pesanan diproses otomatis.

━━━━━━━━━━━━━━━━━━━━━━━
🔸 *B. QR – Order menggunakan pembayaran via QRIS (tanpa saldo)*  
• Format: *[QR] [KODEPRODUK] [TUJUAN]*  
• Contoh: *QR ML5 748612773 12988*  
Kamu akan menerima QRIS yang bisa dibayar lewat e-Wallet seperti DANA, OVO, Gopay, ShopeePay, dan lainnya.  
*QR hanya berlaku selama 5 menit.* Setelah pembayaran berhasil, pesanan akan langsung diproses dan *kode unik akan masuk ke saldo kamu.*

━━━━━━━━━━━━━━━━━━━━━━━
💰 *Deposit Saldo (Opsional)*  
Gunakan perintah: *Deposit NOMINAL*  
Contoh: *Deposit 10000*  
Bot akan mengirim QR untuk pembayaran.

📊 *Cek Saldo*  
Gunakan perintah: *Saldo*

📞 *Butuh Bantuan?*  
Ketik: *Owner* untuk menghubungi admin.

━━━━━━━━━━━━━━━━━━━━━━━
Terima kasih telah menggunakan *Atlana* sebagai teman Top-Up Anda.  
Layanan ini dibuat untuk mempermudah transaksi digital kamu secara cepat, aman, dan otomatis.
*© AtlanticGate*`;
  m.reply(response);
  return;
}
case 'tutorial2': {
  const tutorial2 = `📌 *Panduan Order Manual Starlight (AtlanticGate)*  
Kamu bisa beli Starlight Basic & Premium manual di sini, ada 2 cara:
͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏
━━━━━━━━━━━━━━━━━━━━━━━
🔹 *1. Daftar Dulu*  
Ketik *Daftar* – Wajib & cukup sekali aja.

🔹 *2. Cek Stok & Harga*  
• *cekstok [jenisProduk]* – Cek stok produk  
• *showprice* – Lihat harga per role

━━━━━━━━━━━━━━━━━━━━━━━
💡 *2 Cara Order Manual Starlight:*

🔸 *A. Pakai Saldo Bot*  
Format:  
> buy [jenisProduk] [ID ML] [server] [jumlah]  
Contoh:  
> buy slbasic 12345678 1234 1  

Saldo kamu akan langsung terpotong dan stok dikirim otomatis.

🔸 *B. Pakai QRIS (Tanpa Saldo)*  
Format:  
> buyqr [jenisProduk] [ID ML] [server] [jumlah]  
Contoh:  
> buyqr slbasic 12345678 1234 1  

Bot akan kirim *QRIS* (Dana, Ovo, Gopay, Shopeepay, dll).  
✅ Scan & bayar dalam 5 menit.  
✅ Setelah dibayar, bot kirim detail *Invoice, ID, Nickname, sisa stok*.

━━━━━━━━━━━━━━━━━━━━━━━
💰 *Deposit Saldo (Opsional)*  
Ketik: *Deposit NOMINAL*  
Contoh: *Deposit 10000*

📞 *Butuh Bantuan?*  
Ketik: *Owner* untuk kontak admin.

━━━━━━━━━━━━━━━━━━━━━━━
Terima kasih telah menggunakan *Atlana* sebagai teman Top-Up Anda.  
Layanan ini dibuat untuk mempermudah transaksi digital kamu secara cepat, aman, dan otomatis.
*© AtlanticGate*`;

  return m.reply(tutorial2);
}

            
   case 'min':
   case 'admin':
   case 'etmin':
            {
    client.sendMessage(m.chat, { text: global.min }, { quoted: m });
    break;
}
            
  case 'sl':           
 //case 'starlight': 
            {
    const capt = `${sl}`;
    client.sendMessage(m.chat, { image: { url: linksl }, caption: capt }, { quoted: m });
    break;
 }          
            
 case 'pay':           
 case 'payment': {
    const capt = `${pay}`;
    client.sendMessage(m.chat, { image: { url: linkQRIS }, caption: capt }, { quoted: m });
    break;
 }           
       case 'setpay': {
  if (!isOwner) return m.reply('❌ Fitur ini hanya untuk owner.')

  if (!text) return m.reply(`Contoh penggunaan:\n\n${prefix}setpay isi baru`)

  try {
    const configPath = './db/config.js'
    let fileContent = fs.readFileSync(configPath, 'utf8')

    // Replace isi `pay` dengan yang baru
    const newContent = fileContent.replace(
      /pay\s*=\s*`[^`]*`/s,
      'pay = `' + text + '`'
    )

    fs.writeFileSync(configPath, newContent)

    // Reload ulang config.js tanpa restart bot
    delete require.cache[require.resolve('./db/config.js')]
    require('./db/config.js')
    global.pay = pay // kalau lo pake global.pay

    m.reply('✅ Informasi payment berhasil diubah dan diperbarui.')
  } catch (err) {
    console.error('Error saat update pay:', err)
    m.reply('❌ Gagal mengubah informasi payment.')
  }
}
break

            /*
  case 'depo1':          
  case 'depo2': {
    const nomor = sender.split("@")[0];
    const userRef = db.collection('users').doc(nomor);
    const userDoc = await userRef.get();
  
    if (!userDoc.exists) {
      return m.reply('Kamu belom terdaftar, silahkan ketik *Daftar*');
    }
  
    const ref_id = generateUniqueRefID();
    const apiUrl = 'https://api.tokopay.id/v1/order';
    const jumlah = args[0];
    
    if (!jumlah || isNaN(jumlah) || parseInt(jumlah) <= 99) {
      return m.reply(`Format Yang Benar Adalah : *Depo Nominal*\nContoh : *Depo 10000*\n\nMinimum Deposit adalah 100. \nNilai deposit tidak boleh mengandung titik atau koma, hanya angka.`);
    }
  
    const formatSaldo = (amount) => `${amount.toLocaleString()}`;
    const requestData = {
      merchant: merchantTP,
      secret: secretTP,
      ref_id: ref_id,
      nominal: jumlah,
      metode: 'QRIS',
    };
    const queryString = new URLSearchParams(requestData).toString();
    const requestUrl = `${apiUrl}?${queryString}`;
  
    const depoRef = db.collection('deposits').doc(nomor);
    const depoDoc = await depoRef.get();
  
    if (depoDoc.exists) {
      return m.reply(`Maaf, kamu sudah memiliki deposit yang sedang diproses...`);
    }
  
    await depoRef.set({ nomor: nomor, amount_received: jumlah });
  
    fetch(requestUrl)
      .then(async (response) => {
        const data = await response.json();
        const capt = `â”€â”€ã€” *DETAIL DEPOSIT* ã€•â”€â”€\n\n*Â» Ref ID :* ${ref_id}\n*Â» Username Deposit :* ${pushname}\n*Â» Jumlah Bayar :* Rp ${formatSaldo(data.data.total_bayar)}\n*Â» Jumlah Diterima :* Rp ${formatSaldo(data.data.total_diterima)}\n\n*Status : Belum Dibayar*\n\nKamu bisa scan QRIS tersebut melalui *BANK* dan e-Wallet seperti *Dana, Ovo, Gopay, Shopeepay, Dll*\n\n*_Note :_* Deposit di cek otomatis dan akan langsung masuk ke saldo kamu, Batas waktu transfer adalah 3 Menit sejak deposit dibuat`;
        client.sendMessage(m.chat, { image: { url: `${data.data.qr_link}` }, caption: capt });
  
        let dataStatus = data.data.status;
        const startTime = new Date().getTime();
        
        while (dataStatus !== "Success") {
          await sleep(1000);
          const neko = await fetch(requestUrl);
          const memecData = await neko.json();
          dataStatus = memecData.data.status;
          console.log(dataStatus);
  
          const currentTime = new Date().getTime();
          const elapsedTime = (currentTime - startTime) / 1000;
  
          if (elapsedTime >= 150) {
            m.reply(`â”€â”€ã€” *DEPOSIT GAGAL* ã€•â”€â”€\n\n*Â» Ref ID :* ${ref_id}\n*Â» Username Deposit :* ${pushname}\n*Â» Jumlah Deposit :* ${formatSaldo(memecData.data.total_diterima)}\n\n*Status : TIME OUT*\n\nSesi Deposit Expired, Silahkan Deposit Ulang`);
            await depoRef.delete();
            break;
          }
  
          if (dataStatus === "Success") {
            const dep = memecData.data.total_diterima;
            const capt = `â”€â”€ã€” *DEPOSIT SUKSES !* ã€•â”€â”€\n\n*Â» Ref ID :* ${ref_id}\n*Â» Nomer User :* ${nomor}\n*Â» Waktu :* ${hariini}*\n*Â» Jam :${time1} WIB*\n\n*Status : ${memecData.data.status}*\n\nSaldo sebesar *${formatSaldo(memecData.data.total_diterima)}* Telah ditambah ke Akun Kamu\n\nÂ© _${global.botName}_`;
            m.reply(capt);
  
            const updatedUserDoc = await userRef.get();
            const updatedSaldo = updatedUserDoc.data().saldo + dep;
            await userRef.update({ saldo: updatedSaldo });
            await depoRef.delete();
            break;
          }
        }
      });
  }
  break;      
            */
            //depo final
            case 'depo':
case 'deposit': {
  const nomor = sender.split('@')[0];
  const userRef = db.collection('users').doc(nomor);
  const userDoc = await userRef.get();
  if (!userDoc.exists) return m.reply('Kamu belum terdaftar, silakan ketik *Daftar* terlebih dahulu.');

  const jumlah = parseInt(text);
  if (!jumlah || isNaN(jumlah)) return m.reply(`Contoh: ${prefix + command} 10000`);

  const userData = userDoc.data();
  const depositCache = readDatabase();

  // Cek apakah user masih punya transaksi deposit aktif
  if (depositCache.deposit && depositCache.deposit[nomor]) {
    const trx = depositCache.deposit[nomor];
    const now = Date.now();
    if (now < trx.expire && trx.status !== 'done') {
      return m.reply('Kamu masih memiliki transaksi deposit yang belum dibayar. Harap selesaikan dulu sebelum membuat baru.');
    }
  }

  // Generate kode unik (1-100)
  const UNIQUE_CODE_RANGE = 100;
  depositCache.deposit = depositCache.deposit || {};
  depositCache.usedUniqueCodes = depositCache.usedUniqueCodes || [];
  let uniqueCode;
  let attempts = 0;
  do {
    uniqueCode = Math.floor(Math.random() * UNIQUE_CODE_RANGE) + 1;
    attempts++;
    if (attempts > 50) {
      return m.reply('❌ Gagal generate kode unik. Coba lagi nanti.');
    }
  } while (depositCache.usedUniqueCodes.includes(uniqueCode));
  depositCache.usedUniqueCodes.push(uniqueCode);
  saveDatabase(depositCache);

  const totalAmount = jumlah + uniqueCode; // Kode unik ditambahin ke total
  const ref_id = generateUniqueRefID();

  try {
    // Buat QRIS
    console.log('Membuat QRIS dengan parameter:', { apikey: 'new', amount: totalAmount, codeqr });
    const pay = await axios.get(`https://restapi.simplebot.my.id/orderkuota/createpayment?apikey=new&amount=${totalAmount}&codeqr=${codeqr}`);
    console.log('API QRIS Response:', JSON.stringify(pay.data, null, 2));

    // Cek response API
    if (!pay.data?.result?.imageqris?.url) {
      throw new Error('Response API QRIS tidak valid: imageqris.url tidak ditemukan');
    }

    const image = pay.data.result.imageqris.url;
    console.log('QRIS Image URL:', image);

    const now = moment.tz('Asia/Jakarta');
    const expireAt = now.clone().add(5, 'minutes');
    const expiredText = expireAt.format('HH:mm:ss');

    const caption = `─────〔 *DETAIL DEPOSIT* 〕─────

» *TRX ID :* ${ref_id}
» *Nominal Deposit :* Rp${jumlah.toLocaleString()}
*» Biaya Admin :* 0%
» *Kode Unik :* Rp${uniqueCode}
» *Total Bayar :* Rp${totalAmount.toLocaleString()}
» *Kedaluwarsa :* ${expiredText} WIB

» *Status : Belum Dibayar*

Kamu bisa scan QRIS tersebut melalui *BANK* dan e-Wallet yang mendukung pembayaran QRIS dan scan QR diatas untuk menyelesaikan pembayaran sebelum waktu kedaluwarsa. Bot akan otomatis mengkonfirmasi pembayaran jika Anda sudah melakukan pembayaran.

Note:
- Kode unik akan otomatis masuk ke saldo kamu
- Jika bot tidak mengkonfirmasi setelah pembayaran dilakukan, silahkan hubungi owner untuk mengkonfirmasi`;

    console.log('Mengirim pesan QRIS ke:', m.chat);
    const sentMsg = await client.sendMessage(m.chat, { image: { url: image }, caption }, { quoted: m });
    console.log('Pesan QRIS terkirim:', sentMsg.key);

    // Simpan transaksi deposit di cache
    depositCache.deposit[nomor] = {
      ref_id,
      jumlah,
      uniqueCode,
      totalAmount,
      expire: expireAt.valueOf(),
      status: 'waiting',
      msgKey: sentMsg.key
    };
    saveDatabase(depositCache);

    // Jalankan polling
    const apiUrl = `https://gateway.okeconnect.com/api/mutasi/qris/${merchant}/${keyorkut}`;
    const interval = setInterval(async () => {
      const now = Date.now();
      const cache = readDatabase();
      cache.issuerRefs = cache.issuerRefs || [];
      const trx = cache.deposit[nomor];
      if (!trx) return clearInterval(interval);

      if (now > trx.expire && trx.status === 'waiting') {
        await client.sendMessage(m.chat, { delete: trx.msgKey });
        cache.usedUniqueCodes = cache.usedUniqueCodes.filter(code => code !== trx.uniqueCode);
        delete cache.deposit[nomor];
        saveDatabase(cache);
        m.reply('Qrcode telah kadaluarsa. Silakan buat deposit baru.');
        clearInterval(interval);
        return;
      }

      try {
        const res = await axios.get(apiUrl);
        console.log('API Mutasi Response:', JSON.stringify(res.data, null, 2));
        if (res.data.status !== 'success') {
          console.log('API Mutasi Status Bukan Success:', res.data.status);
          return;
        }

        const found = res.data.data.find(d => {
          const isMatch = parseInt(d.amount) === trx.totalAmount &&
                          d.issuer_reff &&
                          !cache.issuerRefs.includes(d.issuer_reff);
          console.log('Cek Transaksi:', {
            amount: d.amount,
            issuer_reff: d.issuer_reff,
            status: d.status,
            isMatch
          });
          return isMatch;
        });
        if (!found) {
          console.log('Transaksi Not found');
          return;
        }

        clearInterval(interval);
        cache.issuerRefs.push(found.issuer_reff);
        cache.usedUniqueCodes = cache.usedUniqueCodes.filter(code => code !== trx.uniqueCode);
        cache.deposit[nomor].status = 'done';
        saveDatabase(cache);

        const saldoAwal = userData.saldo;
        const saldoBaru = saldoAwal + trx.totalAmount;
        await userRef.update({ saldo: saldoBaru });
        await client.sendMessage(m.chat, { delete: trx.msgKey });

        const hariini = moment.tz('Asia/Jakarta').format('dddd, DD MMMM YYYY');
        const time1 = moment.tz('Asia/Jakarta').format('HH:mm:ss');

        const toUser = `Kamu telah melakukan *Deposit Saldo*

» *TRX ID* : ${ref_id}
» *Waktu* : ${hariini}
» *Jam* : ${time1} WIB
» *Saldo Awal* : Rp${saldoAwal.toLocaleString()}
» *Nominal* : Rp${trx.jumlah.toLocaleString()}
» *Kode Unik* : Rp${trx.uniqueCode}
» *Total Bayar* : Rp${trx.totalAmount.toLocaleString()}
» *Sisa Saldo* : Rp${saldoBaru.toLocaleString()}

*${namaStore}*`;

        const replyNotif = `─────〔 *DEPOSIT SUKSES !* 〕─────

» *TRX ID* : ${ref_id}
» *Nomor User* : ${nomor}
» *Waktu* : ${hariini}
» *Jam* : ${time1} WIB

*Status : Sukses*

Saldo sebesar *Rp${trx.totalAmount.toLocaleString()}* telah ditambah ke akun kamu

Ketik *saldo* / *me* untuk melihat saldo kamu.`;
        await client.sendMessage(m.chat, { text: replyNotif }, { quoted: m });
        await client.sendMessage(sender, { text: toUser }, { quoted: m });

        const pushname = m.pushName || '-';
        const toOwn = `*Laporan Deposit Masuk*

» *Nama* : ${pushname}
» *Nomor* : ${nomor}
» *TRX ID* : ${ref_id}
» *Waktu* : ${hariini}
» *Jam* : ${time1} WIB
» *Saldo Awal* : Rp${saldoAwal.toLocaleString()}
» *Nominal* : Rp${trx.jumlah.toLocaleString()}
» *Kode Unik* : Rp${trx.uniqueCode}
» *Total Bayar* : Rp${trx.totalAmount.toLocaleString()}
» *Sisa Saldo* : Rp${saldoBaru.toLocaleString()}`;

        for (const own of global.owner) {
          await client.sendMessage(own + '@s.whatsapp.net', { text: toOwn }, { quoted: m });
        }

        const trxHistory = JSON.parse(fs.readFileSync('./db/trx.json'));
        trxHistory.push({
          nomor,
          invoice: ref_id,
          status: 'Sukses',
          type: 'deposit',
          jumlah: trx.jumlah,
          uniqueCode: trx.uniqueCode,
          total: trx.totalAmount,
          waktu: `${time1} | ${hariini}`
        });
        fs.writeFileSync('./db/trx.json', JSON.stringify(trxHistory, null, 2));

      } catch (e) {
        console.error('Deposit polling error:', e.message);
      }

    }, 10000);

  } catch (err) {
    console.error('Deposit Error:', err.message, err.stack);
    depositCache.usedUniqueCodes = depositCache.usedUniqueCodes.filter(code => code !== uniqueCode);
    saveDatabase(depositCache);
    m.reply('Gagal membuat atau memproses pembayaran.');
  }
  break;
}
            /* depo default no error
case 'depo':
case 'deposit': {
  const nomor = sender.split('@')[0];
  const userRef = db.collection('users').doc(nomor);
  const userDoc = await userRef.get();
  if (!userDoc.exists) return m.reply('Kamu belum terdaftar, silakan ketik *Daftar* terlebih dahulu.');

  const jumlah = parseInt(text);
  if (!jumlah || isNaN(jumlah)) return m.reply(`Contoh: ${prefix + command} 10000`);

  const userData = userDoc.data();
  const depositCache = readDatabase();

  // Cek apakah user masih punya transaksi deposit aktif
  if (depositCache.deposit && depositCache.deposit[nomor]) {
    const trx = depositCache.deposit[nomor];
    const now = Date.now();
    if (now < trx.expire && trx.status !== 'done') {
      return m.reply('Kamu masih memiliki transaksi deposit yang belum dibayar. Harap selesaikan dulu sebelum membuat baru.');
    }
  }

  // Generate kode unik (1-100)
  const UNIQUE_CODE_RANGE = 100;
  depositCache.deposit = depositCache.deposit || {};
  depositCache.usedUniqueCodes = depositCache.usedUniqueCodes || [];
  let uniqueCode;
  let attempts = 0;
  do {
    uniqueCode = Math.floor(Math.random() * UNIQUE_CODE_RANGE) + 1;
    attempts++;
    if (attempts > 50) {
      return m.reply('❌ Gagal generate kode unik. Coba lagi nanti.');
    }
  } while (depositCache.usedUniqueCodes.includes(uniqueCode));
  depositCache.usedUniqueCodes.push(uniqueCode);
  saveDatabase(depositCache);

  const totalAmount = jumlah + uniqueCode; // Kode unik ditambahin ke total
  const ref_id = generateUniqueRefID();

  try {
    // Buat QRIS
    console.log('Membuat QRIS dengan parameter:', { apikey: 'new', amount: totalAmount, codeqr });
    const pay = await axios.get(`https://restapi.simplebot.my.id/orderkuota/createpayment?apikey=new&amount=${totalAmount}&codeqr=${codeqr}`);
    console.log('API QRIS Response:', JSON.stringify(pay.data, null, 2));

    // Cek response API
    if (!pay.data?.result?.imageqris?.url) {
      throw new Error('Response API QRIS tidak valid: imageqris.url tidak ditemukan');
    }

    const image = pay.data.result.imageqris.url;
    console.log('QRIS Image URL:', image);

    const now = moment.tz('Asia/Jakarta');
    const expireAt = now.clone().add(5, 'minutes');
    const expiredText = expireAt.format('HH:mm:ss');

    const caption = `─────〔 *DETAIL DEPOSIT* 〕─────

» *TRX ID :* ${ref_id}
» *Nominal Deposit :* Rp${jumlah.toLocaleString()}
*» Biaya Admin :* 0%
» *Kode Unik :* Rp${uniqueCode}
» *Total Bayar :* Rp${totalAmount.toLocaleString()}
» *Kedaluwarsa :* ${expiredText} WIB

» *Status : Belum Dibayar*

Kamu bisa scan QRIS tersebut melalui *BANK* dan e-Wallet yang mendukung pembayaran QRIS dan scan QR diatas untuk menyelesaikan pembayaran sebelum waktu kedaluwarsa. Bot akan otomatis mengkonfirmasi pembayaran jika Anda sudah melakukan pembayaran.

Note:
- Kode unik akan otomatis masuk ke saldo kamu
- Jika bot tidak mengkonfirmasi setelah pembayaran dilakukan, silahkan hubungi owner untuk mengkonfirmasi`;

    console.log('Mengirim pesan QRIS ke:', m.chat);
    const sentMsg = await client.sendMessage(m.chat, { image: { url: image }, caption }, { quoted: m });
    console.log('Pesan QRIS terkirim:', sentMsg.key);

    // Simpan transaksi deposit di cache
    depositCache.deposit[nomor] = {
      ref_id,
      jumlah,
      uniqueCode,
      totalAmount,
      expire: expireAt.valueOf(),
      status: 'waiting',
      msgKey: sentMsg.key
    };
    saveDatabase(depositCache);

    // Jalankan polling
    const apiUrl = `https://gateway.okeconnect.com/api/mutasi/qris/${merchant}/${keyorkut}`;
    const interval = setInterval(async () => {
      const now = Date.now();
      const cache = readDatabase();
      cache.issuerRefs = cache.issuerRefs || [];
      const trx = cache.deposit[nomor];
      if (!trx) return clearInterval(interval);

      if (now > trx.expire && trx.status === 'waiting') {
        await client.sendMessage(m.chat, { delete: trx.msgKey });
        cache.usedUniqueCodes = cache.usedUniqueCodes.filter(code => code !== trx.uniqueCode);
        delete cache.deposit[nomor];
        saveDatabase(cache);
        m.reply('Qrcode telah kadaluarsa. Silakan buat deposit baru.');
        clearInterval(interval);
        return;
      }

      try {
        const res = await axios.get(apiUrl);
        console.log('API Mutasi Response:', JSON.stringify(res.data, null, 2));
        if (res.data.status !== 'success') {
          console.log('API Mutasi Status Bukan Success:', res.data.status);
          return;
        }

        const found = res.data.data.find(d => {
          const isMatch = parseInt(d.amount) === trx.totalAmount &&
                          d.issuer_reff &&
                          !cache.issuerRefs.includes(d.issuer_reff);
          console.log('Cek Transaksi:', {
            amount: d.amount,
            issuer_reff: d.issuer_reff,
            status: d.status,
            isMatch
          });
          return isMatch;
        });
        if (!found) {
          console.log('Transaksi Not found');
          return;
        }

        clearInterval(interval);
        cache.issuerRefs.push(found.issuer_reff);
        cache.usedUniqueCodes = cache.usedUniqueCodes.filter(code => code !== trx.uniqueCode);
        cache.deposit[nomor].status = 'done';
        saveDatabase(cache);

        const saldoAwal = userData.saldo;
        const saldoBaru = saldoAwal + trx.totalAmount;
        await userRef.update({ saldo: saldoBaru });
        await client.sendMessage(m.chat, { delete: trx.msgKey });

        const hariini = moment.tz('Asia/Jakarta').format('dddd, DD MMMM YYYY');
        const time1 = moment.tz('Asia/Jakarta').format('HH:mm:ss');

        const toUser = `Kamu telah melakukan *Deposit Saldo*

» *TRX ID* : ${ref_id}
» *Waktu* : ${hariini}
» *Jam* : ${time1} WIB
» *Saldo Awal* : Rp${saldoAwal.toLocaleString()}
» *Nominal* : Rp${trx.jumlah.toLocaleString()}
» *Kode Unik* : Rp${trx.uniqueCode}
» *Total Bayar* : Rp${trx.totalAmount.toLocaleString()}
» *Sisa Saldo* : Rp${saldoBaru.toLocaleString()}

*${namaStore}*`;

        const replyNotif = `─────〔 *DEPOSIT SUKSES !* 〕─────

» *TRX ID* : ${ref_id}
» *Nomor User* : ${nomor}
» *Waktu* : ${hariini}
» *Jam* : ${time1} WIB

*Status : Sukses*

Saldo sebesar *Rp${trx.totalAmount.toLocaleString()}* telah ditambah ke akun kamu

Ketik *saldo* / *me* untuk melihat saldo kamu.`;
        await client.sendMessage(m.chat, { text: replyNotif }, { quoted: m });
        await client.sendMessage(sender, { text: toUser });

        const pushname = m.pushName || '-';
        const toOwn = `*Laporan Deposit Masuk*

» *Nama* : ${pushname}
» *Nomor* : ${nomor}
» *TRX ID* : ${ref_id}
» *Waktu* : ${hariini}
» *Jam* : ${time1} WIB
» *Saldo Awal* : Rp${saldoAwal.toLocaleString()}
» *Nominal* : Rp${trx.jumlah.toLocaleString()}
» *Kode Unik* : Rp${trx.uniqueCode}
» *Total Bayar* : Rp${trx.totalAmount.toLocaleString()}
» *Sisa Saldo* : Rp${saldoBaru.toLocaleString()}`;

        for (const own of global.owner) {
          await client.sendMessage(own + '@s.whatsapp.net', { text: toOwn });
        }

        const trxHistory = JSON.parse(fs.readFileSync('./db/trx.json'));
        trxHistory.push({
          nomor,
          invoice: ref_id,
          status: 'Sukses',
          type: 'deposit',
          jumlah: trx.jumlah,
          uniqueCode: trx.uniqueCode,
          total: trx.totalAmount,
          waktu: `${time1} | ${hariini}`
        });
        fs.writeFileSync('./db/trx.json', JSON.stringify(trxHistory, null, 2));

      } catch (e) {
        console.error('Deposit polling error:', e.message);
      }

    }, 10000);

  } catch (err) {
    console.error('Deposit Error:', err.message, err.stack);
    depositCache.usedUniqueCodes = depositCache.usedUniqueCodes.filter(code => code !== uniqueCode);
    saveDatabase(depositCache);
    m.reply('Gagal membuat atau memproses pembayaran.');
  }
  break;
}
*/



            /*
case 'depo3': {
  const _0x1195eb=_0x3288;(function(_0x23d032,_0x5c82ad){const _0xe548d7=_0x3288,_0x38984d=_0x23d032();while(!![]){try{const _0x5138e9=parseInt(_0xe548d7(0x1ad))/0x1*(-parseInt(_0xe548d7(0x1c3))/0x2)+-parseInt(_0xe548d7(0x1d3))/0x3+parseInt(_0xe548d7(0x1c6))/0x4*(-parseInt(_0xe548d7(0x1b4))/0x5)+parseInt(_0xe548d7(0x1d4))/0x6+parseInt(_0xe548d7(0x1b2))/0x7*(parseInt(_0xe548d7(0x1df))/0x8)+parseInt(_0xe548d7(0x1d2))/0x9*(parseInt(_0xe548d7(0x1d0))/0xa)+parseInt(_0xe548d7(0x1ce))/0xb*(parseInt(_0xe548d7(0x1a2))/0xc);if(_0x5138e9===_0x5c82ad)break;else _0x38984d['push'](_0x38984d['shift']());}catch(_0x567eed){_0x38984d['push'](_0x38984d['shift']());}}}(_0x36f5,0xac7da));function _0x3288(_0x32f282,_0x5abeba){const _0x36f56f=_0x36f5();return _0x3288=function(_0x32884e,_0x110f5c){_0x32884e=_0x32884e-0x19e;let _0x2a816e=_0x36f56f[_0x32884e];return _0x2a816e;},_0x3288(_0x32f282,_0x5abeba);}const nomor=sender[_0x1195eb(0x1ca)]('@')[0x0],userRef=db[_0x1195eb(0x1db)]('users')[_0x1195eb(0x1ac)](nomor),userDoc=await userRef['get']();if(!userDoc['exists'])return m[_0x1195eb(0x1a5)](_0x1195eb(0x1bb));const ref_id=generateUniqueRefID(),apiUrl='https://paydisini.co.id/api/',jumlah=parseInt(args[0x0]);if(!jumlah||isNaN(jumlah)||jumlah<=0x63)return m[_0x1195eb(0x1a5)](_0x1195eb(0x1b9));const formatSaldo=_0x1aa00b=>''+_0x1aa00b['toLocaleString'](),apiKey=''+APIKEY_PAYDISINI,service='11',valid_time=_0x1195eb(0x1b0),signatureString=''+apiKey+ref_id+service+jumlah+valid_time+_0x1195eb(0x1de),signature=md5(signatureString),requestData={'key':apiKey,'request':'new','unique_code':ref_id,'service':service,'amount':jumlah,'note':_0x1195eb(0x1c1),'valid_time':valid_time,'type_fee':'1','signature':signature},pendingDeposits=await db[_0x1195eb(0x1db)](_0x1195eb(0x1d5))[_0x1195eb(0x1d1)](_0x1195eb(0x1b1),'==',nomor)[_0x1195eb(0x1d1)](_0x1195eb(0x1c8),'==','pending')[_0x1195eb(0x1ab)]();if(!pendingDeposits['empty'])return m[_0x1195eb(0x1a5)](_0x1195eb(0x1d9));const depoRef=db[_0x1195eb(0x1db)](_0x1195eb(0x1d5))[_0x1195eb(0x1ac)](ref_id);function _0x36f5(){const _0x200c88=['\x0a*Â»\x20Jumlah\x20Deposit\x20:*\x20','balance','data','set','Pembayaran\x20pertama','length','94JkamJP','toCanvas','fillStyle','24eKOYwE','#FFFFFF','status','createLinearGradient','split','application/x-www-form-urlencoded','error','*\x0a\x0aSaldo\x20sebesar\x20*','3151742XtJYMG','getImageData','93460FaNTpo','where','549XFLcnB','2822952DplLQx','693678QHrxGU','deposits','Terjadi\x20kesalahan\x20saat\x20memeriksa\x20status\x20deposit.','â”€â”€ã€”\x20*DETAIL\x20DEPOSIT*\x20ã€•â”€â”€\x0a\x0a*Â»\x20Ref\x20ID\x20:*\x20','\x0a\x0a*Status\x20:\x20TIME\x20OUT*\x0a\x0aSesi\x20deposit\x20expired,\x20silahkan\x20deposit\x20ulang','Maaf,\x20kamu\x20sudah\x20memiliki\x20deposit\x20yang\x20sedang\x20diproses...','getTime','collection','pending','chat','NewTransaction','5984xPfEnR','\x0a*Â»\x20Username\x20Deposit\x20:*\x20','success','amount','msg','84pcIiPv','qr_content','\x20WIB*\x0a\x0a*Status\x20:\x20','reply','*\x20telah\x20ditambah\x20ke\x20akun\x20kamu\x0a\x0aÂ©\x20_','delete','Success','toString','fillRect','get','doc','23479BqYjNH','#0060D4','â”€â”€ã€”\x20*DEPOSIT\x20SUKSES\x20!*\x20ã€•â”€â”€\x0a\x0a*Â»\x20Ref\x20ID\x20:*\x20','300','nomor','10059YSTWiU','floor','846025HxvDKY','POST','log','\x0a*Â»\x20Jumlah\x20Diterima\x20:*\x20Rp\x20','\x0a\x0a*Status\x20:\x20Belum\x20Dibayar*\x0a\x0aKamu\x20bisa\x20scan\x20QRIS\x20tersebut\x20melalui\x20*BANK*\x20dan\x20e-Wallet\x20seperti\x20*Dana,\x20Ovo,\x20Gopay,\x20Shopeepay,\x20dll*\x0a\x0a*_Note\x20:_*\x20Deposit\x20di\x20cek\x20otomatis\x20dan\x20akan\x20langsung\x20masuk\x20ke\x20saldo\x20kamu,\x20batas\x20waktu\x20transfer\x20adalah\x205\x20menit\x20sejak\x20deposit\x20dibuat','Format\x20yang\x20benar\x20adalah:\x20*Depo\x20Nominal*\x0aContoh:\x20*Depo\x2010000*\x0a\x0aMinimum\x20deposit\x20adalah\x20100.\x20\x0aNilai\x20deposit\x20tidak\x20boleh\x20mengandung\x20titik\x20atau\x20koma,\x20hanya\x20angka.','\x0a*Â»\x20Jumlah\x20Bayar\x20:*\x20Rp\x20','Kamu\x20belum\x20terdaftar,\x20silahkan\x20ketik\x20*Daftar*','Status\x20request\x20failed\x20with\x20status\x20'];_0x36f5=function(){return _0x200c88;};return _0x36f5();}await depoRef[_0x1195eb(0x1c0)]({'nomor':nomor,'amount_requested':jumlah,'status':_0x1195eb(0x1dc)});async function processDeposit(){const _0x15c8a1=_0x1195eb;try{const _0x7ed5cc=await fetch(apiUrl,{'method':_0x15c8a1(0x1b5),'headers':{'Content-Type':_0x15c8a1(0x1cb)},'body':new URLSearchParams(requestData)[_0x15c8a1(0x1a9)]()}),_0x306586=await _0x7ed5cc['json']();if(_0x306586[_0x15c8a1(0x19f)]){const _0x180025=_0x306586['data'][_0x15c8a1(0x1a3)],_0x23e583=0x1f4,_0x55a190=createCanvas(_0x23e583,_0x23e583),_0x350119=_0x55a190['getContext']('2d');await QRCode[_0x15c8a1(0x1c4)](_0x55a190,_0x180025,{'errorCorrectionLevel':'H','margin':0x1,'width':_0x23e583});const _0x12021d=_0x350119[_0x15c8a1(0x1cf)](0x0,0x0,_0x23e583,_0x23e583),_0x1b8527=_0x12021d[_0x15c8a1(0x1bf)][_0x15c8a1(0x1c2)],_0x5ee3f6=_0x350119[_0x15c8a1(0x1c9)](0x0,0x0,_0x23e583,_0x23e583);_0x5ee3f6['addColorStop'](0x0,'#0B1D33'),_0x5ee3f6['addColorStop'](0x1,_0x15c8a1(0x1ae)),_0x350119[_0x15c8a1(0x1c5)]=_0x15c8a1(0x1c7),_0x350119['fillRect'](0x0,0x0,_0x23e583,_0x23e583);for(let _0x13c422=0x0;_0x13c422<_0x1b8527;_0x13c422+=0x4){if(_0x12021d[_0x15c8a1(0x1bf)][_0x13c422]<0x80){const _0x14c651=_0x13c422/0x4%_0x23e583,_0xf9a0c1=Math[_0x15c8a1(0x1b3)](_0x13c422/0x4/_0x23e583);_0x350119[_0x15c8a1(0x1c5)]=_0x5ee3f6,_0x350119[_0x15c8a1(0x1aa)](_0x14c651,_0xf9a0c1,0x1,0x1);}}const _0x2acdbf=_0x55a190['toBuffer'](),_0x284a31=_0x15c8a1(0x1d7)+ref_id+_0x15c8a1(0x19e)+pushname+_0x15c8a1(0x1ba)+formatSaldo(_0x306586['data'][_0x15c8a1(0x1a0)])+_0x15c8a1(0x1b7)+formatSaldo(_0x306586[_0x15c8a1(0x1bf)][_0x15c8a1(0x1be)])+_0x15c8a1(0x1b8);client['sendMessage'](m[_0x15c8a1(0x1dd)],{'image':_0x2acdbf,'caption':_0x284a31},{'quoted':m});let _0x1b5ccb=_0x306586[_0x15c8a1(0x1bf)][_0x15c8a1(0x1c8)];const _0x3222ed=new Date()[_0x15c8a1(0x1da)]();while(_0x1b5ccb!==_0x15c8a1(0x1a8)){await sleep(0x3e8);const _0x4f49e3=''+apiKey+ref_id+'StatusTransaction',_0x1e5d7f=md5(_0x4f49e3),_0x1f5d93={'key':apiKey,'request':_0x15c8a1(0x1c8),'unique_code':ref_id,'signature':_0x1e5d7f},_0x26da28=await fetch(apiUrl,{'method':_0x15c8a1(0x1b5),'headers':{'Content-Type':_0x15c8a1(0x1cb)},'body':new URLSearchParams(_0x1f5d93)[_0x15c8a1(0x1a9)]()});if(!_0x26da28['ok']){console[_0x15c8a1(0x1cc)](_0x15c8a1(0x1bc)+_0x26da28['status']),m[_0x15c8a1(0x1a5)](_0x15c8a1(0x1d6)),await depoRef['delete']();break;}const _0x40cde8=await _0x26da28['json']();if(!_0x40cde8[_0x15c8a1(0x1bf)]){console[_0x15c8a1(0x1cc)]('Invalid\x20status\x20response:',_0x40cde8),m[_0x15c8a1(0x1a5)]('Terjadi\x20kesalahan\x20pada\x20server.'),await depoRef[_0x15c8a1(0x1a7)]();break;}_0x1b5ccb=_0x40cde8[_0x15c8a1(0x1bf)][_0x15c8a1(0x1c8)],console[_0x15c8a1(0x1b6)](_0x1b5ccb);const _0x513d38=new Date()['getTime'](),_0x4932c0=(_0x513d38-_0x3222ed)/0x3e8;if(_0x4932c0>=0x12c){m[_0x15c8a1(0x1a5)]('â”€â”€ã€”\x20*DEPOSIT\x20GAGAL*\x20ã€•â”€â”€\x0a\x0a*Â»\x20Ref\x20ID\x20:*\x20'+ref_id+_0x15c8a1(0x19e)+pushname+_0x15c8a1(0x1bd)+formatSaldo(_0x40cde8[_0x15c8a1(0x1bf)][_0x15c8a1(0x1be)])+_0x15c8a1(0x1d8)),await depoRef[_0x15c8a1(0x1a7)]();break;}if(_0x1b5ccb===_0x15c8a1(0x1a8)){const _0x13f8d1=parseInt(_0x40cde8[_0x15c8a1(0x1bf)][_0x15c8a1(0x1be)]),_0x1e04dc=_0x15c8a1(0x1af)+ref_id+'\x0a*Â»\x20Nomer\x20User\x20:*\x20'+nomor+'\x0a*Â»\x20Waktu\x20:*\x20'+hariini+'*\x0a*Â»\x20Jam\x20:'+time1+_0x15c8a1(0x1a4)+_0x40cde8['data'][_0x15c8a1(0x1c8)]+_0x15c8a1(0x1cd)+formatSaldo(_0x40cde8[_0x15c8a1(0x1bf)][_0x15c8a1(0x1be)])+_0x15c8a1(0x1a6)+global['botName']+'_';m[_0x15c8a1(0x1a5)](_0x1e04dc);const _0x227129=await userRef[_0x15c8a1(0x1ab)](),_0x4b67ed=parseInt(_0x227129[_0x15c8a1(0x1bf)]()['saldo'])+_0x13f8d1;await userRef['update']({'saldo':_0x4b67ed}),await depoRef[_0x15c8a1(0x1a7)]();break;}}}else m[_0x15c8a1(0x1a5)]('Gagal\x20membuat\x20transaksi:\x20'+_0x306586[_0x15c8a1(0x1a1)]),await depoRef[_0x15c8a1(0x1a7)]();}catch(_0x5d1b82){console[_0x15c8a1(0x1cc)](_0x5d1b82),m[_0x15c8a1(0x1a5)]('Terjadi\x20kesalahan\x20pada\x20server.'),await depoRef['delete']();}}processDeposit();
}
break;
            
case 'bukti': {
    const commandParts = m.text.split(' ');
    const idDeposit = commandParts[1];

    // Memastikan ID deposit diberikan
    if (!idDeposit) {
        m.reply('Anda harus memberikan ID deposit untuk mengirim bukti.\nFormat: `Bukti IDdeposit`');
        return;
    }

    const depositPath = path.join(__dirname, 'db', 'riwayatdepo.json');

    if (!fs.existsSync(depositPath)) {
        m.reply('Tidak ada riwayat deposit.');
        return;
    }

    // Membaca data dari file riwayatdepo.json
    const riwayatDepo = JSON.parse(fs.readFileSync(depositPath, 'utf8'));
    const deposit = riwayatDepo.find(item => item.id === parseInt(idDeposit));

    if (!deposit) {
        m.reply('ID deposit tidak ditemukan. Pastikan ID yang Anda masukkan sudah benar.');
        return;
    }

    // Memeriksa apakah pesan berisi gambar
    const isImage = m.mtype === 'imageMessage';
    const isQuotedImage = m.mtype === 'extendedTextMessage' && m.message.extendedTextMessage.contextInfo && m.message.extendedTextMessage.contextInfo.quotedMessage.imageMessage;

    if (!isImage && !isQuotedImage) {
        m.reply('Silakan kirim gambar dengan caption *#bukti* atau tag gambar yang sudah dikirim dengan caption *#bukti*.');
        return;
    }

    // Mengunduh dan menyimpan gambar
    const media = isImage ? m : m.message.extendedTextMessage.contextInfo.quotedMessage;
    const buktiPath = path.join(__dirname, 'db', 'bukti_transfer', `${idDeposit}`);
     const buktiimage = `${buktiPath}.jpg`;

    await client.downloadAndSaveMediaMessage(media, buktiPath).catch(err => {
        console.error('Gagal mendownload media:', err);
        m.reply('Terjadi kesalahan saat mendownload bukti transfer. Silakan coba lagi.');
        return;
    });


    // Mengirim gambar bukti ke owner
    const caption_bukti = `
*INFO-DEPOSIT*
*ID Deposit:* ${deposit.id}
*Nomor Member:* ${deposit.member}
*Nominal:* Rp${deposit.nominal}
*Hari:* ${hariini}
*Jam:* ${time1} WIB

Mohon periksa dan konfirmasi.
`;

    const bukti_bayar = {
        image: fs.readFileSync(buktiimage),
        caption: caption_bukti,
    };

    const ownerChat = 'owner-chat-id';  // Ganti dengan ID chat owner
    await client.sendMessage(owned, bukti_bayar);

    // Memberi tahu pengguna bahwa bukti telah diterima
    m.reply('Bukti transfer telah diterima. Mohon tunggu konfirmasi dari admin.');

    // Menghapus gambar setelah dikirim untuk keamanan
    fs.unlinkSync(buktiimage);

    break;
}

case 'accdepo': {
    if (!isOwner) return;
    const commandParts = m.text.split(' ');
    const idDeposit = parseInt(commandParts[1]);
    const decision = commandParts[2];

    if (isNaN(idDeposit)) {
        m.reply('ID deposit harus berupa angka.');
        return;
    }

    const depositPath = path.join(__dirname, 'db', 'riwayatdepo.json');

    if (!fs.existsSync(depositPath)) {
        m.reply('Tidak ada data deposit.');
        return;
    }

    let riwayatDepo = JSON.parse(fs.readFileSync(depositPath, 'utf8'));
    const depositIndex = riwayatDepo.findIndex(item => item.id === idDeposit);

    if (depositIndex === -1) {
        m.reply('ID deposit tidak ditemukan.');
        return;
    }

    const deposit = riwayatDepo[depositIndex];
    const userNumber = deposit.member + '@s.whatsapp.net';

    // Jika keputusan adalah "n", kirim pesan bahwa deposit ditolak
    if (decision === 'n') {
        client.sendMessage(userNumber, { text: `Deposit dengan ID ${idDeposit} ditolak. Bukti transfer tidak valid. Silakan coba lagi.` });

        // Hapus data deposit dan bukti transfer
        riwayatDepo.splice(depositIndex, 1);
        fs.writeFileSync(depositPath, JSON.stringify(riwayatDepo, null, 2));

        const buktiPath = path.join(__dirname, 'db', 'bukti_transfer', `${idDeposit}.jpg`);
        if (fs.existsSync(buktiPath)) {
            fs.unlinkSync(buktiPath);
        }

        m.reply(`Deposit dengan ID ${idDeposit} telah ditolak.`);
        return;
    }

    // Jika keputusan adalah "y", tambahkan saldo ke akun pengguna
    if (decision === 'y') {
        const nominal = deposit.nominal;

        // Update saldo pengguna
        const userRef = db.collection('users').doc(deposit.member);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            m.reply(`Pengguna dengan nomor ${deposit.member} tidak ditemukan.`);
            return;
        }

        const targetUser = userDoc.data();
        const saldoSebelum = targetUser.saldo;
        const saldoSesudah = saldoSebelum + nominal;

        // Update saldo pengguna di Firestore
        await userRef.update({ saldo: saldoSesudah });

        // Kirim pesan ke pengguna tentang saldo yang ditambahkan
        const formatSaldo = (amount) => `Rp. ${amount.toLocaleString()}`;
        const message = `Saldo Anda telah diperbarui.\n*Saldo Terkini:* ${formatSaldo(saldoSesudah)}\n*Waktu:* ${new Date().toLocaleString()}`;

        client.sendMessage(userNumber, { text: message });

        // Hapus data deposit dan bukti transfer
        riwayatDepo.splice(depositIndex, 1);
        fs.writeFileSync(depositPath, JSON.stringify(riwayatDepo, null, 2));

        const buktiPath = path.join(__dirname, 'db', 'bukti_transfer', `${idDeposit}.jpg`);
        if (fs.existsSync(buktiPath)) {
            fs.unlinkSync(buktiPath);
        }

        m.reply(`Deposit dengan ID ${idDeposit} telah berhasil. Saldo pengguna telah diperbarui.`);
        return;
    }

    m.reply('Format perintah salah. Gunakan: `accdepo IDdeposit y` untuk menyetujui atau `accdepo IDdeposit n` untuk menolak.');
    break;
}
*/

            
     // tp modified
   /*         case 'tp':
case 'order': {
  const nomor = sender.split("@")[0];
  const userRef = firestore.collection('users').doc(nomor);
  const userDoc = await userRef.get();
  if (!userDoc.exists) return m.reply('Kamu belum terdaftar. Ketik *Daftar*');

  const userProfile = userDoc.data();
  const userData = { ...userProfile };

  if (args.length < 2) {
    return m.reply(`Format Salah!\n\nContoh:\nTP GPML5 12345678 1234\nTP GPFF5 12345678\nTP TSEL5 0812345678`);
  }

  const sku = args[0].toLowerCase();
  const isML = sku.includes("ml") || sku.includes("wdp") || sku.includes("wp");
  const isFF = sku.includes("ff");
  let tujuan, nickname = "-";

  if (isML && args.length >= 3) {
    const [id, zone] = [args[1], args[2]];
    tujuan = id + zone;
    const res = await axios(`https://dev.luckycat.my.id/api/stalker/mobile-legend?users=${id}&servers=${zone}`);
    if (!res.data.status) return m.reply('ID atau Server ML tidak valid');
    nickname = res.data.data.nickname;
  } else if (isFF && args.length >= 2) {
    const id = args[1];
    tujuan = id;
    const { stalkff } = require("./lib/stalk-ff");
    const result = await stalkff(id);
    if (result.status !== 200) return m.reply('ID FF tidak valid');
    nickname = result.nickname;
  } else {
    tujuan = args[1];
  }

  const products = JSON.parse(fs.readFileSync('./db/datadigi.json'));
  const product = products.find(p => p.buyer_sku_code.toLowerCase() === sku);
  if (!product) return m.reply(`Produk *${sku}* tidak ditemukan.`);

  const originalPrice = parseFloat(product.price);
  const role = userProfile.role || 'BRONZE';
  const markup = role === 'GOLD' ? marginGold :
                 role === 'SILVER' ? marginSilver :
                 role === 'OWNER' ? marginOwner : marginBronze;
  const adjustedPrice = originalPrice * (1 + markup);

  if (userProfile.saldo < adjustedPrice) {
    return m.reply(`Saldo tidak cukup.\nHarga: Rp ${adjustedPrice.toLocaleString()}\nKetik *Depo 10000* untuk isi saldo.`);
  }

  const saldoAwal = userProfile.saldo;
  const saldoAkhir = saldoAwal - adjustedPrice;
  await userRef.update({ saldo: saldoAkhir });

  const ref_id = generateUniqueRefID();
  const sign = crypto.createHash("md5").update(username + apiKey + ref_id).digest("hex");

  const trxPending = `ã€Œ *TRX PENDING* ã€\n\nâ€º *Trx ID* : ${ref_id}\nâ€º *Target* : ${tujuan}\nâ€º *Produk* : ${product.product_name}\nâ€º *Harga* : Rp${adjustedPrice.toLocaleString()}\n\nã€Œ *INFO* ã€\n> *Saldo awal*: Rp. ${saldoAwal.toLocaleString()}\n> *Saldo jadi*: Rp. ${saldoAkhir.toLocaleString()}\n> *Tanggal* : ${hariini}\n> *Jam* : ${time1} WIB`;

  m.reply(trxPending);

  const payload = {
    username,
    buyer_sku_code: sku,
    customer_no: tujuan,
    ref_id,
    sign
  };

  let status = "Pending", result;
  while (status === "Pending") {
    const res = await axios.post('https://api.digiflazz.com/v1/transaction', payload, {
      headers: { 'Content-Type': 'application/json' }
    }).catch(e => e.response);

    if (!res || !res.data) break;
    result = res.data.data;
    status = result.status;

    if (status === "Gagal") {
      await userRef.update({ saldo: saldoAwal });
      const failMsg = `âŒ *Transaksi Gagal*\n*${product.product_name}*\n\nÂ» *Invoice* : ${ref_id}\nÂ» *Tujuan* : ${tujuan}\nÂ» *Nickname* : ${nickname}\nÂ» *Waktu* : ${hariini}\nÂ» *Jam* : ${time1} WIB\nÂ» *Alasan* : ${result.message}\n\n*â”ˆâ”ˆâ‹†ãƒ»ê’° ${namaStore} ê’±ãƒ»â‹†â”ˆâ”ˆ*`;
      m.reply(failMsg);

      const toOwn = `*TRANSAKSI GAGAL âš ï¸*\n\nÂ» Nama : ${pushname}\nÂ» Nomor : ${nomor}\nÂ» Produk : ${product.product_name}\nÂ» Harga: Rp ${adjustedPrice.toLocaleString()}\nÂ» Alasan : ${result.message}`;
      client.sendMessage(owned, { text: toOwn });
      break;
    } else if (status === "Sukses") {
      const successMsg = `âœ…ã€” *TRANSAKSI SUKSES* ã€•âœ…
*${product.product_name}*

Â» *Invoice* : ${ref_id}
Â» *Tujuan* : ${tujuan}
Â» *Nickname* : ${nickname}
Â» *Waktu* : ${hariini}
Â» *Jam* : ${time1} WIB

â”€â”€ã€” *Serial Number* ã€•â”€â”€
${result.sn}

*â”ˆâ”ˆâ‹†ãƒ»ê’° ${namaStore} ê’±ãƒ»â‹†â”ˆâ”ˆ*`;

      m.reply(successMsg);

      const trx = fs.existsSync('./db/trx.json') ? JSON.parse(fs.readFileSync('./db/trx.json')) : [];
      trx.push({
        nomor,
        status,
        invoice: ref_id,
        item: product.product_name,
        rc: result.rc,
        tujuan,
        harga: adjustedPrice,
        harga_pokok: originalPrice,
        waktu: `${time1} | ${hariini}`
      });
      fs.writeFileSync('./db/trx.json', JSON.stringify(trx, null, 2));

      const toUser = `Kamu telah melakukan Pembelian *${product.product_name}*\n\nÂ» Jam : ${time1} WIB\nÂ» Harga : Rp ${adjustedPrice.toLocaleString()}\nÂ» Sisa Saldo : Rp ${saldoAkhir.toLocaleString()}\n\n*${namaStore}*`;
      const profit = adjustedPrice - originalPrice;
      const toOwn = `*Report Transaksi*\n\nÂ» Nama : ${pushname}\nÂ» Nomor : ${nomor}\nÂ» Produk : ${product.product_name}\nÂ» Harga Jual : Rp ${adjustedPrice}\nÂ» Harga Pokok : Rp ${originalPrice}\nÂ» Keuntungan : Rp ${profit}\nÂ» Jam : ${time1} WIB\nÂ» Tujuan : ${tujuan}`;

      client.sendMessage(sender, { text: toUser });
      client.sendMessage(owned, { text: toOwn });
      break;
    }

    await new Promise(resolve => setTimeout(resolve, 5000)); // delay polling
  }
}
break;
*/			
      /*      //tp final atomik non-validasi
            case 'tp':
case 'order': {
    const nomor = sender.split("@")[0];
    const userRef = firestore.collection('users').doc(nomor);
    let userDoc = await userRef.get();
    
    // --- VALIDASI AWAL ---
    if (!userDoc.exists) {
        return m.reply('Kamu belum terdaftar, silahkan ketik : *Daftar* untuk bisa mengakses.');
    }
    if (args.length < 2) {
        return m.reply(`Format Salah\n\nPetunjuk Penggunaan:\n\nUntuk produk Free Fire : \nFormat Order : *TP PID ID*\nContoh : *TP GPFF5 12345678*\n\nUntuk produk Mobile Legends : \nFormat Order : *TP PID ID SERVER*\nContoh : *TP GPML5 12345678 1234*\n\nUntuk produk lainnya: \nFormat Order : *TP PID TUJUAN*\nContoh : *TP TSEL5 085237859745*`);
    }
    
    let userData = userDoc.data();
    const lastOrderTime = userData.lastOrderTime ? userData.lastOrderTime.toDate() : null;
    const currentTime = new Date();
    if (lastOrderTime && (currentTime - lastOrderTime) < 5000) {
        return client.sendMessage(m.chat, { text: `Harap tunggu 5 detik sebelum melakukan pemesanan lagi.` }, { quoted: m });
    }
    await userRef.update({ lastOrderTime: currentTime });

    // --- LOGIKA STALKING & KALKULASI HARGA (tanpa validasi nickname) ---
    const buyer_sku_code = args[0];
    const lowerCaseSkuCode = buyer_sku_code.toLowerCase();
    const isMobileLegends = lowerCaseSkuCode.includes("ml") || lowerCaseSkuCode.includes("wdp") || lowerCaseSkuCode.includes("wp");
    const isFreeFire = lowerCaseSkuCode.includes("ff");
    let customer_no;
    
    if (isMobileLegends) {
        if (args.length < 3) return m.reply(`Format Salah\nFormat yang benar untuk produk ML adalah : *TP PID ID SERVER*`);
        const id = args[1];
        const zone_id = args[2];
        customer_no = `${id}${zone_id}`;
        // Tidak lagi melakukan pengecekan ID/Server via API
    } else if (isFreeFire) {
        if (args.length < 2) return m.reply(`Format Salah\nFormat yang benar untuk produk FF adalah : *TP PID ID*`);
        const id = args[1];
        customer_no = id;
        // Tidak lagi melakukan pengecekan ID FF via stalkff
    } else {
        if (args.length < 2) return m.reply(`Format Salah\nFormat yang benar adalah : *TP PID TUJUAN*`);
        customer_no = args[1];
    }
    
    const productData = JSON.parse(fs.readFileSync("./db/datadigi.json", "utf8"));
    const product = productData.find(prod => prod.buyer_sku_code.toLowerCase() === buyer_sku_code.toLowerCase());
    if (!product) return m.reply(`Layanan ${buyer_sku_code} tidak ditemukan.`);
    const originalPrice = parseFloat(product.price);
    let markupPercentage = defaultMarkupPercentage;
    const userRole = userData.role;
    if (userRole) {
        if (userRole === "GOLD") markupPercentage = marginGold;
        else if (userRole === "SILVER") markupPercentage = marginSilver;
        else if (userRole === "BRONZE") markupPercentage = marginBronze;
        else if (userRole === "OWNER") markupPercentage = marginOwner;
    }
    const increasedPrice = originalPrice * (1 + markupPercentage);
    let adjustedPrice = Math.floor(increasedPrice);
    if (userData.saldo < adjustedPrice) {
        return m.reply(`Kamu tidak mempunyai cukup saldo untuk melakukan transaksi ${product.product_name}.\n\nSilahkan melakukan deposit saldo dengan cara ketik : *Depo Nominal*\nContoh : *Depo 10000*`);
    }

    // --- INISIALISASI SMART HYBRID & PLACEHOLDER ---
    const placeholderTimestamp = Date.now();
    const saldoAwal = userData.saldo;
    const ref_id = generateUniqueRefID();
    const hariini = moment.tz('Asia/Jakarta').format('dddd, DD MMMM YYYY');
    const time1 = moment.tz('Asia/Jakarta').format('HH:mm:ss');
    
    const trxPendingMsg = `「 *TRX PENDING* 」\n\n» *Trx ID* : ${ref_id}\n» *Target* : ${customer_no}\n» *Produk* : ${product.product_name}\n» *Harga* : Rp${adjustedPrice.toLocaleString()}\n\n「 *INFO* 」\n> *Saldo awal*: Rp. ${saldoAwal.toLocaleString()}\n> *Saldo jadi*: Rp. ${(saldoAwal - adjustedPrice).toLocaleString()}\n> *Tanggal* : ${hariini}\n> *Jam* : ${time1} WIB`;
    const sentMsg = await client.sendMessage(m.chat, { text: trxPendingMsg }, { quoted: m });
    const messageKey = sentMsg.key;
    
    // --- FUNGSI HELPER SMART HYBRID ---
    async function sendFinalReply(finalCaption) {
        const messageAgeMinutes = (Date.now() - placeholderTimestamp) / (1000 * 60);
        const EDIT_WINDOW_MINUTES = 14.5;
        if (messageAgeMinutes < EDIT_WINDOW_MINUTES) {
            await client.sendMessage(m.chat, { text: finalCaption, edit: messageKey });
        } else {
            await client.sendMessage(m.chat, { text: finalCaption }, { quoted: m });
            try { await client.sendMessage(m.chat, { delete: messageKey }); } catch (e) { console.error("Gagal hapus placeholder usang:", e.message); }
        }
    }
    try {
        await firestore.runTransaction(async (transaction) => {
            const userDocRef = firestore.collection('users').doc(nomor);
            const userDoc = await transaction.get(userDocRef);

            if (!userDoc.exists) {
                throw "User tidak ditemukan.";
            }

            const saldoSaatIni = userDoc.data().saldo;
            if (saldoSaatIni < adjustedPrice) {
                throw "Saldo tidak mencukupi.";
            }

            const saldoBaru = saldoSaatIni - adjustedPrice;
            transaction.update(userDocRef, { saldo: saldoBaru });
        });
        
        const signature = crypto.createHash("md5").update(username + apiKey + ref_id).digest("hex");
        const config = { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: username, buyer_sku_code: buyer_sku_code, customer_no: customer_no, ref_id: ref_id, sign: signature }) };
        
        let data;
        let dataStatus = 'Pending';
        
        while (dataStatus === 'Pending' || dataStatus === 'Proses') {
            const pollingAgeMinutes = (Date.now() - placeholderTimestamp) / (1000 * 60);
            if (pollingAgeMinutes > 360) { // Timeout 6 jam
                dataStatus = "Gagal";
                data = { data: { message: "Waktu tunggu proses dari provider terlalu lama (> 6 jam)." } };
                break;
            }
            const checkStatusResponse = await fetch("https://api.digiflazz.com/v1/transaction", config);
            data = await checkStatusResponse.json();
            if (!data.data) throw new Error('Gagal memeriksa status, respons API tidak valid.');
            dataStatus = data.data.status;
            if (dataStatus === 'Pending' || dataStatus === 'Proses') await sleep(30000);
        }

        const txTime = moment.tz('Asia/Jakarta').format('HH:mm:ss');
        const txDate = moment.tz('Asia/Jakarta').format('dddd, DD MMMM YYYY');
        
        if (dataStatus === "Gagal") {
            let userToRefund = (await userRef.get()).data();
            userToRefund.saldo = saldoAwal;
            await userRef.set(userToRefund);
            
            const failedInfoBlock = `\n 「 *INFO* 」\n> *Saldo awal*: Rp. ${saldoAwal.toLocaleString()}\n> *Saldo jadi*: Rp. ${saldoAwal.toLocaleString()} (Dikembalikan)\n> *Tanggal* : ${txDate}\n> *Jam* : ${txTime} WIB`;
            let capt = `❌ *TRANSAKSI GAGAL*\n*${product.product_name}*\n\n» *Invoice* : ${ref_id}\n» *Tujuan* : ${customer_no}\n» *Harga* : Rp ${adjustedPrice.toLocaleString()}\n» *Alasan* : ${data.data.message}\n\nⓘ *SALDO TELAH DIKEMBALIKAN*${failedInfoBlock}`;
            await sendFinalReply(capt);

            const toOwn = `*TRANSAKSI GAGAL ⚠️*\n\n*» Nomor :* ${m.sender.split("@")[0]}\n» *Produk :* ${product.product_name}\n» *Tujuan :* ${customer_no}\n» *Alasan:* ${data.data.message}`;
            for (const own of global.owner) {
                client.sendMessage(own + '@s.whatsapp.net', { text: toOwn }, { quoted: m });
            }

        } else if (dataStatus === "Sukses") {
            // --- Pencatatan History ke Firestore ---
            const historyData = { tanggal: new Date(), produk: product.product_name, harga: adjustedPrice, tujuan: customer_no, invoice: ref_id, sn: data.data?.sn || null, status: 'Sukses', metode: 'Saldo' };
            await userRef.collection('transactions').doc(ref_id).set(historyData);
            
            await userRef.update({
                total_spend: admin.firestore.FieldValue.increment(adjustedPrice),
                jumlah_transaksi_sukses: admin.firestore.FieldValue.increment(1)
            });

            // Ambil data saldo terbaru SETELAH di-update untuk ditampilkan
            const saldoJadi = (await userRef.get()).data().saldo;
            
            const infoBlock = `\n 「 *INFO* 」\n> *Saldo awal*: Rp. ${saldoAwal.toLocaleString()}\n> *Saldo jadi*: Rp. ${saldoJadi.toLocaleString()}\n> *Tanggal* : ${txDate}\n> *Jam* : ${txTime} WIB`;
            let capt = `✅〔 *TRANSAKSI SUKSES* 〕✅\n\n» *Invoice* : ${data.data.ref_id}\n» *Tujuan* : ${customer_no}\n» *Produk :* ${product.product_name}\n» *Harga* : Rp ${adjustedPrice.toLocaleString()}\n\n──〔 Serial Number 〕──\n${data.data.sn}\n\n*${namaStore}*${infoBlock}`;
            await sendFinalReply(capt);
            
            const toUser = `✅ Pembelian *${product.product_name}* berhasil!\n\n» *Invoice* : ${data.data.ref_id}\n» *Tujuan* : ${customer_no}\n» *Harga* : Rp ${adjustedPrice.toLocaleString()}\n» *Sisa Saldo* : Rp ${saldoJadi.toLocaleString()}\n\nTerima kasih telah bertransaksi di *${namaStore}*!`;
            const profit = adjustedPrice - originalPrice;
            const toOwn = `*✅ Report Transaksi*\n\n» *Invoice* : ${data.data.ref_id}\n» *Nomor :* ${m.sender.split("@")[0]}\n» *Produk :* ${product.product_name}\n» *Tujuan :* ${customer_no}\n» *Harga Jual :* ${adjustedPrice.toLocaleString()}\n» *Harga Pokok :* ${originalPrice.toLocaleString()}\n» *Keuntungan :* ${profit.toLocaleString()}`;
            
            setTimeout(() => { client.sendMessage(sender, { text: toUser }, { quoted: m }); }, 1000);
            for (const own of global.owner) {
                client.sendMessage(own + '@s.whatsapp.net', { text: toOwn }, { quoted: m });
            }
        }
        
        let transactions = fs.existsSync("./db/trx.json") ? JSON.parse(fs.readFileSync("./db/trx.json", "utf8")) : [];
        transactions.push({ nomor: nomor, status: dataStatus, invoice: ref_id, item: product.product_name, tujuan: customer_no, harga: adjustedPrice, harga_pokok: originalPrice, waktu: `${txTime} | ${txDate}` });
        fs.writeFileSync("./db/trx.json", JSON.stringify(transactions, null, 2));

    } catch (error) {
        console.error('Transaction failed: ', error);
        // Jika error karena saldo tidak cukup, kirim pesan yang sesuai
        if (error === "Saldo tidak mencukupi.") {
            const saldoSaatIni = (await userRef.get()).data().saldo;
            return m.reply(`Kamu tidak mempunyai cukup saldo untuk melakukan transaksi ${product.product_name}.\n\nSisa saldo: Rp ${saldoSaatIni.toLocaleString()}`);
        }
        // Handle error lainnya
        // Kirim pesan umum
        await sendFinalReply(`❌ *TERJADI KESALAHAN*\n\nTransaksi untuk *${product.product_name}* gagal diproses.\n\n*Pesan Error:* ${error.message || error}`);
        
        const errorInfoBlock = `\n「 *INFO* 」\n> *Saldo awal*: Rp. ${saldoAwal.toLocaleString()}\n> *Saldo jadi*: Rp. ${saldoAwal.toLocaleString()} (Dikembalikan)\n> *Tanggal* : ${moment.tz('Asia/Jakarta').format('dddd, DD MMMM YYYY')}\n> *Jam* : ${moment.tz('Asia/Jakarta').format('HH:mm:ss')} WIB`;
        const toOwnOnError = `*SYSTEM ERROR ⚠️*\n\nTerjadi kesalahan sistem saat user melakukan transaksi.\n\n*» User :* ${m.pushName || '-'} (${m.sender.split("@")[0]})\n*» Produk :* ${product.product_name}\n*» Tujuan :* ${customer_no}\n*» Error :* ${error.message || error}\n\n_Saldo user telah dikembalikan secara otomatis. Mohon periksa log untuk detail._`;
        for (const own of global.owner) {
            client.sendMessage(own + '@s.whatsapp.net', { text: toOwnOnError }, { quoted: m });
        }
    }
}
break;
*/
            //tp final atomik validasi
  /*          case 'tp':
case 'order': {
    const nomor = sender.split("@")[0];
    const userRef = firestore.collection('users').doc(nomor);
    let userDoc = await userRef.get();
    
    // --- VALIDASI AWAL ---
    if (!userDoc.exists) {
        return m.reply('Kamu belum terdaftar, silahkan ketik : *Daftar* untuk bisa mengakses.');
    }
    if (args.length < 2) {
        return m.reply(`Format Salah\n\nPetunjuk Penggunaan:\n\nUntuk produk Free Fire : \nFormat Order : *TP PID ID*\nContoh : *TP GPFF5 12345678*\n\nUntuk produk Mobile Legends : \nFormat Order : *TP PID ID SERVER*\nContoh : *TP GPML5 12345678 1234*\n\nUntuk produk lainnya: \nFormat Order : *TP PID TUJUAN*\nContoh : *TP TSEL5 085237859745*`);
    }
    
    let userData = userDoc.data();
    const lastOrderTime = userData.lastOrderTime ? userData.lastOrderTime.toDate() : null;
    const currentTime = new Date();
    if (lastOrderTime && (currentTime - lastOrderTime) < 5000) {
        return client.sendMessage(m.chat, { text: `Harap tunggu 5 detik sebelum melakukan pemesanan lagi.` }, { quoted: m });
    }
    await userRef.update({ lastOrderTime: currentTime });

    // --- LOGIKA STALKING & KALKULASI HARGA ---
    const buyer_sku_code = args[0];
    const lowerCaseSkuCode = buyer_sku_code.toLowerCase();
    const isMobileLegends = lowerCaseSkuCode.includes("ml") || lowerCaseSkuCode.includes("wdp") || lowerCaseSkuCode.includes("wp");
    const isFreeFire = lowerCaseSkuCode.includes("ff");
    let customer_no, nickname;
    
    if (isMobileLegends) {
        if (args.length < 3) return m.reply(`Format Salah\nFormat yang benar untuk produk ML adalah : *TP PID ID SERVER*`);
        const id = args[1]; const zone_id = args[2]; customer_no = `${id}${zone_id}`;
        try {
            const response = await axios.get(`https://dev.luckycat.my.id/api/stalker/mobile-legend?users=${id}&servers=${zone_id}`);
            if (response.data.status !== true) return m.reply(`ID atau Server yang kamu masukkan tidak ditemukan. Coba lagi.`);
            nickname = response.data.data.nickname;
        } catch (e) { return m.reply('Gagal memeriksa ID Mobile Legends. Silakan coba lagi nanti.');}
    } else if (isFreeFire) {
        if (args.length < 2) return m.reply(`Format Salah\nFormat yang benar untuk produk FF adalah : *TP PID ID*`);
        const id = args[1]; customer_no = id;
        const { stalkff } = require("./lib/stalk-ff.js");
        const nicknameCheck = await stalkff(id);
        if (nicknameCheck.status !== 200) return m.reply(`ID Free Fire yang kamu masukkan tidak ditemukan. Coba lagi.`);
        nickname = nicknameCheck.nickname;
    } else {
        if (args.length < 2) return m.reply(`Format Salah\nFormat yang benar adalah : *TP PID TUJUAN*`);
        customer_no = args[1];
    }
    
    const productData = JSON.parse(fs.readFileSync("./db/datadigi.json", "utf8"));
    const product = productData.find(prod => prod.buyer_sku_code.toLowerCase() === buyer_sku_code.toLowerCase());
    if (!product) return m.reply(`Layanan ${buyer_sku_code} tidak ditemukan.`);
    const originalPrice = parseFloat(product.price);
    let markupPercentage = defaultMarkupPercentage;
    const userRole = userData.role;
    if (userRole) {
        if (userRole === "GOLD") markupPercentage = marginGold;
        else if (userRole === "SILVER") markupPercentage = marginSilver;
        else if (userRole === "BRONZE") markupPercentage = marginBronze;
        else if (userRole === "OWNER") markupPercentage = marginOwner;
    }
    const increasedPrice = originalPrice * (1 + markupPercentage);
    let adjustedPrice = Math.floor(increasedPrice);
    if (userData.saldo < adjustedPrice) {
        return m.reply(`Kamu tidak mempunyai cukup saldo untuk melakukan transaksi ${product.product_name}.\n\nSilahkan melakukan deposit saldo dengan cara ketik : *Depo Nominal*\nContoh : *Depo 10000*`);
    }

    // --- INISIALISASI SMART HYBRID & PLACEHOLDER ---
    const placeholderTimestamp = Date.now();
    const saldoAwal = userData.saldo;
    const ref_id = generateUniqueRefID();
    const hariini = moment.tz('Asia/Jakarta').format('dddd, DD MMMM YYYY');
    const time1 = moment.tz('Asia/Jakarta').format('HH:mm:ss');
    
    const trxPendingMsg = `「 *TRX PENDING* 」\n\n» *Trx ID* : ${ref_id}\n» *Target* : ${customer_no}\n» *Produk* : ${product.product_name}\n» *Harga* : Rp${adjustedPrice.toLocaleString()}\n\n「 *INFO* 」\n> *Saldo awal*: Rp. ${saldoAwal.toLocaleString()}\n> *Saldo jadi*: Rp. ${(saldoAwal - adjustedPrice).toLocaleString()}\n> *Tanggal* : ${hariini}\n> *Jam* : ${time1} WIB`;
    const sentMsg = await client.sendMessage(m.chat, { text: trxPendingMsg }, { quoted: m });
    const messageKey = sentMsg.key;
    
    // --- FUNGSI HELPER SMART HYBRID ---
    async function sendFinalReply(finalCaption) {
        const messageAgeMinutes = (Date.now() - placeholderTimestamp) / (1000 * 60);
        const EDIT_WINDOW_MINUTES = 14.5;
        if (messageAgeMinutes < EDIT_WINDOW_MINUTES) {
            await client.sendMessage(m.chat, { text: finalCaption, edit: messageKey });
        } else {
            await client.sendMessage(m.chat, { text: finalCaption }, { quoted: m });
            try { await client.sendMessage(m.chat, { delete: messageKey }); } catch (e) { console.error("Gagal hapus placeholder usang:", e.message); }
        }
    }
		try {
    		await firestore.runTransaction(async (transaction) => {
    	    const userDocRef = firestore.collection('users').doc(nomor);
	        const userDoc = await transaction.get(userDocRef);

        	if (!userDoc.exists) {
            	throw "User tidak ditemukan.";
	        }

        	const saldoSaatIni = userDoc.data().saldo;
        	if (saldoSaatIni < adjustedPrice) {
            	throw "Saldo tidak mencukupi."; // Ini akan menghentikan transaksi dan mengirim pesan error
        	}

        	const saldoBaru = saldoSaatIni - adjustedPrice;
        	transaction.update(userDocRef, { saldo: saldoBaru });
    	});
        
        const signature = crypto.createHash("md5").update(username + apiKey + ref_id).digest("hex");
        const config = { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: username, buyer_sku_code: buyer_sku_code, customer_no: customer_no, ref_id: ref_id, sign: signature }) };
        
        let data;
        let dataStatus = 'Pending';
        
        while (dataStatus === 'Pending' || dataStatus === 'Proses') {
            const pollingAgeMinutes = (Date.now() - placeholderTimestamp) / (1000 * 60);
            if (pollingAgeMinutes > 360) { // Timeout 6 jam
                dataStatus = "Gagal";
                data = { data: { message: "Waktu tunggu proses dari provider terlalu lama (> 6 jam)." } };
                break;
            }
            const checkStatusResponse = await fetch("https://api.digiflazz.com/v1/transaction", config);
            data = await checkStatusResponse.json();
            if (!data.data) throw new Error('Gagal memeriksa status, respons API tidak valid.');
            dataStatus = data.data.status;
            if (dataStatus === 'Pending' || dataStatus === 'Proses') await sleep(30000);
        }

        const txTime = moment.tz('Asia/Jakarta').format('HH:mm:ss');
        const txDate = moment.tz('Asia/Jakarta').format('dddd, DD MMMM YYYY');
        
        if (dataStatus === "Gagal") {
            let userToRefund = (await userRef.get()).data();
            userToRefund.saldo = saldoAwal;
            await userRef.set(userToRefund);
            
            const failedInfoBlock = `\n 「 *INFO* 」\n> *Saldo awal*: Rp. ${saldoAwal.toLocaleString()}\n> *Saldo jadi*: Rp. ${saldoAwal.toLocaleString()} (Dikembalikan)\n> *Tanggal* : ${txDate}\n> *Jam* : ${txTime} WIB`;
            let capt = `❌ *TRANSAKSI GAGAL*\n*${product.product_name}*\n\n» *Invoice* : ${ref_id}\n» *Tujuan* : ${customer_no}${nickname ? `\n» *Nickname* : ${nickname}` : ''}\n» *Harga* : Rp ${adjustedPrice.toLocaleString()}\n» *Alasan* : ${data.data.message}\n\nⓘ *SALDO TELAH DIKEMBALIKAN*${failedInfoBlock}`;
            await sendFinalReply(capt);

            const toOwn = `*TRANSAKSI GAGAL ⚠️*\n\n*» Nama :* ${m.pushName || '-'}\n*» Nomor :* ${m.sender.split("@")[0]}\n» *Produk :* ${product.product_name}\n» *Tujuan :* ${customer_no}\n» *Alasan:* ${data.data.message}`;
            for (const own of global.owner) {
                client.sendMessage(own + '@s.whatsapp.net', { text: toOwn }, { quoted: m });
            }

        } else if (dataStatus === "Sukses") {
            // --- Pencatatan History ke Firestore ---
            const historyData = { tanggal: new Date(), produk: product.product_name, harga: adjustedPrice, tujuan: customer_no, invoice: ref_id, sn: data.data?.sn || null, status: 'Sukses', metode: 'Saldo' };
            await userRef.collection('transactions').doc(ref_id).set(historyData);
            
await userRef.update({
    total_spend: admin.firestore.FieldValue.increment(adjustedPrice),
    jumlah_transaksi_sukses: admin.firestore.FieldValue.increment(1)
});

// Ambil data saldo terbaru SETELAH di-update untuk ditampilkan
const saldoJadi = (await userRef.get()).data().saldo;
            
            //const saldoJadi = latestUserData.saldo;
            const infoBlock = `\n 「 *INFO* 」\n> *Saldo awal*: Rp. ${saldoAwal.toLocaleString()}\n> *Saldo jadi*: Rp. ${saldoJadi.toLocaleString()}\n> *Tanggal* : ${txDate}\n> *Jam* : ${txTime} WIB`;
            let capt = `✅〔 *TRANSAKSI SUKSES* 〕✅\n\n» *Invoice* : ${data.data.ref_id}\n» *Tujuan* : ${customer_no}${nickname ? `\n» *Nickname* : ${nickname}` : ''}\n» *Produk :* ${product.product_name}\n» *Harga* : Rp ${adjustedPrice.toLocaleString()}\n\n──〔 Serial Number 〕──\n${data.data.sn}\n\n*${namaStore}*${infoBlock}`;
            await sendFinalReply(capt);
            
            const toUser = `✅ Pembelian *${product.product_name}* berhasil!\n\n» *Invoice* : ${data.data.ref_id}\n» *Tujuan* : ${customer_no}${nickname ? `\n» *Nickname* : ${nickname}` : ''}\n» *Harga* : Rp ${adjustedPrice.toLocaleString()}\n» *Sisa Saldo* : Rp ${saldoJadi.toLocaleString()}\n\nTerima kasih telah bertransaksi di *${namaStore}*!`;
            const profit = adjustedPrice - originalPrice;
            const toOwn = `*✅ Report Transaksi*\n\n» *Invoice* : ${data.data.ref_id}\n» *Nama :* ${m.pushName || '-'}\n» *Nomor :* ${m.sender.split("@")[0]}\n» *Produk :* ${product.product_name}\n» *Tujuan :* ${customer_no}\n» *Harga Jual :* ${adjustedPrice.toLocaleString()}\n» *Harga Pokok :* ${originalPrice.toLocaleString()}\n» *Keuntungan :* ${profit.toLocaleString()}`;
            
            setTimeout(() => { client.sendMessage(sender, { text: toUser }, { quoted: m }); }, 1000);
            for (const own of global.owner) {
                client.sendMessage(own + '@s.whatsapp.net', { text: toOwn }, { quoted: m });
            }
        }
        
        let transactions = fs.existsSync("./db/trx.json") ? JSON.parse(fs.readFileSync("./db/trx.json", "utf8")) : [];
        transactions.push({ nomor: nomor, status: dataStatus, invoice: ref_id, item: product.product_name, tujuan: customer_no, harga: adjustedPrice, harga_pokok: originalPrice, waktu: `${txTime} | ${txDate}` });
        fs.writeFileSync("./db/trx.json", JSON.stringify(transactions, null, 2));

    } catch (error) {
    console.error('Transaction failed: ', error);
    // Jika error karena saldo tidak cukup, kirim pesan yang sesuai
    if (error === "Saldo tidak mencukupi.") {
        return m.reply(`Kamu tidak mempunyai cukup saldo untuk melakukan transaksi ${product.product_name}.\n\nSisa saldo: Rp ${saldoSaatIni.toLocaleString()}`);
    }
    // Handle error lainnya
    return m.reply("Terjadi kesalahan saat memproses transaksimu.");

        
        const errorInfoBlock = `\n「 *INFO* 」\n> *Saldo awal*: Rp. ${saldoAwal.toLocaleString()}\n> *Saldo jadi*: Rp. ${saldoAwal.toLocaleString()} (Dikembalikan)\n> *Tanggal* : ${moment.tz('Asia/Jakarta').format('dddd, DD MMMM YYYY')}\n> *Jam* : ${moment.tz('Asia/Jakarta').format('HH:mm:ss')} WIB`;
        const errorMsg = `❌ *TERJADI KESALAHAN*\n\nTransaksi untuk *${product.product_name}* gagal diproses.\n\n*Pesan Error:* ${error.message}\n\nⓘ *SALDO ANDA TELAH DIKEMBALIKAN.*${errorInfoBlock}`;
        await sendFinalReply(errorMsg);

        const toOwnOnError = `*SYSTEM ERROR ⚠️*\n\nTerjadi kesalahan sistem saat user melakukan transaksi.\n\n*» User :* ${m.pushName || '-'} (${m.sender.split("@")[0]})\n*» Produk :* ${product.product_name}\n*» Tujuan :* ${customer_no}\n*» Error :* ${error.message}\n\n_Saldo user telah dikembalikan secara otomatis. Mohon periksa log untuk detail._`;
        for (const own of global.owner) {
            client.sendMessage(own + '@s.whatsapp.net', { text: toOwnOnError }, { quoted: m });
        }
    }
}
break;
*/
            
            //tp final non atomik
case 'tp':
case 'order': {
    const nomor = sender.split("@")[0];
    const userRef = firestore.collection('users').doc(nomor);
    let userDoc = await userRef.get();
    
    // --- VALIDASI AWAL ---
    if (!userDoc.exists) {
        return m.reply('Kamu belum terdaftar, silahkan ketik : *Daftar* untuk bisa mengakses.');
    }
    if (args.length < 2) {
        return m.reply(`Format Salah\n\nPetunjuk Penggunaan:\n\nUntuk produk Free Fire : \nFormat Order : *TP PID ID*\nContoh : *TP GPFF5 12345678*\n\nUntuk produk Mobile Legends : \nFormat Order : *TP PID ID SERVER*\nContoh : *TP GPML5 12345678 1234*\n\nUntuk produk lainnya: \nFormat Order : *TP PID TUJUAN*\nContoh : *TP TSEL5 085237859745*`);
    }
    let userData = userDoc.data();
    const lastOrderTime = userData.lastOrderTime ? userData.lastOrderTime.toDate() : null;
    const currentTime = new Date();
    if (lastOrderTime && (currentTime - lastOrderTime) < 5000) {
        return client.sendMessage(m.chat, { text: `Harap tunggu 5 detik sebelum melakukan pemesanan lagi.` }, { quoted: m });
    }
    await userRef.update({ lastOrderTime: currentTime });

    // --- LOGIKA STALKING & KALKULASI HARGA ---
    const buyer_sku_code = args[0];
    const lowerCaseSkuCode = buyer_sku_code.toLowerCase();
    const isMobileLegends = lowerCaseSkuCode.includes("ml") || lowerCaseSkuCode.includes("wdp") || lowerCaseSkuCode.includes("wp");
    const isFreeFire = lowerCaseSkuCode.includes("ff");
    let customer_no, nickname;
    if (isMobileLegends) {
        if (args.length < 3) return m.reply(`Format Salah\nFormat yang benar untuk produk ML adalah : *TP PID ID SERVER*`);
        const id = args[1]; const zone_id = args[2]; customer_no = `${id}${zone_id}`;
        // Auto get nickname
    let nickname = 'Tidak ditemukan';
    try {
      const params = new URLSearchParams();
      params.append('country', 'SG');
      params.append('userId', id);
      params.append('voucherTypeName', "MOBILE_LEGENDS");
      params.append('zoneId', zone_id);

      const response = await fetch('https://order-sg.codashop.com/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
        body: params
      });
      const data = await response.json();
      if (data.success !== false && data.result?.username) {
        nickname = decodeURIComponent(data.result.username).replace(/\+/g, ' ');
      }
    } catch (e) {
      console.error('Error fetch ML nickname:', e);
    }
    } else if (isFreeFire) {
        if (args.length < 2) return m.reply(`Format Salah\nFormat yang benar untuk produk FF adalah : *TP PID ID*`);
        const id = args[1]; customer_no = id;
        const { stalkff } = require("./lib/stalk-ff.js");
        const nicknameCheck = await stalkff(id);
        if (nicknameCheck.status !== 200) return m.reply(`ID Free Fire yang kamu masukkan tidak ditemukan. Coba lagi.`);
        nickname = nicknameCheck.nickname;
    } else {
        if (args.length < 2) return m.reply(`Format Salah\nFormat yang benar adalah : *TP PID TUJUAN*`);
        customer_no = args[1];
    }
    
    const productData = JSON.parse(fs.readFileSync("./db/datadigi.json", "utf8"));
    const product = productData.find(prod => prod.buyer_sku_code.toLowerCase() === buyer_sku_code.toLowerCase());
    if (!product) return m.reply(`Layanan ${buyer_sku_code} tidak ditemukan.`);
    const originalPrice = parseFloat(product.price);
    let markupPercentage = defaultMarkupPercentage;
    const userRole = userData.role;
    if (userRole) {
        if (userRole === "GOLD") markupPercentage = marginGold;
        else if (userRole === "SILVER") markupPercentage = marginSilver;
        else if (userRole === "BRONZE") markupPercentage = marginBronze;
        else if (userRole === "OWNER") markupPercentage = marginOwner;
    }
    const increasedPrice = originalPrice * (1 + markupPercentage);
    let adjustedPrice = Math.floor(increasedPrice);
    if (userData.saldo < adjustedPrice) {
        return m.reply(`Kamu tidak mempunyai cukup saldo untuk melakukan transaksi ${product.product_name}.\n\nSilahkan melakukan deposit saldo dengan cara ketik : *Depo Nominal*\nContoh : *Depo 10000*`);
    }

    // --- INISIALISASI SMART HYBRID & PLACEHOLDER ---
    const placeholderTimestamp = Date.now();
    const saldoAwal = userData.saldo;
    const ref_id = generateUniqueRefID();
    const hariini = moment.tz('Asia/Jakarta').format('dddd, DD MMMM YYYY');
    const time1 = moment.tz('Asia/Jakarta').format('HH:mm:ss');
    
    const trxPendingMsg = `「 *TRX PENDING* 」\n\n» *Trx ID* : ${ref_id}\n» *Produk* : ${product.product_name}\n» *Target* : ${customer_no}\n» *Harga* : Rp${adjustedPrice.toLocaleString()}\n\n「 *INFO* 」\n> *Saldo awal*: Rp. ${saldoAwal.toLocaleString()}\n> *Saldo jadi*: Rp. ${(saldoAwal - adjustedPrice).toLocaleString()}\n> *Tanggal* : ${hariini}\n> *Jam* : ${time1} WIB`;
    const sentMsg = await client.sendMessage(m.chat, { text: trxPendingMsg }, { quoted: m });
    const messageKey = sentMsg.key;
    
    // --- FUNGSI HELPER SMART HYBRID ---
    async function sendFinalReply(finalCaption) {
        const messageAgeMinutes = (Date.now() - placeholderTimestamp) / (1000 * 60);
        const EDIT_WINDOW_MINUTES = 14.5;
        if (messageAgeMinutes < EDIT_WINDOW_MINUTES) {
            await client.sendMessage(m.chat, { text: finalCaption, edit: messageKey });
        } else {
            await client.sendMessage(m.chat, { text: finalCaption }, { quoted: m });
            try { await client.sendMessage(m.chat, { delete: messageKey }); } catch (e) { console.error("Gagal hapus placeholder usang:", e.message); }
        }
    }
    
    try {
        let freshUserData = (await userRef.get()).data();
        freshUserData.saldo -= adjustedPrice;
        await userRef.set(freshUserData);
        
        const signature = crypto.createHash("md5").update(username + apiKey + ref_id).digest("hex");
        const config = { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: username, buyer_sku_code: buyer_sku_code, customer_no: customer_no, ref_id: ref_id, sign: signature }) };
        
        let data;
        let dataStatus = 'Pending';
        
        while (dataStatus === 'Pending' || dataStatus === 'Proses') {
            const pollingAgeMinutes = (Date.now() - placeholderTimestamp) / (1000 * 60);
            if (pollingAgeMinutes > 360) { // Timeout 6 jam
                dataStatus = "Gagal";
                data = { data: { message: "Waktu tunggu proses dari provider terlalu lama (> 6 jam)." } };
                break;
            }
            const checkStatusResponse = await fetch("https://api.digiflazz.com/v1/transaction", config);
            data = await checkStatusResponse.json();
            if (!data.data) throw new Error('Gagal memeriksa status, respons API tidak valid.');
            dataStatus = data.data.status;
            if (dataStatus === 'Pending' || dataStatus === 'Proses') await sleep(30000);
        }

        const txTime = moment.tz('Asia/Jakarta').format('HH:mm:ss');
        const txDate = moment.tz('Asia/Jakarta').format('dddd, DD MMMM YYYY');
        
        if (dataStatus === "Gagal") {
            let userToRefund = (await userRef.get()).data();
            userToRefund.saldo = saldoAwal;
            await userRef.set(userToRefund);
            
            const failedInfoBlock = `\n 「 *INFO* 」\n> *Saldo awal*: Rp. ${saldoAwal.toLocaleString()}\n> *Saldo jadi*: Rp. ${saldoAwal.toLocaleString()} (Dikembalikan)\n> *Tanggal* : ${txDate}\n> *Jam* : ${txTime} WIB`;
            let capt = `❌ *TRANSAKSI GAGAL*\n\n» *Invoice* : ${ref_id}\n» *Produk* :${product.product_name}\n» *Tujuan* : ${customer_no}${nickname ? `\n» *Nickname* : ${nickname}` : ''}\n» *Harga* : Rp ${adjustedPrice.toLocaleString()}\n» *Alasan* : ${data.data.message}\n\nⓘ *SALDO TELAH DIKEMBALIKAN*${failedInfoBlock}`;
            await sendFinalReply(capt);

            const toOwn = `*TRANSAKSI GAGAL ⚠️*\n\n*» Nama :* ${m.pushName || '-'}\n*» Nomor :* ${m.sender.split("@")[0]}\n» *Produk :* ${product.product_name}\n» *Tujuan :* ${customer_no}\n» *Alasan:* ${data.data.message}`;
            for (const own of global.owner) {
                client.sendMessage(own + '@s.whatsapp.net', { text: toOwn }, { quoted: m });
            }

        } else if (dataStatus === "Sukses") {
            // --- Pencatatan History ke Firestore ---
            const historyData = { tanggal: new Date(), produk: product.product_name, harga: adjustedPrice, tujuan: customer_no, invoice: ref_id, sn: data.data.sn, status: 'Sukses', metode: 'Saldo' };
            await userRef.collection('transactions').doc(ref_id).set(historyData);
            
            const latestUserDoc = await userRef.get();
            const latestUserData = latestUserDoc.data();
            const currentTotalSpend = latestUserData.total_spend || 0;
            const newTotalSpend = currentTotalSpend + adjustedPrice;
            await userRef.update({ total_spend: newTotalSpend });
            
            const saldoJadi = latestUserData.saldo;
            const infoBlock = `\n 「 *INFO* 」\n> *Saldo awal*: Rp. ${saldoAwal.toLocaleString()}\n> *Saldo jadi*: Rp. ${saldoJadi.toLocaleString()}\n> *Tanggal* : ${txDate}\n> *Jam* : ${txTime} WIB`;
            let capt = `✅〔 *TRANSAKSI SUKSES* 〕✅\n\n» *Invoice* : ${data.data.ref_id}\n» *Produk :* ${product.product_name}\n» *Tujuan* : ${customer_no}${nickname ? `\n» *Nickname* : ${nickname}` : ''}\n» *Harga* : Rp ${adjustedPrice.toLocaleString()}\n\n──〔 *Serial Number* 〕──\n${data.data.sn}\n\n*${namaStore}*${infoBlock}`;
            await sendFinalReply(capt);
            
            const toUser = `✅ Pembelian *${product.product_name}* berhasil!\n\n» *Invoice* : ${data.data.ref_id}\n» *Tujuan* : ${customer_no}${nickname ? `\n» *Nickname* : ${nickname}` : ''}\n» *Harga* : Rp ${adjustedPrice.toLocaleString()}\n» *Sisa Saldo* : Rp ${saldoJadi.toLocaleString()}\n\nTerima kasih telah bertransaksi di *${namaStore}*!`;
            const profit = adjustedPrice - originalPrice;
            const toOwn = `*✅ Report Transaksi*\n\n» *Invoice* : ${data.data.ref_id}\n» *Nama :* ${m.pushName || '-'}\n» *Nomor :* ${m.sender.split("@")[0]}\n» *Produk :* ${product.product_name}\n» *Tujuan :* ${customer_no}\n» *Harga Jual :* ${adjustedPrice.toLocaleString()}\n» *Harga Pokok :* ${originalPrice.toLocaleString()}\n» *Keuntungan :* ${profit.toLocaleString()}`;
            
            setTimeout(() => { client.sendMessage(sender, { text: toUser }, { quoted: m }); }, 1000);
            for (const own of global.owner) {
                client.sendMessage(own + '@s.whatsapp.net', { text: toOwn }, { quoted: m });
            }
        }
        
        let transactions = fs.existsSync("./db/trx.json") ? JSON.parse(fs.readFileSync("./db/trx.json", "utf8")) : [];
        transactions.push({ nomor: nomor, status: dataStatus, invoice: ref_id, item: product.product_name, tujuan: customer_no, harga: adjustedPrice, harga_pokok: originalPrice, waktu: `${txTime} | ${txDate}` });
        fs.writeFileSync("./db/trx.json", JSON.stringify(transactions, null, 2));

    } catch (error) {
        console.error('Transaction Process Error:', error.message);
        
        let userToRefund = (await userRef.get()).data();
        if (userToRefund.saldo !== saldoAwal) {
            userToRefund.saldo = saldoAwal;
            await userRef.set(userToRefund);
        }
        
        const errorInfoBlock = `\n「 *INFO* 」\n> *Saldo awal*: Rp. ${saldoAwal.toLocaleString()}\n> *Saldo jadi*: Rp. ${saldoAwal.toLocaleString()} (Dikembalikan)\n> *Tanggal* : ${moment.tz('Asia/Jakarta').format('dddd, DD MMMM YYYY')}\n> *Jam* : ${moment.tz('Asia/Jakarta').format('HH:mm:ss')} WIB`;
        const errorMsg = `❌ *TERJADI KESALAHAN*\n\nTransaksi untuk *${product.product_name}* gagal diproses.\n\n*Pesan Error:* ${error.message}\n\nⓘ *SALDO ANDA TELAH DIKEMBALIKAN.*${errorInfoBlock}`;
        await sendFinalReply(errorMsg);

        const toOwnOnError = `*SYSTEM ERROR ⚠️*\n\nTerjadi kesalahan sistem saat user melakukan transaksi.\n\n*» User :* ${m.pushName || '-'} (${m.sender.split("@")[0]})\n*» Produk :* ${product.product_name}\n*» Tujuan :* ${customer_no}\n*» Error :* ${error.message}\n\n_Saldo user telah dikembalikan secara otomatis. Mohon periksa log untuk detail._`;
        for (const own of global.owner) {
            client.sendMessage(own + '@s.whatsapp.net', { text: toOwnOnError }, { quoted: m });
        }
    }
}
break;
            //tp claude
 //     case 'tp':
case 'tpclaude': {
    const nomor = sender.split("@")[0];
    const userRef = firestore.collection('users').doc(nomor);
    let userDoc;
    
    try {
        userDoc = await userRef.get();
        
        // --- VALIDASI AWAL ---
        if (!userDoc.exists) {
            return m.reply('Kamu belum terdaftar, silahkan ketik : *Daftar* untuk bisa mengakses.');
        }
        
        if (args.length < 2) {
            return m.reply(`Format Salah\n\nPetunjuk Penggunaan:\n\nUntuk produk Free Fire : \nFormat Order : *TP PID ID*\nContoh : *TP GPFF5 12345678*\n\nUntuk produk Mobile Legends : \nFormat Order : *TP PID ID SERVER*\nContoh : *TP GPML5 12345678 1234*\n\nUntuk produk lainnya: \nFormat Order : *TP PID TUJUAN*\nContoh : *TP TSEL5 085237859745*`);
        }
        
        // --- VALIDASI THROTTLING & COOLDOWN ---
        const userData = userDoc.data();
        const lastOrderTime = userData.lastOrderTime ? userData.lastOrderTime.toDate() : null;
        const currentTime = new Date();
        
        if (lastOrderTime && (currentTime - lastOrderTime) < 5000) {
            return client.sendMessage(m.chat, { 
                text: `Harap tunggu 5 detik sebelum melakukan pemesanan lagi.` 
            }, { quoted: m });
        }
        
        // --- IDENTIFIKASI PRODUK & VALIDASI FORMAT ---
        const buyer_sku_code = args[0];
        const lowerCaseSkuCode = buyer_sku_code.toLowerCase();
        const isMobileLegends = lowerCaseSkuCode.includes("ml") || lowerCaseSkuCode.includes("wdp") || lowerCaseSkuCode.includes("wp");
        const isFreeFire = lowerCaseSkuCode.includes("ff");
        let customer_no, nickname;
        
        // --- VALIDASI & STALK GAME ID ---
        if (isMobileLegends) {
            if (args.length < 3) {
                return m.reply(`Format Salah\nFormat yang benar untuk produk ML adalah : *TP PID ID SERVER*`);
            }
            
            // Sanitasi input
            const id = args[1].replace(/[^\d]/g, ''); 
            const zone_id = args[2].replace(/[^\d]/g, '');
            
            if (!id || !zone_id) {
                return m.reply(`ID atau Server tidak valid. Pastikan hanya berisi angka.`);
            }
            
            customer_no = `${id}${zone_id}`;
            
            // Auto get nickname
            nickname = 'Tidak ditemukan';
            try {
                const params = new URLSearchParams();
                params.append('country', 'SG');
                params.append('userId', id);
                params.append('voucherTypeName', "MOBILE_LEGENDS");
                params.append('zoneId', zone_id);

                const response = await fetch('https://order-sg.codashop.com/validate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
                    body: params
                });
                
                const data = await response.json();
                if (data.success !== false && data.result?.username) {
                    nickname = decodeURIComponent(data.result.username).replace(/\+/g, ' ');
                }
            } catch (e) {
                console.error('Error fetch ML nickname:', e);
                // Tidak menghentikan transaksi, hanya mencatat error
            }
        } else if (isFreeFire) {
            if (args.length < 2) {
                return m.reply(`Format Salah\nFormat yang benar untuk produk FF adalah : *TP PID ID*`);
            }
            
            // Sanitasi input
            const id = args[1].replace(/[^\d]/g, '');
            
            if (!id) {
                return m.reply(`ID Free Fire tidak valid. Pastikan hanya berisi angka.`);
            }
            
            customer_no = id;
            
            // Stalk ID FF
            try {
                const { stalkff } = require("./lib/stalk-ff.js");
                const nicknameCheck = await stalkff(id);
                if (nicknameCheck.status !== 200) {
                    return m.reply(`ID Free Fire yang kamu masukkan tidak ditemukan. Coba lagi.`);
                }
                nickname = nicknameCheck.nickname;
            } catch (e) {
                console.error('Error stalk FF:', e);
                return m.reply(`Gagal memverifikasi ID Free Fire. Silakan coba lagi dalam beberapa saat.`);
            }
        } else {
            if (args.length < 2) {
                return m.reply(`Format Salah\nFormat yang benar adalah : *TP PID TUJUAN*`);
            }
            
            // Validasi nomor telepon/tujuan
            customer_no = args[1];
            
            // Sanitasi untuk produk tertentu
            if (lowerCaseSkuCode.includes("tsel") || lowerCaseSkuCode.includes("axis") || 
                lowerCaseSkuCode.includes("xl") || lowerCaseSkuCode.includes("indosat")) {
                
                // Validasi nomor telepon
                const cleanedNumber = customer_no.replace(/[^\d]/g, '');
                if (!cleanedNumber.match(/^(62|0)\d{9,13}$/)) {
                    return m.reply(`Nomor telepon tidak valid. Pastikan format benar.`);
                }
                
                // Standarisasi format nomor telepon
                customer_no = cleanedNumber.startsWith('0') ? '62' + cleanedNumber.substring(1) : cleanedNumber;
            }
        }
        
        // --- VALIDASI PRODUK & HARGA ---
        try {
            const productData = JSON.parse(fs.readFileSync("./db/datadigi.json", "utf8"));
            const product = productData.find(prod => prod.buyer_sku_code.toLowerCase() === buyer_sku_code.toLowerCase());
            
            if (!product) {
                return m.reply(`Layanan ${buyer_sku_code} tidak ditemukan.`);
            }
            
            const originalPrice = parseFloat(product.price);
            let markupPercentage = defaultMarkupPercentage;
            const userRole = userData.role;
            
            if (userRole) {
                if (userRole === "GOLD") markupPercentage = marginGold;
                else if (userRole === "SILVER") markupPercentage = marginSilver;
                else if (userRole === "BRONZE") markupPercentage = marginBronze;
                else if (userRole === "OWNER") markupPercentage = marginOwner;
            }
            
            const increasedPrice = originalPrice * (1 + markupPercentage);
            let adjustedPrice = Math.floor(increasedPrice);
            
            // --- VALIDASI SALDO ---
            if (userData.saldo < adjustedPrice) {
                return m.reply(`Kamu tidak mempunyai cukup saldo untuk melakukan transaksi ${product.product_name}.\n\nSilahkan melakukan deposit saldo dengan cara ketik : *Depo Nominal*\nContoh : *Depo 10000*`);
            }
            
            // --- INISIALISASI CONFIRMASI ORDER ---
            const orderToken = generateRandomString(20); // Fungsi untuk menghasilkan token unik
            const ref_id = generateUniqueRefID();
            const hariini = moment.tz('Asia/Jakarta').format('dddd, DD MMMM YYYY');
            const time1 = moment.tz('Asia/Jakarta').format('HH:mm:ss');
            const saldoAwal = userData.saldo;
            const saldoSetelah = saldoAwal - adjustedPrice;
            
            // Simpan ke cache lokal
            const orderCache = readOrderCache(); // Fungsi seperti di deposit
            orderCache.orders = orderCache.orders || {};
            
            // Simpan informasi order
            const expireTime = Date.now() + (5 * 60 * 1000); // 5 menit
            orderCache.orders[orderToken] = {
                token: orderToken,
                userId: nomor,
                ref_id: ref_id,
                buyer_sku_code: buyer_sku_code,
                product_name: product.product_name,
                customer_no: customer_no,
                nickname: nickname || null,
                price: adjustedPrice,
                originalPrice: originalPrice,
                createdAt: Date.now(),
                expireAt: expireTime,
                status: 'pending' // pending, confirmed, cancelled, expired
            };
            saveOrderCache(orderCache);
            
            // Update lastOrderTime
            await userRef.update({ lastOrderTime: currentTime });
            
            // Buat pesan konfirmasi dengan tombol - FORMAT YANG BENAR UNTUK BAILEYS
            const confirmMessage = `「 *KONFIRMASI PESANAN* 」\n\n» *Trx ID* : ${ref_id}\n» *Produk* : ${product.product_name}\n» *Target* : ${customer_no}${(isMobileLegends || isFreeFire) && nickname ? `\n» *Nickname* : ${nickname}` : ''}\n» *Harga* : Rp${adjustedPrice.toLocaleString()}\n\nPastikan data di atas sudah benar!\nPesanan yang sudah diproses tidak dapat dibatalkan.\n\n*Pesanan akan otomatis dibatalkan dalam 5 menit jika tidak ada konfirmasi.*\n\n「 *INFO SALDO* 」\n» *Saldo Awal* : Rp${saldoAwal.toLocaleString()}\n» *Saldo Setelah* : Rp${saldoSetelah.toLocaleString()}\n» *Tanggal* : ${hariini}\n» *Jam* : ${time1} WIB`;

            // Format tombol seperti yang digunakan oleh developer lain
            // Kode untuk menampilkan konfirmasi order dengan tombol yang benar
// Kode alternatif untuk tombol interaktif
client.sendMessage(m.chat, {
    text: confirmMessage,
    footer: `Order ID: ${ref_id}`,
    buttons: [
        {
            buttonId: 'action',
            buttonText: { displayText: 'Pilih Tindakan' },
            type: 4,
            nativeFlowInfo: {
                name: 'single_select',
                paramsJson: JSON.stringify({
                    title: 'Konfirmasi Pesanan',
                    sections: [
                        {
                            title: 'Pilih Tindakan',
                            rows: [
                                {
                                    title: '✅ Lanjutkan Pesanan',
                                    id: `.confirm_order_${orderToken}`
                                },
                                {
                                    title: '❌ Batalkan',
                                    id: `.cancel_order_${orderToken}`
                                }
                            ]
                        }
                    ]
                })
            }
        }
    ],
    headerType: 1,
    viewOnce: true,
    contextInfo: {
        forwardingScore: 999,
        isForwarded: true,
        mentionedJid: [m.sender],
        externalAdReply: {
            title: `${namaStore}`,
            body: `Konfirmasi Pesanan`,
            thumbnailUrl: `${global.image || 'https://example.com/image.jpg'}`,
            sourceUrl: null,
            mediaType: 1,
            renderLargerThumbnail: false
        }
    }
}, { quoted: m })
    
    .then(sentMsg => {
    // Simpan msgKey untuk bisa dihapus nanti
    orderCache.orders[orderToken].msgKey = sentMsg.key;
    saveOrderCache(orderCache);
})
            .catch(err => {
                console.error("Error sending confirmation message:", err);
                // Fallback ke pesan teks biasa jika tombol gagal
                m.reply(`「 *KONFIRMASI PESANAN* 」\n\n» *Trx ID* : ${ref_id}\n» *Produk* : ${product.product_name}\n» *Target* : ${customer_no}${(isMobileLegends || isFreeFire) && nickname ? `\n» *Nickname* : ${nickname}` : ''}\n» *Harga* : Rp${adjustedPrice.toLocaleString()}\n\nPesanan dibuat. Ketik *confirm_order_${orderToken}* untuk melanjutkan atau *cancel_order_${orderToken}* untuk membatalkan.`);
            });
            
            // Jalankan interval untuk auto-cancel
            const orderInterval = setInterval(async () => {
                try {
                    const currentCache = readOrderCache();
                    if (!currentCache.orders || !currentCache.orders[orderToken]) {
                        return clearInterval(orderInterval);
                    }
                    
                    const orderData = currentCache.orders[orderToken];
                    const now = Date.now();
                    
                    if (now > orderData.expireAt && orderData.status === 'pending') {
                        // Batalkan pesanan
                        currentCache.orders[orderToken].status = 'expired';
                        saveOrderCache(currentCache);
                        
                        // Hapus pesan konfirmasi
                        try {
                            await client.sendMessage(m.chat, { delete: orderData.msgKey });
                        } catch (e) {
                            console.error("Gagal menghapus pesan konfirmasi:", e);
                        }
                        
                        // Kirim notifikasi kedaluwarsa
                        await client.sendMessage(m.chat, { 
                            text: `⏱️ *PESANAN KEDALUWARSA*\n\n» *Trx ID* : ${ref_id}\n» *Produk* : ${product.product_name}\n» *Target* : ${customer_no}\n\nPesanan telah dibatalkan karena tidak ada konfirmasi dalam 5 menit. Silakan buat pesanan baru.` 
                        }, { quoted: m });
                        
                        clearInterval(orderInterval);
                    }
                } catch (e) {
                    console.error("Error in order auto-cancel interval:", e);
                    clearInterval(orderInterval);
                }
            }, 10000); // Cek setiap 10 detik
            
        } catch (error) {
            console.error('Error in order preparation:', error);
            return m.reply(`Terjadi kesalahan saat mempersiapkan pesanan: ${error.message}`);
        }
    } catch (error) {
        console.error('Error in initial order processing:', error);
        return m.reply(`Terjadi kesalahan: ${error.message}`);
    }
}
break;

// Handler untuk konfirmasi pesanan
// Handler untuk konfirmasi pesanan
case 'confirm_order': {
    try {
        const orderToken = args[0];
        if (!orderToken) return m.reply('Token pesanan tidak valid');
        
        // Ambil data order dari cache
        const orderCache = readOrderCache();
        if (!orderCache.orders || !orderCache.orders[orderToken]) {
            return m.reply('Pesanan tidak ditemukan atau sudah kedaluwarsa.');
        }
        
        const orderData = orderCache.orders[orderToken];
        
        // Validasi status dan waktu kedaluwarsa
        if (orderData.status !== 'pending') {
            return m.reply(`Pesanan ini sudah ${orderData.status === 'confirmed' ? 'dikonfirmasi' : orderData.status === 'expired' ? 'kedaluwarsa' : 'dibatalkan'}.`);
        }
        
        if (orderData.expireAt < Date.now()) {
            orderCache.orders[orderToken].status = 'expired';
            saveOrderCache(orderCache);
            return m.reply('Pesanan sudah kedaluwarsa. Silakan buat pesanan baru.');
        }
        
        // Validasi user yang mengkonfirmasi sama dengan yang membuat pesanan
        if (orderData.userId !== sender.split("@")[0]) {
            return m.reply('Anda tidak berhak mengkonfirmasi pesanan ini.');
        }
        
        // Kirim pesan bahwa pesanan sedang diproses
        const processingMsg = await client.sendMessage(m.chat, { 
            text: `✅ *Pesanan Dikonfirmasi*\n\n» *Trx ID* : ${orderData.ref_id}\n» *Produk* : ${orderData.product_name}\n\nSedang memproses pembelian dengan invoice ${orderData.ref_id}...\nMohon tunggu sebentar.` 
        }, { quoted: m });
        
        // Update status konfirmasi
        orderCache.orders[orderToken].status = 'confirmed';
        saveOrderCache(orderCache);
        
        // Hapus pesan konfirmasi dengan tombol
        try {
            await client.sendMessage(m.chat, { delete: orderData.msgKey });
        } catch (e) {
            console.error("Gagal menghapus pesan konfirmasi:", e);
        }
        
        // MULAI PROSES TRANSAKSI
        const placeholderTimestamp = Date.now();
        const messageKey = processingMsg.key;
        const userRef = firestore.collection('users').doc(orderData.userId);
        const ref_id = orderData.ref_id;
        const buyer_sku_code = orderData.buyer_sku_code;
        const customer_no = orderData.customer_no;
        const nickname = orderData.nickname;
        const adjustedPrice = orderData.price;
        const originalPrice = orderData.originalPrice;
        const product_name = orderData.product_name;
        const isMobileLegends = buyer_sku_code.toLowerCase().includes("ml") || 
                               buyer_sku_code.toLowerCase().includes("wdp") || 
                               buyer_sku_code.toLowerCase().includes("wp");
        const isFreeFire = buyer_sku_code.toLowerCase().includes("ff");
        
        // Fungsi untuk update pesan status
        async function sendFinalReply(finalCaption) {
            const messageAgeMinutes = (Date.now() - placeholderTimestamp) / (1000 * 60);
            const EDIT_WINDOW_MINUTES = 14.5;
            if (messageAgeMinutes < EDIT_WINDOW_MINUTES) {
                await client.sendMessage(m.chat, { text: finalCaption, edit: messageKey });
            } else {
                await client.sendMessage(m.chat, { text: finalCaption }, { quoted: m });
                try { 
                    await client.sendMessage(m.chat, { delete: messageKey }); 
                } catch (e) { 
                    console.error("Gagal hapus placeholder usang:", e.message); 
                }
            }
        }
        
        try {
            const userDoc = await userRef.get();
            if (!userDoc.exists) throw new Error("User tidak ditemukan");
            const userData = userDoc.data();
            
            // Gunakan transaction untuk memastikan atomicity update saldo
            await firestore.runTransaction(async (transaction) => {
                const freshUserDoc = await transaction.get(userRef);
                if (!freshUserDoc.exists) throw new Error("User tidak ditemukan");
                
                const freshUserData = freshUserDoc.data();
                if (freshUserData.saldo < adjustedPrice) {
                    throw new Error("Saldo tidak cukup untuk melakukan transaksi ini");
                }
                
                // Update saldo user
                transaction.update(userRef, { 
                    saldo: freshUserData.saldo - adjustedPrice 
                });
                
                // Update status message
                client.sendMessage(m.chat, { 
                    text: `🔄 *Transaksi Diproses*\n\n» *Trx ID* : ${ref_id}\n» *Produk* : ${product_name}\n\nSedang mengirim permintaan ke provider dengan invoice ${ref_id}...`, 
                    edit: messageKey 
                });
            });
            
            // Proses API Digiflazz
            const signature = crypto.createHash("md5").update(username + apiKey + ref_id).digest("hex");
            const config = { 
                method: "POST", 
                headers: { "Content-Type": "application/json" }, 
                body: JSON.stringify({ 
                    username: username, 
                    buyer_sku_code: buyer_sku_code, 
                    customer_no: customer_no, 
                    ref_id: ref_id, 
                    sign: signature 
                }) 
            };
            
            // Prepare for polling with variable delay
            let data;
            let dataStatus = 'Pending';
            let retryCount = 0;
            const maxRetries = 720; // 6 jam dengan interval 30 detik
            const baseDelay = 30000; // 30 detik
            
            // Update status message - API call
            await client.sendMessage(m.chat, { 
                text: `🔄 *Transaksi Diproses*\n\n» *Trx ID* : ${ref_id}\n» *Produk* : ${product_name}\n\nMenunggu respon dari provider dengan invoice ${ref_id}...`, 
                edit: messageKey 
            });
            
            // Polling loop with exponential backoff
            while (dataStatus === 'Pending' || dataStatus === 'Proses') {
                if (retryCount >= maxRetries) {
                    dataStatus = "Gagal";
                    data = { data: { message: "Waktu tunggu proses dari provider terlalu lama (> 6 jam)." } };
                    break;
                }
                
                try {
                    const checkStatusResponse = await fetch("https://api.digiflazz.com/v1/transaction", config);
                    data = await checkStatusResponse.json();
                    
                    if (!data.data) throw new Error('Gagal memeriksa status, respons API tidak valid.');
                    
                    dataStatus = data.data.status;
                    
                    // Update status message with current status
                    const statusMsg = `🔄 *Transaksi ${dataStatus}*\n\n» *Trx ID* : ${ref_id}\n» *Produk* : ${product_name}\n» *Tujuan* : ${customer_no}${(isMobileLegends || isFreeFire) && nickname ? `\n» *Nickname* : ${nickname}` : ''}\n\nMohon tunggu sebentar...`;
                    await client.sendMessage(m.chat, { text: statusMsg, edit: messageKey });
                    
                    if (dataStatus === 'Pending' || dataStatus === 'Proses') {
                        // Exponential backoff - semakin lama semakin jarang cek
                        const delay = Math.min(baseDelay * Math.pow(1.1, Math.floor(retryCount / 10)), 120000); // Max 2 menit
                        await sleep(delay);
                    }
                    
                    retryCount++;
                } catch (error) {
                    console.error(`Error during polling (attempt ${retryCount}):`, error);
                    await sleep(baseDelay); // Tetap tunggu jika error
                    retryCount++;
                }
            }
            
            // Get saldo data and prepare response
            const txTime = moment.tz('Asia/Jakarta').format('HH:mm:ss');
            const txDate = moment.tz('Asia/Jakarta').format('dddd, DD MMMM YYYY');
            const latestUserDoc = await userRef.get();
            const latestUserData = latestUserDoc.data();
            const saldoJadi = latestUserData.saldo;
            
            // Create transaction object for both collections
            const commonTransactionData = {
                tanggal: new Date(),
                produk: product_name,
                harga: adjustedPrice,
                tujuan: customer_no,
                invoice: ref_id,
                status: dataStatus,
                createdAt: new Date()
            };
            
            // Process based on final status
            if (dataStatus === "Gagal") {
                // Refund process
                await firestore.runTransaction(async (transaction) => {
                    const userToRefund = await transaction.get(userRef);
                    if (!userToRefund.exists) throw new Error("User untuk refund tidak ditemukan");
                    
                    transaction.update(userRef, { saldo: userToRefund.data().saldo + adjustedPrice });
                });
                
                // Update user transaction subcollection
                await userRef.collection('transactions').doc(ref_id).set({
                    ...commonTransactionData,
                    sn: null,
                    metode: 'Saldo',
                    refunded: true
                });
                
                // Add to global transactions
                await firestore.collection('transactions').doc(ref_id).set({
                    nomor: orderData.userId,
                    status: 'Gagal',
                    metode: 'Saldo',
                    product_name: product_name,
                    sku: buyer_sku_code,
                    tujuan: customer_no,
                    harga_pokok: originalPrice,
                    harga_jual: adjustedPrice,
                    dibuat_pada: new Date(),
                    reason: data.data.message,
                    refunded: true
                });
                
                // Send failed message
                const failedInfoBlock = `\n「 *INFO* 」\n> *Saldo awal*: Rp. ${userData.saldo.toLocaleString()}\n> *Saldo jadi*: Rp. ${(userData.saldo).toLocaleString()} (Dikembalikan)\n> *Tanggal* : ${txDate}\n> *Jam* : ${txTime} WIB`;
                let capt = `❌ *TRANSAKSI GAGAL*\n\n» *Trx ID* : ${ref_id}\n» *Produk* :${product_name}\n» *Tujuan* : ${customer_no}${(isMobileLegends || isFreeFire) && nickname ? `\n» *Nickname* : ${nickname}` : ''}\n» *Harga* : Rp ${adjustedPrice.toLocaleString()}\n» *Alasan* : ${data.data.message}\n\nⓘ *SALDO TELAH DIKEMBALIKAN*${failedInfoBlock}`;
                await sendFinalReply(capt);
                
                // Notify owner
                const toOwn = `*TRANSAKSI GAGAL ⚠️*\n\n*» Nama :* ${m.pushName || '-'}\n*» Nomor :* ${m.sender.split("@")[0]}\n» *Produk :* ${product_name}\n» *Tujuan :* ${customer_no}\n» *Alasan:* ${data.data.message}`;
                for (const own of global.owner) {
                    client.sendMessage(own + '@s.whatsapp.net', { text: toOwn });
                }
                
            } else if (dataStatus === "Sukses") {
                // Update transaction details
                await userRef.collection('transactions').doc(ref_id).set({
                    ...commonTransactionData,
                    sn: data.data.sn,
                    metode: 'Saldo'
                });
                
                // Add to global transactions
                await firestore.collection('transactions').doc(ref_id).set({
                    nomor: orderData.userId,
                    status: 'Sukses',
                    metode: 'Saldo',
                    product_name: product_name,
                    sku: buyer_sku_code,
                    tujuan: customer_no,
                    harga_pokok: originalPrice,
                    harga_jual: adjustedPrice,
                    dibuat_pada: new Date(),
                    sn: data.data.sn
                });
                
                // Update user stats
                const currentTotalSpend = latestUserData.total_spend || 0;
                const newTotalSpend = currentTotalSpend + adjustedPrice;
                await userRef.update({ 
                    total_spend: newTotalSpend,
                    jumlah_transaksi_sukses: firebase.firestore.FieldValue.increment(1)
                });
                
                // Send success message
                const infoBlock = `\n「 *INFO* 」\n> *Saldo awal*: Rp. ${userData.saldo.toLocaleString()}\n> *Saldo jadi*: Rp. ${saldoJadi.toLocaleString()}\n> *Tanggal* : ${txDate}\n> *Jam* : ${txTime} WIB`;
                let capt = `✅〔 *TRANSAKSI SUKSES* 〕✅\n\n» *Trx ID* : ${data.data.ref_id}\n» *Produk :* ${product_name}\n» *Tujuan* : ${customer_no}${(isMobileLegends || isFreeFire) && nickname ? `\n» *Nickname* : ${nickname}` : ''}\n» *Harga* : Rp ${adjustedPrice.toLocaleString()}\n\n──〔 *Serial Number* 〕──\n${data.data.sn}\n\n*${namaStore}*${infoBlock}`;
                await sendFinalReply(capt);
                
                // Notify user & owner
                const toUser = `✅ Pembelian *${product_name}* berhasil!\n\n» *Trx ID* : ${data.data.ref_id}\n» *Tujuan* : ${customer_no}${(isMobileLegends || isFreeFire) && nickname ? `\n» *Nickname* : ${nickname}` : ''}\n» *Harga* : Rp ${adjustedPrice.toLocaleString()}\n» *Sisa Saldo* : Rp ${saldoJadi.toLocaleString()}\n\nTerima kasih telah bertransaksi di *${namaStore}*!`;
                const profit = adjustedPrice - originalPrice;
                const toOwn = `*✅ Report Transaksi*\n\n» *Trx ID* : ${data.data.ref_id}\n» *Nama :* ${m.pushName || '-'}\n» *Nomor :* ${m.sender.split("@")[0]}\n» *Produk :* ${product_name}\n» *Tujuan :* ${customer_no}\n» *Harga Jual :* ${adjustedPrice.toLocaleString()}\n» *Harga Pokok :* ${originalPrice.toLocaleString()}\n» *Keuntungan :* ${profit.toLocaleString()}`;
                
                setTimeout(() => { 
                    client.sendMessage(sender, { text: toUser }); 
                }, 1000);
                
                for (const own of global.owner) {
                    client.sendMessage(own + '@s.whatsapp.net', { text: toOwn });
                }
            }
            
            // Log to trx.json
            let transactions = fs.existsSync("./db/trx.json") ? JSON.parse(fs.readFileSync("./db/trx.json", "utf8")) : [];
            transactions.push({ 
                nomor: orderData.userId, 
                status: dataStatus, 
                invoice: ref_id, 
                item: product_name, 
                tujuan: customer_no, 
                harga: adjustedPrice, 
                harga_pokok: originalPrice, 
                waktu: `${txTime} | ${txDate}` 
            });
            fs.writeFileSync("./db/trx.json", JSON.stringify(transactions, null, 2));
            
            // Hapus dari orderCache setelah selesai
            delete orderCache.orders[orderToken];
            saveOrderCache(orderCache);
            
        } catch (error) {
            console.error('Transaction Process Error:', error.message);
            
            // Refund if error
            try {
                await firestore.runTransaction(async (transaction) => {
                    const userToRefund = await transaction.get(userRef);
                    if (userToRefund.exists) {
                        const currentSaldo = userToRefund.data().saldo;
                        const saldoAwal = userData.saldo;
                        if (currentSaldo !== saldoAwal) {
                            transaction.update(userRef, { saldo: saldoAwal });
                        }
                    }
                });
                
                // Error message
                const errorInfoBlock = `\n「 *INFO* 」\n> *Saldo awal*: Rp. ${userData.saldo.toLocaleString()}\n> *Saldo jadi*: Rp. ${userData.saldo.toLocaleString()} (Dikembalikan)\n> *Tanggal* : ${moment.tz('Asia/Jakarta').format('dddd, DD MMMM YYYY')}\n> *Jam* : ${moment.tz('Asia/Jakarta').format('HH:mm:ss')} WIB`;
                const errorMsg = `❌ *TERJADI KESALAHAN*\n\n» *Trx ID* : ${ref_id}\n» *Produk* : ${product_name}\n\nTransaksi gagal diproses.\n\n*Pesan Error:* ${error.message}\n\nⓘ *SALDO ANDA TELAH DIKEMBALIKAN.*${errorInfoBlock}`;
                await sendFinalReply(errorMsg);
                
                // Notify owner
                const toOwnOnError = `*SYSTEM ERROR ⚠️*\n\nTerjadi kesalahan sistem saat user melakukan transaksi.\n\n*» User :* ${m.pushName || '-'} (${m.sender.split("@")[0]})\n*» Produk :* ${product_name}\n*» Tujuan :* ${customer_no}\n*» Error :* ${error.message}\n\n_Saldo user telah dikembalikan secara otomatis. Mohon periksa log untuk detail._`;
                for (const own of global.owner) {
                    client.sendMessage(own + '@s.whatsapp.net', { text: toOwnOnError });
                }
                
                // Hapus dari orderCache setelah selesai
                delete orderCache.orders[orderToken];
                saveOrderCache(orderCache);
            } catch (refundError) {
                console.error('Refund Error:', refundError.message);
                await client.sendMessage(m.chat, { 
                    text: `❌ *TERJADI KESALAHAN KRITIS*\n\n» *Trx ID* : ${ref_id}\n» *Produk* : ${product_name}\n\nTransaksi gagal dan proses refund gagal. Silahkan hubungi admin segera.\n\n*Error:* ${error.message}\n*Refund Error:* ${refundError.message}` 
                }, { quoted: m });
            }
        }
    } catch (error) {
        console.error('Confirmation process error:', error);
        return m.reply(`Terjadi kesalahan saat mengkonfirmasi pesanan: ${error.message}`);
    }
}
break;

// Handler untuk pembatalan pesanan
case 'cancel_order': {
    try {
        const orderToken = args[0];
        if (!orderToken) return m.reply('Token pesanan tidak valid');
        
        // Ambil data order dari cache
        const orderCache = readOrderCache();
        if (!orderCache.orders || !orderCache.orders[orderToken]) {
            return m.reply('Pesanan tidak ditemukan atau sudah kedaluwarsa.');
        }
        
        const orderData = orderCache.orders[orderToken];
        
        // Validasi status
        if (orderData.status !== 'pending') {
            return m.reply(`Pesanan ini sudah ${orderData.status === 'confirmed' ? 'dikonfirmasi' : orderData.status === 'expired' ? 'kedaluwarsa' : 'dibatalkan'}.`);
        }
        
        // Validasi user
        if (orderData.userId !== sender.split("@")[0]) {
            return m.reply('Anda tidak berhak membatalkan pesanan ini.');
        }
        
        // Update status konfirmasi
        orderCache.orders[orderToken].status = 'cancelled';
        saveOrderCache(orderCache);
        
        // Hapus pesan konfirmasi
        try {
            await client.sendMessage(m.chat, { delete: orderData.msgKey });
        } catch (e) {
            console.error("Gagal menghapus pesan konfirmasi:", e);
        }
        
        // Kirim pesan pembatalan
        return m.reply(`✅ Pesanan ${orderData.product_name} dengan Invoice ${orderData.ref_id} berhasil dibatalkan.`);
    } catch (error) {
        console.error('Cancel order error:', error);
        return m.reply(`Terjadi kesalahan saat membatalkan pesanan: ${error.message}`);
    }
}
break;

            /*tp final


            case 'tp':
case 'order': {
  const nomor = sender.split("@")[0];
  const userDoc = await firestore.collection('users').doc(nomor).get();
  const userData = userDoc.data();

  // Menambahkan pemeriksaan format perintah di awal
  if (args.length < 2) {
    return m.reply(`Format Salah\n\nPetunjuk Penggunaan:\n\nUntuk produk Free Fire : \nFormat Order : *TP PID ID*\nContoh : *TP GPFF5 12345678*\n\nUntuk produk Mobile Legends : \nFormat Order : *TP PID ID SERVER*\nContoh : *TP GPML5 12345678 1234*\n\nUntuk produk lainnya: \nFormat Order : *TP PID TUJUAN*\nContoh : *TP TSEL5 085237859745*`);
  }

  if (!userData) {
    return client.sendMessage(m.chat, { text: `Kamu belum terdaftar, silahkan ketik : *Daftar* untuk bisa mengakses.` }, { quoted: m });
  }

  // Cek waktu pemesanan terakhir
  const lastOrderTime = userData.lastOrderTime ? userData.lastOrderTime.toDate() : null;
  const currentTime = new Date();
  if (lastOrderTime && (currentTime - lastOrderTime) < 5000) {
    return client.sendMessage(m.chat, { text: `Harap tunggu 5 detik sebelum melakukan pemesanan lagi.` }, { quoted: m });
  }

  // Update waktu pemesanan terakhir
  userData.lastOrderTime = currentTime;
  await firestore.collection('users').doc(nomor).set(userData);

  const buyer_sku_code = args[0];
  const lowerCaseSkuCode = buyer_sku_code.toLowerCase();
  const isMobileLegends = lowerCaseSkuCode.includes("ml") || lowerCaseSkuCode.includes("wdp") || lowerCaseSkuCode.includes("wp");
  const isFreeFire = buyer_sku_code.toLowerCase().includes("ff");

  let customer_no;
  let customer_no2;
  let nickname;

  if (isMobileLegends) {
    // Untuk ML, format "TP KODEPRODUK ID ZONEID"
    if (!args[1] || args.length < 2) {
      return m.reply(`Format Salah\nFormat yang benar untuk produk ML adalah : \nOrder Otomatis : *TPO PID ID SERVER*\nOrder Dengan Saldo : *TP PID ID SERVER*`);
    }
    if (args.length < 3) {
      return m.reply(`Format Salah\nFormat yang benar untuk produk ML adalah : \nOrder Otomatis : *TPO PID ID SERVER*\nOrder Dengan Saldo : *TP PID ID SERVER*`);
    }

    const id = args[1];
    const zone_id = args[2];
    customer_no = `${id}${zone_id}`;
    let url = `https://dev.luckycat.my.id/api/stalker/mobile-legend?users=${id}&servers=${zone_id}`;
    let response;
    try {
      response = await axios.get(url);
    } catch (e) {
      console.error('ML Stalker Error:', e.message);
      return m.reply('Gagal memeriksa ID Mobile Legends. Silakan coba lagi nanti.');
    }
    let res = response.data.data;

    if (response.data.status !== true) {
      return m.reply(`ID atau Server yang kamu masukkan tidak ditemukan. Coba lagi.`);
    }
    nickname = res.nickname;
  } else if (isFreeFire) {
    // Untuk FF, format "TP KODEPRODUK ID"
    if (args.length < 2) {
      return m.reply(`Format Salah\nFormat yang benar untuk produk FF adalah : \nOrder Otomatis : *TPO PID ID*\nOrder Dengan Saldo : *TP PID ID*`);
    }

    const id = args[1];
    customer_no = id;
    customer_no2 = id;

    const { stalkff } = require("./lib/stalk-ff.js");
    const nicknameCheck = await stalkff(id);

    if (nicknameCheck.status !== 200) {
      return m.reply(`ID Free Fire yang kamu masukkan tidak ditemukan. Coba lagi.`);
    }
    nickname = nicknameCheck.nickname;
  } else {
    // Untuk produk non-ML dan non-FF, format "TP KODEPRODUK TUJUAN"
    if (args.length < 2) {
      return m.reply(`Format Salah\nFormat yang benar adalah : \nOrder Otomatis : *TPO PID TUJUAN*\nOrder Dengan Saldo : *TP PID TUJUAN*`);
    }
    customer_no = args[1];
  }

  if (args.length < 1) {
    return m.reply(`Format Salah\nFormat yang benar adalah : \`\`\`TP KODEPRODUK TUJUAN\`\`\`\nContoh : TP PLN20 265382928`);
  }

  const productData = JSON.parse(fs.readFileSync("./db/datadigi.json", "utf8"));
  const product = productData.find(
    (prod) => prod.buyer_sku_code.toLowerCase() === buyer_sku_code.toLowerCase()
  );

  if (!product) {
    return m.reply(`Layanan ${buyer_sku_code} tidak ditemukan.`);
  }

  const originalPrice = parseFloat(product.price);
  let markupPercentage = defaultMarkupPercentage;

  const userRole = userData.role;
  if (userRole) {
    if (userRole === "GOLD") {
      markupPercentage = marginGold;
    } else if (userRole === "SILVER") {
      markupPercentage = marginSilver;
    } else if (userRole === "BRONZE") {
      markupPercentage = marginBronze;
    } else if (userRole === "OWNER") {
      markupPercentage = marginOwner;
    }
  }

  const increasedPrice = originalPrice * (1 + markupPercentage);
  let adjustedPrice;
  if (userData.role === "BRONZE" || userData.role === "OWNER") {
    adjustedPrice = Math.floor(increasedPrice);
  } else if (userData.role === "SILVER" || userData.role === "GOLD") {
    adjustedPrice = Math.floor(increasedPrice);
  } else {
    adjustedPrice = increasedPrice;
  }

  if (userData.saldo < adjustedPrice) {
    return m.reply(`Kamu tidak mempunyai cukup saldo untuk melakukan transaksi ${product.product_name}.\n\nSilahkan melakukan deposit saldo dengan cara ketik : *Depo Nominal*\nContoh : *Depo 10000*\n\nMinimum Deposit adalah 100. \nNilai deposit tidak boleh mengandung titik atau koma, hanya angka.`);
  }

  // Simpan saldo awal sebelum dikurangi
  const saldoAwal = userData.saldo;
  userData.saldo -= adjustedPrice;
  await firestore.collection("users").doc(nomor).set(Object.assign({}, userData));

  const ref_id = generateUniqueRefID();
  const signature = crypto.createHash("md5").update(username + apiKey + ref_id).digest("hex");
  const config = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username: username,
      buyer_sku_code: buyer_sku_code,
      customer_no: customer_no,
      ref_id: ref_id,
      sign: signature,
    }),
  };

  const trxPendingMsg = `「 *TRX PENDING* 」

» *Trx ID* : ${ref_id}
» *Target* : ${customer_no}
» *Produk* : ${product.product_name}
» *Harga* : Rp${adjustedPrice.toLocaleString()}

「 *INFO* 」
> *Saldo awal*: Rp. ${saldoAwal.toLocaleString()}
> *Saldo jadi*: Rp. ${userData.saldo.toLocaleString()}
> *Tanggal* : ${hariini}
> *Jam* : ${time1} WIB`;

  client.sendMessage(m.chat, { text: trxPendingMsg }, { quoted: m });

  let response;
  try {
    response = await fetch("https://api.digiflazz.com/v1/transaction", config);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  } catch (e) {
    console.error('Digiflazz Fetch Error:', e.message);
    userData.saldo = saldoAwal;
    await firestore.collection("users").doc(nomor).set(Object.assign({}, userData));
    return m.reply('Gagal memproses transaksi. Silakan coba lagi nanti.');
  }

  const data = await response.json();
  if (!data.data) {
    console.error('Digiflazz Response Error: No data field');
    userData.saldo = saldoAwal;
    await firestore.collection("users").doc(nomor).set(Object.assign({}, userData));
    return m.reply('Gagal memproses transaksi. Respon API tidak valid.');
  }

  let dataStatus = data.data.status;

  while (dataStatus !== "Sukses") {
    await sleep(1000);
    let retryResponse;
    try {
      retryResponse = await fetch("https://api.digiflazz.com/v1/transaction", config);
      if (!retryResponse.ok) {
        throw new Error(`HTTP error! status: ${retryResponse.status}`);
      }
    } catch (e) {
      console.error('Digiflazz Retry Fetch Error:', e.message);
      userData.saldo = saldoAwal;
      await firestore.collection("users").doc(nomor).set(Object.assign({}, userData));
      return m.reply('Gagal memproses transaksi. Silakan coba lagi nanti.');
    }

    const retryData = await retryResponse.json();
    if (!retryData.data) {
      console.error('Digiflazz Retry Response Error: No data field');
      userData.saldo = saldoAwal;
      await firestore.collection("users").doc(nomor).set(Object.assign({}, userData));
      return m.reply('Gagal memproses transaksi. Respon API tidak valid.');
    }

    dataStatus = retryData.data.status;

    if (dataStatus === "Gagal") {
      let capt;
      if (isMobileLegends && nickname) {
        capt = `❌ *Transaksi Gagal*
*${product.product_name}*

» *Invoice* : ${retryData.data.ref_id}
» *Tujuan* : ${customer_no}
» *Nickname* : ${nickname}
» *Waktu* : ${hariini}
» *Jam* : ${time1} WIB
» *Alasan* : ${retryData.data.message}

ⓘ *HARAP HUBUNGI ADMIN*

${namaStore}`;
      } else if (isFreeFire && nickname) {
        capt = `❌ *Transaksi Gagal*
*${product.product_name}*

» *Invoice* : ${retryData.data.ref_id}
» *Tujuan* : ${customer_no}
» *Nickname* : ${nickname}
» *Waktu* : ${hariini}
» *Jam* : ${time1} WIB
» *Alasan* : ${retryData.data.message}

ⓘ *HARAP HUBUNGI ADMIN*

${namaStore}`;
      } else {
        capt = `❌*Transaksi Gagal*
*${product.product_name}*

» *Invoice* : ${retryData.data.ref_id}
» *Tujuan* : ${customer_no}
» *Waktu* : ${hariini}
» *Jam* : ${time1} WIB
» *Alasan* : ${retryData.data.message}

ⓘ *HARAP HUBUNGI ADMIN*

${namaStore}`;
      }

      client.sendMessage(m.chat, { text: capt }, { quoted: m });
      userData.saldo = saldoAwal;
      await firestore.collection("users").doc(nomor).set(Object.assign({}, userData));

      let transactions = [];
      if (fs.existsSync("./db/trx.json")) {
        const rawData = fs.readFileSync("./db/trx.json", "utf8");
        transactions = JSON.parse(rawData);
      }

      const newTransaction = {
        nomor: nomor,
        status: retryData.data.status,
        invoice: retryData.data.ref_id,
        item: product.product_name,
        rc: retryData.data.rc,
        tujuan: customer_no,
        harga: adjustedPrice,
        harga_pokok: originalPrice,
        waktu: `${time1} | ${hariini}`,
      };

      transactions.push(newTransaction);
      fs.writeFileSync("./db/trx.json", JSON.stringify(transactions, null, 2));

      const toOwn = `*TRANSAKSI GAGAL ⚠️*\n\n*» Nama :* ${pushname}\n*» Nomor :* ${m.sender.split("@")[0]}\n» *Produk :* ${product.product_name}\n» *Tujuan :* ${customer_no}\n\n_Harap Periksa Masalah Pada Pembelian_`;

      for (const own of global.owner) {
        client.sendMessage(own + '@s.whatsapp.net', { text: toOwn }, { quoted: m });
      }
      break;
    } else if (dataStatus === "Sukses") {
      let capt;
      if (isMobileLegends && nickname) {
        capt = `*✅〔 TRANSAKSI SUKSES 〕✅*
*${product.product_name}*

» *Invoice* : ${retryData.data.ref_id}
» *Tujuan* : ${customer_no}
» *Nickname* : ${nickname}
» *Waktu* : ${hariini}
» *Jam* : ${time1} WIB

──〔 Serial Number 〕──
${retryData.data.sn}

${namaStore}`;
      } else if (isFreeFire && nickname) {
        capt = `*✅〔 TRANSAKSI SUKSES 〕✅*
*${product.product_name}*

» *Invoice* : ${retryData.data.ref_id}
» *Tujuan* : ${customer_no}
» *Nickname* : ${nickname}
» *Waktu* : ${hariini}
» *Jam* : ${time1} WIB

──〔 Serial Number 〕──
${retryData.data.sn}

${namaStore}`;
      } else {
        capt = `*✅〔 TRANSAKSI SUKSES 〕✅*
*${product.product_name}*

» *Invoice* : ${retryData.data.ref_id}
» *Tujuan* : ${customer_no}
» *Waktu* : ${hariini}
» *Jam* : ${time1} WIB

──〔 Serial Number 〕──
${retryData.data.sn}

${namaStore}`;
      }

      client.sendMessage(m.chat, { text: capt }, { quoted: m });

      let transactions = [];
      if (fs.existsSync("./db/trx.json")) {
        const rawData = fs.readFileSync("./db/trx.json", "utf8");
        transactions = JSON.parse(rawData);
      }
      const newTransaction = {
        nomor: nomor,
        status: retryData.data.status,
        invoice: retryData.data.ref_id,
        item: product.product_name,
        rc: retryData.data.rc,
        tujuan: customer_no,
        harga: adjustedPrice,
        harga_pokok: originalPrice,
        waktu: `${time1} | ${hariini}`,
      };
      transactions.push(newTransaction);
      fs.writeFileSync("./db/trx.json", JSON.stringify(transactions, null, 2));

      const toUser = `Kamu telah melakukan Pembelian *${product.product_name}*\n\n*» Jam* : ${time1} WIB\n*» Harga :* Rp ${adjustedPrice.toLocaleString()}\n*» Sisa Saldo :* Rp ${userData.saldo.toLocaleString()}\n\n*${namaStore}*`;
      const profit = adjustedPrice - originalPrice;
      const toOwn = `*Report Transaksi*\n\n*» Nama :* ${pushname}\n*» Nomor :* ${m.sender.split("@")[0]}\n*» Harga Jual :* ${adjustedPrice}\n*» Harga Pokok :* ${originalPrice}\n*» Keuntungan :* ${profit}\n*» Jam:* ${time1} WIB\n» *Produk :* ${product.product_name}\n» *Tujuan :* *${customer_no}*`;

      setTimeout(() => {
        client.sendMessage(sender, { text: toUser }, { quoted: m });
      }, 5000);

      for (const own of global.owner) {
        client.sendMessage(own + '@s.whatsapp.net', { text: toOwn }, { quoted: m });
      }
      break;
    }
  }
}
break;
            */
  /* tp default       
     case 'tp':
case 'order': {

  const nomor = sender.split("@")[0];
  const userDoc = await firestore.collection('users').doc(nomor).get();
  const userProfile = userDoc.data();
const userData = userDoc.data();
    
    // Menambahkan pemeriksaan format perintah di awal
  if (args.length < 2) {
    return m.reply(`Format Salah\n\nPetunjuk Penggunaan:\n\nUntuk produk Free Fire : \nFormat Order : *TP PID ID*\nContoh : *TP GPFF5 12345678*\n\nUntuk produk Mobile Legends : \nFormat Order : *TP PID ID SERVER*\nContoh : *TP GPML5 12345678 1234*\n\nUntuk produk lainnya: \nFormat Order : *TP PID TUJUAN*\nContoh : *TP TSEL5 085237859745*`);
  }
    
  if (!userProfile) {
    client.sendMessage(m.chat, { text: `Kamu belum terdaftar, silahkan ketik : *Daftar* untuk bisa mengakses.` }, { quoted: m });
  }

  // Cek waktu pemesanan terakhir
  const lastOrderTime = userProfile.lastOrderTime ? userProfile.lastOrderTime.toDate() : null;
  const currentTime = new Date();
  
  if (lastOrderTime && (currentTime - lastOrderTime) < 5000) { // 5000 ms = 5 detik
    client.sendMessage(m.chat, { text: `Harap tunggu 5 detik sebelum melakukan pemesanan lagi.` }, { quoted: m });
  }

  // Update waktu pemesanan terakhir
  userProfile.lastOrderTime = currentTime;
  await firestore.collection('users').doc(nomor).set(userProfile);

  const buyer_sku_code = args[0];
  const lowerCaseSkuCode = buyer_sku_code.toLowerCase();
  const isMobileLegends = lowerCaseSkuCode.includes("ml") || lowerCaseSkuCode.includes("wdp") || lowerCaseSkuCode.includes("wp"); // Cek apakah produk ML
  const isFreeFire = buyer_sku_code.toLowerCase().includes("ff"); // Cek apakah produk FF

  let customer_no; // Menyimpan tujuan, ID, atau ZoneID
  let customer_no2;
  let nickname; // Untuk menyimpan nickname ML/FF jika ada

  if (isMobileLegends) {
    // Untuk ML, format "TP KODEPRODUK ID ZONEID"
    if (args.length < 2) {
      return m.reply(`Format Salah\nFormat yang benar untuk produk FF adalah : \nOrder Otomatis : *TPO PID ID SERVER*\nOrder Dengan Saldo : *TP PID ID SERVER*`);
    }
      
    if (args.length < 3) {
     return m.reply(`Format Salah\nFormat yang benar untuk produk FF adalah : \nOrder Otomatis : *TPO PID ID SERVER*\nOrder Dengan Saldo : *TP PID ID SERVER*`);
    }

    const id = args[1];
    const zone_id = args[2];
    customer_no = `${id}${zone_id}`;
    let url = `https://dev.luckycat.my.id/api/stalker/mobile-legend?users=${id}&servers=${zone_id}`
    let response = await axios(url);
    let res = response.data.data;
    //const { stalkml } = require("./lib/stalk-ml.js");

    //const nicknameCheck = await stalkml(id, zone_id);

    if (response.data.status !== true) { // Jika ID atau ZoneID tidak ditemukan
     return m.reply(`ID atau Server yang kamu masukkan tidak ditemukan. Coba lagi.`);
    }
    
    nickname = res.nickname; // Simpan nickname ML
  } else if (isFreeFire) {
    // Untuk FF, format "TP KODEPRODUK ID"
    if (args.length < 2) {
      return m.reply(`Format Salah\nFormat yang benar untuk produk FF adalah : \nOrder Otomatis : *TPO PID ID*\nOrder Dengan Saldo : *TP PID ID*`);
    }

    const id = args[1];
    customer_no = id;
    customer_no2 = id;

    const { stalkff } = require("./lib/stalk-ff.js");

    const nicknameCheck = await stalkff(id);

    if (nicknameCheck.status !== 200) { // Jika ID FF tidak ditemukan
      return m.reply(`ID Free Fire yang kamu masukkan tidak ditemukan. Coba lagi.`);
    }

    nickname = nicknameCheck.nickname; // Simpan nickname FF
  } else {
    // Untuk produk non-ML dan non-FF, format "TP KODEPRODUK TUJUAN"
    if (args.length < 2) {
      return m.reply(`Format Salah\nFormat yang benar adalah : \nOrder Otomatis : *TPO PID TUJUAN*\nOrder Dengan Saldo : *TP PID TUJUAN*`);
    }

    customer_no = args[1]; // Tujuan untuk produk non-ML dan non-FF
  }
     
  if (args.length < 1) {
    return m.reply(`Format Salah\nFormat yang benar adalah : \`\`\`TP KODEPRODUK TUJUAN\`\`\`\nContoh : TP PLN20 265382928`);
  }

  const productData = JSON.parse(fs.readFileSync("./db/datadigi.json", "utf8"));
  const product = productData.find(
    (prod) => prod.buyer_sku_code.toLowerCase() === buyer_sku_code.toLowerCase()
  );

  if (!product) {
    return m.reply(`Layanan ${buyer_sku_code} tidak ditemukan.`);
  }

  const originalPrice = parseFloat(product.price);
  let markupPercentage = defaultMarkupPercentage; // Marginal default

  // Hitung harga berdasarkan peran pengguna
  const userRole = userProfile.role;
  if (userRole) {
    if (userRole === "GOLD") {
      markupPercentage = marginGold;
    } else if (userRole === "SILVER") {
      markupPercentage = marginSilver;
    } else if (userRole === "BRONZE") {
      markupPercentage = marginBronze;
    } else if (userRole === "OWNER") {
      markupPercentage = marginOwner; // Tidak ada markup untuk owner
    }
  }

  const increasedPrice = originalPrice * (1 + markupPercentage);
    let adjustedPrice;
    
    // Pembulatan harga berdasarkan role pengguna
    if (userProfile.role === "BRONZE" || userProfile.role === "OWNER") {
      adjustedPrice = Math.floor(increasedPrice);
    } else if (userProfile.role === "SILVER" || userProfile.role === "GOLD") {
      adjustedPrice = Math.floor(increasedPrice);
    } else {
      adjustedPrice = increasedPrice; // Jika role tidak dikenali, gunakan harga asli tanpa pembulatan
    }

  if (userProfile.saldo < adjustedPrice) {
    return m.reply(`Kamu tidak mempunyai cukup saldo untuk melakukan transaksi ${product.product_name}.\n\nSilahkan melakukan deposit saldo dengan cara ketik : *Depo Nominal*\nContoh : *Depo 10000*\n\nMinimum Deposit adalah 100. \nNilai deposit tidak boleh mengandung titik atau koma, hanya angka.`);
  }

  userProfile.saldo -= adjustedPrice; // Kurangi saldo pengguna
  await firestore.collection("users").doc(nomor).set(Object.assign({}, userProfile));

  const ref_id = generateUniqueRefID();
  const signature = crypto.createHash("md5").update(username + apiKey + ref_id).digest("hex");
  const config = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username: username,
      buyer_sku_code: buyer_sku_code,
      customer_no: customer_no, // Sesuai dengan apakah ML, FF, atau produk lainnya
      ref_id: ref_id,
      sign: signature,
    }),
  };

  const response = await fetch("https://api.digiflazz.com/v1/transaction", config);
  const data = await response.json();

  const trxPendingMsg = `「 *TRX PENDING* 」

» *Trx ID* : ${ref_id}
» *Target* : ${customer_no}
» *Produk* : ${product.product_name}
» *Harga* : Rp${adjustedPrice.toLocaleString()}

「 *INFO* 」
> *Saldo awal*: Rp. ${userData.saldo.toLocaleString()}
> *Saldo jadi*: Rp. ${(userData.saldo - adjustedPrice).toLocaleString()}
> *Tanggal* : ${hariini}
> *Jam* : ${time1} WIB`;

client.sendMessage(m.chat, { text: trxPendingMsg }, { quoted: m });


  let dataStatus = data.data.status;

  while (dataStatus !== "Sukses") {
    await sleep(1000);
    const retryResponse = await fetch("https://api.digiflazz.com/v1/transaction", config);
    const retryData = await retryResponse.json();
    dataStatus = retryData.data.status;

    if (dataStatus === "Gagal") {
      let capt;

      if (isMobileLegends && nickname) { // Respons untuk ML
        capt = `❌ *Transaksi Gagal*
*${product.product_name}*

» *Invoice* : ${retryData.data.ref_id}
» *Tujuan* : ${customer_no}
» *Nickname* : ${nickname}
» *Waktu* : ${hariini}
» *Jam* : ${time1} WIB
»  *Alasan* : ${retryData.data.message}

ⓘ *HARAP HUBUNGI ADMIN*

${namaStore}`;
      } else if (isFreeFire && nickname) { // Respons untuk FF
        capt = `❌ *Transaksi Gagal*
*${product.product_name}*

» *Invoice* : ${retryData.data.ref_id}
» *Tujuan* : ${customer_no}
» *Nickname* : ${nickname}
» *Waktu* : ${hariini}
» *Jam* : ${time1} WIB
» *Alasan* : ${retryData.data.message}

ⓘ *HARAP HUBUNGI ADMIN*

${namaStore}`;
      } else { // Respons untuk produk non-ML dan non-FF
       capt = `❌*Transaksi Gagal*
*${product.product_name}*

» *Invoice* : ${retryData.data.ref_id}
» *Tujuan* : ${customer_no}
» *Waktu* : ${hariini}
» *Jam* : ${time1} WIB
» *Alasan* : ${retryData.data.message}

ⓘ *HARAP HUBUNGI ADMIN*

${namaStore}`;
      }
	
      client.sendMessage(m.chat, { text: capt }, { quoted: m });
      userProfile.saldo += adjustedPrice; // Kembalikan saldo jika transaksi gagal
      await firestore.collection("users").doc(nomor).set(Object.assign({}, userProfile));

      // Simpan riwayat transaksi
      let transactions = [];
      if (fs.existsSync("./db/trx.json")) {
        const rawData = fs.readFileSync("./db/trx.json", "utf8");
        transactions = JSON.parse(rawData);
      }

      const newTransaction = {
        nomor: nomor,
        status: retryData.data.status,
        invoice: retryData.data.ref_id,
        item: product.product_name,
        rc: retryData.data.rc,
        tujuan: customer_no,
        harga: adjustedPrice,
        harga_pokok: originalPrice,
        waktu: `${time1} | ${hariini}`,
      };

      transactions.push(newTransaction);

      fs.writeFileSync(
        "./db/trx.json",
        JSON.stringify(transactions, null, 2)
      );

       const toOwn = `*TRANSAKSI GAGAL ⚠️*\n\n*» Nama :* ${pushname}\n*» Nomor :* ${m.sender.split("@")[0]}\n» *Produk :* ${product.product_name}\n» *Tujuan : ${customer_no}*\n\n_Harap Periksa Masalah Pada Pembelian_`; 
        
        // Mengirim pesan kepada pemilik tanpa delay
client.sendMessage(owned, {
  text: toOwn,
});
      break;
    } else if (dataStatus === "Sukses") {
      // Contoh data invoice
      const data = {
        invoice: retryData.data.ref_id,
        product: product.product_name,
        tujuan: customer_no,
        nickname: nickname,  
        harga: adjustedPrice,
        waktu: `${hariini}`,
        sn: retryData.data.sn,
      };

        
     // const backgroundPath = path.join(__dirname, "assets", "BG.png"); // Path ke latar belakang
      //const logoPath = `${linkLOGO}`; // Path ke logo

     // generateInvoiceWithBackground(data, backgroundPath, logoPath).then((invoicePath) => {
     //   if (fs.existsSync(invoicePath)) 
            
       let capt;
if (isMobileLegends && nickname) {
  capt = `*✅〔 TRANSAKSI SUKSES 〕✅*
*${product.product_name}*

» *Invoice* : ${retryData.data.ref_id}
» *Tujuan* : ${customer_no}
» *Nickname* : ${nickname}
» *Waktu* : ${hariini}
» *Jam* : ${time1} WIB

──〔 Serial Number 〕──
${retryData.data.sn}

${namaStore}`;
} else if (isFreeFire && nickname) {
  capt = `*✅〔 TRANSAKSI SUKSES 〕✅*
*${product.product_name}*

» *Invoice* : ${retryData.data.ref_id}
» *Tujuan* : ${customer_no}
» *Nickname* : ${nickname}
» *Waktu* : ${hariini}
» *Jam* : ${time1} WIB

──〔 Serial Number 〕──
${retryData.data.sn}

${namaStore}`;
} else {
  capt = `*✅〔 TRANSAKSI SUKSES 〕✅*
*${product.product_name}*

» *Invoice* : ${retryData.data.ref_id}
» *Tujuan* : ${customer_no}
» *Waktu* : ${hariini}
» *Jam* : ${time1} WIB

──〔 Serial Number 〕──
${retryData.data.sn}

${namaStore}`;
}

// Balas langsung ke user (group / private)
client.sendMessage(m.chat, { text: capt }, { quoted: m });


      let transactions = [];
      if (fs.existsSync("./db/trx.json")) {
        const rawData = fs.readFileSync("./db/trx.json", "utf8");
        transactions = JSON.parse(rawData);
      }
      const newTransaction = {
        nomor: nomor,
        status: retryData.data.status,
        invoice: retryData.data.ref_id,
        item: product.product_name,
        rc: retryData.data.rc,
        tujuan: customer_no,
        harga: adjustedPrice,
        harga_pokok: originalPrice,
        waktu: `${time1} | ${hariini}`,
      };
      transactions.push(newTransaction);
      fs.writeFileSync(
        "./db/trx.json",
        JSON.stringify(transactions, null, 2)
      );
      const toUser = `Kamu telah melakukan Pembelian *${product.product_name}*\n\n*» Jam* : ${time1} WIB\n*» Harga :* Rp ${adjustedPrice.toLocaleString()}\n*» Sisa Saldo :* Rp ${userProfile.saldo.toLocaleString()}\n\n*${namaStore}*`;
const profit = adjustedPrice - originalPrice; // Menghitung keuntungan
const toOwn = `*Report Transaksi*\n\n*» Nama :* ${pushname}\n*» Nomor :* ${m.sender.split("@")[0]}\n*» Harga Jual :* ${adjustedPrice}\n*» Harga Pokok :* ${originalPrice}\n*» Keuntungan :* ${profit}\n*» Jam:* ${time1} WIB\n» *Produk :* ${product.product_name}\n» *Tujuan : ${customer_no}*`;

// Mengirim pesan kepada user dengan delay 5 detik
setTimeout(() => {
  client.sendMessage(sender, {
    text: toUser,
  });
}, 5000);

// Mengirim pesan kepada pemilik tanpa delay
client.sendMessage(owned, {
  text: toOwn,
});
      break;
    }
  }
}
break;
*/
            //case tpo tes gemini
		case 'tpo': 
        case 'qr' :
        case 'scan' :{
    // --- Bagian Awal: Validasi & Persiapan Data ---
    const nomor = sender.split("@")[0];
    const userRef = firestore.collection('users').doc(nomor);
    const userDoc = await userRef.get();
    if (!userDoc.exists) return m.reply('Kamu belum terdaftar, silahkan ketik *Daftar*');

    const existingTrxQuery = await firestore.collection('transactions')
        .where('nomor', '==', nomor)
        .where('status', '==', 'waiting')
        .where('metode', '==', 'QRIS')
        .limit(1).get();
  
    if (!existingTrxQuery.empty) {
        return m.reply('Kamu masih memiliki transaksi QRIS yang belum dibayar. Harap selesaikan atau tunggu hingga kadaluwarsa.');
    }

    const [sku, ...idParts] = args;
    if (!sku || idParts.length === 0) return m.reply(`Format salah. Contoh:\n${prefix}tpo ML59 12345678 1234`);

    const tujuan = idParts.join('');
    const userProfile = userDoc.data();
    const data = JSON.parse(fs.readFileSync('./db/datadigi.json'));
    const product = data.find(p => p.buyer_sku_code.toLowerCase() === sku.toLowerCase());
    if (!product) return m.reply(`Produk *${sku}* tidak ditemukan.`);

    const originalPrice = parseFloat(product.price);
    const role = userProfile.role || 'BRONZE';
    const markup = role === 'GOLD' ? marginGold :
                   role === 'SILVER' ? marginSilver :
                   role === 'OWNER' ? marginOwner : marginBronze;
    let increasedPrice = originalPrice * (1 + markup);
    let adjustedPrice = Math.floor(increasedPrice);

    // --- Bagian B: Logika Kode Unik & Total Bayar ---
    const uniqueCode = Math.floor(Math.random() * 100) + 1;
    const finalAmount = adjustedPrice + uniqueCode;
    const ref_id = generateUniqueRefID();
    const transactionRef = firestore.collection('transactions').doc(ref_id);

    try {
        const pay = await axios.get(`https://restapi.simplebot.my.id/orderkuota/createpayment?apikey=new&amount=${finalAmount}&codeqr=${codeqr}`);
        if (!pay.data?.result?.imageqris?.url) {
            throw new Error('Gagal mendapatkan URL gambar QRIS dari API.');
        }
        const image = pay.data.result.imageqris.url;

        const now = moment.tz('Asia/Jakarta');
        const expireAt = now.clone().add(5, 'minutes');
        const expiredText = expireAt.format('HH:mm:ss');

        const caption = `─────〔 *DETAIL PESANAN* 〕─────

*» TRX ID :* ${ref_id}
*» Produk :* ${product.product_name}
*» Tujuan :* ${tujuan}
*» Harga :* Rp ${adjustedPrice.toLocaleString()}
*» Kode Unik :* Rp ${uniqueCode.toLocaleString()}
*» Total Bayar :* *Rp ${finalAmount.toLocaleString()}*

*» Kedaluwarsa :* ${expiredText} WIB
*» Status : Belum Dibayar*

*PENTING:* Mohon transfer sesuai dengan nominal *Total Bayar* agar pembayaran terdeteksi otomatis.

Scan QRIS di atas melalui *BANK* atau e-Wallet (*Dana, Ovo, Gopay, dll*) untuk menyelesaikan pembayaran.`;

        const sentMsg = await client.sendMessage(m.chat, { image: { url: image }, caption }, { quoted: m });

        // --- Bagian C: Manajemen Status via Firestore ---
        const plainMessageKey = {
            remoteJid: sentMsg.key.remoteJid,
            id: sentMsg.key.id,
            fromMe: sentMsg.key.fromMe
        };
        const transactionData = {
            nomor, ref_id, status: 'waiting', metode: 'QRIS',
            product_name: product.product_name, tujuan: tujuan,
            harga_jual: adjustedPrice, kode_unik: uniqueCode, total_bayar: finalAmount,
            harga_pokok: originalPrice, dibuat_pada: new Date(),
            kedaluwarsa_pada: expireAt.toDate(), messageKey: plainMessageKey,
            sku: sku, sn: null
        };
        await transactionRef.set(transactionData);

        // --- Bagian D: Polling Cerdas ---
        const apiUrl = `https://gateway.okeconnect.com/api/mutasi/qris/${merchant}/${keyorkut}`;
        const interval = setInterval(async () => {
            const txDoc = await transactionRef.get();
            if (!txDoc.exists) { clearInterval(interval); return; }
            const trx = txDoc.data();

            if (trx.status !== 'waiting') { clearInterval(interval); return; }

            if (Date.now() > trx.kedaluwarsa_pada.toDate().getTime()) {
                await client.sendMessage(m.chat, { delete: trx.messageKey });
                await transactionRef.update({ status: 'Expired' });
                await client.sendMessage(m.chat, { text: 'QRIS code telah kadaluwarsa. Silakan buat pesanan baru.'}, { quoted: m });
                clearInterval(interval);
                return;
            }

            try {
                const response = await axios.get(apiUrl);
                if (response.data.status !== 'success') return;

                const cache = readDatabase(); 
                const found = response.data.data.find(d =>
                    parseInt(d.amount) === trx.total_bayar &&
                    !cache.issuerRefs.includes(d.issuer_reff)
                );

                if (!found) return;

                // --- PEMBAYARAN DITEMUKAN! ---
                clearInterval(interval);
                await transactionRef.update({ status: 'paid' });
                
                cache.issuerRefs.push(found.issuer_reff);
                saveDatabase(cache);

                await client.sendMessage(m.chat, { delete: trx.messageKey });
                
                const processingMsg = `*_Pembayaran diterima._*\n\nMemproses pesanan untuk *${trx.product_name}* dengan invoice *${trx.ref_id}*...`;
                await client.sendMessage(m.chat, { text: processingMsg }, { quoted: m });

                // --- Bagian E: Proses Pesanan ke Digiflazz ---
                const sign = crypto.createHash('md5').update(username + apiKey + trx.ref_id).digest('hex');
                const orderBody = { username, buyer_sku_code: trx.sku, customer_no: trx.tujuan, ref_id: trx.ref_id, sign };
                
                let digiflazzData;
                while (true) {
                    const res = await axios.post('https://api.digiflazz.com/v1/transaction', orderBody, { headers: { 'Content-Type': 'application/json' } }).catch(err => err.response);
                    digiflazzData = res.data?.data;
                    if (!digiflazzData || (digiflazzData.status !== 'Pending' && digiflazzData.status !== 'Proses')) break;
                    await new Promise(r => setTimeout(r, 5000));
                }

                const time1 = new Date().toLocaleTimeString('id-ID', { hour12: false });
                const hariini = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
                const pushname = m.pushName || '-';

                if (digiflazzData.status === 'Sukses') {
                    // --- [DIPERBAIKI] Gunakan admin.firestore.FieldValue ---
                  //  await userRef.update({ saldo: admin.firestore.FieldValue.increment(trx.kode_unik) });
                    //await transactionRef.update({ status: 'Sukses', sn: digiflazzData.sn });
					// GANTIKAN DENGAN BLOK INI:
					await transactionRef.update({ status: 'Sukses', sn: digiflazzData.sn });

// 1. Catat history ke sub-collection yang benar
					const historyData = {
    					tanggal: new Date(),
    					produk: trx.product_name,
						harga: trx.harga_jual,
						tujuan: trx.tujuan,
						invoice: trx.ref_id,
    					sn: digiflazzData.sn,
						status: 'Sukses',
    					metode: 'QRIS'
					};
					await userRef.collection('transactions').doc(trx.ref_id).set(historyData);
                    await userRef.update({
    					saldo: admin.firestore.FieldValue.increment(trx.kode_unik),
    					total_spend: admin.firestore.FieldValue.increment(trx.harga_jual),
    					jumlah_transaksi_sukses: admin.firestore.FieldValue.increment(1),
   						lastOrderTime: new Date() // <-- PENAMBAHANNYA ADA DI SINI
					});
                    const profit = trx.harga_jual - trx.harga_pokok;
                    const struk = `*✅〔 TRANSAKSI SUKSES 〕✅*\n*${trx.product_name}*\n\n» *Invoice :* ${trx.ref_id}\n» *Tujuan :* ${trx.tujuan}\n» *Harga :* Rp. ${trx.harga_jual.toLocaleString()}\n» *Waktu :* ${hariini}\n» *Jam :* ${time1} WIB\n\n──〔 Serial Number 〕──\n${digiflazzData.sn}\n\n${namaStore}`;
                    await client.sendMessage(m.chat, { text: struk }, { quoted: m });

                    const saldoTerbaruUser = (await userRef.get()).data().saldo;
                    const toUser = `✅ Pembelian *${trx.product_name}* berhasil!\n\n» *Invoice* : ${trx.ref_id}\n» *Tujuan* : ${trx.tujuan}\n» *Total Bayar* : Rp ${trx.total_bayar.toLocaleString()}\n\n*Bonus kode unik sebesar Rp ${trx.kode_unik.toLocaleString()} telah ditambahkan ke saldo Anda.*\n» *Saldo Anda Sekarang* : Rp ${saldoTerbaruUser.toLocaleString()}\n\nTerima kasih telah bertransaksi di *${namaStore}*!`;
                    await client.sendMessage(sender, { text: toUser }, { quoted: m });
                    
                    const toOwn = `*✅ Report Transaksi (QRIS)*\n\n» *Invoice* : ${trx.ref_id}\n» *Nama :* ${pushname}\n» *Nomor :* ${trx.nomor}\n» *Produk :* ${trx.product_name}\n» *Harga Jual :* ${trx.harga_jual.toLocaleString()}\n» *Harga Pokok :* ${trx.harga_pokok.toLocaleString()}\n» *Keuntungan :* ${profit.toLocaleString()}`;
                    for (const own of global.owner) {
                        await client.sendMessage(own + '@s.whatsapp.net', { text: toOwn }, { quoted: m });
                    }

                } else {
                    const reason = digiflazzData.message || 'Produk sedang gangguan dari provider.';
                    await transactionRef.update({ status: 'Gagal', sn: reason });
                    
                    // --- [DIPERBAIKI] Gunakan admin.firestore.FieldValue ---
                    await userRef.update({ saldo: admin.firestore.FieldValue.increment(trx.total_bayar) });
                    const saldoSetelahRefund = (await userRef.get()).data().saldo;

                    const gagal = `❌ *Transaksi Gagal*\n\n*${trx.product_name}*\n» *Invoice* : ${trx.ref_id}\n» *Tujuan* : ${trx.tujuan}\n» *Alasan* : ${reason}\n\nⓘ *DANA SEBESAR RP ${trx.total_bayar.toLocaleString()} TELAH DIKEMBALIKAN OTOMATIS KE SALDO ANDA.*\n*Saldo Anda Sekarang: Rp ${saldoSetelahRefund.toLocaleString()}* \n\n${namaStore}`;
                    await client.sendMessage(m.chat, { text: gagal }, { quoted: m });
                }
                
                const finalCache = readDatabase();
                if (finalCache.issuerRefs) {
                    finalCache.issuerRefs = finalCache.issuerRefs.filter(ref => ref !== found.issuer_reff);
                    saveDatabase(finalCache);
                }

            } catch (e) {
                console.error('TPO Polling Error:', e.message);
                clearInterval(interval);
                await transactionRef.update({ status: 'Error', sn: e.message });
            }
        }, 10000);

    } catch (e) {
        console.error('TPO Main Error:', e);
        return m.reply('Terjadi kesalahan sistem saat membuat permintaan pembayaran. Silakan coba lagi nanti.');
    }
    break;
}
            
            //case tpo default1/*
/*            case 'tpo':
case 'qr':
case 'scan': {
  const nomor = sender.split("@")[0];
  const userRef = db.collection('users').doc(nomor);
  const userDoc = await userRef.get();
  if (!userDoc.exists) return m.reply('Kamu belum terdaftar, silahkan ketik *Daftar*');

  const [sku, ...idParts] = args;
  if (!sku || idParts.length === 0) return m.reply(`Format salah. Contoh:\n${prefix}tpo ML59 12345678 1234`);

  const tujuan = idParts.join('');
  const userProfile = userDoc.data();
  const data = JSON.parse(fs.readFileSync('./db/datadigi.json'));
  const product = data.find(p => p.buyer_sku_code.toLowerCase() === sku.toLowerCase());
  if (!product) return m.reply(`Produk *${sku}* tidak ditemukan.`);

  const originalPrice = parseFloat(product.price);
  const role = userProfile.role || 'BRONZE';
  const markup = role === 'GOLD' ? marginGold :
                 role === 'SILVER' ? marginSilver :
                 role === 'OWNER' ? marginOwner : marginBronze;
  let increasedPrice = originalPrice * (1 + markup);
let adjustedPrice;

if (role === 'BRONZE' || role === 'OWNER') {
  adjustedPrice = Math.floor(increasedPrice);
} else if (role === 'SILVER' || role === 'GOLD') {
  adjustedPrice = Math.floor(increasedPrice);
} else {
  adjustedPrice = increasedPrice;
}
  const ref_id = generateUniqueRefID();

  try {
    const pay = await axios.get(`https://restapi.simplebot.my.id/orderkuota/createpayment?apikey=new&amount=${adjustedPrice}&codeqr=${codeqr}`);
    const image = pay.data.result.imageqris.url;

  	const now = moment.tz('Asia/Jakarta');
	const expireAt = now.clone().add(5, 'minutes');
	const expiredText = expireAt.format('HH:mm:ss');

    const caption = `─────〔 *DETAIL PESANAN* 〕─────

*» TRX ID :* ${ref_id}
*» Produk :* ${product.product_name}
*» Tujuan* : ${tujuan}
*» Harga :* Rp. ${adjustedPrice.toLocaleString()}
*» Pajak Bayar :* 0%
*» Total Bayar :* Rp. ${adjustedPrice.toLocaleString()}
*» Kedaluwarsa :* ${expiredText} WIB

*» Status : Belum Dibayar*

Kamu bisa scan QRIS tersebut melalui *BANK* dan e-Wallet seperti *Dana, Ovo, Gopay, Shopeepay, dll*. Silakan scan QRIS di atas untuk menyelesaikan pembayaran sebelum waktu kedaluwarsa.`;

    const sentMsg = await client.sendMessage(m.chat, { image: { url: image }, caption }, { quoted: m });

    const apiUrl = `https://gateway.okeconnect.com/api/mutasi/qris/${merchant}/${keyorkut}`;
    const cache = readDatabase();
    const startTime = Date.now();
    let paid = false;

    const interval = setInterval(async () => {
      const now = Date.now();
      if (now - startTime > 5 * 60000) {
        if (!paid) {
          await client.sendMessage(m.chat, { delete: sentMsg.key });
          m.reply('Qrcode telah kadaluarsa silahkan input ulang');
        }
        clearInterval(interval);
        return;
      }

      try {
        const response = await axios.get(apiUrl);
        if (response.data.status !== 'success') return;

        const found = response.data.data.find(d => parseInt(d.amount) === adjustedPrice && !cache.issuerRefs.includes(d.issuer_reff));
        if (!found) return;

        paid = true;
        clearInterval(interval);

        cache.issuerRefs.push(found.issuer_reff);
        saveDatabase(cache);

        await client.sendMessage(m.chat, { delete: sentMsg.key });
        m.reply(`*_Pembayaran diterima. Memproses pesanan..._*`);

        const sign = crypto.createHash('md5').update(username + apiKey + ref_id).digest('hex');
        const orderBody = {
          username,
          buyer_sku_code: sku,
          customer_no: tujuan,
          ref_id,
          sign
        };

        let trxData;
        while (true) {
          try {
            const res = await axios.post('https://api.digiflazz.com/v1/transaction', orderBody, {
              headers: { 'Content-Type': 'application/json' }
            });

            if (res.status === 400 || res.data?.data?.status === 'Gagal') {
              const reason = res.data?.data?.message || 'Produk sedang gangguan';
              const time1 = new Date().toLocaleTimeString('id-ID', { hour12: false });
              const hariini = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
              await userRef.update({ saldo: userProfile.saldo + adjustedPrice });

              const gagal = `❌ *Transaksi Gagal* 

*${product.product_name}*
» *Invoice* : ${ref_id}
» *Tujuan* : ${tujuan}
» *Waktu* : ${hariini}
» *Jam* : ${time1} WIB
» *Alasan* : ${reason}

ⓘ *HARAP HUBUNGI ADMIN*

${namaStore}`;
              await client.sendMessage(m.chat, { text: gagal }, { quoted: m });
              return;
            }

            trxData = res.data?.data;
            if (trxData.status !== 'Pending') break;
            await new Promise(r => setTimeout(r, 5000));
          } catch (err) {
            if (err.response?.status === 400) {
              const reason = err.response?.data?.data?.message || 'Produk sedang gangguan';
              const time1 = new Date().toLocaleTimeString('id-ID', { hour12: false });
              const hariini = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
              await userRef.update({ saldo: userProfile.saldo + adjustedPrice });

              const gagal = `❌ *Transaksi Gagal*

*${product.product_name}*
» *Invoice* : ${ref_id}
» *Tujuan* : ${tujuan}
» *Waktu* : ${hariini}
» *Jam* : ${time1} WIB
» *Alasan* : ${reason}

ⓘ *HARAP HUBUNGI ADMIN*

${namaStore}`;
              await client.sendMessage(m.chat, { text: gagal }, { quoted: m });
              return;
            } else {
              console.error('Polling Error:', err.message);
            }
          }
        }

        const time1 = new Date().toLocaleTimeString('id-ID', { hour12: false });
        const hariini = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
        const pushname = m.pushName || '-';
        const profit = adjustedPrice - originalPrice;

        if (trxData.status === 'Sukses') {
          const toUser = `Kamu telah melakukan Pembelian *${product.product_name}*\n\n*» Jam* : ${time1} WIB\n*» Harga :* Rp ${adjustedPrice.toLocaleString()}\n*» Sisa Saldo :* Rp ${userProfile.saldo.toLocaleString()}\n\n*${namaStore}*`;
          const toOwn = `*Report Transaksi*\n\n*» Nama :* ${pushname}\n*» Nomor :* ${nomor}\n*» Harga Jual :* ${adjustedPrice}\n*» Harga Pokok :* ${originalPrice}\n*» Keuntungan :* ${profit}\n*» Jam:* ${time1} WIB\n» *Produk :* ${product.product_name}\n» *Tujuan : ${tujuan}*`;

          client.sendMessage(sender, { text: toUser });
          for (const own of global.owner) {
            await client.sendMessage(own + '@s.whatsapp.net', { text: toOwn });
          }

          const trx = JSON.parse(fs.readFileSync('./db/trx.json'));
          trx.push({
            nomor, invoice: trxData.ref_id,
            status: trxData.status,
            tujuan, item: product.product_name,
            harga: adjustedPrice,
            harga_pokok: originalPrice,
            keuntungan: profit,
            waktu: `${time1} | ${hariini}`
          });
          fs.writeFileSync('./db/trx.json', JSON.stringify(trx, null, 2));

          const struk = `*✅〔 TRANSAKSI SUKSES 〕✅*
*${product.product_name}*

» *Invoice :* ${trxData.ref_id}
» *Tujuan :* ${tujuan}
» *Harga :* Rp. ${adjustedPrice.toLocaleString()}
» *Waktu :* ${hariini}
» *Jam :* ${time1} WIB

──〔 Serial Number 〕──
${trxData.sn}

${namaStore}`;
          return client.sendMessage(m.chat, { text: struk }, { quoted: m });
        }

      } catch (e) {
        console.error('Polling Error:', e.message);
      }
    }, 10000); // setiap 10 detik
  } catch (e) {
    console.error('TPO ERROR:', e);
    return m.reply('Terjadi kesalahan saat memproses pembayaran.');
  }
  break;
}
*/            
    /*    case 'tpo':
case 'qr':
        case 'scan':{
  const nomor = sender.split("@")[0];
  const userRef = db.collection('users').doc(nomor);
  const userDoc = await userRef.get();
  if (!userDoc.exists) return m.reply('Kamu belum terdaftar, silahkan ketik *Daftar*');

  const [sku, ...idParts] = args;
  if (!sku || idParts.length === 0) return m.reply(`Format salah. Contoh:\n${prefix}tpo ML59 12345678 1234`);

  const tujuan = idParts.join('');
  const userProfile = userDoc.data();
  const data = JSON.parse(fs.readFileSync('./db/datadigi.json'));
  const product = data.find(p => p.buyer_sku_code.toLowerCase() === sku.toLowerCase());
  if (!product) return m.reply(`Produk *${sku}* tidak ditemukan.`);

  const originalPrice = parseFloat(product.price);
  const role = userProfile.role || 'BRONZE';
  const markup = role === 'GOLD' ? marginGold :
                 role === 'SILVER' ? marginSilver :
                 role === 'OWNER' ? marginOwner : marginBronze;
  const adjustedPrice = Math.floor(originalPrice * (1 + markup));

  const buyer3 = () => Math.floor(Math.random() * 100) + 1;
  const randomExtra = buyer3();
  const totalAmount = adjustedPrice + randomExtra;
  const ref_id = generateUniqueRefID();

  try {
    const pay = await axios.get(`https://restapi.simplebot.my.id/orderkuota/createpayment?apikey=new&amount=${totalAmount}&codeqr=${codeqr}`);
    const image = pay.data.result.imageqris.url;

    const now = new Date();
    const expireAt = new Date(now.getTime() + 5 * 60000);
    const expiredText = `${expireAt.getHours().toString().padStart(2, '0')}:${expireAt.getMinutes().toString().padStart(2, '0')}`;

    const caption = `â”€â”€ã€” *DETAIL PESANAN* ã€•â”€â”€

*Â» Ref ID :* ${ref_id}
*Â» Produk :* ${product.product_name}
*Â» Tujuan* : ${tujuan}
*Â» Harga :* Rp. ${adjustedPrice.toLocaleString()}
*Â» Pajak Bayar* : 0%
*Â» Kode Unik :* Rp ${randomExtra}
*Â» Total Bayar :* Rp. ${totalAmount.toLocaleString()}

*Status : Belum Dibayar*

Kamu bisa scan QRIS tersebut melalui *BANK* dan e-Wallet seperti *Dana, Ovo, Gopay, Shopeepay, dll*

*_Note :_* Pesanan kamu akan diproses otomatis setelah pembayaran selesai, batas waktu transfer adalah 5 menit sejak deposit dibuat, dan kode unik akan masuk ke saldo kamu jika transaksi sukses maupun gagal.`;

    const sentMsg = await client.sendMessage(m.chat, { image: { url: image }, caption }, { quoted: m });

    const apiUrl = `https://gateway.okeconnect.com/api/mutasi/qris/${merchant}/${keyorkut}`;
    const cache = readDatabase();
    const startTime = Date.now();
    let paid = false;

    const interval = setInterval(async () => {
      const now = Date.now();
      if (now - startTime > 5 * 60000) {
        if (!paid) {
          await client.sendMessage(m.chat, { delete: sentMsg.key });
          m.reply('Qrcode telah kadaluarsa silahkan input ulang');
        }
        clearInterval(interval);
        return;
      }

      try {
        const response = await axios.get(apiUrl);
        if (response.data.status !== 'success') return;

        const found = response.data.data.find(d => parseInt(d.amount) === totalAmount && !cache.issuerRefs.includes(d.issuer_reff));
        if (!found) return;

        paid = true;
        clearInterval(interval);

        cache.issuerRefs.push(found.issuer_reff);
        saveDatabase(cache);

        // Tambahkan kode unik ke saldo user
        const finalSaldo = userProfile.saldo + randomExtra;
        await userRef.update({ saldo: finalSaldo });

        await client.sendMessage(m.chat, { delete: sentMsg.key });
        m.reply(`*_Pembayaran diterima. Memproses pesanan..._*`);

        const sign = crypto.createHash('md5').update(username + apiKey + ref_id).digest('hex');
        const orderBody = {
          username,
          buyer_sku_code: sku,
          customer_no: tujuan,
          ref_id,
          sign
        };

        let trxData;
        for (let i = 0; i < 15; i++) {
          const res = await axios.post('https://api.digiflazz.com/v1/transaction', orderBody, {
            headers: { 'Content-Type': 'application/json' }
          });
          trxData = res.data?.data;
          if (trxData.status !== 'Pending') break;
          await new Promise(r => setTimeout(r, 3000));
        }

        if (trxData.status === 'Sukses') {
          const time1 = new Date().toLocaleTimeString('id-ID', { hour12: false });
          const profit = adjustedPrice - originalPrice;

          // Notif ke user
          const toUser = `Kamu telah melakukan Pembelian *${product.product_name}*\n\n*Â» Jam* : ${time1} WIB\n*Â» Harga :* Rp ${adjustedPrice.toLocaleString()}\n*Â» Sisa Saldo :* Rp ${finalSaldo.toLocaleString()}\n\n*${namaStore}*`;
          //await client.sendMessage(m.chat, { text: toUser }, { quoted: m });
            setTimeout(() => {
  client.sendMessage(sender, {
    text: toUser,
  });
}, 5000);

          // Notif ke owner
          const pushname = m.pushName || '-';
          const toOwn = `*Report Transaksi*\n\n*Â» Nama :* ${pushname}\n*Â» Nomor :* ${nomor}\n*Â» Harga Jual :* ${adjustedPrice}\n*Â» Harga Pokok :* ${originalPrice}\n*Â» Keuntungan :* ${profit}\n*Â» Jam:* ${time1} WIB\nÂ» *Produk :* ${product.product_name}\nÂ» *Tujuan :* ${tujuan}`;
          for (const own of global.owner) {
            await client.sendMessage(own + '@s.whatsapp.net', { text: toOwn });
          }

          // Simpan trx
          const trx = JSON.parse(fs.readFileSync('./db/trx.json'));
          trx.push({
            nomor, invoice: trxData.ref_id,
            status: trxData.status,
            tujuan, item: product.product_name,
            harga: adjustedPrice,
            harga_pokok: originalPrice,
            keuntungan: profit,
            waktu: `${time1} | ${hariini}`
          });
          fs.writeFileSync('./db/trx.json', JSON.stringify(trx, null, 2));

          const struk = `âœ… *TRANSAKSI SUKSES* âœ…
*${product.product_name}*

*Â» Invoice :* ${trxData.ref_id}
*Â» Tujuan :* ${tujuan}
*Â» Harga :* Rp. ${adjustedPrice.toLocaleString()}
Â» *Waktu* : ${hariini}
Â» *Jam* : ${time1} WIB

â”€â”€ã€” *Serial Number* ã€•â”€â”€
${retryData.data.sn}

*â”ˆâ”ˆâ‹†ãƒ»ê’° ${namaStore} ê’±ãƒ»â‹†â”ˆâ”ˆ*`;
          return client.sendMessage(m.chat, { text: struk }, { quoted: m });
        } else {
          return m.reply(`âŒ Transaksi gagal: ${trxData.message}`);
        }
      } catch (e) {
        console.error('Polling Error:', e.message);
      }
    }, 10000); // setiap 10 detik
  } catch (e) {
    console.error('TPO ERROR:', e);
    return m.reply('Terjadi kesalahan saat memproses pembayaran.');
  }
  break;
} */
        /*
case 'inv': {
  // Data contoh untuk invoice
  const testData = {
    invoice: "12345",
    product: "Sample Product",
    tujuan: "123456789",
    harga: 50000,
    waktu: "12:00 WIB | 01-01-2023"
    sn: "2694-1454-2414-8989-7678/ERINA-DAMAYANTI/KMR-5/R1M/900/33.7"  
  };

  const backgroundPath = path.join(__dirname, "assets", "BG.png"); // Path ke latar belakang
  const logoPath = `${linkLOGO}`; // Path ke logo

  generateInvoiceWithBackground(testData, backgroundPath, logoPath).then((invoicePath) => {
    if (fs.existsSync(invoicePath)) {
      // Kirim gambar invoice untuk pengujian
      const imageMessage = {
        caption: "Ini adalah contoh gambar invoice",
        image: { url: invoicePath },
      };

      client.sendMessage(sender, imageMessage); // Kirim gambar invoice untuk pengujian
    } else {
      m.reply("Gambar invoice tidak ditemukan.");
    }
  });

  break;
}
            *//*
case 'buy': {
  const nomor = sender.split('@')[0];
  const [jenisProduk, userId, zoneId, jumlahRaw] = args;
  const jumlah = parseInt(jumlahRaw);
  if (!jenisProduk || !userId || !zoneId || isNaN(jumlah) || jumlah < 1) {
    return m.reply(`Format salah!\nContoh:\n> buy slbasic 12345678 1234 1`);
  }

  // Cek user
  const userRef = db.collection('users').doc(nomor);
  const userDoc = await userRef.get();
  if (!userDoc.exists) return m.reply('Kamu belum terdaftar. Silakan ketik *Daftar*');
  const userProfile = userDoc.data();

  // Validasi saldo awal
  const saldoAwal = parseFloat(userProfile.saldo) || 0;
  if (isNaN(saldoAwal)) {
    console.error('Saldo awal tidak valid:', userProfile.saldo);
    return m.reply('❌ Saldo kamu tidak valid. Hubungi owner.');
  }

  // Validasi nickname ML
  let nicknameUser = 'Tidak ditemukan';
  try {
    const params = new URLSearchParams();
    params.append('country', 'SG');
    params.append('userId', userId);
    params.append('voucherTypeName', 'MOBILE_LEGENDS');
    params.append('zoneId', zoneId);

    const response = await fetch('https://order-sg.codashop.com/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
      body: params
    });
    const data = await response.json();
    if (data.success !== false && data.result?.username) {
      nicknameUser = decodeURIComponent(data.result.username).replace(/\+/g, ' ');
    } else {
      return m.reply('❌ Gagal validasi nickname. Pastikan ID dan Server benar.');
    }
  } catch (e) {
    console.error('Error validasi ML:', e.message);
    return m.reply('❌ Terjadi kesalahan saat validasi nickname.');
  }

  // Cek stok
  const stokFile = JSON.parse(fs.readFileSync('./db/stok.json'));
  if (!stokFile[jenisProduk] || stokFile[jenisProduk].length < jumlah) {
    return m.reply(`❌ *TRANSAKSI GAGAL*\n\n» *Alasan* : Stok belum diupdate atau kosong.\n\n*${namaStore}*`);
  }

  // Hitung harga
  const role = userProfile.role || 'BRONZE';
  console.log('Cek harga:', { jenisProduk, role });
  delete require.cache[require.resolve('./db/config.js')];
  console.log('Loading config from:', require.resolve('./db/config.js'));
  const config = require('./db/config.js');
  console.log('Config loaded:', config);
  let hargaPerItem;
  if (jenisProduk === 'slpremium') {
    hargaPerItem = role === 'GOLD' ? config.priceGoldPremium :
                    role === 'SILVER' ? config.priceSilverPremium :
                    role === 'OWNER' ? config.priceOwnerPremium : config.priceBronzePremium;
  } else {
    hargaPerItem = role === 'GOLD' ? config.priceGold :
                    role === 'SILVER' ? config.priceSilver :
                    role === 'OWNER' ? config.priceOwner : config.priceBronze;
  }
  hargaPerItem = hargaPerItem || (jenisProduk === 'slpremium' ? 15000 : 10000); // Fallback
  if (!hargaPerItem || isNaN(hargaPerItem)) {
    console.error('Harga tidak valid:', { jenisProduk, role, config });
    throw new Error(`Harga untuk ${jenisProduk} tidak ditemukan di config untuk role ${role}`);
  }
  const baseTotal = hargaPerItem * jumlah;
  if (isNaN(baseTotal)) {
    console.error('Base total tidak valid:', { hargaPerItem, jumlah });
    throw new Error('Harga tidak valid. Hubungi owner.');
  }
  console.log('Harga calculated:', { hargaPerItem, jumlah, baseTotal });

  // Cek saldo cukup
  if (saldoAwal < baseTotal) {
    return m.reply(`❌ Saldo tidak cukup. Saldo kamu: Rp${saldoAwal.toLocaleString()}, Total: Rp${baseTotal.toLocaleString()}`);
  }

  const ref_id = generateUniqueRefID();

  try {
    // Kurangi stok
    const stokDiberikan = stokFile[jenisProduk].splice(0, jumlah);
    fs.writeFileSync('./db/stok.json', JSON.stringify(stokFile, null, 2));

    // Update saldo user
    const saldoBaru = saldoAwal - baseTotal;
    if (isNaN(saldoBaru)) {
      console.error('Saldo baru tidak valid:', { saldoAwal, baseTotal });
      throw new Error('Gagal update saldo. Hubungi owner.');
    }
    console.log('Update saldo:', { saldoAwal, baseTotal, saldoBaru });
    await userRef.update({ saldo: saldoBaru });

    // Waktu
    const hariini = moment.tz('Asia/Jakarta').format('dddd, DD MMMM YYYY');
    const time1 = moment.tz('Asia/Jakarta').format('HH:mm:ss');
    const pushname = m.pushName || '-';
    const sisaStok = stokFile[jenisProduk].length;

    // Format Follow ID
    let followStr = '';
    stokDiberikan.forEach((stok, i) => {
      const stokId = stok.id || 'Tidak tersedia';
      const stokNickname = stok.nickname || 'Tidak tersedia';
      followStr += `» *ID ${i+1}* : ${stokId}\n» *Nickname* : ${stokNickname}\n`;
    });

    // Notif user (grup)
    const notifUser =
`✅〔 *TRANSAKSI SUKSES* 〕✅

» *Invoice* : ${ref_id}
» *Jenis Order* : ${jenisProduk}
» *Harga* : Rp${(hargaPerItem || 0).toLocaleString()}
» *Jumlah* : ${jumlah}
» *Total Bayar* : Rp${(baseTotal || 0).toLocaleString()}
» *Tujuan* : ${userId}
» *Nickname* : ${nicknameUser}
» *Waktu* : ${hariini}
» *Jam* : ${time1} WIB

──〔 *Follow ID Berikut !* 〕──
${followStr}
*${namaStore}*`;
    await client.sendMessage(m.chat, { text: notifUser }, { quoted: m });

    // Notif user priv (format baru, reply command)
    const notifPrivUser = `Kamu telah melakukan Pembelian *${jumlah} ${jenisProduk}*

» *Tujuan* : ${userId}
» *Nickname* : ${nicknameUser}
*» Jam* : ${time1} WIB
*» Harga* : Rp${(hargaPerItem || 0).toLocaleString()}
*» Total Bayar* : Rp${(baseTotal || 0).toLocaleString()}
*» Sisa Saldo* : Rp${saldoBaru.toLocaleString()}

──〔 *Follow ID Berikut !* 〕──
${followStr}
*${namaStore}*`;
    await client.sendMessage(sender, { text: notifPrivUser }, { quoted: m });

    // Notif owner (reply command)
    const notifOwner =
`*TRANSAKSI SUKSES ⚡*

*» Nama :* ${pushname}
*» Nomor :* ${nomor}
*» Produk :* ${jenisProduk}
*» Tujuan :* ${userId}
*» Nickname :* ${nicknameUser}
*» Harga :* Rp${(hargaPerItem || 0).toLocaleString()}
*» Jumlah :* ${jumlah}
*» Total :* Rp${(baseTotal || 0).toLocaleString()}
*» Sisa Stok :* ${sisaStok}
*» Sisa Saldo* : Rp${saldoBaru.toLocaleString()}

──〔 *Follow dari Stok Berikut !* 〕──
${followStr}
*${namaStore}*`;
    for (const own of global.owner) {
      await client.sendMessage(own + '@s.whatsapp.net', { text: notifOwner }, { quoted: m });
    }

    // Simpan histori
    const trxHistory = JSON.parse(fs.readFileSync('./db/trx.json'));
    trxHistory.push({
      nomor,
      invoice: ref_id,
      status: 'Sukses',
      item: jenisProduk,
      tujuan: userId,
      nickname: nicknameUser,
      harga: hargaPerItem,
      jumlah: jumlah,
      total: baseTotal,
      waktu: `${time1} | ${hariini}`
    });
    fs.writeFileSync('./db/trx.json', JSON.stringify(trxHistory, null, 2));

  } catch (err) {
    console.error('Buy Error:', err.message, err.stack);
    m.reply('❌ Terjadi kesalahan saat memproses transaksi.');
  }
  break;
}
*/
          /*
case 'buyqr': {
  const nomor = sender.split('@')[0];
  const [jenisProduk, userId, zoneId, jumlahRaw] = args;
  const jumlah = parseInt(jumlahRaw);
  if (!jenisProduk || !userId || !zoneId || isNaN(jumlah) || jumlah < 1) {
    return m.reply(`Format salah!\nContoh:\n> buyqr slbasic 12345678 1234 1`);
  }

  // Cek user
  const userRef = db.collection('users').doc(nomor);
  const userDoc = await userRef.get();
  if (!userDoc.exists) return m.reply('Kamu belum terdaftar. Silakan ketik *Daftar*');
  const userProfile = userDoc.data();

  // Validasi nickname ML
  let nicknameUser = 'Tidak ditemukan';
  try {
    const params = new URLSearchParams();
    params.append('country', 'SG');
    params.append('userId', userId);
    params.append('voucherTypeName', 'MOBILE_LEGENDS');
    params.append('zoneId', zoneId);

    const response = await fetch('https://order-sg.codashop.com/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
      body: params
    });
    const data = await response.json();
    if (data.success !== false && data.result?.username) {
      nicknameUser = decodeURIComponent(data.result.username).replace(/\+/g, ' ');
    } else {
      return m.reply('❌ Gagal validasi nickname. Pastikan ID dan Server benar.');
    }
  } catch (e) {
    console.error('Error validasi ML:', e.message);
    return m.reply('❌ Terjadi kesalahan saat validasi nickname.');
  }

  // Cek stok
  const stokFile = JSON.parse(fs.readFileSync('./db/stok.json'));
  if (!stokFile[jenisProduk] || stokFile[jenisProduk].length < jumlah) {
    return m.reply(`❌ *TRANSAKSI GAGAL*\n\n» *Alasan* : Stok belum diupdate atau kosong.\n\n*${namaStore}*`);
  }

  // Hitung harga
  const role = userProfile.role || 'BRONZE';
  console.log('Cek harga:', { jenisProduk, role });
  delete require.cache[require.resolve('./db/config.js')];
  console.log('Loading config from:', require.resolve('./db/config.js'));
  const config = require('./db/config.js');
  console.log('Config loaded:', config);
  let hargaPerItem;
  if (jenisProduk === 'slpremium') {
    hargaPerItem = role === 'GOLD' ? config.priceGoldPremium :
                    role === 'SILVER' ? config.priceSilverPremium :
                    role === 'OWNER' ? config.priceOwnerPremium : config.priceBronzePremium;
  } else {
    hargaPerItem = role === 'GOLD' ? config.priceGold :
                    role === 'SILVER' ? config.priceSilver :
                    role === 'OWNER' ? config.priceOwner : config.priceBronze;
  }
  hargaPerItem = hargaPerItem || (jenisProduk === 'slpremium' ? 15000 : 10000); // Fallback
  if (!hargaPerItem || isNaN(hargaPerItem)) {
    console.error('Harga tidak valid:', { jenisProduk, role, config });
    throw new Error(`Harga untuk ${jenisProduk} tidak ditemukan di config untuk role ${role}`);
  }
  const baseTotal = hargaPerItem * jumlah;
  console.log('Harga calculated:', { hargaPerItem, jumlah, baseTotal });

  // Generate kode unik (1-100)
  const UNIQUE_CODE_RANGE = 100;
  const buyqrCache = readDatabase();
  buyqrCache.buyqr = buyqrCache.buyqr || {};
  buyqrCache.usedUniqueCodes = buyqrCache.usedUniqueCodes || [];
  let uniqueCode;
  let attempts = 0;
  do {
    uniqueCode = Math.floor(Math.random() * UNIQUE_CODE_RANGE) + 1;
    attempts++;
    if (attempts > 50) {
      return m.reply('❌ Gagal generate kode unik. Coba lagi nanti.');
    }
  } while (buyqrCache.usedUniqueCodes.includes(uniqueCode));
  buyqrCache.usedUniqueCodes.push(uniqueCode);
  saveDatabase(buyqrCache);

  const totalAmount = baseTotal + uniqueCode;
  if (isNaN(totalAmount)) {
    console.error('Total amount tidak valid:', { baseTotal, uniqueCode });
    throw new Error('Total amount tidak valid (NaN)');
  }
  console.log('Total Amount (with unique code):', totalAmount);
  const ref_id = generateUniqueRefID();

  try {
    // Buat QRIS
    const pay = await axios.get(`https://restapi.simplebot.my.id/orderkuota/createpayment?apikey=new&amount=${totalAmount}&codeqr=${codeqr}`);
    console.log('API QRIS Response:', JSON.stringify(pay.data, null, 2));
    if (!pay.data?.result?.imageqris?.url) {
      throw new Error('Response API QRIS tidak valid: imageqris.url tidak ditemukan');
    }
    const imageQR = pay.data.result.imageqris.url;

    const now = moment.tz('Asia/Jakarta');
    const expiredAt = now.clone().add(5, 'minutes');
    const expiredText = expiredAt.format('HH:mm:ss');

    const captionQR = `─────〔 *DETAIL PESANAN* 〕─────

*» Invoice:* ${ref_id}
*» Produk:* ${jenisProduk}
*» Tujuan:* ${userId}
*» Nickname:* ${nicknameUser}
*» Harga:* Rp${(hargaPerItem || 0).toLocaleString()}
*» Jumlah:* ${jumlah}
*» Kode Unik:* Rp${uniqueCode}
*» Total Bayar:* Rp${(totalAmount || 0).toLocaleString()}
*» Kedaluwarsa:* ${expiredText} WIB

*» Status : Belum Dibayar*

Kamu bisa scan QRIS tersebut melalui *BANK* dan e-Wallet seperti *Dana, Ovo, Gopay, Shopeepay, dll*. Silakan scan QRIS di atas untuk menyelesaikan pembayaran sebelum waktu kedaluwarsa.

Note:
- Kode unik akan ikut masuk ke saldo kamu.
- Jika bot tidak mengkonfirmasi setelah pembayaran dilakukan, silahkan hubungi owner untuk mengkonfirmasi.`;
    const sentMsg = await client.sendMessage(m.chat, { image: { url: imageQR }, caption: captionQR }, { quoted: m });

    // Simpan cache transaksi
    buyqrCache.buyqr[nomor] = {
      ref_id,
      jumlah,
      harga: hargaPerItem,
      uniqueCode,
      totalAmount,
      expire: expiredAt.valueOf(),
      status: 'waiting',
      msgKey: sentMsg.key,
      produk: jenisProduk,
      userId,
      zoneId,
      nickname: nicknameUser
    };
    saveDatabase(buyqrCache);

    // Polling
    const apiUrl = `https://gateway.okeconnect.com/api/mutasi/qris/${merchant}/${keyorkut}`;
    const interval = setInterval(async () => {
      const now = Date.now();
      const cache = readDatabase();
      cache.issuerRefs = cache.issuerRefs || [];
      const trx = cache.buyqr[nomor];
      if (!trx) {
        console.error('Transaksi buyqr tidak ditemukan di cache untuk nomor:', nomor);
        clearInterval(interval);
        return;
      }

      if (now > trx.expire && trx.status === 'waiting') {
        await client.sendMessage(m.chat, { delete: trx.msgKey });
        cache.usedUniqueCodes = cache.usedUniqueCodes.filter(code => code !== trx.uniqueCode);
        delete cache.buyqr[nomor];
        saveDatabase(cache);
        m.reply('Qrcode telah kadaluarsa. Silakan buat ulang.');
        clearInterval(interval);
        return;
      }

      try {
        const res = await axios.get(apiUrl);
        console.log('API Mutasi Response:', JSON.stringify(res.data, null, 2));
        if (res.data.status !== 'success') {
          console.log('API Mutasi Status Bukan Success:', res.data.status);
          return;
        }

        const found = res.data.data.find(d => {
          const isMatch = parseInt(d.amount) === trx.totalAmount &&
                          d.issuer_reff &&
                          !cache.issuerRefs.includes(d.issuer_reff);
          console.log('Cek Transaksi:', {
            amount: d.amount,
            issuer_reff: d.issuer_reff,
            status: d.status,
            isMatch
          });
          return isMatch;
        });
        if (!found) {
          console.log('Transaksi Not found');
          return;
        }

        clearInterval(interval);
        cache.issuerRefs.push(found.issuer_reff);
        cache.usedUniqueCodes = cache.usedUniqueCodes.filter(code => code !== trx.uniqueCode);
        cache.buyqr[nomor].status = 'done';
        saveDatabase(cache);

        // Kurangi stok
        const stokDiberikan = stokFile[trx.produk].splice(0, trx.jumlah);
        fs.writeFileSync('./db/stok.json', JSON.stringify(stokFile, null, 2));

        // Update saldo user (cuma tambah kode unik)
        const saldoAwal = userProfile.saldo;
        const saldoBaru = saldoAwal + trx.uniqueCode;
        console.log('Update saldo:', { saldoAwal, uniqueCode: trx.uniqueCode, saldoBaru });
        await userRef.update({ saldo: saldoBaru });

        await client.sendMessage(m.chat, { delete: trx.msgKey });

        // Waktu
        const hariini = moment.tz('Asia/Jakarta').format('dddd, DD MMMM YYYY');
        const time1 = moment.tz('Asia/Jakarta').format('HH:mm:ss');
        const pushname = m.pushName || '-';
        const sisaStok = stokFile[trx.produk].length;

        // Format Follow ID
        let followStr = '';
        stokDiberikan.forEach((stok, i) => {
          const stokId = stok.id || 'Tidak tersedia';
          const stokNickname = stok.nickname || 'Tidak tersedia';
          followStr += `» *ID ${i+1}* : ${stokId}\n» *Nickname* : ${stokNickname}\n`;
        });

        // Notif user (grup)
        const notifUser =
`✅〔 *TRANSAKSI SUKSES* 〕✅

» *Invoice* : ${trx.ref_id}
» *Jenis Order* : ${trx.produk}
» *Harga* : Rp${(trx.harga || 0).toLocaleString()}
» *Jumlah* : ${trx.jumlah}
» *Kode Unik* : Rp${trx.uniqueCode}
» *Total Bayar* : Rp${(trx.totalAmount || 0).toLocaleString()}
» *Tujuan* : ${trx.userId}
» *Nickname* : ${trx.nickname}
» *Waktu* : ${hariini}
» *Jam* : ${time1} WIB

──〔 *Follow ID Berikut !* 〕──
${followStr}
*${namaStore}*`;
        await client.sendMessage(m.chat, { text: notifUser }, { quoted: m });

        // Notif user priv (reply command, format baru)
        const notifPrivUser = `Kamu telah melakukan Pembelian *${trx.jumlah} ${trx.produk}*

» *Tujuan* : ${trx.userId}
» *Nickname* : ${trx.nickname}
*» Jam* : ${time1} WIB
*» Harga* : Rp${(trx.harga || 0).toLocaleString()}
*» Kode Unik* : Rp${trx.uniqueCode}
*» Total Bayar* : Rp${(trx.totalAmount || 0).toLocaleString()}
*» Sisa Saldo* : Rp${saldoBaru.toLocaleString()}

──〔 *Follow ID Berikut !* 〕──
${followStr}
*${namaStore}*`;
        await client.sendMessage(sender, { text: notifPrivUser }, { quoted: m });

        // Notif owner (reply command)
        const notifOwner =
`*TRANSAKSI SUKSES ⚡*

*» Nama :* ${pushname}
*» Nomor :* ${nomor}
*» Produk :* ${trx.produk}
*» Tujuan :* ${trx.userId}
*» Nickname :* ${trx.nickname}
*» Harga :* Rp${(trx.harga || 0).toLocaleString()}
*» Jumlah :* ${trx.jumlah}
*» Kode Unik* : Rp${trx.uniqueCode}
*» Total :* Rp${(trx.totalAmount || 0).toLocaleString()}
*» Sisa Stok :* ${sisaStok}
*» Sisa Saldo* : Rp${saldoBaru.toLocaleString()}

──〔 *Follow dari Stok Berikut !* 〕──
${followStr}
*${namaStore}*`;
        for (const own of global.owner) {
          await client.sendMessage(own + '@s.whatsapp.net', { text: notifOwner }, { quoted: m });
        }

        // Simpan histori
        const trxHistory = JSON.parse(fs.readFileSync('./db/trx.json'));
        trxHistory.push({
          nomor,
          invoice: trx.ref_id,
          status: 'Sukses',
          item: trx.produk,
          tujuan: trx.userId,
          nickname: trx.nickname,
          harga: trx.harga,
          jumlah: trx.jumlah,
          uniqueCode: trx.uniqueCode,
          total: trx.totalAmount,
          waktu: `${time1} | ${hariini}`
        });
        fs.writeFileSync('./db/trx.json', JSON.stringify(trxHistory, null, 2));

      } catch (e) {
        console.error('Polling buyqr error:', e.message, e.stack);
      }
    }, 10000);

  } catch (err) {
    console.error('QRIS Error:', err.message, err.stack);
    buyqrCache.usedUniqueCodes = buyqrCache.usedUniqueCodes.filter(code => code !== uniqueCode);
    saveDatabase(buyqrCache);
    m.reply('❌ Terjadi kesalahan saat membuat QRIS.');
  }
  break;
}
            */
            
            case 'setprice': {
  if (!isOwner) return m.reply('Perintah ini hanya bisa digunakan oleh owner.');

  const [roleRaw, jenisProdukRaw, hargaRaw] = args;
  if (!roleRaw || !jenisProdukRaw || !hargaRaw) {
  delete require.cache[require.resolve('./db/config.js')];
  const config = require('./db/config.js');

  const pesan = `*Daftar Harga Saat Ini:*

━━━《 𝗦𝗟 𝗕𝗔𝗦𝗜𝗖 》━━━
- Bronze: Rp ${(config.priceBronze || 0).toLocaleString()}
- Silver: Rp ${(config.priceSilver || 0).toLocaleString()}
- Gold: Rp ${(config.priceGold || 0).toLocaleString()}
- Owner: Rp ${(config.priceOwner || 0).toLocaleString()}

━━━《 𝗦𝗟 𝗣𝗥𝗘𝗠𝗜𝗨𝗠 》━━━
- Bronze: Rp ${(config.priceBronzePremium || 0).toLocaleString()}
- Silver: Rp ${(config.priceSilverPremium || 0).toLocaleString()}
- Gold: Rp ${(config.priceGoldPremium || 0).toLocaleString()}
- Owner: Rp ${(config.priceOwnerPremium || 0).toLocaleString()}

Untuk mengatur ulang harga, gunakan:
> price [role] [jenisProduk] [harga]

Contoh:
> price bronze slbasic 35000`;

  return m.reply(pesan);
}

  // Validasi role
  const validRoles = ['bronze', 'silver', 'gold', 'owner'];
  const role = roleRaw.toLowerCase();
  if (!validRoles.includes(role)) {
    return m.reply(`Role tidak valid. Pilih salah satu: ${validRoles.join(', ')}`);
  }

  // Validasi jenis produk
  const validProduk = ['slbasic', 'slpremium'];
  const jenisProduk = jenisProdukRaw.toLowerCase();
  if (!validProduk.includes(jenisProduk)) {
    return m.reply(`Jenis produk tidak valid. Pilih: ${validProduk.join(', ')}`);
  }

  // Validasi harga
  const harga = parseInt(hargaRaw);
  if (isNaN(harga) || harga <= 0) {
    return m.reply('Harga tidak valid. Harus berupa angka lebih dari 0.');
  }

  // Update harga di file config.js
  const path = './db/config.js';
  let configFile = fs.readFileSync(path, 'utf8');

  // Nama variabel yang ingin diupdate
  const varName = `price${role.charAt(0).toUpperCase() + role.slice(1)}${jenisProduk === 'slpremium' ? 'Premium' : ''}`;

  // Regex untuk menemukan baris variabel
  const regex = new RegExp(`${varName}\\s*=\\s*\\d+`, 'i');
  if (regex.test(configFile)) {
    configFile = configFile.replace(regex, `${varName} = ${harga}`);
  } else {
    // Jika variabel belum ada, tambahkan di akhir file
    configFile += `\n${varName} = ${harga}`;
  }

  fs.writeFileSync(path, configFile, 'utf8');

  const pesanSukses = `✅ Harga berhasil diperbarui!

*Role:* ${role.toUpperCase()}
*Jenis Produk:* ${jenisProduk.toUpperCase()}
*Harga Baru:* Rp ${harga.toLocaleString()}

Cek harga lengkap dengan ketik:
> showprice`;

  m.reply(pesanSukses);
  break;
}
           
           case 'showprice': 
        case 'price':{
  // Hanya owner yang bisa (opsional, kalau mau bebas user juga boleh)
  // if (!isOwner) return m.reply('Perintah ini hanya bisa digunakan oleh owner.');

  // Ambil data harga dari config.js
  delete require.cache[require.resolve('./db/config.js')];
  const config = require('./db/config.js');

  const pesan = `*Daftar Harga Saat Ini:*

━━━《 𝗦𝗟 𝗕𝗔𝗦𝗜𝗖 》━━━
- Bronze: Rp ${(config.priceBronze || 0).toLocaleString()}
- Silver: Rp ${(config.priceSilver || 0).toLocaleString()}
- Gold: Rp ${(config.priceGold || 0).toLocaleString()}
- Owner: Rp ${(config.priceOwner || 0).toLocaleString()}

━━━《 𝗦𝗟 𝗣𝗥𝗘𝗠𝗜𝗨𝗠 》━━━
- Bronze: Rp ${(config.priceBronzePremium || 0).toLocaleString()}
- Silver: Rp ${(config.priceSilverPremium || 0).toLocaleString()}
- Gold: Rp ${(config.priceGoldPremium || 0).toLocaleString()}
- Owner: Rp ${(config.priceOwnerPremium || 0).toLocaleString()}

Ketik *uprole* jika ingin upgrade role Anda!`;

  return m.reply(pesan);
}
            
            /*
            case 'cekstok': {
  const [jenisProduk] = args;

  if (!jenisProduk) {
    return m.reply(`Format Salah!\nContoh:\n> cekstok slbasic`);
  }

  const validProduk = ['slbasic', 'slpremium'];
  if (!validProduk.includes(jenisProduk)) {
    return m.reply(`Jenis produk tidak valid. Pilih: ${validProduk.join(', ')}`);
  }

  const stokPath = './db/stok.json';
  if (!fs.existsSync(stokPath)) {
    return m.reply('Stok kosong / belum diupdate.');
  }

  const stokData = JSON.parse(fs.readFileSync(stokPath, 'utf8'));
  const stokList = stokData[jenisProduk] || [];

  if (stokList.length === 0) {
    return m.reply(`Stok ${jenisProduk} kosong / belum diupdate.`);
  }

  let list = stokList.map((s, idx) =>
    `#${idx + 1} ID: ${s.id} | Server: ${s.server}`
  ).join('\n');

  const pesan = `📦 *Cek Stok* 📦
*Jenis Produk:* ${jenisProduk.toUpperCase()}
*Total Stok:* ${stokList.length}

${list}`;

  client.sendMessage(m.chat, { text: pesan }, { quoted: m });
  break;
}
            */
            case 'rmstok': {
  if (!isOwner) return m.reply('Perintah ini hanya bisa digunakan oleh owner.');

  const [jenisProduk, jumlahStr] = args;
  const jumlah = parseInt(jumlahStr);

  if (!jenisProduk || isNaN(jumlah) || jumlah <= 0) {
    return m.reply(`Format Salah!\nContoh:\n> rmstok slbasic 2`);
  }

  const stokPath = './db/stok.json';
  if (!fs.existsSync(stokPath)) return m.reply('Stok belum ada.');

  const stokData = JSON.parse(fs.readFileSync(stokPath, 'utf8'));
  if (!stokData[jenisProduk] || stokData[jenisProduk].length === 0) {
    return m.reply('Stok kosong atau belum diupdate.');
  }

  if (stokData[jenisProduk].length < jumlah) {
    return m.reply(`Jumlah stok tidak cukup. Stok tersedia: ${stokData[jenisProduk].length}`);
  }

  const removedStok = stokData[jenisProduk].splice(0, jumlah);
  fs.writeFileSync(stokPath, JSON.stringify(stokData, null, 2));

  let stokTerhapus = removedStok.map((s, idx) =>
    `#${idx + 1} ID: ${s.id} Server: ${s.server}`
  ).join('\n');

  const pesan = `✅ *Stok Berhasil Dihapus!*

*Jenis Produk:* ${jenisProduk.toUpperCase()}
*Jumlah Dihapus:* ${jumlah}
*Stok Terhapus:*
${stokTerhapus}

*Sisa Stok:* ${stokData[jenisProduk].length}`;

  client.sendMessage(m.chat, { text: pesan }, { quoted: m });
  client.sendMessage(owned, { text: pesan }, { quoted: m });
  break;
}
  /*          
            case 'addstok': {
  if (!isOwner) return m.reply('Hanya owner yang bisa.');

  if (args.length < 2) {
    return m.reply(`Format salah. Contoh:\n> addstok slbasic 748418773:8938*3,123456789:9876,111111111:2222*2`);
  }

  const jenisProduk = args[0].toLowerCase();
  const entriesRaw = args.slice(1).join(' '); // Ambil semua setelah jenisProduk
  const entries = entriesRaw.split(',');

  if (!entries.length) return m.reply('Format input stok tidak ditemukan.');

  // Load data stok
  const stokFile = JSON.parse(fs.readFileSync('./db/stok.json'));
  if (!stokFile[jenisProduk]) stokFile[jenisProduk] = [];

  let resultMsg = `✅ *Update Stok ${jenisProduk.toUpperCase()}*:\n\n`;

  for (const entry of entries) {
    let [idServer, jumlahStr] = entry.split('*');
    if (!jumlahStr) jumlahStr = entry.split('x')[1]; // support "x" juga
    const jumlah = parseInt(jumlahStr) || 1; // Default ke 1

    const [id, server] = idServer.split(':');
    if (!id || !server) continue; // Skip kalo format salah

    // Auto get nickname
    let nickname = 'Tidak ditemukan';
    try {
      const params = new URLSearchParams();
      params.append('country', 'SG');
      params.append('userId', id);
      params.append('voucherTypeName', "MOBILE_LEGENDS");
      params.append('zoneId', server);

      const response = await fetch('https://order-sg.codashop.com/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
        body: params
      });
      const data = await response.json();
      if (data.success !== false && data.result?.username) {
        nickname = decodeURIComponent(data.result.username).replace(/\+/g, ' ');
      }
    } catch (e) {
      console.error('Error fetch ML nickname:', e);
    }

    // Tambahkan stok sebanyak jumlah
    for (let i = 0; i < jumlah; i++) {
      stokFile[jenisProduk].push({ id, server, nickname });
    }

    resultMsg += `» ID: ${id}\n  Server: ${server}\n  Jumlah: ${jumlah}\n  Nickname: ${nickname}\n\n`;
  }

  fs.writeFileSync('./db/stok.json', JSON.stringify(stokFile, null, 2));
  return m.reply(resultMsg.trim());
}
*/
            //manajemen stok firestore
           case 'addstok': {
    if (!isOwner) return m.reply('Hanya owner yang bisa.');
    const [kodeProdukRaw, ...rawEntries] = args;
    if (!kodeProdukRaw || rawEntries.length === 0) {
      return m.reply(`Format salah.\nContoh:\n> addstok slbasic 748418773:8938*2`);
    }
    const kodeProduk = kodeProdukRaw.toLowerCase();
    const produkRef = db.collection('produk_manual').doc(kodeProduk);
    const produkSnap = await produkRef.get();
    if (!produkSnap.exists) {
      return m.reply(`Produk '${kodeProduk}' tidak ditemukan di database.`);
    }
    const produkData = produkSnap.data();
    const tipe = (produkData.tipeProduk || '').toUpperCase();
    const allowed = ['SL','VOUCHER','ACCOUNT','OTHER'];
    if (!allowed.includes(tipe)) {
      return m.reply(`Tipe produk di database '${tipe}' tidak valid.`);
    }

    const entries = rawEntries.join(' ').split(',');
    let totalAdded = 0;
    let resultMsg = `✅ *Stok ditambahkan ke ${kodeProduk.toUpperCase()}* (tipe ${tipe})\n\n`;

    try {
      await db.runTransaction(async (transaction) => {
        const prodDoc = await transaction.get(produkRef);
        const prodData = prodDoc.data() || {};
        let stokCounter = typeof prodData.stokCounter === 'number' ? prodData.stokCounter : 0;
        const hasStokTersediaField = typeof prodData.stokTersedia === 'number';

        for (let rawEntry of entries) {
          let [stokStr, jumlahStr] = rawEntry.split('*');
          const jumlah = parseInt(jumlahStr, 10) || 1;
          stokStr = stokStr.trim();
          if (!stokStr) continue;

          for (let i = 0; i < jumlah; i++) {
            stokCounter += 1;
            totalAdded += 1;

            const stokData = {
              ditambahkanPada: admin.firestore.FieldValue.serverTimestamp(),
              status: 'tersedia'
            };
            let docId;
            if (tipe === 'SL') {
              const [id, server] = stokStr.split(':');
              if (!id || !server) continue;
              // Validasi nickname
              let nickname = 'Tidak ditemukan';
              try {
                const params = new URLSearchParams();
                params.append('country','SG');
                params.append('userId',id);
                params.append('voucherTypeName','MOBILE_LEGENDS');
                params.append('zoneId',server);
                const res = await fetch('https://order-sg.codashop.com/validate', {
                  method: 'POST',
                  headers: {'Content-Type':'application/x-www-form-urlencoded'},
                  body: params
                });
                const json = await res.json();
                if (json?.result?.username) {
                  nickname = decodeURIComponent(json.result.username).replace(/\+/g,' ');
                }
              } catch (err) {
                console.error('Codashop Error:', err);
              }
              stokData.id = id;
              stokData.server = server;
              stokData.nickname = nickname;
              // Nama dokumen: slug nickname + '_' + padded counter
              const slug = nickname.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 30) || 'stok';
              const pad = padCounter(stokCounter);
              docId = `${pad}_${slug}`;
              resultMsg += `• ID: ${id}\n  Server: ${server}\n  Nickname: ${nickname}\n\n`;
            }
            else if (tipe === 'ACCOUNT' || tipe === 'VOUCHER') {
              stokData.data = stokStr;
              const pad = padCounter(stokCounter);
              docId = `${pad}stok`;
              resultMsg += `• Data: ${stokStr}\n\n`;
            }
            else { // OTHER
              stokData.raw = stokStr;
              const pad = padCounter(stokCounter);
              docId = `${pad}stok`;
              resultMsg += `• Data (OTHER): ${stokStr}\n\n`;
            }
            const stokDocRef = produkRef.collection('stok').doc(docId);
            transaction.set(stokDocRef, stokData);
          }
        }
        const updates = { stokCounter };
        if (hasStokTersediaField) {
          updates.stokTersedia = admin.firestore.FieldValue.increment(totalAdded);
        } else {
          updates.stokTersedia = totalAdded;
        }
        transaction.update(produkRef, updates);
      });
      m.reply(resultMsg.trim());
    } catch (err) {
      console.error('addstok Transaction Error:', err);
      m.reply('❌ Gagal menambahkan stok. Coba lagi atau hubungi owner.');
    }
    break;
  }

  case 'buy': {
  const nomor = sender.split('@')[0];
  // Ambil args: kita cek jumlah arg sesuai tipe nanti
  const [kodeProduk, ...restArgs] = args;
  if (!kodeProduk) {
    return m.reply(`Format salah!\nContoh SL: buy slbasic 12345678 1234 1\nContoh non-SL: buy akunprod 2`);
  }

  try {
    // 1. Cek user
    const userRef = db.collection('users').doc(nomor);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      return m.reply('Kamu belum terdaftar. Silakan ketik *Daftar*');
    }
    const userProfile = userDoc.data();
    let saldoAwal = parseFloat(userProfile.saldo);
    if (isNaN(saldoAwal)) {
      return m.reply('❌ Saldo kamu tidak valid. Hubungi owner.');
    }
    const role = userProfile.role?.toUpperCase() || 'BRONZE';

    // 2. Ambil data produk
    const produkRef = db.collection('produk_manual').doc(kodeProduk);
    const produkSnap = await produkRef.get();
    if (!produkSnap.exists) {
      return m.reply(`❌ Produk '${kodeProduk}' tidak ditemukan.`);
    }
    const produkData = produkSnap.data();
    const tipe = (produkData.tipeProduk || '').toUpperCase();

    // 3. Parse argumen berdasarkan tipe
    let userId, zoneId, jumlah;
    if (tipe === 'SL') {
      // butuh 3 arg: userId, zoneId, jumlah
      if (restArgs.length < 3) {
        return m.reply(`Format SL salah!\nContoh: buy ${kodeProduk} <userId> <zoneId> <jumlah>`);
      }
      userId = restArgs[0];
      zoneId = restArgs[1];
      jumlah = parseInt(restArgs[2]);
      if (!userId || !zoneId || isNaN(jumlah) || jumlah < 1) {
        return m.reply(`Format SL salah!\nContoh: buy ${kodeProduk} 12345678 1234 1`);
      }
    } else if (tipe === 'ACCOUNT' || tipe === 'VOUCHER' || tipe === 'OTHER') {
      // asumsikan format: buy <kodeProduk> <jumlah>
      if (restArgs.length < 1) {
        return m.reply(`Format ${tipe} salah!\nContoh: buy ${kodeProduk} <jumlah>`);
      }
      jumlah = parseInt(restArgs[0]);
      if (isNaN(jumlah) || jumlah < 1) {
        return m.reply(`Format ${tipe} salah!\nContoh: buy ${kodeProduk} 2`);
      }
      // untuk ACCOUNT/VOUCHER/OTHER, kita tidak butuh userId/zoneId eksternal
    } else {
      return m.reply(`Tipe produk di database '${tipe}' tidak valid.`);
    }

    // 4. Cek harga & saldo
    const hargaPerItem = produkData.harga?.[role];
    if (!hargaPerItem || isNaN(hargaPerItem)) {
      return m.reply(`❌ Harga tidak ditemukan untuk role *${role}*`);
    }
    const baseTotal = hargaPerItem * jumlah;
    if (saldoAwal < baseTotal) {
      return m.reply(
        `❌ Saldo tidak cukup. Saldo kamu: Rp${saldoAwal.toLocaleString()}, Total: Rp${baseTotal.toLocaleString()}`
      );
    }

    // 5. Untuk SL: validasi nickname via API
    let nicknameUser = '-';
    if (tipe === 'SL') {
      try {
        const params = new URLSearchParams();
        params.append('country', 'SG');
        params.append('userId', userId);
        params.append('voucherTypeName', 'MOBILE_LEGENDS');
        params.append('zoneId', zoneId);
        const resp = await fetch('https://order-sg.codashop.com/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
          body: params
        });
        const json = await resp.json();
        if (json.success !== false && json.result?.username) {
          nicknameUser = decodeURIComponent(json.result.username).replace(/\+/g, ' ');
        } else {
          return m.reply('❌ Gagal validasi nickname SL. Pastikan ID dan Server benar.');
        }
      } catch (err) {
        console.error('Error validasi ML:', err);
        return m.reply('❌ Terjadi kesalahan saat validasi nickname SL.');
      }
    }

    // Persiapan waktu & ref_id
    const ref_id = generateUniqueRefID();
    const hariini = moment.tz('Asia/Jakarta').format('dddd, DD MMMM YYYY');
    const time1 = moment.tz('Asia/Jakarta').format('HH:mm:ss');
    const pushname = m.pushName || '-';

    // 6. Ambil stok FIFO
    const stokCol = produkRef.collection('stok');
    // Kita fetch semua yg status tersedia, lalu sort di JS berdasarkan ID zero-padded atau timestamp
    const stokSnapAll = await stokCol.where('status', '==', 'tersedia').get();
    if (stokSnapAll.size < jumlah) {
      return m.reply(`❌ *TRANSAKSI GAGAL*\n\n» *Alasan* : Stok tidak mencukupi.\n\n*${namaStore}*`);
    }
    // Sort FIFO:
    // Jika addstok menamai ID zero-padded (misal stok000001), kita bisa sort by doc.id lex
    // Jika tidak yakin, bisa sort by ditambahkanPada: doc.data().ditambahkanPada.toMillis()
    let stokDocs = stokSnapAll.docs;
    // Coba sort by ditambahkanPada jika ada timestamp tersimpan:
    const firstData = stokDocs[0].data();
    if (firstData.ditambahkanPada && firstData.ditambahkanPada.toMillis) {
      // sort by timestamp
      stokDocs = stokDocs.sort((a, b) => {
        const ta = a.data().ditambahkanPada.toMillis();
        const tb = b.data().ditambahkanPada.toMillis();
        return ta - tb;
      });
    } else {
      // sort by ID lex (asumsi zero-padded)
      stokDocs = stokDocs.sort((a, b) => a.id.localeCompare(b.id));
    }
    stokDocs = stokDocs.slice(0, jumlah);

    // 7. Batch update: stok -> terjual, produk.stokTersedia & terjual, user saldo & statistik, simpan history
    const batch = db.batch();
    const now = admin.firestore.FieldValue.serverTimestamp();
    let followStr = '';
    stokDocs.forEach((docSnap, idx) => {
      const dataStok = docSnap.data();
      const stokRef = docSnap.ref;
      // Update stok
      batch.update(stokRef, {
        status: 'terjual',
        terjualPada: now
      });
      // Kumpulkan followStr
      // Untuk SL: tampilkan ID & nickname stok; untuk ACCOUNT/VOUCHER/OTHER: data atau raw
      let infoStok;
      if (tipe === 'SL') {
        infoStok = dataStok.id || '-';
      } else if (tipe === 'ACCOUNT' || tipe === 'VOUCHER') {
        infoStok = dataStok.data || '-';
      } else {
        infoStok = dataStok.raw || '-';
      }
      const nickStok = dataStok.nickname || '-';
      followStr += `» *Item ${idx+1}* : ${infoStok}\n» *Nickname* : ${nickStok}\n`;
    });

    // Update user
    const saldoBaru = saldoAwal - baseTotal;
    batch.update(userRef, {
      saldo: saldoBaru,
      total_spend: admin.firestore.FieldValue.increment(baseTotal),
      jumlah_transaksi_sukses: admin.firestore.FieldValue.increment(1),
      lastOrderTime: now
    });

    // Update produk
    const prodUpdates = {};
    if (typeof produkData.stokTersedia === 'number') {
      prodUpdates.stokTersedia = admin.firestore.FieldValue.increment(-jumlah);
    }
    prodUpdates.terjual = admin.firestore.FieldValue.increment(jumlah);
    batch.update(produkRef, prodUpdates);

    // Simpan history di users/{nomor}/transactions/{ref_id}
    const historyData = {
      tanggal: now,
      produk: produkData.namaProduk || kodeProduk,
      tipe: tipe,
      hargaPerItem: hargaPerItem,
      jumlah: jumlah,
      total: baseTotal,
      tujuan: tipe==='SL'? userId : null,
      zone: tipe==='SL'? zoneId : null,
      invoice: ref_id,
      status: 'Sukses',
      metode: 'Saldo',
      nicknameUser: nicknameUser
    };
    const histRef = userRef.collection('transactions').doc(ref_id);
    batch.set(histRef, historyData);

    // (Opsional) Simpan ke koleksi umum history_trx
    const umumRef = db.collection('history_trx').doc(ref_id);
    batch.set(umumRef, {
      nomor,
      invoice: ref_id,
      produk: kodeProduk,
      tipe: tipe,
      tujuan: tipe==='SL'? userId : null,
      harga: hargaPerItem,
      jumlah: jumlah,
      total: baseTotal,
      waktu: now,
      status: 'Sukses',
      metode: 'Saldo',
      nicknameUser: nicknameUser
    });

    await batch.commit();

    // 8. Kirim notifikasi
    // SL notif mirip sebelumnya, sertakan tujuan & nicknameUser
    let notifUser;
    if (tipe === 'SL') {
      notifUser = `✅〔 *TRANSAKSI SUKSES* 〕✅

» *Invoice* : ${ref_id}
» *Jenis Order* : ${kodeProduk}
» *Harga* : Rp${hargaPerItem.toLocaleString()}
» *Jumlah* : ${jumlah}
» *Total Bayar* : Rp${baseTotal.toLocaleString()}
» *Tujuan* : ${userId}
» *Nickname ML* : ${nicknameUser}
» *Waktu* : ${hariini}
» *Jam* : ${time1} WIB

──〔 *Follow ID Berikut !* 〕──
${followStr}
*${namaStore}*`;
    } else {
      // ACCOUNT/VOUCHER/OTHER: tidak ada tujuan eksternal
      notifUser = `✅〔 *TRANSAKSI SUKSES* 〕✅

» *Invoice* : ${ref_id}
» *Jenis Order* : ${kodeProduk}
» *Harga* : Rp${hargaPerItem.toLocaleString()}
» *Jumlah* : ${jumlah}
» *Total Bayar* : Rp${baseTotal.toLocaleString()}
» *Waktu* : ${hariini}
» *Jam* : ${time1} WIB

──〔 *Detail Berikut !* 〕──
${followStr}
*${namaStore}*`;
    }
    await client.sendMessage(m.chat, { text: notifUser }, { quoted: m });

    // Notifikasi pribadi ke user
    let notifPriv = `Kamu telah melakukan Pembelian *${jumlah} ${kodeProduk}*

» *Harga* : Rp${hargaPerItem.toLocaleString()}
» *Total Bayar* : Rp${baseTotal.toLocaleString()}
» *Sisa Saldo* : Rp${saldoBaru.toLocaleString()}
» *Waktu* : ${time1} WIB
» *Tanggal* : ${hariini}

──〔 *Detail Berikut !* 〕──
${followStr}
*${namaStore}*`;
    await client.sendMessage(sender, { text: notifPriv }, { quoted: m });

    // Notifikasi owner
    let notifOwner = `*TRANSAKSI SUKSES ⚡*

*» Nama :* ${pushname}
*» Nomor :* ${nomor}
*» Produk :* ${kodeProduk}
`;
    if (tipe === 'SL') {
      notifOwner += `*» Tujuan* : ${userId}\n*» Nickname ML* : ${nicknameUser}\n`;
    }
    notifOwner += `*» Harga* : Rp${hargaPerItem.toLocaleString()}\n*» Jumlah* : ${jumlah}\n*» Total* : Rp${baseTotal.toLocaleString()}\n*» Sisa Saldo* : Rp${saldoBaru.toLocaleString()}\n\n`;
    notifOwner += `──〔 *Detail Berikut !* 〕──\n${followStr}\n*${namaStore}*`;
    for (const own of global.owner) {
      await client.sendMessage(own + '@s.whatsapp.net', { text: notifOwner }, { quoted: m });
    }

  } catch (err) {
    console.error('Buy Error:', err);
    // Jika error index Firestore, bisa deteksi dan kirim pesan spesifik:
    if (err.code === 9 && err.message.includes('requires an index')) {
      return m.reply('⚠️ Query stok butuh index Firestore (status+ditambahkanPada). Silakan bikin composite index di console.');
    }
    return m.reply('❌ Terjadi kesalahan saat memproses transaksi.');
  }

  break;
}

            
case 'buyqr': {
  const nomor = sender.split('@')[0];
  const [kodeProduk, ...restArgs] = args;
  if (!kodeProduk) {
    return m.reply(
      `Format salah!\n` +
      `SL: buyqr slbasic <userId> <zoneId> <jumlah>\n` +
      `Non-SL: buyqr akunprod <jumlah>`
    );
  }

  try {
    // 1) Ambil dan validasi user
    const userRef = db.collection('users').doc(nomor);
    const userDoc = await userRef.get();
    if (!userDoc.exists) return m.reply('Kamu belum terdaftar. Ketik *Daftar*');
    const userProfile = userDoc.data();
    let saldoAwal = parseFloat(userProfile.saldo) || 0;
    if (isNaN(saldoAwal)) return m.reply('❌ Saldo kamu tidak valid. Hubungi owner.');
    const role = userProfile.role?.toUpperCase() || 'BRONZE';

    // 2) Ambil produk
    const produkRef = db.collection('produk_manual').doc(kodeProduk);
    const produkSnap = await produkRef.get();
    if (!produkSnap.exists) return m.reply(`❌ Produk '${kodeProduk}' tidak ditemukan.`);
    const produkData = produkSnap.data();
    const tipe = (produkData.tipeProduk || '').toUpperCase();

    // 3) Parse argumen berdasarkan tipe
    let userId, zoneId, jumlah;
    if (tipe === 'SL') {
      if (restArgs.length < 3) {
        return m.reply(`Format SL salah!\nContoh: buyqr ${kodeProduk} <userId> <zoneId> <jumlah>`);
      }
      [userId, zoneId] = restArgs;
      jumlah = parseInt(restArgs[2]);
      if (!userId || !zoneId || isNaN(jumlah) || jumlah < 1) {
        return m.reply(`Format SL salah!\nContoh: buyqr ${kodeProduk} 12345678 1234 1`);
      }
    } else if (['ACCOUNT','VOUCHER','OTHER'].includes(tipe)) {
      if (restArgs.length < 1) {
        return m.reply(`Format ${tipe} salah!\nContoh: buyqr ${kodeProduk} <jumlah>`);
      }
      jumlah = parseInt(restArgs[0]);
      if (isNaN(jumlah) || jumlah < 1) {
        return m.reply(`Format ${tipe} salah!\nContoh: buyqr ${kodeProduk} 2`);
      }
    } else {
      return m.reply(`Tipe produk di database '${tipe}' tidak valid.`);
    }

    // 4) Cek harga & saldo
    const hargaPerItem = produkData.harga?.[role];
    if (!hargaPerItem || isNaN(hargaPerItem)) {
      return m.reply(`❌ Harga tidak ditemukan untuk role *${role}*`);
    }
    const baseTotal = hargaPerItem * jumlah;

    // 5) Validasi nickname ML jika SL
    let nicknameUser = '-';
    if (tipe === 'SL') {
      try {
        const params = new URLSearchParams({
          country: 'SG',
          userId,
          voucherTypeName: 'MOBILE_LEGENDS',
          zoneId
        });
        const resp = await fetch('https://order-sg.codashop.com/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: params
        });
        const json = await resp.json();
        if (json.success !== false && json.result?.username) {
          nicknameUser = decodeURIComponent(json.result.username).replace(/\+/g,' ');
        } else {
          return m.reply('❌ Gagal validasi nickname SL. Pastikan ID dan Server benar.');
        }
      } catch {
        return m.reply('❌ Terjadi kesalahan saat validasi nickname SL.');
      }
    }

    // 6) Generate unique code
    const UNIQUE_RANGE = 100;
    const cache = readDatabase();
    cache.buyqr = cache.buyqr || {};
    cache.usedUniqueCodes = cache.usedUniqueCodes || [];
    let uniqueCode, attempts = 0;
    do {
      uniqueCode = Math.floor(Math.random() * UNIQUE_RANGE) + 1;
      if (++attempts > 50) return m.reply('❌ Gagal generate kode unik. Coba lagi nanti.');
    } while (cache.usedUniqueCodes.includes(uniqueCode));
    cache.usedUniqueCodes.push(uniqueCode);
    saveDatabase(cache);

    const totalAmount = baseTotal + uniqueCode;
    const ref_id = generateUniqueRefID();

    // 7) Ambil stok FIFO
    const stokSnap = await produkRef.collection('stok')
      .where('status','==','tersedia')
      .get();
    if (stokSnap.size < jumlah) {
      return m.reply(`❌ Stok tidak mencukupi.`);
    }
    let stokDocs = stokSnap.docs
      .sort((a,b) => {
        const ta = a.data().ditambahkanPada?.toMillis?.()||0;
        const tb = b.data().ditambahkanPada?.toMillis?.()||0;
        return ta - tb;
      })
      .slice(0, jumlah);
    const stokIds = stokDocs.map(d => d.id);

    // 8) Buat QRIS & kirim
    const pay = await axios.get(
      `https://restapi.simplebot.my.id/orderkuota/createpayment?apikey=new&amount=${totalAmount}&codeqr=${codeqr}`
    );
    const imageQR = pay.data.result.imageqris?.url;
    if (!imageQR) return m.reply('❌ Gagal membuat QRIS.');

    const now = moment.tz('Asia/Jakarta');
    const expiredAt = now.clone().add(5,'minutes');
    const expText = expiredAt.format('HH:mm:ss');
    const caption = `────〔 *DETAIL PESANAN* 〕────

*Invoice:* ${ref_id}
*Produk:* ${kodeProduk}
${tipe==='SL'?`*Tujuan:* ${userId}\n*Nickname:* ${nicknameUser}\n`:''}*Harga:* Rp${hargaPerItem.toLocaleString()}
*Jumlah:* ${jumlah}
*Kode Unik:* Rp${uniqueCode}
*Total Bayar:* Rp${totalAmount.toLocaleString()}
*Kedaluwarsa:* ${expText} WIB

Status: Belum Dibayar`;

    const sentMsg = await client.sendMessage(
      m.chat,
      { image:{ url:imageQR }, caption },
      { quoted: m }
    );

    cache.buyqr[nomor] = {
      ref_id, kodeProduk, tipe, userId, zoneId, jumlah,
      hargaPerItem, uniqueCode, totalAmount,
      stokIds, nickname: nicknameUser,
      expire: expiredAt.valueOf(),
      status: 'waiting',
      msgKey: sentMsg.key
    };
    saveDatabase(cache);

    // 9) Polling QRIS
    const apiUrl = `https://gateway.okeconnect.com/api/mutasi/qris/${merchant}/${keyorkut}`;
    const interval = setInterval(async () => {
      const nowMs = Date.now();
      const trx = readDatabase().buyqr[nomor];
      if (!trx) return clearInterval(interval);

      // expired?
      if (nowMs > trx.expire && trx.status === 'waiting') {
        await client.sendMessage(m.chat, { delete: trx.msgKey });
        cache.usedUniqueCodes = cache.usedUniqueCodes.filter(c=>c!==trx.uniqueCode);
        delete cache.buyqr[nomor];
        saveDatabase(cache);
        m.reply('Qrcode telah kadaluarsa. Silakan buat ulang.');
        return clearInterval(interval);
      }

      try {
        const res = await axios.get(apiUrl);
        if (res.data.status !== 'success') return;
        const found = res.data.data.find(d =>
          parseInt(d.amount) === trx.totalAmount &&
          d.issuer_reff && !cache.issuerRefs?.includes(d.issuer_reff)
        );
        if (!found) return;

        clearInterval(interval);
        cache.issuerRefs = cache.issuerRefs || [];
        cache.issuerRefs.push(found.issuer_reff);
        cache.usedUniqueCodes = cache.usedUniqueCodes.filter(c=>c!==trx.uniqueCode);
        trx.status = 'done';
        saveDatabase(cache);

        // 10) Firestore batch
        const batch = db.batch();
        const ts = admin.firestore.FieldValue.serverTimestamp();

        // stok → terjual
        trx.stokIds.forEach(id => {
          const sref = produkRef.collection('stok').doc(id);
          batch.update(sref, { status:'terjual', terjualPada:ts });
        });

        // user update
        const newSaldo = saldoAwal + trx.uniqueCode;
        batch.update(userRef, {
          saldo: newSaldo,
          total_spend: admin.firestore.FieldValue.increment(trx.totalAmount),
          jumlah_transaksi_sukses: admin.firestore.FieldValue.increment(1),
          lastOrderTime: ts
        });

        // produk update
        batch.update(produkRef, {
          stokTersedia: admin.firestore.FieldValue.increment(-trx.jumlah),
          terjual: admin.firestore.FieldValue.increment(trx.jumlah)
        });

        // history user
        batch.set(
          userRef.collection('transactions').doc(trx.ref_id),
          {
            tanggal: ts,
            produk: kodeProduk,
            tipe: 'QRIS',
            hargaPerItem: trx.hargaPerItem,
            jumlah: trx.jumlah,
            total: trx.totalAmount,
            tujuan: trx.userId,
            invoice: trx.ref_id,
            status: 'Sukses',
            metode: 'QRIS',
            nicknameUser: trx.nickname
          }
        );

        // history umum
        batch.set(
          db.collection('history_trx').doc(trx.ref_id),
          {
            nomor,
            invoice: trx.ref_id,
            produk: kodeProduk,
            tipe: 'QRIS',
            tujuan: trx.userId,
            harga: trx.hargaPerItem,
            jumlah: trx.jumlah,
            total: trx.totalAmount,
            waktu: ts,
            status: 'Sukses',
            metode: 'QRIS',
            nicknameUser: trx.nickname
          }
        );

        await batch.commit();

        // 11) Kirim notifikasi sukses
        const dateStr = moment.tz('Asia/Jakarta').format('dddd, DD MMMM YYYY');
        const timeStr = moment.tz('Asia/Jakarta').format('HH:mm:ss');
        let follow = '';
        trx.stokIds.forEach((id,i) => {
          follow += `» Item ${i+1}: ${id}\n`;
        });

        let successMsg = `✅〔 *TRANSAKSI SUKSES* 〕✅

» Invoice: ${trx.ref_id}
» Produk: ${kodeProduk}
» Jumlah: ${trx.jumlah}
» Harga/item: Rp${trx.hargaPerItem.toLocaleString()}
» Total: Rp${trx.totalAmount.toLocaleString()}
${tipe==='SL'?`» Tujuan: ${trx.userId}\n» Nickname: ${trx.nickname}\n`:''}» Waktu: ${timeStr} WIB

──〔 *Follow ID Berikut !* 〕──
${follow}
*${namaStore}*`;

        await client.sendMessage(m.chat, { text: successMsg }, { quoted:m });
        await client.sendMessage(sender, { text: successMsg }, { quoted:m });
        for (const own of global.owner) {
          await client.sendMessage(own + '@s.whatsapp.net', { text: successMsg }, { quoted:m });
        }
        await client.sendMessage(m.chat, { delete: trx.msgKey });
      } catch(e) {
        console.error('Polling Error:', e);
      }
    }, 10000);

  } catch (err) {
    console.error('BuyQR Error:', err);
    return m.reply('❌ Terjadi kesalahan saat memproses buyqr.');
  }
  break;
}


        case 'addproduk': {
  if (!isOwner) return m.reply('Hanya owner yang bisa.');

  const body = m.text.trim(); // Contoh: 'addproduk slbasic "Starlight Basic" SL 25000 27500 28000 30000 "note..."'
  // Regex: 
  // 1: kodeProduk (\S+)
  // 2: namaProduk di dalam "..." ([^"]+)
  // 3: tipeProduk (\S+)
  // 4-7: hargaOwner, hargaGold, hargaSilver, hargaBronze (\d+)
  // 8 (opsional): note di dalam "..." ([^"]+)
  const regex = /^addproduk\s+(\S+)\s+"([^"]+)"\s+(\S+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)(?:\s+"([^"]+)")?$/i;
  const match = body.match(regex);
  if (!match) {
    return m.reply(
      `Format salah.\nContoh tanpa note:\n` +
      `> addproduk slbasic "Starlight Basic" SL 25000 27500 28000 30000\n` +
      `Contoh dengan note:\n` +
      `> addproduk slbasic "Starlight Basic" SL 25000 27500 28000 30000 "Keterangan tambahan"`
    );
  }
  const [
    ,
    kodeProdukRaw,
    namaProduk,
    tipeProdukRaw,
    hargaOwnerStr,
    hargaGoldStr,
    hargaSilverStr,
    hargaBronzeStr,
    noteRaw
  ] = match;

  const kodeProduk = kodeProdukRaw.toLowerCase();
  const tipeProduk = tipeProdukRaw.toUpperCase();
  const allowed = ['SL', 'VOUCHER', 'ACCOUNT', 'OTHER'];
  if (!allowed.includes(tipeProduk)) {
    return m.reply(`Tipe produk tidak valid. Pilih salah satu: ${allowed.join(', ')}`);
  }

  // Parse harga
  const hargaOwner = parseInt(hargaOwnerStr, 10);
  const hargaGold = parseInt(hargaGoldStr, 10);
  const hargaSilver = parseInt(hargaSilverStr, 10);
  const hargaBronze = parseInt(hargaBronzeStr, 10);
  if ([hargaOwner, hargaGold, hargaSilver, hargaBronze].some(isNaN)) {
    return m.reply('Harga harus angka bulat.');
  }

  // Note optional
  const note = noteRaw ? noteRaw.trim() : '';

  const produkRef = db.collection('produk_manual').doc(kodeProduk);
  await produkRef.set({
    namaProduk,
    tipeProduk,
    aktif: true,
    harga: {
      OWNER: hargaOwner,
      GOLD: hargaGold,
      SILVER: hargaSilver,
      BRONZE: hargaBronze
    },
    terjual: 0,
    note, // catatan/deskripsi produk
    dibuatPada: admin.firestore.FieldValue.serverTimestamp()
  });

  m.reply(
    `✅ Produk '${namaProduk}' dengan kode '${kodeProduk}' ditambahkan.` +
    (note ? ` Note disimpan: "${note}"` : '')
  );
  break;
}
		
        case 'stok': {
  // Cek user terdaftar
  const nomor = sender.split('@')[0];            
  const userRef = db.collection('users').doc(nomor);
  const userDoc = await userRef.get();
  if (!userDoc.exists) return m.reply('Kamu belum terdaftar. Silakan ketik *Daftar*');
  const userProfile = userDoc.data();

  // Definisikan roleKey berdasarkan userProfile, misal userProfile.role
  let roleKey = 'BRONZE';
  if (userProfile.role) {
    const rk = userProfile.role.toString().toUpperCase();
    if (['OWNER','GOLD','SILVER','BRONZE'].includes(rk)) {
      roleKey = rk;
    }
  }
  // Sekarang roleKey sudah ada

  try {
    const produkSnap = await db.collection('produk_manual')
      .where('aktif', '==', true)
      .get();
    if (produkSnap.empty) {
      return m.reply('Belum ada produk yang terdaftar.');
    }

    const produkList = [];
    for (const doc of produkSnap.docs) {
      const kodeProduk = doc.id;
      const data = doc.data();

      // Hitung stok tersedia (opsional: sebaiknya simpan count di dokumen produk untuk performa)
      let tersediaCount = 0;
      try {
        const stokSnap = await db.collection('produk_manual')
          .doc(kodeProduk)
          .collection('stok')
          .where('status', '==', 'tersedia')
          .get();
        tersediaCount = stokSnap.size;
      } catch (e) {
        console.error(`Error fetch stok untuk ${kodeProduk}:`, e);
      }

      const harga = (data.harga && data.harga[roleKey]) ? data.harga[roleKey] : '-';
      produkList.push({
        kode: kodeProduk,
        nama: data.namaProduk || '-',
        harga,
        terjual: typeof data.terjual === 'number' ? data.terjual : 0,
        stokTersedia: tersediaCount,
        note: data.note || ''
      });
    }

    produkList.sort((a, b) => b.terjual - a.terjual);

    // Bangun header, pastikan menggunakan roleKey yang sudah didefinisikan
    const header = `
‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎‎ ‎ ‎ ‎‎ ‎ ‎  ‎ ‎ ‎ ‎ ‎ ‎ ‎ ⣠⠞⠛⠛⠶      
‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ⣀⡾⠛⢻⡷⢦⣄        
 ‎ ‎ ⣠⡴⠞⠛⠹⡇ ‎ ‎ ‎‎  ‎ ‎ ‎   ⢀⡟⠛⠳⢶⣄    
⢠⣿⣄⡀‎‎ ‎  ‎   ⢿⣦⣤⣴⠿⠇ ‎ ‎𝓒-𝖼𝖺𝗍𝖺𝗅𝗈𝗀𝗎𝖾'𝗌 
‎  ‎⠁⠉⠙⠛⠶⠶⠶⠶⠶⠶⠶⠛⠛⠉⠈
𓈒  ֗  𝗌𝖾𝗏𝖾𝗋𝖺𝗅 𝗉𝗋𝗈𝖽𝗎𝖼𝗍𝗌 𝖺𝗏𝖺𝗂𝗅𝖺𝖻𝗅𝖾  𓈒 𓂋 𝖼𝗁𝖾𝗋𝗂𝗌'𝗒
‎  ‎ ‎ ‎ ‎ 𝗈𝗇 ━ 제품  𝓐─𝗮𝘁𝗹𝗮𝗻𝘁𝗶𝗰 𝗴𝗮𝘁𝗲 ‎𓈒  ֗  𐂯‎‎
‎  ‎ ‎ ‎ ‎ ‎  ‎ ‎ ‎ ‎‎  ‎ ‎ ‎ ‎  𝗉𝖾𝗋𝗌–𝖻𝗎𝗌𝗌

╭┈ ketik *buy / buyqr* untuk order
𑣿.. 𝖱𝗈𝗅𝖾 𝖠𝗇𝖽𝖺 : ${roleKey}
 |  ׄ  ᨧ︩ᨩ ۫  𝗉𝗋𝗈𝖽𝗎𝗄 𝗍𝖾𝗋𝗌𝖾𝖽𝗂𝖺 : ${produkList.length}
 |  ׄ  ᨧ︩ᨩ ۫  total stok :  ${produkList.reduce((sum, p) => sum + p.stokTersedia, 0)}
╰──━\n  ͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏  `.trim();

    const bodyLines = [header];
    for (const p of produkList) {
      const isBestSeller = produkList[0].kode === p.kode && p.terjual > 0;
      const bestTag = isBestSeller ? '(Best Seller)' : '';
      const block = `
╭┈ 🔥 *${p.nama}* ${bestTag}
 | 𝖪𝗈𝖽𝖾 : \`${p.kode}\`
 | 𝖧𝖺𝗋𝗀𝖺 : 𝖱𝗉 ${p.harga}
 | 𝖲𝗍𝗈𝗄 𝗍𝖾𝗋𝗌𝖾𝖽𝗂𝖺 : ${p.stokTersedia}
 | 𝖲𝗍𝗈𝗄 𝗍𝖾𝗋𝗃𝗎𝖺𝗅 : ${p.terjual}
 | 𝖭𝗈𝗍𝖾 : ${p.note || '-'} 
╰─────────⪦`.trim();
      bodyLines.push(block);
    }
    const pesan = bodyLines.join('\n\n');
    return m.reply(pesan);
  } catch (err) {
    console.error('Error command stok:', err);
    return m.reply('Terjadi kesalahan saat mengambil data stok.');
  }
}

      case 'cek': {
  if (args.length < 1) {
    m.reply(`Format Salah\nFormat yang benar adalah : \`\`\`cek [Nomor Invoice]\`\`\``);
    return;
  }

  const nomorInvoice = args[0];
  const transactionsData = JSON.parse(fs.readFileSync('./db/trx.json', 'utf8'));
  const transaction = transactionsData.find((trx) => trx.invoice === nomorInvoice);

  if (!transaction) {
    m.reply(`Transaksi dengan Nomor Invoice ${nomorInvoice} tidak ditemukan`);
    return;
  }

  const statusMessage = transaction.status === 'Sukses' ?
    `✅ *TRANSAKSI BERHASIL*\n` :
    `❌ *TRANSAKSI GAGAL*\n`;

  const responseMessage = `${statusMessage}Invoice: ${transaction.invoice}\nItem: ${transaction.item}\nStatus: ${transaction.status}\nRC: ${transaction.rc}\nTujuan: ${transaction.tujuan}\nHarga: Rp ${transaction.harga.toLocaleString()}\nWaktu: ${transaction.waktu}`;

  m.reply(responseMessage);
  break;
}
   
case 'riwayat': {
    if (!isOwner) return;
  const inputDate = m.text.split(' ')[1]; // Ambil tanggal dari perintah, misal "29,02,2024"
  const selectedDate = moment(inputDate, 'DD,MM,YYYY').locale('id');

  if (!selectedDate.isValid()) {
    m.reply('Format tanggal tidak valid. Gunakan format DD,MM,YYYY (contoh: 29,02,2024)');
    return;
  }

  const formattedDate = selectedDate.format('dddd,DD MMMM YYYY');
  const transactionsData = JSON.parse(fs.readFileSync('./db/trx.json', 'utf8'));
  const selectedTransactions = transactionsData.filter((trx) => trx.waktu.includes(formattedDate));

  if (selectedTransactions.length === 0) {
    m.reply(`Tidak ada riwayat transaksi pada tanggal ${formattedDate}.`);
    return;
  }
   
  const successTransactions = selectedTransactions.filter((trx) => trx.status === 'Sukses');
  const failedTransactions = selectedTransactions.filter((trx) => trx.status === 'Gagal');

  // Hitung jumlah transaksi sukses, jumlah transaksi gagal, total modal, dan total keuntungan
  const totalSuccess = successTransactions.length;
  const totalFailed = failedTransactions.length;
  const totalModal = successTransactions.reduce((acc, trx) => acc + trx.harga_pokok, 0);
  const totalKeuntungan = successTransactions.reduce((acc, trx) => acc + (trx.harga - trx.harga_pokok), 0);

  // Buat pesan respon
  let responseMessage = `â—§â”â” *${namaStore}* â”â”â—§\nðŸ“… *RIWAYAT TRANSAKSI TANGGAL ${formattedDate}*\n`;

  if (totalSuccess > 0) {
    responseMessage += '\nâœ… *TRANSAKSI SUKSES*\n';
    successTransactions.forEach((trx) => {
      responseMessage += `\nInvoice: ${trx.invoice}\nItem: ${trx.item}\nTujuan: ${trx.tujuan}\nHarga: Rp ${trx.harga.toLocaleString()}\nHarga Pokok: Rp ${trx.harga_pokok.toLocaleString()}\n`;
    });
  }

  if (totalFailed > 0) {
    responseMessage += '\nâŒ *TRANSAKSI GAGAL*\n';
    failedTransactions.forEach((trx) => {
      responseMessage += `\nInvoice: ${trx.invoice}\nItem: ${trx.item}\nTujuan: ${trx.tujuan}\nHarga: Rp ${trx.harga.toLocaleString()}\nHarga Pokok: Rp ${trx.harga_pokok.toLocaleString()}\n`;
    });
  }

  responseMessage += `\n✅ *JUMLAH TRANSAKSI SUKSES*: ${totalSuccess}`;
  responseMessage += `\n❌ *JUMLAH TRANSAKSI GAGAL*: ${totalFailed}`;
  responseMessage += `\n💰  *TOTAL MODAL*: Rp ${totalModal.toLocaleString()}`;
  responseMessage += `\n📈  *TOTAL KEUNTUNGAN*: Rp ${totalKeuntungan.toLocaleString()}`;

  m.reply(responseMessage);
  break;
}



case 'getlay': {
        if (!isOwner) return;
        const cmd = 'prepaid';
        const combinedString = username + apiKey + cmd;
        const signature = crypto.createHash('md5').update(combinedString).digest('hex');
        const endPoint = "https://api.digiflazz.com/v1/price-list";
        const postData = {
          cmd,
          username,
          sign: signature,
        };
        const apiResponse = await connect(endPoint, postData);
        if (apiResponse && apiResponse.data) {
          fs.writeFileSync(productData, JSON.stringify(apiResponse.data, null, 2));
          m.reply(`Layanan Berhasil di Update`);
        }
      }
      break;
      
      case 'dashboard': {
        if (!isOwner) return
        const combinedString = username + apiKey + "depo";
        const signature = crypto.createHash('md5').update(combinedString).digest('hex');
        const endPoint = "https://api.digiflazz.com/v1/cek-saldo";
        const postData = {
          cmd: "deposit",
          username: username,
          sign: signature,
        };
        connect(endPoint, postData)
          .then((apiResponse) => {
            if (apiResponse && apiResponse.data) {
              const profile = apiResponse.data;
              const formatSaldo = (amount) => `Rp. ${amount.toLocaleString()}`;
              const ngen = `───〔 Profile 〕───\n\n» *Username* : ${username}\n» *Nama Bot* : ${botName}\n» *Saldo* : ${formatSaldo(profile.deposit)}\n» *Status* : Aktif`
              m.reply(ngen)
            } else {
              console.log("Failed to get API data.");
            }
          })
          .catch((error) => {
            console.error("Error:", error);
            console.log("Failed to make API request.");
          });
      }
      break
/*
      case 'hidetag':
case 'h': {
  if (!m.isGroup) return
  if (!isAdmins) return

  // Fungsi untuk mempertahankan spasi di awal baris
  const fixIndent = (text) => {
    return text.split('\n').map(line => {
      return line.replace(/^ +/g, (spaces) => spaces.replace(/ /g, '\u00A0'))
    }).join('\n')
  }

  // Pastikan teksnya ada & fix indentasi
  const finalText = text ? fixIndent(text) : ''

  client.sendMessage(m.chat, {
    text: finalText,
    mentions: participants.map(a => a.id)
  }, {
    quoted: m
  })
}
*/
/*            
            case 'list':
case 'lists': {
  if (!m.isGroup) return m.reply("Command ini hanya bisa digunakan di Group.");
  const groupID = from;
  listCustomCommands(groupID, m);
}
break;
            case 'addlist': {
  if (!m.isGroup) return;

  if (!isAdmins) {
    return m.reply("Fitur ini hanya bisa digunakan oleh admin group ðŸ˜¿");
  }

  const groupID = from;
  const input = args.join(' ').trim();
  const delimiterIndex = input.indexOf('@');

  if (delimiterIndex !== -1) {
    const key = input.slice(0, delimiterIndex).trim().toUpperCase();
    const response = input.slice(delimiterIndex + 1).trim();

    if (!key || !response) {
      return m.reply(`Gunakan dengan cara *${command} key@response*\n\nContoh: *${command} tes@apa*`);
    }

    // Cek apakah key sudah ada di grup ini
    const db = readCustomCommands();
    const existing = db[groupID] && db[groupID][key];

    if (existing) {
      return m.reply(`kata kunci *"${key}"* sudah ada di hatiku ^_^ ðŸ«£`);
    }

    // Simpan key baru
    addCustomCommand(groupID, key, response);
    m.reply(`Sukses Set List Message\nKata Kunci : *${key}*`);
  } else {
    m.reply(`Gunakan dengan cara *${command} key@response*\n\nContoh: *${command} tes@apa*`);
  }
}
break;
            case 'renamelist': {
  if (!isGroup) return;
  if (!isAdmins) return;

  const groupID = from;
  const input = args.join(' ').trim();
  const [oldKey, newKey] = input.split('|').map(v => v.trim().toUpperCase());

  if (!oldKey || !newKey) {
    return m.reply(`Gunakan dengan cara: *${command} oldKey|newKey*\nContoh: *${command} PROMO|PROMO BARU*`);
  }

  const list = readCustomCommands();
  if (!list[groupID] || !list[groupID][oldKey]) {
    return m.reply(`Kata kunci *${oldKey}* tidak ditemukan`);
  }

  // Rename
  list[groupID][newKey] = list[groupID][oldKey];
  delete list[groupID][oldKey];
  saveCustomCommands(list);
  m.reply(`Berhasil rename dari *${oldKey}* menjadi *${newKey}*`);
}
break;
              case 'updatelist': {
  if (!m.isGroup) return;
  if (!isAdmins) return;

  const groupID = from;
  const updateListCommand = body.slice(10).trim();
  const [updateKey, newResponse] = updateListCommand.split('||').map(s => s.trim());

  if (!updateKey || !newResponse) {
    return m.reply(`Format salah!\nContoh: *${prefix}updatelist KEY||RESPON BARU*`);
  }

  const customCommands = readCustomCommands();
  if (customCommands[groupID] && customCommands[groupID][updateKey.toUpperCase()]) {
    customCommands[groupID][updateKey.toUpperCase()] = newResponse;
    saveCustomCommands(customCommands);
    m.reply(`Sukses Update List\nKata Kunci: *${updateKey.toUpperCase()}*`);
  } else {
    m.reply(`Kata kunci *${updateKey.toUpperCase()}* tidak ditemukan`);
  }
}
break;         
      case 'dellist':
case 'hapuslist': {
  if (!isAdmins) return;
  const groupID = from;
  const dellistCommand = body.slice(8).trim().toUpperCase();
  const customCommands = readCustomCommands();

  if (customCommands[groupID] && customCommands[groupID][dellistCommand]) {
    delete customCommands[groupID][dellistCommand];
    saveCustomCommands(customCommands);
    m.reply(`Sukses Delete List Message\nKata Kunci : *${dellistCommand}*`);
  } else {
    m.reply(`Gunakan dengan cara *${command} key*\n\nContoh: \`\`\`${command} tes\`\`\``);
  }
}
break;
*/      
            
            case 'hidetag':
case 'h': {
  if (!m.isGroup) return
  if (!isAdmins) return

  // Fungsi untuk mempertahankan spasi di awal baris
  const fixIndent = (text) => {
    return text.split('\n').map(line => {
      return line.replace(/^ +/g, (spaces) => spaces.replace(/ /g, '\u00A0'))
    }).join('\n')
  }

  // Pastikan teksnya ada & fix indentasi
  const finalText = text ? fixIndent(text) : ''

  client.sendMessage(m.chat, {
    text: finalText,
    mentions: participants.map(a => a.id)
  }, {
    quoted: m
  })
}

// Case untuk setwelcome dan setleft
 
            
      break
      case 'join': {
        if (!isOwner) return
        if (!text) return m.reply(`Link Groupnya Mana?`)
        var ini_urrrl = text.split('https://chat.whatsapp.com/')[1]
        var data = await client.groupAcceptInvite(ini_urrrl).then((res) => m.reply(`Berhasil Join ke grup...`)).catch((err) => m.reply(`Eror.. Munkin bot telah di kick Dari grup tersebut`))
      }
      break
      case 'getip': {
        if (!isOwner) return
        var http = require('http')
        http.get({
          'host': 'api.ipify.org',
          'port': 80,
          'path': '/'
        }, function(resp) {
          resp.on('data', function(ip) {
            m.reply("IP : " + ip);
          })
        })
      }
      break
      case 'kick': {
        if (!m.isGroup) return
        if (!isAdmins && !isOwner) return
        if (!isBotAdmins) return
        let users = m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : text.replace(/[^0-9]/g, '') + '@s.whatsapp.net'
        await client.groupParticipantsUpdate(m.chat, [users], 'remove').then((res) => m.reply(`${users} telah di kick...`)).catch((err) => m.reply('hmmm gagal kick dia'))
      }
      break
            
    case 'del': {
    if (!m.isGroup) return; // Pastikan pesan diterima dari grup
    if (!isAdmins && !isOwner) return; // Hanya admin atau owner yang bisa menghapus pesan
    if (!m.quoted) return; // Pastikan ada pesan yang dibalas

    let target = m.quoted.sender; // Ambil pengirim pesan yang dibalas

    // Hapus pesan yang dibalas
    await client.deleteMessage(m.chat, {
        id: m.quoted.id,
        remoteJid: target,
        fromMe: false
    });

    m.reply('Pesan berhasil dihapus.');
}
break;

      
      case 'linkgroup':
      case 'linkgrup':
      case 'linkgc': {
        if (!m.isGroup) return
        if (!isAdmins && !isOwner) return
        if (!isBotAdmins) return
        let response = await client.groupInviteCode(m.chat)
        client.sendText(m.chat, `*『 INFO LINK GROUP 』*\n\n» *Nama Grup :* ${groupMetadata.subject}\n» *Owner Grup :* ${groupMetadata.owner !== undefined ? '@' + groupMetadata.owner.split`@`[0] : 'Tidak diketahui'}\n» *ID Grup:* ${groupMetadata.id}\n» *Link Grup :* https://chat.whatsapp.com/${response}\n» *Member :* ${groupMetadata.participants.length}\n`, m, {
          detectLink: true
        })
      }
      break
   
case 'profit': {
    if (!isOwner) return m.reply('Hanya owner yang dapat mengakses ini.');

    const profitCommand = body.slice(7).trim();
    const [role, percentageString] = profitCommand.split(' ');

    const roles = ['bronze', 'silver', 'gold', 'owner'];
    const percentage = parseFloat(percentageString?.trim()) / 100;

    if (roles.includes(role) && !isNaN(percentage) && percentage >= 0 && percentage <= 1) {
        const configFile = './db/config.js';

        fs.readFile(configFile, 'utf8', (err, data) => {
            if (err) {
                return m.reply('Gagal membaca file konfigurasi.');
            }

            // Update the margin for the specified role in the config file
            const marginRegex = new RegExp(`margin${role.charAt(0).toUpperCase() + role.slice(1)}\\s*=\\s*[0-9.]+`);
            const newMarginString = `margin${role.charAt(0).toUpperCase() + role.slice(1)} = ${percentage}`;
            data = data.replace(marginRegex, newMarginString);

            fs.writeFile(configFile, data, 'utf8', (err) => {
                if (err) {
                    return m.reply('Gagal menulis ke file konfigurasi.');
                }

                const currentMargins = {
                    bronze: parseFloat(data.match(/marginBronze\s*=\s*([0-9.]+)/)[1]),
                    silver: parseFloat(data.match(/marginSilver\s*=\s*([0-9.]+)/)[1]),
                    gold: parseFloat(data.match(/marginGold\s*=\s*([0-9.]+)/)[1]),
                    owner: parseFloat(data.match(/marginOwner\s*=\s*([0-9.]+)/)[1]),
                };

                m.reply(`*Sukses Merubah Profit ${role.charAt(0).toUpperCase() + role.slice(1)}* menjadi ${percentage * 100}%\n\nProfit Sekarang:\n` +
                    `- Bronze: ${currentMargins.bronze * 100}%\n` +
                    `- Silver: ${currentMargins.silver * 100}%\n` +
                    `- Gold: ${currentMargins.gold * 100}%\n` +
                    `- Owner: ${currentMargins.owner * 100}%`);
            });
        });
    } else {
        const data = fs.readFileSync('./db/config.js', 'utf8');

        const currentMargins = {
            bronze: parseFloat(data.match(/marginBronze\s*=\s*([0-9.]+)/)[1]),
            silver: parseFloat(data.match(/marginSilver\s*=\s*([0-9.]+)/)[1]),
            gold: parseFloat(data.match(/marginGold\s*=\s*([0-9.]+)/)[1]),
            owner: parseFloat(data.match(/marginOwner\s*=\s*([0-9.]+)/)[1]),
        };

        m.reply(`Format perintah salah atau nilai tidak valid. Gunakan format: "profit role persentase".\nContoh: "profit bronze 3"\n\nProfit Saat Ini:\n` +
            `- Bronze: ${currentMargins.bronze * 100}%\n` +
            `- Silver: ${currentMargins.silver * 100}%\n` +
            `- Gold: ${currentMargins.gold * 100}%\n` +
            `- Owner: ${currentMargins.owner * 100}%`);
    }
}
break;

      case 'close': {
        if (!m.isGroup) return
        if (!isAdmins) return
        if (!isBotAdmins) return
        const menu_nya = `───〔 *GROUP CLOSE* 〕──

*Group Telah Di Tutup Oleh* @${sender.split("@")[0]}

\`\`\`📆${hariini}
⏰${time1} WIB\`\`\`

اَلْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ 

_Terimakasih atas orderan hari ini, semoga besok lebih lebih laris untuk kita semua aamiin... ✨_`;
        await client.groupSettingUpdate(m.chat, 'announcement').then((res) => client.sendMessage(from, { text: menu_nya, contextInfo: { mentionedJid: [sender, owned] } }))
      }
      break
      case 'open': {
        if (!m.isGroup) return
        if (!isAdmins) return
        if (!isBotAdmins) return
        const menu_nya =
          `───〔 *GROUP OPEN* 〕──

*Group Telah Di Buka Oleh* @${sender.split("@")[0]}

\`\`\`📆${hariini}
⏰${time1} WIB\`\`\`

بِسْــــــــــــــــــمِ اللهِ الرَّحْمَنِ الرَّحِيْمِ

_Open guys, jangan lupa awali hari dengan senyuman semoga dilancarkan urusan ✨_`
        
        await client.groupSettingUpdate(m.chat, 'not_announcement').then((res) => client.sendMessage(from, { text: menu_nya, contextInfo: { mentionedJid: [sender, owned] } }))
      }
      break
            

case 'proses':
case 'p': {
    if (!m.quoted || !m.quoted.sender || !isOwner) return;
    
    const users = m.quoted.sender;
    const owned = `${global.nomerOwner}@s.whatsapp.net`;
    const menuInfo =
        `*「 TRANSAKSI PENDING 」*\n\n` +
        `⛅ HARI      : ${hariini}\n` +
        `⌚ JAM       : ${time1}\n` +
        `✨ STATUS : PENDING\n\n` +
        `*PESANAN @${users.split("@")[0]} SEDANG DIPROSES*`;
    
    client.sendMessage(from, { text: menuInfo, contextInfo: { mentionedJid: [users, owned], forwardingScore: 9999, isForwarded: true } }, );
}
break;

case 'done':       
case 'd': {
    if (!m.quoted || !m.quoted.sender || !isOwner) return;
    
    const users = m.quoted.sender;
    const owned = `${global.nomerOwner}@s.whatsapp.net`;
    const menuInfo =
        `*「 TRANSAKSI SUKSES 」*\n\n` +
        `⛅ HARI      : ${hariini}\n` +
        `⌚ JAM       : ${time1}\n` +
        `✨ STATUS : SUKSES\n\n` +
        `*PESANAN @${users.split("@")[0]} TELAH BERHASIL*`;
    
    client.sendMessage(from, { text: menuInfo, contextInfo: { mentionedJid: [users, owned], forwardingScore: 9999, isForwarded: true } }, );
}
break;
       
    
    case 'owner': {
    var owner_Nya = `${global.nomerOwner}@s.whatsapp.net`;

    // Sending the contact
    sendContact(from, owner_Nya, global.ownerName, m);

    // Adding a delay before sending the response message
    setTimeout(() => {
        // Adding respon pesan setelah mengirim kontak owner
        var responseMessage = "*_Itu Kak Kontak Admin Saya, Jika Mau Order Apapun Silahkan Hubungi Dia ya._*\n\n*Admin Juga Menyediakan Jasa Pembuatan Bot Dan Website Topup Otomatis Bagi Kamu Yang Mau Mulai Berbisnis 🤝";
        client.sendText(from, responseMessage);
    }, 1000); // Adjust the delay time as needed

    break;
}
         /*   
case 'afk': {
    if (!m.isGroup) return m.reply("FITUR UNTUK GRUB")
    if (!isOwner) return m.reply("Fitur Ini Khusus Owner!");
    
	const cooldowns = new Map();              
    const now = Date.now();
    const cooldownTime = 5000; // Batas waktu antara eksekusi perintah AFK dalam milidetik (misalnya, 5 detik)

    if (cooldowns.has(m.sender)) {
        const lastExecutionTime = cooldowns.get(m.sender);
        const remainingTime = lastExecutionTime + cooldownTime - now;
        if (remainingTime > 0) {
            return m.reply(`Tunggu beberapa saat sebelum menggunakan perintah AFK lagi. (Sisa Waktu: ${msToDate(remainingTime)})`);
        }
    }

    let reason = text ? text : 'Nothing.';
    afk.addAfkUser(m.sender, Date.now(), reason, _afk);
    client.sendTextWithMentions(m.chat, `@${m.sender.split('@')[0]} sedang afk\nAlasan : ${reason}`, m);
    cooldowns.set(m.sender, now); // Catat waktu terakhir pengguna menjalankan perintah AFK
break;
};            
        */
     case 'cekff':{
	if (!q) return m.reply(`🔍CEK NICK FREE FIRE\nContoh: cekff 12345678`)
	const id = text.split(' ')[0]
    if  (!id) return m.reply('ID wajib di isi');
	const { stalkff } = require('./lib/stalk-ff.js');
	stalkff(id).then(i=>{
        //console.log(i)
		if (i.status !== 200) return m.reply(i.msg)
		m.reply(`*CEK NICK FREE FIRE*

*ID*: ${id}
*Nickname:* ${i.nickname}`)
	})
break;
}
case 'cekml':{
	if (!q) return m.reply(`🔍CEK NICK MOBILE LEGENDS\nContoh: cekml 1234578 1234`)
	const id = text.split(' ')[0]
	const zon = text.split(' ')[1]
	if (!id) return m.reply('ID wajib di isi');
	if (!zon) return m.reply('ZoneID wajib di isi');
    const { stalkml } = require('./lib/stalk-ml.js');
	stalkml(id, zon).then(i=>{
        //console.log(i)
		if (i.status !== 200) return m.reply(i.msg)
		m.reply(`*CEK NICK MOBILE LEGENDS*
		
ID: ${id} (${zon})
Nickname: ${i.nickname}`)
	})
break;
}


case 'form': {
  if (!text) {
    return m.reply(`Gunakan:\n> ${prefix + command} [jenis_order] [id] [server] [jumlah]\nContoh:\n> ${prefix + command} sl basic 735660422 8938 3`);
  }

  const parts = text.trim().split(/\s+/);

  if (parts.length < 4) {
    return m.reply(`Format salah!\nContoh:\n> ${prefix + command} sl basic 735660422 8938 3`);
  }

  // Ambil dari belakang
  const jumlah = parts.pop();
  const server = parts.pop();
  const userId = parts.pop();
  const jenisOrder = parts.join(' ').toUpperCase();

  let nickname = 'Tidak ditemukan';

  // Validasi ML: auto get nickname
  if (server !== '-' && userId) {
    try {
      const fetch = require('node-fetch');
      const params = new URLSearchParams();
      params.append('country', 'SG');
      params.append('userId', userId);
      params.append('voucherTypeName', "MOBILE_LEGENDS");
      params.append('zoneId', server);

      const response = await fetch('https://order-sg.codashop.com/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
        body: params
      });

      const data = await response.json();
      if (data.success !== false) {
        nickname = decodeURIComponent(data.result.username);
      }
    } catch (e) {
      console.error('Error fetch ML nick:', e);
    }
  }

  // Tanggal auto
  const today = new Date();
  const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
  const tanggal = today.toLocaleDateString('id-ID', options);

  // Output final
  const formatOrder =
`♡ ˖ *f̲o̲r̲m̲a̲t̲ ̲o̲r̲d̲e̲r̲* 𔔀˖ᣞ۪ 

ᨳ 𝗂𝖽 +﹙𝗌𝖾𝗋𝗏𝖾𝗋﹚: ${userId} (${server})
ᨳ 𝗇𝗂𝖼𝗄𝗇𝖺𝗆𝖾 : ${nickname}
ᨳ 𝗃𝖾𝗇𝗂𝗌 𝗈𝗋𝖽𝖾𝗋 : ${jenisOrder}
ᨳ 𝗃𝗎𝗆𝗅𝖺𝗁 : ${jumlah}
ᨳ 𝗍𝖺𝗇𝗀𝗀𝖺𝗅 𝗈𝗋𝖽𝖾𝗋 : ${tanggal}
ᨳ 𝗈𝗋𝖽𝖾𝗋 𝖻𝗒 : ${m.sender.split('@')[0]}

 ⋮ 𖢷 𖥦 send form to *a̲d̲m̲i̲n̲* .. 🩰`;

  client.sendMessage(m.chat, { text: formatOrder }, { quoted: m });
}
break;



            
          case 'mlregg':{
    if (!text) {
        return m.reply(`*MOBILE LEGENDS VALIDASI ID V2.0*\n\nGunakan dengan cara :\n> ${prefix + command} ID SERVER\n\nContoh :\n> ${prefix + command} 640015932 10164`);
    }
    const fetch = require('node-fetch');
    const url = 'https://order-sg.codashop.com/validate';
    const userId = args[0];
    const zoneId = args[1];
    const country = "SG";

    if (!userId || !zoneId) {
        return m.reply(`Format Salah!\n\nSilakan gunakan dengan cara :\n\n> ${prefix + command} userId zoneId\n\nContoh :\n> ${prefix + command} 640015932 10164`);
    }

    const params = new URLSearchParams();
    params.append('country', country)
    params.append('userId', userId);
    params.append('voucherTypeName', "MOBILE_LEGENDS")
    params.append('zoneId', zoneId);

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
            },
            body: params
        });
        const data = await response.json();
        console.log(data);
        if (data.success === false) { 
            return m.reply(`Maaf, ID tidak valid`);
        } else {
            const encodedUsername = data.result.username;
            const decodedUsername = decodeURIComponent(encodedUsername);
            const regionCountry = data.result.create_role_country.toUpperCase();
            const regionLogin = data.result.this_login_country.toUpperCase();
            
            const message = ` *DETAIL AKUN MOBILE LEGENDS*\n\n Username: ${decodedUsername}\n Region Akun: ${regionCountry}\n Region Login: ${regionLogin}`;
            client.sendMessage(m.chat, { text: message }, { quoted: m });
        }
    } catch (error) {
        console.error('Error fetching data:', error);
        return m.reply('Maaf terjadi kesalahan, silahkan cek Console untuk informasi lebih lanjut');
    }
    break;
}

case "cekpln": {
    if (!text) return m.reply(`!Silahkan isi dengan nomer meter\n\nContoh : cekpln 14331231507`)
        let data = {
          commands: 'pln-subscribe',
    customer_no: text,
        }
        fetch('https://api.digiflazz.com/v1/transaction', {
            method: 'POST',
            body: JSON.stringify(data),
            header: {
              'Content-Type': 'application/json'
            }
          }).then((response) => response.json())
          .then((res) => {
            const pesan = `*──••• 「 CEK DATA PLN 」 •••──*

Nama : ${res.data.name}
Nomor Meter: ${res.data.meter_no}
Subscribe: ${res.data.subscriber_id}
Daya : ${res.data.segment_power}`            
            client.sendMessage(m.chat,{text:pesan})
          })
break;
}    
            case 'antilink': {
  if (!isGroup) return m.reply(mess.group);
  if (!isAdmins) return m.reply(mess.admin);
  if (!isBotAdmins) return m.reply("Jadikan saya Admin dulu ya :)");
  
  const action = args[0]; // 'on' untuk mengaktifkan atau 'off' untuk menonaktifkan
  
  if (action === 'on') {
    antilink.push(from);
    fs.writeFileSync('./src/antilink.json', JSON.stringify(antilink, null, 2));
    m.reply(`âœ… Sukses mengaktifkan fitur antilink di group *${groupMetadata.subject}*`);
  } else if (action === 'off') {
    const index = antilink.indexOf(from);
    if (index !== -1) {
      antilink.splice(index, 1);
      fs.writeFileSync('./src/antilink.json', JSON.stringify(antilink, null, 2));
      m.reply(`âœ… Sukses menonaktifkan fitur antilink di group *${groupMetadata.subject}*`);
    } else {
      m.reply(`Fitur antilink tidak aktif di group *${groupMetadata.subject}*.`);
    }
  } else {
    m.reply('Gunakan "on" untuk mengaktifkan atau "off" untuk menonaktifkan fitur antilink.');
  };
break;
};    
            //manajemen tracking
            case 'mlbbrecom ':
        	case 'mlbbrecomm': {
  if (!isOwner) return m.reply('Hanya owner yang bisa.');

  try {
    const initialMsg = await m.reply('🔎 Mengambil & mengurutkan akun (prioritas recharge unused & gift quota)...');
    const msgKey = initialMsg.key;

    const snap = await db.collection('mlbb_accounts').get();
    if (snap.empty) {
      await client.sendMessage(msgKey.remoteJid, { text: 'Tidak ada akun MLBB.', edit: msgKey });
      return;
    }

    // Waktu Jakarta
    const now = moment().tz('Asia/Jakarta');
    const nowStr = now.format('DD/MM/YYYY, HH.mm');

    // Pemetaan id recharge → label
    const rechargeKeyMap = {
      '50+50':  'diamond50plus50',
      '150+150': 'diamond150plus150',
      '250+250': 'diamond250plus250',
      '500+500': 'diamond500plus500',
    };
    const labelsAsc  = ['50+50', '150+150', '250+250', '500+500'];
    const labelsDesc = ['500+500', '250+250', '150+150', '50+50']; // buat tie-breaker prioritas besar→kecil
    const knownKeys  = labelsAsc.map(l => rechargeKeyMap[l]);

    const list = [];
    let totalGift = 0;

    for (const doc of snap.docs) {
      const data = doc.data();

      // --- Gift quota ---
      let giftQuota = 0;
      try {
        const quotaDoc = await doc.ref.collection('gift_quota').doc('current').get();
        if (quotaDoc.exists) giftQuota = quotaDoc.data().remaining || 0;
      } catch (e) {
        console.log(`Gift quota error ${data.accountId}:`, e);
      }
      totalGift += giftQuota;

      // --- Recharge status ---
      const rechargeStatus = {};
      try {
        const rSnap = await doc.ref.collection('recharge_items').get();
        if (!rSnap.empty) {
          rSnap.forEach(rdoc => {
            const d = rdoc.data();
            // false = belum dipakai (GOOD), true = sudah dipakai
            rechargeStatus[rdoc.id] = d.used || false;
          });
        }
      } catch (e) {
        console.log(`Recharge status error ${data.accountId}:`, e);
      }

      // Hitung jumlah recharge yang BELUM dipakai
      const unusedKeys = knownKeys.filter(k => rechargeStatus[k] === false);
      const unusedCount = unusedKeys.length;

      // SKIP akun yang semua recharge sudah dipakai (unusedCount = 0)
      if (unusedCount === 0) continue;

      // Simbol untuk display (tetap tampilkan semua tipe agar jelas)
      const rechargeSymbols = labelsAsc.map(lbl => {
        const key = rechargeKeyMap[lbl];
        return rechargeStatus[key] === false ? '✅' : '❌';
      }).join(' ');

      // Flag prioritas (besar→kecil) untuk tie-breaker
      const has500 = rechargeStatus[rechargeKeyMap['500+500']] === false ? 1 : 0;
      const has250 = rechargeStatus[rechargeKeyMap['250+250']] === false ? 1 : 0;
      const has150 = rechargeStatus[rechargeKeyMap['150+150']] === false ? 1 : 0;
      const has50  = rechargeStatus[rechargeKeyMap['50+50']]  === false ? 1 : 0;

      list.push({
        id: data.accountId,
        nickname: data.nickname || 'Unknown',
        gameId: `${data.gameId || '?'}:${data.server || '?'}`,
        status: data.status || '-',
        giftQuota,
        rechargeSymbols,
        unusedCount,
        diamonds: data.diamonds || 0, // tie-breaker terakhir
        // sort key:
        // 1) unusedCount desc
        // 2) giftQuota desc
        // 3) priority has500→has250→has150→has50 (desc)
        // 4) diamonds desc
        sortKey: [unusedCount, giftQuota, has500, has250, has150, has50, data.diamonds || 0],
      });
    }

    if (list.length === 0) {
      await client.sendMessage(msgKey.remoteJid, { 
        text: 'Tidak ada akun dengan recharge yang masih *unused*.', 
        edit: msgKey 
      });
      return;
    }

    // Urutkan: paling memenuhi → paling tidak
    list.sort((a, b) => {
      for (let i = 0; i < a.sortKey.length; i++) {
        if (b.sortKey[i] !== a.sortKey[i]) return b.sortKey[i] - a.sortKey[i];
      }
      const aId = String(a.id || '').padStart(4, '0');
      const bId = String(b.id || '').padStart(4, '0');
      return aId.localeCompare(bId, 'en', { numeric: true });
    });

    // Header
    let header = `📋 *MLBB: GIFT & RECHARGE RANKING*\n`;
    header += `*Waktu:* ${nowStr} WIB\n`;
    header += `*Total Akun (filtered):* ${list.length}\n`;
    header += `*Total Gift (sum):* ${totalGift}\n`;
    header += `\nUrutan: Unused terbanyak ➜ Gift quota terbesar ➜ Prioritas recharge (500+500 » 250+250 » 150+150 » 50+50).\n`;
    header += `_Catatan: akun dengan semua recharge ❌ tidak ditampilkan._\n\n`;

    // Baris (2 field: gift & recharge)
    const lines = list.map((acc, i) => {
      const statusIcon = acc.status === 'active' ? '✅' : (acc.status === 'maintenance' ? '🔧' : '❌');
      return `${i + 1}. *${acc.nickname}* (${acc.id})\n` +
             `   ${statusIcon} ${acc.gameId}\n` +
             `   🎁 ${acc.giftQuota}/1000\n` +
             `   🔄 ${acc.rechargeSymbols}\n`;
    });

    // Batching agar aman
    const MAX_PER_MSG = 50;
    const chunks = [];
    for (let i = 0; i < lines.length; i += MAX_PER_MSG) {
      chunks.push(lines.slice(i, i + MAX_PER_MSG).join('\n'));
    }

    if (chunks.length > 0) {
      await client.sendMessage(msgKey.remoteJid, { text: header + chunks[0], edit: msgKey });
      for (let i = 1; i < chunks.length; i++) {
        await client.sendMessage(msgKey.remoteJid, { text: chunks[i] });
      }
    } else {
      await client.sendMessage(msgKey.remoteJid, { text: header + '_(tidak ada data)_', edit: msgKey });
    }

  } catch (err) {
    console.error('Error mlbbgiftrecharge:', err);
    m.reply('❌ Gagal mengambil ranking gift & recharge.');
  }
  break;
}


            case 'addmlbbaccount':
        	case 'addacc' : {
  if (!isOwner) return m.reply('Hanya owner yang bisa.');
  
  // Format: addmlbbaccount [gameId] [server] [giftQuota] [diamonds] [checkRecharge]
  if (args.length < 2) {
    return m.reply('Format: addmlbbaccount [gameId] [server] [giftQuota] [diamonds] [checkRecharge]');
  }
  
  const gameId = args[0];
  const server = args[1];
  const giftQuota = parseInt(args[2] || 1000); // Default 1000
  const startingDiamonds = parseInt(args[3] || 0); // Default 0
  const checkRecharge = args[4]?.toLowerCase() === 'true'; // Default false
  
  try {
    // Kirim pesan awal
    const initialMsg = await m.reply(`🔄 Membuat akun MLBB untuk Game ID: ${gameId} (${server})...`);
    const msgKey = initialMsg.key;
    
    // Cek apakah akun dengan gameId dan server sudah ada
    const existingAccountQuery = await db.collection('mlbb_accounts')
      .where('gameId', '==', gameId)
      .where('server', '==', server)
      .get();
    
    if (!existingAccountQuery.empty) {
      await client.sendMessage(msgKey.remoteJid, {
        text: `❌ Akun dengan Game ID ${gameId} (${server}) sudah ada di database dengan ID: ${existingAccountQuery.docs[0].id}`,
        edit: msgKey
      });
      return;
    }
    
    // Validasi nickname via Codashop
    let nickname = '';
    try {
      const params = new URLSearchParams();
      params.append('country', 'SG');
      params.append('userId', gameId);
      params.append('voucherTypeName', 'MOBILE_LEGENDS');
      params.append('zoneId', server);
      const resp = await fetch('https://order-sg.codashop.com/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
        body: params
      });
      const json = await resp.json();
      if (json.success !== false && json.result?.username) {
        nickname = decodeURIComponent(json.result.username).replace(/\+/g, ' ');
      } else {
        await client.sendMessage(msgKey.remoteJid, {
          text: '❌ Gagal validasi nickname ML. Pastikan ID dan Server benar.',
          edit: msgKey
        });
        return;
      }
    } catch (err) {
      console.error('Error validasi ML:', err);
      await client.sendMessage(msgKey.remoteJid, {
        text: '❌ Terjadi kesalahan saat validasi nickname ML.',
        edit: msgKey
      });
      return;
    }
    
    // Update message
    await client.sendMessage(msgKey.remoteJid, {
      text: `✅ Nickname ditemukan: ${nickname}\n\n${checkRecharge ? '🔄 Mengecek status recharge...' : '⏭️ Melewati pengecekan recharge...'}`,
      edit: msgKey
    });
    
    // Default recharge status
    let rechargeStatus = {
      diamond50plus50: {used: false, lastUsed: null},
      diamond150plus150: {used: false, lastUsed: null},
      diamond250plus250: {used: false, lastUsed: null},
      diamond500plus500: {used: false, lastUsed: null}
    };
    
    // Check recharge if requested
    if (checkRecharge) {
      try {
        const browser = await firefox.launch({ 
          headless: true,
          timeout: 60000 // Increase main timeout to 60 seconds
        });
        
        const page = await browser.newPage({
          viewport: { width: 1280, height: 720 },
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        });
        
        try {
          // Update message
          await client.sendMessage(msgKey.remoteJid, {
            text: `✅ Nickname ditemukan: ${nickname}\n🔄 Mengecek status recharge... (1/4) Membuka halaman`,
            edit: msgKey
          });
          
          await page.goto('https://www.mobapay.com/mlbb/?r=ID', { 
            waitUntil: 'networkidle',
            timeout: 30000 
          });
          
          // Update message
          await client.sendMessage(msgKey.remoteJid, {
            text: `✅ Nickname ditemukan: ${nickname}\n🔄 Mengecek status recharge... (2/4) Mengisi ID`,
            edit: msgKey
          });
          
          // Fill game ID and server with improved error handling
          await page.waitForSelector('#userInput', { timeout: 15000 });
          await page.waitForSelector('#serverInput', { timeout: 15000 });
          
          await page.fill('#userInput', gameId);
          await page.fill('#serverInput', server);
          
          // Click outside to trigger blur
          await page.click('body', { position: { x: 10, y: 10 } });
          
          // Wait for validation to complete
          await page.waitForTimeout(2000);
          
          // Update message
          await client.sendMessage(msgKey.remoteJid, {
            text: `✅ Nickname ditemukan: ${nickname}\n🔄 Mengecek status recharge... (3/4) Mengecek item`,
            edit: msgKey
          });
          
          // Improved modal handling
          const handleModals = async () => {
            try {
              const hasModal = await page.$('.mobapay-modal-body');
              if (hasModal) {
                const closeButton = await page.$('.mobapay-modal-close');
                if (closeButton) {
                  await closeButton.click({ force: true }).catch(() => {});
                  await page.waitForTimeout(1000);
                }
              }
            } catch (e) {
              console.log('Error handling modal:', e);
            }
          };
          
          // First attempt to handle any modals
          await handleModals();
          
          // Better approach for clicking first item - find by selector and force click
          await page.waitForSelector('.tracker-recharge-item', { timeout: 15000 });
          
          // Try multiple methods to ensure the click works
          try {
            // Method 1: Direct click on first recharge item
            await page.click('.tracker-recharge-item', { 
              timeout: 5000,
              force: true 
            }).catch(() => {});
            
            // Give it a moment
            await page.waitForTimeout(2000);
            
            // Check if we need to handle modals again
            await handleModals();
            
            // Method 2: JavaScript click if regular click failed
            await page.evaluate(() => {
              const item = document.querySelector('.tracker-recharge-item');
              if (item) item.click();
            }).catch(() => {});
            
            await page.waitForTimeout(2000);
          } catch (e) {
            console.log('Click attempts failed, continuing anyway:', e);
          }
          
          // Update message
          await client.sendMessage(msgKey.remoteJid, {
            text: `✅ Nickname ditemukan: ${nickname}\n🔄 Mengecek status recharge... (4/4) Mendapatkan hasil`,
            edit: msgKey
          });
          
          // Wait for elements to load, but don't fail if they don't
          await page.waitForSelector('.mobapay-user-character-name', { timeout: 15000 })
            .catch(() => console.log('Character name element not found, continuing...'));
          
          await page.waitForSelector('.mobapay-recharge-wrapper', { timeout: 15000 })
            .catch(() => console.log('Recharge wrapper not found, continuing...'));
          
          // Get recharge status - with better error handling
          try {
            const rechargeItems = await page.$$('.tracker-recharge-item');
            const firstTopupTiers = [50, 150, 250, 500];
            
            for (const item of rechargeItems) {
              try {
                const diamondsAttr = await item.getAttribute('data-diamonds');
                const diamonds = parseInt(diamondsAttr || '0');
                
                if (firstTopupTiers.includes(diamonds)) {
                  // Check if limit reached by looking for the specific text/element
                  const limitReached = await item.evaluate(el => {
                    return el.querySelector('.mobapay-recharge-item-reachlimit') !== null ||
                           el.textContent.includes('Purchase limit reached');
                  });
                  
                  rechargeStatus[`diamond${diamonds}plus${diamonds}`].used = limitReached;
                }
              } catch (itemErr) {
                console.log(`Error processing recharge item:`, itemErr);
              }
            }
          } catch (rechargeErr) {
            console.log('Error getting recharge status:', rechargeErr);
          }
          
          // Update message with success
          await client.sendMessage(msgKey.remoteJid, {
            text: `✅ Nickname ditemukan: ${nickname}\n✅ Status recharge berhasil dicek.`,
            edit: msgKey
          });
          
        } catch (error) {
          console.error('Error checking recharge:', error);
          await client.sendMessage(msgKey.remoteJid, {
            text: `✅ Nickname ditemukan: ${nickname}\n⚠️ Gagal mengecek status recharge, menggunakan default (semua available).`,
            edit: msgKey
          });
        } finally {
          // Ensure browser closes even if there's an error
          try {
            await browser.close();
          } catch (e) {
            console.log('Error closing browser:', e);
          }
        }
      } catch (err) {
        console.error('Error launching browser:', err);
        await client.sendMessage(msgKey.remoteJid, {
          text: `✅ Nickname ditemukan: ${nickname}\n⚠️ Gagal mengecek status recharge, menggunakan default (semua available).`,
          edit: msgKey
        });
      }
    }
    
    // Generate sequential document ID
    // 1. Get highest sequential number from existing accounts
    let nextSequentialNumber = 1;
    try {
      // Find accounts with pattern like "0001_..."
      const sequentialAccounts = await db.collection('mlbb_accounts')
        .orderBy('accountId', 'desc')
        .limit(1)
        .get();
      
      if (!sequentialAccounts.empty) {
        const lastAccountId = sequentialAccounts.docs[0].id;
        // Extract the number from the ID (first 4 characters)
        const match = lastAccountId.match(/^(\d{4})_/);
        if (match && match[1]) {
          nextSequentialNumber = parseInt(match[1]) + 1;
        }
      }
    } catch (seqErr) {
      console.log('Error getting sequential number:', seqErr);
    }
    
    // 2. Format the sequential number with leading zeros
    const sequentialId = String(nextSequentialNumber).padStart(4, '0');
    
    // 3. Create sanitized nickname (remove special characters, keep alphanumeric and spaces)
    const sanitizedNickname = nickname
      .replace(/[^\w\s]/gi, '') // Remove special characters
      .replace(/\s+/g, '_')     // Replace spaces with underscores
      .toLowerCase();           // Convert to lowercase
    
    // 4. Create the document ID
    const accountId = `${sequentialId}_${sanitizedNickname}`;
    
    // Get current date in YYYY-MM-DD format
    const today = new Date().toISOString().slice(0, 10);
    const currentMonth = today.slice(0, 7); // YYYY-MM format
    
    // Transaction untuk membuat akun dan semua sub-collection-nya
    await db.runTransaction(async (transaction) => {
      // 1. Dokumen utama akun
      const accountRef = db.collection('mlbb_accounts').doc(accountId);
      
      transaction.set(accountRef, {
        accountId,
        gameId,
        server,
        nickname,
        status: 'active',
        diamonds: startingDiamonds,
        // WDP info disimpan ringkas di dokumen utama
        wdp: {
          active: false,
          endDate: null,
          dailyRemaining: 0,
          totalDays: 0
        },
        // Basic metrics
        dailyGiftUsed: 0,
        dailyGiftDate: today,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      // 2. Sub-collection untuk recharge_items
      const rechargeKeys = Object.keys(rechargeStatus);
      for (const key of rechargeKeys) {
        const rechargeRef = accountRef.collection('recharge_items').doc(key);
        transaction.set(rechargeRef, {
          type: key,
          used: rechargeStatus[key].used,
          lastUsed: null,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }
      
      // 3. Sub-collection untuk gift_quota
      const quotaRef = accountRef.collection('gift_quota').doc('current');
      transaction.set(quotaRef, {
        total: 1000,
        used: 1000 - giftQuota,
        remaining: giftQuota,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
      });
      
      // 4. Sub-collection untuk starlight_limits
      const slLimitsRef = accountRef.collection('starlight_limits').doc(currentMonth);
      transaction.set(slLimitsRef, {
        month: currentMonth,
        basicUsed: 0,
        basicRemaining: 3,
        premiumUsed: 0,
        premiumRemaining: 3,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
      });
    });
    
    // Build final message
    let finalMessage = `✅ Akun MLBB berhasil ditambahkan:\n`;
    finalMessage += `• ID: ${accountId}\n`;
    finalMessage += `• Game ID: ${gameId} (${server})\n`;
    finalMessage += `• Nickname: ${nickname}\n`;
    finalMessage += `• Diamond: ${startingDiamonds}\n`;
    finalMessage += `• Gift Quota: ${giftQuota}/1000\n`;
    finalMessage += `• Status: active\n\n`;
    
    if (checkRecharge) {
      finalMessage += `*Status Recharge:*\n`;
      Object.keys(rechargeStatus).forEach(key => {
        const tier = key.replace('diamond', '').replace('plus', '+');
        finalMessage += `• ${tier}: ${rechargeStatus[key].used ? '❌ Used' : '✅ Available'}\n`;
      });
    }
    
    // Edit final message
    await client.sendMessage(msgKey.remoteJid, {
      text: finalMessage,
      edit: msgKey
    });
    
  } catch (err) {
    console.error('Error add MLBB account:', err);
    m.reply('❌ Gagal menambahkan akun MLBB. Error: ' + err.message);
  }
  break;
}
           	case 'checkrecharge': {
  if (!isOwner) return m.reply('Hanya owner yang bisa.');
  
  // Format: checkrecharge [accountId/gameId:server]
  if (args.length < 1) {
    return m.reply('Format: checkrecharge [accountId/gameId:server]');
  }
  
  const input = args[0];
  let gameId, server, accountId;
  
  try {
    // Cek jika input berupa gameId:server
    if (input.includes(':')) {
      [gameId, server] = input.split(':');
    } else {
      // Anggap sebagai accountId
      accountId = input;
      
      // Ambil data akun
      const accountRef = db.collection('mlbb_accounts').doc(accountId);
      const accountDoc = await accountRef.get();
      
      if (!accountDoc.exists) {
        return m.reply(`Akun dengan ID ${accountId} tidak ditemukan.`);
      }
      
      const account = accountDoc.data();
      gameId = account.gameId;
      server = account.server;
    }
    
    if (!gameId || !server) {
      return m.reply('Game ID dan Server tidak ditemukan.');
    }
    
    // Kirim pesan awal
    const initialMsg = await m.reply(`🔄 Mengecek status recharge untuk Game ID: ${gameId} (${server})...`);
    const msgKey = initialMsg.key;
    
    // Proses scraping dengan pendekatan yang lebih robust
    try {
      const browser = await firefox.launch({ 
        headless: true,
        timeout: 60000
      });
      
      const page = await browser.newPage({
        viewport: { width: 1280, height: 720 },
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      });
      
      try {
        // Update message for step 1
        await client.sendMessage(msgKey.remoteJid, {
          text: `🔄 Mengecek status recharge (1/4): Membuka halaman...`,
          edit: msgKey
        });
        
        await page.goto('https://www.mobapay.com/mlbb/?r=ID', { 
          waitUntil: 'networkidle',
          timeout: 30000 
        });
        
        // Update message for step 2
        await client.sendMessage(msgKey.remoteJid, {
          text: `🔄 Mengecek status recharge (2/4): Mengisi ID...`,
          edit: msgKey
        });
        
        // Fill game ID and server with improved error handling
        await page.waitForSelector('#userInput', { timeout: 15000 });
        await page.waitForSelector('#serverInput', { timeout: 15000 });
        
        await page.fill('#userInput', gameId);
        await page.fill('#serverInput', server);
        
        // Click outside to trigger blur
        await page.click('body', { position: { x: 10, y: 10 } });
        
        // Wait for validation to complete
        await page.waitForTimeout(2000);
        
        // Update message for step 3
        await client.sendMessage(msgKey.remoteJid, {
          text: `🔄 Mengecek status recharge (3/4): Mengecek item...`,
          edit: msgKey
        });
        
        // Improved modal handling
        const handleModals = async () => {
          try {
            const hasModal = await page.$('.mobapay-modal-body');
            if (hasModal) {
              const closeButton = await page.$('.mobapay-modal-close');
              if (closeButton) {
                await closeButton.click({ force: true }).catch(() => {});
                await page.waitForTimeout(1000);
              }
            }
          } catch (e) {
            console.log('Error handling modal:', e);
          }
        };
        
        // First attempt to handle any modals
        await handleModals();
        
        // Better approach for clicking first item - find by selector and force click
        await page.waitForSelector('.tracker-recharge-item', { timeout: 15000 });
        
        // Try multiple methods to ensure the click works
        try {
          // Method 1: Direct click on first recharge item
          await page.click('.tracker-recharge-item', { 
            timeout: 5000,
            force: true 
          }).catch(() => {});
          
          // Give it a moment
          await page.waitForTimeout(2000);
          
          // Check if we need to handle modals again
          await handleModals();
          
          // Method 2: JavaScript click if regular click failed
          await page.evaluate(() => {
            const item = document.querySelector('.tracker-recharge-item');
            if (item) item.click();
          }).catch(() => {});
          
          await page.waitForTimeout(2000);
        } catch (e) {
          console.log('Click attempts failed, continuing anyway:', e);
        }
        
        // Update message for step 4
        await client.sendMessage(msgKey.remoteJid, {
          text: `🔄 Mengecek status recharge (4/4): Mendapatkan hasil...`,
          edit: msgKey
        });
        
        // Wait for elements to load, but don't fail if they don't
        await page.waitForSelector('.mobapay-user-character-name', { timeout: 15000 })
          .catch(() => console.log('Character name element not found, continuing...'));
        
        await page.waitForSelector('.mobapay-recharge-wrapper', { timeout: 15000 })
          .catch(() => console.log('Recharge wrapper not found, continuing...'));
        
        // Get nickname
        let nickname = '';
        try {
          nickname = await page.evaluate(() => {
            const nameElement = document.querySelector('.mobapay-user-character-name');
            return nameElement ? nameElement.textContent.trim() : '';
          });
        } catch (e) {
          console.log('Error getting nickname:', e);
        }
        
        // Get recharge status - with better error handling
        const rechargeStatus = {};
        const firstTopupTiers = [50, 150, 250, 500];
        
        try {
          await page.waitForTimeout(2000); // Give page time to fully load
          
          // Use evaluate to get all recharge status at once (more reliable)
          const statuses = await page.evaluate((tiers) => {
            const results = {};
            tiers.forEach(tier => {
              results[`diamond${tier}plus${tier}`] = false; // Default to false (not used)
            });
            
            // Find all recharge items
            const items = document.querySelectorAll('.tracker-recharge-item');
            items.forEach(item => {
              const diamonds = parseInt(item.getAttribute('data-diamonds') || '0');
              if (tiers.includes(diamonds)) {
                // Check if limit reached
                const isLimitReached = 
                  item.querySelector('.mobapay-recharge-item-reachlimit') !== null ||
                  item.textContent.includes('Purchase limit reached');
                results[`diamond${diamonds}plus${diamonds}`] = isLimitReached;
              }
            });
            return results;
          }, firstTopupTiers);
          
          // Merge results
          Object.assign(rechargeStatus, statuses);
        } catch (e) {
          console.log('Error evaluating recharge status:', e);
          
          // Fallback method if evaluate fails
          try {
            const rechargeItems = await page.$$('.tracker-recharge-item');
            
            for (const item of rechargeItems) {
              try {
                const diamondsAttr = await item.getAttribute('data-diamonds');
                const diamonds = parseInt(diamondsAttr || '0');
                
                if (firstTopupTiers.includes(diamonds)) {
                  // Check if limit reached by looking for the specific text/element
                  const limitReachedEl = await item.$('.mobapay-recharge-item-reachlimit');
                  rechargeStatus[`diamond${diamonds}plus${diamonds}`] = limitReachedEl !== null;
                }
              } catch (itemErr) {
                console.log(`Error processing recharge item:`, itemErr);
              }
            }
          } catch (fallbackErr) {
            console.log('Error in fallback recharge status check:', fallbackErr);
          }
        }
        
        // Prepare result message
        let resultMessage = `✅ *Status Recharge MLBB*\n\n`;
        resultMessage += `*Nickname:* ${nickname || 'Tidak terdeteksi'}\n`;
        resultMessage += `*Game ID:* ${gameId} (${server})\n\n`;
        resultMessage += `*Status Recharge:*\n`;
        
        // Add recharge status to message
        firstTopupTiers.forEach(tier => {
          const key = `diamond${tier}plus${tier}`;
          const status = rechargeStatus[key] === true; // Ensure boolean
          resultMessage += `• ${tier}+${tier}: ${status ? '❌ Used' : '✅ Available'}\n`;
        });
        
        // Update account if found
        if (accountId) {
          const accountRef = db.collection('mlbb_accounts').doc(accountId);
          
          // Batched update untuk efisiensi
          const batch = db.batch();
          
          // Update main document
          batch.update(accountRef, {
            'updatedAt': admin.firestore.FieldValue.serverTimestamp()
          });
          
          // Update nickname if it was detected and different
          if (nickname && nickname !== 'Tidak terdeteksi') {
            const accountDoc = await accountRef.get();
            if (accountDoc.exists) {
              const account = accountDoc.data();
              if (!account.nickname || account.nickname !== nickname) {
                batch.update(accountRef, { nickname });
              }
            }
          }
          
          // Update each recharge item in sub-collection
          for (const tier of firstTopupTiers) {
            const key = `diamond${tier}plus${tier}`;
            if (rechargeStatus[key] !== undefined) {
              const rechargeRef = accountRef.collection('recharge_items').doc(key);
              batch.set(rechargeRef, {
                type: key,
                used: rechargeStatus[key] === true,
                lastUsed: rechargeStatus[key] === true ? admin.firestore.FieldValue.serverTimestamp() : null,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
              }, { merge: true });
            }
          }
          
          // Execute batch
          await batch.commit();
          
          resultMessage += `\n✅ Status recharge telah diperbarui di database untuk akun ${accountId}.`;
        } else {
          resultMessage += `\n⚠️ Akun dengan Game ID ${gameId} (${server}) tidak ditemukan di database.`;
          resultMessage += `\nGunakan command 'addmlbbaccount ${gameId} ${server}' untuk menambahkannya.`;
        }
        
        // Edit message with result
        await client.sendMessage(msgKey.remoteJid, {
          text: resultMessage,
          edit: msgKey
        });
        
      } catch (error) {
        console.error('Error checkrecharge:', error);
        
        // Edit message with error, but don't show the full stack trace
        await client.sendMessage(msgKey.remoteJid, {
          text: `❌ Gagal mengecek status recharge. Silakan coba lagi nanti.`,
          edit: msgKey
        });
      } finally {
        // Ensure browser closes even if there's an error
        try {
          await browser.close();
        } catch (e) {
          console.log('Error closing browser:', e);
        }
      }
      
    } catch (browserErr) {
      console.error('Error launching browser:', browserErr);
      
      await client.sendMessage(msgKey.remoteJid, {
        text: `❌ Gagal mengecek status recharge: Tidak dapat menjalankan browser. Silakan coba lagi nanti.`,
        edit: msgKey
      });
    }
    
  } catch (err) {
    console.error('Error checkrecharge:', err);
    m.reply('❌ Gagal mengecek status recharge.');
  }
  break;
}
      		case 'setaccparam':
      		case 'setaccountparam': {
  if (!isOwner) return m.reply('Hanya owner yang bisa.');
  
  // Format: setaccountparam [accountId] [param] [value]
  if (args.length < 3) {
    return m.reply(`Format: setaccountparam [accountId] [param] [value]
    
Parameter yang tersedia:
• status - active, inactive, maintenance
• diamonds - jumlah diamond
• giftquota - sisa gift quota
• slbasic - jumlah SL Basic yang tersisa (0-3)
• slpremium - jumlah SL Premium yang tersisa (0-3)
• recharge50 - true/false (reset recharge 50+50)
• recharge150 - true/false (reset recharge 150+150)
• recharge250 - true/false (reset recharge 250+250)
• recharge500 - true/false (reset recharge 500+500)
• dailygift - jumlah gift yang sudah terpakai hari ini (0-3)
• resetrecharge - true (reset semua status recharge via scraping)
`);
  }
  
  const accountId = args[0];
  const param = args[1].toLowerCase();
  const value = args[2];
  
  try {
    const accountRef = db.collection('mlbb_accounts').doc(accountId);
    const accountDoc = await accountRef.get();
    
    if (!accountDoc.exists) {
      return m.reply(`Akun dengan ID ${accountId} tidak ditemukan.`);
    }
    
    const account = accountDoc.data();
    
    // Handle resetrecharge special case
    if (param === 'resetrecharge') {
      if (value !== 'true') {
        return m.reply('Nilai untuk resetrecharge harus "true"');
      }
      
      // Redirect to checkrecharge command
      m.reply(`⏳ Menjalankan checkrecharge untuk akun ${accountId}...`);
      
      // Execute checkrecharge command logic
      await client.sendMessage(m.chat, { text: `.checkrecharge ${accountId}` }, { quoted: m });
      return;
    }
    
    // Prepare batch update
    const batch = db.batch();
    
    // Process berdasarkan parameter
    switch (param) {
      case 'status':
        if (!['active', 'inactive', 'maintenance'].includes(value)) {
          return m.reply('Status harus: active, inactive, atau maintenance');
        }
        
        batch.update(accountRef, {
          status: value,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        break;
        
      case 'diamonds':
        const diamonds = parseInt(value);
        if (isNaN(diamonds) || diamonds < 0) {
          return m.reply('Jumlah diamond harus angka positif');
        }
        
        batch.update(accountRef, {
          diamonds: diamonds,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        break;
        
      case 'giftquota':
        const giftQuota = parseInt(value);
        if (isNaN(giftQuota) || giftQuota < 0 || giftQuota > 1000) {
          return m.reply('Gift quota harus angka 0-1000');
        }
        
        // Update gift_quota sub-collection
        const quotaRef = accountRef.collection('gift_quota').doc('current');
        batch.set(quotaRef, {
          total: 1000,
          used: 1000 - giftQuota,
          remaining: giftQuota,
          lastUpdated: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        
        // Update main document's lastUpdated
        batch.update(accountRef, {
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        break;
        
      case 'slbasic':
        const slBasic = parseInt(value);
        if (isNaN(slBasic) || slBasic < 0 || slBasic > 3) {
          return m.reply('SL Basic remaining harus angka 0-3');
        }
        
        // Get current month
        const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
        
        // Update starlight_limits sub-collection
        const slLimitsRef = accountRef.collection('starlight_limits').doc(currentMonth);
        
        batch.set(slLimitsRef, {
          month: currentMonth,
          basicRemaining: slBasic,
          basicUsed: 3 - slBasic,
          lastUpdated: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        
        // Update main document's lastUpdated
        batch.update(accountRef, {
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        break;
        
      case 'slpremium':
        const slPremium = parseInt(value);
        if (isNaN(slPremium) || slPremium < 0 || slPremium > 3) {
          return m.reply('SL Premium remaining harus angka 0-3');
        }
        
        // Get current month
        const currentMonthPremium = new Date().toISOString().slice(0, 7); // YYYY-MM
        
        // Update starlight_limits sub-collection
        const slLimitsPremiumRef = accountRef.collection('starlight_limits').doc(currentMonthPremium);
        
        batch.set(slLimitsPremiumRef, {
          month: currentMonthPremium,
          premiumRemaining: slPremium,
          premiumUsed: 3 - slPremium,
          lastUpdated: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        
        // Update main document's lastUpdated
        batch.update(accountRef, {
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        break;
        
      case 'recharge50':
      case 'recharge150':
      case 'recharge250':
      case 'recharge500':
        if (value !== 'true' && value !== 'false') {
          return m.reply('Nilai harus true atau false');
        }
        
        // Extract tier from param
        const tier = param.replace('recharge', '');
        const docId = `diamond${tier}plus${tier}`;
        
        // Update recharge_items sub-collection
        const rechargeRef = accountRef.collection('recharge_items').doc(docId);
        
        batch.set(rechargeRef, {
          type: docId,
          used: value === 'false', // true = reset to used, false = reset to available
          lastUsed: value === 'false' ? null : admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        
        // Update main document's lastUpdated
        batch.update(accountRef, {
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        break;
        
      case 'dailygift':
        const dailyGift = parseInt(value);
        if (isNaN(dailyGift) || dailyGift < 0 || dailyGift > 3) {
          return m.reply('Daily gift used harus angka 0-3');
        }
        
        batch.update(accountRef, {
          dailyGiftUsed: dailyGift,
          dailyGiftDate: new Date().toISOString().slice(0, 10),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        break;
        
      default:
        return m.reply(`Parameter tidak dikenal: ${param}`);
    }
    
    // Commit batch update
    await batch.commit();
    
    m.reply(`✅ Parameter ${param} untuk akun ${accountId} berhasil diupdate ke: ${value}`);
  } catch (err) {
    console.error('Error setaccountparam:', err);
    m.reply('❌ Gagal mengupdate parameter akun. Error: ' + err.message);
  }
  break;
}
			case 'rechargewdp': {
  if (!isOwner) return m.reply('Hanya owner yang bisa.');
  
  // Format: rechargewdp [accountId] [cost] [days]
  if (args.length < 2) {
    return m.reply('Format: rechargewdp [accountId] [cost] [days]');
  }
  
  const accountId = args[0];
  const cost = parseInt(args[1]);
  const days = parseInt(args[2] || 7); // Default 7 hari (1 WDP)
  
  if (isNaN(cost) || cost <= 0) {
    return m.reply('Harga WDP harus berupa angka positif.');
  }
  
  if (isNaN(days) || days <= 0 || days > 70) {
    return m.reply('Jumlah hari harus antara 1-70.');
  }
  
  try {
    const accountRef = db.collection('mlbb_accounts').doc(accountId);
    const accountDoc = await accountRef.get();
    
    if (!accountDoc.exists) {
      return m.reply(`Akun dengan ID ${accountId} tidak ditemukan.`);
    }
    
    const account = accountDoc.data();
    
    // Cek apakah sudah mencapai 70 hari
    const currentTotalDays = account.wdp?.totalDays || 0;
    if (currentTotalDays + days > 70) {
      return m.reply(`⚠️ Total hari WDP tidak bisa melebihi 70 hari. Saat ini: ${currentTotalDays} hari, ditambah: ${days} hari.`);
    }
    
    // Gunakan moment.js untuk timezone Asia/Jakarta
    const jakartaTime = moment().tz('Asia/Jakarta');
    
    // Setup endDate
    let endDate;
    let startFromToday = true;
    
    // Jika WDP sudah aktif, periksa endDate yang ada
    let wdpActive = account.wdp?.active || false;
    let existingEndDate = null;
    
    if (wdpActive && account.wdp.endDate) {
      // Ambil existing endDate dan konversi ke moment
      const endDateUTC = account.wdp.endDate.toDate?.() || new Date(account.wdp.endDate);
      existingEndDate = moment(endDateUTC).tz('Asia/Jakarta');
      
      // Jika existing endDate masih di masa depan, extend dari sana
      if (existingEndDate.isAfter(jakartaTime)) {
        endDate = moment(existingEndDate);
        startFromToday = false;
      } else {
        // WDP sudah berakhir, mulai dari hari ini
        endDate = moment(jakartaTime);
      }
    } else {
      // WDP baru, mulai dari hari ini
      endDate = moment(jakartaTime);
    }
    
    // PERBAIKAN: Hitung tanggal berakhir dengan benar
    if (startFromToday) {
      // Jika WDP baru atau yang sudah berakhir
      const isPastReset = jakartaTime.hour() >= 15;
      
      if (isPastReset) {
        // Jika sekarang setelah jam 15:00, mulai dari besok jam 15:00
        endDate = moment(jakartaTime).add(1, 'days').set({hour: 15, minute: 0, second: 0, millisecond: 0});
        endDate.add(days - 1, 'days'); // Tambah days-1 hari
      } else {
        // Jika sekarang sebelum jam 15:00, mulai dari hari ini jam 15:00
        endDate = moment(jakartaTime).set({hour: 15, minute: 0, second: 0, millisecond: 0});
        endDate.add(days - 1, 'days'); // Tambah days-1 hari
      }
    } else {
      // Untuk extend WDP yang masih aktif
      endDate.add(days, 'days');
      // Pastikan tetap pada jam 15:00
      endDate.set({hour: 15, minute: 0, second: 0, millisecond: 0});
    }
    
    // Convert endDate to UTC for storage
    const endDateUTC = new Date(endDate.clone().utc().format());
    
    // Calculate daily remaining
    let dailyRemaining = days;
    
    // Jika sudah ada WDP aktif, tambahkan ke dailyRemaining yang ada
    if (wdpActive && account.wdp.dailyRemaining > 0) {
      dailyRemaining += account.wdp.dailyRemaining;
    }
    
    // Hitung selisih waktu dalam format hari dan jam
    const duration = moment.duration(endDate.diff(jakartaTime));
    const diffDays = Math.floor(duration.asDays());
    const diffHours = Math.floor(duration.asHours()) % 24;
    const diffMinutes = Math.floor(duration.asMinutes()) % 60;
    
    // Update akun
    const updates = {
      'wdp.active': true,
      'wdp.endDate': admin.firestore.Timestamp.fromDate(endDateUTC),
      'wdp.dailyRemaining': dailyRemaining,
      'wdp.costRupiah': cost, // Simpan cost terakhir
      'wdp.totalDays': currentTotalDays + days,
      'diamonds': admin.firestore.FieldValue.increment(Math.floor(days / 7) * 80), // 80 per 7 hari
      'status': 'active', // Aktifkan akun
      'updatedAt': admin.firestore.FieldValue.serverTimestamp()
    };
    
    // Jika ini adalah WDP baru (bukan extend), set startDate
    if (!wdpActive) {
      updates['wdp.startDate'] = admin.firestore.FieldValue.serverTimestamp();
    }
    
    await accountRef.update(updates);
    
    const immediateBonus = Math.floor(days / 7) * 80;
    
    m.reply(`✅ WDP berhasil ${wdpActive ? 'diperpanjang' : 'diaktifkan'} untuk akun ${accountId}:
• Harga: Rp${cost.toLocaleString()}
• Jumlah hari: ${days} hari
• Diamond ditambahkan: ${immediateBonus} (langsung)
• Diamond upcoming: ${dailyRemaining * 20} (20/hari × ${dailyRemaining} hari)
• Sisa waktu: ${diffDays} hari ${diffHours} jam ${diffMinutes} menit lagi
• Tanggal selesai: ${endDate.format('D MMMM YYYY pukul HH.mm')} WIB
• Total hari WDP: ${currentTotalDays + days}/70
• Status akun diubah menjadi 'active'`);
  } catch (err) {
    console.error('Error rechargewdp:', err);
    m.reply('❌ Gagal mengaktifkan WDP.');
  }
  break;
}
			case 'claimwdp': {
  if (!isOwner) return m.reply('Hanya owner yang bisa.');
  
  if (args.length < 1) {
    return m.reply('Format: claimwdp [accountId/all]');
  }
  
  const target = args[0].toLowerCase();
  
  try {
    // Gunakan moment.js untuk timezone Asia/Jakarta
    const jakartaTime = moment().tz('Asia/Jakarta');
    const today = jakartaTime.format('YYYY-MM-DD');
    
    // Cek apakah sekarang sudah lewat jam 15:00 WIB
    const isPastReset = jakartaTime.hour() >= 15;
    
    // Hitung waktu reset berikutnya (15:00 WIB)
    const nextReset = moment(jakartaTime).set({hour: 15, minute: 0, second: 0, millisecond: 0});
    if (isPastReset) {
      nextReset.add(1, 'days');
    }
    
    // Calculate time until next reset
    const duration = moment.duration(nextReset.diff(jakartaTime));
    const hoursToReset = Math.floor(duration.asHours());
    const minutesToReset = Math.floor(duration.asMinutes()) % 60;
    
    if (target === 'all') {
      // Klaim untuk semua akun dengan WDP aktif
      const accounts = await db.collection('mlbb_accounts')
        .where('wdp.active', '==', true)
        .get();
      
      if (accounts.empty) {
        return m.reply('Tidak ada akun dengan WDP aktif.');
      }
      
      let claimedCount = 0;
      let skipCount = 0;
      let expiredCount = 0;
      const batch = db.batch();
      
      for (const doc of accounts.docs) {
        const account = doc.data();
        
        // Convert endDate to Jakarta time
        let endDate = null;
        if (account.wdp.endDate) {
          const endDateUTC = account.wdp.endDate.toDate?.() || new Date(account.wdp.endDate);
          endDate = moment(endDateUTC).tz('Asia/Jakarta');
        }
        
        // Skip jika WDP sudah berakhir
        if (!endDate || endDate.isBefore(jakartaTime)) {
          expiredCount++;
          // Nonaktifkan WDP
          batch.update(doc.ref, {
            'wdp.active': false,
            'updatedAt': admin.firestore.FieldValue.serverTimestamp()
          });
          continue;
        }
        
        // Skip jika sudah klaim hari ini (reset jam 15:00 WIB)
        let lastClaim = null;
        if (account.wdp.lastClaim) {
          const lastClaimUTC = account.wdp.lastClaim.toDate?.() || new Date(account.wdp.lastClaim);
          lastClaim = moment(lastClaimUTC).tz('Asia/Jakarta');
        }
        
        // Cek jika lastClaim adalah hari ini
        const isToday = lastClaim && lastClaim.format('YYYY-MM-DD') === today;
        
        // Cek apakah lastClaim terjadi sebelum atau setelah reset
        const isLastClaimBeforeReset = lastClaim && lastClaim.hour() < 15;
        
        // Kondisi boleh klaim:
        // 1. Belum pernah klaim (lastClaim null)
        // 2. Klaim terakhir bukan hari ini
        // 3. Hari ini setelah jam 15:00 WIB DAN klaim terakhir sebelum jam 15:00 WIB
        const canClaim = !lastClaim || 
                        !isToday || 
                        (isToday && isPastReset && isLastClaimBeforeReset);
        
        if (!canClaim) {
          skipCount++;
          continue;
        }
        
        // Skip jika sudah klaim semua hari
        if (account.wdp.dailyRemaining <= 0) {
          skipCount++;
          continue;
        }
        
        // Lakukan klaim - simpan dalam UTC
        batch.update(doc.ref, {
          'diamonds': admin.firestore.FieldValue.increment(20),
          'wdp.lastClaim': admin.firestore.FieldValue.serverTimestamp(),
          'wdp.dailyRemaining': admin.firestore.FieldValue.increment(-1),
          'updatedAt': admin.firestore.FieldValue.serverTimestamp()
        });
        
        claimedCount++;
      }
      
      await batch.commit();
      
      m.reply(`✅ Claim WDP selesai:
• Berhasil diklaim: ${claimedCount} akun (+20 diamond)
• Dilewati (sudah klaim/habis): ${skipCount} akun
• WDP expired: ${expiredCount} akun
• Reset berikutnya: ${nextReset.format('D MMMM YYYY pukul HH.mm')} WIB (${hoursToReset} jam ${minutesToReset} menit lagi)`);
    } else {
      // Klaim untuk akun spesifik
      const accountId = target;
      const accountRef = db.collection('mlbb_accounts').doc(accountId);
      const accountDoc = await accountRef.get();
      
      if (!accountDoc.exists) {
        return m.reply(`Akun dengan ID ${accountId} tidak ditemukan.`);
      }
      
      const account = accountDoc.data();
      
      // Cek WDP aktif
      if (!account.wdp?.active) {
        return m.reply(`Akun ${accountId} tidak memiliki WDP aktif.`);
      }
      
      // Convert endDate to Jakarta time
      let endDate = null;
      if (account.wdp.endDate) {
        const endDateUTC = account.wdp.endDate.toDate?.() || new Date(account.wdp.endDate);
        endDate = moment(endDateUTC).tz('Asia/Jakarta');
      }
      
      // Cek WDP expired
      if (!endDate || endDate.isBefore(jakartaTime)) {
        await accountRef.update({
          'wdp.active': false,
          'updatedAt': admin.firestore.FieldValue.serverTimestamp()
        });
        return m.reply(`❌ WDP untuk akun ${accountId} sudah berakhir pada ${endDate ? endDate.format('D MMMM YYYY pukul HH.mm') : 'unknown'} WIB.`);
      }
      
      // Hitung sisa waktu WDP
      const durationLeft = moment.duration(endDate.diff(jakartaTime));
      const daysLeft = Math.floor(durationLeft.asDays());
      const hoursLeft = Math.floor(durationLeft.asHours()) % 24;
      const minutesLeft = Math.floor(durationLeft.asMinutes()) % 60;
      
      // Cek sudah klaim hari ini (reset jam 15:00 WIB)
      let lastClaim = null;
      if (account.wdp.lastClaim) {
        const lastClaimUTC = account.wdp.lastClaim.toDate?.() || new Date(account.wdp.lastClaim);
        lastClaim = moment(lastClaimUTC).tz('Asia/Jakarta');
      }
      
      // Cek jika lastClaim adalah hari ini
      const isToday = lastClaim && lastClaim.format('YYYY-MM-DD') === today;
      
      // Cek apakah lastClaim terjadi sebelum atau setelah reset
      const isLastClaimBeforeReset = lastClaim && lastClaim.hour() < 15;
      
      // Kondisi boleh klaim:
      // 1. Belum pernah klaim (lastClaim null)
      // 2. Klaim terakhir bukan hari ini
      // 3. Hari ini setelah jam 15:00 WIB DAN klaim terakhir sebelum jam 15:00 WIB
      const canClaim = !lastClaim || 
                      !isToday || 
                      (isToday && isPastReset && isLastClaimBeforeReset);
      
      if (!canClaim) {
        return m.reply(`❌ Akun ${accountId} sudah klaim WDP hari ini.
• Klaim terakhir: ${lastClaim ? lastClaim.format('D MMMM YYYY pukul HH.mm') : 'Tidak ada'} WIB
• Reset berikutnya: ${nextReset.format('D MMMM YYYY pukul HH.mm')} WIB (${hoursToReset} jam ${minutesToReset} menit lagi)`);
      }
      
      // Cek sisa hari
      if (account.wdp.dailyRemaining <= 0) {
        return m.reply(`❌ Akun ${accountId} sudah mengklaim semua hari WDP.
• WDP berakhir pada: ${endDate.format('D MMMM YYYY pukul HH.mm')} WIB
• Sisa waktu: ${daysLeft} hari ${hoursLeft} jam ${minutesLeft} menit lagi`);
      }
      
      // Lakukan klaim - simpan dalam UTC
      await accountRef.update({
        'diamonds': admin.firestore.FieldValue.increment(20),
        'wdp.lastClaim': admin.firestore.FieldValue.serverTimestamp(),
        'wdp.dailyRemaining': admin.firestore.FieldValue.increment(-1),
        'updatedAt': admin.firestore.FieldValue.serverTimestamp()
      });
      
      // Catat klaim WDP dalam sub-collection wdp_history
      const wdpHistoryRef = accountRef.collection('wdp_history').doc();
      await wdpHistoryRef.set({
        type: 'daily_claim',
        amount: 20,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        remainingDays: account.wdp.dailyRemaining - 1
      });
      
      m.reply(`✅ Claim WDP berhasil untuk akun ${accountId}:
• +20 diamond ditambahkan
• Sisa hari: ${account.wdp.dailyRemaining - 1}
• WDP berakhir pada: ${endDate.format('D MMMM YYYY pukul HH.mm')} WIB
• Sisa waktu WDP: ${daysLeft} hari ${hoursLeft} jam ${minutesLeft} menit
• Reset klaim berikutnya: ${nextReset.format('D MMMM YYYY pukul HH.mm')} WIB (${hoursToReset} jam ${minutesToReset} menit lagi)`);
    }
  } catch (err) {
    console.error('Error claimwdp:', err);
    m.reply('❌ Gagal melakukan claim WDP. Error: ' + err.message);
  }
  break;
}
        	case 'accstats' :
			case 'mlbbstatus': {
  if (!isOwner) return m.reply('Hanya owner yang bisa.');
  
  try {
    // Default filter adalah 'all', bisa diganti dengan 'active', 'inactive', 'wdp', etc.
    const filter = args[0]?.toLowerCase() || 'all';
    
    // Kirim pesan awal
    const initialMsg = await m.reply(`🔍 Mencari akun MLBB dengan filter: ${filter}...`);
    const msgKey = initialMsg.key;
    
    // Buat query base
    let query = db.collection('mlbb_accounts');
    
    // Apply filter ke query
    if (filter === 'active') {
      query = query.where('status', '==', 'active');
    } else if (filter === 'inactive') {
      query = query.where('status', '==', 'inactive');
    } else if (filter === 'wdp') {
      query = query.where('wdp.active', '==', true);
    } else if (filter === 'maintenance') {
      query = query.where('status', '==', 'maintenance');
    }
    
    const accounts = await query.get();
    
    if (accounts.empty) {
      await client.sendMessage(msgKey.remoteJid, {
        text: `Tidak ada akun MLBB${filter !== 'all' ? ` dengan filter '${filter}'` : ''}.`,
        edit: msgKey
      });
      return;
    }
    
    let result = `📱 *MLBB ACCOUNTS STATUS*\n`;
    result += `📊 Filter: ${filter.toUpperCase()}\n\n`;
    
    // Summary stats
    let activeCount = 0;
    let inactiveCount = 0;
    let maintenanceCount = 0;
    let wdpActiveCount = 0;
    let wdpClaimableCount = 0; // Bisa klaim hari ini
    let lowDiamondCount = 0; // < 100 diamonds
    let totalDiamonds = 0;
    let giftAvailCount = 0;
    let slBasicAvailCount = 0;
    let slPremiumAvailCount = 0;
    
    // Gunakan moment.js untuk timezone Asia/Jakarta
    const jakartaTime = moment().tz('Asia/Jakarta');
    const today = jakartaTime.format('YYYY-MM-DD');
    const currentMonth = jakartaTime.format('YYYY-MM');
    
    // Calculate next reset time (15:00 WIB)
    const nextReset = moment(jakartaTime).set({hour: 15, minute: 0, second: 0, millisecond: 0});
    
    // If it's already past 15:00, set reset time to tomorrow
    if (jakartaTime.hour() >= 15) {
      nextReset.add(1, 'days');
    }
    
    // Calculate time until next reset
    const duration = moment.duration(nextReset.diff(jakartaTime));
    const resetHours = Math.floor(duration.asHours());
    const resetMinutes = Math.floor(duration.asMinutes()) % 60;
    const resetCountdown = `${resetHours}h ${resetMinutes}m`;
    
    // Process all accounts
    const accountsList = [];
    
    // Untuk setiap akun, ambil data dari sub-collections yang dibutuhkan
    for (const doc of accounts.docs) {
      const account = doc.data();
      
      // Cek status
      if (account.status === 'active') activeCount++;
      else if (account.status === 'inactive') inactiveCount++;
      else if (account.status === 'maintenance') maintenanceCount++;
      
      // Cek WDP
      let wdpExpiryDays = null;
      let wdpExpiryHours = null;
      let wdpExpiryFormatted = null;
      let canClaimToday = false;
      
      if (account.wdp?.active) {
        wdpActiveCount++;
        
        // Calculate time until WDP expires
        if (account.wdp.endDate) {
          // Convert UTC to Jakarta time
          const endDateUTC = account.wdp.endDate.toDate?.() || new Date(account.wdp.endDate);
          const endDateJakarta = moment(endDateUTC).tz('Asia/Jakarta');
          
          // Calculate time until WDP expires using Jakarta time
          const durationLeft = moment.duration(endDateJakarta.diff(jakartaTime));
          
          if (durationLeft.asMilliseconds() > 0) {
            const diffDays = Math.floor(durationLeft.asDays());
            const diffHours = Math.floor(durationLeft.asHours()) % 24;
            
            wdpExpiryDays = diffDays;
            wdpExpiryHours = Math.floor(durationLeft.asHours());
            wdpExpiryFormatted = `${diffDays}d ${diffHours}h`;
          }
        }
        
        // Check if can claim today (reset at 15:00 WIB)
        if (account.wdp.lastClaim && account.wdp.dailyRemaining > 0) {
          // Convert UTC to Jakarta time
          const lastClaimUTC = account.wdp.lastClaim.toDate?.() || new Date(account.wdp.lastClaim);
          const lastClaimJakarta = moment(lastClaimUTC).tz('Asia/Jakarta');
          
          // Cek jika lastClaim adalah hari ini
          const isToday = lastClaimJakarta.format('YYYY-MM-DD') === today;
          
          // Cek apakah sekarang sudah lewat jam 15:00 WIB
          const isPastReset = jakartaTime.hour() >= 15;
          
          // Cek apakah lastClaim terjadi sebelum jam 15:00 WIB
          const isLastClaimBeforeReset = lastClaimJakarta.hour() < 15;
          
          // Kondisi boleh klaim:
          canClaimToday = !isToday || (isToday && isPastReset && isLastClaimBeforeReset);
          
          if (canClaimToday) wdpClaimableCount++;
        } else if (!account.wdp.lastClaim && account.wdp.dailyRemaining > 0) {
          // If never claimed and has days remaining, can claim today
          canClaimToday = true;
          wdpClaimableCount++;
        }
      }
      
      // Cek diamond
      if (account.diamonds < 100) lowDiamondCount++;
      totalDiamonds += account.diamonds || 0;
      
      // Ambil data gift quota
      let giftQuota = 0;
      try {
        const quotaDoc = await doc.ref.collection('gift_quota').doc('current').get();
        if (quotaDoc.exists) {
          giftQuota = quotaDoc.data().remaining || 0;
          if (giftQuota > 0) giftAvailCount++;
        }
      } catch (e) {
        console.log(`Error getting gift quota for ${account.accountId}:`, e);
      }
      
      // Ambil data SL limits untuk bulan ini
      let slBasic = 0, slPremium = 0;
      try {
        const slDoc = await doc.ref.collection('starlight_limits').doc(currentMonth).get();
        if (slDoc.exists) {
          // Use basicCount/premiumCount, not basicRemaining/premiumRemaining
          slBasic = 3 - (slDoc.data().basicCount || 0);
          slPremium = 3 - (slDoc.data().premiumCount || 0);
          
          if (slBasic > 0) slBasicAvailCount++;
          if (slPremium > 0) slPremiumAvailCount++;
        } else {
          // If no document exists, all SL slots are available
          slBasic = 3;
          slPremium = 3;
          slBasicAvailCount++;
          slPremiumAvailCount++;
        }
      } catch (e) {
        console.log(`Error getting SL limits for ${account.accountId}:`, e);
      }
      
      // Check recharge status
      let rechargeStatus = {};
      try {
        const rechargeQuery = await doc.ref.collection('recharge_items').get();
        if (!rechargeQuery.empty) {
          rechargeQuery.forEach(rdoc => {
            const data = rdoc.data();
            rechargeStatus[rdoc.id] = data.used || false;
          });
        }
      } catch (e) {
        console.log(`Error getting recharge status for ${account.accountId}:`, e);
      }
      
      // Filter khusus setelah mendapatkan semua data
      if (filter === 'lowdiamond' && account.diamonds >= 100) {
        continue; // Skip jika filter lowdiamond dan diamond cukup
      } else if (filter === 'giftavail' && giftQuota <= 0) {
        continue; // Skip jika filter giftavail dan gift quota kosong
      } else if (filter === 'slbasic' && slBasic <= 0) {
        continue; // Skip jika filter slbasic dan SL Basic tidak tersedia
      } else if (filter === 'slpremium' && slPremium <= 0) {
        continue; // Skip jika filter slpremium dan SL Premium tidak tersedia
      } else if (filter === 'claimable' && !canClaimToday) {
        continue; // Skip jika filter claimable dan tidak bisa klaim hari ini
      }
      
      // Tambahkan ke list
      accountsList.push({
        id: account.accountId,
        gameId: `${account.gameId || '?'}:${account.server || '?'}`,
        nickname: account.nickname || 'Unknown',
        status: account.status,
        diamonds: account.diamonds || 0,
        giftQuota: giftQuota,
        wdpActive: account.wdp?.active || false,
        wdpDailyRemaining: account.wdp?.dailyRemaining || 0,
        wdpExpiryDays: wdpExpiryDays,
        wdpExpiryHours: wdpExpiryHours,
        wdpExpiryFormatted: wdpExpiryFormatted,
        canClaimToday: canClaimToday,
        dailyGift: account.dailyGiftUsed || 0,
        slBasic: slBasic,
        slPremium: slPremium,
        rechargeStatus: rechargeStatus
      });
    }
    
    // Sort berdasarkan filter yang dipilih
    if (filter === 'wdp') {
      // Sort by WDP expiry (soonest first)
      accountsList.sort((a, b) => {
        if (a.wdpExpiryHours === null) return 1;
        if (b.wdpExpiryHours === null) return -1;
        return a.wdpExpiryHours - b.wdpExpiryHours;
      });
    } else if (filter === 'lowdiamond') {
      // Sort by diamond (lowest first)
      accountsList.sort((a, b) => a.diamonds - b.diamonds);
    } else if (filter === 'claimable') {
      // Sort by claimable status first, then by daily remaining
      accountsList.sort((a, b) => {
        if (a.canClaimToday !== b.canClaimToday) {
          return b.canClaimToday ? 1 : -1;
        }
        return b.wdpDailyRemaining - a.wdpDailyRemaining;
      });
    } else {
      // Default sort by diamond (highest first)
      accountsList.sort((a, b) => {
  // Pastikan accountId ada dan 4 digit
  const aId = String(a.id || '').padStart(4, '0');
  const bId = String(b.id || '').padStart(4, '0');
  return aId.localeCompare(bId, 'en', { numeric: true });
});
    }
    
    // Format Jakarta time with moment.js
    const jakartaTimeStr = jakartaTime.format('DD/MM/YYYY, HH.mm');
    
    result += `*Waktu:* ${jakartaTimeStr} WIB\n`;
    result += `*Total Accounts:* ${accountsList.length} dari ${accounts.size}\n`;
    result += `*Status:* ✅ ${activeCount} | ❌ ${inactiveCount} | 🔧 ${maintenanceCount}\n`;
    result += `*WDP Active:* ${wdpActiveCount} (${wdpClaimableCount} claimable)\n`;
    result += `*Resources:*\n`;
    result += `• 💎 Diamonds: ${totalDiamonds} (${lowDiamondCount} low)\n`;
    result += `• 🎁 Gift Available: ${giftAvailCount}\n`;
    result += `• ⭐ SL Basic: ${slBasicAvailCount} | SL Premium: ${slPremiumAvailCount}\n`;
    result += `*Next Reset:* ${resetHours}h ${resetMinutes}m (15:00 WIB)\n\n`;
    
    // Add account details (limit to 15 accounts to avoid message too long)
    const displayLimit = 15;
    const displayList = accountsList.slice(0, displayLimit);
    
    displayList.forEach((acc, idx) => {
      result += `${idx+1}. *${acc.nickname}* (${acc.id})\n`;
      result += `   ${acc.status === 'active' ? '✅' : (acc.status === 'maintenance' ? '🔧' : '❌')} ${acc.gameId}\n`;
      result += `   💎: ${acc.diamonds} | 🎁: ${acc.giftQuota}/1000\n`;
      result += `   ⭐ SL: Basic ${acc.slBasic}/3 | Premium ${acc.slPremium}/3\n`;
      
      if (acc.wdpActive) {
        result += `   📅 WDP: ${acc.wdpDailyRemaining} hari sisa`;
        
        if (acc.canClaimToday) {
          result += ` (✅ bisa klaim)\n`;
        } else {
          result += ` (❌ tunggu reset)\n`;
        }
        
        if (acc.wdpExpiryFormatted) {
          result += `   ⏱️ Expired: ${acc.wdpExpiryFormatted} lagi\n`;
        }
      }
      
      // Add recharge status info for relevant filters
      if (filter === 'all' || filter === 'active') {
        const rechargeItems = ['50+50', '150+150', '250+250', '500+500'];
        const rechargeSymbols = [];
        
        rechargeItems.forEach((item, i) => {
          const key = `diamond${item.split('+')[0]}plus${item.split('+')[1]}`;
          if (acc.rechargeStatus[key]) {
            rechargeSymbols.push('❌');
          } else {
            rechargeSymbols.push('✅');
          }
        });
        
        result += `   🔄 Recharge: ${rechargeSymbols.join(' ')}\n`;
      }
      
      result += '\n';
    });
    
    if (accountsList.length > displayLimit) {
      result += `\n...dan ${accountsList.length - displayLimit} akun lainnya.\n`;
      result += `Gunakan 'detailmlbb [accountId]' untuk melihat detail akun tertentu.`;
    }
    
    // Edit message with result
    await client.sendMessage(msgKey.remoteJid, {
      text: result,
      edit: msgKey
    });
    
  } catch (err) {
    console.error('Error mlbbstatus:', err);
    m.reply('❌ Gagal mengambil status akun MLBB.');
  }
  break;
}
            case 'detailacc':
			case 'detailmlbb': {
  if (!isOwner) return m.reply('Hanya owner yang bisa.');
  
  if (args.length < 1) {
    return m.reply('Format: detailmlbb [accountId]');
  }
  
  const accountId = args[0];
  
  try {
    const accountRef = db.collection('mlbb_accounts').doc(accountId);
    const accountDoc = await accountRef.get();
    
    if (!accountDoc.exists) {
      return m.reply(`Akun dengan ID ${accountId} tidak ditemukan.`);
    }
    
    const account = accountDoc.data();
    
    // Gunakan moment.js untuk timezone Asia/Jakarta
    const jakartaTime = moment().tz('Asia/Jakarta');
    const today = jakartaTime.format('YYYY-MM-DD');
    
    // Format dates dengan timezone Jakarta yang benar
    const formatDate = (timestamp) => {
      if (!timestamp) return 'None';
      
      // Jika itu Firestore timestamp atau date object
      let date;
      if (timestamp.toDate) {
        date = moment(timestamp.toDate());
      } else if (timestamp instanceof Date) {
        date = moment(timestamp);
      } else {
        date = moment(timestamp);
      }
      
      // Set timezone ke Asia/Jakarta
      return date.tz('Asia/Jakarta').format('D MMMM YYYY pukul HH.mm') + ' WIB';
    };
    
    // Calculate time until next reset (15:00 WIB)
    const getNextResetTime = () => {
      const reset = moment(jakartaTime).set({hour: 15, minute: 0, second: 0, millisecond: 0});
      
      // If current time is past 15:00, set to tomorrow
      if (jakartaTime.hour() >= 15) {
        reset.add(1, 'days');
      }
      
      const duration = moment.duration(reset.diff(jakartaTime));
      const diffHours = Math.floor(duration.asHours());
      const diffMinutes = Math.floor(duration.asMinutes()) % 60;
      
      return {
        resetTime: reset,
        resetFormatted: reset.format('D MMMM YYYY pukul HH.mm') + ' WIB',
        countdown: `${diffHours} jam ${diffMinutes} menit lagi`
      };
    };
    
    let result = `📱 *MLBB ACCOUNT DETAILS*\n\n`;
    
    // Basic info
    result += `*ID:* ${account.accountId}\n`;
    result += `*Game ID:* ${account.gameId || '-'} (${account.server || '-'})\n`;
    result += `*Nickname:* ${account.nickname || '-'}\n`;
    result += `*Status:* ${account.status}\n\n`;
    
    // Resources
    result += `*💎 Diamond:* ${account.diamonds || 0}\n`;
    
    // Get gift quota
    try {
      const quotaDoc = await accountRef.collection('gift_quota').doc('current').get();
      if (quotaDoc.exists) {
        const quotaData = quotaDoc.data();
        result += `*🎁 Gift Quota:* ${quotaData.remaining || 0}/${quotaData.total || 1000}\n`;
      } else {
        result += `*🎁 Gift Quota:* Unknown\n`;
      }
    } catch (e) {
      result += `*🎁 Gift Quota:* Error fetching\n`;
    }
    
    result += `*🔄 Daily Gift Used:* ${account.dailyGiftUsed || 0}/3\n\n`;
    
    // WDP Status
    result += `*Weekly Diamond Pass:*\n`;
    if (account.wdp?.active) {
      result += `• Status: Active\n`;
      
      // Get end date in Jakarta time
      let endDate = null;
      if (account.wdp.endDate) {
        const endDateUTC = account.wdp.endDate.toDate?.() || new Date(account.wdp.endDate);
        endDate = moment(endDateUTC).tz('Asia/Jakarta');
        
        result += `• End: ${endDate.format('D MMMM YYYY pukul HH.mm')} WIB\n`;
        
        // Calculate remaining time
        const duration = moment.duration(endDate.diff(jakartaTime));
        if (duration.asMilliseconds() > 0) {
          const daysLeft = Math.floor(duration.asDays());
          const hoursLeft = Math.floor(duration.asHours()) % 24;
          const minutesLeft = Math.floor(duration.asMinutes()) % 60;
          
          result += `• Remaining: ${daysLeft} hari ${hoursLeft} jam ${minutesLeft} menit\n`;
        } else {
          result += `• Remaining: Expired\n`;
        }
      }
      
      // Daily claim info
      result += `• Daily Remaining: ${account.wdp.dailyRemaining || 0}\n`;
      
      // Next reset info
      const nextReset = getNextResetTime();
      result += `• Next Reset: ${nextReset.resetFormatted}\n`;
      result += `• Reset In: ${nextReset.countdown}\n`;
      
      // Last claim info
      if (account.wdp.lastClaim) {
        const lastClaimUTC = account.wdp.lastClaim.toDate?.() || new Date(account.wdp.lastClaim);
        const lastClaim = moment(lastClaimUTC).tz('Asia/Jakarta');
        
        result += `• Last Claim: ${lastClaim.format('D MMMM YYYY pukul HH.mm')} WIB\n`;
        
        // Check if can claim today
        const isToday = lastClaim.format('YYYY-MM-DD') === today;
        const isPastReset = jakartaTime.hour() >= 15;
        const isLastClaimBeforeReset = lastClaim.hour() < 15;
        
        const canClaim = !isToday || (isToday && isPastReset && isLastClaimBeforeReset);
        
        result += `• Can Claim Now: ${canClaim ? '✅ Yes' : '❌ No, wait until next reset'}\n`;
      }
      
      // Get latest WDP history
      try {
        const wdpQuery = await accountRef.collection('wdp_history')
          .orderBy('timestamp', 'desc')
          .limit(1)
          .get();
        
        if (!wdpQuery.empty) {
          const latestWdp = wdpQuery.docs[0].data();
          if (latestWdp.startDate) {
            result += `• Start: ${formatDate(latestWdp.startDate)}\n`;
          }
          if (latestWdp.costRupiah) {
            result += `• Cost: Rp${latestWdp.costRupiah?.toLocaleString() || 0}\n`;
          }
        }
      } catch (e) {
        result += `• More info: Error fetching\n`;
      }
    } else {
      result += `• Status: Inactive\n`;
      
      // Next reset info (useful even for inactive accounts)
      const nextReset = getNextResetTime();
      result += `• Next Reset: ${nextReset.resetFormatted}\n`;
    }
    result += '\n';
    
    // Recharge Items
    result += `*Recharge Items:*\n`;
    try {
      const rechargeQuery = await accountRef.collection('recharge_items').get();
      
      if (!rechargeQuery.empty) {
        for (const doc of rechargeQuery.docs) {
          const data = doc.data();
          const tier = doc.id.replace('diamond', '').replace('plus', '+');
          result += `• ${tier}: ${data.used ? '✓ Used' : '✗ Available'}\n`;
        }
      } else {
        result += `• No recharge items found\n`;
      }
    } catch (e) {
      result += `• Error fetching recharge items\n`;
    }
    result += '\n';
    
    // Starlight Limits
    result += `*Monthly Starlight Limits:*\n`;
    const currentMonth = jakartaTime.format('YYYY-MM');
    try {
      const slDoc = await accountRef.collection('starlight_limits').doc(currentMonth).get();
      if (slDoc.exists) {
        const slData = slDoc.data();
        result += `• Month: ${slData.month || currentMonth}\n`;
        result += `• SL Basic: ${slData.basicCount || 0}/3 used (${3 - (slData.basicCount || 0)} remaining)\n`;
        result += `• SL Premium: ${slData.premiumCount || 0}/3 used (${3 - (slData.premiumCount || 0)} remaining)\n`;
      } else {
        result += `• Month: ${currentMonth} (not initialized)\n`;
        result += `• SL Basic: 0/3 used (3 remaining)\n`;
        result += `• SL Premium: 0/3 used (3 remaining)\n`;
      }
    } catch (e) {
      result += `• Error fetching starlight limits\n`;
    }
    result += '\n';
    
    // Friendships summary
    try {
      const friendshipQuery = await accountRef.collection('friendship').get();
      const friendships = friendshipQuery.docs.map(doc => doc.data());
      result += `*Friendships:* ${friendships.length} total\n`;
      
      // Calculate eligible friends based on 7-day rule
      const eligibleFriends = friendships.filter(f => {
        if (!f.addedAt) return false;
        
        // Convert to Jakarta time
        const addedDateUTC = f.addedAt.toDate?.() || new Date(f.addedAt);
        const addedDate = moment(addedDateUTC).tz('Asia/Jakarta');
        
        const diffDays = jakartaTime.diff(addedDate, 'days');
        
        return diffDays >= 7;
      });
      
      result += `• Eligible: ${eligibleFriends.length}\n`;
      result += `• Pending: ${friendships.length - eligibleFriends.length}\n\n`;
    } catch (e) {
      result += `*Friendships:* Error fetching\n\n`;
    }
    
    // Pending orders
    try {
      const pendingOrdersQuery = await accountRef.collection('pending_orders').get();
      result += `*Pending Orders:* ${pendingOrdersQuery.size} total\n\n`;
    } catch (e) {
      result += `*Pending Orders:* Error fetching\n\n`;
    }
    
    // Created/Updated
    result += `*Created:* ${formatDate(account.createdAt)}\n`;
    result += `*Last Updated:* ${formatDate(account.updatedAt)}\n`;
    result += `*Current Time:* ${jakartaTime.format('D MMMM YYYY pukul HH.mm')} WIB\n`;
    
    m.reply(result);
  } catch (err) {
    console.error('Error detailmlbb:', err);
    m.reply('❌ Gagal mengambil detail akun MLBB.');
  }
  break;
}
          /*  case 'setprice': {
  if (!isOwner) return m.reply('Hanya owner yang bisa.');
  
  if (args.length < 3) {
    return m.reply('Format: setprice <product> <role> <price>\nProduct: slbasic, slpremium');
  }
  
  const product = args[0].toLowerCase();
  const role = args[1].toUpperCase();
  const price = parseInt(args[2]);
  
  if (!['slbasic', 'slpremium'].includes(product)) {
    return m.reply('Product tidak valid. Gunakan: slbasic, slpremium');
  }
  
  if (!['BRONZE', 'SILVER', 'GOLD', 'OWNER'].includes(role)) {
    return m.reply('Role tidak valid. Gunakan: BRONZE, SILVER, GOLD, OWNER');
  }
  
  if (isNaN(price) || price <= 0) {
    return m.reply('Harga tidak valid.');
  }
  
  try {
    const settingsRef = db.collection('settings').doc('pricing');
    const fieldName = product === 'slbasic' ? 'sl_basic' : 'sl_premium';
    
    // Update harga untuk role tertentu
    await settingsRef.set({
      [fieldName]: {
        [role]: price
      }
    }, { merge: true });
    
    m.reply(`✅ Harga ${product.toUpperCase()} untuk role ${role} berhasil diubah menjadi Rp${price.toLocaleString()}`);
    
  } catch (err) {
    console.error('Error setprice:', err);
    m.reply('❌ Gagal mengubah harga.');
  }
  break;
} */
            case 'setrate': {
  if (!isOwner) return m.reply('Hanya owner yang bisa.');
  
  if (args.length < 3) {
    return m.reply('Format: setrate <type> <role> <rate>\nType: diamond, charisma');
  }
  
  const type = args[0].toLowerCase();
  const role = args[1].toUpperCase();
  const rate = parseInt(args[2]);
  
  if (!['diamond', 'charisma'].includes(type)) {
    return m.reply('Type tidak valid. Gunakan: diamond, charisma');
  }
  
  if (!['BRONZE', 'SILVER', 'GOLD', 'OWNER'].includes(role)) {
    return m.reply('Role tidak valid. Gunakan: BRONZE, SILVER, GOLD, OWNER');
  }
  
  if (isNaN(rate) || rate <= 0) {
    return m.reply('Rate tidak valid.');
  }
  
  try {
    const settingsRef = db.collection('settings').doc('pricing');
    const fieldName = type === 'diamond' ? 'diamond_rates' : 'charisma_rates';
    
    // Update rate untuk role tertentu
    await settingsRef.set({
      [fieldName]: {
        [role]: rate
      }
    }, { merge: true });
    
    m.reply(`✅ Rate ${type} untuk role ${role} berhasil diubah menjadi Rp${rate.toLocaleString()}/diamond`);
    
  } catch (err) {
    console.error('Error setrate:', err);
    m.reply('❌ Gagal mengubah rate.');
  }
  break;
}
            case 'addcategory': {
  if (!isOwner) return m.reply('Hanya owner yang bisa.');
  
  if (args.length < 2) {
    return m.reply('Format: addcategory <name> <description>');
  }
  
  const name = args[0].toLowerCase();
  const description = args.slice(1).join(' ');
  
  try {
    const categoryRef = db.collection('settings').doc('shop_items');
    
    // Cek apakah kategori sudah ada
    const doc = await categoryRef.get();
    if (doc.exists && doc.data().categories && doc.data().categories[name]) {
      return m.reply(`❌ Kategori '${name}' sudah ada.`);
    }
    
    await categoryRef.set({
      categories: {
        [name]: {
          description: description,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        }
      }
    }, { merge: true });
    
    m.reply(`✅ Kategori '${name}' berhasil ditambahkan.`);
    
  } catch (err) {
    console.error('Error addcategory:', err);
    m.reply('❌ Gagal menambahkan kategori.');
  }
  break;
}
            case 'addsubcategory': {
  if (!isOwner) return m.reply('Hanya owner yang bisa.');
  
  if (args.length < 4) {
    return m.reply('Format: addsubcategory <category> <name> <diamondPrice> <description>');
  }
  
  const category = args[0].toLowerCase();
  const name = args[1].toLowerCase();
  const diamondPrice = parseInt(args[2]);
  const description = args.slice(3).join(' ');
  
  if (isNaN(diamondPrice) || diamondPrice <= 0) {
    return m.reply('Harga diamond tidak valid.');
  }
  
  try {
    // Cek apakah kategori ada
    const categoryRef = db.collection('settings').doc('shop_items');
    const categoryDoc = await categoryRef.get();
    
    if (!categoryDoc.exists || !categoryDoc.data().categories || !categoryDoc.data().categories[category]) {
      return m.reply(`❌ Kategori '${category}' tidak ditemukan.`);
    }
    
    // Cek apakah subcategory sudah ada
    if (categoryDoc.data().categories[category].subcategories && 
        categoryDoc.data().categories[category].subcategories[name]) {
      return m.reply(`❌ Subkategori '${name}' sudah ada di kategori '${category}'.`);
    }
    
    // Tambahkan subkategori
    await categoryRef.set({
      categories: {
        [category]: {
          subcategories: {
            [name]: {
              diamondPrice: diamondPrice,
              description: description,
              createdAt: admin.firestore.FieldValue.serverTimestamp()
            }
          }
        }
      }
    }, { merge: true });
    
    m.reply(`✅ Subkategori '${name}' berhasil ditambahkan ke kategori '${category}' dengan harga ${diamondPrice} diamond.`);
    
  } catch (err) {
    console.error('Error addsubcategory:', err);
    m.reply('❌ Gagal menambahkan subkategori.');
  }
  break;
}
            case 'delcategory': {
  if (!isOwner) return m.reply('Hanya owner yang bisa.');
  
  if (args.length < 1) {
    return m.reply('Format: delcategory <name>');
  }
  
  const name = args[0].toLowerCase();
  
  try {
    const categoryRef = db.collection('settings').doc('shop_items');
    const doc = await categoryRef.get();
    
    if (!doc.exists || !doc.data().categories || !doc.data().categories[name]) {
      return m.reply(`❌ Kategori '${name}' tidak ditemukan.`);
    }
    
    // Hapus kategori dengan FieldValue.delete()
    const categories = doc.data().categories;
    delete categories[name];
    
    await categoryRef.update({
      categories: categories
    });
    
    m.reply(`✅ Kategori '${name}' berhasil dihapus.`);
    
  } catch (err) {
    console.error('Error delcategory:', err);
    m.reply('❌ Gagal menghapus kategori.');
  }
  break;
}
            case 'delsubcategory': {
  if (!isOwner) return m.reply('Hanya owner yang bisa.');
  
  if (args.length < 2) {
    return m.reply('Format: delsubcategory <category> <subcategory>');
  }
  
  const category = args[0].toLowerCase();
  const subcategory = args[1].toLowerCase();
  
  try {
    const categoryRef = db.collection('settings').doc('shop_items');
    const doc = await categoryRef.get();
    
    if (!doc.exists || !doc.data().categories || !doc.data().categories[category]) {
      return m.reply(`❌ Kategori '${category}' tidak ditemukan.`);
    }
    
    if (!doc.data().categories[category].subcategories || 
        !doc.data().categories[category].subcategories[subcategory]) {
      return m.reply(`❌ Subkategori '${subcategory}' tidak ditemukan di kategori '${category}'.`);
    }
    
    // Hapus subcategory
    const categories = doc.data().categories;
    delete categories[category].subcategories[subcategory];
    
    await categoryRef.update({
      categories: categories
    });
    
    m.reply(`✅ Subkategori '${subcategory}' berhasil dihapus dari kategori '${category}'.`);
    
  } catch (err) {
    console.error('Error delsubcategory:', err);
    m.reply('❌ Gagal menghapus subkategori.');
  }
  break;
}
            case 'listcategories': {
  try {
    const shopItemsRef = db.collection('settings').doc('shop_items');
    const shopItemsDoc = await shopItemsRef.get();
    
    if (!shopItemsDoc.exists || !shopItemsDoc.data().categories) {
      return m.reply('❌ Belum ada kategori yang tersedia.');
    }
    
    const categories = shopItemsDoc.data().categories;
    let result = `*DAFTAR KATEGORI SHOP MLBB*\n\n`;
    
    Object.keys(categories).forEach(category => {
      result += `• *${category}*: ${categories[category].description || '-'}\n`;
      
      // Tampilkan subcategories jika ada
      if (categories[category].subcategories) {
        const subcategories = categories[category].subcategories;
        Object.keys(subcategories).forEach(sub => {
          result += `  ↳ *${sub}*: ${subcategories[sub].diamondPrice} diamonds (${subcategories[sub].description || '-'})\n`;
        });
      }
      
      result += '\n';
    });
    
    result += `\nUntuk melihat detail subkategori: listsubcategories <kategori>`;
    
    m.reply(result);
    
  } catch (err) {
    console.error('Error listcategories:', err);
    m.reply('❌ Gagal mengambil daftar kategori.');
  }
  break;
 }
            case 'pricelist':
        	case 'ml': {
  try {
    const filter = args[0]?.toLowerCase();
    const nomor = sender.split('@')[0];
    
    // Ambil role user
    const userRef = db.collection('users').doc(nomor);
    const userDoc = await userRef.get();
    
    let userRole = 'BRONZE';
    if (userDoc.exists) {
      userRole = userDoc.data().role?.toUpperCase() || 'BRONZE';
    }
    
    // Ambil data pricing
    const pricingRef = db.collection('settings').doc('pricing');
    const pricingDoc = await pricingRef.get();
    
    if (!pricingDoc.exists) {
      return m.reply('❌ Database pricing tidak ditemukan.');
    }
    
    const pricing = pricingDoc.data();
    
    // Ambil data shop items
    const shopItemsRef = db.collection('settings').doc('shop_items');
    const shopItemsDoc = await shopItemsRef.get();
    
    // Ambil data penjualan untuk "Terjual"
    const salesQuery = await db.collection('history_trx')
      .where('status', '==', 'Sukses')
      .get();
    
    // Hitung jumlah penjualan per produk
    const salesCount = {};
    let totalSales = 0;
    
    // Hitung juga penjualan per subkategori
    const subCategorySales = {};
    
    if (!salesQuery.empty) {
      salesQuery.forEach(doc => {
        const data = doc.data();
        const produk = data.produk;
        
        if (!salesCount[produk]) {
          salesCount[produk] = 0;
        }
        
        salesCount[produk]++;
        totalSales++;
        
        // Tracking untuk subkategori
        if (data.itemId && data.itemId.includes('.')) {
          // Format itemId: "kategori.subkategori"
          if (!subCategorySales[data.itemId]) {
            subCategorySales[data.itemId] = 0;
          }
          subCategorySales[data.itemId]++;
        }
      });
    }
    
    // Sort produk berdasarkan penjualan
    const productsByPopularity = Object.keys(salesCount).sort((a, b) => {
      return salesCount[b] - salesCount[a];
    });
    
    // Buat katalog dengan format artistik
    let result = `‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎‎ ‎ ‎ ‎‎ ‎ ‎  ‎ ‎ ‎ ‎ ‎ ‎ ‎ ⣠⠞⠛⠛⠶      
‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ⣀⡾⠛⢻⡷⢦⣄        
 ‎ ‎ ⣠⡴⠞⠛⠹⡇ ‎ ‎ ‎‎  ‎ ‎ ‎   ⢀⡟⠛⠳⢶⣄    
⢠⣿⣄⡀‎‎ ‎  ‎   ⢿⣦⣤⣴⠿⠇ ‎ ‎𝓒-𝖼𝖺𝗍𝖺𝗅𝗈𝗀𝗎𝖾'𝗌 
‎  ‎⠁⠉⠙⠛⠶⠶⠶⠶⠶⠶⠶⠛⠛⠉⠈
𓈒  ֗  𝗌𝖾𝗏𝖾𝗋𝖺𝗅 𝗉𝗋𝗈𝖽𝗎𝖼𝗍𝗌 𝖺𝗏𝖺𝗂𝗅𝖺𝖻𝗅𝖾  𓈒 𓂋 𝖼𝗁𝖾𝗋𝗂𝗌'𝗒
‎  ‎ ‎ ‎ ‎ 𝗈𝗇 ━ 제품  𝓐─𝗮𝘁𝗹𝗮𝗻𝘁𝗶𝗰 𝗴𝗮𝘁𝗲 ‎𓈒  ֗  𐂯‎‎
‎  ‎ ‎ ‎ ‎ ‎  ‎ ‎ ‎ ‎‎  ‎ ‎ ‎ ‎  𝗉𝖾𝗋𝗌–𝖻𝗎𝗌𝗌\n\n`;

    result += `╭┈ ketik *buy / buyqr* untuk order
𑣿.. 𝖱𝗈𝗅𝖾 𝖠𝗇𝖽𝖺 : ${userRole}
 |  ׄ  ᨧ︩ᨩ ۫  𝗉𝗋𝗈𝖽𝗎𝗄 𝗍𝖾𝗋𝗌𝖾𝖽𝗂𝖺 : ${Object.keys(salesCount).length || 0}
 |  ׄ  ᨧ︩ᨩ ۫  total  :  ${totalSales || 0}
╰──━\n ͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏ \n`;

    // Jika command adalah ML GIFT atau tanpa filter, tampilkan semua
    if (!filter || filter === 'gift') {
      // 1. Tampilkan SL Basic
      const slBasicPrice = pricing.sl_basic?.[userRole] || 33000;
      const slBasicSold = salesCount['SL Basic'] || 0;
      
      result += `╭┈ 🔥 *𝖲𝗍𝖺𝗋𝗅𝗂𝗀𝗁𝗍 𝖡𝖺𝗌𝗂𝖼* ${slBasicSold > 0 ? '(Best Seller)' : ''}
 | 𝖪𝗈𝖽𝖾 : \`slbasic\`
 | 𝖧𝖺𝗋𝗀𝖺 : Rp${slBasicPrice.toLocaleString()} (💎300)
 | 𝖳𝖾𝗋𝗃𝗎𝖺𝗅 : ${slBasicSold}
 | 𝖭𝗈𝗍𝖾 : Weekly Starlights Pass & Exclusive Avatar Border
╰─────────⪦\n\n`;

      // 2. Tampilkan SL Premium
      const slPremiumPrice = pricing.sl_premium?.[userRole] || 80000;
      const slPremiumSold = salesCount['SL Premium'] || 0;
      
      result += `╭┈ 💫 *𝖲𝗍𝖺𝗋𝗅𝗂𝗀𝗁𝗍 𝖯𝗋𝖾𝗆𝗂𝗎𝗆* ${slPremiumSold > 0 ? '(Best Seller)' : ''}
 | 𝖪𝗈𝖽𝖾 : \`slpremium\`
 | 𝖧𝖺𝗋𝗀𝖺 : Rp${slPremiumPrice.toLocaleString()} (💎750)
 | 𝖳𝖾𝗋𝗃𝗎𝖺𝗅 : ${slPremiumSold}
 | 𝖭𝗈𝗍𝖾 : Premium Skin, Custom Effects & Avatar Border
╰─────────⪦\n\n`;

      // 3. Tampilkan Charisma
      const charismaRate = pricing.charisma_rates?.[userRole] || 120;
      
      // Combine charisma types to count sales
      let totalCharismaSold = 0;
      Object.keys(salesCount).forEach(prod => {
        if (prod.includes('Charisma')) {
          totalCharismaSold += salesCount[prod];
        }
      });
      
      result += `╭┈ ✨ *𝖢𝗁𝖺𝗋𝗂𝗌𝗆𝖺 𝖦𝗂𝖿𝗍* ${totalCharismaSold > 0 ? '(Best Seller)' : ''}
 | 𝖪𝗈𝖽𝖾 : \`charisma\`
 | 𝖧𝖺𝗋𝗀𝖺 : 
 | • 8 charisma: Rp${(8 * charismaRate).toLocaleString()} (💎8)
 | • 20 charisma: Rp${(20 * charismaRate).toLocaleString()} (💎20)
 | • 499 charisma: Rp${(499 * charismaRate).toLocaleString()} (💎499)
 | • 999 charisma: Rp${(999 * charismaRate).toLocaleString()} (💎999)
 | 𝖳𝖾𝗋𝗃𝗎𝖺𝗅 : ${totalCharismaSold}
 | 𝖭𝗈𝗍𝖾 : Increase charisma points & unlock profile customizations
╰─────────⪦\n\n`;

      // 4. Tampilkan Shop Items
      if (shopItemsDoc.exists && shopItemsDoc.data().categories) {
        const categories = shopItemsDoc.data().categories;
        
        // Shop rate
        const dmRate = pricing.diamond_rates?.[userRole] || 130;
        
        result += `╭┈ 🛒 *𝖲𝗁𝗈𝗉 𝖨𝗍𝖾𝗆𝗌*
 | 𝖪𝗈𝖽𝖾 : \`shop\`
 | 𝖱𝖺𝗍𝖾 : Rp${dmRate}/diamond untuk ${userRole}
 | 𝖪𝖺𝗍𝖾𝗀𝗈𝗋𝗂 :`;
        
        Object.keys(categories).forEach(catName => {
          if (catName.toLowerCase() !== 'charisma') {
            result += `\n | • ${catName}`;
          }
        });
        
        result += `\n | 𝖳𝖾𝗋𝗃𝗎𝖺𝗅 : ${salesCount['Item Shop'] || 0}
 | 𝖭𝗈𝗍𝖾 : Ketik *ML <kategori>* untuk melihat detail
╰─────────⪦\n\n`;
      }
      
      result += `Untuk melihat detail kategori shop, ketik:\n*ML <kategori>*\nContoh: *ML skin*\n\n`;
      result += `Untuk melihat harga di semua role:\n*ML / Pricelist*\n\n`;
      result += `*${namaStore}*`;
      
      return m.reply(result);
    } 
    
    // Jika command adalah ML <kategori> (filter berdasarkan kategori)
    if (filter) {
      // Ambil data kategori dari database
      if (!shopItemsDoc.exists || !shopItemsDoc.data().categories) {
        return m.reply('❌ Belum ada kategori yang tersedia.');
      }
      
      const categories = shopItemsDoc.data().categories;
      
      // Cek jika kategori ada
      if (!categories[filter] && filter !== 'charisma') {
        return m.reply(`❌ Kategori '${filter}' tidak ditemukan.`);
      }
      
      // Header untuk kategori
      result = `‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎‎ ‎ ‎ ‎‎ ‎ ‎  ‎ ‎ ‎ ‎ ‎ ‎ ‎ ⣠⠞⠛⠛⠶      
‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ⣀⡾⠛⢻⡷⢦⣄        
 ‎ ‎ ⣠⡴⠞⠛⠹⡇ ‎ ‎ ‎‎  ‎ ‎ ‎   ⢀⡟⠛⠳⢶⣄    
⢠⣿⣄⡀‎‎ ‎  ‎   ⢿⣦⣤⣴⠿⠇ ‎ ‎𝓒-𝖼𝖺𝗍𝖺𝗅𝗈𝗀𝗎𝖾'𝗌 
‎  ‎⠁⠉⠙⠛⠶⠶⠶⠶⠶⠶⠶⠛⠛⠉⠈\n\n`;

      result += `╭┈ ketik *buy / buyqr* untuk order
𑣿.. 𝖱𝗈𝗅𝖾 𝖠𝗇𝖽𝖺 : ${userRole}
 |  ׄ  ᨧ︩ᨩ ۫  𝗄𝖺𝗍𝖾𝗀𝗈𝗋𝗂 : ${filter}
╰──━\n ͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏ \n`;
      
      // Jika filter adalah charisma (special case)
      if (filter === 'charisma') {
        const charismaRate = pricing.charisma_rates?.[userRole] || 120;
        const totalCharismaSold = Object.keys(salesCount)
          .filter(prod => prod.includes('Charisma'))
          .reduce((sum, prod) => sum + salesCount[prod], 0);
        
        result += `╭┈ ✨ *𝖢𝗁𝖺𝗋𝗂𝗌𝗆𝖺 𝖦𝗂𝖿𝗍* ${totalCharismaSold > 0 ? '(Best Seller)' : ''}
 | 𝖪𝗈𝖽𝖾 : \`charisma\`
 | 𝖧𝖺𝗋𝗀𝖺 : 
 | • 8 charisma: Rp${(8 * charismaRate).toLocaleString()} (💎8)
 | • 20 charisma: Rp${(20 * charismaRate).toLocaleString()} (💎20)
 | • 499 charisma: Rp${(499 * charismaRate).toLocaleString()} (💎499)
 | • 999 charisma: Rp${(999 * charismaRate).toLocaleString()} (💎999)
 | 𝖳𝖾𝗋𝗃𝗎𝖺𝗅 : ${totalCharismaSold}
 | 𝖭𝗈𝗍𝖾 : Increase charisma points & unlock profile customizations
╰─────────⪦\n\n`;
        
        result += `Format order: *buy charisma <userId> <zoneId> <jumlah_charisma> [jumlah_order]*\n\n`;
        result += `*${namaStore}*`;
        
        return m.reply(result);
      }
      
      // Tampilkan subcategories jika ada
      if (categories[filter]?.subcategories) {
        const subcategories = categories[filter].subcategories;
        const dmRate = pricing.diamond_rates?.[userRole] || 130;
        
        // Konversi ke array untuk sorting
        const subcategoryArray = Object.keys(subcategories).map(subName => {
          return {
            name: subName,
            diamondPrice: subcategories[subName].diamondPrice,
            description: subcategories[subName].description || '-'
          };
        });
        
        // Sort by diamondPrice (terendah dulu)
        subcategoryArray.sort((a, b) => a.diamondPrice - b.diamondPrice);
        
        // Display sorted subcategories
        let index = 1;
        subcategoryArray.forEach(sub => {
          const rupiah = (sub.diamondPrice * dmRate).toLocaleString();
          const itemId = `${filter}.${sub.name}`;
          const soldCount = subCategorySales[itemId] || 0;
          const isBestSeller = soldCount > 0 ? ' (Best Seller)' : '';
          
          result += `╭┈ ${index}. *${sub.name}*${isBestSeller}
 | 𝖪𝗈𝖽𝖾 : \`${sub.name}\`
 | 𝖧𝖺𝗋𝗀𝖺 : Rp${rupiah} (💎${sub.diamondPrice})
 | 𝖳𝖾𝗋𝗃𝗎𝖺𝗅 : ${soldCount}
 | 𝖭𝗈𝗍𝖾 : ${sub.description}
╰─────────⪦\n\n`;
          
          index++;
        });
        
        result += `Format order: *buy shop <userId> <zoneId> ${filter} <subcategory> [jumlah]*\n\n`;
        result += `*${namaStore}*`;
      } else {
        result += `Tidak ada item dalam kategori ini.`;
      }
      
      return m.reply(result);
    }
    
    // Jika command hanya ML tanpa argumen dan bukan ML GIFT
    let helpResult = `‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎‎ ‎ ‎ ‎‎ ‎ ‎  ‎ ‎ ‎ ‎ ‎ ‎ ‎ ⣠⠞⠛⠛⠶      
‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ‎ ⣀⡾⠛⢻⡷⢦⣄        
 ‎ ‎ ⣠⡴⠞⠛⠹⡇ ‎ ‎ ‎‎  ‎ ‎ ‎   ⢀⡟⠛⠳⢶⣄    
⢠⣿⣄⡀‎‎ ‎  ‎   ⢿⣦⣤⣴⠿⠇ ‎ ‎𝓒-𝖼𝖺𝗍𝖺𝗅𝗈𝗀𝗎𝖾'𝗌 
‎  ‎⠁⠉⠙⠛⠶⠶⠶⠶⠶⠶⠶⠛⠛⠉⠈\n\n`;

    helpResult += `*MOBILE LEGENDS GIFT SYSTEM*\n\n`;
    helpResult += `Daftar command:\n`;
    helpResult += `• *ML GIFT* - Lihat semua kategori produk\n`;
    helpResult += `• *ML <kategori>* - Lihat item dalam kategori\n\n`;
    
    helpResult += `Kategori tersedia:\n`;
    if (shopItemsDoc.exists && shopItemsDoc.data().categories) {
      const categories = shopItemsDoc.data().categories;
      Object.keys(categories).forEach(category => {
        helpResult += `• ${category}\n`;
      });
    }
    
    helpResult += `\n*${namaStore}*`;
    m.reply(helpResult);
    
  } catch (err) {
    console.error('Error ML command:', err);
    m.reply('❌ Gagal mengambil daftar produk.');
  }
  break;
}
            case 'testing': {
  const nomor = sender.split('@')[0];
  
  // Ambil args dan validasi dasar
  const [tipeProduk, ...restArgs] = args;
  
  if (!tipeProduk) {
    return m.reply(`Format salah!
*Untuk SL Basic:* buy slbasic 12345678 1234 [jumlah]
*Untuk SL Premium:* buy slpremium 12345678 1234 [jumlah]
*Untuk Shop Item:* buy shop 12345678 1234 <kategori/subkategori> [jumlah]
*Untuk Charisma:* buy charisma 12345678 1234 <jumlah> [jumlah_order]`);
  }
  
  try {
    // 1. Cek user
    const userRef = db.collection('users').doc(nomor);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return m.reply('Kamu belum terdaftar. Silakan ketik *Daftar*');
    }
    
    const userProfile = userDoc.data();
    let saldoAwal = parseFloat(userProfile.saldo);
    
    if (isNaN(saldoAwal)) {
      return m.reply('❌ Saldo kamu tidak valid. Hubungi owner.');
    }
    
    const role = userProfile.role?.toUpperCase() || 'BRONZE';
    
    // 2. Parse argumen berdasarkan tipe produk
    let userId, zoneId, diamondAmount = 0, harga = 0, itemId = null, isPremium = false;
    let usesGiftQuota = false, isStarlight = false, slType = null;
    let orderQuantity = 1; // Default jumlah order adalah 1
    let diamondPerOrder = 0; // Diamond per unit order
    
    // Dapatkan tipe produk dan parse argumen - safety check
    const lowerType = tipeProduk ? tipeProduk.toLowerCase() : "";
    
    // Ambil pricing dari database
    const pricingRef = db.collection('settings').doc('pricing');
    const pricingDoc = await pricingRef.get();
    
    if (!pricingDoc.exists) {
      return m.reply('❌ Database pricing tidak ditemukan.');
    }
    
    const pricing = pricingDoc.data();
    
    if (lowerType === 'slbasic' || lowerType === 'slpremium') {
      // Format: buy slbasic/slpremium <userId> <zoneId> [jumlah]
      if (restArgs.length < 2) {
        return m.reply(`Format SL salah!\nContoh: buy ${lowerType} <userId> <zoneId> [jumlah]`);
      }
      
      userId = restArgs[0];
      zoneId = restArgs[1];
      
      // Parse jumlah order
      if (restArgs.length >= 3) {
        orderQuantity = parseInt(restArgs[2]);
        if (isNaN(orderQuantity) || orderQuantity <= 0) {
          orderQuantity = 1;
        }
      }
      
      isStarlight = true;
      slType = lowerType === 'slbasic' ? 'basic' : 'premium';
      
      // Set diamond amount berdasarkan tipe SL
      diamondPerOrder = lowerType === 'slbasic' ? 300 : 750;
      diamondAmount = diamondPerOrder * orderQuantity;
      isPremium = lowerType === 'slpremium';
      
      // Set harga berdasarkan role dan tipe SL dari database
      const priceField = lowerType === 'slbasic' ? 'sl_basic' : 'sl_premium';
      
      if (!pricing[priceField] || !pricing[priceField][role]) {
        return m.reply(`❌ Harga ${lowerType} untuk role ${role} tidak ditemukan.`);
      }
      
      harga = pricing[priceField][role] * orderQuantity;
      
    } else if (lowerType === 'shop') {
      // Format: buy shop <userId> <zoneId> <kategori/subkategori> [jumlah]
      if (restArgs.length < 3) {
        return m.reply(`Format shop item salah!\nContoh: buy shop <userId> <zoneId> <kategori/subkategori> [jumlah]`);
      }
      
      userId = restArgs[0];
      zoneId = restArgs[1];
      
      // Get subkategori - bisa berupa format kategori.subkategori atau langsung subkategori
      const subkategoriInput = restArgs[2].toLowerCase();
      let category, subcategory;
      
      // Parse jumlah order jika ada
      if (restArgs.length >= 4 && !isNaN(parseInt(restArgs[3]))) {
        orderQuantity = parseInt(restArgs[3]);
        if (orderQuantity <= 0) orderQuantity = 1;
      }
      
      // Ambil data shop items
      const shopItemsRef = db.collection('settings').doc('shop_items');
      const shopItemsDoc = await shopItemsRef.get();
      
      if (!shopItemsDoc.exists) {
        return m.reply('❌ Database shop items tidak ditemukan.');
      }
      
      const categories = shopItemsDoc.data().categories;
      
      // Cek apakah input adalah format kategori.subkategori
      if (subkategoriInput.includes('.')) {
        [category, subcategory] = subkategoriInput.split('.');
        
        if (!categories[category] || !categories[category].subcategories || !categories[category].subcategories[subcategory]) {
          return m.reply(`❌ Kategori/subkategori '${subkategoriInput}' tidak ditemukan. Ketik *ML GIFT* untuk melihat daftar kategori.`);
        }
      } else {
        // Cari di semua kategori
        let found = false;
        
        for (const cat in categories) {
          if (categories[cat].subcategories && categories[cat].subcategories[subkategoriInput]) {
            category = cat;
            subcategory = subkategoriInput;
            found = true;
            break;
          }
        }
        
        if (!found) {
          // Coba cek apakah input adalah nama kategori
          if (categories[subkategoriInput]) {
            return m.reply(`❌ '${subkategoriInput}' adalah kategori, bukan subkategori. Silakan pilih subkategori spesifik dengan format: buy shop <userId> <zoneId> ${subkategoriInput}.<subkategori>`);
          } else {
            return m.reply(`❌ Subkategori '${subkategoriInput}' tidak ditemukan. Ketik *ML GIFT* untuk melihat daftar kategori dan subkategori.`);
          }
        }
      }
      
      // Dapatkan harga diamond per item
      diamondPerOrder = categories[category].subcategories[subcategory].diamondPrice;
      diamondAmount = diamondPerOrder * orderQuantity;
      
      // Ambil rate dari pricing
      if (!pricing.diamond_rates || !pricing.diamond_rates[role]) {
        return m.reply(`❌ Rate diamond untuk role ${role} tidak ditemukan.`);
      }
      
      const rate = pricing.diamond_rates[role];
      harga = diamondAmount * rate;
      
      itemId = `${category}.${subcategory}`;
      usesGiftQuota = true;
      
    } else if (lowerType === 'charisma') {
      // Format: buy charisma <userId> <zoneId> <jumlah_charisma> [jumlah_order]
      if (restArgs.length < 3) {
        return m.reply(`Format charisma salah!\nContoh: buy charisma <userId> <zoneId> <jumlah_charisma> [jumlah_order]`);
      }
      
      userId = restArgs[0];
      zoneId = restArgs[1];
      
      // Parse jumlah charisma (8, 20, 499, 999)
      const charismaAmount = parseInt(restArgs[2]);
      if (![8, 20, 499, 999].includes(charismaAmount)) {
        return m.reply(`Jumlah charisma tidak valid. Tersedia: 8, 20, 499, 999`);
      }
      
      // Parse jumlah order
      if (restArgs.length >= 4) {
        orderQuantity = parseInt(restArgs[3]);
        if (isNaN(orderQuantity) || orderQuantity <= 0) {
          orderQuantity = 1;
        }
      }
      
      diamondPerOrder = charismaAmount;
      diamondAmount = diamondPerOrder * orderQuantity;
      
      // Set harga berdasarkan role dan jumlah charisma dari database
      if (!pricing.charisma_rates || !pricing.charisma_rates[role]) {
        return m.reply(`❌ Rate charisma untuk role ${role} tidak ditemukan.`);
      }
      
      const rate = pricing.charisma_rates[role];
      harga = diamondAmount * rate;
      usesGiftQuota = true; // Charisma menambah gift quota, bukan mengurangi
      
    } else {
      return m.reply(`Tipe produk '${tipeProduk}' tidak valid.`);
    }
    
    // 3. Cek saldo
    if (saldoAwal < harga) {
      return m.reply(
        `❌ Saldo tidak cukup. Saldo kamu: Rp${saldoAwal.toLocaleString()}, Harga: Rp${harga.toLocaleString()}`
      );
    }
    
    // Kirim placeholder message untuk UX yang lebih baik
    await m.reply(`⏳ Sedang memproses order ${lowerType.toUpperCase()}... Mohon tunggu sebentar.`);
    
    // 4. Validasi nickname via API
    let nicknameUser = '-';
    try {
      const params = new URLSearchParams();
      params.append('country', 'SG');
      params.append('userId', userId);
      params.append('voucherTypeName', 'MOBILE_LEGENDS');
      params.append('zoneId', zoneId);
      
      const resp = await fetch('https://order-sg.codashop.com/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
        body: params
      });
      
      const json = await resp.json();
      if (json.success !== false && json.result?.username) {
        nicknameUser = decodeURIComponent(json.result.username).replace(/\+/g, ' ');
      } else {
        return m.reply('❌ Gagal validasi nickname. Pastikan ID dan Server benar.');
      }
    } catch (err) {
      console.error('Error validasi ML:', err);
      return m.reply('❌ Terjadi kesalahan saat validasi nickname.');
    }
    
    // Persiapan waktu & ref_id
    const jakartaTime = moment().tz('Asia/Jakarta');
    const hariini = jakartaTime.format('dddd, DD MMMM YYYY');
    const time1 = jakartaTime.format('HH.mm.ss');
    
    const pushname = m.pushName || '-';
    
    // 5. Untuk SL Premium, proses manual untuk semua role
    if (isPremium) {
      const ref_id = generateUniqueRefID();
      
      // Update saldo user
      const saldoBaru = saldoAwal - harga;
      await userRef.update({
        saldo: saldoBaru,
        total_spend: admin.firestore.FieldValue.increment(harga),
        jumlah_transaksi_sukses: admin.firestore.FieldValue.increment(1),
        lastOrderTime: admin.firestore.FieldValue.serverTimestamp()
      });
      
      // Simpan history transaksi
      const historyData = {
        tanggal: admin.firestore.FieldValue.serverTimestamp(),
        produk: 'SL Premium',
        tipe: 'SL',
        harga: harga,
        jumlah: orderQuantity,
        total: harga,
        tujuan: userId,
        zone: zoneId,
        invoice: ref_id,
        status: 'Pending',
        metode: 'Saldo',
        nicknameUser: nicknameUser,
        note: 'Diproses manual oleh owner'
      };
      
      await userRef.collection('transactions').doc(ref_id).set(historyData);
      
      // Simpan juga ke koleksi umum
      await db.collection('history_trx').doc(ref_id).set({
        nomor,
        invoice: ref_id,
        produk: 'SL Premium',
        tipe: 'SL',
        tujuan: userId,
        harga: harga,
        jumlah: orderQuantity,
        total: harga,
        waktu: admin.firestore.FieldValue.serverTimestamp(),
        status: 'Pending',
        metode: 'Saldo',
        nicknameUser: nicknameUser,
        note: 'Diproses manual oleh owner'
      });
      
      // Kirim notifikasi ke user
      const notifUser = `✅〔 *ORDER DITERIMA* 〕✅

» *Invoice* : ${ref_id}
» *Jenis Order* : SL Premium × ${orderQuantity}
» *Harga* : Rp${harga.toLocaleString()}
» *Total Bayar* : Rp${harga.toLocaleString()}
» *Tujuan* : ${userId}
» *Nickname ML* : ${nicknameUser}
» *Waktu* : ${hariini}
» *Jam* : ${time1} WIB

${orderQuantity} ID untuk SL Premium Anda akan diberikan oleh owner dalam waktu maksimal 24 jam. Kami akan menginformasikan Anda saat ID tersebut siap digunakan.

*${namaStore}*`;
      
      await client.sendMessage(m.chat, { text: notifUser }, { quoted: m });
      
      // Notifikasi ke owner
      const notifOwner = `*ORDER SL PREMIUM ⚡*

*» Nama :* ${pushname}
*» Nomor :* ${nomor}
*» Role :* ${role}
*» Produk :* SL Premium × ${orderQuantity}
*» Tujuan :* ${userId}
*» Nickname ML :* ${nicknameUser}
*» Harga :* Rp${harga.toLocaleString()}
*» Invoice :* ${ref_id}

*Catatan: Order ini perlu diproses manual*

*${namaStore}*`;
      
      for (const own of global.owner) {
        await client.sendMessage(own + '@s.whatsapp.net', { text: notifOwner }, { quoted: m });
      }
      
      return; // End processing untuk SL Premium
    }
    
    // 6. Cari akun-akun yang eligible berdasarkan tipe produk
    const now = new Date();
    const currentMonth = jakartaTime.format('YYYY-MM'); // YYYY-MM format
    
    // Ambil semua akun aktif
    const accountsQuery = db.collection('mlbb_accounts').where('status', '==', 'active');
    const accountsSnapshot = await accountsQuery.get();
    
    if (accountsSnapshot.empty) {
      return m.reply('❌ Tidak ada akun MLBB aktif tersedia saat ini.');
    }
    
    // Persiapkan array akun-akun yang eligible
    const eligibleAccounts = [];
    
    // Iterasi semua akun dan filter yang eligible
    for (const doc of accountsSnapshot.docs) {
      const account = doc.data();
      const accountId = doc.id;
      
      // Cek diamond
      const currentDiamonds = account.diamonds || 0;
      
      // Cek friendship status
      let isFriend = false;
      let canGiftNow = false;
      let daysPassed = 0;
      let friendshipDoc = null;
      
      // NEW: Check if account has pending orders for this user
      let hasPendingOrder = false;
      
      try {
        // Check for pending orders for this user
        const pendingOrdersQuery = await doc.ref.collection('pending_orders')
          .where('userId', '==', userId)
          .where('status', 'in', ['waiting_friendship', 'ready_to_gift'])
          .get();
        
        hasPendingOrder = !pendingOrdersQuery.empty;
        
        // If this is a different order type and account already has pending orders,
        // skip this account to avoid conflicts
        if (hasPendingOrder) {
          const pendingOrder = pendingOrdersQuery.docs[0].data();
          // Allow same account if it's a charisma order or if it's same order type
          if (pendingOrder.orderType !== lowerType && lowerType !== 'charisma') {
            continue; // Skip this account
          }
        }
        
        // Cek friendship status dari sub-collection friendship
        friendshipDoc = await doc.ref.collection('friendship').doc(userId).get();
        
        if (friendshipDoc.exists) {
          const friendData = friendshipDoc.data();
          isFriend = true;
          
          // Cek apakah sudah eligible (7 hari berlalu)
          const addedDate = friendData.addedAt?.toDate?.() || new Date(friendData.addedAt);
          daysPassed = Math.floor((now.getTime() - addedDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysPassed >= 7) {
            canGiftNow = true;
          }
        }
      } catch (e) {
        console.error(`Error checking friendship/pending orders for account ${accountId}:`, e);
      }
      
      // Untuk SL: cek limit SL bulanan
      let slCount = 0;
      if (isStarlight) {
        try {
          const slLimitDoc = await doc.ref.collection('starlight_limits').doc(currentMonth).get();
          
          if (slLimitDoc.exists) {
            const slData = slLimitDoc.data();
            
            if (slType === 'basic') {
              slCount = slData.basicCount || 0;
            } else {
              slCount = slData.premiumCount || 0;
            }
            
            // Skip jika sudah mencapai limit
            if (slCount >= 3) {
              continue;
            }
          }
        } catch (e) {
          console.error(`Error checking SL limits for account ${accountId}:`, e);
        }
      }
      
      // Untuk shop items & charisma: cek gift quota
      let giftQuota = 0;
      
      if (usesGiftQuota) {
        try {
          const quotaDoc = await doc.ref.collection('gift_quota').doc('current').get();
          
          if (quotaDoc.exists) {
            giftQuota = quotaDoc.data().remaining || 0;
          }
        } catch (e) {
          console.error(`Error checking gift quota for account ${accountId}:`, e);
        }
      }
      
      // Tambahkan akun ke array jika memenuhi filter dasar
      const accountData = {
        id: accountId,
        ref: doc.ref,
        diamonds: currentDiamonds,
        giftQuota: giftQuota,
        slCount: slCount,
        isFriend: isFriend,
        canGiftNow: canGiftNow,
        daysPassed: daysPassed,
        friendshipDoc: friendshipDoc,
        account: account,
        hasPendingOrder: hasPendingOrder  // NEW: Add pending order status
      };
      
      // Filter berdasarkan tipe produk
      if (isStarlight) {
        // FIXED: Untuk SL Basic - filter berdasarkan diamond gap maksimal 300
        const diamondGap = Math.max(0, diamondPerOrder - currentDiamonds);
        
        if (diamondGap <= 300) {
          accountData.diamondGap = diamondGap;
          eligibleAccounts.push(accountData);
        }
      } else if (lowerType === 'shop') {
        // Untuk Shop: filter berdasarkan diamond gap maksimal 220 dan gift quota gap maksimal 100
        const diamondGap = Math.max(0, diamondPerOrder - currentDiamonds);
        const quotaGap = Math.max(0, diamondPerOrder - giftQuota);
        
        if (diamondGap <= 220 && quotaGap <= 100) {
          accountData.diamondGap = diamondGap;
          accountData.quotaGap = quotaGap;
          eligibleAccounts.push(accountData);
        }
      } else if (lowerType === 'charisma') {
        // Untuk Charisma: filter berdasarkan diamond gap maksimal 220
        const diamondGap = Math.max(0, diamondPerOrder - currentDiamonds);
        
        if (diamondGap <= 220) {
          accountData.diamondGap = diamondGap;
          eligibleAccounts.push(accountData);
        }
      }
    }
    
    // Sort akun-akun eligible berdasarkan tipe produk
    if (isStarlight) {
      // IMPROVED: Sort SL Basic prioritizing accounts with pending orders first
      eligibleAccounts.sort((a, b) => {
        // Level 1: Prioritize accounts with pending orders for same user
        if (a.hasPendingOrder !== b.hasPendingOrder) {
          return a.hasPendingOrder ? -1 : 1;
        }
        
        // Level 2: Prioritize accounts with enough diamonds
        const aHasEnough = a.diamonds >= diamondPerOrder;
        const bHasEnough = b.diamonds >= diamondPerOrder;
        
        if (aHasEnough !== bHasEnough) {
          return aHasEnough ? -1 : 1;
        }
        
        // Level 3: For accounts that need extra diamonds, prioritize by smallest gap
        if (!aHasEnough && !bHasEnough) {
          return a.diamondGap - b.diamondGap;
        }
        
        // Level 4: Prioritize by most diamonds
        if (a.diamonds !== b.diamonds) {
          return b.diamonds - a.diamonds;
        }
        
        // Level 5: Prioritize by lowest SL count
        return a.slCount - b.slCount;
      });
    } else if (lowerType === 'shop') {
      // IMPROVED: Sort Shop prioritizing accounts with pending orders first
      eligibleAccounts.sort((a, b) => {
        // Level 1: Prioritize accounts with pending orders for same user
        if (a.hasPendingOrder !== b.hasPendingOrder) {
          return a.hasPendingOrder ? -1 : 1;
        }
        
        // Level 2: Status pertemanan
        if (a.canGiftNow !== b.canGiftNow) {
          return a.canGiftNow ? -1 : 1;
        }
        
        if (a.isFriend !== b.isFriend) {
          return a.isFriend ? -1 : 1;
        }
        
        // Level 3: Gift quota gap terkecil
        if (a.quotaGap !== b.quotaGap) {
          return a.quotaGap - b.quotaGap;
        }
        
        // Level 4: Diamond gap terkecil
        if (a.diamondGap !== b.diamondGap) {
          return a.diamondGap - b.diamondGap;
        }
        
        // Level 5: Diamond sisa terbanyak
        return b.diamonds - a.diamonds;
      });
    } else if (lowerType === 'charisma') {
      // IMPROVED: Sort Charisma prioritizing accounts with pending orders first
      eligibleAccounts.sort((a, b) => {
        // Level 1: Prioritize accounts with pending orders for same user
        if (a.hasPendingOrder !== b.hasPendingOrder) {
          return a.hasPendingOrder ? -1 : 1;
        }
        
        // Level 2: Status pertemanan
        if (a.canGiftNow !== b.canGiftNow) {
          return a.canGiftNow ? -1 : 1;
        }
        
        if (a.isFriend !== b.isFriend) {
          return a.isFriend ? -1 : 1;
        }
        
        // Level 3: Gift quota terendah
        if (a.giftQuota !== b.giftQuota) {
          return a.giftQuota - b.giftQuota;
        }
        
        // Level 4: Diamond gap terkecil
        if (a.diamondGap !== b.diamondGap) {
          return a.diamondGap - b.diamondGap;
        }
        
        // Level 5: Diamond sisa terbanyak
        return b.diamonds - a.diamonds;
      });
    }
    
    // 7. Implementasi algoritma greedy untuk multi-order
    const invoices = [];
    let remainingOrders = orderQuantity;
    let manualOrderCount = 0;
    
    if (eligibleAccounts.length === 0) {
      // Tidak ada akun yang memenuhi syarat, proses manual
      manualOrderCount = orderQuantity;
    } else {
      // FIXED: Alokasikan order ke akun-akun eligible dengan perbaikan untuk akun yang diamond kurang
      for (const account of eligibleAccounts) {
        // Hitung berapa order yang bisa ditangani akun ini
        let maxOrdersForAccount;
        
        if (account.diamonds >= diamondPerOrder) {
          // Jika diamond cukup, bisa handle multiple order
          maxOrdersForAccount = Math.min(
            Math.floor(account.diamonds / diamondPerOrder),
            remainingOrders
          );
        } else if (isStarlight && account.diamondGap <= 300) {
          // Jika SL Basic dan diamond kurang tapi dalam toleransi gap, bisa handle 1 order
          maxOrdersForAccount = 1;
        } else if (!isStarlight && account.diamondGap <= 220) {
          // Jika Shop/Charisma dan diamond kurang tapi dalam toleransi gap, bisa handle 1 order
          maxOrdersForAccount = 1;
        } else {
          maxOrdersForAccount = 0;
        }
        
        // Jika akun bisa handle minimal 1 order
        if (maxOrdersForAccount > 0) {
          // Generate unique ref_id untuk invoice ini
          const ref_id = generateUniqueRefID();
          
          // Hitung total diamond untuk invoice ini
          const invoiceDiamondAmount = diamondPerOrder * maxOrdersForAccount;
          
          invoices.push({
            ref_id: ref_id,
            account: account,
            orderCount: maxOrdersForAccount,
            diamondAmount: invoiceDiamondAmount,
            harga: harga * maxOrdersForAccount / orderQuantity
          });
          
          remainingOrders -= maxOrdersForAccount;
          
          if (remainingOrders === 0) {
            break;
          }
        }
      }
      
      // Jika masih ada order yang belum teralokasi
      if (remainingOrders > 0) {
        manualOrderCount = remainingOrders;
      }
    }
    
    // 8. Jika semua order harus manual
    if (manualOrderCount === orderQuantity && invoices.length === 0) {
      const ref_id = generateUniqueRefID();
      
      // Update saldo user
      const saldoBaru = saldoAwal - harga;
      await userRef.update({
        saldo: saldoBaru,
        total_spend: admin.firestore.FieldValue.increment(harga),
        jumlah_transaksi_sukses: admin.firestore.FieldValue.increment(1),
        lastOrderTime: admin.firestore.FieldValue.serverTimestamp()
      });
      
      // Simpan history transaksi
      const historyData = {
        tanggal: admin.firestore.FieldValue.serverTimestamp(),
        produk: isStarlight ? 'SL Basic' : (lowerType === 'charisma' ? `Charisma ${diamondPerOrder}` : 'Shop Item'),
        tipe: isStarlight ? 'SL' : (lowerType === 'charisma' ? 'CHARISMA' : 'ITEM'),
        harga: harga,
        jumlah: orderQuantity,
        total: harga,
        tujuan: userId,
        zone: zoneId,
        invoice: ref_id,
        status: 'Pending',
        metode: 'Saldo',
        nicknameUser: nicknameUser,
        note: 'Diproses manual oleh owner'
      };
      
      // Tambahkan itemId jika itu shop item
      if (lowerType === 'shop' && itemId) {
        historyData.itemId = itemId;
      }
      
      await userRef.collection('transactions').doc(ref_id).set(historyData);
      
      // Simpan juga ke koleksi umum
      const globalHistData = {
        nomor,
        invoice: ref_id,
        produk: isStarlight ? 'SL Basic' : (lowerType === 'charisma' ? `Charisma ${diamondPerOrder}` : 'Shop Item'),
        tipe: isStarlight ? 'SL' : (lowerType === 'charisma' ? 'CHARISMA' : 'ITEM'),
        tujuan: userId,
        harga: harga,
        jumlah: orderQuantity,
        total: harga,
        waktu: admin.firestore.FieldValue.serverTimestamp(),
        status: 'Pending',
        metode: 'Saldo',
        nicknameUser: nicknameUser,
        note: 'Diproses manual oleh owner'
      };
      
      // Tambahkan itemId jika itu shop item
      if (lowerType === 'shop' && itemId) {
        globalHistData.itemId = itemId;
      }
      
      await db.collection('history_trx').doc(ref_id).set(globalHistData);
      
      // Kirim notifikasi ke user
      const productName = isStarlight ? 'SL Basic' : (lowerType === 'charisma' ? `Charisma ${diamondPerOrder}` : (itemId || 'Shop Item'));
      
      const notifUser = `✅〔 *ORDER DITERIMA* 〕✅

» *Invoice* : ${ref_id}
» *Jenis Order* : ${productName} × ${orderQuantity}
» *Harga* : Rp${harga.toLocaleString()}
» *Total Bayar* : Rp${harga.toLocaleString()}
» *Tujuan* : ${userId}
» *Nickname ML* : ${nicknameUser}
» *Waktu* : ${hariini}
» *Jam* : ${time1} WIB

Pesanan Anda telah kami data dan akan diproses segera. Kami akan menginformasikan Anda saat pesanan siap digunakan.

*${namaStore}*`;
      
      await client.sendMessage(m.chat, { text: notifUser }, { quoted: m });
      
      // Notifikasi ke owner
      const notifOwner = `*ORDER MANUAL ⚡*

*» Nama :* ${pushname}
*» Nomor :* ${nomor}
*» Role :* ${role}
*» Produk :* ${productName} × ${orderQuantity}
*» Tujuan :* ${userId}
*» Nickname ML :* ${nicknameUser}
*» Harga :* Rp${harga.toLocaleString()}
*» Invoice :* ${ref_id}

*Catatan: Tidak ada akun yang memenuhi syarat. Order ini perlu diproses manual.*

*${namaStore}*`;
      
      for (const own of global.owner) {
        await client.sendMessage(own + '@s.whatsapp.net', { text: notifOwner }, { quoted: m });
      }
      
      return; // End processing
    }
    
    // 9. Batch update untuk semua invoice otomatis
    const batch = db.batch();
    const timestamp = admin.firestore.FieldValue.serverTimestamp();
    
    // Update saldo user
    const saldoBaru = saldoAwal - harga;
    batch.update(userRef, {
      saldo: saldoBaru,
      total_spend: admin.firestore.FieldValue.increment(harga),
      jumlah_transaksi_sukses: admin.firestore.FieldValue.increment(1),
      lastOrderTime: timestamp
    });
    
    // Array untuk menyimpan akun-akun yang digunakan untuk notifikasi
    const usedAccounts = [];
    
    // Update untuk setiap invoice
    for (const invoice of invoices) {
      const accountRef = invoice.account.ref;
      usedAccounts.push(invoice.account);
      
      // Update akun MLBB
      batch.update(accountRef, {
        diamonds: admin.firestore.FieldValue.increment(-invoice.diamondAmount),
        updatedAt: timestamp
      });
      
      // Update gift quota jika produk menggunakan quota
      if (usesGiftQuota) {
        const quotaRef = accountRef.collection('gift_quota').doc('current');
        
        if (lowerType === 'charisma') {
          // Charisma menambah gift quota
          batch.set(quotaRef, {
            remaining: admin.firestore.FieldValue.increment(invoice.diamondAmount),
            updatedAt: timestamp
          }, { merge: true });
        } else {
          // Shop items mengurangi gift quota
          batch.set(quotaRef, {
            remaining: admin.firestore.FieldValue.increment(-invoice.diamondAmount),
            updatedAt: timestamp
          }, { merge: true });
        }
      }
      
      // Update SL counter jika produk adalah SL
      if (isStarlight) {
        const slRef = accountRef.collection('starlight_limits').doc(currentMonth);
        
        if (slType === 'basic') {
          batch.set(slRef, {
            month: currentMonth,
            basicCount: admin.firestore.FieldValue.increment(invoice.orderCount),
            updatedAt: timestamp
          }, { merge: true });
        } else {
          batch.set(slRef, {
            month: currentMonth,
            premiumCount: admin.firestore.FieldValue.increment(invoice.orderCount),
            updatedAt: timestamp
          }, { merge: true });
        }
      }
      
      // NEW: Add pending order entry
      const expiryDate = new Date(now);
      expiryDate.setDate(expiryDate.getDate() + 7); // 7 days from now
      
      // Set initial status based on friendship and order type
      let orderStatus;
      if (lowerType === 'charisma' || invoice.account.canGiftNow) {
        orderStatus = 'ready_to_gift';
      } else {
        orderStatus = 'waiting_friendship';
      }
      
      // Only add pending order if it's not charisma (which can be gifted immediately)
      if (lowerType !== 'charisma' || !invoice.account.canGiftNow) {
        const pendingOrderRef = accountRef.collection('pending_orders').doc(invoice.ref_id);
        batch.set(pendingOrderRef, {
          userId: userId,
          zoneId: zoneId,
          customerPhone: nomor,
          customerName: pushname,
          orderId: invoice.ref_id,
          orderType: isStarlight ? 'SL' : (lowerType === 'charisma' ? 'CHARISMA' : 'ITEM'),
          itemId: itemId,
          orderDate: timestamp,
          expiryDate: admin.firestore.Timestamp.fromDate(expiryDate),
          diamondAmount: invoice.diamondAmount,
          status: orderStatus,
          nicknameUser: nicknameUser
        });
        
        // Also mark the account as having pending orders
        batch.update(accountRef, { hasPendingOrders: true });
      }
      
      // Simpan history di users/{nomor}/transactions/{ref_id}
      const historyData = {
        tanggal: timestamp,
        produk: isStarlight ? 'SL Basic' : (lowerType === 'charisma' ? `Charisma ${diamondPerOrder}` : 'Item Shop'),
        tipe: isStarlight ? 'SL' : (lowerType === 'charisma' ? 'CHARISMA' : 'ITEM'),
        harga: invoice.harga,
        jumlah: invoice.orderCount,
        total: invoice.harga,
        tujuan: userId,
        zone: zoneId,
        invoice: invoice.ref_id,
        status: 'Sukses',
        metode: 'Saldo',
        nicknameUser: nicknameUser,
        mlbbAccount: invoice.account.id,
        diamondAmount: invoice.diamondAmount,
        friendshipStatus: invoice.account.isFriend 
          ? (invoice.account.canGiftNow ? 'eligible' : 'waiting') 
          : 'not_friend'
      };
      
      // Tambahkan itemId jika itu shop item
      if (lowerType === 'shop' && itemId) {
        historyData.itemId = itemId;
      }
      
      const histRef = userRef.collection('transactions').doc(invoice.ref_id);
      batch.set(histRef, historyData);
      
      // Simpan ke history transaksi global
      const globalHistData = {
        nomor,
        invoice: invoice.ref_id,
        produk: isStarlight ? 'SL Basic' : (lowerType === 'charisma' ? `Charisma ${diamondPerOrder}` : 'Item Shop'),
        tipe: isStarlight ? 'SL' : (lowerType === 'charisma' ? 'CHARISMA' : 'ITEM'),
        tujuan: userId,
        harga: invoice.harga,
        jumlah: invoice.orderCount,
        total: invoice.harga,
        waktu: timestamp,
        status: 'Sukses',
        metode: 'Saldo',
        nicknameUser: nicknameUser,
        mlbbAccount: invoice.account.id,
        diamondAmount: invoice.diamondAmount,
        friendshipStatus: invoice.account.isFriend 
          ? (invoice.account.canGiftNow ? 'eligible' : 'waiting') 
          : 'not_friend'
      };
      
      // Tambahkan itemId jika itu shop item
      if (lowerType === 'shop' && itemId) {
        globalHistData.itemId = itemId;
      }
      
      const globalHistRef = db.collection('history_trx').doc(invoice.ref_id);
      batch.set(globalHistRef, globalHistData);
      
      // Simpan juga ke history transaksi akun MLBB
      const accountHistRef = accountRef.collection('transaction_history').doc(invoice.ref_id);
      batch.set(accountHistRef, {
        timestamp: timestamp,
        type: isStarlight ? 'SL' : (lowerType === 'charisma' ? 'CHARISMA' : 'ITEM'),
        subtype: slType || lowerType,
        diamonds: invoice.diamondAmount,
        userPhone: nomor,
        userName: pushname,
        targetId: userId,
        targetZone: zoneId,
        targetName: nicknameUser,
        invoice: invoice.ref_id,
        itemId: itemId,
        friendshipStatus: invoice.account.isFriend 
          ? (invoice.account.canGiftNow ? 'eligible' : 'waiting') 
          : 'not_friend'
      });
    }
    
    // 10. Jika ada order manual, buat juga invoice manual
    let manualRef_id = null;
    
    if (manualOrderCount > 0) {
      manualRef_id = generateUniqueRefID();
      const manualHarga = harga * manualOrderCount / orderQuantity;
      
      // Simpan history transaksi manual
      const manualHistoryData = {
        tanggal: timestamp,
        produk: isStarlight ? 'SL Basic' : (lowerType === 'charisma' ? `Charisma ${diamondPerOrder}` : 'Item Shop'),
        tipe: isStarlight ? 'SL' : (lowerType === 'charisma' ? 'CHARISMA' : 'ITEM'),
        harga: manualHarga,
        jumlah: manualOrderCount,
        total: manualHarga,
        tujuan: userId,
        zone: zoneId,
        invoice: manualRef_id,
        status: 'Pending',
        metode: 'Saldo',
        nicknameUser: nicknameUser,
        note: 'Diproses manual oleh owner'
      };
      
      // Tambahkan itemId jika itu shop item
      if (lowerType === 'shop' && itemId) {
        manualHistoryData.itemId = itemId;
      }
      
      const manualHistRef = userRef.collection('transactions').doc(manualRef_id);
      batch.set(manualHistRef, manualHistoryData);
      
      // Simpan ke history transaksi global
      const manualGlobalHistData = {
        nomor,
        invoice: manualRef_id,
        produk: isStarlight ? 'SL Basic' : (lowerType === 'charisma' ? `Charisma ${diamondPerOrder}` : 'Item Shop'),
        tipe: isStarlight ? 'SL' : (lowerType === 'charisma' ? 'CHARISMA' : 'ITEM'),
        tujuan: userId,
        harga: manualHarga,
        jumlah: manualOrderCount,
        total: manualHarga,
        waktu: timestamp,
        status: 'Pending',
        metode: 'Saldo',
        nicknameUser: nicknameUser,
        note: 'Diproses manual oleh owner'
      };
      
      // Tambahkan itemId jika itu shop item
      if (lowerType === 'shop' && itemId) {
        manualGlobalHistData.itemId = itemId;
      }
      
      const manualGlobalHistRef = db.collection('history_trx').doc(manualRef_id);
      batch.set(manualGlobalHistRef, manualGlobalHistData);
    }
    
    // Eksekusi batch update
    await batch.commit();
    
    // 11. Kirim notifikasi
    const productName = isStarlight ? 'SL Basic' : (lowerType === 'charisma' ? `Charisma ${diamondPerOrder}` : (itemId || 'Shop Item'));
    
    // Format daftar akun untuk notifikasi
    let accountsList = '';
    for (let i = 0; i < usedAccounts.length; i++) {
      const acc = usedAccounts[i];
      accountsList += `» *ID ${i+1}* : ${acc.account.gameId || '-'}\n» *Nickname* : ${acc.account.nickname || 'Unknown'}\n`;
      
      // Tambahkan informasi status pertemanan
      if (acc.canGiftNow) {
        accountsList += `» *Status* : ✅ Sudah eligible\n`;
      } else if (acc.isFriend) {
        const remainingDays = 7 - acc.daysPassed;
        accountsList += `» *Status* : ⏳ Menunggu ${remainingDays} hari lagi\n`;
      } else {
        accountsList += `» *Status* : ❌ Belum berteman\n`;
      }
      
      if (i < usedAccounts.length - 1) accountsList += '\n';
    }
    
    let notifUser = '';
    let notifPriv = '';
    let notifOwner = '';
    
    if (manualOrderCount > 0 && invoices.length > 0) {
      // Case: Partial auto, partial manual
      notifUser = `✅〔 *TRANSAKSI DIPROSES* 〕✅

» *Invoice* : ${invoices[0].ref_id}${invoices.length > 1 ? ' dll.' : ''}
» *Jenis Order* : ${productName} × ${orderQuantity}
» *Harga* : Rp${harga.toLocaleString()}
» *Total Bayar* : Rp${harga.toLocaleString()}
» *Tujuan* : ${userId}
» *Nickname ML* : ${nicknameUser}
» *Waktu* : ${hariini}
» *Jam* : ${time1} WIB

──〔 *Akun MLBB yang Digunakan* 〕──
${accountsList}

Pesanan Anda sudah kami data dan akan diproses segera. Silahkan follow ID di atas untuk memudahkan proses gift. ${!usedAccounts[0].canGiftNow ? 'Jika sudah follow, tunggu 7 hari untuk proses gift.' : ''}

✓ *Order Otomatis* : ${orderQuantity - manualOrderCount} ${productName} telah diproses
✓ *Order Manual* : ${manualOrderCount} ${productName} akan diberikan oleh owner dalam waktu maksimal 24 jam.

*${namaStore}*`;
      
      notifPriv = `Kamu telah melakukan Pembelian *${productName} × ${orderQuantity}*

» *Harga* : Rp${harga.toLocaleString()}
» *Total Bayar* : Rp${harga.toLocaleString()}
» *Sisa Saldo* : Rp${saldoBaru.toLocaleString()}
» *Waktu* : ${time1} WIB
» *Tanggal* : ${hariini}

✓ *Order Otomatis* : ${orderQuantity - manualOrderCount} ${productName}
✓ *Order Manual* : ${manualOrderCount} ${productName} (diproses manual)

*${namaStore}*`;
      
      notifOwner = `*ORDER PARTIAL AUTO-MANUAL ⚡*

*» Nama :* ${pushname}
*» Nomor :* ${nomor}
*» Order Total :* ${productName} × ${orderQuantity}
*» Yang Diproses Otomatis :* ${orderQuantity - manualOrderCount} (Invoice: ${invoices.map(i => i.ref_id).join(', ')})
*» Yang Perlu Diproses Manual :* ${manualOrderCount} (Invoice: ${manualRef_id})
*» Tujuan :* ${userId}
*» Nickname ML :* ${nicknameUser}
*» Harga Total :* Rp${harga.toLocaleString()}

*Mohon proses manual untuk ${manualOrderCount} ${productName} yang tersisa.*

*${namaStore}*`;
    } else {
      // Case: Fully automatic
      if (lowerType === 'charisma') {
        notifUser = `✅〔 *TRANSAKSI SUKSES* 〕✅

» *Invoice* : ${invoices[0].ref_id}${invoices.length > 1 ? ' dll.' : ''}
» *Jenis Order* : ${productName} × ${orderQuantity}
» *Harga* : Rp${harga.toLocaleString()}
» *Total Bayar* : Rp${harga.toLocaleString()}
» *Tujuan* : ${userId}
» *Nickname ML* : ${nicknameUser}
» *Waktu* : ${hariini}
» *Jam* : ${time1} WIB

──〔 *Akun MLBB yang Digunakan* 〕──
${accountsList}

Charisma ${diamondPerOrder} akan dikirim dari akun di atas. Silahkan follow ID tersebut untuk memudahkan proses gift.

*${namaStore}*`;
      } else {
        notifUser = `✅〔 *TRANSAKSI SUKSES* 〕✅

» *Invoice* : ${invoices[0].ref_id}${invoices.length > 1 ? ' dll.' : ''}
» *Jenis Order* : ${productName} × ${orderQuantity}
» *Harga* : Rp${harga.toLocaleString()}
» *Total Bayar* : Rp${harga.toLocaleString()}
» *Tujuan* : ${userId}
» *Nickname ML* : ${nicknameUser}
» *Waktu* : ${hariini}
» *Jam* : ${time1} WIB

──〔 *Akun MLBB yang Digunakan* 〕──
${accountsList}

Pesanan Anda sudah kami data dan akan diproses segera. Silahkan follow ID di atas untuk memudahkan proses gift. ${!usedAccounts[0].canGiftNow ? 'Jika sudah follow, tunggu 7 hari untuk proses gift.' : ''}

*${namaStore}*`;
      }
      
      notifPriv = `Kamu telah melakukan Pembelian *${productName} × ${orderQuantity}*

» *Harga* : Rp${harga.toLocaleString()}
» *Total Bayar* : Rp${harga.toLocaleString()}
» *Sisa Saldo* : Rp${saldoBaru.toLocaleString()}
» *Waktu* : ${time1} WIB
» *Tanggal* : ${hariini}

*${namaStore}*`;
      
      notifOwner = `*TRANSAKSI SUKSES ⚡*

*» Nama :* ${pushname}
*» Nomor :* ${nomor}
*» Produk :* ${productName} × ${orderQuantity}
*» Tujuan :* ${userId}
*» Nickname ML :* ${nicknameUser}
*» Harga :* Rp${harga.toLocaleString()}
*» Total :* Rp${harga.toLocaleString()}
*» Sisa Saldo :* Rp${saldoBaru.toLocaleString()}

──〔 *Akun MLBB* 〕──
${usedAccounts.map((acc, idx) => `*Akun ${idx+1}:* ${acc.account.gameId} (${acc.account.nickname})
*» Sisa Diamond :* ${acc.diamonds - invoices[idx].diamondAmount}
*» ${lowerType === 'charisma' ? 'Gift Quota +' : 'Gift Quota -'}${invoices[idx].diamondAmount}*
*» Friendship :* ${acc.canGiftNow ? '✅ Eligible' : (acc.isFriend ? `⏳ Menunggu ${7 - acc.daysPassed} hari` : '❌ Belum berteman')}`).join('\n\n')}

*${namaStore}*`;
    }
    
    // Kirim notifikasi
    await client.sendMessage(m.chat, { text: notifUser }, { quoted: m });
    await client.sendMessage(sender, { text: notifPriv }, { quoted: m });
    
    for (const own of global.owner) {
      await client.sendMessage(own + '@s.whatsapp.net', { text: notifOwner }, { quoted: m });
    }
    
  } catch (err) {
    console.error('Buy Error:', err);
    return m.reply('❌ Terjadi kesalahan saat memproses transaksi.');
  }
  
  break;
}
case 'manualcleanup': {
  if (!isOwner) return m.reply('Hanya owner yang bisa.');
  await handleManualCleanup(m);
  break;
}

case 'checkallpending': {
  if (!isOwner) return m.reply('Hanya owner yang bisa.');
  await handleCheckAllPending(m);
  break;
}

case 'dailyreport': {
  if (!isOwner) return m.reply('Hanya owner yang bisa.');
  await handleDailyReport(m);
  break;
}
            
            
            case "depodigi": {
const _0x1fd07d=_0x13f2;(function(_0x54b75a,_0x190412){const _0x3009fb=_0x13f2,_0x3c2d53=_0x54b75a();while(!![]){try{const _0x3796b1=parseInt(_0x3009fb(0x1b3))/0x1+-parseInt(_0x3009fb(0x1b0))/0x2*(parseInt(_0x3009fb(0x1a1))/0x3)+parseInt(_0x3009fb(0x1a0))/0x4*(parseInt(_0x3009fb(0x198))/0x5)+parseInt(_0x3009fb(0x197))/0x6*(-parseInt(_0x3009fb(0x1b1))/0x7)+parseInt(_0x3009fb(0x196))/0x8*(-parseInt(_0x3009fb(0x1b5))/0x9)+parseInt(_0x3009fb(0x1bc))/0xa+-parseInt(_0x3009fb(0x1a3))/0xb*(-parseInt(_0x3009fb(0x199))/0xc);if(_0x3796b1===_0x190412)break;else _0x3c2d53['push'](_0x3c2d53['shift']());}catch(_0x6ad3b){_0x3c2d53['push'](_0x3c2d53['shift']());}}}(_0x55a3,0x8421c));if(!isCreator)throw mess[_0x1fd07d(0x1bb)];if(!text)return m.reply(_0x1fd07d(0x1b6)+(prefix+command)+_0x1fd07d(0x1bd)+(prefix+command)+_0x1fd07d(0x1a7));const nominal=parseInt(text[_0x1fd07d(0x19a)]('/')[0x0]),nama=text[_0x1fd07d(0x19a)]('/')[0x1],bankCode=text[_0x1fd07d(0x19a)]('/')[0x2];function _0x55a3(){const _0x3e846a=['catch','\x20200000/Tomi\x20Heneldra/BCA\x0a\x0a\x0aInformasi\x20Kode\x20Bank\x20:\x0a-\x20BCA\x0a-\x20MANDIRI\x0a-\x20BRI','json','_Maaf\x20ada\x20gangguan_','\x0a\x0aatas\x20nama\x20*Digiflazz\x20Interkoneksi\x20Indonesia*\x0a\x0aTotal\x20Deposit\x20:\x20Rp\x20','amount','sendText','log','\x0aCatatan\x20:\x20','notes','64164VbcODN','133735lhuRkT','reply','386595qpAzDZ','*_Kode\x20Bank\x20Tidak\x20Valid_*','9zyQCdb','DEPOSIT\x20SALDO\x20DIGIFLAZZ\x0a\x0a\x0aSilahkan\x20gunakan\x20dengan\x20cara\x20:\x0a','deposit','message','6042888890','data','owner','8475940VxkQfh','\x20[Nominal]/[Nama\x20Rekening]/[Kode\x20Bank]\x0a\x0aContoh\x20:\x20','POST','7142608Lxmcqa','312LNNdoL','5mVImqm','56496lHlXPN','split','\x20:\x20','application/json','then','toUpperCase','*_Harap\x20Isi\x20Kode\x20Bank\x20:\x20BCA/MANDIRI/BRI_*','2019476KbmZpP','36ncBCeB','1550009910111','2508bCLSgg','stringify','https://api.digiflazz.com/v1/deposit'];_0x55a3=function(){return _0x3e846a;};return _0x55a3();}if(!nominal)return m[_0x1fd07d(0x1b2)]('*_Harap\x20Isi\x20Nominal\x20Deposit\x20Kamu_*');if(!nama)return m[_0x1fd07d(0x1b2)]('*_Harap\x20Isi\x20Nama\x20Rekening\x20Kamu_*');if(!bankCode)return m['reply'](_0x1fd07d(0x19f));const bankMappings={'BCA':_0x1fd07d(0x1b9),'MANDIRI':_0x1fd07d(0x1a2),'BRI':'213501000291307'},signa=md5(username+apiKey+_0x1fd07d(0x1b7)),bankRekening=bankMappings[bankCode['toUpperCase']()];if(!bankRekening)return m['reply'](_0x1fd07d(0x1b4));const data={'username':username,'amount':nominal,'Bank':bankCode,'owner_name':nama,'sign':signa};function _0x13f2(_0x334f80,_0xaa82d2){const _0x55a3f3=_0x55a3();return _0x13f2=function(_0x13f2d5,_0x1361e3){_0x13f2d5=_0x13f2d5-0x195;let _0x1f6b61=_0x55a3f3[_0x13f2d5];return _0x1f6b61;},_0x13f2(_0x334f80,_0xaa82d2);}fetch(_0x1fd07d(0x1a5),{'method':_0x1fd07d(0x195),'body':JSON[_0x1fd07d(0x1a4)](data),'headers':{'Content-Type':_0x1fd07d(0x19c)}})[_0x1fd07d(0x19d)](_0x141e5b=>_0x141e5b[_0x1fd07d(0x1a8)]())[_0x1fd07d(0x19d)](_0x79bff3=>{const _0x160750=_0x1fd07d;console[_0x160750(0x1ad)](_0x79bff3);if(_0x79bff3['data']['rc']===0x40)return m['reply'](_0x79bff3[_0x160750(0x1ba)][_0x160750(0x1b8)]);const _0x20e8f4='Silahkan\x20Lakukan\x20pembayaran\x20ke\x20Rekening\x20Digiflazz\x20Sesuai\x20Bank\x20Tujuan\x20:\x0a\x0aRekening\x20Bank:\x20'+bankCode[_0x160750(0x19e)]()+_0x160750(0x19b)+bankRekening+_0x160750(0x1aa)+_0x79bff3['data'][_0x160750(0x1ab)]+_0x160750(0x1ae)+_0x79bff3['data'][_0x160750(0x1af)];client[_0x160750(0x1ac)](m['chat'],_0x20e8f4,m);})[_0x1fd07d(0x1a6)](_0x2ce0c2=>{const _0xa5a2da=_0x1fd07d;m[_0xa5a2da(0x1b2)](_0xa5a2da(0x1a9));});
break;
};
      default:
    }
  } catch (err) {
    m.reply(util.format(err))
  }
}
let file = require.resolve(__filename)
fs.watchFile(file, () => {
  fs.unwatchFile(file)
  console.log(chalk.redBright(`Update ${__filename}`))
  delete require.cache[file]
  require(file)
})