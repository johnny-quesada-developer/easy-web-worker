import { createGlobalState } from 'react-global-state-hooks';

export type DialogName = 'search' | 'navigation' | 'docs' | null;

/**
 * Which site dialog is open. Header buttons, keyboard shortcuts and the dialogs themselves read and
 * write the same store, so opening one always closes the others.
 */
export const useDialogs = createGlobalState(
  { open: null as DialogName },
  {
    name: '_dialogs',
    actions: {
      show(name: Exclude<DialogName, null>) {
        return ({ setState }) => setState({ open: name });
      },
      hide(name?: Exclude<DialogName, null>) {
        return ({ setState, getState }) => {
          if (name && getState().open !== name) return;
          setState({ open: null });
        };
      },
    },
  },
);
