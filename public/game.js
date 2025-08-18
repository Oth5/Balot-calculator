document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document
      .querySelectorAll(".tab")
      .forEach((t) => t.classList.remove("active"));
    document
      .querySelectorAll(".panel")
      .forEach((p) => p.classList.remove("active"));
    tab.classList.add("active");
    document.querySelector(tab.dataset.target).classList.add("active");
  });
});
const API_URL = window.location.hostname.includes("localhost")
  ? "http://localhost:3000"   // لو تشغل محلي
  : "https://balot-calculator-production.up.railway.app"; // لو على Railway

async function loadUsers() {
  const tbody = document.getElementById("usersTable");
  tbody.innerHTML = `<tr><td colspan="3">جاري التحميل...</td></tr>`;
  try {
    const d = await axios.get(`${API_URL}/users`);
    const result = d.data;

    if (result.length === 0) {
      return (tbody.innerHTML = `<tr><td colspan="3">لا يوجد مستخدمين</td></tr>`);
    }

    const tableshow = result
      .map(
        (results) => `
            <tr>
                <td>${results.id}</td>
                <td>${results.username}</td>
            <td>
                        <button class="btn-outline-red" onclick="removeUser(${results.id})">حذف</button>
                      </td>
            </tr>
            `
      )
      .join("");
    tbody.innerHTML = tableshow;
  } catch (e) {
    console.error(e);
    tbody.innerHTML = `<tr><td colspan="3">تعذر تحميل المستخدمين</td></tr>`;
  }
}

async function addusers() {
  const input = document.getElementById("newUsername");

  const name = input.value.trim();

  if (!name) {
    alert("رجاء ادخل الاسم");
    return;
  }
  try {
    const { data } = await axios.post(API_URL + "/users", { username: name });
    input.value = "";
    await loadUsers();
    alert(`تمت الإضافة (ID: ${data.id})`);
  } catch (e) {
    alert("تعذر إضافة المستخدم: ");
    console.error(e.code);
  }
}

async function GetUserById() {
  const tbody = document.getElementById("usersTable");
  const findUserId = document.getElementById("findUserId").value.trim();
  tbody.innerHTML = `<tr><td colspan="3">جاري البحث...</td></tr>`;

  if (!findUserId) {
    tbody.innerHTML = `<tr><td colspan="3">الرجاء إدخال ID</td></tr>`;
    return;
  }
  try {
    const result = await axios.get(`${API_URL}/users/${findUserId}`);
    let results = result.data;
    if (!results || !results.id) {
      tbody.innerHTML = `<tr><td colspan="3">لم يتم العثور على المستخدم</td></tr>`;
      return;
    }

    tbody.innerHTML = `<tr>
                  <td>${results.id}</td>
                  <td>${results.username}</td>
                  <td> 
                          <button class="btn-outline-red" onclick="removeUser(${results.id})">حذف</button>
                  </td>


                  </tr>`;
  } catch (err) {
    console.error(err);
    tbody.innerHTML = `<tr><td colspan="3">خطأ أثناء جلب البيانات</td></tr>`;
  }
}

async function removeUser(id) {
  if (parseInt(id) === 1) {
    alert("ما تقدر تحذف player1");
    return;
  }

  if (!confirm("هل أنت متأكد أنك تريد حذف هذا المستخدم؟")) return;

  try {
    const res = await axios.delete(`${API_URL}/users/${id}`);
    await loadUsers();
    alert("تم حذف المستخدم بنجاح");
  } catch (err) {
    console.error(err);
    alert("تعذر حذف المستخدم ❌");
  }
}

document.getElementById("viewUserBtn").addEventListener("click", GetUserById);

document.getElementById("refreshUsersBtn").addEventListener("click", loadUsers);
document.getElementById("findUserId").addEventListener("keydown", (e) => {
  if (e.key === "Enter") GetUserById();
});

document.getElementById("addUserBtn").addEventListener("click", addusers);
document.getElementById("newUsername").addEventListener("keydown", (e) => {
  if (e.key === "Enter") addusers();
});

loadUsers();

//الجلسات
async function loadGames() {
  const tbody = document.getElementById("gamesTable");
  tbody.innerHTML = `<tr><td colspan="4">جاري التحميل...</td></tr>`;
  try {
    const d = await axios.get(`${API_URL}/games`);
    const result = d.data;
    if (result.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4">لايوجد جلسات</td></tr>`;
      return;
    }
    tbody.innerHTML = result
      .map(
        (r) =>
          `<tr>
<td>${r.id}</td>
<td>${r.status}</td>
 <td>${
   r.start_time
     ? new Date(r.start_time).toLocaleString("ar-EG", {
         hour: "2-digit",
         minute: "2-digit",
         month: "long",
         day: "2-digit",
       })
     : "-"
 }</td>
<td>
<button class="btn-outline-blue" onclick="ChangeState(${
            r.id
          })">تعديل الحاله</button>
<button class="btn-outline-red" onclick="GoPlay(${
            r.id
          })">الانتقال الى اللعب</button>
</td>
</tr>
`
      )
      .join("");
  } catch (e) {
    console.error(e);
    tbody.innerHTML = `<tr><td colspan="4">تعذر تحميل المستخدمين</td></tr>`;
  }
}
loadGames();

//اضافه جلسه
async function addGame() {
  try {
    const d = await axios.post(`${API_URL}/games`, { users_id: 1 });
    GoPlay(d.data.game.id);
    await loadGames();
    alert(`تمت الإضافة (ID: ${d.data.game.id})`);
  } catch (e) {
    alert(`تعذر انشاء الجلسه`);
    console.error(e.code, e);
  }
}

document.getElementById("createGameBtn").addEventListener("click", addGame);

async function ChangeState(Id) {
  const newStatus = prompt("أدخل الحالة الجديدة (مثال: ongoing أو finished):");

  if (!newStatus) return;

  try {
    const { data } = await axios.patch(`${API_URL}/games/${Id}`, {
      status: newStatus,
    });

    alert(`✅ تم تحديث الحالة إلى "${data.status}"`);
    loadGames();
  } catch (err) {
    console.error(err);
    alert("❌ تعذر تعديل الحالة");
  }
}

async function GoPlay(id) {
  try {
    const d = await axios.get(`${API_URL}/games/${id}`);
    if (d.data.status === "finished") {
      alert("الصكه منتهيه ماتقدر توصل لها");
      return;
    }

    window.location.href = `index.html?game_id=${encodeURIComponent(id)}`;
  } catch (e) {
    alert("مشكله في الانتقال");
    console.error(e.code, e);
  }
}

document.getElementById("refreshGamesBtn").addEventListener("click", loadGames);
