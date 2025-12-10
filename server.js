const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const db = new sqlite3.Database("./clean.db");

// ====== Hent alle tasks ======
app.get("/tasks", (req, res) => {
  db.all("SELECT * FROM tasks", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// ====== Legg til task ======
app.post("/tasks", (req, res) => {
  const { title, points } = req.body;
  db.run("INSERT INTO tasks (title, points) VALUES (?, ?)", [title, points], function () {
    res.json({ id: this.lastID, title, points });
  });
});

// ====== Hent alle oppgave-forekomster som er synlige ======
app.get("/instances", (req, res) => {
  db.all(`
    SELECT tl.id, tl.taskId, tl.userId, tl.createdAt, tl.completedAt,
           t.title, t.points,
           u.name AS userName
    FROM task_list tl
    JOIN tasks t ON t.id = tl.taskId
    LEFT JOIN users u ON u.id = tl.userId
    WHERE tl.visible = 1
    ORDER BY datetime(tl.createdAt) DESC
  `, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// ====== Opprett oppgave-forekomst ======
app.post("/instances", (req, res) => {
  const { taskId, userId } = req.body;
  db.get("SELECT * FROM tasks WHERE id = ?", [taskId], (err, task) => {
    if (!task) return res.status(404).json({ error: "Task not found" });
    db.run("INSERT INTO task_list (taskId, userId) VALUES (?, ?)", [taskId, userId], function () {
      res.json({
        id: this.lastID,
        taskId,
        userId,
        title: task.title,
        points: task.points,
        createdAt: new Date().toISOString(),
        completedAt: null
      });
    });
  });
});

// ====== Fullfør oppgave ======
app.put("/instances/:id/complete", (req, res) => {
  const { id } = req.params;
  db.run("UPDATE task_list SET completedAt = datetime('now') WHERE id = ?", [id], function(err){
    if(err) return res.status(500).json({error: err.message});
    res.json({success:true});
  });
});

// ====== Fjern oppgave (usynlig) ======
app.delete("/instances/:id", (req, res) => {
  const { id } = req.params;
  db.run("UPDATE task_list SET visible = 0 WHERE id = ?", [id], function(err){
    if(err) return res.status(500).json({error: err.message});
    res.sendStatus(200);
  });
});

// ====== Hent brukere med poeng ======
app.get("/users", (req, res) => {
  db.all(`
    SELECT u.id, u.name, IFNULL(SUM(t.points),0) AS points
    FROM users u
    LEFT JOIN task_list tl ON tl.userId = u.id AND tl.completedAt IS NOT NULL
    LEFT JOIN tasks t ON t.id = tl.taskId
    GROUP BY u.id
  `, (err, rows) => {
    if(err) return res.status(500).json({error: err.message});
    res.json(rows);
  });
});

// ====== Start server ======
app.listen(PORT, () => console.log(`Server kjører på http://localhost:${PORT}`));
