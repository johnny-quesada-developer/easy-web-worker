import { Icon } from '../Icon';
import { useDialog } from '../shell/useDialog';
import { DocsSidebar, type NavGroup } from './DocsSidebar';

interface DocsDrawerProps {
  sections: NavGroup[];
  currentId?: string;
}

/** Mobile documentation drawer with the same grouped hierarchy as the desktop sidebar. */
export function DocsDrawer({ sections, currentId }: DocsDrawerProps) {
  const dialog = useDialog('docs');

  return (
    <dialog className="drawer" ref={dialog.ref} aria-label="Documentation navigation" onClose={dialog.onClose} onClick={dialog.onBackdropClick}>
      <div className="mb-5 flex items-center justify-between border-b border-line pb-5">
        <strong className="text-16">Documentation</strong>
        <button
          type="button"
          className="inline-flex h-9 min-w-9 items-center justify-center rounded-[6px] border border-line bg-paper hover:bg-soft"
          aria-label="Close documentation navigation"
          onClick={dialog.close}
        >
          <Icon name="close" />
        </button>
      </div>
      <nav aria-label="Mobile documentation navigation">
        <DocsSidebar sections={sections} currentId={currentId} drawer />
      </nav>
    </dialog>
  );
}
