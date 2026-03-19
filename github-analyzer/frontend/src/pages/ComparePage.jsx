import { useState } from 'react'
import axios from 'axios'

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

function StatBar({ label, v1, v2, name1, name2 }) {
  const total = (v1 || 0) + (v2 || 0)
  const pct1  = total ? Math.round((v1 / total) * 100) : 50
  const pct2  = 100 - pct1
  return (
    <div className="mb-4">
      <div className="flex justify-between text-sm text-gray-400 mb-1">
        <span>{label}</span>
        <span>{v1} vs {v2}</span>
      </div>
      <div className="flex h-2 rounded-full overflow-hidden">
        <div className="bg-blue-500 transition-all" style={{ width: `${pct1}%` }}/>
        <div className="bg-purple-500 transition-all" style={{ width: `${pct2}%` }}/>
      </div>
      <div className="flex justify-between text-xs text-gray-500 mt-1">
        <span className="text-blue-400">{name1} ({pct1}%)</span>
        <span className="text-purple-400">{name2} ({pct2}%)</span>
      </div>
    </div>
  )
}

function RepoCard({ data, color }) {
  if (!data) return null
  const border = color === 'blue' ? 'border-blue-500' : 'border-purple-500'
  const text   = color === 'blue' ? 'text-blue-400'  : 'text-purple-400'
  const h = data.health
  return (
    <div className={`bg-gray-800 rounded-xl p-5 border-t-2 ${border}`}>
      <h3 className={`font-bold text-lg ${text} mb-1`}>{data.repo}</h3>
      <p className="text-gray-400 text-sm mb-4 line-clamp-2">{data.description || 'No description'}</p>
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[['Stars', data.stars], ['Forks', data.forks], ['Issues', data.open_issues]].map(([l,v]) => (
          <div key={l} className="bg-gray-700 rounded-lg p-2 text-center">
            <div className="font-bold text-white">{v?.toLocaleString()}</div>
            <div className="text-xs text-gray-400">{l}</div>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <div className="text-3xl font-bold" style={{ color: h?.total >= 80 ? '#10b981' : h?.total >= 60 ? '#3b82f6' : '#f59e0b' }}>
          {h?.total}
        </div>
        <div>
          <div className="text-sm font-medium text-white">{h?.label}</div>
          <div className="text-xs text-gray-400">Health Score / 100</div>
        </div>
      </div>
      <div className="mt-3 text-sm text-gray-400">
        <span className="font-medium text-white">{data.commit_stats?.total_commits?.toLocaleString()}</span> commits ·
        <span className="font-medium text-white ml-1">{data.contributors?.total_contributors}</span> contributors
      </div>
      {data.patterns?.peak_time && (
        <div className="mt-2 text-xs text-gray-500 italic">"{data.patterns.peak_time}"</div>
      )}
    </div>
  )
}

export default function ComparePage() {
  const [mode, setMode]   = useState('repos') // 'repos' | 'devs'
  const [repo1, setRepo1] = useState('')
  const [repo2, setRepo2] = useState('')
  const [repoUrl, setRepoUrl] = useState('')
  const [dev1, setDev1]   = useState('')
  const [dev2, setDev2]   = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')

  async function compare() {
    setLoading(true); setError(''); setResult(null)
    try {
      if (mode === 'repos') {
        const res = await axios.get(`${API}/api/compare/repos`, { params: { repo1, repo2 } })
        setResult({ type: 'repos', data: res.data })
      } else {
        const res = await axios.get(`${API}/api/compare/developers`, { params: { repo_url: repoUrl, dev1, dev2 } })
        setResult({ type: 'devs', data: res.data })
      }
    } catch (e) {
      setError(e.response?.data?.detail || 'Comparison failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold mb-6">Compare</h1>

      {/* Mode toggle */}
      <div className="flex gap-2 mb-6">
        {['repos','devs'].map(m => (
          <button key={m} onClick={() => { setMode(m); setResult(null) }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${mode === m ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
            {m === 'repos' ? '⬡ Two Repos' : '👤 Two Developers'}
          </button>
        ))}
      </div>

      {/* Inputs */}
      {mode === 'repos' ? (
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <input className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            placeholder="Repo 1 (e.g. facebook/react)" value={repo1} onChange={e => setRepo1(e.target.value)} />
          <input className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
            placeholder="Repo 2 (e.g. vuejs/vue)" value={repo2} onChange={e => setRepo2(e.target.value)} />
        </div>
      ) : (
        <div className="space-y-3 mb-4">
          <input className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            placeholder="Repo URL (e.g. torvalds/linux)" value={repoUrl} onChange={e => setRepoUrl(e.target.value)} />
          <div className="grid md:grid-cols-2 gap-4">
            <input className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              placeholder="Developer 1 GitHub username" value={dev1} onChange={e => setDev1(e.target.value)} />
            <input className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
              placeholder="Developer 2 GitHub username" value={dev2} onChange={e => setDev2(e.target.value)} />
          </div>
        </div>
      )}

      <button onClick={compare} disabled={loading}
        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-6 py-3 rounded-lg font-medium transition-colors mb-6">
        {loading ? 'Comparing…' : 'Compare'}
      </button>

      {error && <div className="bg-red-900/40 border border-red-700 text-red-300 px-4 py-3 rounded-lg mb-6">{error}</div>}

      {result?.type === 'repos' && (
        <>
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <RepoCard data={result.data.left}  color="blue"/>
            <RepoCard data={result.data.right} color="purple"/>
          </div>
          <div className="bg-gray-800 rounded-xl p-6">
            <h3 className="font-semibold mb-4">Head-to-Head</h3>
            <StatBar label="Stars"        v1={result.data.left?.stars}  v2={result.data.right?.stars}  name1={result.data.left?.repo} name2={result.data.right?.repo}/>
            <StatBar label="Health Score" v1={result.data.left?.health?.total} v2={result.data.right?.health?.total} name1={result.data.left?.repo} name2={result.data.right?.repo}/>
            <StatBar label="Commits"      v1={result.data.left?.commit_stats?.total_commits} v2={result.data.right?.commit_stats?.total_commits} name1={result.data.left?.repo} name2={result.data.right?.repo}/>
            <StatBar label="Contributors" v1={result.data.left?.contributors?.total_contributors} v2={result.data.right?.contributors?.total_contributors} name1={result.data.left?.repo} name2={result.data.right?.repo}/>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-4">
            {Object.entries(result.data.winners).map(([cat, winner]) => (
              <div key={cat} className="bg-gray-800 rounded-lg p-3 text-center">
                <div className="text-yellow-400 text-lg">🏆</div>
                <div className="text-xs text-gray-400 mt-1">{cat}</div>
                <div className="text-sm font-medium text-white truncate">{winner}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {result?.type === 'devs' && (
        <div className="grid md:grid-cols-2 gap-6">
          {[result.data.left, result.data.right].map((dev, i) => (
            <div key={dev.login} className={`bg-gray-800 rounded-xl p-5 border-t-2 ${i === 0 ? 'border-blue-500' : 'border-purple-500'}`}>
              <h3 className={`font-bold text-lg mb-3 ${i === 0 ? 'text-blue-400' : 'text-purple-400'}`}>
                {dev.login} {dev.login === result.data.winner_by_commits && '🏆'}
              </h3>
              {dev.found ? (
                <div className="space-y-2 text-sm">
                  {[['Total Commits', dev.total_commits],['Most Active Day', dev.most_active_day],['Peak Hour', `${dev.most_active_hour}:00`],['Style', dev.patterns?.peak_time]].map(([l,v]) => (
                    <div key={l} className="flex justify-between">
                      <span className="text-gray-400">{l}</span>
                      <span className="text-white font-medium capitalize">{v ?? '—'}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No commits found for this user in the repo.</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
