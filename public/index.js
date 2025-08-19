const API_URL = window.location.hostname.includes("localhost")
  ? "http://localhost:3000"   // لو تشغل محلي
  : "https://balot-calculator-production.up.railway.app"; // لو على Railway

let totalLna = 0;
let totalLhm = 0;

function readId() {
  const id = new URLSearchParams(location.search).get("game_id");
  return id;
}

async function loadscores() {
  const lnaoutput = document.getElementById("lnaoutput");
  const lhmoutput = document.getElementById("lhmoutput");

  const gameId = readId();

  if (!gameId) {
    lnaoutput.textContent = "لا يوجد game_id";
    lhmoutput.textContent = "لا يوجد game_id";
    return;
  }
  totalLna = 0;
  totalLhm = 0;
  lnaoutput.innerHTML = "";
  lhmoutput.innerHTML = "";
  try {
    const d = await axios.get(`${API_URL}/scores/${gameId}`);
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

  const gameId = readId();

  try {
    if (lnainput) {
      totalLna += parseInt(lnainput);
      await axios.post(`${API_URL}/scores`, {
        game_id: parseInt(gameId),
        team: "lna",
        score: totalLna,
      });
    }

    if (lhminput) {
      totalLhm += parseInt(lhminput);
      await axios.post(`${API_URL}/scores`, {
        game_id: parseInt(gameId),
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
  const gameId = readId();
  try {
    await axios.patch(`${API_URL}/games/${gameId}`, { status: "finished" });

    const cur = await axios.get(`${API_URL}/games/${gameId}`);
    const userId = cur.data?.users_id;
    if (!userId) {
      alert("تعذر معرفة صاحب الصكة الحالية لبدء صكة جديدة");
      return;
    }

    const res = await axios.post(`${API_URL}/games`, { users_id: userId });

    alert("✅ تم إنهاء الصكه وإنشاء صكه جديدة");
    const newGameId = res.data.game.id;
    window.location.href = `index.html?game_id=${encodeURIComponent(newGameId)}`;
  } catch (e) {
    console.error(e?.response?.data || e);
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
  const id = readId(); 
  if (!id) return alert("لا يوجد game_id في الرابط");

  try {
    const { data } = await axios.get(`${API_URL}/games/${encodeURIComponent(id)}`);
    const userId = data.users_id

    if (!userId) {
      alert("تعذر معرفة المستخدم لهذه الصكة");
      return;
    }

    window.location.href = `user.html?users_id=${encodeURIComponent(userId)}`; 
  } catch (e) {
    console.error(e?.response?.data || e);
    alert("خطأ في الانتقال إلى صفحة اليوزر");
  }
}
