export enum PipefyProcess {
  IT_HELPDESK = 'IT Helpdesk',
  HR_ONBOARDING = 'HR Onboarding',
  SALES_PIPELINE = 'Sales Pipeline',
  ACCOUNTS_PAYABLE = 'Accounts Payable'
}

export enum EvalStatus {
  IDLE = 'IDLE',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

export interface TestCase {
  id: string;
  input: string; // e.g., Ticket description
  expectedOutput: string; // e.g., Ideal categorization or response
  context?: Record<string, any>; // Specific Pipefy field values
}

export interface Dataset {
  id: string;
  name: string;
  process: PipefyProcess;
  cases: TestCase[];
  description: string;
  agentContext?: string;
}

export interface EvalResult {
  testCaseId: string;
  input: string;
  actualOutput: string;
  expectedOutput: string;
  score: number; // 0 to 1
  reasoning: string;
  isPass: boolean;
  latencyMs: number;
}

export interface EvalRun {
  id: string;
  datasetId: string;
  timestamp: number;
  model: string;
  averageScore: number;
  passRate: number;
  results: EvalResult[];
  status: EvalStatus;
}

export interface AgentConfig {
  model: string;
  systemInstruction: string;
  temperature: number;
}
