const fs = require('fs');

const path = require('path');

const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

const { writeFile } = require('fs/promises');

const messageStore = new Map();

const CONFIG_PATH = path.join(__dirname, '../data/antidelete.json');

const TEMP_MEDIA_DIR = path.join(__dirname, '../tmp');

// Ensure tmp dir exists

if (!fs.existsSync(TEMP_MEDIA_DIR)) {

    fs.mkdirSync(TEMP_MEDIA_DIR, { recursive: true });

}

// -------- CONFIG HELPERS ----------

function loadAntideleteConfig() {

    try {

        if (!fs.existsSync(CONFIG_PATH)) {

            const dataDir = path.dirname(CONFIG_PATH);

            if (!fs.existsSync(dataDir)) {

                fs.mkdirSync(dataDir, { recursive: true });

            }

            return { 

                enabled: false,

                antideletepm: 'off',  // same/inbox/off

                antideletegc: 'off'   // same/inbox/off

            };

        }

        const config = JSON.parse(fs.readFileSync(CONFIG_PATH));

        

        // Ensure new properties exist for backward compatibility

        if (!config.antideletepm) config.antideletepm = 'off';

        if (!config.antideletegc) config.antideletegc = 'off';

        

        return config;

    } catch {

        return { 

            enabled: false,

            antideletepm: 'off',

            antideletegc: 'off'

        };

    }

}

function saveAntideleteConfig(config) {

    try {

        const dataDir = path.dirname(CONFIG_PATH);

        if (!fs.existsSync(dataDir)) {

            fs.mkdirSync(dataDir, { recursive: true });

        }

        fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));

    } catch (err) {

        console.error('Config save error:', err);

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

        console.error('Temp cleanup error:', err);

    }

}

setInterval(cleanTempFolderIfLarge, 60 * 1000);

// -------- ENHANCED COMMAND ----------

