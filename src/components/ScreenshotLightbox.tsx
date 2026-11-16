import { ChevronLeft, ChevronRight, X, Image as ImageIcon } from 'lucide-react';
import { UploadedScreenshot } from '../types/marketing';

interface ScreenshotLightboxProps {
  screenshots: UploadedScreenshot[];
  activeIndex: number;
  title?: string;
  onClose: () => void;
  onChangeIndex: (index: number) => void;
}

export function ScreenshotLightbox({
  screenshots,
  activeIndex,
  title,
  onClose,
  onChangeIndex,
}: ScreenshotLightboxProps) {
  if (screenshots.length === 0) return null;
  const current = screenshots[activeIndex] || screenshots[0];

  const handlePrev = () => {
    onChangeIndex((activeIndex - 1 + screenshots.length) % screenshots.length);
  };

  const handleNext = () => {
    onChangeIndex((activeIndex + 1) % screenshots.length);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Screenshot viewer"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl rounded-2xl bg-[#0B1528] border border-white/15 overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10">
          <div className="flex items-center gap-3 min-w-0">
            <ImageIcon className="w-4 h-4 text-[#FACC15] shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">
                {title || current.originalName}
              </p>
              <p className="text-xs text-slate-400 font-mono tabular-nums">
                {activeIndex + 1} / {screenshots.length} ·{' '}
                {(current.sizeBytes / 1024).toFixed(1)} KB
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close preview"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="relative flex items-center justify-center bg-[#050A14] min-h-[320px] max-h-[75vh] p-4">
          <img
            src={current.url}
            alt={current.originalName}
            referrerPolicy="no-referrer"
            className="max-h-[68vh] w-auto max-w-full object-contain rounded-lg"
          />

          {screenshots.length > 1 && (
            <>
              <button
                type="button"
                onClick={handlePrev}
                className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-[#0B1528]/90 border border-white/15 text-white hover:border-[#EAB308]/60 transition-colors"
                aria-label="Previous screenshot"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-[#0B1528]/90 border border-white/15 text-white hover:border-[#EAB308]/60 transition-colors"
                aria-label="Next screenshot"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
