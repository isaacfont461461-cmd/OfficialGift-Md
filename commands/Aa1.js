// commands/owner/restart.js
const fs = require('fs');
const path = require('path');

module.exports = {
  name: 'p',
  aliases: ['r'],
  category: 'owner',
  description: 'Restart the bot (owner only)',
  usage: '.restart',

  async execute(sock, message, args, context) {
    const { senderIsSudo, reply } = context;

    try {
      // Permission check
      if (!senderIsSudo) {
        return await reply('❌ This command is only available to the bot owner.');
      }

      // Try to save DB if available
      try {
        const db = require('../lib/database');
        if (typeof db.saveDatabase === 'function') {
          db.saveDatabase();
        } else if (typeof db.save === 'function') {
          // some projects name it save
          db.save();
        }
      } catch (err) {
        // ignore if no database helper or it fails — still continue to restart
        console.warn('⚠️ saveDatabase not found or failed:', err?.message || err);
      }

      // Notify chat
      await reply('🔁 Restarting bot now...');

      // Small delay to allow the outgoing message to be sent
      setTimeout(() => {
        console.log('🔁 Restart command invoked by owner — exiting process now.');
        // Exit with code 0 (success) so process manager can restart
        process.exit(0);
      }, 600); // 600ms gives a short time for the reply to go out

    } catch (error) {
      console.error('❌ Error in restart command:', error);
      // fallback send via sock if reply fails or reply is not present
      try {
        await sock.sendMessage(message.key.remoteJid, { text: '❌ Failed to restart: ' + (error.message || error) }, { quoted: message });
      } catch (e) {
        console.error('❌ Also failed to send error message:', e);
      }
    }
  }
};
