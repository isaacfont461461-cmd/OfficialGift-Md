const { loadDatabase, saveDatabase } = require('../lib/database');

// Function to get all commands and organize by category - UPDATED FOR NEW SYSTEM

const getCommandsList = () => {

    // Use the new file-based categories from commandHandler

    const categories = global.fileCategories || {};

    const sortedCategories = {};

    

    // Sort category names alphabetically

    Object.keys(categories).sort().forEach(key => {

        // Sort commands within each category alphabetically

        sortedCategories[key] = categories[key].sort();

    });

    

    return sortedCategories;

};

// Different menu styles

const menuStyles = {

    1: (botInfo, categories, totalCommands) => {

        let menu = `╭─「 ${botInfo.name} 」\n`;

        menu += `│◦ Owner: ${botInfo.owner}\n`;

        menu += `│◦ Version: ${botInfo.version}\n`;

        menu += `│◦ Prefix: ${botInfo.prefix}\n`;

        menu += `│◦ Commands: ${totalCommands}\n`;

        menu += `│◦ Runtime: ${botInfo.runtime}\n`;

        menu += `╰─────────────────\n`;

        for (let [category, cmds] of Object.entries(categories)) {

            menu += `╭─「 ${category} 」\n`; // Already uppercase from commandHandler

            cmds.forEach(cmd => {

                menu += `│◦ ${botInfo.prefix}${cmd}\n`;

            });

            menu += `╰─────────────────\n`;

        }

        

        return menu;

    },

    

    2: (botInfo, categories, totalCommands) => {

        let menu = `┏▣ ◈ ${botInfo.name} ◈\n`;

        //menu += `│🤖 Bot Info:\n`;

        menu += `│➽ Owner: ${botInfo.owner}\n`;

        menu += `│➽ Version: ${botInfo.version}\n`;

        menu += `│➽ Prefix: ${botInfo.prefix}\n`;

        menu += `│➽ Total Commands: ${totalCommands}\n`;

        menu += `│➽ Runtime: ${botInfo.runtime}\n`;

        menu += `┗▣\n`;

        for (let [category, cmds] of Object.entries(categories)) {

            menu += `┏▣ ◈${category}◈\n`;

            cmds.forEach((cmd, index) => {

                const prefix = index === cmds.length - 1 ? '┗▣' : '│➽';

                menu += `${prefix} ${botInfo.prefix}${cmd}\n`;

            });

            menu += `\n`;

        }

        

        return menu;

    },

    3: (botInfo, categories, totalCommands) => {

        let menu = `═══════════════════\n`;

        menu += `║               ${botInfo.name}              ║\n`;

        menu += `═══════════════════\n\n`;
        menu += `╔════════════════▣\n`;

        menu += `┊✺┌──❐BOT-INFO❐ ──⊷\n`;

        menu += `╠✤│•Owner: ${botInfo.owner}\n`;

        menu += `╠✤│•Version: ${botInfo.version}\n`;

        menu += `╠✤│•Prefix: ${botInfo.prefix}\n`;

        menu += `╠✤│•Commands: ${totalCommands}\n`;

        menu += `╠✤│•Runtime: ${botInfo.runtime}\n`;
menu += `┊✺└────••••────⊷\n`;
menu+=`╚════════════════▣\n\n`;

        for (let [category, cmds] of Object.entries(categories)) {

            menu += `┊✺┌──❐${category}❐ ──⊷\n`;
            
            const cmdList = cmds.map(cmd => `╠✤│${botInfo.prefix}${cmd}`).join('\n');          
            menu += `${cmdList}\n\n`;
        }

        

        return menu;

    },

    

    4: (botInfo, categories, totalCommands) => {

        let menu = `╔══════════════════╗\n`;

        menu += `║     🤖 ${botInfo.name}                   ║\n`;

        menu += `╚══════════════════╝\n\n`;

        menu += `┌─ 📋 Bot Information\n`;

        menu += `├─ 👤 Owner: ${botInfo.owner}\n`;

        menu += `├─ 🔖 Version: ${botInfo.version}\n`;

        menu += `├─ ⚡ Prefix: ${botInfo.prefix}\n`;

        menu += `├─ 📊 Commands: ${totalCommands}\n`;

        menu += `└─ ⏱️ Runtime: ${botInfo.runtime}\n\n`;

        for (let [category, cmds] of Object.entries(categories)) {

            menu += `┌─ ${getEmoji(category)} ${category}\n`;

            cmds.forEach((cmd, index) => {

                const prefix = index === cmds.length - 1 ? '└─' : '├─';

                menu += `${prefix} ${botInfo.prefix}${cmd}\n`;

            });

            menu += `\n`;

        }

        

        return menu;

    },

    

    5: (botInfo, categories, totalCommands) => {

        let menu = `┏▣════════════════▣╗\n`;

        menu += `║         💫 ${botInfo.name} 💫        ║\n`;

        menu += `┗▣════════════════▣╝\n`;

        menu += `▣🔹 Owner: ${botInfo.owner}\n`;

        menu += `▣🔹 Version: ${botInfo.version}\n`;

        menu += `▣🔹 Prefix: ${botInfo.prefix}\n`;

        menu += `▣🔹 Total Commands: ${totalCommands}\n`;

        menu += `▣🔹 Runtime: ${botInfo.runtime}\n\n`;

        for (let [category, cmds] of Object.entries(categories)) {

            menu += `┏▣════════════════▣╗\n`;

            menu += `║         💫 ${category} 💫        \n`;

            menu += `┗▣════════════════▣╝\n`;

            const rows = [];

            for (let i = 0; i < cmds.length; i++) {

                const row = `▣${botInfo.prefix}${cmds[i]}`;

                rows.push(row);

            }

            menu += rows.join('\n') + '\n\n';

        }

        return menu;

    }

};

