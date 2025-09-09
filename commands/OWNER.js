const fs = require('fs');
const db = require('../lib/database');
const { syncMode } = require('./topmembers');
const fsp = fs.promises;
const axios = require('axios');
const path = require('path');

const { sleep, isUrl } = require('../lib/myfunc');

const { promisify } = require('util');

const { exec } = require('child_process');

const execAsync = promisify(exec);

const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const settings = require('../settings');

const { addSudo, removeSudo, getSudoList, isSudo } = require('../lib/database');

function extractMentionedJid(message) {

    const mentioned = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];

    if (mentioned.length > 0) return mentioned[0];    

    const text = message.message?.conversation || message.message?.extendedTextMessage?.text || '';

    const match = text.match(/\b(\d{7,15})\b/);

    if (match) return match[1] + '@s.whatsapp.net'; 

    return null;

}
module.exports = [

  {

    name: 'block',

    category: 'owner',

    execute: async (sock, message, args, context) => {

      if (!message.key.fromMe && !context.senderIsSudo) {

        return context.reply("❌ This command is only for the owner!");

      }

      

      const text = args.slice(1).join(' ');

      const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;

      const mentionedJid = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];

      

      if (!quoted && !mentionedJid[0] && !text) {

        return context.reply("Reply to a message or mention/user ID to block");

      }

      const userId = mentionedJid[0] || 

                    (quoted ? message.message.extendedTextMessage.contextInfo.participant : null) ||

                    text.replace(/[^0-9]/g, "") + "@s.whatsapp.net";

      

      await sock.updateBlockStatus(userId, "block");

      context.reply("✅ User blocked successfully!");

    }

  },

  {

    name: 'unblock',

    category: 'owner',

    execute: async (sock, message, args, context) => {

      if (!message.key.fromMe && !context.senderIsSudo) {

        return context.reply("❌ This command is only for the owner!");

      }

      

      const text = args.slice(1).join(' ');

      const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;

      const mentionedJid = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];

      

      if (!quoted && !mentionedJid[0] && !text) {

        return context.reply("Reply to a message or mention/user ID to unblock");

      }

      const userId = mentionedJid[0] || 

                    (quoted ? message.message.extendedTextMessage.contextInfo.participant : null) ||

                    text.replace(/[^0-9]/g, "") + "@s.whatsapp.net";

      

      await sock.updateBlockStatus(userId, "unblock");

      context.reply("✅ User unblocked successfully!");

    }

  },

  {

    name: 'delete',

    aliases: ['del'],

    category: 'owner',

    execute: async (sock, message, args, context) => {

      await context.react("🗑️");

      

      if (!message.key.fromMe && !context.senderIsSudo) {

        return context.reply("❌ This command is only for the owner!");

      }

      

      const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;

      if (!quoted) return context.reply(`Please reply to a message`);

      try {

        // Delete the quoted message

        await sock.sendMessage(context.chatId, {

          delete: {

            remoteJid: context.chatId,

            fromMe: false,

            id: message.message.extendedTextMessage.contextInfo.stanzaId,

            participant: message.message.extendedTextMessage.contextInfo.participant,

          }

        });

        // Delete the command message

        await sock.sendMessage(context.chatId, {

          delete: {

            remoteJid: context.chatId,

            fromMe: message.key.fromMe,

            id: message.key.id,

            participant: message.key.participant,

          }

        });

      } catch (err) {

        console.error(err);

        context.reply("⚠️ Failed to delete message.");

      }

    }

  },

  {

    name: 'deljunk',

    aliases: ['deletejunk', 'clearjunk'],

    category: 'owner',

    execute: async (sock, message, args, context) => {

      if (!message.key.fromMe && !context.senderIsSudo) {

        return context.reply("❌ This command is only for the owner!");

      }

      const tmpDir = path.resolve("./tmp");

      

      // Create tmp directory if it doesn't exist

      if (!fs.existsSync(tmpDir)) {

        fs.mkdirSync(tmpDir, { recursive: true });

        return context.reply("✅ Tmp directory created. No junk files to clean.");

      }

      fsp.readdir(tmpDir, async function (err, files) {

        if (err) {

          console.log("Unable to scan directory: " + err);

          return context.reply("Unable to scan directory: " + err);

        }

        

        let junkFiles = files.filter(

          (item) =>

            item.endsWith("gif") ||

            item.endsWith("png") || 

            item.endsWith("mp3") ||

            item.endsWith("mp4") || 

            item.endsWith("opus") || 

            item.endsWith("jpg") ||

            item.endsWith("webp") ||

            item.endsWith("webm") ||

            item.endsWith("zip")

        );

        

        if (junkFiles.length === 0) {

          return context.reply("✅ No junk files found in tmp folder.");

        }

        

        console.log(junkFiles.length);

        await sleep(2000);

        context.reply(`Clearing ${junkFiles.length} junk files in the tmp folder...`);

        

        await junkFiles.forEach(function (file) {

          fs.unlinkSync(`${tmpDir}/${file}`);

        });

        

        await sleep(2000);

        context.reply("✅ Successfully cleared all the junk files in the tmp folder");

      });

    }

  },

  {

    name: 'groupid',

    aliases: ['idgc'],

    category: 'owner',

    execute: async (sock, message, args, context) => {

      if (!message.key.fromMe && !context.senderIsSudo) {

        return context.reply("❌ This command is only for the owner!");

      }

      

      const text = args.slice(1).join(' ');

      if (!text) return context.reply('Please provide a group link!');

      

      let linkRegex = text;

      let coded = linkRegex.split("https://chat.whatsapp.com/")[1];

      if (!coded) return context.reply("Link Invalid");

      sock.query({

        tag: "iq",

        attrs: {

          type: "get",

          xmlns: "w:g2",

          to: "@g.us"

        },

        content: [{ tag: "invite", attrs: { code: coded } }]

      }).then(async (res) => {

        const tee = `${res.content[0].attrs.id ? res.content[0].attrs.id : "undefined"}`;

        context.reply(tee + '@g.us');

      });

    }

  },

  {

    name: 'join',

    category: 'owner',

    execute: async (sock, message, args, context) => {

      if (!message.key.fromMe && !context.senderIsSudo) {

        return context.reply("❌ This command is only for the owner!");

      }

      

      const text = args.slice(1).join(' ');

      if (!text) return context.reply("Enter group link");

      

      if (!isUrl(text) && !text.includes("whatsapp.com")) {

        return context.reply("Invalid link");

      }

      try {

        const link = text.split("https://chat.whatsapp.com/")[1];

        await sock.groupAcceptInvite(link);

        context.reply("✅ Joined successfully");

      } catch {

        context.reply("❌ Failed to join group");

      }

    }

  },

  {

    name: 'listblocked',

    aliases: ['blocked'],

    category: 'owner',

    execute: async (sock, message, args, context) => {

      if (!message.key.fromMe && !context.senderIsSudo) {

        return context.reply("❌ This command is only for the owner!");

      }

      try {

        const blockedList = await sock.fetchBlocklist();

        if (!blockedList.length) {

          return context.reply('✅ No contacts are currently blocked.');

        }

        let blockedUsers = blockedList.map((user, index) => `🔹 *${index + 1}.* @${user.split('@')[0]}`).join('\n');

        await sock.sendMessage(context.chatId, {

          text: `🚫 *Blocked Contacts:*\n\n${blockedUsers}`,

          mentions: blockedList

        }, { quoted: message });

      } catch (error) {

        context.reply('⚠️ Unable to fetch blocked contacts.');

      }

    }

  },

  {

    name: 'react',

    category: 'owner',

    execute: async (sock, message, args, context) => {

      if (!message.key.fromMe && !context.senderIsSudo) {

        return context.reply("❌ This command is only for the owner!");

      }

      

      const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;

      if (!args[1]) return context.reply(`*Reaction emoji needed*\n Example: ${global.prefix}react 🤔`);

      if (!quoted) return context.reply("Please reply to a message to react to it");

      const reactionMessage = {

        react: {

          text: args[1],

          key: { 

            remoteJid: context.chatId, 

            fromMe: false, 

            id: message.message.extendedTextMessage.contextInfo.stanzaId 

          },

        },

      };

      

      sock.sendMessage(context.chatId, reactionMessage);

    }

  },

  {

    name: 'restart',

    category: 'owner',

    execute: async (sock, message, args, context) => {

      if (!message.key.fromMe && !context.senderIsSudo) {

        return context.reply("❌ This command is only for the owner!");

      }

      

      context.reply(`*Restarting...*`);

      await sleep(3000);

      process.exit(0);

    }

  },

  {

    name: 'toviewonce',

    aliases: ['tovo', 'tovv'],

    category: 'owner',

    execute: async (sock, message, args, context) => {

      if (!message.key.fromMe && !context.senderIsSudo) {

        return context.reply("❌ This command is only for the owner!");

      }

      

      const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;

      if (!quoted) return context.reply(`*Reply to an Image, Video, or Audio*`);

      const messageType = Object.keys(quoted)[0];

      

      try {

        if (messageType === 'imageMessage') {

          const stream = await downloadContentFromMessage(quoted[messageType], 'image');

          let buffer = Buffer.from([]);

          for await (const chunk of stream) {

            buffer = Buffer.concat([buffer, chunk]);

          }

          

          await sock.sendMessage(

            context.chatId,

            {

              image: buffer,

              caption: "✅ Converted to view once",

              viewOnce: true

            },

            { quoted: message }

          );

        } else if (messageType === 'videoMessage') {

          const stream = await downloadContentFromMessage(quoted[messageType], 'video');

          let buffer = Buffer.from([]);

          for await (const chunk of stream) {

            buffer = Buffer.concat([buffer, chunk]);

          }

          

          await sock.sendMessage(

            context.chatId,

            {

              video: buffer,

              caption: "✅ Converted to view once",

              viewOnce: true

            },

            { quoted: message }

          );

        } else if (messageType === 'audioMessage') {

          const stream = await downloadContentFromMessage(quoted[messageType], 'audio');

          let buffer = Buffer.from([]);

          for await (const chunk of stream) {

            buffer = Buffer.concat([buffer, chunk]);

          }

          

          await sock.sendMessage(context.chatId, {

            audio: buffer,

            mimetype: "audio/mpeg",

            ptt: true,

            viewOnce: true

          });

        } else {

          context.reply("❌ Please reply to an image, video, or audio message");

        }

      } catch (error) {

        console.error(error);

        context.reply("❌ Failed to convert to view once");

      }

    }

  },
    {

    name: 'mode',

    aliases: ['botmode'],

    category: 'owner',

    description: 'Toggle bot access mode between public and private',

    usage: '.mode [public/private] or .mode (to check status)',

    execute: async (sock, message, args, context) => {

        const { chatId, channelInfo, reply, senderIsSudo } = context; // 👈 DESTRUCTURE senderIsSudo

        // 🎯 USE DESTRUCTURED senderIsSudo - SAME AS WORKING COMMANDS!

        if (!senderIsSudo) {

            return await reply('❌ This command is only available for the owner or sudo users!');

        }

        // If no arguments provided, show current status

        if (args.length === 1) {

            const isPublic = db.getSetting('mode') === 'public';

            const currentMode = isPublic ? 'Public' : 'Private';

            const statusIcon = isPublic ? '🌍' : '🗝️';

            const description = isPublic 

                ? 'Anyone can use the bot' 

                : 'Only owner and sudo users can use the bot';

            

            return await reply(`${statusIcon} Bot Access Mode\n\nCurrent Mode: ${currentMode}\nDescription: ${description}\n\nUsage:\n• .mode public - Allow everyone to use bot\n• .mode private - Restrict to owner/sudo only\n• .mode - Check current mode`);

        }

        

        // Handle mode change

        const newMode = args[1].toLowerCase();

        

        if (newMode === 'public' || newMode === 'pub') {

            db.updateSetting('mode', 'public');

            

            try {

                syncMode();

                console.log('✅ Mode synced: public');

            } catch (error) {

                console.error('❌ Error syncing mode:', error);

            }

            

            await reply('🌍 Bot Mode Changed\n\n✅ Bot is now in Public Mode\n\nEveryone can now use the bot commands.');

            

        } else if (newMode === 'private' || newMode === 'priv') {

            db.updateSetting('mode', 'private');

            

            try {

                syncMode();

                console.log('✅ Mode synced: private');

            } catch (error) {

                console.error('❌ Error syncing mode:', error);

            }

            

            await reply('🗝️ Bot Mode Changed\n\n✅ Bot is now in Private Mode\n\nOnly owner and sudo users can use the bot.');

            

        } else {

            return await reply('❌ Invalid mode! Use:\n• .mode public - Enable public access\n• .mode private - Enable private access\n• .mode - Check current status');

        }

    }

},
    
