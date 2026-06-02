export const uploadService = {
  // Convert files to base64 for MongoDB storage — no S3 needed
  toBase64: (files: File[]): Promise<{ name: string; data: string; mimeType: string; size: number }[]> => {
    return Promise.all(
      files.map(file =>
        new Promise<{ name: string; data: string; mimeType: string; size: number }>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload  = () => resolve({
            name:     file.name,
            data:     (reader.result as string).split(",")[1], // strip base64 prefix
            mimeType: file.type,
            size:     file.size,
          });
          reader.onerror = reject;
          reader.readAsDataURL(file);
        })
      )
    );
  },
};
