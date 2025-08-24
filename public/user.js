const API_URL = window.location.hostname.includes("localhost")
  ? "http://localhost:3000"   // لو تشغل محلي
  : "https://balot-calculator-production.up.railway.app"; // لو على Railway

let totalLna = 0;
let totalLhm = 0;

  const token = localStorage.getItem("authToken");
  if (!token) {
    window.location.href = "login.html";
  } else {
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  }
  
  async function loadscores() {
  const lnaoutput = document.getElementById("lnaoutput");
  const lhmoutput = document.getElementById("lhmoutput");

  totalLna = 0;
  totalLhm = 0;
  lnaoutput.innerHTML = "";
  lhmoutput.innerHTML = "";
  try {
    const d = await axios.get(`${API_URL}/scores/current`);
    const result = d.data;

    result.forEach((e) => {
      if (e.team === "lna") {
        totalLna += e.score;
        lnaoutput.innerHTML += e.score + "<br>";
      } else if (e.team === "lhm") {
        totalLhm += e.score;
        lhmoutput.innerHTML += e.score + "<br>";
      }
    });
    lnaoutput.innerHTML += "----<br>المجموع: " + totalLna;
    lhmoutput.innerHTML += "----<br>المجموع: " + totalLhm;
  } catch (e) {
    alert("خطا في جلب القيم");
    console.error(e.code, e);
  }
}

async function addScores() {
  const lnaEl = document.getElementById("lna");
  const lhmEl = document.getElementById("lhm");
  const lnainput = lnaEl.value.trim();
  const lhminput = lhmEl.value.trim();
  const lnaoutput = document.getElementById("lnaoutput");
  const lhmoutput = document.getElementById("lhmoutput");


  try {
    if (lnainput) {
      totalLna += parseInt(lnainput);
      await axios.post(`${API_URL}/scores/current`, {
        team: "lna",
        score: totalLna,
      });
    }

    if (lhminput) {
      totalLhm += parseInt(lhminput);
      await axios.post(`${API_URL}/scores/current`, {
        team: "lhm",
        score: totalLhm,
      });
    }

    lnaEl.value = "";
    lhmEl.value = "";

    await loadscores();

    await CheckWinner();
  } catch (e) {
    console.error(e);
    alert("خطأ في إضافة السكور");
  }
}
loadscores();
document.getElementById("sgl").addEventListener("click", addScores);
document.getElementById("lna").addEventListener("keydown", (k) => {
  if (k.key === "Enter") addScores();
});

document.getElementById("lhm").addEventListener("keydown", (k) => {
  if (k.key === "Enter") addScores();
});
async function newgame() {
  try{
  try {
    await axios.patch(`${API_URL}/games`, { status: "finished" });
} catch (err) {
      const code = err?.response?.status;
      if (code && code !== 404) throw err; 
}
    const res = await axios.post(`${API_URL}/games`, {});

    alert("✅ تم إنهاء الصكه وإنشاء صكه جديدة");
    window.location.href = `userpage.html`;
  } catch (e) {
    console.error(e?.response?.data, e.message);
    alert("❌ خطأ في إنشاء الصكه الجديدة");
  }
}


async function CheckWinner() {
  if (totalLna < 152 && totalLhm < 152) return;
  else if (totalLna >= 152 && totalLna > totalLhm) {
    alert("🏆 فاز فريقنا");
    await newgame();
  } else if (totalLhm >= 152 && totalLna < totalLhm) {
    alert("🏆 فاز فريقهم");
    await newgame();
  } else if (totalLna >= 152 && totalLhm >= 152 && totalLna === totalLhm) {
    alert("🔥تعادل افصلوها بصكه");
    return;
  } else {
    return;
  }
}
document.getElementById("restart").addEventListener("click", newgame);

async function backtopage() {

  try {
    window.location.href = `user.html`; 
  } catch (e) {
    console.error(e?.response?.data || e);
    alert("خطأ في الانتقال إلى صفحة اليوزر");
  }
}
