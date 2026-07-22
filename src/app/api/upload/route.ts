import { NextRequest, NextResponse } from "next/server";
import { getUserSessionFromRequest } from "@/app/auth.action";
import { uploadFileController } from "@/lib/interface-adapters/controllers/storage/upload-file.controller";

export async function POST(req: NextRequest) {
  try {
    const session = await getUserSessionFromRequest(req);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const destination = (formData.get("destination") as string) || "default";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const data = await uploadFileController(file, destination);

    return NextResponse.json({ status: "success", data });
  } catch (err: any) {
    return NextResponse.json(
      { status: "error", error: { message: err.message || "Upload failed", type: err.name } },
      { status: 500 }
    );
  }
}
