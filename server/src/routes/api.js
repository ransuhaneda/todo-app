const express = require('express');
const router = express.Router();
const db = require('../database/dbConfig');

const handleDbError = (res, err, errorMessage = 'Database operation failed') => {
  console.error('Database error:', err);
  res.status(500).json({ error: errorMessage });
};

const executeQuery = (query, params = []) => {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare(query);
    stmt.all(params, (err, rows) => {
      stmt.finalize();
      if (err) reject(err);
      else resolve(rows);
    })
  })
}

const executeRun = (query, params = []) => {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare(query);
    stmt.run(params, function (err) {
      stmt.finalize();
      if (err) reject(err);
      else resolve(this);
    })
  });
};

const getTodos = async (req, res) => {
  try {
    const search = req.query.search || '';
    let rows;

    if (search) {
      rows = await executeQuery('SELECT * FROM todos WHERE LOWER(task) LIKE LOWER(?)', [`%${search}%`]);
    } else {
      rows = await executeQuery('SELECT * FROM todos', []);
    }

    res.json(rows);
  } catch (err) {
    handleDbError(res, err, 'Failed to fetch todo')
  }
};

const createTodo = async (req, res) => {
  try {
    const { task } = req.body;

    if (!task || task.trim() === '') {
      return res.status(400).json({ error: 'Task is required' });
    }

    const result = await executeRun(
      'INSERT INTO todos (task) VALUES (?)', [task.trim()]
    )

    res.status(201).json({
      id: result.lastID,
      task: task.trim(),
      completed: 0
    });
  } catch (err) {
    handleDbError(res, err, 'Failed to create todo')
  }
};

const updateTodo = async (req, res) => {
  try {
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

    updates.push('updated_at = CURRENT_TIMESTAMP')
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
  } catch (err) {
    handleDbError(res, err, 'Failed to update todo')
  }
};

const deleteTodo = async (req, res) => {
  try {
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
  } catch (err) {
    handleDbError(res, err, 'Failed to delete todo')
  }
}

router.get('/', getTodos);
router.post('/', createTodo);
router.patch('/:id', updateTodo);
router.delete('/:id', deleteTodo);

module.exports = router;