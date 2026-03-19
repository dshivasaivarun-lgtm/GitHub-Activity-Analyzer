export default function ContributorLeaderboard({ contributors }) {
  if (!contributors?.length) return null
  const medals = ['🥇','🥈','🥉']
  return (
    <div className="bg-gray-800 rounded-xl p-6">
      <h2 className="text-lg font-semibold mb-4">Top Contributors</h2>
      <div className="space-y-3">
        {contributors.slice(0, 8).map((c, i) => (
          <div key={c.login} className="flex items-center gap-3">
            <span className="text-lg w-6 text-center">{medals[i] || `${i+1}`}</span>
            <img src={c.avatar_url} alt={c.login} className="w-7 h-7 rounded-full"/>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{c.login}</div>
              <div className="w-full bg-gray-700 rounded-full h-1 mt-1">
                <div className="h-1 rounded-full bg-blue-500" style={{ width: `${c.percentage}%` }}/>
              </div>
            </div>
            <div className="text-gray-400 text-xs w-16 text-right">{c.contributions} commits</div>
          </div>
        ))}
      </div>
    </div>
  )
}
