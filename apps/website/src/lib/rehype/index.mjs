/**
 * Small rehype plugins that give MDX output the reference document structure:
 * - fenced code becomes a `.code-block` panel with a header row and a copy control
 * - tables scroll inside a `.table-wrap`
 * - a `symptoms: true` article groups each h2 and its content into a `.symptom` disclosure
 */
import { visit } from 'unist-util-visit';

const ICON = {
  code: 'm8 6-6 6 6 6m8-12 6 6-6 6M14 3l-4 18',
  terminal: 'm4 6 5 5-5 5m9 1h7',
  copy: 'M9 9h11v12H9zM15 9V3H3v12h6',
};

const icon = (name, className = 'icon') => ({
  type: 'element',
  tagName: 'svg',
  properties: { className: [className], viewBox: '0 0 24 24', ariaHidden: 'true' },
  children: [{ type: 'element', tagName: 'path', properties: { d: ICON[name] }, children: [] }],
});

const toString = (node) =>
  node.type === 'text' ? node.value : (node.children ?? []).map(toString).join('');

const LANG_LABEL = { bash: 'terminal', sh: 'terminal', shell: 'terminal' };

export function rehypeCodeBlocks() {
  return (tree) => {
    visit(tree, 'element', (node, index, parent) => {
      if (node.tagName !== 'pre' || !parent || index === null) return;
      if (parent.type === 'element' && parent.properties?.className?.includes?.('code-block')) return;

      const code = node.children.find((child) => child.type === 'element' && child.tagName === 'code');
      const lang = String(node.properties?.dataLanguage ?? code?.properties?.className?.[0] ?? '').replace('language-', '');
      const isTerminal = LANG_LABEL[lang] === 'terminal';
      const label = node.properties?.dataTitle ?? (isTerminal ? 'terminal' : lang || 'code');
      const text = code ? toString(code) : toString(node);

      parent.children[index] = {
        type: 'element',
        tagName: 'figure',
        properties: { className: ['code-block'] },
        children: [
          {
            type: 'element',
            tagName: 'div',
            properties: { className: ['code-head'] },
            children: [
              {
                type: 'element',
                tagName: 'span',
                properties: {},
                children: [icon(isTerminal ? 'terminal' : 'code'), { type: 'text', value: String(label) }],
              },
              {
                type: 'element',
                tagName: 'button',
                properties: {
                  type: 'button',
                  className: ['copy-button'],
                  dataCopy: text.trimEnd(),
                  ariaLabel: `Copy ${label}`,
                },
                children: [icon('copy')],
              },
            ],
          },
          node,
        ],
      };
    });
  };
}

export function rehypeTableWrap() {
  return (tree) => {
    visit(tree, 'element', (node, index, parent) => {
      if (node.tagName !== 'table' || !parent || index === null) return;
      if (parent.type === 'element' && parent.properties?.className?.includes?.('table-wrap')) return;

      parent.children[index] = {
        type: 'element',
        tagName: 'div',
        properties: { className: ['table-wrap'] },
        children: [node],
      };
    });
  };
}

export function rehypeSymptoms() {
  return (tree, file) => {
    if (!file.data?.astro?.frontmatter?.symptoms) return;

    const groups = [];
    const rest = [];
    let current = null;

    for (const child of tree.children) {
      if (child.type === 'element' && child.tagName === 'h2') {
        current = { heading: child, body: [] };
        groups.push(current);
      } else if (current) {
        current.body.push(child);
      } else {
        rest.push(child);
      }
    }

    if (!groups.length) return;

    tree.children = [
      ...rest,
      ...groups.map(({ heading, body }, index) => ({
        type: 'element',
        tagName: 'details',
        properties: { className: ['symptom'], id: heading.properties?.id, open: index === 0 ? true : undefined },
        children: [
          {
            type: 'element',
            tagName: 'summary',
            properties: {},
            children: [
              {
                ...heading,
                properties: { className: ['m-0', 'text-14', 'font-[550]', 'tracking-normal'] },
              },
            ],
          },
          { type: 'element', tagName: 'div', properties: {}, children: body },
        ],
      })),
    ];
  };
}
