// lib/getLatestVersion.js
const axios = require("axios");

async function getLatestVersion() {
    try {
        // Point directly to the database.js file in your repo
        const url = "https://raw.githubusercontent.com/isaacfont461461-cmd/OfficialGift-Md/main/lib/database.js";
        const res = await axios.get(url);

        // Extract version string from the settings
        const match = res.data.match(/version:\s*["'`](.*?)["'`]/);
        return match ? match[1] : null;
    } catch (err) {
        console.error("❌ Failed to fetch latest version:", err.message);
        return null;
    }
}

module.exports = { getLatestVersion };
