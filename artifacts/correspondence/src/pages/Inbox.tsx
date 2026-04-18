import { useRef, useState } from "react";
import { useListCorrespondences } from "@workspace/api-client-react";
import { CorrespondenceStatus, CorrespondenceType } from "@workspace/api-client-react";
import { statusTranslations, getStatusColor, priorityTranslations, getPriorityColor, typeTranslations } from "@/lib/translations";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Filter, FileDown, FileSpreadsheet, Loader2 } from "lucide-react";
import { exportTableToPDF, exportTableToExcel } from "@/lib/exportUtils";

export default function Inbox() {
  const tableRef = useRef<HTMLDivElement>(null);
  const [statusFilter, setStatusFilter] = useState<CorrespondenceStatus | "all">("all");
  const [typeFilter, setTypeFilter] = useState<CorrespondenceType | "all">("all");
  const [search, setSearch] = useState("");
  const [exportingPDF, setExportingPDF] = useState(false);

  const { data: correspondences, isLoading } = useListCorrespondences({
    status: statusFilter !== "all" ? (statusFilter as CorrespondenceStatus) : undefined,
    type: typeFilter !== "all" ? (typeFilter as CorrespondenceType) : undefined,
  });

  const filteredCorrespondences = correspondences?.filter(
    (c) => c.subject.includes(search) || c.referenceNumber.includes(search)
  );

  const handleExportPDF = async () => {
    if (!tableRef.current) return;
    setExportingPDF(true);
    try {
      await exportTableToPDF(
        tableRef.current,
        "inbox-report",
        "تقرير صندوق الوارد — معهد دلتا العالي"
      );
    } finally {
      setExportingPDF(false);
    }
  };

  const handleExportExcel = () => {
    if (!filteredCorrespondences) return;
    exportTableToExcel(
      filteredCorrespondences.map((c) => ({
        referenceNumber: c.referenceNumber,
        subject: c.subject,
        type: typeTranslations[c.type] ?? c.type,
        fromDepartment: c.fromDepartmentName ?? "-",
        toDepartment: c.toDepartmentName ?? "-",
        status: statusTranslations[c.status] ?? c.status,
        priority: priorityTranslations[c.priority] ?? c.priority,
        date: format(new Date(c.createdAt), "yyyy/MM/dd"),
      })),
      [
        { key: "referenceNumber", header: "الرقم المرجعي" },
        { key: "subject", header: "الموضوع" },
        { key: "type", header: "النوع" },
        { key: "fromDepartment", header: "من قسم" },
        { key: "toDepartment", header: "إلى قسم" },
        { key: "status", header: "الحالة" },
        { key: "priority", header: "الأولوية" },
        { key: "date", header: "التاريخ" },
      ],
      "inbox-report",
      "صندوق الوارد"
    );
  };

  return (
    <div className="space-y-6">
      {/* Header row: title + export buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">صندوق الوارد</h1>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportPDF}
            disabled={exportingPDF || isLoading || !filteredCorrespondences?.length}
            className="gap-2"
          >
            {exportingPDF ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileDown className="h-4 w-4" />
            )}
            تصدير PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportExcel}
            disabled={isLoading || !filteredCorrespondences?.length}
            className="gap-2 text-green-700 border-green-200 hover:bg-green-50"
          >
            <FileSpreadsheet className="h-4 w-4" />
            تصدير Excel
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative">
          <Search className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="بحث بالرقم أو الموضوع..."
            className="pl-4 pr-9 w-[250px]"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as CorrespondenceStatus | "all")}>
          <SelectTrigger className="w-[150px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="حالة المراسلة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الحالات</SelectItem>
            {Object.entries(CorrespondenceStatus).map(([key, value]) => (
              <SelectItem key={key} value={value}>{statusTranslations[value]}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as CorrespondenceType | "all")}>
          <SelectTrigger className="w-[150px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="نوع المراسلة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الأنواع</SelectItem>
            {Object.entries(CorrespondenceType).map(([key, value]) => (
              <SelectItem key={key} value={value}>{typeTranslations[value]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div ref={tableRef}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الرقم المرجعي</TableHead>
                  <TableHead>الموضوع</TableHead>
                  <TableHead>النوع</TableHead>
                  <TableHead>من قسم</TableHead>
                  <TableHead>إلى قسم</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>الأولوية</TableHead>
                  <TableHead>التاريخ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 8 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-6 w-full" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : filteredCorrespondences?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">لا توجد مراسلات</TableCell>
                  </TableRow>
                ) : (
                  filteredCorrespondences?.map((item) => (
                    <TableRow key={item.id} className="hover:bg-muted/40 transition-colors">
                      <TableCell className="font-medium">
                        <Link href={`/correspondences/${item.id}`} className="text-primary hover:underline">
                          {item.referenceNumber}
                        </Link>
                      </TableCell>
                      <TableCell>{item.subject}</TableCell>
                      <TableCell>{typeTranslations[item.type]}</TableCell>
                      <TableCell>{item.fromDepartmentName || "-"}</TableCell>
                      <TableCell>{item.toDepartmentName || "-"}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(item.status) as "default" | "secondary" | "destructive" | "outline"}>{statusTranslations[item.status]}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getPriorityColor(item.priority) as "default" | "secondary" | "destructive" | "outline"}>{priorityTranslations[item.priority]}</Badge>
                      </TableCell>
                      <TableCell>{format(new Date(item.createdAt), "yyyy/MM/dd")}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
