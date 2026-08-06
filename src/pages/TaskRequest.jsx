import { useState } from "react";
import { db, auth } from "../firebase";
import { collection, addDoc } from "firebase/firestore";
import { useNavigate, useLocation } from "react-router-dom";
import RoleNav from "../components/RoleNav";

function TaskRequest() {
  const navigate = useNavigate();
  const location = useLocation();
  const selectedTasker = location.state?.selectedTasker || null;
  const [title, setTitle] = useState(selectedTasker ? `Request ${selectedTasker.name}` : "");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");
  const [category, setCategory] = useState(selectedTasker?.skills?.[0] || "General");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !description || !budget) return alert("Please fill all fields");

    try {
      await addDoc(collection(db, "tasks"), {
        title,
        description,
        budget,
        category,
        status: "open",
        userId: auth.currentUser.uid,
        userName: auth.currentUser?.displayName || auth.currentUser?.email || "",
        userEmail: auth.currentUser?.email || "",
        taskerId: selectedTasker?.id || null,
        taskerName: selectedTasker?.name || "",
        taskerEmail: selectedTasker?.email || "",
        taskerSkills: selectedTasker?.skills || [],
        paid: false,
        paymentMethod: "Stripe",
        createdAt: new Date()
      });
      alert("Task posted successfully!");
      navigate("/user-dashboard");
    } catch (error) {
      console.error("Error adding task:", error);
      alert("Failed to post task.");
    }
  };

  const containerStyle = {
    minHeight: "100vh",
    padding: "24px",
    background: "linear-gradient(135deg, #f8fbff 0%, #eef4ff 100%)",
    fontFamily: "Inter, Arial, sans-serif",
  };

  const cardStyle = {
    maxWidth: "700px",
    margin: "0 auto",
    background: "#fff",
    borderRadius: "24px",
    padding: "24px",
    boxShadow: "0 20px 45px rgba(15, 23, 42, 0.08)",
  };

  const inputStyle = {
    width: "100%",
    padding: "12px 14px",
    margin: "10px 0",
    borderRadius: "12px",
    border: "1px solid #dbeafe",
    fontSize: "15px",
    outline: "none",
    boxSizing: "border-box",
  };

  const sectionCard = {
    margin: "14px 0",
    padding: "14px",
    borderRadius: "16px",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    textAlign: "left",
  };

  const buttonStyle = {
    width: "100%",
    padding: "12px 18px",
    borderRadius: "999px",
    border: "none",
    background: "linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)",
    color: "#fff",
    fontSize: "16px",
    fontWeight: "700",
    cursor: "pointer",
    marginTop: "12px",
  };

  const chipRow = {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginTop: "8px",
  };

  const chip = {
    padding: "8px 10px",
    borderRadius: "999px",
    background: "#eef2ff",
    color: "#4338ca",
    fontSize: "12px",
    fontWeight: 700,
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <RoleNav title="Post a Task" subtitle="Share exactly what you need help with" backTo="/user-dashboard" />
        <h2 style={{ marginTop: 0 }}>Create a new request</h2>
        <p style={{ marginTop: 0, color: "#64748b" }}>
          Add the details below so the right tasker can respond quickly.
        </p>

        <form onSubmit={handleSubmit}>
          <div style={sectionCard}>
            <label style={{ fontWeight: 700, display: "block", marginBottom: "6px" }}>Task title</label>
            <input
              type="text"
              placeholder="Example: Fix leaking tap"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={inputStyle}
              required
            />
          </div>

          <div style={sectionCard}>
            <label style={{ fontWeight: 700, display: "block", marginBottom: "6px" }}>What do you need done?</label>
            <textarea
              placeholder="Describe the job, timing, and any important details"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ ...inputStyle, height: "120px", resize: "vertical" }}
              required
            />
          </div>

          <div style={sectionCard}>
            <label style={{ fontWeight: 700, display: "block", marginBottom: "6px" }}>Budget</label>
            <input
              type="number"
              placeholder="Budget (R)"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              style={inputStyle}
              required
            />
          </div>

          <div style={sectionCard}>
            <label style={{ fontWeight: 700, display: "block", marginBottom: "6px" }}>Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={inputStyle}
            >
              {['General', 'Plumbing', 'Electrical', 'Cleaning', 'Carpentry', 'Painting', 'Gardening', 'Delivery', 'Moving', 'Handyman', 'IT Support'].map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            <div style={chipRow}>
              <span style={chip}>Fast matching</span>
              <span style={chip}>Real-time updates</span>
              <span style={chip}>Secure payment ready</span>
            </div>
          </div>

          {selectedTasker && (
            <div style={sectionCard}>
              <p style={{ margin: 0, fontWeight: 700 }}>Requesting:</p>
              <p style={{ margin: "6px 0 0" }}>{selectedTasker.name}</p>
              <p style={{ margin: "4px 0 0", color: "#64748b" }}>{selectedTasker.skills?.join(", ")}</p>
            </div>
          )}

          <button type="submit" style={buttonStyle}>
            Post Task
          </button>
        </form>
      </div>
    </div>
  );
}

export default TaskRequest;
