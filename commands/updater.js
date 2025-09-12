// commands/updater.js
const fetch = require('node-fetch');
const axios = require('axios');
const moment = require('moment-timezone');
const  version  = global.version
const { getLatestVersion } = require("../lib/getLatestVersion");
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');

// Simple commit hash storage (you can integrate with your database later)
const COMMIT_FILE = './data/commit-hash.txt';

function getCommitHash() {
    try {
        if (fs.existsSync(COMMIT_FILE)) {
            return fs.readFileSync(COMMIT_FILE, 'utf8').trim();
        }
        return null;
    } catch (error) {
        console.error('Error reading commit hash:', error);
        return null;
    }
}

function setCommitHash(hash) {
    try {
        const dataDir = path.dirname(COMMIT_FILE);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        fs.writeFileSync(COMMIT_FILE, hash);
        return true;
    } catch (error) {
        console.error('Error saving commit hash:', error);
        return false;
    }
}

module.exports = [
    {
        name: 'update',
        aliases: ['upgrade', 'sync'],
        category: 'owner',
        description: 'Update the bot to the latest version',
        usage: '.update',
        
        execute: async (sock, message, args, context) => {
            const { chatId, senderIsSudo } = context;
            
            // Check if sender is owner or sudo
            if (!message.key.fromMe && !senderIsSudo) {
                return await context.reply('❌ This command is only for the bot owner.');
            }

            try {
                // Initial update check message
                await context.replyPlain('🔍 Checking for bot updates...');

                // Replace with your GitHub repo URL
                const REPO_OWNER = 'isaacfont461461-cmd';
                const REPO_NAME = 'OfficialGift-Md';
                const BRANCH = 'main'; // or 'master'

                // Fetch the latest commit hash from GitHub
                const { data: commitData } = await axios.get(
                    `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/commits/${BRANCH}`,
                    {
                        headers: {
                            'User-Agent': 'WhatsApp-Bot-Updater'
                        }
                    }
                );
                
                const latestCommitHash = commitData.sha;
                const currentHash = getCommitHash();

                if (latestCommitHash === currentHash) {
                    return await context.reply('✅ Bot is already up-to-date!');
                }

                // Update progress message
                await context.reply('🚀 Updating Bot...\n\nThis may take a few moments...');

                // Download the latest code
                const zipPath = path.join(__dirname, '../tmp/latest.zip');
                const tempDir = path.dirname(zipPath);
                
                // Ensure tmp directory exists
                if (!fs.existsSync(tempDir)) {
                    fs.mkdirSync(tempDir, { recursive: true });
                }

                const { data: zipData } = await axios.get(
                    `https://github.com/${REPO_OWNER}/${REPO_NAME}/archive/${BRANCH}.zip`,
                    { 
                        responseType: 'arraybuffer',
                        headers: {
                            'User-Agent': 'WhatsApp-Bot-Updater'
                        }
                    }
                );
                
                fs.writeFileSync(zipPath, zipData);

                // Extract ZIP file
                await context.reply('📦 Extracting the latest code...');

                const extractPath = path.join(__dirname, '../tmp/latest');
                const zip = new AdmZip(zipPath);
                zip.extractAllTo(extractPath, true);

                // Copy updated files
                await context.reply('🔄 Replacing files while preserving your config...');

                const sourcePath = path.join(extractPath, `${REPO_NAME}-${BRANCH}`);
                const destinationPath = path.join(__dirname, '..');
                
                copyFolderSync(sourcePath, destinationPath);

                // Save the latest commit hash
                setCommitHash(latestCommitHash);

                // Cleanup
                fs.unlinkSync(zipPath);
                fs.rmSync(extractPath, { recursive: true, force: true });

                // Progress simulation
                let progressMsg = await context.reply('🔄 Installing updates: [▒▒▒▒▒▒▒▒] 0%');
                
                const progressStages = [
                    '🔄 Installing updates: [████▒▒▒▒] 40%',
                    '🔄 Installing updates: [██████▒▒] 70%',
                    '🔄 Installing updates: [████████] 100%'
                ];
                
                for (const progress of progressStages) {
                    await new Promise(resolve => setTimeout(resolve, 800));
                    await context.reply(progress);
                }

                // Final success message
                await context.reply(
                    '✅ Update complete!\n\n' +
                    'Restarting the bot to apply changes...\n\n' +
                    '⚡ Powered by Gift MD'
                );

       // Restart the bot safely
setTimeout(() => {
    if (typeof global.restart === "function") {
        console.log("🔄 Restarting bot using manager restart()");
        global.restart();
    } else {
        console.log("⚠️ Manager not found. Exiting process...");
        process.exit(0); // fallback (PM2 / hosting panel will restart)
    }
}, 2000);
                
            } catch (error) {
                console.error('Update error:', error);
                await context.reply(
                    `❌ Update failed!\n\n` +
                    `Error: ${error.message}\n\n` +
                    `Please try manually or contact support.`
                );
            }
        }
    },

    {
        name: 'checkupdate',
        aliases: ['checkupgrade', 'updatecheck'],
        category: 'owner',
        description: 'Check if there are any updates available',
        usage: '.checkupdate',
        
        execute: async (sock, message, args, context) => {
            const { chatId, senderIsSudo } = context;
            
            // Check if sender is owner or sudo
            if (!message.key.fromMe && !senderIsSudo) {
                return await context.reply('❌ This command is only for the bot owner.');
            }

            try {
                // Initial check message
                await context.reply('🔍 Checking for bot updates...');

                // Replace with your GitHub repo URL
                const REPO_OWNER = 'isaacfont461461-cmd';
                const REPO_NAME = 'OfficialGift-Md';
                const BRANCH = 'main'; // or 'master'

                // Fetch the latest commit info from GitHub
                const { data: commitData } = await axios.get(
                    `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/commits/${BRANCH}`,
                    {
                        headers: {
                            'User-Agent': 'WhatsApp-Bot-Updater'
                        }
                    }
                );
                
                const latestCommitHash = commitData.sha;
                const latestCommitMessage = commitData.commit.message;
                const commitDate = new Date(commitData.commit.committer.date).toLocaleString();
                const author = commitData.commit.author.name;
                
                const currentHash = getCommitHash();
                const latestVersion = await getLatestVersion();

                if (latestCommitHash === currentHash) {
                    return await context.reply(
                        `✅ Bot is up-to-date!\n\n` +
                        `Current Version: \`${latestVersion || 'Unknown'}\`\n` +
                        `Last Commit: ${latestCommitMessage}\n` +
                        `Date: ${commitDate}\n` +
                        `Author: ${author}`
                    );
                }

                // Get commit comparison to show what's new
                let changelog = '';
                try {
                    const { data: compareData } = await axios.get(
                        `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/compare/${currentHash}...${latestCommitHash}`,
                        {
                            headers: {
                                'User-Agent': 'WhatsApp-Bot-Updater'
                            }
                        }
                    );
                    
                    if (compareData.commits && compareData.commits.length > 0) {
                        changelog = '\n\nWhat\'s New:\n';
                        compareData.commits.slice(0, 5).forEach(commit => {
                            changelog += `• ${commit.commit.message.split('\n')[0]}\n`;
                        });
                        
                        if (compareData.commits.length > 5) {
                            changelog += `• ...and ${compareData.commits.length - 5} more changes\n`;
                        }
                    }
                } catch (error) {
                    console.log('Could not fetch detailed changelog:', error.message);
                }
await context.reply(
    `🆕 Update Available!\n\n` +
    `Current Version: \`${global.version || 'Unknown'}\`\n` +
    `Latest Version: \`${latestVersion || 'Unknown'}\`\n` +
    `Last Commit: ${latestCommitMessage}\n` +
    `Date: ${commitDate}\n` +
    `Author: ${author}${changelog}\n\n` +
    `Use .update to install the latest version.`
);
            } catch (error) {
                console.error('Update check error:', error);
                await context.reply(
                    `❌ Failed to check for updates!\n\n` +
                    `Error: ${error.message}\n\n` +
                    `Please try again later.`
                );
            }
        }
    },
    {
    name: "github",
    aliases: ["repo","script"],
    description: "Get GIFT MD repository information",
    category: "UTILITY MENU",
    usage: ".github",
    
    async execute(sock, m, args, context) {
        try {
            const chatId = m.key.remoteJid;
            
            // First send "loading" message
            let loadingMsg = await context.replyPlain( { text: '📦 Getting GIFT MD repo info...' }, { quoted: m });
                await context.react('♻️');
            // Fetch repo info
            const res = await fetch('https://api.github.com/repos/isaacfont461461-cmd/OfficialGift-Md', {
                headers: { 'User-Agent': 'Gift-MD-Bot' }
            });

            if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);

            const repo = await res.json();

            let caption = `📦 GIFT MD REPO INFO 📦\n\n`;
            caption += `🔹Name : ${repo.name}\n`;
            caption += `🔹Owner : ${repo.owner.login}\n`;
            caption += `🔹Private : ${repo.private ? 'Yes 🔒' : 'No 🌐'}\n`;
            caption += `🔹Size : ${(repo.size / 1024).toFixed(2)} MB\n`;
            caption += `🔹Stars : ${repo.stargazers_count}\n`;
            caption += `🔹Forks : ${repo.forks_count}\n`;
            caption += `🔹Watchers : ${repo.watchers_count}\n`;
            caption += `🔹Last Updated : ${moment(repo.updated_at).format('DD/MM/YY - HH:mm:ss')}\n`;
            caption += `🔹URL : ${repo.html_url}\n\n`;
            caption += `⭐Don't forget to star the repo!`;

            // ✅ Edit the "loading" message with repo info
            await context.replyPlain( { 
                text: caption, 
                edit: loadingMsg.key 
            });
            await context.react('🤠');
            // ✅ Now download the repo zip
            const zipUrl = `https://github.com/isaacfont461461-cmd/OfficialGift-Md/archive/refs/heads/main.zip`;
            const zipPath = path.join(__dirname, "../tmp/repo.zip");
            fs.mkdirSync(path.dirname(zipPath), { recursive: true });

            const response = await axios.get(zipUrl, {
                responseType: "arraybuffer",
                headers: { "User-Agent": "Gift-MD" }
            });

            fs.writeFileSync(zipPath, response.data);

            // Send ZIP as document
            await context.replyPlain( {
                document: fs.readFileSync(zipPath),
                mimetype: "application/zip",
                fileName: `${repo.name}.zip`
            }, { quoted: loadingMsg });

            // Cleanup
            fs.unlinkSync(zipPath);

        } catch (error) {
            console.error('❌ GitHub Command Error:', error);
            await sock.sendMessage(m.key.remoteJid, { text: '❌ Failed to fetch repository information. Please try again later.' }, { quoted: m });
        }
    }
    }
];

