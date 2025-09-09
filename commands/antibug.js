const { getSetting, updateSetting, getCommandData, updateCommandData } = require('../lib/database');

// Dangerous patterns that can crash WhatsApp

const DANGEROUS_PATTERNS = [

    // Unicode exploits

    /[\u202e\u202d\u200f\u200e]/g, // RTL/LTR override characters

    /[\u0300-\u036f]{10,}/g, // Too many combining characters

    /[\ud800-\udfff]/g, // Surrogate pairs that can cause crashes

    

    // Excessive repetition

    /(.)\1{50,}/g, // Same character repeated 50+ times

    /(..)\1{25,}/g, // Same 2 chars repeated 25+ times

    

    // Zalgo text (combining characters)

    /[̀-ͯ]{5,}/g,

    

    // Arabic/RTL exploits

    /[\u0600-\u06ff]{100,}/g,

    

    // Invisible characters

    /[\u200b\u200c\u200d\u2060\ufeff]{3,}/g,

    

    // Emoji bombs

    /([\ud83c-\ud83e][\udc00-\udfff]){50,}/g,

];

// Suspicious message characteristics

const SUSPICIOUS_CHECKS = {

    // Message length limits

    MAX_LENGTH: 4000,

    MAX_LINES: 100,

    

    // Character repetition

    MAX_CHAR_REPEAT: 30,

    

    // Special characters

    MAX_SPECIAL_CHARS: 50,

    

    // Links

    MAX_LINKS: 5,

};

// Rate limiting per user

const RATE_LIMITS = {

    MESSAGES_PER_MINUTE: 20,

    SIMILAR_MESSAGES: 3,

};

let userMessageHistory = new Map();

let blockedUsers = new Set();

// Clean up old message history every 5 minutes

setInterval(() => {

    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);

    for (let [userId, messages] of userMessageHistory) {

        const recentMessages = messages.filter(msg => msg.timestamp > fiveMinutesAgo);

        if (recentMessages.length === 0) {

            userMessageHistory.delete(userId);

        } else {

            userMessageHistory.set(userId, recentMessages);

        }

    }

}, 5 * 60 * 1000);

/**

 * Check if message contains dangerous patterns

 */

function checkDangerousPatterns(message) {

    const threats = [];

    

    for (let i = 0; i < DANGEROUS_PATTERNS.length; i++) {

        if (DANGEROUS_PATTERNS[i].test(message)) {

            threats.push(`Pattern ${i + 1}`);

        }

    }

    

    return threats;

}

/**

 * Check message characteristics

 */

function checkMessageCharacteristics(message) {

    const issues = [];

    

    // Length check

    if (message.length > SUSPICIOUS_CHECKS.MAX_LENGTH) {

        issues.push('Message too long');

    }

    

    // Line count

    if (message.split('\n').length > SUSPICIOUS_CHECKS.MAX_LINES) {

        issues.push('Too many lines');

    }

    

    // Character repetition

    const chars = {};

    for (let char of message) {

        chars[char] = (chars[char] || 0) + 1;

        if (chars[char] > SUSPICIOUS_CHECKS.MAX_CHAR_REPEAT) {

            issues.push(`Excessive ${char} repetition`);

            break;

        }

    }

    

    // Special characters count

    const specialChars = message.match(/[^\w\s]/g) || [];

    if (specialChars.length > SUSPICIOUS_CHECKS.MAX_SPECIAL_CHARS) {

        issues.push('Too many special characters');

    }

    

    // Links count

    const links = message.match(/(https?:\/\/[^\s]+)/g) || [];

    if (links.length > SUSPICIOUS_CHECKS.MAX_LINKS) {

        issues.push('Too many links');

    }

    

    return issues;

}

/**

 * Check rate limiting

 */

