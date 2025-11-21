require('./db/config')
let autoGetLayanan = false;
let intervalId;
let antilinkEnabled = false;

const { BufferJSON, WA_DEFAULT_EPHEMERAL, makeWASocket, useMultiFileAuthState, getAggregateVotesInPollMessage, generateWAMessageFromContent, proto, generateWAMessageContent, generateWAMessage, prepareWAMessageMedia, downloadContentFromMessage, areJidsSameUser, getContentType, jidDecode } = require("@whiskeysockets/baileys")
const fs = require('fs')
const pino = require('pino')
const pushname = m.pushName || "No Name"
let defaultMarkupPercentage = 0.01; 
const { firefox } = require('playwright');

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
const { createCanvas, loadImage } = require('canvas')

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
    const ticketsData = './db/tickets.json';
    const db = admin.firestore();

      
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
    
    // ========== REUSABLE ROLE CHECKER FUNCTION ==========
    const getUserRole = async (jid = m.sender) => {
      try {
        const firestore = admin.firestore();
        // Normalize JID format
        let normalizedJid = jid;
        if (!jid.includes('@s.whatsapp.net')) {
          const phoneOnly = jid.replace(/[^0-9]/g, '');
          normalizedJid = phoneOnly + '@s.whatsapp.net';
        }
        
        const userDoc = await firestore.collection('users').doc(normalizedJid).get();
        if (userDoc.exists && userDoc.data().role) {
          return userDoc.data().role;
        }
      } catch (err) {
        console.log('Warning: Firestore role check failed:', err.message);
      }
      return 'user'; // default role
    };
    
    // ========== ROLE SYSTEM FROM FIRESTORE ==========
    let userRole = 'user'; // default role
    try {
      const firestore = admin.firestore();
      
      // Extract phone number using same logic as bukti_transfer (yang berhasil!)
      // Priority 1: m.key.senderPn jika ada
      let phoneNumber = null;
      if (m.key?.senderPn) {
        phoneNumber = m.key.senderPn.split('@')[0];
      }
      
      // Priority 2: fallback ke m.sender (ini yang selalu berhasil!)
      if (!phoneNumber && m.sender) {
        phoneNumber = m.sender.split('@')[0];
      }
      
      // Build JID untuk lookup di Firestore
      const lookupJid = phoneNumber + '@s.whatsapp.net';
      
      const userDoc = await firestore.collection('users').doc(lookupJid).get();
      if (userDoc.exists) {
        userRole = userDoc.data().role || 'user';
      }
    } catch (err) {
      console.log(color(`[ROLE_CHECK_ERROR] ${err.message}`, 'red'));
    }
    
    const isAdmin = userRole === 'admin' || isOwner; // Admin + Owner
    const isDeveloper = isOwner; // Only Owner (Developer)
    
    const sender = m.isGroup ? (m.key.participant ? m.key.participant : m.participant) : m.key.remoteJid
    
    // Helper function untuk extract nomor HP yang benar dari JID
    const extractPhoneNumber = (jid) => {
      try {
        // Decode JID menggunakan jidDecode
        const decoded = jidDecode(jid);
        if (decoded && decoded.user) {
          return decoded.user;
        }
      } catch (e) {
        // Fallback jika jidDecode gagal
      }
      
      // Fallback: extract dari string
      let phone = jid.split('@')[0];
      // Handle format dengan colon
      if (phone.includes(':')) {
        phone = phone.split(':').pop();
      }
      // Remove leading zeros/plus
      phone = phone.replace(/^0+/, '').replace(/^\+/, '');
      return phone;
    };
    
    const groupMetadata = m.isGroup ? await client.groupMetadata(from).catch(e => {}) : ''
    const groupName = m.isGroup ? groupMetadata.subject : ''
    const participants = m.isGroup ? await groupMetadata.participants : ''
    const groupAdmins = m.isGroup ? await getGroupAdmins(participants) : ''
    const isBotAdmins = m.isGroup ? groupAdmins.includes(botNumber) : false
    const isAdmins = m.isGroup ? groupAdmins.includes(m.sender) : false
    const isGroup = m.key.remoteJid.endsWith('@g.us')
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

// Generate ticket dengan QR overlay ke template poster
async function generateTicketWithQR(ticketData, qrCodePath, templatePath) {
  try {
    // Load template image
    const template = await loadImage(templatePath);
    const canvas = createCanvas(template.width, template.height);
    const ctx = canvas.getContext("2d");
    
    // Draw template background
    ctx.drawImage(template, 0, 0, canvas.width, canvas.height);
    
    // Load QR code image
    if (fs.existsSync(qrCodePath)) {
      const qrImage = await loadImage(qrCodePath);
      
      // Position QR di panel merah (kanan)
      // Panel merah mulai dari 73% lebar canvas
      const panelStartX = canvas.width * 0.73; // Panel merah mulai dari 73% lebar
      const panelWidth = canvas.width * 0.27; // Lebar panel 27%
      
      // QR size disesuaikan dengan panel merah (lebih kecil)
      const qrSize = Math.min(panelWidth * 0.7, canvas.height * 0.4); // 70% dari panel width
      const qrX = panelStartX + (panelWidth - qrSize) / 2; // Center dalam panel merah
      const qrY = canvas.height * 0.35; // Posisi vertikal 35% dari atas
      
      // Draw white background for QR (padding)
      const padding = 15;
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(qrX - padding, qrY - padding, qrSize + (padding * 2), qrSize + (padding * 2));
      
      // Draw QR code
      ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);
    }
    
    // Add ticket info text - semua di panel merah
    const panelCenterX = canvas.width * 0.865; // Center dari panel merah (86.5% dari total width)
    
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 20px Arial";
    ctx.textAlign = "center";
    ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
    ctx.shadowBlur = 5;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;
    
    // Ticket ID di atas QR
    ctx.fillText(`TICKET ID`, panelCenterX, canvas.height * 0.15);
    ctx.font = "bold 16px Arial";
    ctx.fillText(ticketData.ticketID, panelCenterX, canvas.height * 0.20);
    
    // Buyer name dan info di bawah QR
    ctx.font = "bold 18px Arial";
    const qrBottomY = canvas.height * 0.35 + (canvas.height * 0.4 * 0.7); // Posisi bawah QR
    ctx.fillText(ticketData.buyerName, panelCenterX, qrBottomY + 40);
    
    ctx.font = "16px Arial";
    ctx.fillText(ticketData.konser, panelCenterX, qrBottomY + 65);
    
    ctx.font = "bold 16px Arial";
    ctx.fillText(`Rp ${ticketData.harga.toLocaleString('id-ID')}`, panelCenterX, qrBottomY + 90);
    
    // Save to file
    const outputDir = path.join(__dirname, "db/tickets/");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const outputPath = path.join(outputDir, `Ticket_${ticketData.ticketID}.png`);
    const buffer = canvas.toBuffer("image/png");
    fs.writeFileSync(outputPath, buffer);
    
    console.log(`✅ Ticket image generated: ${outputPath}`);
    return outputPath;
  } catch (error) {
    console.error('❌ Error generating ticket:', error.message);
    throw error;
  }
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
   const mentionByTag = (m && m.mtype === "extendedTextMessage" && m.message && m.message.extendedTextMessage && m.message.extendedTextMessage.contextInfo && m.message.extendedTextMessage.contextInfo.mentionedJid) ? m.message.extendedTextMessage.contextInfo.mentionedJid : [];
	
