const admin = require('firebase-admin');
const serviceAccount = require('./db/serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function checkBuktiTransfer() {
  try {
    const snapshot = await db.collection('bukti_transfer').limit(3).get();
    
    console.log(`\n📋 Total documents: ${snapshot.size}\n`);
    
    snapshot.forEach(doc => {
      const data = doc.data();
      console.log(`📄 Document ID: ${doc.id}`);
      console.log(`   userJid: ${data.userJid}`);
      console.log(`   userPhone: ${data.userPhone}`);
      console.log(`   userName: ${data.userName}`);
      console.log(`   jumlah: ${data.jumlah}`);
      console.log(`   status: ${data.status}`);
      console.log(`---\n`);
    });

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

checkBuktiTransfer();
