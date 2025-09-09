const { WAVersion,sleep,runtime, processTime, isUrl, getSizeMedia, bytesToSize, getTime, formatDate, tanggal, jam, unixTimestampSeconds } = require('../lib/myfunc');
const { handleMediaUpload } = require('../lib/catbox');
const { buildContext } = require('../lib/context');
const { updateSetting, getSetting, getAvailableFontStyles, applyFontStyle } = require('../lib/database');
const settings = require('../settings.js');
const os = require('os');
const fs = require('fs');
const path = require('path');
const moment = require('moment');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const webp = require('node-webpmux');
const crypto = require('crypto');
module.exports = [

    {

        name: 'runtime',

        aliases: ['botruntime'],

        category: 'UTILITY MENU',

        execute: async (sock, message, args, context) => {

            try {
       await context.react('⏱️');

                const uptime = process.uptime();

                const runtimeText = runtime(uptime);

                

                await context.reply(`🤖 Bot Runtime\n\n⏰ Uptime: ${runtimeText}\n📅 Started: ${formatDate(Date.now() - (uptime * 1000))}`);

                

            } catch (error) {

                console.error('Error in runtime command:', error);

                await context.replyPlain('❌ Error getting runtime information.');

            }

        }

    },

    {

        name: 'checkurl',

        aliases: ['validateurl', 'urlcheck'],

        category: 'UTILITY MENU',

        execute: async (sock, message, args, context) => {

            try {
await context.react('🔗');
                const url = args.slice(1).join(' ');

                if (!url) {

                    return await context.reply('❌ Please provide a URL to check.\n\nExample: .checkurl https://google.com');

                }

                

                const isValidUrl = isUrl(url);

                

                if (isValidUrl) {

                    await context.reply(`✅ Valid URL\n\n🔗 URL: ${url}\n✅ Status: Valid URL format`);

                } else {

                    await context.reply(`❌ Invalid URL\n\n🔗 Input: ${url}\n❌ Status: Invalid URL format`);

                }

                

            } catch (error) {

                console.error('Error in checkurl command:', error);

                await context.reply('❌ Error checking URL.');

            }

        }

    },

    {

        name: 'getsize',

        aliases: ['filesize', 'mediasize'],

        category: 'UTILITY MENU',

        execute: async (sock, message, args, context) => {

            try {
await context.react('☢️');
                const quotedMessage = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;

                

                if (quotedMessage) {

                    // Check if quoted message has media

                    const hasMedia = quotedMessage.imageMessage || quotedMessage.videoMessage || quotedMessage.audioMessage || quotedMessage.documentMessage;

                    

                    if (hasMedia) {

                        const mediaMessage = quotedMessage.imageMessage || quotedMessage.videoMessage || quotedMessage.audioMessage || quotedMessage.documentMessage;

                        const mediaUrl = mediaMessage.url;

                        

                        if (mediaUrl) {

                            const size = await getSizeMedia(mediaUrl);

                            const mediaType = quotedMessage.imageMessage ? 'Image' : quotedMessage.videoMessage ? 'Video' : quotedMessage.audioMessage ? 'Audio' : 'Document';

                            

                            await context.reply(`📊 Media Size Information\n\n📁 Type: ${mediaType}\n📏 Size: ${size}`);

                        } else {

                            await context.reply('❌ Could not get media URL from quoted message.');

                        }

                    } else {

                        await context.reply('❌ Quoted message does not contain media.');

                    }

                } else {

                    const url = args.slice(1).join(' ');

                    if (!url) {

                        return await context.reply('❌ Please reply to a media message or provide a URL.\n\nExample: .getsize https://example.com/image.jpg');

                    }

                    

                    const size = await getSizeMedia(url);

                    await context.reply(`📊 File Size Information\n\n🔗 URL: ${url}\n📏 Size: ${size}`);

                }

                

            } catch (error) {

                console.error('Error in getsize command:', error);

                await context.reply('❌ Error getting file size.');

            }

        }

    },

    {

        name: 'bytesto',

        aliases: ['convertbytes', 'formatbytes'],

        category: 'UTILITY MENU',

        execute: async (sock, message, args, context) => {

            try {
await context.react('❄️');
                const bytes = args[1];

                if (!bytes || isNaN(bytes)) {

                    return await context.reply('❌ Please provide a valid number of bytes.\n\nExample: .bytesto 1048576');

                }

                

                const formattedSize = bytesToSize(parseInt(bytes));

                

                await context.reply(`📊 Bytes Conversion\n\n📋 Input: ${bytes} bytes\n📏 Formatted: ${formattedSize}`);

                

            } catch (error) {

                console.error('Error in bytesto command:', error);

                await context.reply('❌ Error converting bytes.');

            }

        }

    },

    

    

    {

        name: 'date',

        aliases: ['currentdate', 'today'],

        category: 'UTILITY MENU',

        execute: async (sock, message, args, context) => {

            try {
await context.react('ℹ️');
                const currentDate = formatDate(Date.now());

                const tanggalDate = tanggal(Date.now());

                

                await context.replyPlain(`📅 Current Date\n\n📆 Full Date: ${currentDate}\n🗓️ Indonesian Format: ${tanggalDate}`);

                

            } catch (error) {

                console.error('Error in date command:', error);

                await context.reply('❌ Error getting current date.');

            }

        }

    },

    {

        name: 'timestamp',

        aliases: ['unix', 'unixtime'],

        category: 'UTILITY MENU',

        execute: async (sock, message, args, context) => {

            try {
await context.react('🥳')
                const inputDate = args.slice(1).join(' ');

                

                if (inputDate) {

                    // Convert provided date to timestamp

                    const date = new Date(inputDate);

                    if (isNaN(date.getTime())) {

                        return await context.reply('❌ Invalid date format.\n\nExample: .timestamp 2024-01-01 or just .timestamp for current time');

                    }

                    const timestamp = unixTimestampSeconds(date);

                    await context.replyPlain(`⏰ Timestamp Conversion*\n\n📅 Date: ${date.toISOString()}\n🔢 Unix Timestamp: ${timestamp}`);

                } else {

                    // Get current timestamp

                    const currentTimestamp = unixTimestampSeconds();

                    const currentDate = new Date();

                    await context.replyPlain(`⏰ Current Timestamp\n\n📅 Date: ${currentDate.toISOString()}\n🔢 Unix Timestamp: ${currentTimestamp}`);

                }

                

            } catch (error) {

                console.error('Error in timestamp command:', error);

                await context.reply('❌ Error generating timestamp.');

            }

        }

    },
 {

        name: 'waversion',

        aliases: ['whatsappversion', 'waupdate'],

        category: 'UTILITY MENU',

        execute: async (sock, message, args, context) => {

            try {

                await context.reply('🔍 Checking WhatsApp Web version...');

                

                const version = await WAVersion();

                

                await context.reply(`📱 WhatsApp Web Version\n\n🔖 Current Version: ${version[0]}\n📅 Last Updated: ${new Date().toLocaleDateString()}\n✅ Status: Up to date`);

                

            } catch (error) {

                console.error('Error in waversion command:', error);

                await context.reply('❌ Error checking WhatsApp version.');

            }

        }

    },

    {

        name: 'sleep',

        aliases: ['delay', 'wait'],

        category: 'UTILITY MENU',

        execute: async (sock, message, args, context) => {

            try {

                if (!context.senderIsSudo) {

                    return await context.reply('❌ This command is only available for the owner!');

                }

                

                const ms = parseInt(args[1]) || 1000;

                

                if (ms > 30000) {

                    return await context.reply('❌ Maximum delay is 30 seconds (30000ms).');

                }

                

                await context.reply(`⏱️ Sleeping for ${ms}ms...`);

                

                await sleep(ms);

                

                await context.reply(`✅ Woke up after ${ms}ms delay!`);

                

            } catch (error) {

                console.error('Error in sleep command:', error);

                await context.replyPlain('❌ Error in sleep command.');

            }

        }

    },
 {

    name: 'setfont',

    aliases: [],

    category: 'owner',

    description: 'Change bot text output formatting style',

    usage: '.setfont <style> or .setfont list',

    execute: async (sock, message, args, context) => {

        const { chatId, reply, react, senderIsSudo } = context; 

      // Remove command name if included in args

        const cleanArgs = args[0] === 'setfont' ? args.slice(1) : args;

        if (!senderIsSudo) {
        await react('😝')
            return await reply('❌ Only owner can change front styles.');

        }

        if (cleanArgs.length < 1) {

            const currentStyle = getSetting('fontstyle', 'normal');

            return await reply(

                `📝 Font Style Manager\n\nCurrent style: ${currentStyle}\n\nUsage:\n• .setfont list - Show all styles\n• .setfont <style> - Set font style\n• .setfont current - Show current style`

            );

        }

        const action = cleanArgs[0].toLowerCase();

        if (action === 'list') {

            await react('📋');

            const styles = getAvailableFontStyles();

            const currentStyle = getSetting('fontstyle', 'normal');

            

            let styleList = '🎨 Available Font Styles:\n\n';

            styles.forEach((style, index) => {

                const marker = style === currentStyle ? '➤' : '•';

                const example = applyFontStyle('Sample text');

                styleList += `${marker} ${style}\n`;

            });

            

            styleList += `\n📌 Current: ${currentStyle}\n`;

            styleList += `\nUsage: .setfont <style_name>`;

            

            return await reply(styleList);

        }

        if (action === 'current') {

            const currentStyle = getSetting('fontstyle', 'normal');

            const sampleText = applyFontStyle('This is how your bot text will look');

            

            return await reply(

                `📝 Current Font Style\n\n` +

                `Style: ${currentStyle}\n` +

                `Preview: ${sampleText}`

            );

        }

        // Set font style

        const availableStyles = getAvailableFontStyles();

        const newStyle = action;

        if (!availableStyles.includes(newStyle)) {

            return await reply(

                `❌ Invalid font style: ${newStyle}\n\n` +

                `Available styles:\n${availableStyles.map(s => `• ${s}`).join('\n')}\n\n` +

                `Use .setfont list to see all options.`

            );

        }

        await react('✅');

        

        // Update the setting

        const success = updateSetting('fontstyle', newStyle);

        

        if (success) {

            const sampleText = applyFontStyle('This is how your bot will respond now');

            await reply(

                `✅ Font style updated!\n\n` +

                `New style: ${newStyle}\n` +

                `Preview: ${sampleText}\n\n` +

                `All bot responses will now use this formatting.`

            );

        } else {

            await reply('❌ Failed to update font style. Please try again.');

        }

    }

},
    {

  name: "userinfo",

  description: "Show info about the user you replied to",

  category: "UTILITY MENU",

  usage: ".userinfo (reply to user message)",

  execute: async (sock, msg, args, context) => {

    const { reply, react, chatId, defaultExternalAdReply, channelInfo } = context;

    

    try {

      await react('🔍');

      

      if (!msg.message?.extendedTextMessage?.contextInfo?.quotedMessage) {

        return await reply('❌ Please reply to a users message to get their info.');

      }

      const quoted = msg.message.extendedTextMessage.contextInfo;

      const userJid = quoted.participant || quoted.remoteJid;

      const contact = sock.store?.contacts?.get(userJid) || {};

      const name = contact.notify || contact.vname || userJid.split('@')[0];

      const number = userJid.split('@')[0];

      const description = contact.status || contact.shortAbout || contact.about || "No description";

      let profilePicUrl = null;

      try {

        profilePicUrl = await sock.profilePictureUrl(userJid, 'image');

      } catch {

        profilePicUrl = null;

      }

      let status = "No status";

      try {

        const presence = sock.store?.presences?.get(userJid);

        if (presence && presence.status) status = presence.status;

      } catch {}

      const infoText = 

        `👤 𝗨𝘀𝗲𝗿 𝗜𝗻𝗳𝗼 𝗕𝘆 𝗚𝗶𝗳𝘁 𝗺𝗱\nName: ${name}\nNumber: +${number}\nDescription: ${description}\nStatus: ${status}`;

      if (profilePicUrl) {

        // Try using the same method as context.reply but with image

        try {

          const { applyFontStyle } = require('../lib/database');

          const formattedText = applyFontStyle(infoText);

          

          await context.reply({

            image: { url: profilePicUrl },

            caption: formattedText,

            ...channelInfo,

            contextInfo: {

              ...channelInfo.contextInfo,

              externalAdReply: defaultExternalAdReply

            }

          }, { quoted: msg });

          

        } catch (error) {

          console.error('❌ Error with styled image:', error);

          // Fallback to basic image

          await context.reply( {

            image: { url: profilePicUrl },

            caption: infoText

          }, { quoted: msg });

        }

      } else {

        await reply(infoText);

      }

    } catch (err) {

      console.error(err);

      await reply("❌ Failed to fetch user info.");

    }

  }

},
       {
        name: "botinfo",
        description: "Displays information about the bot",
        category: "UTILITY MENU",
        async execute(sock, message, args, context) {
            try {
                const uptime = process.uptime(); // in seconds
                const uptimeString = moment.duration(uptime, 'seconds').humanize();
                const total = global.commands.size;

                const info = `
┏▣══🤖 BOT INFO══▣╗
║ 📛 Name: ${global.botName}
║ 🏷️ Version: ${global.version}
║ 👑 Owner: ${global.botOwner}
║ ⏱️ Uptime: ${uptimeString}
║ 📂 Total Commands: ${total}
║ 💻 Platform: ${os.type()} (${os.arch()})
┗▣══════════════▣╝`;

                await context.replyWithAd(info.trim());
            } catch (err) {
                console.error("Error in .botinfo:", err);
                await context.reply("❌ Failed to fetch bot info.");
            }
        }
    },

    {
        name: "uptime",
        description: "Show how long the bot has been running",
        category: "UTILITY MENU",
        usage: ".uptime",
        async execute(sock, msg, args, context) {
            try {
                let totalSeconds = process.uptime();
                let days = Math.floor(totalSeconds / (3600 * 24));
                let hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
                let minutes = Math.floor((totalSeconds % 3600) / 60);
                let seconds = Math.floor(totalSeconds % 60);
                let uptimeStr = `${days}d ${hours}h ${minutes}m ${seconds}s`;

                await context.reply(`🤯 Uptime: ${uptimeStr}`);
            } catch (e) {
                console.error(e);
                await context.reply('❌ Error getting uptime.');
            }
        }
    },

    {
        name: "memory",
        description: "Show bot system status in panel style",
        category: "UTILITY MENU",
        usage: ".memory",
        async execute(sock, msg, args, context) {
            try {
                // Convert uptime
                let totalSeconds = process.uptime();
                let days = Math.floor(totalSeconds / (3600 * 24));
                let hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
                let minutes = Math.floor((totalSeconds % 3600) / 60);
                let seconds = Math.floor(totalSeconds % 60);
                let uptimeStr = `${days}d ${hours}h ${minutes}m ${seconds}s`;

                // CPU
                const cpuLoad = os.loadavg()[0].toFixed(2);
                const cpuCount = os.cpus().length;

                // Memory
                const totalMem = os.totalmem();
                const freeMem = os.freemem();
                const usedMem = totalMem - freeMem;
                const usedMemMB = (usedMem / (1024 * 1024)).toFixed(2);
                const totalMemMB = (totalMem / (1024 * 1024)).toFixed(2);

                // Disk
                const { execSync } = require("child_process");
                let diskUsed = "N/A";
                let diskTotal = "N/A";
                try {
                    const df = execSync('df -h /').toString().split("\n")[1].split(/\s+/);
                    diskTotal = df[1];
                    diskUsed = df[2];
                } catch (err) {}

                // Network
                let netIn = 0, netOut = 0;
                try {
                    const netStats = fs.readFileSync('/proc/net/dev', 'utf8').split("\n").slice(2);
                    netStats.forEach(line => {
                        const parts = line.trim().split(/\s+/);
                        if (parts.length >= 10) {
                            netIn += parseInt(parts[1]);
                            netOut += parseInt(parts[9]);
                        }
                    });
                } catch (err) {}
                const netInMB = (netIn / (1024 * 1024)).toFixed(2);
                const netOutMB = (netOut / (1024 * 1024)).toFixed(2);

                // Panel
                const panel = `╭─「 SYSTEM PANEL 」
│ 1. Uptime
│ ${uptimeStr}
│
│ 2. CPU Load
│ ${cpuLoad}% / ${cpuCount}
│
│ 3. Memory
│ ${usedMemMB} MiB / ${totalMemMB}
│
│ 4. Disk
│ ${diskUsed} / ${diskTotal}
│
│ 5. Network (Inbound)
│ ${netInMB} MiB
│
│ 6. Network (Outbound)
│ ${netOutMB} MiB
│
╰───────────────`;

                await context.reply(panel);
            } catch (err) {
                console.error(err);
                await context.reply("❌ Error fetching system info.");
            }
        }
    }, 
    {
        name: "ping",
        aliases: ["p"],
        description: "Check bot speed",
        category: "UTILITY MENU",
        execute: async (sock, message, args, { chatId }) => {
            const start = Date.now();
            
            const calculatingText = applyFontStyle("Calculating Latency...⌛");
            const sentMsg = await sock.sendMessage(chatId, { text: calculatingText }, { quoted: message });

            await new Promise(r => setTimeout(r, 2000));

            const end = Date.now();
            const speed = end - start;

            const speedText = applyFontStyle(`Speed: ${speed}ms`);
            await sock.sendMessage(chatId, { 
                text: speedText, 
                edit: sentMsg.key 
            });
        }
    },

    {
        name: "alive",
        aliases: ["alv"],
        description: "Check if bot is alive",
        category: "UTILITY MENU",
        execute: async (sock, message, args, { chatId }) => {
            const aliveText = applyFontStyle("🤖 Yes, I'm alive and running smoothly!");
            
            await sock.sendMessage(chatId, { 
                text: aliveText 
            }, { quoted: message });
        }
    },
    {

    name: "jid",

    aliases: ["getjid", "userid"],

    description: "Get user's JID/ID",

    category: "UTILITY MENU",

    usage: ".jid [@user] or .jid (reply to message)",

    

    async execute(sock, m, args, context) {

        const from = m.key.remoteJid;

        let targetUser;

        

        // Check if replying to a message

        if (m.message.extendedTextMessage?.contextInfo?.quotedMessage) {

            targetUser = m.message.extendedTextMessage.contextInfo.participant;

        }

        // Check if mentioning a user

        else if (m.message.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {

            targetUser = m.message.extendedTextMessage.contextInfo.mentionedJid[0];

        }

        // If no target, get sender's JID

        else {

            targetUser = m.key.participant || m.key.remoteJid;

        }

        if (!targetUser) {

            return await context.replyPlain({

                text: "❌ No user found. Reply to a message or mention someone.\n\nUsage: .jid [@user] or reply to message"

            }, { quoted: m });

        }

        const userNumber = targetUser.split('@')[0];

        

        await context.replyPlain( {

            text: `📱 Number: ${userNumber}\n` +

                  `🆔 JID: \`${targetUser}\`\n` +
                  `User ID retrieved by GIFT-MD BOT 🤖`

        }, { quoted: m });

    }

},
    {

  name: 'tourl',
 aliases: ['url'],

  description: 'Upload media to get a link',

  category: 'utility',

  async execute(sock, m, args, context) {

    const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;

    if (!quoted) return context.reply('❌ Reply to an image/video/document/audio to use this command.');

    let messageType = Object.keys(quoted)[0];

    try {

      const url = await handleMediaUpload(quoted, sock, messageType);

      await context.reply(`✅ Uploaded Successfully!\n\n🔗 ${url}`);

    } catch (e) {

      await context.reply(`❌ Failed to upload media: ${e.message}`);

    }
  }
},
    {
    name: 'take',
    aliases: ['steal'],
    category: 'sticker',
    description: 'Change sticker pack name',
    usage: '.take <packname> (reply to sticker)',
    execute: async (sock, message, args, context) => {
        const { chatId, reply, react, hasQuotedMessage } = context;

        if (!hasQuotedMessage) {
            return await reply('❌ Reply to a sticker with .take <packname>');
        }

        const quotedMessage = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        if (!quotedMessage?.stickerMessage) {
            return await reply('❌ Reply to a sticker with .take <packname>');
        }

        const packname = args.slice(1).join(' ') || 'Knight Bot';

        try {
            await react('🔄');

            const stickerBuffer = await downloadMediaMessage(
                {
                    key: message.message.extendedTextMessage.contextInfo.stanzaId,
                    message: quotedMessage,
                    messageType: 'stickerMessage'
                },
                'buffer',
                {},
                {
                    logger: undefined,
                    reuploadRequest: sock.updateMediaMessage
                }
            );

            if (!stickerBuffer) {
                return await reply('❌ Failed to download sticker');
            }

            const img = new webp.Image();
            await img.load(stickerBuffer);

            const json = {
                'sticker-pack-id': crypto.randomBytes(32).toString('hex'),
                'sticker-pack-name': global.packname,
                'emojis': ['🤖']
            };

            const exifAttr = Buffer.from([0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00]);
            const jsonBuffer = Buffer.from(JSON.stringify(json), 'utf8');
            const exif = Buffer.concat([exifAttr, jsonBuffer]);
            exif.writeUIntLE(jsonBuffer.length, 14, 4);

            img.exif = exif;
            const finalBuffer = await img.save(null);

           await sock.sendMessage(chatId, {
                sticker: finalBuffer
            }, {
                quoted: message
            });

            await react('✅');

        } catch (error) {
            await reply('❌ Error processing sticker');
        }
    }
}
];