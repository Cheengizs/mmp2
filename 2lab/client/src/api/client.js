async function handleResponse(response) {
  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const error = new Error((data && data.message) || `Ошибка сервера: ${response.status}`);
    error.status = response.status;
    error.errors = (data && data.errors) || {};
    throw error;
  }

  return data;
}

export const api = {
  async getBooks(filters = {}) {
    const params = new URLSearchParams();
    if (filters.genreId) params.append('genreId', filters.genreId);
    if (filters.authorId) params.append('authorId', filters.authorId);
    if (filters.status) params.append('status', filters.status);
    if (filters.search) params.append('search', filters.search);

    const queryString = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`/api/books${queryString}`);
    return handleResponse(res);
  },

  async getBookById(id) {
    const res = await fetch(`/api/books/${id}`);
    return handleResponse(res);
  },

  async createBook(formData) {
    const res = await fetch('/api/books', {
      method: 'POST',
      body: formData
    });
    return handleResponse(res);
  },

  async updateBook(id, formDataOrJson, isFormData = true) {
    const options = {
      method: 'PUT'
    };

    if (isFormData) {
      options.body = formDataOrJson;
    } else {
      options.headers = { 'Content-Type': 'application/json' };
      options.body = JSON.stringify(formDataOrJson);
    }

    const res = await fetch(`/api/books/${id}`, options);
    return handleResponse(res);
  },

  async updateBookStatus(id, status) {
    const res = await fetch(`/api/books/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    return handleResponse(res);
  },

  async deleteBook(id) {
    const res = await fetch(`/api/books/${id}`, {
      method: 'DELETE'
    });
    return handleResponse(res);
  },

  async getAuthors() {
    const res = await fetch('/api/authors');
    return handleResponse(res);
  },

  async createAuthor(data) {
    const res = await fetch('/api/authors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async getGenres() {
    const res = await fetch('/api/genres');
    return handleResponse(res);
  },

  async createGenre(data) {
    const res = await fetch('/api/genres', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  }
};