const Input = Array.isArray(mentionByTag) && mentionByTag.length > 0 ? mentionByTag[0] : (q ? numberQuery : false);
	
    if (!client.public) {
      if (!m.key.fromMe) return
    }
    
    // Log hanya private messages, ignore group messages
    if (m.message && !m.isGroup) {
      // Extract phone number with proper fallback chain
      let userPhone = m.key?.senderPn; // Priority 1: senderPn (most reliable)
      if (!userPhone && m.sender) {
        userPhone = m.sender.split("@")[0]; // Priority 2: extract from sender JID
      }
      if (!userPhone) {
        userPhone = 'Unknown'; // Fallback
      }
      console.log(chalk.red(chalk.bgBlack('[ PESAN ] => ')), chalk.white(chalk.bgBlack(budy || m.mtype)) + '\n' + chalk.magenta('=> Dari'), chalk.green(pushname), chalk.yellow(userPhone) + '\n' + chalk.blueBright('=> Di'), chalk.green('Private Chat'), chalk.magenta(`\nJam :`) + time1)
    }

    // Ignore group messages untuk command processing
    if (m.isGroup) return


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

      // middleware semua command di private chat, kecuali admin/owner
     /*
      if (!m.isGroup && ! global.owner.includes(m.sender.split("@")[0])) {
          return;
      }
      */
      m.body = m.body || ''
      
    // ============= HELPER FUNCTIONS UNTUK STRUK =============
    const generateTicketStruk = (data) => {
      const { invoice, concert, price, buyerName, buyerPhone, status } = data;
      const moment = require('moment-timezone');
      const txDate = moment.tz('Asia/Jakarta').format('dddd, DD MMMM YYYY');
      const txTime = moment.tz('Asia/Jakarta').format('HH:mm:ss');
      
      if (status === 'pending') {
        return `🔄 *PESANAN DIPROSES - PENDING*

> Invoice : ${invoice}
> Konser : ${concert}
> Harga : Rp ${price.toLocaleString('id-ID')}
┈ׅ──ׄ─꯭─꯭──────꯭ׄ──ׅ┈

⏳ *Menunggu verifikasi pembayaran...*`;
      }
      
      if (status === 'success') {
        return `✅ *TIKET BERHASIL DIBELI*

> Invoice : ${invoice}
> Konser : ${concert}
> Harga : Rp ${price.toLocaleString('id-ID')}
> Pembeli : ${buyerName}
> Telepon : ${buyerPhone}
┈ׅ──ׄ─꯭─꯭──────꯭ׄ──ׅ┈

� *STRUK PEMBELIAN*
> Tanggal : ${txDate}
> Jam : ${txTime} WIB
┈ׅ──ׄ─꯭─꯭──────꯭ׄ──ׅ┈

🎫 Tiket akan dikirim melalui chat
> Silahkan cek pesan berikutnya`;
      }
      
      if (status === 'failed') {
        return `❌ *PEMBELIAN GAGAL*

> Invoice : ${invoice}
> Konser : ${concert}
> Harga : Rp ${price.toLocaleString('id-ID')}
┈ׅ──ׄ─꯭─꯭──────꯭ׄ──ׅ┈

⚠️ *Pembayaran tidak terverifikasi*
> Silahkan hubungi admin untuk info`;
      }
    };

    const sendNotifToOwner = (data) => {
      const { invoice, concert, price, buyerName, buyerPhone, status } = data;
      const moment = require('moment-timezone');
      const txDate = moment.tz('Asia/Jakarta').format('DD/MM/YYYY HH:mm:ss');
      
      if (status === 'success') {
        return `✅ *NOTIFIKASI PEMBELIAN TIKET*

> Invoice : ${invoice}
> Pembeli : ${buyerName}
> Telepon : ${buyerPhone}
> Konser : ${concert}
> Harga : Rp ${price.toLocaleString('id-ID')}
> Waktu : ${txDate}
┈ׅ──ׄ─꯭─꯭──────꯭ׄ──ׅ┈

_Silahkan proses pengiriman tiket_`;
      }
      
      if (status === 'failed') {
        return `⚠️ *NOTIFIKASI GAGAL PEMBAYARAN*

> Invoice : ${invoice}
> Pembeli : ${buyerName}
> Telepon : ${buyerPhone}
> Konser : ${concert}
> Harga : Rp ${price.toLocaleString('id-ID')}
> Waktu : ${txDate}
┈ׅ──ׄ─꯭─꯭──────꯭ׄ──ׅ┈

_Pembayaran tidak terverifikasi - hubungi user_`;
      }
    };
    
    switch (command) {

case 'menu': {
  try {
    const firestore = admin.firestore();
    const konserSnapshot = await firestore.collection('concerts').where('status', '==', 'aktif').get();
    
    if (konserSnapshot.empty) {
      return m.reply('❌ Belum ada konser yang tersedia. Hubungi admin!');
    }

    let menuText = `🎫 *TIKET KONSER UMBANDUNG FEST* 🎫

> Pilih konser yang ingin Anda beli:
┈ׅ──ׄ─꯭─꯭──────꯭ׄ──ׅ┈\n`;

    let index = 1;
    konserSnapshot.forEach(doc => {
      const data = doc.data();
      menuText += `\n${index}. *${data.nama}*
> Tanggal : ${data.tanggal}
> Jam : ${data.jam}
> Harga : Rp ${data.harga.toLocaleString('id-ID')}
> Status : ✅
┈ׅ──ׄ─꯭─꯭──────꯭ׄ──ׅ┈`;
      index++;
    });

    menuText += `\n> Balas dengan: .order
> Untuk melihat detail & memesan tiket`;

    m.reply(menuText);
  } catch (err) {
    m.reply(`❌ Error: ${err.message}`);
  }
  break;
}

case 'help': {
  try {
    let helpText = '';
    
    if (isOwner) {
      // DEVELOPER/OWNER COMMANDS
      helpText = `👨‍💻 *DEVELOPER COMMANDS*
> Akses penuh ke semua fitur
┈ׅ──ׄ─꯭─꯭──────꯭ׄ──ׅ┈

1. *MANAJEMEN KONSER*
> \`.setup_konser\` [nama] | [tgl] | [jam] | [lokasi] | [harga] | [stok] | [deskripsi]
> \`.confirm_setup\`
┈ׅ──ׄ─꯭─꯭──────꯭ׄ──ׅ┈

2. *MANAJEMEN ROLE*
> \`.addrole\` [nomor] [role]
> \`.removerole\` [nomor]
> \`.getrole\` [nomor]
> \`.addadmin\` [nomor]
> \`.rmadmin\` [nomor]
┈ׅ──ׄ─꯭─꯭──────꯭ׄ──ׅ┈

3. *LIHAT TRANSAKSI*
> \`.riwayat\`
> \`.riwayat pending\`
> \`.riwayat acc\`
> \`.riwayat reject\`
> \`.riwayat\` [nomor_hp]
┈ׅ──ׄ─꯭─꯭──────꯭ׄ──ׅ┈

4. *SISTEM*
> \`.setbot\` [key] [value]
> \`.ping\`
> \`.menu\`
┈ׅ──ׄ─꯭─꯭──────꯭ׄ──ׅ┈`;

    } else if (userRole === 'admin') {
      // ADMIN COMMANDS
      helpText = `👨‍💼 *ADMIN COMMANDS*
> Kelola tiket & verifikasi pembayaran
┈ׅ──ׄ─꯭─꯭──────꯭ׄ──ׅ┈

1. *VERIFIKASI PEMBAYARAN*
> \`.show\` [refID]
> \`.acc\` [refID]
> \`.reject\` [refID] [alasan]
┈ׅ──ׄ─꯭─꯭──────꯭ׄ──ׅ┈

2. *LIHAT TRANSAKSI*
> \`.riwayat\`
> \`.riwayat pending\`
> \`.riwayat acc\`
> \`.riwayat reject\`
> \`.riwayat\` [nomor_hp]
┈ׅ──��─꯭─꯭──────꯭ׄ──ׅ┈

3. *SISTEM*
> \`.ping\`
> \`.menu\`
┈ׅ──ׄ─꯭─꯭──────꯭ׄ──ׅ┈

⚠️ *BATASAN ADMIN:*
> ❌ Tidak bisa order tiket
> ❌ Tidak bisa checkout
> ❌ Tidak bisa upload bukti transfer
┈ׅ──ׄ─꯭─꯭──────꯭ׄ──ׅ┈`;

    } else {
      // USER/REGULAR COMMANDS
      helpText = `👤 *USER COMMANDS*
> Pesan dan beli tiket konser
┈ׅ──ׄ─꯭─꯭──────꯭ׄ──ׅ┈

1. *PEMBELIAN TIKET*
> \`.menu\`
> \`.order\`
> \`.payment\` 
> \`.bukti_tf\` [jumlah] [catatan]
┈ׅ──ׄ─꯭─꯭──────꯭ׄ──ׅ┈

2. *LIHAT RIWAYAT*
> \`.riwayat\`
> \`.riwayat tiket\`
┈ׅ──ׄ─꯭─꯭──────꯭ׄ──ׅ┈

3. *SISTEM*
> \`.ping\`
> \`.help\`
┈ׅ──ׄ─꯭─꯭──────꯭ׄ──ׅ┈

💡 *CATATAN PENTING:*
> ✅ Command hanya bekerja di private chat
> ✅ Screenshot bukti harus jelas
> ✅ Verifikasi maksimal 5 menit
┈ׅ──ׄ─꯭─꯭──────꯭ׄ──ׅ┈`;
    }
    
    m.reply(helpText);
  } catch (err) {
    m.reply(`❌ Error: ${err.message}`);
  }
  break;
}

case 'order': {
  if (isAdmin && !isOwner) return m.reply('❌ Admin tidak bisa order tiket! Hanya user biasa.');
  
  try {
    const firestore = admin.firestore();
    const konserSnapshot = await firestore.collection('concerts').where('status', '==', 'aktif').get();
    
    if (konserSnapshot.empty) {
      return m.reply('❌ Belum ada konser tersedia!');
    }

    const konserArray = [];
    konserSnapshot.forEach(doc => {
      konserArray.push({ id: doc.id, ...doc.data() });
    });

    // Jika hanya 1 konser, langsung tampilkan detail
    if (konserArray.length === 1) {
      const konser = konserArray[0];
      
      // Fetch admin contact dari Firestore
      let adminInfo = '';
      try {
        const adminsSnapshot = await firestore.collection('users').where('role', '==', 'admin').get();
        if (!adminsSnapshot.empty) {
          adminInfo = '\n\n👨‍💼 *HUBUNGI ADMIN:*';
          let adminCount = 1;
          adminsSnapshot.forEach(doc => {
            const adminData = doc.data();
            const adminPhone = adminData.phone || doc.id.split('@')[0];
            const adminName = adminData.name || 'Admin ' + adminCount;
            adminInfo += `\n${adminCount}. ${adminName}\n> wa.me/${adminPhone}`;
            adminCount++;
          });
        }
      } catch (err) {
        console.log('Warning: Gagal fetch admin:', err.message);
      }
      
      const orderText = `📋 *DETAIL TIKET KONSER*

🎤 *${konser.nama}*
> Event : ${konser.nama}
> Tanggal : ${konser.tanggal}
> Jam : ${konser.jam}
> Lokasi : ${konser.lokasi}
> Harga : Rp ${konser.harga.toLocaleString('id-ID')}
> Info : ${konser.deskripsi}
┈ׅ──ׄ─꯭─꯭──────꯭ׄ──ׅ┈

📸 *UNTUK ORDER:*
> Balas .payment untuk lanjut ke pembayaran`;
      return m.reply(orderText);
    }

    // Jika lebih dari 1 konser, tampilkan list
    let menuText = `🎫 *PILIH KONSER YANG INGIN DIBELI*

> Tersedia ${konserArray.length} konser:
┈ׅ──ׄ─꯭─꯭──────꯭ׄ──ׅ┈\n`;

    konserArray.forEach((konser, index) => {
      menuText += `\n${index + 1}. *${konser.nama}*
> Tanggal : ${konser.tanggal}
> Jam : ${konser.jam}
> Harga : Rp ${konser.harga.toLocaleString('id-ID')}
> Stok : ${konser.stokTersisa} tiket
┈ׅ──ׄ─꯭─꯭──────꯭ׄ──ׅ┈`;
    });

    menuText += `\n*Untuk melihat detail setiap konser:*
> Balas nomor: 1, 2, 3, dst

> Atau gunakan .menu untuk melihat info lengkap`;

    m.reply(menuText);
  } catch (err) {
    m.reply(`❌ Error: ${err.message}`);
  }
  break;
}


case 'checkout':
case 'payment':
case 'pay':
case 'bayar':
case 'pembayaran': {
  if (isAdmin && !isOwner) return m.reply('❌ Admin tidak bisa checkout! Hanya user biasa.');
  
  try {
    const firestore = admin.firestore();
    
    // Fetch admin contact from Firestore
    let adminInfo = '';
    try {
      const adminsSnapshot = await firestore.collection('users').where('role', '==', 'admin').get();
      if (!adminsSnapshot.empty) {
        adminInfo = '\n👨‍💼 *HUBUNGI ADMIN UNTUK BANTUAN LAIN:*';
        let adminCount = 1;
        adminsSnapshot.forEach(doc => {
          const adminData = doc.data();
          const adminPhone = adminData.phone || doc.id.split('@')[0];
          const adminName = adminData.name || 'Admin ' + adminCount;
          adminInfo += `\n${adminCount}. ${adminName}\n> Nomor: ${adminPhone}`;
          adminCount++;
        });
        adminInfo += '\n┈ׅ──ׄ─꯭─꯭──────꯭ׄ──ׅ┈';
      }
    } catch (err) {
      console.log('Warning: Gagal fetch admin dari Firestore:', err.message);
    }
    
    const paymentText = `💳 *INFORMASI PEMBAYARAN TIKET*

Silahkan lakukan pembayaran ke rekening di bawah ini:
┈ׅ──ׄ─꯭─꯭──────꯭ׄ──ׅ┈

🏦 *TRANSFER BANK (ATM/E-Banking/Mobile Banking)*
> Bank : BJB (Bank Jabar Banten)
> Rekening : 01053079196100
> Atas Nama : Abdullah Gimnastiar
> Nominal : Sesuai harga tiket yang dipilih
┈ׅ──ׄ─꯭─꯭──────꯭ׄ──ׅ┈

⏱️ *VERIFIKASI PEMBAYARAN*
> Waktu verifikasi : 5-10 menit maks 24 jam
> Jika sudah ter-verifikasi : Tiket akan dikirim otomatis
> Jika belum ter-verifikasi : Hubungi admin
┈ׅ──ׄ─꯭─꯭──────꯭ׄ──ׅ┈

📸 *LANGKAH SELANJUTNYA:*
1. Lakukan transfer sesuai nominal
2. Kirim screenshot bukti transfer dengan: .bukti_transfer [nominal] [catatan]
3. Tunggu verifikasi admin (maksimal 5 menit)
4. Tiket akan otomatis dikirim setelah diverifikasi
┈ׅ──ׄ─꯭─꯭──────꯭ׄ──ׅ┈${adminInfo}

💡 *TIPS:*
> Pastikan nominal yang ditransfer sesuai dengan harga tiket
> Screenshot harus jelas menunjukkan nomor rekening, nominal, dan waktu transfer
> Jangan lupa sertakan informasi tiket apa yang dibeli di catatan`;

    m.reply(paymentText);
  } catch (err) {
    m.reply(`❌ Error: ${err.message}`);
  }
  break;
}

case 'setup_konser': {
  if (!isOwner) return m.reply('❌ Hanya owner yang bisa setup konser!');
  
  const setupGuide = `📋 *FORM SETUP KONSER*

Silahkan isi data konser dengan format di bawah:
┈ׅ──ׄ─꯭─꯭──────꯭ׄ──ׅ┈

*Kirim dengan format:*
\`.setup_konser\` [nama] | [tgl] | [jam] | [lokasi] | [harga] | [stok] | [deskripsi]

*Contoh:*
\`.setup_konser UMBandung Fest | 29/11/2025 | 10:00 WIB | Lapang Adymic UM Bandung | 25000 | 2500 | UMBandung Festival\`

┈ׅ──ׄ─꯭─꯭──────꯭ׄ──ׅ┈
*Format Detail:*
> [nama] = Nama konser/event
> [tgl] = DD/MM/YYYY
> [jam] = HH:mm WIB
> [lokasi] = Nama venue
> [harga] = Nominal (angka)
> [stok] = Jumlah tiket
> [deskripsi] = Info tambahan
┈ׅ──ׄ─꯭─꯭──────꯭ׄ──ׅ┈`;

  if (!text || !text.includes('|')) {
    return m.reply(setupGuide);
  }

  try {
    const parts = text.split('|').map(p => p.trim());
    
    if (parts.length !== 7) {
      return m.reply(`❌ Format salah!\nHarus 7 parameter, tapi yang dikirim: ${parts.length}\n\n${setupGuide}`);
    }

    const [nama, tanggal, jam, lokasi, harga, stok, deskripsi] = parts;
    
    // Validasi format
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(tanggal)) {
      return m.reply('❌ Format tanggal salah! Gunakan DD/MM/YYYY\nContoh: 29/11/2025');
    }
    
    if (!/^\d{2}:\d{2}\s*WIB$/i.test(jam)) {
      return m.reply('❌ Format jam salah! Gunakan HH:mm WIB\nContoh: 10:00 WIB');
    }
    
    const hargaNum = parseInt(harga);
    const stokNum = parseInt(stok);
    
    if (isNaN(hargaNum) || isNaN(stokNum)) {
      return m.reply('❌ Harga dan stok harus berupa angka!');
    }

    // Preview data sebelum disimpan
    const previewText = `✅ *PREVIEW DATA KONSER*

> Nama : ${nama}
> Tanggal : ${tanggal}
> Jam : ${jam}
> Lokasi : ${lokasi}
> Harga : Rp ${hargaNum.toLocaleString('id-ID')}
> Stok : ${stokNum} tiket
> Deskripsi : ${deskripsi}
┈ׅ──ׄ─꯭─꯭──────꯭ׄ──ׅ┈

*Konfirmasi?*
Balas dengan: \`.confirm_setup\` untuk lanjut
atau \`.batal\` untuk batalkan`;

    // Simpan ke temporary storage
    global.setupTempData = {
      nama, tanggal, jam, lokasi, hargaNum, stokNum, deskripsi,
      createdBy: m.sender,
      createdAt: new Date()
    };

    m.reply(previewText);

  } catch (err) {
    m.reply(`❌ Error: ${err.message}`);
  }
  break;
}

