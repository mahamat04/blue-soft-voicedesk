import { NextResponse } from "next/server";

export async function proxyBackendPost(
  request: Request,
  endpoint: "/api/transcribe" | "/api/voice-response",
) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { detail: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  const backendUrl = process.env.BACKEND_URL?.trim();
  if (!backendUrl) {
    return NextResponse.json(
      {
        detail:
          "The backend URL is not configured. Set BACKEND_URL to your deployed FastAPI URL in Vercel, then redeploy the frontend.",
      },
      { status: 503 },
    );
  }

  let targetUrl: URL;
  try {
    const baseUrl = backendUrl.endsWith("/") ? backendUrl : `${backendUrl}/`;
    targetUrl = new URL(endpoint, baseUrl);
  } catch {
    return NextResponse.json(
      {
        detail:
          "BACKEND_URL is invalid. Set it to the base URL of your deployed FastAPI service.",
      },
      { status: 500 },
    );
  }

  let response: Response;
  try {
    response = await fetch(targetUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
  } catch (error) {
    console.error("VoiceDesk backend request failed", {
      endpoint,
      error: error instanceof Error ? error.name : "UnknownError",
    });
    return NextResponse.json(
      {
        detail:
          "Could not connect to FastAPI. Check that BACKEND_URL is the deployed backend's base URL and that the backend deployment is healthy.",
      },
      { status: 502 },
    );
  }

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    console.error("VoiceDesk backend returned a non-JSON response", {
      endpoint,
      status: response.status,
    });
    return NextResponse.json(
      {
        detail:
          "The backend returned an invalid response. Check the FastAPI deployment logs.",
      },
      { status: 502 },
    );
  }

  return NextResponse.json(data, { status: response.status });
}
