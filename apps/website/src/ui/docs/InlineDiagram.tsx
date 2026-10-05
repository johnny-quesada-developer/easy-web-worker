import { Icon } from '../Icon';
import { MiniNode } from '../Panel';

interface FlowNode {
  label: string;
  tone?: 'plain' | 'accent' | 'blue';
}

interface FlowDiagramProps {
  nodes: FlowNode[];
  caption: string;
}

/** A left-to-right flow of framed labels (reference `.doc-diagram .flow-inline`). */
export function FlowDiagram({ nodes, caption }: FlowDiagramProps) {
  return (
    <div className="doc-diagram">
      <div className="flex flex-wrap items-center justify-center gap-3 max-md:gap-[7px]">
        {nodes.map((node, index) => (
          <span className="contents" key={node.label}>
            {index > 0 && <Icon name="arrow" className="max-md:size-3" />}
            <MiniNode tone={node.tone} className="min-h-[60px] flex-1 justify-center text-center text-10 max-md:px-[7px] max-md:py-[9px] max-md:text-9">
              {node.label}
            </MiniNode>
          </span>
        ))}
      </div>
      <p className="mt-[18px] mb-0 text-center text-10 text-muted">{caption}</p>
    </div>
  );
}

interface PairDiagramProps {
  left: { title: string; detail: string };
  right: { title: string; detail: string };
  caption: string;
}

/** Two independent instances side by side (reference scoped-state diagram). */
export function PairDiagram({ left, right, caption }: PairDiagramProps) {
  return (
    <div className="doc-diagram">
      <div className="grid grid-cols-2 gap-8 max-md:grid-cols-1 max-md:gap-3">
        <MiniNode tone="accent" className="block text-center">
          {left.title}
          <br />
          <span className="text-13">{left.detail}</span>
        </MiniNode>
        <MiniNode tone="blue" className="block text-center">
          {right.title}
          <br />
          <span className="text-13">{right.detail}</span>
        </MiniNode>
      </div>
      <p className="mt-[18px] mb-0 text-center text-10 text-muted">{caption}</p>
    </div>
  );
}
