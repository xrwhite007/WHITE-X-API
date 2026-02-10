const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;

// গ্লোবাল স্টেট
let currentLogic = 1; 
let lastAnalyzedPeriod = "";
let lastPredictionData = null;

// প্রতিটি লজিকের উইন-লস ট্র্যাক করার জন্য অবজেক্ট
let tracker = {
  1: { consecutiveWins: 0, consecutiveLosses: 0 },
  2: { consecutiveWins: 0, consecutiveLosses: 0 },
  3: { consecutiveWins: 0, consecutiveLosses: 0 }
};

const API_URL = 'https://draw.ar-lottery01.com/WinGo/WinGo_1M/GetHistoryIssuePage.json';

const mathRules = {
  1: (h) => ( (parseInt(h[0].number) + 3) % 2 === 0 ? "BIG" : "SMALL" ),
  2: (h) => ( (parseInt(h[0].number) + parseInt(h[1].number)) >= 9 ? "BIG" : "SMALL" ),
  3: (h) => ( parseInt(h[0].number) >= 5 ? "SMALL" : "BIG" )
};

async function getPrediction() {
  try {
    const response = await axios.get(`${API_URL}?t=${Date.now()}`);
    const history = response.data.data.list;
    const currentPeriod = history[0].issueNumber;

    if (lastAnalyzedPeriod === currentPeriod && lastPredictionData) {
      return lastPredictionData;
    }

    const lastNum = parseInt(history[0].number);
    const actualResult = lastNum >= 5 ? "BIG" : "SMALL";

    // ১. ব্যাকগ্রাউন্ডে ৩টি লজিকই চেক করা এবং তাদের উইন/লস আপডেট করা
    if (lastAnalyzedPeriod !== "") {
      [1, 2, 3].forEach(id => {
        // আগের পিরিয়ডে এই লজিকটি কী প্রেডিকশন দিয়েছিল
        let pred = mathRules[id](history.slice(1));
        
        if (pred === actualResult) {
          tracker[id].consecutiveWins++;
          tracker[id].consecutiveLosses = 0;
        } else {
          tracker[id].consecutiveLosses++;
          tracker[id].consecutiveWins = 0;
        }
      });

      // ২. লজিক সুইসিং কন্ডিশন:
      // যদি বর্তমান লজিক টানা ২ বার লস করে
      if (tracker[currentLogic].consecutiveLosses >= 2) {
        // এমন লজিক খোঁজা যেটি টানা ২ বার উইন হয়েছে
        let bestLogic = [1, 2, 3].find(id => tracker[id].consecutiveWins >= 2);
        
        if (bestLogic) {
          currentLogic = bestLogic;
        } else {
          // যদি কেউ টানা ২ বার উইন না থাকে, তবে র‍্যান্ডমলি একটা বেছে নিবে
          currentLogic = Math.floor(Math.random() * 3) + 1;
        }
      }
    }

    lastAnalyzedPeriod = currentPeriod;

    // নতুন প্রেডিকশন জেনারেট করা
    let prediction = mathRules[currentLogic](history);
    const nextPeriod = (BigInt(currentPeriod) + 1n).toString();

    lastPredictionData = {
      period: nextPeriod,
      prediction: prediction,
      color: prediction === "BIG" ? "RED" : "GREEN",
      current_logic: currentLogic,
      stats: tracker, // বোঝার সুবিধার্থে সব লজিকের স্ট্যাটাস পাঠানো হচ্ছে
      timestamp: new Date().toISOString()
    };

    return lastPredictionData;

  } catch (error) {
    return { error: "API Failed", message: error.message };
  }
}

app.get('/predict', async (req, res) => {
  const data = await getPrediction();
  res.json(data);
});

app.listen(PORT, () => console.log(`Smart Logic Server running on port ${PORT}`));
