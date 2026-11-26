import React from 'react';
import quashaIcon from '../assets/quasha-icon.png';

export interface QuashaLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
  textClassName?: string;
}

const SIZE_MAP = {
  sm: {
    wrapper: 'gap-2',
    icon: 'h-7 w-7',
    text: 'text-[17px]',
  },
  md: {
    wrapper: 'gap-2.5',
    icon: 'h-8 w-8',
    text: 'text-lg',
  },
  lg: {
    wrapper: 'gap-3',
    icon: 'h-11 w-11',
    text: 'text-2xl',
  },
} as const;

export const QuashaLogo: React.FC<QuashaLogoProps> = ({
  size = 'md',
  showText = true,
  className = '',
  textClassName = '',
}) => {
  const styles = SIZE_MAP[size];

  return (
    <span className={`inline-flex items-center select-none ${styles.wrapper} ${className}`}>
      <span
        className={`inline-flex shrink-0 overflow-hidden rounded-[22%] shadow-sm ${styles.icon}`}
      >
        <img
          src={quashaIcon}
          alt="Quasha"
          className="h-full w-full object-cover"
          draggable={false}
        />
      </span>
      {showText && (
        <span
          className={`font-extrabold tracking-tight leading-none transition-colors ${styles.text} ${textClassName || 'text-current'}`}
        >
          Quasha
        </span>
      )}
    </span>
  );
};

export default QuashaLogo;
