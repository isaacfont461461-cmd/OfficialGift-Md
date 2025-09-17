const fetch = require('node-fetch');
const PDFDocument = require('pdfkit');
const webp = require('node-webpmux');
const crypto = require('crypto');
const settings = require('../settings');
const { channelInfo } = require('../lib/messageConfig');
 const { handleMediaUpload } = require('../lib/catbox');
const { downloadContentFromMessage, downloadMediaMessage } = require('@whiskeysockets/baileys');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const { getSetting, updateSetting } = require('../lib/database');
const { getRandom } = require('../lib/myfunc');
const { exec } = require('child_process');
module.exports = [
{
    name: 'browse',
    aliases: [],
    category: 'TOOLS MENU',
    execute: async (sock, message, args, context) => {
        const text = args.slice(1).join(' ');
        if (!text) return context.reply("Enter URL");

        try {
            let res = await fetch(text);

            if (res.headers.get('Content-Type').includes('application/json')) {
                let json = await res.json();
                await sock.sendMessage(context.chatId, { 
                    text: JSON.stringify(json, null, 2),
                    ...channelInfo 
                }, { quoted: message });
            } else {
                let resText = await res.text();
                await sock.sendMessage(context.chatId, { 
                    text: resText,
                    ...channelInfo 
                }, { quoted: message });
            }

            if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
        } catch (error) {
            context.reply(`Error fetching URL: ${error.message}`);
        }
    }
},
 {
    name: 'calculate',
    aliases: ['solve', 'math', 'calc', 'equation'],
    category: 'TOOLS MENU',
    execute: async (sock, message, args, context) => {
        const text = args.slice(1).join(' ');
        const prefix = global.prefix;

        try {
            if (!text) return context.reply(`📝 Examples:\n${prefix}calc 2+2\n${prefix}calc 10*5\n${prefix}calc sqrt(16)`);

            // Simple calculator without mathjs dependency
            const expr = text
                .replace(/×/g, '*')
                .replace(/÷/g, '/')
                .replace(/π/g, 'Math.PI')
                .replace(/sqrt/g, 'Math.sqrt')
                .replace(/sin/g, 'Math.sin')
                .replace(/cos/g, 'Math.cos')
                .replace(/tan/g, 'Math.tan')
                .replace(/log/g, 'Math.log')
                .replace(/\^/g, '**');

            // Simple equation solving for basic cases
            if (expr.includes('=')) {
                // Basic linear equation solver
                if (expr.includes('x')) {
                    const equation = expr.replace(/\s/g, '');
                    
                    // Handle simple cases like "2x = 10" or "x + 5 = 15"
                    if (equation.match(/^\d*x\s*=\s*\d+$/)) {
                        const [left, right] = equation.split('=');
                        const coefficient = left.replace('x', '') || '1';
                        const result = parseFloat(right) / parseFloat(coefficient);
                        return context.reply(`Solution: x = ${result}`);
                    }
                    
                    if (equation.match(/^x\s*\+\s*\d+\s*=\s*\d+$/)) {
                        const [left, right] = equation.split('=');
                        const addend = left.match(/\+\s*(\d+)/)[1];
                        const result = parseFloat(right) - parseFloat(addend);
                        return context.reply(`Solution: x = ${result}`);
                    }
                    
                    if (equation.match(/^x\s*-\s*\d+\s*=\s*\d+$/)) {
                        const [left, right] = equation.split('=');
                        const subtrahend = left.match(/-\s*(\d+)/)[1];
                        const result = parseFloat(right) + parseFloat(subtrahend);
                        return context.reply(`Solution: x = ${result}`);
                    }
                }
                
                return context.reply("For complex equations, try: x + 5 = 15 or 2x = 10");
            }
            
            // Basic conversions
            if (text.toLowerCase().includes('to')) {
                const conversionText = text.toLowerCase();
                
                // Temperature conversions
                if (conversionText.includes('celsius to fahrenheit') || conversionText.includes('c to f')) {
                    const celsius = parseFloat(text.match(/(-?\d+\.?\d*)/)[0]);
                    const fahrenheit = (celsius * 9/5) + 32;
                    return context.reply(`*${celsius}°C = ${fahrenheit}°F*`);
                }
                
                if (conversionText.includes('fahrenheit to celsius') || conversionText.includes('f to c')) {
                    const fahrenheit = parseFloat(text.match(/(-?\d+\.?\d*)/)[0]);
                    const celsius = (fahrenheit - 32) * 5/9;
                    return context.reply(`${fahrenheit}°F = ${celsius.toFixed(2)}°C`);
                }
                
                // Length conversions
                if (conversionText.includes('km to miles')) {
                    const km = parseFloat(text.match(/(-?\d+\.?\d*)/)[0]);
                    const miles = km * 0.621371;
                    return context.reply(`${km} km = ${miles.toFixed(2)} miles`);
                }
                
                if (conversionText.includes('miles to km')) {
                    const miles = parseFloat(text.match(/(-?\d+\.?\d*)/)[0]);
                    const km = miles * 1.60934;
                    return context.reply(`${miles} miles = ${km.toFixed(2)} km`);
                }
                
                return context.reply("Available conversions: celsius to fahrenheit, fahrenheit to celsius, km to miles, miles to km");
            }
            
            // Regular calculation
            // Security: Only allow safe mathematical expressions
            const safeExpr = expr.replace(/[^0-9+\-*/.() Math.sqrt Math.sin Math.cos Math.tan Math.log Math.PI]/g, '');
            
            if (safeExpr !== expr.replace(/\s/g, '')) {
                return context.reply("❌ Error: Invalid characters in expression");
            }
            
            const result = eval(expr);
            
            if (typeof result !== 'number' || isNaN(result)) {
                throw new Error("Invalid calculation");
            }
            
            context.reply(`Result: ${result}`);
            
        } catch (error) {
            context.reply(`❌ Error: ${error.message}\n💡 Examples: ${prefix}calc 2+2, ${prefix}calc sqrt(16), ${prefix}calc x + 5 = 15`);
        }
    }
},
{
    name: 'fliptext',
    aliases: ['flip'],
    category: 'TOOLS MENU',
    execute: async (sock, message, args, context) => {
        const prefix = global.prefix;
        
        if (args.length < 2) return context.reply(`Example:\n${prefix}fliptext Tylor`);
        let flips = args.slice(1).join(" ");
        let flipx = flips.split("").reverse().join("");
        context.reply(`Normal:\n${flips}\n\nFlip:\n${flipx}`);
    }
},
 {
    name: 'gsmarena',
    aliases: [],
    category: 'TOOLS MENU',
    execute: async (sock, message, args, context) => {
        const text = args.slice(1).join(' ');
        
        if (!text) return context.reply("Please provide a query to search for smartphones.");
        try {
            const apiUrl = `https://api.siputzx.my.id/api/s/gsmarena?query=${encodeURIComponent(text)}`;
            const response = await fetch(apiUrl);
            const result = await response.json();
            if (!result.status || !result.data || result.data.length === 0) {
                return context.reply("No results found. Please try another query.");
            }
            const limitedResults = result.data.slice(0, 10);
            let responseMessage = `Top 10 Results for "${text}":\n\n`;
            for (let item of limitedResults) {
                responseMessage += `📱 Name: ${item.name}\n`;
                responseMessage += `📝 Description: ${item.description}\n`;
                responseMessage += `🌐 [View Image](${item.thumbnail})\n\n`;
            }
            context.reply(responseMessage);
        } catch (error) {
            console.error('Error fetching results from GSMArena API:', error);
            context.reply("❌ An error occurred while fetching results from GSMArena.");
        }
    }
},
{
    name: 'genpass',
    aliases: ['genpassword'],
    category: 'TOOLS MENU',
    execute: async (sock, message, args, context) => {
        const text = args.slice(1).join(' ');
        let length = text ? parseInt(text) : 12;
        let chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
        let pass = "";
        
        for (let i = 0; i < length; i++) {
            pass += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        try {
            sock.sendMessage(context.chatId, { 
                text: pass,
                ...channelInfo 
            }, { quoted: message });
        } catch (error) {
            console.error('Error generating password:', error);
            context.reply('An error occurred while generating the password.');
        }
    }
},
{
    name: 'viewonce',
    aliases: ['vv', 'open'],
    category: 'TOOLS MENU',
    description: 'View once media without disappearing',
    usage: '.vv `oR` viewonce (reply to view once message)',
    execute: async (sock, message, args, context) => {
        const { chatId, reply, react, hasQuotedMessage } = context;

        if (!hasQuotedMessage) {
            return await reply('❌ 𝐏𝐥𝐞𝐚𝐬𝐞 𝐫𝐞𝐩𝐥𝐲 𝐭𝐨 𝐚 𝐯𝐢𝐞𝐰-𝐨𝐧𝐜𝐞 𝐢𝐦𝐚𝐠𝐞 𝐨𝐫 𝐯𝐢𝐝𝐞𝐨.');
        }

        try {
            await react('💫');

            const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            const quotedImage = quoted?.imageMessage;
            const quotedVideo = quoted?.videoMessage;

            if (quotedImage && quotedImage.viewOnce) {
                const stream = await downloadContentFromMessage(quotedImage, 'image');
                let buffer = Buffer.from([]);
                for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
                
           await context.replyPlain({ 
                    image: buffer, 
                    fileName: 'media.jpg', 
                    caption: quotedImage.caption || '𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐛𝐲 𝐆𝐢𝐟𝐭-𝐌𝐃',
                    ...context.channelInfo
                }, { quoted: message });
            } else if (quotedVideo && quotedVideo.viewOnce) {
                const stream = await downloadContentFromMessage(quotedVideo, 'video');
                let buffer = Buffer.from([]);
                for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
                
                await sock.sendMessage(chatId, { 
                    video: buffer, 
                    fileName: 'media.mp4', 
                    caption: quotedVideo.caption || '𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐛𝐲 𝐆𝐢𝐟𝐭-𝐌𝐃',
                    ...context.channelInfo
                }, { quoted: message });
            } else {
                await reply('❌ 𝐏𝐥𝐞𝐚𝐬𝐞 𝐫𝐞𝐩𝐥𝐲 𝐭𝐨 𝐚 𝐯𝐢𝐞𝐰-𝐨𝐧𝐜𝐞 𝐢𝐦𝐚𝐠𝐞 𝐨𝐫 𝐯𝐢𝐝𝐞𝐨.');
            }
        } catch (error) {
            await reply('𝐅𝐚𝐢𝐥𝐞𝐝 𝐭𝐨 𝐩𝐫𝐨𝐜𝐞𝐬𝐬 𝐯𝐢𝐞𝐰-𝐨𝐧𝐜𝐞 𝐦𝐞𝐝𝐢𝐚.');
        }
    }
},

{
    name: 'unban',
    aliases: ['pardon'],
    category: 'TOOLS MENU',
    description: 'Unban a user from the bot',
    usage: '.unban @user or reply to message',
    execute: async (sock, message, args, context) => {
        const { chatId, reply, react, mentions, hasQuotedMessage, senderIsSudo } = context;

        if (!senderIsSudo) {
            return await reply('Only sudo users can unban members.');
        }

        let userToUnban;
        
        if (mentions.length > 0) {
            userToUnban = mentions[0];
        } else if (hasQuotedMessage && message.message?.extendedTextMessage?.contextInfo?.participant) {
            userToUnban = message.message.extendedTextMessage.contextInfo.participant;
        }
        
        if (!userToUnban) {
            return await reply('Please mention the user or reply to their message to unban!');
        }

        try {
            await react('🔓');

            const bannedUsers = JSON.parse(fs.readFileSync('./data/banned.json'));
            const index = bannedUsers.indexOf(userToUnban);
            
            if (index > -1) {
                bannedUsers.splice(index, 1);
                fs.writeFileSync('./data/banned.json', JSON.stringify(bannedUsers, null, 2));
                
                await context.reply({ 
                    text: `✅ Successfully unbanned @${userToUnban.split('@')[0]}!`,
                    mentions: [userToUnban],
                    ...context.channelInfo 
                });
            } else {
                await reply(`@${userToUnban.split('@')[0]} is not banned!`);
            }
        } catch (error) {
            await reply('Failed to unban user!');
        }
    }
},
  { name: 'ban',

    aliases: ['bn'],

    category: 'TOOLS MENU',

    description: 'Ban a user from using the bot',

    usage: '.ban @user or reply to user',

    execute: async (sock, message, args, context) => {

        const { chatId, senderIsSudo, channelInfo } = context;

        

        if (!message.key.fromMe && !senderIsSudo) {

            return await sock.sendMessage(chatId, {

                text: '❌ This command is only available for the owner or sudo!',

                ...channelInfo

            }, { quoted: message });

        }

        

        let userToBan;

        

        // Check for mentioned users

        if (message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {

            userToBan = message.message.extendedTextMessage.contextInfo.mentionedJid[0];

        }

        // Check for replied message

        else if (message.message?.extendedTextMessage?.contextInfo?.participant) {

            userToBan = message.message.extendedTextMessage.contextInfo.participant;

        }

        

        if (!userToBan) {

            return await context.reply( {

                text: 'Please mention the user or reply to their message to ban!',

                ...channelInfo

            }, { quoted: message });

        }

        try {

            const bannedPath = path.join(__dirname, '../data/banned.json');

            let bannedUsers = [];

            

            if (fs.existsSync(bannedPath)) {

                bannedUsers = JSON.parse(fs.readFileSync(bannedPath));

            }

            

            if (!bannedUsers.includes(userToBan)) {

                bannedUsers.push(userToBan);

                

                // Ensure data directory exists

                const dataDir = path.dirname(bannedPath);

                if (!fs.existsSync(dataDir)) {

                    fs.mkdirSync(dataDir, { recursive: true });

                }

                

                fs.writeFileSync(bannedPath, JSON.stringify(bannedUsers, null, 2));

                

                await await context.reply(
    `✅ Successfully banned @${userToBan.split('@')[0]}!`,
    { mentions: [userToBan] }
);

            } else {

                await context.reply(chatId, {

                    text: `❌ @${userToBan.split('@')[0]} is already banned!`,

                    mentions: [userToBan],

                    ...channelInfo

                }, { quoted: message });

            }

        } catch (error) {

            console.error('Error in ban command:', error);

            await context.reply('❌ Failed to ban user!');

        }

    }

},
  {

    name: 'blur',

    aliases: ['img-blur', 'blur'],

    category: 'TOOLS MENU',

    description: 'Apply blur effect to images',

    usage: '.blur (reply to image or send with image)',

    execute: async (sock, message, args, context) => {

        const { reply, replyPlain, react, hasQuotedMessage, chatId } = context;

        await react('🌀');

        let imageBuffer;

        

        if (hasQuotedMessage) {

            const quotedMessage = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;

            if (!quotedMessage?.imageMessage) {

                return await reply('❌ Please reply to an image message');

            }

            

            const quoted = {

                message: {

                    imageMessage: quotedMessage.imageMessage

                }

            };

            

            imageBuffer = await downloadMediaMessage(

                quoted,

                'buffer',

                { },

                { }

            );

        } else if (message.message?.imageMessage) {

            imageBuffer = await downloadMediaMessage(

                message,

                'buffer',

                { },

                { }

            );

        } else {

            return await reply('❌ Please reply to an image or send an image with caption .blur');

        }

        try {

            const resizedImage = await sharp(imageBuffer)

                .resize(800, 800, {

                    fit: 'inside',

                    withoutEnlargement: true

                })

                .jpeg({ quality: 80 })

                .toBuffer();

            const blurredImage = await sharp(resizedImage)

                .blur(10)

                .toBuffer();

            await replyPlain({

                image: blurredImage,

                caption: '[ ✔ ] Image Blurred Successfully'

            });

            await react('✅');

        } catch (error) {

            await reply('❌ Failed to blur image. Please try again later.');

        }

    }

},
    {
    name: 'owner',
    aliases: [],
    category: 'TOOLS MENU',
    description: 'Get bot owner contact information',
    usage: '.owner',
    execute: async (sock, message, args, context) => {
        const { react, chatId } = context;
        

        await react(global.defaultReaction);

        const vcard = `
BEGIN:VCARD
VERSION:3.0
FN:${settings.botOwner}
TEL;waid=${settings.ownerNumber}:${settings.ownerNumber}
END:VCARD
`;

        await context.replyPlain({
            contacts: { displayName: settings.botOwner, contacts: [{ vcard }] },
        });
    }
    },
    {
        name: 'prefix',

        aliases: [],

        category: 'TOOLS MENU',

        description: 'Check current bot prefix',

        usage: '.prefix',

        execute: async (sock, message, args, context) => {

            try {

                const { reply, react } = context;

                

                await react('📋');

                

                // Get current prefix from global (which reads from settings/database)

                const currentPrefix = global.prefix || '.';

                

                // Get prefix from database to ensure consistency

                const dbPrefix = getSetting('prefix', '.');

                

                const prefixInfo = `Current Bot Prefix\n\nActive Prefix: ${currentPrefix}\nDatabase Prefix: ${dbPrefix}\n\nTo change prefix: .setprefix \nTo remove prefix: .setprefix none`;

                

                await reply(prefixInfo);

                

            } catch (error) {

                console.error('Error in prefix command:', error);

                await context.reply('Error getting prefix information.');

            }

        }

    },

    {

        name: 'setprefix',

        aliases: ['changeprefix', 'newprefix'],

        category: 'TOOLS MENU',

        description: 'Change bot prefix',

        usage: '.setprefix <new_prefix> | .setprefix none',

        execute: async (sock, message, args, context) => {

            try {

                const { reply, react, senderIsSudo } = context;

                const senderId = message.key.participant || message.key.remoteJid;

                

                // Check if user is owner/sudo

                if (!senderIsSudo && !message.key.fromMe) {

                    await react('❌');

                    return await reply('Only the bot owner can change the prefix.');

                }

                

                // Get new prefix from args

                const newPrefix = args.slice(1).join(' ').trim();

                

                if (!newPrefix) {

                    await react('❌');

                    return await reply('Please provide a new prefix.\n\nUsage:\n• .setprefix ! - Set prefix to !\n• .setprefix none - Remove prefix\n• .setprefix 0 - Remove prefix');

                }

                

                let finalPrefix;

                let statusMessage;

                

                // Handle special cases for removing prefix

                if (newPrefix.toLowerCase() === 'none' || newPrefix === 'null' || newPrefix === '0') {

                    finalPrefix = '';

                    statusMessage = 'Prefix removed! Commands can now be used without any prefix.';

                } else {

                    // Validate prefix length

                    if (newPrefix.length > 5) {

                        await react('❌');

                        return await reply('Prefix cannot be longer than 5 characters.');

                    }

                    

                    // Check for problematic characters

                    if (newPrefix.includes('@') || newPrefix.includes('#')) {

                        await react('❌');

                        return await reply('Prefix cannot contain @ or # symbols.');

                    }

                    

                    finalPrefix = newPrefix;

                    statusMessage = `Prefix changed successfully!\n\nNew prefix: ${finalPrefix}\nExample: ${finalPrefix}menu`;

                }

                

                await react('⏳');

                

                // Update in database

                const dbUpdateSuccess = updateSetting('prefix', finalPrefix);

                

                if (dbUpdateSuccess) {

                    // Update global variable immediately

                    global.prefix = finalPrefix;

                    

                    await react('✅');

                    

                    const responseMessage = `Prefix Update Successful\n\n${statusMessage}\n\nChanges are now active for all commands.`;

                    

                    await reply(responseMessage);

                    

                    console.log(`🔧 Prefix changed to: "${finalPrefix}" by ${senderId}`);

                } else {

                    await react('❌');

                    await reply('Failed to update prefix in database. Please try again.');

                }

                

            } catch (error) {

                console.error('Error in setprefix command:', error);

                await context.react('❌');

                await context.reply('Error changing prefix. Please try again.');

            }

        }

},
    {
    name: "listcmd",
    description: "Lists all loaded commands",
    category: "owner",
    usage: "TOOLS MENU",

    async execute(sock, msg,args,context) {
        try {
            await context.react('☢️');
            if (!global.commands || !(global.commands instanceof Map)) {
                return sock.sendMessage(msg.key.remoteJid, { text: "⚠ Commands are not loaded yet." }, { quoted: msg });
            }

            // Get all command names
            const cmdNames = Array.from(global.commands.keys());

            // Format with numbering
            const formatted = cmdNames
                .map((cmd, i) => `${i + 1}. ${cmd}.js`)
                .join("\n");

            await context.replyPlain(
                
                { text: `📜 Loaded Commands:\n\n${formatted}` },
                { quoted: msg }
            );

        } catch (err) {
            console.error("Error in .listcmd:", err);
            await context.reply( { text: "❌ Error retrieving command list." }, { quoted: msg });
        }
    }
    },
   
{

  name: 'url',

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

    name: 'volvideo',

    aliases: [],

    category: 'media',

    execute: async (sock, message, args, context) => {

        const prefix = global.prefix;

        const command = args[0];

        

        if (!args[1]) return context.reply(`Example: ${prefix}${command} 20`);

        

        // Check if message is quoted

        if (!message.message?.extendedTextMessage?.contextInfo?.quotedMessage) {

            return context.reply(`Reply to a video file with ${prefix}${command} 20 to adjust volume.`);

        }

        const quotedMsg = message.message.extendedTextMessage.contextInfo.quotedMessage;

        const mediaType = Object.keys(quotedMsg)[0];

        

        if (!quotedMsg.videoMessage && mediaType !== 'videoMessage') {

            return context.reply(`Reply to a video file with ${prefix}${command} 20 to adjust volume.`);

        }

        try {

            context.reply('🔄 Processing video volume...');

            

            // Create proper message object for download

            const mediaMessage = {

                key: {

                    remoteJid: context.chatId,

                    fromMe: false,

                    id: message.message.extendedTextMessage.contextInfo.stanzaId

                },

                message: quotedMsg

            };

            // Download media using proper method

            const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

            const stream = await downloadContentFromMessage(quotedMsg.videoMessage || quotedMsg[mediaType], 'video');

            

            let buffer = Buffer.from([]);

            for await (const chunk of stream) {

                buffer = Buffer.concat([buffer, chunk]);

            }

            

            const inputFile = `./tmp/input-${Date.now()}.mp4`;

            const outputFile = `./tmp/output-${Date.now()}.mp4`;

            

            // Ensure tmp directory exists

            if (!fs.existsSync('./tmp')) {

                fs.mkdirSync('./tmp', { recursive: true });

            }

            

            // Save input file

            fs.writeFileSync(inputFile, buffer);

            exec(`ffmpeg -y -i ${inputFile} -filter:a volume=${args[1]} -c:v copy ${outputFile}`, (err, stderr, stdout) => {

                if (fs.existsSync(inputFile)) fs.unlinkSync(inputFile);

                

                if (err) {

                    console.error(err);

                    if (fs.existsSync(outputFile)) fs.unlinkSync(outputFile);

                    return context.reply("Error processing video! Make sure ffmpeg is installed.");

                }

                if (fs.existsSync(outputFile)) {

                    const files = fs.readFileSync(outputFile);

                    context.replyPlain({

                        video: files,

                        mimetype: "video/mp4",

                        caption: `✅ Volume adjusted to ${args[1]}x`,

                        ...channelInfo

                    }, { quoted: message });

                    

                    fs.unlinkSync(outputFile);

                } else {

                    context.reply("*Error: Output file not created!*");

                }

            });

        } catch (error) {

            console.error('Error processing video:', error);

            context.reply('An error occurred while processing the video.');

        }

    }

},
    {
    name: 'sticker',
    aliases: ['tosticker', 'stiker'],
    category: 'converter',
    description: 'Convert image/video to sticker',
    usage: '.sticker (reply to image/video or send with caption)',
    execute: async (sock, message, args, context) => {
        const { chatId, reply, react, hasQuotedMessage } = context;

        const messageToQuote = message;
        let targetMessage = message;

        if (hasQuotedMessage) {
            const quotedInfo = message.message.extendedTextMessage.contextInfo;
            targetMessage = {
                key: {
                    remoteJid: chatId,
                    id: quotedInfo.stanzaId,
                    participant: quotedInfo.participant
                },
                message: quotedInfo.quotedMessage
            };
        }

        const mediaMessage = targetMessage.message?.imageMessage || targetMessage.message?.videoMessage || targetMessage.message?.documentMessage;

        if (!mediaMessage) {
            return await reply('Please reply to an image/video with .sticker, or send an image/video with .sticker as the caption.');
        }

        try {
            await react('🔄');

            const mediaBuffer = await downloadMediaMessage(targetMessage, 'buffer', {}, { 
                logger: undefined, 
                reuploadRequest: sock.updateMediaMessage 
            });

            if (!mediaBuffer) {
                return await reply('Failed to download media. Please try again.');
            }

            const tmpDir = path.join(process.cwd(), 'tmp');
            if (!fs.existsSync(tmpDir)) {
                fs.mkdirSync(tmpDir, { recursive: true });
            }

            const tempInput = path.join(tmpDir, `temp_${Date.now()}`);
            const tempOutput = path.join(tmpDir, `sticker_${Date.now()}.webp`);

            fs.writeFileSync(tempInput, mediaBuffer);

            const isAnimated = mediaMessage.mimetype?.includes('gif') || 
                              mediaMessage.mimetype?.includes('video') || 
                              mediaMessage.seconds > 0;

            const ffmpegCommand = isAnimated
                ? `ffmpeg -i "${tempInput}" -vf "scale=512:512:force_original_aspect_ratio=decrease,fps=15,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000" -c:v libwebp -preset default -loop 0 -vsync 0 -pix_fmt yuva420p -quality 75 -compression_level 6 "${tempOutput}"`
                : `ffmpeg -i "${tempInput}" -vf "scale=512:512:force_original_aspect_ratio=decrease,format=rgba,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000" -c:v libwebp -preset default -loop 0 -vsync 0 -pix_fmt yuva420p -quality 75 -compression_level 6 "${tempOutput}"`;

            await new Promise((resolve, reject) => {
                exec(ffmpegCommand, (error) => {
                    if (error) {
                        reject(error);
                    } else resolve();
                });
            });

            const webpBuffer = fs.readFileSync(tempOutput);

            const img = new webp.Image();
            await img.load(webpBuffer);

            const json = {
                'sticker-pack-id': crypto.randomBytes(32).toString('hex'),
                'sticker-pack-name': global.packname || 'GiftMd',
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
            }, { quoted: messageToQuote });

            await react('✅');

            try {
                fs.unlinkSync(tempInput);
                fs.unlinkSync(tempOutput);
            } catch (err) {
                // Silent cleanup
            }

        } catch (error) {
            await reply('Failed to create sticker! Try again later.');
        }
    }
},
    {
        name: 'topdf',
        aliases: ['pdf', '.'],
        category: 'utility',
        description: 'Convert text into a PDF file',
        usage: '.topdf your text here',
        
        async execute(sock, message, args, context) {
            try {
                const { chatId } = context;
                
                
               // const text = args.join(' ').trim();
                const text = args.slice(1).join(' ');
                
                if (!text) {
                 await context.react('📄');
                    return await context.reply('❌ Please provide some text to convert to PDF!\n\nUsage: `.topdf Hello World`');
                }
                await context.react('♻️');
                await context.reply('📄 Creating PDF document...');
                
                // Ensure temp directory exists
                const tempDir = path.join(__dirname, '../temp');
                if (!fs.existsSync(tempDir)) {
                    fs.mkdirSync(tempDir, { recursive: true });
                }
                
                // Create PDF
                const doc = new PDFDocument();
                const filePath = path.join(tempDir, `pdf_${Date.now()}.pdf`);
                const stream = fs.createWriteStream(filePath);
                
                doc.pipe(stream);
                
                // Add some styling
                doc.fontSize(16)
                   .text('Generated by Gift MD', { align: 'center' })
                   .moveDown();
                   
                doc.fontSize(12)
                   .text(`Created: ${new Date().toLocaleString()}`, { align: 'center' })
                   .moveDown(2);
                   
                doc.fontSize(14)
                   .text(text, { 
                       align: 'left',
                       lineGap: 5
                   });
                
                doc.end();
                
                stream.on('finish', async () => {
                    try {
                        await sock.sendMessage(chatId, {
                            document: { url: filePath },
                            mimetype: 'application/pdf',
                            fileName: `converted_${Date.now()}.pdf`,
                            ...channelInfo
                        }, { quoted: message });
                        await context.react('💚');
                        await context.reply('✅ PDF created successfully!');
                        
                        // Cleanup temp file
                        fs.unlinkSync(filePath);
                        
                    } catch (sendError) {
                        console.error('PDF send error:', sendError);
                        await context.reply('❌ Failed to send PDF file!');
                        // Still cleanup the file
                        if (fs.existsSync(filePath)) {
                            fs.unlinkSync(filePath);
                        }
                    }
                });
                
                stream.on('error', async (streamError) => {
                    console.error('PDF stream error:', streamError);
                    await context.reply('❌ Error while creating PDF stream!');
                });
                
            } catch (err) {
                console.error('PDF command error:', err);
                await context.reply('❌ Error while creating PDF!');
            }
        }
    },
 {
    name: 'creategc',
    aliases: ['creategroup', 'newgroup'],
    description: 'Create WhatsApp group with optional members',
    usage: 'creategc <name> [numbers] or reply to VCF',
    category: 'utility',
    
    async execute(sock, message, args, context) {
        const { reply, senderIsSudo, isFromOwner } = context;

        // Check if user has permission (you can adjust this)
        if (!isFromOwner && !senderIsSudo) {
            return await reply('❌ Only owner/sudo can create groups!');
        }

        // Get group name
        const groupName = args[1];
        if (!groupName) {
            return await reply(`📱 Create Group Command

Usage:
🔹 .creategc <name> - Create empty group
🔹 .creategc <name> <number1,number2> - Create with members
🔹 Reply to VCF: .creategc <name> - Add contacts from VCF

Examples:
• .creategc Isaac - Create group "Isaac"
• .creategc Isaac 2341234567890,2349876543210 - Create with members
• Reply to contact file: .creategc Isaac - Add VCF contacts`);
        }

        try {
            await context.react('⏳');
            
            let participants = [];
            const quotedMessage = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            
            // Method 1: VCF File Processing
            if (quotedMessage?.documentMessage) {
                const document = quotedMessage.documentMessage;
                const fileName = document.fileName || '';
                
                if (fileName.endsWith('.vcf') || document.mimetype === 'text/vcard') {
                    console.log('📇 Processing VCF file...');
                    
                    try {
                        const stream = await downloadContentFromMessage(document, 'document');
                        let buffer = Buffer.from([]);
                        
                        for await (const chunk of stream) {
                            buffer = Buffer.concat([buffer, chunk]);
                        }
                        
                        const vcfContent = buffer.toString('utf-8');
                        const extractedNumbers = this.parseVCF(vcfContent);
                        
                        if (extractedNumbers.length > 0) {
                            participants = extractedNumbers;
                            await reply(`📇 Found ${extractedNumbers.length} contacts in VCF file!`);
                        } else {
                            await reply('⚠️ No valid phone numbers found in VCF file.');
                        }
                        
                    } catch (error) {
                        console.error('❌ VCF processing error:', error);
                        await reply('❌ Failed to process VCF file. Creating group without members.');
                    }
                }
            }
            
            // Method 2: Comma-separated numbers
            if (participants.length === 0 && args.length > 2) {
                const numbersString = args.slice(2).join(' ');
                const rawNumbers = numbersString.split(',').map(num => num.trim());
                
                for (const num of rawNumbers) {
                    const cleanNumber = this.cleanPhoneNumber(num);
                    if (cleanNumber) {
                        participants.push(cleanNumber);
                    }
                }
                
                if (participants.length > 0) {
                    await reply(`📱 Found ${participants.length} phone numbers!`);
                }
            }
            
            // Validate participants (check if they're on WhatsApp)
            const validParticipants = [];
            if (participants.length > 0) {
                await reply(`🔍 Validating ${participants.length} phone numbers...`);
                
                for (const participant of participants) {
                    try {
                        const [result] = await sock.onWhatsApp(participant);
                        if (result && result.exists) {
                            validParticipants.push(participant + '@s.whatsapp.net');
                        }
                    } catch (error) {
                        console.log(`❌ Failed to validate ${participant}:`, error.message);
                    }
                }
                
                await reply(`✅ ${validParticipants.length} valid WhatsApp numbers found!`);
            }
            
            // Create the group
            console.log(`📱 Creating group "${groupName}" with ${validParticipants.length} members...`);
            
            const groupData = await sock.groupCreate(groupName, validParticipants);
            
            if (groupData && groupData.id) {
                await context.react('✅');
                
                // Get group invite link
                let groupLink = '';
                try {
                    const inviteCode = await sock.groupInviteCode(groupData.id);
                    groupLink = `https://chat.whatsapp.com/${inviteCode}`;
                } catch (error) {
                    console.error('❌ Failed to get group link:', error);
                    groupLink = 'Unable to generate link';
                }
                
                let successMsg = `🎉 Group Created Successfully!

📱 Group Name: ${groupName}
🆔 Group ID: ${groupData.id}
👥 Members: ${validParticipants.length + 1} (including you)
🔗 Group Link: ${groupLink}`;

                if (validParticipants.length > 0) {
                    successMsg += `\n📋 Added Members: ${validParticipants.length}`;
                }
                
                // Send success message to the new group
                await sock.sendMessage(groupData.id, {
                    text: `🎉 Welcome to "${groupName}"!

This group was created using Gift MD Bot.
Group Link: ${groupLink}`
                });
                
                await reply(successMsg);
                
            } else {
                throw new Error('Group creation returned invalid data');
            }
            
        } catch (error) {
            await context.react('❌');
            console.error('❌ Group creation error:', error);
            
            let errorMsg = '❌ Failed to create group!';
            
            if (error.message.includes('not-authorized')) {
                errorMsg += '\n\n⚠️ Bot may not have permission to create groups.';
            } else if (error.message.includes('rate-limit')) {
                errorMsg += '\n\n⏰ Rate limited. Please wait before creating another group.';
            } else {
                errorMsg += `\n\n🔍 Error: ${error.message}`;
            }
            
            await reply(errorMsg);
        }
    },

    // Helper function to parse VCF content
    parseVCF(vcfContent) {
        const phoneNumbers = [];
        const lines = vcfContent.split('\n');
        
        for (const line of lines) {
            // Look for phone number lines (TEL: or similar)
            if (line.startsWith('TEL') || line.includes('TEL:')) {
                const phoneMatch = line.match(/[\+]?[\d\s\-\(\)]+/);
                if (phoneMatch) {
                    const cleanNumber = this.cleanPhoneNumber(phoneMatch[0]);
                    if (cleanNumber && !phoneNumbers.includes(cleanNumber)) {
                        phoneNumbers.push(cleanNumber);
                    }
                }
            }
        }
        
        return phoneNumbers;
    },

    // Helper function to clean and validate phone numbers
    cleanPhoneNumber(phoneNumber) {
        if (!phoneNumber) return null;
        
        // Remove all non-digit characters except +
        let cleaned = phoneNumber.replace(/[^\d+]/g, '');
        
        // Remove leading + if present
        if (cleaned.startsWith('+')) {
            cleaned = cleaned.substring(1);
        }
        
        // Must be between 10-15 digits
        if (cleaned.length < 10 || cleaned.length > 15) {
            return null;
        }
        
        // If doesn't start with country code, assume it's Nigerian (234)
        if (cleaned.length === 11 && cleaned.startsWith('0')) {
            cleaned = '234' + cleaned.substring(1);
        } else if (cleaned.length === 10) {
            cleaned = '234' + cleaned;
        }
        
        return cleaned;
    }
}
































   ];

