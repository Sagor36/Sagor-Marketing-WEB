import { useMemo, useState } from 'react';
import {
  CATEGORY_CONFIG,
  CATEGORY_ORDER,
  MarketingCategory,
  MarketingSubmission,
} from '../types/marketing';

interface ActivityChartsProps {
  submissions: MarketingSubmission[];
}

export function ActivityCharts({ submissions }: ActivityChartsProps) {
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);

  const dailySeries = useMemo(() => {
    const days: Array<{
      dateKey: string;
      label: string;
      totals: Record<MarketingCategory, number>;
      sum: number;
    }> = [];

    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const dateKey = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString('en-US', { weekday: 'short' });
      days.push({
        dateKey,
        label,
        totals: { instagram: 0, email: 0, facebook: 0, campaign: 0 },
        sum: 0,
      });
    }

    const byDate = new Map(days.map((d) => [d.dateKey, d]));
    for (const sub of submissions) {
      const key = sub.submittedAt.slice(0, 10);
      const bucket = byDate.get(key);
      if (bucket) {
        bucket.totals[sub.category] += sub.quantity;
        bucket.sum += sub.quantity;
      }
    }

    return days;
  }, [submissions]);

  const maxDaySum = Math.max(
    10,
    ...dailySeries.map((d) => d.sum)
  );

  const categoryTotals = useMemo(() => {
    const map: Record<MarketingCategory, number> = {
      instagram: 0,
      email: 0,
      facebook: 0,
      campaign: 0,
    };
    for (const sub of submissions) {
      map[sub.category] += sub.quantity;
    }
    const grandTotal = Object.values(map).reduce((acc, v) => acc + v, 0);
    return { map, grandTotal };
  }, [submissions]);

  const activeDayData = dailySeries.find((d) => d.dateKey === hoveredDay);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
      {/* 7-Day Activity Overview Bar Chart */}
      <div className="xl:col-span-8 rounded-2xl bg-[#0B1528] border border-white/10 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="font-display text-lg font-semibold text-white">
              Marketing Activity Overview
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Daily marketing output across all four channels (last 7 days)
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300">
            {CATEGORY_ORDER.map((cat) => (
              <div key={cat} className="flex items-center gap-1.5">
                <span
                  className="h-2.5 w-2.5 rounded-xs shrink-0"
                  style={{ backgroundColor: CATEGORY_CONFIG[cat].accentHex }}
                />
                <span>{CATEGORY_CONFIG[cat].shortLabel}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative h-56 flex items-end gap-3 sm:gap-5 pt-6 pb-2 border-b border-white/10">
          {dailySeries.map((day) => {
            const isHovered = hoveredDay === day.dateKey;
            const totalHeightPct = Math.round((day.sum / maxDaySum) * 100);

            return (
              <div
                key={day.dateKey}
                onMouseEnter={() => setHoveredDay(day.dateKey)}
                onMouseLeave={() => setHoveredDay(null)}
                className="flex-1 h-full flex flex-col items-center justify-end group cursor-default"
              >
                <span className="mb-1.5 text-[11px] font-mono tabular-nums text-slate-400 group-hover:text-[#FACC15] transition-colors">
                  {day.sum}
                </span>
                <div
                  className={`w-full max-w-[44px] rounded-t-lg overflow-hidden flex flex-col-reverse bg-[#111E36] transition-transform duration-150 ${
                    isHovered ? 'scale-[1.03] ring-1 ring-[#EAB308]/50' : ''
                  }`}
                  style={{
                    height: `${Math.max(day.sum > 0 ? 10 : 4, totalHeightPct)}%`,
                  }}
                >
                  {day.sum === 0 ? (
                    <div className="w-full h-full bg-white/5" />
                  ) : (
                    CATEGORY_ORDER.map((cat) => {
                      const val = day.totals[cat];
                      if (val <= 0) return null;
                      const segPct = (val / day.sum) * 100;
                      return (
                        <div
                          key={cat}
                          style={{
                            height: `${segPct}%`,
                            backgroundColor: CATEGORY_CONFIG[cat].accentHex,
                          }}
                          title={`${CATEGORY_CONFIG[cat].label}: ${val}`}
                        />
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-3 sm:gap-5 pt-2.5">
          {dailySeries.map((day) => (
            <div
              key={day.dateKey}
              className="flex-1 text-center text-xs text-slate-400 font-medium"
            >
              {day.label}
            </div>
          ))}
        </div>

        <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
          {activeDayData ? (
            <span>
              <strong className="text-white">{activeDayData.dateKey}</strong> —
              Instagram: {activeDayData.totals.instagram} · Email:{' '}
              {activeDayData.totals.email} · Facebook:{' '}
              {activeDayData.totals.facebook} · Campaigns:{' '}
              {activeDayData.totals.campaign}
            </span>
          ) : (
            <span>Hover over any day bar to inspect channel breakdown</span>
          )}
          <span className="font-mono tabular-nums text-[#FACC15]">
            7d Total:{' '}
            {dailySeries.reduce((sum, d) => sum + d.sum, 0).toLocaleString()}
          </span>
        </div>
      </div>

      {/* Channel Breakdown */}
      <div className="xl:col-span-4 rounded-2xl bg-[#0B1528] border border-white/10 p-6 flex flex-col justify-between">
        <div>
          <h3 className="font-display text-lg font-semibold text-white">
            Channel Share
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Cumulative marketing quantity by category
          </p>

          <div className="mt-6 space-y-5">
            {CATEGORY_ORDER.map((cat) => {
              const cfg = CATEGORY_CONFIG[cat];
              const val = categoryTotals.map[cat];
              const pct =
                categoryTotals.grandTotal > 0
                  ? Math.round((val / categoryTotals.grandTotal) * 100)
                  : 0;

              return (
                <div key={cat}>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="font-medium text-slate-200">
                      {cfg.label}
                    </span>
                    <span className="font-mono tabular-nums text-xs text-slate-300">
                      {val.toLocaleString()} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-[#111E36] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: cfg.accentHex,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs">
          <span className="text-slate-400">Combined Output</span>
          <span className="font-mono tabular-nums font-semibold text-white">
            {categoryTotals.grandTotal.toLocaleString()} units
          </span>
        </div>
      </div>
    </div>
  );
}
