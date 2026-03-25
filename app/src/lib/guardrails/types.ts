export interface GuardrailRule {
  id: string;
  name: string;
  type: "content" | "media" | "link" | "schedule" | "legal";
  configJson: Record<string, unknown>;
  enabled: boolean;
}

export interface GuardrailCheckResult {
  passed: boolean;
  violations: GuardrailViolation[];
}

export interface GuardrailViolation {
  ruleId: string;
  ruleName: string;
  message: string;
}

export interface PostCheckInput {
  text: string;
  scheduledAt?: Date;
  mediaUrls?: string[];
}
