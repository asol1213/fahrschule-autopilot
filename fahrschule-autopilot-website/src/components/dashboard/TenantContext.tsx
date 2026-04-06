"use client";

import { createContext, useContext } from "react";

interface TenantContextValue {
  tenantId: string;
}

const TenantContext = createContext<TenantContextValue | null>(null);

export function TenantProvider({
  tenantId,
  children,
}: {
  tenantId: string;
  children: React.ReactNode;
}) {
  return (
    <TenantContext.Provider value={{ tenantId }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenantId(): string {
  const ctx = useContext(TenantContext);
  if (!ctx) throw new Error("useTenantId must be used within TenantProvider");
  return ctx.tenantId;
}
