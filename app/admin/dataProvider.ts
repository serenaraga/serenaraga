import type { DataProvider } from "ra-core";
import { supabase } from "@/lib/supabase";
import { recalculateTherapistRating, syncAllTherapistsRatings } from "@/lib/therapist-rating";
import { standardizePhoneNumber } from "@/lib/brand-settings";
import { generateInvoicePublicToken } from "@/lib/utils";

export { supabase };

const getTableName = (resource: string) => {
  if (resource === "users") return "app_users";
  if (resource === "payouts") return "therapist_payouts";
  return resource;
};

async function syncBookingItems(bookingId: number | string, specialRequests: string | null) {
  if (!bookingId || !specialRequests) return;
  try {
    const trimmed = String(specialRequests).trim();
    if (!trimmed.startsWith("{") || !trimmed.endsWith("}")) return;
    const parsed = JSON.parse(trimmed);
    if (!Array.isArray(parsed.items) || parsed.items.length === 0) return;

    // Delete existing items for this booking
    await supabase.from("booking_items").delete().eq("booking_id", bookingId);

    // Insert new relational items
    const rowsToInsert = parsed.items.map((it: any) => ({
      booking_id: bookingId,
      service_id: it.service_id ? Number(it.service_id) : null,
      service_name_snapshot: it.name || it.service_name || "Layanan",
      therapist_id: it.therapist_id ? Number(it.therapist_id) : null,
      therapist_name_snapshot: it.therapist || it.therapist_name || null,
      price: Number(it.price || 0),
      commission_rate_snapshot: Number(it.rate || 60),
      consumables_cost_snapshot: Number(it.bhp || 0),
      duration_minutes_snapshot: Number(it.duration_minutes || 60),
      transport_fee: Number(it.transport_fee || 0),
      additional_charge: Number(it.additional_charge || 0),
      additional_charge_description: it.additional_charge_description || null,
    }));

    await supabase.from("booking_items").insert(rowsToInsert);
  } catch (err) {
    console.warn("Could not sync booking_items:", err);
  }
}

async function syncInvoiceItems(invoiceId: number | string, itemsSource: any) {
  if (!invoiceId || !itemsSource) return;
  try {
    let itemsList: any[] = [];
    if (Array.isArray(itemsSource)) {
      itemsList = itemsSource;
    } else if (typeof itemsSource === "string") {
      const trimmed = itemsSource.trim();
      if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed.items)) {
          itemsList = parsed.items;
        }
      }
    }

    if (!Array.isArray(itemsList) || itemsList.length === 0) return;

    // Delete existing items for this invoice
    await supabase.from("invoice_items").delete().eq("invoice_id", invoiceId);

    // Insert new relational items
    const rowsToInsert = itemsList.map((it: any) => {
      const p = Number(it.price || 0);
      const r = Number(it.rate || 60);
      const chg = Number(it.additional_charge || 0);
      const trans = Number(it.transport_fee || 0);
      const serviceComm = Math.round((p * r) / 100);
      const chgComm = Math.round((chg * r) / 100);
      const totalFee = Number(it.commission || (serviceComm + chgComm + trans));

      return {
        invoice_id: invoiceId,
        service_id: it.service_id ? Number(it.service_id) : null,
        service_name_snapshot: it.name || it.service_name || "Layanan",
        therapist_id: it.therapist_id ? Number(it.therapist_id) : null,
        therapist_name_snapshot: it.therapist || it.therapist_name || null,
        price: p,
        commission_rate_snapshot: r,
        consumables_cost_snapshot: Number(it.bhp || 0),
        therapist_fee_calculated: totalFee,
        transport_fee: trans,
        additional_charge: chg,
        additional_charge_description: it.additional_charge_description || null,
      };
    });

    await supabase.from("invoice_items").insert(rowsToInsert);
  } catch (err) {
    console.warn("Could not sync invoice_items:", err);
  }
}

interface CacheEntry {
  timestamp: number;
  data: any[];
}
const masterCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutes

export function invalidateMasterCache(resource?: string) {
  if (resource) {
    masterCache.delete(resource);
  } else {
    masterCache.clear();
  }
}

