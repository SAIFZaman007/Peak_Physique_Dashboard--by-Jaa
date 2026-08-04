import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { MessageSquare, Send } from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext.jsx";
import { formatDateTime } from "../lib/utils";

/**
 * The trainer/admin side of the messaging feature that already existed
 * for clients (portal/Messages.jsx) — clients have always been sending
 * messages to a real coach account (GET /users/coach resolves to the
 * primary admin, or a trainer if there's no admin yet), they just had
 * nowhere to be answered from. This is that inbox.
 *
 * Built entirely on the existing /messages endpoints (thread, POST,
 * unread-count) plus one new additive endpoint, /messages/conversations,
 * which lists everyone who's messaged this coach with their last message
 * and unread count.
 */
export default function Messages() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(params.get("client") ? Number(params.get("client")) : null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loadingList, setLoadingList] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const bottomRef = useRef(null);

  const loadConversations = useCallback(async () => {
    const { data } = await api.get("/messages/conversations");
    setConversations(data);
    return data;
  }, []);

  const loadThread = useCallback(async (otherId) => {
    const { data } = await api.get(`/messages/thread/${otherId}`);
    setMessages(data);
  }, []);

  // Initial load, then poll every 8s — same cadence as the client-side
  // portal inbox, simple and good enough without adding websockets.
  useEffect(() => {
    let timer;
    loadConversations()
      .then((data) => {
        // Deep-link from ClientDetail ("Message" button), or default to
        // the top conversation so the inbox never opens empty-handed.
        const preselect = params.get("client");
        if (preselect) {
          setActiveId(Number(preselect));
        } else if (!activeId && data.length > 0) {
          setActiveId(data[0].user.id);
        }
      })
      .finally(() => setLoadingList(false));
    timer = setInterval(() => loadConversations().catch(() => {}), 8000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!activeId) return;
    setLoadingThread(true);
    loadThread(activeId)
      .then(() => loadConversations()) // refresh unread badges now that this thread's been marked read
      .finally(() => setLoadingThread(false));
    const timer = setInterval(() => loadThread(activeId).catch(() => {}), 8000);
    return () => clearInterval(timer);
  }, [activeId, loadThread, loadConversations]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const selectConversation = (id) => {
    setActiveId(id);
    setParams(id ? { client: String(id) } : {});
  };

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim() || !activeId) return;
    const body = text.trim();
    setText("");
    const { data } = await api.post("/messages", { recipient_id: activeId, body });
    setMessages((m) => [...m, data]);
    loadConversations();
  };

  const active = conversations.find((c) => c.user.id === activeId);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-3xl tracking-[1px]">Messages</h2>
        <p className="text-sm text-white/40">Conversations with your clients, all in one place.</p>
      </div>

      <div className="card grid !p-0 overflow-hidden md:grid-cols-[280px_1fr]" style={{ height: "68vh" }}>
        {/* Conversation list */}
        <div className="flex flex-col border-b border-ink-800 md:border-b-0 md:border-r">
          <div className="border-b border-ink-800 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-white/40">
            Inbox
          </div>
          <div className="flex-1 overflow-y-auto">
            {loadingList ? (
              <p className="p-4 text-sm text-white/40">Loading…</p>
            ) : conversations.length === 0 ? (
              <p className="p-4 text-sm text-white/40">No messages yet.</p>
            ) : (
              conversations.map((c) => (
                <button
                  key={c.user.id}
                  onClick={() => selectConversation(c.user.id)}
                  className={`flex w-full items-start gap-3 border-b border-ink-800/60 px-4 py-3 text-left transition-colors ${
                    activeId === c.user.id ? "bg-gold/10" : "hover:bg-ink-800/40"
                  }`}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold/15 text-xs font-display text-gold">
                    {c.user.first_name.charAt(0)}
                    {c.user.last_name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-medium text-white">
                        {c.user.first_name} {c.user.last_name}
                      </p>
                      {c.unread_count > 0 && (
                        <span className="flex h-4.5 min-w-[18px] shrink-0 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-bold text-ink-950">
                          {c.unread_count}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-xs text-white/45">{c.last_message.body}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Thread */}
        <div className="flex flex-col">
          {!activeId ? (
            <div className="flex flex-1 flex-col items-center justify-center text-center text-white/40">
              <MessageSquare size={40} className="mb-3 text-white/20" />
              <p>Select a conversation to start replying.</p>
            </div>
          ) : (
            <>
              <div className="border-b border-ink-800 px-5 py-3">
                <p className="text-sm font-semibold text-white">
                  {active ? `${active.user.first_name} ${active.user.last_name}` : "…"}
                </p>
                {active && <p className="text-xs text-white/40">{active.user.email}</p>}
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto p-5">
                {loadingThread ? (
                  <p className="text-sm text-white/40">Loading…</p>
                ) : messages.length === 0 ? (
                  <p className="mt-10 text-center text-sm text-white/40">No messages in this thread yet.</p>
                ) : (
                  messages.map((m) => {
                    const mine = m.sender_id === user.id;
                    return (
                      <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[75%] rounded-sm px-4 py-2.5 text-sm ${
                            mine ? "bg-gold text-ink-950" : "bg-ink-800 text-white/85"
                          }`}
                        >
                          <p>{m.body}</p>
                          <p className={`mt-1 text-[10px] ${mine ? "text-ink-950/60" : "text-white/40"}`}>
                            {formatDateTime(m.created_at)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={bottomRef} />
              </div>

              <form onSubmit={send} className="flex gap-3 border-t border-ink-800 p-4">
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Type a reply…"
                  className="field-input flex-1"
                />
                <button type="submit" className="btn-primary !px-5">
                  <Send size={16} />
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}