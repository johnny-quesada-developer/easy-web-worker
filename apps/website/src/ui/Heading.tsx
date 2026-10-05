import type { ReactNode } from 'react';

interface HeadingProps {
  id?: string;
  children: ReactNode;
}

function makeHeading(Tag: 'h2' | 'h3') {
  // Replaces h2/h3 in MDX: the heading text is its own anchor link (reference `.doc-content h2 a`).
  return function Heading({ id, children }: HeadingProps) {
    return <Tag id={id}>{id ? <a href={`#${id}`}>{children}</a> : children}</Tag>;
  };
}

export const H2 = makeHeading('h2');
export const H3 = makeHeading('h3');
