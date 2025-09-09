
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
const db = require('../lib/database');
const fs = require('fs');
const axios = require('axios');
const sharp = require('sharp');
const path = require('path');
global.offlineInterval = null;
const { autobioSettings, autoreadSettings, autorecordSettings, autorecordtypeSettings } = require('../lib/case');
const { writeFile } = require('fs/promises');

module.exports = [ 
{

    name: 'alwaysoffline',

    aliases: ['invisible'],

    category: 'owner', 

    description: 'Control always offline status',

    usage: 'offline on/off',

    

    async execute(sock, message, args, context) {

        const { reply, senderIsSudo, isFromOwner } = context;

        

        // Only owner/sudo can use this

        if (!isFromOwner && !senderIsSudo) {

            return reply('❌ This command is only available for the owner or sudo!');

        }

        

        const action = args[1]?.toLowerCase();

        

        switch (action) {

            case 'on':

                // Clear existing intervals

                if (global.offlineInterval) {

                    clearInterval(global.offlineInterval);

                }

                if (global.onlineInterval) {

                    clearInterval(global.onlineInterval);

                    global.onlineInterval = null;

                }

                

                // Set always offline

                global.offlineInterval = setInterval(async () => {

                    try {

                        await sock.sendPresenceUpdate('unavailable');

                        

                    } catch (error) {

                        console.error('❌ Error updating presence:', error);

                    }

                }, 10000); // Update every 10 seconds

                

                // Initial presence update

                await sock.sendPresenceUpdate('unavailable');

                

                // Disable read receipts to appear more offline

                try {

                    await sock.readMessages([message.key]);

                } catch (error) {

                    // Ignore errors

                }

                

                // Save setting to database

                db.updateSetting('alwaysOffline', true);

                db.updateSetting('alwaysOnline', false); // Disable online mode

                

                return reply('✅ Always offline mode enabled! Bot will appear offline even when active.');

                

            case 'off':

                // Clear interval

                if (global.offlineInterval) {

                    clearInterval(global.offlineInterval);

                    global.offlineInterval = null;

                }

                

                // Set normal presence

                await sock.sendPresenceUpdate('available');

                

                // Save setting to database

                db.updateSetting('alwaysOffline', false);

                

                return reply('❌ Always offline mode disabled! Bot will show normal presence.');

                

            case 'status':

                const isEnabled = db.getSetting('alwaysOffline', false);

                const status = isEnabled ? '✅ Enabled' : '❌ Disabled';

                return reply(`📊 Always Offline Status\n\n🔸 Status: ${status}\n🔸 Interval: ${global.offlineInterval ? 'Running' : 'Stopped'}`);

                

            default:

                return reply(`
❌ Invalid offline command!\n📝 Usage:\n• offline on - Enable always offline mode\n• offline off - Disable always offline mode\n• offline status - Check current status\n\nℹ️ Info: When enabled, bot will appear offline continuously and won't show read receipts or online status.\n\n⚠️ Note: This affects your bot account's visibility to other users.`);

        }

    }

},
    // commands/online.js

 {

    name: 'alwaysonline',

    aliases: ['ao'],

    category: 'owner',

    description: 'Control always online status',

    usage: 'online on/off',

    

    async execute(sock, message, args, context) {

        const { reply, senderIsSudo, isFromOwner } = context;

        

        // Only owner/sudo can use this

        if (!isFromOwner && !senderIsSudo) {

            return reply('❌ This command is only available for the owner or sudo!');

        }

        

        const action = args[1]?.toLowerCase();

        

        switch (action) {

            case 'on':

                // Clear existing interval if any

                if (global.onlineInterval) {

                    clearInterval(global.onlineInterval);

                }

                

                // Set always online

                global.onlineInterval = setInterval(async () => {

                    try {

                        await sock.sendPresenceUpdate('available');

                        

                    } catch (error) {

                        console.error('❌ Error updating presence:', error);

                    }

                }, 30000); // Update every 30 seconds

                

                // Initial presence update

                await sock.sendPresenceUpdate('available');

                

                // Save setting to database

                db.updateSetting('alwaysOnline', true);

                

                return reply('✅ Always online mode enabled! Bot will appear online continuously.');

                

            case 'off':

                // Clear interval

                if (global.onlineInterval) {

                    clearInterval(global.onlineInterval);

                    global.onlineInterval = null;

                }

                

                // Set normal presence

                await sock.sendPresenceUpdate('unavailable');

                

                // Save setting to database

                db.updateSetting('alwaysOnline', false);

                

                return reply('❌ Always online mode disabled! Bot will show normal presence.');

                

            case 'status':

                const isEnabled = db.getSetting('alwaysOnline', false);

                const status = isEnabled ? '✅ Enabled' : '❌ Disabled';

                return reply(`📊 Always Online Status\n\n🔸 Status: ${status}\n🔸 Interval: ${global.onlineInterval ? 'Running' : 'Stopped'}`);

                

            default:

                return reply(`
❌ Invalid online command!\n📝 Usage:\n• online on - Enable always online mode\n• online off - Disable always online mode\n• online status - Check current status\n\nℹ️ Info: When enabled, bot will appear online continuously by sending presence updates every 30 seconds.

`);

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

}
];