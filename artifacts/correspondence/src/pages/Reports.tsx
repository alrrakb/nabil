import { useGetCorrespondencesByDepartment, useGetCorrespondencesByStatus } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { statusTranslations } from "@/lib/translations";
import { Skeleton } from "@/components/ui/skeleton";

const COLORS = ['#1a2744', '#008080', '#eab308', '#ef4444', '#8b5cf6'];

export default function Reports() {
  const { data: byDept, isLoading: isLoadingDept } = useGetCorrespondencesByDepartment();
  const { data: byStatus, isLoading: isLoadingStatus } = useGetCorrespondencesByStatus();

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

  const pieData = byStatus?.map(s => ({
    name: statusTranslations[s.status] || s.status,
    value: s.count
  })) || [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">التقارير والإحصائيات</h1>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>توزيع المراسلات حسب القسم</CardTitle>
          </CardHeader>
          <CardContent className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byDept || []} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="departmentName" tickLine={false} axisLine={false} angle={-45} textAnchor="end" height={60} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px' }} />
                <Bar dataKey="count" name="عدد المراسلات" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>المراسلات حسب الحالة</CardTitle>
          </CardHeader>
          <CardContent className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={true}
                >
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '8px' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
