"use client";
import { useState } from "react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { PermissionRecord } from "@/lib/entities/models/permission.model";

const formSchema = z.object({
  name: z.string().nonempty("Name is required"),
  description: z.string(),
  permissions: z.array(z.string()).nonempty("Please at least one item"),
});

export type RolesFormValueType = z.infer<typeof formSchema>;
export type RolesFormProps = {
  isEditing: boolean;
  permissionsData: PermissionRecord[];
  onSubmit: (values: RolesFormValueType) => void;
  editingValue?: any;
};

export default function RolesForm(props: RolesFormProps) {
  const form = useForm<RolesFormValueType>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: props.editingValue ? props.editingValue.name : "",
      description: props.editingValue ? props.editingValue.description : "",
      permissions: props.editingValue?.permissions?.map((p: any) => p.id) ?? [],
    },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(props.onSubmit)}
        className="grid lg:grid-cols-2 gap-3"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="shadcn" type="" {...field} />
              </FormControl>

              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Placeholder"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                You can @mention other users and organizations.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="permissions"
          render={() => (
            <FormItem>
              <div className="mb-4">
                <FormLabel className="text-base">Permissions</FormLabel>
                <FormDescription>
                  Select permission for the role.
                </FormDescription>
              </div>
              {props.permissionsData.map((item) => (
                <FormField
                  key={item.id}
                  control={form.control}
                  name="permissions"
                  render={({ field }) => {
                    return (
                      <FormItem
                        key={item.id}
                        className="flex flex-row items-start space-x-3 space-y-0"
                      >
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(item.id)}
                            onCheckedChange={(checked) => {
                              return checked
                                ? field.onChange([...field.value, item.id])
                                : field.onChange(
                                    field.value?.filter(
                                      (value) => value !== item.id
                                    )
                                  );
                            }}
                          />
                        </FormControl>
                        <FormLabel className="text-sm font-normal">
                          {item.name}
                        </FormLabel>
                      </FormItem>
                    );
                  }}
                />
              ))}
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="lg:col-span-2 space-x-2 justify-self-end">
          <Button type="submit">Save Changes</Button>
        </div>
      </form>
    </Form>
  );
}
