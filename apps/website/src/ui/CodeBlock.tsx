import { highlight, type CodeLanguage } from '../lib/highlight';
import { Icon } from './Icon';

interface CodeBlockProps {
  code: string;
  lang?: CodeLanguage;
  /** Filename or label in the header row; `terminal` switches the icon. */
  title?: string;
  className?: string;
  /** No line numbers, compact padding (one-line commands). */
  plain?: boolean;
}

/** Build-time syntax highlighting. Rendered to static HTML, never hydrated; the copy control is wired by CopyController. */
export function CodeBlock({ code, lang = 'tsx', title, className = '', plain = false }: CodeBlockProps) {
  const label = title ?? (lang === 'bash' ? 'terminal' : lang);
  const terminal = label === 'terminal' || lang === 'bash';

  return (
    <figure className={`code-block ${plain ? 'code-block--plain' : ''} ${className}`.trim()}>
      <div className="code-head">
        <span>
          <Icon name={terminal ? 'terminal' : 'code'} />
          {label}
        </span>
        <button type="button" className="copy-button" data-copy={code.trimEnd()} aria-label={`Copy ${label}`}>
          <Icon name="copy" />
        </button>
      </div>
      <div dangerouslySetInnerHTML={{ __html: highlight(code, lang) }} />
    </figure>
  );
}
