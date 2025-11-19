require('./db/config')
let autoGetLayanan = false;
let intervalId;
let antilinkEnabled = false;

const { BufferJSON, WA_DEFAULT_EPHEMERAL, makeWASocket, useMultiFileAuthState, getAggregateVotesInPollMessage, generateWAMessageFromContent, proto, generateWAMessageContent, generateWAMessage, prepareWAMessageMedia, downloadContentFromMessage, areJidsSameUser, getContentType } = require("baileys-mod")
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
    const sender = m.isGroup ? (m.key.participant ? m.key.participant : m.participant) : m.key.remoteJid
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
    if (m.message) {
      console.log(chalk.red(chalk.bgBlack('[ PESAN ] => ')), chalk.white(chalk.bgBlack(budy || m.mtype)) + '\n' + chalk.magenta('=> Dari'), chalk.green(pushname), chalk.yellow(m.sender.split("@")[0]) + '\n' + chalk.blueBright('=> Di'), chalk.green(m.isGroup ? pushname : 'Private Chat'), chalk.magenta(`\nJam :`) + time1)
    }


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
      
    switch (command) {
			
case 'bot': {
  let pesanBot;
  if (isGroup) {
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


      // ============= BUTTON MESSAGE TEST COMMANDS =============
      case 'testbutton':
      case 'buttondemo': {
        const { sendButtonMessage } = require('./lib/buttonMessage');
        
        try {
          await sendButtonMessage(client, m.chat, {
            text: '🔘 *Button Message Demo*\n\nPilih salah satu opsi di bawah ini:',
            footer: '© atlanticket 2025',
            buttons: [
              { id: 'btn1', text: '✈️ Cek Tiket' },
              { id: 'btn2', text: '💰 Cek Saldo' },
              { id: 'btn3', text: '📞 Contact Admin' }
            ],
            quoted: m
          });
          
          m.reply('✅ Button message sent! (Legacy style - may be deprecated)');
        } catch (error) {
          m.reply(`❌ Error: ${error.message}\n\nℹ️ Button messages mungkin tidak support di device kamu.`);
        }
        break;
      }

      case 'testlist':
      case 'listdemo': {
        const { sendListMessage } = require('./lib/buttonMessage');
        
        try {
          await sendListMessage(client, m.chat, {
            text: '📱 *List Message Demo*\n\nPilih kategori tiket yang kamu inginkan:',
            title: '🎫 Menu Tiket atlanticket',
            buttonText: '📋 Lihat Pilihan',
            footer: 'Pilih salah satu untuk melanjutkan',
            sections: [
              {
                title: '✈️ Tiket Pesawat',
                rows: [
                  { rowId: 'ekonomi', title: 'Kelas Ekonomi', description: 'Harga terjangkau untuk perjalanan hemat' },
                  { rowId: 'bisnis', title: 'Kelas Bisnis', description: 'Kenyamanan premium dengan layanan ekstra' },
                  { rowId: 'first', title: 'Kelas First', description: 'Luxury experience dengan fasilitas terbaik' }
                ]
              },
              {
                title: '🚢 Tiket Kapal',
                rows: [
                  { rowId: 'ferry', title: 'Ferry Reguler', description: 'Penyeberangan ekonomis' },
                  { rowId: 'fastboat', title: 'Fast Boat', description: 'Cepat dan nyaman' }
                ]
              }
            ],
            quoted: m
          });
          
          m.reply('✅ List message sent successfully!');
        } catch (error) {
          m.reply(`❌ Error: ${error.message}\n\nℹ️ List messages mungkin tidak support di device kamu.`);
        }
        break;
      }

      case 'testinteractive':
      case 'interactivedemo': {
        const { sendInteractiveButton } = require('./lib/buttonMessage');
        
        try {
          await sendInteractiveButton(client, m.chat, {
            title: '🚀 Interactive Message',
            text: 'Ini adalah interactive message dengan native flow buttons (modern style)',
            footer: 'Powered by atlanticket',
            buttons: [
              { id: 'opt1', text: '⭐ Option 1' },
              { id: 'opt2', text: '💎 Option 2' }
            ],
            quoted: m
          });
          
          m.reply('✅ Interactive button sent! (Modern native flow style)');
        } catch (error) {
          m.reply(`❌ Error: ${error.message}\n\nℹ️ Interactive messages mungkin tidak support di device kamu.`);
        }
        break;
      }

      case 'testtemplate':
      case 'templatedemo': {
        const { sendTemplateMessage } = require('./lib/buttonMessage');
        
        try {
          await sendTemplateMessage(client, m.chat, {
            text: '📨 *Template Message Demo*\n\nTemplate message dengan quick reply buttons (max 4)',
            footer: 'atlanticket - Booking Made Easy',
            buttons: [
              { id: 'tpl1', text: '🎫 Book Now' },
              { id: 'tpl2', text: '💳 Payment' },
              { id: 'tpl3', text: '📞 Support' },
              { id: 'tpl4', text: '❓ Help' }
            ],
            quoted: m
          });
          
          m.reply('✅ Template message sent!');
        } catch (error) {
          m.reply(`❌ Error: ${error.message}\n\nℹ️ Template messages mungkin tidak support di device kamu.`);
        }
        break;
      }

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