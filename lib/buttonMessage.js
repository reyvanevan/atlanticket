/**
 * Button Message Helper for atlanticket
 * Supports ButtonsMessage and InteractiveMessage using official @whiskeysockets/baileys
 * 
 * @author atlanticket team
 * @date November 19, 2025
 */

const { proto, generateWAMessageFromContent, prepareWAMessageMedia } = require('@whiskeysockets/baileys');

/**
 * Send simple button message (legacy style - deprecated by WhatsApp)
 * @param {Object} conn - Baileys connection instance
 * @param {string} jid - Recipient JID
 * @param {Object} options - Message options
 * @param {string} options.text - Main message text
 * @param {Array} options.buttons - Array of button objects [{ id, text }]
 * @param {string} [options.footer] - Optional footer text
 * @param {Object} [options.quoted] - Optional quoted message
 * @returns {Promise} Send result
 */
async function sendButtonMessage(conn, jid, options) {
    const { text, buttons, footer, quoted } = options;

    if (!text) {
        throw new Error('Text is required for button message');
    }

    if (!buttons || !Array.isArray(buttons) || buttons.length === 0) {
        throw new Error('Buttons array is required and must not be empty');
    }

    if (buttons.length > 3) {
        console.warn('⚠️ WhatsApp recommends maximum 3 buttons. Consider using list message instead.');
    }

    // Format buttons to Baileys proto format
    const formattedButtons = buttons.map((btn, index) => ({
        buttonId: btn.id || `btn_${index + 1}`,
        buttonText: {
            displayText: btn.text || btn.displayText || `Button ${index + 1}`
        },
        type: 1
    }));

    const messageContent = {
        text: text,
        footer: footer || '',
        buttons: formattedButtons,
        headerType: 1
    };

    const sendOptions = {};
    if (quoted) {
        sendOptions.quoted = quoted;
    }

    try {
        return await conn.sendMessage(jid, messageContent, sendOptions);
    } catch (error) {
        console.error('❌ Error sending button message:', error.message);
        throw error;
    }
}

/**
 * Send interactive message with native flow buttons (modern style)
 * Following baileys-mod implementation exactly
 * @param {Object} conn - Baileys connection instance
 * @param {string} jid - Recipient JID
 * @param {Object} options - Message options
 * @param {string} options.text - Main message text
 * @param {string} [options.title] - Optional header title
 * @param {string} [options.footer] - Optional footer text
 * @param {Array} options.buttons - Array of button objects [{ id, text }]
 * @param {Object} [options.quoted] - Optional quoted message
 * @param {Buffer} [options.image] - Optional image buffer
 * @returns {Promise} Send result
 */
async function sendInteractiveButton(conn, jid, options) {
    const { text, title, footer, buttons, quoted, image } = options;

    if (!text) {
        throw new Error('Text is required for interactive message');
    }

    if (!buttons || !Array.isArray(buttons) || buttons.length === 0) {
        throw new Error('Buttons array is required and must not be empty');
    }

    // Format buttons EXACTLY like baileys-mod
    const interactiveButtons = buttons.map((btn, index) => ({
        name: 'quick_reply',
        buttonParamsJson: JSON.stringify({
            display_text: btn.text || btn.displayText || `Button ${index + 1}`,
            id: btn.id || `btn_${index + 1}`
        })
    }));

    // Build message content EXACTLY like baileys-mod
    const messageContent = {
        text: text,
        interactiveButtons: interactiveButtons
    };

    // Add optional fields
    if (title) {
        messageContent.title = title;
    }

    if (footer) {
        messageContent.footer = footer;
    }

    // Add image if provided
    if (image) {
        messageContent.image = image;
    }

    const sendOptions = {};
    if (quoted) {
        sendOptions.quoted = quoted;
    }

    try {
        // Send directly with conn.sendMessage like baileys-mod
        return await conn.sendMessage(jid, messageContent, sendOptions);
    } catch (error) {
        console.error('❌ Error sending interactive button:', error.message);
        throw error;
    }
}

