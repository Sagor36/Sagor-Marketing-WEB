import { useRef, useState } from 'react';
import type { ChangeEvent, DragEvent } from 'react';
import {
  Instagram,
  Mail,
  Megaphone,
  Rocket,
  UploadCloud,
  X,
  CheckCircle2,
  AlertCircle,
  Clock,
} from 'lucide-react';
import {
  ALLOWED_IMAGE_TYPES,
  CATEGORY_CONFIG,
  MAX_IMAGE_SIZE_BYTES,
  MarketingCategory,
} from '../types/marketing';

export interface DraftFileItem {
  id: string;
  file: File;
  previewUrl: string;
}

export interface CategoryDraftState {
  quantity: string;
  description: string;
  files: DraftFileItem[];
  status: 'idle' | 'ready' | 'submitting' | 'submitted' | 'error';
  errorMessage?: string;
}

interface CategoryUploadCardProps {
  category: MarketingCategory;
  draft: CategoryDraftState;
  onChangeQuantity: (value: string) => void;
  onChangeDescription: (value: string) => void;
  onAddFiles: (files: DraftFileItem[]) => void;
  onRemoveFile: (fileId: string) => void;
  onValidationError: (message: string) => void;
  onSubmitSingle?: () => void;
  isSubmittingGlobal?: boolean;
}

function getCategoryIcon(category: MarketingCategory) {
  switch (category) {
    case 'instagram':
      return Instagram;
    case 'email':
      return Mail;
    case 'facebook':
      return Megaphone;
    case 'campaign':
      return Rocket;
  }
}

