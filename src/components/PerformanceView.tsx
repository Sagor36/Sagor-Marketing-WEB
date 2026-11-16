import {
  CATEGORY_CONFIG,
  CATEGORY_ORDER,
  MarketingCategory,
  MarketingSubmission,
  MemberProfile,
  TeamSettings,
} from '../types/marketing';
import { AnimatedCounter } from './AnimatedCounter';
import { MemberAvatar } from './MemberAvatar';

interface PerformanceViewProps {
  members: MemberProfile[];
  submissions: MarketingSubmission[];
  settings: TeamSettings;
}

export function PerformanceView({
  members,
  submissions,
  settings,
}: PerformanceViewProps) {
  const memberBreakdown = members.map((member) => {
    const mine = submissions.filter((s) => s.memberId === member.id);
    const counts: Record<MarketingCategory, number> = {
      instagram: 0,
      email: 0,
      facebook: 0,
      campaign: 0,
    };
    let totalActivities = 0;
    let totalScreenshots = 0;

    for (const sub of mine) {
      counts[sub.category] += sub.quantity;
      totalActivities += sub.quantity;
      totalScreenshots += sub.screenshots.length;
    }

    return {
      member,
      counts,
      totalActivities,
      totalScreenshots,
      submissionsCount: mine.length,
    };
  });

  const combinedTotal = memberBreakdown.reduce(
    (sum, m) => sum + m.totalActivities,
    0
  );
  const combinedScreenshots = memberBreakdown.reduce(
    (sum, m) => sum + m.totalScreenshots,
    0
  );

  const maxMemberTotal = Math.max(
    1,
    ...memberBreakdown.map((m) => m.totalActivities)
  );

  const todayKey = new Date().toISOString().slice(0, 10);
  const todayTotal = submissions
    .filter((s) => s.submittedAt.slice(0, 10) === todayKey)
    .reduce((sum, s) => sum + s.quantity, 0);

  const dailyPct = Math.min(
    100,
    Math.round((todayTotal / Math.max(1, settings.dailyActivityTarget)) * 100)
  );

  return (
    <div className="space-y-8">
      {/* Combined Team Summary */}
      <section className="rounded-2xl bg-[#0B1528] border border-white/10 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div>
            <h2 className="font-display text-xl font-bold text-white">
              Combined Team Performance
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Aggregated marketing activity from registered team accounts
            </p>
          </div>
          <div className="flex items-center gap-6">
            <div>
              <span className="text-xs text-slate-400 block">
                Total Activities
              </span>
              <span className="font-display text-2xl font-bold text-white">
                <AnimatedCounter value={combinedTotal} />
              </span>
            </div>
            <div>
              <span className="text-xs text-slate-400 block">
                Total Screenshots
              </span>
              <span className="font-display text-2xl font-bold text-[#FACC15]">
                <AnimatedCounter value={combinedScreenshots} />
              </span>
            </div>
          </div>
        </div>

        {/* Daily Goal Pacing */}
        <div className="mt-5">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-slate-300 font-medium">
              Today&apos;s Team Output vs Daily Target
            </span>
            <span className="font-mono tabular-nums text-[#FACC15]">
              {todayTotal.toLocaleString()} /{' '}
              {settings.dailyActivityTarget.toLocaleString()} ({dailyPct}%)
            </span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-[#111E36] overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#CA8A04] to-[#FACC15] transition-all duration-500"
              style={{ width: `${dailyPct}%` }}
            />
          </div>
        </div>
      </section>

      {/* Individual Member Profiles */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {memberBreakdown.map(
          ({
            member,
            counts,
            totalActivities,
            totalScreenshots,
            submissionsCount,
          }) => {
            const sharePct =
              combinedTotal > 0
                ? Math.round((totalActivities / combinedTotal) * 100)
                : 0;

            return (
              <div
                key={member.id}
                className="rounded-2xl bg-[#0B1528] border border-white/10 p-6 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-4 pb-5 border-b border-white/10">
                    <MemberAvatar member={member} size="lg" />
                    <div className="min-w-0">
                      <span className="text-[11px] font-mono text-[#FACC15]">
                        {member.code}
                      </span>
                      <h3 className="font-display text-lg font-bold text-white truncate">
                        {member.name}
                      </h3>
                      <p className="text-xs text-slate-400 truncate">
                        {member.role}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-4">
                    <div className="rounded-xl bg-[#070E1A]/70 border border-white/5 p-3.5">
                      <span className="text-[11px] text-slate-400">
                        Total Activities
                      </span>
                      <p className="mt-1 font-mono tabular-nums text-2xl font-bold text-white">
                        {totalActivities.toLocaleString()}
                      </p>
                    </div>
                    <div className="rounded-xl bg-[#070E1A]/70 border border-white/5 p-3.5">
                      <span className="text-[11px] text-slate-400">
                        Screenshots
                      </span>
                      <p className="mt-1 font-mono tabular-nums text-2xl font-bold text-[#FACC15]">
                        {totalScreenshots.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 space-y-3">
                    {CATEGORY_ORDER.map((cat) => {
                      const val = counts[cat];
                      const catPct =
                        totalActivities > 0
                          ? Math.round((val / totalActivities) * 100)
                          : 0;

                      return (
                        <div key={cat}>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-slate-300">
                              {CATEGORY_CONFIG[cat].label}
                            </span>
                            <span className="font-mono tabular-nums text-white font-medium">
                              {val.toLocaleString()}
                            </span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-[#111E36] overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${catPct}%`,
                                backgroundColor: CATEGORY_CONFIG[cat].accentHex,
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
                  <span>{submissionsCount} submissions</span>
                  <span className="font-mono tabular-nums text-[#FACC15]">
                    {sharePct}% team share
                  </span>
                </div>
              </div>
            );
          }
        )}
      </section>

      {/* Member Comparison Chart */}
      <section className="rounded-2xl bg-[#0B1528] border border-white/10 p-6">
        <h3 className="font-display text-lg font-semibold text-white">
          Member Output Comparison
        </h3>
        <p className="text-xs text-slate-400 mt-0.5 mb-6">
          Relative total marketing activities completed per member
        </p>

        <div className="space-y-4">
          {memberBreakdown.map(({ member, totalActivities, totalScreenshots }) => {
            const widthPct = Math.round((totalActivities / maxMemberTotal) * 100);
            return (
              <div key={member.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-white">{member.name}</span>
                  <span className="font-mono tabular-nums text-xs text-slate-300">
                    {totalActivities.toLocaleString()} activities ·{' '}
                    {totalScreenshots.toLocaleString()} screenshots
                  </span>
                </div>
                <div className="h-3 w-full rounded-full bg-[#111E36] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#CA8A04] to-[#FACC15] transition-all duration-500"
                    style={{ width: `${totalActivities > 0 ? Math.max(4, widthPct) : 0}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
