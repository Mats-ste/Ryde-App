const taskSelect = document.getElementById("taskSelect");
const instanceList = document.getElementById("instanceList");

// Last inn tasks
async function loadTasks() {
  const tasks = await (await fetch("/tasks")).json();
  taskSelect.innerHTML = "";
  tasks.forEach(t => {
    const opt = document.createElement("option");
    opt.value = t.id;
    opt.textContent = `${t.title} (${t.points}p)`;
    taskSelect.appendChild(opt);
  });
}

// Last inn oppgave-forekomster
async function loadInstances() {
  const instances = await (await fetch("/instances")).json();
  instanceList.innerHTML = "";
  instances.sort((a,b) => new Date(b.createdAt)-new Date(a.createdAt));

  instances.forEach(inst => {
    const li = document.createElement("li");
    const done = inst.completedAt ? `<br>[GJORT: ${new Date(inst.completedAt).toLocaleString()}]` : "";
    const created = `<br>[LAGET: ${new Date(inst.createdAt).toLocaleString()}]`;
    const user = inst.userName ? `<br>[Bruker: ${inst.userName}]` : "";

    li.innerHTML = `<strong>${inst.title}</strong> – ${inst.points} poeng${user}${created}${done}<br>
                    <button ${inst.completedAt?"disabled":""} onclick="completeInstance(${inst.id})">Fullfør</button>
                    <button onclick="removeInstance(${inst.id})">Fjern</button>`;
    if(inst.completedAt) li.classList.add("completed");
    instanceList.appendChild(li);
  });
}

// Legg til task
async function addTask() {
  const title = document.getElementById("taskTitle").value;
  const points = document.getElementById("taskPoints").value;
  if(!title || !points) return;
  await fetch("/tasks", {method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({title, points})});
  document.getElementById("taskTitle").value="";
  document.getElementById("taskPoints").value="";
  loadTasks();
}

// Opprett oppgave for bruker
async function createInstance() {
  const taskId = taskSelect.value;
  const userId = document.getElementById("userSelect").value;
  if(!taskId || !userId) return;
  await fetch("/instances",{method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({taskId,userId})});
  loadInstances();
  loadUsers();
}

// Fullfør oppgave
async function completeInstance(id){
  await fetch(`/instances/${id}/complete`, {method:"PUT"});
  loadInstances();
  loadUsers();
}

// Fjern oppgave (usynlig)
async function removeInstance(id){
  await fetch(`/instances/${id}`, {method:"DELETE"});
  loadInstances();
  loadUsers();
}

// Last inn brukere med poeng
async function loadUsers(){
  const users = await (await fetch("/users")).json();
  const container = document.querySelector(".container");
  let userDiv = document.getElementById("userListDiv");
  if(!userDiv){ userDiv=document.createElement("div"); userDiv.id="userListDiv"; container.prepend(userDiv);}
  userDiv.innerHTML = "<h2>Brukere</h2><ul>" + users.map(u=>`<li>${u.name} – ${u.points} poeng</li>`).join("") + "</ul>";

  const userSelect = document.getElementById("userSelect");
  userSelect.innerHTML = "";
  users.forEach(u=>{const opt=document.createElement("option"); opt.value=u.id; opt.textContent=u.name; userSelect.appendChild(opt);});
}

// Start
loadTasks();
loadInstances();
loadUsers();
