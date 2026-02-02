const axios = require('axios');
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());

let savedHistory = [];
const HISTORY_API = 'https://draw.ar-lottery01.com/WinGo/WinGo_30S/GetHistoryIssuePage.json';

// ডাটা ফেচ করার ফাংশন
async function updateHistory() {
    try {
        const res = await axios.get(`${HISTORY_API}?ts=${Date.now()}`);
        const newList = res.data.data.list;

        newList.forEach(item => {
            if (!savedHistory.find(s => s.issueNumber === item.issueNumber)) {
                savedHistory.push(item);
            }
        });

        // শুধু লাস্ট ৫০টি ডাটা মেমরিতে রাখবে (সার্ভার ফাস্ট রাখার জন্য)
        savedHistory.sort((a, b) => BigInt(b.issueNumber) > BigInt(a.issueNumber) ? 1 : -1);
        if (savedHistory.length > 50) savedHistory = savedHistory.slice(0, 50);

        console.log("History Updated. Current Period:", savedHistory[0].issueNumber);
    } catch (e) {
        console.error("Fetch Error:", e.message);
    }
}

// প্রতি ৫ সেকেন্ডে ডাটা চেক করবে
setInterval(updateHistory, 5000);

app.get('/prediction', (req, res) => {
    if (savedHistory.length < 2) {
        return res.json({ status: "waiting" });
    }

    const lastP = savedHistory[0].issueNumber;
    const lastNum = savedHistory[0].number;
    const nextPeriod = (BigInt(lastP) + 1n).toString();

    let finalPred = "WAITING...";

    // তোমার দেওয়া HTML এর হুবহু লজিক
    for (let i = 1; i < savedHistory.length - 1; i++) {
        if (savedHistory[i].number === lastNum) {
            const nextResultNum = parseInt(savedHistory[i - 1].number);
            finalPred = nextResultNum >= 5 ? "BIG" : "SMALL";
            break;
        }
    }

    if (finalPred === "WAITING...") {
        finalPred = parseInt(lastNum) >= 5 ? "SMALL" : "BIG";
    }

    res.json({
        period: nextPeriod,
        prediction: finalPred
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
