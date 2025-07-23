
const supabase = window.supabase.createClient('https://wkkppmdkzkexaziynrpp.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indra3BwbWRremtleGF6aXlucnBwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxODk1MDgsImV4cCI6MjA2ODc2NTUwOH0.BjEViHCYLaCvrqDACxzeFTOik16pc1cUk_WKbu8HLYU')

var lnaInput= document.getElementById("lna");
var lhmInput = document.getElementById("lhm");
var lnaOutput= document.getElementById("lnaoutput");
var lhmOutput= document.getElementById("lhmoutput");
var buttonSgl= document.getElementById("sgl")
var buttonRestart = document.getElementById("restart");
let totallna = 0;
let totallhm = 0;
let currentGameId = null;

async function RestartGame(){
const { data, error } = await supabase
  .from('game')
  .insert([{status:'ongoing'}])
  .select()
  .single();

if (error) {
    console.error('Error inserting data:', error);
    return;
  }

currentGameId = data.id;
totallhm = 0;
totallna = 0;
lnaOutput.innerHTML ="0<br>----<br>";
lhmOutput.innerHTML = "0<br>----<br>";
}


buttonSgl.addEventListener("click", async ()=>{
var lna=parseInt(lnaInput.value)||0;
var lhm=parseInt(lhmInput.value)||0;
lnaInput.value="";
lhmInput.value="";
totallna+= lna;
totallhm+=lhm;

lnaOutput.innerHTML+= totallna+"<br>----<br>";
lhmOutput.innerHTML+=totallhm+"<br>----<br>";

if (currentGameId) {
  const { error } = await supabase
    .from('score')
    .insert([
      { team: 'lna', score: totallna, game_id: currentGameId },
      { team: 'lhm', score: totallhm, game_id: currentGameId }
    ]);

  if (error) {
    console.error('Error inserting score:', error);
  }
}




if (totallna >= 152 | totallhm >= 152) {
    if (totallna > totallhm) {
      alert("🏆 فريقنا فاز!");
    } else if (totallhm > totallna) {
      alert("🏆 الفريق الآخر فاز!");
    } 
    else
    alert("تعادل");

await supabase
      .from("game")
      .update({ status: "finished" })
      .eq("id", currentGameId);
    currentGameId = null;

    RestartGame();
  };
} )
buttonRestart.addEventListener("click", async () => {
   await RestartGame();
});

RestartGame();