const fs = require('fs');

const path = require('path');
const settings = require('../settings');
// Database file path

const DB_PATH = './data/database.json';

const DATA_DIR = './data';

// Default database structure

const DEFAULT_DATABASE = {

    settings: {

        // Bot identification

    botName: global.botName,

   botOwner: global.botowner, 

ownerNumber: global.ownerNumber,

        

        // Bot configuration

        prefix: global.prefix,

        mode: global.mode,

        version: global.version,

        

        // Feature toggles

        alwaysonline: true,

        antibug: false,

        anticall: false,

        autotype: false,

        autoread: false,

        autoreact: false,

        autobio: false,

        chatbot: false,

        fontstyle: false,

        autoblock: false,

        autorecord: false,

        autoviewstatus: true,

        autoreactstatus: false,

        autorecordtype: false,

        statusantidelete: true,

        

        // Anti-features

        antiedit: "private",

        antidelete: "private",

        

        // Menu and appearance

        menustyle: "1",
        menuAudio: "off",
        menuimage: "https://files.catbox.moe/yh54ej.jpg",

        

        // Sticker settings

        packname: "Gift Md",

        author: "isaac favour",

        watermark: global.watermark,

        

        // Messages

        anticallmsg: "",

        

        // Security and moderation

        warnings: {},

        warnLimit: 5,

        

        

        // Links and contact

        timezone: "Africa/Nairobi",

        

        // Creation timestamp

        createdAt: Date.now(),

        lastUpdated: Date.now()

    },

    chats: {}, // Chat-specific data

    users: {}, // User-specific data

    stats: {

        totalCommands: 0,

        totalMessages: 0,

        startTime: Date.now()

    },

    // Command-specific data storage

    commandData: {

        welcome: {}, // Welcome messages per chat

        goodbye: {}, // Goodbye messages per chat

        antilink: {}, // Antilink settings per chat

        antibadword: {}, // Anti-badword settings per chat

        chatbot: {}, // Chatbot settings per chat

        autostatus: {}, // Auto status settings

        muted: {}, // Muted users per chat

        banned: [], // Globally banned users

        warnings: {}, // Warning counts per user per chat

        messageCount: {}, // Message counts per user per chat

        topmembers: {}, // Top members data per chat

        autoreact: {}, // Auto reaction settings per chat

        autotyping: {}, // Auto typing settings per chat

        autoread: {}, // Auto read settings per chat

        reactions: {}, // Custom reaction settings

        antidelete: {}, // Anti-delete message storage
        sudo: [],

        economy: {}, // Economy data per user

        levels: {}, // User levels per chat

        afk: {}, // AFK users data

        notes: {}, // Saved notes per chat

        filters: {}, // Auto-response filters per chat

        polls: {}, // Active polls per chat

        reminders: {}, // User reminders

        quotes: {}, // Saved quotes per chat

        customCommands: {} // Custom commands per chat

    }

};

/**

 * Ensure data directory exists

 */

const ensureDataDir = () => {

    try {

        if (!fs.existsSync(DATA_DIR)) {

            fs.mkdirSync(DATA_DIR, { recursive: true });

            console.log('📁 Created data directory');

        }

        return true;

    } catch (error) {

        console.error('❌ Error creating data directory:', error);

        return false;

    }

};

/**

 * Load database from file

 * @returns {Object} Database object

 */

const loadDatabase = () => {

    try {

        ensureDataDir();

        

        if (!fs.existsSync(DB_PATH)) {

            console.log('📄 Creating new database...');

            saveDatabase(DEFAULT_DATABASE);

            return { ...DEFAULT_DATABASE };

        }

        

        const data = fs.readFileSync(DB_PATH, 'utf8');

        const db = JSON.parse(data);

        

        // Deep merge with defaults to ensure all properties exist

        const mergedDb = {

            settings: { ...DEFAULT_DATABASE.settings, ...db.settings },

            chats: db.chats || {},

            users: db.users || {},

            stats: { ...DEFAULT_DATABASE.stats, ...db.stats },

            commandData: { ...DEFAULT_DATABASE.commandData, ...db.commandData }

        };

        

        return mergedDb;

        

    } catch (error) {

        console.error('❌ Error loading database:', error);

        console.log('🔄 Using default database...');

        return { ...DEFAULT_DATABASE };

    }

};

