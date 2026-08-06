import { collection, query, where, onSnapshot, getDoc, doc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { db, auth } from "../firebase";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import RoleNav from "../components/RoleNav";

function ChatList() {
  const [userId, setUserId] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [chats, setChats] = useState([]);
  const [tasks, setTasks] = useState({});
  const [users, setUsers] = useState({});
  const [taskers, setTaskers] = useState({});
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUserId(user ? user.uid : null);
      setAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!userId) return;

    const q = query(
      collection(db, "chats"),
      where("participants", "array-contains", userId)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((docItem) => ({
        id: docItem.id,
        ...docItem.data()
      }));
      setChats(data);
    });

    return () => unsub();
  }, [userId]);

  useEffect(() => {
    const loadDetails = async () => {
      setDetailsLoading(true);

      const taskIds = [...new Set(chats.map((chat) => chat.taskId || chat.id).filter(Boolean))];
      const userIds = [...new Set(chats.map((chat) => chat.userId).filter(Boolean))];
      const taskerIds = [...new Set(chats.map((chat) => chat.taskerId).filter(Boolean))];

      if (taskIds.length === 0 && userIds.length === 0 && taskerIds.length === 0) {
        setTasks({});
        setUsers({});
        setTaskers({});
        setDetailsLoading(false);
        return;
      }

      try {
        const [taskDocs, userDocs, taskerDocs] = await Promise.all([
          Promise.all(taskIds.map((id) => getDoc(doc(db, "tasks", id)))),
          Promise.all(userIds.map((id) => getDoc(doc(db, "users", id)))),
          Promise.all(taskerIds.map((id) => getDoc(doc(db, "taskers", id))))
        ]);

        const newTasks = {};
        taskDocs.forEach((snap, i) => {
          if (snap.exists()) newTasks[taskIds[i]] = snap.data();
        });
        setTasks(newTasks);

        const newUsers = {};
        userDocs.forEach((snap, i) => {
          if (snap.exists()) newUsers[userIds[i]] = snap.data();
        });
        setUsers(newUsers);

        const newTaskers = {};
        taskerDocs.forEach((snap, i) => {
          if (snap.exists()) newTaskers[taskerIds[i]] = snap.data();
        });
        setTaskers(newTaskers);
      } catch (error) {
        console.error("Error loading chat details:", error);
      } finally {
        setDetailsLoading(false);
      }
    };

    if (chats.length > 0) loadDetails();
  }, [chats]);

  const toggleFavorite = (chatId) => {
    setFavorites((current) =>
      current.includes(chatId) ? current.filter((id) => id !== chatId) : [...current, chatId]
    );
  };

  const formatTime = (value) => {
    if (!value) return "";
    const date = value?.toDate ? value.toDate() : new Date(value);
    return new Intl.DateTimeFormat("en", {
      hour: "numeric",
      minute: "2-digit"
    }).format(date);
  };

  const filteredChats = [...chats]
    .filter((chat) => {
      const task = tasks[chat.taskId || chat.id];
      const user = users[chat.userId];
      const tasker = taskers[chat.taskerId];
      const partner = chat.userId === userId ? tasker : user;
      const haystack = `${task?.title || ""} ${partner?.name || ""} ${chat.lastMessage || ""}`.toLowerCase();
      return haystack.includes(searchTerm.toLowerCase());
    })
    .sort((a, b) => {
      const aTime = a.updatedAt?.toDate ? a.updatedAt.toDate().getTime() : new Date(a.updatedAt || a.createdAt || 0).getTime();
      const bTime = b.updatedAt?.toDate ? b.updatedAt.toDate().getTime() : new Date(b.updatedAt || b.createdAt || 0).getTime();
      return bTime - aTime;
    });

  const visibleChats = filteredChats.sort((a, b) => {
    const aFav = favorites.includes(a.id) ? 1 : 0;
    const bFav = favorites.includes(b.id) ? 1 : 0;
    return bFav - aFav;
  });

  if (!authReady) {
    return (
      <div style={pageShell}>
        <div style={cardBox}>
          <p style={eyebrow}>Communication hub</p>
          <h2 style={{ margin: "4px 0 8px" }}>My Chats</h2>
          <p style={{ color: "#64748b" }}>Loading chats...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={pageShell}>
      <div style={cardBox}>
        <RoleNav title="Chats" subtitle="Continue conversations with your taskers or clients" backTo="/tasker-dashboard" />
        <div style={heroRow}>
          <div>
            <p style={eyebrow}>Communication hub</p>
            <h2 style={{ margin: "4px 0 8px" }}>Chats</h2>
            <p style={{ margin: 0, color: "#64748b" }}>Stay close to your clients and keep task conversations moving.</p>
          </div>
          <div style={heroBadge}>
            <strong>{chats.length}</strong>
            <span>active chats</span>
          </div>
        </div>

        <div style={toolbar}>
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search chats, tasks or names"
            style={searchInput}
          />
          <div style={pillRow}>
            <span style={pill}>Live</span>
            <span style={pill}>Quick replies</span>
          </div>
        </div>

        {visibleChats.length === 0 && (
          <div style={emptyState}>
            <h3 style={{ margin: "0 0 6px" }}>No matching chats yet</h3>
            <p style={{ margin: 0, color: "#64748b" }}>Try another search term or start a new conversation.</p>
          </div>
        )}

        <div style={listWrap}>
          {visibleChats.map((chat) => {
            const task = tasks[chat.taskId || chat.id];
            const user = users[chat.userId];
            const tasker = taskers[chat.taskerId];
            const partner = chat.userId === userId ? tasker : user;
            const taskTitle = task?.title || (detailsLoading ? "Loading task..." : "Unknown task");
            const partnerName = partner?.name || (detailsLoading ? "Loading..." : "Unknown participant");
            const preview = chat.lastMessage || "No messages yet";
            const isFavorite = favorites.includes(chat.id);

            return (
              <Link key={chat.id} to={`/chat/${chat.id}`} style={chatCard}>
                <div style={cardTopRow}>
                  <div style={{ flex: 1 }}>
                    <div style={taskLabel}>Task • {taskTitle}</div>
                    <div style={partnerLabel}>{partnerName}</div>
                  </div>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      toggleFavorite(chat.id);
                    }}
                    style={{ ...starBtn, color: isFavorite ? "#f59e0b" : "#94a3b8" }}
                  >
                    ★
                  </button>
                </div>

                <p style={previewText}>{preview}</p>

                <div style={cardFooter}>
                  <span style={statusPill}>{isFavorite ? "Favorite" : "Active"}</span>
                  <span style={timeText}>{formatTime(chat.updatedAt || chat.createdAt)}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default ChatList;

const pageShell = {
  minHeight: "100vh",
  padding: "24px",
  background: "linear-gradient(135deg, #f8fbff 0%, #eef4ff 100%)",
  fontFamily: "Inter, Arial, sans-serif"
};

const cardBox = {
  maxWidth: "760px",
  margin: "0 auto",
  background: "#ffffff",
  borderRadius: "24px",
  padding: "24px",
  boxShadow: "0 20px 45px rgba(15, 23, 42, 0.08)"
};

const heroRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "16px",
  marginBottom: "16px"
};

const eyebrow = {
  margin: 0,
  fontSize: "12px",
  fontWeight: 700,
  letterSpacing: "0.16em",
  textTransform: "uppercase",
  color: "#6366f1"
};

const heroBadge = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  background: "linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)",
  color: "#fff",
  borderRadius: "16px",
  padding: "12px 14px",
  minWidth: "92px"
};

const toolbar = {
  display: "flex",
  flexWrap: "wrap",
  gap: "12px",
  marginBottom: "16px"
};

const searchInput = {
  flex: 1,
  minWidth: "240px",
  border: "1px solid #e2e8f0",
  borderRadius: "999px",
  padding: "12px 14px",
  fontSize: "14px",
  outline: "none"
};

const pillRow = {
  display: "flex",
  gap: "8px",
  alignItems: "center"
};

const pill = {
  background: "#f1f5f9",
  color: "#475569",
  padding: "8px 10px",
  borderRadius: "999px",
  fontSize: "12px",
  fontWeight: 700
};

const listWrap = {
  display: "flex",
  flexDirection: "column",
  gap: "10px"
};

const chatCard = {
  display: "block",
  padding: "14px 16px",
  borderRadius: "16px",
  border: "1px solid #e2e8f0",
  background: "#f8fafc",
  textDecoration: "none",
  color: "#0f172a"
};

const cardTopRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "12px"
};

const taskLabel = {
  fontSize: "12px",
  fontWeight: 700,
  color: "#6366f1",
  textTransform: "uppercase",
  letterSpacing: "0.08em"
};

const partnerLabel = {
  marginTop: "4px",
  fontSize: "16px",
  fontWeight: 700
};

const starBtn = {
  border: "none",
  background: "transparent",
  fontSize: "22px",
  cursor: "pointer"
};

const previewText = {
  margin: "10px 0 12px",
  color: "#475569",
  fontSize: "14px"
};

const cardFooter = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "8px"
};

const statusPill = {
  background: "#dcfce7",
  color: "#166534",
  padding: "6px 10px",
  borderRadius: "999px",
  fontSize: "12px",
  fontWeight: 700
};

const timeText = {
  color: "#64748b",
  fontSize: "12px"
};

const emptyState = {
  padding: "20px",
  borderRadius: "16px",
  background: "#f8fafc",
  textAlign: "center"
};