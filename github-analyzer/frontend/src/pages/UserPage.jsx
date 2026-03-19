import { useState } from 'react'
import axios from 'axios'

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

const HEALTH_COLOR = score =>
  score >= 80 ? '#10b981' : score >= 60 ? '#3b82f6' : score >= 40 ? '#f59e0b' : '#ef4444'

function HealthRing({ score, size = 48 }) {
  const r = 18, c = 2 * Math.PI * r
  const pct = (score / 100) * c
  const color = HEALTH_COLOR(score)
  return (
    <svg width={size} height={size} viewBox="0 0 44 44">
      <circle cx="22" cy="22" r={r} fill="none" stroke="#374151" strokeWidth="3.5"/>
      <circle cx="22" cy="22" r={r} fill="none" stroke={color} strokeWidth="3.5"
        strokeDasharray={`${pct} ${c}`} strokeLinecap="round"
        transform="rotate(-90 22 22)"/>
      <text x="22" y="26" textAnchor="middle" fontSize="10" fontWeight="500" fill={color}>{score}</text>
    </svg>
  )
}

function StatCard({ label, value, sub }) {
  return (
    <div className="bg-gray-800 rounded-xl p-4 text-center">
      <div className="text-2xl font-bold text-white">{value ?? '—'}</div>
      <div className="text-gray-400 text-xs mt-1">{label}</div>
      {sub && <div className="text-gray-500 text-xs mt-0.5">{sub}</div>}
    </div>
  )
}

function RepoCard({ repo, onClick }) {
  if (repo.error) return (
    <div className="bg-gray-800 rounded-xl p-4 border border-red-900/40 opacity-60">
      <div className="font-medium text-sm text-gray-300">{repo.name}</div>
      <div className="text-xs text-red-400 mt-1">{repo.error}</div>
    </div>
  )
  const h = repo.health
  const color = HEALTH_COLOR(h?.total ?? 0)
  return (
    <div className="bg-gray-800 rounded-xl p-4 hover:bg-gray-750 cursor-pointer transition-colors border border-transparent hover:border-gray-600"
      onClick={() => onClick(repo.full_name)}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0">
          <div className="font-medium text-sm text-white truncate">{repo.name}</div>
          {repo.description && (
            <div className="text-gray-400 text-xs mt-0.5 line-clamp-2">{repo.description}</div>
          )}
        </div>
        <HealthRing score={h?.total ?? 0} />
      </div>
      <div className="flex items-center gap-3 text-xs text-gray-500 mt-3">
        {repo.language && (
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-400 inline-block"/>
            {repo.language}
          </span>
        )}
        <span>★ {repo.stars?.toLocaleString()}</span>
        <span>{repo.total_commits} commits</span>
        <span className="ml-auto font-medium" style={{ color }}>{h?.label}</span>
      </div>
    </div>
  )
}

