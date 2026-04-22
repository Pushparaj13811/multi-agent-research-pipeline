export type ResearchMode = 'topic' | 'paper' | 'competitive';
export type LLMProvider = 'openai' | 'anthropic' | 'bedrock';
export type RunStatus = 'pending' | 'planning' | 'awaiting_approval' | 'searching' | 'reading' | 'writing' | 'completed' | 'failed';
export type AgentName = 'planner' | 'plan_approval' | 'searcher' | 'reader' | 'writer';

export interface APIKeyConfig {
  openai_api_key?: string;
  anthropic_api_key?: string;
  bedrock_api_key?: string;
  aws_access_key_id?: string;
  aws_secret_access_key?: string;
  aws_region?: string;
  bedrock_model_id?: string;
}

export interface SectionPlan {
  name: string;
  description: string;
  search_queries: string[];
}

export interface ResearchPlan {
  title: string;
  objective: string;
  sections: SectionPlan[];
  search_queries: string[];
  scope: string;
}

export interface SourceCitation {
  url: string;
  title: string;
  snippet: string;
}

export interface ReportSection {
  name: string;
  content: string;
  citations: SourceCitation[];
  confidence: number;
}

export interface Report {
  title: string;
  summary: string;
  sections: ReportSection[];
  key_findings: string[];
  sources: SourceCitation[];
}

export interface Run {
  id: string;
  query: string;
  mode: ResearchMode;
  llm_provider: LLMProvider;
  status: RunStatus;
  plan: ResearchPlan | null;
  report: Report | null;
  report_markdown: string | null;
  created_at: string;
  completed_at: string | null;
  error: string | null;
}

export interface StepMetrics {
  agent: string;
  input_tokens: number | null;
  output_tokens: number | null;
  total_tokens: number | null;
  cost_usd: number | null;
  model_name: string | null;
  tool_calls: number;
  tool_names: string[];
  duration_ms: number | null;
  langsmith_url: string | null;
}

export interface RunMetrics {
  run_id: string;
  status: string;
  total_tokens: number;
  total_cost_usd: number;
  total_duration_ms: number;
  total_tool_calls: number;
  steps: StepMetrics[];
}

export interface WSAgentStart {
  type: 'agent_start';
  agent: AgentName;
  timestamp?: string;
}

export interface WSAgentStream {
  type: 'agent_stream';
  agent: AgentName;
  chunk: string;
}

export interface WSPlanReady {
  type: 'plan_ready';
  plan: ResearchPlan;
}

export interface WSAgentComplete {
  type: 'agent_complete';
  agent: AgentName;
  duration_ms: number;
  tokens: number;
}

export interface WSMetricsUpdate {
  type: 'metrics_update';
  total_tokens: number;
  total_cost_usd: number;
  total_duration_ms: number;
  total_tool_calls: number;
}

export interface WSRunComplete {
  type: 'run_complete';
  report_id: string;
}

export interface WSError {
  type: 'error';
  message: string;
  agent?: AgentName;
}

export type WSMessage = WSAgentStart | WSAgentStream | WSPlanReady | WSAgentComplete | WSMetricsUpdate | WSRunComplete | WSError;
