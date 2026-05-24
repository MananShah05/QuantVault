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

  const getStyle = (value: number, rowTicker: string, colTicker: string) => {
    if (rowTicker === colTicker) {
      return { 
        backgroundColor: 'var(--bg-elevated)', 
        color: 'var(--text-muted)',
        fontFamily: 'IBM Plex Mono',
        fontSize: '13px'
      };
    }
    const absVal = Math.abs(value);
    // Opacity mapped: Math.abs(correlation) * 0.6 — never full saturation
    const opacity = absVal * 0.6;
    if (value > 0) {
      // Accent blue scale (rgba(79, 142, 247, opacity))
      return { 
        backgroundColor: `rgba(79, 142, 247, ${opacity})`, 
        color: 'var(--text-primary)',
        fontFamily: 'IBM Plex Mono',
        fontSize: '13px',
        fontWeight: 500
      };
    } else {
      // Negative red scale (rgba(248, 113, 113, opacity))
      return { 
        backgroundColor: `rgba(248, 113, 113, ${opacity})`, 
        color: 'var(--text-primary)',
        fontFamily: 'IBM Plex Mono',
        fontSize: '13px',
        fontWeight: 500
      };
    }
  };

  return (
    <div className="bg-surface border border-subtle rounded-lg p-5 select-none w-full">
      <span className="text-[10px] font-sans font-medium tracking-[0.12em] text-[var(--text-muted)] uppercase block mb-4">
        CROSS-ASSET CORRELATION MATRIX
      </span>
      <div className="overflow-x-auto w-full pt-2">
        <div className="min-w-max border border-subtle rounded-md overflow-hidden bg-base">
          <table className="w-full border-collapse table-fixed">
            <thead>
              <tr className="border-b border-subtle">
                <th className="bg-surface p-3 border-r border-subtle w-24"></th>
                {tickers.map(t => (
                  <th 
                    key={t} 
                    className="bg-surface px-3 py-2.5 font-mono text-[11px] text-[var(--text-muted)] text-center w-24"
                  >
                    {t}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tickers.map((rowTicker) => (
                <tr key={rowTicker} className="border-b border-subtle last:border-b-0">
                  <th 
                    className="bg-surface px-3 py-2.5 font-mono text-[11px] text-[var(--text-muted)] text-left border-r border-subtle"
                  >
                    {rowTicker}
                  </th>
                  {tickers.map((colTicker) => {
                    const val = matrix[rowTicker]?.[colTicker] ?? 0;
                    return (
                      <td 
                        key={colTicker} 
                        className="h-14 p-2 text-center"
                        style={getStyle(val, rowTicker, colTicker)}
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
      </div>
    </div>
  );
}
