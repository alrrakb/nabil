const FALLBACK_DEPT_COLORS = [
  "#3b82f6", "#10b981", "#f59e0b", "#ef4444",
  "#8b5cf6", "#06b6d4", "#f97316", "#84cc16",
];
const OTHERS_COLOR = "#94a3b8";
const MAX_DEPT_BARS = 3;

export interface DeptChartEntry {
  name: string;
  count: number;
  color: string;
}

export interface DeptChartData {
  chartData: DeptChartEntry[];
  legendData: DeptChartEntry[];
}

/**
 * Sorts departments by count desc, takes top 3, groups remainder into
 * "أقسام أخرى". legendData contains ONLY the top 3 — never "أقسام أخرى".
 */
export function buildDeptChartData(
  raw: { departmentName: string; departmentColor?: string | null; count: number }[]
): DeptChartData {
  if (!raw.length) return { chartData: [], legendData: [] };

  const sorted = [...raw].sort((a, b) => b.count - a.count);
  const top = sorted.slice(0, MAX_DEPT_BARS);
  const rest = sorted.slice(MAX_DEPT_BARS);

  const legendData: DeptChartEntry[] = top.map((d, i) => ({
    name: d.departmentName,
    count: d.count,
    color: d.departmentColor ?? FALLBACK_DEPT_COLORS[i % FALLBACK_DEPT_COLORS.length],
  }));

  const chartData: DeptChartEntry[] = [...legendData];
  if (rest.length) {
    chartData.push({
      name: "أقسام أخرى",
      count: rest.reduce((s, d) => s + d.count, 0),
      color: OTHERS_COLOR,
    });
  }

  return { chartData, legendData };
}
