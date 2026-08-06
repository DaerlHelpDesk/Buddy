export default function TaskerDashboard() {
  return (
    <div style={{ padding: 20 }}>
      <h2>Tasker Dashboard</h2>

      <p>Welcome! Here you will see task requests.</p>

      <div style={{ marginTop: 20 }}>
        <h3>Incoming Requests</h3>

        <div style={{ border: '1px solid #ccc', padding: 10 }}>
          <p><strong>Task:</strong> Fix leaking tap</p>
          <p><strong>Location:</strong> Kimberley</p>
          <button>Accept</button>
          <button style={{ marginLeft: 10 }}>Decline</button>
        </div>
      </div>
    </div>
  )
}
