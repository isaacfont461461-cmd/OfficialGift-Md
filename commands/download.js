const { fetchJson, isUrl } = require('../lib/myfunc');
const { ttdl } = require("ruhend-scraper");
const axios = require('axios');
const { channelInfo } = require('../lib/messageConfig');
const processedMessages = new Set();
const fetch = require('node-fetch'); 
const fs = require('fs');
const path = require('path');
const yts = require('yt-search');
const settings = require('../settings');
module.exports = [

  {

    name: 'apk',

    aliases: ['apkdl'],

    category: 'SETTINGS MENU',

    execute: async (sock, message, args, context) => {

      const text = args.slice(1).join(' ');

      if (!text) return context.reply("*Which apk do you want to download?*");

      

      try {

        let apiUrl = await fetchJson(`https://api.bk9.dev/search/apk?q=${text}`);

        let tylor = await fetchJson(`https://api.bk9.dev/download/apk?id=${apiUrl.BK9[0].id}`);

        await sock.sendMessage(

          context.chatId,

          {

            document: { url: tylor.BK9.dllink },

            fileName: tylor.BK9.name,

            mimetype: "application/vnd.android.package-archive",

            contextInfo: {

              externalAdReply: {

                title: global.botName || "Knight Bot",

                body: `${tylor.BK9.name}`,

                thumbnailUrl: `${tylor.BK9.icon}`,

                sourceUrl: `${tylor.BK9.dllink}`,

                mediaType: 2,

                showAdAttribution: true,

                renderLargerThumbnail: false

              }

            }

          },

          { quoted: message }

        );

      } catch (error) {

        context.reply("❌ Error downloading APK. Please try again later.");

      }

    }

  },

  

  {

    name: 'download',

    category: 'downloader',

    execute: async (sock, message, args, context) => {

      const text = args.slice(1).join(' ');

      if (!text) return context.reply('Enter download URL');

      

      try {

        let res = await fetch(text, { method: 'GET', redirect: 'follow' });

        let contentType = res.headers.get('content-type');

        let buffer = await res.buffer();

        let extension = contentType.split('/')[1]; 

        let filename = res.headers.get('content-disposition')?.match(/filename="(.*)"/)?.[1] || `download-${Math.random().toString(36).slice(2, 10)}.${extension}`;

        let mimeType;

        switch (contentType) {

          case 'audio/mpeg':

            mimeType = 'audio/mpeg';

            break;

          case 'image/png':

            mimeType = 'image/png';

            break;

          case 'image/jpeg':

            mimeType = 'image/jpeg';

            break;

          case 'application/pdf':

            mimeType = 'application/pdf';

            break;

          case 'application/zip':

            mimeType = 'application/zip';

            break;

          case 'video/mp4':

            mimeType = 'video/mp4';

            break;

          case 'video/webm':

            mimeType = 'video/webm';

            break;

          case 'application/vnd.android.package-archive':

            mimeType = 'application/vnd.android.package-archive';

            break;

          default:

            mimeType = 'application/octet-stream';

        }

        sock.sendMessage(context.chatId, { document: buffer, mimetype: mimeType, fileName: filename }, { quoted: message });

      } catch (error) {

        context.reply(`Error downloading file: ${error.message}`);

      }

    }

  },/**
    
 {name: 'facebook',
aliases: ['fbdl'],
category: 'downloader',

execute: async (sock, message, args, context) => {
  const text = args[0]; // take the first argument only

  if (!text) return context.reply(`*Please provide a Facebook video url!*`);

  try {
    var dlink = await fetchJson(`https://api-aswin-sparky.koyeb.app/api/downloader/fbdl?url=${text}`);

    if (!dlink.status || !dlink.data?.high) {
      return context.reply("❌ Could not fetch video. Please check the link.");
    }

    var dlurl = dlink.data.high;

    await sock.sendMessage(
      context.chatId,
      {
        video: { url: dlurl },
        caption: global.botName || "Gift md",
      },
      { quoted: message }
    );
  } catch (error) {
    console.error("Facebook download error:", error);
    context.reply("❌ Error downloading Facebook video. Please try again later.");
  }
},*/
  {

    name: 'gdrive',

    category: 'downloader',

    execute: async (sock, message, args, context) => {

      const text = args.slice(1).join(' ');

      if (!text) return context.reply("*Please provide a Google Drive file URL*");

      try {

        let response = await fetch(`https://api.siputzx.my.id/api/d/gdrive?url=${encodeURIComponent(text)}`);

        let data = await response.json();

        if (response.status !== 200 || !data.status || !data.data) {

          return context.reply("Please try again later or try another command!");

        } else {

          const downloadUrl = data.data.download;

          const filePath = path.join(__dirname, `${data.data.name}`);

          const writer = fs.createWriteStream(filePath);

          const fileResponse = await axios({

            url: downloadUrl,

            method: 'GET',

            responseType: 'stream'

          });

          fileResponse.data.pipe(writer);

          writer.on('finish', async () => {

            await sock.sendMessage(context.chatId, {

              document: { url: filePath },

              fileName: data.data.name,

              mimetype: fileResponse.headers['content-type']

            });

            fs.unlinkSync(filePath);

          });

          writer.on('error', (err) => {

            console.error('Error downloading the file:', err);

            context.reply("An error occurred while downloading the file.");

          });

        }

      } catch (error) {

        console.error('Error fetching Google Drive file details:', error);

        context.reply("❌ Error downloading Google Drive file. Please try again later.");

      }

    }

  },

  

  {

    name: 'gitclone',

    category: 'downloader',

    execute: async (sock, message, args, context) => {

      const text = args.slice(1).join(' ');

      if (!text)

        return context.reply(`GitHub link to clone?\nExample :\n${global.prefix}gitclone https://github.com/Dark-Xploit/CypherX`);

      

      if (!isUrl(text))

        return context.reply("Link invalid! Please provide a valid URL.");

      const regex1 = /(?:https|git)(?::\/\/|@)(www\.)?github\.com[\/:]([^\/:]+)\/(.+)/i;

      const [, , user, repo] = text.match(regex1) || [];

      

      if (!repo) {

        return context.reply("*Invalid GitHub link format. Please double-check the provided link.*");

      }

      

      const repoName = repo.replace(/.git$/, "");

      const url = `https://api.github.com/repos/${user}/${repoName}/zipball`;

      

      try {

        const response = await fetch(url, { method: "HEAD" });

        const filename = response.headers

          .get("content-disposition")

          .match(/attachment; filename=(.*)/)[1];

        

        await sock.sendMessage(

          context.chatId,

          {

            document: { url: url },

            fileName: filename + ".zip",

            mimetype: "application/zip",

          },

          { quoted: message }

        );

      } catch (err) {

        console.error(err);

        context.reply("❌ Error cloning repository. Please try again later.");

      }

    }

  },

  

  {

    name: 'image',

    aliases: ['img', 'pinterest'],

    category: 'downloader',

    execute: async (sock, message, args, context) => {

      const text = args.slice(1).join(' ');

      if (!text) return context.reply("*Please provide a search query*");

      try {

        let response = await fetch(`https://api.vreden.my.id/api/pinterest?query=${encodeURIComponent(text)}`);

        let data = await response.json();

        if (response.status !== 200 || !data.result || data.result.length === 0) {

          return context.reply("*No images found or API error. Please try again later or try another query!*");

        } else {

          const images = data.result.slice(0, 5);

          for (const imageUrl of images) {

            await sock.sendMessage(context.chatId, {

              image: { url: imageUrl },

              caption: `Search: ${text}`,

            });

            await new Promise(resolve => setTimeout(resolve, 500)); 

          }

        }

      } catch (error) {

        console.error('Error fetching images:', error);

        context.reply("❌ Error fetching images. Please try again later.");

      }

    }

  },

  

  {

    name: 'instagram',

    aliases: ['igdl'],

    category: 'downloader',

    execute: async (sock, message, args, context) => {

      const text = args.slice(1).join(' ');

      if (!text) return context.reply('*Please provide an Instagram URL!*');

      const apiUrl = `https://api.siputzx.my.id/api/d/igdl?url=${encodeURIComponent(text)}`;

      

      try {

        const response = await fetch(apiUrl);

        const data = await response.json();

        if (!data || data.url.length === 0) return context.reply('*Failed to retrieve the video!*');

        const videoUrl = data.url;

        const title = `Instagram Video`;

        await sock.sendMessage(context.chatId, {

          video: { url: videoUrl },

          mimetype: 'video/mp4',

          fileName: `${title}.mp4`

        }, { quoted: message });

      } catch (error) {

        console.error('Download command failed:', error);

        context.reply("❌ Error downloading Instagram video. Please try again later.");

      }

    }

  },

  

  {

    name: 'itunes',

    category: 'downloader',

    execute: async (sock, message, args, context) => {

      const text = args.slice(1).join(' ');

      if (!text) return context.reply("*Please provide a song name*");

      

      try {

        let res = await fetch(`https://api.popcat.xyz/itunes?q=${encodeURIComponent(text)}`);

        if (!res.ok) {

          throw new Error(`*API request failed with status ${res.status}*`);

        }

        let json = await res.json();

        let songInfo = `*Song Information:*\n

 • *Name:* ${json.name}\n

 • *Artist:* ${json.artist}\n

 • *Album:* ${json.album}\n

 • *Release Date:* ${json.release_date}\n

 • *Price:* ${json.price}\n

 • *Length:* ${json.length}\n

 • *Genre:* ${json.genre}\n

 • *URL:* ${json.url}`;

       

        if (json.thumbnail) {

          await sock.sendMessage(

            context.chatId,

            { image: { url: json.thumbnail }, caption: songInfo },

            { quoted: message }

          );

        } else {

          context.reply(songInfo);

        }

      } catch (error) {

        console.error(error);

        context.reply("❌ Error fetching iTunes info. Please try again later.");

      }

    }

  },

  

  {

    name: 'mediafire',

    category: 'downloader',

    execute: async (sock, message, args, context) => {

      const text = args.slice(1).join(' ');

      if (!text) return context.reply("*Please provide a MediaFire file URL*");

      try {

        let response = await fetch(`https://api.siputzx.my.id/api/d/mediafire?url=${encodeURIComponent(text)}`);

        let data = await response.json();

        if (response.status !== 200 || !data.status || !data.data) {

          return context.reply("*Please try again later or try another command!*");

        } else {

          const downloadUrl = data.data.downloadLink;

          const filePath = path.join(__dirname, `${data.data.fileName}.zip`);

          const writer = fs.createWriteStream(filePath);

          const fileResponse = await axios({

            url: downloadUrl,

            method: 'GET',

            responseType: 'stream'

          });

          fileResponse.data.pipe(writer);

          writer.on('finish', async () => {

            

            await sock.sendMessage(context.chatId, {

              document: { url: filePath },

              fileName: data.data.fileName,

              mimetype: 'application/zip'

            });

            fs.unlinkSync(filePath);

          });

          writer.on('error', (err) => {

            console.error('Error downloading the file:', err);

            context.reply("An error occurred while downloading the file.");

          });

        }

      } catch (error) {

        console.error('Error fetching MediaFire file details:', error);

        context.reply("❌ Error downloading MediaFire file. Please try again later.");

      }

    }

  },

  

  {

    name: 'song',

    category: 'downloader',

    execute: async (sock, message, args, context) => {

      const text = args.slice(1).join(' ');

      if (!text) return context.reply('*Please provide a song name!*');

      try {

        const search = await yts(text);

        if (!search || search.all.length === 0) return context.reply('*The song you are looking for was not found.*');

        const video = search.all[0];

        

        // Using a simple YouTube to MP3 API

        const apiUrl = `https://api.siputzx.my.id/api/d/ytmp3?url=${encodeURIComponent(video.url)}`;

        const response = await fetch(apiUrl);

        const data = await response.json();

        

        if (data.status && data.data?.downloadLink) {

          await sock.sendMessage(context.chatId, {

            audio: { url: data.data.downloadLink },

            mimetype: 'audio/mpeg',

            fileName: `${video.title}.mp3`

          }, { quoted: message });

        } else {

          throw new Error('API returned no download link');

        }

      } catch (error) {

        console.error('song command failed:', error);

        context.reply("❌ Error downloading song. Please try again later.");

      }

    }

  },
     {

    name: "play",

    aliases: ["p", "y"],

    category: "downloader",

    desc: "Download and send audio from YouTube",

    async execute(sock, msg, args, context) {

          await context.react('🎵');

        const from = msg.key.remoteJid;

        const text = args.slice(1).join(" ");

        

        if (!text) {

            return await context.reply("❌ What song do you want to download?\n\nExample: `.play spectre`");

        }

        try {

            const { videos } = await yts(text);

            if (!videos || videos.length === 0) {

                return await context.reply("❌ No songs found!");

            }

            await context.replyPlain("🎵 Please wait, fetching your song...");

            const video = videos[0];

            const urlYt = video.url;            

            // Try the Keith API

            const apiUrl = `https://apis-keith.vercel.app/download/dlmp3?url=${encodeURIComponent(urlYt)}`;

            const response = await axios.get(apiUrl, {

                timeout: 45000,

                headers: {

                    'User-Agent': 'WhatsApp-Bot/1.0'

                }

            });

           

            const data = response.data;

            // Check the correct path based on your debug output

            if (!data || !data.status) {

                return await context.replyPlain("❌ API returned an error status.");

            }

            

            if (!data.result || !data.result.success) {

                return await context.replyPlain("❌ API request was not successful.");

            }

            

            // The correct path is data.result.data.downloadUrl

            if (!data.result.data || !data.result.data.downloadUrl) {

                return await context.reply("❌ No download URL found in API response.");

            }

            // Format duration properly

            const formatDuration = (seconds) => {

                const mins = Math.floor(seconds / 60);

                const secs = seconds % 60;

                return `${mins}:${secs.toString().padStart(2, '0')}`;

            };

            // Format view count

            const formatViews = (views) => {

                return views ? views.toLocaleString() : 'Unknown';

            };

            // Create rich message format

            const title = data.result.data.title || video.title;

            const duration = formatDuration(video.duration.seconds);

            const views = formatViews(video.views);

            const author = video.author?.name || 'Unknown Artist';

            const thumbnail = video.thumbnail;

            

            await context.replyPlain({

                image: { url: thumbnail },

                caption: `🎵 ${title}

⏱️ Duration: ${duration}

👤 ${author}

👁️ ${views} views

🔗 ${urlYt}

Reply with:

🅰️ - For Audio Format 🎵

🇩 - For Document Format 📄`

            }, { quoted: msg });

            // Store the download info for later use when user replies

            global.playQueue = global.playQueue || {};

            global.playQueue[from] = {

                audioUrl: data.result.data.downloadUrl, // ✅ Fixed path

                title: title,

                urlYt: urlYt,

                audioSent: false,

                documentSent: false

            };

           

        } catch (error) {

            console.error('❌ Error in play command:', error);

            

            let errorMessage = "❌ Download failed. Please try again later.";

            

            if (error.code === 'ENOTFOUND') {

                errorMessage = "❌ Network error. Check your internet connection.";

            } else if (error.response?.status === 429) {

                errorMessage = "❌ Too many requests. Please wait a moment and try again.";

            } else if (error.message.includes('timeout')) {

                errorMessage = "❌ Request timeout. The server took too long to respond.";

            }

            await context.reply(errorMessage);

        }

    }

},
   {

    name: 'tiktok',

    aliases: ['tt', 'tiktokdl', 'tiktokvideo'],

    category: 'downloader',

    description: 'Download TikTok videos',

    usage: 'tiktok <tiktok_url>',

    

    async execute(sock, message, args, context) {

        try {

            const { chatId, reply, react } = context;

            

            // Check if message has already been processed

            if (processedMessages.has(message.key.id)) {

                return;

            }

            

            // Add message ID to processed set

            processedMessages.add(message.key.id);

            

            // Clean up old message IDs after 5 minutes

            setTimeout(() => {

                processedMessages.delete(message.key.id);

            }, 5 * 60 * 1000);

            // Get URL from args

            const url = args.slice(1).join(' ').trim();

            

            if (!url) {

                return await reply({

                    text: "❌ Please provide a TikTok link!\n\n📝 Usage: .tiktok <tiktok_url>",

                    ...channelInfo

                });

            }

            // Check for various TikTok URL formats

            const tiktokPatterns = [

                /https?:\/\/(?:www\.)?tiktok\.com\//,

                /https?:\/\/(?:vm\.)?tiktok\.com\//,

                /https?:\/\/(?:vt\.)?tiktok\.com\//,

                /https?:\/\/(?:www\.)?tiktok\.com\/@/,

                /https?:\/\/(?:www\.)?tiktok\.com\/t\//

            ];

            const isValidUrl = tiktokPatterns.some(pattern => pattern.test(url));

            

            if (!isValidUrl) {

                return await reply({

                    text: "❌ That is not a valid TikTok link!\n\n📝 Please provide a valid TikTok video link.",

                    ...channelInfo

                });

            }

            // Show processing reaction

            await react('🔄');

            try {

                // Try multiple APIs in sequence

                const apis = [

                    `https://api.princetechn.com/api/download/tiktok?apikey=prince&url=${encodeURIComponent(url)}`,

                    `https://api.princetechn.com/api/download/tiktokdlv2?apikey=prince&url=${encodeURIComponent(url)}`,

                    `https://api.princetechn.com/api/download/tiktokdlv3?apikey=prince&url=${encodeURIComponent(url)}`,

                    `https://api.princetechn.com/api/download/tiktokdlv4?apikey=prince&url=${encodeURIComponent(url)}`,

                    `https://api.dreaded.site/api/tiktok?url=${encodeURIComponent(url)}`

                ];

                let videoUrl = null;

                let audioUrl = null;

                let title = null;

                // Try each API until one works

                for (const apiUrl of apis) {

                    try {

                        const response = await axios.get(apiUrl, { timeout: 10000 });

                        

                        if (response.data) {

                            // Handle different API response formats

                            if (response.data.result && response.data.result.videoUrl) {

                                // PrinceTech API format

                                videoUrl = response.data.result.videoUrl;

                                audioUrl = response.data.result.audioUrl;

                                title = response.data.result.title;

                                break;

                            } else if (response.data.tiktok && response.data.tiktok.video) {

                                // Dreaded API format

                                videoUrl = response.data.tiktok.video;

                                break;

                            } else if (response.data.video) {

                                // Alternative format

                                videoUrl = response.data.video;

                                break;

                            }

                        }

                    } catch (apiError) {

                        console.error(`TikTok API failed: ${apiError.message}`);

                        continue;

                    }

                }

                // If no API worked, try the original ttdl method

                if (!videoUrl) {

                    let downloadData = await ttdl(url);

                    if (downloadData && downloadData.data && downloadData.data.length > 0) {

                        const mediaData = downloadData.data;

                        for (let i = 0; i < Math.min(20, mediaData.length); i++) {

                            const media = mediaData[i];

                            const mediaUrl = media.url;

                            // Check if URL ends with common video extensions

                            const isVideo = /\.(mp4|mov|avi|mkv|webm)$/i.test(mediaUrl) || 

                                          media.type === 'video';

                            if (isVideo) {

                                await reply({

                                    video: { url: mediaUrl },

                                    mimetype: "video/mp4",

                                    caption: "🎬 DOWNLOADED BY GIFT MD\n\n💫 TikTok Video Downloaded Successfully!"

                                });

                            } else {

                                await reply({

                                    image: { url: mediaUrl },

                                    caption: "🖼️ *DOWNLOADED BY GIFT MD\n\n💫 TikTok Image Downloaded Successfully!"

                                });

                            }

                        }

                        await react('✅');

                        return;

                    }

                }

                // Send the video if we got a URL from the APIs

                if (videoUrl) {

                    try {

                        // Download video as buffer

                        const videoResponse = await axios.get(videoUrl, {

                            responseType: 'arraybuffer',

                            timeout: 30000,

                            headers: {

                                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'

                            }

                        });

                        

                        const videoBuffer = Buffer.from(videoResponse.data);

                        

                        const caption = title ? 

                            `🎬 DOWNLOADED BY Gift Md\n\n📝 Title: ${title}\n💫 TikTok Video Downloaded Successfully!` : 

                            "🎬 DOWNLOADED BY Gift Md\n\n💫 TikTok Video Downloaded Successfully!";

                        

                        await reply({

                            video: videoBuffer,

                            mimetype: "video/mp4",

                            caption: caption

                        });

                        // If we have audio URL, download and send it as well

                        if (audioUrl) {

                            try {

                                const audioResponse = await axios.get(audioUrl, {

                                    responseType: 'arraybuffer',

                                    timeout: 30000,

                                    headers: {

                                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'

                                    }

                                });

                                

                                const audioBuffer = Buffer.from(audioResponse.data);

                                

                                await reply({

                                    audio: audioBuffer,

                                    mimetype: "audio/mp3",

                                    caption: "🎵 Audio from TikTok\n\n💫 Downloaded by GIFT MD"

                                });

                            } catch (audioError) {

                                console.error(`Failed to download audio: ${audioError.message}`);

                            }

                        }

                        

                        await react('✅');

                        return;

                        

                    } catch (downloadError) {

                        console.error(`Failed to download video: ${downloadError.message}`);

                        // Fallback to URL method

                        try {

                            const caption = title ? 

                                `🎬 DOWNLOADED BY GIFT MD\n\n📝 Title: ${title}\n💫 TikTok Video Downloaded Successfully!` : 

                                "🎬 DOWNLOADED BY GIFT MD\n\n💫 TikTok Video Downloaded Successfully!";

                            

                            await reply({

                                video: { url: videoUrl },

                                mimetype: "video/mp4",

                                caption: caption

                            });

                            

                            await react('✅');

                            return;

                            

                        } catch (urlError) {

                            console.error(`URL method also failed: ${urlError.message}`);

                        }

                    }

                }

                // If we reach here, no method worked

                await react('❌');

                return await reply({

                    text: "❌ Failed to download TikTok video!\n\n🔄 All download methods failed. Please try again with a different link or check if the video is available.",

                    ...channelInfo

                });

                

            } catch (error) {

                console.error('Error in TikTok download:', error);

                await react('❌');

                await reply({

                    text: "❌ Failed to download the TikTok video!\n\n🔄 Please try again with a different link.",

                    ...channelInfo

                });

            }

            

        } catch (error) {

            console.error('Error in TikTok command:', error);

            await context.react('❌');

            await context.reply({

                text: "❌ An error occurred while processing the request!\n\n🔄 Please try again later.",

                ...channelInfo

            });

        }

    }

}

];