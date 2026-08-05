import { Loader2 } from "lucide-react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  children: React.ReactNode;
}

const variantClass = {
  primary: "bg-[#1A4329] text-white hover:bg-[#163a23] disabled:opacity-50",
  outline: "border border-[#1A4329] text-[#1A4329] hover:bg-green-50 disabled:opacity-50",
  ghost:   "text-gray-600 hover:bg-gray-100 disabled:opacity-50",
  danger:  "text-red-600 hover:bg-red-50 disabled:opacity-50",
};

const sizeClass = {
  sm:  "px-3 py-1.5 text-xs",
  md:  "px-5 py-2 text-sm",
  lg:  "px-6 py-2.5 text-sm",
};

const Button = ({
  variant = "primary",
  size = "md",
  loading = false,
  children,
  className = "",
  disabled,
  ...props
}: ButtonProps) => (
  <button
    {...props}
    disabled={disabled || loading}
    className={`inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all ${variantClass[variant]} ${sizeClass[size]} ${className}`}
  >
    {loading && <Loader2 size={14} className="animate-spin" />}
    {children}
  </button>
);

export default Button;