/**

 * Save database to file

 * @param {Object} db - Database object to save

 * @returns {Boolean} Success status

 */

const saveDatabase = (db) => {

    try {

        ensureDataDir();

        

        // Update last modified timestamp

        if (db.settings) {

            db.settings.lastUpdated = Date.now();

        }

        

        // Write to file with pretty formatting

        fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));

        

        // Update global variables

        updateGlobalVars(db);

        

        return true;

        

    } catch (error) {

        console.error('❌ Error saving database:', error);

        return false;

    }

};

/**

 * Update global variables from database

 * @param {Object} db - Database object

 */
const updateGlobalVars = (db) => {

    try {

        if (db.settings) {

            // Use correct property names from database

            global.botName = db.settings.botName || global.botName;

            global.botOwner = db.settings.botOwner || global.botOwner;

            global.owner = db.settings.ownerNumber || global.owner;

            global.prefix = db.settings.prefix || global.prefix;

            global.packname = db.settings.packname || global.packname;

            global.mode = db.settings.mode || global.mode;

            global.version = db.settings.version || global.version;
        }

    } catch (error) {

        console.error('❌ Error updating global variables:', error);

    }

};
/**

 * Get a specific setting

 * @param {String} key - Setting key

 * @param {*} defaultValue - Default value if key doesn't exist

 * @returns {*} Setting value

 */

const getSetting = (key, defaultValue = null) => {

    try {

        const db = loadDatabase();

        return db.settings[key] !== undefined ? db.settings[key] : defaultValue;

    } catch (error) {

        console.error('❌ Error getting setting:', error);

        return defaultValue;

    }

};

/**

 * Update a specific setting

 * @param {String} key - Setting key

 * @param {*} value - New value

 * @returns {Boolean} Success status

 */

const updateSetting = (key, value) => {

    try {

        const db = loadDatabase();

        db.settings[key] = value;

        return saveDatabase(db);

    } catch (error) {

        console.error('❌ Error updating setting:', error);

        return false;

    }

};

/**

 * Get chat-specific data

 * @param {String} chatId - Chat ID

 * @param {String} key - Data key (optional)

 * @param {*} defaultValue - Default value

 * @returns {*} Chat data

 */

const getChatData = (chatId, key = null, defaultValue = null) => {

    try {

        const db = loadDatabase();

        const chatData = db.chats[chatId] || {};

        

        if (key) {

            return chatData[key] !== undefined ? chatData[key] : defaultValue;

        }

        

        return chatData;

    } catch (error) {

        console.error('❌ Error getting chat data:', error);

        return key ? defaultValue : {};

    }

};

/**

 * Update chat-specific data

 * @param {String} chatId - Chat ID

 * @param {String} key - Data key

 * @param {*} value - New value

 * @returns {Boolean} Success status

 */

const updateChatData = (chatId, key, value) => {

    try {

        const db = loadDatabase();

        

        if (!db.chats[chatId]) {

            db.chats[chatId] = {};

        }

        

        db.chats[chatId][key] = value;

        return saveDatabase(db);

    } catch (error) {

        console.error('❌ Error updating chat data:', error);

        return false;

    }

};

/**

 * Get user-specific data

 * @param {String} userId - User ID

 * @param {String} key - Data key (optional)

 * @param {*} defaultValue - Default value

 * @returns {*} User data

 */

const getUserData = (userId, key = null, defaultValue = null) => {

    try {

        const db = loadDatabase();

        const userData = db.users[userId] || {};

        

        if (key) {

            return userData[key] !== undefined ? userData[key] : defaultValue;

        }

        

        return userData;

    } catch (error) {

        console.error('❌ Error getting user data:', error);

        return key ? defaultValue : {};

    }

};

/**

 * Update user-specific data

 * @param {String} userId - User ID

 * @param {String} key - Data key

 * @param {*} value - New value

 * @returns {Boolean} Success status

 */

const updateUserData = (userId, key, value) => {

    try {

        const db = loadDatabase();

        

        if (!db.users[userId]) {

            db.users[userId] = {};

        }

        

        db.users[userId][key] = value;

        return saveDatabase(db);

    } catch (error) {

        console.error('❌ Error updating user data:', error);

        return false;

    }

};

