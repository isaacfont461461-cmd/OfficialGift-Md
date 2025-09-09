// lib/case.js - Centralized Feature Control Center 🚀
const { getSetting, updateSetting, getChatData, updateChatData } = require('./database');
const { channelInfo } = require('./messageConfig');

// ============================================
// 🔹 ANTILINK HANDLER 🚫
// ============================================

const handleAntilink = async (sock, message, context) => {
    try {
        const { chatId, userMessage, isGroup, isSenderAdmin, isBotAdmin, senderIsSudo } = context;
        
        if (!isGroup) return;
        
        // Check if antilink is enabled (keep your existing check)
        const antilinkEnabled = getChatData(chatId, 'antilink', false);
        if (!antilinkEnabled) return;
        
        // Get advanced settings from database
        const { getCommandData } = require('./database');
        const settings = getCommandData('antilink', chatId, {
            action: 'delete',
            customMessage: '🚫 Link detected and deleted!',
            allowedLinks: []
        });
        
        if (isSenderAdmin || senderIsSudo) return;
        if (!isBotAdmin) return;
        
        // Your existing link detection...
        const linkPatterns = [
            /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi,
            // ... other patterns
        ];
        
        const hasLink = linkPatterns.some(pattern => pattern.test(userMessage));
        
        if (hasLink) {
            // Check if link is allowed
            const isAllowed = settings.allowedLinks.some(allowed => 
                userMessage.toLowerCase().includes(allowed.toLowerCase())
            );
            
            if (!isAllowed) {
                // Delete message
                await sock.sendMessage(chatId, { delete: message.key });
                
                // Use custom message
                await context.reply(settings.customMessage);
                
                // Handle different actions (kick, warn, etc.) based on settings.action
                if (settings.action === 'kick') {
                    // Add kick logic here
                } else if (settings.action === 'warn') {
                    // Add warning logic here
                }
            }
        }
        
    } catch (error) {
        console.error('❌ Error in handleAntilink:', error);
    }
};
// ============================================
// 🔹 AUTOREACT HANDLER 😂😍
// ============================================

const handleAutoReaction = async (sock, message) => {  
try {  
    const autoreactMode = getSetting('autoreact', 'off');  
    if (autoreactMode === 'off') return;  
      
    const chatId = message.key.remoteJid;  
    const isGroup = chatId.endsWith('@g.us');  
    const isFromBot = message.key.fromMe;  
      
    // ❌ Remove this if you want the bot to react to its own messages  
      
      
    // Check mode conditions  
    if (autoreactMode === 'dm' && isGroup) return;  
    if (autoreactMode === 'group' && !isGroup) return;  
   // 'all' = works everywhere  
      
    // Get emojis from DB (fallback list included)  
    const reactionEmojis = getSetting('reactionEmojis', ['✅', '❤️', '😊', '👍', '🔥', '💯', '🌟', '⭐']);  
      
    // Random chance (30% react rate, tweak as you like)  
    //if (Math.random() > 0.3) return;  
      
    // Pick random emoji  
    const randomEmoji = reactionEmojis[Math.floor(Math.random() * reactionEmojis.length)];  
      
    // React to the message  
    await sock.sendMessage(chatId, {  
        react: {  
            text: randomEmoji,  
            key: message.key  
        }  
    });  
      
    console.log(`😊 Auto-reacted with ${randomEmoji} in ${isGroup ? 'group' : 'DM'}`);     
    } catch (error) {
        console.error('❌ Error in handleAutoReact:', error);
    }
};

// ============================================
// 🔹 AUTOREAD HANDLER 👀
// ==================================
const handleAutoread = async (sock, message) => {

    try {
          const AutoreadEnabled =    getSetting('autoread', false);
        if (!AutoreadEnabled) 

            return; 

        if (message.key && message.key.remoteJid) {

            await sock.readMessages([message.key]);

        }

    } catch (error) {

        console.error('Error in handleAutoread:', error);

    }

}
// ============================================
// 🔹 AUTOTYPING HANDLER ⌨️
// ============================================
const handleAutoTyping = async (sock, chatId, delay = 2000) => {
    try {
        const autotypingEnabled = getSetting('autotype', false);
        if (!autotypingEnabled) return;
        
        // Show typing indicator
        await sock.sendPresenceUpdate('composing', chatId);
        
        console.log('⌨️ Auto-typing indicator sent to:', chatId);
        
        // Stop typing after delay
        setTimeout(async () => {
            try {
                await sock.sendPresenceUpdate('paused', chatId);
                console.log('⌨️ Auto-typing stopped');
            } catch (error) {
                console.error('❌ Error stopping typing:', error);
            }
        }, delay);
        
    } catch (error) {
        console.error('❌ Error in handleAutoTyping:', error);
    }
};