case 'confirm_setup': {
  if (!isOwner) return m.reply('❌ Hanya owner yang bisa!');
  if (!global.setupTempData) return m.reply('❌ Tidak ada data setup yang pending!');

  try {
    const firestore = admin.firestore();
    const { nama, tanggal, jam, lokasi, hargaNum, stokNum, deskripsi, createdBy, createdAt } = global.setupTempData;

    // Generate konser ID
    const konserRef = firestore.collection('concerts').doc();
    const konserData = {
      konserID: konserRef.id,
      nama: nama,
      tanggal: tanggal,
      jam: jam,
      lokasi: lokasi,
      harga: hargaNum,
      stokAwal: stokNum,
      stokTersisa: stokNum,
      deskripsi: deskripsi,
      status: 'aktif',
      dibuat: new Date(),
      dibuatOleh: createdBy,
      diupdate: new Date()
    };

    await konserRef.set(konserData);

    const successText = `✅ *KONSER BERHASIL DISIMPAN!*

> Konser ID : ${konserRef.id}
> Nama : ${nama}
> Tanggal : ${tanggal}
> Stok : ${stokNum} tiket
┈ׅ──ׄ─꯭─꯭──────꯭ׄ──ׅ┈

Sekarang user bisa melihat dengan: \`.menu\`
Dan pesan tiket dengan: \`.order\``;

    m.reply(successText);
    
    // Hapus temporary data
    delete global.setupTempData;

  } catch (err) {
    m.reply(`❌ Error menyimpan data: ${err.message}`);
  }
  break;
}

case 'batal': {
  if (global.setupTempData) {
    delete global.setupTempData;
    m.reply('❌ Setup konser dibatalkan!');
  } else {
    m.reply('❌ Tidak ada yang perlu dibatalkan!');
  }
  break;
}

