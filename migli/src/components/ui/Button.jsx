import { motion } from 'framer-motion'
import { magneticTap } from '@lib/motion'

/**
 * Premium button. Variants: 'primary' | 'secondary' | 'ghost'.
 * Sizes: 'sm' | 'md' | 'lg'
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  ...rest
}) {
  const sizes = {
    sm: 'text-xs px-5 py-2.5',
    md: 'text-sm px-8 py-3.5',
    lg: 'text-base px-12 py-4',
  }
  const variants = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    ghost:
      'font-display font-semibold tracking-wider2 rounded-full text-white/70 hover:text-aqua-400 transition-colors',
  }
  return (
    <motion.button
      {...magneticTap}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className={`${variants[variant]} ${sizes[size]} ${className}`}
      {...rest}
    >
      {children}
    </motion.button>
  )
}
