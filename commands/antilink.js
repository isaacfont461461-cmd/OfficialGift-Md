const { antilinkSettings } = require('../lib/case');

const { requireAdmin } = require('../lib/adminCheck');

const db = require('../lib/database');

module.exports = {

    name: 'antilink',

    aliases: ['al'],

    category: 'SETTINGS MENU',

    description: 'Manage antilink settings with advanced options',

    usage: '.antilink [on/off/kick/warn/delete/set/status]',

    

    async execute(sock, message, args, context) {

        try {

            const { chatId, isGroup, reply } = context;

            

            // Only work in groups

            if (!isGroup) {

                return await reply('❌ This command only works in groups!');

            }

            

            // Check admin permissions using your adminCheck

            if (!(await requireAdmin(context))) return;

            

            const action = args[1]?.toLowerCase();

            

            // Default settings structure

            const defaultSettings = {

                enabled: false,

                action: 'delete', // 'delete', 'warn', 'kick'

                warningLimit: 3,

                warnings: {},

                customMessage: '❌ Links are not allowed in this group!',

                allowedLinks: []

            };

            

            // Get current settings from database

            const settings = db.getCommandData('antilink', chatId, defaultSettings);

            

            // Ensure allowedLinks is an array

            if (!settings.allowedLinks || !Array.isArray(settings.allowedLinks)) {

                settings.allowedLinks = [...defaultSettings.allowedLinks];

            }

            

            switch (action) {

                case 'on':

                    settings.enabled = true;

                    settings.action = 'delete'; // Default to delete

                    antilinkSettings.enable(chatId);

                    db.updateCommandData('antilink', chatId, settings);

                    return await reply('✅ Antilink has been ENABLED!\n\n🗑️ Action: Delete messages\n❌ Links will be automatically deleted.');

                    

                case 'off':

                    settings.enabled = false;

                    antilinkSettings.disable(chatId);

                    db.updateCommandData('antilink', chatId, settings);

                    return await reply('❌ Antilink has been DISABLED!\n\n✅ Links are now allowed in this group.');

                    

                case 'kick':

                    settings.action = 'kick';

                    settings.enabled = true;

                    antilinkSettings.enable(chatId);

                    db.updateCommandData('antilink', chatId, settings);

                    return await reply('⚡ Antilink action set to: IMMEDIATE KICK\n\n🚫 Users will be kicked for posting links!');

                    

                case 'warn':

                    const limit = parseInt(args[2]) || 3;

                    settings.action = 'warn';

                    settings.warningLimit = limit;

                    settings.enabled = true;

                    antilinkSettings.enable(chatId);

                    db.updateCommandData('antilink', chatId, settings);

                    return await reply(`⚠️ Antilink action set to: WARNING SYSTEM\n\n📊 Warning limit: ${limit} warnings before kick`);

                    

                case 'delete':

                    settings.action = 'delete';

                    settings.enabled = true;

                    antilinkSettings.enable(chatId);

                    db.updateCommandData('antilink', chatId, settings);

                    return await reply('🗑️ Antilink action set to: DELETE ONLY\n\n❌ Links will be deleted without penalties');

                    

                case 'set':

                    const subAction = args[2]?.toLowerCase();

                    

                    if (subAction === 'message') {

                        const customMessage = args.slice(3).join(' ');

                        if (!customMessage) {

                            return await reply('❌ Please provide a custom message!\n\n📝 Example: `.antilink set message No links allowed here!`');

                        }

                        settings.customMessage = customMessage;

                        db.updateCommandData('antilink', chatId, settings);

                        return await reply('✅ Custom antilink message updated!\n\n💬 New message: ' + customMessage);

                    }

                    

                    if (subAction === 'allow') {

                        const linkToAllow = args[3];

                        if (!linkToAllow) {

                            return await reply('❌ Please provide a link/domain to allow!\n\n📝 Example: `.antilink set allow youtube.com`');

                        }

                        if (!settings.allowedLinks) settings.allowedLinks = [];

                        settings.allowedLinks.push(linkToAllow);

                        db.updateCommandData('antilink', chatId, settings);

                        return await reply(`✅ Added "${linkToAllow}" to allowed links!\n\n🔗 This domain will not trigger antilink.`);

                    }

                    

                    return await reply('❌ Invalid set option!\n\nAvailable options:\n• `set message <text>` - Custom warning message\n• `set allow <link>` - Allow specific domain');

                    

                case 'status':

                case 'info':

                    const statusEmoji = settings.enabled ? '✅' : '❌';

                    const actionEmoji = settings.action === 'kick' ? '⚡' : settings.action === 'warn' ? '⚠️' : '🗑️';

                    

                    let statusText = `📊 **Antilink Status**\n\n`;

                    statusText += `🔸 **Status:** ${statusEmoji} ${settings.enabled ? 'Enabled' : 'Disabled'}\n`;

                    statusText += `🔸 **Action:** ${actionEmoji} ${settings.action.toUpperCase()}\n`;

                    

                    if (settings.action === 'warn') {

                        statusText += `🔸 **Warning Limit:** ${settings.warningLimit}\n`;

                    }

                    

                    statusText += `🔸 **Custom Message:** ${settings.customMessage}\n`;

                    statusText += `🔸 **Allowed Links:** ${settings.allowedLinks?.length || 0}\n`;

                    

                    if (settings.allowedLinks?.length > 0) {

                        statusText += `\n📝 **Allowed Domains:**\n`;

                        settings.allowedLinks.forEach(link => {

                            statusText += `• ${link}\n`;

                        });

                    }

                    

                    return await reply(statusText);

                    

                default:

                    const helpText = `📝 **Antilink Commands**\n\n` +

                        `🔹 \`.antilink on\` - Enable basic antilink\n` +

                        `🔹 \`.antilink off\` - Disable antilink\n` +

                        `🔹 \`.antilink kick\` - Kick users for links\n` +

                        `🔹 \`.antilink warn [limit]\` - Warning system\n` +

                        `🔹 \`.antilink delete\` - Only delete messages\n` +

                        `🔹 \`.antilink set message <text>\` - Custom message\n` +

                        `🔹 \`.antilink set allow <domain>\` - Allow domain\n` +

                        `🔹 \`.antilink status\` - Show current settings\n\n` +

                        `📌 **Examples:**\n` +

                        `• \`.antilink warn 5\` - 5 warnings before kick\n` +

                        `• \`.antilink set allow youtube.com\` - Allow YouTube`;

                    

                    return await reply(helpText);

            }

            

        } catch (error) {

            console.error('Error in antilink command:', error);

            await reply('❌ An error occurred while updating antilink settings.');

        }

    }

};