export function CategoryUploadCard({
  category,
  draft,
  onChangeQuantity,
  onChangeDescription,
  onAddFiles,
  onRemoveFile,
  onValidationError,
  onSubmitSingle,
  isSubmittingGlobal = false,
}: CategoryUploadCardProps) {
  const config = CATEGORY_CONFIG[category];
  const Icon = getCategoryIcon(category);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const processFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    const validDrafts: DraftFileItem[] = [];
    const errors: string[] = [];

    Array.from(fileList).forEach((file) => {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type.toLowerCase())) {
        errors.push(
          `"${file.name}" is not a supported image (PNG, JPG, WEBP, GIF).`
        );
        return;
      }
      if (file.size > MAX_IMAGE_SIZE_BYTES) {
        errors.push(`"${file.name}" exceeds the 5 MB maximum size.`);
        return;
      }
      if (draft.files.length + validDrafts.length >= 10) {
        errors.push('Maximum 10 screenshots per category submission.');
        return;
      }

      validDrafts.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        file,
        previewUrl: URL.createObjectURL(file),
      });
    });

    if (errors.length > 0) {
      onValidationError(errors[0]);
    }
    if (validDrafts.length > 0) {
      onAddFiles(validDrafts);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    processFiles(e.target.files);
    e.target.value = '';
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    processFiles(e.dataTransfer.files);
  };

  const qtyNum = Number(draft.quantity || 0);
  const hasContent =
    qtyNum > 0 || draft.files.length > 0 || draft.description.trim().length > 0;

  const renderStatus = () => {
    if (draft.status === 'error' && draft.errorMessage) {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-400">
          <AlertCircle className="w-3.5 h-3.5" />
          Needs attention
        </span>
      );
    }
    if (draft.status === 'submitted') {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Submitted
        </span>
      );
    }
    if (hasContent) {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#FACC15]">
          <Clock className="w-3.5 h-3.5" />
          Ready to submit
        </span>
      );
    }
    return (
      <span className="text-xs text-slate-400">Awaiting entry</span>
    );
  };

  return (
    <section className="rounded-2xl bg-[#0B1528] border border-white/10 p-6 transition-colors duration-200 hover:border-[#EAB308]/35 flex flex-col justify-between">
      <div>
        {/* Card Header */}
        <div className="flex items-start justify-between gap-4 pb-5 border-b border-white/10">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="h-11 w-11 rounded-xl bg-[#111E36] border border-white/10 flex items-center justify-center text-[#FACC15] shrink-0">
              <Icon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-display text-lg font-semibold text-white truncate">
                {config.label}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Upload proof screenshots &amp; log completed count
              </p>
            </div>
          </div>
          <div className="shrink-0 pt-0.5">{renderStatus()}</div>
        </div>

        {/* Screenshot Upload Field */}
        <div className="mt-5">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-slate-200">
              Screenshots (Multiple allowed)
            </label>
            <span className="text-xs font-mono tabular-nums text-slate-400">
              {draft.files.length} / 10 attached
            </span>
          </div>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            className={`cursor-pointer rounded-xl border border-dashed p-5 text-center transition-colors duration-150 ${
              isDragging
                ? 'border-[#EAB308] bg-[#EAB308]/10'
                : 'border-white/15 bg-[#070E1A]/60 hover:border-[#EAB308]/50 hover:bg-[#111E36]/60'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
            <UploadCloud className="w-7 h-7 text-[#FACC15] mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-200">
              Click to upload or drag screenshots here
            </p>
            <p className="text-xs text-slate-400 mt-1">
              PNG, JPG, WEBP, or GIF up to 5 MB each
            </p>
          </div>

          {draft.files.length > 0 && (
            <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 gap-2.5">
              {draft.files.map((item) => (
                <div
                  key={item.id}
                  className="group relative aspect-square rounded-lg overflow-hidden border border-white/10 bg-[#070E1A]"
                >
                  <img
                    src={item.previewUrl}
                    alt={item.file.name}
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveFile(item.id);
                    }}
                    className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full bg-black/75 text-white flex items-center justify-center opacity-90 hover:bg-rose-600 transition-colors"
                    aria-label={`Remove ${item.file.name}`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-1.5 py-1">
                    <p className="text-[10px] text-slate-200 truncate">
                      {item.file.name}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quantity Input */}
        <div className="mt-5">
          <label
            htmlFor={`qty-${category}`}
            className="block text-sm font-medium text-slate-200 mb-2"
          >
            {config.quantityPrompt}
          </label>
          <div className="relative">
            <input
              id={`qty-${category}`}
              type="number"
              min={0}
              step={1}
              inputMode="numeric"
              value={draft.quantity}
              onChange={(e) => onChangeQuantity(e.target.value)}
              placeholder="0"
              className="w-full rounded-xl bg-[#070E1A] border border-white/15 px-4 py-2.5 pr-28 text-sm font-mono tabular-nums text-white placeholder:text-slate-500 focus:outline-none focus:border-[#EAB308] focus:ring-1 focus:ring-[#EAB308]/40"
            />
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400">
              {config.quantityUnit}
            </span>
          </div>
        </div>

        {/* Description / Campaign Details */}
        <div className="mt-4">
          <label
            htmlFor={`desc-${category}`}
            className="block text-sm font-medium text-slate-200 mb-2"
          >
            {config.descriptionLabel}
          </label>
          <textarea
            id={`desc-${category}`}
            rows={3}
            maxLength={1500}
            value={draft.description}
            onChange={(e) => onChangeDescription(e.target.value)}
            placeholder={config.descriptionPlaceholder}
            className="w-full rounded-xl bg-[#070E1A] border border-white/15 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-[#EAB308] focus:ring-1 focus:ring-[#EAB308]/40 resize-none"
          />
        </div>

        {draft.errorMessage && (
          <p className="mt-3 text-xs text-rose-400 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            {draft.errorMessage}
          </p>
        )}
      </div>

      {onSubmitSingle && (
        <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between gap-4">
          <span className="text-xs text-slate-400">
            Saves directly to team history
          </span>
          <button
            type="button"
            onClick={onSubmitSingle}
            disabled={isSubmittingGlobal || draft.status === 'submitting'}
            className="px-4 py-2 rounded-xl bg-[#EAB308] hover:bg-[#FACC15] disabled:opacity-50 text-[#070E1A] font-semibold text-xs whitespace-nowrap shrink-0 transition-colors cursor-pointer"
          >
            {draft.status === 'submitting' ? 'Submitting...' : `Submit ${config.shortLabel}`}
          </button>
        </div>
      )}
    </section>
  );
}
