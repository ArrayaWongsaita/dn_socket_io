"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useCurrentUser, type CurrentUser } from "@/lib/current-user";

// Wrap a lesson page with this: if nobody has been picked yet it shows a
// "pick a user first" message, otherwise it renders the page with the user.
export function RequireUser({ children }: { children: (user: CurrentUser) => ReactNode }) {
  const user = useCurrentUser();
  if (!user) {
    return (
      <p className="rounded-md bg-amber-50 p-4 text-amber-900 dark:bg-amber-950 dark:text-amber-200">
        Please <Link href="/lessons/10-auth" className="underline">pick a user</Link> first (lesson 10).
      </p>
    );
  }
  return <>{children(user)}</>;
}
