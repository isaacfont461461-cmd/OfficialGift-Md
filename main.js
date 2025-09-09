const settings = require('./settings');
const { buildContext } = require('./lib/context');
//require('./config.js');

// Load database
const { commandData, saveDatabase } = require('./lib/database.js');
const { isBanned } = require('./lib/isBanned');
const { handleMessageCases, handleAutotypingForMessage, handleAutoReaction,handleAutoread, handleStatusUpdate,handleAutoRecord,handleAutoRecordType } = require('./lib/case');
const fs = require('fs');
const { getSetting,getWelcome, getGoodbye, isWelcomeEnabled, isGoodbyeEnabled } = require('./lib/database');
const { isSudo } = require('./lib/database');
const { handleAntibugProtection } = require('./commands/antibug');
const isAdmin = require('./lib/isAdmin');
const { incrementMessageCount, topMembers } = require('./commands/topmembers');
const { handleChatbotCommand, handleChatbotResponse } = require('./commands/chatbot');
const antidelete = require('./commands/antidelete');
const antiedit = require('./commands/antiedit');
// Import command handler
const { commands, aliases, loadCommands, categories } = require('./commandHandler');
console.log('[GIFT-MD] connected to Loader 🚀');
// Initialize commands
loadCommands();

const { channelInfo } = require('./lib/messageConfig');
const db = require('./lib/database');


// NEW - Use database settings first, fallback to settings.js
global.prefix = getSetting('prefix', settings.prefix);
global.mode = getSetting('mode', settings.Mode);
global.packname = getSetting('packname', settings.packname);
global.botName = getSetting('botName', settings.botName);
global.botOwner = getSetting('botOwner', settings.botOwner);
global.version = getSetting('version', settings.version);
// Add other globals as needed
global.startTime = Date.now();
global.author = "ISAAC-FAVOUR"
global.channelLink = "https://whatsapp.com/channel/0029Va90zAnIHphOuO8Msp3A";
global.ytch = "Mr Unique Hacker";

// Restore presence settings on startup
const restorePresenceSettings = async (sock) => {
    try {
        const alwaysOnline = db.getSetting('alwaysOnline', false);
        const alwaysOffline = db.getSetting('alwaysOffline', false);
        
        if (alwaysOnline && !alwaysOffline) {
            global.onlineInterval = setInterval(async () => {
                try {
                    await sock.sendPresenceUpdate('available');
                    console.log('📱 Presence updated: Online (restored)');
                } catch (error) {
                    console.error('❌ Error updating presence:', error);
                }
            }, 30000);
            
            console.log('🟢 Always online mode restored');
            
        } else if (alwaysOffline) {
            global.offlineInterval = setInterval(async () => {
                try {
                    await sock.sendPresenceUpdate('unavailable');
                    console.log('📱 Presence updated: Offline (restored)');
                } catch (error) {
                    console.error('❌ Error updating presence:', error);
                }
            }, 10000);
            
            console.log('🔴 Always offline mode restored');
        }
        
    } catch (error) {
        console.error('❌ Error restoring presence settings:', error);
    }
};


