import { useState } from 'react';
import { TrendingUp } from 'lucide-react';
import { BRAND_LOGO_URL } from '../types/marketing';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const SIZE_CLASSES: Record<NonNullable<BrandLogoProps['size']>, string> = {
  sm: 'h-9 w-9 rounded-lg',
  md: 'h-11 w-11 rounded-xl',
  lg: 'h-16 w-16 rounded-2xl',
  xl: 'h-32 w-32 rounded-2xl',
};

export function BrandLogo({ size = 'md', className = '' }: BrandLogoProps) {
  const [imgError, setImgError] = useState(false);

  if (imgError) {
    return (
      <div
        className={`${SIZE_CLASSES[size]} flex items-center justify-center bg-gradient-to-br from-[#111E36] to-[#0B1528] border border-[#EAB308]/40 text-[#EAB308] shrink-0 ${className}`}
        aria-label="SAGOR MARKETING TEAM logo"
      >
        <TrendingUp className="w-1/2 h-1/2" strokeWidth={2.2} />
      </div>
    );
  }

  return (
    <img
      src={BRAND_LOGO_URL}
      alt="SAGOR MARKETING TEAM logo"
      referrerPolicy="no-referrer"
      onError={() => setImgError(true)}
      className={`${SIZE_CLASSES[size]} object-cover border border-[#EAB308]/35 bg-[#0B1528] shrink-0 select-none ${className}`}
    />
  );
}
