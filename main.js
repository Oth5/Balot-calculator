const supabase = window.supabase.createClient(
  'https://wkkppmdkzkexaziynrpp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indra3BwbWRremtleGF6aXlucnBwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxODk1MDgsImV4cCI6MjA2ODc2NTUwOH0.BjEViHCYLaCvrqDACxzeFTOik16pc1cUk_WKbu8HLYU'
);

const lnaInput = document.getElementById("lna");
const lhmInput = document.getElementById("lhm");
const lnaOutput = document.getElementById("lnaoutput");
const lhmOutput = document.getElementById("lhmoutput");
const buttonSgl = document.getElementById("sgl");
const buttonRestart = document.getElementById("restart");

let totallna = 0;
let totallhm = 0;
let currentGameId = null;

async function fetchCurrentGame() {
  const { data: game, error: gameError } = await supabase
    .from("game")
    .select()
    .eq("status", "ongoing")
    .order("id", { ascending: false })
    .limit(1)
    .single();

  if (gameError) {
    console.error("خطأ في جلب اللعبة:", gameError);
    return;
  }

  currentGameId = game.id;

  const { data: scores, error: scoreError } = await supabase
    .from("score")
    .select()
    .eq("game_id", currentGameId);

  if (scoreError) {
    console.error("خطأ في جلب النقاط:", scoreError);
    return;
  }

  totallna = scores
    .filter((s) => s.team === "lna")
    .reduce((sum, s) => sum + s.score, 0);

  totallhm = scores
    .filter((s) => s.team === "lhm")
    .reduce((sum, s) => sum + s.score, 0);

  lnaOutput.innerHTML = totallna + "<br>----<br>";
  lhmOutput.innerHTML = totallhm + "<br>----<br>";
}

async function RestartGame() {
  const { data, error } = await supabase
    .from("game")
    .insert([{ status: "ongoing" }])
    .select()
    .single();

  if (error) {
    console.error("خطأ في بدء اللعبة:", error);
    return;
  }

  currentGameId = data.id;
  totallna = 0;
  totallhm = 0;
  lnaOutput.innerHTML = "0<br>----<br>";
  lhmOutput.innerHTML = "0<br>----<br>";
}

buttonSgl.addEventListener("click", async () => {
  const lna = parseInt(lnaInput.value) || 0;
  const lhm = parseInt(lhmInput.value) || 0;
  lnaInput.value = "";
  lhmInput.value = "";

  totallna += lna;
  totallhm += lhm;

  lnaOutput.innerHTML += totallna + "<br>----<br>";
  lhmOutput.innerHTML += totallhm + "<br>----<br>";

  if (currentGameId) {
    const { error } = await supabase.from("score").insert([
      { team: "lna", score: lna, game_id: currentGameId },
      { team: "lhm", score: lhm, game_id: currentGameId },
    ]);

    if (error) {
      console.error("خطأ في حفظ النقاط:", error);
    }
  }

  if (totallna >= 152 || totallhm >= 152) {
    let message = "";
    if (totallna > totallhm) {
      message = "🏆 فريقنا فاز!";
    } else if (totallhm > totallna) {
      message = "🏆 الفريق الآخر فاز!";
    } else {
      message = "تعادل";
    }

    alert(message);

    await supabase
      .from("game")
      .update({ status: "finished" })
      .eq("id", currentGameId);

    currentGameId = null;
    await RestartGame();
  }
});

buttonRestart.addEventListener("click", async () => {
  await RestartGame();
});

fetchCurrentGame();
