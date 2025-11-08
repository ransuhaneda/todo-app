import { useState, useCallback, useEffect, useRef } from 'react';
import api from '../services/api';
import { useDebounce } from '../hooks/useDebounce';


export const useTodos = (searchTerm) => {
  const [allTodos, setAllTodos] = useState([]);
  const [filteredTodos, setFilteredTodos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState({});
  const [savingIds, setSavingIds] = useState(new Set());
  const abortControllerRef = useRef(null);

  const safeSearchTerm = searchTerm || "";
  const debouncedSearch = useDebounce(safeSearchTerm, 250);

  // Client Side Filter
  useEffect(() => {
    if (!safeSearchTerm.trim()) {
      setFilteredTodos(allTodos);
      return;
    }

    const filtered = allTodos.filter((todo) =>
      todo.task.toLowerCase().includes(safeSearchTerm.toLowerCase())
    );

    setFilteredTodos(filtered);
  }, [safeSearchTerm, allTodos]);

  // Server Side Search Request
  useEffect(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    const abortController = abortControllerRef.current;

    const loadTodos = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await api.getTodos(debouncedSearch, {
          signal: abortController.signal
        });

        if (!abortController.signal.aborted) {
          setAllTodos(data);

          if (!searchTerm.trim()) {
            setFilteredTodos(data);
          } else {
            const filtered = data.filter((todo) =>
              todo.task.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredTodos(filtered);
          }
        }
      } catch (err) {
        if (err.name !== 'AbortError' && !abortController.signal.aborted) {
          setError('Failed to fetch todos');
          console.error(err);
        }
      } finally {
        if (!abortController.signal.aborted) {
          setLoading(false);
        }
      }
    };

    loadTodos();

    return () => {
      if (abortController) {
        abortController.abort();
      }
    };
  }, [debouncedSearch, searchTerm]);

  const addToSavingIds = (id) => setSavingIds(prev => new Set([...prev, id]));
  const removeFromSavingIds = (id) => setSavingIds(prev => {
    const next = new Set(prev);
    next.delete(id);
    return next;
  });

  const addTodo = useCallback(async (task) => {
    if (!task.trim()) return;

    addToSavingIds(task);
    try {
      setError(null);
      const newTodo = await api.createTodo({ task });
      setAllTodos(prev => [newTodo, ...prev]);
    } catch (err) {
      setError('Failed to add todo');
      console.error(err);
    } finally {
      removeFromSavingIds(task);
    }
  }, []);

  const deleteTodo = useCallback(async (id) => {
    const previousAllTodos = allTodos;
    const previousFilteredTodos = filteredTodos;

    addToSavingIds(id);
    try {
      setError(null);
      setAllTodos(prev => prev.filter(t => t.id !== id));
      await api.deleteTodo(id);
    } catch (err) {
      setError('Failed to delete todo');
      console.error(err);
      setAllTodos(previousAllTodos);
      setFilteredTodos(previousFilteredTodos);
    } finally {
      removeFromSavingIds(id);
    }
  }, [allTodos, filteredTodos]);

  const updateTodo = useCallback(async (id, updates) => {
    const previousAllTodos = allTodos;
    const previousFilteredTodos = filteredTodos;

    addToSavingIds(id);
    try {
      setError(null);
      setAllTodos(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
      await api.updateTodo(id, updates);
    } catch (err) {
      setError('Failed to update todo');
      console.error(err);
      setAllTodos(previousAllTodos);
      setFilteredTodos(previousFilteredTodos);
    } finally {
      removeFromSavingIds(id);
    }
  }, [allTodos, filteredTodos]);

  const toggleTodo = useCallback((todo) => {
    updateTodo(todo.id, { completed: !todo.completed });
  }, [updateTodo]);

  const setEditingTodo = useCallback((id) => {
    setEditingId(id);
    if (id) {
      const todo = allTodos.find(t => t.id === id);
      setEditValues(prev => ({ ...prev, [id]: todo?.task || '' }));
    }
  }, [allTodos]);

  const updateEditValue = useCallback((id, value) => {
    setEditValues((prev) => ({ ...prev, [id]: value }));
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingId(null);
    setEditValues({});
  }, []);

  const saveEdit = useCallback(
    async (id) => {
      const editValue = editValues[id];

      if (!editValue?.trim()) {
        cancelEdit();
        return;
      }

      const todo = allTodos.find((t) => t.id === id);
      if (editValue.trim() === todo?.task) {
        cancelEdit();
        return;
      }

      addToSavingIds(id);
      try {
        await updateTodo(id, { task: editValue.trim() });
        cancelEdit();
      } catch (err) {
        console.error('Error saving edit:', err);
        throw err;
      } finally {
        removeFromSavingIds(id);
      }
    }, [editValues, allTodos, updateTodo, cancelEdit]
  );

  // Cleanup 
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    todos: filteredTodos,
    allTodos,
    loading,
    error,
    addTodo,
    deleteTodo,
    updateTodo,
    editingId,
    editValues,
    setEditingTodo,
    updateEditValue,
    saveEdit,
    savingIds,
    cancelEdit,
    toggleTodo,
    setError,
  };
};