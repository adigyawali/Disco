import { motion, type HTMLMotionProps } from 'framer-motion'
import { cn } from '@renderer/lib/utils'

type Variant = 'primary' | 'ghost' | 'danger'

interface ButtonProps extends HTMLMotionProps<'button'> {
  variant?: Variant
}

/** Tactile button with press-scale microinteraction. */
export function Button({ variant = 'primary', className, children, ...rest }: ButtonProps): JSX.Element {
  const variantClass =
    variant === 'primary'
      ? 'btn-primary'
      : variant === 'danger'
        ? 'btn text-white bg-danger/90 hover:bg-danger'
        : 'btn-ghost'
  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={cn(variantClass, 'disabled:opacity-50 disabled:pointer-events-none no-drag', className)}
      {...rest}
    >
      {children}
    </motion.button>
  )
}
