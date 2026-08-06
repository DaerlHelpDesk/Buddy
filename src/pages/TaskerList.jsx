import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  query,
  orderBy,
  doc,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { db, auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import RoleNav from "../components/RoleNav";

function TaskerList() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acceptingId, setAcceptingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const q = query(
          collection(db, "tasks"),
          orderBy("createdAt", "desc")
        );

        const snapshot = await getDocs(q);

        const taskData = snapshot.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(task => task.status === "open");

        setTasks(taskData);
      } catch (error) {
        console.error("Error fetching tasks:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  const acceptTask = async (task) => {
    if (!auth.currentUser) {
      alert("You must be logged in to accept tasks.");
      return;
    }

    if (!task.userId) {
      alert("Task is missing owner information.");
      return;
    }

    setAcceptingId(task.id);

    const taskRef = doc(db, "tasks", task.id);
    const chatRef = doc(db, "chats", task.id);

    try {
      await runTransaction(db, async (transaction) => {
        const taskSnap = await transaction.get(taskRef);

        if (!taskSnap.exists()) {
          throw new Error("Task does not exist.");
        }

        const taskData = taskSnap.data();

        if (taskData.status !== "open") {
          throw new Error("Task already assigned.");
        }

        const taskerRef = doc(db, "taskers", auth.currentUser.uid);
        const taskerSnap = await transaction.get(taskerRef);
        const taskerInfo = taskerSnap.exists() ? taskerSnap.data() : {};

        transaction.update(taskRef, {
          status: "assigned",
          taskerId: auth.currentUser.uid,
          taskerName: taskerInfo.name || "",
          taskerEmail: taskerInfo.email || "",
          taskerSkills: taskerInfo.skills || [],
          assignedAt: serverTimestamp(),
        });

        transaction.set(chatRef, {
          taskId: task.id,
          userId: taskData.userId,
          taskerId: auth.currentUser.uid,
          participants: [taskData.userId, auth.currentUser.uid],
          lastMessage: "",
          lastMessageAt: serverTimestamp(),
          createdAt: serverTimestamp(),
        });
      });

      setTasks((prev) => prev.filter((item) => item.id !== task.id));
      navigate(`/chat/${task.id}`);
    } catch (error) {
      console.error("Accept task error:", error);
      alert(error.message || "Failed to accept task");
    } finally {
      setAcceptingId(null);
    }
  };

  const filteredTasks = tasks.filter((task) => {
    const search = searchTerm.toLowerCase();
    return (
      task.title?.toLowerCase().includes(search) ||
      task.description?.toLowerCase().includes(search) ||
      String(task.budget || "").includes(search)
    );
  });

  const totalBudget = tasks.reduce((sum, task) => sum + Number(task.budget || 0), 0);

  const formatTime = (value) => {
    if (!value) return "Just posted";
    const date = value?.toDate ? value.toDate() : new Date(value);
    return date.toLocaleDateString("en", { month: "short", day: "numeric" });
  };

  if (loading) {
    return (
      <div style={pageShell}>
        <div style={panel}>
          <p style={{ color: "#64748b" }}>Loading available tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={pageShell}>
      <div style={panel}>
        <RoleNav title="Available Tasks" subtitle="Browse open work and accept a task" backTo="/tasker-dashboard" />
        <div style={heroRow}>
          <div>
            <p style={eyebrow}>Task discovery</p>
            <h2 style={{ margin: "4px 0 8px" }}>Available Tasks</h2>
            <p style={{ margin: 0, color: "#64748b" }}>Pick the right task and jump straight into a new conversation.</p>
          </div>
          <div style={metricCard}>
            <strong>{tasks.length}</strong>
            <span>open tasks</span>
          </div>
        </div>

        <div style={toolbar}>
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by task name, description or budget"
            style={searchInput}
          />
          <div style={pillRow}>
            <span style={pill}>Live matches</span>
            <span style={pill}>R{totalBudget.toFixed(0)} total</span>
          </div>
        </div>

        {filteredTasks.length === 0 ? (
          <div style={emptyState}>
            <h3 style={{ margin: 0 }}>No matching tasks right now</h3>
            <p style={{ margin: "6px 0 0", color: "#64748b" }}>Try a different keyword or check back soon.</p>
          </div>
        ) : (
          filteredTasks.map((task) => (
            <div key={task.id} style={card}>
              <div style={cardTopRow}>
                <div>
                  <div style={taskLabel}>Open request</div>
                  <h3 style={{ margin: "6px 0 8px" }}>{task.title}</h3>
                </div>
                <div style={budgetBadge}>R{task.budget}</div>
              </div>

              <p style={descriptionText}>{task.description || "A new task is waiting for a skilled tasker."}</p>

              <div style={metaRow}>
                <span style={metaChip}>Status • {task.status}</span>
                <span style={metaChip}>Posted • {formatTime(task.createdAt)}</span>
              </div>

              <div style={actionRow}>
                <button
                  style={{
                    ...button,
                    opacity: acceptingId === task.id ? 0.6 : 1,
                    cursor: acceptingId === task.id ? "not-allowed" : "pointer",
                  }}
                  disabled={acceptingId === task.id}
                  onClick={() => acceptTask(task)}
                >
                  {acceptingId === task.id ? "Accepting..." : "Accept Task"}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default TaskerList;

const pageShell = {
  minHeight: "100vh",
  padding: "24px",
  background: "linear-gradient(135deg, #f8fbff 0%, #eef4ff 100%)",
  fontFamily: "Inter, Arial, sans-serif",
};

const panel = {
  maxWidth: "900px",
  margin: "0 auto",
  background: "#ffffff",
  borderRadius: "24px",
  padding: "24px",
  boxShadow: "0 20px 45px rgba(15, 23, 42, 0.08)",
};

const heroRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "16px",
  marginBottom: "16px",
};

const eyebrow = {
  margin: 0,
  fontSize: "12px",
  fontWeight: 700,
  letterSpacing: "0.16em",
  textTransform: "uppercase",
  color: "#6366f1",
};

const metricCard = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  background: "linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)",
  color: "#fff",
  borderRadius: "16px",
  padding: "12px 14px",
  minWidth: "96px",
};

const toolbar = {
  display: "flex",
  flexWrap: "wrap",
  gap: "12px",
  marginBottom: "16px",
};

const searchInput = {
  flex: 1,
  minWidth: "260px",
  border: "1px solid #e2e8f0",
  borderRadius: "999px",
  padding: "12px 14px",
  fontSize: "14px",
  outline: "none",
};

const pillRow = {
  display: "flex",
  gap: "8px",
  alignItems: "center",
};

const pill = {
  background: "#f1f5f9",
  color: "#475569",
  padding: "8px 10px",
  borderRadius: "999px",
  fontSize: "12px",
  fontWeight: 700,
};

const card = {
  background: "#f8fafc",
  padding: "18px",
  borderRadius: "16px",
  marginBottom: "14px",
  border: "1px solid #e2e8f0",
};

const cardTopRow = {
  display: "flex",
  justifyContent: "space-between",
  gap: "12px",
  alignItems: "flex-start",
};

const taskLabel = {
  fontSize: "12px",
  fontWeight: 700,
  color: "#6366f1",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
};

const budgetBadge = {
  background: "#dcfce7",
  color: "#166534",
  borderRadius: "999px",
  padding: "8px 12px",
  fontWeight: 700,
};

const descriptionText = {
  margin: "10px 0",
  color: "#475569",
  lineHeight: 1.5,
};

const metaRow = {
  display: "flex",
  flexWrap: "wrap",
  gap: "8px",
  marginBottom: "12px",
};

const metaChip = {
  background: "#eef2ff",
  color: "#4338ca",
  borderRadius: "999px",
  padding: "6px 10px",
  fontSize: "12px",
  fontWeight: 700,
};

const actionRow = {
  display: "flex",
  justifyContent: "flex-end",
};

const button = {
  background: "linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)",
  color: "#fff",
  border: "none",
  padding: "12px 18px",
  borderRadius: "999px",
  fontWeight: 700,
  cursor: "pointer",
};

const emptyState = {
  padding: "20px",
  borderRadius: "16px",
  background: "#f8fafc",
  textAlign: "center",
};
