import { useParams } from "wouter";
import { useGetCorrespondence, useUpdateCorrespondence, useArchiveCorrespondence, getGetCorrespondenceQueryKey } from "@workspace/api-client-react";
import { UpdateCorrespondenceBodyStatus } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { statusTranslations, getStatusColor, priorityTranslations, getPriorityColor, typeTranslations } from "@/lib/translations";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Clock, Archive, CheckCircle2, XCircle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function CorrespondenceDetail() {
  const { id } = useParams<{ id: string }>();
  const correspondenceId = Number(id);
  const { data: detail, isLoading } = useGetCorrespondence(correspondenceId, { query: { enabled: !!id } });
  
  const updateStatus = useUpdateCorrespondence();
  const archive = useArchiveCorrespondence();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  if (isLoading || !detail) {
    return <div className="p-8"><Skeleton className="h-[400px] w-full" /></div>;
  }

  const handleUpdateStatus = (status: UpdateCorrespondenceBodyStatus) => {
    updateStatus.mutate({ id: correspondenceId, data: { status } }, {
      onSuccess: () => {
        toast({ title: "تم تحديث الحالة بنجاح" });
        queryClient.invalidateQueries({ queryKey: getGetCorrespondenceQueryKey(correspondenceId) });
      }
    });
  };

  const handleArchive = () => {
    if (confirm("هل أنت متأكد من أرشفة هذه المراسلة؟")) {
      archive.mutate({ id: correspondenceId, data: { archiveLocation: "الأرشيف الرئيسي" } }, {
        onSuccess: () => {
          toast({ title: "تم الأرشفة بنجاح" });
          queryClient.invalidateQueries({ queryKey: getGetCorrespondenceQueryKey(correspondenceId) });
        }
      });
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            {detail.subject}
          </h1>
          <p className="text-muted-foreground mt-1">الرقم المرجعي: {detail.referenceNumber}</p>
        </div>
        
        <div className="flex items-center gap-2">
          {detail.status !== "completed" && detail.status !== "archived" && (
            <Button size="sm" variant="outline" className="text-green-600" onClick={() => handleUpdateStatus("completed")}>
              <CheckCircle2 className="h-4 w-4 ml-2" /> إنجاز
            </Button>
          )}
          {detail.status !== "rejected" && detail.status !== "archived" && (
            <Button size="sm" variant="outline" className="text-red-600" onClick={() => handleUpdateStatus("rejected")}>
              <XCircle className="h-4 w-4 ml-2" /> رفض
            </Button>
          )}
          {detail.status !== "archived" && (
            <Button size="sm" variant="secondary" onClick={handleArchive}>
              <Archive className="h-4 w-4 ml-2" /> أرشفة
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>تفاصيل المراسلة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">النوع</p>
                  <p className="font-medium">{typeTranslations[detail.type]}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">تاريخ الإنشاء</p>
                  <p className="font-medium">{format(new Date(detail.createdAt), 'yyyy/MM/dd hh:mm a')}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">الجهة المرسلة</p>
                  <p className="font-medium">{detail.fromDepartmentName || '-'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">الجهة المستقبلة</p>
                  <p className="font-medium">{detail.toDepartmentName || '-'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">مخصصة إلى</p>
                  <p className="font-medium">{detail.assignedToName || '-'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">بواسطة</p>
                  <p className="font-medium">{detail.createdByName || '-'}</p>
                </div>
              </div>
              
              <hr />
              
              <div>
                <p className="text-muted-foreground mb-2">النص</p>
                <div className="bg-muted/30 p-4 rounded-md min-h-[100px] whitespace-pre-wrap">
                  {detail.body || 'لا يوجد تفاصيل إضافية'}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>الحالة والأولوية</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">الحالة</span>
                <Badge variant={getStatusColor(detail.status)}>{statusTranslations[detail.status]}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">الأولوية</span>
                <Badge variant={getPriorityColor(detail.priority)}>{priorityTranslations[detail.priority]}</Badge>
              </div>
              {detail.dueDate && (
                <div className="flex justify-between items-center text-sm pt-2 border-t">
                  <span className="text-muted-foreground">تاريخ الاستحقاق</span>
                  <span className="font-medium text-red-600 flex items-center"><Clock className="h-3 w-3 ml-1"/> {format(new Date(detail.dueDate), 'yyyy/MM/dd')}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>سجل الإجراءات</CardTitle>
              <CardDescription>التسلسل الزمني للمراسلة</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative border-r-2 border-muted pr-4 space-y-6">
                {detail.history?.map((h) => (
                  <div key={h.id} className="relative">
                    <div className="absolute w-3 h-3 bg-primary rounded-full -right-[23px] top-1.5 border-2 border-background"></div>
                    <p className="text-sm font-medium">{h.action}</p>
                    {h.notes && <p className="text-sm text-muted-foreground mt-1">{h.notes}</p>}
                    <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
                      <span>{h.performedByName || 'نظام'}</span>
                      <span>{format(new Date(h.createdAt), 'MM/dd hh:mm a')}</span>
                    </div>
                  </div>
                ))}
                {(!detail.history || detail.history.length === 0) && (
                  <p className="text-sm text-muted-foreground">لا يوجد سجل إجراءات</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
