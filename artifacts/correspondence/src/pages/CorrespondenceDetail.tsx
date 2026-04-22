import { useState } from "react";
import { useParams } from "wouter";
import { useGetCorrespondence, useActionCorrespondence, getGetCorrespondenceQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { statusTranslations, getStatusColor, priorityTranslations, getPriorityColor, typeTranslations } from "@/lib/translations";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Archive, CheckCircle2, XCircle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

type ActionType = "approved" | "rejected" | "archived";

export default function CorrespondenceDetail() {
  const { id } = useParams<{ id: string }>();
  const correspondenceId = id ?? "";
  const { data: detail, isLoading } = useGetCorrespondence(correspondenceId, { query: { enabled: !!id } });

  const actionMutation = useActionCorrespondence();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  const [dialog, setDialog] = useState<{ open: boolean; type: ActionType; notes: string }>({
    open: false,
    type: "approved",
    notes: "",
  });

  if (isLoading || !detail) {
    return <div className="p-8"><Skeleton className="h-[400px] w-full" /></div>;
  }

  const openDialog = (type: ActionType) => setDialog({ open: true, type, notes: "" });
  const closeDialog = () => setDialog((d) => ({ ...d, open: false, notes: "" }));

  const confirmAction = () => {
    actionMutation.mutate(
      {
        id: correspondenceId,
        data: {
          action: dialog.type,
          notes: dialog.notes || null,
          actorId: user?.employeeId ?? null,
          actorRole: user?.role ?? null,
        },
      },
      {
        onSuccess: () => {
          const labels: Record<ActionType, string> = {
            approved: "تمت الموافقة على المراسلة",
            rejected: "تم رفض المراسلة",
            archived: "تم أرشفة المراسلة",
          };
          toast({ title: labels[dialog.type] });
          closeDialog();
          queryClient.invalidateQueries({ queryKey: getGetCorrespondenceQueryKey(correspondenceId) });
        },
        onError: () => {
          toast({ title: "حدث خطأ أثناء تنفيذ الإجراء", variant: "destructive" });
        },
      },
    );
  };

  const isArchived = detail.status === "archived";

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Notes Dialog */}
      <Dialog open={dialog.open} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {dialog.type === "approved" && "تأكيد الموافقة"}
              {dialog.type === "rejected" && "تأكيد الرفض"}
              {dialog.type === "archived" && "تأكيد الأرشفة"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">ملاحظات (اختياري)</p>
            <Textarea
              placeholder="أدخل ملاحظاتك هنا..."
              value={dialog.notes}
              onChange={(e) => setDialog((d) => ({ ...d, notes: e.target.value }))}
              rows={3}
              className="resize-none"
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={closeDialog} disabled={actionMutation.isPending}>
              إلغاء
            </Button>
            <Button
              onClick={confirmAction}
              disabled={actionMutation.isPending}
              variant={dialog.type === "rejected" ? "destructive" : "default"}
            >
              {actionMutation.isPending ? "جاري التنفيذ..." : "تأكيد"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            {detail.subject}
          </h1>
          <p className="text-muted-foreground mt-1">الرقم المرجعي: {detail.referenceNumber}</p>
        </div>

        <div className="flex items-center gap-2">
          {detail.status !== "approved" && !isArchived && (
            <Button size="sm" variant="outline" className="text-green-600" onClick={() => openDialog("approved")}>
              <CheckCircle2 className="h-4 w-4 ml-2" /> إنجاز
            </Button>
          )}
          {detail.status !== "rejected" && !isArchived && (
            <Button size="sm" variant="outline" className="text-red-600" onClick={() => openDialog("rejected")}>
              <XCircle className="h-4 w-4 ml-2" /> رفض
            </Button>
          )}
          {!isArchived && (
            <Button size="sm" variant="secondary" onClick={() => openDialog("archived")}>
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
                  <p className="font-medium">{detail.createdAt ? format(new Date(detail.createdAt), 'yyyy/MM/dd hh:mm a') : '-'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">المرسل</p>
                  <p className="font-medium">
                    {detail.senderName
                      ? detail.senderCode
                        ? `${detail.senderName} (${detail.senderCode})`
                        : detail.senderName
                      : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">المستلم</p>
                  <p className="font-medium">
                    {detail.receiverName
                      ? detail.receiverCode
                        ? `${detail.receiverName} (${detail.receiverCode})`
                        : detail.receiverName
                      : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">القسم</p>
                  <p className="font-medium">{detail.departmentName || '-'}</p>
                </div>
                {detail.attachmentUrl && (
                  <div>
                    <p className="text-muted-foreground">المرفق</p>
                    <a href={detail.attachmentUrl} target="_blank" rel="noreferrer" className="text-primary underline text-sm">عرض المرفق</a>
                  </div>
                )}
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
                      <span>{h.actorName || 'نظام'}</span>
                      <span>{h.createdAt ? format(new Date(h.createdAt), 'MM/dd hh:mm a') : ''}</span>
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
