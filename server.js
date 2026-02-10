const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

app.use(cors());
const PORT = process.env.PORT || 10000;

// শুরুতেই র‍্যান্ডমলি ১টি লজিক সেট করা
let currentLogic = Math.floor(Math.random() * 3) + 1; 
let lastAnalyzedPeriod = "";
let lastPredictionData = null;

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

// র‍্যান্ডম লজিক বেছে নেওয়ার ফাংশন
function getRandomLogic(excludeId) {
  let ids = [1, 2, 3].filter(id => id !== excludeId);
  return ids[Math.floor(Math.random() * ids.length)];
}

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

    if (lastAnalyzedPeriod !== "") {
      // ব্যাকগ্রাউন্ডে ৩টি লজিকই চেক করা
      [1, 2, 3].forEach(id => {
        let pred = mathRules[id](history.slice(1)); 
        if (pred === actualResult) {
          tracker[id].consecutiveWins++;
          tracker[id].consecutiveLosses = 0;
        } else {
          tracker[id].consecutiveLosses++;
          tracker[id].consecutiveWins = 0;
        }
      });

      // আপনার শর্ত: ২ বার লস হলে ২ বার উইন হওয়া লজিকে যাবে
      if (tracker[currentLogic].consecutiveLosses >= 2) {
        let bestLogic = [1, 2, 3].find(id => tracker[id].consecutiveWins >= 2);
        
        if (bestLogic) {
          currentLogic = bestLogic; 
        } else {
          // যদি কেউ ২ বার উইন না থাকে, তবে র‍্যান্ডমলি লজিক বদলাবে
          currentLogic = getRandomLogic(currentLogic);
        }
      } 
      // এমনিতে ১ বার লস হলেও লজিক র‍্যান্ডমলি চেঞ্জ হবে (আপনার র‍্যান্ডম কন্ডিশন)
      else if (tracker[currentLogic].consecutiveLosses === 1) {
        currentLogic = getRandomLogic(currentLogic);
      }
    }

    lastAnalyzedPeriod = currentPeriod;
    let prediction = mathRules[currentLogic](history);
    const nextPeriod = (BigInt(currentPeriod) + 1n).toString();

    lastPredictionData = {
      period: nextPeriod.slice(-4),
      full_period: nextPeriod,
      prediction: prediction,
      color: prediction === "BIG" ? "#FF4D4D" : "#00FF88",
      logic_id: currentLogic,
      stats: tracker,
      timestamp: new Date().toLocaleTimeString('en-GB')
    };

    return lastPredictionData;

  } catch (error) {
    return { error: "API_ERROR" };
  }
}

app.get('/predict', async (req, res) => {
  const data = await getPrediction();
  res.json(data);
});

app.get('/', (req, res) => {
  res.send("Server is Running with Fully Randomized Adaptive Logic!");
});

app.listen(PORT, () => {
  console.log(`Server live on port ${PORT}`);
});
