import { useState } from 'react'
import axios from 'axios'

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

const healthColor = s => s >= 80 ? '#10b981' : s >= 60 ? '#3b82f6' : s >= 40 ? '#f59e0b' : '#ef4444'
const healthLabel = s => s >= 80 ? 'Excellent' : s >= 60 ? 'Good' : s >= 40 ? 'Fair' : 'Needs Work'

function HealthRing({ score }) {
  const r = 18, c = 2 * Math.PI * r, pct = (score / 100) * c
  const color = healthColor(score)
  return (
    <svg width="48" height="48" viewBox="0 0 44 44" style={{ flexShrink: 0 }}>
      <circle cx="22" cy="22" r={r} fill="none" stroke="#374151" strokeWidth="3.5"/>
      <circle cx="22" cy="22" r={r} fill="none" stroke={color} strokeWidth="3.5"
        strokeDasharray={`${pct} ${c}`} strokeLinecap="round" transform="rotate(-90 22 22)"/>
      <text x="22" y="26" textAnchor="middle" fontSize="10" fontWeight="500" fill={color}>{score}</text>
    </svg>
  )
}

const inp = (extra) => ({
  background: '#1f2937', border: '1px solid #374151', borderRadius: 8,
  padding: '10px 14px', color: '#fff', fontSize: 14, outline: 'none', ...extra
})

function friendlyError(e) {
  if (!e.response) return 'Cannot reach the server. It may be waking up on Render free tier — wait 30 seconds and try again.'
  const status = e.response?.status
  const detail = e.response?.data?.detail || ''
  if (status === 401) return 'GitHub token missing or invalid. Check GITHUB_TOKEN on Render.'
  if (status === 404) return 'User not found. Double-check the username.'
  if (status === 429) return `GitHub API rate limit hit. ${detail}`
  if (status === 502 || status === 503) return 'Server error — backend may still be starting. Try again in 30 seconds.'
  return detail || `Error ${status}: Failed to fetch user data.`
}

