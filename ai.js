const axios = require('axios');

const fetch = require('node-fetch');

module.exports = {

    name: 'gpt',

    aliases: ['gpt'],

    category: 'ai',

    description: 'Chat with Gpt (GPT)',

    usage: '.gpt <question> ',

    execute: async (sock, message, args, context) => {

        const { chatId, channelInfo } = context;

        

        const query = args.slice(1).join(' ').trim();

        

        if (!query) {

            return await context.reply("Please provide a question after .gpt \n\nExample: .gpt write a basic html code"

                );

        }

        try {

            await sock.sendMessage(chatId, {

                react: { text: '🤖', key: message.key }

            });

            const command = args[0].toLowerCase();

            if (command === 'gpt') {

                const response = await axios.get(`https://api.dreaded.site/api/chatgpt?text=${encodeURIComponent(query)}`);

                

                if (response.data && response.data.success && response.data.result) {

                    const answer = response.data.result.prompt;

                    await context.reply(answer);

                }
    else {

                    throw new Error('Invalid response from API');

                }

            }
        } catch (error) {

            console.error('API Error:', error);

            await sock.sendMessage(chatId, {

                text: "❌ Failed to get response. Please try again later.",

                ...channelInfo

            }, { quoted: message });

        }

    }

};