import { useGetDashboardSummary, useGetRecentCorrespondences, useGetCorrespondencesByDepartment, useGetCorrespondencesByStatus } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Inbox, Clock, CheckCircle2, Archive, AlertCircle, Building2, Users, FileText } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { statusTranslations, getStatusColor, priorityTranslations, getPriorityColor, typeTranslations } from "@/lib/translations";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { Link } from "wouter";

const COLORS = ['#1a2744', '#008080', '#eab308', '#ef4444', '#8b5cf6'];

export default function Dashboard() {
  const { data: summary, isLoading: isLoadingSummary } = useGetDashboardSummary();
  const { data: recent, isLoading: isLoadingRecent } = useGetRecentCorrespondences({ limit: 5 });
  const { data: byDept, isLoading: isLoadingDept } = useGetCorrespondencesByDepartment();
  const { data: byStatus, isLoading: isLoadingStatus } = useGetCorrespondencesByStatus();

  if (isLoadingSummary || isLoadingRecent || isLoadingDept || isLoadingStatus) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">الرئيسية</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4 rounded-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const stats = [
    { title: "إجمالي المراسلات", value: summary?.totalCorrespondences || 0, icon: FileText, color: "text-blue-600" },
    { title: "قيد الانتظار", value: summary?.pendingCount || 0, icon: Clock, color: "text-yellow-600" },
    { title: "جاري التنفيذ", value: summary?.inProgressCount || 0, icon: Inbox, color: "text-orange-600" },
    { title: "مكتملة", value: summary?.completedCount || 0, icon: CheckCircle2, color: "text-green-600" },
    { title: "مؤرشفة", value: summary?.archivedCount || 0, icon: Archive, color: "text-gray-600" },
    { title: "مراسلات عاجلة", value: summary?.urgentCount || 0, icon: AlertCircle, color: "text-red-600" },
    { title: "إجمالي الأقسام", value: summary?.totalDepartments || 0, icon: Building2, color: "text-indigo-600" },
    { title: "إجمالي الموظفين", value: summary?.totalEmployees || 0, icon: Users, color: "text-teal-600" },
  ];

  const pieData = byStatus?.map(s => ({
    name: statusTranslations[s.status] || s.status,
    value: s.count
  })) || [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">الرئيسية</h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>المراسلات حسب القسم</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byDept || []} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="departmentName" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>حالة المراسلات</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>أحدث المراسلات</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الرقم المرجعي</TableHead>
                <TableHead>الموضوع</TableHead>
                <TableHead>النوع</TableHead>
                <TableHead>الجهة المرسلة</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>الأولوية</TableHead>
                <TableHead>التاريخ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recent?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">لا توجد مراسلات حديثة</TableCell>
                </TableRow>
              )}
              {recent?.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    <Link href={`/correspondences/${item.id}`} className="text-primary hover:underline">
                      {item.referenceNumber}
                    </Link>
                  </TableCell>
                  <TableCell>{item.subject}</TableCell>
                  <TableCell>{typeTranslations[item.type]}</TableCell>
                  <TableCell>{item.fromDepartmentName || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(item.status)}>{statusTranslations[item.status]}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getPriorityColor(item.priority)}>{priorityTranslations[item.priority]}</Badge>
                  </TableCell>
                  <TableCell>{format(new Date(item.createdAt), 'yyyy/MM/dd')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
