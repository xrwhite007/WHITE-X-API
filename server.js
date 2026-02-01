const axios = require('axios');
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());

const HISTORY_API = 'https://draw.ar-lottery02.com/WinGo/WinGo_1M/GetHistoryIssuePage.json';
let gameHistory = [];

const chartData = {
    "SMALL": { "0": "0-3", "1": "4-0", "2": "2-4", "3": "2-1", "4": "4-2", "5": "3-0", "6": "1-2", "7": "4-0", "8": "2-0", "9": "0-2" },
    "BIG": { "0": "6-5", "1": "5-6", "2": "9-8", "3": "8-5", "4": "7-8", "5": "5-9", "6": "8-7", "7": "8-9", "8": "8-7", "9": "9-5" }
};

async function updateData() {
    try {
        const res = await axios.get(`${HISTORY_API}?ts=${Date.now()}`);
        const newList = res.data.data.list;

        newList.forEach(item => {
            if (!gameHistory.find(s => s.issueNumber === item.issueNumber)) {
                gameHistory.unshift(item); 
            }
        });

        if (gameHistory.length > 150) gameHistory = gameHistory.slice(0, 150);
        console.log(`Updated! Total Records: ${gameHistory.length}`);
    } catch (e) {
        console.error("API Fetch Error");
    }
}

setInterval(updateData, 60000); 
updateData();

app.get('/prediction', (req, res) => {
    if (gameHistory.length < 2) {
        return res.json({ status: "waiting", message: "Data collecting..." });
    }

    const lastResult = gameHistory[0];
    const lastNum = lastResult.number.toString();
    
    let sizePred = "BIG"; 
    for (let i = 1; i < gameHistory.length - 1; i++) {
        if (gameHistory[i].number.toString() === lastNum) {
            sizePred = parseInt(gameHistory[i - 1].number) >= 5 ? "BIG" : "SMALL";
            break;
        }
    }

    const numPred = chartData[sizePred][lastNum] || "N/A";

    res.json({
        period: (BigInt(lastResult.issueNumber) + 1n).toString(),
        last_number: lastNum,
        prediction: {
            size: sizePred,
            numbers: numPred
        }
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
