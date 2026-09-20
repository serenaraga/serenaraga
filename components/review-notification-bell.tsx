"use client";

import * as React from "react";
import { useGetList, useLocaleState } from "ra-core";
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
  ArrowUpRight,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

export function ReviewNotificationBell({ className }: { className?: string }) {
  const [locale] = useLocaleState();
  const isEn = locale === "en";
  const [open, setOpen] = React.useState(false);

  // Fetch reviews and related data
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

  // Calculate unread reviews
  const unreadReviews = React.useMemo(() => {
    return reviews.filter((r) => r.is_read === false || r.is_read === null);
  }, [reviews]);

  const hasNewReviews = unreadReviews.length > 0;

  const refetchRef = React.useRef(refetchReviews);
  refetchRef.current = refetchReviews;

  // Realtime Supabase channel to listen for new reviews instantly
  React.useEffect(() => {
    const channelName = `realtime-reviews-${Math.random().toString(36).substring(2, 9)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "reviews" },
        () => {
          refetchRef.current?.();
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "reviews" },
        () => {
          refetchRef.current?.();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Mark all reviews as read
  const handleMarkAllAsRead = async () => {
    try {
      await supabase
        .from("reviews")
        .update({ is_read: true })
        .eq("is_read", false);

      toast.success(
        isEn ? "All reviews marked as read" : "Semua notifikasi ulasan telah ditandai dibaca"
      );
      refetchReviews();
    } catch (e) {
      // Non-blocking
    }
  };

  // Mark single review as read
  const handleMarkSingleAsRead = async (reviewId: number | string) => {
    try {
      await supabase
        .from("reviews")
        .update({ is_read: true })
        .eq("id", Number(reviewId));

      refetchReviews();
    } catch (e) {
      // Non-blocking
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            size="icon"
            className={cn("relative h-8 w-8 shadow-none", className)}
            title={isEn ? "Customer Review Notifications" : "Notifikasi Ulasan Pelanggan"}
          />
        }
      >
        <Bell className="w-4 h-4 text-foreground" />
        {hasNewReviews && (
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center pointer-events-none">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-600 border border-background"></span>
          </span>
        )}
      </PopoverTrigger>

      <PopoverContent
        align="end"
        className="w-80 p-0 z-50 bg-popover border border-border shadow-none rounded-xl overflow-hidden"
      >
        {/* Header */}
        <div className="p-3 border-b border-border/70 flex items-center justify-between bg-muted/20">
          <div className="flex items-center gap-1.5">
            <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
            <span className="font-semibold text-xs text-foreground">
              {isEn ? "Customer Reviews" : "Ulasan Pelanggan"}
            </span>
            {hasNewReviews && (
              <span className="text-[10px] bg-amber-500/15 text-amber-700 dark:text-amber-400 font-semibold px-1.5 py-0.5 rounded-md">
                {unreadReviews.length} {isEn ? "new" : "baru"}
              </span>
            )}
          </div>

          {hasNewReviews && (
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

        {/* Review Notifications List */}
        <div className="max-h-72 overflow-y-auto divide-y divide-border/40 text-xs">
          {reviews.length > 0 ? (
            reviews.slice(0, 8).map((rev) => {
              const b = bookings.find((bk) => bk.id === rev.booking_id);
              const thp = therapists.find((t) => t.id === (rev.therapist_id || b?.therapist_id));
              const cust = customers.find((c) => c.id === b?.customer_id);
              const customerDisplayName =
                rev.customer_name ||
                cust?.full_name ||
                (b ? `Pelanggan #${b.id}` : isEn ? "Client" : "Pelanggan");
              const isUnread = rev.is_read === false || rev.is_read === null;

              return (
                <div
                  key={rev.id}
                  onClick={() => handleMarkSingleAsRead(rev.id)}
                  className={cn(
                    "p-3 space-y-1 transition-colors cursor-pointer",
                    isUnread ? "bg-amber-500/5 hover:bg-amber-500/10" : "hover:bg-muted/50"
                  )}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-semibold text-foreground truncate max-w-[140px]">
                      {customerDisplayName}
                    </span>
                    <div className="flex items-center gap-0.5 text-amber-500 text-[11px] shrink-0">
                      {[...Array(Number(rev.rating) || 5)].map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-amber-500" />
                      ))}
                    </div>
                  </div>

                  {rev.comment && (
                    <p className="text-[11px] text-muted-foreground line-clamp-2 italic">
                      &ldquo;{rev.comment}&rdquo;
                    </p>
                  )}

                  <div className="flex items-center justify-between text-[10px] text-muted-foreground/80 pt-0.5">
                    {thp ? (
                      <span>
                        {isEn ? "Therapist:" : "Terapis:"}{" "}
                        <strong className="text-foreground">{thp.name}</strong>
                      </span>
                    ) : (
                      <span>{isEn ? "Home Service" : "Layanan Pijat"}</span>
                    )}
                    <span>
                      {rev.created_at
                        ? new Date(rev.created_at).toLocaleDateString(
                            isEn ? "en-US" : "id-ID",
                            { day: "numeric", month: "short" }
                          )
                        : ""}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-6 text-center text-xs text-muted-foreground">
              {isEn ? "No reviews received yet." : "Belum ada ulasan masuk."}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-2 border-t border-border/70 text-center bg-muted/20">
          <a
            href="#/reviews"
            onClick={() => setOpen(false)}
            className="text-[11px] font-medium text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
          >
            <span>{isEn ? "View all reviews in table" : "Buka daftar semua ulasan"}</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </PopoverContent>
    </Popover>
  );
}
