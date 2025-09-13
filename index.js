const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const chalk = require('chalk');
// ======== MANAGER MODE ========//
if (!process.argv.includes('--bot')) {
    let botProcess;
    let isRestarting = false; // Add restart flag

    // âœ… Run updater before starting bot
    async function runUpdater() {
        try {
            const updater = require('./commands/updater'); // your updater.js
            if (typeof updater.update === 'function') {
                console.log(chalk.cyan('[GIFT-MD] ðŸ”„ Running updater!...'));
                await updater.update(); // run update function
                console.log(chalk.green('[GIFT-MD] âœ… Update check complete.'));
            } else {
                console.log(chalk.yellow('[GIFT-MD] âš ï¸ Updater has no function skipping.'));
            }
        } catch (err) {
            console.error(chalk.red('[GIFT-MD] âŒ Failed to run updater:'), err);
        }
    }

    async function start() {
        if (isRestarting) {
            console.log("[GIFT-MD] Already restarting, please wait...");
            return;
        }

        await runUpdater(); // <--- run updater first

        let args = [path.join(__dirname, 'index.js'), '--bot', ...process.argv.slice(2)];
        botProcess = spawn(process.argv[1], args, {
            stdio: ['inherit', 'inherit', 'inherit', 'ipc']
        });

        botProcess.on('exit', (code) => {
            console.log(`[GIFT-MD] exited with code ${code}`);
            
            // âœ… Auto-restart on unexpected exit (but not during manual restart)
            if (!isRestarting && code !== 0) {
                console.log("[GIFT-MD] Unexpected exit, restarting in 3 seconds...");
                setTimeout(() => {
                    start();
                }, 3000);
            } else if (isRestarting) {
                // Manual restart - start immediately after proper exit
                isRestarting = false;
                console.log("[GIFT-MD] Restarting now...");
                setTimeout(() => {
                    start();
                }, 1000);
            }
        });

        botProcess.on('error', (error) => {
            console.error('[GIFT-MD] Process error:', error);
        });

        console.log("[GIFT-MD] started with PID:", botProcess.pid);
    }

    global.restart = function () {
        if (isRestarting) {
            console.log("[GIFT-MD] Restart already in progress...");
            return;
        }

        isRestarting = true;
        
        if (botProcess && !botProcess.killed) {
            console.log("[GIFT-MD] Gracefully stopping bot...");
            
            // Try graceful shutdown first
            botProcess.kill('SIGTERM');
            
            // Force kill after 5 seconds if not stopped
            setTimeout(() => {
                if (botProcess && !botProcess.killed) {
                    console.log("[GIFT-MD] Force killing bot...");
                    botProcess.kill('SIGKILL');
                }
            }, 5000);
            
        } else {
            console.log("[GIFT-MD] No bot process running. Starting new one...");
            isRestarting = false;
            start();
        }
    };

    // âœ… Graceful shutdown on process signals
    process.on('SIGINT', () => {
        console.log('\n[GIFT-MD] Received SIGINT, shutting down gracefully...');
        if (botProcess) {
            botProcess.kill('SIGTERM');
        }
        process.exit(0);
    });

    process.on('SIGTERM', () => {
        console.log('[GIFT-MD] Received SIGTERM, shutting down gracefully...');
        if (botProcess) {
            botProcess.kill('SIGTERM');
        }
        process.exit(0);
    });

    start();
    return; // stop here in manager mode
}
//=========== BOT MODE==========//
require('./settings')
const { channelInfo } = require('./lib/messageConfig')
const { Boom } = require('@hapi/boom')
const currentPrefix = (global.prefix === undefined || global.prefix === null) ? '.' : global.prefix;
const FileType = require('file-type')
const axios = require('axios')
const { handleMessages, handleGroupParticipantUpdate, handleStatus,restorePresenceSettings, initializeCallHandler } = require('./main');

