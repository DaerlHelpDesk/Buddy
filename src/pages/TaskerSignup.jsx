import { useState } from "react";
import { auth, db } from "../firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

const SKILL_OPTIONS = [
  "Plumbing",
  "Electrical",
  "Cleaning",
  "Carpentry",
  "Painting",
  "Gardening",
  "Delivery",
  "Moving",
  "Handyman",
  "IT Support"
];

function TaskerSignup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [skills, setSkills] = useState([]);
  const [bio, setBio] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Validation
    if (!name.trim()) {
      setError("❌ Name is required");
      setLoading(false);
      return;
    }
    if (!email.trim()) {
      setError("❌ Email is required");
      setLoading(false);
      return;
    }
    if (!password || password.length < 6) {
      setError("❌ Password must be at least 6 characters");
      setLoading(false);
      return;
    }
    if (!location.trim()) {
      setError("❌ Location is required");
      setLoading(false);
      return;
    }
    if (skills.length === 0) {
      setError("❌ Select at least one skill");
      setLoading(false);
      return;
    }

    try {
      console.log("📝 Creating user with:", { name, email, password: "***", skills });
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      console.log("✅ User created:", userCred.user.uid);

      console.log("💾 Saving tasker profile...");
      await setDoc(doc(db, "taskers", userCred.user.uid), {
        name,
        email,
        location,
        bio,
        skills,
        available: true,
        createdAt: new Date()
      });
      console.log("✅ Tasker profile saved!");

      alert("✅ Signup successful!");
      navigate("/tasker-dashboard");
    } catch (err) {
      console.error("❌ Signup error:", err.code, err.message);
      const errorMessages = {
        "auth/email-already-in-use": "This email is already registered",
        "auth/invalid-email": "Invalid email format",
        "auth/weak-password": "Password is too weak (min 6 characters)",
        "auth/network-request-failed": "Network error - check your connection",
        "permission-denied": "You don't have permission to sign up (firestore rules)"
      };
      const message = errorMessages[err.code] || err.message || "Signup failed";
      setError(`❌ ${message}`);
    } finally {
      setLoading(false);
    }
  };

  const containerStyle = {
    maxWidth: "400px",
    margin: "60px auto",
    padding: "40px",
    borderRadius: "12px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
    backgroundColor: "#fff",
    textAlign: "center",
    fontFamily: "Arial, sans-serif",
  };

  const inputStyle = {
    width: "100%",
    padding: "12px",
    marginBottom: "15px",
    borderRadius: "6px",
    border: "1px solid #ccc",
    fontSize: "16px",
  };

  const buttonStyle = {
    width: "100%",
    padding: "12px",
    borderRadius: "6px",
    border: "none",
    backgroundColor: "#0984e3",
    color: "#fff",
    fontSize: "16px",
    fontWeight: "bold",
    cursor: "pointer",
  };

  return (
    <div style={containerStyle}>
      <h2>Tasker Signup</h2>
      {error && (
        <div style={{
          padding: "12px",
          marginBottom: "15px",
          background: "#ffe0e0",
          border: "1px solid #ff6b6b",
          borderRadius: "6px",
          color: "#c92a2a",
          fontSize: "14px"
        }}>
          {error}
        </div>
      )}
      <form onSubmit={handleSignup}>
        <input
          type="text"
          placeholder="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={inputStyle}
          disabled={loading}
          required
        />
        <input
          type="text"
          placeholder="Location (city or area)"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          style={inputStyle}
          disabled={loading}
          required
        />
        <div style={{ marginBottom: '16px', textAlign: 'left' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>
            Select your skills
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {SKILL_OPTIONS.map((skillOption) => (
              <label key={skillOption} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  checked={skills.includes(skillOption)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSkills((prev) => [...prev, skillOption]);
                    } else {
                      setSkills((prev) => prev.filter((item) => item !== skillOption));
                    }
                  }}
                  disabled={loading}
                />
                {skillOption}
              </label>
            ))}
          </div>
        </div>
        <textarea
          placeholder="Short bio or experience"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          style={{ ...inputStyle, minHeight: '100px' }}
          disabled={loading}
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={inputStyle}
          disabled={loading}
          required
        />
        <input
          type="password"
          placeholder="Password (min 6 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={inputStyle}
          disabled={loading}
          required
        />
        <button type="submit" style={{ ...buttonStyle, opacity: loading ? 0.6 : 1, cursor: loading ? "not-allowed" : "pointer" }} disabled={loading}>
          {loading ? "⏳ Signing up..." : "Sign Up"}
        </button>
      </form>
    </div>
  );
}

export default TaskerSignup;
