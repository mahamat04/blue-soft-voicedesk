import { proxyBackendPost } from "../_lib/backend";

export async function POST(request: Request) {
  return proxyBackendPost(request, "/api/transcribe");
}