const PhoneNumber = require('awesome-phonenumber')
const { imageToWebp, videoToWebp, writeExifImg, writeExifVid } = require('./lib/exif')
const { smsg, isUrl, generateMessageTag, getBuffer, getSizeMedia, fetch, await, sleep, reSize } = require('./lib/myfunc')
const { 
    default: makeWASocket,
    useMultiFileAuthState, 
    DisconnectReason, 
    fetchLatestBaileysVersion,
    generateForwardMessageContent,
    prepareWAMessageMedia,
    generateWAMessageFromContent,
    generateMessageID,
    downloadContentFromMessage,
    jidDecode,
    proto,
    jidNormalizedUser,
    makeCacheableSignalKeyStore,
    delay
} = require("@whiskeysockets/baileys")
const NodeCache = require("node-cache")
const pino = require("pino")
const readline = require("readline")
const { parsePhoneNumber } = require("libphonenumber-js")
const { PHONENUMBER_MCC } = require('@whiskeysockets/baileys/lib/Utils/generics')
const { rmSync, existsSync } = require('fs')
const { join } = require('path')
// Create a store object with required methods
console.log(chalk.cyan('â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”“'))
    console.log(chalk.cyan('â”ƒ') + chalk.white.bold('          ðŸ¤– GIFT MD BOT STARTING...        ') + chalk.cyan(' â”ƒ'))
    console.log(chalk.cyan('â”—â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”›'))
const store = {
    messages: {},
    contacts: {},
    chats: {},
    groupMetadata: async (jid) => {
        return {}
    },
    bind: function(ev) {
        // Handle events
        ev.on('messages.upsert', ({ messages }) => {
            messages.forEach(msg => {
                if (msg.key && msg.key.remoteJid) {
                    this.messages[msg.key.remoteJid] = this.messages[msg.key.remoteJid] || {}
                    this.messages[msg.key.remoteJid][msg.key.id] = msg
                }
            })
        })
        
        ev.on('contacts.update', (contacts) => {
            contacts.forEach(contact => {
                if (contact.id) {
                    this.contacts[contact.id] = contact
                }
            })
        })
        
        ev.on('chats.set', (chats) => {
            this.chats = chats
        })
    },
    loadMessage: async (jid, id) => {
        return this.messages[jid]?.[id] || null
    }
}

let phoneNumber = "911234567890"
let owner = JSON.parse(fs.readFileSync('./data/owner.json'))

global.botname = "KNIGHT BOT"
global.themeemoji = "â€¢"

const settings = require('./settings')
const pairingCode = !!phoneNumber || process.argv.includes("--pairing-code")
const useMobile = process.argv.includes("--mobile")

