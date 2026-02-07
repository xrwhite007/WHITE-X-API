const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

const SOURCE_API = 'https://draw.ar-lottery02.com/WinGo/WinGo_1M/GetHistoryIssuePage.json';

// Math Logic and Leader Finder
function getLeaderPrediction(list) {
    const lastItem = list[0];
    const lastN = parseInt(lastItem.number);
    const lastS = lastN >= 5 ? "BIG" : "SMALL";
    const nextP = (BigInt(lastItem.issueNumber) + 1n).toString();

    // Math Calculations
    let m1 = lastS; // Trend
    let m2 = (lastN + parseInt(nextP.slice(-1))) % 2 === 0 ? "BIG" : "SMALL"; // Opposite
    let m3 = Math.random() > 0.5 ? "BIG" : "SMALL"; // Random

    // Ekhane Leader selection logic (HTML system onujayi)
    // Tumi jehetu JSON-e shudhu main prediction chachho:
    let finalPrediction = m1; // Default Math 1 ke leader dhora hoyeche

    return {
        period: nextP,
        prediction: finalPrediction, // Shudhu BIG ba SMALL thakbe
        color: (lastN % 2 === 0) ? "RED" : "GREEN"
    };
}

app.get('/api', async (req, res) => {
    try {
        const response = await axios.get(SOURCE_API);
        const result = getLeaderPrediction(response.data.data.list);
        
        // Tomar chaoa JSON format
        res.json({
            period: result.period,
            prediction: result.prediction
        });
    } catch (e) {
        res.status(500).json({ status: "error" });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => console.log('Server Live'));
