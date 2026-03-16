import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  as?: 'button' | 'span';
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  icon,
  as = 'button',
  className = '',
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "border border-[var(--dt-accent-border)] bg-primary text-white shadow-glow hover:bg-accent hover:border-amber-400/40 focus:ring-primary",
    secondary: "border border-slate-700 bg-surface/95 text-slate-200 hover:border-slate-600 hover:bg-slate-800 focus:ring-slate-500",
    danger: "border border-red-500/30 bg-red-500/90 text-white hover:bg-red-400 focus:ring-red-500",
    ghost: "text-slate-400 hover:text-slate-100 hover:bg-slate-800/70 focus:ring-transparent"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base"
  };

  const combinedClassName = `${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`;

  if (as === 'span') {
    return (
      <span className={combinedClassName}>
        {icon && <span className="mr-2">{icon}</span>}
        {children}
      </span>
    );
  }

  return (
    <button 
      className={combinedClassName}
      {...props}
    >
      {icon && <span className="mr-2">{icon}</span>}
      {children}
    </button>
  );
};
