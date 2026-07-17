import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AUTH_PLANS } from "@/lib/auth/stripe/auth-plans";
import { isPlanAvailableForNewSubscription } from "@/config/product-features";
import { PricingCard } from "../plans/pricing-card";
import { closeGlobalDialog } from "./global-dialog.store";

export const UserPlanDialog = () => {
  const availablePlans = AUTH_PLANS.filter(
    (plan) =>
      !plan.isHidden &&
      (plan.price === 0 || isPlanAvailableForNewSubscription(plan.name)),
  );

  return (
    <Dialog open={true} onOpenChange={() => closeGlobalDialog()}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-auto px-8 py-6 lg:px-16 lg:py-14">
        <DialogHeader className="w-full text-center">
          <DialogTitle className="text-center font-bold lg:text-3xl">
            Choisis ton plan
          </DialogTitle>
          <DialogDescription className="text-center">
            Pour débloquer toutes les fonctionnalités, choisis un plan adapté.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-8 flex w-full justify-center gap-4 max-md:flex-col lg:mt-12 lg:gap-8 xl:gap-12">
          {availablePlans.map((card) => (
            <PricingCard key={card.name} plan={card} />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