// Add alias for compatibility with main.js
const handleAutotypingForMessage = async (sock, chatId, delay = 2000) => {
    return await handleAutoTyping(sock, chatId, delay);
};

// ============================================
// 🔹 AUTORECORD HANDLER 🎤
// ============================================
const handleAutoRecord = async (sock, chatId, delay = 3000) => {
    try {
        const autorecordEnabled = getSetting('autorecord', false);
        if (!autorecordEnabled) return;
        
        // Show recording indicator
        await sock.sendPresenceUpdate('recording', chatId);
        
        console.log('🎤 Auto-recording indicator sent to:', chatId);
        
        // Stop recording after delay
        setTimeout(async () => {
            try {
                await sock.sendPresenceUpdate('paused', chatId);
                console.log('🎤 Auto-recording stopped');
            } catch (error) {
                console.error('❌ Error stopping recording:', error);
            }
        }, delay);
        
    } catch (error) {
        console.error('❌ Error in handleAutoRecord:', error);
    }
};

// ============================================
// 🔹 ANTIBADWORD HANDLER ❌
// ============================================
const handleAntibadword = async (sock, message, context) => {
    try {
        const { chatId, userMessage, isGroup, isSenderAdmin, isBotAdmin, senderIsSudo } = context;
        
        // Only work in groups
        if (!isGroup) return;
        
        // Get antibadword settings for this chat
        const antibadwordEnabled = getChatData(chatId, 'antibadword', false);
        if (!antibadwordEnabled) return;
        
        // Skip if sender is admin or sudo
        if (isSenderAdmin || senderIsSudo) return;
        
        // Check if bot has admin permissions
        if (!isBotAdmin) return;
        
        // Bad words list (you can expand this)
        const badWords = [
            'fuck', 'shit', 'bitch', 'asshole', 'damn', 'bastard',
            'motherfucker', 'bullshit', 'crap', 'piss', 'whore',
            // Add more bad words as needed
        ];
        
        const hasBadWord = badWords.some(word => 
            userMessage.toLowerCase().includes(word.toLowerCase())
        );
        
        if (hasBadWord) {
            // Delete the message
            await sock.sendMessage(chatId, {
                delete: message.key
            });
            
            // Send warning
            await context.reply('❌ Bad word detected and deleted!\n\n🚫 Please keep the chat clean and respectful.');
            
            console.log(`❌ Antibadword: Deleted message with bad word in ${chatId}`);
        }
        
    } catch (error) {
        console.error('❌ Error in handleAntibadword:', error);
    }
};

// ============================================
// 🔹 AUTOSTATUS HANDLER 👑
// ============================================
const handleAutostatus = async (sock) => {
    try {
        const autostatusEnabled = getSetting('autoviewstatus', false);
        if (!autostatusEnabled) return;
        
        // This function would be called when status updates are received
        // Implementation depends on your WhatsApp client setup
        console.log('👑 Auto-viewing status updates');
        
    } catch (error) {
        console.error('❌ Error in handleAutostatus:', error);
    }
};

// Add handleStatusUpdate alias for compatibility
const handleStatusUpdate = async (sock, statusUpdate) => {
    try {
        await handleAutostatus(sock);
        
    } catch (error) {
        console.error('❌ Error in handleStatusUpdate:', error);
    }
};

