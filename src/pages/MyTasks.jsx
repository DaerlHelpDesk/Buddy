import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  updateDoc
} from "firebase/firestore";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";

function MyTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);

  // Get logged-in tasker
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) setUserId(user.uid);
    });
    return () => unsubscribe();
  }, []);

  // Fetch accepted tasks
  useEffect(() => {
    if (!userId) return;

    const fetchMyTasks = async () => {
      try {
        const q = query(
          collection(db, "tasks"),
          where("taskerId", "==", userId)
        );

        const snapshot = await getDocs(q);
        const taskList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setTasks(taskList);
      } catch (error) {
        console.error("Error fetching tasks:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMyTasks();
  }, [userId]);

  // ✅ MARK TASK AS COMPLETED
  const markCompleted = async (taskId) => {
    try {
      await updateDoc(doc(db, "tasks", taskId), {
        status: "completed",
        completedAt: new Date(),
      });

      // Update UI instantly
      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId
            ? { ...task, status: "completed", completedAt: new Date() }
            : task
        )
      );
    } catch (error) {
      console.error("Failed to mark completed:", error);
      alert("Could not complete task");
    }
  };

  if (loading) {
    return <p style={loadingStyle}>Loading your tasks...</p>;
  }

  return (
    <div style={container}>
      <h2 style={heading}>My Accepted Tasks</h2>

      {tasks.length === 0 && (
        <p style={emptyText}>You haven’t accepted any tasks yet.</p>
      )}

      {tasks.map((task) => (
        <div key={task.id} style={card}>
          <h3>{task.title}</h3>
          <p>{task.description}</p>

          <p><strong>Budget:</strong> R{task.budget}</p>

          <p>
            <strong>Status:</strong>{" "}
            <span
              style={{
                color:
                  task.status === "completed"
                    ? "green"
                    : task.status === "assigned"
                    ? "#0984e3"
                    : "gray",
              }}
            >
              {task.status}
            </span>
          </p>

          {/* ✅ COMPLETED BUTTON */}
          {task.status === "assigned" && (
            <button
              style={completeButton}
              onClick={() => markCompleted(task.id)}
            >
              Mark as Completed
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

export default MyTasks;

/* ---------------- STYLES ---------------- */

const container = {
  maxWidth: "900px",
  margin: "40px auto",
  padding: "20px",
  fontFamily: "Arial, sans-serif",
};

const heading = {
  textAlign: "center",
  marginBottom: "30px",
};

const card = {
  background: "#fff",
  padding: "20px",
  borderRadius: "10px",
  marginBottom: "20px",
  boxShadow: "0 6px 15px rgba(0,0,0,0.1)",
};

const completeButton = {
  marginTop: "10px",
  backgroundColor: "#00b894",
  color: "#fff",
  border: "none",
  padding: "10px 16px",
  borderRadius: "6px",
  cursor: "pointer",
  fontWeight: "bold",
};

const loadingStyle = {
  textAlign: "center",
  marginTop: "40px",
  fontSize: "18px",
};

const emptyText = {
  textAlign: "center",
  color: "#777",
};
