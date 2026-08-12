'use client';

import { useRef } from 'react';
import gsap from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(SplitText, ScrollTrigger);

interface TextBlockAnimationProps {
  children: React.ReactNode;
  animateOnScroll?: boolean;
  delay?: number;
  blockColor?: string;
  stagger?: number;
  duration?: number;
}

export default function TextBlockAnimation({
  children,
  animateOnScroll = true,
  delay = 0,
  blockColor = '#6366f1',
  stagger = 0.08,
  duration = 0.6,
}: TextBlockAnimationProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const container = containerRef.current;
      if (!container) return;

      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

      let split: SplitText | null = null;
      let timeline: gsap.core.Timeline | null = null;
      let destroyed = false;

      const removeWrappers = (wrappers: HTMLDivElement[]) => {
        wrappers.forEach((wrapper) => wrapper.parentNode?.removeChild(wrapper));
      };

      const clean = (wrappers: HTMLDivElement[]) => {
        timeline?.scrollTrigger?.kill();
        timeline?.kill();
        timeline = null;
        removeWrappers(wrappers);
        split?.revert();
        split = null;
      };

      const wrappers: HTMLDivElement[] = [];

      const create = () => {
        if (destroyed) return;
        clean(wrappers);

        split = new SplitText(container, {
          type: 'lines',
          linesClass: 'block-line-parent',
        });

        const lines = split.lines;
        const blocks: HTMLDivElement[] = [];

        lines.forEach((line) => {
          const wrapper = document.createElement('div');

          wrapper.style.position = 'relative';
          wrapper.style.display = 'block';
          wrapper.style.overflow = 'hidden';

          const block = document.createElement('div');

          block.style.position = 'absolute';
          block.style.top = '0';
          block.style.left = '0';
          block.style.width = '100%';
          block.style.height = '100%';
          block.style.backgroundColor = blockColor;
          block.style.zIndex = '2';
          block.style.transform = 'scaleX(0)';
          block.style.transformOrigin = 'left center';

          line.parentNode?.insertBefore(wrapper, line);

          wrapper.appendChild(line);
          wrapper.appendChild(block);

          gsap.set(line, {
            opacity: 0,
          });

          wrappers.push(wrapper);
          blocks.push(block);
        });

        timeline = gsap.timeline({
          defaults: {
            ease: 'expo.inOut',
          },

          scrollTrigger: animateOnScroll
            ? {
                trigger: container,
                start: 'top 85%',
                toggleActions: 'play none none reverse',
              }
            : undefined,

          delay,
        });

        timeline
          .to(blocks, {
            scaleX: 1,
            duration,
            stagger,
            transformOrigin: 'left center',
          })
          .set(
            lines,
            {
              opacity: 1,
            },
            `<${duration / 2}`,
          )
          .to(
            blocks,
            {
              scaleX: 0,
              duration,
              stagger,
              transformOrigin: 'right center',
            },
            `<${duration * 0.4}`,
          );
      };

      create();

      let resizeTimer: number | undefined;
      const onResize = () => {
        window.clearTimeout(resizeTimer);
        resizeTimer = window.setTimeout(() => {
          if (!destroyed && container.offsetWidth > 0) create();
        }, 160);
      };
      window.addEventListener('resize', onResize);

      document.fonts?.ready
        .then(() => {
          if (!destroyed) {
            clean(wrappers);
            create();
          }
        })
        .catch(() => undefined);

      return () => {
        destroyed = true;
        window.clearTimeout(resizeTimer);
        window.removeEventListener('resize', onResize);
        clean(wrappers);
      };
    },
    {
      scope: containerRef,
      dependencies: [animateOnScroll, delay, blockColor, stagger, duration],
    },
  );

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
      }}
    >
      {children}
    </div>
  );
}