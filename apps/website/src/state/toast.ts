import { createGlobalState } from 'react-global-state-hooks';

/** One shared status toast (copy feedback, resets, motion changes). Dismisses itself after 2.6 s. */
export const useToast = createGlobalState(
  { message: '', shown: false, version: 0 },
  {
    name: '_toast',
    metadata: { timer: null as ReturnType<typeof setTimeout> | null },
    actions: {
      announce(message: string) {
        return (tools) => {
          const { setState, setMetadata } = tools;
          if (tools.metadata.timer) clearTimeout(tools.metadata.timer);

          setState((state) => ({ message, shown: true, version: state.version + 1 }));
          setMetadata({ timer: setTimeout(() => setState((state) => ({ ...state, shown: false })), 2600) });
        };
      },
    },
  },
);

export const announce = (message: string) => useToast.actions.announce(message);
