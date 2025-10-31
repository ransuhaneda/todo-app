const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

const db = new sqlite3.Database('./todos.db', (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Connected to the todos database.');
});

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS todos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task TEXT NOT NULL,
    completed BOOLEAN NOT NULL DEFAULT 0
  )`);
});

app.get('/api/todos', (req, res) => {
  db.all('SELECT * FROM todos', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.post('/api/todos', (req, res) => {
  const { task } = req.body;
  if (!task) {
    res.status(400).json({ error: 'Task is required' });
    return;
  }
  db.run('INSERT INTO todos (task) VALUES (?)', [task], function (err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.status(201).json({ id: this.lastID, task, completed: 0 });
  });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
