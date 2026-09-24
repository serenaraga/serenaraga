"use client";

import * as React from "react";
import { useGetList, useLocaleState } from "ra-core";
import { motion } from "motion/react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  Bell,
  Star,
  CheckCheck,
  Inbox,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { formatDistanceToNow } from "date-fns";
import { id as localeId } from "date-fns/locale/id";
import { enUS as localeEn } from "date-fns/locale/en-US";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";

export type NotificationCategory = "review" | "booking" | "payment" | "system";

export interface NotificationItem {
  id: string;
  category: NotificationCategory;
  title: string;
  subtitle?: string;
  description?: string;
  rating?: number;
  timestamp: string | Date;
  isRead: boolean;
  href?: string;
  onClick?: () => void;
  rawId?: string | number;
}

const NOTIF_STORAGE_KEY = "serenaraga_read_notifications";

function getStoredReadIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(NOTIF_STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return new Set(Array.isArray(parsed) ? parsed.map(String) : []);
  } catch {
    return new Set();
  }
}

function saveStoredReadIds(ids: Set<string>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(NOTIF_STORAGE_KEY, JSON.stringify(Array.from(ids)));
  } catch (e) {
    console.error("Failed to persist read notifications:", e);
  }
}

export function NotificationCenter({ className }: { className?: string }) {
  const [locale] = useLocaleState();
  const isEn = locale === "en";
  const [open, setOpen] = React.useState(false);
  const [localReadIds, setLocalReadIds] = React.useState<Set<string>>(() => getStoredReadIds());

  // Cross-tab synchronization
  React.useEffect(() => {
    setLocalReadIds(getStoredReadIds());

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === NOTIF_STORAGE_KEY) {
        setLocalReadIds(getStoredReadIds());
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // 1. Data Subscriptions & Queries
  const { data: reviews = [], refetch: refetchReviews } = useGetList("reviews", {
    pagination: { page: 1, perPage: 50 },
    sort: { field: "id", order: "DESC" },
  });

  const { data: bookings = [] } = useGetList("bookings", {
    pagination: { page: 1, perPage: 100 },
  });

  const { data: therapists = [] } = useGetList("therapists", {
    pagination: { page: 1, perPage: 100 },
  });

  const { data: customers = [] } = useGetList("customers", {
    pagination: { page: 1, perPage: 100 },
  });

  // Realtime Supabase Channel for instant updates
  const refetchReviewsRef = React.useRef(refetchReviews);
  React.useEffect(() => {
    refetchReviewsRef.current = refetchReviews;
  }, [refetchReviews]);

  React.useEffect(() => {
    const channelName = `realtime-notif-center-${Math.random().toString(36).substring(2, 9)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reviews" },
        () => {
          refetchReviewsRef.current?.();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // 2. Format Relative Timestamp
  const formatTimeAgo = React.useCallback(
    (timestamp: string | Date | undefined) => {
      if (!timestamp) return "";
      try {
        const date = new Date(timestamp);
        if (isNaN(date.getTime())) return "";
        return formatDistanceToNow(date, {
          addSuffix: true,
          locale: isEn ? localeEn : localeId,
        });
      } catch {
        return "";
      }
    },
    [isEn]
  );

  // 3. Aggregate Notification Items (Centralized model)
  const notifications: NotificationItem[] = React.useMemo(() => {
    const items: NotificationItem[] = [];

    // Map Customer Reviews
    reviews.forEach((rev) => {
      const b = bookings.find((bk) => bk.id === rev.booking_id);
      const thp = therapists.find((t) => t.id === (rev.therapist_id || b?.therapist_id));
      const cust = customers.find((c) => c.id === b?.customer_id);
      const customerDisplayName =
        rev.customer_name ||
        cust?.full_name ||
        (b ? `Pelanggan #${b.id}` : isEn ? "Customer" : "Pelanggan");

      const notifId = `review-${rev.id}`;
      const isRead =
        rev.is_read === true ||
        localReadIds.has(notifId) ||
        localReadIds.has(String(rev.id));

      items.push({
        id: notifId,
        rawId: rev.id,
        category: "review",
        title: customerDisplayName,
        subtitle: thp ? (isEn ? `Therapist: ${thp.name}` : `Terapis: ${thp.name}`) : undefined,
        description: rev.comment || (isEn ? "Left a customer review rating" : "Memberikan ulasan bintang"),
        rating: Number(rev.rating) || 5,
        timestamp: rev.created_at || new Date().toISOString(),
        isRead,
        href: `#/reviews`,
      });
    });

    // Sort newest first
    return items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [reviews, bookings, therapists, customers, isEn, localReadIds]);

  // Unread items & check
  const unreadItems = React.useMemo(() => {
    return notifications.filter((n) => !n.isRead);
  }, [notifications]);

  const hasUnread = unreadItems.length > 0;

  // 4. Mark notifications as read permanently in LocalStorage + Supabase
  const markAsRead = React.useCallback(
    async (itemsToMark: NotificationItem[]) => {
      if (!itemsToMark || itemsToMark.length === 0) return;

      const notifIds: string[] = [];
      const reviewIds: number[] = [];

      itemsToMark.forEach((item) => {
        notifIds.push(item.id);
        if (item.rawId != null) {
          notifIds.push(String(item.rawId));
          if (item.category === "review" && !isNaN(Number(item.rawId))) {
            reviewIds.push(Number(item.rawId));
          }
        }
      });

      // 1. Instantly update local state and localStorage
      setLocalReadIds((prev) => {
        const updated = new Set(prev);
        notifIds.forEach((id) => updated.add(id));
        saveStoredReadIds(updated);
        return updated;
      });

      // 2. Persist to Supabase in background (resilient if is_read column exists)
      if (reviewIds.length > 0) {
        try {
          await supabase
            .from("reviews")
            .update({ is_read: true })
            .in("id", reviewIds);
        } catch {
          // Gracefully fallback to localStorage if column is not yet present
        }
      }
    },
    []
  );

  // 5. Auto mark as read when Popover opens
  const handleOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      setOpen(nextOpen);

      if (nextOpen && unreadItems.length > 0) {
        markAsRead(unreadItems);
      }
    },
    [unreadItems, markAsRead]
  );

  // Manual "Mark all read" button
  const handleMarkAllAsRead = async () => {
    await markAsRead(notifications);
    toast.success(
      isEn ? "All notifications marked as read" : "Semua notifikasi telah ditandai dibaca"
    );
  };

  const handleMarkSingleAsRead = async (item: NotificationItem) => {
    await markAsRead([item]);

    if (item.href) {
      window.location.hash = item.href;
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "relative h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 shadow-none border-0 ring-0 cursor-pointer",
              className
            )}
            title={isEn ? "Notification Center" : "Pusat Notifikasi"}
          />
        }
      >
        {/* Animated Ringing Bell Icon when unread notifications exist */}
        <motion.div
          animate={
            hasUnread
              ? {
                  rotate: [0, -15, 15, -12, 12, -6, 6, 0],
                  transition: {
                    repeat: Infinity,
                    repeatDelay: 3.5,
                    duration: 0.8,
                    ease: "easeInOut",
                  },
                }
              : { rotate: 0 }
          }
          className="flex items-center justify-center pointer-events-none"
        >
          <Bell className="w-4 h-4 text-foreground" />
        </motion.div>

        {/* Pulsing Notification Dot */}
        {hasUnread && (
          <span className="absolute 1 top-1.5 right-1.5 flex h-2.5 w-2.5 items-center justify-center pointer-events-none">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-600 dark:bg-amber-500" />
          </span>
        )}
      </PopoverTrigger>

      <PopoverContent
        align="end"
        className="w-80 sm:w-88 p-0 z-50 bg-popover border border-border shadow-none rounded-xl overflow-hidden"
      >
        {/* Notification Center Header */}
        <div className="p-3 border-b border-border flex items-center justify-between bg-muted/20">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center h-6 w-6 rounded-md bg-[#8b5e3c]/10 dark:bg-[#d49b6a]/15 text-[#8b5e3c] dark:text-[#d49b6a]">
              <Bell className="w-3.5 h-3.5" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-xs text-foreground">
                {isEn ? "Notification Center" : "Pusat Notifikasi"}
              </span>
              {hasUnread && (
                <span className="text-[10px] bg-amber-500/15 text-amber-700 dark:text-amber-400 font-semibold px-1.5 py-0.2 rounded-md">
                  {unreadItems.length} {isEn ? "new" : "baru"}
                </span>
              )}
            </div>
          </div>

          {hasUnread && (
            <Button
              variant="ghost"
              size="xs"
              onClick={handleMarkAllAsRead}
              className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer h-6 px-1.5"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>{isEn ? "Mark read" : "Tandai dibaca"}</span>
            </Button>
          )}
        </div>

        {/* Clean Notifications Feed */}
        <div className="max-h-80 overflow-y-auto divide-y divide-border/40 text-xs">
          {notifications.length > 0 ? (
            notifications.map((item) => {
              return (
                <div
                  key={item.id}
                  onClick={() => handleMarkSingleAsRead(item)}
                  className={cn(
                    "p-3 space-y-1.5 transition-colors cursor-pointer relative group",
                    !item.isRead
                      ? "bg-amber-500/5 hover:bg-amber-500/10 dark:bg-amber-500/10 dark:hover:bg-amber-500/15"
                      : "hover:bg-muted/50"
                  )}
                >
                  <div className="flex items-start gap-2.5">
                    {/* Category Icon Badge */}
                    <div className="h-7 w-7 rounded-lg shrink-0 flex items-center justify-center mt-0.5 border bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">
                      <Star className="w-3.5 h-3.5 fill-amber-500" />
                    </div>

                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-semibold text-xs text-foreground truncate">
                          {item.title}
                        </span>

                        {/* Star Rating */}
                        {item.rating !== undefined && (
                          <div className="flex items-center gap-0.5 text-amber-500 shrink-0">
                            {[...Array(item.rating)].map((_, i) => (
                              <Star key={i} className="w-3 h-3 fill-amber-500" />
                            ))}
                          </div>
                        )}
                      </div>

                      {item.subtitle && (
                        <p className="text-[11px] font-medium text-foreground/80 truncate">
                          {item.subtitle}
                        </p>
                      )}

                      {item.description && (
                        <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                          &ldquo;{item.description}&rdquo;
                        </p>
                      )}

                      <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-0.5">
                        <span>{formatTimeAgo(item.timestamp)}</span>
                        {!item.isRead && (
                          <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                            <span>{isEn ? "New" : "Baru"}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <Empty className="min-h-[180px] py-6 border-none bg-transparent">
              <EmptyHeader>
                <EmptyMedia variant="icon" className="h-9 w-9 mb-1 border-border">
                  <Inbox className="w-4 h-4 text-muted-foreground" />
                </EmptyMedia>
                <EmptyTitle className="text-xs font-semibold">
                  {isEn ? "No notifications yet" : "Belum ada notifikasi"}
                </EmptyTitle>
                <EmptyDescription className="text-[11px] max-w-[200px]">
                  {isEn
                    ? "New reviews will appear here in real-time."
                    : "Notifikasi ulasan baru akan muncul di sini secara real-time."}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
