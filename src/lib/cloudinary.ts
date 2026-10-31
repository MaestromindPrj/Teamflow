import { v2 as cloudinary } from "cloudinary";

function configureCloudinary() {
  const cloudinaryUrl = process.env.CLOUDINARY_URL;
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (cloudinaryUrl) {
    cloudinary.config({
      url: cloudinaryUrl,
      secure: true,
    });
    return true;
  }

  if (cloudName && apiKey && apiSecret) {
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });
    return true;
  }

  return false;
}

export function isCloudinaryConfigured(): boolean {
  return (
    !!process.env.CLOUDINARY_URL ||
    (!!(process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME) &&
      !!process.env.CLOUDINARY_API_KEY &&
      !!process.env.CLOUDINARY_API_SECRET)
  );
}

export interface CloudinaryUploadResult {
  url: string;
  secure_url: string;
  public_id: string;
  format?: string;
  bytes: number;
  resource_type: string;
  original_filename?: string;
}

export async function uploadToCloudinary(
  buffer: Buffer,
  options: {
    folder?: string;
    filename?: string;
    mimeType?: string;
    resourceType?: "image" | "raw" | "auto" | "video";
  } = {}
): Promise<CloudinaryUploadResult> {
  const configured = configureCloudinary();
  if (!configured) {
    throw new Error(
      "Database credentials are not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET (or CLOUDINARY_URL) in your environment variables."
    );
  }

  let resourceType: "image" | "raw" | "auto" | "video" = options.resourceType || "auto";
  if (!options.resourceType && options.mimeType) {
    if (options.mimeType.startsWith("image/")) {
      resourceType = "image";
    } else {
      resourceType = "raw";
    }
  }

  return new Promise<CloudinaryUploadResult>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder || "teamflow/deliverables",
        resource_type: resourceType,
        use_filename: true,
        unique_filename: true,
        filename_override: options.filename,
      },
      (error, result) => {
        if (error || !result) {
          return reject(error || new Error("Cloudinary upload failed with empty response"));
        }
        resolve({
          url: result.url,
          secure_url: result.secure_url,
          public_id: result.public_id,
          format: result.format,
          bytes: result.bytes,
          resource_type: result.resource_type,
          original_filename: result.original_filename,
        });
      }
    );

    uploadStream.end(buffer);
  });
}

export default cloudinary;

