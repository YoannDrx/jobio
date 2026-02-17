"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import { LoadingButton } from "@/features/form/submit-button";
import { UserPlus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { createContactAction } from "@/features/contacts/contacts.action";

type QuickCreateContactDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultCompany?: string | null;
  onCreated: (contact: { id: string }) => void;
};

export function QuickCreateContactDialog({
  open,
  onOpenChange,
  defaultCompany,
  onCreated,
}: QuickCreateContactDialogProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState(defaultCompany ?? "");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      toast.error("Le prenom et le nom sont requis");
      return;
    }

    setIsLoading(true);
    try {
      const contact = await resolveActionResult(
        createContactAction({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim() || undefined,
          company: company.trim() || undefined,
        }),
      );
      toast.success("Contact cree");
      onOpenChange(false);
      setFirstName("");
      setLastName("");
      setEmail("");
      setCompany(defaultCompany ?? "");
      onCreated(contact);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Creer un contact</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex gap-3">
            <div className="flex flex-1 flex-col gap-2">
              <Label htmlFor="qc-firstName">Prenom</Label>
              <Input
                id="qc-firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Jean"
              />
            </div>
            <div className="flex flex-1 flex-col gap-2">
              <Label htmlFor="qc-lastName">Nom</Label>
              <Input
                id="qc-lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Dupont"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="qc-email">Email</Label>
            <Input
              id="qc-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jean@example.com"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="qc-company">Entreprise</Label>
            <Input
              id="qc-company"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Acme Corp"
            />
          </div>

          <div className="flex justify-end">
            <LoadingButton loading={isLoading} onClick={handleSubmit}>
              <UserPlus className="size-4" />
              Creer le contact
            </LoadingButton>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
