"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/add", label: "Add Assignment" },
  { href: "/availability", label: "Availability" },
  { href: "/schedule", label: "Schedule" },
];

export default function Nav() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  return (
    <nav className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-1 px-4 py-3">
        <span className="mr-4 text-lg font-bold">Study Scheduler</span>
        <span className="mr-auto text-[10px] text-gray-600 hidden sm:block">
          {process.env.NEXT_PUBLIC_BUILD_TIME}
        </span>
        {user && (
          <>
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <span className="ml-auto text-xs text-zinc-500 hidden sm:block">
              {user.displayName || user.email}
            </span>
            <button
              onClick={signOut}
              className="ml-2 rounded-md px-2 py-1 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            >
              Sign out
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
