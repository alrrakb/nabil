import { useListArchive } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Link } from "wouter";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Archive as ArchiveIcon } from "lucide-react";

export default function Archive() {
  const { data: archives, isLoading } = useListArchive();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <ArchiveIcon className="h-6 w-6 text-gray-500" />
        <h1 className="text-2xl font-bold">الأرشيف</h1>
      </div>

      <Card>
        <CardContent className="p-0">
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
              ) : archives?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">لا توجد مراسلات مؤرشفة</TableCell>
                </TableRow>
              ) : (
                archives?.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.archiveNumber}</TableCell>
                    <TableCell>
                      <Link href={`/correspondences/${item.correspondenceId}`} className="text-primary hover:underline">
                        {item.correspondence?.referenceNumber}
                      </Link>
                    </TableCell>
                    <TableCell>{item.correspondence?.subject}</TableCell>
                    <TableCell>{item.archiveLocation || '-'}</TableCell>
                    <TableCell>{format(new Date(item.archivedAt), 'yyyy/MM/dd')}</TableCell>
                    <TableCell>{item.archivedByName || '-'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