// Improved directory copy function
function copyFolderSync(source, target) {
    if (!fs.existsSync(target)) {
        fs.mkdirSync(target, { recursive: true });
    }

    const items = fs.readdirSync(source);
    for (const item of items) {
        const srcPath = path.join(source, item);
        const destPath = path.join(target, item);

        // Skip sensitive files - ADD YOUR IMPORTANT FILES HERE
        const preservedFiles = [
            'settings.js', 
            'data',
            'node_modules',
            '.git',
            'session',
            'tmp'
        ];
        
        if (preservedFiles.includes(item)) {
            continue;
        }

        try {
            const stat = fs.lstatSync(srcPath);
            if (stat.isDirectory()) {
                copyFolderSync(srcPath, destPath);
            } else {
                fs.copyFileSync(srcPath, destPath);
            }
        } catch (copyError) {
            console.error(`Failed to copy ${item}:`, copyError);
        }
    }
}
// Pre-start lightweight updater for manager mode

module.exports.update = async function () {    

    console.log(chalk.cyan("[GIFT-MD]⚡ Checking For Update..."));
    const COMMIT_FILE = './data/commit-hash.txt';
    const REPO_OWNER = 'isaacfont461461-cmd';

    const REPO_NAME = 'OfficialGift-Md';

    const BRANCH = 'main';

    // Get saved commit hash

    let currentHash = null;

    try {

        if (fs.existsSync(COMMIT_FILE)) {

            currentHash = fs.readFileSync(COMMIT_FILE, 'utf8').trim();

        }

    } catch (err) {

        console.error("⚠️ Could not read commit hash:", err.message);

    }

    try {

        // Get latest commit hash from GitHub

        const { data: commitData } = await axios.get(

            `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/commits/${BRANCH}`,

            { headers: { 'User-Agent': 'Gift-MD-Updater' } }

        );

        const latestCommitHash = commitData.sha;

        if (latestCommitHash === currentHash) {

            console.log("[GIFT-MD] Is already up-to-date!");

            return;

        }

        console.log(chalk.gold("[GIFT-MD] 🚀 Update found! Downoading..."));

        // Download zip

        const zipPath = path.join(__dirname, '../tmp/latest.zip');

        fs.mkdirSync(path.dirname(zipPath), { recursive: true });

        const { data: zipData } = await axios.get(

            `https://github.com/${REPO_OWNER}/${REPO_NAME}/archive/${BRANCH}.zip`,

            { responseType: 'arraybuffer' }

        );

        fs.writeFileSync(zipPath, zipData);

        // Extract

        const extractPath = path.join(__dirname, '../tmp/latest');

        const zip = new AdmZip(zipPath);

        zip.extractAllTo(extractPath, true);

        // Copy files

        const sourcePath = path.join(extractPath, `${REPO_NAME}-${BRANCH}`);

        const destinationPath = path.join(__dirname, '..');

        copyFolderSync(sourcePath, destinationPath);

        // Save commit hash

        fs.writeFileSync(COMMIT_FILE, latestCommitHash);

        console.log("[GIFT-MD] Updated Successful!");

    // Run commands cleanup after update
 await cleanupCommands();
        
        // Cleanup

        fs.unlinkSync(zipPath);

        fs.rmSync(extractPath, { recursive: true, force: true });

    } catch (error) {

        console.error("❌ Pre-start updater failed:", error.message);

    }

};

