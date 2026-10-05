import { useRef, useState, useEffect, useImperativeHandle, forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export type AIActionVariant =
  | 'generate'
  | 'edit'
  | 'validate'
  | 'explain'
  | 'layout';

export interface AIActionButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  text?: string;
  topDrawerText?: string;
  bottomDrawerText?: string;
  variant?: AIActionVariant;
  loading?: boolean;
  loadingText?: string;
  onAction?: () => Promise<void> | void;
}

const aiActions = {
  generate: {
    text: 'Generate UML',
    topDrawerText: 'from requirements...',
    bottomDrawerText: '...with AI',
  },
  edit: {
    text: 'AI Edit',
    topDrawerText: 'describe changes...',
    bottomDrawerText: '...naturally',
  },
  validate: {
    text: 'Validate UML',
    topDrawerText: 'find diagram issues...',
    bottomDrawerText: '...before export',
  },
  explain: {
    text: 'Explain UML',
    topDrawerText: 'understand your diagram...',
    bottomDrawerText: '...with AI',
  },
  layout: {
    text: 'Auto Layout',
    topDrawerText: 'organize nodes...',
    bottomDrawerText: '...automatically',
  },
} as const;

const cornerPaths = {
  tl: 'M 0,12 L 0,0 L 12,0',
  tr: 'M 28,0 L 40,0 L 40,12',
  bl: 'M 0,28 L 0,40 L 12,40',
  br: 'M 28,40 L 40,40 L 40,28',
} as const;

