// ANALYTICS page metrics — computed from snapshot scalars
export function deriveAnalyticsMetrics(summary: {
  annualized_return: number | null
  portfolio_volatility: number | null
  max_drawdown: number | null
  sharpe_ratio: number | null
}) {
  const RISK_FREE = 0.065
  const annReturn = summary.annualized_return ?? 0
  const vol = summary.portfolio_volatility ?? 0
  const maxDd = summary.max_drawdown ?? 0

  // Calmar Ratio: annualized return / |max drawdown|
  // Measures: how much return per 1% of worst-case loss
  const calmar =
    Math.abs(maxDd) > 0
      ? annReturn / Math.abs(maxDd)
      : 0

  // Return Efficiency: annualized return / volatility (raw, no risk-free adjustment)
  const returnEfficiency =
    vol > 0
      ? annReturn / vol
      : 0

  // Excess Return over risk-free rate
  const excessReturn = annReturn - RISK_FREE

  return { calmar, returnEfficiency, excessReturn }
}

// RISK STRESS page metrics — computed from daily drawdown array
export function deriveRiskMetrics(drawdownSeries: number[]) {
  if (!drawdownSeries || !drawdownSeries.length) {
    return { painIndex: 0, ulcerIndex: 0, recoveryDays: null }
  }

  // Pain Index: average of all daily drawdown values (always negative)
  // A portfolio with many moderate drawdowns has a worse pain index
  // than one with a single sharp drop that recovered quickly
  const painIndex = drawdownSeries.reduce((s, v) => s + v, 0) / drawdownSeries.length

  // Ulcer Index: sqrt(mean(drawdown²)) — penalises depth and duration together
  const ulcerIndex = Math.sqrt(
    drawdownSeries.reduce((s, v) => s + v * v, 0) / drawdownSeries.length
  )

  // Recovery Days: count days from max drawdown back to 0
  const maxDdIdx = drawdownSeries.reduce(
    (minIdx, v, i) => (v < drawdownSeries[minIdx] ? i : minIdx),
    0
  )
  const recoveryIdx = drawdownSeries.findIndex((v, i) => i > maxDdIdx && v >= -0.001)
  const recoveryDays = recoveryIdx === -1 ? null : recoveryIdx - maxDdIdx

  return { painIndex, ulcerIndex, recoveryDays }
}

// Risk grade: A / B / C / D
export function riskGrade(maxDrawdown: number | null, ulcerIndex: number): 'A' | 'B' | 'C' | 'D' {
  const dd = Math.abs(maxDrawdown ?? 0)
  const ulcer = Math.abs(ulcerIndex)
  if (dd < 0.1  && ulcer < 0.03) return 'A'
  if (dd < 0.2  && ulcer < 0.06) return 'B'
  if (dd < 0.35 && ulcer < 0.10) return 'C'
  return 'D'
}
