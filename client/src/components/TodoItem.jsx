import "../assets/styles/App.css";

export function TodoItem({
  todo,
  isSaving,
  onToggle,
  onDelete,
  editingId,
  editValues,
  onSetEditing,
  onUpdateEditValue,
  onSaveEdit,
  onCancelEdit,
}) {
  const isEditing = editingId === todo.id;
  const editValue = editValues[todo.id] || "";

  const handleEditClick = () => {
    onSetEditing(todo.id);
  };

  const handleSaveEdit = async () => {
    try {
      await onSaveEdit(todo.id);
    } catch (err) {
      console.error("Error saving edit:", err);
    }
  };

  const handleCancel = () => {
    onCancelEdit();
  };

  const handleKeydown = (e) => {
    if (e.key === "Enter") {
      handleSaveEdit();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  const handleToggleComplete = async () => {
    try {
      await onToggle(todo);
    } catch (err) {
      console.error("Error toggling task:", err);
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      try {
        await onDelete(todo.id);
      } catch (err) {
        console.error("Error deleting task:", err);
      }
    }
  };

  return (
    <div
      className={`todo-item ${todo.completed ? "todo-item--completed" : ""}`}
    >
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={handleToggleComplete}
        className="todo-item__checkbox"
        disabled={isEditing || isSaving}
      />

      {isEditing ? (
        <input
          type="text"
          value={editValue}
          onChange={(e) => onUpdateEditValue(todo.id, e.target.value)}
          onKeyDown={handleKeydown}
          onBlur={handleSaveEdit}
          disabled={isSaving}
          autoFocus
          className="todo-item__edit-input"
        />
      ) : (
        <span
          onClick={handleEditClick}
          className={`todo-text ${todo.completed ? "completed" : ""}`}
          title="Click to edit"
        >
          {todo.task}
        </span>
      )}

      <div className="todo-item__actions">
        {isEditing ? (
          <>
            <button
              onClick={handleSaveEdit}
              disabled={isSaving}
              className="todo-item__button todo-item__button--save"
              title="Save (or press Enter)"
            >
              {isSaving ? "Saving..." : "Save"}
            </button>
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="todo-item__button todo-item__button--cancel"
              title="Cancel (or press Escape)"
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <button
              onClick={handleEditClick}
              disabled={isSaving}
              className="todo-item__button todo-item__button--save"
            >
              Edit
            </button>
            <button
              onClick={handleDelete}
              disabled={isSaving}
              className="delete-btn"
            >
              {isSaving ? "Deleting..." : "Delete"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
