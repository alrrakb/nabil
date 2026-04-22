import { useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreateCorrespondence, useListDepartments, useListEmployees } from "@workspace/api-client-react";
import { CorrespondenceType, CorrespondencePriority } from "@workspace/api-client-react";
import { typeTranslations, priorityTranslations } from "@/lib/translations";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";

import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Paperclip, X, FileText, Loader2, Upload } from "lucide-react";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const formSchema = z.object({
  subject: z.string().min(3, "الموضوع مطلوب ويجب أن يكون 3 أحرف على الأقل"),
  body: z.string().optional(),
  type: z.nativeEnum(CorrespondenceType, { required_error: "نوع المراسلة مطلوب" }),
  priority: z.nativeEnum(CorrespondencePriority, { required_error: "الأولوية مطلوبة" }),
  senderId: z.string().optional(),
  receiverId: z.string().optional(),
  departmentId: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} بايت`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} كيلوبايت`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} ميغابايت`;
}

export default function AddCorrespondence() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const createCorrespondence = useCreateCorrespondence();
  const { data: departments } = useListDepartments();
  const { data: employees } = useListEmployees();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      subject: "",
      body: "",
      type: CorrespondenceType.internal,
      priority: CorrespondencePriority.normal,
      senderId: user?.employeeId ?? undefined,
    },
  });

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      toast({ title: `الملف "${file.name}" يتجاوز الحد الأقصى (10 ميغابايت)`, variant: "destructive" });
      return;
    }
    setAttachedFile(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function uploadFile(correspondenceId: string): Promise<string | null> {
    if (!attachedFile) return null;
    const filePath = `${correspondenceId}/${Date.now()}-${attachedFile.name}`;
    const { error } = await supabase.storage.from("attachments").upload(filePath, attachedFile, {
      cacheControl: "3600",
      upsert: false,
    });
    if (error) {
      toast({ title: `فشل رفع الملف: ${error.message}`, variant: "destructive" });
      return null;
    }
    const { data: urlData } = supabase.storage.from("attachments").getPublicUrl(filePath);
    return urlData?.publicUrl ?? null;
  }

  async function onSubmit(values: FormValues) {
    setUploadingFile(!!attachedFile);
    createCorrespondence.mutate(
      {
        data: {
          subject: values.subject,
          body: values.body,
          type: values.type,
          priority: values.priority,
          senderId: values.senderId || undefined,
          receiverId: values.receiverId || undefined,
          departmentId: values.departmentId || undefined,
        },
      },
      {
        onSuccess: async (data) => {
          if (attachedFile) {
            const url = await uploadFile(data.id);
            if (url) {
              // Update correspondence with attachment URL
            }
          }
          setUploadingFile(false);
          toast({ title: "تم إضافة المراسلة بنجاح" });
          setLocation(`/correspondences/${data.id}`);
        },
        onError: () => {
          setUploadingFile(false);
          toast({ title: "حدث خطأ أثناء إضافة المراسلة", variant: "destructive" });
        },
      }
    );
  }

  const isSubmitting = createCorrespondence.isPending || uploadingFile;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold">إضافة مراسلة جديدة</h1>

      <Card>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الموضوع <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="أدخل موضوع المراسلة..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>النوع</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="اختر النوع" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(CorrespondenceType).map(([key, value]) => (
                            <SelectItem key={key} value={value}>{typeTranslations[value]}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الأولوية</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="اختر الأولوية" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(CorrespondencePriority).map(([key, value]) => (
                            <SelectItem key={key} value={value}>{priorityTranslations[value]}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="senderId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>المرسل</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder={user?.name ?? "المرسل الحالي"} /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {employees?.map((emp) => (
                            <SelectItem key={emp.id} value={emp.id}>{emp.fullName}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="receiverId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>المستلم</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="اختر الموظف" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {employees?.map((emp) => (
                            <SelectItem key={emp.id} value={emp.id}>{emp.fullName}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="departmentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>القسم</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="اختر القسم" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {departments?.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="body"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>التفاصيل <span className="text-muted-foreground text-xs">(اختياري)</span></FormLabel>
                    <FormControl>
                      <Textarea placeholder="أدخل تفاصيل المراسلة..." className="min-h-[120px]" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* File attachment section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">المرفق <span className="text-muted-foreground text-xs">(اختياري)</span></span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Paperclip className="h-4 w-4" />
                    إضافة ملف
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                  />
                </div>

                {attachedFile ? (
                  <div className="rounded-lg border bg-muted/30">
                    <div className="flex items-center justify-between px-4 py-2.5 text-sm">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="truncate">{attachedFile.name}</span>
                        <span className="text-muted-foreground shrink-0">{formatBytes(attachedFile.size)}</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => setAttachedFile(null)}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div
                    className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/20 py-6 cursor-pointer hover:border-primary/40 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-8 w-8 text-muted-foreground/40 mb-2" />
                    <p className="text-sm text-muted-foreground">اسحب الملف هنا أو انقر للاختيار</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">PDF, Word, Excel, صور — حتى 10 ميغابايت</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={isSubmitting} className="gap-2">
                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {uploadingFile ? "جاري رفع الملف..." : isSubmitting ? "جاري الحفظ..." : "حفظ المراسلة"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