// COMMAND-SPECIFIC DATABASE FUNCTIONS
/**
 * Get command-specific data
 * @param {String} command - Command name
 * @param {String|Object} key - Data key (optional) or default value if no key
 * @param {*} defaultValue - Default value
 * @returns {*} Command data
 */
const getCommandData = (command, key = null, defaultValue = null) => {
    try {
        const db = loadDatabase();
        const commandData = db.commandData[command] || {};
        
        // If key is an object and no third parameter, treat key as defaultValue
        if (typeof key === 'object' && defaultValue === null) {
            return Object.keys(commandData).length > 0 ? commandData : key;
        }
        
        if (key) {
            return commandData[key] !== undefined ? commandData[key] : defaultValue;
        }
        
        return commandData;
    } catch (error) {
        console.error('❌ Error getting command data:', error);
        return (typeof key === 'object' && defaultValue === null) ? key : (key ? defaultValue : {});
    }
};

/**
 * Update command-specific data
 * @param {String} command - Command name
 * @param {String|Object} keyOrData - Data key or entire data object
 * @param {*} value - New value (optional if keyOrData is object)
 * @returns {Boolean} Success status
 */
const updateCommandData = (command, keyOrData, value = null) => {
    try {
        const db = loadDatabase();
        
        if (!db.commandData[command]) {
            db.commandData[command] = {};
        }
        
        // If keyOrData is an object, replace entire command data
        if (typeof keyOrData === 'object' && value === null) {
            db.commandData[command] = keyOrData;
        } else {
            // Otherwise, set specific key
            db.commandData[command][keyOrData] = value;
        }
        
        return saveDatabase(db);
    } catch (error) {
        console.error('❌ Error updating command data:', error);
        return false;
    }
};
// SPECIALIZED FUNCTIONS FOR COMMON OPERATIONS

/**

 * Welcome message functions

 */

const setWelcome = (chatId, message) => updateCommandData('welcome', chatId, message);

const getWelcome = (chatId) => getCommandData('welcome', chatId, null);

const removeWelcome = (chatId) => updateCommandData('welcome', chatId, null);

const isWelcomeEnabled = (chatId) => getWelcome(chatId) !== null;

/**

 * Goodbye message functions

 */

const setGoodbye = (chatId, message) => updateCommandData('goodbye', chatId, message);

const getGoodbye = (chatId) => getCommandData('goodbye', chatId, null);

const removeGoodbye = (chatId) => updateCommandData('goodbye', chatId, null);

const isGoodbyeEnabled = (chatId) => getGoodbye(chatId) !== null;

/**

 * Antilink functions

 */

const setAntilink = (chatId, enabled) => updateCommandData('antilink', chatId, enabled);

const getAntilink = (chatId) => getCommandData('antilink', chatId, false);

const isAntilinkEnabled = (chatId) => getAntilink(chatId) === true;

/**

 * Mute functions

 */

const muteUser = (chatId, userId) => {

    const mutedUsers = getCommandData('muted', chatId, []);

    if (!mutedUsers.includes(userId)) {

        mutedUsers.push(userId);

        updateCommandData('muted', chatId, mutedUsers);

    }

};

const unmuteUser = (chatId, userId) => {

    const mutedUsers = getCommandData('muted', chatId, []);

    const filtered = mutedUsers.filter(id => id !== userId);

    updateCommandData('muted', chatId, filtered);

};

const isMuted = (chatId, userId) => {

    const mutedUsers = getCommandData('muted', chatId, []);

    return mutedUsers.includes(userId);

};

/**

 * Ban functions

 */

const banUser = (userId) => {

    const bannedUsers = getCommandData('banned', 'global', []);

    if (!bannedUsers.includes(userId)) {

        bannedUsers.push(userId);

        updateCommandData('banned', 'global', bannedUsers);

    }

};

const unbanUser = (userId) => {

    const bannedUsers = getCommandData('banned', 'global', []);

    const filtered = bannedUsers.filter(id => id !== userId);

    updateCommandData('banned', 'global', filtered);

};

const isBanned = (userId) => {

    const bannedUsers = getCommandData('banned', 'global', []);

    return bannedUsers.includes(userId);

};

/**

 * Warning functions

 */

