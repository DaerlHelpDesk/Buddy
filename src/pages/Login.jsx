import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate, Link } from "react-router-dom";
import logo from "../assets/logo.png";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      const uid = userCred.user.uid;

      // Check roles
      const taskerSnap = await getDoc(doc(db, "taskers", uid));
      if (taskerSnap.exists()) navigate("/tasker-dashboard");

      const userSnap = await getDoc(doc(db, "users", uid));
      if (userSnap.exists()) navigate("/user-dashboard");

      if (!taskerSnap.exists() && !userSnap.exists())
        alert("Account exists but no role found");
    } catch {
      alert("Login failed. You may need to sign up.");
    }
  };

  const pageStyle = {
    minHeight: "100vh",
    padding: "40px 20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "transparent",
  };

  const containerStyle = {
    width: "100%",
    maxWidth: "460px",
    padding: "42px 36px",
    borderRadius: "32px",
    boxShadow: "0 30px 80px rgba(0, 0, 0, 0.25)",
    background: "rgba(255, 255, 255, 0.95)",
    border: "1px solid rgba(255, 255, 255, 0.5)",
    backdropFilter: "blur(18px)",
    textAlign: "center",
    fontFamily: "Inter, system-ui, sans-serif",
  };

  const titleStyle = {
    marginBottom: "8px",
    fontSize: "2rem",
    color: "#172b4d",
  };

  const subtitleStyle = {
    marginBottom: "28px",
    color: "#5f6c8d",
    fontSize: "0.96rem",
    lineHeight: 1.6,
  };

  const inputStyle = {
    width: "100%",
    padding: "16px 18px",
    marginBottom: "18px",
    borderRadius: "16px",
    border: "1px solid rgba(16, 24, 40, 0.12)",
    backgroundColor: "#f7f8ff",
    fontSize: "1rem",
    color: "#1f2937",
    outline: "none",
  };

  const buttonStyle = {
    width: "100%",
    padding: "16px",
    borderRadius: "16px",
    border: "none",
    backgroundImage: "linear-gradient(135deg, #6d5dfc 0%, #00b894 100%)",
    color: "#fff",
    fontSize: "1rem",
    fontWeight: "700",
    cursor: "pointer",
    boxShadow: "0 18px 30px rgba(44, 151, 255, 0.25)",
    transition: "transform 180ms ease, box-shadow 180ms ease",
  };

  const signupButtonStyle = {
    ...buttonStyle,
    backgroundImage: "linear-gradient(135deg, #ff6b8a 0%, #f7b42c 100%)",
    boxShadow: "0 18px 30px rgba(255, 107, 138, 0.2)",
  };

  const buttonGroupStyle = {
    display: "grid",
    gap: "14px",
    marginTop: "18px",
  };

  const linkTextStyle = {
    color: "#5f6c8d",
    fontSize: "0.95rem",
    marginTop: "22px",
  };

  return (
    <div style={pageStyle}>
      <div style={containerStyle}>
        <div style={{ marginBottom: "24px" }}>
          <div
            style={{
              width: "90px",
              height: "90px",
              margin: "0 auto 18px",
              borderRadius: "24px",
              overflow: "hidden",
              background: "#fff",
              display: "grid",
              placeItems: "center",
              boxShadow: "0 14px 30px rgba(15, 23, 42, 0.12)",
            }}
          >
            <img src={logo} alt="App logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
          <h2 style={titleStyle}>Welcome back</h2>
          <p style={subtitleStyle}>
            Sign in to manage your tasks, connect with taskers, and get things done faster.
          </p>
        </div>

        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
            required
          />
          <button type="submit" style={buttonStyle}>
            Login
          </button>
        </form>

        <p style={linkTextStyle}>Don’t have an account yet? Create one below.</p>

        <div style={buttonGroupStyle}>
          <Link to="/user-signup">
            <button type="button" style={signupButtonStyle}>
              Sign up as User
            </button>
          </Link>
          <Link to="/tasker-signup">
            <button type="button" style={signupButtonStyle}>
              Sign up as Tasker
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Login;
