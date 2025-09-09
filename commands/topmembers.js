const fs = require('fs');
const path = require('path');
const { getSetting } = require('../lib/database');

const dataFilePath = path.join(__dirname, '..', 'data', 'messageCount.json');

function loadMessageCounts() {
    if (fs.existsSync(dataFilePath)) {
        const data = fs.readFileSync(dataFilePath);
        return JSON.parse(data);
    }
    
    // Create default structure with isPublic synced from database
    const currentMode = getSetting('mode', 'public');
    return {
        isPublic: currentMode === 'public',
        messageCount: {}
    };
}

function saveMessageCounts(messageCounts) {
    const dataDir = path.dirname(dataFilePath);
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // Always sync isPublic with database when saving
    const currentMode = getSetting('mode', 'public');
    messageCounts.isPublic = (currentMode === 'public');
    
    fs.writeFileSync(dataFilePath, JSON.stringify(messageCounts, null, 2));
}

function incrementMessageCount(groupId, userId) {
    const messageCounts = loadMessageCounts();

    // Ensure messageCount object exists
    if (!messageCounts.messageCount) {
        messageCounts.messageCount = {};
    }

    if (!messageCounts.messageCount[groupId]) {
        messageCounts.messageCount[groupId] = {};
    }

    if (!messageCounts.messageCount[groupId][userId]) {
        messageCounts.messageCount[groupId][userId] = 0;
    }

    messageCounts.messageCount[groupId][userId] += 1;
    saveMessageCounts(messageCounts);
}

module.exports = {
    name: 'topmembers',
    aliases: ['top', 'leaderboard'],
    category: 'group',
    description: 'Show top members by message count',
    usage: '.topmembers',
    execute: async (sock, message, args, context) => {
        const { chatId, reply, react } = context;

        if (!chatId.endsWith('@g.us')) {
            return await reply('This command is only available in group chats.');
        }

        try {
            await react('🏆');

            const messageCounts = loadMessageCounts();
            
            // Handle both old and new structure
            const groupCounts = messageCounts.messageCount ? 
                messageCounts.messageCount[chatId] || {} : 
                messageCounts[chatId] || {};

            const sortedMembers = Object.entries(groupCounts)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5);

            if (sortedMembers.length === 0) {
                return await reply('No message activity recorded yet.');
            }

            let responseMessage = '🏆 **Top Members Based on Message Count:**\n\n';
            sortedMembers.forEach(([userId, count], index) => {
                const emoji = index === 0 ? '👑' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🏅';
                responseMessage += `${emoji} ${index + 1}. @${userId.split('@')[0]} - ${count} messages\n`;
            });

            await sock.sendMessage(chatId, { 
                text: responseMessage, 
                mentions: sortedMembers.map(([userId]) => userId),
                ...context.channelInfo
            });
        } catch (error) {
            console.error('Error in topmembers:', error);
            await reply('Failed to get top members list.');
        }
    },
    incrementMessageCount,
    
    // Add this function to sync isPublic when mode changes
    syncMode: () => {
        try {
            const messageCounts = loadMessageCounts();
            saveMessageCounts(messageCounts); // This will sync isPublic automatically
            console.log('✅ Synced messageCount.json with database mode');
        } catch (error) {
            console.error('❌ Error syncing messageCount mode:', error);
        }
    }
};