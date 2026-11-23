"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { saveCurrentUser, useCurrentUser } from "@/lib/current-user";

const pages = [
  { href: "/", label: "0. Pick a user" },
  { href: "/connection", label: "1. Connection" },
  { href: "/broadcast", label: "2. Broadcast" },
  { href: "/chat", label: "3. Chat rooms" },
];

// The top bar: links to the 3 lessons and who you are right now.
export function Nav() {
  const pathname = usePathname();
  const user = useCurrentUser();

  return (
    <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <nav className="mx-auto flex max-w-4xl flex-wrap items-center gap-2 px-4 py-3">
        {pages.map((p) => (
          <Link
            key={p.href}
            href={p.href}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              pathname === p.href
                ? "bg-indigo-600 text-white"
                : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
            }`}
          >
            {p.label}
          </Link>
        ))}
        <span className="ml-auto text-sm text-zinc-600 dark:text-zinc-400">
          {user ? (
            <>
              You are <strong>{user.name}</strong>{" "}
              <Link href="/" onClick={() => saveCurrentUser(null)} className="ml-2 underline">
                switch
              </Link>
            </>
          ) : (
            "No user picked"
          )}
        </span>
      </nav>
    </header>
  );
}
