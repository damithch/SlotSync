"use client";

import Link from "next/link";
import { useEffect } from "react";

// Catches unexpected errors in any page, so users see a friendly message instead of a crash.
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto max-w-xl px-4 py-16 text-center sm:px-6">
      <h1 className="text-2xl font-bold">Something went wrong</h1>
      <p className="mt-2 text-gray-500">
        We couldn&apos;t load this page. Please try again. If it keeps happening, contact an admin.
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
        >
          Try again
        </button>
        <Link href="/resources" className="rounded-md border border-gray-300 px-4 py-2 hover:border-blue-600">
          Go to resources
        </Link>
      </div>
    </main>
  );
}