// ======= COMMANDS PROTECTION SYSTEM =======

const COMMANDS_DIR = path.join(__dirname);

// Get list of command files from GitHub

async function getGitHubCommandsList() {

    try {

        const REPO_OWNER = 'isaacfont461461-cmd';

        const REPO_NAME = 'OfficialGift-Md';

        

        const { data } = await axios.get(

            `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/commands`,

            {

                headers: {

                    'User-Agent': 'GIFT-MD-Commands-Protector'

                }

            }

        );

        

        return data

            .filter(file => file.type === 'file' && file.name.endsWith('.js'))

            .map(file => ({

                name: file.name,

                downloadUrl: file.download_url,

                sha: file.sha

            }));

    } catch (error) {

        console.error('❌ Failed to fetch GitHub commands:', error.message);

        return [];

    }

}

// Download missing command from GitHub

async function downloadMissingCommand(file) {

    try {

        const { data } = await axios.get(file.downloadUrl, {

            headers: { 'User-Agent': 'GIFT-MD-Commands-Protector' }

        });

        

        const filePath = path.join(COMMANDS_DIR, file.name);

        fs.writeFileSync(filePath, data);

        

        return true;

    } catch (error) {

        console.error(`❌ Failed to download ${file.name}:`, error.message);

        return false;

    }

}