// ============================================
// 🔹 AUTOBIO HANDLER ✍️
//==============================//
// 🔹 AUTOBIO HANDLER ✍️
const handleAutobio = async (sock) => {
    try {
        const autobioEnabled = getSetting('autobio', false);
        if (!autobioEnabled) return;

        // Prepare some random bio texts
        const currentTime = new Date().toLocaleString('en-US', {
            timeZone: getSetting('timezone', 'Africa/Nairobi'),
            hour12: true,
            hour: 'numeric',
            minute: '2-digit',
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });

        const bios = [
            `🤖 ${getSetting('botName', 'GIFT-MD')} | ⏰ ${currentTime}`,
            `🚀 Always Active | ⚡ Powered by gift md`,
            `🔥 ${getSetting('botName', 'GIFT MD')} on duty 24/7`,
            `💡 Smart Bot, Smart Moves | ${currentTime}`,
            `✨ ${getSetting('botName', 'GIFYY MD')} – Here to serve!`
        ];

        // Pick random one
        const randomBio = bios[Math.floor(Math.random() * bios.length)];

        // Update bio
        await sock.updateProfileStatus(randomBio);
        console.log('✍️ Auto-updated bio:', randomBio);

    } catch (error) {
        console.error('❌ Error in handleAutobio:', error);
    }
};
// ============================================
// 🔹 AUTORECORDTYPE HANDLER 🎤⌨️
// ============================================
const handleAutoRecordType = async (sock, chatId, delay = 3000) => {
    try {
        const autorecordtypeMode = getSetting('autorecordtype', 'off');
        if (autorecordtypeMode === 'off') return;
        
        const isGroup = chatId.endsWith('@g.us');
        
        // Check mode conditions
        if (autorecordtypeMode === 'dm' && isGroup) return;
        if (autorecordtypeMode === 'group' && !isGroup) return;
        // 'all' = works everywhere
        
        // Show recording indicator first
        await sock.sendPresenceUpdate('recording', chatId);
        console.log('🎤 Auto-record indicator sent to:', chatId);
        
        // Switch to typing after half the delay
        setTimeout(async () => {
            try {
                await sock.sendPresenceUpdate('composing', chatId);
                console.log('⌨️ Switched to typing in:', chatId);
            } catch (error) {
                console.error('❌ Error switching to typing:', error);
            }
        }, delay / 2);
        
        // Stop all activity after full delay
        setTimeout(async () => {
            try {
                await sock.sendPresenceUpdate('paused', chatId);
                console.log('⏹️ Auto-record-type stopped');
            } catch (error) {
                console.error('❌ Error stopping record-type:', error);
            }
        }, delay);
        
    } catch (error) {
        console.error('❌ Error in handleAutoRecordType:', error);
    }
};
// ============================================
// 🔹 FEATURE SETTINGS CONTROLLERS
// ============================================

// Antilink Settings
const antilinkSettings = {
    enable: (chatId) => updateChatData(chatId, 'antilink', true),
    disable: (chatId) => updateChatData(chatId, 'antilink', false),
    isEnabled: (chatId) => getChatData(chatId, 'antilink', false)
};

// Auto React Settings
const autoreactSettings = {
    enable: (mode = 'all') => {
        console.log('🔧 Enabling autoreact in database...');
        const result = updateSetting('autoreact', mode);
        console.log('✅ Autoreact enabled:', result);
        return result;
    },
    disable: () => {
        console.log('🔧 Disabling autoreact in database...');
        const result = updateSetting('autoreact', false);
        console.log('❌ Autoreact disabled:', result);
        return result;
    },
    isEnabled: () => {
        const status = getSetting('autoreact', false);
        console.log('📊 Autoreact status check:', status);
        return status;
    }
};

// Auto Read Settings
const autoreadSettings = {
    enable: () => {
        console.log('🔧 Enabling autoread in database...');
        const result = updateSetting('autoread', true);
        console.log('✅ Autoread enabled:', result);
        return result;
    },
    disable: () => {
        console.log('🔧 Disabling autoread in database...');
        const result = updateSetting('autoread', false);
        console.log('❌ Autoread disabled:', result);
        return result;
    },
    isEnabled: () => {
        const status = getSetting('autoread', false);
        console.log('📊 Autoread status check:', status);
        return status;
    }
};

// Auto Typing Settings
const autotypingSettings = {
    enable: () => {
        console.log('🔧 Enabling autotyping in database...');
        const result = updateSetting('autotype', true);
        console.log('✅ Autotyping enabled:', result);
        return result;
    },
    disable: () => {
        console.log('🔧 Disabling autotyping in database...');
        const result = updateSetting('autotype', false);
        console.log('❌ Autotyping disabled:', result);
        return result;
    },
    isEnabled: () => {
        const status = getSetting('autotype', false);
        console.log('📊 Autotyping status check:', status);
        return status;
    }
};

// Auto Record Settings
const autorecordSettings = {
    enable: () => {
        console.log('🔧 Enabling autorecord in database...');
        const result = updateSetting('autorecord', true);
        console.log('✅ Autorecord enabled:', result);
        return result;
    },
    disable: () => {
        console.log('🔧 Disabling autorecord in database...');
        const result = updateSetting('autorecord', false);
        console.log('❌ Autorecord disabled:', result);
        return result;
    },
    isEnabled: () => {
        const status = getSetting('autorecord', false);
        console.log('📊 Autorecord status check:', status);
        return status;
    }
};

// Antibadword Settings
const antibadwordSettings = {
    enable: (chatId) => updateChatData(chatId, 'antibadword', true),
    disable: (chatId) => updateChatData(chatId, 'antibadword', false),
    isEnabled: (chatId) => getChatData(chatId, 'antibadword', false)
};

