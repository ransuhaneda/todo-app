const API_URL = process.env.API_URL || 'http://localhost:3001/api';

const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || `HTTP error! status: ${response.status}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
};

const api = {
  getTodos: async (search = '') => {
    const url = search ? `${API_URL}/todos?search=${encodeURIComponent(search)}` : `${API_URL}/todos`;
    const response = await fetch(url);
    return handleResponse(response);
  },

  getTodo: async (id) => {
    const response = await fetch(`${API_URL}/todos/${id}`);
    return handleResponse(response);
  },

  createTodo: async (todo) => {
    const response = await fetch(`${API_URL}/todos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(todo),
    });
    return handleResponse(response);
  },

  updateTodo: async (id, updates) => {
    const response = await fetch(`${API_URL}/todos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    return handleResponse(response);
  },

  deleteTodo: async (id) => {
    const response = await fetch(`${API_URL}/todos/${id}`, {
      method: 'DELETE',
    });
    return handleResponse(response);
  },
};

export default api;