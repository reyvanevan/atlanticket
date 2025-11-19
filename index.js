// Biar bisa pairing code tanpa error
if (!global.crypto) {
    const { webcrypto } = require('crypto');
    global.crypto = webcrypto;
}

require('./db/config')
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, generateForwardMessageContent, prepareWAMessageMedia, generateWAMessageFromContent, generateMessageID, downloadContentFromMessage, /*makeInMemoryStore,*/ jidDecode, getAggregateVotesInPollMessage, proto } = require("@whiskeysockets/baileys")
const fs = require('fs')
const pino = require('pino')
const chalk = require('chalk')
const path = require('path')
const readline = require("readline");
const CFonts = require('cfonts')
const spin = require('spinnies')
const axios = require('axios')
const FileType = require('file-type')
const yargs = require('yargs/yargs')
const _ = require('lodash')
const { Boom } = require('@hapi/boom')
const PhoneNumber = require('awesome-phonenumber')
const { color, bgcolor } = require('./lib/color')
const { welcomeCard } = require("greetify");
const delay = ms => new Promise(resolve => setTimeout(resolve, ms))
//const { setupScheduledTasks, setClient } = require('./scheduler');

let d = new Date
let locale = 'id'
let gmt = new Date(0).getTime() - new Date('1 Januari 2021').getTime()
let weton = ['Pahing', 'Pon','Wage','Kliwon','Legi'][Math.floor(((d * 1) + gmt) / 84600000) % 5]
let week = d.toLocaleDateString(locale, { weekday: 'long' })
const calender = d.toLocaleDateString("id", {
day: 'numeric',
month: 'long',
year: 'numeric'
})
const usePairingCode = true

const { smsg, isUrl, generateMessageTag, getBuffer, getSizeMedia, fetchJson, await, sleep } = require('./lib/myfunc')
const question = (text) => {
  const rl = readline.createInterface({
input: process.stdin,
output: process.stdout
  });
  return new Promise((resolve) => {
rl.question(text, resolve)
  })
};
//=================================================//
//const store = makeInMemoryStore({ logger: pino().child({ level: 'silent', stream: 'store' }) })
//=================================================//
//=================================================//
const spinner = { 
  "interval": 120,
  "frames": [
"✖ [░░░░░░░░░░░░░░░]",
"✖ [■░░░░░░░░░░░░░░]",
"✖ [■■░░░░░░░░░░░░░]",
"✖ [■■■░░░░░░░░░░░░]",
"✖ [■■■■░░░░░░░░░░░]",
"✖ [■■■■■░░░░░░░░░░]",
"✖ [■■■■■■░░░░░░░░░]",
"✖ [■■■■■■■░░░░░░░░]",
"✖ [■■■■■■■■░░░░░░░]",
"✖ [■■■■■■■■■░░░░░░]",
"✖ [■■■■■■■■■■░░░░░]",
"✖ [■■■■■■■■■■■░░░░]",
"✖ [■■■■■■■■■■■■░░░]",
"✖ [■■■■■■■■■■■■■░░]",
"✖ [■■■■■■■■■■■■■■░]",
"✖ [■■■■■■■■■■■■■■■]"
  ]}
let globalSpinner;
const getGlobalSpinner = (disableSpins = false) => {
if(!globalSpinner) globalSpinner = new spin({ color: 'crimson', succeedColor: 'green', spinner, disableSpins});
return globalSpinner;
}
let spins = getGlobalSpinner(false)
const start = (id, text) => {
spins.add(id, {text: text})
}
const success = (id, text) => {
spins.succeed(id, {text: text})

}
//=================================================//