function checkRateLimit(userId, message) {

    const now = Date.now();

    const userMessages = userMessageHistory.get(userId) || [];

    

    // Clean old messages (older than 1 minute)

    const recentMessages = userMessages.filter(msg => now - msg.timestamp < 60000);

    

    // Check message count

    if (recentMessages.length >= RATE_LIMITS.MESSAGES_PER_MINUTE) {

        return 'Rate limit exceeded';

    }

    

    // Check similar messages

    const similarCount = recentMessages.filter(msg => 

        msg.content === message || 

        (msg.content.length > 10 && message.includes(msg.content.substring(0, 20)))

    ).length;

    

    if (similarCount >= RATE_LIMITS.SIMILAR_MESSAGES) {

        return 'Spam detected';

    }

    

    // Add current message to history

    recentMessages.push({ content: message, timestamp: now });

    userMessageHistory.set(userId, recentMessages);

    

    return null;

}

/**

 * Main anti-bug protection function

 */

async function handleAntibugProtection(sock, chatId, message, userMessage, senderId) {

    try {

        // Check if antibug is enabled

        if (!getSetting('antibug', false)) {

            return false;

        }

        

        // Skip if already processed

        if (message._antibugProcessed) {

            return false;

        }

        message._antibugProcessed = true;

        

        // Skip if user is blocked

        if (blockedUsers.has(senderId)) {

            console.log(`🛡️ Blocked user ${senderId} attempted to send message`);

            return true;

        }

        

        // Skip if message is from owner/sudo

        if (message.key.fromMe) {

            return false;

        }

        

        const threats = [];

        

        // Check dangerous patterns

        const dangerousPatterns = checkDangerousPatterns(userMessage);

        if (dangerousPatterns.length > 0) {

            threats.push(...dangerousPatterns);

        }

        

        // Check message characteristics

        const characteristics = checkMessageCharacteristics(userMessage);

        if (characteristics.length > 0) {

            threats.push(...characteristics);

        }

        

        // Check rate limiting

        const rateLimit = checkRateLimit(senderId, userMessage);

        if (rateLimit) {

            threats.push(rateLimit);

        }

        

        // If threats detected, take action

        if (threats.length > 0) {

            console.log(`🛡️ ANTIBUG: Blocked malicious message from ${senderId}`);

            console.log(`🛡️ Threats detected: ${threats.join(', ')}`);

            

            // Delete the message

            try {

                await sock.sendMessage(chatId, {

                    delete: {

                        remoteJid: chatId,

                        fromMe: false,

                        id: message.key.id,

                        participant: message.key.participant || senderId

                    }

                });

            } catch (error) {

                console.log('❌ Could not delete message:', error.message);

            }

            

            // Warn the user

            await sock.sendMessage(chatId, {

                text: `🛡️ **ANTIBUG PROTECTION**\n\n⚠️ @${senderId.split('@')[0]}, your message was blocked for security reasons.\n\n🚫 Detected threats: ${threats.join(', ')}\n\n*Please send normal messages only.*`,

                mentions: [senderId]

            });

            

            // Log the incident

            const antibugData = getCommandData('antibug', {});

            const logs = antibugData.logs || [];

            logs.push({

                userId: senderId,

                chatId: chatId,

                threats: threats,

                message: userMessage.substring(0, 100) + '...',

                timestamp: Date.now()

            });

            

            // Keep only last 100 logs

            if (logs.length > 100) {

                logs.splice(0, logs.length - 100);

            }

            

            antibugData.logs = logs;

            updateCommandData('antibug', antibugData);

            

            // Block user if too many violations

            const userViolations = logs.filter(log => 

                log.userId === senderId && 

                Date.now() - log.timestamp < 3600000 // Last hour

            ).length;

            

            if (userViolations >= 3) {

                blockedUsers.add(senderId);

                await sock.sendMessage(chatId, {

                    text: `🛡️ **ANTIBUG AUTO-BLOCK**\n\n🚫 @${senderId.split('@')[0]} has been automatically blocked for repeated violations.\n\n*Contact admin to appeal.*`,

                    mentions: [senderId]

                });

                console.log(`🛡️ ANTIBUG: Auto-blocked ${senderId} for repeated violations`);

            }

            

            return true; // Message was blocked

        }

        

        return false; // Message is safe

        

    } catch (error) {

        console.error('❌ Error in antibug protection:', error);

        return false;

    }

}

