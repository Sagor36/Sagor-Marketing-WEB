import { apiFetch, supabase } from '../lib_supabase';
import { useMemo, useState } from 'react';
import {
  Download,
  Trash2,
  AlertTriangle,
  RotateCcw,
  Image as ImageIcon,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import {
  CATEGORY_CONFIG,
  CATEGORY_ORDER,
  MarketingCategory,
  MarketingSubmission,
  MemberProfile,
  UploadedScreenshot,
} from '../types/marketing';
import { AnimatedCounter } from './AnimatedCounter';

interface AdminViewProps {
  members: MemberProfile[];
  submissions: MarketingSubmission[];
  adminEmail: string;
  compactTables: boolean;
  onSubmissionsUpdated: (submissions: MarketingSubmission[]) => void;
  onNotify: (
    type: 'success' | 'error' | 'info',
    title: string,
    message: string
  ) => void;
  onInspectScreenshots: (
    screenshots: UploadedScreenshot[],
    index: number,
    title: string
  ) => void;
}

export function AdminView({
  members,
  submissions,
  adminEmail,
  compactTables,
  onSubmissionsUpdated,
  onNotify,
  onInspectScreenshots,
}: AdminViewProps) {
  const [memberFilter, setMemberFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | MarketingCategory>('all');
  const [dateFilter, setDateFilter] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<MarketingSubmission | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [busyImage, setBusyImage] = useState<string | null>(null);

  const updateImage = async (submission: MarketingSubmission, imageId: string, status?: 'real' | 'fake') => {
    const key = `${submission.id}:${imageId}`; setBusyImage(key);
    try {
      const response = await apiFetch(status ? `/api/submissions/${submission.id}/images/${imageId}` : `/api/submissions/${submission.id}/images/${imageId}`, status ? { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) } : { method: 'DELETE' });
      const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Image update failed.');
      const updated = submissions.map((s) => s.id === submission.id ? { ...s, screenshots: data.screenshots } : s);
      onSubmissionsUpdated(updated); onNotify('success', status ? 'Image reviewed' : 'Image deleted', status ? `Marked as ${status.toUpperCase()}.` : 'Image removed from submission and storage.');
    } catch (err) { onNotify('error', 'Image action failed', err instanceof Error ? err.message : 'Please try again.'); }
    finally { setBusyImage(null); }
  };

  const filtered = useMemo(() => {
    return submissions.filter((item) => {
      if (memberFilter !== 'all' && (item.submittedById || item.memberId) !== memberFilter) return false;
      if (categoryFilter !== 'all' && item.category !== categoryFilter)
        return false;
      if (dateFilter && item.submittedAt.slice(0, 10) !== dateFilter)
        return false;
      return true;
    });
  }, [submissions, memberFilter, categoryFilter, dateFilter]);

  const submitters = Array.from(new Map(submissions.map((item) => [item.submittedById || item.memberId, { id: item.submittedById || item.memberId, name: item.memberName, email: item.memberEmail || '' }])).values());

  const totalUnits = filtered.reduce((sum, s) => sum + s.quantity, 0);
  const totalShots = filtered.reduce((sum, s) => sum + s.screenshots.length, 0);
  const realShots = filtered.reduce((sum, s) => sum + s.screenshots.filter(x => x.verificationStatus === 'real').length, 0);
  const fakeShots = filtered.reduce((sum, s) => sum + s.screenshots.filter(x => x.verificationStatus === 'fake').length, 0);
  const pendingShots = Math.max(0, totalShots - realShots - fakeShots);

  const handleExportCsv = async () => {
    const params = new URLSearchParams();
    if (memberFilter !== 'all') params.set('memberId', memberFilter);
    if (categoryFilter !== 'all') params.set('category', categoryFilter);
    if (dateFilter) {
      params.set('dateFrom', dateFilter);
      params.set('dateTo', dateFilter);
    }

    try {
      const response = await apiFetch(`/api/export/csv?${params.toString()}`);
      if (!response.ok) throw new Error('CSV export failed.');
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = `sagor-marketing-report-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(anchor); anchor.click(); anchor.remove(); URL.revokeObjectURL(objectUrl);
      onNotify('success', 'CSV Export Ready', `Exported ${filtered.length} marketing record(s).`);
    } catch (err) { onNotify('error', 'Export Failed', err instanceof Error ? err.message : 'Unable to export report.'); }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const response = await apiFetch(`/api/submissions/${deleteTarget.id}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Unable to delete record.');
      }
      onSubmissionsUpdated(data.submissions);
      onNotify(
        'success',
        'Submission Deleted',
        `Removed ${deleteTarget.id} (${deleteTarget.memberName} — ${
          CATEGORY_CONFIG[deleteTarget.category].label
        }).`
      );
      setDeleteTarget(null);
    } catch (err) {
      onNotify(
        'error',
        'Delete Failed',
        err instanceof Error ? err.message : 'Unable to delete submission.'
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Admin Header & Team Performance Totals */}
      <section className="rounded-2xl bg-[#0B1528] border border-white/10 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div>
            {adminEmail && <p className="text-[11px] text-[#FACC15] mb-1">Admin account: {adminEmail}</p>}
            <h2 className="font-display text-xl font-bold text-white">
              Admin Management Console
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Audit registered accounts&apos; submissions, inspect screenshots,
              remove erroneous logs, and export CSV reports
            </p>
          </div>
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={filtered.length === 0}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#EAB308] hover:bg-[#FACC15] disabled:opacity-50 text-[#070E1A] font-semibold text-sm whitespace-nowrap shrink-0 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Export CSV Report
          </button>
        </div>

        <div className="mt-5 grid grid-cols-2 lg:grid-cols-7 gap-4">
          <div className="rounded-xl bg-[#070E1A]/70 border border-white/5 p-4">
            <span className="text-xs text-slate-400">Filtered Submissions</span>
            <p className="mt-1 font-display text-2xl font-bold text-white">
              <AnimatedCounter value={filtered.length} />
            </p>
          </div>
          <div className="rounded-xl bg-[#070E1A]/70 border border-white/5 p-4">
            <span className="text-xs text-slate-400">Filtered Quantities</span>
            <p className="mt-1 font-display text-2xl font-bold text-[#FACC15]">
              <AnimatedCounter value={totalUnits} />
            </p>
          </div>
          <div className="rounded-xl bg-[#070E1A]/70 border border-white/5 p-4">
            <span className="text-xs text-slate-400">Filtered Screenshots</span>
            <p className="mt-1 font-display text-2xl font-bold text-white">
              <AnimatedCounter value={totalShots} />
            </p>
          </div>
          <div className="rounded-xl bg-[#070E1A]/70 border border-white/5 p-4">
            <span className="text-xs text-emerald-300">Real Images</span>
            <p className="mt-1 font-display text-2xl font-bold text-emerald-300"><AnimatedCounter value={realShots} /></p>
          </div>
          <div className="rounded-xl bg-[#070E1A]/70 border border-white/5 p-4">
            <span className="text-xs text-rose-300">Fake Images</span>
            <p className="mt-1 font-display text-2xl font-bold text-rose-300"><AnimatedCounter value={fakeShots} /></p>
          </div>
          <div className="rounded-xl bg-[#070E1A]/70 border border-white/5 p-4">
            <span className="text-xs text-amber-200">Pending Images</span>
            <p className="mt-1 font-display text-2xl font-bold text-amber-200"><AnimatedCounter value={pendingShots} /></p>
          </div>
          <div className="rounded-xl bg-[#070E1A]/70 border border-white/5 p-4">
            <span className="text-xs text-slate-400">All-Time Records</span>
            <p className="mt-1 font-display text-2xl font-bold text-white">
              <AnimatedCounter value={submissions.length} />
            </p>
          </div>
        </div>
      </section>

      {/* Admin Filters */}
      <section className="rounded-2xl bg-[#0B1528] border border-white/10 p-5">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <select
            value={memberFilter}
            onChange={(e) => setMemberFilter(e.target.value)}
            aria-label="Admin filter by member"
            className="rounded-xl bg-[#070E1A] border border-white/15 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#EAB308]"
          >
            <option value="all">All Members</option>
            {submitters.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}{m.email ? ` — ${m.email}` : ''}
              </option>
            ))}
          </select>

          <select
            value={categoryFilter}
            onChange={(e) =>
              setCategoryFilter(e.target.value as 'all' | MarketingCategory)
            }
            aria-label="Admin filter by category"
            className="rounded-xl bg-[#070E1A] border border-white/15 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#EAB308]"
          >
            <option value="all">All Categories</option>
            {CATEGORY_ORDER.map((cat) => (
              <option key={cat} value={cat}>
                {CATEGORY_CONFIG[cat].label}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            aria-label="Admin filter by exact date"
            className="rounded-xl bg-[#070E1A] border border-white/15 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#EAB308]"
          />

          <button
            type="button"
            onClick={() => {
              setMemberFilter('all');
              setCategoryFilter('all');
              setDateFilter('');
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#070E1A] hover:bg-white/5 border border-white/15 px-4 py-2.5 text-sm text-slate-300 font-medium transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            Show All Submissions
          </button>
        </div>
      </section>

      {/* Admin Table */}
      <section className="rounded-2xl bg-[#0B1528] border border-white/10 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-12 px-6 text-center">
            <p className="font-display text-base font-semibold text-white">
              No records to manage
            </p>
            <p className="mt-1 text-sm text-slate-400">
              {submissions.length === 0
                ? 'Submissions logged by team members will appear here.'
                : 'No submissions match the selected admin filters.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-[#070E1A]/60 text-xs font-medium text-slate-400">
                  <th className="py-3.5 px-5">Submitted By</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4 text-right">Quantity</th>
                  <th className="py-3.5 px-4">Screenshots</th>
                  <th className="py-3.5 px-4">Submitted</th>
                  <th className="py-3.5 px-5 text-right">Action</th>
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
                      {item.memberEmail && <span className="block text-[11px] text-slate-400">{item.memberEmail}</span>}
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
                              className="h-9 w-9 rounded-lg overflow-hidden border border-white/15 hover:border-[#EAB308] cursor-pointer"
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
                              className="h-9 px-2 rounded-lg bg-[#111E36] border border-white/15 text-xs font-mono tabular-nums text-slate-200 cursor-pointer"
                            >
                              +{item.screenshots.length - 3}
                            </button>
                          )}
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {item.screenshots.map((shot) => (
                              <div key={shot.id} className="flex items-center gap-1 rounded-md bg-[#070E1A] px-1.5 py-1 text-[10px]">
                                <span className={shot.verificationStatus === 'real' ? 'text-emerald-300' : shot.verificationStatus === 'fake' ? 'text-rose-300' : 'text-amber-200'}>{(shot.verificationStatus || 'pending').toUpperCase()}</span>
                                <button type="button" title="Mark image real" disabled={busyImage === `${item.id}:${shot.id}`} onClick={() => updateImage(item, shot.id, 'real')} className="text-emerald-300 disabled:opacity-40"><CheckCircle2 className="w-3.5 h-3.5" /></button>
                                <button type="button" title="Mark image fake" disabled={busyImage === `${item.id}:${shot.id}`} onClick={() => updateImage(item, shot.id, 'fake')} className="text-rose-300 disabled:opacity-40"><XCircle className="w-3.5 h-3.5" /></button>
                                <button type="button" title="Delete image" disabled={busyImage === `${item.id}:${shot.id}`} onClick={() => updateImage(item, shot.id)} className="text-slate-400 hover:text-rose-300 disabled:opacity-40"><Trash2 className="w-3.5 h-3.5" /></button>
                              </div>
                            ))}
                          </div>
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
                      } px-4 whitespace-nowrap font-mono tabular-nums text-xs text-slate-400`}
                    >
                      {new Date(item.submittedAt).toLocaleString()}
                    </td>
                    <td
                      className={`${
                        compactTables ? 'py-2.5' : 'py-4'
                      } px-5 text-right whitespace-nowrap`}
                    >
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(item)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-medium transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Confirm deletion"
        >
          <div className="w-full max-w-md rounded-2xl bg-[#0B1528] border border-white/15 p-6 shadow-2xl">
            <div className="flex items-start gap-3.5">
              <div className="h-10 w-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display text-lg font-bold text-white">
                  Delete Submission?
                </h3>
                <p className="mt-1.5 text-sm text-slate-300 leading-relaxed">
                  You are about to permanently remove{' '}
                  <strong className="text-white">{deleteTarget.id}</strong> (
                  {deleteTarget.memberName} ·{' '}
                  {CATEGORY_CONFIG[deleteTarget.category].label} ·{' '}
                  {deleteTarget.quantity} units) and its{' '}
                  {deleteTarget.screenshots.length} screenshot(s).
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-[#070E1A] border border-white/15 text-sm text-slate-200 hover:bg-white/5 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-sm font-semibold text-white transition-colors cursor-pointer"
              >
                {isDeleting ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
