import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Asset } from "@/types";

interface Props {
  matrix: Record<string, Record<string, number>> | null;
  assets: Asset[];
}

export function CorrelationHeatmap({ matrix, assets }: Props) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = !mounted || theme === "dark";

  if (!matrix) {
    return (
      <Card className="bg-card border-border shadow-xl h-full flex flex-col">
        <CardHeader><CardTitle className="text-lg">Correlation Matrix</CardTitle></CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Not available</p>
        </CardContent>
      </Card>
    );
  }

  const tickers = assets.map(a => a.ticker);

  const getStyle = (value: number) => {
    if (value === 1) {
      return { 
        backgroundColor: isDark ? '#27272a' : '#e7e8e9', 
        color: isDark ? '#ffffff' : '#191c1d',
        fontWeight: 'bold' as const
      };
    }
    const absVal = Math.abs(value);
    const opacity = Math.max(0.15, absVal * 0.85);
    if (value > 0) {
      // Green scale
      const textColor = opacity > 0.5 ? '#ffffff' : (isDark ? '#e5e2e1' : '#191c1d');
      return { 
        backgroundColor: `rgba(34, 197, 94, ${opacity})`, 
        color: textColor,
        fontWeight: '500' as const
      };
    } else {
      // Red scale
      const textColor = opacity > 0.5 ? '#ffffff' : (isDark ? '#e5e2e1' : '#191c1d');
      return { 
        backgroundColor: `rgba(239, 68, 68, ${opacity})`, 
        color: textColor,
        fontWeight: '500' as const
      };
    }
  };

  return (
    <Card className="bg-card border-border shadow-xl h-full flex flex-col overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Correlation Matrix</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-x-auto mt-4">
        <div className="min-w-max border rounded-lg border-border overflow-hidden">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className="bg-muted p-2 border-b border-r border-border"></th>
                {tickers.map(t => (
                  <th key={t} className="bg-muted p-2 font-medium text-center border-b border-border text-on-surface">{t}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tickers.map((rowTicker, i) => (
                <tr key={rowTicker}>
                  <th className="bg-muted p-2 font-medium text-left border-r border-border border-b text-on-surface">{rowTicker}</th>
                  {tickers.map((colTicker) => {
                    const val = matrix[rowTicker]?.[colTicker] ?? 0;
                    const isLastRow = i === tickers.length - 1;
                    return (
                      <td 
                        key={colTicker} 
                        className={`p-3 text-center transition-colors ${!isLastRow ? 'border-b border-border/50' : ''}`}
                        style={getStyle(val)}
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
      </CardContent>
    </Card>
  );
}
