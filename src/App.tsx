import { useCallback, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase, apiFetch, isSupabaseConfigured } from './lib_supabase';
import { AuthScreen } from './components/AuthScreen';
import {
  LayoutDashboard,
  ClipboardCheck,
  Instagram,
  Mail,
  Megaphone,
  Rocket,
  BarChart3,
  History,
  ShieldCheck,
  Settings,
  Menu,
  X,
  Plus,
  RefreshCw,
  LogOut,
} from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import {
  BootstrapPayload,
  MarketingSubmission,
  MemberProfile,
  NavSection,
  TeamSettings,
  UploadedScreenshot,
} from './types/marketing';
import { BrandLogo } from './components/BrandLogo';
import { LoadingScreen } from './components/LoadingScreen';
import { ToastContainer, ToastMessage } from './components/ToastContainer';
import { ScreenshotLightbox } from './components/ScreenshotLightbox';
import { DashboardView } from './components/DashboardView';
import { SubmitWorkView } from './components/SubmitWorkView';
import { PerformanceView } from './components/PerformanceView';
import { HistoryView } from './components/HistoryView';
import { AdminView } from './components/AdminView';
import { SettingsView } from './components/SettingsView';

const NAV_ITEMS: Array<{
  id: NavSection;
  label: string;
  icon: typeof LayoutDashboard;
}> = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'submit', label: 'Submit Marketing Work', icon: ClipboardCheck },
  { id: 'instagram', label: 'Instagram Marketing', icon: Instagram },
  { id: 'email', label: 'Email Marketing', icon: Mail },
  { id: 'facebook', label: 'Facebook Ads', icon: Megaphone },
  { id: 'campaign', label: 'Running Campaign', icon: Rocket },
  { id: 'performance', label: 'Team Performance', icon: BarChart3 },
  { id: 'history', label: 'Submission History', icon: History },
  { id: 'admin', label: 'Admin Panel', icon: ShieldCheck },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const ADMIN_ONLY_SECTIONS = new Set<NavSection>([
  'instagram', 'email', 'facebook', 'campaign', 'performance', 'admin', 'settings',
]);

const DEFAULT_MEMBERS: MemberProfile[] = [
  {
    id: 'member-01',
    code: 'Member 01',
    name: 'Member 01',
    role: 'Instagram & Content Strategist',
    avatarUrl: '/src/assets/images/member_avatar_01_1794839952270.jpg',
  },
  {
    id: 'member-02',
    code: 'Member 02',
    name: 'Member 02',
    role: 'Email & Lifecycle Specialist',
    avatarUrl: '/src/assets/images/member_avatar_02_1794839951915.jpg',
  },
  {
    id: 'member-03',
    code: 'Member 03',
    name: 'Member 03',
    role: 'Facebook Ads & Campaign Lead',
    avatarUrl: '/src/assets/images/member_avatar_03_1794839953403.jpg',
  },
];

