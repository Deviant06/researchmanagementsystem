import { NextResponse } from "next/server";

export function jsonError(error: unknown) {
  const message =
    error instanceof Error ? error.message : "Something went wrong on the server.";
  const normalized = message.toLowerCase();

  let status = 400;

  if (normalized.includes("sign in") || normalized.includes("unauthorized")) {
    status = 401;
  } else if (
    normalized.includes("access") ||
    normalized.includes("only") ||
    normalized.includes("required")
  ) {
    status = 403;
  } else if (normalized.includes("not found")) {
    status = 404;
  }

  return NextResponse.json({ error: message }, { status });
}

export function jsonOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}
