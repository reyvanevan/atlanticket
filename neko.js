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
      
      console.log(color(`[ROLE_CHECK_DEBUG] m.sender: ${m.sender}`, 'yellow'));
      console.log(color(`[ROLE_CHECK_DEBUG] m.key.senderPn: ${m.key?.senderPn}`, 'yellow'));
      console.log(color(`[ROLE_CHECK_DEBUG] extracted phoneNumber: ${phoneNumber}`, 'yellow'));
      
      // Build JID untuk lookup di Firestore
      const lookupJid = phoneNumber + '@s.whatsapp.net';
      console.log(color(`[ROLE_CHECK_DEBUG] lookupJid: ${lookupJid}`, 'yellow'));
      
      const userDoc = await firestore.collection('users').doc(lookupJid).get();
      if (userDoc.exists) {
        userRole = userDoc.data().role || 'user';
        console.log(color(`[ROLE_CHECK_SUCCESS] Found role: ${userRole}`, 'green'));
      } else {
        console.log(color(`[ROLE_CHECK_NOTFOUND] No document for: ${lookupJid}`, 'red'));
      }
      
      // Debug logging
      if (userRole !== 'user') {
        console.log(color(`[ROLE_CHECK] ${lookupJid} => Role: ${userRole}`, 'green'));
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

    let menuText = `🎫 *TIKET KONSER ATLANTICKET* 🎫

> Pilih konser yang ingin Anda beli:
┈ׅ──ׄ─꯭─꯭──────꯭ׄ──ׅ┈\n`;

    let index = 1;
    konserSnapshot.forEach(doc => {
      const data = doc.data();
      menuText += `\n${index}. *${data.nama}*
> Tanggal : ${data.tanggal}
> Jam : ${data.jam}
> Harga : Rp ${data.harga.toLocaleString('id-ID')}
> Stok : ${data.stokTersisa} tiket
> Status : ✅
┈ׅ──ׄ─꯭─꯭──────꯭ׄ──ׅ┈`;
      index++;
    });

    menuText += `\n> Balas dengan: .order [nomor]
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
> \`.order\` [nomor]
> \`.checkout\`
> \`.bukti_transfer\` [jumlah] [catatan]
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
  if (!text || isNaN(text)) {
    return m.reply('Format salah!\nGunakan: .order [nomor]\nContoh: .order 1');
  }
  
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

    const konserIndex = parseInt(text) - 1;
    if (konserIndex < 0 || konserIndex >= konserArray.length) {
      return m.reply(`❌ Nomor konser tidak valid! Gunakan .menu untuk melihat pilihan.`);
    }

    const konser = konserArray[konserIndex];

    const orderText = `📋 *DETAIL TIKET KONSER*

🎤 *${konser.nama}*
> Event : ${konser.nama}
> Tanggal : ${konser.tanggal}
> Jam : ${konser.jam}
> Lokasi : ${konser.lokasi}
> Harga : Rp ${konser.harga.toLocaleString('id-ID')}
> Stok : ${konser.stokTersisa} tiket
> Info : ${konser.deskripsi}
┈ׅ──ׄ─꯭─꯭──────꯭ׄ──�� ┈

> Untuk membeli, hubungi admin:
> ${global.ownerName}
> wa.me/${global.nomerOwner}

> atau balas .checkout untuk lanjut`;
    m.reply(orderText);
  } catch (err) {
    m.reply(`❌ Error: ${err.message}`);
  }
  break;
}

case 'checkout': {
  if (isAdmin && !isOwner) return m.reply('❌ Admin tidak bisa checkout! Hanya user biasa.');
  const checkoutText = `💳 *PROSES CHECKOUT TIKET*

> Silahkan lakukan pembayaran ke:
┈ׅ──ׄ─꯭─꯭──────꯭ׄ──ׅ┈

💳 *Transfer: ATM/E-Banking*
> Bank : ${global.bankName || 'Hubungi Admin'}
> Rekening : ${global.nomerOwner}
> Atas Nama : ${global.ownerName}
┈ׅ──ׄ─꯭─꯭──────꯭ׄ──ׅ┈

📲 *QRIS*
> Link : ${global.linkQRIS || 'hubungi admin'}
┈ׅ──ׄ─꯭─꯭──────꯭ׄ──ׅ┈

⚠️ *VERIFIKASI PEMBAYARAN*
> Waktu : Dalam 5 menit otomatis
> Jika belum : Hubungi admin
┈ׅ──ׄ─꯭─꯭──────꯭ׄ──ׅ┈

👨‍💼 *HUBUNGI ADMIN*
> Admin : ${global.ownerName}
> Group : ${global.linkGC}`;
  m.reply(checkoutText);
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
case 'bukti_transfer': {
  if (isAdmin && !isOwner) return m.reply('❌ Admin tidak bisa upload bukti! Hanya user biasa.');
  // User upload bukti transfer dengan media
  if (!m.quoted || !m.quoted.mtype || !m.quoted.mtype.includes('imageMessage')) {
    return m.reply(`📤 *FORMAT KIRIM BUKTI TRANSFER*

Caranya:
1. Kirim screenshot bukti transfer
2. Reply screenshot dengan: .bukti_transfer [jumlah] [catatan]

*Contoh:*
User kirim gambar transfer, terus balas dengan:
\`.bukti_transfer 25000 UMBandung Fest - 1 tiket\`

⚠️ *PENTING:*
> Screenshot harus jelas
> Berisi nama rekening, jumlah, dan waktu transfer
> Admin akan verifikasi dalam 5 menit`);
  }

  if (!text) {
    return m.reply('Format: .bukti_transfer [jumlah] [catatan]\nContoh: .bukti_transfer 25000 UMBandung Fest - 1 tiket');
  }

  try {
    const parts = text.split(' ');
    const jumlah = parseInt(parts[0]);
    const catatan = parts.slice(1).join(' ');

    if (isNaN(jumlah)) {
      return m.reply('❌ Jumlah harus berupa angka!');
    }

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

    // Upload ke PixHost
    let imageUrl = null;
    try {
      const FormData = require('form-data');
      const form = new FormData();
      form.append('img', fs.createReadStream(tmpFilePath));
      form.append('content_type', '0');
      form.append('max_th_size', '420');

      const axiosRes = await axios.post('https://api.pixhost.to/images', form, {
        headers: form.getHeaders()
      });

      const json = axiosRes.data;
      if (json.show_url) {
        // Parse URL dari PixHost
        const match = /\/show\/(\d+)\/(\d+_.+)/.exec(json.show_url);
        if (match) {
          const folderId = match[1];
          const filename = match[2];
          imageUrl = `https://img1.pixhost.to/images/${folderId}/${filename}`;
        }
      }
    } catch (e) {
      console.log('⚠️ PixHost upload gagal:', e.message);
      imageUrl = null;
    }

    // Hapus temp file
    try {
      fs.unlinkSync(tmpFilePath);
    } catch (e) {}

    if (!imageUrl) {
      return m.reply('❌ Gagal upload gambar ke server. Coba lagi.');
    }

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
      mediaPath: imageUrl,
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
      mediaPath: imageUrl,
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
> Status : ⏳ Menunggu verifikasi admin
┈ׅ──ׄ─꯭─꯭──────꯭ׄ──ׅ┈

Admin akan verifikasi dalam 5 menit.
Silahkan tunggu konfirmasi dari admin.`;

    m.reply(confirmText);

    // Kirim notif ke admin (gunakan userName dan phoneNumber yang sudah ter-extract dengan benar)
    const adminNotif = `📸 *BUKTI TRANSFER MASUK*

> Kode Bukti : ${refID}
> Dari : ${userName} (${phoneNumber})
> Jumlah : Rp ${jumlah.toLocaleString('id-ID')}
> Catatan : ${catatan}
> Waktu : ${new Date().toLocaleString('id-ID')}
┈ׅ──ۄ─꯭─꯭──────꯭ׄ──ׅ┈

🔗 Link: ${imageUrl}
​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​
*Untuk melihat bukti & verifikasi:*
\`.show ${refID}\`

*Untuk approve:*
\`.acc ${refID}\`

*Untuk reject:*
\`.reject ${refID} alasan\``;

    // Send to owner dengan gambar
    for (const own of global.owner) {
      try {
        const imageBuffer = await getBuffer(imageUrl);
        await client.sendMessage(own + '@s.whatsapp.net', { 
          image: imageBuffer,
          caption: adminNotif
        }, { quoted: m });
      } catch (imgErr) {
        // Fallback jika gagal download gambar, kirim text saja
        console.log('⚠️ Gagal send image ke admin, fallback ke text:', imgErr.message);
        await client.sendMessage(own + '@s.whatsapp.net', { text: `${adminNotif}\n\n🔗 Link: ${imageUrl}` }, { quoted: m });
      }
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
  if (!refID || !global.pendingPayments || !global.pendingPayments[refID]) {
    return m.reply('❌ Ref ID tidak ditemukan!');
  }

  const data = global.pendingPayments[refID];
  
  try {
    // Download image dari URL dan kirim ke admin
    if (data.mediaPath) {
      const imageBuffer = await getBuffer(data.mediaPath);
      await client.sendMessage(m.chat, { 
        image: imageBuffer,
        caption: `📸 *BUKTI TRANSFER ${data.refID}*

> Dari : ${data.userName} (${data.userPhone})
> Jumlah : Rp ${data.jumlah.toLocaleString('id-ID')}
> Catatan : ${data.catatan}
> Waktu : ${data.createdAt.toLocaleString('id-ID')}
┈ׅ──ۄ─꯭─꯭──────꯭ׄ──ׅ┈

🔗 Link: ${data.mediaPath}

*Status: ${data.status.toUpperCase()}*`
      }, { quoted: m });
    }
  } catch (err) {
    m.reply(`❌ Error: ${err.message}`);
  }
  break;
}

case 'acc':
case 'approve_bukti': {
  if (!isAdmin) return m.reply('❌ Hanya admin/owner yang bisa!');
  
  const refID = text;
  if (!refID || !global.pendingPayments || !global.pendingPayments[refID]) {
    return m.reply('❌ Ref ID tidak ditemukan!');
  }

  try {
    const data = global.pendingPayments[refID];
    const userJid = data.userJid;
    
    // Generate QR code tiket (2 = Tiket, 13 digit total)
    const moment = require('moment-timezone');
    const ticketTimestamp = Math.floor(Date.now() / 1000).toString().slice(-12);
    const ticketID = `2${ticketTimestamp}`;
    const qrData = `${ticketID}-${data.jumlah}-UMBandung Fest`;
    
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

    // Upload QR ke PixHost
    let qrUrl = null;
    try {
      const FormData = require('form-data');
      const form = new FormData();
      form.append('img', fs.createReadStream(tmpQRPath));
      form.append('content_type', '0');
      form.append('max_th_size', '420');

      const axiosRes = await axios.post('https://api.pixhost.to/images', form, {
        headers: form.getHeaders()
      });

      const json = axiosRes.data;
      if (json.show_url) {
        const match = /\/show\/(\d+)\/(\d+_.+)/.exec(json.show_url);
        if (match) {
          const folderId = match[1];
          const filename = match[2];
          qrUrl = `https://img1.pixhost.to/images/${folderId}/${filename}`;
        }
      }
    } catch (e) {
      console.log('⚠️ QR PixHost upload gagal:', e.message);
    }

    // Hapus temp QR file
    try {
      fs.unlinkSync(tmpQRPath);
    } catch (e) {}

    // Kirim tiket ke user dengan image
    const ticketMsg = `✅ *PEMBAYARAN DISETUJUI - TIKET DIGENERATE*

> Kode Tiket : ${ticketID}
> Konser : UMBandung Fest
> Tanggal : 29/11/2025
> Harga : Rp ${data.jumlah.toLocaleString('id-ID')}
> Status : ✅ VALID
┈ׅ──˄─꯭─꯭──────꯭ׄ──ׅ┈

🎫 *QR CODE TIKET (SIMPAN BAIK-BAIK)*`;

    // Send QR code image
    if (qrUrl) {
      try {
        const qrBuffer = await getBuffer(qrUrl);
        await client.sendMessage(userJid, { 
          image: qrBuffer,
          caption: ticketMsg
        });
      } catch (e) {
        console.log('Error sending QR image:', e);
        // Fallback: send text with link
        await client.sendMessage(userJid, { text: `${ticketMsg}\n\n🔗 Link QR: ${qrUrl}` });
      }
    }

    // Konfirmasi ke admin
    m.reply(`✅ *BUKTI TRANSFER DISETUJUI*

> Kode Bukti : ${refID}
> Kode Tiket : ${ticketID}
> Pengguna : ${data.userName}
> Jumlah : Rp ${data.jumlah.toLocaleString('id-ID')}
> Status : APPROVED
┈ׅ──˄─꯭─꯭──────꯭ׄ──ׅ┈

✅ Tiket sudah dikirim ke user`);

    // Gunakan nomor HP yang sudah tersimpan di data.userPhone (dari saat bukti dikirim)
    // Jangan re-extract karena bisa jadi corrupted
    const phoneNumber = data.userPhone;
    
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
      qrCode: qrUrl || null,
      status: 'aktif',
      createdAt: new Date(),
      approvedAt: new Date(),
      approvedBy: m.sender,
      catatan: data.catatan
    });

    // Update status di Firestore bukti_transfer
    await firestore.collection('bukti_transfer').doc(refID).update({
      status: 'approved',
      approvedAt: new Date(),
      approvedBy: m.sender,
      ticketID: ticketID,
      qrCode: qrUrl || null
    });

    // Update status
    data.status = 'approved';
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

  if (!refID || !global.pendingPayments || !global.pendingPayments[refID]) {
    return m.reply('❌ Ref ID tidak ditemukan!\nFormat: .reject_bukti [ref_id] [alasan]');
  }

  try {
    const data = global.pendingPayments[refID];
    const userJid = data.userJid;

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
      rejectedBy: m.sender,
      alasan: alasan
    });

    // Update status
    data.status = 'rejected';
    global.pendingPayments[refID] = data;

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
      const filter = text.toLowerCase();
      
      // Show tickets
      if (!filter || filter === 'tiket') {
        const ticketsSnapshot = await firestore.collection('tickets')
            .where('buyerJid', '==', m.sender)
            .get();
          
          if (ticketsSnapshot.empty) {
            return m.reply('❌ Anda belum memiliki tiket apapun');
          }
          
          // Sort by newest first - in memory
          let allTickets = [];
          ticketsSnapshot.forEach(doc => allTickets.push(doc.data()));
          allTickets.sort((a, b) => b.createdAt.toDate() - a.createdAt.toDate());
          
          let riwayatText = `🎫 *TIKET SAYA*

> Total : ${allTickets.length} tiket
┈ׅ──ׄ─꯭─꯭──────꯭ׄ──ׅ┈\n`;
          
          let no = 1;
          let totalSpent = 0;
          allTickets.forEach(data => {
            totalSpent += data.harga;
            const icon = getStatusIcon(data.status === 'aktif' ? 'approved' : 'rejected');
            riwayatText += `\n${no}. ${icon} *${data.ticketID}*
> Konser : ${data.konser}
> Harga : Rp ${data.harga.toLocaleString('id-ID')}
> Status : ${data.status === 'aktif' ? 'Aktif' : 'Expired'}
> Approved : ${new Date(data.approvedAt.toDate()).toLocaleString('id-ID')}
┈ׅ──ۄ─꯭─꯭──────꯭ׄ──ׅ┈`;
            no++;
          });
          
          riwayatText += `\n💰 *TOTAL SPENDING* : Rp ${totalSpent.toLocaleString('id-ID')}`;
          
          return m.reply(riwayatText);
      }
      
      // Show pending payments
      if (filter === 'pending') {
        const buktiSnapshot = await firestore.collection('bukti_transfer')
          .where('userJid', '==', m.sender)
          .where('status', '==', 'pending')
          .get();
        
        if (buktiSnapshot.empty) {
          return m.reply('❌ Anda tidak ada bukti transfer yang pending');
        }
        
        let allData = [];
        buktiSnapshot.forEach(doc => allData.push(doc.data()));
        allData.sort((a, b) => b.createdAt.toDate() - a.createdAt.toDate());
        
        let riwayatText = `💳 *BUKTI TRANSFER MENUNGGU*

> Total : ${allData.length} pending
┈ׅ──ׄ─꯭─꯭──────꯭ׄ──ׅ┈\n`;
        
        let no = 1;
        allData.forEach(data => {
          const icon = getStatusIcon(data.status);
          riwayatText += `\n${no}. ${icon} *${data.refID}*
> Jumlah : Rp ${data.jumlah.toLocaleString('id-ID')}
> Waktu : ${new Date(data.createdAt.toDate()).toLocaleString('id-ID')}
> Catatan : ${data.catatan || 'Tidak ada'}
┈ׅ──ۄ─꯭─꯭──────꯭ׄ──ׅ┈`;
          no++;
        });
        
        return m.reply(riwayatText);
      }
      
      return m.reply(`❌ Format tidak valid!\n*Gunakan:*\n.riwayat - Lihat tiket\n.riwayat pending - Lihat bukti pending`);
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