// P7-B8.1: Dispatches OpenAI function call names to form actions registry.

import { formActions } from './formActionsRegistry';

export async function executeFormAction(
  name: string,
  args: Record<string, unknown>,
): Promise<string> {
  const action = formActions.get(name);
  if (!action) {
    return JSON.stringify({ error: 'unknown_action', message: `Nežinomas veiksmas: ${name}` });
  }

  try {
    return await action(args);
  } catch (err) {
    return JSON.stringify({ error: 'action_failed', message: String(err) });
  }
}
