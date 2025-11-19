# 🎫 Atlanticket - Bot Penjualan Tiket Konser

Bot WhatsApp otomatis untuk penjualan tiket konser dengan simple text-based menu.

## ✨ Fitur

- ✅ **Pairing Code**: Koneksi dengan pairing code (ATLNCODE)
- ✅ **Menu Konser**: List konser dengan `.menu`
- ✅ **Pesan Detail**: Lihat detail tiket dengan `.order [nomor]`
- ✅ **Checkout**: Flow pembayaran dengan `.checkout`
- ✅ **Stable Connection**: Official Baileys (@whiskeysockets/baileys)

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Environment
Copy `.env.example` ke `.env` dan sesuaikan:
```env
BOT_NUMBER=6285166328091
BOT_NAME=AtlanticBot
OWNER_NUMBERS=6281224258870,6289653544913
LINK_GROUP=https://chat.whatsapp.com/xxxxx
```

### 3. Run Bot
```bash
npm start
```

### 4. Pairing
Bot akan minta nomor WhatsApp. Input nomor dengan format `62xxxxx` (tanpa 0).
Pairing code akan muncul di terminal.

## 📱 Perintah

### `.menu`
Tampilkan daftar konser yang tersedia.

**Output:**
```
🎫 TIKET KONSER ATLANTICKET 🎫
1️⃣ Konser Artist A - 5 Des - Rp 500.000
2️⃣ Konser Artist B - 12 Des - Rp 750.000
3️⃣ Konser Artist C - 20 Des - Rp 600.000
```

### `.order [nomor]`
Lihat detail tiket dan instruksi pemesanan.

**Contoh:**
```
.order 1
```

**Output:**
```
📋 DETAIL TIKET KONSER
🎤 Event: Konser Artist A
📅 Tanggal: 5 Desember 2025
🕐 Jam: 19:00 WIB
📍 Lokasi: Jakarta Convention Center
💰 Harga: Rp 500.000
```

### `.checkout`
Tampilkan informasi pembayaran dan QRIS.

**Output:**
```
💳 PROSES CHECKOUT TIKET
Silahkan lakukan pembayaran ke:
💳 Transfer: ATM/E-Banking
👨‍💼 Rekening: 6281224258870
📲 QRIS: [link QRIS]
```

## 📋 Flow Pemesanan

1. User: `.menu`
   - Bot menampilkan daftar konser

2. User: `.order 1`
   - Bot menampilkan detail tiket & harga

3. User: `.checkout`
   - Bot menampilkan info pembayaran & QRIS

4. User melakukan pembayaran
   - Bot mengirim tiket setelah verifikasi

## 🔧 Konfigurasi Konser

Edit `neko.js` di section `case 'order':` untuk menambah/mengubah konser:

```javascript
const konserData = {
  1: {
    nama: 'Konser Artist A',
    tanggal: '5 Desember 2025',
    harga: 500000,
    lokasi: 'Jakarta Convention Center',
    jam: '19:00 WIB'
  },
  // Tambah konser baru di sini...
};
```

## 🛠️ Troubleshooting

### Bot tidak connect
- Cek internet connection
- Pastikan format nomor benar (62xxxxx)
- Delete folder `session/` dan pairing ulang

### Pesan tidak masuk
- Cek bot tidak dalam private mode (`client.public = true` di index.js)
- Pastikan nomor owner benar di `.env`

### Pairing code error
- Tunggu 3-5 detik setelah input nomor
- Jika error, delete `session/` dan coba lagi

## 📞 Support

Hubungi owner untuk issues atau customization:
- WhatsApp: [Link Group](https://chat.whatsapp.com/LtMNZXHdsjXJYPUcgWhINb)
- Owner: Reyvan

## 📝 License

MIT

---

**Last Updated:** November 19, 2025
**Bot Version:** 1.0
**Baileys Version:** @whiskeysockets/baileys 6.7.18
