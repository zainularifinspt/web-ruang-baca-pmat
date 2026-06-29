"use client";

import { createContext, useContext, ReactNode } from "react";
import { motion, HTMLMotionProps, Variants } from "framer-motion";

// Context to track if a component is inside a staggered container
const StaggerContext = createContext<boolean>(false);

// Stagger Container Variants
const staggerContainerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.06,
    },
  },
};

// Fade In Variants
const fadeInVariants: Variants = {
  hidden: { 
    opacity: 0, 
    y: 12,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 18,
      mass: 0.8,
    },
  },
};

// Scale In Variants
const scaleInVariants: Variants = {
  hidden: { 
    opacity: 0, 
    scale: 0.96,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 110,
      damping: 16,
    },
  },
};

interface AnimationWrapperProps extends HTMLMotionProps<"div"> {
  children: ReactNode;
}

/**
 * FadeInStagger wraps child elements and animates them sequentially (staggered).
 * Works automatically with <FadeIn> and <ScaleIn> components.
 */
export function FadeInStagger({ children, className, ...props }: AnimationWrapperProps) {
  return (
    <StaggerContext.Provider value={true}>
      <motion.div
        variants={staggerContainerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-40px" }}
        className={className}
        {...props}
      >
        {children}
      </motion.div>
    </StaggerContext.Provider>
  );
}

/**
 * FadeIn slides a component slightly up and fades it in.
 * Inherits stagger timing if placed inside a <FadeInStagger>.
 */
export function FadeIn({ children, className, ...props }: AnimationWrapperProps) {
  const isInStagger = useContext(StaggerContext);

  return (
    <motion.div
      variants={fadeInVariants}
      className={className}
      // Enable standalone animation if not nested inside a FadeInStagger
      {...(!isInStagger && {
        initial: "hidden",
        whileInView: "visible",
        viewport: { once: true, margin: "-40px" },
      })}
      style={{ willChange: "transform, opacity", ...props.style }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/**
 * ScaleIn scales a component from slightly smaller to normal size while fading it in.
 * Inherits stagger timing if placed inside a <FadeInStagger>.
 */
export function ScaleIn({ children, className, ...props }: AnimationWrapperProps) {
  const isInStagger = useContext(StaggerContext);

  return (
    <motion.div
      variants={scaleInVariants}
      className={className}
      // Enable standalone animation if not nested inside a FadeInStagger
      {...(!isInStagger && {
        initial: "hidden",
        whileInView: "visible",
        viewport: { once: true, margin: "-40px" },
      })}
      style={{ willChange: "transform, opacity", ...props.style }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/**
 * Re-exporting MotionDiv for quick, customized motion animations
 */
export function MotionDiv({ children, ...props }: HTMLMotionProps<"div">) {
  return <motion.div {...props}>{children}</motion.div>;
}
