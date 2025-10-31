const express = require('express');
const router = express.Router();
const db = require('../database/db');

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

router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { task, completed } = req.body;

  if (!task) {
    req.status(400).json({ error: 'Task is required' });
    return;
  }

  db.run(
    'UPDATE todos SET task = ?, completed = ? WHERE id = ?',
    [task, completed ? 1 : 0, id],

    function (err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      if (this.changes === 0) {
        req.status(404).json({ error: 'Todo not found' });
        return;
      }
      res.json({ id: parseInt(id), task, completed });
    }
  );
});


router.delete('/:id', (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM todos WHERE id = ?', [id], function (err) {
    if (err) {
      req.status(500).json({ error: err.message });
      return;
    }

    if (this.changes === 0) {
      req.status(404).json({ error: 'Todo not found' });
      return;
    }

    req.status(204).send();
  })
})

module.exports = router;