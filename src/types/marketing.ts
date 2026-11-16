export type MarketingCategory =
  | 'instagram'
  | 'email'
  | 'facebook'
  | 'campaign';

export type NavSection =
  | 'dashboard'
  | 'submit'
  | 'instagram'
  | 'email'
  | 'facebook'
  | 'campaign'
  | 'performance'
  | 'history'
  | 'admin'
  | 'settings';

export interface MemberProfile {
  id: 'member-01' | 'member-02' | 'member-03';
  code: string;
  name: string;
  role: string;
  avatarUrl: string;
}

export interface UploadedScreenshot {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  url: string;
  verificationStatus?: 'pending' | 'real' | 'fake';
  verifiedAt?: string;
}

export interface MarketingSubmission {
  id: string;
  memberId: MemberProfile['id'];
  memberName: string;
  memberEmail?: string;
  submittedById?: string;
  category: MarketingCategory;
  quantity: number;
  description: string;
  screenshots: UploadedScreenshot[];
  submittedAt: string;
}

export interface TeamSettings {
  teamName: string;
  tagline: string;
  dailyActivityTarget: number;
  weeklyActivityTarget: number;
  compactTables: boolean;
}

export interface BootstrapPayload {
  profile?: { id?: string; role?: string; full_name?: string; email?: string } | null;
  members: MemberProfile[];
  submissions: MarketingSubmission[];
  settings: TeamSettings;
}

export interface CategoryMeta {
  id: MarketingCategory;
  label: string;
  shortLabel: string;
  quantityPrompt: string;
  quantityUnit: string;
  descriptionLabel: string;
  descriptionPlaceholder: string;
  accentHex: string;
}

export const BRAND_LOGO_URL =
  '/src/assets/images/sagor_marketing_logo_1794839951382.jpg';

export const CATEGORY_CONFIG: Record<MarketingCategory, CategoryMeta> = {
  instagram: {
    id: 'instagram',
    label: 'Instagram Marketing',
    shortLabel: 'Instagram',
    quantityPrompt: 'How many Instagram marketing activities completed?',
    quantityUnit: 'activities',
    descriptionLabel: 'Activity Description (Optional)',
    descriptionPlaceholder:
      'Describe Reels published, carousel posts, story sequences, or outreach...',
    accentHex: '#EAB308',
  },
  email: {
    id: 'email',
    label: 'Email Marketing',
    shortLabel: 'Email',
    quantityPrompt: 'How many emails sent?',
    quantityUnit: 'emails sent',
    descriptionLabel: 'Campaign Notes (Optional)',
    descriptionPlaceholder:
      'Summarize newsletter segments, drip sequences, or open-rate follow-ups...',
    accentHex: '#38BDF8',
  },
  facebook: {
    id: 'facebook',
    label: 'Facebook Ads',
    shortLabel: 'Facebook Ads',
    quantityPrompt: 'How many Facebook Ads activities completed?',
    quantityUnit: 'ad actions',
    descriptionLabel: 'Ad Management Notes (Optional)',
    descriptionPlaceholder:
      'List ad sets launched, creative tests, audience tweaks, or ROAS optimizations...',
    accentHex: '#60A5FA',
  },
  campaign: {
    id: 'campaign',
    label: 'Running Campaign',
    shortLabel: 'Running Campaign',
    quantityPrompt: 'How many campaigns are running?',
    quantityUnit: 'campaigns',
    descriptionLabel: 'Campaign Details',
    descriptionPlaceholder:
      'Include active campaign names, daily budgets, target KPIs, and current pacing...',
    accentHex: '#34D399',
  },
};

export const CATEGORY_ORDER: MarketingCategory[] = [
  'instagram',
  'email',
  'facebook',
  'campaign',
];

export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const ALLOWED_IMAGE_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/gif',
];
