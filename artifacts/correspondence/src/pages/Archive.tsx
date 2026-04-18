import { useRef, useState } from "react";
import { useListArchive } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Archive as ArchiveIcon, Search, SlidersHorizontal, FileDown, FileSpreadsheet, Loader2 } from "lucide-react";
import { exportTableToPDF, exportTableToExcel } from "@/lib/exportUtils";

export default function Archive() {
  const tableRef = useRef<HTMLDivElement>(null);
  const { data: archives, isLoading } = useListArchive();

  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [exportingPDF, setExportingPDF] = useState(false);

  const filteredArchives = archives?.filter((item) => {
    const matchesSearch =
      !search ||
      (item.archiveNumber?.toLowerCase().includes(search.toLowerCase())) ||
      (item.correspondence?.referenceNumber?.toLowerCase().includes(search.toLowerCase())) ||
      (item.correspondence?.subject?.toLowerCase().includes(search.toLowerCase()));

    const archivedAt = new Date(item.archivedAt);
    const matchesFrom = !dateFrom || archivedAt >= new Date(dateFrom);
    const matchesTo = !dateTo || archivedAt <= new Date(dateTo + "T23:59:59");

    return matchesSearch && matchesFrom && matchesTo;
  });

  const handleExportPDF = async () => {
    if (!tableRef.current) return;
    setExportingPDF(true);
    try {
      await exportTableToPDF(
        tableRef.current,
        "archive-report",
        "تقرير الأرشيف — معهد دلتا العالي"
      );
    } finally {
      setExportingPDF(false);
    }
  };

  const handleExportExcel = () => {
    if (!filteredArchives) return;
    exportTableToExcel(
      filteredArchives.map((item) => ({
        archiveNumber: item.archiveNumber,
        referenceNumber: item.correspondence?.referenceNumber ?? "-",
        subject: item.correspondence?.subject ?? "-",
        location: item.archiveLocation ?? "-",
        archivedAt: format(new Date(item.archivedAt), "yyyy/MM/dd"),
        archivedBy: item.archivedByName ?? "-",
      })),
      [
        { key: "archiveNumber", header: "رقم الأرشيف" },
        { key: "referenceNumber", header: "الرقم المرجعي" },
        { key: "subject", header: "الموضوع" },
        { key: "location", header: "مكان الحفظ" },
        { key: "archivedAt", header: "تاريخ الأرشفة" },
        { key: "archivedBy", header: "بواسطة" },
      ],
      "archive-report",
      "الأرشيف"
    );
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ArchiveIcon className="h-6 w-6 text-muted-foreground" />
          <div>
            <h1 className="text-2xl font-bold">الأرشيف</h1>
            <p className="text-sm text-muted-foreground">استعراض المراسلات المؤرشفة.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportPDF}
            disabled={exportingPDF || isLoading || !filteredArchives?.length}
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
            disabled={isLoading || !filteredArchives?.length}
            className="gap-2 text-green-700 border-green-200 hover:bg-green-50"
          >
            <FileSpreadsheet className="h-4 w-4" />
            تصدير Excel
          </Button>
        </div>
      </div>

      {/* Advanced search — Bug 6 fix: proper flex-wrap layout */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-2 mb-3">
            <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">بحث متقدم</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {/* Text search */}
            <div className="relative min-w-[220px] flex-1">
              <Search className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ابحث بالعنوان أو الرقم المرجعي أو المرسل"
                className="pr-9 text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Date from */}
            <div className="flex flex-col gap-1 min-w-[140px]">
              <span className="text-xs text-muted-foreground">من تاريخ</span>
              <Input
                type="date"
                className="text-sm"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>

            {/* Date to */}
            <div className="flex flex-col gap-1 min-w-[140px]">
              <span className="text-xs text-muted-foreground">إلى تاريخ</span>
              <Input
                type="date"
                className="text-sm"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>

            {/* Reset */}
            {(search || dateFrom || dateTo) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setSearch(""); setDateFrom(""); setDateTo(""); }}
                className="text-muted-foreground mt-4"
              >
                مسح الفلاتر
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div ref={tableRef}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>رقم الأرشيف</TableHead>
                  <TableHead>الرقم المرجعي للمراسلة</TableHead>
                  <TableHead>الموضوع</TableHead>
                  <TableHead>مكان الحفظ</TableHead>
                  <TableHead>تاريخ الأرشفة</TableHead>
                  <TableHead>بواسطة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-6 w-full" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : filteredArchives?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      لا توجد مراسلات مؤرشفة تطابق بحثك
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredArchives?.map((item) => (
                    <TableRow key={item.id} className="hover:bg-muted/40 transition-colors">
                      <TableCell className="font-medium">{item.archiveNumber}</TableCell>
                      <TableCell>
                        <Link href={`/correspondences/${item.correspondenceId}`} className="text-primary hover:underline">
                          {item.correspondence?.referenceNumber}
                        </Link>
                      </TableCell>
                      <TableCell>{item.correspondence?.subject}</TableCell>
                      <TableCell>{item.archiveLocation || "-"}</TableCell>
                      <TableCell>{format(new Date(item.archivedAt), "yyyy/MM/dd")}</TableCell>
                      <TableCell>{item.archivedByName || "-"}</TableCell>
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
