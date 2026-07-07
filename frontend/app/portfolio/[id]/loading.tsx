// Skeleton mirrors the real analytics layout (header → metric strip →
// returns chart → vol/drawdown split → heatmap → attribution/allocation)
// so the transition to loaded content is a settle, not a layout jump.

function Bar({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

function MetricCardSkeleton() {
  return (
    <div className="bg-surface elev-1 border-t border-r border-b border-subtle border-l-[3px] border-l-[var(--border-strong)] p-5 flex flex-col justify-between min-h-[140px]">
      <div className="flex justify-between items-start">
        <Bar className="h-2.5 w-24" />
        <Bar className="h-3 w-3 rounded-sm" />
      </div>
      <Bar className="h-8 w-28 mt-3" />
      <div className="space-y-2 mt-4">
        <Bar className="h-2.5 w-20" />
        <Bar className="h-[3px] w-full" />
      </div>
    </div>
  );
}

function PanelSkeleton({ height, label = true }: { height: string; label?: boolean }) {
  return (
    <div className="bg-surface elev-1 border border-subtle rounded-lg p-5 flex flex-col">
      {label && <Bar className="h-2.5 w-44 mb-4" />}
      <Bar className={`w-full ${height} rounded-md`} />
    </div>
  );
}

export default function AnalyticsLoading() {
  return (
    <div className="w-full px-8 py-8 space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-6 border-b border-subtle">
        <div className="space-y-3">
          <Bar className="h-7 w-64" />
          <div className="flex gap-2">
            <Bar className="h-5 w-12 rounded" />
            <Bar className="h-5 w-12 rounded" />
            <Bar className="h-5 w-12 rounded" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Bar className="h-8 w-40 rounded-md" />
          <Bar className="h-8 w-24 rounded-md" />
        </div>
      </div>

      {/* Metric strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[0, 1, 2, 3].map((i) => <MetricCardSkeleton key={i} />)}
      </div>

      {/* Analytical grid */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12">
          <PanelSkeleton height="h-[360px]" />
        </div>
        <div className="col-span-12 lg:col-span-6">
          <PanelSkeleton height="h-[280px]" />
        </div>
        <div className="col-span-12 lg:col-span-6">
          <PanelSkeleton height="h-[280px]" />
        </div>
        <div className="col-span-12">
          <PanelSkeleton height="h-[300px]" />
        </div>
        <div className="col-span-12 lg:col-span-5">
          <PanelSkeleton height="h-[260px]" />
        </div>
        <div className="col-span-12 lg:col-span-7">
          <PanelSkeleton height="h-[260px]" />
        </div>
      </div>
    </div>
  );
}
