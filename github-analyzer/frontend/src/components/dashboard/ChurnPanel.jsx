import ChurnChart from '../charts/ChurnChart'

const fmt = n => n?.toLocaleString() ?? '—'

function StatBox({ label, value, color }) {
  return (
    <div style={{ background: '#111827', borderRadius: 8, padding: '12px 16px', textAlign: 'center' }}>
      <div style={{ fontSize: 20, fontWeight: 700, color: color || '#fff' }}>{value}</div>
      <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 3 }}>{label}</div>
    </div>
  )
}

export default function ChurnPanel({ data, loading, onLoad, repoUrl, api }) {
  if (loading) {
    return (
      <div style={{ background: '#1f2937', borderRadius: 12, padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 16, fontWeight: 600 }}>Code Churn</div>
        </div>
        <div style={{ height: 40, background: '#111827', borderRadius: 8, animation: 'pulse 1.5s infinite', marginBottom: 12 }}/>
        <div style={{ height: 160, background: '#111827', borderRadius: 8, animation: 'pulse 1.5s infinite' }}/>
      </div>
    )
  }

  if (!data) {
    return (
      <div style={{ background: '#1f2937', borderRadius: 12, padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>Code Churn</div>
            <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>Lines added vs deleted per week</div>
          </div>
          <button onClick={onLoad}
            style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
            Load Churn
          </button>
        </div>
        <div style={{ color: '#6b7280', fontSize: 13, padding: '20px 0', borderTop: '1px solid #374151', marginTop: 8 }}>
          Churn analysis fetches detailed stats for the last 50 commits (~50 API calls). Click to load.
        </div>
      </div>
    )
  }

  const stabilityColor = data.stability_score >= 15 ? '#10b981' : data.stability_score >= 8 ? '#f59e0b' : '#ef4444'
  const stabilityLabel = data.stability_score >= 15 ? 'Stable' : data.stability_score >= 8 ? 'Moderate' : 'Unstable'

  return (
    <div style={{ background: '#1f2937', borderRadius: 12, padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>Code Churn</div>
          <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
            Based on last {data.commits_sampled} commits
          </div>
        </div>
        <span style={{ background: stabilityColor + '22', color: stabilityColor, padding: '3px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500 }}>
          {stabilityLabel}
        </span>
      </div>

      {/* Stat row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
        <StatBox label="Lines added"     value={fmt(data.total_additions)} color="#10b981" />
        <StatBox label="Lines deleted"   value={fmt(data.total_deletions)} color="#ef4444" />
        <StatBox label="Total churn"     value={fmt(data.total_churn)} />
        <StatBox label="Churn ratio"     value={data.churn_ratio}
          color={data.churn_ratio > 0.8 ? '#10b981' : data.churn_ratio > 0.5 ? '#f59e0b' : '#ef4444'} />
      </div>

      {/* Weekly chart */}
      {data.weekly_churn?.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <ChurnChart weekly={data.weekly_churn} />
        </div>
      )}

      {/* Top churned files */}
      {data.top_churned_files?.length > 0 && (
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 10, color: '#d1d5db' }}>Most changed files</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {data.top_churned_files.slice(0, 6).map((f, i) => {
              const max = data.top_churned_files[0].churn
              const pct = Math.round((f.churn / max) * 100)
              return (
                <div key={f.file}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                    <span style={{ color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '75%' }}>
                      {f.file}
                    </span>
                    <span style={{ color: '#d1d5db', flexShrink: 0 }}>{fmt(f.churn)} lines</span>
                  </div>
                  <div style={{ height: 4, background: '#374151', borderRadius: 2 }}>
                    <div style={{ height: 4, borderRadius: 2, width: `${pct}%`,
                      background: i === 0 ? '#ef4444' : i <= 2 ? '#f59e0b' : '#3b82f6' }}/>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Spike weeks */}
      {data.churn_spikes?.length > 0 && (
        <div style={{ marginTop: 16, padding: '10px 14px', background: '#451a03', borderRadius: 8, border: '1px solid #92400e' }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: '#fbbf24', marginBottom: 4 }}>
            Churn spikes detected ({data.churn_spikes.length} weeks above 2× median)
          </div>
          <div style={{ fontSize: 11, color: '#d97706' }}>
            {data.churn_spikes.slice(0, 3).map(s => `${s.week} (${fmt(s.total_churn)} lines)`).join(' · ')}
          </div>
        </div>
      )}
    </div>
  )
}
