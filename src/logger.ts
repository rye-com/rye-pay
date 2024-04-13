const IS_LOCALHOST =
  typeof document !== 'undefined' &&
  document.location &&
  ['0.0.0.0', '127.0.0.1', 'localhost'].includes(document.location.hostname);

export class Logger {
  private enabled = IS_LOCALHOST;

  setEnabled(isEnabled: boolean) {
    this.enabled = isEnabled;
  }

  error(...args: any[]) {
    if (this.enabled) {
      console.error('[Rye Pay]', ...args);
    }
  }

  log(...args: any[]) {
    if (this.enabled) {
      console.log('[Rye Pay]', ...args);
    }
  }

  warn(...args: any[]) {
    if (this.enabled) {
      console.warn('[Rye Pay]', ...args);
    }
  }
}
