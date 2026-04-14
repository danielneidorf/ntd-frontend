// P7-B8.1: Module-level singleton registry for cross-island form actions.
// QuickScanFlow (island 1) registers handlers; AIGuide (island 2) reads them.
// ESM modules are singletons within a page bundle, so both islands share this instance.

type FormAction = (args: Record<string, unknown>) => string | Promise<string>;

type Listener = () => void;

class FormActionsRegistry {
  private actions = new Map<string, FormAction>();
  private listeners = new Set<Listener>();

  register(name: string, action: FormAction): void {
    this.actions.set(name, action);
    this.notify();
  }

  unregister(name: string): void {
    if (this.actions.delete(name)) {
      this.notify();
    }
  }

  get(name: string): FormAction | undefined {
    return this.actions.get(name);
  }

  has(name: string): boolean {
    return this.actions.has(name);
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }
}

export const formActions = new FormActionsRegistry();
export type { FormAction };
