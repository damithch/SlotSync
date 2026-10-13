import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-xl px-4 py-16 text-center sm:px-6">
      <p className="text-sm font-medium text-blue-600">404</p>
      <h1 className="mt-1 text-2xl font-bold">Page not found</h1>
      <p className="mt-2 text-gray-500">This page or resource doesn&apos;t exist.</p>
      <Link
        href="/resources"
        className="mt-6 inline-block rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
      >
        Go to resources
      </Link>
    </main>
  );
}
