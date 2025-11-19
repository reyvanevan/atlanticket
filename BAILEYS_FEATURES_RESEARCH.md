# Baileys-Mod Features Research
## Research Date: November 19, 2025

### 📚 Source Repository
- **Repo**: nstar-y/bail (baileys-mod)
- **Branch**: main
- **Key Files**: 
  - `src/Socket/messages-send.ts`
  - `src/Types/Message.ts`
  - `src/Utils/messages.ts`

---

## 🤖 AI Icon Implementation

### How it works in baileys-mod:
1. User adds `ai: true` parameter in sendMessage options
2. Code detects this flag at line 991: `const isAiMsg = 'ai' in content && !!content.ai`
3. If true, inject BinaryNode at lines 1021-1027:

```typescript
// baileys-mod: src/Socket/messages-send.ts#L1021-1027
} else if(isAiMsg) {
    additionalNodes.push({
        attrs: {
            biz_bot: '1'
        },
        tag: "bot"
    })
}
```

4. This node is passed to `relayMessage` via `additionalNodes` parameter

### BinaryNode Structure:
```javascript
{
  tag: "bot",
  attrs: {
    biz_bot: '1'
  }
}
```

### Implementation Strategy for @whiskeysockets/baileys:
Since official baileys doesn't support `additionalNodes` parameter directly, we need to:
1. ❌ **Cannot inject via sendMessage** - Official baileys doesn't accept additionalNodes
2. ✅ **Alternative**: Modify at protocol level (complex, not recommended)
3. ✅ **Best approach**: Wait for official support or use baileys-mod when stable

**Status**: ⚠️ **NOT IMPLEMENTABLE** without baileys-mod or forking baileys

---

## 🔘 Button & Interactive Messages

### Button Message Structure:
```typescript
// baileys-mod: src/Socket/messages-send.ts#L637-658
const bizNode: BinaryNode = { tag: 'biz', attrs: {} }

// For interactive/button messages:
if (message?.interactiveMessage || message?.buttonsMessage) {
    bizNode.content = [{
        tag: 'interactive',
        attrs: {
            type: 'native_flow',
            v: '1'
        },
        content: [{
            tag: 'native_flow',
            attrs: { v: '9', name: 'mixed' }
        }]
    }]
}

// For list messages:
if (message?.listMessage) {
    bizNode.content = [{
        tag: 'list',
        attrs: {
            type: 'product_list',
            v: '2'
        }
    }]
}

// Inject to stanza
(stanza.content as BinaryNode[]).push(bizNode)
```

### Message Types Supported:
1. **ButtonsMessage** - Simple buttons (deprecated by WhatsApp)
2. **InteractiveMessage** - Native flow buttons (modern approach)
3. **ListMessage** - List with sections

### Implementation Strategy for @whiskeysockets/baileys:
1. ✅ **Proto definitions exist** - `proto.Message.ButtonsMessage` available
2. ✅ **Can use official support** - Send via normal sendMessage
3. ⚠️ **BinaryNode injection needed** - For proper rendering on WA Business

**Status**: ✅ **PARTIALLY IMPLEMENTABLE** - Basic support via proto, full support needs biz node

---

## 📱 Interactive Message Types

### Available in baileys-mod:
```typescript
// src/Types/Message.ts#L35-81
type Interactiveable = {
    interactiveButtons?: proto.Message.InteractiveMessage.NativeFlowMessage.NativeFlowButton[]
    title?: string
    subtitle?: string
    media?: boolean
}
```

### Proto Support in Official Baileys:
```javascript
// Available proto types:
- proto.Message.InteractiveMessage
- proto.Message.ButtonsMessage
- proto.Message.ListMessage
- proto.Message.TemplateMessage
```

---

## 🎯 Implementation Plan

### What we CAN implement:
1. ✅ **Basic Button Messages** using `proto.Message.ButtonsMessage`
2. ✅ **Basic List Messages** using `proto.Message.ListMessage`
3. ✅ **Interactive Messages** using `proto.Message.InteractiveMessage`
4. ✅ **Template Messages** for structured content

### What we CANNOT implement (without baileys-mod):
1. ❌ **AI Icon** - Requires additionalNodes injection
2. ❌ **Full BizNode** - Requires stanza modification
3. ❌ **Advanced Native Flow** - Requires baileys-mod internals

### Recommended Approach:
1. **Phase 1**: Implement button/interactive messages using official proto
2. **Phase 2**: Test compatibility across WA Messenger & WA Business
3. **Phase 3**: Consider baileys-mod migration when stable (for AI icon)

---

## 📝 Code Examples

### Button Message (Official Baileys):
```javascript
const buttons = [
    { buttonId: 'id1', buttonText: { displayText: 'Button 1' }, type: 1 },
    { buttonId: 'id2', buttonText: { displayText: 'Button 2' }, type: 1 }
]

await conn.sendMessage(jid, {
    text: "Choose an option:",
    footer: "Footer text",
    buttons: buttons,
    headerType: 1
})
```

### List Message (Official Baileys):
```javascript
const sections = [{
    title: "Section 1",
    rows: [
        { title: "Option 1", rowId: "opt1", description: "Description 1" },
        { title: "Option 2", rowId: "opt2", description: "Description 2" }
    ]
}]

await conn.sendMessage(jid, {
    text: "Select an option:",
    footer: "Footer text",
    title: "Menu Title",
    buttonText: "Click Here",
    sections: sections
})
```

### Interactive Message (Official Baileys):
```javascript
const interactiveMessage = {
    header: {
        title: "Interactive Header",
        hasMediaAttachment: false
    },
    body: {
        text: "Interactive body content"
    },
    footer: {
        text: "Footer"
    },
    nativeFlowMessage: {
        buttons: [
            {
                name: "quick_reply",
                buttonParamsJson: JSON.stringify({
                    display_text: "Quick Reply",
                    id: "unique_id"
                })
            }
        ]
    }
}

await conn.sendMessage(jid, {
    interactiveMessage: interactiveMessage
})
```

---

## ⚠️ Important Notes

1. **Button Messages Deprecation**: WhatsApp is deprecating old button messages, prefer InteractiveMessage
2. **Business Account Required**: Some features only work on WhatsApp Business accounts
3. **Proto Compatibility**: Always check proto definitions in `@whiskeysockets/baileys/WAProto`
4. **Testing Required**: Must test on both WA Messenger and WA Business
5. **AI Icon Limitation**: Cannot implement AI icon without baileys-mod or protocol-level modification

---

## 🔄 Next Steps

1. ✅ Research completed
2. ⏭️ Create button message helper (using official proto)
3. ⏭️ Create interactive message helper (using official proto)
4. ⏭️ Test implementations
5. ⏭️ Document limitations clearly

---

## 📚 References

- Baileys-mod repo: https://github.com/nstar-y/bail
- Official Baileys: https://github.com/WhiskeySockets/Baileys
- WhatsApp Business API docs: https://developers.facebook.com/docs/whatsapp
