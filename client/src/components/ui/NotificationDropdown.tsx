import { useState, useEffect, useRef } from "react";
import { Bell, MessageCircle, ChevronUp, Check, Trash2, AtSign, Newspaper } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { notificationService } from "../../services/notificationService";
import { useSocket } from "../../context/SocketContext";
import { useAuth } from "../../context/AuthContext";
import { useSettings } from "../../context/SettingsContext";
import type { Notification } from "../../types/notification";
import { formatDate } from "../../utils/formatDate";
import { imgUrl } from "../../utils/imageUrl";
import { RowSkeleton } from "./LoadingSkeleton";

const typeIcon = (type: Notification["type"]) => {
  switch (type) {
    case "comment":  return <MessageCircle size={13} />;
    case "reply":    return <MessageCircle size={13} />;
    case "vote":     return <ChevronUp size={13} />;
    case "mention":  return <AtSign size={13} />;
    case "new_post": return <Newspaper size={13} />;
  }
};

const typeColor = (type: Notification["type"]) => {
  switch (type) {
    case "comment":  return "#3b82f6";
    case "reply":    return "#8b5cf6";
    case "vote":     return "#10b981";
    case "mention":  return "#f59e0b";
    case "new_post": return "#6366f1";
  }
};

const typeLabel: Record<Notification["type"], string> = {
  comment: "New comment",
  reply: "New reply",
  vote: "New upvote",
  mention: "New mention",
  new_post: "New community post",
};

