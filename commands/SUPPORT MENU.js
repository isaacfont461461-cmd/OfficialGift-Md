// You'll need to add this helper list to your bot or create a separate file for it

const helpersList = [

    { flag: "🇳🇬", country: "Nigeria", name: "Gift Support", number: "wa.me/2348085046874" },

    { flag: "✉️", country: "Kenya", name: "Gift MD", Gmail: "isaacodofin12345@mail.com" },

    { flag: "🇳🇬", country: "nigey", name: "Gift USA", number: "wa.me/2348072642047" },

    // Add more helpers as needed

];

// Telegram function (optional - you can remove if you don't use Telegram)

const sendToTelegram = async (message) => {

    try {

        // Add your Telegram bot integration here if needed

        // For now, just log to console

        console.log("Feedback received:", message);

        return true;

    } catch (error) {

        console.error("Error sending to Telegram:", error);

        return false;

    }

};

module.exports = [

    {

        name: 'feedback',

        category: 'SUPPORT',

        execute: async (sock, message, args, context) => {

            if (!context.sender) return context.reply('❌ This command is only available for the owner!');

            

            const text = args.slice(1).join(" ");

            if (!text) return context.reply(`Example: ${global.prefix}feedback Hey dev, this bot is very awesome🔥`);

            // Get push name from message

            const pushName = message.pushName || context.sender.split('@')[0];

            const bugReportMsg = `

USER FEEDBACK

User: @${context.sender.split("@")[0]}

Feedback: ${text}

Version: ${global.version || "2.0.0"}

            `;

            const confirmationMsg = `

Hi ${pushName},

Thanks for sharing your feedback with us. Your feedback helps us improve Gift MD Bot!

✅ Feedback submitted successfully

📝 Message: ${text}

⚡ Our team will review your feedback

Thank you for using GIFT MD Bot! 🤖`;

            // Send to Telegram (if you have Telegram integration)

            await sendToTelegram(global.dev);

            

            await context.reply(context.chatId, { 

                text: confirmationMsg, 

                mentions: [context.sender] 

            }, { quoted: message });

        }

    },

    {

        name: "helpers",

        aliases: ["support"],

        category: 'SUPPORT',

        execute: async (sock, message, args, context) => {

            const search = args.slice(1).join(" ").toLowerCase();

            const filtered = helpersList.filter(helper =>

                !search || helper.country.toLowerCase().includes(search)

            );

            if (!filtered.length) {

                return context.reply(`❌ No helper found for "${search}".\nTry using: ${global.prefix}helpers to see all.`);

            }

            filtered.sort((a, b) => a.country.localeCompare(b.country));

            let text = `🌍 Gift Bot Verified Helpers\n\n`;

            filtered.forEach((helper, index) => {

                text += `${index + 1}. ${helper.flag} ${helper.country}\n   • ${helper.name}: ${helper.number}\n\n`;

            });

            text += `✅ Gift Bot Team\n`;

            text += `📢 Need general help? Contact our support:\n👉 ${global.devChannel}\n`;

            text += `⚠️ Charges may apply depending on the service provided.`;

            context.reply(text);

        }

    },

    {

        name: 'bugreport',

        aliases: ['reportbug', 'bug'],

        category: 'SUPPORT',

        execute: async (sock, message, args, context) => {

            const text = args.slice(1).join(" ");

            if (!text) return context.reply(`Example: ${global.prefix}bugreport The bot crashes when I use .play command`);

            const pushName = message.pushName || context.sender.split('@')[0];

            const bugReportMsg = `

🐛 BUG REPORT

User: @${context.sender.split("@")[0]}

Name: ${pushName}

Chat: ${context.isGroup ? 'Group' : 'Private'}

Bug Description: ${text}

Version: ${global.version || "2.0.0"}

Time: ${new Date().toLocaleString()}

            `;

            const confirmationMsg = `

🐛 Bug Report Submitted

Hi ${pushName},

Thank you for reporting this bug! Your report helps us improve Gift Bot.

📝 Report Details:

• Description: ${text}

• Status: Under Review

• Report ID: #${Date.now().toString().slice(-6)}

Our development team will investigate this issue. If you have more details or screenshots, please contact our support team.

✅ Thank you for helping us make Gift MD better!`;

            // Send to Telegram (if you have Telegram integration)

            await sendToTelegram(global.dev);

            

            await context.reply(context.chatId, { 

                text: confirmationMsg, 

                mentions: [context.sender] 

            }, { quoted: message });

        }

    },

    {

        name: 'suggestion',

        aliases: ['suggest'],

        category: 'SUPPORT',

        execute: async (sock, message, args, context) => {

            const text = args.slice(1).join(" ");

            if (!text) return context.reply(`Example: ${global.prefix}suggestion Add a music download feature`);

            const pushName = message.pushName || context.sender.split('@')[0];

            const suggestionMsg = `

💡 FEATURE SUGGESTION

User: @${context.sender.split("@")[0]}

Name: ${pushName}

Suggestion: ${text}

Version: ${global.version || "2.0.0"}

*Time:* ${new Date().toLocaleString()}

            `;

            const confirmationMsg = `

💡 Suggestion Submitted

Hi ${pushName},

Thank you for your suggestion! We appreciate users who help us improve Gift Bot.

📝 Suggestion Details:

• Feature: ${text}

• Status: Under Consideration

• Suggestion ID: #${Date.now().toString().slice(-6)}

Our team will review your suggestion and consider it for future updates.

✅ Thank you for contributing to GIFT MD development!`;

            // Send to Telegram (if you have Telegram integration)

            await sendToTelegram(global.dev);

            

            await context.replyPlain({ 

                text: confirmationMsg, 

                mentions: [context.sender] 

            }, { quoted: message });

        }

    },

    {

        name: 'contact',

        aliases: ['contactdev', 'developer'],

        category: 'SUPPORT',

        execute: async (sock, message, args, context) => {

            const contactMsg = `

📞 Contact Gift MD Developer

👨‍💻 Developer: ${global.author || "ISAAC-FAVOUR"}

📱 WhatsApp: wa.me/${global.dev || "2348085046874"}

🔗 GitHub: ${global.devgit}

📺 YouTube: ${global.devyt || "@officialGift-md"}

🔗 Official Channel:

${global.devchannel || "https://whatsapp.com/channel/0029Vb6iOEFDZ4LccUD4uH36"}

⚠️ Contact Guidelines:

• Be respectful and clear in your messages

• For bug reports, use ${global.prefix}bugreport

• For suggestions, use ${global.prefix}suggestion

• For general help, use ${global.prefix}helpers

🤖 Bot Version: ${global.version || "2.0.0"}

🔧 Support: 24/7 Community Support Available`;

            context.reply(contactMsg);

        }

    }

];