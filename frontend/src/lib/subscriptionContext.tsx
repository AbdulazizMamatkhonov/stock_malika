import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "./api";

export type SubscriptionStatus = "ACTIVE" | "PAST_DUE" | "CANCELED";

type TenantSubscription = {
  subscriptionStatus: SubscriptionStatus;
  plan?: string;
  subscriptionExpiresAt?: string | null;
};

type SubscriptionContextValue = {
  tenant: TenantSubscription | null;
  isReadOnly: boolean;
  refreshTenant: () => Promise<void>;
};

const SubscriptionContext = createContext<SubscriptionContextValue | undefined>(undefined);

export const SubscriptionProvider = ({ children }: { children: React.ReactNode }) => {
  const [tenant, setTenant] = useState<TenantSubscription | null>(null);

  const refreshTenant = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setTenant(null);
      return;
    }
    try {
      const response = await api.get("/me/tenant");
      setTenant(response.data);
    } catch (error) {
      setTenant(null);
    }
  };

  useEffect(() => {
    refreshTenant();
  }, []);

  const value = useMemo(() => {
    const status = tenant?.subscriptionStatus;
    const isReadOnly = status === "PAST_DUE" || status === "CANCELED";
    return { tenant, isReadOnly, refreshTenant };
  }, [tenant]);

  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>;
};

export const useSubscriptionContext = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error("useSubscriptionContext must be used within SubscriptionProvider");
  }
  return context;
};
