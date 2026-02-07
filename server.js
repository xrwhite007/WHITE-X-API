const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

const SOURCE_API = 'https://draw.ar-lottery02.com/WinGo/WinGo_1M/GetHistoryIssuePage.json';

// Server-side state to track wins (HTML logic mimic)
let winStats = { m1: 0, m2: 0, m3: 0 };
let lastProcessedPeriod = "";

async function getBestPrediction() {
    try {
        const response = await axios.get(SOURCE_API);
        const list = response.data.data.list;
        const lastItem = list[0];
        const nextPeriod = (BigInt(lastItem.issueNumber) + 1n).toString();
        
        const lastN = parseInt(lastItem.number);
        const lastS = lastN >= 5 ? "BIG" : "SMALL";

        // MATH LOGICS
        let m1 = lastS;
        let m2 = (lastN + parseInt(nextPeriod.slice(-1))) % 2 === 0 ? "BIG" : "SMALL";
        let m3 = Math.random() > 0.5 ? "BIG" : "SMALL";

        // Logic to find the leader (Simplified)
        // Shadharonoto Math 1 trend follow kore tai win rate beshi hoy
        let leaderPrediction = m1; 

        return {
            period: nextPeriod,
            prediction: leaderPrediction
        };
    } catch (e) {
        return null;
    }
}

app.get('/api', async (req, res) => {
    const data = await getBestPrediction();
    if (data) {
        res.json(data);
    } else {
        res.status(500).json({ error: "Failed to fetch data" });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => console.log('Server is Live'));
