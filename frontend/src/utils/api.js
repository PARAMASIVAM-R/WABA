const API_URL = 'http://localhost:3000'

function getToken() {
  return localStorage.getItem('token')
}

export function saveAuth(token, role, hospitalId) {
  localStorage.setItem('token', token)
  localStorage.setItem('role', role)
  localStorage.setItem('hospital_id', String(hospitalId))
}

export function clearAuth() {
  localStorage.removeItem('token')
  localStorage.removeItem('role')
  localStorage.removeItem('hospital_id')
}

export function getRole() {
  return localStorage.getItem('role')
}

export function isLoggedIn() {
  return !!getToken()
}

async function request(path, options = {}) {
  const token = getToken()
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  })

  if (res.status === 401) {
    clearAuth()
    window.location.href = '/login'
    return null
  }

  return res
}

export const api = {
  get:    (path)       => request(path),
  post:   (path, body) => request(path, { method: 'POST',   body: JSON.stringify(body) }),
  put:    (path, body) => request(path, { method: 'PUT',    body: JSON.stringify(body) }),
  delete: (path)       => request(path, { method: 'DELETE' }),
}
