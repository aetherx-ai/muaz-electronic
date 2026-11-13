import React, { useState, useEffect, useMemo } from 'react';
import {
  Check,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  XCircle,
  Minus,
  Plus,
  Loader2,
} from 'lucide-react';
import { CLOTHING_SIZES, ClothingSize } from '../../types';
import { sanitizeWholeStock } from '../../lib/sizeInventory';

export interface SizeDraftEntry {
  enabled: boolean;
  stock: number | '';
}

export type SizeDraftMap = Record<ClothingSize, SizeDraftEntry>;

interface ClothingSizeStockManagerProps {
  value: SizeDraftMap;
  onChange: (next: SizeDraftMap) => void;
  onSaveChanges?: () => Promise<{ success: boolean; error?: string | null; message?: string }>;
  saveButtonLabel?: string;
  isDirty?: boolean;
  validationError?: string | null;
  compact?: boolean;
}

const SIZE_DESCRIPTIONS: Record<ClothingSize, string> = {
  S: 'Small',
  M: 'Medium',
  L: 'Large',
  XL: 'Extra Large',
  XXL: '2X Large',
};

const LOW_STOCK_THRESHOLD = 5;

export const ClothingSizeStockManager: React.FC<ClothingSizeStockManagerProps> = ({
  value,
  onChange,
  onSaveChanges,
  saveButtonLabel = 'Save Changes',
  isDirty = false,
  validationError = null,
  compact = false,
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Clear stale success feedback as soon as admin makes another edit
  useEffect(() => {
    if (isDirty && feedback?.type === 'success') {
      setFeedback(null);
    }
  }, [isDirty, feedback?.type]);

  const { enabledCount, totalUnits } = useMemo(() => {
    let active = 0;
    let sum = 0;
    for (const sz of CLOTHING_SIZES) {
      const entry = value[sz];
      if (entry?.enabled) {
        active++;
        sum += entry.stock === '' ? 0 : sanitizeWholeStock(entry.stock);
      }
    }
    return { enabledCount: active, totalUnits: sum };
  }, [value]);

  const handleToggleSize = (size: ClothingSize) => {
    const prevEntry = value[size];
    const nextEnabled = !prevEntry.enabled;
    onChange({
      ...value,
      [size]: {
        enabled: nextEnabled,
        stock: nextEnabled
          ? typeof prevEntry.stock === 'number'
            ? prevEntry.stock
            : 0
          : 0,
      },
    });
    setFeedback(null);
  };

  const handleStockInput = (size: ClothingSize, rawValue: string) => {
    if (rawValue === '') {
      onChange({
        ...value,
        [size]: {
          ...value[size],
          stock: '',
        },
      });
      setFeedback(null);
      return;
    }

    const parsed = Math.max(0, Math.floor(Number(rawValue)));
    if (!Number.isFinite(parsed)) return;

    onChange({
      ...value,
      [size]: {
        enabled: true,
        stock: parsed,
      },
    });
    setFeedback(null);
  };

  const handleBlurStock = (size: ClothingSize) => {
    const entry = value[size];
    if (!entry.enabled) return;
    const sanitized = sanitizeWholeStock(entry.stock);
    if (entry.stock !== sanitized) {
      onChange({
        ...value,
        [size]: {
          ...entry,
          stock: sanitized,
        },
      });
    }
  };

  const handleStepStock = (size: ClothingSize, delta: number) => {
    const entry = value[size];
    if (!entry.enabled) return;
    const current = entry.stock === '' ? 0 : sanitizeWholeStock(entry.stock);
    const next = Math.max(0, current + delta);
    onChange({
      ...value,
      [size]: {
        ...entry,
        stock: next,
      },
    });
    setFeedback(null);
  };

  const handleEnableAll = () => {
    const next = { ...value };
    for (const sz of CLOTHING_SIZES) {
      next[sz] = {
        enabled: true,
        stock: typeof value[sz].stock === 'number' ? value[sz].stock : 0,
      };
    }
    onChange(next);
    setFeedback(null);
  };

  const handleDisableAll = () => {
    onChange({
      S: { enabled: false, stock: 0 },
      M: { enabled: false, stock: 0 },
      L: { enabled: false, stock: 0 },
      XL: { enabled: false, stock: 0 },
      XXL: { enabled: false, stock: 0 },
    });
    setFeedback(null);
  };

  const handleSaveClick = async () => {
    if (!onSaveChanges || isSaving) return;

    // Validate enabled size quantities before saving
    for (const sz of CLOTHING_SIZES) {
      const entry = value[sz];
      if (!entry.enabled) continue;
      const num = Number(entry.stock);
      if (entry.stock === '' || !Number.isFinite(num) || num < 0 || !Number.isInteger(num)) {
        setFeedback({
          type: 'error',
          message: `Size ${sz} stock must be a whole number (0 or greater).`,
        });
        return;
      }
    }

    setIsSaving(true);
    setFeedback(null);
    try {
      const res = await onSaveChanges();
      if (res.success) {
        setFeedback({
          type: 'success',
          message: res.message || 'Size and stock changes saved successfully.',
        });
      } else if (res.error) {
        setFeedback({
          type: 'error',
          message: res.error,
        });
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to save size inventory.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-[12px] shadow-xs overflow-hidden">
      {/* Header */}
      <div
        className={`${
          compact ? 'px-4 py-3' : 'px-4 py-3.5 sm:px-5'
        } border-b border-slate-200/80 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3`}
      >
        <div>
          <h3 className="text-sm font-semibold text-slate-900 font-display">
            Clothing Size &amp; Stock Management
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Toggle sizes and manage independent stock quantities for S, M, L, XL, and XXL.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <div className="text-xs text-slate-500 tabular-nums">
            <span className="font-semibold text-slate-800">{enabledCount}/5</span> active
            <span className="mx-1.5 text-slate-300" aria-hidden="true">
              ·
            </span>
            Total: <span className="font-semibold text-slate-900">{totalUnits}</span> units
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleEnableAll}
              className="px-2.5 py-1.5 text-xs font-medium text-[#15803D] bg-emerald-50/80 hover:bg-emerald-100/80 border border-emerald-200 rounded-[10px] transition-colors whitespace-nowrap"
            >
              Enable All
            </button>
            <button
              type="button"
              onClick={handleDisableAll}
              className="px-2.5 py-1.5 text-xs font-medium text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-[10px] transition-colors whitespace-nowrap"
            >
              Disable All
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Column Headers */}
      <div
        className={`hidden md:grid ${
          compact
            ? 'md:grid-cols-[128px_125px_1fr_118px] gap-3 px-4 py-2'
            : 'md:grid-cols-[150px_145px_1fr_140px] gap-4 px-5 py-2.5'
        } items-center bg-slate-50/90 border-b border-slate-200/80 text-[11px] font-semibold text-slate-500 tracking-wide`}
      >
        <span>Size</span>
        <span>Availability</span>
        <span>Stock Quantity</span>
        <span className="text-right">Stock Status</span>
      </div>

      {/* Five Independent Size Rows */}
      <div className="divide-y divide-slate-200/75">
        {CLOTHING_SIZES.map((sz) => {
          const entry = value[sz];
          const isEnabled = Boolean(entry?.enabled);
          const numStock =
            entry?.stock === '' ? 0 : sanitizeWholeStock(entry?.stock);

          const statusMeta = !isEnabled
            ? {
                label: 'Disabled',
                badgeClass: 'bg-slate-100 text-slate-500 border-slate-200',
                Icon: null,
              }
            : numStock === 0
            ? {
                label: 'Out of Stock',
                badgeClass: 'bg-rose-50 text-rose-700 border-rose-200/90',
                Icon: XCircle,
              }
            : numStock <= LOW_STOCK_THRESHOLD
            ? {
                label: 'Low Stock',
                badgeClass: 'bg-amber-50 text-amber-800 border-amber-200/90',
                Icon: AlertTriangle,
              }
            : {
                label: 'In Stock',
                badgeClass: 'bg-emerald-50 text-[#15803D] border-emerald-200/90',
                Icon: CheckCircle2,
              };

          const StatusIcon = statusMeta.Icon;

          return (
            <div
              key={sz}
              className={`${
                compact ? 'px-4 py-3' : 'px-4 py-3.5 sm:px-5'
              } transition-colors duration-150 ${
                isEnabled ? 'bg-white' : 'bg-slate-50/85'
              }`}
            >
              <div
                className={`grid grid-cols-1 ${
                  compact
                    ? 'md:grid-cols-[128px_125px_1fr_118px] gap-3'
                    : 'md:grid-cols-[150px_145px_1fr_140px] gap-3 md:gap-4'
                } items-center`}
              >
                {/* 1. Size Label + Mobile Status */}
                <div className="flex items-center justify-between md:justify-start gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-9 rounded-[10px] border flex items-center justify-center font-mono text-sm font-bold shrink-0 transition-colors ${
                        isEnabled
                          ? 'bg-emerald-50 text-[#15803D] border-emerald-200'
                          : 'bg-slate-100 text-slate-400 border-slate-200'
                      }`}
                    >
                      {sz}
                    </div>
                    <div>
                      <span
                        className={`text-xs font-semibold block ${
                          isEnabled ? 'text-slate-900' : 'text-slate-400'
                        }`}
                      >
                        Size {sz}
                      </span>
                      <span
                        className={`text-[11px] block ${
                          isEnabled ? 'text-slate-500' : 'text-slate-400'
                        }`}
                      >
                        {SIZE_DESCRIPTIONS[sz]}
                      </span>
                    </div>
                  </div>

                  {/* Mobile Status Indicator */}
                  <div className="md:hidden">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[10px] border text-xs font-medium whitespace-nowrap ${statusMeta.badgeClass}`}
                    >
                      {StatusIcon && <StatusIcon className="w-3.5 h-3.5 shrink-0" />}
                      <span>{statusMeta.label}</span>
                    </span>
                  </div>
                </div>

                {/* 2. Enable / Disable Toggle */}
                <div className="flex items-center justify-between md:justify-start gap-2.5">
                  <span className="text-xs font-medium text-slate-500 md:hidden">
                    Availability
                  </span>
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={isEnabled}
                      aria-label={`Enable size ${sz}`}
                      onClick={() => handleToggleSize(sz)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A]/30 ${
                        isEnabled ? 'bg-[#16A34A]' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs transition-transform duration-150 ${
                          isEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    <span
                      className={`text-xs font-medium w-14 ${
                        isEnabled ? 'text-[#15803D]' : 'text-slate-400'
                      }`}
                    >
                      {isEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </div>

                {/* 3. Stock Quantity Input */}
                <div className="flex items-center justify-between md:justify-start gap-2">
                  <span className="text-xs font-medium text-slate-500 md:hidden">
                    Stock Quantity
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      aria-label={`Decrease stock for size ${sz}`}
                      disabled={!isEnabled || numStock <= 0}
                      onClick={() => handleStepStock(sz, -1)}
                      className="w-9 h-9 rounded-[10px] border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 flex items-center justify-center transition-colors disabled:bg-slate-100 disabled:text-slate-300 disabled:cursor-not-allowed"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>

                    <input
                      type="number"
                      min="0"
                      step="1"
                      disabled={!isEnabled}
                      aria-label={`Stock quantity for size ${sz}`}
                      value={isEnabled ? entry.stock : ''}
                      placeholder={isEnabled ? '0' : '—'}
                      onChange={(e) => handleStockInput(sz, e.target.value)}
                      onBlur={() => handleBlurStock(sz)}
                      className={`w-24 h-9 px-2.5 text-center text-sm font-mono font-semibold tabular-nums rounded-[10px] border transition-colors focus:outline-none ${
                        isEnabled
                          ? 'bg-white border-slate-300 text-slate-900 focus:border-[#16A34A] focus:ring-2 focus:ring-[#16A34A]/15'
                          : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                      }`}
                    />

                    <button
                      type="button"
                      aria-label={`Increase stock for size ${sz}`}
                      disabled={!isEnabled}
                      onClick={() => handleStepStock(sz, 1)}
                      className="w-9 h-9 rounded-[10px] border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 flex items-center justify-center transition-colors disabled:bg-slate-100 disabled:text-slate-300 disabled:cursor-not-allowed"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>

                    <span
                      className={`text-xs ml-1 hidden sm:inline ${
                        isEnabled ? 'text-slate-400' : 'text-slate-300'
                      }`}
                    >
                      pcs
                    </span>
                  </div>
                </div>

                {/* 4. Desktop Stock Status */}
                <div className="hidden md:flex justify-end">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[10px] border text-xs font-medium whitespace-nowrap ${statusMeta.badgeClass}`}
                  >
                    {StatusIcon && <StatusIcon className="w-3.5 h-3.5 shrink-0" />}
                    <span>{statusMeta.label}</span>
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Feedback & Save Action */}
      <div
        className={`${
          compact ? 'px-4 py-3' : 'px-4 py-3.5 sm:px-5'
        } bg-slate-50/80 border-t border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3`}
      >
        <div className="min-w-0 flex-1">
          {validationError ? (
            <p className="text-xs font-medium text-rose-700 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{validationError}</span>
            </p>
          ) : feedback?.type === 'error' ? (
            <p className="text-xs font-medium text-rose-700 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{feedback.message}</span>
            </p>
          ) : feedback?.type === 'success' ? (
            <p className="text-xs font-medium text-[#15803D] flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-[#16A34A]" />
              <span>{feedback.message}</span>
            </p>
          ) : isDirty ? (
            <p className="text-xs font-medium text-amber-700">
              Unsaved size or stock changes.
            </p>
          ) : (
            <p className="text-xs text-slate-500">
              Each size tracks stock independently. Disabled sizes appear as Out of Stock.
            </p>
          )}
        </div>

        {onSaveChanges && (
          <button
            type="button"
            onClick={handleSaveClick}
            disabled={isSaving}
            className="px-4 py-2 text-xs font-semibold text-white bg-[#16A34A] hover:bg-[#15803D] active:scale-[0.99] rounded-[10px] transition-colors shadow-xs flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5 stroke-[2.5] shrink-0" />
                <span>{saveButtonLabel}</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
