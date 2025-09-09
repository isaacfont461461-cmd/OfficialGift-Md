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

    const senderNumber = cleanSender.replace('@s.whatsapp.net', '');

    

    const isGroup = chatId.endsWith('@g.us');

    const isPrivate = !isGroup;

    

    // Enhanced sudo check - FIXED

    const senderIsSudo = message.key.fromMe || // If message is from bot itself

        senderNumber === settings.ownerNumber || // Compare just numbers

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

        title: `💫 KNIGHT BOT`,

        body: `📱 Status: Online | 🚀 Version: ${settings.version}`,

        thumbnailUrl: "https://files.catbox.moe/hoqhfi.jpeg",

        sourceUrl: "https://github.com/mruniquehacker/Knightbot-MD",

        mediaType: 1,

        showAdAttribution: true,

        renderLargerThumbnail: false

    };

    // Utility functions
const reply = async (text, options = {}) => {
    const useExternalAd = options.externalAdReply !== false;
    const customExternalAd = options.externalAdReply === true ? defaultExternalAdReply : options.externalAdReply;
    
    // Apply font styling to the text with debug logging
    try {
        const { applyFontStyle, getSetting } = require('./database');
        const currentStyle = getSetting('fontstyle', 'normal');
        
        
        
        const formattedText = applyFontStyle(text);
        
        
        const messageOptions = {
            text: formattedText,
            ...channelInfo,
            ...options
        };
        
        if (useExternalAd) {
            messageOptions.contextInfo = {
                ...messageOptions.contextInfo,
                externalAdReply: customExternalAd || defaultExternalAdReply
            };
        }
        delete messageOptions.externalAdReply;
        return await sock.sendMessage(chatId, messageOptions, { quoted: message });
        
    } catch (error) {
        console.error('❌ Error applying font style:', error);
        // Fallback to original text if there's an error
        const messageOptions = {
            text: text,
            ...channelInfo,
            ...options
        };
        
        if (useExternalAd) {
            messageOptions.contextInfo = {
                ...messageOptions.contextInfo,
                externalAdReply: customExternalAd || defaultExternalAdReply
            };
        }
        delete messageOptions.externalAdReply;
        return await sock.sendMessage(chatId, messageOptions, { quoted: message });
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

    const replyWithAd = async (text, customAd = {}, options = {}) => {

        const externalAdReply = { ...defaultExternalAdReply, ...customAd };

        return await reply(text, { ...options, externalAdReply });

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

        react,

        replyWithAd

    };

}

module.exports = { buildContext };