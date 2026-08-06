import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  collection,
  getDocs,
  query,
  where,
  addDoc,
  serverTimestamp
} from "firebase/firestore";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import RoleNav from "../components/RoleNav";

function TaskerSearch() {
  const [taskers, setTaskers] = useState([]);
  const [skillFilter, setSkillFilter] = useState("All");
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthReady(true);
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!authReady) return;

    const fetchTaskers = async () => {
      setLoading(true);
      setFetchError("");

      try {
        const snapshot = await getDocs(collection(db, "taskers"));

        const data = snapshot.docs.map(doc => {
          const taskerData = doc.data();
          return {
            id: doc.id,
            name: taskerData.name || "",
            email: taskerData.email || "",
            location: taskerData.location || "",
            skills: Array.isArray(taskerData.skills)
              ? taskerData.skills
              : typeof taskerData.skills === "string"
              ? taskerData.skills.split(",").map(s => s.trim()).filter(s => s)
              : [],
            bio: taskerData.bio || "",
            available: taskerData.available ?? true
          };
        });

        setTaskers(data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching taskers:", error);
        if (error.code === "permission-denied") {
          setFetchError(
            user
              ? "Permission denied. You are logged in, but Firestore rules still block reading taskers."
              : "Permission denied. Please login or update your Firestore rules to allow reading taskers."
          );
        } else {
          setFetchError("Unable to load taskers. Check your database or Firebase configuration.");
        }
        setLoading(false);
      }
    };

    fetchTaskers();
  }, [authReady, user]);

  const SKILL_OPTIONS = [
    "All",
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

  const filtered = taskers.filter((tasker) => {
    const matchesSkill =
      skillFilter === "All" ||
      tasker.skills?.some((skill) => skill.toLowerCase() === skillFilter.toLowerCase());

    const matchesAvailability = !onlyAvailable || tasker.available;
    return matchesSkill && matchesAvailability;
  });

  const openChatWithTasker = async (taskerId) => {
    if (!user) {
      return alert("Please login to message a tasker.");
    }

    try {
      const chatQuery = query(
        collection(db, "chats"),
        where("participants", "array-contains", user.uid)
      );
      const snapshot = await getDocs(chatQuery);

      const existing = snapshot.docs.find((docSnap) => {
        const chatData = docSnap.data();
        return (
          Array.isArray(chatData.participants) &&
          chatData.participants.includes(taskerId) &&
          !chatData.taskId
        );
      });

      if (existing) {
        navigate(`/chat/${existing.id}`);
        return;
      }

      const newChatRef = await addDoc(collection(db, "chats"), {
        participants: [user.uid, taskerId],
        userId: user.uid,
        taskerId,
        lastMessage: "",
        lastMessageAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        messages: []
      });

      navigate(`/chat/${newChatRef.id}`);
    } catch (error) {
      console.error("Failed to open chat:", error);
      alert("Unable to start chat. Please try again.");
    }
  };

  const requestTasker = (tasker) => {
    if (!user) {
      return alert("Please login to request a tasker.");
    }

    navigate("/task-request", { state: { selectedTasker: tasker } });
  };

  return (
    <div style={container}>
      <RoleNav title="Find Taskers" subtitle="Search for trusted help" backTo="/user-dashboard" />
      <h2>Find Taskers</h2>

      <div style={{ marginBottom: 12, display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 220px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>
            Filter by skill
          </label>
          <select
            value={skillFilter}
            onChange={(e) => setSkillFilter(e.target.value)}
            style={{ ...input, width: '100%', padding: '12px' }}
          >
            {SKILL_OPTIONS.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>

        <label style={filterLabel}>
          <input
            type="checkbox"
            checked={onlyAvailable}
            onChange={(e) => setOnlyAvailable(e.target.checked)}
          />
          <span style={{ marginLeft: 8 }}>Show only available taskers</span>
        </label>

        {!loading && !fetchError && taskers.length > 0 && (
          <div style={{ color: '#555', fontSize: 14 }}>
            {`Showing ${filtered.length} of ${taskers.length} tasker(s)`}
          </div>
        )}
      </div>

      {loading ? (
        <p>Loading taskers...</p>
      ) : fetchError ? (
        <div style={{ color: '#d63031', fontWeight: 'bold' }}>
          <p>{fetchError}</p>
          {fetchError.includes('Please login') && (
            <p>
              <Link to="/" style={{ color: '#0984e3', textDecoration: 'underline' }}>
                Login here
              </Link>
            </p>
          )}
        </div>
      ) : taskers.length === 0 ? (
        <p>No taskers are registered yet. Ask taskers to sign up first.</p>
      ) : filtered.length === 0 ? (
        <p>No taskers match your search. Try a broader term or turn off availability filtering.</p>
      ) : null}

      {filtered.map(tasker => (
        <div key={tasker.id} style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0 }}>{tasker.name}</h3>
              <p style={{ color: '#666', margin: '4px 0 0' }}>{tasker.location}</p>
            </div>
            <span style={taskerStatus(tasker.available)}>{tasker.available ? 'Available' : 'Offline'}</span>
          </div>

          <p>
            <strong>Skills:</strong>{" "}
            {tasker.skills?.join(", ")}
          </p>

          <p>{tasker.bio}</p>

          <div style={cardActions}>
            <button style={actionBtn} onClick={() => requestTasker(tasker)}>
              Request this Tasker
            </button>
            <button style={messageBtn} onClick={() => openChatWithTasker(tasker.id)}>
              Message Tasker
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default TaskerSearch;

/* ---------- Styles ---------- */

const container = {
  maxWidth: "800px",
  margin: "40px auto",
  padding: "20px"
};

const input = {
  width: "100%",
  padding: "12px",
  marginBottom: "20px",
  borderRadius: "6px",
  border: "1px solid #ccc"
};

const card = {
  background: "#fff",
  padding: "15px",
  borderRadius: "10px",
  marginBottom: "15px",
  boxShadow: "0 4px 10px rgba(0,0,0,0.1)"
};

const filterLabel = {
  display: 'inline-flex',
  alignItems: 'center',
  marginBottom: 20,
  fontSize: 14,
  color: '#444'
};

const taskerStatus = (available) => ({
  backgroundColor: available ? '#dff5e5' : '#f0f0f0',
  color: available ? '#2d8a3a' : '#777',
  padding: '6px 10px',
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 700
});

const cardActions = {
  display: 'flex',
  gap: '10px',
  marginTop: '14px'
};

const actionBtn = {
  backgroundColor: '#0984e3',
  color: '#fff',
  border: 'none',
  padding: '10px 14px',
  borderRadius: 8,
  cursor: 'pointer'
};

const messageBtn = {
  backgroundColor: '#6c5ce7',
  color: '#fff',
  border: 'none',
  padding: '10px 14px',
  borderRadius: 8,
  cursor: 'pointer'
};