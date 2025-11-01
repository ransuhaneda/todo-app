const API_URL = 'http://localhost:3001/api';

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
  getTodos: async (search = '', options = {}) => {
    const url = search
      ? `${API_URL}/todos?search=${encodeURIComponent(search)}`
      : `${API_URL}/todos`;
    const response = await fetch(url, options);
    return handleResponse(response);
  },

  getTodo: async (id, options = {}) => {
    const response = await fetch(`${API_URL}/todos/${id}`, options);
    return handleResponse(response);
  },

  createTodo: async (todo, options = {}) => {
    const response = await fetch(`${API_URL}/todos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(todo),
      ...options,
    });
    return handleResponse(response);
  },

  updateTodo: async (id, updates, options = {}) => {
    const response = await fetch(`${API_URL}/todos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
      ...options,
    });
    return handleResponse(response);
  },

  deleteTodo: async (id, options = {}) => {
    const response = await fetch(`${API_URL}/todos/${id}`, {
      method: 'DELETE',
      ...options
    });
    return handleResponse(response);
  },
};

export default api;