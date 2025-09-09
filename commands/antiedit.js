const fs = require('fs');

const path = require('path');

const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

const { writeFile } = require('fs/promises');

const messageStore = new Map();

const CONFIG_PATH = path.join(__dirname, '../data/antiedit.json');

const TEMP_MEDIA_DIR = path.join(__dirname, '../tmp');

// Ensure tmp dir exists

if (!fs.existsSync(TEMP_MEDIA_DIR)) {

    fs.mkdirSync(TEMP_MEDIA_DIR, { recursive: true });

}

// -------- CONFIG HELPERS ----------

function loadAntieditConfig() {

    try {

        if (!fs.existsSync(CONFIG_PATH)) {

            const dataDir = path.dirname(CONFIG_PATH);

            if (!fs.existsSync(dataDir)) {

                fs.mkdirSync(dataDir, { recursive: true });

            }

            return { 

                enabled: false,

                antieditpm: 'off',  // same/inbox/off

                antieditgc: 'off'   // same/inbox/off

            };

        }

        const config = JSON.parse(fs.readFileSync(CONFIG_PATH));

        

        // Ensure new properties exist for backward compatibility

        if (!config.antieditpm) config.antieditpm = 'off';

        if (!config.antieditgc) config.antieditgc = 'off';

        

        return config;

    } catch {

        return { 

            enabled: false,

            antieditpm: 'off',

            antieditgc: 'off'

        };

    }

}

function saveAntieditConfig(config) {

    try {

        const dataDir = path.dirname(CONFIG_PATH);

        if (!fs.existsSync(dataDir)) {

            fs.mkdirSync(dataDir, { recursive: true });

        }

        fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));

    } catch (err) {

        console.error('Antiedit config save error:', err);

    }

}

// -------- CLEANUP HELPERS ----------

function getFolderSizeInMB(folderPath) {

    try {

        const files = fs.readdirSync(folderPath);

        let totalSize = 0;

        for (const file of files) {

            const filePath = path.join(folderPath, file);

            if (fs.statSync(filePath).isFile()) {

                totalSize += fs.statSync(filePath).size;

            }

        }

        return totalSize / (1024 * 1024);

    } catch {

        return 0;

    }

}

function cleanTempFolderIfLarge() {

    try {

        const sizeMB = getFolderSizeInMB(TEMP_MEDIA_DIR);

        if (sizeMB > 100) {

            const files = fs.readdirSync(TEMP_MEDIA_DIR);

            for (const file of files) {

                fs.unlinkSync(path.join(TEMP_MEDIA_DIR, file));

            }

        }

    } catch (err) {

        console.error('Antiedit temp cleanup error:', err);

    }

}

setInterval(cleanTempFolderIfLarge, 60 * 1000);

// -------- ENHANCED COMMAND ----------

