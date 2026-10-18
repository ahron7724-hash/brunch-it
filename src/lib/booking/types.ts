export type Slot = { start: string; end: string };

export type BookingDay = {
  /** YYYY-MM-DD, Israel local. */
  date: string;
  /** Why the day is closed (Friday, Shabbat, a holiday name, an admin note), or null when open. */
  closedReason: string | null;
  slots: Slot[];
};

export type BookingConfig = {
  days: BookingDay[];
  defaultLeadTimeHours: number;
  /** Shortest lead time of any product: slots closer than this can't be chosen at all. */
  minLeadTimeHours: number;
};
