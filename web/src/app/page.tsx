import Link from "next/link";

const stages = [
  {
    name: "A. Connect",
    lessons: [
      ["/lessons/01-connect", "1. Connect", "io(), connect"],
      ["/lessons/02-disconnect", "2. Disconnect", "disconnect"],
    ],
  },
  {
    name: "B. Send messages",
    lessons: [
      ["/lessons/03-send-to-server", "3. Client to server", "emit, @SubscribeMessage"],
      ["/lessons/04-send-to-client", "4. Server to client", "client.emit, on"],
      ["/lessons/05-acknowledgement", "5. Acknowledgement", "return a value, emitWithAck"],
    ],
  },
  {
    name: "C. Send to many",
    lessons: [
      ["/lessons/06-everyone", "6. Everyone", "server.emit"],
      ["/lessons/07-everyone-else", "7. Everyone except me", "broadcast.emit"],
    ],
  },
  {
    name: "D. Groups",
    lessons: [
      ["/lessons/08-rooms", "8. Rooms", "join, leave, to(room).emit"],
      ["/lessons/09-namespaces", "9. Namespaces", "namespace option"],
    ],
  },
  {
    name: "E. Chat (needs Docker + database)",
    lessons: [
      ["/lessons/10-auth", "10. Who is connected", "handshake auth, middleware"],
      ["/chat", "11-12. Chat rooms with history", "rooms + saved messages, members"],
    ],
  },
] as const;

// The home page: the whole course on one screen.
export default function Home() {
  return (
    <div>
      <h1 className="text-2xl font-semibold">Socket.IO, one command at a time</h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        Do the lessons in order. Each one adds one or two commands and shows the result right away.
        Open two or three browser tabs to see events travel between them.
      </p>
      <div className="mt-6 space-y-6">
        {stages.map((stage) => (
          <section key={stage.name}>
            <h2 className="font-medium">{stage.name}</h2>
            <ul className="mt-2 space-y-1">
              {stage.lessons.map(([href, title, commands]) => (
                <li key={href}>
                  <Link href={href} className="text-indigo-600 underline dark:text-indigo-400">
                    {title}
                  </Link>{" "}
                  <span className="text-sm text-zinc-500">{commands}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
