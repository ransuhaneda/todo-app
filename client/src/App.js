import { useState } from "react";
import "./assets/styles/App.css";

import { SearchBox } from "./components/SearchBox";

import { useTodos } from "./hooks/useTodos";
import { TodoItem } from "./components/TodoItem";

function App() {
  const [task, setTask] = useState("");
  const [search, setSearch] = useState("");
  const {
    todos,
    loading,
    error,
    addTodo,
    updateTodo,
    deleteTodo,
    toggleTodo,
    setError,
    editingId,
    editValues,
    setEditingTodo,
    updateEditValue,
    saveEdit,
    savingIds,
    cancelEdit,
  } = useTodos(search);

  const handleAddTodo = async (e) => {
    e.preventDefault();
    if (task.trim()) {
      await addTodo(task);
      setTask("");
    }
  };

  const handleEditTodo = async (id, updates) => {
    await updateTodo(id, updates);
  };

  const handleToggleTodo = (todo) => {
    toggleTodo(todo);
  };

  const handleDeleteTodo = async (id) => {
    await deleteTodo(id);
  };

  return (
    <div className="App">
      <header className="container">
        <h1>Todo List</h1>

        {error && (
          <div className="error-message">
            {error}
            <button className="error__button--close" onClick={() => setError(null)}>Close</button>
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
              <TodoItem
                key={todo.id}
                todo={todo}
                onToggle={handleToggleTodo}
                onDelete={handleDeleteTodo}
                onEdit={handleEditTodo}
                editingId={editingId}
                editValues={editValues}
                onSetEditing={setEditingTodo}
                onUpdateEditValue={updateEditValue}
                onSaveEdit={saveEdit}
                isSaving={savingIds.has(todo.id)}
                onCancelEdit={cancelEdit}
              />
            ))}
          </ul>
        )}
      </header>
    </div>
  );
}

export default App;
