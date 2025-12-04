const taskSelect = document.getElementById("taskSelect");
const instanceList = document.getElementById("instanceList");

// ====== LAST INN TASKS ======
async function loadTasks() {
  const res = await fetch("/tasks");
  const tasks = await res.json();

  taskSelect.innerHTML = "";
  tasks.forEach(t => {
    const opt = document.createElement("option");
    opt.value = t.id;
    opt.textContent = `${t.title} (${t.points}p)`;
    taskSelect.appendChild(opt);
  });
}

// ====== LAST INN OPPGAVE-FOREKOMSTER ======
async function loadInstances() {
  const res = await fetch("/instances");
  const instances = await res.json();

  instanceList.innerHTML = "";
  instances.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  instances.forEach(inst => {
    const li = document.createElement("li");

    const doneText = inst.completedAt ? `<br>[GJORT: ${new Date(inst.completedAt).toLocaleString()}]` : "";
    const createdText = `<br>[LAGET: ${new Date(inst.createdAt).toLocaleString()}]`;

    li.innerHTML = `
      <strong>${inst.title}</strong> – ${inst.points} poeng
      ${createdText}
      ${doneText}
      <br>
      <button ${inst.completedAt ? "disabled" : ""} onclick="completeInstance(${inst.id})">Fullfør</button>
      <button onclick="removeInstance(${inst.id})">Fjern</button>
    `;

    instanceList.appendChild(li);
  });
}

// ====== LEGG TIL TASK ======
async function addTask() {
  const title = document.getElementById("taskTitle").value;
  const points = document.getElementById("taskPoints").value;
  if (!title || !points) return;

  await fetch("/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, points })
  });

  document.getElementById("taskTitle").value = "";
  document.getElementById("taskPoints").value = "";
  loadTasks();
}

// ====== OPPRETT FOREKOMST ======
async function createInstance() {
  const taskId = taskSelect.value;
  await fetch("/instances", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ taskId })
  });
  loadInstances();
}

// ====== FULLFØR ======
async function completeInstance(id) {
  await fetch(`/instances/${id}/complete`, { method: "PUT" });
  loadInstances();
}

// ====== FJERN (GJØR USYNLIG) ======
async function removeInstance(id) {
  await fetch(`/instances/${id}`, { method: "DELETE" });
  loadInstances();
}

// ====== VIS ALLE BRUKERE ======
async function loadUsers() {
  const res = await fetch("/users");
  const users = await res.json();

  const container = document.querySelector(".container");
  let userDiv = document.getElementById("userListDiv");
  if (!userDiv) {
    userDiv = document.createElement("div");
    userDiv.id = "userListDiv";
    container.appendChild(userDiv);
  }

  userDiv.innerHTML = "<h2>Brukere</h2><ul>" +
    users.map(u => `<li>${u.name}</li>`).join("") +
    "</ul>";
}

// ====== START ======
loadTasks();
loadInstances();
loadUsers();
