const axios = require('axios');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');

// ===== CONFIG =====
const REPO_OWNER = 'isaacfont461461-cmd';
const REPO_NAME = 'OfficialGift-Md';
const BRANCH = 'main';
const COMMIT_FILE = './data/commit-hash.txt';

// ===== HELPER: Copy folder recursively =====
function copyFolderSync(src, dest) {
    if (!fs.existsSync(src)) return;
    fs.mkdirSync(dest, { recursive: true });
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (let entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        if (entry.isDirectory()) {
            copyFolderSync(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

// ===== UPDATE FUNCTION =====
async function updateBot() {
    console.log(chalk.cyan("[GIFT-MD]⚡ Checking For Update..."));
    let currentHash = null;

    if (fs.existsSync(COMMIT_FILE)) {
        currentHash = fs.readFileSync(COMMIT_FILE, 'utf8').trim();
    }

    try {
        const { data: commitData } = await axios.get(
            `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/commits/${BRANCH}`,
            { headers: { 'User-Agent': 'Gift-MD-Updater' } }
        );

        const latestCommitHash = commitData.sha;

        if (latestCommitHash === currentHash) {
            console.log("[GIFT-MD] Already up-to-date!");
            return;
        }

        console.log(chalk.cyan("[GIFT-MD] 🚀 Update found! Downloading..."));

        const zipPath = path.join(__dirname, '../tmp/latest.zip');
        const extractPath = path.join(__dirname, '../tmp/latest');
        fs.mkdirSync(path.dirname(zipPath), { recursive: true });

        const { data: zipData } = await axios.get(
            `https://github.com/${REPO_OWNER}/${REPO_NAME}/archive/${BRANCH}.zip`,
            { responseType: 'arraybuffer' }
        );

        fs.writeFileSync(zipPath, zipData);

        const zip = new AdmZip(zipPath);
        zip.extractAllTo(extractPath, true);

        const sourcePath = path.join(extractPath, `${REPO_NAME}-${BRANCH}`);
        const destinationPath = path.join(__dirname, '..');
        copyFolderSync(sourcePath, destinationPath);

        fs.writeFileSync(COMMIT_FILE, latestCommitHash);
        console.log("[GIFT-MD] Update Successful!");

        fs.unlinkSync(zipPath);
        fs.rmSync(extractPath, { recursive: true, force: true });
    } catch (error) {
        console.error("❌ Pre-start updater failed:", error.message);
    }
}

// ===== FOLDER-WIDE PROTECTION =====
async function folderProtection(folderPath) {
    console.log(chalk.cyan(`[GIFT-MD] Running folder-wide protection for: ${folderPath}`));

    try {
        const { data } = await axios.get(
            `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${folderPath}`,
            { headers: { 'User-Agent': 'GIFT-MD-Protector' } }
        );

        const githubFiles = data.filter(f => f.type === 'file').map(f => f.name);
        const localFiles = fs.existsSync(folderPath)
            ? fs.readdirSync(folderPath).filter(f => fs.statSync(path.join(folderPath, f)).isFile())
            : [];

        // Delete unauthorized local files
        for (const file of localFiles) {
            if (!githubFiles.includes(file)) {
                fs.unlinkSync(path.join(folderPath, file));
                console.log(chalk.red(`🗑️ Deleted unauthorized file: ${file}`));
            }
        }

        // Download missing files
        for (const file of data) {
            if (!localFiles.includes(file.name)) {
                const { data: fileContent } = await axios.get(file.download_url, { headers: { 'User-Agent': 'GIFT-MD-Protector' } });
                fs.writeFileSync(path.join(folderPath, file.name), fileContent);
                console.log(chalk.green(`✅ Downloaded missing file: ${file.name}`));
            }
        }

        console.log(chalk.cyan(`[GIFT-MD] Folder-wide protection complete for: ${folderPath}`));

        // Start real-time monitoring
        startRealtimeProtection(folderPath);

    } catch (err) {
        console.error('❌ Folder protection failed:', err.message);
    }
}

// ===== FILE-SPECIFIC PROTECTION =====
async function fileProtection(filePath) {
    console.log(chalk.cyan(`[GIFT-MD] Running file-specific protection for: ${filePath}`));
    const folder = path.dirname(filePath);
    const fileName = path.basename(filePath);

    try {
        const { data } = await axios.get(
            `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${folder}`,
            { headers: { 'User-Agent': 'GIFT-MD-Protector' } }
        );

        const githubFiles = data.map(f => f.name);
        if (!githubFiles.includes(fileName)) {
            console.log(chalk.yellow(`⚠️ File ${fileName} not found Skipping...`));
            return;
        }

        const fileData = data.find(f => f.name === fileName);
        const { data: fileContent } = await axios.get(fileData.download_url, { headers: { 'User-Agent': 'GIFT-MD-Protector' } });
        fs.writeFileSync(filePath, fileContent);
        console.log(chalk.green(`✅ File ${fileName} updated/protected successfully.`));
    } catch (err) {
        console.error(`❌ File protection failed for ${filePath}:`, err.message);
    }
}

// ===== REAL-TIME MONITORING & AUTO-RESTORE =====
function startRealtimeProtection(folderPath) {
    if (!fs.existsSync(folderPath)) return;
    const watcher = fs.watch(folderPath, async (eventType, filename) => {
        if (!filename.endsWith('.js')) return;
        const filePath = path.join(folderPath, filename);

        try {
            // Fetch current GitHub file list
            const { data } = await axios.get(
                `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${folderPath}`,
                { headers: { 'User-Agent': 'GIFT-MD-Protector' } }
            );
            const githubFiles = data.filter(f => f.type === 'file').map(f => f.name);

            // If unauthorized file added -> delete
            if (eventType === 'rename' && fs.existsSync(filePath) && !githubFiles.includes(filename)) {
                fs.unlinkSync(filePath);
                console.log(chalk.red(`🗑️ Unauthorized file deleted: ${filename}`));
            }

            // If authorized file deleted -> restore
            if (!fs.existsSync(filePath) && githubFiles.includes(filename)) {
                const fileData = data.find(f => f.name === filename);
                const { data: fileContent } = await axios.get(fileData.download_url, { headers: { 'User-Agent': 'GIFT-MD-Protector' } });
                fs.writeFileSync(filePath, fileContent);
                console.log(chalk.green(`♻️ Restored deleted file: ${filename}`));
            }

        } catch (err) {
            console.error(`❌ Real-time monitoring error for ${filename}:`, err.message);
        }
    });

    global.commandsWatcher = watcher;
}

// ===== EXPORT =====
module.exports = {
    updateBot,
    folderProtection,
    fileProtection
};
