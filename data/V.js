
const axios = require("axios");

async function getLatestVersion() {
    try {
        const url = "https://raw.githubusercontent.com/isaacfont461461-cmd/OfficialGift-Md/main/data/V.js";
        const res = await axios.get(url);

        // Extract version string from module.exports
        const match = res.data.match(/version:\s*["'`](.*?)["'`]/);
        return match ? match[1] : null;
    } catch (err) {
        console.error("❌ Failed to fetch latest version:", err);
        return null;
    }
}

module.exports = { getLatestVersion };
