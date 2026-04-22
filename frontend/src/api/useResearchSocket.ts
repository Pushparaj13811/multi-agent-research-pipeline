import { useEffect, useRef, useCallback, useState } from 'react';
import type { WSMessage, ResearchPlan, AgentName } from '../types';
import { useAuthStore } from '../store/authStore';

const MAX_LOG_LINES = 500;
function appendLog(logs: string[], line: string): string[] {
  const next = [...logs, line];
  return next.length > MAX_LOG_LINES ? next.slice(-MAX_LOG_LINES) : next;
}

interface AgentStep {
  agent: AgentName;
  status: 'pending' | 'active' | 'completed' | 'failed';
  duration_ms?: number;
  tokens?: number;
}

interface SocketState {
  connected: boolean;
  plan: ResearchPlan | null;
  steps: AgentStep[];
  liveOutput: string[];
  metrics: {
    total_tokens: number;
    total_cost_usd: number;
    total_duration_ms: number;
    total_tool_calls: number;
  };
  completed: boolean;
  error: string | null;
}

const INITIAL_STEPS: AgentStep[] = [
  { agent: 'planner', status: 'pending' },
  { agent: 'plan_approval', status: 'pending' },
  { agent: 'searcher', status: 'pending' },
  { agent: 'reader', status: 'pending' },
  { agent: 'writer', status: 'pending' },
];

export function useResearchSocket(runId: string | null) {
  const wsRef = useRef<WebSocket | null>(null);
  const [state, setState] = useState<SocketState>({
    connected: false,
    plan: null,
    steps: [...INITIAL_STEPS],
    liveOutput: [],
    metrics: { total_tokens: 0, total_cost_usd: 0, total_duration_ms: 0, total_tool_calls: 0 },
    completed: false,
    error: null,
  });

  useEffect(() => {
    if (!runId) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const token = useAuthStore.getState().token;
    if (!token) {
      setState(s => ({ ...s, error: 'Not authenticated. Please log in.' }));
      return;
    }
    const wsUrl = `${protocol}//${window.location.host}/ws/research/${runId}?token=${encodeURIComponent(token)}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => setState(s => ({ ...s, connected: true }));
    ws.onclose = () => setState(s => ({ ...s, connected: false }));
    ws.onerror = () => {
      setState(s => ({ ...s, error: 'WebSocket connection failed. Please refresh the page.' }));
    };

    ws.onmessage = (event) => {
      const msg: WSMessage = JSON.parse(event.data);

      setState(s => {
        switch (msg.type) {
          case 'agent_start':
            return {
              ...s,
              steps: s.steps.map(step =>
                step.agent === msg.agent ? { ...step, status: 'active' as const } : step
              ),
              liveOutput: appendLog(s.liveOutput, `[${msg.agent}] Started...`),
            };

          case 'agent_stream':
            return {
              ...s,
              liveOutput: appendLog(s.liveOutput, `[${msg.agent}] ${msg.chunk}`),
            };

          case 'plan_ready':
            return { ...s, plan: msg.plan };

          case 'agent_complete':
            return {
              ...s,
              steps: s.steps.map(step =>
                step.agent === msg.agent
                  ? { ...step, status: 'completed' as const, duration_ms: msg.duration_ms, tokens: msg.tokens }
                  : step
              ),
              liveOutput: appendLog(s.liveOutput, `[${msg.agent}] Completed in ${msg.duration_ms}ms`),
            };

          case 'metrics_update':
            return {
              ...s,
              metrics: {
                total_tokens: msg.total_tokens,
                total_cost_usd: msg.total_cost_usd,
                total_duration_ms: msg.total_duration_ms,
                total_tool_calls: msg.total_tool_calls,
              },
            };

          case 'run_complete':
            return { ...s, completed: true, liveOutput: appendLog(s.liveOutput, 'Research complete!') };

          case 'error':
            return {
              ...s,
              error: msg.message,
              steps: msg.agent
                ? s.steps.map(step =>
                    step.agent === msg.agent ? { ...step, status: 'failed' as const } : step
                  )
                : s.steps,
            };

          default:
            return s;
        }
      });
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [runId]);

  const sendApproval = useCallback((editedPlan?: Record<string, unknown>) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'approve_plan',
        edited_plan: editedPlan || null,
      }));
    }
  }, []);

  return { ...state, sendApproval };
}
