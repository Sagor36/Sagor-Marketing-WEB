import {
  ArrowUpRight,
  CheckSquare,
  Image as ImageIcon,
  Layers,
  Rocket,
  Plus,
} from 'lucide-react';
import {
  CATEGORY_CONFIG,
  CATEGORY_ORDER,
  MarketingCategory,
  MarketingSubmission,
  MemberProfile,
  NavSection,
  UploadedScreenshot,
} from '../types/marketing';
import { AnimatedCounter } from './AnimatedCounter';
import { ActivityCharts } from './ActivityCharts';
import { MemberAvatar } from './MemberAvatar';

interface DashboardViewProps {
  members: MemberProfile[];
  activeMember: MemberProfile;
  submissions: MarketingSubmission[];
  isLoading: boolean;
  onNavigate: (section: NavSection) => void;
  onInspectScreenshots: (
    screenshots: UploadedScreenshot[],
    index: number,
    title: string
  ) => void;
}

export function DashboardView({
  members,
  activeMember,
  submissions,
  isLoading,
  onNavigate,
  onInspectScreenshots,
}: DashboardViewProps) {
  const totalMarketingCount = submissions.reduce(
    (sum, s) => sum + s.quantity,
    0
  );
  const totalScreenshots = submissions.reduce(
    (sum, s) => sum + s.screenshots.length,
    0
  );
  const totalCompletedTasks = submissions.length;
  const totalRunningCampaigns = submissions
    .filter((s) => s.category === 'campaign')
    .reduce((sum, s) => sum + s.quantity, 0);

  const memberStats = members.map((member) => {
    const mine = submissions.filter((s) => s.memberId === member.id);
    const byCategory: Record<MarketingCategory, number> = {
      instagram: 0,
      email: 0,
      facebook: 0,
      campaign: 0,
    };
    let screenshots = 0;
    let total = 0;
    for (const item of mine) {
      byCategory[item.category] += item.quantity;
      total += item.quantity;
      screenshots += item.screenshots.length;
    }
    return {
      member,
      byCategory,
      screenshots,
      total,
      entries: mine.length,
    };
  });

  const recentSubmissions = submissions.slice(0, 6);

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <section className="rounded-2xl bg-gradient-to-r from-[#0B1528] via-[#111E36] to-[#0B1528] border border-white/10 p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold tracking-wider text-[#FACC15]">
            GROW TOGETHER • ACHIEVE MORE
          </p>
          <h2 className="mt-2 font-display text-2xl sm:text-3xl font-bold text-white text-balance">
            Welcome back, {activeMember.name}
          </h2>
          <p className="mt-2 text-sm text-slate-300 leading-relaxed">
            Track daily Instagram outreach, Email campaigns, Facebook Ads, and
            live campaign deliverables across the SAGOR MARKETING TEAM.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => onNavigate('submit')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#EAB308] hover:bg-[#FACC15] text-[#070E1A] font-semibold text-sm whitespace-nowrap shrink-0 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Submit Marketing Work
          </button>
          <button
            type="button"
            onClick={() => onNavigate('performance')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#070E1A] hover:bg-white/5 border border-white/15 text-slate-200 font-medium text-sm whitespace-nowrap shrink-0 transition-colors cursor-pointer"
          >
            Team Performance
            <ArrowUpRight className="w-4 h-4 text-[#FACC15]" />
          </button>
        </div>
      </section>

      {/* 4 KPI Summary Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((idx) => (
            <div
              key={idx}
              className="h-32 rounded-2xl bg-[#0B1528] border border-white/10 p-6 animate-pulse"
            >
              <div className="h-3 w-28 bg-white/10 rounded" />
              <div className="mt-4 h-8 w-20 bg-white/15 rounded" />
              <div className="mt-3 h-3 w-36 bg-white/5 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          <div className="rounded-2xl bg-[#0B1528] border border-white/10 p-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">
                Total Marketing Count
              </span>
              <Layers className="w-4 h-4 text-[#FACC15]" />
            </div>
            <div className="mt-3 font-display text-3xl font-bold text-white">
              <AnimatedCounter value={totalMarketingCount} />
            </div>
            <p className="mt-1.5 text-xs text-slate-400">
              Combined deliverables across 4 channels
            </p>
          </div>

          <div className="rounded-2xl bg-[#0B1528] border border-white/10 p-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">
                Total Screenshots Submitted
              </span>
              <ImageIcon className="w-4 h-4 text-[#FACC15]" />
            </div>
            <div className="mt-3 font-display text-3xl font-bold text-white">
              <AnimatedCounter value={totalScreenshots} />
            </div>
            <p className="mt-1.5 text-xs text-slate-400">
              Verified visual proof attachments
            </p>
          </div>

          <div className="rounded-2xl bg-[#0B1528] border border-white/10 p-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">
                Total Completed Tasks
              </span>
              <CheckSquare className="w-4 h-4 text-[#FACC15]" />
            </div>
            <div className="mt-3 font-display text-3xl font-bold text-white">
              <AnimatedCounter value={totalCompletedTasks} />
            </div>
            <p className="mt-1.5 text-xs text-slate-400">
              Submitted work logs recorded
            </p>
          </div>

          <div className="rounded-2xl bg-[#0B1528] border border-white/10 p-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">
                Running Campaigns Logged
              </span>
              <Rocket className="w-4 h-4 text-[#FACC15]" />
            </div>
            <div className="mt-3 font-display text-3xl font-bold text-white">
              <AnimatedCounter value={totalRunningCampaigns} />
            </div>
            <p className="mt-1.5 text-xs text-slate-400">
              Active campaign entries tracked
            </p>
          </div>
        </section>
      )}

      {/* Three Member Performance Cards */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display text-lg font-semibold text-white">
              Team Member Overview
            </h3>
            <p className="text-xs text-slate-400">
              Individual marketing quantities and screenshot submissions
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('performance')}
            className="text-xs font-medium text-[#FACC15] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
          >
            View detailed breakdown
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {memberStats.map(({ member, byCategory, screenshots, total, entries }) => (
            <div
              key={member.id}
              className="rounded-2xl bg-[#0B1528] border border-white/10 p-6 hover:border-[#EAB308]/35 transition-colors"
            >
              <div className="flex items-center gap-3.5 pb-4 border-b border-white/10">
                <MemberAvatar member={member} size="md" />
                <div className="min-w-0">
                  <h4 className="font-display text-base font-semibold text-white truncate">
                    {member.name}
                  </h4>
                  <p className="text-xs text-slate-400 truncate">
                    {member.role}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-slate-400">Activities</span>
                  <p className="font-mono tabular-nums text-2xl font-bold text-white mt-0.5">
                    {total.toLocaleString()}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-slate-400">Screenshots</span>
                  <p className="font-mono tabular-nums text-2xl font-bold text-[#FACC15] mt-0.5">
                    {screenshots.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-2 gap-y-2 gap-x-3 text-xs">
                {CATEGORY_ORDER.map((cat) => (
                  <div
                    key={cat}
                    className="flex items-center justify-between text-slate-300"
                  >
                    <span className="text-slate-400">
                      {CATEGORY_CONFIG[cat].shortLabel}
                    </span>
                    <span className="font-mono tabular-nums font-medium text-white">
                      {byCategory[cat]}
                    </span>
                  </div>
                ))}
              </div>

              <p className="mt-4 text-[11px] text-slate-400 font-mono tabular-nums">
                {entries} {entries === 1 ? 'submission' : 'submissions'} logged
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Marketing Activity Overview Chart */}
      <ActivityCharts submissions={submissions} />

      {/* Recent Submissions */}
      <section className="rounded-2xl bg-[#0B1528] border border-white/10 p-6">
        <div className="flex items-center justify-between gap-4 mb-5">
          <div>
            <h3 className="font-display text-lg font-semibold text-white">
              Recent Submissions
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Latest verified work logs with attached screenshots
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('history')}
            className="text-xs font-medium text-[#FACC15] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
          >
            Open full history
          </button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((idx) => (
              <div
                key={idx}
                className="h-16 rounded-xl bg-[#070E1A]/60 border border-white/5 animate-pulse"
              />
            ))}
          </div>
        ) : recentSubmissions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/15 bg-[#070E1A]/50 py-12 px-6 text-center">
            <p className="font-display text-base font-semibold text-white">
              No marketing submissions yet
            </p>
            <p className="mt-1.5 text-sm text-slate-400 max-w-md mx-auto">
              Select a team member and log Instagram, Email, Facebook Ads, or
              Running Campaign activities to populate live analytics.
            </p>
            <button
              type="button"
              onClick={() => onNavigate('submit')}
              className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#EAB308] hover:bg-[#FACC15] text-[#070E1A] font-semibold text-sm transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Log First Submission
            </button>
          </div>
        ) : (
          <div className="divide-y divide-white/10">
            {recentSubmissions.map((item) => (
              <div
                key={item.id}
                className="py-4 first:pt-0 last:pb-0 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm">
                    <span className="font-semibold text-white">
                      {item.memberName}
                    </span>
                    <span className="text-slate-500">·</span>
                    <span className="text-[#FACC15] font-medium">
                      {CATEGORY_CONFIG[item.category].label}
                    </span>
                    <span className="text-slate-500">·</span>
                    <span className="font-mono tabular-nums text-xs text-slate-300">
                      {new Date(item.submittedAt).toLocaleString()}
                    </span>
                  </div>
                  {item.description ? (
                    <p className="mt-1 text-xs text-slate-300 line-clamp-1">
                      {item.description}
                    </p>
                  ) : (
                    <p className="mt-1 text-xs text-slate-500">
                      No additional notes provided
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-5 shrink-0">
                  <div className="text-right">
                    <span className="block font-mono tabular-nums text-base font-bold text-white">
                      {item.quantity.toLocaleString()}
                    </span>
                    <span className="block text-[11px] text-slate-400">
                      {CATEGORY_CONFIG[item.category].quantityUnit}
                    </span>
                  </div>

                  {item.screenshots.length > 0 ? (
                    <div className="flex items-center gap-1.5">
                      {item.screenshots.slice(0, 3).map((shot, idx) => (
                        <button
                          key={shot.id}
                          type="button"
                          onClick={() =>
                            onInspectScreenshots(
                              item.screenshots,
                              idx,
                              `${item.memberName} — ${
                                CATEGORY_CONFIG[item.category].label
                              }`
                            )
                          }
                          className="h-10 w-10 rounded-lg overflow-hidden border border-white/15 hover:border-[#EAB308] transition-colors cursor-pointer"
                        >
                          <img
                            src={shot.url}
                            alt={shot.originalName}
                            referrerPolicy="no-referrer"
                            className="h-full w-full object-cover"
                          />
                        </button>
                      ))}
                      {item.screenshots.length > 3 && (
                        <button
                          type="button"
                          onClick={() =>
                            onInspectScreenshots(
                              item.screenshots,
                              3,
                              `${item.memberName} — ${
                                CATEGORY_CONFIG[item.category].label
                              }`
                            )
                          }
                          className="h-10 px-2 rounded-lg bg-[#111E36] border border-white/15 text-xs font-mono tabular-nums text-slate-200 hover:border-[#EAB308] cursor-pointer"
                        >
                          +{item.screenshots.length - 3}
                        </button>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-500 w-24 text-right">
                      No screenshots
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
