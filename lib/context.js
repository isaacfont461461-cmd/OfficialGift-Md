const settings = require('../settings.js');

const isAdmin = require('./isAdmin');

const { channelInfo } = require('./messageConfig');

function buildContext(sock, message, extra = {}) {

    const chatId = message.key.remoteJid;

    const sender = message.key.fromMe

        ? sock.user.id

        : (message.key.participant || message.key.remoteJid);

    // Fix: Better handling of sender ID

    let cleanSender = sender;

    if (sender.includes(':')) {

        cleanSender = sender.split(':')[0];

    }

    // Remove @s.whatsapp.net if present to get just the number
const senderNumber = cleanSender.replace('@s.whatsapp.net', '').replace('@lid', '');
    //const senderNumber = cleanSender.replace('@s.whatsapp.net', '');

    const isGroup = chatId.endsWith('@g.us');

    const isPrivate = !isGroup;

    // Enhanced sudo check - FIXED

    const senderIsSudo = message.key.fromMe || 
    senderNumber === settings.ownerNumber || 
    senderNumber === global.ownerLid ||
        cleanSender === settings.ownerNumber + '@s.whatsapp.net' ||
        (settings.sudo && Array.isArray(settings.sudo) && 

         (settings.sudo.includes(senderNumber) || 

          settings.sudo.includes(cleanSender) ||

          settings.sudo.includes(senderNumber + '@s.whatsapp.net')));

    // Enhanced message text extraction

    const rawText = message.message?.conversation?.trim() ||

        message.message?.extendedTextMessage?.text?.trim() ||

        message.message?.imageMessage?.caption?.trim() ||

        message.message?.videoMessage?.caption?.trim() ||

        message.message?.documentMessage?.caption?.trim() ||

        '';

    const userMessage = rawText.toLowerCase()

        .replace(/\.\s+/g, '.')

        .trim();

    // Message metadata

    const messageId = message.key.id;

    const timestamp = message.messageTimestamp;

    const isFromOwner = message.key.fromMe;

    

    // Message type detection

    const messageType = Object.keys(message.message || {})[0];

    const hasMedia = ['imageMessage', 'videoMessage', 'audioMessage', 'documentMessage', 'stickerMessage'].includes(messageType);

    const hasQuotedMessage = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;

    

    // Group admin checks

    let isSenderAdmin = false;

    let isBotAdmin = false;

    if (isGroup && extra.isAdminCheck) {

        const adminStatus = extra.adminStatus || {};

        isSenderAdmin = adminStatus.isSenderAdmin || false;

        isBotAdmin = adminStatus.isBotAdmin || false;

    }

    // Extract mentions if any

    const mentions = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];

    const isBotMentioned = mentions.includes(sock.user.id);

    // Default External Ad Reply configuration

    const defaultExternalAdReply = {

        title: `💫 GIFT MD`,

        body: `Ⓜ️ Status: Online | 🚀 Version: ${settings.version}`,

        thumbnailUrl: //"https://www.instagram.com/p/DOU0j1mAh1I/?igsh=MW5xMW4zY256cWU1eg==",
        "https://files.catbox.moe/hoqhfi.jpeg",

        sourceUrl: "https://github.com/mruniquehacker/Knightbot-MD",

        mediaType: 1,

        showAdAttribution: false,

        renderLargerThumbnail: false

    };

    // Enhanced reply function that works with all message types and text properties

    const reply = async (content, options = {}) => {

        const useExternalAd = options.externalAdReply !== false;

        const customExternalAd = options.externalAdReply === true ? defaultExternalAdReply : options.externalAdReply;

        

        try {

            const { applyFontStyle, getSetting } = require('./database');

            const currentStyle = getSetting('fontstyle', 'normal');

            

            let messageOptions = {                ...channelInfo,

                ...options

            };

            // Handle different content types

            if (typeof content === 'string') {

                // Plain string - apply font styling

                const formattedText = applyFontStyle(content);

                messageOptions.text = formattedText;

                

            } else if (typeof content === 'object' && content !== null) {

                // Object content - copy all properties and apply styling to text fields

                messageOptions = { ...messageOptions, ...content };

                

                // Apply font styling to 'text' property if it exists

                if (content.text && typeof content.text === 'string') {

                    const formattedText = applyFontStyle(content.text);

                    messageOptions.text = formattedText;

                }

                

                // Apply font styling to 'caption' property if it exists

                if (content.caption && typeof content.caption === 'string') {

                    const formattedCaption = applyFontStyle(content.caption);

                    messageOptions.caption = formattedCaption;

                }

            }

            

            // Add external ad reply if enabled

            if (useExternalAd) {

                messageOptions.contextInfo = {

                    ...messageOptions.contextInfo,

                    externalAdReply: customExternalAd || defaultExternalAdReply

                };

            }

            

            // Clean up the externalAdReply option to avoid conflicts

            delete messageOptions.externalAdReply;

            

            return await sock.sendMessage(chatId, messageOptions, { quoted: message });

            

        } catch (error) {

            console.error('❌ Error in enhanced reply function:', error);

            

            // Fallback without font styling

            let fallbackOptions = {

                ...channelInfo,

                ...options

            };

            

            if (typeof content === 'string') {

                fallbackOptions.text = content;

            } else if (typeof content === 'object' && content !== null) {

                fallbackOptions = { ...fallbackOptions, ...content };

            }

            

            if (useExternalAd) {

                fallbackOptions.contextInfo = {

                    ...fallbackOptions.contextInfo,

                    externalAdReply: customExternalAd || defaultExternalAdReply

                };

            }

            

            delete fallbackOptions.externalAdReply;

            return await sock.sendMessage(chatId, fallbackOptions, { quoted: message });

        }

    };

        

    const react = async (emoji) => {

        return await sock.sendMessage(chatId, {

            react: {

                text: emoji,

                key: message.key

            }

        });

    };

    const replyWithAd = async (content, customAd = {}, options = {}) => {

        const externalAdReply = { ...defaultExternalAdReply, ...customAd };

        return await reply(content, { ...options, externalAdReply });

    };
