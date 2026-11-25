import type { LogEntry } from "@/lib/use-socket-log";

const arrow = { sent: "→", received: "←", system: "•" } as const;
const color = {
  sent: "text-sky-300",
  received: "text-green-300",
  system: "text-amber-300",
} as const;

// The black panel under every lesson: what this tab sent (→), received (←) and
// what happened to the connection (•). Newest line on top.
export function EventLog({ entries }: { entries: LogEntry[] }) {
  return (
    <section>
      <h2 className="mb-2 font-medium">Event log</h2>
      <ul className="min-h-24 space-y-1 rounded-lg bg-zinc-900 p-3 font-mono text-sm">
        {entries.length === 0 && <li className="text-zinc-500">Nothing yet...</li>}
        {entries.map((e) => (
          <li key={e.id} className={color[e.kind]}>
            <span className="text-zinc-500">{e.time}</span> {arrow[e.kind]} {e.text}
          </li>
        ))}
      </ul>
    </section>
  );
}
