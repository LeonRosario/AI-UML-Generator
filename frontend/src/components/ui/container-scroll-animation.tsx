import { forwardRef, useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';

export interface ContainerScrollProps {
  titleComponent: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  cardHeight?: number;
  scrollHeight?: number;
}

export const ContainerScroll = forwardRef<HTMLDivElement, ContainerScrollProps>(
  (
    {
      titleComponent,
      children,
      className = '',
      cardHeight = 600,
      scrollHeight = 2000,
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
      target: containerRef,
      offset: ['start start', 'end start'],
    });
    const reducedMotion = useReducedMotion();
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
      const checkMobile = () => setIsMobile(window.innerWidth < 768);
      checkMobile();
      window.addEventListener('resize', checkMobile);
      return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const responsiveCardHeight = isMobile ? Math.min(cardHeight, 400) : cardHeight;
    const responsiveScrollHeight = isMobile ? Math.min(scrollHeight, 1200) : scrollHeight;
    const responsiveMaxWidth = isMobile ? '100%' : 1000;
    const responsivePerspective = isMobile ? 800 : 1000;
    const responsiveRotateX = reducedMotion ? [0, 0] : isMobile ? [15, 0] : [30, 0];
    const responsiveScale = reducedMotion ? [1, 1] : isMobile ? [0.92, 1] : [0.85, 1];
    const responsiveTranslateY = reducedMotion ? [0, 0] : isMobile ? [80, 0] : [150, 0];

    const rotateX = useTransform(scrollYProgress, [0, 1], responsiveRotateX);
    const scale = useTransform(scrollYProgress, [0, 1], responsiveScale);
    const translateY = useTransform(scrollYProgress, [0, 1], responsiveTranslateY);
    const titleTranslateY = useTransform(scrollYProgress, [0, 0.5, 1], [0, -100, -200]);
    const titleOpacity = useTransform(scrollYProgress, [0, 0.5, 1], [1, 0.5, 0]);

    return (
      <motion.div
        ref={containerRef}
        style={{
          height: responsiveScrollHeight,
          position: 'relative',
        }}
        className={className}
      >
        <div className="relative z-10">
          <motion.div
            style={{
              y: titleTranslateY,
              opacity: titleOpacity,
            }}
            className="mx-auto max-w-3xl text-center px-4"
          >
            {titleComponent}
          </motion.div>
        </div>

        <motion.div
          style={{
            position: 'sticky',
            top: 0,
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            perspective: responsivePerspective,
            padding: isMobile ? '1rem' : 0,
          }}
        >
          <motion.div
            ref={ref}
            style={{
              rotateX,
              scale,
              y: translateY,
              transformOrigin: 'center center',
              width: '100%',
              maxWidth: responsiveMaxWidth,
              height: responsiveCardHeight,
              borderRadius: 16,
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)',
            }}
            className="relative w-full"
          >
            <div className="absolute inset-0 bg-white rounded-xl border border-slate-200">
              {children}
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    );
  }
);

ContainerScroll.displayName = 'ContainerScroll';