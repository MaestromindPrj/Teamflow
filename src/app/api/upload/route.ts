import { NextRequest, NextResponse } from "next/server";
import { uploadToCloudinary, isCloudinaryConfigured } from "@/lib/cloudinary";
import { isDbConfigured, initDatabase, getDb } from "@/lib/db";
import { TaskAttachment } from "@/data/teamflowData";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const ALLOWED_EXTENSIONS = ["doc", "docx", "pdf", "fig", "png", "jpeg", "jpg"];
const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024; // 100 MB limit

function detectFileType(fileName: string, mimeType?: string): "image" | "pdf" | "figma" | "doc" {
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (["png", "jpg", "jpeg"].includes(ext || "") || mimeType === "image/png" || mimeType === "image/jpeg") {
    return "image";
  }
  if (ext === "pdf" || mimeType === "application/pdf") {
    return "pdf";
  }
  if (ext === "fig") {
    return "figma";
  }
  return "doc";
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";

    let fileName = "";
    let detectedType: "image" | "pdf" | "figma" | "doc" = "doc";
    let taskId: string | null = null;
    let projectId: string | null = null;
    let uploadedBy = "u-ceo-1";
    let uploadedByName = "Team Member";
    let secureUrl = "";
    let publicId = "";
    let sizeStr = "";
    let storageProvider = "mock";

    if (contentType.includes("application/json")) {
      const body = await req.json();
      fileName = (body.name || body.fileName || "deliverable").trim();
      taskId = body.taskId || null;
      projectId = body.projectId || null;
      uploadedBy = body.uploadedBy || "u-ceo-1";
      uploadedByName = body.uploadedByName || "Team Member";
      secureUrl = body.directUrl || body.url || "";
      publicId = body.publicId || "";
      sizeStr = body.size || "Delivered";
      detectedType = body.type || detectFileType(fileName);
      storageProvider = "cloudinary";

      if (!secureUrl) {
        return NextResponse.json({ error: "Missing upload deliverable URL." }, { status: 400 });
      }
    } else {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      taskId = formData.get("taskId") as string | null;
      projectId = formData.get("projectId") as string | null;
      const customName = formData.get("name") as string | null;
      uploadedBy = (formData.get("uploadedBy") as string) || "u-ceo-1";
      uploadedByName = (formData.get("uploadedByName") as string) || "Team Member";

      if (!file) {
        return NextResponse.json({ error: "No file provided in form data" }, { status: 400 });
      }

      if (file.size > MAX_FILE_SIZE_BYTES) {
        return NextResponse.json(
          {
            error: `File size exceeds the 100 MB limit (${formatFileSize(file.size)}). Please choose a smaller file or attach an external deliverable link.`,
            isSizeExceeded: true,
          },
          { status: 413 }
        );
      }

      fileName = customName?.trim() || file.name;
      const ext = fileName.split(".").pop()?.toLowerCase();
      if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
        return NextResponse.json(
          { error: "Only .doc, .docx, .pdf, .fig, .png, and .jpeg files are allowed." },
          { status: 400 }
        );
      }

      detectedType = detectFileType(fileName, file.type);
      sizeStr = formatFileSize(file.size);

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

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
    }

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
          const projTasks = await sql`SELECT id, attachments FROM tasks WHERE project_id = ${targetProjId};`;
          const projRows = await sql`SELECT attachments FROM projects WHERE id = ${targetProjId} LIMIT 1;`;
          const projectDirectAtts = (projRows[0]?.attachments as TaskAttachment[]) || [];
          const taskAtts = projTasks
            .filter((t) => !taskId || t.id !== taskId)
            .flatMap((t) => (t.attachments as TaskAttachment[]) || []);
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

    if (uploadedBy && isDbConfigured()) {
      try {
        await initDatabase();
        const sql = getDb();
        const uRows = await sql`SELECT full_name, name FROM users WHERE id = ${uploadedBy} LIMIT 1;`;
        if (uRows.length > 0) {
          uploadedByName = uRows[0].full_name || uRows[0].name || uploadedByName;
        }
      } catch {}
    }

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

          const existingIdx = currentAttachments.findIndex(
            (a) => a.name.trim().toLowerCase() === fileName.trim().toLowerCase()
          );

          let updatedAttachments: TaskAttachment[];
          if (existingIdx >= 0) {
            updatedAttachments = currentAttachments.map((a, idx) =>
              idx === existingIdx ? { ...a, url: secureUrl, size: sizeStr } : a
            );
          } else {
            updatedAttachments = [attachment, ...currentAttachments];
          }

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
          const existingIdx = currentAttachments.findIndex(
            (a) => a.name.trim().toLowerCase() === fileName.trim().toLowerCase()
          );

          let updatedAttachments: TaskAttachment[];
          if (existingIdx >= 0) {
            updatedAttachments = currentAttachments.map((a, idx) =>
              idx === existingIdx ? { ...a, url: secureUrl, size: sizeStr } : a
            );
          } else {
            updatedAttachments = [attachment, ...currentAttachments];
          }

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
      url: secureUrl,
      publicId,
    });
  } catch (error: unknown) {
    const rawMsg = error instanceof Error ? error.message : "Upload processing failed";
    const isSizeError = /payload|too large|entity too large|limit/i.test(rawMsg);
    const message = isSizeError
      ? "File size exceeds the allowable limit (100 MB). Please choose a smaller file or attach an external deliverable link."
      : "Unable to complete file upload. Please verify the file and try again or use an external link.";
    return NextResponse.json({ error: message, isSizeExceeded: isSizeError }, { status: isSizeError ? 413 : 500 });
  }
}
