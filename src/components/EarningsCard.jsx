import React, { useMemo, useState } from 'react';

function groupByWeek(tasks) {
  // return last 4 weeks sums
  const now = new Date();
  const weeks = [];
  for (let i = 0; i < 4; i++) {
    const end = new Date(now);
    end.setDate(now.getDate() - i * 7);
    const start = new Date(end);
    start.setDate(end.getDate() - 6);
    weeks.push({ start, end, label: `W-${i + 1}`, sum: 0 });
  }

  tasks.forEach((t) => {
    if (!t.paid || !t.completedAt) return;
    const d = t.completedAt.toDate ? t.completedAt.toDate() : new Date(t.completedAt);
    for (let w of weeks) {
      if (d >= w.start && d <= w.end) {
        w.sum += parseFloat(t.budget) || 0;
        break;
      }
    }
  });

  return weeks.reverse();
}

export default function EarningsCard({ tasks }) {
  const [mode, setMode] = useState('weekly');

  const paidTasks = tasks.filter((t) => t.paid && t.completedAt);

  const total = paidTasks.reduce((s, t) => s + (parseFloat(t.budget) || 0), 0);

  const weekly = useMemo(() => groupByWeek(tasks), [tasks]);

  return (
    <div style={card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0 }}>Earnings</h3>
        <div>
          <button style={tab(mode === 'weekly')} onClick={() => setMode('weekly')}>Weekly</button>
          <button style={tab(mode === 'monthly')} onClick={() => setMode('monthly')}>Monthly</button>
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <div style={{ fontSize: 20, fontWeight: 'bold' }}>R{total.toFixed(2)}</div>
        <div style={{ color: '#777', fontSize: 13 }}>Total paid earnings</div>
      </div>

      {mode === 'weekly' && (
        <div style={{ marginTop: 16 }}>
          <SmallBarChart data={weekly.map((w) => w.sum)} labels={weekly.map((w) => w.label)} />
        </div>
      )}
    </div>
  );
}

function SmallBarChart({ data = [], labels = [] }) {
  const max = Math.max(...data, 1);
  return (
    <svg width="100%" height="60" viewBox={`0 0 ${data.length * 30} 60`} preserveAspectRatio="none">
      {data.map((v, i) => {
        const h = (v / max) * 48 + 4;
        return (
          <g key={i}>
            <rect x={i * 30 + 6} y={60 - h} width={18} height={h} fill="#0984e3" rx={3} />
            <text x={i * 30 + 15} y={58} fontSize={10} fill="#333" textAnchor="middle">{labels[i]}</text>
          </g>
        );
      })}
    </svg>
  );
}

const card = {
  background: '#fff',
  padding: 18,
  borderRadius: 10,
  boxShadow: '0 6px 18px rgba(15,15,15,0.06)',
  gridColumn: '1 / 2'
};

const tab = (active) => ({
  background: active ? '#0984e3' : 'transparent',
  color: active ? '#fff' : '#0984e3',
  border: '1px solid #0984e3',
  padding: '6px 10px',
  marginLeft: 6,
  borderRadius: 6,
  cursor: 'pointer'
});
