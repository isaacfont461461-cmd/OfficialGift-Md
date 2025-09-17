
// ======================
// 🔹 HELPER FUNCTIONS 🔹
// ======================

// Convert WebP → PNG
async function convertWebPtoPNG(buffer) {
    try {
        return await sharp(buffer).png().resize(640, 640, { fit: 'inside' }).toBuffer();
    } catch (error) {
        console.log('Sharp conversion failed, returning original buffer.');
        return buffer;
    }
}

// Create Emoji Profile Picture
async function setEmojiProfile(sock, context, emoji) {
    try {
        await context.react(`${emoji}`);
        let imageBuffer;
        let success = false;

        // Method 1: EmojiAPI
        try {
            const emojiCode = emoji.codePointAt(0).toString(16);
            const apiUrl = `https://emojiapi.dev/api/v1/${emojiCode}/512.png`;

            const response = await axios.get(apiUrl, { responseType: 'arraybuffer' });
            if (response.status === 200) {
                imageBuffer = Buffer.from(response.data);
                success = true;
            }
        } catch (err) {
            console.log("EmojiAPI failed:", err.message);
        }

        // Method 2: Twemoji CDN
        if (!success) {
            try {
                const codePoint = emoji.codePointAt(0).toString(16);
                const twemojiUrl = `https://twemoji.maxcdn.com/v/latest/svg/${codePoint}.svg`;

                const response = await axios.get(twemojiUrl, { responseType: 'arraybuffer' });
                if (response.status === 200) {
                    imageBuffer = await sharp(response.data).png().resize(512, 512).toBuffer();
                    success = true;
                }
            } catch (err) {
                console.log("Twemoji failed:", err.message);
            }
        }

        // Method 3: Canvas fallback
        if (!success) {
            imageBuffer = await createEmojiImage(emoji);
            success = true;
        }

        if (!success || !imageBuffer) {
            return await context.reply("❌ Failed to generate emoji profile picture.");
        }

        const tempDir = path.join(__dirname, '../tmp');
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
        const tempPath = path.join(tempDir, `emoji_${Date.now()}.png`);

        await writeFile(tempPath, imageBuffer);
        await sock.updateProfilePicture(sock.user.id, { url: tempPath });
        fs.unlinkSync(tempPath);

        await context.reply(`✅ Profile picture set with emoji ${emoji}`);
    } catch (err) {
        console.error("Emoji error:", err);
        await context.reply("❌ Failed to generate emoji profile picture.");
    }
}

// Canvas Emoji Generator
async function createEmojiImage(emoji) {
    const { createCanvas } = require('canvas');
    const canvas = createCanvas(512, 512);
    const ctx = canvas.getContext('2d');

    const gradient = ctx.createLinearGradient(0, 0, 512, 512);
    gradient.addColorStop(0, '#667eea');
    gradient.addColorStop(1, '#764ba2');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 512);

    ctx.font = '300px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'white';
    ctx.fillText(emoji, 256, 256);

    return canvas.toBuffer('image/png');
}

const { downloadContentFromMessage } = require("@whiskeysockets/baileys");
const { getSetting, updateSetting } = require('../lib/database');
const db = require('../lib/database');
const fs = require('fs');
const { getChatData, updateChatData, getCommandData, updateCommandData } = require('../lib/database');

const { requireAdmin } = require('../lib/adminCheck');
const axios = require('axios');
const { channelInfo } = require('../lib/messageConfig');
const sharp = require('sharp');
const path = require('path');
const { autobioSettings, autoreadSettings, autorecordSettings, autorecordtypeSettings } = require('../lib/case');
const { writeFile } = require('fs/promises');

