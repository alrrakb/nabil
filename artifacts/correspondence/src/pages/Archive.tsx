import { useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useListArchive } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Archive as ArchiveIcon, Search, SlidersHorizontal, FileSpreadsheet } from "lucide-react";
import { exportTableToExcel } from "@/lib/exportUtils";

export default function Archive() {
  const { user } = useAuth();
  const tableRef = useRef<HTMLDivElement>(null);

  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const { data: filteredArchives, isLoading } = useListArchive({
    search: search || undefined,
    fromDate: dateFrom || undefined,
    toDate: dateTo || undefined,
    viewerRole: user?.role,
  });

  const handleExportExcel = () => {
    if (!filteredArchives) return;
    exportTableToExcel(
      filteredArchives.map((item) => ({
        referenceNumber: item.correspondence?.referenceNumber ?? "-",
        subject: item.correspondence?.subject ?? "-",
        archiveReason: item.archiveReason ?? "-",
        archivedAt: item.createdAt ? format(new Date(item.createdAt), "yyyy/MM/dd") : "-",
        archivedBy: item.archivedByName ?? "-",
      })),
      [
        { key: "referenceNumber", header: "الرقم المرجعي" },
        { key: "subject", header: "الموضوع" },
        { key: "archiveReason", header: "سبب الأرشفة" },
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
            onClick={handleExportExcel}
            disabled={isLoading || !filteredArchives?.length}
            className="gap-2 text-green-700 border-green-200 hover:bg-green-50"
          >
            <FileSpreadsheet className="h-4 w-4" />
            تصدير Excel
          </Button>
        </div>
      </div>

      {/* Advanced search */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-2 mb-3">
            <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">بحث متقدم</span>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div className="relative min-w-[220px] flex-1">
              <span className="text-xs text-muted-foreground block mb-1">بحث</span>
              <Search className="absolute right-2.5 top-[calc(50%+4px)] -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ابحث بالموضوع أو الرقم المرجعي أو سبب الأرشفة"
                className="pr-9 text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1 min-w-[140px]">
              <span className="text-xs text-muted-foreground">من تاريخ</span>
              <Input
                type="date"
                className="text-sm"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1 min-w-[140px]">
              <span className="text-xs text-muted-foreground">إلى تاريخ</span>
              <Input
                type="date"
                className="text-sm"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>

            {(search || dateFrom || dateTo) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setSearch(""); setDateFrom(""); setDateTo(""); }}
                className="text-muted-foreground"
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
                  <TableHead>الرقم المرجعي للمراسلة</TableHead>
                  <TableHead>الموضوع</TableHead>
                  <TableHead>سبب الأرشفة</TableHead>
                  <TableHead>تاريخ الأرشفة</TableHead>
                  <TableHead>بواسطة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 5 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-6 w-full" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : filteredArchives?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      لا توجد مراسلات مؤرشفة تطابق بحثك
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredArchives?.map((item) => (
                    <TableRow key={item.id} className="hover:bg-muted/40 transition-colors">
                      <TableCell>
                        <Link href={`/correspondences/${item.correspondenceId}`} className="text-primary hover:underline font-medium">
                          {item.correspondence?.referenceNumber ?? item.correspondenceId.slice(0, 8)}
                        </Link>
                      </TableCell>
                      <TableCell>{item.correspondence?.subject}</TableCell>
                      <TableCell>{item.archiveReason || "-"}</TableCell>
                      <TableCell>{item.createdAt ? format(new Date(item.createdAt), "yyyy/MM/dd") : "-"}</TableCell>
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
