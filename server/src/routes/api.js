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

router.patch('/:id', (req, res) => {
  const { id } = req.params;
  const { task, completed } = req.body;

  if (!id || isNaN(id)) {
    return res.status(400).json({ error: 'Valid ID is required' });
  }

  if (task === undefined && completed === undefined) {
    return res.status(400).json({ error: 'At least one field (task or completed) is required for update' });
  }

  if (task !== undefined && task.trim() === '') {
    return res.status(400).json({ error: 'Task cannot be empty' });
  }

  const updates = [];
  const values = [];

  if (task !== undefined) {
    updates.push('task = ?');
    values.push(task.trim());
  }

  if (completed !== undefined) {
    updates.push('completed = ?');
    values.push(completed ? 1 : 0);
  }

  values.push(id);

  const prepstmt = db.prepare(`UPDATE todos SET ${updates.join(', ')} WHERE id = ?`);

  prepstmt.run(...values, function (err) {
    prepstmt.finalize();

    if (err) {
      res.status(500).json({ error: 'Unexpected Error: Todo Modification Failed' });
      return;
    }

    if (this.changes === 0) {
      res.status(404).json({ error: 'Todo not found' });
      return;
    }

    db.get('SELECT * FROM todos WHERE id = ?', [id], (err, row) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      if (!row) {
        res.status(404).json({ error: 'Todo not found after updating' });
        return;
      }

      res.json({
        id: row.id,
        task: row.task,
        completed: row.completed === 1
      });
    });
  });
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