export default function UserPage({ onAnalyzeRepo }) {
  const [username, setUsername] = useState('')
  const [limit, setLimit]       = useState(10)
  const [skipForks, setSkipForks] = useState(true)
  const [data, setData]         = useState(null)
  const [phase, setPhase]       = useState('idle') // idle | listing | analyzing | done
  const [error, setError]       = useState('')
  const [filter, setFilter]     = useState('')
  const [sortBy, setSortBy]     = useState('health')

  async function fetchUser() {
    if (!username.trim()) return
    setPhase('analyzing')
    setError('')
    setData(null)
    try {
      const res = await axios.get(`${API}/api/user/analyze-all`, {
        params: { username: username.trim(), limit, skip_forks: skipForks },
      })
      setData(res.data)
      setPhase('done')
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to fetch user data')
      setPhase('idle')
    }
  }

  const sortedRepos = () => {
    if (!data?.repos) return []
    let repos = data.repos.filter(r =>
      !filter || r.name.toLowerCase().includes(filter.toLowerCase())
    )
    if (sortBy === 'health')   repos = [...repos].sort((a,b) => (b.health?.total??0) - (a.health?.total??0))
    if (sortBy === 'stars')    repos = [...repos].sort((a,b) => (b.stars??0) - (a.stars??0))
    if (sortBy === 'commits')  repos = [...repos].sort((a,b) => (b.total_commits??0) - (a.total_commits??0))
    if (sortBy === 'recent')   repos = [...repos].sort((a,b) => new Date(b.pushed_at||0) - new Date(a.pushed_at||0))
    return repos
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold mb-2">User Analysis</h1>
      <p className="text-gray-400 text-sm mb-6">Enter a GitHub username to analyze all their public repos at once.</p>

      {/* Input row */}
      <div className="flex gap-3 mb-4">
        <input
          className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white
            placeholder-gray-500 focus:outline-none focus:border-blue-500"
          placeholder="GitHub username (e.g. torvalds)"
          value={username}
          onChange={e => setUsername(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && fetchUser()}
        />
        <button onClick={fetchUser} disabled={phase === 'analyzing'}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-6 py-3 rounded-lg font-medium transition-colors whitespace-nowrap">
          {phase === 'analyzing' ? 'Analyzing…' : 'Analyze User'}
        </button>
      </div>

      {/* Options */}
      <div className="flex items-center gap-6 mb-6 text-sm text-gray-400">
        <label className="flex items-center gap-2 cursor-pointer">
          <span>Repos to analyze:</span>
          <select value={limit} onChange={e => setLimit(+e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-sm">
            {[5, 10, 15, 20].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={skipForks} onChange={e => setSkipForks(e.target.checked)}
            className="accent-blue-500"/>
          <span>Skip forked repos</span>
        </label>
      </div>

      {error && (
        <div className="bg-red-900/40 border border-red-700 text-red-300 px-4 py-3 rounded-lg mb-6">{error}</div>
      )}

      {phase === 'analyzing' && (
        <div className="space-y-3">
          <div className="h-24 bg-gray-800 rounded-xl animate-pulse"/>
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_,i) => <div key={i} className="h-20 bg-gray-800 rounded-xl animate-pulse"/>)}
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {[...Array(6)].map((_,i) => <div key={i} className="h-28 bg-gray-800 rounded-xl animate-pulse"/>)}
          </div>
        </div>
      )}

      {data && phase === 'done' && (
        <>
          {/* User profile card */}
          <div className="bg-gray-800 rounded-xl p-5 mb-6 flex items-center gap-5">
            <img src={data.user.avatar_url} alt={data.user.login}
              className="w-16 h-16 rounded-full flex-shrink-0"/>
            <div className="min-w-0">
              <div className="text-lg font-bold text-white">{data.user.name || data.user.login}</div>
              <div className="text-gray-400 text-sm">@{data.user.login}</div>
              {data.user.bio && <div className="text-gray-400 text-sm mt-1 truncate">{data.user.bio}</div>}
            </div>
            <div className="ml-auto flex gap-4 text-center flex-shrink-0">
              <div>
                <div className="text-xl font-bold text-white">{data.user.public_repos}</div>
                <div className="text-xs text-gray-500">repos</div>
              </div>
              <div>
                <div className="text-xl font-bold text-white">{data.user.followers?.toLocaleString()}</div>
                <div className="text-xs text-gray-500">followers</div>
              </div>
            </div>
          </div>

          {/* Summary stat cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <StatCard label="Repos analyzed"   value={data.summary.repos_analyzed} />
            <StatCard label="Avg health score" value={data.summary.avg_health_score} />
            <StatCard label="Total stars"      value={data.summary.total_stars?.toLocaleString()} />
            <StatCard label="Total commits"    value={data.summary.total_commits?.toLocaleString()} />
            <StatCard label="Top language"     value={data.summary.top_language || '—'} />
          </div>

          {/* Language distribution */}
          {data.summary.language_distribution?.length > 0 && (
            <div className="bg-gray-800 rounded-xl p-5 mb-6">
              <div className="text-sm font-medium mb-3">Language distribution</div>
              <div className="flex flex-wrap gap-2">
                {data.summary.language_distribution.map(({ language, count }) => (
                  <span key={language}
                    className="bg-gray-700 px-3 py-1 rounded-full text-xs text-gray-300">
                    {language} <span className="text-gray-500 ml-1">{count}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Repo list with filter + sort */}
          <div className="flex gap-3 mb-4">
            <input
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm
                text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              placeholder="Filter repos by name…"
              value={filter}
              onChange={e => setFilter(e.target.value)}
            />
            <select value={sortBy} onChange={e => setSortBy(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white">
              <option value="health">Sort: Health</option>
              <option value="stars">Sort: Stars</option>
              <option value="commits">Sort: Commits</option>
              <option value="recent">Sort: Recent</option>
            </select>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {sortedRepos().map(repo => (
              <RepoCard
                key={repo.name}
                repo={repo}
                onClick={fullName => onAnalyzeRepo && onAnalyzeRepo(fullName)}
              />
            ))}
          </div>

          {sortedRepos().length === 0 && (
            <div className="text-center text-gray-500 py-10">No repos match your filter.</div>
          )}
        </>
      )}
    </div>
  )
}
