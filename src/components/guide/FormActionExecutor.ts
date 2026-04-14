// P7-B8.1 / B9: Dispatches OpenAI function call names to form actions registry.
// Wraps every call with analytics timing.

import { formActions } from './formActionsRegistry';
import { analytics } from '../../lib/guideAnalytics';

export async function executeFormAction(
  name: string,
  args: Record<string, unknown>,
): Promise<string> {
  const action = formActions.get(name);
  if (!action) {
    analytics.track('tool_call', { data: { tool: name }, success: false, error: 'unknown_action' });
    return JSON.stringify({ error: 'unknown_action', message: `Nežinomas veiksmas: ${name}` });
  }

  const start = performance.now();
  try {
    const result = await action(args);
    analytics.track('tool_call', {
      data: { tool: name, arg_keys: Object.keys(args) },
      success: true,
      duration_ms: Math.round(performance.now() - start),
    });
    return result;
  } catch (err) {
    analytics.track('tool_call', {
      data: { tool: name },
      success: false,
      error: String(err),
      duration_ms: Math.round(performance.now() - start),
    });
    return JSON.stringify({ error: 'action_failed', message: String(err) });
  }
}