// Main cleanup function

async function cleanupCommands() {

    try {

        console.log(chalk.cyan('[GIFT-MD] Running commands protection cleanup...'));

        

        // Get GitHub commands list

        const githubCommands = await getGitHubCommandsList();

        if (githubCommands.length === 0) {

            console.log('⚠️ Could not fetch GitHub commands list');

            return false;

        }

        

        const githubFileNames = githubCommands.map(cmd => cmd.name);

        

        

        // Get local commands

        const localFiles = fs.readdirSync(COMMANDS_DIR)

            .filter(file => file.endsWith('.js') && file !== 'updater.js'); // Don't delete updater.js

        

        

        

        // Delete unauthorized files

        let deletedCount = 0;

        for (const localFile of localFiles) {

            if (!githubFileNames.includes(localFile)) {

                try {

                    const filePath = path.join(COMMANDS_DIR, localFile);

                    fs.unlinkSync(filePath);

                    

                    deletedCount++;

                } catch (error) {

                    console.error(`❌ Failed to delete ${localFile}:`, error.message);

                }

            }

        }

        

        // Download missing GitHub files

        let downloadedCount = 0;

        for (const githubFile of githubCommands) {

            if (!localFiles.includes(githubFile.name)) {

                const success = await downloadMissingCommand(githubFile);

                if (success) downloadedCount++;

            }

        }

        

        console.log(`[GIFT-MD] Protection complete: Deleted ${deletedCount} unauthorized files, Downloaded ${downloadedCount} missing files`);

        return true;

        

    } catch (error) {

        console.error('❌ Commands cleanup failed:', error.message);

        return false;

    }

}

// Real-time protection - watches for new files

function startRealtimeProtection() {

    if (!fs.existsSync(COMMANDS_DIR)) return;

    const watcher = fs.watch(COMMANDS_DIR, (eventType, filename) => {

        if (filename && filename.endsWith('.js') && filename !== 'updater.js') {

            if (eventType === 'rename') { // File added or renamed

                setTimeout(async () => {

                    const filePath = path.join(COMMANDS_DIR, filename);

                    

                    // Check if file exists (was added, not deleted)

                    if (fs.existsSync(filePath)) {

                        console.log(chalk.cyan(`[GIFT-MD] detected Unauthorized file: ${filename}`));

                        

                        // Get GitHub commands list to verify

                        const githubCommands = await getGitHubCommandsList();

                        const isAuthorized = githubCommands.some(cmd => cmd.name === filename);

                        

                        if (!isAuthorized) {

                            try {

                                fs.unlinkSync(filePath);

                                console.log(chalk.red(`🗑️ AUTO-DELETED unauthorized file: ${filename}`));

                            } catch (error) {

                                console.error(`❌ Failed to auto-delete ${filename}:`, error.message);

                            }

                        }

                    }

                }, 1000); // 1 second delay to ensure file is fully written

            }

        }

    });

    

    // Store watcher globally so it doesn't get garbage collected

    global.commandsWatcher = watcher;

}

// Export the commands protection function for manager  
async function commandsProtection() {
    const success = await cleanupCommands();
    
    if (success) {
        // Start real-time protection
        startRealtimeProtection();
        
    }
    
    return success;
}
// Export the update function for manager

module.exports.update = commandsProtection;