module.exports = [   
{
    name: 'online',
    description: 'Keep bot always online or return to normal presence',
    usage: 'online [on/off/status]',
    category: 'owner',
    ownerOnly: true,
    
    async execute(sock, message, args, context) {
        const { reply, senderIsSudo, isFromOwner } = context;
        
        if (!isFromOwner && !senderIsSudo) {
            return await reply('❌ This command is only available for the owner!');
        }

        const subCommand = args[1]?.toLowerCase();

        if (!subCommand) {
            return await reply(`🌐 Online Status Commands

🔹 \`.online on\` - Keep bot always online
🔹 \`.online off\` - Return to normal presence  
🔹 \`.online status\` - Check current setting

Current Status: ${getSetting('alwaysOnline', false) ? '🟢 Always Online' : '🔴 Normal Mode'}`);
        }

        switch (subCommand) {
            case 'on':
                // Enable always online
                updateSetting('alwaysOnline', true);
                updateSetting('alwaysOffline', false);
                
                // Clear any existing intervals
                if (global.onlineInterval) clearInterval(global.onlineInterval);
                if (global.offlineInterval) clearInterval(global.offlineInterval);
                
                // Set initial presence
                sock.sendPresenceUpdate('available').catch(console.error);
                
                // Start interval
                global.onlineInterval = setInterval(async () => {
                    try {
                        await sock.sendPresenceUpdate('available');
                        
                    } catch (error) {
                        console.error('❌ Error updating online presence:', error);
                    }
                }, 30000);
                
                await reply('✅ Always Online Mode Activated!\n\n🌐 Bot will now appear online even when offline\n⚡ Status updates every 30 seconds');
                break;

            case 'off':
                // Disable always online
                updateSetting('alwaysOnline', false);
                
                // Stop intervals
                if (global.onlineInterval) {
                    clearInterval(global.onlineInterval);
                    global.onlineInterval = null;
                }
                
                await reply('❌ Always Online Mode Deactivated!\n\n🔄 Bot presence returned to normal\n📱 Will show actual online/offline status');
                break;

            case 'status':
                const isAlwaysOnline = getSetting('alwaysOnline', false);
                const isAlwaysOffline = getSetting('alwaysOffline', false);
                
                let statusMsg = `🌐 Online Status Information\n\n`;
                
                if (isAlwaysOnline) {
                    statusMsg += `Current Mode: 🟢 Always Online\nDescription: Bot appears online 24/7\nUpdate Interval: Every 30 seconds`;
                } else if (isAlwaysOffline) {
                    statusMsg += `Current Mode: 🔴 Always Offline\nDescription: Bot appears offline\nUpdate Interval: Every 10 seconds`;
                } else {
                    statusMsg += `Current Mode: 🔄 Normal Mode\nDescription: Shows actual presence status\nBehavior: Default WhatsApp presence`;
                }
                
                await reply(statusMsg);
                break;

            default:
                await reply('❌ Invalid option!\n\nUse: `.online on`, `.online off`, or `.online status`');
        }
    }
},
      {
    name: 'offline',
    description: 'Keep bot always offline or return to normal presence',
    usage: 'offline [on/off]',
    category: 'owner',
    ownerOnly: true,
    
    async execute(sock, message, args, context) {
        const { reply, senderIsSudo, isFromOwner } = context;
        
        if (!isFromOwner && !senderIsSudo) {
            return await reply('❌ This command is only available for the owner!');
        }

        const subCommand = args[1]?.toLowerCase();

        if (!subCommand) {
            return await reply(`🔴 Offline Status Commands

🔹 \`.offline on\` - Keep bot always offline
🔹 \`.offline off\` - Return to normal presence

Current Status: ${getSetting('alwaysOffline', false) ? '🔴 Always Offline' : '🔄 Normal Mode'}`);
        }

        switch (subCommand) {
            case 'on':
                updateSetting('alwaysOffline', true);
                updateSetting('alwaysOnline', false);
                
                // Clear any existing intervals
                if (global.onlineInterval) clearInterval(global.onlineInterval);
                if (global.offlineInterval) clearInterval(global.offlineInterval);
                
                // Set initial presence
                sock.sendPresenceUpdate('unavailable').catch(console.error);
                
                // Start interval
                global.offlineInterval = setInterval(async () => {
                    try {
                        await sock.sendPresenceUpdate('unavailable');
                        
                    } catch (error) {
                        console.error('❌ Error updating offline presence:', error);
                    }
                }, 10000);
                
                await reply('🔴 Always Offline Mode Activated!\n\n📴 Bot will now appear offline\n⚡ Status updates every 10 seconds');
                break;

            case 'off':
                updateSetting('alwaysOffline', false);
                
                // Stop interval
                if (global.offlineInterval) {
                    clearInterval(global.offlineInterval);
                    global.offlineInterval = null;
                }
                
                await reply('✅ Always Offline Mode Deactivated!\n\n🔄 Bot presence returned to normal');
                break;

            default:
                await reply('❌ Invalid option!\n\nUse: `.offline on` or `.offline off`');
        }
    }
},  
 {
    name: 'setpp',
    aliases: ['profilepic'],
    category: 'owner',
    description: 'Set bot profile picture using image, sticker, or emoji',
    usage: '.setpp 😅 | reply to image/sticker | .setpp remove',

    execute: async (sock, message, args, context) => {
        const { senderIsSudo } = context;

        // Restrict to owner/sudo
        if (!message.key.fromMe && !senderIsSudo) {
            return await context.reply('❌ Only the bot owner can change the profile picture!');
        }

        const option = args[1]?.toLowerCase();

        // ✅ Remove current profile picture
        if (option === 'remove') {
            await context.react('🌝');
            try {
                await sock.removeProfilePicture(sock.user.id);
                return await context.replyPlain('✅ Profile picture removed successfully!');
            } catch (error) {
                console.error('Error removing profile picture:', error);
                return await context.reply('❌ Failed to remove profile picture.');
            }
        }

        // ✅ Emoji branch
        const emoji = args.slice(1).join(' ').trim();
        const emojiRegex = /^\p{Extended_Pictographic}+$/u;

        if (emoji && emojiRegex.test(emoji)) {
            return await setEmojiProfile(sock, context, emoji);
        }

        // ✅ Quoted image or sticker branch
        const quotedMessage = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        if (!quotedMessage) {
            await context.react('😒');
            return await context.reply(
                `📸 SET PROFILE PICTURE 📸\n\n` +
                `Usage:\n` +
                `• Reply to an image: .setpp\n` +
                `• Reply to a sticker: .setpp\n` +
                `• With emoji: .setpp 😅\n` +
                `• Remove current: .setpp remove`
            );
        }

        try {
            let mediaBuffer;
            let fileName;

            if (quotedMessage.imageMessage) {
                await context.react('📸');
                const stream = await downloadContentFromMessage(quotedMessage.imageMessage, 'image');
                let buffer = Buffer.from([]);
                for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
                mediaBuffer = buffer;
                fileName = 'profile.jpg';

            } else if (quotedMessage.stickerMessage) {
                await context.react('🎭');
                const stream = await downloadContentFromMessage(quotedMessage.stickerMessage, 'sticker');
                let buffer = Buffer.from([]);
                for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
                mediaBuffer = await convertWebPtoPNG(buffer);
                fileName = 'profile.png';

            } else {
                return await context.reply('❌ Please reply to an image or sticker!');
            }

            const tempDir = path.join(__dirname, '../tmp');
            if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
            const tempPath = path.join(tempDir, fileName);

            await writeFile(tempPath, mediaBuffer);

            await sock.updateProfilePicture(sock.user.id, { url: tempPath });

            fs.unlinkSync(tempPath); // cleanup
            await context.replyPlain('✅ Profile picture updated successfully!');
        } catch (error) {
            console.error('Error setting profile picture:', error);
            await context.reply('❌ Failed to set profile picture. Try again with another media.');
        }
    }
},
{

    name: 'autorecordtype',

    aliases: ['art', 'recordtype'],

    category: 'owner',

    description: 'Toggle automatic record then typing indicators',

    usage: '.autorecordtype [dm/group/all/off]',

    async execute(sock, message, args, context) {

        try {

            const { senderIsSudo, reply } = context;

            // Only sudo/owner can use this

            if (!senderIsSudo) {

                return await reply('❌ This command is only for bot owners!');

            }

            // If no args, show current status

            if (!args || args.length === 1) {

                const currentMode = autorecordtypeSettings.getMode();

                const statusIcon = currentMode === 'off' ? '❌' : '✅';

                const modeText = currentMode === 'off' ? 'disabled' : `enabled (${currentMode})`;

                

                return await reply(

                    `🎤⌨️ Auto Record-Type\n\nCurrent status: ${statusIcon} ${modeText}\n\nUsage:\n.autorecordtype dm - Enable in DM only\n.autorecordtype group - Enable in groups only\n.autorecordtype all - Enable everywhere\n.autorecordtype off - Disable feature`

                );

            }

            const mode = args[1]?.toLowerCase();

            

            switch (mode) {

                case 'dm':

                    autorecordtypeSettings.enable('dm');

                    await reply('✅ Auto record-type enabled for DM ONLY!\n\n🎤⌨️ Bot will show record then typing indicators in private chats.');

                    break;

                    

                case 'group':

                    autorecordtypeSettings.enable('group');

                    await reply('✅ Auto record-type enabled for GROUPS ONLY!\n\n🎤⌨️ Bot will show record then typing indicators in group chats.');

                    break;

                    

                case 'all':

                    autorecordtypeSettings.enable('all');

                    await reply('✅ Auto record-type enabled for ALL CHATS!\n\n🎤⌨️ Bot will show record then typing indicators everywhere.');

                    break;

                    

                case 'off':

                case 'disable':

                    autorecordtypeSettings.disable();

                    await reply('❌ Auto record-type has been DISABLED!\n\n⏹️ Bot will not show record-type indicators.');

                    break;

                    

                default:

                    await reply('❌ Invalid option!\n\nUsage:\n.autorecordtype dm - Enable in DM only\n.autorecordtype group - Enable in groups only\n.autorecordtype all - Enable everywhere\n.autorecordtype off - Disable feature');

                    break;

            }

        } catch (error) {

            console.error('Error in autorecordtype command:', error);

            await reply('❌ An error occurred while updating autorecordtype settings.');

        }

    }

},
     {

    name: 'autobio',

    aliases: ['abio', 'bio'],

    category: 'owner',

    description: 'Enable/disable auto bio update or update bio now',

    usage: '.autobio [on/off/now]',

    async execute(sock, message, args, context) {

        try {

            const { senderIsSudo, reply, rawText, userMessage } = context;

            // Only sudo/owner can use this

            if (!senderIsSudo) {

                return await reply('❌ This command is only for bot owners!');

            }

            // Extract argument from message (using your existing logic)

            const messageText = rawText || userMessage || "";

            let action = null;

            // Check for 'now' option first

            if (messageText.includes(' now') || messageText.includes('now')) {

                action = 'now';

            } else if (messageText.includes(' on') || messageText.includes(' enable')) {

                action = 'on';

            } else if (messageText.includes(' off') || messageText.includes(' disable')) {

                action = 'off';

            }

            // Also check args array as fallback

            if (!action && args && args.length > 0) {

                const argText = args[0].toLowerCase();

                if (argText === 'now' || argText === 'update') {

                    action = 'now';

                } else if (argText === 'on' || argText === 'enable') {

                    action = 'on';

                } else if (argText === 'off' || argText === 'disable') {

                    action = 'off';

                }

            }

            // If no argument, show current status

            if (!action) {

                const currentStatus = autobioSettings.isEnabled() ? 'enabled ✅' : 'disabled ❌';

                return await reply(

                    `✍️ Auto Bio Settings\n\nCurrent status: ${currentStatus}\n\nUsage:\n.autobio on - Enable auto bio\n.autobio off - Disable auto bio\n.autobio now - Update bio immediately`

                );

            }

            switch (action) {

                case 'on':

                    autobioSettings.enable();

                    await reply('✅ Auto bio has been ENABLED!\n\n✍️ Bot bio will update automatically with current time.');

                    break;

                case 'off':

                    autobioSettings.disable();

                    await reply('❌ Auto bio has been DISABLED!\n\n✍️ Bot bio will not be updated automatically.');

                    break;

                case 'now':

                    try {

                        await autobioSettings.updateNow(sock);

                        await reply('✅ Bio updated successfully!\n\n✍️ Bio has been updated with current time.');

                    } catch (error) {

                        console.error('Error updating bio:', error);

                        await reply('❌ Failed to update bio. Please try again.');

                    }

                    break;

                default:

                    await reply('❌ Invalid option!\n\nUsage:\n.autobio on - Enable auto bio\n.autobio off - Disable auto bio\n.autobio now - Update bio immediately');

                    break;

            }

        } catch (error) {

            console.error('Error in autobio command:', error);

            await reply('❌ An error occurred while updating autobio settings.');

        }

    }

},
    {
    name: 'autotyping',
    aliases: ['atype', 'typing'],
    category: 'owner',
    description: 'Enable/disable auto typing indicator',
    usage: 'autotyping on/off',
    
    async execute(sock, message, args, context) {
        try {
            const { senderIsSudo, reply, rawText, userMessage } = context;
            
            // Only sudo/owner can use this
            if (!senderIsSudo) {
                return await reply('This command is only for bot owners!');
            }
            
            // Extract argument from the message text
            const messageText = rawText || userMessage;
            let action = null;
            
            if (messageText.includes(' on') || messageText.includes(' enable')) {
                action = 'on';
            } else if (messageText.includes(' off') || messageText.includes(' disable')) {
                action = 'off';
            }
            
            
            
            // If no argument, show current status
            if (!action) {
                const currentStatus = autotypingSettings.isEnabled() ? 'ON' : 'OFF';
                return await reply(`Current autotyping status: ${currentStatus}\n\nUsage: autotyping on/off`);
            }
            
            if (action === 'on') {
                autotypingSettings.enable();
                console.log('✅ Autotyping enabled via command');
                await reply('Auto typing has been ENABLED!\n\nBot will show typing indicator when processing messages.');
            } else if (action === 'off') {
                autotypingSettings.disable();
                console.log('❌ Autotyping disabled via command');
                await reply('Auto typing has been DISABLED!\n\nNo more automatic typing indicators.');
            }
            
        } catch (error) {
            console.error('❌ Error in autotyping command:', error);
            await context.reply('An error occurred while updating autotyping settings.');
        }
    }
},
    {
    name: 'autoread',
    aliases: ['ar'],
    category: 'owner',
    description: 'Enable/disable automatic message reading',
    usage: 'autoread on/off',

    async execute(sock, message, args, context) {
        try {
            const { senderIsSudo, reply, rawText, userMessage } = context;

            // Only sudo/owner can use this
            if (!senderIsSudo) {
                return await reply('❌ This command is only for bot owners!');
            }

            // Extract argument from full text
            const messageText = rawText || userMessage;
            let action = null;

            if (messageText.includes(' on') || messageText.includes(' enable')) {
                action = 'on';
            } else if (messageText.includes(' off') || messageText.includes(' disable')) {
                action = 'off';
            }

            // If no argument → show current status
            if (!action) {
                const currentStatus = autoreadSettings.isEnabled() ? 'ON ✅' : 'OFF ❌';
                return await reply(
                    `🔔 Auto Read Messages\n\nCurrent status: ${currentStatus}\n\nUsage:\nautoread on - Enable auto read\nautoread off - Disable auto read`
                );
            }

            // Apply action
            if (action === 'on') {
                autoreadSettings.enable();
                console.log('✅ Autoread enabled via command');
                await reply('✅ Auto read has been ENABLED!\n\nBot will now automatically mark all messages as read.');
            } else if (action === 'off') {
                autoreadSettings.disable();
                console.log('❌ Autoread disabled via command');
                await reply('❌ Auto read has been DISABLED!\n\nBot will no longer mark messages as read.');
            }

        } catch (error) {
            console.error('❌ Error in autoread command:', error);
            await context.reply('An error occurred while updating autoread settings.');
        }
    }
},
     {
    name: 'autorecord',
    aliases: ['arec', 'record'],
    category: 'owner',
    description: 'Enable/disable auto recording indicator',
    usage: 'autorecord on/off',
    
    async execute(sock, message, args, context) {
        try {
            const { senderIsSudo, reply, rawText, userMessage } = context;
            
            // Only sudo/owner can use this
            if (!senderIsSudo) {
                return await reply('This command is only for bot owners!');
            }
            
            // Extract argument from the message text
            const messageText = rawText || userMessage;
            let action = null;
            if (messageText.includes(' on') || messageText.includes(' enable')) {
                action = 'on';
            } else if (messageText.includes(' off') || messageText.includes(' disable')) {
                action = 'off';
            }
            // If no argument, show current status

            if (!action) {

                const currentStatus = autorecordSettings.isEnabled() ? 'ON' : 'OFF';

                return await reply(`Current autorecord status: ${currentStatus}\n\nUsage: autotyping on/off`);

            }
            
           if (action === 'on') {
                autorecordSettings.enable();
                
            await reply('Auto recording has been ENABLED!\n\nBot will show recording indicator randomly.');
            } else if (action === 'off') {
                autorecordSettings.disable();
                
                await reply('Auto recording has been DISABLED!\n\nNo more automatic recording indicators.');
            }
        } catch (error) {
            console.error('Error in autorecord command:', error);
            await context.reply('An error occurred while updating autorecord settings.');
        }
    }
},
    {

    name: 'autoreact',

    aliases: ['areact'],

    category: 'owner',

    description: 'Toggle auto reaction - dm/group/all/off',

    execute: async (sock, message, args, context) => {

        const { chatId, senderIsSudo, isGroup } = context;

        

        if (!message.key.fromMe && !senderIsSudo) {

            return await context.reply('❌ This command is only available for the owner or sudo!');

        }

        if (args.length === 1) {

            // Fix: Ensure status is always a string

            let status = db.getSetting('autoreact', 'off');

            if (!status || typeof status !== 'string') {

                status = 'off';

                db.updateSetting('autoreact', 'off'); // Set default

            }

            

            const reactions = db.getSetting('reactionEmojis', ['✅', '❤️', '😊', '👍', '🔥', '💯']);

            

            return await context.reply(`😊 Auto React Status

Current Mode: ${status.toUpperCase()}

Reaction Emojis:

${reactions.join(' ')}

Available Modes:

• \dm\ - React in private chats only

• \group\ - React in group chats only  

• \all\ - React everywhere

• \off\ - Disable auto reactions

Usage: .autoreact [dm/group/all/off]`);

        }

        const mode = args[1].toLowerCase();

        const validModes = ['dm', 'group', 'all', 'off'];

        

        if (!validModes.includes(mode)) {

            return await context.reply('❌ Invalid mode! Use: dm/group/all/off');

        }

        db.updateSetting('autoreact', mode);

        

        const statusMessages = {

            'dm': '💬 Auto reactions enabled for private chats only',

            'group': '👥 Auto reactions enabled for group chats only', 

            'all': '🌍 Auto reactions enabled everywhere',

            'off': '❌ Auto reactions disabled'

        };

        await context.reply(`😊 Auto React Updated

${statusMessages[mode]}

Status: ${mode.toUpperCase()}`);

    }

},
 {

    name: 'setreactions',

    aliases: ['setreacts'],

    category: 'owner',

    description: 'Set custom reaction emojis for autoreact',

    execute: async (sock, message, args, context) => {

        const { chatId, senderIsSudo } = context;

        

        if (!message.key.fromMe && !senderIsSudo) {

            return await context.reply('❌ This command is only available for the owner or sudo!');

        }

        if (args.length === 1) {

            const current = db.getSetting('reactionEmojis', ['✅', '❤️', '😊', '👍', '🔥', '💯']);

            return await context.reply(`😊 Current Reaction Emojis

${current.join(' ')}

Usage: .setreactions ✅ ❤️ 😊 👍 🔥

Reset: .setreactions reset`);

        }

        if (args[1] === 'reset') {

            const defaultEmojis = ['✅', '❤️', '😊', '👍', '🔥', '💯', '🌟', '⭐'];

            db.updateSetting('reactionEmojis', defaultEmojis);

            return await context.reply(`😊 Reactions Reset

New reactions: ${defaultEmojis.join(' ')}`);

        }

        // Get emojis from arguments

        const newEmojis = args.slice(1);

        

        if (newEmojis.length < 3) {

            return await context.reply('❌ Please provide at least 3 reaction emojis!');

        }

        db.updateSetting('reactionEmojis', newEmojis);

        

        await context.reply(`😊 Reaction Emojis Updated

New reactions: ${newEmojis.join(' ')}

Total: ${newEmojis.length} emojis`);

    }

},
     {

    name: 'anticall',

    description: 'Enable/disable auto call rejection with custom message',

    aliases: ['ac'],

    category: 'owner',

    usage: '.anticall | .anticall on/off | .anticall set <message>',

    

    async execute(sock, message, args, context) {

        try {

            const { reply, senderIsSudo } = context;

            

            // Only owner/sudo can use this command

            if (!message.key.fromMe && !senderIsSudo) {

                return await reply('This command is only available for the owner or sudo users!');

            }

            

            const subCommand = args[1]?.toLowerCase();

            

            // Built-in default message

            const defaultMessage = `Hello! I'm currently busy and cannot take calls right now. Please send me a message instead and I'll get back to you as soon as possible. Thanks for understanding!`;

            

            // Show status and usage if no arguments

            if (!subCommand) {

                const anticallStatus = getSetting('anticall', false);

                const anticallMsg = getSetting('anticallmsg', defaultMessage);

                

                const statusText = `ANTICALL STATUS

                

Current Status: ${anticallStatus ? 'ON' : 'OFF'}

Custom Message: ${anticallMsg}

USAGE:

${global.prefix}anticall on - Enable anticall

${global.prefix}anticall off - Disable anticall  

${global.prefix}anticall set <message> - Set custom rejection message

${global.prefix}anticall default - Reset to default message

When enabled, the bot will automatically reject incoming calls and send the custom message.`;

                

                return await reply(statusText);

            }

            

            // Handle on/off toggle

            if (subCommand === 'on') {

                updateSetting('anticall', true);

                // Set default message if none exists

                if (!getSetting('anticallmsg')) {

                    updateSetting('anticallmsg', defaultMessage);

                }

                return await reply('Anticall has been ENABLED. All incoming calls will be automatically rejected.');

                

            } else if (subCommand === 'off') {

                updateSetting('anticall', false);

                return await reply('Anticall has been DISABLED. Calls will no longer be automatically rejected.');

                

            } else if (subCommand === 'set') {

                // Set custom message

                const customMsg = args.slice(2).join(' ');

                

                if (!customMsg) {

                    return await reply('Please provide a custom message!\n\nExample: .anticall set Sorry, I am busy right now. Please text me instead.');

                }

                

                if (customMsg.length > 200) {

                    return await reply('Custom message is too long! Please keep it under 200 characters.');

                }

                

                updateSetting('anticallmsg', customMsg);

                return await reply(`Anticall custom message has been updated to:\n\n"${customMsg}"`);

                

            } else if (subCommand === 'default') {

                // Reset to default message

                updateSetting('anticallmsg', defaultMessage);

                return await reply(`Anticall message has been reset to default:\n\n"${defaultMessage}"`);

                

            } else {

                return await reply(`Invalid option! Use:\n${global.prefix}anticall on/off/set <message>/default`);

            }

            

        } catch (error) {

            console.error('Error in anticall command:', error);

            await reply('An error occurred while managing anticall settings.');

        }

    }

                },
    {
        name: 'lastseen',
        description: 'Change your last seen privacy setting',
        usage: 'lastseen <everyone|contacts|nobody>',
        category: 'whatsapp',
        
        async execute(sock, message, args, context) {
            const { reply, senderIsSudo, isFromOwner, react } = context;
            
            if (!isFromOwner && !senderIsSudo) {
                return await reply('❌ Only owner/sudo can change privacy settings!');
            }
            
            const setting = args[1]?.toLowerCase();
            
            if (!setting) {
                return await reply(`👁️ Last Seen Privacy Settings

🔹 .lastseen everyone - Everyone can see
🔹 .lastseen contacts - Only contacts can see  
🔹 .lastseen nobody - Nobody can see

Current setting: Use this command to check`);
            }
            
            try {
                await react('⏳');
                
                let privacySetting;
                switch (setting) {
                    case 'everyone':
                        privacySetting = 'all';
                        break;
                    case 'contacts':
                        privacySetting = 'contacts';
                        break;
                    case 'nobody':
                        privacySetting = 'none';
                        break;
                    default:
                        return await reply('❌ Invalid option! Use: everyone, contacts, or nobody');
                }
                
                await sock.updateLastSeenPrivacy(privacySetting);
                await react('✅');
                await reply(`✅ Last seen privacy updated to: ${setting}`);
                
            } catch (error) {
                await react('❌');
                console.error('Last seen update error:', error);
                await reply(`❌ Failed to update last seen privacy!\n\nError: ${error.message}`);
            }
        }
    },
    
    {
        name: 'pponline',
        description: 'Change your online status privacy',
        usage: 'pponline <everyone|contacts>',
        category: 'whatsapp',
        
        async execute(sock, message, args, context) {
            const { reply, senderIsSudo, isFromOwner, react } = context;
            
            if (!isFromOwner && !senderIsSudo) {
                return await reply('❌ Only owner/sudo can change privacy settings!');
            }
            
            const setting = args[1]?.toLowerCase();
            
            if (!setting) {
                return await reply(`🟢 Online Status Privacy Settings

🔹 .pponline everyone - Everyone can see when you're online
🔹 .pponline contacts - Only contacts can see

Current setting: Use this command to check`);
            }
            
            try {
                await react('⏳');
                
                let privacySetting;
                switch (setting) {
                    case 'everyone':
                        privacySetting = 'all';
                        break;
                    case 'contacts':
                        privacySetting = 'contacts';
                        break;
                    default:
                        return await reply('❌ Invalid option! Use: everyone or contacts');
                }
                
                await sock.updateOnlinePrivacy(privacySetting);
                await react('✅');
                await reply(`✅ Online status privacy updated to: ${setting}`);
                
            } catch (error) {
                await react('❌');
                console.error('Online privacy update error:', error);
                await reply(`❌ Failed to update online privacy!\n\nError: ${error.message}`);
            }
        }
    },
    
    {
        name: 'about',
        description: 'Change your about privacy setting',
        usage: 'about <everyone|contacts|nobody>',
        category: 'whatsapp',
        
        async execute(sock, message, args, context) {
            const { reply, senderIsSudo, isFromOwner, react } = context;
            
            if (!isFromOwner && !senderIsSudo) {
                return await reply('❌ Only owner/sudo can change privacy settings!');
            }
            
            const setting = args[1]?.toLowerCase();
            
            if (!setting) {
                return await reply(`ℹ️ About Privacy Settings

🔹 .about everyone - Everyone can see your about
🔹 .about contacts - Only contacts can see
🔹 .about nobody - Nobody can see

Current setting: Use this command to check`);
            }
            
            try {
                await react('⏳');
                
                let privacySetting;
                switch (setting) {
                    case 'everyone':
                        privacySetting = 'all';
                        break;
                    case 'contacts':
                        privacySetting = 'contacts';
                        break;
                    case 'nobody':
                        privacySetting = 'none';
                        break;
                    default:
                        return await reply('❌ Invalid option! Use: everyone, contacts, or nobody');
                }
                
                await sock.updateStatusPrivacy(privacySetting);
                await react('✅');
                await reply(`✅ About privacy updated to: ${setting}`);
                
            } catch (error) {
                await react('❌');
                console.error('About privacy update error:', error);
                await reply(`❌ Failed to update about privacy!\n\nError: ${error.message}`);
            }
        }
    },
    
    {
        name: 'pplinks',
        description: 'Change your profile links privacy',
        usage: 'links <everyone|contacts|nobody>',
        category: 'whatsapp',
        
        async execute(sock, message, args, context) {
            const { reply, senderIsSudo, isFromOwner, react } = context;
            
            if (!isFromOwner && !senderIsSudo) {
                return await reply('❌ Only owner/sudo can change privacy settings!');
            }
            
            const setting = args[1]?.toLowerCase();
            
            if (!setting) {
                return await reply(`🔗 Profile Links Privacy Settings

🔹 .links everyone - Everyone can see your profile links
🔹 .links contacts - Only contacts can see
🔹 .links nobody - Nobody can see

Current setting: Use this command to check`);
            }
            
            try {
                await react('⏳');
                
                let privacySetting;
                switch (setting) {
                    case 'everyone':
                        privacySetting = 'all';
                        break;
                    case 'contacts':
                        privacySetting = 'contacts';
                        break;
                    case 'nobody':
                        privacySetting = 'none';
                        break;
                    default:
                        return await reply('❌ Invalid option! Use: everyone, contacts, or nobody');
                }
                
                // Note: This uses the same API as status/about privacy
                await sock.updateStatusPrivacy(privacySetting);
                await react('✅');
                await reply(`✅ Profile links privacy updated to: ${setting}`);
                
            } catch (error) {
                await react('❌');
                console.error('Links privacy update error:', error);
                await reply(`❌ Failed to update profile links privacy!\n\nError: ${error.message}`);
            }
        }
    },
    
    {
        name: 'ppreceipt',
        aliases: ['readreceipt'],
        description: 'Turn read receipts on/off',
        usage: 'ppreceipt <on|off>',
        category: 'whatsapp',
        
        async execute(sock, message, args, context) {
            const { reply, senderIsSudo, isFromOwner, react } = context;
            
            if (!isFromOwner && !senderIsSudo) {
                return await reply('❌ Only owner/sudo can change privacy settings!');
            }
            
            const setting = args[1]?.toLowerCase();
            
            if (!setting) {
                return await reply(`📖 Read Receipts Settings

🔹 .ppreceipt on - Enable read receipts (blue ticks)
🔹 .ppreceipt off - Disable read receipts

Current setting: Use this command to check`);
            }
            
            try {
                await react('⏳');
                
                let receiptSetting;
                switch (setting) {
                    case 'on':
                        receiptSetting = true;
                        break;
                    case 'off':
                        receiptSetting = false;
                        break;
                    default:
                        return await reply('❌ Invalid option! Use: on or off');
                }
                
                await sock.updateReadReceiptsPrivacy(receiptSetting);
                await react('✅');
                await reply(`✅ Read receipts turned ${setting}`);
                
            } catch (error) {
                await react('❌');
                console.error('Read receipts update error:', error);
                await reply(`❌ Failed to update read receipts!\n\nError: ${error.message}`);
            }
        }
    },
    
    {
        name: 'dmtimer',
        aliases: ['disappearing'],
        description: 'Set default disappearing messages timer',
        usage: 'dmtimer <24h|7d|90d|off>',
        category: 'whatsapp',
        
        async execute(sock, message, args, context) {
            const { reply, senderIsSudo, isFromOwner, react } = context;
            
            if (!isFromOwner && !senderIsSudo) {
                return await reply('❌ Only owner/sudo can change privacy settings!');
            }
            
            const setting = args[1]?.toLowerCase();
            
            if (!setting) {
                return await reply(`⏰ Disappearing Messages Timer

🔹 .dmtimer 24h - Messages disappear after 24 hours
🔹 .dmtimer 7d - Messages disappear after 7 days  
🔹 .dmtimer 90d - Messages disappear after 90 days
🔹 .dmtimer off - Turn off disappearing messages

Current setting: Use this command to check`);
            }
            
            try {
                await react('⏳');
                
                let timerValue;
                switch (setting) {
                    case '24h':
                        timerValue = 86400; // 24 hours in seconds
                        break;
                    case '7d':
                        timerValue = 604800; // 7 days in seconds
                        break;
                    case '90d':
                        timerValue = 7776000; // 90 days in seconds
                        break;
                    case 'off':
                        timerValue = 0;
                        break;
                    default:
                        return await reply('❌ Invalid option! Use: 24h, 7d, 90d, or off');
                }
                
                await sock.updateDefaultDisappearingMode(timerValue);
                await react('✅');
                await reply(`✅ Default disappearing messages timer set to: ${setting}`);
                
            } catch (error) {
                await react('❌');
                console.error('Disappearing messages update error:', error);
                await reply(`❌ Failed to update disappearing messages timer!\n\nError: ${error.message}`);
            }
        }
    },
    
    {
        name: 'ppgroup',
        aliases: ['groupadd'],
        description: 'Control who can add you to groups',
        usage: 'ppgroup <everyone|contacts>',
        category: 'whatsapp',
        
        async execute(sock, message, args, context) {
            const { reply, senderIsSudo, isFromOwner, react } = context;
            
            if (!isFromOwner && !senderIsSudo) {
                return await reply('❌ Only owner/sudo can change privacy settings!');
            }
            
            const setting = args[1]?.toLowerCase();
            
            if (!setting) {
                return await reply(`👥 Group Add Privacy Settings

🔹 .ppgroup everyone - Anyone can add you to groups
🔹 .ppgroup contacts - Only contacts can add you to groups

Current setting: Use this command to check`);
            }
            
            try {
                await react('⏳');
                
                let privacySetting;
                switch (setting) {
                    case 'everyone':
                        privacySetting = 'all';
                        break;
                    case 'contacts':
                        privacySetting = 'contacts';
                        break;
                    default:
                        return await reply('❌ Invalid option! Use: everyone or contacts');
                }
                
                await sock.updateGroupsAddPrivacy(privacySetting);
                await react('✅');
                await reply(`✅ Group add privacy updated to: ${setting}`);
                
            } catch (error) {
                await react('❌');
                console.error('Group add privacy update error:', error);
                await reply(`❌ Failed to update group add privacy!\n\nError: ${error.message}`);
            }
        }
    },

    {

    name: 'antilink',

    description: 'Advanced antilink system with customizable actions',

    usage: 'antilink [on/off/kick/warn/delete/set/status]',

    category: 'admin',

    adminOnly: true,

    groupOnly: true,

    async execute(sock, message, args, context) {

        const { chatId, reply, isGroup, isSenderAdmin, isBotAdmin, senderIsSudo, cleanSender, userMessage } = context;

        if (!isGroup) {

            return await reply('❌ This command can only be used in groups!');

        }

        if (!await requireAdmin(context)) return;

        if (!isBotAdmin) {

            return await reply('❌ Please make me an admin to use antilink features!');

        }

        const subCommand = args[1]?.toLowerCase();

        

        if (!subCommand) {

            return await reply(`🔗 Antilink Commands

🔹 \`.antilink on\` - Enable basic antilink

🔹 \`.antilink off\` - Disable antilink  

🔹 \`.antilink kick\` - Kick users for links

🔹 \`.antilink warn [limit]\` - Warning system

🔹 \`.antilink delete\` - Only delete messages

🔹 \`.antilink set message <text>\` - Custom message

🔹 \`.antilink set allow <domain>\` - Allow domain

🔹 \`.antilink status\` - Show current settings

📌 Examples:

• \`.antilink warn 5\` - 5 warnings before kick

• \`.antilink set allow youtube.com\` - Allow YouTube`);

        }

        // Get current settings

        const currentSettings = getCommandData('antilink', chatId, {

            enabled: false,

            action: 'delete',

            warnLimit: 3,

            customMessage: '🚫 Link detected and deleted!',

            allowedDomains: [],

            warnings: {}

        });

        switch (subCommand) {

            case 'on':

                currentSettings.enabled = true;

                currentSettings.action = 'delete';

                updateCommandData('antilink', chatId, currentSettings);

                

                // Start monitoring messages in this chat

                this.startMonitoring(sock, chatId);

                await reply('✅ Antilink enabled! Links will be deleted.');

                break;

            case 'off':

                currentSettings.enabled = false;

                updateCommandData('antilink', chatId, currentSettings);

                await reply('❌ Antilink disabled!');

                break;

            case 'kick':

                currentSettings.enabled = true;

                currentSettings.action = 'kick';

                updateCommandData('antilink', chatId, currentSettings);

                

                this.startMonitoring(sock, chatId);

                await reply('⚡ Antilink set to KICK mode! Users posting links will be kicked.');

                break;

            case 'warn':

                const warnLimit = parseInt(args[2]) || 3;

                if (warnLimit < 1 || warnLimit > 10) {

                    return await reply('❌ Warning limit must be between 1-10!');

                }

                currentSettings.enabled = true;

                currentSettings.action = 'warn';

                currentSettings.warnLimit = warnLimit;

                currentSettings.warnings = {}; // Reset warnings

                updateCommandData('antilink', chatId, currentSettings);

                

                this.startMonitoring(sock, chatId);

                await reply(`⚠️ Antilink set to WARNING mode! Users will be kicked after ${warnLimit} warnings.`);

                break;

            case 'delete':

                currentSettings.enabled = true;

                currentSettings.action = 'delete';

                updateCommandData('antilink', chatId, currentSettings);

                

                this.startMonitoring(sock, chatId);

                await reply('🗑️ Antilink set to DELETE mode! Only messages will be deleted.');

                break;

            case 'set':

                const setType = args[2]?.toLowerCase();

                

                if (setType === 'message') {

                    const customMessage = args.slice(3).join(' ');

                    if (!customMessage) {

                        return await reply('❌ Please provide a custom message!\n\nExample: `.antilink set message No links allowed here!`');

                    }

                    currentSettings.customMessage = customMessage;

                    updateCommandData('antilink', chatId, currentSettings);

                    await reply(`✅ Custom message set to: "${customMessage}"`);

                    

                } else if (setType === 'allow') {

                    const domain = args[3]?.toLowerCase();

                    if (!domain) {

                        return await reply('❌ Please specify a domain to allow!\n\nExample: `.antilink set allow youtube.com`');

                    }

                    

                    // Remove protocol if present

                    const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/^www\./, '');

                    

                    if (!currentSettings.allowedDomains.includes(cleanDomain)) {

                        currentSettings.allowedDomains.push(cleanDomain);

                        updateCommandData('antilink', chatId, currentSettings);

                        await reply(`✅ Domain "${cleanDomain}" added to allowed list!`);

                    } else {

                        await reply(`⚠️ Domain "${cleanDomain}" is already in allowed list!`);

                    }

                    

                } else {

                    await reply('❌ Invalid set option!\n\nUse: `.antilink set message <text>` or `.antilink set allow <domain>`');

                }

                break;

            case 'status':

                const status = currentSettings.enabled ? '🟢 Enabled' : '🔴 Disabled';

                const actionEmoji = {

                    'delete': '🗑️',

                    'kick': '⚡',

                    'warn': '⚠️'

                };

                

                let statusMsg = `🔗 Antilink Status

Status: ${status}

Action: ${actionEmoji[currentSettings.action]} ${currentSettings.action.toUpperCase()}`;

                if (currentSettings.action === 'warn') {

                    statusMsg += `
Warning Limit: ${currentSettings.warnLimit}`;

                }

                statusMsg += `

Custom Message: ${currentSettings.customMessage}`;

                if (currentSettings.allowedDomains.length > 0) {

                    statusMsg += `

Allowed Domains: ${currentSettings.allowedDomains.join(', ')}`;

                }

                // Show warning counts if any

                const warningCount = Object.keys(currentSettings.warnings).length;

                if (warningCount > 0) {

                    statusMsg += `

Users with Warnings: ${warningCount}`;

                }

                await reply(statusMsg);

                break;

            case 'reset':

                currentSettings.warnings = {};

                updateCommandData('antilink', chatId, currentSettings);

                await reply('🔄 All warnings have been reset!');

                break;

            case 'remove':

                const removeType = args[2]?.toLowerCase();

                if (removeType === 'allow') {

                    const domainToRemove = args[3]?.toLowerCase();

                    if (!domainToRemove) {

                        return await reply('❌ Please specify a domain to remove!\n\nExample: `.antilink remove allow youtube.com`');

                    }

                    

                    const cleanDomain = domainToRemove.replace(/^https?:\/\//, '').replace(/^www\./, '');

                    const index = currentSettings.allowedDomains.indexOf(cleanDomain);

                    

                    if (index > -1) {

                        currentSettings.allowedDomains.splice(index, 1);

                        updateCommandData('antilink', chatId, currentSettings);

                        await reply(`✅ Domain "${cleanDomain}" removed from allowed list!`);

                    } else {

                        await reply(`❌ Domain "${cleanDomain}" not found in allowed list!`);

                    }

                } else {

                    await reply('❌ Invalid remove option!\n\nUse: `.antilink remove allow <domain>`');

                }

                break;

            default:

                await reply('❌ Invalid antilink command!\n\nUse `.antilink` to see all available options.');

        }

    },

    // Internal monitoring function

    startMonitoring(sock, chatId) {

        // This function sets up monitoring but the actual checking happens in checkMessage
       
    },

    // Main link checking function - called from main.js

    async checkMessage(sock, message, context) {

        try {

            const { chatId, userMessage, isGroup, isSenderAdmin, senderIsSudo, cleanSender } = context;

            

            if (!isGroup) return;

            

            // Skip if sender is admin or sudo

            if (isSenderAdmin || senderIsSudo) return;

            

            // Get antilink settings

            const settings = getCommandData('antilink', chatId, {

                enabled: false,

                action: 'delete',

                warnLimit: 3,

                customMessage: '🚫 Link detected and deleted!',

                allowedDomains: [],

                warnings: {}

            });

            

            if (!settings.enabled) return;

            

            // Enhanced link detection patterns

            const linkPatterns = [

                /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi,

                /www\.[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi,

                /[-a-zA-Z0-9@:%._\+~#=]{1,256}\.(com|org|net|edu|gov|mil|int|co|io|me|tv|app|dev|tech|online|site|info|biz|name|mobi|pro|aero|museum|jobs|travel|tel|cat|asia|xxx|post|geo|local|arpa)\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi,

                /chat\.whatsapp\.com\/[a-zA-Z0-9]{20,}/gi,

                /(t\.me|telegram\.me)\/[a-zA-Z0-9_]+/gi,

                /discord\.gg\/[a-zA-Z0-9]+/gi,

                /(youtube\.com|youtu\.be)\/[a-zA-Z0-9_\-\?=&]+/gi

            ];

            

            const foundLinks = [];

            linkPatterns.forEach(pattern => {

                const matches = userMessage.match(pattern);

                if (matches) foundLinks.push(...matches);

            });

            

            if (foundLinks.length > 0) {

                // Check if any links are from allowed domains

                const isAllowed = foundLinks.some(link => {

                    return settings.allowedDomains.some(allowed => {

                        const cleanLink = link.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '');

                        return cleanLink.includes(allowed.toLowerCase());

                    });

                });

                

                if (!isAllowed) {

                    console.log(`🔗 Link detected from ${cleanSender}: ${foundLinks[0]}`);

                    

                    // Delete the message first

                    try {

                        await sock.sendMessage(chatId, { delete: message.key });

                    } catch (error) {

                        console.error('❌ Failed to delete message:', error);

                    }

                    

                    // Handle different actions

                    if (settings.action === 'delete') {

                        await context.reply(settings.customMessage);

                        

                    } else if (settings.action === 'kick') {

                        try {

                            await sock.groupParticipantsUpdate(chatId, [cleanSender], 'remove');

                            await context.reply(`${settings.customMessage}\n\n⚡ User has been kicked for posting links!`);

                        } catch (error) {

                            console.error('❌ Failed to kick user:', error);

                            await context.reply(settings.customMessage + '\n\n❌ Failed to kick user - check bot permissions!');

                        }

                        

                    } else if (settings.action === 'warn') {

                        // Initialize warnings for user if not exists

                        if (!settings.warnings[cleanSender]) {

                            settings.warnings[cleanSender] = 0;

                        }

                        

                        settings.warnings[cleanSender]++;

                        const currentWarnings = settings.warnings[cleanSender];

                        

                        if (currentWarnings >= settings.warnLimit) {

                            // Kick user

                            try {

                                await sock.groupParticipantsUpdate(chatId, [cleanSender], 'remove');

                                await context.reply(`${settings.customMessage}\n\n⚡ User kicked after ${currentWarnings} warnings!`);

                                

                                // Reset warnings for this user

                                delete settings.warnings[cleanSender];

                            } catch (error) {

                                console.error('❌ Failed to kick user:', error);

                                await context.reply(`${settings.customMessage}\n\n❌ Warning ${currentWarnings}/${settings.warnLimit} - Failed to kick!`);

                            }

                        } else {

                            await context.reply(`${settings.customMessage}\n\n⚠️ Warning ${currentWarnings}/${settings.warnLimit} - Next violation will result in kick!`);

                        }

                        

                        // Save updated warnings

                        updateCommandData('antilink', chatId, settings);

                    }

                }

            }

            

        } catch (error) {

            console.error('❌ Error in antilink check:', error);

        }

    }

},
  {

    name: 'antibadword',

    description: 'Advanced anti-badword system with customizable actions',

    usage: 'antibadword [on/off/kick/warn/delete/set/status]',

    category: 'admin',

    adminOnly: true,

    groupOnly: true,

    async execute(sock, message, args, context) {

        const { chatId, reply, isGroup, isSenderAdmin, isBotAdmin, senderIsSudo, cleanSender, userMessage } = context;

        if (!isGroup) {

            return await reply('❌ This command can only be used in groups!');

        }

        if (!await requireAdmin(context)) return;

        if (!isBotAdmin) {

            return await reply('❌ Please make me an admin to use anti-badword features!');

        }

        const subCommand = args[1]?.toLowerCase();

        

        if (!subCommand) {

            return await reply(`🤬 Anti-Badword Commands

🔹 \`.antibadword on\` - Enable basic anti-badword

🔹 \`.antibadword off\` - Disable anti-badword  

🔹 \`.antibadword kick\` - Kick users for bad words

🔹 \`.antibadword warn [limit]\` - Warning system

🔹 \`.antibadword delete\` - Only delete messages

🔹 \`.antibadword set message <text>\` - Custom message

🔹 \`.antibadword set add <word>\` - Add bad word

🔹 \`.antibadword set remove <word>\` - Remove bad word

🔹 \`.antibadword list\` - Show bad words list

🔹 \`.antibadword status\` - Show current settings

📌 Examples:

• \`.antibadword warn 3\` - 3 warnings before kick

• \`.antibadword set add stupid\` - Add "stupid" to bad words`);

        }

        // Get current settings

        const currentSettings = getCommandData('antibadword', chatId, {

            enabled: false,

            action: 'delete',

            warnLimit: 3,

            customMessage: '🤬 Bad word detected and deleted!',

            badWords: [

                'fuck', 'shit', 'bitch', 'asshole', 'damn', 'bastard',

                'motherfucker', 'bullshit', 'crap', 'piss', 'whore',

                'nigga', 'nigger', 'faggot', 'retard', 'slut'

            ],

            warnings: {}

        });

        switch (subCommand) {

            case 'on':

                currentSettings.enabled = true;

                currentSettings.action = 'delete';

                updateCommandData('antibadword', chatId, currentSettings);

                

                this.startMonitoring(sock, chatId);

                await reply('✅ Anti-badword enabled! Bad words will be deleted.');

                break;

            case 'off':

                currentSettings.enabled = false;

                updateCommandData('antibadword', chatId, currentSettings);

                await reply('❌ Anti-badword disabled!');

                break;

            case 'kick':

                currentSettings.enabled = true;

                currentSettings.action = 'kick';

                updateCommandData('antibadword', chatId, currentSettings);

                

                this.startMonitoring(sock, chatId);

                await reply('⚡ Anti-badword set to KICK mode! Users using bad words will be kicked.');

                break;

            case 'warn':

                const warnLimit = parseInt(args[2]) || 3;

                if (warnLimit < 1 || warnLimit > 10) {

                    return await reply('❌ Warning limit must be between 1-10!');

                }

                currentSettings.enabled = true;

                currentSettings.action = 'warn';

                currentSettings.warnLimit = warnLimit;

                currentSettings.warnings = {}; // Reset warnings

                updateCommandData('antibadword', chatId, currentSettings);

                

                this.startMonitoring(sock, chatId);

                await reply(`⚠️ Anti-badword set to WARNING mode! Users will be kicked after ${warnLimit} warnings.`);

                break;

            case 'delete':

                currentSettings.enabled = true;

                currentSettings.action = 'delete';

                updateCommandData('antibadword', chatId, currentSettings);

                

                this.startMonitoring(sock, chatId);

                await reply('🗑️ Anti-badword set to DELETE mode! Only messages will be deleted.');

                break;

            case 'set':

                const setType = args[2]?.toLowerCase();

                

                if (setType === 'message') {

                    const customMessage = args.slice(3).join(' ');

                    if (!customMessage) {

                        return await reply('❌ Please provide a custom message!\n\nExample: `.antibadword set message Keep it clean!`');

                    }

                    currentSettings.customMessage = customMessage;

                    updateCommandData('antibadword', chatId, currentSettings);

                    await reply(`✅ Custom message set to: "${customMessage}"`);

                    

                } else if (setType === 'add') {

                    const newWord = args[3]?.toLowerCase();

                    if (!newWord) {

                        return await reply('❌ Please specify a word to add!\n\nExample: `.antibadword set add stupid`');

                    }

                    

                    if (!currentSettings.badWords.includes(newWord)) {

                        currentSettings.badWords.push(newWord);

                        updateCommandData('antibadword', chatId, currentSettings);

                        await reply(`✅ Word "${newWord}" added to bad words list!`);

                    } else {

                        await reply(`⚠️ Word "${newWord}" is already in the bad words list!`);

                    }

                    

                } else if (setType === 'remove') {

                    const wordToRemove = args[3]?.toLowerCase();

                    if (!wordToRemove) {

                        return await reply('❌ Please specify a word to remove!\n\nExample: `.antibadword set remove damn`');

                    }

                    

                    const index = currentSettings.badWords.indexOf(wordToRemove);

                    if (index > -1) {

                        currentSettings.badWords.splice(index, 1);

                        updateCommandData('antibadword', chatId, currentSettings);

                        await reply(`✅ Word "${wordToRemove}" removed from bad words list!`);

                    } else {

                        await reply(`❌ Word "${wordToRemove}" not found in bad words list!`);

                    }

                    

                } else {

                    await reply('❌ Invalid set option!\n\nUse: `.antibadword set message <text>`, `.antibadword set add <word>`, or `.antibadword set remove <word>`');

                }

                break;

            case 'list':

                if (currentSettings.badWords.length === 0) {

                    await reply('📝 No bad words in the list!');

                } else {

                    const wordsList = currentSettings.badWords.map((word, index) => `${index + 1}. ${word}`).join('\n');

                    await reply(`📝 Bad Words List (${currentSettings.badWords.length})\n\n${wordsList}`);

                }

                break;

            case 'status':

                const status = currentSettings.enabled ? '🟢 Enabled' : '🔴 Disabled';

                const actionEmoji = {

                    'delete': '🗑️',

                    'kick': '⚡',

                    'warn': '⚠️'

                };

                

                let statusMsg = `🤬 Anti-Badword Status

Status: ${status}

Action: ${actionEmoji[currentSettings.action]} ${currentSettings.action.toUpperCase()}`;

                if (currentSettings.action === 'warn') {

                    statusMsg += `

Warning Limit: ${currentSettings.warnLimit}`;

                }

                statusMsg += `

Custom Message: ${currentSettings.customMessage}

Bad Words Count: ${currentSettings.badWords.length}`;

                // Show warning counts if any

                const warningCount = Object.keys(currentSettings.warnings).length;

                if (warningCount > 0) {

                    statusMsg += `

Users with Warnings: ${warningCount}`;

                }

                await reply(statusMsg);

                break;

            case 'reset':

                currentSettings.warnings = {};

                updateCommandData('antibadword', chatId, currentSettings);

                await reply('🔄 All warnings have been reset!');

                break;

            case 'clear':

                currentSettings.badWords = [];

                updateCommandData('antibadword', chatId, currentSettings);

                await reply('🗑️ All bad words have been cleared from the list!');

                break;

            default:

                await reply('❌ Invalid anti-badword command!\n\nUse `.antibadword` to see all available options.');

        }

    },

    // Internal monitoring function

    startMonitoring(sock, chatId) {

        console.log(`🤬 Anti-badword monitoring started for ${chatId}`);

    },

    // Main bad word checking function - called from main.js

    async checkMessage(sock, message, context) {

        try {

            const { chatId, userMessage, isGroup, isSenderAdmin, senderIsSudo, cleanSender } = context;

            

            if (!isGroup) return;

            

            // Skip if sender is admin or sudo

            if (isSenderAdmin || senderIsSudo) return;

            

            // Get anti-badword settings

            const settings = getCommandData('antibadword', chatId, {

                enabled: false,

                action: 'delete',

                warnLimit: 3,

                customMessage: '🤬 Bad word detected and deleted!',

                badWords: [

                    'fuck', 'shit', 'bitch', 'asshole', 'damn', 'bastard',

                    'motherfucker', 'bullshit', 'crap', 'piss', 'whore',

                    'nigga', 'nigger', 'faggot', 'retard', 'slut'

                ],

                warnings: {}

            });

            

            if (!settings.enabled) return;

            

            // Check for bad words (case insensitive)

            const messageText = userMessage.toLowerCase();

            const foundBadWords = settings.badWords.filter(word => {

                // Use word boundaries to match whole words

                const regex = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');

                return regex.test(messageText);

            });

            

            if (foundBadWords.length > 0) {

                console.log(`🤬 Bad word detected from ${cleanSender}: ${foundBadWords[0]}`);

                

                // Delete the message first

                try {

                    await sock.sendMessage(chatId, { delete: message.key });

                } catch (error) {

                    console.error('❌ Failed to delete message:', error);

                }

                

                // Handle different actions

                if (settings.action === 'delete') {

                    await context.reply(settings.customMessage);

                    

                } else if (settings.action === 'kick') {

                    try {

                        await sock.groupParticipantsUpdate(chatId, [cleanSender], 'remove');

                        await context.reply(`${settings.customMessage}\n\n⚡ User has been kicked for using inappropriate language!`);

                    } catch (error) {

                        console.error('❌ Failed to kick user:', error);

                        await context.reply(settings.customMessage + '\n\n❌ Failed to kick user - check bot permissions!');

                    }

                    

                } else if (settings.action === 'warn') {

                    // Initialize warnings for user if not exists

                    if (!settings.warnings[cleanSender]) {

                        settings.warnings[cleanSender] = 0;

                    }

                    

                    settings.warnings[cleanSender]++;

                    const currentWarnings = settings.warnings[cleanSender];

                    

                    if (currentWarnings >= settings.warnLimit) {

                        // Kick user

                        try {

                            await sock.groupParticipantsUpdate(chatId, [cleanSender], 'remove');

                            await context.reply(`${settings.customMessage}\n\n⚡ User kicked after ${currentWarnings} warnings for inappropriate language!`);

                            

                            // Reset warnings for this user

                            delete settings.warnings[cleanSender];

                        } catch (error) {

                            console.error('❌ Failed to kick user:', error);

                            await context.reply(`${settings.customMessage}\n\n❌ Warning ${currentWarnings}/${settings.warnLimit} - Failed to kick!`);

                        }

                    } else {

                        await context.reply(`${settings.customMessage}\n\n⚠️ Warning ${currentWarnings}/${settings.warnLimit} - Keep it clean or face consequences!`);

                    }

                    

                    // Save updated warnings

                    updateCommandData('antibadword', chatId, settings);

                }

            }

            

        } catch (error) {

            console.error('❌ Error in anti-badword check:', error);

        }

    }

}

];
