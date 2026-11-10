/** Shared file-control value; binary upload support depends on the backend. */
export type UploadedFile = {
  name: string;
  size: number;
  mimeType: string;
  /** ISO timestamp. */
  uploadedAt: string;
  /** Permanent file URL provided by the upload backend. */
  url: string | null;
};
