"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Check } from "lucide-react";
import Link from "next/link";
import { Dialog, DialogContent, DialogTitle } from "../ui/dialog";
import { useAction, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import { CheckoutLink, CustomerPortalLink } from "@convex-dev/polar/react";
import { Skeleton } from "../ui/skeleton";

interface SubscriptionDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const SubscriptionDialog = ({
  isOpen,
  onOpenChange,
}: SubscriptionDialogProps) => {
  const products = useQuery(api.polar.getConfiguredProducts);
  if (!products?.Folders_Pro) {
    return (
      <div>
        <Skeleton className="h-2 w-4" />
      </div>
    );
  }
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className=" max-h-[calc(100vh-2rem)] p-0 md:max-h-[500px] md:max-w-[700px] lg:max-w-[800px] overflow-y-auto scrollbar-hidden ">
        <DialogTitle>
          <p className="text-2xl text-center ">
            Upgrade Your Learning Experience
          </p>{" "}
        </DialogTitle>
        <div className="mx-auto max-w-6xl px-2 py-2">
          <div className="flex justify-between  gap-2">
            <Card className="flex flex-col">
              <CardHeader>
                <CardTitle className="font-medium">Free</CardTitle>
                <span className="my-3 block text-2xl font-semibold">
                  $0 / mo
                </span>
              </CardHeader>

              <CardContent className="space-y-4">
                <hr className="border-dashed" />

                <ul className="list-outside space-y-3 text-sm">
                  {[
                    "Unlimited Folders and Notes",
                    "Limited File Upload",
                    "Limted Ai Chat",
                    "Access to The Knowledge Market",
                  ].map((item, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <Check className="size-3" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter className="mt-auto">
                <Button asChild variant="outline" className="w-full">
                  <Link href="/home">Get Started</Link>
                </Button>
              </CardFooter>
            </Card>

            <Card className="relative">
              <span className="bg-linear-to-br/increasing absolute inset-x-0 -top-3 mx-auto flex h-6 w-fit items-center rounded-full from-purple-400 to-amber-300 px-3 py-1 text-xs font-medium text-amber-950 ring-1 ring-inset ring-white/20 ring-offset-1 ring-offset-gray-950/5">
                Popular
              </span>

              <div className="flex flex-col">
                <CardHeader>
                  <CardTitle className="font-medium">Pro</CardTitle>
                  <span className="my-3 block text-2xl font-semibold">
                    $10 / mo
                  </span>
                </CardHeader>

                <CardContent className="space-y-4">
                  <hr className="border-dashed" />
                  <ul className="list-outside space-y-3 text-sm">
                    {[
                      "Everything in Free Plan",
                      "UnLimited File Uploads",
                      "Unlimited Ai chats",
                      "Access to Chat with Pdf",
                      "Unlimited Ai Flashcard Generation",
                    ].map((item, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <Check className="size-3" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter className="mt-4">
                  <CheckoutLink
                    polarApi={{
                      generateCheckoutLink: api.polar.generateCheckoutLink,
                    }}
                    productIds={[products?.Folders_Pro?.id]}
                    embed={false}
                  >
                    <Button className="w-full">Get pro</Button>
                  </CheckoutLink>
                </CardFooter>
              </div>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SubscriptionDialog;
