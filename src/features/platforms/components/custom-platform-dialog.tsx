"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  useZodForm,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoadingButton } from "@/features/form/submit-button";
import { ImageFormItem } from "@/features/images/image-form-item";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import { createCustomPlatformAction } from "@/features/platforms/platforms.action";
import { z } from "zod";
import { toast } from "sonner";
import { useState } from "react";

const customPlatformSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  website: z.string().url().optional().or(z.literal("")),
  logoUrl: z.string().url().optional().or(z.literal("")),
});

type CustomPlatformDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
};

export function CustomPlatformDialog({
  open,
  onOpenChange,
  onSuccess,
}: CustomPlatformDialogProps) {
  const form = useZodForm({
    schema: customPlatformSchema,
    defaultValues: { name: "", website: "", logoUrl: "" },
  });

  const [logoTab, setLogoTab] = useState<"url" | "upload">("url");
  const logoUrl = form.watch("logoUrl");

  const handleSubmit = async (data: z.infer<typeof customPlatformSchema>) => {
    try {
      await resolveActionResult(createCustomPlatformAction(data));
      toast.success("Plateforme ajoutée");
      form.reset();
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de la création",
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajouter une plateforme</DialogTitle>
          <DialogDescription>
            Ajoutez une plateforme qui n'est pas dans la liste.
          </DialogDescription>
        </DialogHeader>
        <Form
          form={form}
          onSubmit={handleSubmit}
          className="flex flex-col gap-4"
        >
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nom *</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Ma Plateforme" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="website"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Site web</FormLabel>
                <FormControl>
                  <Input placeholder="https://www.exemple.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormItem>
            <FormLabel>Logo</FormLabel>
            <Tabs
              value={logoTab}
              onValueChange={(v) => setLogoTab(v as "url" | "upload")}
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="url">URL</TabsTrigger>
                <TabsTrigger value="upload">Upload</TabsTrigger>
              </TabsList>
              <TabsContent value="url" className="mt-2">
                <FormField
                  control={form.control}
                  name="logoUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          placeholder="https://exemple.com/logo.png"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
              <TabsContent value="upload" className="mt-2">
                <div className="flex items-center gap-4">
                  <ImageFormItem
                    imageUrl={logoUrl}
                    onChange={(url) => form.setValue("logoUrl", url)}
                    className="size-20"
                  />
                  <p className="text-muted-foreground text-xs">
                    Cliquez sur la zone pour uploader une image
                    <br />
                    (PNG, JPG - max 1MB)
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </FormItem>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Annuler
            </Button>
            <LoadingButton type="submit" loading={form.formState.isSubmitting}>
              Ajouter
            </LoadingButton>
          </div>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
