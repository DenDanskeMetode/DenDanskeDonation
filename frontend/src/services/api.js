const BASE_URL = '/api';

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(method, path, body) {
  const headers = { 'Content-Type': 'application/json', ...getAuthHeaders() };
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  return res.status === 204 ? null : res.json();
}

export const campaignApi = {
  getAll: () => request('GET', '/campaigns'),
  getById: (id) => request('GET', `/campaigns/${id}`),
  create: (data) => request('POST', '/campaigns', data),
  update: (id, data) => request('PATCH', `/campaigns/${id}`, data),
  delete: (id) => request('DELETE', `/campaigns/${id}`),
};
