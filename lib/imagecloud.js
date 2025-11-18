const { Storage } = require('@google-cloud/storage');
const { v4: uuidv4 } = require('uuid'); // Untuk nama file unik

const storage = new Storage({
    projectId: 'bot-topup', // Ganti dengan ID proyek Anda
    keyFilename: './db/serviceAccountKey.json', // Jalur ke kunci akun layanan
});

async function saveImageToCloud(image) {
    if (!image || !image.buffer) {
        throw new Error('Data gambar tidak valid');
    }

    const fileName = `images/${uuidv4()}.jpg`;
    const bucket = storage.bucket('bot-topup.appspot.com'); // Nama bucket Anda
    const file = bucket.file(fileName);

    await file.save(image.buffer, {
        contentType: 'image/jpeg', // Konten tipe
    });

    await file.makePublic(); // Membuat gambar dapat diakses publik

    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
    return publicUrl;
}

module.exports = { saveImageToCloud };
