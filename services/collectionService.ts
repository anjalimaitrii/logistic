const API_URL = "http://localhost:5000/api/collections";

export const collectionService = {
  getAll: async () => {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error("Failed to fetch collections");
    return response.json();
  },

  create: async (data: { name: string; description: string }) => {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to create collection item");
    return response.json();
  },

  update: async (id: string, data: { name: string; description: string }) => {
    const response = await fetch(`${API_URL}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to update collection item");
    return response.json();
  },

  delete: async (id: string) => {
    const response = await fetch(`${API_URL}/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to delete collection item");
    return response.json();
  }
};
