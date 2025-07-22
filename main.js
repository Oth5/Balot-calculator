var lnaInput= document.getElementById("lna");
var lhmInput = document.getElementById("lhm");
var lnaOutput= document.getElementById("lnaoutput");
var lhmOutput= document.getElementById("lhmoutput");
var buttonSgl= document.getElementById("sgl")
var totallna = parseInt(localStorage.getItem("lna")) || 0;
var totallhm = parseInt(localStorage.getItem("lhm")) || 0;
lnaOutput.innerHTML=totallna+"<br>----<br>";
lhmOutput.innerHTML=totallhm+"<br>----<br>";

buttonSgl.addEventListener("click",()=>{
var lna=parseInt(lnaInput.value)||0;
var lhm=parseInt(lhmInput.value)||0;

totallna+= lna;
totallhm+=lhm;
 localStorage.setItem("lna",totallna);
  localStorage.setItem("lhm",totallhm);


lnaOutput.innerHTML+= localStorage.getItem("lna")+"<br>----<br>"
lhmOutput.innerHTML+=localStorage.getItem("lhm")+"<br>----<br>"

if (totallna >= 152 | totallhm >= 152) {
    if (totallna > totallhm) {
      alert("🏆 فريقنا فاز!");
    } else if (totallhm > totallna) {
      alert("🏆 الفريق الآخر فاز!");
    } 
    else
    alert("تعادل");


localStorage.removeItem("lna");
localStorage.removeItem("lhm");
lnaOutput.innerHTML=''
lhmOutput.innerHTML=''
totallhm=0;
totallna=0
};
} )