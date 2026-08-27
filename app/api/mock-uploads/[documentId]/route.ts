import { NextResponse } from "next/server";

/**
 * Stand-in "storage" for VENDOR_PROFILE_DATA_SOURCE=mock — see
 * lib/api/mocks/vendor-profile-store.ts. document-upload-field.tsx does a real
 * browser PUT to whatever uploadUrl beginDocumentUpload returns (never proxied
 * through a Server Action, by design — see that file's comment), so the mock's
 * uploadUrl has to be a same-origin URL that actually accepts a PUT, not a
 * mock://-scheme placeholder the browser's fetch can't resolve. This route
 * just accepts and discards the bytes; nothing downstream reads them back.
 */
export async function PUT(request: Request, { params }: { params: Promise<{ documentId: string }> }) {
  const { documentId } = await params;
  await request.arrayBuffer(); // drain the body so the client's fetch resolves cleanly
  return NextResponse.json({ documentId, ok: true });
}

/**
 * Real, openable response for the admin vendor-review Compliance tab's
 * "Download"/"Preview" links (components/admin/vendor-application-review.tsx)
 * — there's no actual uploaded file to serve back in mock mode (PUT above
 * discards the bytes), so this returns a clearly-labeled placeholder text
 * document instead of a dead link. ?download=1 sets Content-Disposition to
 * attachment; omitted (preview) opens inline in the same tab.
 */
export async function GET(request: Request, { params }: { params: Promise<{ documentId: string }> }) {
  const { documentId } = await params;
  const url = new URL(request.url);
  const label = url.searchParams.get("label") ?? "Document";
  const vendor = url.searchParams.get("vendor") ?? "";
  const download = url.searchParams.get("download") === "1";

  const body = [
    `${label}`,
    vendor ? `Vendor: ${vendor}` : null,
    `Document ID: ${documentId}`,
    "",
    "This is a placeholder preview — VENDOR_PROFILE_DATA_SOURCE=mock has no real",
    "file storage behind it (see this route's PUT handler), so there's no actual",
    "uploaded file to render here.",
  ]
    .filter((line) => line !== null)
    .join("\n");

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${label.replace(/[^a-z0-9-_ ]/gi, "")}.txt"`,
    },
  });
}
