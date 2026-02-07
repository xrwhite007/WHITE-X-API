const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

const WHITE_X_SOURCE = 'https://draw.ar-lottery02.com/WinGo/WinGo_1M/GetHistoryIssuePage.json';

function calculateLogic(list) {
    const lastItem = list[0];
    const lastN = parseInt(lastItem.number);
    const lastS = lastN >= 5 ? "BIG" : "SMALL";
    const nextP = (BigInt(lastItem.issueNumber) + 1n).toString();

    let m1 = lastS;
    let m2 = (lastN + parseInt(nextP.slice(-1))) % 2 === 0 ? "BIG" : "SMALL";
    let m3 = Math.random() > 0.5 ? "BIG" : "SMALL";
    if (m3 === m1 && m3 === m2) m3 = (m1 === "BIG") ? "SMALL" : "BIG";

    return {
        period: nextP,
        math1: m1,
        math2: m2,
        math3: m3,
        color: (lastN % 2 === 0) ? "RED" : "GREEN"
    };
}

app.get('/api', async (req, res) => {
    try {
        const response = await axios.get(WHITE_X_SOURCE);
        const prediction = calculateLogic(response.data.data.list);
        res.json({ status: "success", name: "WHITE X API", prediction });
    } catch (e) {
        res.status(500).json({ status: "error" });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => console.log('Server Live'));
