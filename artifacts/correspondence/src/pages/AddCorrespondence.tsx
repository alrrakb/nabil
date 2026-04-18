import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreateCorrespondence, useListDepartments, useListEmployees } from "@workspace/api-client-react";
import { CreateCorrespondenceBodyType, CreateCorrespondenceBodyPriority } from "@workspace/api-client-react";
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
  type: z.nativeEnum(CreateCorrespondenceBodyType, { required_error: "نوع المراسلة مطلوب" }),
  priority: z.nativeEnum(CreateCorrespondenceBodyPriority, { required_error: "الأولوية مطلوبة" }),
  fromDepartmentId: z.string().optional(),
  toDepartmentId: z.string().optional(),
  assignedToId: z.string().optional(),
  dueDate: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} بايت`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} كيلوبايت`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} ميغابايت`;
}

export default function AddCorrespondence() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const createCorrespondence = useCreateCorrespondence();
  const { data: departments } = useListDepartments();
  const { data: employees } = useListEmployees();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      subject: "",
      body: "",
      type: CreateCorrespondenceBodyType.internal,
      priority: CreateCorrespondenceBodyPriority.medium,
    },
  });

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter((f) => {
      if (f.size > MAX_FILE_SIZE) {
        toast({ title: `الملف "${f.name}" يتجاوز الحد الأقصى (10 ميغابايت)`, variant: "destructive" });
        return false;
      }
      return true;
    });
    setAttachedFiles((prev) => [...prev, ...validFiles]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeFile(index: number) {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function uploadFiles(correspondenceId: number): Promise<string[]> {
    const urls: string[] = [];
    for (const file of attachedFiles) {
      const filePath = `${correspondenceId}/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from("attachments").upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });
      if (error) {
        toast({ title: `فشل رفع الملف: ${error.message}`, variant: "destructive" });
      } else {
        const { data: urlData } = supabase.storage.from("attachments").getPublicUrl(filePath);
        if (urlData) urls.push(urlData.publicUrl);
      }
    }
    return urls;
  }

  async function onSubmit(values: FormValues) {
    setUploadingFiles(attachedFiles.length > 0);
    createCorrespondence.mutate(
      {
        data: {
          ...values,
          fromDepartmentId: values.fromDepartmentId ? Number(values.fromDepartmentId) : undefined,
          toDepartmentId: values.toDepartmentId ? Number(values.toDepartmentId) : undefined,
          assignedToId: values.assignedToId ? Number(values.assignedToId) : undefined,
        },
      },
      {
        onSuccess: async (data) => {
          if (attachedFiles.length > 0) {
            await uploadFiles(data.id);
          }
          setUploadingFiles(false);
          toast({ title: "تم إضافة المراسلة بنجاح" });
          setLocation(`/correspondences/${data.id}`);
        },
        onError: () => {
          setUploadingFiles(false);
          toast({ title: "حدث خطأ أثناء إضافة المراسلة", variant: "destructive" });
        },
      }
    );
  }

  const isSubmitting = createCorrespondence.isPending || uploadingFiles;

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
                          {Object.entries(CreateCorrespondenceBodyType).map(([key, value]) => (
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
                          {Object.entries(CreateCorrespondenceBodyPriority).map(([key, value]) => (
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
                  name="fromDepartmentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الجهة المرسلة</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="اختر القسم" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {departments?.map((dept) => (
                            <SelectItem key={dept.id} value={dept.id.toString()}>{dept.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="toDepartmentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الجهة المستقبلة</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="اختر القسم" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {departments?.map((dept) => (
                            <SelectItem key={dept.id} value={dept.id.toString()}>{dept.name}</SelectItem>
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
                  name="assignedToId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>المستلم (اختياري)</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="اختر الموظف" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {employees?.map((emp) => (
                            <SelectItem key={emp.id} value={emp.id.toString()}>{emp.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>تاريخ الاستحقاق</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

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

              {/* File attachment section — Bug 1 fix */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">المرفقات <span className="text-muted-foreground text-xs">(اختياري)</span></span>
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
                    multiple
                    className="hidden"
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                  />
                </div>

                {attachedFiles.length > 0 && (
                  <div className="rounded-lg border bg-muted/30 divide-y">
                    {attachedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between px-4 py-2.5 text-sm">
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="truncate">{file.name}</span>
                          <span className="text-muted-foreground shrink-0">{formatBytes(file.size)}</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
                          onClick={() => removeFile(index)}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {attachedFiles.length === 0 && (
                  <div
                    className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/20 py-6 cursor-pointer hover:border-primary/40 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-8 w-8 text-muted-foreground/40 mb-2" />
                    <p className="text-sm text-muted-foreground">اسحب الملفات هنا أو انقر للاختيار</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">PDF, Word, Excel, صور — حتى 10 ميغابايت لكل ملف</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={isSubmitting} className="gap-2">
                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {uploadingFiles ? "جاري رفع الملفات..." : isSubmitting ? "جاري الحفظ..." : "حفظ المراسلة"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
