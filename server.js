const axios = require('axios');
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());

let savedHistory = [];
// ৩০ সেকেন্ড গেমের অফিশিয়াল এপিআই লিঙ্ক
const HISTORY_API = 'https://draw.ar-lottery01.com/WinGo/WinGo_30S/GetHistoryIssuePage.json';

// ডাটা ফেচ এবং আপডেট করার ফাংশন
async function updateHistory() {
    try {
        const res = await axios.get(`${HISTORY_API}?ts=${Date.now()}`);
        const newList = res.data.data.list;

        newList.forEach(item => {
            // নতুন পিরিয়ড আসলে সেটা লিস্টে সেভ করবে
            if (!savedHistory.find(s => s.issueNumber === item.issueNumber)) {
                savedHistory.push(item);
            }
        });

        // লেটেস্ট ৫০টি রেজাল্ট রাখবে যাতে হিস্ট্রি চেক করা যায়
        savedHistory.sort((a, b) => BigInt(b.issueNumber) > BigInt(a.issueNumber) ? 1 : -1);
        if (savedHistory.length > 50) savedHistory = savedHistory.slice(0, 50);

        console.log("Latest Period Updated:", savedHistory[0].issueNumber);
    } catch (e) {
        console.error("Fetch Error:", e.message);
    }
}

// প্রতি ৫ সেকেন্ডে নতুন ডাটা চেক করবে
setInterval(updateHistory, 5000);

// রুট পাথ ঠিক করা যাতে "Cannot GET /" না আসে
app.get('/', (req, res) => {
    res.send("Server is Live! Prediction endpoint: /prediction");
});

app.get('/prediction', (req, res) => {
    if (savedHistory.length < 2) {
        return res.json({ status: "waiting" });
    }

    const lastP = savedHistory[0].issueNumber;
    const lastNum = savedHistory[0].number;
    
    // পিরিয়ডের সাথে ১ যোগ করে নেক্সট পিরিয়ড তৈরি
    const nextPeriod = (BigInt(lastP) + 1n).toString();

    let finalPred = "WAITING...";

    // তোমার দেওয়া প্যাটার্ন ম্যাচিং লজিক
    for (let i = 1; i < savedHistory.length - 1; i++) {
        if (savedHistory[i].number === lastNum) {
            const nextResultNum = parseInt(savedHistory[i - 1].number);
            finalPred = nextResultNum >= 5 ? "BIG" : "SMALL";
            break;
        }
    }

    // প্যাটার্ন না পাওয়া গেলে লাস্ট নম্বরের উল্টো প্রেডিকশন
    if (finalPred === "WAITING...") {
        finalPred = parseInt(lastNum) >= 5 ? "SMALL" : "BIG";
    }

    res.json({
        period: nextPeriod,
        prediction: finalPred
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
