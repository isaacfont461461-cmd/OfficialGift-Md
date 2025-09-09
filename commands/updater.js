// commands/updater.js
const axios = require('axios');
const { getLatestVersion } = require("../data/V");
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

                // Restart the bot
                setTimeout(() => {
                    process.exit(0);
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

                if (latestCommitHash === currentHash) {
                    return await context.reply(
                        `✅ Bot is up-to-date!\n\n` +
                        `Current Version: \`${currentHash.substring(0, 7)}\`\n` +
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
const latestVersion = await getLatestVersion();
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
            console.log(`⚠️ Preserving existing file: ${item}`);
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
