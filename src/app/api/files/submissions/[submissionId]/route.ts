import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/server/auth";
import { jsonError } from "@/lib/server/http";
import { getSubmissionDownload } from "@/lib/server/research-service";

interface RouteContext {
  params: {
    submissionId: string;
  };
}

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      throw new Error("You need to sign in first.");
    }

    const download = await getSubmissionDownload(user, params.submissionId);

    return NextResponse.redirect(download.signedUrl);
  } catch (error) {
    return jsonError(error);
  }
}
