import { useEffect, useRef, type MouseEvent } from 'react';
import { useDialogs, type DialogName } from '../../state/dialogs';

/**
 * Binds a native `<dialog>` to the shared dialogs store: `showModal` while this name is open,
 * `data-dialog="<name>"` buttons anywhere on the page open it, Escape and backdrop clicks close it,
 * and the body stops scrolling while it is open. Native modal dialogs trap focus and restore it.
 */
export function useDialog(name: Exclude<DialogName, null>) {
  const [open, actions] = useDialogs((state) => state.open === name);
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    if (open && !element.open) element.showModal();
    if (!open && element.open) element.close();
    document.body.classList.toggle('dialog-open', useDialogs.getState().open !== null);
  }, [open]);

  useEffect(() => {
    const onClick = (event: Event) => {
      const trigger = (event.target as HTMLElement).closest<HTMLElement>(`[data-dialog="${name}"]`);
      if (!trigger) return;
      event.preventDefault();
      actions.show(name);
    };

    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [name, actions]);

  const onClose = () => actions.hide(name);

  const onBackdropClick = (event: MouseEvent<HTMLDialogElement>) => {
    const dialog = ref.current;
    if (!dialog || event.target !== dialog) return;

    const rect = dialog.getBoundingClientRect();
    const outside =
      event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom;
    if (outside) dialog.close();
  };

  return { ref, open, show: () => actions.show(name), close: () => ref.current?.close(), onClose, onBackdropClick };
}
