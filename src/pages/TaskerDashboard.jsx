import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  collection,
  query,
  where,
  doc,
  updateDoc,
  onSnapshot,
  getDoc,
  orderBy
} from "firebase/firestore";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import ConfirmModal from "../components/ConfirmModal";
import TaskCard from "../components/TaskCard";
import EarningsCard from "../components/EarningsCard";
import RoleNav from "../components/RoleNav";

function TaskerDashboard() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState(null);
  const [availableTasks, setAvailableTasks] = useState([]);
  const [myTasks, setMyTasks] = useState([]);
  const [earnings, setEarnings] = useState(0);
  const [loading, setLoading] = useState(true);
  const [available, setAvailable] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setUserId(user ? user.uid : null);
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!userId) return;

    // Load availability from taskers doc (if exists)
    const loadAvailability = async () => {
      try {
        const snap = await getDoc(doc(db, "taskers", userId));
        if (snap.exists()) {
          const data = snap.data();
          setAvailable(data.available !== undefined ? data.available : true);
        }
      } catch (err) {
        console.error("Failed to load availability", err);
      }
    };

    loadAvailability();

    // Subscribe to available tasks (status open)
    const qOpen = query(
      collection(db, "tasks"),
      where("status", "==", "open"),
      orderBy("createdAt", "desc")
    );

    const unsubOpen = onSnapshot(qOpen, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setAvailableTasks(list);
    });

    // Subscribe to my tasks (assigned to me)
    const qMine = query(
      collection(db, "tasks"),
      where("taskerId", "==", userId),
      orderBy("createdAt", "desc")
    );

    const unsubMine = onSnapshot(qMine, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setMyTasks(list);
      // compute earnings
      const total = list
        .filter((t) => t.paid)
        .reduce((s, t) => s + (parseFloat(t.budget) || 0), 0);
      setEarnings(total);
      setLoading(false);
    });

    return () => {
      unsubOpen();
      unsubMine();
    };
  }, [userId]);

  const toggleAvailability = async () => {
    if (!userId) return;
    try {
      const taskerRef = doc(db, "taskers", userId);
      await updateDoc(taskerRef, { available: !available });
      setAvailable((v) => !v);
    } catch (err) {
      console.error("Failed to toggle availability", err);
      alert("Could not change availability");
    }
  };

  const acceptTask = async (taskId) => {
    if (!userId) return;
    try {
      await updateDoc(doc(db, "tasks", taskId), {
        taskerId: userId,
        status: "assigned",
        assignedAt: new Date()
      });
      alert("Task accepted");
      navigate('/my-tasks');
    } catch (err) {
      console.error("Accept failed", err);
      alert("Failed to accept task");
    }
  };

  const markCompleted = async (taskId) => {
    try {
      await updateDoc(doc(db, "tasks", taskId), { status: "completed", completedAt: new Date() });
      alert("Marked as completed");
    } catch (err) {
      console.error("Complete failed", err);
      alert("Failed to mark completed");
    }
  };

  // confirmation modal state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null); // { type: 'accept'|'complete', taskId }

  const showConfirm = (type, taskId) => {
    setConfirmAction({ type, taskId });
    setConfirmOpen(true);
  };

  const handleConfirm = async () => {
    if (!confirmAction) return setConfirmOpen(false);
    const { type, taskId } = confirmAction;
    setConfirmOpen(false);
    if (type === 'accept') return acceptTask(taskId);
    if (type === 'complete') return markCompleted(taskId);
  };

  return (
    <div style={container}>
      <RoleNav title="Tasker Dashboard" subtitle="Stay on top of work and messages" backTo="/" />
      <div style={headerRow}>
        <h2 style={{ margin: 0 }}>Tasker Dashboard</h2>
        <div>
          <button style={chatBtn} onClick={() => navigate('/chats')}>Chats</button>
          <Link to="/tasker-list">
            <button style={{ ...actionBtn, marginLeft: 8 }}>Browse</button>
          </Link>
        </div>
      </div>

      <div style={grid}>
        <div style={cardLarge}>
          <h3>Availability</h3>
          <p style={{ color: '#666' }}>
            Toggle whether you are accepting new tasks right now.
          </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <label style={toggleLabel}>
                <input type="checkbox" checked={available} onChange={toggleAvailability} />
                <span style={{ marginLeft: 8 }}>{available ? 'Available' : 'Unavailable'}</span>
              </label>
              <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                <div style={{ fontSize: 20, fontWeight: 'bold' }}>R{earnings}</div>
                <div style={{ color: '#777', fontSize: 12 }}>Total Earnings (paid)</div>
              </div>
            </div>
            <div style={{ marginTop: 14 }}>
              <EarningsCard tasks={myTasks} />
            </div>
        </div>

        <div style={card}>
          <h3>Incoming Tasks</h3>
          {loading ? (
            <p>Loading...</p>
          ) : availableTasks.length === 0 ? (
            <p style={{ color: '#777' }}>No open tasks right now.</p>
          ) : (
            availableTasks.slice(0, 6).map((task) => (
              <TaskCard key={task.id} task={task} showAccept onAccept={(id) => showConfirm('accept', id)} />
            ))
          )}
        </div>

        <div style={card}>
          <h3>My Upcoming Tasks</h3>
          {myTasks.length === 0 ? (
            <p style={{ color: '#777' }}>You have no assigned tasks.</p>
          ) : (
            myTasks.map((task) => (
              <TaskCard key={task.id} task={task} onComplete={task.status !== 'completed' ? (id) => showConfirm('complete', id) : null} />
            ))
          )}
        </div>
      </div>
      <ConfirmModal
        open={confirmOpen}
        title={confirmAction?.type === 'accept' ? 'Accept Task' : 'Mark Completed'}
        message={confirmAction?.type === 'accept' ? 'Are you sure you want to accept this task? This will assign it to you.' : 'Mark this task as completed?'}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmOpen(false)}
        confirmLabel={confirmAction?.type === 'accept' ? 'Accept' : 'Complete'}
      />
    </div>
  );
}

export default TaskerDashboard;

// confirm modal render
// place at bottom of file to avoid interfering with other logic

/* Styles */
const container = {
  maxWidth: 1100,
  margin: '28px auto',
  padding: 20,
  fontFamily: 'Arial, sans-serif'
};

const headerRow = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 20
};

const grid = {
  display: 'grid',
  gridTemplateColumns: '1fr 380px 380px',
  gap: 18
};

const card = {
  background: '#fff',
  padding: 18,
  borderRadius: 10,
  boxShadow: '0 6px 18px rgba(15,15,15,0.06)'
};

const cardLarge = {
  ...card,
  gridColumn: '1 / 2'
};

const chatBtn = {
  backgroundColor: '#6c5ce7',
  color: '#fff',
  border: 'none',
  padding: '8px 12px',
  borderRadius: 8,
  cursor: 'pointer'
};

const actionBtn = {
  backgroundColor: '#00b894',
  color: '#fff',
  border: 'none',
  padding: '8px 12px',
  borderRadius: 8,
  cursor: 'pointer'
};

const toggleLabel = {
  display: 'flex',
  alignItems: 'center',
  fontSize: 16,
  color: '#333'
};
