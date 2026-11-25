"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCurrentUser } from "@/lib/current-user";
import { useNickname } from "@/lib/nickname";

export const lessons = [
  { href: "/lessons/01-connect", label: "1", title: "Connect" },
  { href: "/lessons/02-disconnect", label: "2", title: "Disconnect" },
  { href: "/lessons/03-send-to-server", label: "3", title: "Client to server" },
  { href: "/lessons/04-send-to-client", label: "4", title: "Server to client" },
  { href: "/lessons/05-acknowledgement", label: "5", title: "Acknowledgement" },
  { href: "/lessons/06-everyone", label: "6", title: "Everyone" },
  { href: "/lessons/07-everyone-else", label: "7", title: "Everyone except me" },
  { href: "/lessons/08-rooms", label: "8", title: "Rooms" },
  { href: "/lessons/09-namespaces", label: "9", title: "Namespaces" },
  { href: "/lessons/10-auth", label: "10", title: "Who is connected" },
  { href: "/chat", label: "11-12", title: "Chat" },
];

// The top bar: one link per lesson, your nickname (lessons 1-9) and the user you picked (lessons 10-12).
export function Nav() {
  const pathname = usePathname();
  const user = useCurrentUser();
  const [nickname, setNickname] = useNickname();

  return (
    <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <nav className="mx-auto flex max-w-4xl flex-wrap items-center gap-1.5 px-4 py-3">
        <Link href="/" className="mr-2 text-sm font-semibold">
          Socket.IO
        </Link>
        {lessons.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            title={l.title}
            className={`rounded-md px-2.5 py-1 text-sm font-medium ${
              pathname === l.href
                ? "bg-indigo-600 text-white"
                : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
            }`}
          >
            {l.label}
          </Link>
        ))}
        <span className="ml-auto flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
          Nickname
          <input
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            aria-label="Nickname (lessons 1-9)"
            className="w-24 rounded border border-zinc-300 bg-transparent px-1.5 py-0.5 dark:border-zinc-700"
          />
          {user && (
            <span>
              User: <strong>{user.name}</strong>
            </span>
          )}
        </span>
      </nav>
    </header>
  );
}
