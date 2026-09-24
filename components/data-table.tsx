"use client";

import type { ReactNode } from "react";
import { Children, createElement, isValidElement, useCallback } from "react";
import type {
  DataTableBaseProps,
  ExtractRecordPaths,
  HintedString,
  Identifier,
  RaRecord,
  SortPayload,
} from "ra-core";
import {
  DataTableBase,
  DataTableRenderContext,
  FieldTitle,
  RecordContextProvider,
  useDataTableCallbacksContext,
  useDataTableConfigContext,
  useDataTableDataContext,
  useDataTableRenderContext,
  useDataTableSelectedIdsContext,
  useDataTableSortContext,
  useDataTableStoreContext,
  useGetPathForRecordCallback,
  useRecordContext,
  useResourceContext,
  useStore,
  useTranslate,
  useTranslateLabel,
  useNavigate,
} from "ra-core";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import get from "lodash/get";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ColumnsSelector,
  ColumnsSelectorItem,
} from "@/components/columns-button";
import { NumberField } from "@/components/number-field";
import { TableSkeleton } from "@/components/ui/skeleton";
import {
  BulkActionsToolbar,
  BulkActionsToolbarChildren,
} from "@/components/bulk-actions-toolbar";

const defaultBulkActionButtons = <BulkActionsToolbarChildren />;

export interface DataTableColumnProps<
  RecordType extends RaRecord<Identifier> = RaRecord<Identifier>,
> {
  className?: string;
  cellClassName?: string;
  headerClassName?: string;
  conditionalClassName?: (record: RecordType) => string | false | undefined;
  children?: ReactNode;
  render?: (record: RecordType) => React.ReactNode;
  field?: React.ElementType;
  source?: NoInfer<HintedString<ExtractRecordPaths<RecordType>>>;
  label?: React.ReactNode;
  disableSort?: boolean;
  sortByOrder?: SortPayload["order"];
}

export function DataTableColumn<
  RecordType extends RaRecord<Identifier> = RaRecord<Identifier>,
>(props: DataTableColumnProps<RecordType>) {
  const renderContext = useDataTableRenderContext();
  switch (renderContext) {
    case "columnsSelector":
      return <ColumnsSelectorItem<RecordType> {...props} />;
    case "header":
      return <DataTableHeadCell {...props} />;
    case "data":
    default:
      return <DataTableCell {...props} />;
  }
}

export function DataTableNumberColumn<
  RecordType extends RaRecord<Identifier> = RaRecord<Identifier>,
>(props: DataTableNumberColumnProps<RecordType>) {
  const {
    source,
    options,
    locales,
    className,
    headerClassName,
    cellClassName,
    ...rest
  } = props;
  return (
    <DataTableColumn
      source={source}
      {...rest}
      className={className}
      headerClassName={cn("text-right", headerClassName)}
      cellClassName={cn("text-right", cellClassName)}
    >
      <NumberField source={source} options={options} locales={locales} />
    </DataTableColumn>
  );
}

export interface DataTableNumberColumnProps<
  RecordType extends RaRecord<Identifier> = RaRecord<Identifier>,
> extends DataTableColumnProps<RecordType> {
  source: NoInfer<HintedString<ExtractRecordPaths<RecordType>>>;
  locales?: string | string[];
  options?: Intl.NumberFormatOptions;
}

export interface DataTableProps<
  RecordType extends RaRecord = RaRecord,
> extends Partial<DataTableBaseProps<RecordType>> {
  children: ReactNode;
  className?: string;
  rowClassName?: (record: RecordType) => string | undefined;
  bulkActionButtons?: ReactNode;
  bulkActionsToolbar?: ReactNode;
}

