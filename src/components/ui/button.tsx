import { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = ({
  children,
  className = "",
  variant = 'primary',
  size = 'md',
  ...props
}: ButtonProps) => {
  const baseStyles = `inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none`;
  
  const variants = {
    primary: `bg-gray-900 text-white hover:bg-gray-700 focus-visible:ring-gray-700`,
    secondary: `bg-gray-100 text-gray-900 hover:bg-gray-200 focus-visible:ring-gray-500`,
    outline: `border border-gray-300 hover:bg-gray-100 focus-visible:ring-gray-500`,
    ghost: `hover:bg-gray-100 focus-visible:ring-gray-500`,
  };
  
  const sizes = {
    sm: `py-1 px-3 text-sm rounded-md`,
    md: `py-2 px-4 text-base rounded-md`,
    lg: `py-3 px-6 text-lg rounded-lg`,
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};