case 'bukti':
case 'bukti_tf':
case 'bukti_transfer': {
  if (isAdmin && !isOwner) return m.reply('❌ Admin tidak bisa upload bukti! Hanya user biasa.');
  
  // Support 2 cara: reply ke gambar, atau kirim gambar langsung dengan caption
  let hasImage = false;
  let jumlah = null;
  let catatan = '';
  
  // Method 1: Reply ke gambar (old way)
  if (m.quoted && m.quoted.mtype && m.quoted.mtype.includes('imageMessage')) {
    hasImage = true;
    if (!text) {
      return m.reply('Format: .bukti_tf [jumlah] [catatan]\nContoh: .bukti_tf 25000 1 tiket UMBandung Fest');
    }
    const parts = text.split(' ');
    jumlah = parseInt(parts[0]);
    catatan = parts.slice(1).join(' ');
  }
  // Method 2: Direct image with caption (new way)
  else if (m.mtype && m.mtype.includes('imageMessage')) {
    hasImage = true;
    if (!text) {
      return m.reply(`📤 *FORMAT KIRIM BUKTI TRANSFER*

Kirim gambar + caption dengan format:
.bukti_tf [jumlah] [catatan]

*Contoh:*
Kirim screenshot + tulis: .bukti_tf 25000 1 tiket UMBandung Fest

⚠️ *PENTING:*
> Screenshot harus jelas
> Berisi nama rekening, jumlah, dan waktu transfer
> Admin akan verifikasi dalam 5 menit`);
    }
    const parts = text.split(' ');
    jumlah = parseInt(parts[0]);
    catatan = parts.slice(1).join(' ');
  }
  // Method 3: Show help if no image
  else {
    return m.reply(`📤 *FORMAT KIRIM BUKTI TRANSFER*

✅ *Cara Terbaru (PALING MUDAH):*
Kirim screenshot bukti transfer dengan caption:
.bukti_tf [jumlah] [catatan]

*Contoh:*
Kirim gambar + tuliskan:
.bukti_tf 25000 1 tiket UMBandung Fest

✅ *Cara Lama (Masih Bisa):*
1. Kirim screenshot bukti transfer
2. Reply screenshot dengan: .bukti_tf [jumlah] [catatan]

⚠️ *PENTING:*
> Screenshot harus jelas
> Berisi nama rekening, jumlah, dan waktu transfer
> Admin akan verifikasi dalam 5 menit`);
  }
  
  if (!hasImage) {
    return m.reply('❌ Tidak ada gambar yang terdeteksi!');
  }
  
  if (isNaN(jumlah)) {
    return m.reply('❌ Jumlah harus berupa angka!\nContoh: .bukti_tf 25000 1 tiket');
  }

  try {

    // Download image
    const timestamp = Date.now();
    const tmpFileName = `bukti_${timestamp}.jpg`;
    const tmpFilePath = `./tmp/${tmpFileName}`;

    // Ensure tmp directory exists
    const tmpDir = './tmp';
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }

    // Download media to temp
    await downloadAndSaveMediaMessage('image', tmpFilePath);

    // Read image buffer untuk kirim ke admin (NO EXTERNAL HOSTING!)
    const localImageBuffer = fs.readFileSync(tmpFilePath);
    
    console.log('✅ Bukti transfer loaded from temp, ready to send');

    // Generate reference ID (13 digit: 1 prefix + 12 digit timestamp)
    const refTimestamp = Math.floor(Date.now() / 1000).toString().slice(-12);
    const refID = `1${refTimestamp}`;

    // Simpan ke temp storage untuk verifikasi admin
    if (!global.pendingPayments) {
      global.pendingPayments = {};
    }

    // Get user name dari berbagai sumber
    let userName = m.pushName || 'Unknown User';
    if (global.db.users && global.db.users[m.sender] && global.db.users[m.sender].nama) {
      userName = global.db.users[m.sender].nama;
    }

    // Extract nomor HP dari m.key.senderPn (Sender Phone Number) - paling reliable!
    // Format: 6289653544913@s.whatsapp.net
    let phoneNumber = null;
    
    // Priority 1: m.key.senderPn (MOST RELIABLE - tidak pernah corrupted)
    if (m.key?.senderPn) {
      phoneNumber = m.key.senderPn.split('@')[0];
    }
    
    // Fallback: extract dari m.sender jika senderPn tidak ada
    if (!phoneNumber) {
      phoneNumber = m.sender.split('@')[0];
    }
    
    // Log untuk debug
    console.log(color(`[BUKTI_TRANSFER] m.key.senderPn: ${m.key?.senderPn}`, 'cyan'));
    console.log(color(`[BUKTI_TRANSFER] Extracted phone: ${phoneNumber}`, 'cyan'));

    global.pendingPayments[refID] = {
      refID: refID,
      userJid: m.sender,
      userName: userName,
      userPhone: phoneNumber,
      jumlah: jumlah,
      catatan: catatan,
      mediaPath: null, // No URL, image tersimpan di WhatsApp chat admin
      createdAt: new Date(),
      status: 'pending'
    };

    // Simpan ke Firestore
    const firestore = admin.firestore();
    await firestore.collection('bukti_transfer').doc(refID).set({
      refID: refID,
      userJid: m.sender,
      userName: userName,
      userPhone: phoneNumber,
      jumlah: jumlah,
      catatan: catatan,
      mediaPath: null, // No URL needed - admin sudah terima document
      createdAt: new Date(),
      status: 'pending',
      approvedAt: null,
      approvedBy: null
    });

    // Konfirmasi ke user
    const confirmText = `✅ *BUKTI TRANSFER DITERIMA*

> Kode Bukti : ${refID}
> Jumlah : Rp ${jumlah.toLocaleString('id-ID')}
> Catatan : ${catatan}
> Status : ⏳ Menunggu verifikasi
┈ׅ──ׄ─꯭─꯭──────꯭ׄ──ׅ┈

Kami akan verifikasi dalam 1x24 jam.
Silahkan tunggu konfirmasi dari kami.
> ketik .riwayat untuk melihat status pembayaran Anda secara berkala.`;

    m.reply(confirmText);

    // Kirim notif ke admin
    const adminNotif = `📸 *BUKTI TRANSFER MASUK*

> Kode Bukti : ${refID}
> Dari : ${userName} (${phoneNumber})
> Jumlah : Rp ${jumlah.toLocaleString('id-ID')}
> Catatan : ${catatan}
> Waktu : ${new Date().toLocaleString('id-ID')}
┈ׅ──ۄ─꯭─꯭──────꯭ׄ──ׅ┈

📎 *Bukti transfer terlampir di atas*

*Untuk approve:*
\`.acc ${refID}\`

*Untuk reject:*
\`.reject ${refID} alasan\``;

    // Kirim ke owner lokal dan admin Firestore secara parallel
    const notifiedPhones = new Set();
    const sendPromises = [];
    
    // Fungsi helper untuk kirim notifikasi
    const sendNotification = async (jid, phone, label) => {
      try {
        if (localImageBuffer) {
          // Langsung kirim sebagai image (lebih cepat & reliable daripada document)
          await client.sendMessage(jid, { 
            image: localImageBuffer,
            caption: adminNotif
          }, { quoted: m });
          console.log(`✅ Bukti transfer sent to ${label} ${phone}`);
        } else {
          await client.sendMessage(jid, { text: adminNotif }, { quoted: m });
        }
        notifiedPhones.add(phone);
      } catch (err) {
        console.error(`❌ Error sending to ${label} ${phone}:`, err.message);
      }
    };
    
    // Kirim ke owner lokal
    for (const own of global.owner) {
      const ownJid = own + '@s.whatsapp.net';
      sendPromises.push(sendNotification(ownJid, own, 'owner'));
    }
    
    // Query admin dari Firestore dan kirim parallel
    try {
      const adminSnapshot = await firestore.collection('users')
        .where('role', '==', 'admin')
        .get();
      
      console.log(`📋 Found ${adminSnapshot.size} admin(s) in Firestore`);
      
      for (const adminDoc of adminSnapshot.docs) {
        const adminJid = adminDoc.id; // JID format: 6289xxx@s.whatsapp.net
        const adminPhone = adminJid.split('@')[0];
        
        // Skip jika sudah ada di owner list
        if (global.owner.includes(adminPhone)) {
          console.log(`⏭️ Skip admin ${adminPhone} (already in owner list)`);
          continue;
        }
        
        sendPromises.push(sendNotification(adminJid, adminPhone, 'admin'));
      }
    } catch (err) {
      console.error('Error fetching admins from Firestore:', err.message);
    }
    
    // Kirim semua parallel dengan timeout protection
    await Promise.allSettled(sendPromises);
    console.log(`📤 Notification sent to ${notifiedPhones.size} recipient(s)`);
    
    // Hapus temp file setelah kirim ke admin
    try {
      fs.unlinkSync(tmpFilePath);
    } catch (e) {
      console.log('⚠️ Failed to delete temp file:', e.message);
    }

  } catch (err) {
    console.error('Error:', err);
    m.reply(`❌ Error: ${err.message}`);
  }
  break;
}

case 'show':
case 'lihat_bukti': {
  if (!isAdmin) return m.reply('❌ Hanya admin/owner yang bisa!');
  
  const refID = text;
  if (!refID) {
    return m.reply('❌ Format salah!\nContoh: .show [refID]');
  }

  try {
    // Load dari Firestore jika tidak ada di memory (setelah restart)
    let data = global.pendingPayments?.[refID];
    
    if (!data) {
      console.log(`⚠️ RefID ${refID} not in memory, loading from Firestore...`);
      const firestore = admin.firestore();
      const buktiDoc = await firestore.collection('bukti_transfer').doc(refID).get();
      
      if (!buktiDoc.exists) {
        return m.reply('❌ Ref ID tidak ditemukan di sistem!');
      }
      
      // Convert Firestore data ke format memory
      const buktiData = buktiDoc.data();
      data = {
        refID: buktiData.refID,
        userJid: buktiData.userJid,
        userName: buktiData.userName,
        userPhone: buktiData.userPhone,
        jumlah: buktiData.jumlah,
        catatan: buktiData.catatan,
        mediaPath: buktiData.mediaPath,
        createdAt: buktiData.createdAt.toDate ? buktiData.createdAt.toDate() : buktiData.createdAt,
        status: buktiData.status
      };
      
      // Simpan ke memory untuk next time
      if (!global.pendingPayments) global.pendingPayments = {};
      global.pendingPayments[refID] = data;
    }
  
    // Data bukti transfer tersimpan di chat admin sebagai image
    m.reply(`📸 *BUKTI TRANSFER ${data.refID}*

> Dari : ${data.userName} (${data.userPhone})
> Jumlah : Rp ${data.jumlah.toLocaleString('id-ID')}
> Catatan : ${data.catatan}
> Waktu : ${data.createdAt.toLocaleString('id-ID')}
┈ׅ──ۄ─꯭─꯭──────꯭ׄ──ׅ┈

*Status: ${data.status.toUpperCase()}*

💡 *Bukti transfer sudah tersimpan di chat admin* (cek notifikasi bukti transfer yang masuk di chat owner). Scroll up untuk melihat image yang dikirim sebelumnya.`);
  } catch (err) {
    console.error('Error:', err);
    m.reply(`❌ Error: ${err.message}`);
  }
  
  break;
}

