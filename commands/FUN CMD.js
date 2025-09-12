const goodnightMessages = [
                "🌙 Good night! Sleep tight and sweet dreams! ✨",
                "🌟 May your dreams be filled with happiness! Good night! 💤",
                "🌙 Rest well and wake up refreshed! Good night! 😴",
                "✨ Sweet dreams! Hope you have a peaceful night! 🌙",
                "💤 Time to recharge! Good night and sleep well! 🌟",
                "🌙 Wishing you the most restful sleep! Good night! 💫",
                "😴 May your pillow be soft and your dreams be sweet! 🌙",
                "🌟 Sleep like a baby and wake up like a champion! Good night! 💪",
                "🌙 Good night! Don't let the bed bugs bite! 🐛✨",
                "💤 Dream big and sleep tight! Good night! 🌟",
                "🌙 Sending you peaceful vibes for a good night's rest! ✨",
                "😴 May you sleep like a log and wake up fresh! Good night! 🌲",
                "🌟 Close your eyes and drift into dreamland! Good night! 💫",
                "🌙 Rest your mind, relax your body! Sweet dreams! 💤",
                "✨ Good night! May tomorrow bring you joy and success! 🌟"
            ];
const insults = [
"You're like a cloud. When you disappear, it's a beautiful day!",
 "You bring everyone so much joy when you leave the room!",
 "I'd agree with you, but then we'd both be wrong.",
 "You're not stupid; you just have bad luck thinking.",
"Your secrets are always safe with me. I never even listen to them.",
 "You're proof that even evolution takes a break sometimes.",
"You have something on your chin... no, the third one down.",
"You're like a software update. Whenever I see you, I think, 'Do I really need this right now?'",
"You bring everyone happiness... you know, when you leave.","You're like a penny—two-faced and not worth much.","You have something on your mind... oh wait, never mind.","You're the reason they put directions on shampoo bottles.", "You're like a cloud. Always floating around with no real purpose.","Your jokes are like expired milk—sour and hard to digest.","You're like a candle in the wind... useless when things get tough.","You have something unique—your ability to annoy everyone equally.","You're like a Wi-Fi signal—always weak when needed most.","You're proof that not everyone needs a filter to be unappealing.","Your energy is like a black hole—it just sucks the life out of the room.","You have the perfect face for radio.","You're like a traffic jam—nobody wants you, but here you are.","You're like a broken pencil—pointless.","Your ideas are so original, I'm sure I've heard them all before.","You're living proof that even mistakes can be productive.", "You're not lazy; you're just highly motivated to do nothing.", "Your brain's running Windows 95—slow and outdated.","You're like a speed bump—nobody likes you, but everyone has to deal with you.","You're like a cloud of mosquitoes—just irritating.","You bring people together... to talk about how annoying you are."

];
const compliments = [
    "You're amazing just the way you are!",
    "You have a great sense of humor!",
    "You're incredibly thoughtful and kind.",
    "You are more powerful than you know.",
    "You light up the room!",
    "You're a true friend.",
    "You inspire me!",
    "Your creativity knows no bounds!",
    "You have a heart of gold.",
    "You make a difference in the world.",
    "Your positivity is contagious!",
    "You have an incredible work ethic.",
    "You bring out the best in people.",
    "Your smile brightens everyone's day.",
    "You're so talented in everything you do.",
    "Your kindness makes the world a better place.",
    "You have a unique and wonderful perspective.",
    "Your enthusiasm is truly inspiring!",
    "You are capable of achieving great things.",
    "You always know how to make someone feel special.",
    "Your confidence is admirable.",
    "You have a beautiful soul.",
    "Your generosity knows no limits.",
    "You have a great eye for detail.",
    "Your passion is truly motivating!",
    "You are an amazing listener.",
    "You're stronger than you think!",
    "Your laughter is infectious.",
    "You have a natural gift for making others feel valued.",
    "You make the world a better place just by being in it."
];
const { getBuffer } = require('../lib/myfunc');
const path = require('path');
const sharp = require('sharp');
const axios = require('axios'); 
const settings = require('../settings');
const Jimp = require('jimp');
const fetch = require('node-fetch');
const fs = require('fs');
const ANIMU_BASE = 'https://api.some-random-api.com/animu';
function normalizeType(input) {
    const lower = (input || '').toLowerCase();
    if (lower === 'facepalm' || lower === 'face_palm') return 'face-palm';
    if (lower === 'quote' || lower === 'animu-quote' || lower === 'animuquote') return 'quote';
    return lower;
}
async function sendAnimu(sock, chatId, message, type, context) {
    const { reply } = context;
    // Handle waifu, neko, and loli from different APIs
    if (type === 'waifu' || type === 'neko') {
        try {
            const endpoint = `https://api.siputzx.my.id/api/r/${type}`;            const res = await axios.get(endpoint, { responseType: 'arraybuffer' });                     if (res.status === 200 && res.data) {
                await context.replyPlain({ 
                        image: res.data, 
                        caption: `✨ Anime ${type.charAt(0).toUpperCase() + type.slice(1)}\n${context.channelInfo?.body || ''}`,                       ...context.channelInfo
                    },
          { quoted: message });
                return;
            }
        } catch (error) {
            console.error(`Error fetching ${type}:`, error.message);
            await reply(`❌ Failed to fetch ${type}.`);
            return;
        }
    }
    if (type === 'loli') {
        try {
            const endpoint = 'https://shizoapi.onrender.com/api/sfw/loli?apikey=shizo';
            const res = await axios.get(endpoint, { responseType: 'arraybuffer' });             if (res.status === 200 && res.data) {
                await context.replyPlain({ 

                        image: res.data, 

                        caption: `✨ Anime ${type.charAt(0).toUpperCase() + type.slice(1)}\n${context.channelInfo?.body || ''}`,
                        ...context.channelInfo
                    },
                    { quoted: message }
                );
                return;
            }
        } catch (error) {
            console.error(`Error fetching ${type}:`, error.message);
            await reply(`❌ Failed to fetch ${type}.`);
           return;
        }}
    try {
        const endpoint = `${ANIMU_BASE}/${type}`;
        const res = await axios.get(endpoint);
    const data = res.data || {};
        if (data.link) {
            await context.replyPlain({ 
     image: { url: data.link }, 
                    caption: `✨ Anime ${type.charAt(0).toUpperCase() + type.slice(1)}\n${context.channelInfo?.body || ''}`,                   ...context.channelInfo
                },
      { quoted: message }
            );
            return;
        }
        if (data.quote) {
            await reply(`📝 Anime Quote\n"${data.quote}"`);
            return;
        }
        await reply('❌ Failed to fetch anime content.');
    } catch (error) {
        console.error(`Error fetching ${type}:`, error.message);
        await reply('❌ Failed to fetch anime content.');
    }
}
const BASE = 'https://shizoapi.onrender.com/api/pies';
const VALID_COUNTRIES = ['china', 'indonesia', 'japan', 'korea', 'hijab'];
async function fetchPiesImageBuffer(country) {
    const url = `${BASE}/${country}?apikey=shizo`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('image')) throw new Error('API did not return an image');
    return res.buffer();
}
module.exports = [
    {

    name: "wasted",

    description: "Apply a wasted effect to a user's profile picture",
    category: "FUN MENU",

    async execute(sock, message, args, {

        chatId,

        senderId,

        isGroup,

        isSenderAdmin,

        isBotAdmin,

        senderIsSudo,

        userMessage,

        rawText,

        channelInfo

    }) {

        let userToWaste;

        

        // Check for mentioned users

        if (message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {

            userToWaste = message.message.extendedTextMessage.contextInfo.mentionedJid[0];

        }

        // Check for replied message

        else if (message.message?.extendedTextMessage?.contextInfo?.participant) {

            userToWaste = message.message.extendedTextMessage.contextInfo.participant;

        }

        

        if (!userToWaste) {

            await sock.sendMessage(chatId, { 

                text: 'Please mention someone or reply to their message to waste them!', 

                ...channelInfo 

            });

            return;

        }

        try {

            // Get user's profile picture

            let profilePic;

            try {

                profilePic = await sock.profilePictureUrl(userToWaste, 'image');

            } catch {

                profilePic = 'https://i.imgur.com/2wzGhpF.jpeg'; // Default image if no profile pic

            }

            // Get the wasted effect image

            const wastedResponse = await axios.get(

                `https://some-random-api.com/canvas/overlay/wasted?avatar=${encodeURIComponent(profilePic)}`,

                { responseType: 'arraybuffer' }

            );

            // Send the wasted image

            await sock.sendMessage(chatId, {

                image: Buffer.from(wastedResponse.data),

                caption: `⚰️ *Wasted* : ${userToWaste.split('@')[0]} 💀\n\nRest in pieces!`,

                mentions: [userToWaste],

                ...channelInfo

            });

        } catch (error) {

            console.error('Error in wasted command:', error);

            await sock.sendMessage(chatId, { 

                text: 'Failed to create wasted image! Try again later.',

                ...channelInfo 

            });

        }

    }

},
    {
    name: "goodnight",
    description: "Send a goodnight message",
    category: "FUN MENU",
    usage: ".goodnight [@user]",
    
    async execute(sock, m, args, settings) {
        try {
            const chatId = m.key.remoteJid;
            
            
            
            const randomMessage = goodnightMessages[Math.floor(Math.random() * goodnightMessages.length)];
            
            let targetUser = null;
            let message = '';
            
            if (m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
                targetUser = m.message.extendedTextMessage.contextInfo.mentionedJid[0];
                message = `💤 *Good night @${targetUser.split('@')[0]}!*\n\n${randomMessage}`;
            } else if (m.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
                targetUser = m.message.extendedTextMessage.contextInfo.participant;
                message = `💤 *Good night @${targetUser.split('@')[0]}!*\n\n${randomMessage}`;
            } else {
                message = `💤 *Good night everyone!*\n\n${randomMessage}`;
            }
            
            await sock.sendMessage(chatId, {
                text: message,
                mentions: targetUser ? [targetUser] : []
            }, { quoted: m });

        } catch (error) {
            console.error('❌ Goodnight Command Error:', error);
            await sock.sendMessage(m.key.remoteJid, {
                text: '❌ Failed to send goodnight message. Please try again.'
            }, { quoted: m });
        }
    }
    },
        {
    name: 'compliment',
    aliases: ['comp', 'praise'],
    category: 'FUN MENU',
    description: 'Send a compliment to someone',
    usage: '.compliment @user or reply to message',

    execute: async (sock, message, args, context) => {
        const { reply, react, mentions, hasQuotedMessage } = context;
        
        await react('💖');

        let userToCompliment;
        
        if (mentions.length > 0) {
            userToCompliment = mentions[0];
        } else if (hasQuotedMessage && message.message?.extendedTextMessage?.contextInfo?.participant) {
            userToCompliment = message.message.extendedTextMessage.contextInfo.participant;
        }
        
        if (!userToCompliment) {
            return await reply('Please mention someone or reply to their message to compliment them!\n\nUsage: `.compliment @user`');
        }

        // Fix: Added missing = operator
        const compliment = compliments[Math.floor(Math.random() * compliments.length)];

        await new Promise(resolve => setTimeout(resolve, 1000));

        // Fix: Use reply() directly with text and mentions, not as object
        await reply(
            `💝 Hey @${userToCompliment.split('@')[0]}, ${compliment}`,
            { mentions: [userToCompliment] }
        );
    }
},
    {

    name: "roseday",

    description: "Send beautiful rose day wishes",

    category: "FUN MENU",

    usage: ".roseday [@user]",

    

    async execute(sock, m, args, settings) {

        try {

            const chatId = m.key.remoteJid;

            

            const roseDayMessages = [

                "🌹 Happy Rose Day! May your life be as beautiful and fragrant as roses! 💕",

                "🌹 Sending you a virtual bouquet of roses on this special day! 💐",

                "🌹 Red roses for love, white for peace, pink for happiness - Happy Rose Day! ✨",

                "🌹 Like a rose that spreads fragrance, may you spread joy everywhere! 💖",

                "🌹 Roses are red, violets are blue, wishing Rose Day happiness to you! 💙",

                "🌹 May this Rose Day bloom new hopes and dreams in your life! 🌟",

                "🌹 Just like roses need care to bloom, may you always be surrounded by love! 💝",

                "🌹 Happy Rose Day! May your days be as sweet as the fragrance of roses! 🌸",

                "🌹 Sending you roses of different colors to brighten up your day! 🌈",

                "🌹 On this Rose Day, may your life be filled with the beauty of roses! ✨",

                "🌹 Roses symbolize love and beauty - just like you! Happy Rose Day! 💕",

                "🌹 May the thorns of life never hurt you, only the beauty of roses surround you! 🌹",

                "🌹 Happy Rose Day! May you always find reasons to smile like a blooming rose! 😊",

                "🌹 Roses are nature's way of showing beauty - Happy Rose Day beautiful soul! 💫",

                "🌹 Wishing you a day as lovely and precious as a garden full of roses! 🌺"

            ];

            

            const randomMessage = roseDayMessages[Math.floor(Math.random() * roseDayMessages.length)];

            

            let targetUser = null;

            let message = '';

            

            if (m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {

                targetUser = m.message.extendedTextMessage.contextInfo.mentionedJid[0];

                message = `🌹 *Rose Day Wishes for @${targetUser.split('@')[0]}!* 🌹\n\n${randomMessage}\n\n🌹💕 _May your day be filled with love and roses!_ 💕🌹`;

            } else if (m.message?.extendedTextMessage?.contextInfo?.quotedMessage) {

                targetUser = m.message.extendedTextMessage.contextInfo.participant;

                message = `🌹 *Rose Day Wishes for @${targetUser.split('@')[0]}!* 🌹\n\n${randomMessage}\n\n🌹💕 _May your day be filled with love and roses!_ 💕🌹`;

            } else {

                message = `🌹 *Happy Rose Day Everyone!* 🌹\n\n${randomMessage}\n\n🌹💕 _Spreading love and rose fragrance to all!_ 💕🌹`;

            }

            

            await sock.sendMessage(chatId, {

                text: message,

                mentions: targetUser ? [targetUser] : []

            }, { quoted: m });

        } catch (error) {

            console.error('❌ RoseDay Command Error:', error);

            await sock.sendMessage(m.key.remoteJid, {

                text: '❌ Failed to send Rose Day wishes. Please try again.'

            }, { quoted: m });

        }

    }

},
    {
    name: 'stupid',
    aliases: ['dumb'],
    category: 'FUN MENU',
    description: 'Generate stupid card for someone',
    usage: '.stupid [@user] [text]',
    execute: async (sock, message, args, context) => {
        const { chatId, reply, react, mentions, hasQuotedMessage, sender } = context;

        try {
            await react('🤡');

            let who = sender;
            let text = 'im+stupid';

            if (hasQuotedMessage) {
                who = message.message?.extendedTextMessage?.contextInfo?.participant || sender;
                if (args.length > 1) {
                    text = args.slice(1).join('+');
                }
            } else if (mentions.length > 0) {
                who = mentions[0];
                if (args.length > 2) {
                    text = args.slice(2).join('+');
                }
            } else if (args.length > 1) {
                text = args.slice(1).join('+');
            }

            let avatarUrl;
            try {
                avatarUrl = await sock.profilePictureUrl(who, 'image');
            } catch (error) {
                avatarUrl = 'https://telegra.ph/file/24fa902ead26340f3df2c.png';
            }

            const apiUrl = `https://some-random-api.com/canvas/misc/its-so-stupid?avatar=${encodeURIComponent(avatarUrl)}&dog=${encodeURIComponent(text)}`;
            const response = await fetch(apiUrl);
            
            if (!response.ok) {
                throw new Error(`API responded with status: ${response.status}`);
            }

            const imageBuffer = await response.buffer();

            await sock.sendMessage(chatId, {
                image: imageBuffer,
                caption: `🤡 @${who.split('@')[0]} is stupid!`,
                mentions: [who],
                ...context.channelInfo
            });

        } catch (error) {
            await reply('❌ Sorry, I couldn\'t generate the stupid card. Please try again later!');
        }
    }
},
    {

    name: 'insult',

    aliases: ['roast', 'burn'],

    category: 'FUN MENU',

    description: 'Send a playful insult to someone',

    usage: '.insult @user or reply to message',

    execute: async (sock, message, args, context) => {

        const { reply, react, mentions, hasQuotedMessage, chatId } = context;

        await react('🔥');

        let userToInsult;

        

        if (mentions.length > 0) {

            userToInsult = mentions[0];

        } else if (hasQuotedMessage && message.message?.extendedTextMessage?.contextInfo?.participant) {

            userToInsult = message.message.extendedTextMessage.contextInfo.participant;

        }

        

        if (!userToInsult) {

            return await reply('Please mention someone or reply to their message to insult them!\n\nUsage: `.insult @user`');

        }

        const insult = insults[Math.floor(Math.random() * insults.length)];

        await new Promise(resolve => setTimeout(resolve, 1000));

        await reply(
    `🔥 Hey @${userToInsult.split('@')[0]}, ${insult}`,
    { quoted: message, mentions: [userToInsult] }
);

    }

    },
    {

    name: 'fact',

    category: 'FUN MENU',

    execute: async (sock, message, args, context) => {

      try {

        await context.react("ℹ️");

        const { data } = await axios.get(`https://nekos.life/api/v2/fact`);

        return context.reply(`FACT: ${data.fact}\n`);

      } catch (err) {

        console.error(err);

        return context.reply('An error occurred while fetching the fact.');

      }

    }

  },

  

  {

    name: 'joke',

    aliases: ['jokes'],

    category: 'FUN MENU',

    execute: async (sock, message, args, context) => {

      try {

        await context.react("😂");

        let res = await fetch("https://api.chucknorris.io/jokes/random");

        let json = await res.json();

        await context.reply(json.value, { quoted: message });

      } catch (error) {

        console.error('Error fetching joke:', error);

        context.reply('An error occurred while fetching a joke.');

      }

    }

  },

  

  {

    name: 'meme',

    aliases: ['memes'],

    category: 'FUN MENU',

    execute: async (sock, message, args, context) => {

      try {

        await context.react("🤣");

        let res = await fetch("https://api.imgflip.com/get_memes");

        let json = await res.json();

        for (let i = 0; i < 5; i++) {

          let meme = json.data.memes[i];

          await context.reply(
    { image: { url: meme.url }, caption: "😂 Meme for you!\nPowered by gift md" },
    { quoted: message }
);

        }

      } catch (error) {

        console.error('Error fetching memes:', error);

        context.reply('An error occurred while fetching memes.');

      }

    }

  },

  {

    name: 'trivia',

    category: 'FUN MENU',

    execute: async (sock, message, args, context) => {

      try {

        await context.react("❓");

        let res = await fetch("https://opentdb.com/api.php?amount=1");

        let json = await res.json();

        let question = json.results[0].question;

        let answer = json.results[0].correct_answer;

        await context.reply(
    `Question: ${question}\n\nThink you know the answer? Sending the correct answer after 20 seconds`,
    { quoted: message }
);

        

        setTimeout(async () => {

          await context.reply(`Answer: ${answer}`);

        }, 10000); // 20 seconds

      } catch (error) {

        console.error('Error fetching trivia question:', error);

        context.reply('An error occurred while fetching the trivia question.');

      }

    }

  },

  

  {

    name: 'truthdetector',

    aliases: ['liedetector'],

    category: 'FUN MENU',

    execute: async (sock, message, args, context) => {

      await context.react("🕵️");

      

      if (!message.message?.extendedTextMessage?.contextInfo?.quotedMessage) {

        return context.reply(`Please reply to the message you want to detect!`);

      }

      let responses = [

        "That's a blatant lie!",

        "Truth revealed!",

        "Lie alert!",

        "Hard to believe, but true!",

        "Professional liar detected!",

        "Fact-check: TRUE",

        "Busted! That's a lie!",

        "Unbelievable, but FALSE!",

        "Detecting... TRUTH!",

        "Lie detector activated: FALSE!",

        "Surprisingly, TRUE!",

        "My instincts say... LIE!",

        "That's partially true!",

        "Can't verify, try again!",

        "Most likely, TRUE!",

        "Don't believe you!",

        "Surprisingly, FALSE!",

        "Truth!",

        "Honest as a saint!",

        "Deceptive much?",

        "Absolutely true!",

        "Completely false!",

        "Seems truthful.",

        "Not buying it!",

        "You're lying through your teeth!",

        "Hard to believe, but it's true!",

        "I sense honesty.",

        "Falsehood detected!",

        "Totally legit!",

        "Lies, lies, lies!",

        "You can't fool me!",

        "Screams truth!",

        "Fabrication alert!",

        "Spot on!",

        "Fishy story, isn't it?",

        "Unquestionably true!",

        "Pure fiction!"

      ];

      let result = responses[Math.floor(Math.random() * responses.length)];

      let replyText = `RESULT: ${result}`;

      await context.reply(replyText);

    }

  },

  {
  name: 'quotes',
  category: 'FUN MENU',
  execute: async (sock, message, args, context) => {
    try {
      await context.react("💬");
      
      // Try multiple quote APIs
      let quoteData;
      
      try {
        // First try - quotable.io
        const response = await axios.get('https://api.quotable.io/random');
        quoteData = {
          quote: response.data.content,
          author: response.data.author
        };
      } catch (err1) {
        try {
          // Second try - zenquotes.io
          const response = await axios.get('https://zenquotes.io/api/random');
          quoteData = {
            quote: response.data[0].q,
            author: response.data[0].a
          };
        } catch (err2) {
          // Fallback quotes
          const fallbackQuotes = [
            { quote: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
            { quote: "Life is what happens when you're busy making other plans.", author: "John Lennon" },
            { quote: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
            { quote: "The only impossible journey is the one you never begin.", author: "Tony Robbins" },
            { quote: "In the end, we will remember not the words of our enemies, but the silence of our friends.", author: "Martin Luther King Jr." },
            { quote: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
            { quote: "The only thing we have to fear is fear itself.", author: "Franklin D. Roosevelt" },
            { quote: "Be yourself; everyone else is already taken.", author: "Oscar Wilde" },
            { quote: "Two things are infinite: the universe and human stupidity; and I'm not sure about the universe.", author: "Albert Einstein" },
            { quote: "You miss 100% of the shots you don't take.", author: "Wayne Gretzky" }
          ];
          
          const randomQuote = fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)];
          quoteData = {
            quote: randomQuote.quote,
            author: randomQuote.author
          };
        }
      }
      
      const textquotes = `QUOTE: ${quoteData.quote}\n\nAUTHOR: ${quoteData.author}`;
      return context.reply(textquotes);
      
    } catch (err) {
      console.error(err);
      return context.reply('❌ Failed to get quote. Try again later!');
    }
  }
},

  {

    name: 'xxqc',

    category: 'FUN MENU',

    execute: async (sock, message, args, context) => {

      await context.react("🖋️");

      

      const text = args.slice(1).join(' ');

      const prefix = global.prefix || '.';

      

      if (!text) {

        return context.reply(`Example: ${prefix}xxqc pink hello\n\nColour list\npink\nblue\nred\ngreen\nyellow\npurple\ndarkblue\nlightblue\nash\norange\nblack\nwhite\nteal\nlightpink\nchocolate\nsalmon\nmagenta\ntan\nwheat\ndeeppink\nfire\nskyblue\nbrightskyblue\nhotpink\nlightskyblue\nseagreen\ndarkred\norangered\ncyan\nviolet\nmossgreen\ndarkgreen\nnavyblue\ndarkorange\ndarkpurple\nfuchsia\ndarkmagenta\ndarkgray\npeachpuff\nblackishgreen\ndarkishred\ngoldenrod\ndarkishgray\ndarkishpurple\ngold\nsilver`);

      }

      

      if (text.length > 100) return context.reply(`Max 100 characters.`);

      let [color, ...messageText] = text.split(" ");

      messageText = messageText.join(" ");

      

      const colorMap = {

        "pink": "#f68ac9",

        "blue": "#6cace4",

        "red": "#f44336",

        "green": "#4caf50",

        "yellow": "#ffeb3b",

        "purple": "#9c27b0",

        "darkblue": "#0d47a1",

        "lightblue": "#03a9f4",

        "ash": "#9e9e9e",

        "orange": "#ff9800",

        "black": "#000000",

        "white": "#ffffff",

        "teal": "#008080",

        "lightpink": "#FFC0CB",

        "chocolate": "#A52A2A",

        "salmon": "#FFA07A",

        "magenta": "#FF00FF",

        "tan": "#D2B48C",

        "wheat": "#F5DEB3",

        "deeppink": "#FF1493",

        "fire": "#B22222",

        "skyblue": "#00BFFF",

        "brightskyblue": "#1E90FF",

        "hotpink": "#FF69B4",

        "lightskyblue": "#87CEEB",

        "seagreen": "#20B2AA",

        "darkred": "#8B0000",

        "orangered": "#FF4500",

        "cyan": "#48D1CC",

        "violet": "#BA55D3",

        "mossgreen": "#00FF7F",

        "darkgreen": "#008000",

        "navyblue": "#191970",

        "darkorange": "#FF8C00",

        "darkpurple": "#9400D3",

        "fuchsia": "#FF00FF",

        "darkmagenta": "#8B008B",

        "darkgray": "#2F4F4F",

        "peachpuff": "#FFDAB9",

        "darkishgreen": "#BDB76B",

        "darkishred": "#DC143C",

        "goldenrod": "#DAA520",

        "darkishgray": "#696969",

        "darkishpurple": "#483D8B",

        "gold": "#FFD700",

        "silver": "#C0C0C0"

      };

      const backgroundColor = colorMap[color.toLowerCase()];

      if (!backgroundColor) return context.reply("The selected color is not available.");

      const pushname = await sock.getName(context.sender);

      const profilePic = await sock.profilePictureUrl(context.sender, "image").catch(() => "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png?q=60");

      let obj = {

        type: "quote",

        format: "png",

        backgroundColor,

        width: 512,

        height: 768,

        scale: 2,

        messages: [

          {

            entities: [],

            avatar: true,

            from: {

              id: 1,

              name: pushname,

              photo: { url: profilePic }

            },

            text: messageText,

            replyMessage: {}

          }

        ]

      };

      

      try {

        let response = await axios.post("https://bot.lyo.su/quote/generate", obj, { headers: { "Content-Type": "application/json" } });

        let buffer = Buffer.from(response.data.result.image, "base64");

        

        await sock.sendMessage(context.chatId, {

          sticker: buffer,

        }, { quoted: message });

      } catch (error) {

        console.error('Error generating quote:', error);

        context.reply("An error occurred while generating the quote.");

      }

    }

  },
{

    name: 'character',

    aliases: ['char', 'analyze'],

    category: 'FUN MENU',

    description: 'Analyze someone\'s character traits',

    usage: '.character @user or reply to user',

    execute: async (sock, message, args, context) => {

        const { chatId, channelInfo } = context;

        

        let userToAnalyze;

        

        // Check for mentioned users

        if (message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {

            userToAnalyze = message.message.extendedTextMessage.contextInfo.mentionedJid[0];

        }

        // Check for replied message

        else if (message.message?.extendedTextMessage?.contextInfo?.participant) {

            userToAnalyze = message.message.extendedTextMessage.contextInfo.participant;

        }

        

        if (!userToAnalyze) {

            return await context.reply('Please mention someone or reply to their message to analyze their character!');

        }

        try {

            // Get user's profile picture

            let profilePic;

            try {

                profilePic = await sock.profilePictureUrl(userToAnalyze, 'image');

            } catch {

                profilePic = 'https://i.imgur.com/2wzGhpF.jpeg'; // Default image if no profile pic

            }

            const traits = [

                "Intelligent", "Creative", "Determined", "Ambitious", "Caring",

                "Charismatic", "Confident", "Empathetic", "Energetic", "Friendly",

                "Generous", "Honest", "Humorous", "Imaginative", "Independent",

                "Intuitive", "Kind", "Logical", "Loyal", "Optimistic",

                "Passionate", "Patient", "Persistent", "Reliable", "Resourceful",

                "Sincere", "Thoughtful", "Understanding", "Versatile", "Wise"

            ];

            // Get 3-5 random traits

            const numTraits = Math.floor(Math.random() * 3) + 3;

            const selectedTraits = [];

            for (let i = 0; i < numTraits; i++) {

                const randomTrait = traits[Math.floor(Math.random() * traits.length)];

                if (!selectedTraits.includes(randomTrait)) {

                    selectedTraits.push(randomTrait);

                }

            }

            // Calculate random percentages for each trait

            const traitPercentages = selectedTraits.map(trait => {

                const percentage = Math.floor(Math.random() * 41) + 60;

                return `${trait}: ${percentage}%`;

            });

            // Create character analysis message

            const analysis = `🔮 Character Analysis 🔮\n\n` +

                `👤 User: ${userToAnalyze.split('@')[0]}\n\n` +

                `✨ Key Traits:\n${traitPercentages.join('\n')}\n\n` +

                `🎯 Overall Rating: ${Math.floor(Math.random() * 21) + 80}%\n\n` +

                `Note: This is a fun analysis and should not be taken seriously!`;

            // Send the analysis with the user's profile picture

            await context.reply({

    image: { url: profilePic },

    caption: analysis,

    mentions: [userToAnalyze],

    ...channelInfo

});

        } catch (error) {

            console.error('Error in character command:', error);

            await sock.sendMessage(chatId, {

                text: 'Failed to analyze character! Try again later.',

                ...channelInfo

            }, { quoted: message });

        }

    }

},
    
 {

    name: 'gif',

    aliases: ['giphy', 'g'],

    category: 'FUN MENU',

    description: 'Search and send GIFs from Giphy',

    usage: '.gif <search term>',

    execute: async (sock, message, args, context) => {

        const { reply, react } = context;

        const apiKey = settings.giphyApiKey;

        if (!args[1]) {

            return await reply('Please provide a search term for the GIF.\n\nUsage: `.gif cats`');

        }

        const query = args.slice(1).join(' ');

        await react('🔍');

        try {

            const response = await axios.get(`https://api.giphy.com/v1/gifs/search`, {

                params: {

                    api_key: apiKey,

                    q: query,

                    limit: 1,

                    rating: 'g'

                }

            });

            const gifUrl = response.data.data[0]?.images?.downsized_medium?.url;

            if (gifUrl) {

                await context.reply({ 

                    video: { url: gifUrl }, 

                    caption: `Here is your GIF for "${query}"\nPowered by gift-md` 

                }, { quoted: message });

                await react('✅');

            } else {

                await reply('No GIFs found for your search term.');

            }

        } catch (error) {

            await reply('Failed to fetch GIF. Please try again later.');

        }

    }

},
    {

    name: 'animu',

    aliases: ['anime'],

    category: 'FUN MENU',

    description: 'Get anime images, GIFs, and quotes',

    usage: 'animu <type>\nTypes: nom, poke, cry, kiss, pat, hug, wink, face-palm, quote, waifu, neko, loli',

    execute: async (sock, message, args, context) => {

        const { reply, react } = context;

        

        const subArg = args[1] || '';

        const sub = normalizeType(subArg);

        const supported = [

            'nom', 'poke', 'cry', 'kiss', 'pat', 'hug', 'wink', 'face-palm', 'quote', 'waifu', 'neko', 'loli'

        ];

        try {

            if (!sub) {

                // Fetch supported types from API for dynamic help

                try {

                    const res = await axios.get(ANIMU_BASE);

                    const apiTypes = res.data && res.data.types ? 

                        res.data.types.map(s => s.replace('/animu/', '')).join(', ') : 

                        supported.join(', ');

                    

                    await reply(`🎌 Anime Command Usage\n\n📝 Usage: \.anime <type>\`\n🎭 Available Types:\n${apiTypes}`);

                } catch {

                    await reply(`🎌 Anime Command Usage\n\n📝 Usage: .anime <type> 🎭 Available Types:\n${supported.join(', ')}`);

                }

                return;

            }

            if (!supported.includes(sub)) {

                await reply(`❌ Unsupported type: \`${sub}\`\n\n✅ Try one of:\n${supported.join(', ')}`);

                return;

            }

            await react('⏳');

            await sendAnimu(sock, context.chatId, message, sub, context);

            await react('✅');

            

        } catch (err) {

            console.error('Error in animu command:', err);

            await react('❌');

            await reply('❌ An error occurred while fetching anime content.');

        }

    }
 },
    {

    name: 'pies',

    aliases: ['china', 'indonesia', 'japan', 'korea', 'hijab'],

    category: 'FUN MENU',

    description: 'Get images from different countries',

    usage: 'pies <country>\nCountries: china, indonesia, japan, korea, hijab',

    execute: async (sock, message, args, context) => {

        const { reply, react, chatId } = context;

        

        // Check if command was called via alias

        const commandUsed = args[0].toLowerCase();

        let country;

        

        if (VALID_COUNTRIES.includes(commandUsed)) {

            // Called via alias (e.g., .china, .japan)

            country = commandUsed;

        } else {

            // Called via main command (e.g., .pies china)

            country = (args[1] || '').toLowerCase();

        }

        

        if (!country) {

            await reply(`Usage: .pies <country>\nCountries: ${VALID_COUNTRIES.join(', ')}`);

            return;

        }

        

        if (!VALID_COUNTRIES.includes(country)) {

            await reply(`❌ Unsupported country: ${country}. Try one of: ${VALID_COUNTRIES.join(', ')}`);

            return;

        }

        

        try {

            await react('⏳');

            

            const imageBuffer = await fetchPiesImageBuffer(country);

            

            await context.replyPlain(

                

                { 

                    image: imageBuffer, 

                    caption: `${country.charAt(0).toUpperCase() + country.slice(1)} Image\n${context.channelInfo?.body || ''}`,

                    ...context.channelInfo

                },

                { quoted: message }

            );

            

            await react('✅');

            

        } catch (err) {

            console.error('Error in pies command:', err);

            await react('❌');

            await reply('❌ Failed to fetch image. Please try again.');

        }

    }

},
   {
    name: "simp",
    description: "Call someone a simp (playfully)",
    category: "FUN MENU",
    usage: ".simp [@user]",
    
    async execute(sock, m, args, context) {
        try {
            const chatId = m.key.remoteJid;
            
            const simpMessages = [
                "💸 You're such a simp, you'd pay for someone's OnlyFans and say it's for the personality! 😂",
                "🤡 Simp level: Buying her groceries when she has a boyfriend! 🛒",
                "💔 You're simping so hard, you're in the friend zone before you even talk! 📱",
                "🎭 Professional simp detected! You've mastered the art of unrequited love! 💕",
                "💸 You're the type to donate your life savings and get a 'thank you bestie' back! 💸",
                "🤡 Simp alert! You probably write essays in her DMs and get left on read! 📝",
                "💔 You're simping harder than a Discord mod! 🎮",
                "🎭 You'd probably name your pet after your crush! 🐕",
                "💸 You're the CEO of Simp Nation! 🏢",
                "🤡 You probably screenshot every conversation and analyze it with friends! 📱",
                "💔 Simp level: Maximum! You'd probably ask 'how was your day' every morning! ☀️",
                "🎭 You're simping so hard, you make romantic comedies look realistic! 🎬",
                "💸 You'd probably offer to do her homework and she'd still pick the bad boy! 📚",
                "🤡 Certified simp! You probably have her notifications on special ring tone! 🔔",
                "💔 You're the type to wait 6 hours to reply so you don't look desperate! ⏰"
            ];
            
            const randomMessage = simpMessages[Math.floor(Math.random() * simpMessages.length)];
            
            let targetUser = null;
            let message = '';
            
            if (m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
                targetUser = m.message.extendedTextMessage.contextInfo.mentionedJid[0];
                message = `🤡 Simp Alert for @${targetUser.split('@')[0]}!\n\n${randomMessage}\n\nJust playing around! Respect the hustle! 😎`;
            } else if (m.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
                targetUser = m.message.extendedTextMessage.contextInfo.participant;
                message = `🤡 Simp Alert for @${targetUser.split('@')[0]}!\n\n${randomMessage}\n\nJust playing around! Respect the hustle! 😎`;
            } else {
                message = `🤡 Random Simp Facts:\n\n${randomMessage}\n\nWe've all been there! 😅`;
            }
            
            await context.replyPlain({
                text: message,
                mentions: targetUser ? [targetUser] : []
            }, { quoted: m });

        } catch (error) {
            console.error('❌ Simp Command Error:', error);
            await context.reply({
                text: '❌ Failed to send simp message. Please try again.'
            }, { quoted: m });
        }
    }
   }
];
