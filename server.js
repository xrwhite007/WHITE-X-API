const express = require('express');
const app = express();

// Render automatically assigns a PORT, or defaults to 3000
const PORT = process.env.PORT || 3000;

const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>SURESHOT PANEL 1M - FIXED MATH</title>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;700&display=swap" rel="stylesheet">
  <style>
    body { background: #08080a; color: #fff; font-family: 'Outfit', sans-serif; padding: 15px; margin: 0; }
    .header { font-size: 24px; font-weight: 700; text-align: center; color: #00ffc8; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 2px; }
    .sub-header { font-size: 10px; text-align: center; color: #666; margin-bottom: 20px; letter-spacing: 1px; }
    .master-signal { background: linear-gradient(145deg, #1a1a1e, #0a0a0a); border: 2px solid #00ffcc; border-radius: 20px; padding: 35px 10px; text-align: center; margin-bottom: 20px; box-shadow: 0 0 40px rgba(0, 255, 204, 0.2); position: relative; }
    .master-signal::before { content: 'SURESHOT 1M'; position: absolute; top: 10px; left: 50%; transform: translateX(-50%); font-size: 8px; color: #00ffcc; opacity: 0.5; border: 1px solid #00ffcc; padding: 2px 10px; border-radius: 10px; }
    #masterResult { font-size: 48px; font-weight: 900; letter-spacing: 3px; text-shadow: 0 0 20px rgba(0,255,200,0.4); }
    #masterColor { font-size: 14px; color: #aaa; margin-top: 15px; font-weight: bold; border-top: 1px solid #222; padding-top: 10px; display: inline-block; width: 80%; }
    .status-card { background: #121212; border-radius: 12px; padding: 12px; margin-bottom: 15px; border: 1px solid #222; text-align: center; }
    #timerDisplay { font-size: 32px; color: #ff4d4d; font-weight: bold; }
    #currentPeriod { font-size: 11px; color: #888; margin-top: 5px; }
    .method-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 20px; }
    .predict-box { background: #111; border: 1px solid #333; padding: 15px 5px; border-radius: 15px; text-align: center; position: relative; }
    .is-leader { border-color: #00ffcc; background: rgba(0, 255, 204, 0.05); transform: scale(1.02); }
    .crown { position: absolute; top: -12px; left: 50%; transform: translateX(-50%); font-size: 14px; }
    .predict-box h3 { font-size: 9px; margin: 0; color: #555; text-transform: uppercase; }
    .pred-val { font-size: 16px; font-weight: 800; margin: 6px 0; }
    .win-loss { font-size: 9px; font-weight: bold; }
    .w-text { color: #00ffcc; } .l-text { color: #ff4c4c; }
    .history-section { background: #111; border-radius: 18px; overflow: hidden; border: 1px solid #222; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    th { background: #1a1a1a; color: #888; padding: 12px; }
    td { padding: 12px; text-align: center; border-bottom: 1px solid #222; }
    .num-circle { display: inline-block; width: 22px; height: 22px; line-height: 22px; border-radius: 50%; font-weight: bold; color: #fff; }
    .green { background: #00b894; } .red { background: #d63031; } 
    .gv { background: linear-gradient(to right, #00b894 50%, #6c5ce7 50%); }
    .rv { background: linear-gradient(to right, #d63031 50%, #6c5ce7 50%); }
  </style>
</head>
<body>
  <div class="header">SURESHOT PANEL</div>
  <div class="sub-header">REALTIME 1 MINUTE PREDICTOR</div>
  <div class="master-signal">
    <div id="masterResult">WAITING</div>
    <div id="masterColor">COLOR SUGGESTION: --</div>
  </div>
  <div class="status-card">
    <div id="timerDisplay">00:60</div>
    <div id="currentPeriod">FETCHING 1M DATA...</div>
  </div>
  <div class="method-grid">
    <div id="box_m1" class="predict-box"><h3>Math 1</h3><div id="v1" class="pred-val">--</div><div id="wl_m1" class="win-loss"><span class="w-text">W:0</span> <span class="l-text">L:0</span></div></div>
    <div id="box_m2" class="predict-box"><h3>Math 2</h3><div id="v2" class="pred-val">--</div><div id="wl_m2" class="win-loss"><span class="w-text">W:0</span> <span class="l-text">L:0</span></div></div>
    <div id="box_m3" class="predict-box"><h3>Math 3</h3><div id="v3" class="pred-val">--</div><div id="wl_m3" class="win-loss"><span class="w-text">W:0</span> <span class="l-text">L:0</span></div></div>
  </div>
  <div class="history-section">
    <table>
      <thead><tr><th>Period</th><th>Num</th><th>BS</th><th>Color</th><th>Result</th></tr></thead>
      <tbody id="resultBody"></tbody>
    </table>
  </div>
<script>
const API = 'https://draw.ar-lottery02.com/WinGo/WinGo_1M/GetHistoryIssuePage.json';
let stats = JSON.parse(localStorage.getItem('ss1m_stats')) || { m1_w:0, m1_l:0, m2_w:0, m2_l:0, m3_w:0, m3_l:0 };
let preds = JSON.parse(localStorage.getItem('ss1m_preds')) || {};
let lastP = localStorage.getItem('ss1m_last') || "";
let leader = "m1";

function startTimer() {
    setInterval(() => {
        let sec = new Date().getSeconds();
        let rem = 60 - sec;
        document.getElementById("timerDisplay").innerText = "00:" + (rem < 10 ? "0" + rem : rem);
        if (rem === 1 || rem === 58) setTimeout(sync, 2500);
    }, 1000);
}

async function sync() {
    try {
        const res = await fetch(API + '?ts=' + Date.now());
        const data = await res.json();
        const list = data.data.list;
        if (list) {
            list.slice(0, 10).reverse().forEach(item => process(item));
            updateUI(list);
        }
    } catch (e) { console.log("Syncing..."); }
}

function process(item) {
    const id = item.issueNumber;
    if (id <= lastP) return;
    const n = parseInt(item.number);
    const s = n >= 5 ? "BIG" : "SMALL";
    if (preds[id]) {
        ["m1", "m2", "m3"].forEach(k => {
            if(preds[id][k] === s) stats[k+"_w"]++; else stats[k+"_l"]++;
        });
        leader = ["m1", "m2", "m3"].reduce((a, b) => stats[a+"_w"] >= stats[b+"_w"] ? a : b);
    }
    lastP = id;
    localStorage.setItem('ss1m_stats', JSON.stringify(stats));
    localStorage.setItem('ss1m_last', lastP);
}

function updateUI(list) {
    const next = (BigInt(list[0].issueNumber) + 1n).toString();
    const lastN = parseInt(list[0].number);
    const lastS = lastN >= 5 ? "BIG" : "SMALL";
    document.getElementById("currentPeriod").innerText = "PERIOD: " + next;
    if (!preds[next]) {
        let m1_res = lastS; 
        let m2_calc = (lastN + parseInt(next.slice(-1))) % 2;
        let m2_res = m2_calc === 0 ? "BIG" : "SMALL";
        let m3_res = (Math.random() > 0.5) ? "BIG" : "SMALL";
        if(m3_res === m1_res && m3_res === m2_res) {
            m3_res = (m1_res === "BIG") ? "SMALL" : "BIG";
        }
        preds[next] = { m1: m1_res, m2: m2_res, m3: m3_res, color: (lastN % 2 === 0) ? "GREEN" : "RED" };
        localStorage.setItem('ss1m_preds', JSON.stringify(preds));
    }
    ["m1", "m2", "m3"].forEach(k => {
        document.getElementById("v"+k.charAt(1)).innerText = preds[next][k];
        document.getElementById("wl_"+k).innerHTML = '<span class="w-text">W:'+stats[k+"_w"]+'</span> <span class="l-text">L:'+stats[k+"_l"]+'</span>';
        let box = document.getElementById("box_"+k);
        box.classList.remove("is-leader");
        let cr = box.querySelector(".crown"); if(cr) cr.remove();
        if(k === leader) {
            box.classList.add("is-leader");
            box.innerHTML += '<span class="crown">👑</span>';
        }
    });
    const finalS = preds[next][leader];
    const mRes = document.getElementById("masterResult");
    mRes.innerText = finalS;
    mRes.style.color = (finalS === "BIG") ? "#00ffcc" : "#ff4c4c";
    document.getElementById("masterColor").innerText = "COLOR SUGGESTION: " + preds[next].color;
    const tbody = document.getElementById('resultBody');
    tbody.innerHTML = '';
    list.slice(0, 10).forEach(item => {
        const n = parseInt(item.number);
        const s = n >= 5 ? 'BIG' : 'SMALL';
        let cn = "RED", cc = "red";
        if(n === 5) { cn="G+V"; cc="gv"; } else if(n === 0) { cn="R+V"; cc="rv"; } else if([1,3,7,9].includes(n)) { cn="GREEN"; cc="green"; }
        let res = preds[item.issueNumber] ? (preds[item.issueNumber][leader] === s ? "✅" : "❌") : "-";
        tbody.innerHTML += '<tr><td>'+item.issueNumber.slice(-4)+'</td><td><span class="num-circle '+cc+'">'+n+'</span></td><td>'+s+'</td><td>'+cn+'</td><td>'+res+'</td></tr>';
    });
}
window.onload = () => { startTimer(); sync(); };
</script>
</body>
</html>
`;

app.get('/', (req, res) => {
    res.send(htmlContent);
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
