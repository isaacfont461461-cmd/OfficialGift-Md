// lib/case.js

const { handleAntilinkDetection } = require('./newAntilink');

const { handleAntibadwordDetection } = require('./newAntibadword');

async function handleMessageCases(sock, m, context, isCmd) {

    // Only run checks for NON-COMMAND messages in group chats

    if (isCmd) return;

    // Run Antilink

    await handleAntilinkDetection(sock, m, context);

    // Run Anti-badword

    await handleAntibadwordDetection(sock, m, context);

    // You can later add more like chatbot/autoreact here

}

module.exports = {

    handleMessageCases,

};