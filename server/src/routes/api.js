const express = require('express');
const router = express.Router();
const db = require('../database/dbConfig');

const handleDbError = (res, err, errorMessage = 'Database operation failed') => {
  console.error('Database error:', err);
  res.status(500).json({ error: errorMessage });
};

const executeQuery = (query, params = []) => {
  return new Promise((resolve, reject) => {
    let stmt;
    try {
      stmt = db.prepare(query);
      stmt.all(params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    } catch (err) {
      reject(err);
    } finally {
      if (stmt) stmt.finalize();
    }
  });
};

const executeRun = (query, params = []) => {
  return new Promise((resolve, reject) => {
    let stmt;
    try {
      stmt = db.prepare(query);
      stmt.run(params, function (err) {
        if (err) reject(err);
        else resolve(this);
      })
    } catch (err) {
      reject(err);
    } finally {
      if (stmt) stmt.finalize();
    }
  });
};

const getTodos = async (req, res) => {
  try {
    const search = req.query.search || '';
    let rows;

    if (search) {
      rows = await executeQuery(
        'SELECT * FROM todos WHERE LOWER(task) LIKE LOWER(?)',
        [`%${search}%`]
      );
    } else {
      rows = await executeQuery(
        'SELECT * FROM todos',
        []
      );
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

    const [currentTodo] = await executeQuery(
      'SELECT * FROM todos WHERE id = ?',
      [id]
    );

    if (!currentTodo) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    const finalTask = task !== undefined ? task.trim() : currentTodo.task;
    const finalCompleted = completed !== undefined ? (completed ? 1 : 0) : currentTodo.completed;

    const result = await executeRun(
      'UPDATE todos SET task = ?, completed = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [finalTask, finalCompleted, id]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    const [updatedTodo] = await executeQuery(
      'SELECT * FROM todos WHERE id = ?',
      [id]
    );

    res.json({
      id: parseInt(id),
      task: finalTask,
      completed: finalCompleted === 1,
      updated_at: updatedTodo.updated_at
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

    const result = await executeRun(
      'DELETE FROM todos WHERE id = ?',
      [id]
    );

    if (result.changes === 0) {
      res.status(404).json({ error: 'Todo not found' });
      return;
    }

    res.status(204).send();

  } catch (err) {
    handleDbError(res, err, 'Failed to delete todo')
  }
}

router.get('/', getTodos);
router.post('/', createTodo);
router.patch('/:id', updateTodo);
router.delete('/:id', deleteTodo);

module.exports = router;