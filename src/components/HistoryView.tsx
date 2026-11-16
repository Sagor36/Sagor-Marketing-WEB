import { useMemo, useState } from 'react';
import { Search, RotateCcw, Image as ImageIcon } from 'lucide-react';
import {
  CATEGORY_CONFIG,
  CATEGORY_ORDER,
  MarketingCategory,
  MarketingSubmission,
  MemberProfile,
  NavSection,
  UploadedScreenshot,
} from '../types/marketing';

interface HistoryViewProps {
  members: MemberProfile[];
  submissions: MarketingSubmission[];
  isLoading: boolean;
  compactTables: boolean;
  onNavigate: (section: NavSection) => void;
  onInspectScreenshots: (
    screenshots: UploadedScreenshot[],
    index: number,
    title: string
  ) => void;
}

export function HistoryView({
  members,
  submissions,
  isLoading,
  compactTables,
  onNavigate,
  onInspectScreenshots,
}: HistoryViewProps) {
  const [search, setSearch] = useState('');
  const [memberFilter, setMemberFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | MarketingCategory>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return submissions.filter((item) => {
      if (memberFilter !== 'all' && item.memberId !== memberFilter) return false;
      if (categoryFilter !== 'all' && item.category !== categoryFilter)
        return false;
      if (dateFrom && item.submittedAt.slice(0, 10) < dateFrom) return false;
      if (dateTo && item.submittedAt.slice(0, 10) > dateTo) return false;
      if (q) {
        const hay = `${item.memberName} ${CATEGORY_CONFIG[item.category].label} ${
          item.description
        } ${item.id}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [submissions, search, memberFilter, categoryFilter, dateFrom, dateTo]);

  const hasFilters =
    search !== '' ||
    memberFilter !== 'all' ||
    categoryFilter !== 'all' ||
    dateFrom !== '' ||
    dateTo !== '';

  const resetFilters = () => {
    setSearch('');
    setMemberFilter('all');
    setCategoryFilter('all');
    setDateFrom('');
    setDateTo('');
  };

  return (
    <div className="space-y-6">
      {/* Filter Controls */}
      <section className="rounded-2xl bg-[#0B1528] border border-white/10 p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div>
            <h2 className="font-display text-lg font-semibold text-white">
              Submission History
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Search and filter every submitted marketing record and screenshot
            </p>
          </div>
          <span className="font-mono tabular-nums text-xs text-slate-300">
            Showing {filtered.length} of {submissions.length} records
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search member, notes, or ID..."
              className="w-full rounded-xl bg-[#070E1A] border border-white/15 pl-10 pr-4 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#EAB308]"
            />
          </div>

          <select
            value={memberFilter}
            onChange={(e) => setMemberFilter(e.target.value)}
            aria-label="Filter by member"
            className="rounded-xl bg-[#070E1A] border border-white/15 px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#EAB308]"
          >
            <option value="all">All Members</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>

          <select
            value={categoryFilter}
            onChange={(e) =>
              setCategoryFilter(e.target.value as 'all' | MarketingCategory)
            }
            aria-label="Filter by category"
            className="rounded-xl bg-[#070E1A] border border-white/15 px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#EAB308]"
          >
            <option value="all">All Categories</option>
            {CATEGORY_ORDER.map((cat) => (
              <option key={cat} value={cat}>
                {CATEGORY_CONFIG[cat].label}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              aria-label="From date"
              className="w-full rounded-xl bg-[#070E1A] border border-white/15 px-3 py-2 text-xs text-white focus:outline-none focus:border-[#EAB308]"
            />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              aria-label="To date"
              className="w-full rounded-xl bg-[#070E1A] border border-white/15 px-3 py-2 text-xs text-white focus:outline-none focus:border-[#EAB308]"
            />
          </div>
        </div>

        {hasFilters && (
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#FACC15] hover:underline cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Clear filters
            </button>
          </div>
        )}
      </section>

      {/* Results List */}
      <section className="rounded-2xl bg-[#0B1528] border border-white/10 overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4].map((idx) => (
              <div
                key={idx}
                className="h-16 rounded-xl bg-[#070E1A]/60 animate-pulse"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-14 px-6 text-center">
            <p className="font-display text-base font-semibold text-white">
              {submissions.length === 0
                ? 'No submission history recorded yet'
                : 'No submissions match your filters'}
            </p>
            <p className="mt-1.5 text-sm text-slate-400">
              {submissions.length === 0
                ? 'Start by submitting daily marketing work with screenshots.'
                : 'Try adjusting the member, category, search term, or date range.'}
            </p>
            {submissions.length === 0 && (
              <button
                type="button"
                onClick={() => onNavigate('submit')}
                className="mt-5 px-5 py-2.5 rounded-xl bg-[#EAB308] hover:bg-[#FACC15] text-[#070E1A] font-semibold text-sm transition-colors cursor-pointer"
              >
                Submit Marketing Work
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-[#070E1A]/60 text-xs font-medium text-slate-400">
                  <th className="py-3.5 px-5">Member</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4 text-right">Quantity</th>
                  <th className="py-3.5 px-4">Screenshots</th>
                  <th className="py-3.5 px-4">Description</th>
                  <th className="py-3.5 px-5 text-right">Date &amp; Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 text-sm">
                {filtered.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-white/[0.02] transition-colors"
                  >
                    <td
                      className={`${
                        compactTables ? 'py-2.5' : 'py-4'
                      } px-5 whitespace-nowrap`}
                    >
                      <span className="font-semibold text-white block">
                        {item.memberName}
                      </span>
                      <span className="font-mono text-[11px] text-slate-500">
                        {item.id}
                      </span>
                    </td>
                    <td
                      className={`${
                        compactTables ? 'py-2.5' : 'py-4'
                      } px-4 whitespace-nowrap text-[#FACC15] font-medium`}
                    >
                      {CATEGORY_CONFIG[item.category].label}
                    </td>
                    <td
                      className={`${
                        compactTables ? 'py-2.5' : 'py-4'
                      } px-4 text-right whitespace-nowrap font-mono tabular-nums font-semibold text-white`}
                    >
                      {item.quantity.toLocaleString()}
                    </td>
                    <td
                      className={`${
                        compactTables ? 'py-2.5' : 'py-4'
                      } px-4 whitespace-nowrap`}
                    >
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
                              className="h-9 w-9 rounded-lg overflow-hidden border border-white/15 hover:border-[#EAB308] transition-colors cursor-pointer"
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
                              className="h-9 px-2 rounded-lg bg-[#111E36] border border-white/15 text-xs font-mono tabular-nums text-slate-200 hover:border-[#EAB308] cursor-pointer"
                            >
                              +{item.screenshots.length - 3}
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                          <ImageIcon className="w-3.5 h-3.5" />
                          None
                        </span>
                      )}
                    </td>
                    <td
                      className={`${
                        compactTables ? 'py-2.5' : 'py-4'
                      } px-4 max-w-xs`}
                    >
                      <p className="text-xs text-slate-300 line-clamp-2">
                        {item.description || '—'}
                      </p>
                    </td>
                    <td
                      className={`${
                        compactTables ? 'py-2.5' : 'py-4'
                      } px-5 text-right whitespace-nowrap font-mono tabular-nums text-xs text-slate-400`}
                    >
                      {new Date(item.submittedAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
