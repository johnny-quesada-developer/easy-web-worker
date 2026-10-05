import type { ComponentPropsWithoutRef } from 'react';
import { tv, type VariantProps } from '../lib/tv';
import { Icon, type IconName } from './Icon';

export const button = tv({
  base: 'inline-flex min-h-[42px] items-center justify-center gap-[10px] rounded-control border border-[#dbe1dc] bg-paper px-4 py-[10px] text-13 leading-[1.3] font-[550] whitespace-nowrap text-ink transition-[background,border-color,transform] duration-[180ms] hover:border-[#b4c1b8] hover:bg-soft max-md:text-12 dark:border-line dark:hover:border-line',
  variants: {
    variant: {
      default: '',
      primary: 'border-ink bg-ink text-on-ink hover:border-[#354239] hover:bg-[#354239] hover:text-on-ink dark:hover:border-ink/85 dark:hover:bg-ink/85',
      ghost: 'border-transparent bg-transparent hover:border-transparent hover:bg-soft',
    },
    size: {
      default: '',
      small: 'min-h-[34px] px-3 py-2 text-12',
    },
  },
  defaultVariants: { variant: 'default', size: 'default' },
});

type Variants = VariantProps<typeof button>;

type ButtonLinkProps = ComponentPropsWithoutRef<'a'> & Variants & { icon?: IconName };

/** A link styled as a button. `icon` adds the trailing reference glyph (arrow, external, ...). */
export function ButtonLink({ variant, size, className, icon, children, ...props }: ButtonLinkProps) {
  return (
    <a className={button({ variant, size, className })} {...props}>
      {children}
      {icon && <Icon name={icon} />}
    </a>
  );
}

type ButtonProps = ComponentPropsWithoutRef<'button'> & Variants & { icon?: IconName; iconBefore?: IconName };

export function Button({ variant, size, className, icon, iconBefore, children, type = 'button', ...props }: ButtonProps) {
  return (
    <button type={type} className={button({ variant, size, className })} {...props}>
      {iconBefore && <Icon name={iconBefore} />}
      {children}
      {icon && <Icon name={icon} />}
    </button>
  );
}

export const textLink = tv({
  base: 'inline-flex items-center gap-2 text-13 font-[550] text-green hover:underline hover:underline-offset-[5px]',
});

type TextLinkProps = ComponentPropsWithoutRef<'a'> & { icon?: IconName | null };

export function TextLink({ className, icon = 'arrow', children, ...props }: TextLinkProps) {
  return (
    <a className={textLink({ className })} {...props}>
      {children}
      {icon && <Icon name={icon} />}
    </a>
  );
}

export const iconButton = tv({
  base: 'inline-flex h-9 min-w-9 items-center justify-center rounded-[6px] border border-line bg-paper text-ink hover:bg-soft',
});

type IconButtonProps = ComponentPropsWithoutRef<'button'> & { name: IconName; label: string };

export function IconButton({ name, label, className, type = 'button', ...props }: IconButtonProps) {
  return (
    <button type={type} className={iconButton({ className })} aria-label={label} {...props}>
      <Icon name={name} />
    </button>
  );
}
