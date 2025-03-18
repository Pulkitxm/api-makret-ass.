import { API_KEY, API_URL } from "@/lib/constants";

export interface UploadResponse {
  status: string;
  result: string;
}

export const uploadImage = async (file: File): Promise<string> => {
  const UPLOAD_ENDPOINT = `${API_URL}/api/v1/capix/faceswap/upload/`;
  const formData = new FormData();
  formData.append("file1", file);

  const response = await fetch(UPLOAD_ENDPOINT, {
    method: "POST",
    headers: {
      accept: "application/json",
      "x-magicapi-key": API_KEY,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.status}`);
  }

  const data = (await response.json()) as UploadResponse;

  if (data.status !== "OK" || !data.result) {
    throw new Error("Upload failed: Invalid response");
  }

  return data.result;
};
