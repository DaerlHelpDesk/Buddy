import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  doc,
  getDoc,
  updateDoc,
  onSnapshot
} from "firebase/firestore";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { Link, useNavigate } from "react-router-dom";
import StripePayment from "../components/StripePayment";
import RoleNav from "../components/RoleNav";

function UserDashboard() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [ratingSelection, setRatingSelection] = useState({});
  const [ratingSubmitting, setRatingSubmitting] = useState({});
  const [showPaymentForm, setShowPaymentForm] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUserId(user ? user.uid : null);
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (userId === null) {
      if (!authLoading) {
        setTasks([]);
        setLoading(false);
      }
      return;
    }

    const q = query(
      collection(db, "tasks"),
      where("userId", "==", userId)
    );

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        try {
          const tasksWithTasker = await Promise.all(
            snapshot.docs.map(async (taskDoc) => {
              const taskData = { id: taskDoc.id, ...taskDoc.data() };

              if (taskData.taskerId) {
                const taskerSnap = await getDoc(
                  doc(db, "taskers", taskData.taskerId)
                );

                if (taskerSnap.exists()) {
                  taskData.tasker = taskerSnap.data();
                }
              }

              if (!taskData.tasker && taskData.taskerName) {
                taskData.tasker = {
                  name: taskData.taskerName,
                  email: taskData.taskerEmail,
                  skills: taskData.taskerSkills,
                };
              }

              return taskData;
            })
          );

          setTasks(tasksWithTasker);
          setLoading(false);
        } catch (error) {
          console.error("Error loading tasks:", error);
          setLoading(false);
        }
      },
      (error) => {
        console.error("Task snapshot error:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId, authLoading]);

  const handleSubmitRating = async (taskId) => {
    const score = ratingSelection[taskId];
    if (!score) return;

    setRatingSubmitting((prev) => ({ ...prev, [taskId]: true }));

    try {
      await updateDoc(doc(db, "tasks", taskId), {
        userRating: score,
        ratedAt: new Date(),
      });

      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId ? { ...task, userRating: score } : task
        )
      );
    } catch (error) {
      console.error("Failed to submit rating:", error);
      alert("Could not submit rating. Please try again.");
    } finally {
      setRatingSubmitting((prev) => ({ ...prev, [taskId]: false }));
    }
  };

  const handlePaymentSuccess = async (taskId) => {
    try {
      await updateDoc(doc(db, "tasks", taskId), {
        paid: true,
        paidAt: new Date(),
      });

      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId ? { ...task, paid: true } : task
        )
      );

      setShowPaymentForm((prev) => ({ ...prev, [taskId]: false }));
      alert("Payment successful!");
    } catch (error) {
      console.error("Failed to update payment status:", error);
      alert("Payment processed but status update failed. Please contact support.");
    }
  };

  const handlePaymentError = (errorMessage) => {
    alert(`Payment failed: ${errorMessage}`);
  };

  const togglePaymentForm = (taskId) => {
    setShowPaymentForm((prev) => ({
      ...prev,
      [taskId]: !prev[taskId]
    }));
  };

  if (authLoading || loading) {
    return <p style={{ textAlign: "center" }}>Loading your tasks...</p>;
  }

  return (
    <div style={container}>
      <RoleNav title="My Posted Tasks" subtitle="Manage your requests and conversations" backTo="/" />
      <h2>My Posted Tasks & History</h2>
      <p style={{ color: "#555", marginTop: "0", marginBottom: "20px" }}>
        Review all tasks you posted, including completed work and rating opportunities.
      </p>

      <div style={{ marginBottom: "20px" }}>
        <Link to="/task-request">
          <button style={postBtn}>Post New Task</button>
        </Link>

        <button
          style={{ ...postBtn, marginLeft: "10px", background: "#00b894" }}
          onClick={() => navigate("/chats")}
        >
          My Chats
        </button>

        <Link to="/find-taskers">
          <button
            style={{
              ...postBtn,
              marginLeft: "10px",
              background: "#6c5ce7"
            }}
          >
            Find Taskers
          </button>
        </Link>
      </div>

      {tasks.length === 0 && <p>You have not posted any tasks yet.</p>}

      {tasks.map((task) => (
        <div key={task.id} style={card}>
          <h3>{task.title}</h3>
          <p>{task.description}</p>

          <p>
            <strong>Budget:</strong> R{task.budget}
          </p>

          <p>
            <strong>Status:</strong>{" "}
            <span
              style={{
                color:
                  task.status === "assigned"
                    ? "orange"
                    : task.status === "completed"
                    ? "green"
                    : "gray"
              }}
            >
              {task.status}
            </span>
          </p>

          <div style={taskerBox}>
            <h4>Tasker Assigned</h4>
            {task.tasker ? (
              <>
                <p>
                  <strong>Name:</strong> {task.tasker.name || "N/A"}
                </p>
                <p>
                  <strong>Email:</strong> {task.tasker.email || "N/A"}
                </p>
              </>
            ) : (
              <p>No tasker assigned yet.</p>
            )}
          </div>

          {task.status === "completed" ? (
            <div style={ratingBox}>
              {task.userRating ? (
                <p>
                  <strong>Your Rating:</strong> {task.userRating} / 5
                </p>
              ) : (
                <>
                  <p style={{ margin: "0 0 8px 0" }}>
                    <strong>Rate this tasker:</strong>
                  </p>

                  <div style={ratingOptions}>
                    {[1, 2, 3, 4, 5].map((value) => (
                      <label key={value} style={ratingLabel}>
                        <input
                          type="radio"
                          name={`rating-${task.id}`}
                          value={value}
                          checked={ratingSelection[task.id] === value}
                          onChange={() =>
                            setRatingSelection((prev) => ({
                              ...prev,
                              [task.id]: value,
                            }))
                          }
                          disabled={ratingSubmitting[task.id]}
                        />
                        {value}
                      </label>
                    ))}
                  </div>

                  <button
                    style={ratingBtn}
                    disabled={!ratingSelection[task.id] || ratingSubmitting[task.id]}
                    onClick={() => handleSubmitRating(task.id)}
                  >
                    {ratingSubmitting[task.id] ? "Submitting..." : "Submit Rating"}
                  </button>
                </>
              )}
            </div>
          ) : (
            <p style={{ marginTop: "10px", color: "#555" }}>
              This task is not yet completed. Rating becomes available after completion.
            </p>
          )}

          {task.status === "completed" && (
            <div style={paymentBox}>
              {task.paid ? (
                <p style={{ color: "green", fontWeight: "bold" }}>
                  ✅ Payment completed
                </p>
              ) : (
                <>
                  <p style={{ margin: "0 0 8px 0" }}>
                    <strong>Pay Tasker:</strong> R{task.budget}
                  </p>
                  {!showPaymentForm[task.id] ? (
                    <button
                      style={paymentBtn}
                      onClick={() => togglePaymentForm(task.id)}
                    >
                      Pay Now
                    </button>
                  ) : (
                    <div>
                      <StripePayment
                        amount={parseFloat(task.budget)}
                        taskId={task.id}
                        onPaymentSuccess={() => handlePaymentSuccess(task.id)}
                        onPaymentError={handlePaymentError}
                      />
                      <button
                        style={cancelBtn}
                        onClick={() => togglePaymentForm(task.id)}
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
          {task.status === "assigned" && (
            <div style={paymentBox}>
              <p style={{ margin: "0 0 8px 0" }}>
                <strong>Payment pending:</strong> The task is assigned and will be paid when marked completed.
              </p>
            </div>
          )}

          {task.tasker && (
            <button style={chatBtn} onClick={() => navigate("/chats")}> 
              Chat with Tasker
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

export default UserDashboard;

/* ---------- Styles ---------- */

const container = {
  maxWidth: "900px",
  margin: "40px auto",
  padding: "20px",
  fontFamily: "Arial, sans-serif"
};

const card = {
  background: "#fff",
  padding: "20px",
  borderRadius: "10px",
  marginBottom: "20px",
  boxShadow: "0 6px 15px rgba(0,0,0,0.1)"
};

const postBtn = {
  backgroundColor: "#0984e3",
  color: "#fff",
  border: "none",
  padding: "12px 18px",
  borderRadius: "6px",
  cursor: "pointer",
  fontWeight: "bold"
};

const taskerBox = {
  marginTop: "15px",
  padding: "12px",
  borderRadius: "6px",
  backgroundColor: "#f1f2f6"
};

const ratingBox = {
  margin: "10px 0",
  padding: "12px",
  borderRadius: "8px",
  backgroundColor: "#fff",
  border: "1px solid #dfe6e9"
};

const ratingOptions = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
  marginBottom: "10px"
};

const ratingLabel = {
  display: "flex",
  alignItems: "center",
  gap: "6px",
  fontSize: "14px"
};

const ratingBtn = {
  backgroundColor: "#00b894",
  color: "#fff",
  border: "none",
  padding: "8px 14px",
  borderRadius: "6px",
  cursor: "pointer",
  fontWeight: "bold"
};

const chatBtn = {
  marginTop: "10px",
  backgroundColor: "#6c5ce7",
  color: "#fff",
  border: "none",
  padding: "10px 14px",
  borderRadius: "6px",
  cursor: "pointer",
  fontWeight: "bold"
};

const paymentBox = {
  margin: "10px 0",
  padding: "12px",
  borderRadius: "8px",
  backgroundColor: "#fff",
  border: "1px solid #dfe6e9"
};

const paymentBtn = {
  backgroundColor: "#e17055",
  color: "#fff",
  border: "none",
  padding: "8px 14px",
  borderRadius: "6px",
  cursor: "pointer",
  fontWeight: "bold"
};

const cancelBtn = {
  backgroundColor: "#6c757d",
  color: "#fff",
  border: "none",
  padding: "6px 12px",
  borderRadius: "4px",
  cursor: "pointer",
  fontSize: "14px",
  marginTop: "8px",
  marginLeft: "8px"
};