module.exports = {

    name: 'antibug',

    aliases: ['antivirus', 'protection'],

    category: 'owner',

    description: 'Advanced antibug protection system',

    execute: async (sock, message, args, context) => {

        const { chatId, senderIsSudo, reply } = context;

        

        if (!message.key.fromMe && !senderIsSudo) {

            return await reply('❌ This command is only available for the owner or sudo!');

        }

        

        if (args.length === 1) {

            const status = getSetting('antibug', false);

            const antibugData = getCommandData('antibug', {});

            const logs = antibugData.logs || [];

            const recentLogs = logs.filter(log => Date.now() - log.timestamp < 3600000);

            

            const statusText = `🛡️ **ANTIBUG PROTECTION STATUS**

**Current Status:** ${status ? '✅ ENABLED' : '❌ DISABLED'}

**Blocked Users:** ${blockedUsers.size}

**Threats Blocked (Last Hour):** ${recentLogs.length}

**Total Logged Incidents:** ${logs.length}

**Protection Features:**

• Unicode exploit detection

• Character repetition limits

• Message length validation

• Rate limiting per user

• Automatic user blocking

• Real-time threat logging

**Usage:**

• \`.antibug on\` - Enable protection

• \`.antibug off\` - Disable protection

• \`.antibug status\` - Show this status

• \`.antibug logs\` - View recent threats

• \`.antibug unblock <number>\` - Unblock user

• \`.antibug clear\` - Clear blocked users`;

            

            return await reply(statusText);

        }

        

        const action = args[1].toLowerCase();

        

        switch (action) {

            case 'on':

            case 'enable':

                updateSetting('antibug', true);

                await reply('🛡️ **ANTIBUG PROTECTION ENABLED**\n\n✅ Your account is now protected against:\n• Unicode exploits\n• Zalgo text attacks\n• Message bombing\n• Character overflow\n• Rate limit abuse\n\n*Stay safe! 🔒*');

                break;

                

            case 'off':

            case 'disable':

                updateSetting('antibug', false);

                await reply('🛡️ **ANTIBUG PROTECTION DISABLED**\n\n❌ Protection is now OFF\n\n⚠️ *Your account is vulnerable to attacks!*');

                break;

                

            case 'logs':

                const antibugData = getCommandData('antibug', {});

                const logs = antibugData.logs || [];

                const recentLogs = logs.slice(-10); // Last 10 logs

                

                if (recentLogs.length === 0) {

                    await reply('📋 **ANTIBUG LOGS**\n\n✅ No threats detected recently.');

                } else {

                    const logText = recentLogs.map((log, index) => 

                        `${index + 1}. User: ${log.userId.split('@')[0]}\n   Threats: ${log.threats.join(', ')}\n   Time: ${new Date(log.timestamp).toLocaleString()}`

                    ).join('\n\n');

                    

                    await reply(`📋 **RECENT ANTIBUG LOGS**\n\n${logText}`);

                }

                break;

                

            case 'unblock':

                if (args.length < 3) {

                    await reply('❌ Usage: .antibug unblock <number>');

                    break;

                }

                

                const numberToUnblock = args[2] + '@s.whatsapp.net';

                if (blockedUsers.has(numberToUnblock)) {

                    blockedUsers.delete(numberToUnblock);

                    await reply(`✅ Unblocked ${args[2]} from antibug protection.`);

                } else {

                    await reply(`❌ ${args[2]} is not blocked.`);

                }

                break;

                

            case 'clear':

                blockedUsers.clear();

                await reply('✅ Cleared all blocked users from antibug protection.');

                break;

                

            case 'test':

                // Test the protection with a sample dangerous message

                const testMessage = 'Test' + '\u202e'.repeat(5) + 'a'.repeat(100);

                const testResult = await handleAntibugProtection(sock, chatId, message, testMessage, message.key.participant || message.key.remoteJid);

                await reply(`🧪 **ANTIBUG TEST**\n\nTest message would be: ${testResult ? '🚫 BLOCKED' : '✅ ALLOWED'}`);

                break;

                

            default:

                await reply('❌ **Invalid option!**\n\nUse: `.antibug on/off/logs/unblock/clear/test`');

        }

    },

    

    // Export the protection function for use in main message handler

    handleAntibugProtection

};