{
    name: "lyrics",
    description: "Get lyrics for any song",
    category: "SEARCH MENU",
    usage: ".lyrics <song name> - <artist>",
    
    async execute(sock, m, args, context) {
        try {
            const chatId = m.key.remoteJid;
            //const query = args.join(' ');
            const query = args.slice(1).join(' ').trim();
            
            if (!query) {
                await context.react('😒');
                return await context.replyPlain( {
                    text: '❌ Please provide a song name.\n\nExample: .lyrics Shape of You - Ed Sheeran'
                }, { quoted: m });
            }
await context.react('🥳');
            await context.replyPlain( { text: '🎵 Searching for lyrics...' }, { quoted: m });

            const response = await axios.get(`https://lyricsapi.fly.dev/api/lyrics?q=${encodeURIComponent(query)}`);
            const result = response.data;

            if (!result.status || !result.result) {
                return await context.replyPlain( {
                    text: '❌ Lyrics not found. Please check the song name and try again.'
                }, { quoted: m });
            }

            const lyricsData = result.result;
            let lyricsText = `🎵 ${lyricsData.title}\n`;
            lyricsText += `👤 Artist: ${lyricsData.artist}\n\n`;
            lyricsText += `📝 Lyrics:\n\n${lyricsData.lyrics}`;

            // Split lyrics if too long
            if (lyricsText.length > 4000) {
                const parts = lyricsText.match(/.{1,3900}/g);
                for (let i = 0; i < parts.length && i < 3; i++) {
                    await context.replyPlain( {
                        text: i === 0 ? parts[i] : `Continued...\n\n${parts[i]}`
                    }, { quoted: m });
                }
            } else {
                await context.replyPlain({
                    text: lyricsText
                }, { quoted: m });
            }

        } catch (error) {
            console.error('❌ Lyrics Command Error:', error);
            await context.replyPlain({
                text: '❌ Failed to fetch lyrics. Please try again later.'
            }, { quoted: m });
        }
    }
},
     {

    name: 'sudo',

    aliases: ['admin'],

    category: 'owner',

    description: 'Manage sudo users',

    usage: '.sudo add/del/list [@user|number]',

    execute: async (sock, message, args, context) => {

        const { chatId, reply, react, senderIsSudo } = context;

        const senderJid = message.key.participant || message.key.remoteJid;

        const ownerJid = settings.ownerNumber + '@s.whatsapp.net';

        const isOwner = message.key.fromMe || senderJid === ownerJid;

        // Remove command name if included in args

        const cleanArgs = args[0] === 'sudo' ? args.slice(1) : args;

        if (cleanArgs.length < 1) {

            return await reply('Usage:\n.sudo add <user|number>\n.sudo del <user|number>\n.sudo list');

        }

        const sub = cleanArgs[0].toLowerCase();

        if (!['add', 'del', 'remove', 'list'].includes(sub)) {

            return await reply('Usage:\n.sudo add <user|number>\n.sudo del <user|number>\n.sudo list');

        }

        if (sub === 'list') {

            await react('📋');

            const list = getSudoList();

            

            if (list.length === 0) {

                return await reply('No additional sudo users set.\n\nNote: Owner has permanent sudo privileges.');

            }

            const text = list.map((j, i) => `${i + 1}. @${j.split('@')[0]}`).join('\n');

            

            // Use reply instead of sock.sendMessage to ensure font styling

            return await reply(

                `👥 Sudo Users:\n\n${text}\n\nNote: Owner (@${settings.ownerNumber}) has permanent sudo privileges.`,

                { mentions: list }

            );

        }

        if (!senderIsSudo) {

await react('😱');

            return await reply('❌ Only owner can add/remove sudo users. Use .sudo list to view.');

        }

        // For add/del commands, we need a target

        if (cleanArgs.length < 2) {

            await react('💫');

            return await reply(`Please provide a user to ${sub}.\nExample: .sudo ${sub} @user or .sudo ${sub} 2348085046874`);

        }

        let targetJid = extractMentionedJid(message);

        

        // If no mention found, try to parse the phone number from cleanArgs[1]

        if (!targetJid) {

            const phoneNumber = cleanArgs[1].replace(/\D/g, '');

            if (phoneNumber && phoneNumber.length >= 7) {

                targetJid = phoneNumber + '@s.whatsapp.net';

            }

        }

        if (!targetJid) {

            return await reply('Please mention a user or provide a valid phone number.');

        }

        if (sub === 'add') {

            await react('➕');

            

            if (targetJid === ownerJid) {

                return await reply('Owner already has permanent sudo privileges.');

            }

            

            const ok = addSudo(targetJid);

            const phoneNumber = targetJid.split('@')[0];

            return await reply(ok ? `✅ Added sudo: @${phoneNumber}` : '❌ Failed to add sudo');

        }

        if (sub === 'del' || sub === 'remove') {

            await react('➖');

            

            if (targetJid === ownerJid) {

                return await reply('❌ Owner cannot be removed from sudo privileges.');

            }

            const ok = removeSudo(targetJid);

            const phoneNumber = targetJid.split('@')[0];

            return await reply(ok ? `✅ Removed sudo: @${phoneNumber}` : '❌ Failed to remove sudo');

        }

    }

}
];