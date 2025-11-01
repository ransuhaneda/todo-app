import { useState } from "react";
import "./assets/styles/App.css";

import { SearchBox } from "./components/SearchBox";

import { useTodos } from "./hooks/useTodos";

function App() {
  const [task, setTask] = useState("");
  const [search, setSearch] = useState("");
  const {
    todos,
    loading,
    error,
    addTodo,
    deleteTodo,
    toggleTodo,
    setError,
  } = useTodos(search);

  const handleAddTodo = async (e) => {
    e.preventDefault();
    if (task.trim()) {
      await addTodo(task);
      setTask("");
    }
  };

  return (
    <div className="App">
      <header className="container">
        <h1>Todo List</h1>

        {error && (
          <div className="error-message">
            {error}
            <button onClick={() => setError(null)}>Close</button>
          </div>
        )}

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

        {loading && <p className="loading">Updating results...</p>}

        {todos.length === 0 && !loading ? (
          <p className="empty-message">
            {search
              ? "No todos match your search. Try a different keyword!"
              : "No todos yet. Create one to get started!"}
          </p>
        ) : (
          <ul className="todo-list">
            {todos.map((todo) => (
              <li
                key={todo.id}
                className={`todo-item ${todo.completed ? "completed" : ""}`}
              >
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => toggleTodo(todo)}
                  aria-label={`Mark "${todo.task}" as ${todo.completed ? "incomplete" : "complete"
                    }`}
                />
                <div className="todo-content">
                  <h3>{todo.task}</h3>
                </div>
                <button
                  className="delete-btn"
                  onClick={() => deleteTodo(todo.id)}
                  aria-label={`Delete "${todo.task}"`}
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
