import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '',
  api_key: process.env.CLOUDINARY_API_KEY || '',
  api_secret: process.env.CLOUDINARY_API_SECRET || '',
});

export function isConfigured(): boolean {
  return !!(process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY);
}

/** Upload a buffer to Cloudinary and return the result */
export async function uploadBuffer(buffer: Buffer, folder = 'uploads'): Promise<unknown> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ folder, resource_type: 'auto' }, (error, result) => {
        if (error) reject(error);
        else resolve(result);
      })
      .end(buffer);
  });
}

/** Upload a base64 string to Cloudinary */
export async function uploadBase64(base64: string, folder = 'uploads'): Promise<unknown> {
  return cloudinary.uploader.upload(base64, { folder, resource_type: 'auto' });
}

/** Delete an image by public_id */
export async function deleteImage(publicId: string): Promise<unknown> {
  return cloudinary.uploader.destroy(publicId);
}

/** Get a transformed URL for an image */
export function getTransformedUrl(publicId: string, options: any = {}): string {
  return cloudinary.url(publicId, {
    secure: true,
    ...options,
  });
}

/** Generate a signature for unsigned uploads */
export function getSignature(paramsToSign: Record<string, string>, timestamp: string): string {
  return cloudinary.utils.api_sign_request(
    { ...paramsToSign, timestamp },
    process.env.CLOUDINARY_API_SECRET || ''
  );
}

export { cloudinary };