async function handleMessages(sock, messageUpdate, printLog) {
    try {
        const { messages, type } = messageUpdate;
        if (type !== 'notify') return;

        const message = messages[0];
        if (!message?.message) return;

        const currentPrefix = global.prefix;
 await handleAutoread(sock, message);
              // Store message for antidelete feature
if (message.message) {
    await antidelete.storeMessage(message);
}
// Handle message revocation
        if (message.message?.protocolMessage?.type === 0) {
    await antidelete.handleMessageRevocation(sock, message);
    return;
} 
      // Handle message revocation (antidelete)
if (message.message?.protocolMessage?.type === 0) {
    await antidelete.handleMessageRevocation(sock, message);
    return;
}

// ✨ FIXED: Better edit detection - only catch actual edits
if (message.message?.protocolMessage?.type === 14) {
    await antiedit.handleMessageEdit(sock, message);
    return; // Don't process edited messages further
} 
        
        const chatId = message.key.remoteJid;
        const senderId = message.key.participant || message.key.remoteJid;
        const isGroup = chatId.endsWith('@g.us');
        const tempContext = buildContext(sock, message);
const contextSenderIsSudo = tempContext.senderIsSudo;

        const userMessage = (
            message.message?.conversation?.trim() ||
            message.message?.extendedTextMessage?.text?.trim() ||
            message.message?.imageMessage?.caption?.trim() ||
            message.message?.videoMessage?.caption?.trim() ||
            ''
        ).toLowerCase().replace(/\.\s+/g, '.').trim();

        const rawText = message.message?.conversation?.trim() ||
            message.message?.extendedTextMessage?.text?.trim() ||
            message.message?.imageMessage?.caption?.trim() ||
            message.message?.videoMessage?.caption?.trim() ||
            '';

        // 🛡️ Antibug protection
        const wasBlocked = await handleAntibugProtection(sock, chatId, message, rawText, senderId);
        if (wasBlocked) return;

        // Only log command usage
        if (userMessage.startsWith(currentPrefix)) {
            await handleAutoReaction(sock, message);
            
            await handleAutotypingForMessage(sock, chatId);
            await handleAutoRecord(sock,chatId);
            await handleAutoRecordType(sock, chatId);
            console.log(`📝 Command used in ${isGroup ? 'Gc' : 'Pm'}: ${userMessage}`);
        }

        // Ban check
        if (isBanned(senderId) && !userMessage.startsWith(`${currentPrefix}unban`)) {
            if (Math.random() < 0.1) {
                await sock.sendMessage(chatId, {
                    text: '❌ You are banned from using the bot. Contact an admin to get unbanned.',
                    ...channelInfo
                });
            }
            return;
        }

        // Handle play command replies
        if (global.playQueue && global.playQueue[chatId]) {
            const userReply = userMessage.trim().toLowerCase();
            const queueData = global.playQueue[chatId];
            
            if (userReply === 'a' || userReply === 'audio') {
                await sock.sendMessage(chatId, {
                    audio: { url: queueData.audioUrl },
                    mimetype: "audio/mpeg",
                    fileName: `${queueData.title}.mp3`
                }, { quoted: message });

                global.playQueue[chatId].audioSent = true;
                if (global.playQueue[chatId].documentSent) delete global.playQueue[chatId];
                return;
            }
            
            if (userReply === 'd' || userReply === 'doc' || userReply === 'document') {
                await sock.sendMessage(chatId, {
                    document: { url: queueData.audioUrl },
                    mimetype: "audio/mpeg",
                    fileName: `${queueData.title}.mp3`
                }, { quoted: message });

                global.playQueue[chatId].documentSent = true;
                if (global.playQueue[chatId].audioSent) delete global.playQueue[chatId];
                return;
            }
        }

        // Non-command messages
        if (!userMessage.startsWith(currentPrefix)) {
            await handleAutoReaction(sock, message);
            
            await handleAutotypingForMessage(sock, chatId);
            await handleAutoRecord(sock,chatId);
            await handleAutoRecordType(sock, chatId);
            if (isGroup) {
                const adminStatus = await isAdmin(sock, chatId, senderId, message);
                const context = buildContext(sock, message, { isAdminCheck: true, adminStatus });
                await handleMessageCases(sock, message, context, false);
            }
            return;
        }

        // Admin commands
        const adminCommands = [
            `${currentPrefix}mute`, `${currentPrefix}unmute`, `${currentPrefix}ban`,
            `${currentPrefix}unban`, `${currentPrefix}promote`, `${currentPrefix}demote`,
            `${currentPrefix}kick`, `${currentPrefix}tagall`, `${currentPrefix}antilink`,
            `${currentPrefix}antibadword`
        ];
        const isAdminCommand = adminCommands.some(cmd => userMessage.startsWith(cmd));

        // Owner commands
        const ownerCommands = [
            `${currentPrefix}mode`, `${currentPrefix}autostatus`,   `${currentPrefix}antidelete`, `${currentPrefix}antideletepm`, `${currentPrefix}antideletegc`, `${currentPrefix}antiedit`, `${currentPrefix}antieditpm`, `${currentPrefix}antieditgc`, `${currentPrefix}cleartmp`, `${currentPrefix}setpp`, `${currentPrefix}clearsession`, `${currentPrefix}prefix`, `${currentPrefix}autoreact`, `${currentPrefix}autotyping`, `${currentPrefix}autoread`
        ];
        const isOwnerCommand = ownerCommands.some(cmd => userMessage.startsWith(cmd));

        let isSenderAdmin = false;
        let isBotAdmin = false;

        if (isGroup) {
            const adminStatus = await isAdmin(sock, chatId, senderId, message);
            isSenderAdmin = adminStatus.isSenderAdmin;
            isBotAdmin = adminStatus.isBotAdmin;
        }

        if (isGroup && isAdminCommand) {
            if (!isBotAdmin) {
                await sock.sendMessage(chatId, { 
                    text: '❌ Please make the bot an admin to use admin commands.', 
                    ...channelInfo 
                }, { quoted: message });
                return;
            }
            if (!isSenderAdmin && !message.key.fromMe && !contextSenderIsSudo) {
                await sock.sendMessage(chatId, {
                    text: '❌ Only group admins can use this command!',
                    ...channelInfo
                }, { quoted: message });
                return;
            }
        }

        if (isOwnerCommand && !message.key.fromMe && !contextSenderIsSudo) {
    await sock.sendMessage(chatId, { text: '❌ This command is only available for the owner or sudo!' });
    return;
}

try {
    const data = JSON.parse(fs.readFileSync('./data/messageCount.json'));
    if (!data.isPublic && !message.key.fromMe && !contextSenderIsSudo) {
        return;
    }
} catch (error) {
    console.error('Error checking access mode:', error);
}

        // COMMAND HANDLER EXECUTION
        try {
            const args = userMessage.slice(currentPrefix.length).split(' ');
            const commandName = args[0].toLowerCase();
            let command = commands.get(commandName) || aliases.get(commandName);

            if (command) {
                const adminStatus = isGroup ? await isAdmin(sock, chatId, senderId, message) : {};
                const context = buildContext(sock, message, { isAdminCheck: true, adminStatus });
                await command.execute(sock, message, args, context);
                await handleAutoReaction(sock, message);
            } else {
                await sock.sendMessage(chatId, {
                    text: `😒Cmd "${commandName}" 🤷. Use ${currentPrefix}help to see available commands.`,
                    ...channelInfo
                }, { quoted: message });
            }
        } catch (error) {
            console.error(`❌ Error executing command: ${error.message}`);
            await sock.sendMessage(chatId, {
                text: `❌ An error occurred while executing the command: ${error.message}`,
                ...channelInfo
            }, { quoted: message });
        }

    } catch (error) {
        console.error('Error in handleMessages:', error);
    }
}

