const admin = require('firebase-admin');
const serviceAccount = require('./db/serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function fetchTicket() {
  try {
    console.log('\n🎫 FETCHING TICKET DATA FROM FIRESTORE\n');
    
    const snapshot = await db.collection('tickets').limit(1).get();
    
    if (snapshot.empty) {
      console.log('❌ No tickets found in Firestore!');
      process.exit(0);
    }

    console.log(`📊 Total documents found: ${snapshot.size}\n`);
    
    snapshot.forEach(doc => {
      const data = doc.data();
      console.log('═══════════════════════════════════════');
      console.log(`📌 Document ID: ${doc.id}`);
      console.log('═══════════════════════════════════════');
      console.log(JSON.stringify(data, null, 2));
      console.log('═══════════════════════════════════════\n');
    });

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

fetchTicket();