const replyPlain = async (content, options = {}) => {
    try {
        const { applyFontStyle } = require('./database');
        
        let messageOptions = {
            ...channelInfo,   // ✅ keeps "View channel" & forwarded label (NO ads)
            ...options
        };

        // Handle different content types (same logic as reply() but NO external ads)
        if (typeof content === 'string') {
            // Plain string - apply font styling
            const formattedText = applyFontStyle(content);
            messageOptions.text = formattedText;
            
        } else if (typeof content === 'object' && content !== null) {
            // Object content - copy all properties and apply styling to ALL text fields
            messageOptions = { ...messageOptions, ...content };
            
            // Apply font styling to ALL possible text properties
            const textProperties = [
                'text', 'caption', 'title', 'body', 'footer', 
                'headerText', 'footerText', 'buttonText', 'description'
            ];
            
            textProperties.forEach(prop => {
                if (content[prop] && typeof content[prop] === 'string') {
                    messageOptions[prop] = applyFontStyle(content[prop]);
                }
            });
            
            // Handle nested text in buttons, sections, etc.
            if (content.buttons && Array.isArray(content.buttons)) {
                messageOptions.buttons = content.buttons.map(button => ({
                    ...button,
                    buttonText: button.buttonText && typeof button.buttonText === 'object' ? {
                        ...button.buttonText,
                        displayText: button.buttonText.displayText ? 
                            applyFontStyle(button.buttonText.displayText) : 
                            button.buttonText.displayText
                    } : button.buttonText
                }));
            }
            
            // Handle sections in list messages
            if (content.sections && Array.isArray(content.sections)) {
                messageOptions.sections = content.sections.map(section => ({
                    ...section,
                    title: section.title ? applyFontStyle(section.title) : section.title,
                    rows: section.rows ? section.rows.map(row => ({
                        ...row,
                        title: row.title ? applyFontStyle(row.title) : row.title,
                        description: row.description ? applyFontStyle(row.description) : row.description
                    })) : section.rows
                }));
            }
        }

        return await sock.sendMessage(chatId, messageOptions, { quoted: message });

    } catch (error) {
        console.error('❌ Error in replyPlain function:', error);
        
        // Fallback without font styling
        let fallbackOptions = {
            ...channelInfo, 
            ...options
        };
        
        if (typeof content === 'string') {
            fallbackOptions.text = content;
        } else if (typeof content === 'object' && content !== null) {
            fallbackOptions = { ...fallbackOptions, ...content };
        }
        
        return await sock.sendMessage(chatId, fallbackOptions, { quoted: message });
    }
};
    return {

        // Basic info

        chatId,

        sender,

        cleanSender,

        senderNumber, // Added this for debugging

        isGroup,

        isPrivate,

        messageId,

        timestamp,

        

        // Permission checks

        isSenderAdmin,

        isBotAdmin,

        senderIsSudo,

        isFromOwner,

        

        // Message content

        userMessage,

        rawText,

        messageType,

        hasMedia,

        hasQuotedMessage,

        

        // Social features

        mentions,

        isBotMentioned,

        

        // Configuration

        channelInfo,

        defaultExternalAdReply,

        

        // Utility functions

        reply,
        
        replyPlain,
        
        react,

        replyWithAd

    };

}

module.exports = { buildContext };
