"use client";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import React, { useEffect, useState } from "react";
import { CheckoutLink, CustomerPortalLink } from "@convex-dev/polar/react";
import { Skeleton } from "../ui/skeleton";
import { Button } from "../ui/button";

const Ailimit = () => {
  const canchat = useQuery(api.subscriptions.canUseAiChat);
  const [timeLeft, setTimeLeft] = useState("");
  const products = useQuery(api.polar.getConfiguredProducts);
  if (!products?.Folders_Pro) {
    return (
      <div>
        <Skeleton className="h-2 w-4" />
      </div>
    );
  }
  //   useEffect(() => {
  //     const updateTimer = () => {
  //       const now = new Date();

  //       // 1. Target the next UTC Midnight (which matches toISOString logic)
  //       const nextReset = new Date(now);

  //       // Move to tomorrow relative to UTC time
  //       nextReset.setUTCDate(now.getUTCDate() + 1);
  //       // Set time to 00:00:00.000 UTC
  //       nextReset.setUTCHours(0, 0, 0, 0);

  //       const diff = nextReset.getTime() - now.getTime();

  //       // Prevent negative numbers if calculations are slightly off by milliseconds
  //       if (diff <= 0) {
  //         setTimeLeft("0h 0m");
  //         return;
  //       }

  //       const hours = Math.floor(diff / (1000 * 60 * 60));
  //       const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  //       // Optional: Add leading zero (e.g., "4h 05m" instead of "4h 5m")
  //       const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;

  //       setTimeLeft(`${hours}h ${formattedMinutes}m`);
  //     };

  //     updateTimer();

  //     const interval = setInterval(updateTimer, 1000);
  //     return () => clearInterval(interval);
  //   }, [canchat?.lastrest]); // Re-run if the database value changes

  return (
    <div className="flex bg-card p-2 rounded-t-2xl items-center gap-2 ">
      <p className="text-card-foreground ">
        {" "}
        You have Reached Ai used for today .Next Reset :{timeLeft} or
      </p>
      <CheckoutLink
        polarApi={{ generateCheckoutLink: api.polar.generateCheckoutLink }}
        productIds={[products?.Folders_Pro?.id]}
      >
        <Button variant="secondary">Upgrade to pro</Button>
      </CheckoutLink>
    </div>
  );
};

export default Ailimit;
