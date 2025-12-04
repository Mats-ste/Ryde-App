const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const app = express();
const PORT = 67;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const db = new sqlite3.Database("./clean.db");

// ====== HENT ALLE TASKS ======
app.get("/tasks", (req, res) => {
  db.all("SELECT * FROM tasks", (err, rows) => res.json(rows));
});

// ====== LEGG TIL TASK ======
app.post("/tasks", (req, res) => {
  const { title, points } = req.body;
  db.run(
    "INSERT INTO tasks (title, points) VALUES (?, ?)",
    [title, points],
    function () {
      res.json({ id: this.lastID, title, points });
    }
  );
});

// ====== HENT ALLE OPPGAVE-FOREKOMSTER SOM ER VISIBLE ======
app.get("/instances", (req, res) => {
  db.all(`
    SELECT tl.id, tl.taskId, tl.createdAt, tl.completedAt,
           t.title, t.points
    FROM task_list tl
    JOIN tasks t ON t.id = tl.taskId
    WHERE tl.visible = 1
    ORDER BY datetime(tl.createdAt) DESC
  `, (err, rows) => res.json(rows));
});

// ====== OPPRETT OPPGAVE-FOREKOMST ======
app.post("/instances", (req, res) => {
  const { taskId } = req.body;
  db.get("SELECT * FROM tasks WHERE id = ?", [taskId], (err, task) => {
    if (!task) return res.status(404).json({ error: "Task not found" });

    db.run(
      "INSERT INTO task_list (taskId) VALUES (?)",
      [taskId],
      function () {
        res.json({
          id: this.lastID,
          taskId,
          title: task.title,
          points: task.points,
          createdAt: new Date().toISOString(),
          completedAt: null
        });
      }
    );
  });
});

// ====== FULLFØR OPPGAVE ======
app.put("/instances/:id/complete", (req, res) => {
  const { id } = req.params;
  db.run(
    "UPDATE task_list SET completedAt = datetime('now') WHERE id = ?",
    [id],
    function () {
      res.json({ success: true });
    }
  );
});

// ====== FJERN OPPGAVE (GJØR USYNLIG) ======
app.delete("/instances/:id", (req, res) => {
  const { id } = req.params;
  db.run("UPDATE task_list SET visible = 0 WHERE id = ?", [id], function () {
    res.sendStatus(200);
  });
});

// ====== HENT ALLE BRUKERE ======
app.get("/users", (req, res) => {
  db.all("SELECT * FROM users", (err, rows) => res.json(rows));
});

// ====== START SERVER ======
app.listen(PORT, () => console.log(`Server kjører på http://localhost:${PORT}`));