case 'acc':
case 'approve_bukti': {
  if (!isAdmin) return m.reply('❌ Hanya admin/owner yang bisa!');
  
  const refID = text;
  if (!refID) {
    return m.reply('❌ Format salah!\nContoh: .acc [refID]');
  }

  try {
    // Load dari Firestore jika tidak ada di memory (setelah restart)
    let data = global.pendingPayments?.[refID];
    
    if (!data) {
      console.log(`⚠️ RefID ${refID} not in memory, loading from Firestore...`);
      const firestore = admin.firestore();
      const buktiDoc = await firestore.collection('bukti_transfer').doc(refID).get();
      
      if (!buktiDoc.exists) {
        return m.reply('❌ Ref ID tidak ditemukan di sistem!');
      }
      
      // Convert Firestore data ke format memory
      const buktiData = buktiDoc.data();
      data = {
        refID: buktiData.refID,
        userJid: buktiData.userJid,
        userName: buktiData.userName,
        userPhone: buktiData.userPhone,
        jumlah: buktiData.jumlah,
        catatan: buktiData.catatan,
        mediaPath: buktiData.mediaPath,
        createdAt: buktiData.createdAt.toDate ? buktiData.createdAt.toDate() : buktiData.createdAt,
        status: buktiData.status,
        approvedAt: buktiData.approvedAt ? (buktiData.approvedAt.toDate ? buktiData.approvedAt.toDate() : buktiData.approvedAt) : null,
        approvedBy: buktiData.approvedBy || null,
        rejectedAt: buktiData.rejectedAt ? (buktiData.rejectedAt.toDate ? buktiData.rejectedAt.toDate() : buktiData.rejectedAt) : null,
        rejectedBy: buktiData.rejectedBy || null,
        alasan: buktiData.alasan || null
      };
      
      // Simpan ke memory untuk next time
      if (!global.pendingPayments) global.pendingPayments = {};
      global.pendingPayments[refID] = data;
      
      console.log(`✅ Loaded from Firestore: ${refID}, status: ${data.status}`);
    }
    
    // Check jika sudah di-approve sebelumnya (prevent duplicate)
    if (data.status === 'approved') {
      return m.reply(`⚠️ *BUKTI SUDAH DI-APPROVE SEBELUMNYA*

> Kode Bukti : ${refID}
> Dari : ${data.userName} (${data.userPhone})
> Jumlah : Rp ${data.jumlah.toLocaleString('id-ID')}
> Status : ${data.status.toUpperCase()}
> Approved oleh : ${data.approvedBy || 'Unknown'}
> Approved pada : ${data.approvedAt ? new Date(data.approvedAt).toLocaleString('id-ID') : 'Unknown'}
┈ׅ──ۄ─꯭─꯭──────꯭ׄ──ׅ┈

❌ *Tidak bisa approve lagi - duplikat tiket tidak diperbolehkan!*`);
    }
    
    // Check jika sudah di-reject
    if (data.status === 'rejected') {
      return m.reply(`⚠️ *BUKTI TRANSFER SUDAH DI-REJECT*

> Kode Bukti : ${refID}
> Status : ${data.status.toUpperCase()}
┈ׅ──ۄ─꯭─꯭──────꯭ׄ──ׅ┈

💡 Bukti transfer ini sudah ditolak sebelumnya. Jika ingin approve, user harus kirim bukti transfer baru.`);
    }
    
    const userJid = data.userJid;
    
    // Generate QR code tiket (2 = Tiket, 13 digit total)
    const moment = require('moment-timezone');
    const ticketTimestamp = Math.floor(Date.now() / 1000).toString().slice(-12);
    const ticketID = `2${ticketTimestamp}`;
    
    // Generate security code (6 random digits)
    const securityCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Create wa.me link dengan scan command
    const botPhone = nomerBot.replace(/[^0-9]/g, '');
    const scanCommand = `.scan ${ticketID} ${securityCode}`;
    const encodedText = encodeURIComponent(scanCommand);
    const qrData = `https://wa.me/${botPhone}?text=${encodedText}`;
    
    // Generate QR code to temp
    const qrcode = require('qrcode');
    const tmpQRPath = `./tmp/qr_${ticketID}.png`;
    
    // Ensure tmp directory exists
    if (!fs.existsSync('./tmp')) {
      fs.mkdirSync('./tmp', { recursive: true });
    }

    await qrcode.toFile(tmpQRPath, qrData, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 0.95,
      margin: 2,
      width: 300
    });

    // Generate ticket image dengan QR overlay ke template poster
    const templatePath = path.join(__dirname, 'assets/ticket_template.png');
    let finalTicketPath = null;
    
    try {
      finalTicketPath = await generateTicketWithQR({
        ticketID: ticketID,
        buyerName: data.userName,
        konser: 'UMBandung Fest',
        harga: data.jumlah
      }, tmpQRPath, templatePath);
      
      console.log('✅ Final ticket with QR overlay generated');
    } catch (err) {
      console.error('⚠️ Error generating ticket with template:', err.message);
      // Fallback: use plain QR
      finalTicketPath = tmpQRPath;
    }

    // Kirim tiket ke user dengan gambar final
    let ticketSentStatus = '❌ GAGAL';
    const ticketMsg = `✅ *PEMBAYARAN DISETUJUI - TIKET DIGENERATE*

> Kode Tiket : ${ticketID}
> Konser : UMBandung Fest
> Tanggal : 29/11/2025
> Harga : Rp ${data.jumlah.toLocaleString('id-ID')}
> Status : ✅ VALID
┈ׅ──˄─꯭─꯭──────꯭ׄ──ׅ┈

🎫 *E-TICKET (SIMPAN BAIK-BAIK)*
Tunjukkan tiket ini saat masuk venue.`;

    // Send ticket image
    try {
      await client.sendMessage(userJid, {
        image: fs.readFileSync(finalTicketPath),
        caption: ticketMsg
      });
      ticketSentStatus = '✅ E-Ticket terkirim';
      console.log(`✅ Ticket sent as image to ${userJid}`);
    } catch (e) {
      console.log('⚠️ Error sending ticket as image:', e.message);
      // Fallback: kirim text dengan wa.me link
      await client.sendMessage(userJid, { 
        text: `${ticketMsg}\n\n🔗 Scan link ini untuk verifikasi:\n${qrData}` 
      });
      ticketSentStatus = '⚠️ Terkirim dengan link wa.me';
    }

    // Hapus temp files setelah kirim
    try {
      fs.unlinkSync(tmpQRPath);
    } catch (e) {
      console.log('⚠️ Failed to delete temp QR:', e.message);
    }

    // Konfirmasi ke admin dengan status pengiriman
    m.reply(`✅ *BUKTI TRANSFER DISETUJUI*

> Kode Bukti : ${refID}
> Kode Tiket : ${ticketID}
> Pengguna : ${data.userName}
> Jumlah : Rp ${data.jumlah.toLocaleString('id-ID')}
> Status : APPROVED
┈ׅ──˄─꯭─꯭──────꯭ׄ──ׅ┈

${ticketSentStatus}`);

    // Gunakan nomor HP yang sudah tersimpan di data.userPhone (dari saat bukti dikirim)
    // Jangan re-extract karena bisa jadi corrupted
    const phoneNumber = data.userPhone;
    
    // Extract admin phone number yang approve (MOST RELIABLE)
    let adminPhone = null;
    if (m.key?.senderPn) {
      adminPhone = m.key.senderPn.split('@')[0];
    } else {
      adminPhone = m.sender.split('@')[0]; // fallback
    }
    
    // Simpan ke Firestore
    const firestore = admin.firestore();
    await firestore.collection('tickets').doc(ticketID).set({
      ticketID: ticketID,
      refID: refID,
      buyerJid: userJid,
      buyerName: data.userName,
      buyerPhone: phoneNumber,
      konser: 'UMBandung Fest',
      harga: data.jumlah,
      qrCode: null, // QR dikirim sebagai file, tidak perlu URL
      status: 'aktif',
      securityCode: securityCode,
      createdAt: new Date(),
      approvedAt: new Date(),
      approvedBy: adminPhone,
      catatan: data.catatan
    });

    // Update status di Firestore bukti_transfer
    await firestore.collection('bukti_transfer').doc(refID).update({
      status: 'approved',
      approvedAt: new Date(),
      approvedBy: adminPhone,
      ticketID: ticketID,
      qrCode: null // QR dikirim sebagai file
    });

    // Update status di memory
    data.status = 'approved';
    data.approvedAt = new Date();
    data.approvedBy = adminPhone;
    data.ticketID = ticketID;
    global.pendingPayments[refID] = data;

  } catch (err) {
    console.error('Error:', err);
    m.reply(`❌ Error: ${err.message}`);
  }
  break;
}