const addWarning = (chatId, userId) => {

    const warningKey = `${chatId}_${userId}`;

    const currentWarnings = getCommandData('warnings', warningKey, 0);

    updateCommandData('warnings', warningKey, currentWarnings + 1);

    return currentWarnings + 1;

};

const getWarnings = (chatId, userId) => {

    const warningKey = `${chatId}_${userId}`;

    return getCommandData('warnings', warningKey, 0);

};

const clearWarnings = (chatId, userId) => {

    const warningKey = `${chatId}_${userId}`;

    updateCommandData('warnings', warningKey, 0);

};

/**

 * Message count functions

 */

const incrementMessageCount = (chatId, userId) => {

    const countKey = `${chatId}_${userId}`;

    const currentCount = getCommandData('messageCount', countKey, 0);

    updateCommandData('messageCount', countKey, currentCount + 1);

    return currentCount + 1;

};

const getMessageCount = (chatId, userId) => {

    const countKey = `${chatId}_${userId}`;

    return getCommandData('messageCount', countKey, 0);

};

/**

 * AFK functions

 */

const setAFK = (userId, reason, time = Date.now()) => {

    updateCommandData('afk', userId, { reason, time });

};

const removeAFK = (userId) => {

    updateCommandData('afk', userId, null);

};

const getAFK = (userId) => {

    return getCommandData('afk', userId, null);

};

const isAFK = (userId) => {

    return getAFK(userId) !== null;

};

/**

 * Notes functions

 */

const saveNote = (chatId, noteName, noteContent) => {

    const notes = getCommandData('notes', chatId, {});

    notes[noteName] = noteContent;

    updateCommandData('notes', chatId, notes);

};

const getNote = (chatId, noteName) => {

    const notes = getCommandData('notes', chatId, {});

    return notes[noteName] || null;

};

const deleteNote = (chatId, noteName) => {

    const notes = getCommandData('notes', chatId, {});

    delete notes[noteName];

    updateCommandData('notes', chatId, notes);

};

const listNotes = (chatId) => {

    const notes = getCommandData('notes', chatId, {});

    return Object.keys(notes);

};

/**

 * Statistics functions

 */

const incrementStats = (statName) => {

    try {

        const db = loadDatabase();

        if (!db.stats[statName]) {

            db.stats[statName] = 0;

        }

        db.stats[statName]++;

        return saveDatabase(db);

    } catch (error) {

        console.error('❌ Error incrementing stats:', error);

        return false;

    }

};
/**
 * Add a user to sudo list
 * @param {String} userJid - User JID to add
 * @returns {Boolean} Success status
 */
const addSudo = (userJid) => {
    try {
        const db = loadDatabase();
        if (!db.commandData.sudo.includes(userJid)) {
            db.commandData.sudo.push(userJid);
            return saveDatabase(db);
        }
        return true; // Already exists
    } catch (error) {
        console.error('❌ Error adding sudo user:', error);
        return false;
    }
};

/**
 * Remove a user from sudo list
 * @param {String} userJid - User JID to remove
 * @returns {Boolean} Success status
 */
/**
 * Remove a user from sudo list
 * @param {String} userJid - User JID to remove
 * @returns {Boolean} Success status
 */
const removeSudo = (userJid) => {
    try {
        const ownerJid = settings.ownerNumber + '@s.whatsapp.net';
        
        // Prevent removing owner
        if (userJid === ownerJid) {
            console.log('⚠️ Cannot remove owner from sudo');
            return false;
        }
        
        const db = loadDatabase();
        const index = db.commandData.sudo.indexOf(userJid);
        if (index > -1) {
            db.commandData.sudo.splice(index, 1);
            return saveDatabase(db);
        }
        return true; // Doesn't exist anyway
    } catch (error) {
        console.error('❌ Error removing sudo user:', error);
        return false;
    }
};

/**
 * Get list of sudo users
 * @returns {Array} Array of sudo user JIDs
 */
/**
 * Get list of sudo users (excluding owner)
 * @returns {Array} Array of sudo user JIDs
 */
