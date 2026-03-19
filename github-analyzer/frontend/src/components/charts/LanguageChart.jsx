import { Doughnut } from 'react-chartjs-2'
import { Chart, ArcElement, Tooltip, Legend } from 'chart.js'
Chart.register(ArcElement, Tooltip, Legend)

const COLORS = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#f97316','#6366f1']

export default function LanguageChart({ languages }) {
  if (!languages?.length) return null
  const top = languages.slice(0, 8)
  const data = {
    labels: top.map(l => l.language),
    datasets: [{ data: top.map(l => l.percentage), backgroundColor: COLORS, borderWidth: 0 }],
  }
  const opts = {
    responsive: true,
    plugins: {
      legend: { position: 'right', labels: { color: '#d1d5db', boxWidth: 12, font: { size: 12 } } },
      tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${ctx.parsed}%` } },
    },
  }
  return (
    <div className="bg-gray-800 rounded-xl p-6">
      <h2 className="text-lg font-semibold mb-4">Language Breakdown</h2>
      <Doughnut data={data} options={opts} />
    </div>
  )
}
