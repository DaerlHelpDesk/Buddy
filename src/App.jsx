import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import UserSignup from "./pages/UserSignup";
import TaskerSignup from "./pages/TaskerSignup";
import UserDashboard from "./pages/UserDashboard";
import TaskerDashboard from "./pages/TaskerDashboard";
import TaskRequest from "./pages/TaskRequest";
import TaskerList from "./pages/TaskerList";
import MyTasks from "./pages/MyTasks";
import ChatList from "./pages/ChatList";
import ChatRoom from "./pages/ChatRoom";
import TaskerSearch from "./pages/TaskerSearch";



function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/user-signup" element={<UserSignup />} />
        <Route path="/tasker-signup" element={<TaskerSignup />} />
        <Route path="/user-dashboard" element={<UserDashboard />} />
        <Route path="/tasker-dashboard" element={<TaskerDashboard />} />
        <Route path="/task-request" element={<TaskRequest />} />
        <Route path="/tasker-list" element={<TaskerList />} />
        <Route path="/my-tasks" element={<MyTasks />} />
        <Route path="/chats" element={<ChatList />} />
        <Route path="/chat/:chatId" element={<ChatRoom />} />
        <Route path="/find-taskers" element={<TaskerSearch />} />
      </Routes>
    </Router>
  );
}

export default App;
