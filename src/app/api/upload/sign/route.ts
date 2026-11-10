import { NextResponse } from "next/server";
import { generateCloudinarySignature, isCloudinaryConfigured } from "@/lib/cloudinary";

export async function GET() {
  try {
    if (!isCloudinaryConfigured()) {
      return NextResponse.json({ configured: false });
    }

    const timestamp = Math.round(new Date().getTime() / 1000);
    const folder = "teamflow/deliverables";
    const signature = generateCloudinarySignature({ timestamp, folder });

    const apiKey = process.env.CLOUDINARY_API_KEY;
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

    return NextResponse.json({
      configured: true,
      timestamp,
      folder,
      signature,
      apiKey,
      cloudName,
    });
  } catch (error) {
    console.error("Cloudinary sign error:", error);
    return NextResponse.json({ configured: false }, { status: 500 });
  }
}

