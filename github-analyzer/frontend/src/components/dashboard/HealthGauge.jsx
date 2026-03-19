const COLORS = { Excellent: '#10b981', Good: '#3b82f6', Fair: '#f59e0b', 'Needs Work': '#ef4444' }

export default function HealthGauge({ data }) {
  if (!data) return null
  const { total, max, label, breakdown } = data
  const pct = Math.round((total / max) * 100)
  const color = COLORS[label] || '#6b7280'
  return (
    <div className="bg-gray-800 rounded-xl p-6">
      <h2 className="text-lg font-semibold mb-4">Repo Health Score</h2>
      <div className="flex items-center gap-6 mb-4">
        <div className="relative w-24 h-24 flex-shrink-0">
          <svg viewBox="0 0 36 36" className="w-24 h-24 -rotate-90">
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="#374151" strokeWidth="3.5"/>
            <circle cx="18" cy="18" r="15.9" fill="none" stroke={color} strokeWidth="3.5"
              strokeDasharray={`${pct} 100`} strokeLinecap="round"/>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold" style={{ color }}>{total}</span>
          </div>
        </div>
        <div>
          <div className="text-2xl font-bold" style={{ color }}>{label}</div>
          <div className="text-gray-400 text-sm">{total} / {max} points</div>
        </div>
      </div>
      <div className="space-y-2">
        {Object.entries(breakdown).map(([key, val]) => (
          <div key={key} className="flex items-center gap-2 text-sm">
            <div className="w-32 text-gray-400 capitalize">{key.replace(/_/g, ' ')}</div>
            <div className="flex-1 bg-gray-700 rounded-full h-1.5">
              <div className="h-1.5 rounded-full bg-blue-500" style={{ width: `${(val.score / val.max) * 100}%` }}/>
            </div>
            <div className="text-gray-300 w-12 text-right">{val.score}/{val.max}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
