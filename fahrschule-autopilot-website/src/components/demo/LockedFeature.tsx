"use client";

import { Lock, ArrowUp } from "lucide-react";

interface LockedFeatureProps {
  isLocked: boolean;
  requiredPlan: string;
  children: React.ReactNode;
}

export default function LockedFeature({ isLocked, requiredPlan, children }: LockedFeatureProps) {
  if (!isLocked) return <>{children}</>;

  return (
    <div className="relative">
      <div className="opacity-40 grayscale pointer-events-none select-none">
        {children}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/60 backdrop-blur-[3px] rounded-2xl">
        <div className="flex flex-col items-center gap-3 p-6 text-center">
          <div className="w-14 h-14 rounded-full bg-surface-lighter flex items-center justify-center">
            <Lock className="h-6 w-6 text-muted" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              Verfügbar ab {requiredPlan}-Paket
            </p>
            <p className="text-xs text-muted mt-1">
              Upgrade für dieses Feature
            </p>
          </div>
          <a
            href="#preise"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary-light transition-colors"
          >
            <ArrowUp className="h-3 w-3" />
            Pakete vergleichen
          </a>
        </div>
      </div>
    </div>
  );
}
