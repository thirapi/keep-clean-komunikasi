export async function uploadFile(
  file: File,
  destination?: string
): Promise<{ status: string; data?: { fileurl: string; filename: string; size: number; mimetype: string }; error?: { message: string; type: string } }> {
  const formData = new FormData();
  formData.append("file", file);
  if (destination) formData.append("destination", destination);

  const res = await fetch("/api/upload", { method: "POST", body: formData });
  return res.json();
}
