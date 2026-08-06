import type { CSSProperties } from "react";
interface AvatarProps {
  username?: string;
  src?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  style?: CSSProperties;
}

const sizeMap = {
  xs: "w-6 h-6 text-[10px]",
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-16 h-16 text-xl",
  xl: "w-20 h-20 text-3xl",
};

const Avatar = ({ username, src, size = "md", className = "" }: AvatarProps) => {
  const letter = username?.[0]?.toUpperCase() ?? "?";
  const sizeClass = sizeMap[size];

  if (src) {
    return (
      <img
        src={src}
        alt={username}
        className={`rounded-full object-cover shrink-0 ${sizeClass} ${className}`}
      />
    );
  }

  return (
    <div
      className={`rounded-full bg-[#1A4329] flex items-center justify-center text-white font-bold shrink-0 ${sizeClass} ${className}`}
    >
      {letter}
    </div>
  );
};

export default Avatar;
