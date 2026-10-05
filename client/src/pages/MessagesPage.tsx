import { useEffect, useRef, useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { ArrowLeft, Ban, ImagePlus, MessageCircle, Send, Trash2, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { messageService, type Conversation, type DirectMessage } from "../services/messageService";
import { imgUrl } from "../utils/imageUrl";

const MessagesPage = () => {
  const { user } = useAuth();
  const { socket, joinInbox, leaveInbox } = useSocket();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeId = Number(searchParams.get("user")) || 0;
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [targetUser, setTargetUser] = useState<{ id: number; username: string; profile_image?: string } | null>(null);
  const [blocked, setBlocked] = useState(false);
  const [body, setBody] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const active = conversations.find(conversation => conversation.user_id === activeId);
  const activeUsername = active?.username ?? targetUser?.username;
  const activeAvatar = active?.profile_image ?? targetUser?.profile_image;
  const loadConversations = () => messageService.list().then(setConversations).catch(() => setError("Could not load your conversations."));

  useEffect(() => { void loadConversations().finally(() => setLoading(false)); }, []);
  useEffect(() => {
    if (!user?.id) return;
    joinInbox(user.id);
    const onDirectMessage = (message: DirectMessage) => {
      void loadConversations();
      if (message.sender_id === activeId || message.recipient_id === activeId) {
        setMessages(current => current.some(existing => existing.id === message.id) ? current : [...current, message]);
      }
    };
    socket.on("direct_message", onDirectMessage);
    return () => { socket.off("direct_message", onDirectMessage); leaveInbox(user.id); };
  }, [user?.id, activeId, socket, joinInbox, leaveInbox]);
  useEffect(() => {
    setTargetUser(null);
    if (!activeId) { setMessages([]); return; }
    setError("");
    if (!active) void messageService.getUser(activeId).then(setTargetUser).catch(() => setTargetUser(null));
    messageService.thread(activeId).then(data => { setMessages(data.messages); setBlocked(data.blocked); }).catch(() => setError("Could not load this conversation."));
  }, [activeId, active?.username]);
  useEffect(() => {
    if (!image) { setImagePreview(""); return; }
    const url = URL.createObjectURL(image);
    setImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);

  const send = async (event: FormEvent) => {
    event.preventDefault();
    if (!activeId || (!body.trim() && !image) || (image && image.size > 5 * 1024 * 1024) || busy) return;
    setBusy(true); setError("");
    try {
      const message = await messageService.send(activeId, body, image ?? undefined);
      setMessages(current => current.some(existing => existing.id === message.id) ? current : [...current, message]);
      setBody(""); setImage(null); if (fileInput.current) fileInput.current.value = "";
      await loadConversations();
    } catch (err) { setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Could not send message."); }
    finally { setBusy(false); }
  };
  const block = async () => {
    if (!activeId) return;
    try { if (blocked) await messageService.unblock(activeId); else await messageService.block(activeId); setBlocked(!blocked); }
    catch { setError("Could not update block settings."); }
  };
  const hide = async () => {
    if (!activeId || !window.confirm("Delete this conversation from your inbox?")) return;
    try { await messageService.hide(activeId); setConversations(current => current.filter(conversation => conversation.user_id !== activeId)); setSearchParams({}); setMessages([]); }
    catch { setError("Could not delete this conversation."); }
  };

  return <section className="mx-auto flex h-[calc(100dvh-9rem)] min-h-[24rem] max-w-5xl flex-col overflow-hidden rounded-2xl sm:h-[min(78vh,800px)] sm:flex-row" style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}>
    <aside className={`${activeId ? "hidden sm:flex" : "flex"} w-full shrink-0 flex-col sm:w-72`} style={{ borderRight: "1px solid var(--border)" }}>
      <h1 className="border-b px-4 py-4 text-lg font-bold" style={{ color: "var(--text)", borderColor: "var(--border)" }}>Messages</h1>
      <div className="flex-1 overflow-y-auto">
        {loading && <p className="p-4 text-sm" style={{ color: "var(--muted)" }}>Loading…</p>}
        {!loading && conversations.length === 0 && <p className="p-4 text-sm" style={{ color: "var(--muted)" }}>No messages yet. Visit a profile to start a conversation.</p>}
        {conversations.map(conversation => <button key={conversation.user_id} type="button" onClick={() => setSearchParams({ user: String(conversation.user_id) })} className="flex w-full items-center gap-3 border-b px-4 py-3 text-left hover:bg-[var(--surface2)]" style={{ borderColor: "var(--border)", backgroundColor: activeId === conversation.user_id ? "var(--surface2)" : undefined }}>
          {conversation.profile_image ? <img src={imgUrl(conversation.profile_image)} className="h-9 w-9 shrink-0 rounded-full object-cover" alt="" /> : <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white" style={{ backgroundColor: "var(--accent)" }}>{conversation.username[0]?.toUpperCase()}</span>}
          <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold" style={{ color: "var(--text)" }}>u/{conversation.username}</span><span className="block truncate text-xs" style={{ color: "var(--muted)" }}>{conversation.last_message}</span></span>
          {!!Number(conversation.unread_count) && <span className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white" style={{ backgroundColor: "var(--accent)" }}>{conversation.unread_count}</span>}
        </button>)}
      </div>
    </aside>
    <div className={`${activeId ? "flex" : "hidden sm:flex"} min-h-0 min-w-0 flex-1 flex-col`}>
      {activeId ? <>
        <header className="flex min-w-0 items-center gap-2 border-b px-2 py-2 sm:px-4 sm:py-3" style={{ borderColor: "var(--border)" }}>
          <button type="button" onClick={() => setSearchParams({})} className="rounded-lg p-2 sm:hidden" style={{ color: "var(--muted)" }} aria-label="Back to inbox"><ArrowLeft size={17} /></button>
          {activeAvatar ? <img src={imgUrl(activeAvatar)} className="h-8 w-8 shrink-0 rounded-full object-cover" alt="" /> : <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white" style={{ backgroundColor: "var(--accent)" }}>{activeUsername?.[0]?.toUpperCase() ?? "?"}</span>}
          <h2 className="min-w-0 flex-1 truncate font-semibold" style={{ color: "var(--text)" }}>{activeUsername ? `u/${activeUsername}` : "Loading user…"}</h2>
          <button type="button" title={blocked ? "Unblock user" : "Block user"} onClick={() => void block()} className="rounded-lg p-2 hover:bg-[var(--surface2)]" style={{ color: blocked ? "var(--accent)" : "var(--muted)" }}><Ban size={17} /></button>
          <button type="button" title="Delete conversation" onClick={() => void hide()} className="rounded-lg p-2 text-red-500 hover:bg-red-500/10"><Trash2 size={17} /></button>
        </header>
        <div className="flex-1 space-y-3 overflow-y-auto p-3 sm:p-4">
          {error && <p role="alert" className="text-sm text-red-500">{error}</p>}
          {messages.map(message => <div key={message.id} className={`flex ${message.sender_id === user?.id ? "justify-end" : "justify-start"}`}><article className="max-w-[88%] min-w-0 rounded-2xl px-3 py-2 sm:max-w-[75%]" style={{ backgroundColor: message.sender_id === user?.id ? "var(--accent)" : "var(--surface2)", color: message.sender_id === user?.id ? "white" : "var(--text)" }}>{message.body && <p className="whitespace-pre-wrap break-words text-sm">{message.body}</p>}{message.image && <img src={imgUrl(message.image)} alt="Image message" className="mt-1 max-h-72 max-w-full rounded-lg object-contain" />}<p className="mt-1 text-right text-[10px] opacity-70">{new Date(message.created_at).toLocaleString()}{message.sender_id === user?.id && message.read_at ? " · Read" : ""}</p></article></div>)}
        </div>
        <form onSubmit={send} className="shrink-0 border-t p-2 sm:p-3" style={{ borderColor: "var(--border)" }}>
          {imagePreview && <div className="mb-2 inline-flex items-start gap-2 rounded-xl p-1" style={{ backgroundColor: "var(--surface2)" }}><img src={imagePreview} alt="Image preview" className="max-h-24 max-w-40 rounded-lg object-contain" /><button type="button" onClick={() => setImage(null)} aria-label="Remove image" className="rounded-full p-1"><X size={15} /></button></div>}
          <div className="flex items-end gap-2">
            <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/gif,image/webp" className="hidden" onChange={event => setImage(event.target.files?.[0] ?? null)} />
            <button type="button" title="Attach image" aria-label="Attach image" disabled={busy || blocked} onClick={() => fileInput.current?.click()} className="flex h-11 w-10 shrink-0 items-center justify-center rounded-xl hover:bg-[var(--surface2)] disabled:opacity-50" style={{ color: "var(--muted)" }}><ImagePlus size={19} /></button>
            <textarea value={body} onChange={event => setBody(event.target.value)} maxLength={4000} rows={2} placeholder={blocked ? "Unblock to send messages" : "Write a message…"} disabled={busy || blocked} className="max-h-32 min-h-11 min-w-0 flex-1 resize-y rounded-xl px-3 py-2 text-sm outline-none disabled:opacity-50" style={{ color: "var(--text)", backgroundColor: "var(--input-bg)", border: "1px solid var(--border)" }} />
            <button disabled={busy || blocked || (!body.trim() && !image) || (!!image && image.size > 5 * 1024 * 1024)} aria-label="Send message" className="flex h-11 shrink-0 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-white disabled:opacity-50 sm:px-4" style={{ backgroundColor: "var(--accent)" }}><Send size={15} /><span className="hidden sm:inline">Send</span></button>
          </div>
          {image && image.size > 5 * 1024 * 1024 && <p className="mt-1 text-xs text-red-500">Images must be 5 MB or smaller.</p>}
        </form>
      </> : <div className="m-auto p-8 text-center" style={{ color: "var(--muted)" }}><MessageCircle size={32} className="mx-auto mb-3 opacity-50" /><p>Select a conversation to start messaging.</p></div>}
    </div>
  </section>;
};
export default MessagesPage;
