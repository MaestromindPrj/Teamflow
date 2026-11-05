import { NextRequest, NextResponse } from "next/server";
import { uploadToCloudinary, isCloudinaryConfigured } from "@/lib/cloudinary";
import { isDbConfigured, initDatabase, getDb } from "@/lib/db";
import { TaskAttachment } from "@/data/teamflowData";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function detectFileType(fileName: string, mimeType?: string): "image" | "pdf" | "figma" | "zip" | "doc" {
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (["png", "jpg", "jpeg", "webp", "gif", "svg"].includes(ext || "") || mimeType?.startsWith("image/")) {
    return "image";
  }
  if (ext === "pdf" || mimeType === "application/pdf") {
    return "pdf";
  }
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext || "")) {
    return "zip";
  }
  if (ext === "fig") {
    return "figma";
  }
  return "doc";
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const taskId = formData.get("taskId") as string | null;
    const projectId = formData.get("projectId") as string | null;
    const customName = formData.get("name") as string | null;
    const uploadedBy = (formData.get("uploadedBy") as string) || "u-ceo-1";
    const uploadedByName = (formData.get("uploadedByName") as string) || "Team Member";

    if (!file) {
      return NextResponse.json({ error: "No file provided in form data" }, { status: 400 });
    }

    const fileName = customName?.trim() || file.name;
    const detectedType = detectFileType(fileName, file.type);

    if (isDbConfigured() && (taskId || projectId)) {
      try {
        await initDatabase();
        const sql = getDb();
        let targetProjId = projectId;
        if (!targetProjId && taskId) {
          const taskRow = await sql`SELECT project_id FROM tasks WHERE id = ${taskId} LIMIT 1;`;
          if (taskRow.length > 0) {
            targetProjId = taskRow[0].project_id as string;
          }
        }

        if (targetProjId) {
          const projTasks = await sql`SELECT attachments FROM tasks WHERE project_id = ${targetProjId};`;
          const projRows = await sql`SELECT attachments FROM projects WHERE id = ${targetProjId} LIMIT 1;`;
          const projectDirectAtts = (projRows[0]?.attachments as TaskAttachment[]) || [];
          const taskAtts = projTasks.flatMap((t) => (t.attachments as TaskAttachment[]) || []);
          const allProjectAtts = [...projectDirectAtts, ...taskAtts];

          const isDuplicate = allProjectAtts.some(
            (a) => a.name.trim().toLowerCase() === fileName.trim().toLowerCase()
          );
          if (isDuplicate) {
            return NextResponse.json(
              {
                error: `A file named "${fileName}" is already uploaded to this project. Duplicate uploads are blocked to conserve storage.`,
                isDuplicate: true,
              },
              { status: 409 }
            );
          }
        }
      } catch (checkErr) {
        console.warn("Project duplicate check warning:", checkErr);
      }
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    let secureUrl = "";
    let publicId = "";
    let storageProvider = "mock";

    if (isCloudinaryConfigured()) {
      try {
        const uploadResult = await uploadToCloudinary(buffer, {
          filename: fileName,
          mimeType: file.type,
          resourceType: detectedType === "image" ? "image" : "raw",
          folder: detectedType === "image" ? "teamflow/images" : "teamflow/documents",
        });

        secureUrl = uploadResult.secure_url;
        publicId = uploadResult.public_id;
        storageProvider = "cloudinary";
      } catch (cloudErr: unknown) {
        console.warn("Cloudinary upload warning, falling back to local storage:", cloudErr);
        secureUrl =
          detectedType === "image"
            ? `data:${file.type || "image/png"};base64,${buffer.toString("base64")}`
            : `#local-upload-${Date.now()}`;
        publicId = `local-${Date.now()}`;
        storageProvider = "fallback";
      }
    } else {
      secureUrl =
        detectedType === "image"
          ? `data:${file.type || "image/png"};base64,${buffer.toString("base64")}`
          : `#local-upload-${Date.now()}`;
      publicId = `local-${Date.now()}`;
    }

    const sizeStr = formatFileSize(file.size);
    const attachment: TaskAttachment = {
      id: `att-${Date.now()}`,
      name: fileName,
      size: sizeStr,
      type: detectedType,
      url: secureUrl,
      uploadedBy,
      uploadedByName,
      uploadedAt: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    };

    if (taskId && isDbConfigured()) {
      try {
        await initDatabase();
        const sql = getDb();
        const existing = await sql`SELECT attachments, activity FROM tasks WHERE id = ${taskId} LIMIT 1;`;
        if (existing.length > 0) {
          const currentAttachments = (existing[0].attachments as TaskAttachment[]) || [];
          const currentActivity = (existing[0].activity as Array<{ id: string; title: string; detail: string; date: string }>) || [];

          const newActivity = {
            id: `act-${Date.now()}`,
            title: `Deliverable uploaded: ${fileName}`,
            detail: `Uploaded by ${uploadedByName}`,
            date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
          };

          const updatedAttachments = [attachment, ...currentAttachments];
          const updatedActivity = [newActivity, ...currentActivity];

          await sql`
            UPDATE tasks SET
              attachments = ${JSON.stringify(updatedAttachments)}::jsonb,
              activity = ${JSON.stringify(updatedActivity)}::jsonb
            WHERE id = ${taskId};
          `;
        }
      } catch (dbErr) {
        console.warn("Could not save attachment directly to DB task:", dbErr);
      }
    } else if (projectId && isDbConfigured()) {
      try {
        await initDatabase();
        const sql = getDb();
        const existing = await sql`SELECT attachments FROM projects WHERE id = ${projectId} LIMIT 1;`;
        if (existing.length > 0) {
          const currentAttachments = (existing[0].attachments as TaskAttachment[]) || [];
          const updatedAttachments = [attachment, ...currentAttachments];
          await sql`
            UPDATE projects SET
              attachments = ${JSON.stringify(updatedAttachments)}::jsonb
            WHERE id = ${projectId};
          `;
        }
      } catch (dbErr) {
        console.warn("Could not save attachment directly to DB project:", dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      storage: storageProvider,
      attachment,
      publicId,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Upload processing failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

