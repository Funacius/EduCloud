import { Activity, ArrowLeft, Cloud, Coins, Database, HardDrive, RefreshCw, Server, TimerReset } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getHealthDashboard, type HealthDashboard } from '../services/adminService';

function formatBytes(value: number | null | undefined) {
  if (value === null || value === undefined) return 'Not available';
  if (value < 1024) return `${value} B`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  let size = value / 1024;
  let index = 0;
  while (size >= 1024 && index < units.length - 1) { size /= 1024; index += 1; }
  return `${size.toFixed(size >= 10 ? 1 : 2)} ${units[index]}`;
}

function formatUptime(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return hours ? `${hours}h ${minutes}m` : `${minutes}m ${seconds % 60}s`;
}

function AdminHealthPage() {
  const [data, setData] = useState<HealthDashboard | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setError('');
    try {
      const response = await getHealthDashboard();
      if (response.data) setData(response.data);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to load health metrics.');
    } finally { setIsLoading(false); }
  }, []);

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => void refresh(), 15000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  return <section className="dashboard-page admin-health-page">
    <Link className="course-editor-back" to="/admin"><ArrowLeft /> Back to overview</Link>
    <header className="dashboard-header"><div><span className="eyebrow">Administration</span><h1>Health monitoring</h1><p>Live process, database, traffic, storage, and AWS-ready cost metrics.</p></div><button className="dashboard-primary-action" type="button" disabled={isLoading} onClick={() => { setIsLoading(true); void refresh(); }}><RefreshCw />{isLoading ? 'Refreshing...' : 'Refresh metrics'}</button></header>
    {error && <div className="dashboard-notice dashboard-notice-error">{error}</div>}
    {!data ? <div className="dashboard-empty-state">Loading health metrics...</div> : <>
      <div className={data.status === 'operational' ? 'health-banner is-operational' : 'health-banner is-degraded'}><Activity /><span><strong>{data.status === 'operational' ? 'All core services operational' : 'System attention required'}</strong><small>Checked {new Date(data.checked_at).toLocaleTimeString()} · Auto-refresh every 15 seconds</small></span></div>
      <div className="health-metric-grid">
        <article><Server /><span><small>API uptime</small><strong>{formatUptime(data.uptime_seconds)}</strong><em>Current process</em></span></article>
        <article><Database /><span><small>Database latency</small><strong>{data.database.latency_ms ?? '—'} ms</strong><em>{data.database.engine || data.database.status}</em></span></article>
        <article><Activity /><span><small>Requests · 5 minutes</small><strong>{data.traffic.requests_last_5_minutes}</strong><em>{data.traffic.average_response_ms_last_5_minutes} ms average</em></span></article>
        <article><HardDrive /><span><small>Stored data</small><strong>{formatBytes(data.storage.s3_size_bytes ?? data.storage.local_size_bytes)}</strong><em>{data.storage.mode.toUpperCase()} storage</em></span></article>
        <article><Coins /><span><small>AWS month estimate</small><strong>{data.aws.estimated_month_cost_usd === null ? 'Not enabled' : `$${data.aws.estimated_month_cost_usd.toFixed(2)}`}</strong><em>{data.aws.credits_applied_this_month_usd === null ? 'Cost Explorer optional' : `$${data.aws.credits_applied_this_month_usd.toFixed(2)} credits applied`}</em></span></article>
      </div>

      <div className="health-layout">
        <section className="health-panel"><div className="health-panel-heading"><Database /><div><span className="eyebrow">Supabase / PostgreSQL</span><h2>Database records</h2></div><strong>{formatBytes(data.database.size_bytes)}</strong></div><div className="database-row-grid">{Object.entries(data.database.rows).map(([name, value]) => <div key={name}><span>{name.replace(/_/g, ' ')}</span><strong>{value}</strong></div>)}</div></section>
        <section className="health-panel"><div className="health-panel-heading"><Activity /><div><span className="eyebrow">Application traffic</span><h2>Most requested routes</h2></div><strong>{data.traffic.total_requests_since_start} total</strong></div><div className="health-route-list">{data.traffic.top_routes.length === 0 ? <p>No requests recorded in this process yet.</p> : data.traffic.top_routes.map((route) => <div key={route.path}><code>{route.path}</code><strong>{route.requests}</strong></div>)}</div><div className="health-error-summary"><span>4xx responses: <strong>{data.traffic.client_errors_last_5_minutes}</strong></span><span>5xx responses: <strong>{data.traffic.errors_last_5_minutes}</strong></span></div></section>
        <section className="health-panel"><div className="health-panel-heading"><Cloud /><div><span className="eyebrow">Storage & AWS</span><h2>Cloud readiness</h2></div></div><dl className="health-definition-list"><div><dt>Current storage</dt><dd>{data.storage.mode}</dd></div><div><dt>S3 bucket</dt><dd>{data.storage.s3_bucket || 'Integration not enabled'}</dd></div><div><dt>S3 objects</dt><dd>{data.storage.s3_object_count ?? 'Not available yet'}</dd></div><div><dt>Cost monitoring</dt><dd>{data.aws.monitoring_enabled ? 'Enabled' : 'Disabled'}</dd></div></dl><p className="health-helper"><TimerReset />{data.aws.message}</p></section>
        <section className="health-panel"><div className="health-panel-heading"><Server /><div><span className="eyebrow">Dependencies</span><h2>Service status</h2></div></div><div className="service-status-list">{data.services.map((service) => <div key={service.name}><i className={service.status === 'operational' || service.status === 'configured' ? 'is-good' : 'is-muted'} /><span><strong>{service.name}</strong><small>{service.detail}</small></span><em>{service.status.replace(/_/g, ' ')}</em></div>)}</div></section>
      </div>
    </>}
  </section>;
}

export default AdminHealthPage;