export function DataTable<RecordType extends RaRecord = RaRecord>(
  props: DataTableProps<RecordType>,
) {
  const {
    children,
    className,
    rowClassName,
    bulkActionButtons = defaultBulkActionButtons,
    bulkActionsToolbar,
    ...rest
  } = props;
  const hasBulkActions = !!bulkActionsToolbar || bulkActionButtons !== false;
  const resourceFromContext = useResourceContext(props);
  const storeKey = props.storeKey || `${resourceFromContext}.datatable`;
  const [columnRanks] = useStore<number[]>(`${storeKey}_columnRanks`);
  const columns = columnRanks
    ? reorderChildren(children, columnRanks)
    : children;

  return (
    <DataTableBase<RecordType>
      hasBulkActions={hasBulkActions}
      loading={<TableSkeleton rows={6} columns={5} hasToolbar={false} />}
      empty={<DataTableEmpty />}
      {...rest}
    >
      <div className={cn("rounded-xl border border-border bg-card overflow-hidden shadow-none", className)}>
        <Table>
          <DataTableRenderContext.Provider value="header">
            <DataTableHead>{columns}</DataTableHead>
          </DataTableRenderContext.Provider>
          <DataTableRenderContext.Provider value="data">
            <DataTableBody<RecordType> rowClassName={rowClassName}>
              {columns}
            </DataTableBody>
          </DataTableRenderContext.Provider>
        </Table>
      </div>
      {bulkActionsToolbar ??
        (bulkActionButtons !== false && (
          <BulkActionsToolbar>
            {isValidElement(bulkActionButtons)
              ? bulkActionButtons
              : defaultBulkActionButtons}
          </BulkActionsToolbar>
        ))}
      <DataTableRenderContext.Provider value="columnsSelector">
        <ColumnsSelector>{children}</ColumnsSelector>
      </DataTableRenderContext.Provider>
    </DataTableBase>
  );
}

DataTable.Col = DataTableColumn;
DataTable.NumberCol = DataTableNumberColumn;

export const DataTableCol = DataTableColumn;
export const DataTableNumberCol = DataTableNumberColumn;

const DataTableHead = ({ children }: { children: ReactNode }) => {
  const data = useDataTableDataContext();
  const { hasBulkActions = false } = useDataTableConfigContext();
  const { onSelect } = useDataTableCallbacksContext();
  const selectedIds = useDataTableSelectedIdsContext();
  const handleToggleSelectAll = (checked: boolean) => {
    if (!onSelect || !data || !selectedIds) return;
    onSelect(
      checked
        ? selectedIds.concat(
            data
              .filter((record) => !selectedIds.includes(record.id))
              .map((record) => record.id),
          )
        : selectedIds.filter((id) => !data.some((record) => record.id === id)),
    );
  };
  const selectableIds = Array.isArray(data)
    ? data.map((record) => record.id)
    : [];
  return (
    <TableHeader>
      <TableRow>
        {hasBulkActions ? (
          <TableHead className="w-8">
            <Checkbox
              onCheckedChange={handleToggleSelectAll}
              checked={
                selectedIds &&
                selectedIds.length > 0 &&
                selectableIds.length > 0 &&
                selectableIds.every((id) => selectedIds.includes(id))
              }
              className="mb-2"
            />
          </TableHead>
        ) : null}
        {children}
      </TableRow>
    </TableHeader>
  );
};

const DataTableBody = <RecordType extends RaRecord = RaRecord>({
  children,
  rowClassName,
}: {
  children: ReactNode;
  rowClassName?: (record: RecordType) => string | undefined;
}) => {
  const data = useDataTableDataContext();
  return (
    <TableBody>
      {data?.map((record, rowIndex) => (
        <RecordContextProvider
          value={record}
          key={record.id ?? `row${rowIndex}`}
        >
          <DataTableRow className={rowClassName?.(record)}>
            {children}
          </DataTableRow>
        </RecordContextProvider>
      ))}
    </TableBody>
  );
};

const DataTableRow = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => {
  const { rowClick, handleToggleItem } = useDataTableCallbacksContext();
  const selectedIds = useDataTableSelectedIdsContext();
  const { hasBulkActions = false } = useDataTableConfigContext();

  const record = useRecordContext();
  if (!record) {
    throw new Error("DataTableRow can only be used within a RecordContext");
  }

  const resource = useResourceContext();
  if (!resource) {
    throw new Error("DataTableRow can only be used within a ResourceContext");
  }

  const navigate = useNavigate();
  const getPathForRecord = useGetPathForRecordCallback();

  const handleToggle = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();
      if (!handleToggleItem) return;
      handleToggleItem(record.id, event);
    },
    [handleToggleItem, record.id],
  );

  const handleClick = useCallback(async () => {
    const temporaryLink =
      typeof rowClick === "function"
        ? rowClick(record.id, resource, record)
        : rowClick;

    const link = isPromise(temporaryLink) ? await temporaryLink : temporaryLink;

    const path = await getPathForRecord({
      record,
      resource,
      link,
    });
    if (path === false || path == null) {
      return;
    }
    navigate(path, {
      state: { _scrollToTop: true },
    });
  }, [record, resource, rowClick, navigate, getPathForRecord]);

  return (
    <TableRow
      key={record.id}
      onClick={handleClick}
      className={cn(rowClick !== false && "cursor-pointer", className)}
    >
      {hasBulkActions ? (
        <TableCell className="flex w-8" onClick={handleToggle}>
          <Checkbox
            checked={selectedIds?.includes(record.id)}
            onClick={handleToggle}
          />
        </TableCell>
      ) : null}
      {children}
    </TableRow>
  );
};

