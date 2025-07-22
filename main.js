var lnaInput= document.getElementById("lna");
var lhmInput = document.getElementById("lhm");
var lnaOutput= document.getElementById("lnaoutput");
var lhmOutput= document.getElementById("lhmoutput");
var buttonSgl= document.getElementById("sgl")
var totallna=0;
var totallhm=0;

buttonSgl.addEventListener("click",()=>{
var lna=parseInt(lnaInput.value)||0;
var lhm=parseInt(lhmInput.value)||0;

totallna+= lna;
totallhm+=lhm;
 

lnaOutput.innerHTML+= totallna+"<br>----<br>"
lhmOutput.innerHTML+=totallhm+"<br>----<br>"

if (totallna >= 152 | totallhm >= 152) {
    if (totallna > totallhm) {
      alert("🏆 فريقنا فاز!");
    } else if (totallhm > totallna) {
      alert("🏆 الفريق الآخر فاز!");
    } 
    else
    alert("تعادل");


totallna= 0;
totallhm=0;
 lnaOutput.innerHTML= ""
lhmOutput.innerHTML=''
};
} )