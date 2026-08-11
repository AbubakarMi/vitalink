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
