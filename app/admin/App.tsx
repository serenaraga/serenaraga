"use client";

import { Resource } from "ra-core";
import { Admin } from "@/components/admin";
import { dataProvider } from "./dataProvider";
import { authProvider } from "@/lib/authProvider";
import { i18nProvider } from "@/lib/i18nProvider";
import { Dashboard } from "./Dashboard";
import { BookingList, BookingEdit, BookingCreate, BookingShow } from "./bookings";
import { ServiceList, ServiceEdit, ServiceCreate, ServiceShow } from "./services";
import { TherapistList, TherapistEdit, TherapistCreate, TherapistShow } from "./therapists";
import { CustomerList, CustomerEdit, CustomerCreate, CustomerShow } from "./customers";
import { ReviewList, ReviewEdit, ReviewCreate, ReviewShow } from "./reviews";
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
} from "lucide-react";

const App = () => (
  <Admin
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
      ];
    }}
  </Admin>
);

export default App;
