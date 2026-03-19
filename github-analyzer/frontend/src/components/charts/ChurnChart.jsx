import { Bar } from 'react-chartjs-2'
import { Chart, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js'
Chart.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend)

export default function ChurnChart({ weekly }) {
  if (!weekly?.length) return null
  const data = {
    labels: weekly.map(w => w.week?.slice(-5)),
    datasets: [
      {
        label: 'Additions',
        data: weekly.map(w => w.additions),
        backgroundColor: '#10b981',
        borderRadius: 3,
        stack: 'churn',
      },
      {
        label: 'Deletions',
        data: weekly.map(w => w.deletions),
        backgroundColor: '#ef4444',
        borderRadius: 3,
        stack: 'churn',
      },
    ],
  }
  const opts = {
    responsive: true,
    plugins: {
      legend: { position: 'top', labels: { color: '#9ca3af', boxWidth: 12, font: { size: 11 } } },
    },
    scales: {
      x: { stacked: true, ticks: { color: '#9ca3af', maxTicksLimit: 10 }, grid: { color: '#1f2937' } },
      y: { stacked: true, ticks: { color: '#9ca3af' }, grid: { color: '#1f2937' } },
    },
  }
  return <Bar data={data} options={opts} />
}