const isPromise = (value: any): value is Promise<any> =>
  value && typeof value.then === "function";

import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty";
import {
  Boxes,
  Sparkles,
  CalendarCheck,
  UserCheck,
  Users,
  ReceiptText,
  Wallet,
  Star,
  UserCog,
  SearchX,
  Inbox,
  Plus,
  RotateCcw,
} from "lucide-react";
import { LinkBase, useListContext, useLocaleState, useResourceDefinition } from "ra-core";

interface ResourceEmptyConfig {
  icon: React.ElementType;
  titleEn: string;
  titleId: string;
  descEn: string;
  descId: string;
  actionEn?: string;
  actionId?: string;
  actionPath?: string;
}

const RESOURCE_EMPTY_CONFIGS: Record<string, ResourceEmptyConfig> = {
  services: {
    icon: Sparkles,
    titleEn: "No services yet",
    titleId: "Belum ada layanan",
    descEn: "Your service catalog is empty. Add your massage treatments, durations, and pricing to get started.",
    descId: "Katalog layanan pijat belum tersedia. Tambahkan menu layanan baru untuk mulai menerima pesanan.",
    actionEn: "Add Service",
    actionId: "Tambah Layanan",
    actionPath: "/services/create",
  },
  consumables: {
    icon: Boxes,
    titleEn: "No consumables or supplies yet",
    titleId: "Belum ada bahan habis pakai",
    descEn: "Track essential massage oils, body scrubs, lotions, and spa supplies to calculate COGS automatically.",
    descId: "Daftar minyak pijat, scrub, lotion, dan bahan perawatan belum ada. Tambahkan bahan untuk otomatisasi HPP layanan.",
    actionEn: "Add Consumable",
    actionId: "Tambah Bahan",
    actionPath: "/consumables/create",
  },
  bookings: {
    icon: CalendarCheck,
    titleEn: "No bookings found",
    titleId: "Belum ada pemesanan",
    descEn: "No appointment reservations recorded yet. Create a new booking or wait for incoming client orders.",
    descId: "Belum ada pesanan layanan yang tercatat. Buat janji temu baru untuk pelanggan Anda.",
    actionEn: "New Booking",
    actionId: "Buat Booking",
    actionPath: "/bookings/create",
  },
  therapists: {
    icon: UserCheck,
    titleEn: "No therapists registered",
    titleId: "Belum ada terapis terdaftar",
    descEn: "Register your professional massage therapists to assign them to appointments and track commission payouts.",
    descId: "Daftarkan tim terapis pijat profesional untuk mulai mengelola jadwal dan komisi bagi hasil.",
    actionEn: "Add Therapist",
    actionId: "Tambah Terapis",
    actionPath: "/therapists/create",
  },
  customers: {
    icon: Users,
    titleEn: "No customer records",
    titleId: "Belum ada data pelanggan",
    descEn: "Customer contacts and profiles will appear here once bookings are placed, or you can register them manually.",
    descId: "Data pelanggan akan tercatat secara otomatis saat booking atau Anda bisa menambahkannya secara manual.",
    actionEn: "Add Customer",
    actionId: "Tambah Pelanggan",
    actionPath: "/customers/create",
  },
  invoices: {
    icon: ReceiptText,
    titleEn: "No invoices generated",
    titleId: "Belum ada invoice tagihan",
    descEn: "Billing invoices and payment records for completed customer appointments will be listed here.",
    descId: "Faktur tagihan pembayaran untuk transaksi layanan pelanggan akan terdaftar di sini.",
    actionEn: "Create Invoice",
    actionId: "Buat Invoice",
    actionPath: "/invoices/create",
  },
  payouts: {
    icon: Wallet,
    titleEn: "No payout records",
    titleId: "Belum ada riwayat pembayaran komisi",
    descEn: "Therapist commission settlements and withdrawal records will show up here.",
    descId: "Catatan pencairan komisi dan bagi hasil untuk terapis akan terdaftar di sini.",
    actionEn: "New Payout",
    actionId: "Catat Pembayaran",
    actionPath: "/payouts/create",
  },
  reviews: {
    icon: Star,
    titleEn: "No customer reviews yet",
    titleId: "Belum ada ulasan pelanggan",
    descEn: "Customer satisfaction ratings and feedback will be collected here after treatment sessions are finished.",
    descId: "Penilaian bintang dan testimoni dari pelanggan akan ditampilkan di sini setelah treatment selesai.",
    actionEn: "Add Review",
    actionId: "Tambah Ulasan",
    actionPath: "/reviews/create",
  },
  users: {
    icon: UserCog,
    titleEn: "No administrative users",
    titleId: "Belum ada akun pengguna",
    descEn: "Manage system administrators, staff members, and access privileges for Serena Raga.",
    descId: "Kelola staf administrator dan hak akses operasional sistem Serena Raga.",
    actionEn: "Add User",
    actionId: "Tambah Pengguna",
    actionPath: "/users/create",
  },
};