// Function to get emoji for categories

const getEmoji = (category) => {

    const emojis = {

        'admin menu': '👑',

        'moderation menu': '🛡️',

        'utility menu': '🔧',

        'fun menu': '🎉',

        'music menu': '🎵',

        'download menu': '📥',

        'downloader menu': '📥',

        'search menu': '🔍',

        'settings menu': '⚙️',

        'support menu': '🆘',

        'owner menu': '👨‍💻',

        'group menu': '👥',

        'information menu': 'ℹ️',

        'ai menu': '🤖',

        'anime menu': '🎌',

        'animu menu': '🎌'

    };

    return emojis[category.toLowerCase()] || '📂';

};

// Function to get bot runtime

const getBotRuntime = () => {

    const uptime = process.uptime() * 1000;

    const days = Math.floor(uptime / (1000 * 60 * 60 * 24));

    const hours = Math.floor((uptime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    const minutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));

    const seconds = Math.floor((uptime % (1000 * 60)) / 1000);

    

    return `${days}d ${hours}h ${minutes}m ${seconds}s`;

};

module.exports = [

    {

        name: 'menu',

        aliases: ['commands'],

        execute: async (sock, message, args, context) => {

            try {

                const db = loadDatabase();

                const menuStyle = db.settings.menustyle || "1";

                const menuImage = db.settings.menuimage || "";

                const menuAudio = db.settings.menuaudio || "off";

                

                const categories = getCommandsList();

                const totalCommands = Object.values(categories).reduce((total, cmds) => total + cmds.length, 0);

                

                const botInfo = {

                    name: global.botName || "KNIGHT BOT",

                    owner: global.botOwner || "ISAAC-FAVOUR",

                    version: global.version || "2.0.0",

                    prefix: global.prefix || ".",

                    runtime: getBotRuntime()

                };

                

                const menuText = menuStyles[menuStyle](botInfo, categories, totalCommands);

                

                // Style 2 should never use image

                if (menuStyle === "2") {

                    await context.reply(menuText);

                    return;

                }

                

                if (menuImage && menuImage.trim() !== "") {

                    try {

                        await context.reply({

                            image: { url: menuImage },

                            caption: menuText,

                            ...context.channelInfo

                        });

                    } catch (imageError) {

                        await context.reply(menuText + "\n⚠️ Menu image failed to load");

                    }

                } else {

                    await context.reply(menuText);

                }

                // Send audio if enabled

                if (menuAudio === "on") {

                    try {

                        await context.replyPlain({

                            audio: { url: "https://files.catbox.moe/p9c9kk.mp3" },

                            mimetype: 'audio/mp4',

                            ptt: false

                        }, { quoted: message });

                    } catch (err) {

                        console.error("❌ Failed to send menu audio:", err);

                    }

                }

            } catch (error) {

                console.error('Error in menu command:', error);

                await context.reply('❌ Error generating menu. Please try again.');

            }

        }

    },

    

    {

        name: 'setmenu',

        aliases: ['menustyle'],

        execute: async (sock, message, args, context) => {

            if (!context.senderIsSudo) return context.reply('❌ This command is only available for the owner!');

            

            const styleNumber = args[1];

            if (!styleNumber || isNaN(styleNumber) || styleNumber < 1 || styleNumber > 5) {

                return context.reply(`❌ Invalid menu style. Please choose a number between 1-5.\n\nExample: ${global.prefix}setmenu 3\n\nAvailable styles: 1, 2, 3, 4, 5`);

            }

            

            const db = loadDatabase();

            db.settings.menustyle = styleNumber;

            saveDatabase(db);

            

            await context.reply(`✅ Menu style set to ${styleNumber} successfully!\n\nUse ${global.prefix}menu to see the new style.`);

        }

    },

    {
    name: 'setmenuimg',
    aliases: ['menuimage', 'setmenuimage'],
    execute: async (sock, message, args, context) => {
        if (!context.senderIsSudo) return context.reply('❌ This command is only available for the owner!');
        
        const imageUrl = args.slice(1).join(" ");
        if (!imageUrl) {
            return context.replyPlain(
                `❌ Please provide an image URL.\n\n` +
                `Example: ${global.prefix}setmenuimg https://files.catbox.moe/example.jpg\n\n` +
                `Or use "${global.prefix}setmenuimg off" to disable menu image.\n\n` +
                `📝 *Recommended hosts:*\n` +
                `• files.catbox.moe\n` +
                `• telegra.ph\n` +
                `• imgur.com (direct links)`
            );
        }
        
        const db = loadDatabase();
        
        if (imageUrl.toLowerCase() === 'off') {
            db.settings.menuimage = "";
            saveDatabase(db);
            await context.reply('✅ Menu image disabled successfully!');
            return;
        }

        // Enhanced URL validation
        if (!imageUrl.startsWith('http')) {
            return context.reply('❌ Please provide a valid image URL starting with http or https.');
        }

        // Check for problematic hosts
        const problematicHosts = ['i.ibb.co', 'postimg.cc', 'imgbox.com'];
        const urlHost = new URL(imageUrl).hostname;
        
        if (problematicHosts.includes(urlHost)) {
            await context.replyPlain(
                `⚠️ Warning: ${urlHost} may not work reliably with WhatsApp bots.\n\n` +
                `Recommended alternatives:\n` +
                `• Upload to files.catbox.moe\n` +
                `• Use telegra.ph\n` +
                `• Try imgur.com direct links\n\n` +
                `Proceeding anyway...`
            );
        }

        // Test the URL before saving
        try {
            await context.replyPlain('🔄 Testing image URL...');
            
            const fetch = require('node-fetch');
            const response = await fetch(imageUrl, {
                method: 'HEAD',
                timeout: 10000,
                headers: {
                    'User-Agent': 'WhatsApp-Bot/1.0'
                }
            });
            
            if (!response.ok) {
                return context.replyPlain(`❌ Image URL is not accessible. Status: ${response.status}\n\nPlease try a different URL.`);
            }
            
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.startsWith('image/')) {
                return context.replyPlain(`❌ URL does not point to a valid image.\n\nContent-Type: ${contentType || 'unknown'}`);
            }
            
        } catch (error) {
            return context.reply(
                `❌ Failed to verify image URL.\n\n` +
                `Error: ${error.message}\n\n` +
                `Please check the URL and try again.`
            );
        }

        db.settings.menuimage = imageUrl;
        saveDatabase(db);
        
        await context.reply(
            `✅ Menu image set successfully!\n\n` +
            `URL: ${imageUrl}\n\n` +
            `Use ${global.prefix}menu to see the new image.`
        );
    }
},

   
      {

    name: 'maudio',

    aliases: ['menuvoice'],

    category: 'SETTINGS MENU',

    execute: async (sock, message, args, context) => {

        if (!context.senderIsSudo) return context.reply('❌ Only the owner can use this!');

        const db = loadDatabase();

        const choice = args[1]?.toLowerCase();

        if (!choice || !['on','off'].includes(choice)) {

            return context.reply(`❌ Invalid usage.\n\nExample:\n${global.prefix}menuaudio on\n${global.prefix}menuaudio off`);

        }

        db.settings.menuaudio = choice;

        saveDatabase(db);

        await context.reply(`✅ Menu audio has been turned ${choice.toUpperCase()}!`);

    }

},
    {

    name: 'menuinfo',

    aliases: ['menudetails'],

    description: 'Show menu settings and available styles',

    execute: async (sock, message, args, context) => {

        try {

            const db = loadDatabase() || {};

            // ✅ Handle missing db.settings safely

            const settings = db.settings || {};

            const currentStyle = settings.menustyle || "1";

            const currentImage = settings.menuimage || "Not set";

            // ✅ Use new file-based categories

            const categories = global.fileCategories || {};

            const totalCommands = Object.values(categories).reduce(

                (total, cmds) => total + cmds.length,

                0

            );

            let info = `📋 *Menu Configuration*\n\n`;

            info += `🎨 Current Style: ${currentStyle}\n`;

            info += `🖼️ Image URL: ${typeof currentImage === "string" && currentImage.length > 50 

                ? currentImage.substring(0, 50) + "..." 

                : currentImage}\n`;

            info += `📊 Total Commands: ${totalCommands}\n`;

            info += `📂 Folders: ${Object.keys(categories).length}\n\n`;

            info += `📑 *Available Menu Styles:*\n`;

            info += `1️⃣ Classic Box Style\n`;

            info += `2️⃣ Professional Tree Style\n`;

            info += `3️⃣ Emoji Decorated Style\n`;

            info += `4️⃣ Inline Command Style\n`;

            info += `5️⃣ Elegant Border Style\n`;

            info += `6️⃣ Grid Layout Style\n\n`;

            info += `⚙️ *Commands:*\n`;

            info += `• ${global.prefix}setmenu <1-6> - Change menu style\n`;

            info += `• ${global.prefix}setmenuimg <url> - Set menu image\n`;

            info += `• ${global.prefix}menu - Show the menu`;

            await context.reply(info);

        } catch (err) {

            console.error("❌ Error in menuinfo:", err);

            await context.reply("❌ Failed to load menu info. (Check logs for details)");

        }

    }

},
    {

    name: 'welcome',

    aliases: ['wel'],

    category: 'SETTINGS MENU',

    description: 'Manage welcome messages for new members',

    usage: '.welcome on/off/set <message>',

    execute: async (sock, message, args, context) => {

        const { reply, react, chatId, isGroup, isSenderAdmin, isBotAdmin } = context;

        if (!isGroup) {

            return await reply('❌ This command only works in groups!');

        }

        if (!isBotAdmin) {

            return await reply('❌ Please make the bot an admin to use this command.');

        }

        if (!isSenderAdmin && !message.key.fromMe && !context.senderIsSudo) {

            return await reply('❌ Only group admins can use this command!');

        }

        // Import your existing functions

        const { getWelcome, setWelcome, removeWelcome, isWelcomeEnabled } = require('../lib/database');

        // If no arguments, show current settings

        if (args.length < 2) { // Changed from < 1 to < 2 because args[0] is "welcome"

            const isEnabled = isWelcomeEnabled(chatId);

            const currentMessage = getWelcome(chatId);

            const status = isEnabled ? '✅ Enabled' : '❌ Disabled';

            const customMsg = currentMessage ? `\n\n📝 Current Message:\n${currentMessage}` : '';

            

            return await reply(

                `🎉 Welcome Message Setup\n\n` +

                `Status: ${status}${customMsg}\n\n` +

                `Use the following commands:\n\n` +

                `✅ .welcome on — Enable welcome messages\n` +

                `🛠️ .welcome set Your custom message — Set a custom welcome message\n` +

                `🚫 .welcome off — Disable welcome messages\n\n` +

                `Available Variables:\n` +

                `• {user} - Mentions the new member\n` +

                `• {group} - Shows group name\n` +

                `• {description} - Shows group description`

            );

        }

        const action = args[1].toLowerCase(); // Changed from args[0] to args[1]

        if (action === 'on') {

            await react('✅');

            const defaultMessage = '🎉 Welcome {user} to {group}!\n\nEnjoy your stay and follow the group rules.';

            setWelcome(chatId, defaultMessage);

            return await reply('🎉 Welcome messages enabled! New members will receive a greeting.');

        }

        if (action === 'off') {

            await react('❌');

            removeWelcome(chatId);

            return await reply('🚫 Welcome messages disabled.');

        }

        if (action === 'set') {

            if (args.length < 3) { // Need at least "welcome set message"

                return await reply('❌ Please provide a welcome message.\n\nExample: .welcome set Welcome {user} to {group}!');

            }

            await react('📝');

            const customMessage = args.slice(2).join(' '); // Start from args[2]

            setWelcome(chatId, customMessage);

            return await reply(`✅ Custom welcome message set!\n\n📝 Message: ${customMessage}`);

        }

        return await reply('❌ Invalid option. Use: on, off, or set <message>');

    }

},
{

    name: 'goodbye',

    aliases: ['bye'],

    category: 'SETTINGS MENU',

    description: 'Manage goodbye messages for leaving members',

    usage: '.goodbye on/off/set <message>',

    execute: async (sock, message, args, context) => {

        const { reply, react, chatId, isGroup, isSenderAdmin, isBotAdmin } = context;

        if (!isGroup) {

            return await reply('❌ This command only works in groups!');

        }

        if (!isBotAdmin) {

            return await reply('❌ Please make the bot an admin to use this command.');

        }

        if (!isSenderAdmin && !message.key.fromMe && !context.senderIsSudo) {

            return await reply('❌ Only group admins can use this command!');

        }

        // Import your existing functions

        const { getGoodbye, setGoodbye, removeGoodbye, isGoodbyeEnabled } = require('../lib/database');

        if (args.length < 2) {

            const isEnabled = isGoodbyeEnabled(chatId);

            const currentMessage = getGoodbye(chatId);

            const status = isEnabled ? '✅ Enabled' : '❌ Disabled';

            const customMsg = currentMessage ? `\n\n📝 Current Message:\n${currentMessage}` : '';

            

            return await reply(

                `👋 Goodbye Message Setup\n\n` +

                `Status: ${status}${customMsg}\n\n` +

                `Use the following commands:\n\n` +

                `✅ .goodbye on — Enable goodbye messages\n` +

                `🛠️ .goodbye set Your custom message — Set a custom goodbye message\n` +

                `🚫 .goodbye off — Disable goodbye messages\n\n` +

                `Available Variables:\n` +

                `• {user} - Mentions the leaving member\n` +

                `• {group} - Shows group name\n` +

                `• {description} - Shows group description\n` +

                `• {count} - Total members in group`

            );

        }

        const action = args[1].toLowerCase();

        if (action === 'on') {

            await react('✅');

            const defaultMessage = 'Hey {user}👋\n\nGoodbye from {group}\nWe now have {count} members remaining in this group. 🙂\nThanks for being part of our community:\n{description}\nᴘᴏᴡᴇʀᴇᴅ ʙʏ Isaactech.';

            setGoodbye(chatId, defaultMessage);

            return await reply('👋 Goodbye messages enabled! Leaving members will receive a farewell.');

        }

        if (action === 'off') {

            await react('❌');

            removeGoodbye(chatId);

            return await reply('🚫 Goodbye messages disabled.');

        }

        if (action === 'set') {

            if (args.length < 3) {

                return await reply('❌ Please provide a goodbye message.\n\nExample: .goodbye set Goodbye {user}, thanks for being part of {group}!');

            }

            await react('📝');

            const customMessage = args.slice(2).join(' ');

            setGoodbye(chatId, customMessage);

            return await reply(`✅ Custom goodbye message set!\n\n📝 Message: ${customMessage}`);

        }

        return await reply('❌ Invalid option. Use: on, off, or set <message>');

    }

}  

];