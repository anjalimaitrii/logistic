const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const url = `${BASE_URL}${endpoint}`;

  // Attach the login token (set at login) so the backend knows who is calling
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  try {
    const response = await fetch(url, { ...options, headers });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(errorData.message || `API Error: ${response.status}`);
      (error as any).status = response.status;
      throw error;
    }

    return await response.json();
  } catch (error: any) {
    if (!error.status) {
      console.error(`Fetch API Error [${endpoint}]:`, error);
    }
    throw error;
  }
}
