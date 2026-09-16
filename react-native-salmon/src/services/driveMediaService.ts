import { MediaArchiveItem } from '../types';

export const GOOGLE_APPS_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbxuCvLrhfUbkOFGVyIfOpao8C_imElYiCD-K0MS7AxIj3j1RWMNF-3VHTKQS8YCpNTd/exec';

export interface UploadMediaParams {
  fileUri: string;
  base64Data?: string | null;
  fileName?: string;
  mimeType?: string;
  activityId: string;
  activityTitle: string;
  mediaType: 'PHOTO' | 'VIDEO';
  uploadedBy?: string;
}

export interface DriveUploadResponse {
  success: boolean;
  fileId?: string;
  fileName?: string;
  mediaType?: 'PHOTO' | 'VIDEO';
  folderName?: string;
  viewUrl?: string;
  thumbnailUrl?: string;
  streamUrl?: string;
  mediaItem?: MediaArchiveItem;
  error?: string;
}

/**
 * Helper untuk mengekstrak File ID dari berbagai format link Google Drive atau raw ID
 */
export const parseGoogleDriveFileId = (input: string): string | null => {
  if (!input || typeof input !== 'string') return null;
  const trimmed = input.trim();

  // Format 1: https://drive.google.com/file/d/FILE_ID/view...
  const matchFileD = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (matchFileD && matchFileD[1]) return matchFileD[1];

  // Format 2: ?id=FILE_ID atau &id=FILE_ID
  const matchId = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (matchId && matchId[1]) return matchId[1];

  // Format 3: https://lh3.googleusercontent.com/d/FILE_ID
  const matchLh3 = trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (matchLh3 && matchLh3[1]) return matchLh3[1];

  // Format 4: Raw fileId (25-50 karakter alphanumeric/underscore/dash)
  if (/^[a-zA-Z0-9_-]{20,50}$/.test(trimmed)) {
    return trimmed;
  }

  return null;
};

/**
 * Membangun MediaArchiveItem lengkap langsung dari Google Drive File ID
 */
export const buildMediaItemFromDriveId = (
  fileId: string,
  mediaType: 'PHOTO' | 'VIDEO' = 'PHOTO',
  fileName?: string,
  uploadedBy?: string
): MediaArchiveItem => {
  const cleanId = fileId.trim();
  const extension = mediaType === 'VIDEO' ? 'mp4' : 'jpg';
  const inferredFileName =
    fileName || `${mediaType.toLowerCase()}_drive_${cleanId.slice(0, 8)}.${extension}`;
  const mimeType = mediaType === 'VIDEO' ? 'video/mp4' : 'image/jpeg';

  return {
    id: cleanId,
    type: mediaType,
    fileName: inferredFileName,
    mimeType,
    viewUrl: `https://drive.google.com/file/d/${cleanId}/view?usp=sharing`,
    thumbnailUrl: `https://lh3.googleusercontent.com/d/${cleanId}=s800`,
    streamUrl: `https://drive.google.com/file/d/${cleanId}/preview`,
    uploadedBy: uploadedBy || 'Admin',
    uploadedAt: new Date().toISOString(),
  };
};

/**
 * Konversi URI lokal (file:///...) atau data URI menjadi string Base64 murni
 */
export const convertUriToBase64 = async (uri: string): Promise<string> => {
  if (uri.startsWith('data:')) {
    const parts = uri.split(',');
    return parts[1] || uri;
  }

  const response = await fetch(uri);
  const blob = await response.blob();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        const base64Data = reader.result.includes(',')
          ? reader.result.split(',')[1]
          : reader.result;
        resolve(base64Data);
      } else {
        reject(new Error('Gagal membaca file sebagai Base64'));
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(blob);
  });
};

/**
 * Mengunggah media (foto/video) ke Google Drive melalui endpoint Google Apps Script
 */
export const uploadMediaToDrive = async (
  params: UploadMediaParams
): Promise<DriveUploadResponse> => {
  try {
    let base64 = params.base64Data;
    if (!base64 && params.fileUri) {
      base64 = await convertUriToBase64(params.fileUri);
    }

    if (!base64) {
      return { success: false, error: 'Data file kosong atau tidak valid' };
    }

    const inferredMime =
      params.mimeType ||
      (params.mediaType === 'VIDEO' ? 'video/mp4' : 'image/jpeg');
    const timestamp = Date.now();
    const extension = params.mediaType === 'VIDEO' ? 'mp4' : 'jpg';
    const inferredFileName =
      params.fileName || `${params.mediaType.toLowerCase()}_${timestamp}.${extension}`;

    const payload = {
      action: 'UPLOAD_MEDIA',
      activityId: params.activityId || 'UMUM',
      activityTitle: params.activityTitle || 'Kegiatan Salmon',
      mediaType: params.mediaType,
      fileName: inferredFileName,
      mimeType: inferredMime,
      base64Data: base64,
      uploadedBy: params.uploadedBy || 'Warga',
    };

    const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
        Accept: 'application/json, text/plain, */*',
      },
      body: JSON.stringify(payload),
      redirect: 'follow',
    });

    if (!response.ok) {
      return {
        success: false,
        error: `HTTP Error: ${response.status} ${response.statusText}`,
      };
    }

    const text = await response.text();
    let json: any;
    try {
      json = JSON.parse(text);
    } catch {
      return {
        success: false,
        error: `Respon server tidak valid: ${text.substring(0, 100)}`,
      };
    }

    if (json && json.success && json.fileId) {
      const viewUrl =
        json.viewUrl ||
        `https://drive.google.com/file/d/${json.fileId}/view?usp=sharing`;
      const thumbnailUrl =
        json.thumbnailUrl ||
        `https://lh3.googleusercontent.com/d/${json.fileId}=s800`;
      const streamUrl =
        json.streamUrl ||
        `https://drive.google.com/file/d/${json.fileId}/preview`;

      const mediaItem: MediaArchiveItem = {
        id: json.fileId,
        type: params.mediaType,
        fileName: json.fileName || inferredFileName,
        mimeType: inferredMime,
        viewUrl,
        thumbnailUrl,
        streamUrl,
        folderName: json.folderName,
        uploadedBy: params.uploadedBy,
        uploadedAt: new Date().toISOString(),
      };

      return {
        success: true,
        fileId: json.fileId,
        fileName: json.fileName || inferredFileName,
        mediaType: params.mediaType,
        folderName: json.folderName,
        viewUrl,
        thumbnailUrl,
        streamUrl,
        mediaItem,
      };
    } else {
      return {
        success: false,
        error: json?.error || 'Gagal mengunggah file ke Google Drive',
      };
    }
  } catch (err: any) {
    console.warn('uploadMediaToDrive error:', err);
    return {
      success: false,
      error:
        err?.message ||
        'Koneksi ke Google Drive gagal. Silakan periksa jaringan internet Anda.',
    };
  }
};