module.exports = {

    name: "antidelete",

    aliases: ["antidel", "antideletepm", "antideletegc"],

    category: "owner",

    description: "Enhanced antidelete feature with PM/Group specific settings",

    usage: ".antidelete [on/off] | .antideletepm [same/inbox/off] | .antideletegc [same/inbox/off]",

    

    execute: async (sock, message, args, context) => {

        const { chatId, senderIsSudo, channelInfo } = context;

        

        // Check if sender is owner (bot itself) OR sudo user

        if (!message.key.fromMe && !senderIsSudo) {

            return await context.reply('Only the bot owner can use this command.');

        }

        const config = loadAntideleteConfig();

        const commandUsed = args[0].toLowerCase(); // antidelete, antideletepm, or antideletegc

        const option = args.length > 1 ? args[1].toLowerCase() : "";

        // Handle different command variations

        if (commandUsed === 'antideletepm') {

            if (!option) {

                return await context.reply(

                    `🔰 ANTIDELETE PM SETUP 🔰\n\n` +

                    `Current Status: ${config.antideletepm === 'off' ? '❌ Disabled' : '✅ ' + config.antideletepm.toUpperCase()}\n\n` +

                    `Usage:\n` +

                    `• .antideletepm same - Send to same PM chat\n` +

                    `• .antideletepm inbox - Send to your DM\n` +

                    `• .antideletepm off - Disable PM antidelete`

                );

            }

            if (['same', 'inbox', 'off'].includes(option)) {

                config.antideletepm = option;

                config.enabled = config.antideletepm !== 'off' || config.antideletegc !== 'off';

                saveAntideleteConfig(config);

                

                return await context.reply(

                    `✅ Antidelete PM set to: ${option === 'off' ? 'Disabled' : option.toUpperCase()}`

                );

            } else {

                return await context.reply('❌ Invalid option. Use: same/inbox/off');

            }

        }

        if (commandUsed === 'antideletegc') {

            if (!option) {

                return await context.reply(

                    `🔰 ANTIDELETE GROUP SETUP 🔰\n\n` +

                    `Current Status: ${config.antideletegc === 'off' ? '❌ Disabled' : '✅ ' + config.antideletegc.toUpperCase()}\n\n` +

                    `Usage:\n` +

                    `• .antideletegc same - Send to same group chat\n` +

                    `• .antideletegc inbox - Send to your DM\n` +

                    `• .antideletegc off - Disable group antidelete`

                );

            }

            if (['same', 'inbox', 'off'].includes(option)) {

                config.antideletegc = option;

                config.enabled = config.antideletepm !== 'off' || config.antideletegc !== 'off';

                saveAntideleteConfig(config);

                

                return await context.reply(

                    `✅ Antidelete Group set to: ${option === 'off' ? 'Disabled' : option.toUpperCase()}`

                );

            } else {

                return await context.reply('❌ Invalid option. Use: same/inbox/off');

            }

        }

        // Handle main antidelete command

        if (!option) {

            const pmStatus = config.antideletepm === 'off' ? '❌ Disabled' : '✅ ' + config.antideletepm.toUpperCase();

            const gcStatus = config.antideletegc === 'off' ? '❌ Disabled' : '✅ ' + config.antideletegc.toUpperCase();

            

            return await context.reply(

                `🔰 ENHANCED ANTIDELETE SETUP 🔰\n\n` +

                `📱 Private Messages: ${pmStatus}\n` +

                `👥 Group Chats: ${gcStatus}\n\n` +

                `Commands:\n` +

                `• .antidelete on/off - Enable/disable all\n` +

                `• .antideletepm same/inbox/off - PM settings\n` +

                `• .antideletegc same/inbox/off - Group settings\n\n` +

                `Options:\n` +

                `• same = Send to same chat where deleted\n` +

                `• inbox = Send to your DM\n` +

                `• off = Disable for that type`

            );

        }

        if (option === "on") {

            config.enabled = true;

            config.antideletepm = config.antideletepm === 'off' ? 'inbox' : config.antideletepm;

            config.antideletegc = config.antideletegc === 'off' ? 'inbox' : config.antideletegc;

        } else if (option === "off") {

            config.enabled = false;

            config.antideletepm = 'off';

            config.antideletegc = 'off';

        } else {

            return await context.reply('❌ Invalid command. Use .antidelete to see usage.');

        }

        saveAntideleteConfig(config);

        await context.reply(`✅ Antidelete ${option === 'on' ? 'enabled' : 'disabled'} for all chats`);

    },

    // -------- Enhanced Event Helpers ----------

    async storeMessage(message) {

        try {

            const config = loadAntideleteConfig();

            if (!config.enabled) return;

            

            const isGroup = message.key.remoteJid.endsWith('@g.us');

            const isPrivate = !isGroup;

            

            // Check if we should store this message based on settings

            if (isPrivate && config.antideletepm === 'off') return;

            if (isGroup && config.antideletegc === 'off') return;

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

                mediaPath = path.join(TEMP_MEDIA_DIR, `${messageId}.jpg`);

                await writeFile(mediaPath, buffer);

            } else if (message.message?.stickerMessage) {

                mediaType = 'sticker';

                const stream = await downloadContentFromMessage(message.message.stickerMessage, 'sticker');

                let buffer = Buffer.from([]);

                for await (const chunk of stream) {

                    buffer = Buffer.concat([buffer, chunk]);

                }

                mediaPath = path.join(TEMP_MEDIA_DIR, `${messageId}.webp`);

                await writeFile(mediaPath, buffer);

            } else if (message.message?.videoMessage) {

                mediaType = 'video';

                content = message.message.videoMessage.caption || '';

                const stream = await downloadContentFromMessage(message.message.videoMessage, 'video');

                let buffer = Buffer.from([]);

                for await (const chunk of stream) {

                    buffer = Buffer.concat([buffer, chunk]);

                }

                mediaPath = path.join(TEMP_MEDIA_DIR, `${messageId}.mp4`);

                await writeFile(mediaPath, buffer);

            } else if (message.message?.audioMessage) {

                mediaType = 'audio';

                const stream = await downloadContentFromMessage(message.message.audioMessage, 'audio');

                let buffer = Buffer.from([]);

                for await (const chunk of stream) {

                    buffer = Buffer.concat([buffer, chunk]);

                }

                const ext = message.message.audioMessage.mimetype?.includes('ogg') ? 'ogg' : 'mp3';

                mediaPath = path.join(TEMP_MEDIA_DIR, `${messageId}.${ext}`);

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

                mediaPath = path.join(TEMP_MEDIA_DIR, `${messageId}_${fileName}`);

                await writeFile(mediaPath, buffer);

            }

            messageStore.set(messageId, {

                content,

                mediaType,

                mediaPath,

                sender,

                originalChat: message.key.remoteJid,

                isGroup,

                timestamp: new Date().toISOString()

            });

        } catch (err) {

            console.error('storeMessage error:', err);

        }

    },

    async handleMessageRevocation(sock, revocationMessage) {

        try {

            const config = loadAntideleteConfig();

            if (!config.enabled) return;

            const messageId = revocationMessage.message.protocolMessage.key.id;

            const deletedBy = revocationMessage.participant || revocationMessage.key.participant || revocationMessage.key.remoteJid;

            const ownerNumber = sock.user.id.split(':')[0] + '@s.whatsapp.net';

            // Don't report if bot or owner deleted the message

            if (deletedBy.includes(sock.user.id) || deletedBy === ownerNumber) return;

            const original = messageStore.get(messageId);

            if (!original) return;

            const { sender, originalChat, isGroup, content, mediaType, mediaPath } = original;

            const senderName = sender.split('@')[0];

            

            // Determine where to send the antidelete message

            let targetChat;

            const setting = isGroup ? config.antideletegc : config.antideletepm;

            

            if (setting === 'off') return; // Don't process if disabled

            

            if (setting === 'same') {

                targetChat = originalChat; // Send to same chat where message was deleted

            } else if (setting === 'inbox') {

                targetChat = ownerNumber; // Send to owner's DM

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

            let text = `🔰 ANTIDELETE REPORT 🔰\n\n` +

                `🗑️ Deleted By: @${deletedBy.split('@')[0]}\n` +

                `👤 Original Sender: @${senderName}\n` +

                `📱 Number: ${sender}\n` +

                `🕒 Time: ${time}\n`;

            if (isGroup) {

                text += `👥 Group: ${groupName}\n`;

            } else {

                text += `💬 Chat Type: Private Message\n`;

            }

            if (setting === 'inbox' && targetChat === ownerNumber) {

                text += `📍 Original Chat: ${isGroup ? groupName : 'Private Message'}\n`;

            }

            if (content) text += `\n💬 Deleted Message:\n${content}`;

            // Send text report

            await sock.sendMessage(targetChat, { 

                text, 

                mentions: [deletedBy, sender] 

            });

            // Send media if any

            if (mediaType && fs.existsSync(mediaPath)) {

                const mediaCaption = `Deleted ${mediaType}\nFrom: @${senderName}${isGroup ? `\nGroup: ${groupName}` : ''}`;

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

                        text: `⚠️ Error sending deleted ${mediaType}: ${err.message}` 

                    });

                }

                // Clean up media file

                try { 

                    fs.unlinkSync(mediaPath); 

                } catch {}

            }

            messageStore.delete(messageId);

        } catch (err) {

            console.error('handleMessageRevocation error:', err);

        }

    }

};