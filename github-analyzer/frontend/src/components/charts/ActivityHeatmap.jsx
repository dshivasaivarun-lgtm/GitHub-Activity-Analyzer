import { useEffect, useRef } from 'react'

const CELL = 13
const GAP  = 2
const COLS = 53   // weeks
const ROWS = 7    // days

function getColor(count) {
  if (!count) return '#1f2937'
  if (count <= 2)  return '#0e4429'
  if (count <= 5)  return '#006d32'
  if (count <= 10) return '#26a641'
  return '#39d353'
}

function buildGrid(data) {
  const map = {}
  data.forEach(d => { map[d.date] = d.count })

  const today = new Date()
  const grid = []
  // Start 364 days ago, on a Sunday
  const start = new Date(today)
  start.setDate(start.getDate() - 364)
  start.setDate(start.getDate() - start.getDay()) // rewind to Sunday

  for (let col = 0; col < COLS; col++) {
    const week = []
    for (let row = 0; row < ROWS; row++) {
      const d = new Date(start)
      d.setDate(d.getDate() + col * 7 + row)
      const key = d.toISOString().split('T')[0]
      week.push({ date: key, count: map[key] || 0 })
    }
    grid.push(week)
  }
  return grid
}

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export default function ActivityHeatmap({ data }) {
  if (!data?.length) return null
  const grid = buildGrid(data)
  const W = COLS * (CELL + GAP)
  const H = ROWS * (CELL + GAP) + 24

  // Month labels
  const monthLabels = []
  grid.forEach((week, ci) => {
    const d = new Date(week[0].date)
    if (d.getDate() <= 7) {
      monthLabels.push({ x: ci * (CELL + GAP), label: MONTH_NAMES[d.getMonth()] })
    }
  })

  const totalCommits = data.reduce((s, d) => s + d.count, 0)
  const activeDays   = data.filter(d => d.count > 0).length

  return (
    <div className="bg-gray-800 rounded-xl p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Activity Heatmap</h2>
        <div className="text-sm text-gray-400">
          {totalCommits} commits · {activeDays} active days (last year)
        </div>
      </div>
      <div className="overflow-x-auto">
        <svg width={W} height={H} style={{ display: 'block' }}>
          {/* Month labels */}
          {monthLabels.map(({ x, label }) => (
            <text key={x} x={x} y={12} fontSize={10} fill="#9ca3af">{label}</text>
          ))}
          {/* Cells */}
          {grid.map((week, ci) =>
            week.map((cell, ri) => (
              <rect
                key={`${ci}-${ri}`}
                x={ci * (CELL + GAP)}
                y={18 + ri * (CELL + GAP)}
                width={CELL}
                height={CELL}
                rx={2}
                fill={getColor(cell.count)}
              >
                <title>{cell.date}: {cell.count} commits</title>
              </rect>
            ))
          )}
        </svg>
      </div>
      {/* Legend */}
      <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
        <span>Less</span>
        {['#1f2937','#0e4429','#006d32','#26a641','#39d353'].map(c => (
          <rect key={c} style={{ display:'inline-block', width:12, height:12, background:c, borderRadius:2 }}/>
        ))}
        <span>More</span>
      </div>
    </div>
  )
}