export const dataProvider: DataProvider = {
  getList: async (resource, params) => {
    const table = getTableName(resource);
    const { page = 1, perPage = 10 } = params.pagination || {};
    const { field = "id", order = "DESC" } = params.sort || {};
    const filter = params.filter || {};

    let query = supabase
      .from(table)
      .select("*", { count: "exact" })
      .order(field, { ascending: order === "ASC" })
      .range((page - 1) * perPage, page * perPage - 1);

    // Apply filters
    for (const [key, value] of Object.entries(filter)) {
      if (value !== undefined && value !== null && value !== "") {
        if (key === "q") {
          const rawQ = String(value).trim();
          const cleanQDigits = rawQ.replace(/\D/g, "").replace(/^(62|0)/, "");

          // General multi-column search
          if (resource === "customers") {
            const orFilters = [
              `full_name.ilike.%${rawQ}%`,
              `phone.ilike.%${rawQ}%`,
              `email.ilike.%${rawQ}%`,
              `address.ilike.%${rawQ}%`,
              `city_area.ilike.%${rawQ}%`,
              `notes.ilike.%${rawQ}%`,
            ];
            if (cleanQDigits.length >= 3) {
              orFilters.push(`phone.ilike.%${cleanQDigits}%`);
            }
            query = query.or(orFilters.join(","));
          } else if (resource === "services") {
            query = query.or(
              `name.ilike.%${rawQ}%,category.ilike.%${rawQ}%,description.ilike.%${rawQ}%`
            );
          } else if (resource === "therapists") {
            const orFilters = [
              `name.ilike.%${rawQ}%`,
              `phone.ilike.%${rawQ}%`,
              `specialties.ilike.%${rawQ}%`,
              `coverage_areas.ilike.%${rawQ}%`,
              `bank_name.ilike.%${rawQ}%`,
              `domicile_address.ilike.%${rawQ}%`,
              `nik.ilike.%${rawQ}%`,
              `notes.ilike.%${rawQ}%`,
            ];
            if (cleanQDigits.length >= 3) {
              orFilters.push(`phone.ilike.%${cleanQDigits}%`);
            }
            query = query.or(orFilters.join(","));
          } else if (resource === "bookings") {
            const orParts: string[] = [
              `service_address.ilike.%${rawQ}%`,
              `status.ilike.%${rawQ}%`,
              `special_requests.ilike.%${rawQ}%`,
              `payment_method.ilike.%${rawQ}%`,
              `payment_status.ilike.%${rawQ}%`,
            ];

            // 1. Search matching customers by full_name or phone
            const custFilters = [`full_name.ilike.%${rawQ}%`, `phone.ilike.%${rawQ}%`];
            if (cleanQDigits.length >= 3) {
              custFilters.push(`phone.ilike.%${cleanQDigits}%`);
            }
            const { data: matchedCustomers } = await supabase
              .from("customers")
              .select("id")
              .or(custFilters.join(","))
              .limit(50);
            if (matchedCustomers && matchedCustomers.length > 0) {
              const ids = matchedCustomers.map((c) => c.id).join(",");
              orParts.push(`customer_id.in.(${ids})`);
            }

            // 2. Search matching therapists by name or phone
            const therFilters = [`name.ilike.%${rawQ}%`, `phone.ilike.%${rawQ}%`];
            if (cleanQDigits.length >= 3) {
              therFilters.push(`phone.ilike.%${cleanQDigits}%`);
            }
            const { data: matchedTherapists } = await supabase
              .from("therapists")
              .select("id")
              .or(therFilters.join(","))
              .limit(50);
            if (matchedTherapists && matchedTherapists.length > 0) {
              const ids = matchedTherapists.map((t) => t.id).join(",");
              orParts.push(`therapist_id.in.(${ids})`);
            }

            // 3. Search matching services by name
            const { data: matchedServices } = await supabase
              .from("services")
              .select("id")
              .ilike("name", `%${value}%`)
              .limit(50);
            if (matchedServices && matchedServices.length > 0) {
              const ids = matchedServices.map((s) => s.id).join(",");
              orParts.push(`service_id.in.(${ids})`);
            }

            // 4. Match numeric ID (e.g. "244" or "#244")
            const cleanDigits = String(value).replace(/[^0-9]/g, "");
            if (cleanDigits.length > 0) {
              const numId = parseInt(cleanDigits, 10);
              if (!isNaN(numId) && numId > 0) {
                orParts.push(`id.eq.${numId}`);
              }
            }

            query = query.or(orParts.join(","));
          } else if (resource === "invoices") {
            const orParts: string[] = [
              `invoice_number.ilike.%${value}%`,
              `customer_name.ilike.%${value}%`,
              `customer_phone.ilike.%${value}%`,
              `service_name.ilike.%${value}%`,
              `therapist_name.ilike.%${value}%`,
              `service_address.ilike.%${value}%`,
              `payment_status.ilike.%${value}%`,
              `payment_method.ilike.%${value}%`,
              `notes.ilike.%${value}%`,
            ];

            const cleanDigits = String(value).replace(/[^0-9]/g, "");
            if (cleanDigits.length > 0) {
              const numId = parseInt(cleanDigits, 10);
              if (!isNaN(numId) && numId > 0) {
                orParts.push(`id.eq.${numId}`);
              }
            }

            query = query.or(orParts.join(","));
          } else if (resource === "payouts") {
            query = query.or(
              `payout_number.ilike.%${value}%,therapist_name.ilike.%${value}%,bank_name.ilike.%${value}%,status.ilike.%${value}%,notes.ilike.%${value}%`
            );
          } else if (resource === "users") {
            query = query.or(
              `full_name.ilike.%${value}%,username.ilike.%${value}%,email.ilike.%${value}%,phone.ilike.%${value}%,role.ilike.%${value}%`
            );
          } else if (resource === "consumables") {
            query = query.or(
              `name.ilike.%${value}%,category.ilike.%${value}%,unit.ilike.%${value}%,notes.ilike.%${value}%`
            );
          } else if (resource === "reviews") {
            query = query.or(
              `customer_name.ilike.%${value}%,comment.ilike.%${value}%`
            );
          } else if (resource === "testimonials") {
            query = query.or(
              `customer_name.ilike.%${value}%,service_name.ilike.%${value}%,caption.ilike.%${value}%`
            );
          } else if (resource === "promotions") {
            query = query.or(
              `name.ilike.%${value}%,code.ilike.%${value}%,description.ilike.%${value}%,scope.ilike.%${value}%`
            );
          }
        } else if (typeof value === "string") {
          query = query.ilike(key, `%${value}%`);
        } else if (Array.isArray(value)) {
          query = query.in(key, value);
        } else {
          query = query.eq(key, value);
        }
      }
    }

    const { data, count, error } = await query;
    if (error) {
      if (error.code === "PGRST205" || error.message?.includes("schema cache") || error.message?.includes("does not exist")) {
        console.warn(`Table for ${resource} not found in database yet:`, error.message);
        return { data: [], total: 0 };
      }
      console.error(`Error in getList on ${resource}:`, error);
      throw error;
    }

    return {
      data: data || [],
      total: count ?? (data ? data.length : 0),
    };
  },

  getOne: async (resource, params) => {
    const table = getTableName(resource);
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .eq("id", params.id)
      .maybeSingle();

    if (error) {
      console.error(`Error in getOne on ${resource} (${params.id}):`, error);
      throw error;
    }

    if (!data) {
      // Graceful representation for orphaned references without crashing React Admin views
      return {
        data: {
          id: params.id,
          name: "(Dihapus / Nonaktif)",
          full_name: "(Dihapus / Nonaktif)",
          title: "(Dihapus / Nonaktif)",
          _is_archived: true,
        } as any,
      };
    }

    // Attach relational items for 3NF multi-item support if available
    if (resource === "bookings" && data?.id) {
      try {
        const { data: bItems } = await supabase
          .from("booking_items")
          .select("*")
          .eq("booking_id", data.id);
        if (bItems && bItems.length > 0) {
          (data as any).relational_items = bItems;
        }
      } catch (e) {}
    } else if (resource === "invoices" && data?.id) {
      try {
        const { data: invItems } = await supabase
          .from("invoice_items")
          .select("*")
          .eq("invoice_id", data.id);
        if (invItems && invItems.length > 0) {
          (data as any).relational_items = invItems;
        }
      } catch (e) {}
    }

    return { data };
  },

  getMany: async (resource, params) => {
    const table = getTableName(resource);
    if (!params.ids || params.ids.length === 0) {
      return { data: [] };
    }

    const now = Date.now();
    const isMaster = ["services", "therapists", "consumables", "promotions", "customers"].includes(resource);

    if (isMaster) {
      const cached = masterCache.get(resource);
      if (cached && now - cached.timestamp < CACHE_TTL_MS) {
        const idSet = new Set(params.ids.map((id) => String(id)));
        const found = cached.data.filter((item) => idSet.has(String(item.id)));
        if (found.length === params.ids.length) {
          return { data: found };
        }
      }
    }

    const { data, error } = await supabase
      .from(table)
      .select("*")
      .in("id", params.ids);

    if (error) {
      console.error(`Error in getMany on ${resource}:`, error);
      throw error;
    }

    // Populate/merge into master cache
    if (data && data.length > 0 && isMaster) {
      const existing = masterCache.get(resource)?.data || [];
      const mergedMap = new Map<string, any>();
      existing.forEach((item) => mergedMap.set(String(item.id), item));
      data.forEach((item) => mergedMap.set(String(item.id), item));
      masterCache.set(resource, {
        timestamp: now,
        data: Array.from(mergedMap.values()),
      });
    }

    // Ensure all requested IDs return an entry so ReferenceField renders seamlessly
    const existingIds = new Set((data || []).map((d: any) => String(d.id)));
    const filledData = [...(data || [])];
    for (const requestedId of params.ids) {
      if (!existingIds.has(String(requestedId))) {
        filledData.push({
          id: requestedId,
          name: "(Dihapus / Nonaktif)",
          full_name: "(Dihapus / Nonaktif)",
          title: "(Dihapus / Nonaktif)",
          _is_archived: true,
        });
      }
    }

    return { data: filledData };
  },

  getManyReference: async (resource, params) => {
    const table = getTableName(resource);
    const { page = 1, perPage = 10 } = params.pagination || {};
    const { field = "id", order = "DESC" } = params.sort || {};

    let query = supabase
      .from(table)
      .select("*", { count: "exact" })
      .eq(params.target, params.id)
      .order(field, { ascending: order === "ASC" })
      .range((page - 1) * perPage, page * perPage - 1);

    const filter = params.filter || {};
    for (const [key, value] of Object.entries(filter)) {
      if (value !== undefined && value !== null && value !== "") {
        if (typeof value === "string") {
          query = query.ilike(key, `%${value}%`);
        } else {
          query = query.eq(key, value);
        }
      }
    }

    const { data, count, error } = await query;
    if (error) {
      console.error(`Error in getManyReference on ${resource}:`, error);
      throw error;
    }

    return {
      data: data || [],
      total: count ?? (data ? data.length : 0),
    };
  },

  create: async (resource, params) => {
    const table = getTableName(resource);
    const { id, ...dataToInsert } = params.data as any;
    let createdInvoiceItems: any = null;

    if (resource === "customers") {
      if (dataToInsert.phone) {
        dataToInsert.phone = standardizePhoneNumber(dataToInsert.phone);
      }
    } else if (resource === "users") {
      if (dataToInsert.phone) {
        dataToInsert.phone = standardizePhoneNumber(dataToInsert.phone);
      }
      if (dataToInsert.password) {
        dataToInsert.password_hash = dataToInsert.password;
        delete dataToInsert.password;
      }
      if (!dataToInsert.password_hash) {
        dataToInsert.password_hash = "123456";
      }
      if (!dataToInsert.role) {
        dataToInsert.role = "cashier";
      }
      if (dataToInsert.is_active === undefined) {
        dataToInsert.is_active = true;
      }
    } else if (resource === "bookings") {
      let resolvedCustomerId = dataToInsert.customer_id;

      // If customer_id is already provided from autocomplete
      if (resolvedCustomerId) {
        const address = String(dataToInsert.service_address || "").trim();
        if (address) {
          const { data: existingCustomer } = await supabase
            .from("customers")
            .select("id, address, phone")
            .eq("id", resolvedCustomerId)
            .maybeSingle();

          if (existingCustomer) {
            const updates: any = {};
            if (!existingCustomer.address) updates.address = address;
            if (existingCustomer.phone && !existingCustomer.phone.startsWith("+62")) {
              updates.phone = standardizePhoneNumber(existingCustomer.phone);
            }
            if (Object.keys(updates).length > 0) {
              await supabase
                .from("customers")
                .update(updates)
                .eq("id", resolvedCustomerId);
            }
          }
        }
      } else if (dataToInsert.customer_phone) {
        // If customer_phone and customer_name are provided, lookup or create customer
        const rawPhone = String(dataToInsert.customer_phone).trim();
        const stdPhone = standardizePhoneNumber(rawPhone);
        const fullName = String(dataToInsert.customer_name || "Pelanggan").trim();
        const address = String(dataToInsert.service_address || "").trim();
        const cleanDigits = rawPhone.replace(/\D/g, "");
        const last8Digits = cleanDigits.length >= 8 ? cleanDigits.slice(-8) : cleanDigits;

        // Check if customer already exists with this phone
        let existingCustomer: any = null;
        if (stdPhone) {
          const { data: byStd } = await supabase
            .from("customers")
            .select("id, full_name, address, phone")
            .eq("phone", stdPhone)
            .maybeSingle();
          existingCustomer = byStd;
        }

        if (!existingCustomer && last8Digits.length >= 6) {
          const { data: byLike } = await supabase
            .from("customers")
            .select("id, full_name, address, phone")
            .ilike("phone", `%${last8Digits}%`)
            .maybeSingle();
          existingCustomer = byLike;
        }

        if (existingCustomer) {
          resolvedCustomerId = existingCustomer.id;
          const updates: any = {};
          if (!existingCustomer.address && address) updates.address = address;
          if (existingCustomer.phone && !existingCustomer.phone.startsWith("+62") && stdPhone) {
            updates.phone = stdPhone;
          }
          if (Object.keys(updates).length > 0) {
            await supabase
              .from("customers")
              .update(updates)
              .eq("id", existingCustomer.id);
          }
        } else {
          // Create new customer record with standardized +62 phone
          const { data: newCustomer, error: custError } = await supabase
            .from("customers")
            .insert({
              full_name: fullName,
              phone: stdPhone || rawPhone,
              address: address || "Alamat belum diatur",
            })
            .select()
            .single();

          if (!custError && newCustomer) {
            resolvedCustomerId = newCustomer.id;
          }
        }
      }

      dataToInsert.customer_id = resolvedCustomerId;
      delete dataToInsert.customer_name;
      delete dataToInsert.customer_phone;
      delete dataToInsert.city_area;
      delete dataToInsert.customers;
      delete dataToInsert.services;
      delete dataToInsert.therapists;

      // Ensure default booking_date if missing or invalid
      if (
        !dataToInsert.booking_date ||
        typeof dataToInsert.booking_date !== "string" ||
        dataToInsert.booking_date.trim() === ""
      ) {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, "0");
        const day = String(today.getDate()).padStart(2, "0");
        dataToInsert.booking_date = `${year}-${month}-${day}`;
      } else if (dataToInsert.booking_date.includes("T")) {
        dataToInsert.booking_date = dataToInsert.booking_date.split("T")[0];
      }

      // Ensure default booking_time if missing or invalid
      if (
        !dataToInsert.booking_time ||
        typeof dataToInsert.booking_time !== "string" ||
        dataToInsert.booking_time.trim() === ""
      ) {
        dataToInsert.booking_time = "10:00";
      }

      // Ensure service_address is non-null for DB constraint
      if (!dataToInsert.service_address) {
        dataToInsert.service_address = "-";
      }

      // Ensure total_price is valid number (dynamically fetch from service if missing)
      if (
        dataToInsert.total_price === undefined ||
        dataToInsert.total_price === null ||
        isNaN(Number(dataToInsert.total_price))
      ) {
        if (dataToInsert.service_id) {
          const { data: sData } = await supabase
            .from("services")
            .select("price")
            .eq("id", dataToInsert.service_id)
            .maybeSingle();
          dataToInsert.total_price = Number(sData?.price) || 0;
        } else {
          dataToInsert.total_price = 0;
        }
      } else {
        dataToInsert.total_price = Number(dataToInsert.total_price);
      }

      // Ensure default status is pending
      if (!dataToInsert.status) {
        dataToInsert.status = "pending";
      }

      delete dataToInsert.relational_items;
      delete dataToInsert.items;
      delete dataToInsert.raw_items;
      delete dataToInsert.additional_charge;
      delete dataToInsert.additional_charge_description;
      delete dataToInsert.customer_name;
      delete dataToInsert.customer_phone;
      delete dataToInsert.city_area;
      delete dataToInsert.customers;
      delete dataToInsert.services;
      delete dataToInsert.therapists;
    } else if (resource === "invoices") {
      if (dataToInsert.customer_phone) {
        dataToInsert.customer_phone = standardizePhoneNumber(dataToInsert.customer_phone);
      }
      const bId = dataToInsert.booking_id ? Number(dataToInsert.booking_id) : null;
      const requestedBookingStatus = dataToInsert.booking_status;
      const payStatus = dataToInsert.payment_status || "paid";
      const payMethod = dataToInsert.payment_method || "qris";
      const addCharge = Number(dataToInsert.additional_charge || 0);
      createdInvoiceItems = dataToInsert.items || dataToInsert.raw_items;

      delete dataToInsert.relational_items;
      delete dataToInsert.applied_promo_name;
      delete dataToInsert.discount_name;
      delete dataToInsert.customers;
      delete dataToInsert.bookings;
      delete dataToInsert.services;
      delete dataToInsert.therapists;
      delete dataToInsert.booking_status;
      delete dataToInsert.items;
      delete dataToInsert.raw_items;

      dataToInsert.additional_charge = addCharge;
      dataToInsert.additional_charge_description = dataToInsert.additional_charge_description || null;
      dataToInsert.booking_id = bId && !isNaN(bId) && bId > 0 ? bId : null;

      // Auto-generate invoice number: SR-YYMMDD-XXXX
      if (!dataToInsert.invoice_number) {
        const today = new Date();
        const yy = String(today.getFullYear()).slice(2);
        const mm = String(today.getMonth() + 1).padStart(2, "0");
        const dd = String(today.getDate()).padStart(2, "0");
        const rand = Math.floor(1000 + Math.random() * 9000);
        dataToInsert.invoice_number = `SR-${yy}${mm}${dd}-${rand}`;
      }

      // Auto-generate secure public capability token (Midtrans/Stripe style)
      if (!dataToInsert.public_token) {
        dataToInsert.public_token = generateInvoicePublicToken();
      }

      // Calculate totals
      const sub = Number(dataToInsert.subtotal || dataToInsert.total_amount || 0);
      const disc = Number(dataToInsert.discount || 0);
      const transport = Number(dataToInsert.transport_fee || 0);
      dataToInsert.subtotal = sub;
      dataToInsert.discount = disc;
      dataToInsert.transport_fee = transport;
      dataToInsert.total_amount = Math.max(0, sub + transport + addCharge - disc);
      dataToInsert.payment_method = payMethod;
      dataToInsert.payment_status = payStatus;

      // If associated with a booking, reliably sync the booking's status & payment
      if (dataToInsert.booking_id) {
        const bookingUpdate: any = {
          payment_status: payStatus,
          payment_method: payMethod,
          status: requestedBookingStatus || (payStatus === "paid" ? "completed" : "confirmed"),
        };

        const { error: bErr } = await supabase
          .from("bookings")
          .update(bookingUpdate)
          .eq("id", dataToInsert.booking_id);

        if (bErr) {
          console.error("Failed to sync booking status on create:", bErr);
        } else {
          invalidateMasterCache("bookings");
        }
      }
    } else if (resource === "therapists") {
      if (dataToInsert.phone) {
        dataToInsert.phone = standardizePhoneNumber(dataToInsert.phone);
      }
      if (dataToInsert.emergency_contact_phone) {
        dataToInsert.emergency_contact_phone = standardizePhoneNumber(dataToInsert.emergency_contact_phone);
      }
      // Default new therapists to null rating until real customer reviews arrive
      if (!dataToInsert.rating) {
        dataToInsert.rating = null;
      }
    } else if (resource === "reviews") {
      if (!dataToInsert.therapist_id && dataToInsert.booking_id) {
        const { data: bData } = await supabase
          .from("bookings")
          .select("therapist_id")
          .eq("id", dataToInsert.booking_id)
          .maybeSingle();
        if (bData?.therapist_id) {
          dataToInsert.therapist_id = bData.therapist_id;
        }
      }
    } else if (resource === "payouts") {
      if (!dataToInsert.payout_number) {
        const today = new Date();
        const yy = String(today.getFullYear()).slice(2);
        const mm = String(today.getMonth() + 1).padStart(2, "0");
        const dd = String(today.getDate()).padStart(2, "0");
        const rand = Math.floor(1000 + Math.random() * 9000);
        dataToInsert.payout_number = `PO-${yy}${mm}${dd}-${rand}`;
      }
      const gross = Number(dataToInsert.gross_amount || 0);
      const rate = Number(dataToInsert.commission_rate || 60);
      const fee = Number(dataToInsert.therapist_fee || (gross * rate) / 100);
      const bonus = Number(dataToInsert.bonus_amount || 0);
      const deduction = Number(dataToInsert.deduction_amount || 0);
      dataToInsert.gross_amount = gross;
      dataToInsert.commission_rate = rate;
      dataToInsert.therapist_fee = fee;
      dataToInsert.company_fee = Math.max(0, gross - fee);
      dataToInsert.bonus_amount = bonus;
      dataToInsert.deduction_amount = deduction;
      dataToInsert.net_amount = Math.max(0, fee + bonus - deduction);
      if (!dataToInsert.payment_status) dataToInsert.payment_status = "paid";
      if (!dataToInsert.payment_date) dataToInsert.payment_date = new Date().toISOString().split("T")[0];
    } else if (resource === "testimonials") {
      if (
        dataToInsert.sort_order === undefined ||
        dataToInsert.sort_order === null ||
        isNaN(Number(dataToInsert.sort_order))
      ) {
        const { data: latestItem } = await supabase
          .from("testimonials")
          .select("sort_order")
          .order("sort_order", { ascending: false })
          .limit(1);
        const maxOrder =
          latestItem && latestItem.length > 0 && typeof latestItem[0].sort_order === "number"
            ? latestItem[0].sort_order
            : -1;
        dataToInsert.sort_order = maxOrder + 1;
      } else {
        dataToInsert.sort_order = Number(dataToInsert.sort_order);
      }
    }

    const invoiceRawItems = dataToInsert.items || dataToInsert.raw_items;
    if (resource === "invoices") {
      delete dataToInsert.items;
      delete dataToInsert.raw_items;
    }

    let { data, error } = await supabase
      .from(table)
      .insert(dataToInsert)
      .select()
      .single();

    // Resilient fallback: If database schema cache is missing optional json/extra columns like bookings_breakdown
    if (
      error &&
      (error.code === "PGRST204" || error.message?.includes("column")) &&
      "bookings_breakdown" in dataToInsert
    ) {
      console.warn("Retrying insert without bookings_breakdown column:", error.message);
      const { bookings_breakdown, ...cleanedData } = dataToInsert;
      const retryResult = await supabase
        .from(table)
        .insert(cleanedData)
        .select()
        .single();
      data = retryResult.data;
      error = retryResult.error;
    }

    if (error) {
      console.error(`Error in create on ${resource}:`, error);
      throw error;
    }

    // Auto-sync relational items for bookings
    if (resource === "bookings" && data?.id && dataToInsert.special_requests) {
      syncBookingItems(data.id, dataToInsert.special_requests).catch((e) =>
        console.warn("Relational booking_items sync error:", e)
      );
    }

    // Auto-sync relational items for invoices
    if (resource === "invoices" && data?.id) {
      syncInvoiceItems(data.id, createdInvoiceItems || invoiceRawItems || dataToInsert.notes).catch((e) =>
        console.warn("Relational invoice_items sync error:", e)
      );
    }

    // Recalculate therapist rating after new review
    if (resource === "reviews") {
      const targetTherapistId = data?.therapist_id || dataToInsert.therapist_id;
      if (targetTherapistId) {
        await recalculateTherapistRating(targetTherapistId);
      }
    }

    invalidateMasterCache(resource);
    return { data };
  },

  update: async (resource, params) => {
    const table = getTableName(resource);
    const { id, created_at, ...dataToUpdate } = params.data as any;

    if (resource === "customers") {
      if (dataToUpdate.phone) {
        dataToUpdate.phone = standardizePhoneNumber(dataToUpdate.phone);
      }
    } else if (resource === "therapists") {
      if (dataToUpdate.phone) {
        dataToUpdate.phone = standardizePhoneNumber(dataToUpdate.phone);
      }
      if (dataToUpdate.emergency_contact_phone) {
        dataToUpdate.emergency_contact_phone = standardizePhoneNumber(dataToUpdate.emergency_contact_phone);
      }
    } else if (resource === "users") {
      if (dataToUpdate.phone) {
        dataToUpdate.phone = standardizePhoneNumber(dataToUpdate.phone);
      }
      if (dataToUpdate.password) {
        dataToUpdate.password_hash = dataToUpdate.password;
        delete dataToUpdate.password;
      }
    } else if (resource === "bookings") {
      if (dataToUpdate.customer_phone) {
        dataToUpdate.customer_phone = standardizePhoneNumber(dataToUpdate.customer_phone);
      }
      delete dataToUpdate.relational_items;
      delete dataToUpdate.items;
      delete dataToUpdate.raw_items;
      delete dataToUpdate.additional_charge;
      delete dataToUpdate.additional_charge_description;
      delete dataToUpdate.customer_name;
      delete dataToUpdate.customer_phone;
      delete dataToUpdate.city_area;
      delete dataToUpdate.customers;
      delete dataToUpdate.services;
      delete dataToUpdate.therapists;
    }

    const invoiceRawItems = dataToUpdate.items || dataToUpdate.raw_items;
    if (resource === "invoices") {
      if (dataToUpdate.customer_phone) {
        dataToUpdate.customer_phone = standardizePhoneNumber(dataToUpdate.customer_phone);
      }
      const bId = dataToUpdate.booking_id ? Number(dataToUpdate.booking_id) : null;
      const requestedBookingStatus = dataToUpdate.booking_status;
      const requestedPaymentStatus = dataToUpdate.payment_status;
      const requestedPaymentMethod = dataToUpdate.payment_method;

      delete dataToUpdate.relational_items;
      delete dataToUpdate.booking_status;
      delete dataToUpdate.applied_promo_name;
      delete dataToUpdate.discount_name;
      delete dataToUpdate.customers;
      delete dataToUpdate.bookings;
      delete dataToUpdate.services;
      delete dataToUpdate.therapists;
      delete dataToUpdate.items;
      delete dataToUpdate.raw_items;

      if (dataToUpdate.additional_charge !== undefined) {
        dataToUpdate.additional_charge = Number(dataToUpdate.additional_charge || 0);
      }
      if (dataToUpdate.additional_charge_description !== undefined) {
        dataToUpdate.additional_charge_description = dataToUpdate.additional_charge_description || null;
      }

      if (bId && !isNaN(bId) && bId > 0) {
        dataToUpdate.booking_id = bId;
        const bookingUpdate: any = {};
        if (requestedBookingStatus) {
          bookingUpdate.status = requestedBookingStatus;
        } else if (requestedPaymentStatus === "paid") {
          bookingUpdate.status = "completed";
        }
        if (requestedPaymentStatus) {
          bookingUpdate.payment_status = requestedPaymentStatus;
        }
        if (requestedPaymentMethod) {
          bookingUpdate.payment_method = requestedPaymentMethod;
        }

        if (Object.keys(bookingUpdate).length > 0) {
          const { error: bErr } = await supabase
            .from("bookings")
            .update(bookingUpdate)
            .eq("id", bId);
          if (bErr) {
            console.error("Failed to sync booking status on update:", bErr);
          } else {
            invalidateMasterCache("bookings");
          }
        }
      }
    }

    let { data, error } = await supabase
      .from(table)
      .update(dataToUpdate)
      .eq("id", params.id)
      .select()
      .single();

    if (
      error &&
      (error.code === "PGRST204" || error.message?.includes("column")) &&
      "bookings_breakdown" in dataToUpdate
    ) {
      console.warn("Retrying update without bookings_breakdown column:", error.message);
      const { bookings_breakdown, ...cleanedData } = dataToUpdate;
      const retryResult = await supabase
        .from(table)
        .update(cleanedData)
        .eq("id", params.id)
        .select()
        .single();
      data = retryResult.data;
      error = retryResult.error;
    }

    if (error) {
      console.error(`Error in update on ${resource} (${params.id}):`, error);
      throw error;
    }

    // Auto-sync relational items for bookings on update
    if (resource === "bookings" && params.id && dataToUpdate.special_requests) {
      syncBookingItems(params.id, dataToUpdate.special_requests).catch((e) =>
        console.warn("Relational booking_items sync error on update:", e)
      );
    }

    // Auto-sync relational items for invoices on update
    if (resource === "invoices" && params.id) {
      syncInvoiceItems(params.id, invoiceRawItems || dataToUpdate.notes).catch((e) =>
        console.warn("Relational invoice_items sync error on update:", e)
      );
    }

    // Recalculate therapist rating if review updated
    if (resource === "reviews") {
      const updatedTherapistId = data?.therapist_id || (params.previousData as any)?.therapist_id;
      if (updatedTherapistId) {
        await recalculateTherapistRating(updatedTherapistId);
      }
    }

    invalidateMasterCache(resource);
    return { data };
  },

  updateMany: async (resource, params) => {
    const table = getTableName(resource);
    const { id, created_at, ...dataToUpdate } = params.data as any;

    const { data, error } = await supabase
      .from(table)
      .update(dataToUpdate)
      .in("id", params.ids)
      .select();

    if (error) {
      console.error(`Error in updateMany on ${resource}:`, error);
      throw error;
    }

    invalidateMasterCache(resource);
    return { data: (data || []).map((item) => item.id) };
  },

  delete: async (resource, params) => {
    const table = getTableName(resource);

    // Referential Integrity Guard for master data entities
    if (resource === "therapists") {
      const { count: bookingCount } = await supabase
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("therapist_id", params.id);

      const { count: payoutCount } = await supabase
        .from("therapist_payouts")
        .select("id", { count: "exact", head: true })
        .eq("therapist_id", params.id);

      const totalLinked = (bookingCount || 0) + (payoutCount || 0);
      if (totalLinked > 0) {
        throw new Error(
          `Terapis ini terikat dengan ${totalLinked} riwayat transaksi (booking/payout). Untuk menjaga keabsahan riwayat keuangan & audit, data tidak dapat dihapus permanen. Silakan ubah status menjadi Nonaktif (Off Duty).`
        );
      }
    } else if (resource === "services") {
      const { count: bookingCount } = await supabase
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("service_id", params.id);

      if (bookingCount && bookingCount > 0) {
        throw new Error(
          `Layanan ini terikat dengan ${bookingCount} riwayat booking resmi. Silakan nonaktifkan layanan daripada menghapusnya permanen.`
        );
      }
    } else if (resource === "customers") {
      const { count: bookingCount } = await supabase
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("customer_id", params.id);

      if (bookingCount && bookingCount > 0) {
        throw new Error(
          `Pelanggan ini memiliki ${bookingCount} riwayat booking. Data riwayat terlindungi dan tidak dapat dihapus permanen.`
        );
      }
    } else if (resource === "promotions") {
      const { count: invoiceCount } = await supabase
        .from("invoices")
        .select("id", { count: "exact", head: true })
        .eq("promo_id", params.id);

      if (invoiceCount && invoiceCount > 0) {
        throw new Error(
          `Promo ini sudah tercatat dalam ${invoiceCount} invoice. Silakan ubah status promo menjadi Nonaktif (Inactive).`
        );
      }
    }

    const { error } = await supabase
      .from(table)
      .delete()
      .eq("id", params.id);

    if (error) {
      console.error(`Error in delete on ${resource} (${params.id}):`, error);
      throw error;
    }

    if (resource === "reviews") {
      const prevTherapistId = (params.previousData as any)?.therapist_id;
      if (prevTherapistId) {
        await recalculateTherapistRating(prevTherapistId);
      }
    }

    invalidateMasterCache(resource);
    return { data: params.previousData as any };
  },

  deleteMany: async (resource, params) => {
    const table = getTableName(resource);

    // Guard for bulk deletions
    if (resource === "therapists" || resource === "services" || resource === "customers" || resource === "promotions") {
      const foreignKeyMap: Record<string, string> = {
        therapists: "therapist_id",
        services: "service_id",
        customers: "customer_id",
        promotions: "promo_id",
      };
      const fk = foreignKeyMap[resource];
      const targetTable = resource === "promotions" ? "invoices" : "bookings";

      const { count: linkedCount } = await supabase
        .from(targetTable)
        .select("id", { count: "exact", head: true })
        .in(fk, params.ids);

      if (linkedCount && linkedCount > 0) {
        throw new Error(
          `Beberapa data terpilih memiliki ${linkedCount} riwayat transaksi aktif. Penghapusan massal dibatalkan demi integritas data audit.`
        );
      }
    }

    const { error } = await supabase
      .from(table)
      .delete()
      .in("id", params.ids);

    if (error) {
      console.error(`Error in deleteMany on ${resource}:`, error);
      throw error;
    }

    if (resource === "reviews") {
      await syncAllTherapistsRatings();
    }

    invalidateMasterCache(resource);
    return { data: params.ids };
  },
};
