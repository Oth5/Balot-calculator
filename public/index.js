const API_URL = "http://localhost:3000";

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
  const lnaoutput=document.getElementById("lnaoutput")
    const lhmoutput=document.getElementById("lhmoutput")

  const gameId = readId();


  try {
    if (lnainput) {
        totalLna+=parseInt(lnainput)
      await axios.post(`${API_URL}/scores`, {
        game_id: parseInt(gameId),
        team: "lna",
        score: totalLna,
      });
    }

    if (lhminput) {
      totalLhm+=parseInt(lhminput)
      await axios.post(`${API_URL}/scores`, {
        game_id: parseInt(gameId),
        team: "lhm",
        score: totalLhm,
      });
    }

 
  lnaEl.value = "";
    lhmEl.value = "";
   
   await loadscores();
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
  


function newgame(){


}