export const DataTableEmpty = () => {
  const resource = useResourceContext();
  const [locale] = useLocaleState();
  const isEn = locale === "en";
  const listContext = useListContext();
  const { hasCreate } = useResourceDefinition({ resource });

  const filterValues = listContext?.filterValues || {};
  const hasActiveFilters = Object.keys(filterValues).some(
    (key) =>
      filterValues[key] !== undefined &&
      filterValues[key] !== "" &&
      filterValues[key] !== null
  );

  if (hasActiveFilters) {
    return (
      <Empty className="my-2 border-border/70">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <SearchX className="h-6 w-6 text-muted-foreground" />
          </EmptyMedia>
          <EmptyTitle>
            {isEn ? "No matching records found" : "Tidak ada hasil pencarian"}
          </EmptyTitle>
          <EmptyDescription>
            {isEn
              ? "We couldn't find any results matching your search or active filters. Try adjusting or clearing your filters."
              : "Tidak ditemukan data yang cocok dengan kata kunci atau filter aktif Anda. Coba ubah atau bersihkan filter pencarian."}
          </EmptyDescription>
        </EmptyHeader>
        {listContext?.setFilters && (
          <EmptyContent>
            <Button
              variant="outline"
              size="sm"
              onClick={() => listContext.setFilters({}, {})}
              className="gap-1.5 text-xs cursor-pointer shadow-none"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>{isEn ? "Reset Filters" : "Reset Filter"}</span>
            </Button>
          </EmptyContent>
        )}
      </Empty>
    );
  }

  const config = resource ? RESOURCE_EMPTY_CONFIGS[resource] : null;
  const IconComponent = config?.icon || Inbox;
  const title = config
    ? isEn
      ? config.titleEn
      : config.titleId
    : isEn
    ? "No records found"
    : "Tidak ada data";
  const desc = config
    ? isEn
      ? config.descEn
      : config.descId
    : isEn
    ? "No entries have been added to this catalog yet."
    : "Belum ada entri data yang tercatat di menu ini.";
  const actionLabel = config
    ? isEn
      ? config.actionEn
      : config.actionId
    : isEn
    ? "Add New"
    : "Tambah Data";
  const actionPath = config?.actionPath || (resource ? `/${resource}/create` : undefined);

  return (
    <Empty className="my-2 border-border/70">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <IconComponent className="h-6 w-6 text-muted-foreground" />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{desc}</EmptyDescription>
      </EmptyHeader>
      {hasCreate && actionPath && actionLabel && (
        <EmptyContent>
          <Button size="sm" asChild className="gap-1.5 text-xs cursor-pointer shadow-none">
            <LinkBase to={actionPath}>
              <Plus className="h-3.5 w-3.5" />
              <span>{actionLabel}</span>
            </LinkBase>
          </Button>
        </EmptyContent>
      )}
    </Empty>
  );
};

