export default function PatternCard({ patterns }) {
  if (!patterns || !Object.keys(patterns).length) return null
  const items = [
    { label: 'Coding Style', value: patterns.peak_time },
    { label: 'Avg commit hour', value: `${patterns.avg_commit_hour}:00` },
    { label: 'Weekday commits', value: patterns.weekday_commits },
    { label: 'Weekend commits', value: `${patterns.weekend_commits} (${patterns.weekend_ratio}%)` },
  ]
  return (
    <div className="bg-gray-800 rounded-xl p-6">
      <h2 className="text-lg font-semibold mb-4">Commit Patterns</h2>
      <div className="grid grid-cols-2 gap-4">
        {items.map(({ label, value }) => (
          <div key={label} className="bg-gray-700/50 rounded-lg p-3">
            <div className="text-gray-400 text-xs mb-1">{label}</div>
            <div className="text-white text-sm font-medium capitalize">{value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
