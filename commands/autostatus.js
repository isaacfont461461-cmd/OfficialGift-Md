const { autostatusSettings } = require('../lib/case');

module.exports = {
    name: 'autostatus',
    aliases: ['astatus', 'viewstatus'],
    category: 'owner',
    description: 'Enable/disable auto view status',
    usage: '.autostatus [on/off]',
    
    async execute(sock, message, args, context) {
        try {
            const { senderIsSudo, reply } = context;
            
            // Only sudo/owner can use this
            if (!senderIsSudo) {
                return await reply('❌ This command is only for bot owners!');
            }
            
            // If no args, show status
            if (!args || args.length === 1) {
                const currentStatus = autostatusSettings.isEnabled() ? 'enabled ✅' : 'disabled ❌';
                return await reply(
                    `👁️ Auto Status View\n\nCurrent status: ${currentStatus}\n\nUsage:\n.autostatus on - Enable auto status view\n.autostatus off - Disable auto status view`
                );
            }
            
            const action = args[1]?.toLowerCase(); // Use args[1] since args[0] is the command name
            
            if (['on', 'enable'].includes(action)) {
                autostatusSettings.enable();
                await reply('✅ Auto status view has been ENABLED!\n\n👁️ Bot will automatically view all status updates.');
            } else if (['off', 'disable'].includes(action)) {
                autostatusSettings.disable();
                await reply('❌ Auto status view has been DISABLED!\n\n👁️ Bot will not view status updates automatically.');
            } else {
                await reply('❌ Invalid option!\n\nUsage:\n.autostatus on - Enable auto status view\n.autostatus off - Disable auto status view');
            }
            
        } catch (error) {
            console.error('Error in autostatus command:', error);
            await reply('❌ An error occurred while updating autostatus settings.');
        }
    }
};