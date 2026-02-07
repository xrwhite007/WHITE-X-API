const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

const SOURCE_API = 'https://draw.ar-lottery02.com/WinGo/WinGo_1M/GetHistoryIssuePage.json';

// Leader tracking stats
let stats = { m1: 0, m2: 0, m3: 0 };
let predictions = {}; 
let lastCheckedPeriod = "";

async function getLeaderSignal() {
    try {
        const res = await axios.get(SOURCE_API + '?t=' + Date.now());
        const list = res.data.data.list;
        const lastItem = list[0];
        const lastN = parseInt(lastItem.number);
        const lastS = lastN >= 5 ? "BIG" : "SMALL";
        const currentPeriod = lastItem.issueNumber;
        const nextPeriod = (BigInt(currentPeriod) + 1n).toString();

        // ১. Check Win/Loss for previous period
        if (currentPeriod !== lastCheckedPeriod && predictions[currentPeriod]) {
            if (predictions[currentPeriod].m1 === lastS) stats.m1++;
            if (predictions[currentPeriod].m2 === lastS) stats.m2++;
            if (predictions[currentPeriod].m3 === lastS) stats.m3++;
            lastCheckedPeriod = currentPeriod;
        }

        // ২. Generate 3 Math.random() predictions for next period
        if (!predictions[nextPeriod]) {
            predictions[nextPeriod] = {
                m1: Math.random() > 0.5 ? "BIG" : "SMALL",
                m2: Math.random() > 0.5 ? "BIG" : "SMALL",
                m3: Math.random() > 0.5 ? "BIG" : "SMALL"
            };
        }

        // ৩. Find the Leader (Highest win count)
        let leader = Object.keys(stats).reduce((a, b) => stats[a] >= stats[b] ? a : b);
        
        return {
            period: nextPeriod,
            prediction: predictions[nextPeriod][leader]
        };
    } catch (e) {
        return null;
    }
}

app.get('/api', async (req, res) => {
    const data = await getLeaderSignal();
    if (data) {
        res.json(data);
    } else {
        res.status(500).json({ error: "Fetch failed" });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => console.log('White X API is Live'));
