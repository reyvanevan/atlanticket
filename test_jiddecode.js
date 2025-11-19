const { jidDecode } = require("@whiskeysockets/baileys");

// Test berbagai format JID
const testJids = [
  '161447921340608@lid',
  '6289653544913@s.whatsapp.net',
  '628896535449@s.whatsapp.net',
  '62:89653544913@s.whatsapp.net',
  '0289653544913@s.whatsapp.net'
];

testJids.forEach(jid => {
  try {
    const decoded = jidDecode(jid);
    console.log(`\n✓ JID: ${jid}`);
    console.log(`  Decoded:`, JSON.stringify(decoded, null, 2));
  } catch (e) {
    console.log(`\n✗ JID: ${jid}`);
    console.log(`  Error: ${e.message}`);
  }
});