const DEFAULT_SETTINGS: TeamSettings = {
  teamName: 'SAGOR MARKETING TEAM',
  tagline: 'Grow Together • Achieve More',
  dailyActivityTarget: 50,
  weeklyActivityTarget: 250,
  compactTables: false,
};

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [showIntro, setShowIntro] = useState(true);
  const [isDataReady, setIsDataReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [activeSection, setActiveSection] = useState<NavSection>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [members, setMembers] = useState<MemberProfile[]>(DEFAULT_MEMBERS);
  const [selectedMemberId, setSelectedMemberId] =
    useState<MemberProfile['id']>('member-01');
  const [submissions, setSubmissions] = useState<MarketingSubmission[]>([]);
  const [settings, setSettings] = useState<TeamSettings>(DEFAULT_SETTINGS);

  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [lightboxState, setLightboxState] = useState<{
    screenshots: UploadedScreenshot[];
    index: number;
    title: string;
  } | null>(null);

  const notify = useCallback(
    (type: ToastMessage['type'], title: string, message: string) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev, { id, type, title, message }]);
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4500);
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const loadBootstrap = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const response = await apiFetch('/api/bootstrap');
      if (!response.ok) {
        throw new Error('Failed to load workspace data from server.');
      }
      const data = (await response.json()) as BootstrapPayload;
      const adminAccount = data.profile?.role === 'admin';
      setMembers(adminAccount ? data.members : data.members.slice(0, 1).map((m) => ({ ...m, code: 'My Account', name: data.profile?.full_name || 'My Account' })));
      setIsAdmin(adminAccount);
      setAdminEmail(data.profile?.role === 'admin' ? (data.profile.email || '') : '');
      setSubmissions(data.submissions);
      setSettings(data.settings);
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : 'Unable to connect to server.'
      );
    } finally {
      setIsLoading(false);
      setIsDataReady(true);
    }
  }, []);

  useEffect(() => {
    let alive = true;
    supabase.auth.getSession().then(({ data }) => { if (alive) { setSession(data.session); setAuthReady(true); } });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => { setSession(nextSession); setAuthReady(true); });
    return () => { alive = false; listener.subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (session) loadBootstrap();
  }, [session, loadBootstrap]);

  useEffect(() => {
    if (!isAdmin && ADMIN_ONLY_SECTIONS.has(activeSection)) {
      setActiveSection('dashboard');
    }
  }, [isAdmin, activeSection]);

  const activeMember =
    members.find((m) => m.id === selectedMemberId) || members[0];
  const currentNavItem =
    NAV_ITEMS.find((n) => n.id === activeSection) || NAV_ITEMS[0];

  const handleNavigate = (section: NavSection) => {
    setActiveSection(section);
    setMobileMenuOpen(false);
  };

  const handleInspectScreenshots = (
    screenshots: UploadedScreenshot[],
    index: number,
    title: string
  ) => {
    setLightboxState({ screenshots, index, title });
  };

  if (!authReady) return <div className="min-h-screen bg-[#070E1A] grid place-items-center text-slate-300">Loading secure workspace…</div>;
  if (!session) return <AuthScreen />;

  return (
    <div className="min-h-screen bg-[#070E1A] text-slate-100 flex">
      {/* Animated Brand Loading Screen */}
      <AnimatePresence>
        {showIntro && (
          <LoadingScreen
            isDataReady={isDataReady}
            onComplete={() => setShowIntro(false)}
          />
        )}
      </AnimatePresence>

      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:flex lg:w-[272px] lg:flex-col lg:fixed lg:inset-y-0 bg-[#0B1528] border-r border-white/10 z-30">
        <div className="px-5 py-5 border-b border-white/10 flex items-center gap-3.5">
          <BrandLogo size="md" />
          <div className="min-w-0">
            <p className="font-display text-sm font-bold tracking-tight text-white leading-tight truncate">
              SAGOR MARKETING TEAM
            </p>
            <p className="text-[11px] text-[#FACC15] mt-0.5 truncate">
              Grow Together • Achieve More
            </p>
          </div>
        </div>

        <nav
          className="flex-1 overflow-y-auto px-3.5 py-5 space-y-1"
          aria-label="Primary sidebar navigation"
        >
          {NAV_ITEMS.filter((item) => !ADMIN_ONLY_SECTIONS.has(item.id) || isAdmin).map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavigate(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-[#EAB308] text-[#070E1A] font-semibold'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-[#070E1A]' : 'text-[#FACC15]'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="px-5 py-4 border-t border-white/10">
          <p className="text-xs font-medium text-white truncate">
            {activeMember.name}
          </p>
          <p className="text-[11px] text-slate-400 truncate mt-0.5">
            {activeMember.role}
          </p>
        </div>
      </aside>

      {/* Mobile Drawer Sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative w-72 max-w-[85vw] bg-[#0B1528] border-r border-white/10 flex flex-col z-50">
            <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <BrandLogo size="sm" />
                <span className="font-display text-sm font-bold text-white truncate">
                  SAGOR MARKETING TEAM
                </span>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-lg text-slate-400 hover:text-white"
                aria-label="Close navigation menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-3.5 py-4 space-y-1">
              {NAV_ITEMS.filter((item) => !ADMIN_ONLY_SECTIONS.has(item.id) || isAdmin).map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNavigate(item.id)}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-[#EAB308] text-[#070E1A] font-semibold'
                        : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive ? 'text-[#070E1A]' : 'text-[#FACC15]'
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-[272px] flex flex-col min-w-0">
        {/* Top Header */}
        <header className="sticky top-0 z-20 bg-[#070E1A]/90 backdrop-blur-md border-b border-white/10">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden p-2 rounded-xl bg-[#0B1528] border border-white/10 text-slate-200 hover:border-[#EAB308]/50"
                aria-label="Open navigation menu"
              >
                <Menu className="w-5 h-5" />
              </button>

              <div className="lg:hidden flex items-center gap-2.5 shrink-0">
                <BrandLogo size="sm" />
              </div>

              <div className="hidden sm:flex items-center gap-2.5 min-w-0">
                <BrandLogo size="sm" className="hidden lg:block" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span className="font-medium text-slate-300 whitespace-nowrap">
                      SAGOR MARKETING TEAM
                    </span>
                    <span aria-hidden="true">/</span>
                    <span className="text-[#FACC15] font-medium truncate">
                      {currentNavItem.label}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">

              <button
                type="button"
                onClick={async () => { await supabase.auth.signOut(); }}
                title="Sign out"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#0B1528] border border-white/10 text-slate-300 hover:text-white hover:border-[#EAB308]/50 text-xs font-semibold"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden md:inline">Sign out</span>
              </button>

              <button
                type="button"
                onClick={() => handleNavigate('submit')}
                className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#EAB308] hover:bg-[#FACC15] text-[#070E1A] font-semibold text-xs sm:text-sm whitespace-nowrap shrink-0 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Submit Work
              </button>
            </div>
          </div>
        </header>

        {/* Viewport Container */}
        <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-7">
          {loadError && (
            <div className="mb-6 rounded-2xl bg-rose-500/10 border border-rose-500/35 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-rose-200">
                  Connection Issue
                </p>
                <p className="text-xs text-rose-300 mt-0.5">{loadError}</p>
              </div>
              <button
                type="button"
                onClick={loadBootstrap}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retry Connection
              </button>
            </div>
          )}

          {activeSection === 'dashboard' && (
            <DashboardView
              members={members}
              activeMember={activeMember}
              submissions={submissions}
              isLoading={isLoading}
              onNavigate={handleNavigate}
              onInspectScreenshots={handleInspectScreenshots}
            />
          )}

          {(activeSection === 'submit' ||
            (isAdmin &&
              (activeSection === 'instagram' ||
                activeSection === 'email' ||
                activeSection === 'facebook' ||
                activeSection === 'campaign'))) && (
            <SubmitWorkView
              mode={activeSection === 'submit' ? 'all' : activeSection}
              members={members}
              selectedMemberId={selectedMemberId}
              onSelectMember={setSelectedMemberId}
              submissions={submissions}
              onSubmissionsUpdated={setSubmissions}
              onNotify={notify}
              onInspectScreenshots={handleInspectScreenshots}
            />
          )}

          {activeSection === 'performance' && isAdmin && (
            <PerformanceView
              members={members}
              submissions={submissions}
              settings={settings}
            />
          )}

          {activeSection === 'history' && (
            <HistoryView
              members={members}
              submissions={submissions}
              isLoading={isLoading}
              compactTables={settings.compactTables}
              onNavigate={handleNavigate}
              onInspectScreenshots={handleInspectScreenshots}
            />
          )}

          {activeSection === 'admin' && isAdmin && (
            <AdminView
              members={members}
              submissions={submissions}
              adminEmail={adminEmail}
              compactTables={settings.compactTables}
              onSubmissionsUpdated={setSubmissions}
              onNotify={notify}
              onInspectScreenshots={handleInspectScreenshots}
            />
          )}

          {activeSection === 'settings' && isAdmin && (
            <SettingsView
              members={members}
              settings={settings}
              onMembersAndSubmissionsUpdated={(updatedMembers, updatedSubs) => {
                setMembers(updatedMembers);
                setSubmissions(updatedSubs);
              }}
              onSettingsUpdated={setSettings}
              onReplayIntro={() => setShowIntro(true)}
              onNotify={notify}
            />
          )}
        </main>

        {/* Clean Footer */}
        <footer className="border-t border-white/10 py-5 px-4 sm:px-6 lg:px-8">
          <div className="max-w-[1400px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
            <span>
              © {new Date().getFullYear()} SAGOR MARKETING TEAM. All rights
              reserved.
            </span>
            <span className="text-[#FACC15] font-medium">
              GROW TOGETHER • ACHIEVE MORE
            </span>
          </div>
        </footer>
      </div>

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Screenshot Lightbox */}
      {lightboxState && (
        <ScreenshotLightbox
          screenshots={lightboxState.screenshots}
          activeIndex={lightboxState.index}
          title={lightboxState.title}
          onClose={() => setLightboxState(null)}
          onChangeIndex={(index) =>
            setLightboxState((prev) => (prev ? { ...prev, index } : null))
          }
        />
      )}
    </div>
  );
}
