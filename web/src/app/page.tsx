"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function Home() {
  const router = useRouter();
  const { isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      router.push(isAuthenticated ? "/dashboard" : "/login");
    }
  }, [isLoading, isAuthenticated, router]);

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-6 p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
      <p className="text-center text-gray-500">Loading...</p>
    </main>
  );
}