// Auto Status Settings
const autostatusSettings = {
    enable: () => {
        console.log('🔧 Enabling autostatus in database...');
        const result = updateSetting('autoviewstatus', true);
        console.log('✅ Autostatus enabled:', result);
        return result;
    },
    disable: () => {
        console.log('🔧 Disabling autostatus in database...');
        const result = updateSetting('autoviewstatus', false);
        console.log('❌ Autostatus disabled:', result);
        return result;
    },
    isEnabled: () => {
        const status = getSetting('autoviewstatus', false);
        console.log('📊 Autostatus status check:', status);
        return status;
    }
};

// Auto Bio Settings
// Auto Bio Settings
const autobioSettings = {
    enable: () => {
        console.log('🔧 Enabling autobio in database...');
        const result = updateSetting('autobio', true);
        console.log('✅ Autobio enabled:', result);
        return result;
    },
    disable: () => {
        console.log('🔧 Disabling autobio in database...');
        const result = updateSetting('autobio', false);
        console.log('❌ Autobio disabled:', result);
        return result;
    },
    isEnabled: () => {
        const status = getSetting('autobio', false);
        console.log('📊 Autobio status check:', status);
        return status;
    },
    updateNow: async (sock) => {
        console.log('🔧 Updating bio now...');
        await handleAutobio(sock);
        return true;
    }
};

// Auto Record Type Settings
const autorecordtypeSettings = {
    enable: (mode = 'all') => {
        console.log('🔧 Enabling autorecordtype in database...');
        const validModes = ['dm', 'group', 'all'];
        const selectedMode = validModes.includes(mode) ? mode : 'all';
        const result = updateSetting('autorecordtype', selectedMode);
        console.log('✅ Autorecordtype enabled:', selectedMode);
        return result;
    },
    disable: () => {
        console.log('🔧 Disabling autorecordtype in database...');
        const result = updateSetting('autorecordtype', 'off');
        console.log('❌ Autorecordtype disabled:', result);
        return result;
    },
    isEnabled: () => {
        const status = getSetting('autorecordtype', 'off');
        console.log('📊 Autorecordtype status check:', status);
        return status !== 'off';
    },
    getMode: () => {
        const mode = getSetting('autorecordtype', 'off');
        console.log('📊 Autorecordtype mode check:', mode);
        return mode;
    }
};
// ============================================
// 🔹 GLOBAL FEATURE MANAGER
// ============================================
global.featureManager = {
    antilink: antilinkSettings,
    autoreact: autoreactSettings,
    autoread: autoreadSettings,
    autotyping: autotypingSettings,
    autorecord: autorecordSettings,
    antibadword: antibadwordSettings,
    autostatus: autostatusSettings,
    autobio: autobioSettings
};

// ============================================
// 🔹 MAIN CASE HANDLER
// ============================================
const handleMessageCases = async (sock, message, context, isCmd) => {
    try {
        // Only run for non-command messages
        if (isCmd) return;
        
        const { chatId, isGroup } = context;
        
        // Run all handlers
        await handleAntilink(sock, message, context);
        await handleAntibadword(sock, message, context);
        await handleAutoReaction(sock, message);
        await handleAutoread(sock, message);
        
        // Auto typing for non-group messages or based on settings
        if (!isGroup || getSetting('autotype', false)) {
            await handleAutoTyping(sock, chatId);
        }
        
        console.log('🎯 Message case handlers executed');
        
    } catch (error) {
        console.error('❌ Error in handleMessageCases:', error);
    }
};

// ============================================
// 🔹 AUTO BIO TIMER (Run every 5 minutes)
// ============================================
setInterval(async () => {
    try {
        if (global.sock && autobioSettings.isEnabled()) {
            await handleAutobio(global.sock);
        }
    } catch (error) {
        console.error('❌ Error in auto bio timer:', error);
    }
}, 5 * 60 * 1000); // 5 minutes

// ============================================
// 🔹 EXPORTS
// ============================================
module.exports = {
    // Main handler
    handleMessageCases,
    
    // Individual handlers
    handleAntilink,
    handleAutoReaction,
    handleAutoread,
    handleAutoTyping,
    handleAutotypingForMessage,
    handleAutoRecord,
    handleAutoRecordType,
    handleAntibadword,
    handleAutostatus,
    handleStatusUpdate,
    handleAutobio,
    
    // Settings controllers
    antilinkSettings,
    autoreactSettings,
    autoreadSettings,
    autotypingSettings,
    autorecordSettings,
    autorecordtypeSettings,  
    antibadwordSettings,
    autostatusSettings,
    autobioSettings,
    
    // Global access
    featureManager: global.featureManager
};