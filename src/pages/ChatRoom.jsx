import { useCallback, useEffect, useState } from "react";
import {
  doc,
  onSnapshot,
  updateDoc,
  arrayUnion,
  getDoc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { db, auth } from "../firebase";
import { useParams } from "react-router-dom";
import RoleNav from "../components/RoleNav";

function ChatRoom() {
  const { chatId } = useParams();
  const [chat, setChat] = useState(null);
  const [currentUid, setCurrentUid] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [text, setText] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [userProfile, setUserProfile] = useState(null);
  const [taskerProfile, setTaskerProfile] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUid(user ? user.uid : null);
      setAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  const getProfile = useCallback(async (uid, collectionName) => {
    if (!uid) return null;

    const snap = await getDoc(doc(db, collectionName, uid));
    if (snap.exists()) {
      return { ...snap.data(), role: collectionName === "taskers" ? "tasker" : "user" };
    }

    return null;
  }, []);

  const loadChatMeta = useCallback(async (chatData) => {
    const [userInfo, taskerInfo] = await Promise.all([
      getProfile(chatData.userId, "users"),
      getProfile(chatData.taskerId, "taskers"),
    ]);

    setUserProfile(userInfo);
    setTaskerProfile(taskerInfo);

    if (chatData.taskId) {
      const taskSnap = await getDoc(doc(db, "tasks", chatData.taskId));
      if (taskSnap.exists()) {
        setTaskTitle(taskSnap.data().title || "Task chat");
      }
    }
  }, [getProfile]);

  useEffect(() => {
    if (!chatId) return;

    const chatRef = doc(db, "chats", chatId);
    const unsub = onSnapshot(chatRef, async (docSnap) => {
      if (docSnap.exists()) {
        const chatData = docSnap.data();
        setChat(chatData);
        await loadChatMeta(chatData);
      } else {
        setChat(null);
      }
    });

    return () => unsub();
  }, [chatId, loadChatMeta]);

  const sendMessage = async (messageText = text) => {
    const trimmed = messageText?.trim();
    if (!trimmed || !currentUid || !chatId) return;

    const chatRef = doc(db, "chats", chatId);

    await updateDoc(chatRef, {
      messages: arrayUnion({
        senderId: currentUid,
        text: trimmed,
        createdAt: new Date(),
      }),
      lastMessage: trimmed,
      updatedAt: new Date(),
    });

    setText("");
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  if (!authReady) return <div style={pageShell}><p style={{ color: "#64748b" }}>Loading chat...</p></div>;
  if (!chat) return <div style={pageShell}><p style={{ color: "#64748b" }}>Loading chat...</p></div>;

  const partner = currentUid === chat.userId ? taskerProfile : userProfile;
  const orderedMessages = [...(chat.messages || [])].sort((a, b) => {
    const aTime = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt || 0).getTime();
    const bTime = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt || 0).getTime();
    return aTime - bTime;
  });

  return (
    <div style={pageShell}>
      <div style={chatShell}>
        <RoleNav title="Conversation" subtitle="Message history and quick replies" backTo="/chats" />
        <div style={headerCard}>
          <div>
            <p style={eyebrow}>Live conversation</p>
            <h3 style={{ margin: "4px 0 6px" }}>Chat with {partner?.name || "your chat partner"}</h3>
            <p style={{ margin: 0, color: "#64748b" }}>Task: {taskTitle || chat.taskId || "Unknown task"}</p>
          </div>
          <div style={statusBadge}>Online • {partner?.role === "tasker" ? "Tasker" : "Client"}</div>
        </div>

        <div style={profileGrid}>
          <div style={profileCard}>
            <h4 style={{ marginTop: 0 }}>Client</h4>
            <p style={profileLine}><strong>Name:</strong> {userProfile?.name || "Unknown"}</p>
            <p style={profileLine}><strong>Email:</strong> {userProfile?.email || "N/A"}</p>
          </div>
          <div style={profileCard}>
            <h4 style={{ marginTop: 0 }}>Tasker</h4>
            <p style={profileLine}><strong>Name:</strong> {taskerProfile?.name || "Unknown"}</p>
            <p style={profileLine}><strong>Email:</strong> {taskerProfile?.email || "N/A"}</p>
            {taskerProfile?.skills && (
              <p style={profileLine}><strong>Skills:</strong> {taskerProfile.skills}</p>
            )}
          </div>
        </div>

        <div style={messagesPanel}>
          {orderedMessages.length ? (
            orderedMessages.map((msg, index) => {
              const isMine = msg.senderId === currentUid;
              return (
                <div key={`${msg.senderId}-${index}`} style={{ display: "flex", justifyContent: isMine ? "flex-end" : "flex-start", marginBottom: "10px" }}>
                  <div style={{ ...bubble, background: isMine ? "#6366f1" : "#ffffff", color: isMine ? "#fff" : "#0f172a", border: isMine ? "none" : "1px solid #e2e8f0" }}>
                    <div style={{ fontSize: "12px", opacity: 0.74, marginBottom: "4px" }}>{isMine ? "You" : partner?.name || "Partner"}</div>
                    <div>{msg.text}</div>
                  </div>
                </div>
              );
            })
          ) : (
            <p style={{ color: "#64748b", margin: 0 }}>No messages yet. Send one to get the conversation started.</p>
          )}
        </div>

        <div style={quickReplyRow}>
          {[
            "Sounds good",
            "On my way",
            "Perfect, I’ll handle it"
          ].map((reply) => (
            <button key={reply} type="button" style={quickReplyBtn} onClick={() => sendMessage(reply)}>
              {reply}
            </button>
          ))}
        </div>

        <div style={inputBox}>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            style={inputField}
          />
          <button type="button" style={sendBtn} onClick={() => sendMessage()}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChatRoom;

const pageShell = {
  minHeight: "100vh",
  padding: "24px",
  background: "linear-gradient(135deg, #f8fbff 0%, #eef4ff 100%)",
  fontFamily: "Inter, Arial, sans-serif"
};

const chatShell = {
  maxWidth: "900px",
  margin: "0 auto",
  background: "#ffffff",
  borderRadius: "24px",
  padding: "24px",
  boxShadow: "0 20px 45px rgba(15, 23, 42, 0.08)"
};

const headerCard = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "16px",
  padding: "16px",
  borderRadius: "16px",
  background: "linear-gradient(135deg, #eef2ff 0%, #f8fafc 100%)",
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

const statusBadge = {
  background: "#dcfce7",
  color: "#166534",
  borderRadius: "999px",
  padding: "8px 12px",
  fontSize: "12px",
  fontWeight: 700
};

const profileGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "16px",
  marginBottom: "18px"
};

const profileCard = {
  background: "#f8fafc",
  padding: "16px",
  borderRadius: "16px",
  border: "1px solid #e2e8f0"
};

const profileLine = {
  margin: "6px 0"
};

const messagesPanel = {
  minHeight: "320px",
  padding: "14px",
  borderRadius: "16px",
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  marginBottom: "12px"
};

const bubble = {
  maxWidth: "72%",
  display: "inline-block",
  padding: "10px 12px",
  borderRadius: "14px",
  margin: "4px 0"
};

const quickReplyRow = {
  display: "flex",
  flexWrap: "wrap",
  gap: "8px",
  marginBottom: "12px"
};

const quickReplyBtn = {
  border: "1px solid #c7d2fe",
  background: "#eef2ff",
  color: "#4338ca",
  borderRadius: "999px",
  padding: "8px 10px",
  cursor: "pointer"
};

const inputBox = {
  display: "flex",
  gap: "10px",
  marginTop: "8px"
};

const inputField = {
  flex: 1,
  border: "1px solid #dbeafe",
  borderRadius: "999px",
  padding: "12px 14px",
  outline: "none"
};

const sendBtn = {
  padding: "0 16px",
  border: "none",
  borderRadius: "999px",
  background: "linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)",
  color: "#fff",
  cursor: "pointer",
  fontWeight: 700
};

