import type { AnalysisSummary } from '@/lib/types';

interface Props {
  analysis: AnalysisSummary;
}

export function DesignSystemPreview({ analysis }: Props) {
  return (
    <div className="space-y-6">
      {/* Colors */}
      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-400">
          Colors
        </h3>
        <div className="flex flex-wrap gap-3">
          {analysis.colors.map((color, i) => (
            <div key={i} className="flex items-center gap-2 rounded-lg bg-zinc-800/50 px-3 py-2">
              <div
                className="h-6 w-6 rounded-md border border-zinc-600"
                style={{ backgroundColor: color.value }}
              />
              <div>
                <p className="text-xs font-medium text-zinc-200">{color.label}</p>
                <p className="text-xs text-zinc-500">{color.name}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Fonts */}
      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-400">
          Typography
        </h3>
        <div className="space-y-2">
          {analysis.fonts.map((font, i) => (
            <div key={i} className="flex items-baseline gap-3 rounded-lg bg-zinc-800/50 px-4 py-3">
              <span className="text-xs font-medium uppercase text-orange-400">{font.role}</span>
              <span className="text-lg text-zinc-100" style={{ fontFamily: font.family }}>
                {font.family}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Spacing */}
      {analysis.spacing && (
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-400">
            Spacing Scale
          </h3>
          <div className="flex flex-wrap items-end gap-2">
            {analysis.spacing.values.map((val, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div
                  className="rounded bg-orange-500/30 border border-orange-500/50"
                  style={{ width: `${Math.min(val, 80)}px`, height: `${Math.min(val, 80)}px` }}
                />
                <span className="text-xs text-zinc-500">{val}px</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
