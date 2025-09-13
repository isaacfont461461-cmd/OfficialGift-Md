const axios = require('axios');
const { channelInfo } = require('../lib/messageConfig');

module.exports = [
    {
        name: 'pls',
        aliases: ['msc'],
        category: 'media',
        description: 'Search and download songs from YouTube',
        usage: '.song <song name>',
        
        execute: async (sock, message, args, context) => {
            const { chatId } = context;
            
            if (!args.length) {
                return await context.reply('❌ Please provide a song name!\n\nUsage: `.song spectre`');
            }
            
            const query = args.join(' ');
            
            try {
                // Send searching message
                await context.reply('🔍 Searching for your song...');
                
                // Fetch from API
                const response = await axios.get(`https://ochinpo-helper.hf.space/yt?query=${encodeURIComponent(query)}`);
                const data = response.data;
                
                if (!data.success || !data.result) {
                    return await context.reply('❌ No song found for that query. Try a different search term.');
                }
                
                const song = data.result;
                
                // Create info message
                let songInfo = `🎵 *${song.title}*\n\n`;
                songInfo += `👤 *Author:* ${song.author.name}\n`;
                songInfo += `⏱️ *Duration:* ${song.duration.timestamp}\n`;
                songInfo += `👀 *Views:* ${song.views.toLocaleString()}\n`;
                songInfo += `📅 *Uploaded:* ${song.ago}\n\n`;
                songInfo += `📝 *Description:*\n${song.description.slice(0, 100)}${song.description.length > 100 ? '...' : ''}\n\n`;
                songInfo += `🔗 *URL:* ${song.url}`;
                
                // Send song info with thumbnail
                await sock.sendMessage(chatId, {
                    image: { url: song.image },
                    caption: songInfo,
                    ...channelInfo
                });
                
                // Send audio download
                await context.reply('⬇️ Downloading audio...');
                
                await sock.sendMessage(chatId, {
                    audio: { url: song.download.audio },
                    mimetype: 'audio/mp4',
                    fileName: `${song.title}.mp3`,
                    ...channelInfo
                }, { quoted: message });
                
                await context.reply('✅ Song downloaded successfully!');
                
            } catch (error) {
                console.error('Song command error:', error);
                
                if (error.response?.status === 404) {
                    await context.reply('❌ No song found for that query. Try a different search term.');
                } else {
                    await context.reply(`❌ Failed to fetch song!\n\nError: ${error.message}\n\nTry again later.`);
                }
            }
        }
    }
];
