import { Line } from 'react-chartjs-2'
import { Chart, LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Filler } from 'chart.js'
Chart.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Filler)

export default function CommitChart({ weekly }) {
  const data = {
    labels: weekly.map(w => w.week),
    datasets: [{
      label: 'Commits',
      data: weekly.map(w => w.commits),
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(59,130,246,0.15)',
      fill: true,
      tension: 0.4,
      pointRadius: 3,
    }],
  }
  const opts = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      x: { ticks: { color: '#9ca3af', maxTicksLimit: 10 }, grid: { color: '#1f2937' } },
      y: { ticks: { color: '#9ca3af' }, grid: { color: '#1f2937' } },
    },
  }
  return <Line data={data} options={opts} />
}
