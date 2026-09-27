"use client";

import { Resource, CustomRoutes } from "ra-core";
import { Route } from "react-router-dom";
import { Admin } from "@/components/admin";
import { dataProvider } from "./dataProvider";
import { authProvider } from "@/lib/authProvider";
import { i18nProvider } from "@/lib/i18nProvider";
import { Dashboard } from "./Dashboard";
import { BookingList, BookingEdit, BookingCreate, BookingShow } from "./bookings";
import { ServiceList, ServiceEdit, ServiceCreate, ServiceShow } from "./services";
import { ConsumableList, ConsumableEdit, ConsumableCreate, ConsumableShow } from "./consumables";
import { TherapistList, TherapistEdit, TherapistCreate, TherapistShow } from "./therapists";
import { TherapistMilestonesPage } from "./therapists/therapist-milestones";
import { CustomerList, CustomerEdit, CustomerCreate, CustomerShow } from "./customers";
import { ReviewList, ReviewEdit, ReviewCreate, ReviewShow } from "./reviews";
import {
  TestimonialList,
  TestimonialEdit,
  TestimonialCreate,
  TestimonialShow,
} from "./testimonials";
import {
  PromotionList,
  PromotionCreate,
  PromotionEdit,
  PromotionShow,
} from "./promotions";
import { InvoiceList, InvoiceCreate, InvoiceShow } from "./invoices";
import { PayoutCreate, PayoutShow } from "./payouts";
import { BrandSettingsPage } from "./settings";
import { UserList, UserCreate, UserEdit } from "./users";
import {
  CalendarCheck,
  Sparkles,
  UserCheck,
  Users,
  Star,
  ReceiptText,
  Wallet,
  SlidersHorizontal,
  UserCog,
  MessageSquareQuote,
  TicketPercent,
} from "lucide-react";
import { QueryClient } from "@tanstack/react-query";

const adminQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes fresh cache
      gcTime: 10 * 60 * 1000,   // 10 minutes memory retention
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const App = () => (
  <Admin
    queryClient={adminQueryClient}
    dataProvider={dataProvider}
    authProvider={authProvider}
    i18nProvider={i18nProvider}
    dashboard={Dashboard}
    title="Serena Raga • Home Massage Admin"
  >
    {(permissions: any) => {
      const isAdmin = permissions === "admin";

      return [
        <Resource
          key="bookings"
          name="bookings"
          list={BookingList}
          edit={BookingEdit}
          create={BookingCreate}
          show={BookingShow}
          recordRepresentation={(record) => `#${record.id} - ${record.booking_date}`}
          icon={CalendarCheck}
        />,
        <Resource
          key="invoices"
          name="invoices"
          list={InvoiceList}
          create={InvoiceCreate}
          show={InvoiceShow}
          recordRepresentation="invoice_number"
          icon={ReceiptText}
        />,
        <Resource
          key="customers"
          name="customers"
          list={CustomerList}
          edit={CustomerEdit}
          create={CustomerCreate}
          show={CustomerShow}
          recordRepresentation="full_name"
          icon={Users}
        />,

        // Only accessible by Administrator
        isAdmin ? (
          <Resource
            key="services"
            name="services"
            list={ServiceList}
            edit={ServiceEdit}
            create={ServiceCreate}
            show={ServiceShow}
            recordRepresentation="name"
            icon={Sparkles}
          />
        ) : null,
        isAdmin ? (
          <Resource
            key="consumables"
            name="consumables"
            list={ConsumableList}
            edit={ConsumableEdit}
            create={ConsumableCreate}
            show={ConsumableShow}
            recordRepresentation="name"
          />
        ) : null,
        isAdmin ? (
          <Resource
            key="therapists"
            name="therapists"
            list={TherapistList}
            edit={TherapistEdit}
            create={TherapistCreate}
            show={TherapistShow}
            recordRepresentation="name"
            icon={UserCheck}
          />
        ) : null,
        isAdmin ? (
          <Resource
            key="payouts"
            name="payouts"
            create={PayoutCreate}
            show={PayoutShow}
            recordRepresentation="payout_number"
          />
        ) : null,
        isAdmin ? (
          <Resource
            key="reviews"
            name="reviews"
            list={ReviewList}
            edit={ReviewEdit}
            create={ReviewCreate}
            show={ReviewShow}
            recordRepresentation="id"
            icon={Star}
          />
        ) : null,
        isAdmin ? (
          <Resource
            key="testimonials"
            name="testimonials"
            list={TestimonialList}
            edit={TestimonialEdit}
            create={TestimonialCreate}
            show={TestimonialShow}
            recordRepresentation="customer_name"
            icon={MessageSquareQuote}
          />
        ) : null,
        isAdmin ? (
          <Resource
            key="promotions"
            name="promotions"
            list={PromotionList}
            edit={PromotionEdit}
            create={PromotionCreate}
            show={PromotionShow}
            recordRepresentation="name"
            icon={TicketPercent}
          />
        ) : null,
        isAdmin ? (
          <Resource
            key="users"
            name="users"
            list={UserList}
            create={UserCreate}
            edit={UserEdit}
            icon={UserCog}
          />
        ) : null,
        isAdmin ? (
          <Resource
            key="settings"
            name="settings"
            list={BrandSettingsPage}
            icon={SlidersHorizontal}
          />
        ) : null,
        <CustomRoutes key="custom-therapist-routes">
          <Route path="/therapists/milestones" element={<TherapistMilestonesPage />} />
        </CustomRoutes>,
      ];
    }}
  </Admin>
);

export default App;