module.exports = {

    name: "antiedit",

    aliases: ["antied", "antieditpm", "antieditgc"],

    category: "owner",

    description: "Enhanced antiedit feature with PM/Group specific settings",

    usage: ".antiedit [on/off] | .antieditpm [same/inbox/off] | .antieditgc [same/inbox/off]",

    

    execute: async (sock, message, args, context) => {

        const { chatId, senderIsSudo, channelInfo } = context;

        

        // Check if sender is owner (bot itself) OR sudo user

        if (!message.key.fromMe && !senderIsSudo) {

            return await context.reply('Only the bot owner can use this command.');

        }

        const config = loadAntieditConfig();

        const commandUsed = args[0].toLowerCase(); // antiedit, antieditpm, or antieditgc

        const option = args.length > 1 ? args[1].toLowerCase() : "";

        // Handle different command variations

        if (commandUsed === 'antieditpm') {

            if (!option) {

                return await context.reply(

                    `🔰 ANTIEDIT PM SETUP 🔰\n\n` +

                    `Current Status: ${config.antieditpm === 'off' ? '❌ Disabled' : '✅ ' + config.antieditpm.toUpperCase()}\n\n` +

                    `Usage:\n` +

                    `• .antieditpm same - Send to same PM chat\n` +

                    `• .antieditpm inbox - Send to your DM\n` +

                    `• .antieditpm off - Disable PM antiedit`

                );

            }

            if (['same', 'inbox', 'off'].includes(option)) {

                config.antieditpm = option;

                config.enabled = config.antieditpm !== 'off' || config.antieditgc !== 'off';

                saveAntieditConfig(config);

                

                return await context.reply(

                    `✅ Antiedit PM set to: ${option === 'off' ? 'Disabled' : option.toUpperCase()}`

                );

            } else {

                return await context.reply('❌ Invalid option. Use: same/inbox/off');

            }

        }

        if (commandUsed === 'antieditgc') {

            if (!option) {

                return await context.reply(

                    `🔰 ANTIEDIT GROUP SETUP 🔰\n\n` +

                    `Current Status: ${config.antieditgc === 'off' ? '❌ Disabled' : '✅ ' + config.antieditgc.toUpperCase()}\n\n` +

                    `Usage:\n` +

                    `• .antieditgc same - Send to same group chat\n` +

                    `• .antieditgc inbox - Send to your DM\n` +

                    `• .antieditgc off - Disable group antiedit`

                );

            }

            if (['same', 'inbox', 'off'].includes(option)) {

                config.antieditgc = option;

                config.enabled = config.antieditpm !== 'off' || config.antieditgc !== 'off';

                saveAntieditConfig(config);

                

                return await context.reply(

                    `✅ Antiedit Group set to: ${option === 'off' ? 'Disabled' : option.toUpperCase()}`

                );

            } else {

                return await context.reply('❌ Invalid option. Use: same/inbox/off');

            }

        }

        // Handle main antiedit command

        if (!option) {

            const pmStatus = config.antieditpm === 'off' ? '❌ Disabled' : '✅ ' + config.antieditpm.toUpperCase();

            const gcStatus = config.antieditgc === 'off' ? '❌ Disabled' : '✅ ' + config.antieditgc.toUpperCase();

            

            return await context.reply(

                `🔰 ENHANCED ANTIEDIT SETUP 🔰\n\n` +

                `📱 Private Messages: ${pmStatus}\n` +

                `👥 Group Chats: ${gcStatus}\n\n` +

                `Commands:\n` +

                `• .antiedit on/off - Enable/disable all\n` +

                `• .antieditpm same/inbox/off - PM settings\n` +

                `• .antieditgc same/inbox/off - Group settings\n\n` +

                `Options:\n` +

                `• same = Send to same chat where edited\n` +

                `• inbox = Send to your DM\n` +

                `• off = Disable for that type`

            );

        }

        if (option === "on") {

            config.enabled = true;

            config.antieditpm = config.antieditpm === 'off' ? 'inbox' : config.antieditpm;

            config.antieditgc = config.antieditgc === 'off' ? 'inbox' : config.antieditgc;

        } else if (option === "off") {

            config.enabled = false;

            config.antieditpm = 'off';

            config.antieditgc = 'off';

        } else {

            return await context.reply('❌ Invalid command. Use .antiedit to see usage.');

        }

        saveAntieditConfig(config);

        await context.reply(`✅ Antiedit ${option === 'on' ? 'enabled' : 'disabled'} for all chats`);

    },

    // -------- Enhanced Event Helpers ----------

    async storeMessage(message) {

        try {

            const config = loadAntieditConfig();

            if (!config.enabled) return;

            

            const isGroup = message.key.remoteJid.endsWith('@g.us');

            const isPrivate = !isGroup;

            

            // Check if we should store this message based on settings

            if (isPrivate && config.antieditpm === 'off') return;

            if (isGroup && config.antieditgc === 'off') return;

            if (!message.key?.id) return;

            const messageId = message.key.id;

            let content = '';

            let mediaType = '';

            let mediaPath = '';

            const sender = message.key.participant || message.key.remoteJid;

            // Store different message types

            if (message.message?.conversation) {

                content = message.message.conversation;

            } else if (message.message?.extendedTextMessage?.text) {

                content = message.message.extendedTextMessage.text;

            } else if (message.message?.imageMessage) {

                mediaType = 'image';

                content = message.message.imageMessage.caption || '';

                const stream = await downloadContentFromMessage(message.message.imageMessage, 'image');

                let buffer = Buffer.from([]);

                for await (const chunk of stream) {

                    buffer = Buffer.concat([buffer, chunk]);

                }

                mediaPath = path.join(TEMP_MEDIA_DIR, `edit_${messageId}.jpg`);

                await writeFile(mediaPath, buffer);

            } else if (message.message?.stickerMessage) {

                mediaType = 'sticker';

                const stream = await downloadContentFromMessage(message.message.stickerMessage, 'sticker');

                let buffer = Buffer.from([]);

                for await (const chunk of stream) {

                    buffer = Buffer.concat([buffer, chunk]);

                }

                mediaPath = path.join(TEMP_MEDIA_DIR, `edit_${messageId}.webp`);

                await writeFile(mediaPath, buffer);

            } else if (message.message?.videoMessage) {

                mediaType = 'video';

                content = message.message.videoMessage.caption || '';

                const stream = await downloadContentFromMessage(message.message.videoMessage, 'video');

                let buffer = Buffer.from([]);

                for await (const chunk of stream) {

                    buffer = Buffer.concat([buffer, chunk]);

                }

                mediaPath = path.join(TEMP_MEDIA_DIR, `edit_${messageId}.mp4`);

                await writeFile(mediaPath, buffer);

            } else if (message.message?.audioMessage) {

                mediaType = 'audio';

                const stream = await downloadContentFromMessage(message.message.audioMessage, 'audio');

                let buffer = Buffer.from([]);

                for await (const chunk of stream) {

                    buffer = Buffer.concat([buffer, chunk]);

                }

                const ext = message.message.audioMessage.mimetype?.includes('ogg') ? 'ogg' : 'mp3';

                mediaPath = path.join(TEMP_MEDIA_DIR, `edit_${messageId}.${ext}`);

                await writeFile(mediaPath, buffer);

            } else if (message.message?.documentMessage) {

                mediaType = 'document';

                content = message.message.documentMessage.caption || '';

                const stream = await downloadContentFromMessage(message.message.documentMessage, 'document');

                let buffer = Buffer.from([]);

                for await (const chunk of stream) {

                    buffer = Buffer.concat([buffer, chunk]);

                }

                const fileName = message.message.documentMessage.fileName || 'document';

                mediaPath = path.join(TEMP_MEDIA_DIR, `edit_${messageId}_${fileName}`);

                await writeFile(mediaPath, buffer);

            }

            messageStore.set(messageId, {

                content,

                mediaType,

                mediaPath,

                sender,

                originalChat: message.key.remoteJid,

                isGroup,

                timestamp: new Date().toISOString(),

                editCount: 0 // Track how many times message was edited

            });

        } catch (err) {

            console.error('storeMessage (antiedit) error:', err);

        }

    },

     async handleMessageEdit(sock, editedMessage) {
    try {
        const config = loadAntieditConfig();
        if (!config.enabled) return;

        // Extract the original message info from protocol message
        const originalKey = editedMessage.message.protocolMessage.key;
        const messageId = originalKey.id;
        const editedBy = editedMessage.key.participant || editedMessage.key.remoteJid;
        const ownerNumber = sock.user.id.split(':')[0] + '@s.whatsapp.net';

        // 🔧 ENHANCED: Better owner detection
        const isEditedByBot = editedMessage.key.fromMe;
        const botNumber = sock.user.id.split(':')[0];
        const editedByNumber = editedBy.split('@')[0];
        
        const isEditedByOwner = isEditedByBot || 
                               editedBy === ownerNumber || 
                               editedByNumber === botNumber;

        // Don't report if bot or owner edited the message
        if (isEditedByOwner) {
            console.log('🤖 Ignoring edit by owner/bot:', editedBy);
            return;
        }

        const original = messageStore.get(messageId);
        if (!original) {
            console.log('❌ Original message not found for ID:', messageId);
            return;
        }

        const { sender, originalChat, isGroup, content, mediaType, mediaPath } = original;
        const senderName = sender.split('@')[0];
        
        // Determine where to send the antiedit message
        let targetChat;
        const setting = isGroup ? config.antieditgc : config.antieditpm;
        
        if (setting === 'off') return; // Don't process if disabled
        
        if (setting === 'same') {
            targetChat = originalChat; // Send to same chat where message was edited
        } else if (setting === 'inbox') {
            targetChat = ownerNumber; // Send to owner's DM
        }

        // 🔧 FIXED: Extract new content from protocol message
        let newContent = '';
        
        // The edited content is in the protocol message
        const editedMessageContent = editedMessage.message.protocolMessage.editedMessage;
        
        if (editedMessageContent?.conversation) {
            newContent = editedMessageContent.conversation;
        } else if (editedMessageContent?.extendedTextMessage?.text) {
            newContent = editedMessageContent.extendedTextMessage.text;
        } else if (editedMessageContent?.imageMessage?.caption) {
            newContent = editedMessageContent.imageMessage.caption;
        } else if (editedMessageContent?.videoMessage?.caption) {
            newContent = editedMessageContent.videoMessage.caption;
        } else if (editedMessageContent?.documentMessage?.caption) {
            newContent = editedMessageContent.documentMessage.caption;
        }

        // Get group name if applicable
        let groupName = '';
        if (isGroup) {
            try {
                const groupMetadata = await sock.groupMetadata(originalChat);
                groupName = groupMetadata.subject;
            } catch (err) {
                groupName = 'Unknown Group';
            }
        }

        const time = new Date().toLocaleString('en-US', {
            timeZone: 'Asia/Kolkata',
            hour12: true, 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit',
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric'
        });

        // Increment edit count
        original.editCount = (original.editCount || 0) + 1;

        let text = `🔰 ANTIEDIT REPORT 🔰\n\n` +
            `✏️ Edited By: @${editedBy.split('@')[0]}\n` +
            `👤 Original Sender: @${senderName}\n` +
            `📱 Number: ${sender}\n` +
            `🕒 Time: ${time}\n` +
            `🔄 Edit Count: ${original.editCount}\n`;

        if (isGroup) {
            text += `👥 Group: ${groupName}\n`;
        } else {
            text += `💬 Chat Type: Private Message\n`;
        }

        if (setting === 'inbox' && targetChat === ownerNumber) {
            text += `📍 Original Chat: ${isGroup ? groupName : 'Private Message'}\n`;
        }

        // 🔧 FIXED: Better content display
        text += `\n📝 ORIGINAL MESSAGE:\n${content || 'No text content'}`;
        text += `\n\n✏️ EDITED TO:\n${newContent || 'No text content'}`;

        console.log('🔍 Antiedit Report Generated:', {
            messageId,
            editedBy: editedBy.split('@')[0],
            originalContent: content,
            newContent: newContent,
            editCount: original.editCount
        });

        // Send text report
        await sock.sendMessage(targetChat, { 
            text, 
            mentions: [editedBy, sender] 
        });

        // Send original media if any (for reference)
        if (mediaType && fs.existsSync(mediaPath)) {
            const mediaCaption = `Original ${mediaType} before edit\nFrom: @${senderName}${isGroup ? `\nGroup: ${groupName}` : ''}`;
            const mediaOptions = {
                caption: mediaCaption,
                mentions: [sender]
            };

            try {
                if (mediaType === 'image') {
                    await sock.sendMessage(targetChat, { 
                        image: { url: mediaPath }, 
                        ...mediaOptions 
                    });
                } else if (mediaType === 'sticker') {
                    await sock.sendMessage(targetChat, { 
                        sticker: { url: mediaPath } 
                    });
                } else if (mediaType === 'video') {
                    await sock.sendMessage(targetChat, { 
                        video: { url: mediaPath }, 
                        ...mediaOptions 
                    });
                } else if (mediaType === 'audio') {
                    await sock.sendMessage(targetChat, { 
                        audio: { url: mediaPath }, 
                        mimetype: "audio/mpeg",
                        ...mediaOptions 
                    });
                } else if (mediaType === 'document') {
                    const fileName = path.basename(mediaPath);
                    await sock.sendMessage(targetChat, { 
                        document: { url: mediaPath }, 
                        fileName: fileName,
                        ...mediaOptions 
                    });
                }
            } catch (err) {
                await sock.sendMessage(targetChat, { 
                    text: `⚠️ Error sending original ${mediaType}: ${err.message}` 
                });
            }
        }

        // Update the stored message with new content for future edits
        messageStore.set(messageId, {
            ...original,
            content: newContent,
            editCount: original.editCount
        });

    } catch (err) {
        console.error('handleMessageEdit error:', err);
    }
} 
    };