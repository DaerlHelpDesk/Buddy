import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";

function RoleNav({ title, subtitle, backTo = "/", showBack = true }) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(backTo);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (error) {
      console.error("Logout failed", error);
      alert("Could not sign out. Please try again.");
    }
  };

  return (
    <div style={navBar}>
      <div style={navLeft}>
        {showBack && (
          <button type="button" style={backBtn} onClick={handleBack}>
            ← Back
          </button>
        )}
        <div>
          <div style={titleStyle}>{title}</div>
          {subtitle ? <div style={subtitleStyle}>{subtitle}</div> : null}
        </div>
      </div>

      <button type="button" style={logoutBtn} onClick={handleLogout}>
        Logout
      </button>
    </div>
  );
}

export default RoleNav;

const navBar = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "12px",
  marginBottom: "18px",
  padding: "12px 16px",
  borderRadius: "16px",
  background: "linear-gradient(135deg, #eef2ff 0%, #f8fafc 100%)",
  border: "1px solid #e2e8f0"
};

const navLeft = {
  display: "flex",
  alignItems: "center",
  gap: "10px"
};

const titleStyle = {
  fontSize: "18px",
  fontWeight: 700,
  color: "#0f172a"
};

const subtitleStyle = {
  fontSize: "13px",
  color: "#64748b"
};

const backBtn = {
  border: "1px solid #cbd5e1",
  background: "#fff",
  color: "#334155",
  borderRadius: "999px",
  padding: "8px 12px",
  cursor: "pointer",
  fontWeight: 600
};

const logoutBtn = {
  border: "none",
  background: "linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)",
  color: "#fff",
  borderRadius: "999px",
  padding: "8px 12px",
  cursor: "pointer",
  fontWeight: 700
};
