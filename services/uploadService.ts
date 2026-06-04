const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export const uploadService = {
  uploadToS3: async (
    files: File[],
    folder = "job-attachments"
  ): Promise<{ name: string; url: string; size: number; type: string }[]> => {
    const form = new FormData();
    files.forEach((f) => form.append("files", f));
    form.append("folder", folder);

    const res = await fetch(`${API_URL}/api/upload`, { method: "POST", body: form });
    if (!res.ok) throw new Error("S3 upload failed");
    const data = await res.json();
    return data.files as { name: string; url: string; size: number; type: string }[];
  },
};