case 'reject':
case 'reject_bukti': {
  if (!isAdmin) return m.reply('❌ Hanya admin/owner yang bisa!');
  
  const parts = text.split(' ');
  const refID = parts[0];
  const alasan = parts.slice(1).join(' ');

  if (!refID) {
    return m.reply('❌ Format salah!\nContoh: .reject [refID] [alasan]');
  }

  try {
    // Load dari Firestore jika tidak ada di memory (setelah restart)
    let data = global.pendingPayments?.[refID];
    
    if (!data) {
      console.log(`⚠️ RefID ${refID} not in memory, loading from Firestore...`);
      const firestore = admin.firestore();
      const buktiDoc = await firestore.collection('bukti_transfer').doc(refID).get();
      
      if (!buktiDoc.exists) {
        return m.reply('❌ Ref ID tidak ditemukan di sistem!');
      }
      
      // Convert Firestore data ke format memory
      const buktiData = buktiDoc.data();
      data = {
        refID: buktiData.refID,
        userJid: buktiData.userJid,
        userName: buktiData.userName,
        userPhone: buktiData.userPhone,
        jumlah: buktiData.jumlah,
        catatan: buktiData.catatan,
        mediaPath: buktiData.mediaPath,
        createdAt: buktiData.createdAt.toDate ? buktiData.createdAt.toDate() : buktiData.createdAt,
        status: buktiData.status,
        approvedAt: buktiData.approvedAt ? (buktiData.approvedAt.toDate ? buktiData.approvedAt.toDate() : buktiData.approvedAt) : null,
        approvedBy: buktiData.approvedBy || null,
        rejectedAt: buktiData.rejectedAt ? (buktiData.rejectedAt.toDate ? buktiData.rejectedAt.toDate() : buktiData.rejectedAt) : null,
        rejectedBy: buktiData.rejectedBy || null,
        alasan: buktiData.alasan || null,
        ticketID: buktiData.ticketID || null
      };
      
      // Simpan ke memory untuk next time
      if (!global.pendingPayments) global.pendingPayments = {};
      global.pendingPayments[refID] = data;
      
      console.log(`✅ Loaded from Firestore: ${refID}, status: ${data.status}`);
    }
    
    // Check jika sudah di-approve sebelumnya
    if (data.status === 'approved') {
      return m.reply(`⚠️ *BUKTI SUDAH DI-APPROVE*

> Kode Bukti : ${refID}
> Status : ${data.status.toUpperCase()}
> Tiket ID : ${data.ticketID || 'N/A'}
┈ׅ──ۄ─꯭─꯭──────꯭ׄ──ׅ┈

❌ *Tidak bisa reject - tiket sudah digenerate!* Jika ada masalah, hubungi user langsung.`);
    }
    
    // Check jika sudah di-reject sebelumnya
    if (data.status === 'rejected') {
      return m.reply(`⚠️ *BUKTI SUDAH DI-REJECT SEBELUMNYA*

> Kode Bukti : ${refID}
> Rejected oleh : ${data.rejectedBy || 'Unknown'}
> Rejected pada : ${data.rejectedAt ? new Date(data.rejectedAt).toLocaleString('id-ID') : 'Unknown'}
> Alasan : ${data.alasan || 'N/A'}
┈ׅ──ۄ─꯭─꯭──────꯭ׄ──ׅ┈

❌ *Sudah ditolak, tidak perlu reject lagi.*`);
    }
    
    const userJid = data.userJid;
    
    // Extract admin phone number yang reject
    let adminPhone = null;
    if (m.key?.senderPn) {
      adminPhone = m.key.senderPn.split('@')[0];
    } else {
      adminPhone = m.sender.split('@')[0];
    }

    // Notify user
    const rejectMsg = `❌ *BUKTI TRANSFER DITOLAK*

> Kode Bukti : ${refID}
> Alasan : ${alasan || 'Data tidak sesuai'}
┈ׅ──˄─꯭─꯭──────꯭ׄ──ׅ┈

Silahkan hubungi admin untuk info lebih lanjut.
Admin: ${global.ownerName}
wa.me/${global.nomerOwner}`;

    await client.sendMessage(userJid, { text: rejectMsg });

    // Confirm to admin
    m.reply(`❌ *BUKTI TRANSFER DITOLAK*

> Kode Bukti : ${refID}
> Alasan : ${alasan}
> Pengguna : ${data.userName}
┈ׅ──˄─꯭─꯭──────꯭ׄ──ׅ┈

✅ Notif penolakan sudah dikirim ke user`);

    // Update status di Firestore
    const firestore = admin.firestore();
    await firestore.collection('bukti_transfer').doc(refID).update({
      status: 'rejected',
      rejectedAt: new Date(),
      rejectedBy: adminPhone,
      alasan: alasan || 'Data tidak sesuai'
    });

    // Update status di memory
    data.status = 'rejected';
    data.rejectedAt = new Date();
    data.rejectedBy = adminPhone;
    data.alasan = alasan || 'Data tidak sesuai';
    global.pendingPayments[refID] = data;

  } catch (err) {
    console.error('Error:', err);
    m.reply(`❌ Error: ${err.message}`);
  }
  break;
}

case 'scan': {
  if (!isAdmin) return m.reply('❌ Hanya admin/owner yang bisa scan tiket!');
  
  if (!text) return m.reply('Format: .scan [ticketID] [securityCode]\nContoh: .scan 2123456789012 512345');
  
  try {
    const parts = text.split(' ');
    const ticketID = parts[0];
    const securityCode = parts[1];
    
    if (!ticketID || !securityCode) {
      return m.reply('Format: .scan [ticketID] [securityCode]');
    }
    
    const firestore = admin.firestore();
    const ticketDoc = await firestore.collection('tickets').doc(ticketID).get();
    
    if (!ticketDoc.exists) {
      return m.reply(`❌ *TIKET TIDAK DITEMUKAN*

> ID : ${ticketID}

_Tiket tidak terdaftar di sistem!_`);
    }
    
    const ticketData = ticketDoc.data();
    
    // Check if ticket already used
    if (ticketData.status === 'used') {
      return m.reply(`❌ *TIKET SUDAH DIPAKAI*

> ID : ${ticketID}
> Pembeli : ${ticketData.buyerName} (${ticketData.buyerPhone})
> Konser : ${ticketData.konser}
> Scan Waktu : ${new Date(ticketData.scannedAt.toDate()).toLocaleString('id-ID')}

_Tiket sudah digunakan - kemungkinan duplikat!_`);
    }
    
    // Check if ticket is still valid
    if (ticketData.status !== 'aktif') {
      return m.reply(`❌ *TIKET TIDAK VALID*

> ID : ${ticketID}
> Status : ${ticketData.status}
> Pembeli : ${ticketData.buyerName} (${ticketData.buyerPhone})
> Konser : ${ticketData.konser}

_Tiket ini tidak lagi valid!_`);
    }
    
    // Verify security code
    if (ticketData.securityCode !== securityCode) {
      return m.reply(`❌ *KODE KEAMANAN SALAH*

> ID : ${ticketID}
> Kode yang dikirim : ${securityCode}

_Kode tidak cocok - kemungkinan tiket palsu!_`);
    }
    
    // Extract admin phone number yang scan (MOST RELIABLE)
    let scannerPhone = null;
    if (m.key?.senderPn) {
      scannerPhone = m.key.senderPn.split('@')[0];
    } else {
      scannerPhone = m.sender.split('@')[0]; // fallback
    }
    
    // Mark ticket as used
    await firestore.collection('tickets').doc(ticketID).update({
      status: 'used',
      scannedAt: new Date(),
      scannedBy: scannerPhone
    });
    
    // Send success reply to admin
    const successMsg = `✅ *TIKET VALID - BOLEH MASUK*

> ID : ${ticketID}
> Pembeli : ${ticketData.buyerName} (${ticketData.buyerPhone})
> Konser : ${ticketData.konser}
> Harga : Rp ${ticketData.harga.toLocaleString('id-ID')}
> Jam Scan : ${new Date().toLocaleString('id-ID')}
┈ׅ──ׄ─꯭─꯭──────꯭ׄ──ׅ┈

🎫 Tiket valid & sudah diverifikasi`;
    
    m.reply(successMsg);
    
  } catch (err) {
    console.error('Error:', err);
    m.reply(`❌ Error: ${err.message}`);
  }
  break;
}
			
