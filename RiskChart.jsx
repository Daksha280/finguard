import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { formatINR, formatDate } from '../utils/format';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler
);

const FONT = { family: "'IBM Plex Sans', sans-serif", size: 11 };

export function VolumeChart({ data }) {
  const chartData = {
    labels: data.map((d) => formatDate(d.date)),
    datasets: [
      {
        label: 'Transactions',
        data: data.map((d) => d.count),
        borderColor: '#2563EB',
        backgroundColor: 'rgba(37, 99, 235, 0.08)',
        fill: true,
        tension: 0.3,
        pointRadius: 2,
        pointBackgroundColor: '#2563EB',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { ticks: { font: FONT, maxRotation: 0 }, grid: { display: false } },
      y: { ticks: { font: FONT, precision: 0 }, grid: { color: '#F2F4F7' } },
    },
  };

  return (
    <div className="h-64">
      <Line data={chartData} options={options} />
    </div>
  );
}

export function RiskDistributionChart({ distribution }) {
  const chartData = {
    labels: ['Low', 'Medium', 'High'],
    datasets: [
      {
        data: [distribution.LOW || 0, distribution.MEDIUM || 0, distribution.HIGH || 0],
        backgroundColor: ['#16A34A', '#D97706', '#DC2626'],
        borderWidth: 0,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '68%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: { font: FONT, boxWidth: 10, padding: 16 },
      },
    },
  };

  return (
    <div className="h-64">
      <Doughnut data={chartData} options={options} />
    </div>
  );
}

export function AmountTrendChart({ data }) {
  const chartData = {
    labels: data.map((d) => formatDate(d.date)),
    datasets: [
      {
        label: 'Total Amount',
        data: data.map((d) => d.totalAmount),
        backgroundColor: '#3B6FE0',
        borderRadius: 3,
        maxBarThickness: 22,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => formatINR(ctx.parsed.y),
        },
      },
    },
    scales: {
      x: { ticks: { font: FONT, maxRotation: 0 }, grid: { display: false } },
      y: {
        ticks: {
          font: FONT,
          callback: (value) => `₹${(value / 1000).toFixed(0)}k`,
        },
        grid: { color: '#F2F4F7' },
      },
    },
  };

  return (
    <div className="h-64">
      <Bar data={chartData} options={options} />
    </div>
  );
}