const reorderChildren = (children: ReactNode, columnRanks: number[]) =>
  Children.toArray(children).reduce((acc: ReactNode[], child, index) => {
    const rank = columnRanks.indexOf(index);
    if (rank === -1) {
      acc[index] = child;
    } else {
      acc[rank] = child;
    }
    return acc;
  }, []);

function DataTableHeadCell<
  RecordType extends RaRecord<Identifier> = RaRecord<Identifier>,
>(props: DataTableColumnProps<RecordType>) {
  const {
    disableSort,
    source,
    label,
    sortByOrder,
    className,
    headerClassName,
  } = props;

  const sort = useDataTableSortContext();
  const { handleSort } = useDataTableCallbacksContext();
  const resource = useResourceContext();
  const translate = useTranslate();
  const translateLabel = useTranslateLabel();
  const { storeKey, defaultHiddenColumns } = useDataTableStoreContext();
  const [hiddenColumns] = useStore<string[]>(storeKey, defaultHiddenColumns);
  const isColumnHidden = hiddenColumns.includes(source!);
  if (isColumnHidden) return null;

  const nextSortOrder =
    sort && sort.field === source
      ? oppositeOrder[sort.order]
      : (sortByOrder ?? "ASC");
  const fieldLabel = translateLabel({
    label: typeof label === "string" ? label : undefined,
    resource,
    source,
  });
  const sortLabel = translate("ra.sort.sort_by", {
    field: fieldLabel,
    field_lower_first:
      typeof fieldLabel === "string"
        ? fieldLabel.charAt(0).toLowerCase() + fieldLabel.slice(1)
        : undefined,
    order: translate(`ra.sort.${nextSortOrder}`),
    _: translate("ra.action.sort"),
  });

  return (
    <TableHead className={cn(className, headerClassName)}>
      {handleSort && sort && !disableSort && source ? (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="sm"
                  className="-ml-3 -mr-3 h-8 data-[state=open]:bg-accent cursor-pointer group/btn"
                  data-field={source}
                  onClick={handleSort}
                />
              }
            >
              {headerClassName?.includes("text-right") ? null : (
                <FieldTitle label={label} source={source} resource={resource} />
              )}
              {sort.field === source ? (
                sort.order === "ASC" ? (
                  <ArrowUp className="ml-1.5 h-3.5 w-3.5 text-foreground" />
                ) : (
                  <ArrowDown className="ml-1.5 h-3.5 w-3.5 text-foreground" />
                )
              ) : (
                <ArrowUpDown className="ml-1.5 h-3.5 w-3.5 text-muted-foreground/60 opacity-60 group-hover/btn:opacity-100 transition-opacity" />
              )}
              {headerClassName?.includes("text-right") ? (
                <FieldTitle label={label} source={source} resource={resource} />
              ) : null}
            </TooltipTrigger>
            <TooltipContent>
              <p>{sortLabel}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        <FieldTitle label={label} source={source} resource={resource} />
      )}
    </TableHead>
  );
}

const oppositeOrder: Record<SortPayload["order"], SortPayload["order"]> = {
  ASC: "DESC",
  DESC: "ASC",
};

function DataTableCell<
  RecordType extends RaRecord<Identifier> = RaRecord<Identifier>,
>(props: DataTableColumnProps<RecordType>) {
  const {
    children,
    render,
    field,
    source,
    className,
    cellClassName,
    conditionalClassName,
  } = props;

  const { storeKey, defaultHiddenColumns } = useDataTableStoreContext();
  const [hiddenColumns] = useStore<string[]>(storeKey, defaultHiddenColumns);
  const record = useRecordContext<RecordType>();
  const isColumnHidden = hiddenColumns.includes(source!);
  if (isColumnHidden) return null;
  if (!render && !field && !children && !source) {
    throw new Error(
      "DataTableColumn: Missing at least one of the following props: render, field, children, or source",
    );
  }

  return (
    <TableCell
      className={cn(
        "py-1",
        className,
        cellClassName,
        record && conditionalClassName?.(record),
      )}
    >
      {children ??
        (render
          ? record && render(record)
          : field
            ? createElement(field, { source })
            : get(record, source!))}
    </TableCell>
  );
}
