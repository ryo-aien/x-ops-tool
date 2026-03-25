import type {
  GuardrailCheckResult,
  GuardrailRule,
  GuardrailViolation,
  PostCheckInput,
} from "./types";

export function checkGuardrails(
  input: PostCheckInput,
  rules: GuardrailRule[]
): GuardrailCheckResult {
  const violations: GuardrailViolation[] = [];

  for (const rule of rules) {
    if (!rule.enabled) continue;

    switch (rule.type) {
      case "content": {
        const cfg = rule.configJson as { keywords?: string[] };
        if (cfg.keywords) {
          for (const kw of cfg.keywords) {
            if (input.text.toLowerCase().includes(kw.toLowerCase())) {
              violations.push({
                ruleId: rule.id,
                ruleName: rule.name,
                message: `NGワード「${kw}」が含まれています`,
              });
            }
          }
        }
        break;
      }
      case "schedule": {
        if (input.scheduledAt) {
          const cfg = rule.configJson as {
            startHour?: number;
            endHour?: number;
          };
          const hour = input.scheduledAt.getHours();
          const startHour = cfg.startHour ?? 23;
          const endHour = cfg.endHour ?? 6;
          if (
            (startHour <= 23 && hour >= startHour) ||
            (endHour >= 0 && hour < endHour)
          ) {
            violations.push({
              ruleId: rule.id,
              ruleName: rule.name,
              message: `深夜帯（${startHour}時〜${endHour}時）の投稿は禁止されています`,
            });
          }
        }
        break;
      }
      case "link": {
        const cfg = rule.configJson as {
          utmSource?: string;
          utmMedium?: string;
        };
        const urlRegex = /https?:\/\/[^\s]+/g;
        const urls = input.text.match(urlRegex) || [];
        if (cfg.utmSource && urls.length > 0) {
          for (const url of urls) {
            if (!url.includes("utm_source")) {
              violations.push({
                ruleId: rule.id,
                ruleName: rule.name,
                message: `URLにUTMパラメータが付与されていません: ${url}`,
              });
            }
          }
        }
        break;
      }
    }
  }

  return {
    passed: violations.length === 0,
    violations,
  };
}
