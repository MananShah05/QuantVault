export interface Asset {
  ticker: string;
  weight: number;
  asset_class?: string;
  display_name?: string | null;
  sector?: string | null;
}

export interface PortfolioSummary {
  annualized_return: number | null;
  portfolio_volatility: number | null;
  max_drawdown: number | null;
  sharpe_ratio: number | null;
}

export interface PortfolioListItem {
  id: string;
  name: string;
  status: string;
  created_at: string;
  last_computed: string | null;
  assets: Asset[];
  latest_snapshot: PortfolioSummary | null;
}

export interface Portfolio {
  id: string;
  name: string;
  status: string;
  created_at: string;
  last_computed: string | null;
  assets: Asset[];
  snapshots?: any[];
}

export interface DailyMetricRow {
  date: string;
  price: number | null;
  daily_return: number | null;
  rolling_vol_30d: number | null;
  drawdown: number | null;
  cumulative_return: number | null;
}

export interface PortfolioDailyRow {
  date: string;
  portfolio_return: number | null;
  rolling_vol_30d: number | null;
  drawdown: number | null;
  cumulative_return: number | null;
  benchmark_return: number | null;
  benchmark_cumulative_return: number | null;
  relative_alpha: number | null;
  tracking_difference: number | null;
}

export interface MetricsResponse {
  portfolio_id: string;
  range: string;
  assets: Record<string, DailyMetricRow[]>;
  portfolio: PortfolioDailyRow[];
}

export interface SnapshotResponse {
  portfolio_id: string;
  date: string | null;
  annualized_return: number | null;
  portfolio_volatility: number | null;
  max_drawdown: number | null;
  sharpe_ratio: number | null;
  correlation_matrix: Record<string, Record<string, number>> | null;
  computed_at: string | null;
  per_asset: Record<string, {
    annualized_return: number | null;
    volatility: number | null;
    sharpe: number | null;
    max_drawdown: number | null;
  }> | null;
}

export interface AssetSearchResult {
  ticker: string;
  name: string;
  exchange: string;
  asset_class: string;
}

export interface ComputeResult {
  status: string;
  assets_processed: number;
  date_range: {
    from?: string | null;
    to?: string | null;
  };
  rows_written: number;
  duration_seconds: number;
}

export interface SectorConcentrationItem {
  sector: string;
  weight: number;
}

export interface AllocationSummaryResponse {
  portfolio_id: string;
  total_exposure: number;
  intra_portfolio_correlation: number;
  sector_concentration: SectorConcentrationItem[];
  top_sector: string;
  diversification_score: number;
  as_of_date: string;
}

export type PortfolioSnapshot = SnapshotResponse;

