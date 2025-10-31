const express = require('express');
const router = express.Router();
const db = require('../database/dbConfig');

router.get('/', (req, res) => {
  db.all('SELECT * FROM todos', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

router.post('/', (req, res) => {
  const { task } = req.body;

  if (!task || task.trim() === '') {
    return res.status(400).json({ error: 'Task is required' });
  }

  db.run('INSERT INTO todos (task) VALUES (?)', [task.trim()], function (err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.status(201).json({ id: this.lastID, task, completed: 0 });
  });
});

router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { task, completed } = req.body;

  if (!id || isNaN(id)) {
    return res.status(400).json({ error: 'Valid ID is required' });
  }

  if (!task || task.trim() === '') {
    return res.status(400).json({ error: 'Task is required' });
  }

  const prepstmt = db.prepare('UPDATE todos SET task = ?, completed = ? WHERE id = ?');

  prepstmt.run(task, completed ? 1 : 0, id, function (err) {
    prepstmt.finalize();

    if (err) {
      res.status(500).json({ error: 'Unexpected Error: Todo Modification Failed' });
      return;
    }

    if (this.changes === 0) {
      res.status(404).json({ error: 'Todo not found' });
      return;
    }
    res.json({ id: parseInt(id), task: task.trim(), completed });
  }
  );
});


router.delete('/:id', (req, res) => {
  const { id } = req.params;

  if (!id || isNaN(id)) {
    return res.status(400).json({ error: 'Valid ID is required' });
  }

  const prepstmt = db.prepare('DELETE FROM todos WHERE id = ?');
  prepstmt.run(id, function (err) {
    prepstmt.finalize();

    if (err) {
      res.status(500).json({ error: 'Unexpected Error: Todo Deletion Failed' });
      return;
    }

    if (this.changes === 0) {
      res.status(404).json({ error: 'Todo not found' });
      return;
    }

    res.status(204).send();
  })
})

module.exports = router;