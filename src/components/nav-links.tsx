"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Client component only so it can highlight the current page.
export function NavLinks({ links }: { links: { href: string; label: string }[] }) {
  const pathname = usePathname();

  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
      {links.map((link) => {
        const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <li key={link.href}>
            <Link
              href={link.href}
              aria-current={active ? "page" : undefined}
              className={active ? "font-medium text-blue-600" : "text-gray-600 hover:text-blue-600"}
            >
              {link.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
