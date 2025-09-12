const fs = require('fs');

const path = require('path');

const chalk = require('chalk');

// Global maps

global.commands = new Map();

global.aliases = new Map();

global.fileCategories = {}; // NEW: File-based categories

const debounceTimers = {};

function loadCommandFile(filePath) {

    try {

        delete require.cache[require.resolve(filePath)];

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

           /** console.log(

                chalk.greenBright(

                    `✅ Loaded command: ${command.name} [${categoryName}]${command.aliases ? ` (aliases: ${command.aliases.join(', ')})` : ''}`

                )

            );*/

        });

    } catch (err) {

        console.error(chalk.red(`❌ Failed to load command ${path.basename(filePath)}: ${err.message}`));

    }

}

function unloadCommandFile(filePath) {

    try {

        const resolvedPath = require.resolve(filePath);

        delete require.cache[resolvedPath];

        let commandsExport;

        try {

            commandsExport = require(filePath);

        } catch {

            commandsExport = [];

        }

        if (!Array.isArray(commandsExport)) {

            commandsExport = [commandsExport];

        }

        commandsExport.forEach(command => {

            const commandName = command.name;

            if (!commandName) return;

            if (global.commands.has(commandName)) {

                global.commands.delete(commandName);

                // Remove aliases

                for (let [alias, cmd] of global.aliases.entries()) {

                    if (cmd === command) {

                        global.aliases.delete(alias);

                    }

                }

                // Remove from file categories

                for (const cat in global.fileCategories) {

                    global.fileCategories[cat] = global.fileCategories[cat].filter(cmd => cmd !== commandName);

                    if (global.fileCategories[cat].length === 0) delete global.fileCategories[cat];

                }

                console.log(chalk.redBright(`🗑 Removed command: ${commandName}`));

            }

        });

    } catch (err) {

        console.error(chalk.red(`❌ Failed to unload ${filePath}: ${err.message}`));

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

    // Watch for changes

    fs.watch(commandsPath, { recursive: true }, (eventType, filename) => {

        if (!filename || !filename.endsWith('.js')) return;

        const filePath = path.join(commandsPath, filename);

        clearTimeout(debounceTimers[filePath]);

        debounceTimers[filePath] = setTimeout(() => {

            if (fs.existsSync(filePath)) {

                console.log(chalk.yellowBright(`♻ Detected change in: ${filename}`));

                loadCommandFile(filePath);

            } else {

                console.log(chalk.yellowBright(`⚠ File deleted: ${filename}`));

                unloadCommandFile(filePath);

            }

        }, 300);

    });

}

module.exports = {

    commands: global.commands,

    aliases: global.aliases,

    loadCommands,

    categories: global.fileCategories // Export file-based categories

};
