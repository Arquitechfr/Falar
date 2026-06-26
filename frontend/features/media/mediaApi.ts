import api from '@/services/api';

export async function uploadMedia(fileUri: string): Promise<string | null> {
  try {
    const formData = new FormData();
    formData.append('file', {
      uri: fileUri,
      type: 'application/octet-stream',
      name: 'media.enc',
    } as unknown as Blob);

    const res = await api.post<{ mediaUrl: string }>('/media/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    return res.data.mediaUrl;
  } catch {
    return null;
  }
}
