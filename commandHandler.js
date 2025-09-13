const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

// Global maps
global.commands = new Map();
global.aliases = new Map();
global.fileCategories = {}; // File-based categories

function loadCommandFile(filePath) {
    try {
        // ❌ Removed delete require.cache (no hot reload)
        let commandsExport = require(filePath);

        // Always treat as array
        if (!Array.isArray(commandsExport)) {
            commandsExport = [commandsExport];
        }

        // Get file name without .js extension for category
        const fileName = path.basename(filePath, '.js');
        const categoryName = fileName.toUpperCase() + ' MENU';

        commandsExport.forEach(command => {
            if (!command.name || typeof command.execute !== 'function') return;

            // Add main command
            global.commands.set(command.name, command);

            // Add aliases
            if (command.aliases && Array.isArray(command.aliases)) {
                command.aliases.forEach(alias => {
                    global.aliases.set(alias, command);
                });
            }

            // Organize by file name
            if (!global.fileCategories[categoryName]) {
                global.fileCategories[categoryName] = [];
            }

            if (!global.fileCategories[categoryName].includes(command.name)) {
                global.fileCategories[categoryName].push(command.name);
            }
        });

    } catch (err) {
        console.error(chalk.red(`❌ Failed to load command ${path.basename(filePath)}: ${err.message}`));
    }
}

function loadCommands() {
    const commandsPath = path.join(__dirname, 'commands');

    // Clear existing categories
    global.fileCategories = {};

    function readDirRecursive(dir) {
        fs.readdirSync(dir, { withFileTypes: true }).forEach(entry => {
            const entryPath = path.join(dir, entry.name);

            if (entry.isDirectory()) {
                readDirRecursive(entryPath);
            } else if (entry.isFile() && entry.name.endsWith('.js')) {
                loadCommandFile(entryPath);
            }
        });
    }

    readDirRecursive(commandsPath);

    // Sort commands within each category alphabetically
    for (const category in global.fileCategories) {
        global.fileCategories[category].sort();
    }

    // Watch for changes (just log, don’t reload)
    fs.watch(commandsPath, { recursive: true }, (eventType, filename) => {
        if (!filename || !filename.endsWith('.js')) return;

        const filePath = path.join(commandsPath, filename);

        if (fs.existsSync(filePath)) {
            console.log(chalk.yellowBright(`⚠️ Detected change in: ${filename}`));
            console.log(chalk.magenta(`↪ Restart bot to activate ${filename}`));
        } else {
            console.log(chalk.yellowBright(`⚠️ File deleted: ${filename}`));
            console.log(chalk.magenta(`↪ Restart bot to fully remove ${filename}`));
        }
    });
}

module.exports = {
    commands: global.commands,
    aliases: global.aliases,
    loadCommands,
    categories: global.fileCategories // Export file-based categories
};
