import { supabase } from "@/lib/supabase";

/**
 * Accurately recalculates and updates the average rating of a therapist
 * based on all reviews linked directly or via bookings.
 */
export async function recalculateTherapistRating(therapistId: number | string | null | undefined): Promise<number | null> {
  if (!therapistId || isNaN(Number(therapistId))) return null;
  const tid = Number(therapistId);

  try {
    // 1. Get all reviews directly linked to this therapist
    const { data: directReviews } = await supabase
      .from("reviews")
      .select("id, rating, booking_id")
      .eq("therapist_id", tid);

    // 2. Get all bookings assigned to this therapist
    const { data: therapistBookings } = await supabase
      .from("bookings")
      .select("id")
      .eq("therapist_id", tid);

    const bookingIds = therapistBookings?.map((b) => b.id) || [];

    // 3. Get any reviews linked to those bookings (in case therapist_id was null on review)
    let bookingReviews: any[] = [];
    if (bookingIds.length > 0) {
      const { data: revsFromBookings } = await supabase
        .from("reviews")
        .select("id, rating, booking_id")
        .in("booking_id", bookingIds);
      bookingReviews = revsFromBookings || [];
    }

    // Combine and deduplicate reviews by review id
    const reviewMap = new Map<number, number>();
    directReviews?.forEach((r) => {
      if (r.id && r.rating != null) reviewMap.set(r.id, Number(r.rating));
    });
    bookingReviews?.forEach((r) => {
      if (r.id && r.rating != null) reviewMap.set(r.id, Number(r.rating));
    });

    const allRatings = Array.from(reviewMap.values()).filter((rate) => !isNaN(rate) && rate > 0);

    let newAvgRating: number | null = null;
    if (allRatings.length > 0) {
      const sum = allRatings.reduce((acc, curr) => acc + curr, 0);
      newAvgRating = Number((sum / allRatings.length).toFixed(1));
    }

    // 4. Update the therapist's record in the database
    await supabase
      .from("therapists")
      .update({ rating: newAvgRating })
      .eq("id", tid);

    // Also update any reviews for these bookings to have the therapist_id set
    if (bookingIds.length > 0) {
      await supabase
        .from("reviews")
        .update({ therapist_id: tid })
        .in("booking_id", bookingIds)
        .is("therapist_id", null);
    }

    return newAvgRating;
  } catch (err) {
    console.error(`Failed to recalculate rating for therapist ${therapistId}:`, err);
    return null;
  }
}

/**
 * Recalculates and synchronizes ratings for all therapists in the database
 */
export async function syncAllTherapistsRatings(): Promise<void> {
  try {
    const { data: therapists } = await supabase
      .from("therapists")
      .select("id");

    if (therapists && therapists.length > 0) {
      await Promise.all(therapists.map((t) => recalculateTherapistRating(t.id)));
    }
  } catch (err) {
    console.error("Failed to sync all therapists ratings:", err);
  }
}
