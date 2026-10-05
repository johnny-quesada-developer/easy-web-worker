import { useEffect } from 'react';
import { announce, useToast } from '../../state/toast';
import { ICONS } from '../Icon';

const svg = (name: 'copy' | 'check') =>
  `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="${ICONS[name]}"/></svg>`;

/** Copies `data-copy` text with truthful feedback; the fallback selects nothing silently. */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }

    const area = document.createElement('textarea');
    area.value = text;
    area.style.cssText = 'position:fixed;left:-9999px';
    document.body.append(area);
    area.select();
    const copied = document.execCommand('copy');
    area.remove();
    return copied;
  } catch {
    return false;
  }
}

/**
 * One island for every copy control on the page (`[data-copy]` buttons from code blocks are static HTML)
 * and the shared toast. Click handling is delegated so it costs one listener, not one island per block.
 */
export function CopyController() {
  const [toast] = useToast();

  useEffect(() => {
    const onClick = async (event: MouseEvent) => {
      const button = (event.target as HTMLElement).closest<HTMLButtonElement>('button[data-copy]');
      if (!button) return;

      const copied = await copyText(button.dataset.copy ?? '');
      if (!copied) {
        announce('Clipboard unavailable. Select the code and copy it manually.');
        return;
      }

      const isCommand = /^(npm|npx|yarn|pnpm|bun) /.test(button.dataset.copy ?? '');
      announce(isCommand ? 'Install command copied.' : 'Copied to clipboard');

      if (button.classList.contains('copy-button')) {
        const label = button.getAttribute('aria-label');
        button.innerHTML = svg('check');
        button.setAttribute('aria-label', 'Copied');
        setTimeout(() => {
          if (!button.isConnected) return;
          button.innerHTML = svg('copy');
          if (label) button.setAttribute('aria-label', label);
        }, 1800);
      }
    };

    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  return (
    <div className={`toast ${toast.shown ? 'show' : ''}`} role="status" aria-live="polite">
      {toast.message}
    </div>
  );
}
