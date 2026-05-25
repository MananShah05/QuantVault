import { Asset } from "@/types";

interface Props {
  matrix: Record<string, Record<string, number>> | null;
  assets: Asset[];
}

export function CorrelationHeatmap({ matrix, assets }: Props) {

  if (!matrix) {
    return (
      <div className="bg-surface border border-subtle rounded-lg p-6 text-center select-none font-sans">
        <span className="text-[10px] font-sans font-medium tracking-[0.12em] text-[var(--text-muted)] uppercase block mb-4 text-left">
          CORRELATION MATRIX
        </span>
        <p className="text-xs text-[var(--text-muted)] py-8">Correlation matrix is not available.</p>
      </div>
    );
  }

  const tickers = assets.map(a => a.ticker);

  // Filter tickers to only those present in the matrix keys
  const validTickers = tickers.filter(t => t in matrix);

  if (validTickers.length === 0) {
    return (
      <div className="bg-surface border border-subtle rounded-lg p-6 text-center select-none font-sans">
        <span className="text-[10px] font-sans font-medium tracking-[0.12em] text-[var(--text-muted)] uppercase block mb-4 text-left">
          CROSS-ASSET CORRELATION MATRIX
        </span>
        <p className="text-xs text-[var(--text-muted)] py-8">No correlation data found for the current assets.</p>
      </div>
    );
  }

  const getCellColor = (value: number, isDiagonal: boolean) => {
    if (isDiagonal) {
      return {
        backgroundColor: 'var(--bg-elevated)',
        color: 'var(--text-muted)',
      };
    }
    const absVal = Math.abs(value);
    const opacity = Math.max(absVal * 0.65, 0.05);
    if (value > 0) {
      return {
        backgroundColor: `rgba(79, 142, 247, ${opacity})`,
        color: absVal > 0.4 ? '#ffffff' : 'var(--text-primary)',
      };
    } else {
      return {
        backgroundColor: `rgba(248, 113, 113, ${opacity})`,
        color: absVal > 0.4 ? '#ffffff' : 'var(--text-primary)',
      };
    }
  };

  // Use a fixed cell size for a properly sized grid
  const cellSize = "80px";

  return (
    <div className="bg-surface border border-subtle rounded-lg p-5 select-none w-full">
      <span className="text-[10px] font-sans font-medium tracking-[0.12em] text-[var(--text-muted)] uppercase block mb-4">
        CROSS-ASSET CORRELATION MATRIX
      </span>
      <div className="overflow-x-auto w-full pt-2">
        <table
          className="border-collapse"
          style={{ width: 'auto' }}
        >
          <thead>
            <tr>
              {/* Empty corner cell */}
              <th
                className="bg-surface border-b border-r border-subtle"
                style={{ width: cellSize, minWidth: cellSize }}
              />
              {validTickers.map(t => (
                <th
                  key={t}
                  className="bg-surface border-b border-subtle font-mono text-[11px] text-[var(--text-muted)] text-center font-medium"
                  style={{ width: cellSize, minWidth: cellSize, padding: '10px 8px' }}
                >
                  {t}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {validTickers.map((rowTicker) => (
              <tr key={rowTicker}>
                <th
                  className="bg-surface font-mono text-[11px] text-[var(--text-muted)] text-left font-medium border-r border-b border-subtle"
                  style={{ width: cellSize, minWidth: cellSize, padding: '10px 12px' }}
                >
                  {rowTicker}
                </th>
                {validTickers.map((colTicker) => {
                  const isDiagonal = rowTicker === colTicker;
                  const val = matrix[rowTicker]?.[colTicker] ?? 0;
                  const colors = getCellColor(val, isDiagonal);
                  return (
                    <td
                      key={colTicker}
                      className="text-center font-mono text-[13px] font-medium border-b border-subtle transition-colors"
                      style={{
                        width: cellSize,
                        minWidth: cellSize,
                        height: '56px',
                        padding: '8px',
                        ...colors,
                      }}
                    >
                      {val.toFixed(2)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-4 mt-4 pt-3 border-t border-subtle">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'rgba(248, 113, 113, 0.5)' }} />
          <span className="font-mono text-[10px] text-[var(--text-muted)]">Negative</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-elevated border border-subtle" />
          <span className="font-mono text-[10px] text-[var(--text-muted)]">Diagonal</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'rgba(79, 142, 247, 0.5)' }} />
          <span className="font-mono text-[10px] text-[var(--text-muted)]">Positive</span>
        </div>
      </div>
    </div>
  );
}
