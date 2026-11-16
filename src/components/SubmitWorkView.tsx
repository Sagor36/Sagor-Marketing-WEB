import { apiFetch, supabase } from '../lib_supabase';
import { useState } from 'react';
import { Send, RotateCcw, CheckCircle2 } from 'lucide-react';
import {
  CATEGORY_CONFIG,
  CATEGORY_ORDER,
  MarketingCategory,
  MarketingSubmission,
  MemberProfile,
  UploadedScreenshot,
} from '../types/marketing';
import {
  CategoryDraftState,
  CategoryUploadCard,
  DraftFileItem,
} from './CategoryUploadCard';
import { MemberAvatar } from './MemberAvatar';

interface SubmitWorkViewProps {
  mode: 'all' | MarketingCategory;
  members: MemberProfile[];
  selectedMemberId: MemberProfile['id'];
  onSelectMember: (id: MemberProfile['id']) => void;
  submissions: MarketingSubmission[];
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

function createInitialDrafts(): Record<MarketingCategory, CategoryDraftState> {
  return {
    instagram: { quantity: '', description: '', files: [], status: 'idle' },
    email: { quantity: '', description: '', files: [], status: 'idle' },
    facebook: { quantity: '', description: '', files: [], status: 'idle' },
    campaign: { quantity: '', description: '', files: [], status: 'idle' },
  };
}

export function SubmitWorkView({
  mode,
  members,
  selectedMemberId,
  onSelectMember,
  submissions,
  onSubmissionsUpdated,
  onNotify,
  onInspectScreenshots,
}: SubmitWorkViewProps) {
  const [drafts, setDrafts] = useState<
    Record<MarketingCategory, CategoryDraftState>
  >(createInitialDrafts);
  const [isSubmittingAll, setIsSubmittingAll] = useState(false);

  const visibleCategories: MarketingCategory[] =
    mode === 'all' ? CATEGORY_ORDER : [mode];

  const updateDraft = (
    cat: MarketingCategory,
    updater: (prev: CategoryDraftState) => CategoryDraftState
  ) => {
    setDrafts((prev) => ({
      ...prev,
      [cat]: updater(prev[cat]),
    }));
  };

  const resetCategories = (categoriesToReset: MarketingCategory[]) => {
    setDrafts((prev) => {
      const next = { ...prev };
      for (const cat of categoriesToReset) {
        for (const f of prev[cat].files) {
          URL.revokeObjectURL(f.previewUrl);
        }
        next[cat] = {
          quantity: '',
          description: '',
          files: [],
          status: 'idle',
        };
      }
      return next;
    });
  };

  const handleAddFiles = (cat: MarketingCategory, newFiles: DraftFileItem[]) => {
    updateDraft(cat, (prev) => ({
      ...prev,
      files: [...prev.files, ...newFiles],
      status: 'ready',
      errorMessage: undefined,
    }));
  };

  const handleRemoveFile = (cat: MarketingCategory, fileId: string) => {
    updateDraft(cat, (prev) => {
      const removed = prev.files.find((f) => f.id === fileId);
      if (removed) URL.revokeObjectURL(removed.previewUrl);
      const remaining = prev.files.filter((f) => f.id !== fileId);
      return {
        ...prev,
        files: remaining,
        errorMessage: undefined,
      };
    });
  };

  const submitCategories = async (categoriesToSubmit: MarketingCategory[]) => {
    const member = members.find((m) => m.id === selectedMemberId);
    if (!member) {
      onNotify(
        'error',
        'Member Required',
        'Please select which team member is submitting this work.'
      );
      return;
    }

    const itemsPayload: Array<{
      category: MarketingCategory;
      quantity: number;
      description: string;
    }> = [];

    let hasAnyWork = false;
    let hasValidationError = false;

    for (const cat of categoriesToSubmit) {
      const draft = drafts[cat];
      const trimmedQty = draft.quantity.trim();
      const parsedQty = trimmedQty === '' ? 0 : Number(trimmedQty);
      const hasFiles = draft.files.length > 0;
      const hasDesc = draft.description.trim().length > 0;

      if (trimmedQty !== '' && (!Number.isInteger(parsedQty) || parsedQty < 0)) {
        updateDraft(cat, (prev) => ({
          ...prev,
          status: 'error',
          errorMessage: 'Please enter a valid whole number (0 or greater).',
        }));
        hasValidationError = true;
        continue;
      }

      if ((hasFiles || hasDesc) && parsedQty <= 0) {
        updateDraft(cat, (prev) => ({
          ...prev,
          status: 'error',
          errorMessage: `Enter a quantity greater than 0 for ${CATEGORY_CONFIG[cat].label}.`,
        }));
        hasValidationError = true;
        continue;
      }

      if (parsedQty > 0) {
        hasAnyWork = true;
        itemsPayload.push({
          category: cat,
          quantity: parsedQty,
          description: draft.description.trim(),
        });
      }
    }

    if (hasValidationError) {
      onNotify(
        'error',
        'Validation Error',
        'Please fix the highlighted category fields before submitting.'
      );
      return;
    }

    if (!hasAnyWork) {
      onNotify(
        'error',
        'Nothing to Submit',
        'Enter at least one marketing quantity greater than 0 before submitting.'
      );
      return;
    }

    if (mode === 'all') {
      setIsSubmittingAll(true);
    } else {
      updateDraft(categoriesToSubmit[0], (prev) => ({
        ...prev,
        status: 'submitting',
        errorMessage: undefined,
      }));
    }

    try {
      const formData = new FormData();
      formData.append('memberId', member.id);
      formData.append('items', JSON.stringify(itemsPayload));

      for (const item of itemsPayload) {
        const draft = drafts[item.category];
        for (const f of draft.files) {
          formData.append(`files_${item.category}`, f.file);
        }
      }

      const response = await apiFetch('/api/submissions/batch', {
        method: 'POST',
        body: formData,
      });

      const responseText = await response.text();
      let data: any;
      try {
        data = JSON.parse(responseText);
      } catch {
        const preview = responseText.replace(/\\s+/g, ' ').slice(0, 180);
        throw new Error(
          `The server returned a non-JSON response (HTTP ${response.status}). Check the Vercel API deployment. ${preview}`
        );
      }
      if (!response.ok) {
        throw new Error(data.error || `Submission failed (HTTP ${response.status}). Please try again.`);
      }

      onSubmissionsUpdated(data.submissions);

      const submittedCats = itemsPayload.map((i) => i.category);
      const totalUnits = itemsPayload.reduce((acc, i) => acc + i.quantity, 0);
      const totalShots = itemsPayload.reduce(
        (acc, i) => acc + drafts[i.category].files.length,
        0
      );

      onNotify(
        'success',
        'Work Submitted Successfully',
        `${member.name} logged ${totalUnits.toLocaleString()} marketing units and ${totalShots} screenshot(s) across ${submittedCats.length} ${
          submittedCats.length === 1 ? 'category' : 'categories'
        }.`
      );

      resetCategories(categoriesToSubmit);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Unable to save submission.';
      onNotify('error', 'Submission Failed', msg);
      for (const cat of categoriesToSubmit) {
        updateDraft(cat, (prev) => ({
          ...prev,
          status: prev.status === 'submitting' ? 'error' : prev.status,
        }));
      }
    } finally {
      setIsSubmittingAll(false);
    }
  };

  const totalDraftUnits = visibleCategories.reduce((sum, cat) => {
    const val = Number(drafts[cat].quantity || 0);
    return sum + (Number.isFinite(val) && val > 0 ? val : 0);
  }, 0);

  const totalDraftFiles = visibleCategories.reduce(
    (sum, cat) => sum + drafts[cat].files.length,
    0
  );

  const categoryRecentSubmissions =
    mode !== 'all'
      ? submissions.filter((s) => s.category === mode).slice(0, 8)
      : [];

  return (
    <div className="space-y-7">
      {/* Account identity is taken from the signed-in account on the server. */}
      <section className="rounded-2xl bg-[#0B1528] border border-white/10 p-5 sm:p-6">
        <h2 className="font-display text-lg font-semibold text-white">
          {mode === 'all' ? 'Submit Daily Marketing Work' : CATEGORY_CONFIG[mode].label}
        </h2>
        <p className="text-xs text-slate-400 mt-1">Your account name and email are automatically attached to this submission.</p>
      </section>

      {/* Category Upload Cards */}
      <div
        className={`grid gap-6 ${
          mode === 'all' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1 max-w-3xl'
        }`}
      >
        {visibleCategories.map((cat) => (
          <CategoryUploadCard
            key={cat}
            category={cat}
            draft={drafts[cat]}
            onChangeQuantity={(val) =>
              updateDraft(cat, (prev) => ({
                ...prev,
                quantity: val,
                status: val ? 'ready' : prev.files.length > 0 ? 'ready' : 'idle',
                errorMessage: undefined,
              }))
            }
            onChangeDescription={(val) =>
              updateDraft(cat, (prev) => ({
                ...prev,
                description: val,
                errorMessage: undefined,
              }))
            }
            onAddFiles={(files) => handleAddFiles(cat, files)}
            onRemoveFile={(fileId) => handleRemoveFile(cat, fileId)}
            onValidationError={(msg) => onNotify('error', 'Invalid Screenshot', msg)}
            onSubmitSingle={
              mode !== 'all' ? () => submitCategories([cat]) : undefined
            }
            isSubmittingGlobal={isSubmittingAll}
          />
        ))}
      </div>

      {/* Unified SUBMIT ALL WORK Bar */}
      {mode === 'all' && (
        <section className="rounded-2xl bg-[#0B1528] border border-[#EAB308]/35 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-white">
              Ready to record this batch?
            </p>
            <p className="text-xs text-slate-400 mt-1 font-mono tabular-nums">
              Total queued: {totalDraftUnits.toLocaleString()} marketing units ·{' '}
              {totalDraftFiles} screenshot(s)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => resetCategories(CATEGORY_ORDER)}
              disabled={isSubmittingAll}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#070E1A] hover:bg-white/5 border border-white/15 text-slate-300 text-sm font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              Reset Form
            </button>
            <button
              type="button"
              onClick={() => submitCategories(CATEGORY_ORDER)}
              disabled={isSubmittingAll}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#EAB308] hover:bg-[#FACC15] disabled:opacity-60 text-[#070E1A] font-display font-bold text-sm tracking-wide whitespace-nowrap shrink-0 transition-colors cursor-pointer shadow-lg shadow-[#EAB308]/15"
            >
              <Send className="w-4 h-4" />
              {isSubmittingAll ? 'SUBMITTING WORK...' : 'SUBMIT ALL WORK'}
            </button>
          </div>
        </section>
      )}

      {/* Channel Specific Log when inside single category view */}
      {mode !== 'all' && (
        <section className="rounded-2xl bg-[#0B1528] border border-white/10 p-6">
          <h3 className="font-display text-base font-semibold text-white">
            Recent {CATEGORY_CONFIG[mode].label} Submissions
          </h3>
          <p className="text-xs text-slate-400 mt-0.5 mb-4">
            Latest verified entries logged in this channel
          </p>

          {categoryRecentSubmissions.length === 0 ? (
            <p className="text-sm text-slate-400 py-6 text-center border border-dashed border-white/10 rounded-xl">
              No {CATEGORY_CONFIG[mode].label} work submitted yet.
            </p>
          ) : (
            <div className="divide-y divide-white/10">
              {categoryRecentSubmissions.map((item) => (
                <div
                  key={item.id}
                  className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-semibold text-white">
                        {item.memberName}
                      </span>
                      <span className="text-slate-500">·</span>
                      <span className="font-mono tabular-nums text-xs text-slate-400">
                        {new Date(item.submittedAt).toLocaleString()}
                      </span>
                    </div>
                    {item.description && (
                      <p className="mt-1 text-xs text-slate-300">
                        {item.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <span className="font-mono tabular-nums text-sm font-bold text-[#FACC15]">
                      {item.quantity} {CATEGORY_CONFIG[mode].quantityUnit}
                    </span>
                    {item.screenshots.length > 0 && (
                      <div className="flex items-center gap-1.5">
                        {item.screenshots.map((shot, idx) => (
                          <button
                            key={shot.id}
                            type="button"
                            onClick={() =>
                              onInspectScreenshots(
                                item.screenshots,
                                idx,
                                `${item.memberName} — ${CATEGORY_CONFIG[mode].label}`
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
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
