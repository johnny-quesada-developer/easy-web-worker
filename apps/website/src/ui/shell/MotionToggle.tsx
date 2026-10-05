import { useMotion, useReducedMotion } from '../../state/motion';
import { announce } from '../../state/toast';
import { Icon } from '../Icon';

/** Footer control that overrides the motion preference for this visit. */
export function MotionToggle() {
  const reduced = useReducedMotion();
  const actions = useMotion.actions;

  const toggle = () => {
    actions.toggle();
    announce(!reduced ? 'Reduced motion enabled. Use manual sequence controls.' : 'Motion enabled.');
  };

  return (
    <button
      type="button"
      className="inline-flex min-h-6 items-center gap-2 text-12 font-[550] text-green hover:underline hover:underline-offset-[5px]"
      aria-pressed={reduced}
      onClick={toggle}
    >
      <Icon name="sliders" />
      {reduced ? 'Reduced motion on' : 'Reduce motion'}
    </button>
  );
}