export const AIActionButton = forwardRef<HTMLButtonElement, AIActionButtonProps>(
  (
    {
      text,
      topDrawerText,
      bottomDrawerText,
      variant = 'generate',
      loading = false,
      loadingText,
      onAction,
      children,
      className,
      disabled,
      'aria-label': ariaLabel,
      ...props
    },
    ref
  ) => {
    const actionConfig = aiActions[variant];
    const mainText = text ?? actionConfig.text;
    const topText = topDrawerText ?? actionConfig.topDrawerText;
    const bottomText = bottomDrawerText ?? actionConfig.bottomDrawerText;

    const [isHovered, setIsHovered] = useState(false);
    const [isPressed, setIsPressed] = useState(false);
    const [isFocusVisible, setIsFocusVisible] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);

    useImperativeHandle(ref, () => buttonRef.current as HTMLButtonElement, []);

    useEffect(() => {
      const button = buttonRef.current;
      if (!button) return;
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          setIsPressed(true);
        }
      };
      const handleKeyUp = (e: KeyboardEvent) => {
        if (e.key === ' ' || e.key === 'Enter') {
          setIsPressed(false);
        }
      };
      button.addEventListener('keydown', handleKeyDown);
      button.addEventListener('keyup', handleKeyUp);
      return () => {
        button.removeEventListener('keydown', handleKeyDown);
        button.removeEventListener('keyup', handleKeyUp);
      };
    }, []);

    const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled || loading) return;
      if (onAction) {
        await onAction();
      }
      if (props.onClick) {
        props.onClick(e);
      }
    };

    const isInteractive = isHovered || isFocusVisible;
    const scale = isPressed ? 0.97 : isInteractive ? 1.02 : 1;

    const displayText = loading ? (loadingText ?? `${mainText}...`) : mainText;

    return (
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled || loading}
        aria-label={ariaLabel ?? mainText}
        aria-busy={loading}
        aria-disabled={disabled || loading}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => { setIsHovered(false); setIsPressed(false); }}
        onFocus={() => setIsFocusVisible(true)}
        onBlur={() => setIsFocusVisible(false)}
        onMouseDown={() => !disabled && !loading && setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        onClick={handleClick}
        className={cn(
          'relative inline-flex items-center justify-center gap-2 overflow-visible',
          'rounded-xl border border-slate-200 bg-white text-slate-900',
          'dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100',
          'shadow-soft transition-all duration-200 ease-out',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:ring-offset-2',
          'disabled:opacity-50 disabled:pointer-events-none',
          'hover:shadow-glow hover:border-indigo-300 dark:hover:border-indigo-700',
          'active:shadow-inner',
          isInteractive && 'shadow-xl',
          loading && 'cursor-wait',
          className
        )}
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'center',
        }}
        {...props}
      >
        <svg
          className="absolute inset-0 pointer-events-none overflow-visible -z-10"
          width="100%"
          height="100%"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <g filter="url(#glow)" className="transition-opacity duration-200" style={{ opacity: isInteractive ? 1 : 0 }}>
            <path
              d={cornerPaths.tl}
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
              className="text-indigo-500 dark:text-indigo-400 transition-all duration-200"
              style={{
                transform: isInteractive ? 'translate(-4px, -4px)' : 'translate(0, 0)',
                transformOrigin: 'top left',
              }}
            />
            <path
              d={cornerPaths.tr}
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
              className="text-indigo-500 dark:text-indigo-400 transition-all duration-200"
              style={{
                transform: isInteractive ? 'translate(4px, -4px)' : 'translate(0, 0)',
                transformOrigin: 'top right',
              }}
            />
            <path
              d={cornerPaths.bl}
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
              className="text-indigo-500 dark:text-indigo-400 transition-all duration-200"
              style={{
                transform: isInteractive ? 'translate(-4px, 4px)' : 'translate(0, 0)',
                transformOrigin: 'bottom left',
              }}
            />
            <path
              d={cornerPaths.br}
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
              className="text-indigo-500 dark:text-indigo-400 transition-all duration-200"
              style={{
                transform: isInteractive ? 'translate(4px, 4px)' : 'translate(0, 0)',
                transformOrigin: 'bottom right',
              }}
            />
          </g>
        </svg>

        <div
          className={cn(
            'relative flex flex-col items-center gap-0.5 px-6 py-3',
            'transition-all duration-200 ease-out',
            isHovered && !loading ? 'px-8' : 'px-6'
          )}
          style={{
            transform: isHovered && !loading ? 'translateY(-1px)' : 'translateY(0)',
          }}
        >
          <span
            className={cn(
              'absolute -top-3 left-1/2 -translate-x-1/2',
              'text-[10px] font-medium tracking-wider uppercase',
              'text-indigo-600 dark:text-indigo-400',
              'opacity-0 pointer-events-none transition-all duration-200',
              'whitespace-nowrap',
              isHovered && !loading ? 'opacity-100 -translate-x-1/2 -translate-y-1' : 'opacity-0'
            )}
          >
            {topText}
          </span>

          <span
            className={cn(
              'relative font-semibold text-sm',
              'transition-all duration-200',
              loading && 'text-indigo-600 dark:text-indigo-400'
            )}
          >
            {displayText}
            {loading && (
              <span className="ml-2 inline-flex h-3.5 w-3.5 animate-spin rounded-full border-1.5 border-current border-t-transparent" aria-hidden="true" />
            )}
          </span>

          <span
            className={cn(
              'absolute -bottom-3 left-1/2 -translate-x-1/2',
              'text-[10px] font-medium tracking-wider uppercase',
              'text-indigo-600 dark:text-indigo-400',
              'opacity-0 pointer-events-none transition-all duration-200',
              'whitespace-nowrap',
              isHovered && !loading ? 'opacity-100 -translate-x-1/2 translate-y-1' : 'opacity-0'
            )}
          >
            {bottomText}
          </span>
        </div>

        {children && (
          <span className="relative flex items-center" aria-hidden="true">
            {children}
          </span>
        )}
      </button>
    );
  }
);

AIActionButton.displayName = 'AIActionButton';

export function createAIActionButtonProps(variant: AIActionVariant, overrides: Partial<AIActionButtonProps> = {}): AIActionButtonProps {
  const config = aiActions[variant];
  return {
    variant,
    text: config.text,
    topDrawerText: config.topDrawerText,
    bottomDrawerText: config.bottomDrawerText,
    ...overrides,
  };
}