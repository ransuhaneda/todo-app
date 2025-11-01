import { useState, useEffect, useCallback } from 'react';
import './assets/styles/App.css';
import api from './services/api';

import { SearchBox } from "./components/SearchBox";

function App() {
  const [todos, setTodos] = useState([]);
  const [task, setTask] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTodos = useCallback(
    async (keyword = '', signal) => {
      try {
        setLoading(true);
        const data = await api.getTodos(keyword);
        setTodos(data);
        setError(null);
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError('Failed to fetch todos');
          console.error(err);
        }
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    const abortController = new AbortController();

    fetchTodos(search, abortController.signal);

    return () => {
      abortController.abort();
    };
  }, [fetchTodos, search]);

  const handleAddTodo = async (e) => {
    e.preventDefault();

    try {
      const newTodo = await api.createTodo({ task });
      setTodos([newTodo, ...todos]);
      setTask('');
      setError(null);
    } catch (err) {
      setError('Failed to add todo');
      console.error(err);
    }
  };

  const handleToggleTodo = async (todo) => {
    try {
      const updated = await api.updateTodo(todo.id, { completed: !todo.completed });
      setTodos(todos.map(t => t.id === todo.id ? updated : t));
      setError(null);
    } catch (err) {
      setError('Failed to update todo');
      console.error(err);
    }
  };

  const handleDeleteTodo = async (id) => {
    try {
      await api.deleteTodo(id);
      setTodos(todos.filter(t => t.id !== id));
      setError(null);
    } catch (err) {
      setError('Failed to delete todo');
      console.error(err);
    }
  };

  return (
    <div className="App">
      <header className="container">
        <h1>Todo List</h1>

        {error && <div className="error-message">{error}</div>}

        <SearchBox value={search} onChange={setSearch} />

        <form onSubmit={handleAddTodo} className="add-todo-form">
          <input
            type="text"
            value={task}
            onChange={(e) => setTask(e.target.value)}
            placeholder="Add a new task"
            maxLength="250"
            autoFocus
          />
          <button type="submit">Add</button>
        </form>


        {loading ? (
          <p>Loading todos...</p>
        ) : todos.length === 0 ? (
          <p className="empty-message">No todos yet. Create one to get started!</p>
        ) : (
          <ul className="todo-list">
            {todos.map((todo) => (
              <li key={todo.id} className={`todo-item ${todo.completed ? 'completed' : ''}`}>
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => handleToggleTodo(todo)}
                />
                <div className="todo-content">
                  <h3>{todo.task}</h3>
                </div>
                <button
                  className="delete-btn"
                  onClick={() => handleDeleteTodo(todo.id)}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </header>
    </div>
  );
}

export default App;
