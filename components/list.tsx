"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbPage,
  useResourceParent,
} from "@/components/breadcrumb";
import type { ListBaseProps, ListControllerResult, RaRecord } from "ra-core";
import {
  FilterContext,
  LinkBase,
  ListBase,
  Translate,
  useGetResourceLabel,
  useHasDashboard,
  useResourceContext,
  useResourceDefinition,
  useTranslate,
} from "ra-core";
import type { ReactElement, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { CreateButton } from "@/components/create-button";
import { ExportButton } from "@/components/export-button";
import { ListPagination } from "@/components/list-pagination";
import { FilterButton, FilterForm } from "@/components/filter-form";

/**
 * A complete list page with breadcrumb, title, filters, and pagination.
 *
 * It fetches a list of records from the data provider (via ra-core hooks),
 * puts them in a ListContext, renders a default layout (breadcrumb, title,
 * action buttons, inline filters, pagination), then renders its children
 * (usually a <DataTable>).
 *
 * @see {@link https://marmelab.com/shadcn-admin-kit/docs/list/ List documentation}
 *
 * @example
 * import { DataTable, List } from "@/components/admin";
 *
 * export const UserList = () => (
 *   <List>
 *     <DataTable>
 *       <DataTable.Col source="id" />
 *       <DataTable.Col source="name" />
 *       <DataTable.Col source="username" />
 *       <DataTable.Col source="email" />
 *       <DataTable.Col source="address.street" />
 *       <DataTable.Col source="phone" />
 *       <DataTable.Col source="website" />
 *       <DataTable.Col source="company.name" />
 *     </DataTable>
 *   </List>
 * );
 */
export const List = <RecordType extends RaRecord = RaRecord>(
  props: ListProps<RecordType>,
) => {
  const {
    debounce,
    disableAuthentication,
    disableSyncWithLocation = true,
    exporter,
    filter,
    filterDefaultValues,
    loading,
    perPage,
    queryOptions,
    resource,
    sort = defaultSort,
    storeKey,
    ...rest
  } = props;

  return (
    <ListBase<RecordType>
      debounce={debounce}
      disableAuthentication={disableAuthentication}
      disableSyncWithLocation={disableSyncWithLocation}
      exporter={exporter}
      filter={filter}
      filterDefaultValues={filterDefaultValues}
      loading={loading}
      perPage={perPage}
      queryOptions={queryOptions}
      resource={resource}
      sort={sort}
      storeKey={storeKey}
    >
      <ListView<RecordType> {...rest} />
    </ListBase>
  );
};

const defaultSort = { field: "id", order: "DESC" as const };

export interface ListProps<RecordType extends RaRecord = RaRecord>
  extends ListBaseProps<RecordType>, ListViewProps<RecordType> {}

/**
 * The view component for List pages with layout and UI.
 *
 * @internal
 */
export const ListView = <RecordType extends RaRecord = RaRecord>(
  props: ListViewProps<RecordType>,
) => {
  const {
    disableBreadcrumb,
    filters,
    pagination = defaultPagination,
    title,
    children,
    actions,
  } = props;
  const translate = useTranslate();
  const resource = useResourceContext();
  if (!resource) {
    throw new Error(
      "The ListView component must be used within a ResourceContextProvider",
    );
  }
  const getResourceLabel = useGetResourceLabel();
  const resourceLabel = getResourceLabel(resource, 2);
  const finalTitle =
    title !== undefined
      ? title
      : translate("ra.page.list", {
          name: resourceLabel,
        });
  const { hasCreate } = useResourceDefinition({ resource });
  const hasDashboard = useHasDashboard();
  const parent = useResourceParent(resource);

  return (
    <>
      {!disableBreadcrumb && (
        <Breadcrumb>
          {hasDashboard && (
            <BreadcrumbItem>
              <LinkBase to="/">
                <Translate i18nKey="ra.page.dashboard">Home</Translate>
              </LinkBase>
            </BreadcrumbItem>
          )}
          {parent && (
            <BreadcrumbItem>
              <LinkBase to={parent.path}>{parent.label}</LinkBase>
            </BreadcrumbItem>
          )}
          <BreadcrumbItem>
            <BreadcrumbPage>{resourceLabel}</BreadcrumbPage>
          </BreadcrumbItem>
        </Breadcrumb>
      )}

      <FilterContext.Provider value={filters}>
        <div className="flex justify-between items-start flex-wrap gap-2 my-2">
          <h2 className="text-2xl font-bold tracking-tight mb-2">
            {finalTitle}
          </h2>
          {actions ?? (
            <div className="flex items-center gap-2 flex-wrap">
              {filters && filters.length > 0 ? <FilterButton /> : null}
              {hasCreate ? <CreateButton /> : null}
              {<ExportButton />}
            </div>
          )}
        </div>
        <FilterForm />

        <div className={cn("my-2", props.className)}>{children}</div>
        {pagination}
      </FilterContext.Provider>
    </>
  );
};

const defaultPagination = <ListPagination />;

import { DataTableEmpty } from "@/components/data-table";

export const Empty = DataTableEmpty;

export interface ListViewProps<RecordType extends RaRecord = RaRecord> {
  children?: ReactNode;
  disableBreadcrumb?: boolean;
  render?: (props: ListControllerResult<RecordType, Error>) => ReactNode;
  actions?: ReactElement | false;
  filters?: ReactNode[];
  pagination?: ReactNode;
  title?: ReactNode | string | false;
  className?: string;
}
