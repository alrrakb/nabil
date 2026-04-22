import { useGetCorrespondencesByDepartment, useGetCorrespondencesByStatus } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { statusTranslations } from "@/lib/translations";
import { Skeleton } from "@/components/ui/skeleton";
import { buildDeptChartData } from "@/lib/deptChart";

const COLORS = ["#1a2744", "#008080", "#eab308", "#ef4444", "#8b5cf6"];

export default function Reports() {
  const { data: byDeptRaw, isLoading: isLoadingDept } = useGetCorrespondencesByDepartment();
  const { data: byStatus, isLoading: isLoadingStatus } = useGetCorrespondencesByStatus();
  const { chartData: deptChartData, legendData: deptLegendData } = buildDeptChartData(Array.isArray(byDeptRaw) ? byDeptRaw : []);

  if (isLoadingDept || isLoadingStatus) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">التقارير</h1>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-[400px] w-full" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      </div>
    );
  }

  const pieData =
    byStatus?.map((s) => ({
      name: statusTranslations[s.status] || s.status,
      value: s.count,
    })) || [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">التقارير والإحصائيات</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar chart — by department */}
        <Card className="min-h-[350px] w-full">
          <CardHeader>
            <CardTitle>توزيع المراسلات حسب القسم</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={deptChartData} margin={{ top: 20, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" hide />
                <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  cursor={{ fill: "rgba(0,0,0,0.04)" }}
                  contentStyle={{ borderRadius: "8px", fontFamily: "Cairo, sans-serif" }}
                />
                <Bar dataKey="count" name="عدد المراسلات" radius={[4, 4, 0, 0]}>
                  {deptChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-2">
              {deptLegendData.map((entry) => (
                <div key={entry.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="inline-block h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                  {entry.name}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pie chart — by status, no inline labels (they caused overlap) */}
        <Card className="min-h-[350px] w-full">
          <CardHeader>
            <CardTitle>توزيع المراسلات حسب الحالة</CardTitle>
          </CardHeader>
          <CardContent className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="42%"
                  innerRadius={65}
                  outerRadius={105}
                  paddingAngle={4}
                  dataKey="value"
                  labelLine={false}
                >
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [value, name]}
                  contentStyle={{ borderRadius: "8px", fontFamily: "Cairo, sans-serif" }}
                />
                <Legend
                  layout="horizontal"
                  verticalAlign="bottom"
                  align="center"
                  wrapperStyle={{ paddingTop: "16px", fontFamily: "Cairo, sans-serif", fontSize: "13px" }}
                  formatter={(value) => <span dir="rtl">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
