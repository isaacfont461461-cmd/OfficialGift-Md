const words = ['javascript', 'bot', 'hangman', 'whatsapp', 'nodejs'];

let hangmanGames = {};

module.exports =[
    {

    name: 'hangman',

    aliases: ['hang'],

    category: 'games',

    description: 'Play hangman word guessing game',

    usage: '.hangman or .hangman <letter>',

    execute: async (sock, message, args, context) => {

        const { reply, react, chatId } = context;

        if (!args[1]) {

            // Start new game

            const word = words[Math.floor(Math.random() * words.length)];

            const maskedWord = '_ '.repeat(word.length).trim();

            hangmanGames[chatId] = {

                word,

                maskedWord: maskedWord.split(' '),

                guessedLetters: [],

                wrongGuesses: 0,

                maxWrongGuesses: 6,

            };

            await react('🎯');

            await reply(`🎮 Game started! The word is: ${maskedWord}\n\nGuess letters using: .hangman <letter>`);

        } else {

            // Guess letter

            const letter = args[1].toLowerCase();

            if (!hangmanGames[chatId]) {

                return await reply('No game in progress. Start a new game with .hangman');

            }

            const game = hangmanGames[chatId];

            const { word, guessedLetters, maskedWord, maxWrongGuesses } = game;

            if (guessedLetters.includes(letter)) {

                return await reply(`You already guessed "${letter}". Try another letter.`);

            }

            guessedLetters.push(letter);

            if (word.includes(letter)) {

                for (let i = 0; i < word.length; i++) {

                    if (word[i] === letter) {

                        maskedWord[i] = letter;

                    }

                }

                await reply(`Good guess! ${maskedWord.join(' ')}`);

                if (!maskedWord.includes('_')) {

                    await reply(`🎉 Congratulations! You guessed the word: ${word}`);

                    delete hangmanGames[chatId];

                }

            } else {

                game.wrongGuesses += 1;

                await reply(`Wrong guess! You have ${maxWrongGuesses - game.wrongGuesses} tries left.`);

                if (game.wrongGuesses >= maxWrongGuesses) {

                    await reply(`💀 Game over! The word was: ${word}`);

                    delete hangmanGames[chatId];

                }

            }

        }

    }

}
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    ];