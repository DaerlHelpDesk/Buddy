import { useState } from "react";
import { auth, db } from "../firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

function UserSignup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
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

    try {
      console.log("📝 Creating user with:", { name, email, password: "***" });
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      console.log("✅ User created:", userCred.user.uid);

      console.log("💾 Saving user profile...");
      await setDoc(doc(db, "users", userCred.user.uid), { name, email });
      console.log("✅ User profile saved!");

      alert("✅ Signup successful!");
      navigate("/user-dashboard");
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
    backgroundColor: "#00b894",
    color: "#fff",
    fontSize: "16px",
    fontWeight: "bold",
    cursor: "pointer",
  };

  return (
    <div style={containerStyle}>
      <h2>User Signup</h2>
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

export default UserSignup;