/**
 * Send list message with sections (for longer option lists)
 * Following baileys-mod list format EXACTLY
 * @param {Object} conn - Baileys connection instance
 * @param {string} jid - Recipient JID
 * @param {Object} options - Message options
 * @param {string} options.text - Main message text
 * @param {string} [options.title] - Optional title
 * @param {string} [options.buttonText] - Button text (default: "Click Here")
 * @param {string} [options.footer] - Optional footer text
 * @param {Array} options.sections - Array of sections [{ title, rows: [{ rowId, title, description }] }]
 * @param {Object} [options.quoted] - Optional quoted message
 * @returns {Promise} Send result
 */
async function sendListMessage(conn, jid, options) {
    const { text, title, buttonText, footer, sections, quoted } = options;

    if (!text) {
        throw new Error('Text is required for list message');
    }

    if (!sections || !Array.isArray(sections) || sections.length === 0) {
        throw new Error('Sections array is required and must not be empty');
    }

    // Validate sections structure
    sections.forEach((section, sIndex) => {
        if (!section.rows || !Array.isArray(section.rows) || section.rows.length === 0) {
            throw new Error(`Section ${sIndex + 1} must have rows array with at least one row`);
        }
        // Ensure rowId exists (baileys expects rowId not id)
        section.rows.forEach((row, rIndex) => {
            if (!row.rowId && row.id) {
                row.rowId = row.id;
            }
            if (!row.rowId) {
                row.rowId = `row_${sIndex}_${rIndex}`;
            }
        });
    });

    const messageContent = {
        text: text,
        footer: footer || '',
        title: title || '',
        buttonText: buttonText || 'Click Here',
        sections: sections
    };

    const sendOptions = {};
    if (quoted) {
        sendOptions.quoted = quoted;
    }

    try {
        return await conn.sendMessage(jid, messageContent, sendOptions);
    } catch (error) {
        console.error('❌ Error sending list message:', error.message);
        throw error;
    }
}

/**
 * Send template message with 4 quick reply buttons
 * @param {Object} conn - Baileys connection instance
 * @param {string} jid - Recipient JID
 * @param {Object} options - Message options
 * @param {string} options.text - Main message text
 * @param {string} [options.footer] - Optional footer text
 * @param {Array} options.buttons - Array of template button objects [{ id, text }] (max 4)
 * @param {Object} [options.quoted] - Optional quoted message
 * @returns {Promise} Send result
 */
async function sendTemplateMessage(conn, jid, options) {
    const { text, footer, buttons, quoted } = options;

    if (!text) {
        throw new Error('Text is required for template message');
    }

    if (!buttons || !Array.isArray(buttons) || buttons.length === 0) {
        throw new Error('Buttons array is required and must not be empty');
    }

    if (buttons.length > 4) {
        throw new Error('Template message supports maximum 4 buttons');
    }

    // Format buttons for template message
    const templateButtons = buttons.map((btn, index) => ({
        index: index,
        quickReplyButton: {
            displayText: btn.text || btn.displayText || `Button ${index + 1}`,
            id: btn.id || `template_btn_${index + 1}`
        }
    }));

    const messageContent = {
        templateMessage: {
            hydratedTemplate: {
                hydratedContentText: text,
                hydratedFooterText: footer || '',
                hydratedButtons: templateButtons
            }
        }
    };

    const sendOptions = {};
    if (quoted) {
        sendOptions.quoted = quoted;
    }

    try {
        return await conn.sendMessage(jid, messageContent, sendOptions);
    } catch (error) {
        console.error('❌ Error sending template message:', error.message);
        throw error;
    }
}

module.exports = {
    sendButtonMessage,
    sendInteractiveButton,
    sendListMessage,
    sendTemplateMessage
};
