const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

const SOURCE_API = 'https://draw.ar-lottery02.com/WinGo/WinGo_1M/GetHistoryIssuePage.json';

// Win tracking system
let winStats = { m1: 0, m2: 0, m3: 0 };
let predictionHistory = {}; 
let lastProcessedPeriod = "";

async function updateLeaderAndPredict() {
    try {
        const response = await axios.get(SOURCE_API + '?t=' + Date.now());
        const list = response.data.data.list;
        const lastItem = list[0];
        const lastN = parseInt(lastItem.number);
        const lastS = lastN >= 5 ? "BIG" : "SMALL";
        const currentPeriod = lastItem.issueNumber;
        const nextPeriod = (BigInt(currentPeriod) + 1n).toString();

        // ১. Check logic: Konta win hoyeche tracking kora
        if (currentPeriod !== lastProcessedPeriod && predictionHistory[currentPeriod]) {
            if (predictionHistory[currentPeriod].m1 === lastS) winStats.m1++;
            if (predictionHistory[currentPeriod].m2 === lastS) winStats.m2++;
            if (predictionHistory[currentPeriod].m3 === lastS) winStats.m3++;
            lastProcessedPeriod = currentPeriod;
        }

        // ২. Next Period-er jonno ৩-ti alada random prediction generate kora
        if (!predictionHistory[nextPeriod]) {
            predictionHistory[nextPeriod] = {
                m1: Math.random() > 0.5 ? "BIG" : "SMALL",
                m2: Math.random() > 0.5 ? "BIG" : "SMALL",
                m3: Math.random() > 0.5 ? "BIG" : "SMALL"
            };
        }

        // ৩. Leader select kora (Jar win count sobcheye beshi)
        let leader = Object.keys(winStats).reduce((a, b) => winStats[a] >= winStats[b] ? a : b);
        
        return {
            period: nextPeriod,
            prediction: predictionHistory[nextPeriod][leader],
            leader_info: leader // Internal check-er jonno
        };
    } catch (e) {
        return null;
    }
}

app.get('/api', async (req, res) => {
    const data = await updateLeaderAndPredict();
    if (data) {
        res.json({
            period: data.period,
            prediction: data.prediction
        });
    } else {
        res.status(500).json({ error: "Fetch error" });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => console.log('Leader System Live'));
