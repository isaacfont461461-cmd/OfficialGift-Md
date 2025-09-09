const axios = require('axios');

module.exports = {

    name: "xvideos",

    aliases: ["porn", "xdl"],

    category: "NSFW",

    desc: "Download adult videos from XNXX",

    async execute(sock, msg, args, context) {

        const { chatId, senderIsSudo, isFromOwner } = context;

        const text = args.slice(1).join(" ");

        // Owner/Sudo check using context properties

        if (!isFromOwner && !senderIsSudo) {

            return await context.reply('This command is only available for the owner or sudo users!');

        }

        if (!text) {

            return await context.reply('Please provide a porn video search query!\nxvideos stepmom');

        }

        try {
            await context.react('🍆');

            await context.replyPlain('Searching for videos...');

            // Search for videos

            

            const searchResponse = await axios.get(`https://api-aswin-sparky.koyeb.app/api/search/xnxx?search=${encodeURIComponent(text)}`, {

                timeout: 30000

            });

            const searchData = searchResponse.data;

            

            if (!searchData || !searchData.result || !searchData.result.result || searchData.result.result.length === 0) {

                return await context.reply('No videos found for your search query!');

            }

            const results = searchData.result.result;

            const firstVideoResponse = await axios.get(`https://api-aswin-sparky.koyeb.app/api/downloader/xnxx?url=${encodeURIComponent(results[0].link)}`, {

                timeout: 60000

            });

            const firstVideoData = firstVideoResponse.data;

            

            if (firstVideoData && firstVideoData.data && firstVideoData.data.files && firstVideoData.data.files.high) {

                await sock.sendMessage(chatId, {

                    video: { url: firstVideoData.data.files.high },

                    caption: global.watermark || 'Downloaded by Gift md',});

            }
        } catch (error) {

            console.error('Error in xvideos command:', error);

            await context.reply('Failed to download videos. The API might be down or the content is not available.');

        }

    }

};