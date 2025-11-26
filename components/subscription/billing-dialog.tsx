"use client";

import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Badge } from "../ui/badge";
import { Calendar, CreditCard } from "lucide-react";
import { Button } from "../ui/button";
import { CheckoutLink, CustomerPortalLink } from "@convex-dev/polar/react";
import { Skeleton } from "../ui/skeleton";

interface BillingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
const BillingDialog = ({ open, onOpenChange }: BillingDialogProps) => {
  const billing = useQuery(api.polar.getsubscriptionstatus);
  const products = useQuery(api.polar.getConfiguredProducts);
  if (!products?.Folders_Pro) {
    return (
      <div>
        <Skeleton className="h-2 w-4" />
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className=" md:max-h-[500px] md:max-w-[700px] lg:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Manage Subscription</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex p-4 bg-primary/10 rounded-2xl flex-col gap-2">
            <p className="text-2xl text-primary font-semibold">
              {" "}
              Current Subscription:{" "}
            </p>
            <p>{billing?.isPro ? billing.planName : "No Subscription"}</p>
          </div>
          <div className="flex p-4 bg-primary/10 rounded-2xl flex-col gap-2">
            <p className="text-2xl text-primary font-semibold">
              {" "}
              Current Plan:{" "}
            </p>
            <p>{billing?.isPro ? "Pro" : "Free"}</p>
          </div>
        </div>
        {billing?.isPro && (
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>
                {billing.cancelAtPeriodEnd
                  ? `Access ends on ${billing.renewDate}`
                  : `Renews on ${billing.renewDate}`}
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <span>Managed via Polar Secure Payments</span>
            </div>
          </div>
        )}
        <div className="flex justify-center ">
          {billing?.isPro ? (
            <CustomerPortalLink
              polarApi={{
                generateCustomerPortalUrl: api.polar.generateCustomerPortalUrl,
              }}
            >
              <Button>Manage Subscription</Button>
            </CustomerPortalLink>
          ) : (
            <CheckoutLink
              polarApi={{
                generateCheckoutLink: api.polar.generateCheckoutLink,
              }}
              productIds={[products?.Folders_Pro?.id]}
            >
              <Button>Upgrade to pro</Button>
            </CheckoutLink>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BillingDialog;