// Only create readline interface if we're in an interactive environment
const rl = process.stdin.isTTY ? readline.createInterface({ input: process.stdin, output: process.stdout }) : null
const question = (text) => {
    if (rl) {
        return new Promise((resolve) => rl.question(text, resolve))
    } else {
        // In non-interactive environment, use ownerNumber from settings
        return Promise.resolve(settings.ownerNumber || phoneNumber)
    }
}

         
async function startXeonBotInc() {
    let { version, isLatest } = await fetchLatestBaileysVersion()
    const { state, saveCreds } = await useMultiFileAuthState(`./session`)
    const msgRetryCounterCache = new NodeCache()

    const XeonBotInc = makeWASocket({
        version,
        logger: pino({ level: 'fatal' }),
        printQRInTerminal: !pairingCode,
        browser: ["Ubuntu", "Chrome", "20.0.04"],
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" })),
        },
        markOnlineOnConnect: true,
        generateHighQualityLinkPreview: true,
        getMessage: async (key) => {
            let jid = jidNormalizedUser(key.remoteJid)
            let msg = await store.loadMessage(jid, key.id)
            return msg?.message || ""
        },
        msgRetryCounterCache,
        defaultQueryTimeoutMs: undefined,
    })

    store.bind(XeonBotInc.ev)

    // Message handling
    XeonBotInc.ev.on('messages.upsert', async chatUpdate => {
        try {
            const mek = chatUpdate.messages[0]
            if (!mek.message) return
            mek.message = (Object.keys(mek.message)[0] === 'ephemeralMessage') ? mek.message.ephemeralMessage.message : mek.message
            if (mek.key && mek.key.remoteJid === 'status@broadcast') {
                await handleStatus(XeonBotInc, chatUpdate);
                return;
            }
            if (!XeonBotInc.public && !mek.key.fromMe && chatUpdate.type === 'notify') return
            if (mek.key.id.startsWith('BAE5') && mek.key.id.length === 16) return
            
            try {
                await handleMessages(XeonBotInc, chatUpdate, true)
            } catch (err) {
                console.error("Error in handleMessages:", err)
                // Only try to send error message if we have a valid chatId
                if (mek.key && mek.key.remoteJid) {
                    await XeonBotInc.sendMessage(mek.key.remoteJid, { 
                        text: 'âŒ An error occurred while processing your message.',
                    ...channelInfo 
                    }).catch(console.error);
                }
            }
        } catch (err) {
            console.error("Error in messages.upsert:", err)
        }
    })

    // Add these event handlers for better functionality
    XeonBotInc.decodeJid = (jid) => {
        if (!jid) return jid
        if (/:\d+@/gi.test(jid)) {
            let decode = jidDecode(jid) || {}
            return decode.user && decode.server && decode.user + '@' + decode.server || jid
        } else return jid
    }

    XeonBotInc.ev.on('contacts.update', update => {
        for (let contact of update) {
            let id = XeonBotInc.decodeJid(contact.id)
            if (store && store.contacts) store.contacts[id] = { id, name: contact.notify }
        }
    })

    XeonBotInc.getName = (jid, withoutContact = false) => {
        id = XeonBotInc.decodeJid(jid)
        withoutContact = XeonBotInc.withoutContact || withoutContact 
        let v
        if (id.endsWith("@g.us")) return new Promise(async (resolve) => {
            v = store.contacts[id] || {}
            if (!(v.name || v.subject)) v = XeonBotInc.groupMetadata(id) || {}
            resolve(v.name || v.subject || PhoneNumber('+' + id.replace('@s.whatsapp.net', '')).getNumber('international'))
        })
        else v = id === '0@s.whatsapp.net' ? {
            id,
            name: 'WhatsApp'
        } : id === XeonBotInc.decodeJid(XeonBotInc.user.id) ?
            XeonBotInc.user :
            (store.contacts[id] || {})
        return (withoutContact ? '' : v.name) || v.subject || v.verifiedName || PhoneNumber('+' + jid.replace('@s.whatsapp.net', '')).getNumber('international')
    }

    XeonBotInc.public = true

    XeonBotInc.serializeM = (m) => smsg(XeonBotInc, m, store)

    // Handle pairing code
    if (pairingCode && !XeonBotInc.authState.creds.registered) {
        if (useMobile) throw new Error('Cannot use pairing code with mobile api')

        let phoneNumber
        if (!!global.phoneNumber) {
            phoneNumber = global.phoneNumber
        } else {
            phoneNumber = await question(chalk.bgBlack(chalk.greenBright(`Please type your WhatsApp number ðŸ˜\nFormat: 6281376552730 (without + or spaces) : `)))
        }

        // Clean the phone number - remove any non-digit characters
        phoneNumber = phoneNumber.replace(/[^0-9]/g, '')

        // Validate the phone number using awesome-phonenumber
        const pn = require('awesome-phonenumber');
        if (!pn('+' + phoneNumber).isValid()) {
            console.log(chalk.red('Invalid phone number. Please enter your full international number (e.g., 15551234567 for US, 447911123456 for UK, etc.) without + or spaces.'));
            process.exit(1);
        }

        setTimeout(async () => {
            try {
                let code = await XeonBotInc.requestPairingCode(phoneNumber)
                    code = code?.match(/.{1,4}/g)?.join("-") || code

                    console.log('')
                    console.log(chalk.green('â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”“'))
                    console.log(chalk.green('â”ƒ') + chalk.white.bold('              PAIRING CODE               ') + chalk.green('â”ƒ'))
                    console.log(chalk.green('â”—â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”›'))
                    console.log('')
                    console.log(chalk.cyan.bold(`    ${code}    `))
                    console.log('')
                    console.log(chalk.yellow('ðŸ“± How to link your WhatsApp:'))
                    console.log(chalk.white('1. Open WhatsApp on your phone'))
                    console.log(chalk.white('2. Go to Settings > Linked Devices'))
                    console.log(chalk.white('3. Tap "Link a Device"'))
                    console.log(chalk.white('4. Enter the code: ') + chalk.green.bold(code))
                    console.log('')
                    console.log(chalk.cyan.bold('â±ï¸  Code expires in 1 minute'))
                    console.log('')

                } catch (error) {
                    console.error('')
                    console.log(chalk.red('âŒ Failed to generate pairing code'))
                    console.log(chalk.yellow('Error details:'), error.message)
                    console.log(chalk.gray('Please check your internet connection and try again'))
                    process.exit(1)
                }
            }, 3000)
        }

    // Connection handling
    XeonBotInc.ev.on('connection.update', async (s) => {
        const { connection, lastDisconnect } = s
        if (connection == "open") {
            console.log(chalk.green('â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”“'))
                console.log(chalk.green('â”ƒ') + chalk.white.bold('          âœ… CONNECTION SUCCESSFUL!        ') + chalk.green('â”ƒ'))
                console.log(chalk.green('â”—â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”›'))
                console.log('') 
                
    // Try to extract lid number from the lid property

    if (XeonBotInc.user.lid) {

        global.ownerLid = XeonBotInc.user.lid.split(':')[0]; // Get number before ':'

        console.log(chalk.cyan(`ðŸ†” Owner LID captured: ${global.ownerLid}`));

    }
      
            global.sock = XeonBotInc; // âœ… Make socket available globally for autobio & other features
            const botNumber = XeonBotInc.user.id.split(':')[0] + '@s.whatsapp.net';
            await XeonBotInc.sendMessage(botNumber, { 
                text: `ðŸ¤– Bot Connected Successfully!\n\nâ° Time: ${new Date().toLocaleString()}\nâœ… Status: Online and Ready!\nCurrent prefix is: ${currentPrefix}
                \nâœ…Make sure to join below channel`,
                ...channelInfo
            });

            await delay(1999)
                console.log(chalk.cyan('â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”'))
                console.log(chalk.cyan('â”‚')+ chalk.bold.blue('                 â”‚ GIFT-MD â”‚'))
                console.log(chalk.cyan('â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜'))
                console.log(chalk.cyan('â”‚ ') + chalk.white('â€¢ Bot Status: ') + chalk.green('Connected Successfully âœ…') + chalk.cyan('        â”‚'))
console.log(chalk.cyan('â”‚ ') + chalk.white('â€¢ Owner: ') + chalk.yellow(owner) + chalk.cyan('          â”‚'))
                console.log(chalk.cyan('â”‚ ') + chalk.white('â€¢ Phone: ') + chalk.yellow(XeonBotInc.user.id.split(':')[0]) + chalk.cyan('                        â”‚'))
                console.log(chalk.cyan('â”‚ ') + chalk.white('â€¢ Time: ') + chalk.yellow(new Date().toLocaleString()) + chalk.cyan('                 â”‚'))
                console.log(chalk.cyan('â”‚ ') + chalk.white('â€¢ Commands: Send .listcmd to see available CMD') + chalk.cyan('â”‚'))
                console.log(chalk.cyan('â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜'))
                console.log('')
initializeCallHandler(XeonBotInc);            
restorePresenceSettings(XeonBotInc);
        }
        if (
            connection === "close" &&
            lastDisconnect &&
            lastDisconnect.error &&
            lastDisconnect.error.output.statusCode != 401
        ) {
            startXeonBotInc()
        }
    })

    XeonBotInc.ev.on('creds.update', saveCreds)
    
    XeonBotInc.ev.on('group-participants.update', async (update) => {
        await handleGroupParticipantUpdate(XeonBotInc, update);
    });

    XeonBotInc.ev.on('messages.upsert', async (m) => {
        if (m.messages[0].key && m.messages[0].key.remoteJid === 'status@broadcast') {
            await handleStatus(XeonBotInc, m);
        }
    });

    XeonBotInc.ev.on('status.update', async (status) => {
        await handleStatus(XeonBotInc, status);
    });

    XeonBotInc.ev.on('messages.reaction', async (status) => {
        await handleStatus(XeonBotInc, status);
    });

    return XeonBotInc
}


// Start the bot with error handling
startXeonBotInc().catch(error => {
    console.error('Fatal error:', error)
    process.exit(1)
})
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err)
})

process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err)
})
