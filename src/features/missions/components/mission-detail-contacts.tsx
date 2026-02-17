"use client";

import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import { QuickCreateContactDialog } from "@/features/contacts/components/quick-create-contact-dialog";
import { resolveActionResult } from "@/lib/actions/actions-utils";
import { updateMissionAction } from "@/features/missions/missions.action";
import { toast } from "sonner";
import { useState } from "react";
import type { MissionWithRelations } from "./mission-detail-header";

type MissionDetailContactsProps = {
  mission: MissionWithRelations;
  onRefresh?: () => void;
};

export function MissionDetailContacts({
  mission,
  onRefresh,
}: MissionDetailContactsProps) {
  const [showCreateContactDialog, setShowCreateContactDialog] = useState(false);

  return (
    <>
      <div className="flex flex-col gap-1">
        <h4 className="text-sm font-medium">Contact</h4>
        {mission.contact ? (
          <p className="text-sm">
            {mission.contact.firstName} {mission.contact.lastName}
            {mission.contact.company && (
              <span className="text-muted-foreground">
                {" "}
                · {mission.contact.company}
              </span>
            )}
          </p>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCreateContactDialog(true)}
          >
            <UserPlus className="size-4" />
            Ajouter un contact
          </Button>
        )}
      </div>

      <QuickCreateContactDialog
        open={showCreateContactDialog}
        onOpenChange={setShowCreateContactDialog}
        defaultCompany={mission.company}
        onCreated={async (contact) => {
          try {
            await resolveActionResult(
              updateMissionAction({
                id: mission.id,
                contactId: contact.id,
              }),
            );
            onRefresh?.();
          } catch (error) {
            toast.error(
              error instanceof Error ? error.message : "Erreur de liaison",
            );
          }
        }}
      />
    </>
  );
}
