import { config } from '../config';

export function loadSpreedly() {
  // If developer loaded Spreedly themselves, then let's just use that
  const spreedly = tryGetSpreedly();
  if (spreedly) {
    return Promise.resolve(spreedly);
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    document.head.appendChild(script);

    script.onerror = (error) => {
      reject(error);
    };
    script.onload = () => {
      const spreedly = tryGetSpreedly();
      if (!spreedly) {
        // In what circumstances can this occur?
        return reject(new Error('Spreedly not loaded correctly.'));
      }

      resolve(spreedly);
    };

    // Trigger script loading
    script.src = config.spreedlyScriptUrl;
  });
}

export function tryGetSpreedly() {
  return (globalThis as any).Spreedly;
}
