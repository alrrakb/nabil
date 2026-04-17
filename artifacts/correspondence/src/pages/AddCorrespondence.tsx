import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreateCorrespondence, useListDepartments, useListEmployees } from "@workspace/api-client-react";
import { CreateCorrespondenceBodyType, CreateCorrespondenceBodyPriority } from "@workspace/api-client-react";
import { typeTranslations, priorityTranslations } from "@/lib/translations";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

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

export default function AddCorrespondence() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const createCorrespondence = useCreateCorrespondence();
  const { data: departments } = useListDepartments();
  const { data: employees } = useListEmployees();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      subject: "",
      body: "",
      type: CreateCorrespondenceBodyType.internal,
      priority: CreateCorrespondenceBodyPriority.medium,
    },
  });

  function onSubmit(values: FormValues) {
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
        onSuccess: (data) => {
          toast({ title: "تم إضافة المراسلة بنجاح" });
          setLocation(`/correspondences/${data.id}`);
        },
        onError: () => {
          toast({ title: "حدث خطأ أثناء إضافة المراسلة", variant: "destructive" });
        },
      }
    );
  }

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
                    <FormLabel>الموضوع</FormLabel>
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
                          <SelectTrigger>
                            <SelectValue placeholder="اختر النوع" />
                          </SelectTrigger>
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
                          <SelectTrigger>
                            <SelectValue placeholder="اختر الأولوية" />
                          </SelectTrigger>
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
                          <SelectTrigger>
                            <SelectValue placeholder="اختر القسم" />
                          </SelectTrigger>
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
                          <SelectTrigger>
                            <SelectValue placeholder="اختر القسم" />
                          </SelectTrigger>
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
                      <FormLabel>تعيين إلى (موظف)</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر الموظف" />
                          </SelectTrigger>
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
                    <FormLabel>التفاصيل (اختياري)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="أدخل تفاصيل المراسلة..." className="min-h-[120px]" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end">
                <Button type="submit" disabled={createCorrespondence.isPending}>
                  {createCorrespondence.isPending ? "جاري الإضافة..." : "حفظ المراسلة"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