CFonts.say(
  "BOT TIKET OTOMATIS ATLANTICKET\n\n",
  {
    colors: ["system"],
    font: "console",
    align: "center",
  },
);
console.log(color(`INFO:`, "gold"), color(`\n-`, "gold"), color(`Jika code tidak muncul enter 1-2x lagi`, "red"), color(`\n-`, "gold"), color(`Format nomor diawali dengan 62..., bukan 08...`, "red"))
//=================================================//
async function connectToWhatsApp() {
const { state, saveCreds } = await useMultiFileAuthState(global.sessionName)

const { version } = await fetchLatestBaileysVersion();


const client = makeWASocket({
  version,
  logger: pino({ level: "silent" }),
  printQRInTerminal: !usePairingCode,
  auth: state,
  browser: [ "Ubuntu", "Chrome", "20.0.04" ],
  linkPreviewImageThumbnailWidth: 100 // WAJIB di versi 6.3.0 ke atas
});

if (usePairingCode && !client.authState.creds.registered) {
  const phoneNumber = await question(color(`\n\nMasukan Nomor :\n`, 'white'));

  const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
  console.log('Meminta Code...');
  await delay(3500);

  const code = await client.requestPairingCode(phoneNumber.trim()); // << tambahan "true"
  console.log(color(`⚠︎ Kode Pairing Bot Whatsapp kamu :`, "gold"), color(`${code}`, "white"));
}
//=================================================//
client.decodeJid = (jid) => {
if (!jid) return jid
if (/:\d+@/gi.test(jid)) {
let decode = jidDecode(jid) || {}
return decode.user && decode.server && decode.user + '@' + decode.server || jid
} else return jid
}
//=================================================//
client.ev.on('messages.upsert', async chatUpdate => {
try {
mek = chatUpdate.messages[0]
if (!mek.message) return
mek.message = (Object.keys(mek.message)[0] === 'ephemeralMessage') ? mek.message.ephemeralMessage.message : mek.message
if (mek.key && mek.key.remoteJid === 'status@broadcast') return
if (!client.public && !mek.key.fromMe && chatUpdate.type === 'notify') return
if (mek.key.id.startsWith('BAE5') && mek.key.id.length === 16) return
m = smsg(client, mek,)
require("./neko")(client, m, chatUpdate,)
} catch (err) {
console.log(err)
}
})
//=================================================//    
/*
setInterval(async () => {
  const trxfile = './db/tagihan.json'
  if (!fs.existsSync(trxfile)) return

  let tagihanList = JSON.parse(fs.readFileSync(trxfile))
  const updatedList = []

  for (const tagihan of tagihanList) {
    if (tagihan.status !== 'pending') continue

    // Hit API Mutasi QRIS
    const signature = md5(codeqr + keyorkut)
    const apiUrl = `https://restapi.simplebot.my.id/orderkuota/cekstatus?apikey=new&merchant=${merchant}&keyorkut=${keyorkut}`
    const res = await fetch(apiUrl)
    const json = await res.json()

    if (json.status !== 'success') continue

    const transaksi = json.data.find(tx => tx.issuer_reff === tagihan.ref_id || tx.buyer_reff.includes(tagihan.nomor))
    if (transaksi && transaksi.type === 'CR') {
      // Pembayaran ditemukan
      // Proses booking tiket di sini (update status tiket)
      client.sendMessage(`${tagihan.nomor}@s.whatsapp.net`, {
        text: `✅ Pembayaran berhasil untuk ${tagihan.buyer_sku_code} ke ${tagihan.tujuan}.\nSedang diproses...`
      })

      // Tandai selesai
      tagihan.status = 'paid'
    }

    updatedList.push(tagihan)
  }

  fs.writeFileSync(trxfile, JSON.stringify(updatedList, null, 2))
}, 10000) // tiap 10 detik
*/
//=================================================//
// Cache untuk metadata grup (TTL 5 menit)
const welcomeEnabled = false; // Ubah menjadi false untuk menonaktifkan pesan sambutan
const goodbyeEnabled = false; // Ubah menjadi false untuk menonaktifkan pesan perpisahan

client.ev.on('group-participants.update', async (anu) => {
  try {
    let metadata = await client.groupMetadata(anu.id);
    let participants = anu.participants;

    for (let num of participants) {
      if (anu.action == 'add' && welcomeEnabled) {
        // Kirim teks sambutan
        await client.sendMessage(anu.id, {
          text: `Halo @${num.split("@")[0]}, Selamat Datang Di Group *${metadata.subject}*\n\n_Silahkan Ketik *Daftar* Untuk Bisa Mengakses bot Pemesanan Tiket Otomatis_\n\nSilahkan Ketik *Jadwal* / *Tiket* Untuk Menampilkan Daftar Event ya ✨`,
          mentions: [num]
        });
      } else if (anu.action == 'remove' && goodbyeEnabled) {
        // Kirim teks perpisahan
        await client.sendMessage(anu.id, {
          text: `Keluar aja lu sono @${num.split("@")[0]}`,
          mentions: [num]
        });
      }
    }
  } catch (err) {
    console.error('Error in group-participants.update:', err);
  }
});
//=================================================//
//=================================================//
//=================================================//
//=================================================//
//Kalau Mau Self Lu Buat Jadi false
client.public = true
//=================================================//
//=================================================//
client.ev.on('creds.update', saveCreds)
 //=================================================//
 //=================================================//
 client.sendImage = async (jid, path, caption = '', quoted = '', options) => {
let buffer = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,`[1], 'base64') : /^https?:\/\//.test(path) ? await (await getBuffer(path)) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0)
return await client.sendMessage(jid, { image: buffer, caption: caption, ...options }, { quoted })}
//=================================================//
client.sendText = (jid, text, quoted = '', options) => client.sendMessage(jid, { text: text, ...options }, { quoted })
//=================================================//
client.sendTextWithMentions = async (jid, text, quoted, options = {}) => client.sendMessage(jid, { text: text, contextInfo: { mentionedJid: [...text.matchAll(/@(\d{0,16})/g)].map(v => v[1] + '@s.whatsapp.net') }, ...options }, { quoted })
 //=================================================//
 //=================================================//
 //=================================================//
 client.downloadAndSaveMediaMessage = async (message, filename, attachExtension = true) => {
let quoted = message.msg ? message.msg : message
let mime = (message.msg || message).mimetype || ''
let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0]
const stream = await downloadContentFromMessage(quoted, messageType)
let buffer = Buffer.from([])
for await(const chunk of stream) {
buffer = Buffer.concat([buffer, chunk])}
let type = await FileType.fromBuffer(buffer)
trueFileName = attachExtension ? (filename + '.' + type.ext) : filename
// save to file
await fs.writeFileSync(trueFileName, buffer)
return trueFileName}
//=================================================
 client.cMod = (jid, copy, text = '', sender = client.user.id, options = {}) => {
//let copy = message.toJSON()
let mtype = Object.keys(copy.message)[0]
let isEphemeral = mtype === 'ephemeralMessage'
if (isEphemeral) {
mtype = Object.keys(copy.message.ephemeralMessage.message)[0]}
let msg = isEphemeral ? copy.message.ephemeralMessage.message : copy.message
let content = msg[mtype]
if (typeof content === 'string') msg[mtype] = text || content
else if (content.caption) content.caption = text || content.caption
else if (content.text) content.text = text || content.text
if (typeof content !== 'string') msg[mtype] = {
...content,
...options}
if (copy.key.participant) sender = copy.key.participant = sender || copy.key.participant
else if (copy.key.participant) sender = copy.key.participant = sender || copy.key.participant
if (copy.key.remoteJid.includes('@s.whatsapp.net')) sender = sender || copy.key.remoteJid
else if (copy.key.remoteJid.includes('@broadcast')) sender = sender || copy.key.remoteJid
copy.key.remoteJid = jid
copy.key.fromMe = sender === client.user.id
return proto.WebMessageInfo.fromObject(copy)}
client.sendFile = async(jid, PATH, fileName, quoted = {}, options = {}) => {
let types = await client.getFile(PATH, true)
let { filename, size, ext, mime, data } = types
let type = '', mimetype = mime, pathFile = filename
if (options.asDocument) type = 'document'
if (options.asSticker || /webp/.test(mime)) {
let { writeExif } = require('./lib/sticker.js')
let media = { mimetype: mime, data }
pathFile = await writeExif(media, { packname: global.packname, author: global.packname2, categories: options.categories ? options.categories : [] })
await fs.promises.unlink(filename)
type = 'sticker'
mimetype = 'image/webp'}
else if (/image/.test(mime)) type = 'image'
else if (/video/.test(mime)) type = 'video'
else if (/audio/.test(mime)) type = 'audio'
else type = 'document'
await client.sendMessage(jid, { [type]: { url: pathFile }, mimetype, fileName, ...options }, { quoted, ...options })
return fs.promises.unlink(pathFile)}
client.parseMention = async(text) => {
return [...text.matchAll(/@([0-9]{5,16}|0)/g)].map(v => v[1] + '@s.whatsapp.net')}
//=================================================//
client.copyNForward = async (jid, message, forceForward = false, options = {}) => {
let vtype
if (options.readViewOnce) {
message.message = message.message && message.message.ephemeralMessage && message.message.ephemeralMessage.message ? message.message.ephemeralMessage.message : (message.message || undefined)
vtype = Object.keys(message.message.viewOnceMessage.message)[0]
delete(message.message && message.message.ignore ? message.message.ignore : (message.message || undefined))
delete message.message.viewOnceMessage.message[vtype].viewOnce
message.message = {
...message.message.viewOnceMessage.message}}
let mtype = Object.keys(message.message)[0]
let content = await generateForwardMessageContent(message, forceForward)
let ctype = Object.keys(content)[0]
let context = {}
if (mtype != "conversation") context = message.message[mtype].contextInfo
content[ctype].contextInfo = {
...context,
...content[ctype].contextInfo}
const waMessage = await generateWAMessageFromContent(jid, content, options ? {
...content[ctype],
...options,
...(options.contextInfo ? {
contextInfo: {
...content[ctype].contextInfo,
...options.contextInfo}} : {})} : {})
await client.relayMessage(jid, waMessage.message, { messageId:  waMessage.key.id })
return waMessage}
//=================================================//
client.getFile = async (PATH, save) => {
let res
let data = Buffer.isBuffer(PATH) ? PATH : /^data:.*?\/.*?;base64,/i.test(PATH) ? Buffer.from(PATH.split`,`[1], 'base64') : /^https?:\/\//.test(PATH) ? await (res = await getBuffer(PATH)) : fs.existsSync(PATH) ? (filename = PATH, fs.readFileSync(PATH)) : typeof PATH === 'string' ? PATH : Buffer.alloc(0)
//if (!Buffer.isBuffer(data)) throw new TypeError('Result is not a buffer')
let type = await FileType.fromBuffer(data) || {
mime: 'application/octet-stream',
ext: '.bin'
}
filename = path.join(__filename, '../src/' + new Date * 1 + '.' + type.ext)
if (data && save) fs.promises.writeFile(filename, data)
return {
res,
filename,
	size: await getSizeMedia(data),
...type,
data
}
}
client.serializeM = (m) => smsg(client, m,)
    
   // let cronInitialized = false;
client.ev.on("connection.update", async (update) => {
const { connection, lastDisconnect } = update;
if (connection === "close") {
  let reason = new Boom(lastDisconnect?.error)?.output.statusCode;
  if (reason === DisconnectReason.badSession) {
console.log(`Bad Session File, Please Delete Session and Scan Again`);
process.exit();
  } else if (reason === DisconnectReason.connectionClosed) {
console.log("Connection closed, reconnecting....");
connectToWhatsApp();
  } else if (reason === DisconnectReason.connectionLost) {
console.log("Connection Lost from Server, reconnecting...");
connectToWhatsApp();
  } else if (reason === DisconnectReason.connectionReplaced) {
console.log("Connection Replaced, Another New Session Opened, Please Restart Bot");
process.exit();
 // } else if (reason === DisconnectReason.loggedOut) {
//console.log(`Device Logged Out, Please Delete Folder Session yusril and Scan Again.`);
//process.exit();
     } else if (reason === DisconnectReason.loggedOut) {
  console.log('Device Logged Out. Deleting session and restarting...');
  fs.rmSync('./session', { recursive: true, force: true }); // <- hapus sesi
  await delay(3000);
  connectToWhatsApp(); // restart ulang pairing 
     
  } else if (reason === DisconnectReason.restartRequired) {
console.log("Restart Required, Restarting...");
connectToWhatsApp();
  } else if (reason === DisconnectReason.timedOut) {
console.log("Connection TimedOut, Reconnecting...");
connectToWhatsApp();
  } else {
console.log(`Unknown DisconnectReason: ${reason}|${connection}`);
connectToWhatsApp();
  }
} else if (connection === 'connecting') {console.log(color(`─[`,`magenta`),`「`,  color(`Powered by Atlantic Gate`,`red`), `」`,  color(`]─`,`magenta`))

start(`1`,`Connecting...`)
} else if (connection === "open") {
  success(`1`,`[■■■■■■■■■■■■■■■] Connected`)
  
  // Berikan client ke scheduler untuk notifikasi
 // setClient(client);
  
  // Inisialisasi scheduled tasks
  //setupScheduledTasks();
  
  //console.log("Scheduled tasks initialized successfully!");
}

});
return client
}
connectToWhatsApp()
let file = require.resolve(__filename)
fs.watchFile(file, () => {
fs.unwatchFile(file)
console.log(chalk.redBright(`Update ${__filename}`))
delete require.cache[file]
require(file)
})
