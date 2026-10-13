import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { LoginForm } from "@/components/login-form";

export const metadata = { title: "Sign in · SlotSync" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  // Already signed in? Nothing to do here.
  if (await auth()) redirect("/");

  const { callbackUrl } = await searchParams;

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4 py-6 sm:px-6">
      <h1 className="text-2xl font-bold">Sign in to SlotSync</h1>
      <p className="mt-1 mb-6 text-sm text-gray-500">Book rooms, equipment and vehicles.</p>
      <LoginForm callbackUrl={callbackUrl} />
    </main>
  );
}
