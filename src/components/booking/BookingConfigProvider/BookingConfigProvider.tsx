"use client";

import { createContext, useContext, type ReactNode } from "react";

import type { BookingConfig } from "@/lib/booking/types";

const BookingConfigContext = createContext<BookingConfig | null>(null);

type BookingConfigProviderProps = { config: BookingConfig; children: ReactNode };

/** Makes the pickup calendar and lead-time defaults (loaded once in the layout) available to client components. */
export function BookingConfigProvider({ config, children }: BookingConfigProviderProps) {
  return <BookingConfigContext.Provider value={config}>{children}</BookingConfigContext.Provider>;
}

export function useBookingConfig(): BookingConfig {
  const config = useContext(BookingConfigContext);
  if (!config) throw new Error("useBookingConfig must be used inside BookingConfigProvider");
  return config;
}
