import { Link } from 'react-router-dom'

export default function Navbar() {
  return (
    <nav style={{ padding: 15, background: '#16a34a', color: '#fff' }}>
      <Link to="/" style={{ marginRight: 15, color: '#fff' }}>Home</Link>
      <Link to="/browse" style={{ marginRight: 15, color: '#fff' }}>Browse Taskers</Link>
      <Link to="/post-task" style={{ marginRight: 15, color: '#fff' }}>Post Task</Link>
      <Link to="/tasker-signup" style={{ color: '#fff' }}>Become a Tasker</Link>
    </nav>
  )
}