const getSudoList = () => {
    try {
        const db = loadDatabase();
        const ownerJid = settings.ownerNumber + '@s.whatsapp.net';
        return (db.commandData.sudo || []).filter(jid => jid !== ownerJid);
    } catch (error) {
        console.error('❌ Error getting sudo list:', error);
        return [];
    }
};
/**
 * Check if a user has sudo privileges (owner is automatically sudo)
 * @param {String} userJid - User JID to check
 * @returns {Boolean} True if user has sudo privileges
 */
const isSudo = (userJid) => {
    try {
        const ownerJid = settings.ownerNumber + '@s.whatsapp.net';
        
        // Owner is always sudo
        if (userJid === ownerJid) {
            return true;
        }
        
        const db = loadDatabase();
        return (db.commandData.sudo || []).includes(userJid);
    } catch (error) {
        console.error('❌ Error checking sudo status:', error);
        return false;
    }
};

const getStats = () => {

    try {

        const db = loadDatabase();

        return db.stats;

    } catch (error) {

        console.error('❌ Error getting stats:', error);

        return {};

    }

};

/**
 * Apply text formatting based on current font style (line by line)
 * @param {String} text - Text to format
 * @returns {String} Formatted text
 */
const applyFontStyle = (text) => {
    try {
        const fontStyle = getSetting('fontstyle', 'normal');
        
        if (fontStyle === 'normal') {
            return text;
        }
        
        // Skip formatting if text already has WhatsApp formatting
        if (text.includes('*') || text.includes('_') || text.includes('```') || text.includes('~')) {
            return text;
        }
        
        // Split text by lines and format each line individually
        const lines = text.split('\n');
        const formattedLines = lines.map(line => {
            // Skip empty lines
            if (line.trim() === '') return line;
            
            switch (fontStyle) {
                case 'bold':
                    return `*${line}*`;
                case 'italic':
                    return `_${line}_`;
                case 'monospace':
                    return `\`${line}\``;
                    case 'giftmd':
                    return `> ${line}`;
                case 'strikethrough':
                    return `~${line}~`;
                case 'bold-italic':
                    return `*_${line}_*`;
                case 'bold-mono':
                    return `*\`${line}\`*`;
                case 'italic-mono':
                    return `_\`${line}\`_`;
                default:
                    return line;
            }
        });
        
        return formattedLines.join('\n');
        
    } catch (error) {
        console.error('❌ Error applying font style:', error);
        return text;
    }
};
        


/**
 * Get available font styles
 * @returns {Array} Array of available font styles
 */
const getAvailableFontStyles = () => {
    return [
        'normal',
        'bold',
        'italic',
        'monospace',
        'giftmd',
        'strikethrough',
        'bold-italic',
        'bold-mono',
        'italic-mono'
    ];
};
/**

 * Initialize database

 */

const initDatabase = () => {

    try {

        const db = loadDatabase();

        updateGlobalVars(db);

        console.log('[GIFT-MD] Connected to Database."');

        return true;

    } catch (error) {

        console.error('❌ Error initializing database:', error);

        return false;

    }

};

// Initialize on module load

initDatabase();

module.exports = {

    // Core functions

    loadDatabase,

    saveDatabase,

    initDatabase,

    

    // Settings

    getSetting,

    updateSetting,

    

    // Chat data

    getChatData,

    updateChatData,

    

    // User data

    getUserData,

    updateUserData,

    

    // Command data

    getCommandData,

    updateCommandData,

    

    // Welcome/Goodbye

    setWelcome,

    getWelcome,

    removeWelcome,

    isWelcomeEnabled,

    setGoodbye,

    getGoodbye,

    removeGoodbye,

    isGoodbyeEnabled,

    

    // Antilink

    setAntilink,

    getAntilink,

    isAntilinkEnabled,

    

    // Mute/Ban

    muteUser,

    unmuteUser,

    isMuted,

    banUser,

    unbanUser,

    isBanned,

    

    // Warnings

    addWarning,

    getWarnings,

    clearWarnings,

    

    // Message counting

    incrementMessageCount,

    getMessageCount,

    

    // AFK

    setAFK,

    removeAFK,

    getAFK,

    isAFK,

    

    // Notes

    saveNote,

    getNote,

    deleteNote,

    listNotes,

    

    // Statistics

    incrementStats,
    // Sudo

    addSudo,

    removeSudo,

    getSudoList,

    isSudo,

    getStats,
    applyFontStyle,

    getAvailableFontStyles

};