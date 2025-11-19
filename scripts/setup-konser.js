// Script untuk setup konser langsung ke Firestore
const admin = require('firebase-admin');
const serviceAccount = require('../db/serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://your-project-id.firebaseio.com'
});

const firestore = admin.firestore();

async function setupKonser() {
  try {
    const konserData = {
      nama: 'UMBandung Fest',
      tanggal: '29/11/2025',
      jam: '10:00 WIB sd selesai',
      lokasi: 'Lapang Adymic Universitas Muhammadiyah Bandung',
      harga: 25000,
      stokAwal: 2500,
      stokTersisa: 2500,
      deskripsi: 'UMBandung Festival',
      status: 'aktif',
      dibuat: new Date(),
      diupdate: new Date()
    };

    const konserRef = firestore.collection('concerts').doc();
    await konserRef.set(konserData);

    console.log('✅ Konser berhasil di-setup!');
    console.log(`📋 Konser ID: ${konserRef.id}`);
    console.log(`🎤 Nama: ${konserData.nama}`);
    console.log(`📅 Tanggal: ${konserData.tanggal}`);
    console.log(`🕐 Jam: ${konserData.jam}`);
    console.log(`📍 Lokasi: ${konserData.lokasi}`);
    console.log(`💰 Harga: Rp ${konserData.harga.toLocaleString('id-ID')}`);
    console.log(`🎫 Stok: ${konserData.stokTersisa} tiket`);
    console.log(`📝 Deskripsi: ${konserData.deskripsi}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

setupKonser();