export default function UserPage({ onAnalyzeRepo }) {
  const [username, setUsername]   = useState('')
  const [limit, setLimit]         = useState(10)
  const [skipForks, setSkipForks] = useState(true)
  const [data, setData]           = useState(null)
  const [loading, setLoading]     = useState(false)
  const [status, setStatus]       = useState('')
  const [error, setError]         = useState('')
  const [filter, setFilter]       = useState('')
  const [sortBy, setSortBy]       = useState('health')

  async function fetchUser() {
    if (!username.trim()) return
    setLoading(true); setError(''); setData(null); setStatus('')
    try {
      // Ping first to wake Render free tier
      setStatus('Waking up server…')
      try { await axios.get(`${API}/ping`, { timeout: 35000 }) } catch {}

      setStatus(`Looking up @${username.trim()}…`)
      await axios.get(`${API}/api/user/profile`, {
        params: { username: username.trim() }, timeout: 20000,
      })

      setStatus(`Analyzing ${limit} repos — this takes 20–40 seconds…`)
      const res = await axios.get(`${API}/api/user/analyze-all`, {
        params: { username: username.trim(), limit, skip_forks: skipForks },
        timeout: 120000,
      })
      setData(res.data)
    } catch (e) {
      setError(friendlyError(e))
    } finally {
      setLoading(false); setStatus('')
    }
  }

  const sorted = () => {
    if (!data?.repos) return []
    let repos = data.repos.filter(r => !filter || r.name.toLowerCase().includes(filter.toLowerCase()))
    if (sortBy === 'health')  repos = [...repos].sort((a,b) => (b.health?.total||0) - (a.health?.total||0))
    if (sortBy === 'stars')   repos = [...repos].sort((a,b) => (b.stars||0) - (a.stars||0))
    if (sortBy === 'commits') repos = [...repos].sort((a,b) => (b.total_commits||0) - (a.total_commits||0))
    if (sortBy === 'recent')  repos = [...repos].sort((a,b) => new Date(b.pushed_at||0) - new Date(a.pushed_at||0))
    return repos
  }

  return (
    <div>
      <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>User Analysis</div>
      <div style={{ color: '#9ca3af', fontSize: 14, marginBottom: 24 }}>Enter a GitHub username to analyze all their public repos at once.</div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
        <input style={{ ...inp(), flex: 1 }} placeholder="GitHub username (e.g. torvalds)"
          value={username} onChange={e => setUsername(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && fetchUser()} />
        <button onClick={fetchUser} disabled={loading} style={{
          background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8,
          padding: '10px 24px', fontSize: 14, fontWeight: 500, cursor: 'pointer',
          opacity: loading ? 0.5 : 1, whiteSpace: 'nowrap',
        }}>
          {loading ? 'Analyzing…' : 'Analyze User'}
        </button>
      </div>

      <div style={{ display: 'flex', gap: 24, marginBottom: 24, fontSize: 13, color: '#9ca3af', alignItems: 'center' }}>
        <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          Repos:
          <select value={limit} onChange={e => setLimit(+e.target.value)}
            style={{ ...inp({ padding: '4px 8px', fontSize: 13 }) }}>
            {[5,10,15,20].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
        <label style={{ display: 'flex', gap: 6, alignItems: 'center', cursor: 'pointer' }}>
          <input type="checkbox" checked={skipForks} onChange={e => setSkipForks(e.target.checked)}/>
          Skip forks
        </label>
      </div>

      {/* Progress indicator */}
      {loading && status && (
        <div style={{ background: '#1e3a5f', border: '1px solid #1d4ed8', color: '#93c5fd', padding: '12px 16px', borderRadius: 8, marginBottom: 16, fontSize: 13, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid #3b82f6', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite', flexShrink: 0 }}/>
          {status}
        </div>
      )}

      {loading && (
        <div style={{ display: 'grid', gap: 12 }}>
          <div style={{ height: 96, background: '#1f2937', borderRadius: 12, opacity: 0.5 }}/>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10 }}>
            {[...Array(5)].map((_,i) => <div key={i} style={{ height: 70, background: '#1f2937', borderRadius: 10, opacity: 0.4 }}/>)}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[...Array(6)].map((_,i) => <div key={i} style={{ height: 100, background: '#1f2937', borderRadius: 10, opacity: 0.4 }}/>)}
          </div>
        </div>
      )}

      {error && (
        <div style={{ background: '#450a0a', border: '1px solid #7f1d1d', color: '#fca5a5', padding: '14px 16px', borderRadius: 8, marginBottom: 24, fontSize: 13, lineHeight: 1.7 }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Failed to fetch user data</div>
          {error}
          {error.includes('waking up') && (
            <div style={{ marginTop: 8, color: '#fbbf24' }}>
              ⚡ Render free tier spins down after 15 min of inactivity. First request takes ~30 seconds to wake up. Just wait and try again.
            </div>
          )}
        </div>
      )}

      {data && !loading && (
        <>
          <div style={{ background: '#1f2937', borderRadius: 12, padding: 20, marginBottom: 20, display: 'flex', gap: 20, alignItems: 'center' }}>
            <img src={data.user.avatar_url} alt={data.user.login} style={{ width: 64, height: 64, borderRadius: '50%', flexShrink: 0 }}/>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 18, fontWeight: 700 }}>{data.user.name || data.user.login}</div>
              <div style={{ color: '#9ca3af', fontSize: 13 }}>@{data.user.login}</div>
              {data.user.bio && <div style={{ color: '#9ca3af', fontSize: 13, marginTop: 4 }}>{data.user.bio}</div>}
            </div>
            <div style={{ display: 'flex', gap: 24, textAlign: 'center', flexShrink: 0 }}>
              <div><div style={{ fontSize: 20, fontWeight: 700 }}>{data.user.public_repos}</div><div style={{ fontSize: 11, color: '#6b7280' }}>repos</div></div>
              <div><div style={{ fontSize: 20, fontWeight: 700 }}>{data.user.followers?.toLocaleString()}</div><div style={{ fontSize: 11, color: '#6b7280' }}>followers</div></div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12, marginBottom: 20 }}>
            {[
              ['Repos analyzed', data.summary.repos_analyzed],
              ['Avg health',     data.summary.avg_health_score],
              ['Total stars',    data.summary.total_stars?.toLocaleString()],
              ['Total commits',  data.summary.total_commits?.toLocaleString()],
              ['Top language',   data.summary.top_language || '—'],
            ].map(([label, value]) => (
              <div key={label} style={{ background: '#111827', borderRadius: 10, padding: 14, textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 700 }}>{value}</div>
                <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>{label}</div>
              </div>
            ))}
          </div>

          {data.summary.language_distribution?.length > 0 && (
            <div style={{ background: '#1f2937', borderRadius: 12, padding: 16, marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 10 }}>Language distribution</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {data.summary.language_distribution.map(({ language, count }) => (
                  <span key={language} style={{ background: '#374151', padding: '4px 12px', borderRadius: 20, fontSize: 12, color: '#d1d5db' }}>
                    {language} <span style={{ color: '#6b7280' }}>{count}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
            <input style={{ ...inp({ flex: 1, padding: '8px 12px', fontSize: 13 }) }}
              placeholder="Filter by name…" value={filter} onChange={e => setFilter(e.target.value)}/>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)}
              style={{ ...inp({ padding: '8px 12px', fontSize: 13 }) }}>
              <option value="health">Health</option>
              <option value="stars">Stars</option>
              <option value="commits">Commits</option>
              <option value="recent">Recent</option>
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {sorted().map(repo => (
              <div key={repo.name} onClick={() => !repo.error && onAnalyzeRepo?.(repo.full_name)}
                style={{ background: '#1f2937', borderRadius: 10, padding: 16, cursor: repo.error ? 'default' : 'pointer', border: '1px solid #374151' }}>
                {repo.error ? (
                  <>
                    <div style={{ fontWeight: 500, fontSize: 13 }}>{repo.name}</div>
                    <div style={{ color: '#f87171', fontSize: 12, marginTop: 4 }}>{repo.error}</div>
                  </>
                ) : (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{repo.name}</div>
                        {repo.description && <div style={{ color: '#9ca3af', fontSize: 12, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{repo.description}</div>}
                      </div>
                      <HealthRing score={repo.health?.total ?? 0}/>
                    </div>
                    <div style={{ display: 'flex', gap: 14, fontSize: 12, color: '#6b7280' }}>
                      {repo.language && <span>● {repo.language}</span>}
                      <span>★ {repo.stars}</span>
                      <span>{repo.total_commits} commits</span>
                      <span style={{ marginLeft: 'auto', color: healthColor(repo.health?.total??0), fontWeight: 500 }}>
                        {healthLabel(repo.health?.total??0)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
          {sorted().length === 0 && <div style={{ textAlign: 'center', color: '#6b7280', padding: 40 }}>No repos match your filter.</div>}
        </>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
