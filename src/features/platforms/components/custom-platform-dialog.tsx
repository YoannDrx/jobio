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
import { LoadingButton } from "@/features/form/submit-button";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import { createCustomPlatformAction } from "@/features/platforms/platforms.action";
import { z } from "zod";
import { toast } from "sonner";

const customPlatformSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  website: z.string().url().optional().or(z.literal("")),
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
    defaultValues: { name: "", website: "" },
  });

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
