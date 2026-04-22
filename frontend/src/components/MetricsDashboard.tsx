import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Clock, Coins, Hash, Wrench } from 'lucide-react';
import type { RunMetrics } from '../types';

interface Props {
  metrics: RunMetrics;
}

const AGENT_COLORS: Record<string, string> = {
  planner: '#a78bfa',
  plan_approval: '#fbbf24',
  searcher: '#22d3ee',
  reader: '#fb923c',
  writer: '#4ade80',
};

function StatCard({ icon: Icon, label, value, sub }: { icon: typeof Clock; label: string; value: string; sub?: string }) {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
      <div className="flex items-center gap-2 text-gray-400 mb-1">
        <Icon className="h-4 w-4" />
        <span className="text-xs uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      {sub && <div className="text-xs text-gray-500 mt-0.5">{sub}</div>}
    </div>
  );
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

export default function MetricsDashboard({ metrics }: Props) {
  const tokenData = metrics.steps
    .filter(s => (s.total_tokens || 0) > 0)
    .map(s => ({
      agent: s.agent,
      input: s.input_tokens || 0,
      output: s.output_tokens || 0,
      total: s.total_tokens || 0,
    }));

  const latencyData = metrics.steps
    .filter(s => (s.duration_ms || 0) > 0)
    .map(s => ({
      agent: s.agent,
      duration: (s.duration_ms || 0) / 1000,
    }));

  return (
    <div className="space-y-6">
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Run Metrics</h3>

      <div className="grid grid-cols-4 gap-3">
        <StatCard
          icon={Hash}
          label="Total Tokens"
          value={metrics.total_tokens.toLocaleString()}
        />
        <StatCard
          icon={Coins}
          label="Estimated Cost"
          value={`$${metrics.total_cost_usd.toFixed(4)}`}
        />
        <StatCard
          icon={Clock}
          label="Total Duration"
          value={formatDuration(metrics.total_duration_ms)}
        />
        <StatCard
          icon={Wrench}
          label="Tool Calls"
          value={metrics.total_tool_calls.toString()}
        />
      </div>

      {tokenData.length > 0 && (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <h4 className="text-xs font-semibold text-gray-400 uppercase mb-4">Token Usage by Agent</h4>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={tokenData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="agent" tick={{ fill: '#9ca3af', fontSize: 12 }} />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                labelStyle={{ color: '#fff' }}
              />
              <Bar dataKey="input" name="Input Tokens" stackId="a" fill="#60a5fa" />
              <Bar dataKey="output" name="Output Tokens" stackId="a" fill="#34d399" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {latencyData.length > 0 && (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <h4 className="text-xs font-semibold text-gray-400 uppercase mb-4">Latency by Agent (seconds)</h4>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={latencyData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 12 }} />
              <YAxis type="category" dataKey="agent" tick={{ fill: '#9ca3af', fontSize: 12 }} width={100} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                labelStyle={{ color: '#fff' }}
              />
              <Bar dataKey="duration" name="Duration (s)">
                {latencyData.map((entry) => (
                  <Cell key={entry.agent} fill={AGENT_COLORS[entry.agent] || '#6b7280'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {metrics.steps.length > 0 && (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <h4 className="text-xs font-semibold text-gray-400 uppercase mb-3">Tool Call Log</h4>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 text-xs uppercase">
                <th className="pb-2">Agent</th>
                <th className="pb-2">Model</th>
                <th className="pb-2">Tokens</th>
                <th className="pb-2">Cost</th>
                <th className="pb-2">Tools</th>
                <th className="pb-2">Duration</th>
              </tr>
            </thead>
            <tbody className="text-gray-300">
              {metrics.steps.map((step, i) => (
                <tr key={i} className="border-t border-gray-700">
                  <td className="py-2 font-medium" style={{ color: AGENT_COLORS[step.agent] }}>
                    {step.agent}
                  </td>
                  <td className="py-2 text-gray-500">{step.model_name || '-'}</td>
                  <td className="py-2">{step.total_tokens?.toLocaleString() || '-'}</td>
                  <td className="py-2">{step.cost_usd ? `$${step.cost_usd.toFixed(4)}` : '-'}</td>
                  <td className="py-2">
                    {step.tool_names.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {step.tool_names.map((t, j) => (
                          <span key={j} className="text-xs bg-gray-700 px-1.5 py-0.5 rounded">{t}</span>
                        ))}
                      </div>
                    ) : '-'}
                  </td>
                  <td className="py-2 text-gray-500">
                    {step.duration_ms ? formatDuration(step.duration_ms) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
