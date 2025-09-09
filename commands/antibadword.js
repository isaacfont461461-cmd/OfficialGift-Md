const { antibadwordSettings } = require('../lib/case');

module.exports = {

    name: 'antibadword',

    aliases: ['abw', 'badword'],

    category: 'SETTINGS MENU',

    description: 'Enable/disable antibadword in group',

    usage: 'antibadword on/off',

    

    async execute(sock, message, args, context) {

        try {

            const { chatId, isGroup, isSenderAdmin, isBotAdmin, senderIsSudo, reply } = context;

            

            // Only work in groups

            if (!isGroup) {

                return await reply('This command only works in groups!');

            }

            

            // Check admin permissions

            if (!isSenderAdmin && !senderIsSudo) {

                return await reply('Only group admins can use this command!');

            }

            

            if (!isBotAdmin) {

                return await reply('Please make the bot an admin first!');

            }

            

            const action = args[0]?.toLowerCase();

            

            if (!action || !['on', 'off', 'enable', 'disable'].includes(action)) {

                const currentStatus = antibadwordSettings.isEnabled(chatId) ? 'ON' : 'OFF';

                return await reply(`Current antibadword status: ${currentStatus}\n\nUsage: antibadword on/off`);

            }

            

            if (['on', 'enable'].includes(action)) {

                antibadwordSettings.enable(chatId);

                await reply('Antibadword has been ENABLED in this group!\n\nBad words will be automatically deleted.');

            } else {

                antibadwordSettings.disable(chatId);

                await reply('Antibadword has been DISABLED in this group.\n\nBad words are now allowed.');

            }

            

        } catch (error) {

            console.error('Error in antibadword command:', error);

            await context.reply('An error occurred while updating antibadword settings.');

        }

    }

};