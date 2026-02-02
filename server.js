const axios = require('axios');
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());

let savedHistory = [];
// ১ মিনিটের এপিআই লিঙ্ক
const HISTORY_API = 'https://draw.ar-lottery01.com/WinGo/WinGo_1M/GetHistoryIssuePage.json';

async function updateHistory() {
    try {
        // ১৫নিটি রেজাল্ট পাওয়ার জন্য পেজ সাইজ বাড়ানো হয়েছে
        const res = await axios.get(`${HISTORY_API}?pageSize=150&ts=${Date.now()}`);
        if (res.data && res.data.data && res.data.data.list) {
            savedHistory = res.data.data.list;
            console.log("150 Records Updated. Last Period: ", savedHistory[0].issueNumber);
        }
    } catch (e) {
        console.error("API Fetch Error");
    }
}

// প্রতি ১০ সেকেন্ডে ডাটা রিফ্রেশ
setInterval(updateHistory, 10000);
updateHistory();

app.get('/prediction', (req, res) => {
    if (savedHistory.length < 10) {
        return res.json({ status: "waiting", message: "Not enough data" });
    }

    const lastData = savedHistory[0];
    const lastNum = lastData.number;
    const nextPeriod = (BigInt(lastData.issueNumber) + 1n).toString();

    let prediction = "WAITING...";

    // ১৫০টি রেজাল্টের মধ্যে প্যাটার্ন খোঁজা
    for (let i = 1; i < savedHistory.length - 1; i++) {
        if (savedHistory[i].number === lastNum) {
            // প্যাটার্ন মিললে আগের বার যা এসেছিল তাই দিবে
            prediction = parseInt(savedHistory[i - 1].number) >= 5 ? "BIG" : "SMALL";
            break; 
        }
    }

    // Default Logic ডিলিট করা হয়েছে। প্যাটার্ন না মিললে WAITING দেখাবে।
    res.json({
        period: nextPeriod,
        prediction: prediction
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running with 150-data logic`));
য়া প্যাটার্ন ম্যাচিং লজিক
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