async function handleGroupParticipantUpdate(sock, update) {
    try {
        const { id, participants, action } = update;
        if (!id.endsWith('@g.us')) return;

        if (action === 'add') {
            if (!isWelcomeEnabled(id)) return;
            const groupMetadata = await sock.groupMetadata(id);
            const groupName = groupMetadata.subject;
            const groupDesc = groupMetadata.desc || 'No description available';
            const welcomeMessage = getWelcome(id);

            for (const participant of participants) {
                const user = participant.split('@')[0];
                const memberCount = groupMetadata.participants.length;
                const formattedMessage = welcomeMessage
                    .replace(/{user}/g, `@${user}`)
                    .replace(/{group}/g, groupName)
                    .replace(/{description}/g, groupDesc)
                    .replace(/{count}/g, memberCount.toString());

                try {
                    const { applyFontStyle } = require('./lib/database');
                    const styledMessage = applyFontStyle(formattedMessage);
                    await sock.sendMessage(id, { text: styledMessage, mentions: [participant], ...channelInfo });
                } catch {
                    await sock.sendMessage(id, { text: formattedMessage, mentions: [participant], ...channelInfo });
                }
            }
        }

        if (action === 'remove') {
            if (!isGoodbyeEnabled(id)) return;
            const groupMetadata = await sock.groupMetadata(id);
            const groupName = groupMetadata.subject;
            const groupDesc = groupMetadata.desc || 'No description available';
            const goodbyeMessage = getGoodbye(id);

            for (const participant of participants) {
                const user = participant.split('@')[0];
                const memberCount = groupMetadata.participants.length;
                const formattedMessage = goodbyeMessage
                    .replace(/{user}/g, `@${user}`)
                    .replace(/{group}/g, groupName)
                    .replace(/{description}/g, groupDesc)
                    .replace(/{count}/g, memberCount.toString());

                try {
                    const { applyFontStyle } = require('./lib/database');
                    const styledMessage = applyFontStyle(formattedMessage);
                    await sock.sendMessage(id, { text: styledMessage, mentions: [participant], ...channelInfo });
                } catch {
                    await sock.sendMessage(id, { text: formattedMessage, mentions: [participant], ...channelInfo });
                }
            }
        }
    } catch (error) {
        console.error('Error in handleGroupParticipantUpdate:', error);
    }
}

async function handleStatus(sock, statusUpdate) {
    try {
        await handleStatusUpdate(sock, statusUpdate);
    } catch (error) {
        console.error('Error in handleStatus:', error);
    }
}

module.exports = {
    handleMessages,
    handleGroupParticipantUpdate,
    handleStatus,
    restorePresenceSettings
};