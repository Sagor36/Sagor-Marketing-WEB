import { useState } from 'react';
import { MemberProfile } from '../types/marketing';

interface MemberAvatarProps {
  member: MemberProfile;
  size?: 'sm' | 'md' | 'lg';
}

const SIZE_MAP = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-11 w-11 text-sm',
  lg: 'h-14 w-14 text-base',
};

export function MemberAvatar({ member, size = 'md' }: MemberAvatarProps) {
  const [imgFailed, setImgFailed] = useState(false);

  if (imgFailed || !member.avatarUrl) {
    const initials = member.name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

    return (
      <div
        className={`${SIZE_MAP[size]} rounded-full bg-[#182947] border border-[#EAB308]/35 text-[#FACC15] font-display font-bold flex items-center justify-center shrink-0`}
      >
        {initials || 'M'}
      </div>
    );
  }

  return (
    <img
      src={member.avatarUrl}
      alt={member.name}
      referrerPolicy="no-referrer"
      onError={() => setImgFailed(true)}
      className={`${SIZE_MAP[size]} rounded-full object-cover border border-[#EAB308]/35 bg-[#111E36] shrink-0`}
    />
  );
}
