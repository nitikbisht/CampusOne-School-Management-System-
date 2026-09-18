import { apiFetch } from "@/lib/api";

export const dynamic = "force-dynamic";

type Ready = { status: string; database: string };

async function getApiStatus(): Promise<Ready | null> {
  try {
    return await apiFetch<Ready>("/health/ready");
  } catch {
    return null;
  }
}

export default async function Home() {
  const api = await getApiStatus();
  const healthy = api?.status === "ok";

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-6 p-8">
      <h1 className="text-3xl font-semibold">CampusOne</h1>
      <p className="text-neutral-600">School management platform: setup check.</p>

      <div className="rounded-lg border p-4">
        <p className="font-medium">API and database connection</p>
        <p className={healthy ? "text-green-600" : "text-red-600"}>
          {healthy
            ? `Connected (database: ${api?.database})`
            : "Cannot reach the API. Is it running on the URL in NEXT_PUBLIC_API_URL?"}
        </p>
      </div>
    </main>
  );
}