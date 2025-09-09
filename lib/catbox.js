const fileType = require('file-type');
const FormData = require('form-data');
const fetch = require('node-fetch');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');

const MAX_FILE_SIZE_MB = 200; // Maximum file size

async function uploadMedia(buffer) {
  try {
    const { ext } = await fileType.fromBuffer(buffer);  
    const bodyForm = new FormData();
    bodyForm.append("fileToUpload", buffer, "file." + ext);
    bodyForm.append("reqtype", "fileupload");

    const res = await fetch("https://catbox.moe/user/api.php", {
      method: "POST",
      body: bodyForm,
    });

    if (!res.ok) {
      throw new Error(`Upload failed with status ${res.status}: ${res.statusText}`);
    }

    const data = await res.text();
    return data;
  } catch (error) {
    console.error("Error during media upload:", error);
    throw new Error('Failed to upload media');
  }
}

async function handleMediaUpload(quotedMessage, sock, messageType) {
  if (!quotedMessage || !messageType) {
    throw new Error('No valid media to upload!');
  }

  try {
    // Download the media content
    const stream = await downloadContentFromMessage(quotedMessage[messageType], messageType.replace('Message', ''));
    
    let buffer = Buffer.from([]);
    for await (const chunk of stream) {
      buffer = Buffer.concat([buffer, chunk]);
    }

    const fileSizeMB = buffer.length / (1024 * 1024);
    if (fileSizeMB > MAX_FILE_SIZE_MB) {
      throw new Error(`File size exceeds the limit of ${MAX_FILE_SIZE_MB}MB.`);
    }

    const mediaUrl = await uploadMedia(buffer);
    return mediaUrl;
  } catch (error) {
    console.error('Error handling media upload:', error);
    throw new Error('Failed to handle media upload');
  }
}

module.exports = {
  uploadMedia,
  handleMediaUpload,
};