import { createContext, useContext, useMemo, useState } from "react";

export type StoreInfo = { _id: string; name: string };

type StoreContextValue = {
  stores: StoreInfo[];
  activeStoreId: string | null;
  setStores: (stores: StoreInfo[]) => void;
  setActiveStoreId: (storeId: string) => void;
};

const StoreContext = createContext<StoreContextValue | undefined>(undefined);

export const StoreProvider = ({ children }: { children: React.ReactNode }) => {
  const [stores, setStores] = useState<StoreInfo[]>([]);
  const [activeStoreId, setActiveStoreIdState] = useState<string | null>(
    localStorage.getItem("activeStoreId")
  );

  const setActiveStoreId = (storeId: string) => {
    setActiveStoreIdState(storeId);
    localStorage.setItem("activeStoreId", storeId);
  };

  const value = useMemo(
    () => ({
      stores,
      activeStoreId,
      setStores,
      setActiveStoreId
    }),
    [stores, activeStoreId]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
};

export const useStoreContext = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error("useStoreContext must be used within StoreProvider");
  }
  return context;
};
