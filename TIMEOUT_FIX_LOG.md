# Timeout & Image Download Error Fixes

## Problems Identified

### 1. **"Timed Out" Error**
- Images downloading from external URLs sometimes timeout indefinitely
- No timeout configuration in `getBuffer` function
- Causes bot to hang when sending images to admins

### 2. **"Bad MAC" Session Errors**
- Baileys library session encryption errors (external to our code)
- Related to WhatsApp Web API session state
- Common with long-running connections

---

## Solutions Implemented

### 1. Added Timeout to `getBuffer` Function
**File:** `lib/myfunc.js` (Line 100)

```javascript
// Added 30-second timeout to axios request
timeout: 30000, // 30 detik timeout
```

**Impact:** Image downloads will now fail gracefully after 30 seconds instead of hanging indefinitely.

---

### 2. Implemented Retry Logic with Fallback

**File:** `neko.js` - Three locations updated:

#### a) **Bukti Transfer Notification (Line ~1307)**
- Retry up to 2 times with 1-second delay between attempts
- Fallback: Send text message with image URL link if download fails
- Doesn't block the flow

```
Send with image
  ↓
If timeout/error → retry (max 2x)
  ↓
If still fails → send text + URL link
```

#### b) **Show Bukti Command (Line ~1365)**
- Similar retry logic for admin viewing evidence
- Shows fallback message if image can't load

#### c) **QR Code Ticket Delivery (Line ~1475)**
- Retry logic for QR code image sending
- Fallback: sends text with QR code link

---

## Behavior After Fix

### Before
```
⚠️ Gagal send image ke admin, fallback ke text: Timed Out
Error: Timed Out (blocks user feedback)
```

### After
```
Attempt 1: Download image (timeout: 30s)
  ↓ Failed → wait 1s
Attempt 2: Download image (timeout: 30s)
  ↓ Failed → use fallback
✅ Send message with URL link to user
```

---

## Technical Details

### Timeout Configuration
- **30 seconds** for each image download attempt
- Sufficient for most image hosts (PixHost, etc.)
- Prevents indefinite hangs

### Retry Strategy
- **Max 2 retries** (3 total attempts)
- **1-second delay** between attempts
- Balances reliability vs speed

### Fallback Approach
- Text messages always sent (no loss of information)
- Image URL/link included in fallback
- User can manually open if needed
- Admin gets notified either way

---

## Session Errors (Bad MAC)

The "Bad MAC Error" messages are from Baileys library:
- Related to WhatsApp Web session encryption state
- Not directly fixable in our code
- Solutions:
  - **Restart bot** if they become frequent
  - **Clear session** if they persist
  - Consider **upgrading Baileys** to latest version

---

## Testing Checklist

- [ ] Send payment proof with image (test timeout)
- [ ] View bukti with `.show [refID]` command
- [ ] Check admin notifications with images
- [ ] Test with slow internet (simulate timeout)
- [ ] Verify fallback text messages work
- [ ] Monitor console for retry messages

---

## Future Improvements

1. **Increase retry limit** if 2 is not enough
2. **Add metrics** to track timeout frequency
3. **Implement image caching** to avoid re-downloads
4. **Use CDN** for faster, more reliable image delivery
5. **Add user feedback** about image loading status

