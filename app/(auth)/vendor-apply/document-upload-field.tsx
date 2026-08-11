"use client";

import { useRef, useState } from "react";
import { UploadCloud, FileCheck2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DocumentType } from "@/lib/api/vendor-profile";
import { beginUploadAction, finalizeUploadAction } from "./actions";

/**
 * Real upload flow, matching how beginDocumentUpload/completeDocumentUpload
 * are actually meant to be used (lib/api/vendor-profile.ts): get a presigned
 * URL server-side, PUT the file bytes directly from the browser to storage
 * (never proxied through our server), then confirm server-side. Not a
 * decorative file picker.
 */
export function DocumentUploadField({
  documentType,
  documentName,
  hint,
  accept,
  onUploaded,
}: {
  documentType: DocumentType;
  documentName: string;
  hint: string;
  accept: string;
  onUploaded: (documentId: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setStatus("uploading");
    setFileName(file.name);
    setError(null);

    const begin = await beginUploadAction(documentType, documentName, file.name, file.type);
    if (begin.error || !begin.uploadUrl || !begin.documentId) {
      setStatus("error");
      setError(begin.error ?? "Upload failed.");
      return;
    }

    try {
      const putResponse = await fetch(begin.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!putResponse.ok) throw new Error("upload failed");
    } catch {
      setStatus("error");
      setError("Couldn't upload the file. Please try again.");
      return;
    }

    const finalize = await finalizeUploadAction(begin.documentId);
    if (finalize.error) {
      setStatus("error");
      setError(finalize.error);
      return;
    }

    setStatus("done");
    onUploaded(begin.documentId);
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={status === "uploading"}
        className={cn(
          "flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors",
          status === "done" ? "border-verified bg-mint/40" : status === "error" ? "border-[#ff4141]/50" : "border-line bg-white hover:border-ink/30",
        )}
      >
        {status === "done" ? (
          <>
            <FileCheck2 className="size-6 text-verified" aria-hidden />
            <span className="text-sm font-medium text-ink">{fileName}</span>
            <span className="text-xs text-verified">Uploaded — click to replace</span>
          </>
        ) : status === "error" ? (
          <>
            <AlertCircle className="size-6 text-[#ff4141]" aria-hidden />
            <span className="text-sm font-medium text-[#c0392b]">{error}</span>
            <span className="text-xs text-text-muted">Click to try again</span>
          </>
        ) : (
          <>
            <UploadCloud className="size-6 text-text-muted" aria-hidden />
            <span className="text-sm font-medium text-ink">
              {status === "uploading" ? `Uploading ${fileName}…` : "Click to upload or drag and drop"}
            </span>
            <span className="text-xs text-text-muted">{hint}</span>
          </>
        )}
      </button>
    </div>
  );
}
