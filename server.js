const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

const SOURCE_API = 'https://draw.ar-lottery02.com/WinGo/WinGo_1M/GetHistoryIssuePage.json';

function runMathLogic(list) {
    const lastItem = list[0];
    const lastN = parseInt(lastItem.number);
    const lastS = lastN >= 5 ? "BIG" : "SMALL";
    const nextP = (BigInt(lastItem.issueNumber) + 1n).toString();

    // Math 1
    let m1 = lastS;
    // Math 2
    let m2 = (lastN + parseInt(nextP.slice(-1))) % 2 === 0 ? "BIG" : "SMALL";
    // Math 3
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
        const response = await axios.get(SOURCE_API);
        const result = runMathLogic(response.data.data.list);
        res.json({ status: "success", name: "WHITE X API", prediction: result });
    } catch (e) {
        res.status(500).json({ status: "error", message: "Fetch Error" });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => console.log(`Server is Live on port ${PORT}`));
