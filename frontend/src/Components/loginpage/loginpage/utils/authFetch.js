export const authFetch = async (url, options = {}) => {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/';
    return;
  }

  const headers = {
    ...options.headers,
    Authorization: `Bearer ${token}`,
  };

  try {
    const res = await fetch(url, { ...options, headers });

    if (res.status === 401 || res.status === 403) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
      return;
    }

    return res;
  } catch (err) {
    console.error('authFetch error:', err);
    window.location.href = '/';
  }
};
