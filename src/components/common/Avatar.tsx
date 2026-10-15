import React from 'react';

interface AvatarProps {
  name: string;
  src?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ name, src, size = 'md', className = '' }) => {
  const [imgError, setImgError] = React.useState(false);

  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base font-semibold',
    xl: 'w-16 h-16 text-lg font-bold',
  }[size];

  // Generate deterministic subtle colors for avatar background
  const getInitials = (n: string) => {
    const parts = n.trim().split(/\s+/);
    if (!parts.length || !parts[0]) return '?';
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const colors = [
    'bg-[#23272F] text-[#8FAF9A] border-[#374151]',
    'bg-[#28252E] text-[#D8B4E2] border-[#443852]',
    'bg-[#1F292B] text-[#82B99A] border-[#2E453C]',
    'bg-[#2D2821] text-[#E5C07B] border-[#4A3D28]',
    'bg-[#222733] text-[#93B5E1] border-[#32435E]',
  ];

  const colorIndex =
    Math.abs(
      name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    ) % colors.length;

  if (src && !imgError) {
    return (
      <img
        src={src}
        alt={name}
        onError={() => setImgError(true)}
        className={`rounded-full object-cover shrink-0 border border-[#2B2F36] ${sizeClasses} ${className}`}
      />
    );
  }

  return (
    <div
      className={`rounded-full flex items-center justify-center font-medium shrink-0 border select-none ${colors[colorIndex]} ${sizeClasses} ${className}`}
      title={name}
    >
      {getInitials(name)}
    </div>
  );
};
