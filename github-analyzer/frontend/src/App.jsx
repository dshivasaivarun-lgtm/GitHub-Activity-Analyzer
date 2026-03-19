import { useState } from 'react'
import axios from 'axios'
import CommitChart from './components/charts/CommitChart'
import HealthGauge from './components/dashboard/HealthGauge'
import ContributorLeaderboard from './components/dashboard/ContributorLeaderboard'
import LanguageChart from './components/charts/LanguageChart'
import PatternCard from './components/dashboard/PatternCard'
import ActivityHeatmap from './components/charts/ActivityHeatmap'
import ComparePage from './pages/ComparePage'
import UserPage from './pages/UserPage'

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

function Skeleton({ h = 'h-40' }) {
  return <div className={`${h} bg-gray-800 rounded-xl animate-pulse`} />
}

function SectionShell({ loading, children, fallback }) {
  if (loading) return fallback || <Skeleton />
  return children
}

export default function App() {
  const [page, setPage]       = useState('analyze')
  const [repoUrl, setRepoUrl] = useState('')
  const [started, setStarted] = useState(false)
  const [loaded, setLoaded]   = useState({})
  const [data, setData]       = useState({})
  const [error, setError]     = useState('')

  function setSection(key, value) {
    setData(prev => ({ ...prev, [key]: value }))
    setLoaded(prev => ({ ...prev, [key]: true }))
  }

  async function analyze(url) {
    const target = url || repoUrl
    if (!target.trim()) return
    if (url) setRepoUrl(url)
    if (page !== 'analyze') setPage('analyze')
    setStarted(true)
    setError('')
    setLoaded({})
    setData({})

    axios.get(`${API}/api/repos/analyze`, { params: { repo_url: target } })
      .then(r => {
        setSection('summary', r.data.repo)
        setSection('health',  r.data.health_score)
        setSection('commits', r.data.commit_stats)
        setSection('contributors', r.data.contributors)
        setSection('languages', r.data.languages)
        setSection('patterns', r.data.patterns)
      })
      .catch(e => setError(e.response?.data?.detail || 'Analysis failed'))

    axios.get(`${API}/api/commits/heatmap`, { params: { repo_url: target } })
      .then(r => setSection('heatmap', r.data))
      .catch(() => setSection('heatmap', []))
  }

  const isLoading = key => started && !loaded[key]

  const NAV_ITEMS = [
    { id: 'analyze', label: '⬡ Analyze' },
    { id: 'user',    label: '👤 User' },
    { id: 'compare', label: '⇌ Compare' },
  ]

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">GitHub Activity Analyzer</h1>
          <p className="text-gray-500 text-xs mt-0.5">Commits · Health · Contributors · Patterns</p>
        </div>
        <nav className="flex gap-2">
          {NAV_ITEMS.map(({ id, label }) => (
            <button key={id} onClick={() => setPage(id)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors
                ${page === id ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}>
              {label}
            </button>
          ))}
        </nav>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">

        {page === 'user' && (
          <UserPage onAnalyzeRepo={fullName => analyze(fullName)} />
        )}

        {page === 'compare' && <ComparePage />}

        {page === 'analyze' && (
          <>
            <div className="flex gap-3 mb-8">
              <input
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white
                  placeholder-gray-500 focus:outline-none focus:border-blue-500"
                placeholder="owner/repo or full GitHub URL — e.g. facebook/react"
                value={repoUrl}
                onChange={e => setRepoUrl(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && analyze()}
              />
              <button onClick={() => analyze()} disabled={started && !loaded.summary}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-6 py-3 rounded-lg font-medium transition-colors">
                {started && !loaded.summary ? 'Loading…' : 'Analyze'}
              </button>
            </div>

            {error && (
              <div className="bg-red-900/40 border border-red-700 text-red-300 px-4 py-3 rounded-lg mb-6">
                {error}
              </div>
            )}

            {started && (
              <>
                <SectionShell loading={isLoading('summary')} fallback={<Skeleton h="h-14" />}>
                  {data.summary && (
                    <div className="flex items-start justify-between mb-6">
                      <div>
                        <h2 className="text-xl font-bold text-white">{data.summary.full_name}</h2>
                        {data.summary.description && (
                          <p className="text-gray-400 text-sm mt-1">{data.summary.description}</p>
                        )}
                      </div>
                      <div className="flex gap-2 ml-4 flex-shrink-0">
                        <a href={`${API}/api/export/csv?repo_url=${encodeURIComponent(repoUrl)}`}
                          className="bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded-lg text-sm transition-colors">
                          CSV
                        </a>
                        <a href={`${API}/api/export/pdf?repo_url=${encodeURIComponent(repoUrl)}`}
                          className="bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded-lg text-sm transition-colors">
                          PDF Report
                        </a>
                      </div>
                    </div>
                  )}
                </SectionShell>

                <SectionShell loading={isLoading('summary')} fallback={
                  <div className="grid grid-cols-4 gap-4 mb-6">
                    {[...Array(4)].map((_,i) => <Skeleton key={i} h="h-20"/>)}
                  </div>
                }>
                  {data.summary && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      {[
                        ['Stars',         data.summary.stars],
                        ['Forks',         data.summary.forks],
                        ['Open Issues',   data.summary.open_issues],
                        ['Total Commits', data.commits?.total_commits],
                      ].map(([label, value]) => (
                        <div key={label} className="bg-gray-800 rounded-xl p-4 text-center">
                          <div className="text-2xl font-bold text-white">
                            {value != null
                              ? value.toLocaleString()
                              : <span className="animate-pulse text-gray-600">···</span>}
                          </div>
                          <div className="text-gray-400 text-sm mt-1">{label}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </SectionShell>

                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <SectionShell loading={isLoading('health')}><HealthGauge data={data.health} /></SectionShell>
                  <SectionShell loading={isLoading('patterns')}><PatternCard patterns={data.patterns} /></SectionShell>
                </div>

                <SectionShell loading={isLoading('heatmap')} fallback={<Skeleton h="h-36" />}>
                  {data.heatmap?.length > 0 && (
                    <div className="mb-6"><ActivityHeatmap data={data.heatmap} /></div>
                  )}
                </SectionShell>

                <SectionShell loading={isLoading('commits')} fallback={<Skeleton h="h-52" />}>
                  {data.commits?.weekly_commits?.length > 0 && (
                    <div className="bg-gray-800 rounded-xl p-6 mb-6">
                      <h2 className="text-lg font-semibold mb-4">Weekly Commit Activity</h2>
                      <CommitChart weekly={data.commits.weekly_commits} />
                    </div>
                  )}
                </SectionShell>

                <div className="grid md:grid-cols-2 gap-6">
                  <SectionShell loading={isLoading('contributors')}>
                    <ContributorLeaderboard contributors={data.contributors?.leaderboard} />
                  </SectionShell>
                  <SectionShell loading={isLoading('languages')}>
                    <LanguageChart languages={data.languages} />
                  </SectionShell>
                </div>
              </>
            )}
          </>
        )}
      </main>
    </div>
  )
}
