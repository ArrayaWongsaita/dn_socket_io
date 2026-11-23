"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { API_URL } from "@/lib/config";
import { saveCurrentUser, useCurrentUser } from "@/lib/current-user";

type User = { id: number; name: string };

// PAGE 0: pick who you are. There is no password: just click a user.
// Tip: open another browser window, pick a different user, and you can
// test two people talking to each other.
export default function PickUserPage() {
  const router = useRouter();
  const current = useCurrentUser();
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Ask the Nest API (plain REST) for the list of users.
  useEffect(() => {
    fetch(`${API_URL}/users`)
      .then((res) => res.json())
      .then(setUsers)
      .catch(() => setError(`Cannot reach the API at ${API_URL}. Is it running?`));
  }, []);

  function pick(user: User) {
    saveCurrentUser(user);
    router.push("/connection");
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold">Who do you want to be?</h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        Click a user. Use a different user in each browser window to test.
      </p>
      {error && <p className="mt-4 text-red-600">{error}</p>}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {users.map((user) => (
          <button
            key={user.id}
            onClick={() => pick(user)}
            className={`rounded-lg border p-4 text-lg font-medium hover:border-indigo-500 ${
              current?.id === user.id
                ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950"
                : "border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-900"
            }`}
          >
            {user.name}
          </button>
        ))}
      </div>
    </div>
  );
}
