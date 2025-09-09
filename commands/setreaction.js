const db = require('../lib/database');

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