const fetch = require('node-fetch');

module.exports = [
    {
    name: "bible",
    aliases: ["scripture", "verse"],
    category: "RELIGION",
    execute: async (sock, message, args, context) => {
        const BASE_URL = "https://bible-api.com";

        try {
            // React to the message
            await context.react("😝");

            let chapterInput = args.slice(1).join(" ").trim();
            if (!chapterInput) {
                throw new Error(`Please specify the chapter number or name. Example: ${global.prefix}bible John 3:16`);
            }
            
            chapterInput = encodeURIComponent(chapterInput);
            let chapterRes = await fetch(`${BASE_URL}/${chapterInput}`);
            
            if (!chapterRes.ok) {
                throw new Error(`Please specify the chapter number or name. Example: ${global.prefix}bible John 3:16`);
            }
            
            let chapterData = await chapterRes.json();
            let bibleChapter = `
The Holy Bible

Chapter ${chapterData.reference}

Type: ${chapterData.translation_name}
Number of verses: ${chapterData.verses.length}

Chapter Content:

${chapterData.text}
`;
            
            await context.replyPlain(bibleChapter);
            
        } catch (error) {
            await context.reply(`Error: ${error.message}`);
        }
    }
},
    {

    name: "quran",

    aliases: ["surah", "qur"],

    category: "RELIGION",

    execute: async (sock, message, args, context) => {

        try {

            // React to the message

            await context.react("🕋");

            let surahInput = args[1];

            if (!surahInput) {

                throw new Error(`Please specify the surah number or name`);

            }

            

            let surahListRes = await fetch("https://quran-endpoint.vercel.app/quran");

            let surahList = await surahListRes.json();

            let surahData = surahList.data.find(

                (surah) =>

                    surah.number === Number(surahInput) ||

                    surah.asma.ar.short.toLowerCase() === surahInput.toLowerCase() ||

                    surah.asma.en.short.toLowerCase() === surahInput.toLowerCase()

            );

            

            if (!surahData) {

                throw new Error(`Couldn't find surah with number or name "${surahInput}"`);

            }

            

            let res = await fetch(`https://quran-endpoint.vercel.app/quran/${surahData.number}`);

            if (!res.ok) {

                let error = await res.json();

                throw new Error(`API request failed with status ${res.status} and message ${error.message}`);

            }

            let json = await res.json();

            let quranSurah = `

Quran: The Holy Book

Surah ${json.data.number}: ${json.data.asma.ar.long} (${json.data.asma.en.long})

Type: ${json.data.type.en}

Number of verses: ${json.data.ayahCount}

Explanation:

${json.data.tafsir.id}`;

            

            await context.reply(quranSurah);

            // Send audio recitation if available

            if (json.data.recitation.full) {

                await sock.sendMessage(

                    context.chatId,

                    {

                        audio: { url: json.data.recitation.full },

                        mimetype: "audio/mp4",

                        ptt: true,

                        fileName: `recitation.mp3`,

                    },

                    { quoted: message }

                );

            }

            

        } catch (error) {

            await context.reply(`Error: ${error.message}`);

        }

    }

} ];