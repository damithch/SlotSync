import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import { NavLinks } from "@/components/nav-links";

const memberLinks = [
  { href: "/resources", label: "Resources" },
  { href: "/bookings", label: "My bookings" },
];

const adminLinks = [
  { href: "/admin/resources", label: "Manage resources" },
  { href: "/admin/bookings", label: "All bookings" },
];

export async function Navbar() {
  const session = await auth();
  // Signed out (the login page): no navbar.
  if (!session) return null;

  const { name, role } = session.user;
  const links = role === "ADMIN" ? [...memberLinks, ...adminLinks] : memberLinks;

  return (
    <header className="border-b border-gray-200">
      <nav className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
        <Link href="/" className="text-lg font-bold">
          SlotSync
        </Link>

        <NavLinks links={links} />

        <div className="ml-auto flex items-center gap-3 text-sm">
          <span>
            {name}
            {role === "ADMIN" && (
              <span className="ml-2 rounded bg-blue-100 px-1.5 py-0.5 text-xs font-medium text-blue-700">Admin</span>
            )}
          </span>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button type="submit" className="rounded-md border border-gray-300 px-3 py-1 hover:bg-gray-100 hover:text-gray-900">
              Sign out
            </button>
          </form>
        </div>
      </nav>
    </header>
  );
}
