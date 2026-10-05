import { createTV } from 'tailwind-variants';

/** tailwind-variants with the pixel font-size scale registered, so `text-13` is merged as a size, not a colour. */
export const tv = createTV({
  twMergeConfig: {
    extend: {
      classGroups: {
        'font-size': [{ text: ['8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '22', '24', '26', '30', '32', '38', '45'] }],
      },
    },
  },
});

export type { VariantProps } from 'tailwind-variants';
