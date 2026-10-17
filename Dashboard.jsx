import { useEffect, useState } from 'react';
import { dashboardApi, extractErrorMessage } from '../services/api';
import StatCard from '../components/StatCard';
import TransactionTable from '../components/TransactionTable';
import { VolumeChart, RiskDistributionChart, AmountTrendChart } from '../components/RiskChart';
import { Spinner, ErrorState, EmptyState } from '../components/Feedback';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [distribution, setDistribution] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadData() {
    setLoading(true);
    setError('');
    try {
      const [statsRes, distRes] = await Promise.all([
        dashboardApi.stats(),
        dashboardApi.riskDistribution(),
      ]);
      setData(statsRes.data);
      setDistribution(distRes.data.distribution);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  if (loading) return <Spinner />;
  if (error) return <ErrorState message={error} onRetry={loadData} />;
  if (!data) return null;

  const { summary, volumeOverTime, recentSuspicious } = data;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Transactions" value={summary.totalTransactions} />
        <StatCard label="High Risk" value={summary.highRisk} tone="high" />
        <StatCard label="Medium Risk" value={summary.mediumRisk} tone="medium" />
        <StatCard label="Flagged" value={summary.flagged} tone="brand" subtext={`${summary.underReview} under review · ${summary.blocked} blocked`} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-1">
          <h2 className="mb-1 text-sm font-semibold text-ink-900">Risk Distribution</h2>
          <p className="mb-3 text-xs text-ink-500">Share of transactions by risk level</p>
          {distribution && <RiskDistributionChart distribution={distribution} />}
        </div>
        <div className="card p-5 lg:col-span-2">
          <h2 className="mb-1 text-sm font-semibold text-ink-900">Transaction Volume</h2>
          <p className="mb-3 text-xs text-ink-500">Number of transactions processed over time</p>
          {volumeOverTime.length > 0 ? (
            <VolumeChart data={volumeOverTime} />
          ) : (
            <p className="py-16 text-center text-sm text-ink-500">No volume data yet.</p>
          )}
        </div>
      </div>

      <div className="card p-5">
        <h2 className="mb-1 text-sm font-semibold text-ink-900">Transaction Amount Trend</h2>
        <p className="mb-3 text-xs text-ink-500">Total transaction value per day (INR)</p>
        {volumeOverTime.length > 0 ? (
          <AmountTrendChart data={volumeOverTime} />
        ) : (
          <p className="py-16 text-center text-sm text-ink-500">No amount data yet.</p>
        )}
      </div>

      <div className="card">
        <div className="border-b border-ink-100 px-5 py-4">
          <h2 className="text-sm font-semibold text-ink-900">Recent Suspicious Transactions</h2>
          <p className="text-xs text-ink-500">Medium/high risk or flagged activity, most recent first</p>
        </div>
        {recentSuspicious.length === 0 ? (
          <EmptyState title="No suspicious activity" message="Everything looks normal right now." />
        ) : (
          <TransactionTable transactions={recentSuspicious} compact />
        )}
      </div>
    </div>
  );
}
