# Database Configuration

## serviceAccountKey.json

This file is required for Firebase Admin SDK authentication.

### How to get it:

1. Go to Firebase Console: https://console.firebase.google.com/
2. Select your project (or create new: `atlanticket`)
3. Go to Project Settings ⚙️ > Service accounts
4. Click "Generate new private key"
5. Download the JSON file
6. Rename it to `serviceAccountKey.json`
7. Place it in this `db/` folder

### Security:
- ✅ This file is in `.gitignore` (won't be committed)
- ⚠️ NEVER share this file publicly
- ⚠️ NEVER commit to GitHub

### Template:
See `serviceAccountKey.json.template` for structure reference.
