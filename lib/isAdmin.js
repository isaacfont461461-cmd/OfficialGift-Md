async function isAdmin(sock, chatId, senderId) {
    try {
        // Handle channels differently
        if (chatId.endsWith('@newsletter')) {
            // For channels, only channel admins can perform admin actions
            // We'll assume bot has permissions if it can read the channel
            return { 
                isSenderAdmin: false,  // Regular users can't be channel admins via bot
                isBotAdmin: true      // Assume bot has permissions in channels
            };
        }
        
        // Original group logic
        const groupMetadata = await sock.groupMetadata(chatId);
        
        const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net';
        
        const participant = groupMetadata.participants.find(p => 
            p.id === senderId || 
            p.id === senderId.replace('@s.whatsapp.net', '@lid') ||
            p.id === senderId.replace('@lid', '@s.whatsapp.net')
        );
        
        const bot = groupMetadata.participants.find(p => 
            p.id === botId || 
            p.id === botId.replace('@s.whatsapp.net', '@lid')
        );
        
        const isBotAdmin = bot && (bot.admin === 'admin' || bot.admin === 'superadmin');
        const isSenderAdmin = participant && (participant.admin === 'admin' || participant.admin === 'superadmin');

        if (!bot) {
            return { isSenderAdmin, isBotAdmin: true };
        }

        return { isSenderAdmin, isBotAdmin };
    } catch (error) {
        console.error('Error in isAdmin:', error);
        return { isSenderAdmin: false, isBotAdmin: false };
    }
}

module.exports = isAdmin;
