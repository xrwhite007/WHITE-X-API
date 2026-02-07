const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// White X API source
const WHITE_X_API = 'https://draw.ar-lottery02.com/WinGo/WinGo_1M/GetHistoryIssuePage.json';

// Logic Function (HTML er calculation ekhane)
function getPrediction(list) {
    const lastItem = list[0];
    const lastN = parseInt(lastItem.number);
    const lastS = lastN >= 5 ? "BIG" : "SMALL";
    const nextPeriod = (BigInt(lastItem.issueNumber) + 1n).toString();

    // Math 1: Trend Follower
    let m1 = lastS;

    // Math 2: Opposite Logic
    let m2_calc = (lastN + parseInt(nextPeriod.slice(-1))) % 2;
    let m2 = m2_calc === 0 ? "BIG" : "SMALL";

    // Math 3: Sequence Pattern
    let m3 = (Math.random() > 0.5) ? "BIG" : "SMALL";
    if (m3 === m1 && m3 === m2) {
        m3 = (m1 === "BIG") ? "SMALL" : "BIG";
    }

    return {
        period: nextPeriod,
        math1: m1,
        math2: m2,
        math3: m3,
        color: (lastN % 2 === 0) ? "RED" : "GREEN"
    };
}

// Route for JSON API
app.get('/api', async (req, res) => {
    try {
        const response = await axios.get(WHITE_X_API);
        const prediction = getPrediction(response.data.data.list);
        res.json({
            status: "success",
            name: "WHITE X API",
            data: prediction
        });
    } catch (error) {
        res.status(500).json({ status: "error", message: "Fetch failed" });
    }
});

// Route for Frontend HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => console.log(`White X API running on port ${PORT}`));