const NotificationDropdown = () => {
  const { isAuthenticated, user } = useAuth();
  const { notificationsEnabled } = useSettings();
  const { socket, joinUser, leaveUser } = useSocket();
  const navigate = useNavigate();

  const [open, setOpen]                   = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread]               = useState(0);
  const [loading, setLoading]             = useState(false);
  const [liveNotice, setLiveNotice]       = useState<Notification | null>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const seenNotificationIds = useRef(new Set<number>());
  const socketNotifications = useRef(new Map<number, Notification>());
  const hasLoadedNotifications = useRef(false);

  // Close on outside click
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  // Join personal socket room + listen for live notifications
  useEffect(() => {
    if (!isAuthenticated || !user || !notificationsEnabled) return;
    joinUser(user.id);

    const h = (n: Notification) => {
      if (seenNotificationIds.current.has(n.id)) return;
      seenNotificationIds.current.add(n.id);
      socketNotifications.current.set(n.id, n);
      setNotifications(prev => [n, ...prev].slice(0, 30));
      setUnread(c => c + 1);
      setLiveNotice(n);
    };
    socket.on("notification", h);

    return () => {
      leaveUser(user.id);
      socket.off("notification", h);
    };
  }, [isAuthenticated, user, socket, joinUser, leaveUser, notificationsEnabled]);

  useEffect(() => {
    if (!liveNotice) return;
    const timer = window.setTimeout(() => setLiveNotice(null), 5000);
    return () => window.clearTimeout(timer);
  }, [liveNotice]);

  // Load on first open
  const handleOpen = async () => {
    setOpen(v => !v);
    if (!open && !hasLoadedNotifications.current) {
      setLoading(true);
      try {
        const { notifications: data, unread_count } = await notificationService.getAll();
        const merged = new Map(data.map(n => [n.id, n]));
        socketNotifications.current.forEach((n, id) => merged.set(id, n));
        const combined = [...merged.values()].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 30);
        combined.forEach(n => seenNotificationIds.current.add(n.id));
        setNotifications(combined);
        setUnread(Math.max(unread_count, combined.filter(n => !n.is_read).length));
        hasLoadedNotifications.current = true;
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    }
  };

  const handleMarkAll = async () => {
    await notificationService.markAllRead().catch(console.error);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnread(0);
  };

  const handleClick = async (n: Notification) => {
    if (!n.is_read) {
      await notificationService.markOneRead(n.id).catch(console.error);
      setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, is_read: true } : x));
      setUnread(c => Math.max(0, c - 1));
    }
    setOpen(false);
    if (n.post_id) navigate(`/post/${n.post_id}`);
  };

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    await notificationService.deleteOne(id).catch(console.error);
    const n = notifications.find(x => x.id === id);
    setNotifications(prev => prev.filter(x => x.id !== id));
    if (n && !n.is_read) setUnread(c => Math.max(0, c - 1));
  };

  if (!isAuthenticated || !notificationsEnabled) return null;

  return (
    <div className="relative" ref={dropRef}>
      {liveNotice && (
        <div role="status" className="fixed right-4 top-20 z-[90] w-[min(22rem,calc(100vw-2rem))] rounded-2xl p-3 shadow-2xl"
          style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}>
          <button type="button" onClick={() => void handleClick(liveNotice)} className="w-full text-left">
            <span className="block text-xs font-semibold" style={{ color: typeColor(liveNotice.type) }}>{typeLabel[liveNotice.type]}</span>
            <span className="mt-1 block text-sm" style={{ color: "var(--text)" }}>{liveNotice.message}</span>
            <span className="mt-1 block text-xs" style={{ color: "var(--muted)" }}>Tap to view</span>
          </button>
          <button type="button" onClick={() => setLiveNotice(null)} aria-label="Dismiss notification"
            className="absolute right-2 top-2 rounded p-1 text-xs hover:bg-[var(--surface2)]" style={{ color: "var(--muted)" }}>×</button>
        </div>
      )}
      {/* Bell button */}
      <button
        onClick={handleOpen}
        className="relative p-2 rounded-full hover:bg-[var(--surface2)] transition-colors"
        style={{ color: "var(--muted)" }}
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unread > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[10px] font-bold text-white px-1"
            style={{ backgroundColor: "#f85149" }}
          >
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-80 rounded-xl shadow-2xl z-50 overflow-hidden"
          style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
            <h3 className="text-sm font-semibold" style={{ color: "var(--text)" }}>
              Notifications {unread > 0 && <span className="ml-1 text-xs px-1.5 py-0.5 rounded-full" style={{ backgroundColor: "var(--accent)", color: "#fff" }}>{unread}</span>}
            </h3>
            {unread > 0 && (
              <button
                onClick={handleMarkAll}
                className="flex items-center gap-1 text-xs hover:opacity-80 transition-opacity"
                style={{ color: "var(--accent)" }}
              >
                <Check size={12} /> Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="overflow-y-auto max-h-[420px]">
            {loading ? (
              <RowSkeleton count={4} />
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center py-10 gap-2" style={{ color: "var(--muted)" }}>
                <Bell size={28} className="opacity-30" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className="group flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-[var(--surface2)] transition-colors"
                  style={{
                    borderBottom: "1px solid var(--border)",
                    backgroundColor: n.is_read ? undefined : "var(--surface2)",
                  }}
                >
                  {/* Actor avatar or type icon */}
                  <div className="relative shrink-0 mt-0.5">
                    {n.actor_avatar ? (
                      <img src={imgUrl(n.actor_avatar)} className="w-8 h-8 rounded-full object-cover" alt="" />
                    ) : (
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                        style={{ backgroundColor: "var(--accent)" }}>
                        {n.actor_username?.[0]?.toUpperCase() ?? "W"}
                      </div>
                    )}
                    {/* Type badge */}
                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-white"
                      style={{ backgroundColor: typeColor(n.type), fontSize: 9 }}>
                      {typeIcon(n.type)}
                    </div>
                  </div>

                  {/* Message */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm leading-snug" style={{ color: "var(--text)" }}>
                      {n.message}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                      {formatDate(n.created_at)}
                    </p>
                  </div>

                  {/* Unread dot + delete */}
                  <div className="flex flex-col items-center gap-2 shrink-0">
                    {!n.is_read && (
                      <span className="w-2 h-2 rounded-full mt-1" style={{ backgroundColor: "var(--accent)" }} />
                    )}
                    <button
                      onClick={e => handleDelete(e, n.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-500"
                      style={{ color: "var(--muted)" }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
