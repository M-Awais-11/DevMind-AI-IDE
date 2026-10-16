export interface AgentMessage {
  id?: number;
  sender: 'user' | 'agent';
  content: string;
  timestamp: string;
  error?: boolean;
  steps?: AgentStep[];
}

export interface AgentStep {
  step: number;
  tool: string;
  args: any;
  success?: boolean;
  output_preview?: string;
}

export interface AgentEvent {
  type: 'status' | 'thought' | 'tool_call' | 'tool_result' | 'message' | 'error';
  data: any;
}