case 'ping': {
  if (isGroup) return m.reply('❌ Perintah ini hanya bisa digunakan di Private Chat');
  
  const uptime = process.uptime();
  const hours = Math.floor(uptime / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  const seconds = Math.floor(uptime % 60);
  const uptimeStr = `${hours}h ${minutes}m ${seconds}s`;
  
  const memUsage = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
  const nodeVersion = process.version;
  
  m.reply(`🏓 *PONG!*

> Bot Status : 🟢 Online
> Uptime : ${uptimeStr}
> Memory Usage : ${memUsage} MB
> Node Version : ${nodeVersion}
> Ready to serve! 🚀`);
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

// ========== ROLE MANAGEMENT COMMANDS ==========
case 'addrole': {
  if (!isDeveloper) return m.reply('❌ Hanya Developer (Owner) yang bisa!');
  
  if (!text) return m.reply('Format: .addrole [nomor] [role]\nRole: admin atau user\nContoh: .addrole 6285871756001 admin');
  
  const parts = text.split(' ');
  const targetPhone = parts[0];
  const role = parts[1]?.toLowerCase();
  
  if (!role || !['admin', 'user'].includes(role)) {
    return m.reply('❌ Role harus "admin" atau "user"!');
  }
  
  try {
    const firestore = admin.firestore();
    const targetJid = targetPhone.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
    
    await firestore.collection('users').doc(targetJid).set({
      phone: targetPhone.replace(/[^0-9]/g, ''),
      role: role,
      updatedAt: new Date(),
      updatedBy: m.sender
    }, { merge: true });
    
    m.reply(`✅ Role berhasil diupdate!

> Nomor : ${targetPhone}
> Role : ${role.toUpperCase()}
┈ׅ──ׄ─꯭─꯭──────꯭ׄ──ׅ┈`);

    // Send notification to target user
    const notifMsg = `👨‍💼 *NOTIFIKASI AKSES ADMIN*

Anda telah ditambahkan sebagai admin di Atlanticket Bot!

> Role : ${role.toUpperCase()}
> Disetujui oleh : ${m.pushName || 'Owner'}
> Waktu : ${new Date().toLocaleString('id-ID')}
┈ׅ──ׄ─꯭─꯭──────꯭ׄ──ׅ┈

📋 *COMMAND ADMIN YANG TERSEDIA:*
> \`.show\` [refID] - Lihat bukti transfer
> \`.acc\` [refID] - Approve pembayaran
> \`.reject\` [refID] [alasan] - Tolak pembayaran
> \`.scan\` [ticketID] [code] - Scan tiket masuk
> \`.riwayat\` - Lihat semua transaksi
> \`.riwayat pending\` - Lihat yang pending
> \`.riwayat acc\` - Lihat yang disetujui
> \`.riwayat reject\` - Lihat yang ditolak

Selamat bertugas! 🎯`;

    await client.sendMessage(targetJid, { text: notifMsg });
  } catch (err) {
    m.reply(`❌ Error: ${err.message}`);
  }
  break;
}

case 'removerole': {
  if (!isDeveloper) return m.reply('❌ Hanya Developer (Owner) yang bisa!');
  
  if (!text) return m.reply('Format: .removerole [nomor]\nContoh: .removerole 6285871756001');
  
  const targetPhone = text.trim();
  
  try {
    const firestore = admin.firestore();
    const targetJid = targetPhone.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
    
    await firestore.collection('users').doc(targetJid).update({
      role: 'user',
      updatedAt: new Date(),
      updatedBy: m.sender
    });
    
    m.reply(`✅ Role berhasil direset ke user!

> Nomor : ${targetPhone}
┈ׅ──ׄ─꯭─꯭──────꯭ׄ──ׅ┈`);

    // Send notification to target user
    const notifMsg = `⚠️ *NOTIFIKASI PERUBAHAN AKSES*

Role admin Anda telah dihapus.

> Role Sekarang : USER
> Diubah oleh : ${m.pushName || 'Owner'}
> Waktu : ${new Date().toLocaleString('id-ID')}
┈ׅ──ׄ─꯭─꯭──────꯭ׄ──ׅ┈

Anda sekarang memiliki akses sebagai user biasa.`;

    await client.sendMessage(targetJid, { text: notifMsg });
  } catch (err) {
    m.reply(`❌ Error: ${err.message}`);
  }
  break;
}

case 'getrole': {
  if (!isDeveloper) return m.reply('❌ Hanya Developer (Owner) yang bisa!');
  
  if (!text) return m.reply('Format: .getrole [nomor]\nContoh: .getrole 6285871756001');
  
  const targetPhone = text.trim();
  
  try {
    const firestore = admin.firestore();
    const targetJid = targetPhone.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
    
    const userDoc = await firestore.collection('users').doc(targetJid).get();
    
    if (!userDoc.exists) {
      return m.reply(`❌ User tidak ditemukan: ${targetPhone}`);
    }
    
    const data = userDoc.data();
    m.reply(`📋 *INFO USER*

> Nomor : ${data.phone || targetPhone}
> Role : ${(data.role || 'user').toUpperCase()}
> Updated : ${data.updatedAt ? new Date(data.updatedAt.toDate()).toLocaleString('id-ID') : 'N/A'}
> Updated By : ${data.updatedBy || 'N/A'}`);
  } catch (err) {
    m.reply(`❌ Error: ${err.message}`);
  }
  break;
}

case 'addadmin': {
  if (!isDeveloper) return m.reply('❌ Hanya Developer yang bisa!');
  
  if (!text) return m.reply('Format: .addadmin [nomor]\nContoh: .addadmin 6285871756001');
  
  const targetPhone = text.trim();
  
  try {
    const firestore = admin.firestore();
    const targetJid = targetPhone.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
    
    await firestore.collection('users').doc(targetJid).set({
      phone: targetPhone.replace(/[^0-9]/g, ''),
      role: 'admin',
      updatedAt: new Date(),
      updatedBy: m.sender
    }, { merge: true });
    
    m.reply(`✅ Berhasil ditambahkan sebagai admin!

> Nomor : ${targetPhone}
> Role : ADMIN
┈ׅ──ׄ─꯭─꯭──────꯭ׄ──ׅ┈`);

    // Send notification to target user
    const notifMsg = `👨‍💼 *SELAMAT! ANDA ADMIN*

Anda telah ditambahkan sebagai admin di AtlanTicket Bot!

> Role : ADMIN
> Disetujui oleh : ${m.pushName || 'Owner'}
> Waktu : ${new Date().toLocaleString('id-ID')}
┈ׅ──ׄ─꯭─꯭──────꯭ׄ──ׅ┈

📋 *COMMAND ADMIN YANG TERSEDIA:*
> \`.show\` [refID] - Lihat bukti transfer
> \`.acc\` [refID] - Approve pembayaran
> \`.reject\` [refID] [alasan] - Tolak pembayaran
> \`.scan\` [ticketID] [code] - Scan tiket masuk
> \`.riwayat\` - Lihat semua transaksi
> \`.riwayat pending\` - Lihat yang pending
> \`.riwayat acc\` - Lihat yang disetujui
> \`.riwayat reject\` - Lihat yang ditolak

Selamat bertugas! 🎯`;

    await client.sendMessage(targetJid, { text: notifMsg });
  } catch (err) {
    m.reply(`❌ Error: ${err.message}`);
  }
  break;
}

case 'rmadmin': {
  if (!isDeveloper) return m.reply('❌ Hanya Developer yang bisa!');
  
  if (!text) return m.reply('Format: .rmadmin [nomor]\nContoh: .rmadmin 6285871756001');
  
  const targetPhone = text.trim();
  
  try {
    const firestore = admin.firestore();
    const targetJid = targetPhone.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
    
    await firestore.collection('users').doc(targetJid).update({
      role: 'user',
      updatedAt: new Date(),
      updatedBy: m.sender
    });
    
    m.reply(`✅ Berhasil dihapus dari admin!\n\n> Nomor : ${targetPhone}\n> Role : USER`);

    // Send notification to target user
    const notifMsg = `⚠️ *NOTIFIKASI PERUBAHAN AKSES*

Akses admin Anda telah dicabut.

> Role Sekarang : USER
> Dicabut oleh : ${m.pushName || 'Owner'}
> Waktu : ${new Date().toLocaleString('id-ID')}
┈ׅ──ׄ─꯭─꯭──────꯭ׄ──ׅ┈

Anda sekarang memiliki akses sebagai user biasa.`;

    await client.sendMessage(targetJid, { text: notifMsg });
  } catch (err) {
    m.reply(`❌ Error: ${err.message}`);
  }
  break;
}
            
   case 'min':
   case 'admin':
   case 'etmin':
            {
    client.sendMessage(m.chat, { text: global.min }, { quoted: m });
    break;
}               
 
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
       
    case 'riwayat': {
  try {
    const firestore = admin.firestore();
    
    // Helper untuk status icon
    const getStatusIcon = (status) => {
      if (status === 'approved') return '✅';
      if (status === 'pending') return '⏳';
      if (status === 'rejected') return '❌';
      return '❓';
    };
    
    if (isAdmin) {
      // ADMIN MODE - Lihat riwayat bukti transfer atau user tertentu
      const filter = text.toLowerCase();
      
      if (!filter) {
        // Show all - urut by status (pending first), then by time
        const allDocs = await firestore.collection('bukti_transfer').get();
        
        if (allDocs.empty) {
          return m.reply('❌ Belum ada riwayat bukti transfer');
        }
        
        let allData = [];
        allDocs.forEach(doc => allData.push(doc.data()));
        
        // Sort: pending first, then approved, then rejected. Within each status, newest first
        allData.sort((a, b) => {
          const statusPriority = { 'pending': 0, 'approved': 1, 'rejected': 2 };
          if (statusPriority[a.status] !== statusPriority[b.status]) {
            return statusPriority[a.status] - statusPriority[b.status];
          }
          return b.createdAt.toDate() - a.createdAt.toDate();
        });
        
        allData = allData.slice(0, 10);
        
        let riwayatText = `📋 *RIWAYAT BUKTI TRANSFER*

> Total : ${allData.length} data (urut by status, pending first)
┈ׅ──��ܸ─꯭─꯭──────꯭ׄ──ׅ┈\n`;
        
        let no = 1;
        allData.forEach(data => {
          const icon = getStatusIcon(data.status);
          const approvedByPhone = data.approvedBy ? data.approvedBy.split('@')[0] : '';
          const rejectedByPhone = data.rejectedBy ? data.rejectedBy.split('@')[0] : '';
          riwayatText += `\n${no}. ${icon} *${data.refID}*
> User : ${data.userName} (${data.userPhone})
> Harga : Rp ${data.jumlah.toLocaleString('id-ID')}
> Dibuat : ${new Date(data.createdAt.toDate()).toLocaleString('id-ID')}`;
          if (data.status === 'approved' && data.approvedAt) {
            riwayatText += `\n> Approved : ${new Date(data.approvedAt.toDate()).toLocaleString('id-ID')} (${approvedByPhone})`;
          } else if (data.status === 'rejected' && data.rejectedAt) {
            riwayatText += `\n> Rejected : ${new Date(data.rejectedAt.toDate()).toLocaleString('id-ID')} (${rejectedByPhone})`;
          }
          riwayatText += `\n┈ׅ──ׄ─꯭─꯭──────꯭ׄ──ׅ┈`;
          no++;
        });
        
        riwayatText += `\n*Gunakan:*
\`.riwayat pending\` - Lihat pending
\`.riwayat acc\` - Lihat approved
\`.riwayat reject\` - Lihat rejected
\`.riwayat [nomor_hp]\` - Lihat user tertentu`;
        
        return m.reply(riwayatText);
      }
      
      // Filter by status
      if (filter === 'pending' || filter === 'acc' || filter === 'reject') {
        // Convert acc/reject back to approved/rejected for Firestore query
        const statusMap = { 'acc': 'approved', 'reject': 'rejected' };
        const firestoreStatus = statusMap[filter] || filter;
        
        const buktiSnapshot = await firestore.collection('bukti_transfer')
          .where('status', '==', firestoreStatus)
          .get();
        
        if (buktiSnapshot.empty) {
          return m.reply(`❌ Belum ada bukti transfer dengan status ${filter}`);
        }
        
        // Sort by time (newest first) - in memory
        let allData = [];
        buktiSnapshot.forEach(doc => allData.push(doc.data()));
        allData.sort((a, b) => b.createdAt.toDate() - a.createdAt.toDate());
        allData = allData.slice(0, 10);
        
        const icon = getStatusIcon(firestoreStatus);
        let riwayatText = `📋 *RIWAYAT BUKTI TRANSFER - ${icon} ${firestoreStatus.toUpperCase()}*

> Total : ${allData.length} data
┈ׅ──ׄ─꯭─꯭──────꯭ׄ──ׅ┈\n`;
        
        let no = 1;
        allData.forEach(data => {
          riwayatText += `\n${no}. ${icon} *${data.refID}*
> User : ${data.userName} (${data.userPhone})
> Harga : Rp ${data.jumlah.toLocaleString('id-ID')}
> Dibuat : ${new Date(data.createdAt.toDate()).toLocaleString('id-ID')}`;
          if (data.status === 'approved' && data.approvedAt) {
            const approvedByPhone = data.approvedBy ? data.approvedBy.split('@')[0] : '';
            riwayatText += `\n> Approved : ${new Date(data.approvedAt.toDate()).toLocaleString('id-ID')} (${approvedByPhone})`;
          } else if (data.status === 'rejected' && data.rejectedAt) {
            const rejectedByPhone = data.rejectedBy ? data.rejectedBy.split('@')[0] : '';
            riwayatText += `\n> Rejected : ${new Date(data.rejectedAt.toDate()).toLocaleString('id-ID')} (${rejectedByPhone})`;
          }
          riwayatText += `\n┈ׅ──ׄ─꯭─꯭──────꯭ׄ──ׅ┈`;
          no++;
        });
        
        return m.reply(riwayatText);
      }
      
      // Filter by phone number
      if (filter.match(/^\d{10,}$/)) {
        const buktiSnapshot = await firestore.collection('bukti_transfer')
          .where('userPhone', '==', filter)
          .get();
        
        if (buktiSnapshot.empty) {
          return m.reply(`❌ Tidak ada transaksi untuk nomor ${filter}`);
        }
        
        let allData = [];
        buktiSnapshot.forEach(doc => allData.push(doc.data()));
        
        // Sort by status priority (pending first)
        allData.sort((a, b) => {
          const statusPriority = { 'pending': 0, 'approved': 1, 'rejected': 2 };
          if (statusPriority[a.status] !== statusPriority[b.status]) {
            return statusPriority[a.status] - statusPriority[b.status];
          }
          return b.createdAt.toDate() - a.createdAt.toDate();
        });
        
        let totalSpent = 0;
        let riwayatText = `📋 *RIWAYAT TRANSAKSI USER*

> Nomor : ${filter}
> Total : ${allData.length} transaksi
┈ׅ──��─꯭─꯭──────꯭ׄ──ׅ┈\n`;
        
        let no = 1;
        allData.forEach(data => {
          totalSpent += data.jumlah;
          const icon = getStatusIcon(data.status);
          riwayatText += `\n${no}. ${icon} *${data.refID}*
> Harga : Rp ${data.jumlah.toLocaleString('id-ID')}
> Dibuat : ${new Date(data.createdAt.toDate()).toLocaleString('id-ID')}`;
          if (data.status === 'approved' && data.approvedAt) {
            const approvedByPhone = data.approvedBy ? data.approvedBy.split('@')[0] : '';
            riwayatText += `\n> Approved : ${new Date(data.approvedAt.toDate()).toLocaleString('id-ID')} (${approvedByPhone})`;
          } else if (data.status === 'rejected' && data.rejectedAt) {
            const rejectedByPhone = data.rejectedBy ? data.rejectedBy.split('@')[0] : '';
            riwayatText += `\n> Rejected : ${new Date(data.rejectedAt.toDate()).toLocaleString('id-ID')} (${rejectedByPhone})`;
          }
          riwayatText += `\n┈ׅ──ۄ─꯭─꯭──────꯭ׄ──ׅ┈`;
          no++;
        });
        
        riwayatText += `\n💰 *TOTAL SPENDING* : Rp ${totalSpent.toLocaleString('id-ID')}`;
        
        return m.reply(riwayatText);
      }
      
      return m.reply(`❌ Format tidak valid!\n.riwayat [pending|approved|rejected|nomor_hp]`);
      
    } else {
      // USER MODE - Lihat riwayat bukti transfer dan tiket mereka
      
      // Always fetch both tickets and bukti_transfer for user
      const ticketsSnapshot = await firestore.collection('tickets')
        .where('buyerJid', '==', m.sender)
        .get();
      
      const buktiSnapshot = await firestore.collection('bukti_transfer')
        .where('userJid', '==', m.sender)
        .get();
      
      // Check if user has any history
      if (ticketsSnapshot.empty && buktiSnapshot.empty) {
        return m.reply('❌ Anda belum memiliki riwayat transaksi apapun');
      }
      
      let riwayatText = `📋 *RIWAYAT TRANSAKSI SAYA*\n`;
      
      // Show tickets if any
      if (!ticketsSnapshot.empty) {
        let allTickets = [];
        ticketsSnapshot.forEach(doc => allTickets.push(doc.data()));
        allTickets.sort((a, b) => b.createdAt.toDate() - a.createdAt.toDate());
        
        riwayatText += `\n🎫 *TIKET SAYA* (${allTickets.length})\n┈ׅ──ׄ─꯭─꯭──────꯭ׄ──ׅ┈\n`;
        
        let totalTicketSpent = 0;
        allTickets.forEach((data, idx) => {
          totalTicketSpent += data.harga;
          const statusEmoji = data.status === 'aktif' ? '✅' : '❌';
          riwayatText += `\n${idx + 1}. ${statusEmoji} *${data.ticketID}*
> Konser : ${data.konser}
> Harga : Rp ${data.harga.toLocaleString('id-ID')}
> Status : \`${data.status === 'aktif' ? 'Aktif' : 'Expired'}\`
> Dibeli : ${new Date(data.approvedAt.toDate()).toLocaleString('id-ID')}`;
        });
        riwayatText += `\n┈ׅ──ۄ─꯭─꯭──────꯭ׄ──ׅ┈`;
      }
      
      // Show bukti_transfer if any
      if (!buktiSnapshot.empty) {
        let allData = [];
        buktiSnapshot.forEach(doc => allData.push(doc.data()));
        
        // Sort by status (pending first, then approved, then rejected)
        allData.sort((a, b) => {
          const statusPriority = { 'pending': 0, 'approved': 1, 'rejected': 2 };
          if (statusPriority[a.status] !== statusPriority[b.status]) {
            return statusPriority[a.status] - statusPriority[b.status];
          }
          return b.createdAt.toDate() - a.createdAt.toDate();
        });
        
        riwayatText += `\n\n💳 *BUKTI TRANSFER* (${allData.length})\n┈ׅ──ׄ─꯭─꯭──────꯭ׄ──ׅ┈\n`;
        
        let totalBuktiSpent = 0;
        allData.forEach((data, idx) => {
          totalBuktiSpent += data.jumlah;
          const statusEmoji = data.status === 'pending' ? '⏳' : data.status === 'approved' ? '✅' : '❌';
          riwayatText += `\n${idx + 1}. ${statusEmoji} *${data.refID}*
> Jumlah : Rp ${data.jumlah.toLocaleString('id-ID')}
> Status : \`${data.status === 'pending' ? 'Menunggu' : data.status === 'approved' ? 'Disetujui' : 'Ditolak'}\`
> Waktu : ${new Date(data.createdAt.toDate()).toLocaleString('id-ID')}`;
          if (data.catatan) {
            riwayatText += `\n> Catatan : ${data.catatan}`;
          }
        });
        riwayatText += `\n┈ׅ──ۄ─꯭─꯭──────꯭ׄ──ׅ┈`;
      }
      
      m.reply(riwayatText);
    }
  } catch (err) {
    console.error('Error:', err);
    m.reply(`❌ Error: ${err.message}`);
  }
  break;
}
    
    case 'debug_jid': {
  //if (!isOwner) return m.reply('❌ Hanya owner!');
  
  // Log semua info ke console
  console.log(color(`\n[DEBUG_JID] Full message object keys:`, 'yellow'));
  console.log(color(`  ${JSON.stringify(Object.keys(m), null, 2)}`, 'yellow'));
  
  console.log(color(`\n[DEBUG_JID] m.key properties:`, 'yellow'));
  console.log(color(`  ${JSON.stringify(m.key, null, 2)}`, 'yellow'));
  
  console.log(color(`\n[DEBUG_JID] m.chat: ${m.chat}`, 'yellow'));
  console.log(color(`[DEBUG_JID] m.key.fromMe: ${m.key?.fromMe}`, 'yellow'));
  console.log(color(`[DEBUG_JID] sender variable: ${sender}`, 'yellow'));
  
  const debugInfo = `📋 *DEBUG JID INFO*

m.sender: ${m.sender}
m.from: ${m.from}
m.key.remoteJid: ${m.key?.remoteJid}
m.key.participant: ${m.key?.participant}
m.chat: ${m.chat}
sender variable: ${sender}
pushname: ${pushname}

Global DB:
${JSON.stringify(global.db.users?.[m.sender] || {}, null, 2)}

Lihat console untuk Object.keys!`;

  m.reply(debugInfo);
  break;
}

case 'owner': {
    var owner_Nya = `${global.nomerOwner}@s.whatsapp.net`;

    // Sending the contact
    sendContact(from, owner_Nya, global.ownerName, m);

    // Adding a delay before sending the response message
    setTimeout(() => {
        // Adding respon pesan setelah mengirim kontak owner
        var responseMessage = "*_Itu Kak Kontak Admin Saya, Jika Mau Order Apapun Silahkan Hubungi Dia ya._*\n\n*Admin Juga Menyediakan Jasa Pembuatan Bot Dan Website Pemesanan Tiket Otomatis Bagi Kamu Yang Mau Mulai Berbisnis 🤝";
        client.sendText(from, responseMessage);
    }, 1000); // Adjust the delay time as needed

    break;
}

      default:
    }
  } catch (err) {
    // Handle decryption errors gracefully
    if (err.message && (err.message.includes('Bad MAC') || err.message.includes('decrypt'))) {
      console.error(color(`[SESSION ERROR] ${err.message}`, 'red'));
      console.log(color('ℹ️ Session error - bot akan tetap berjalan', 'yellow'));
      // Jangan reply ke user, just log error
    } else {
      // Other errors
      try {
        m.reply(util.format(err))
      } catch (e) {
        console.error('Error sending error reply:', e);
      }
    }
  }
}
let file = require.resolve(__filename)
fs.watchFile(file, () => {
  fs.unwatchFile(file)
  console.log(chalk.redBright(`Update ${__filename}`))
  delete require.cache[file]
  require(file)
})