import { NextResponse } from "next/server";

const ALLOWED_ORIGINS = process.env.WIDGET_ALLOWED_ORIGINS
  ? process.env.WIDGET_ALLOWED_ORIGINS.split(",").map((o) => o.trim())
  : ["*"];

export function corsHeaders(request: Request) {
  const origin = request.headers.get("origin") || "";
  const isAllowed =
    ALLOWED_ORIGINS.includes("*") ||
    ALLOWED_ORIGINS.some((o) => origin === o || origin.endsWith(o));

  return {
    "Access-Control-Allow-Origin": isAllowed ? origin || "*" : "",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}

export function optionsResponse(request: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(request),
  });
}

export function jsonResponse(data: unknown, request: Request, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: corsHeaders(request),
  });
}
