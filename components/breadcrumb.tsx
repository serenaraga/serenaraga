"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb as BaseBreadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbPage,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { buttonVariants } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { LinkBase, Translate, useGetResourceLabel } from "ra-core";
import { cn } from "@/lib/utils";

/**
 * Declarative Parent-Child Resource Hierarchy Map
 */
export const RESOURCE_PARENT_MAP: Record<
  string,
  { parentResource: string; parentPath?: string }
> = {
  consumables: { parentResource: "services", parentPath: "/services" },
  payouts: { parentResource: "therapists", parentPath: "/therapists" },
};

/**
 * Hook to retrieve hierarchical parent resource configuration and labels
 */
export const useResourceParent = (resource?: string) => {
  const getResourceLabel = useGetResourceLabel();
  if (!resource) return null;

  const parentConfig = RESOURCE_PARENT_MAP[resource];
  if (!parentConfig) return null;

  return {
    label: getResourceLabel(parentConfig.parentResource, 2),
    path: parentConfig.parentPath || `/${parentConfig.parentResource}`,
  };
};

/**
 * Standard Hierarchical Parent Breadcrumb Items
 */
export const ResourceParentBreadcrumbItems = ({
  resource,
}: {
  resource?: string;
}) => {
  const parent = useResourceParent(resource);
  if (!parent) return null;

  return (
    <BreadcrumbItem>
      <LinkBase to={parent.path}>{parent.label}</LinkBase>
    </BreadcrumbItem>
  );
};

/**
 * A breadcrumb navigation component with mobile drawer support.
 *
 * Renders breadcrumb navigation in the app header via portal. On mobile, shows a drawer with
 * ellipsis for long breadcrumb trails. Use Breadcrumb.Item and Breadcrumb.PageItem as children.
 *
 * CRUD pages already include a Breadcrumb by default; set `disableBreadcrumb` to hide the
 * breadcrumb and/or provide your own.
 *
 * @see {@link https://marmelab.com/shadcn-admin-kit/docs/breadcrumb/ Breadcrumb documentation}
 * @see {@link https://ui.shadcn.com/docs/components/breadcrumb Breadcrumb UI documentation}
 *
 * @example
 * import { Edit, Breadcrumb, SimpleForm } from "@/components/admin";
 * import { LinkBase, RecordRepresentation } from 'ra-core';
 *
 * const PostEdit = () => (
 *   <Edit disableBreadcrumb>
 *     <Breadcrumb>
 *       <Breadcrumb.Item><LinkBase to="/">Home</LinkBase></Breadcrumb.Item>
 *       <Breadcrumb.Item><LinkBase to="/posts">Articles</LinkBase></Breadcrumb.Item>
 *       <Breadcrumb.PageItem>
 *         Edit Article "<RecordRepresentation />"
 *       </Breadcrumb.PageItem>
 *     </Breadcrumb>
 *     <SimpleForm>
 *       ...
 *     </SimpleForm>
 *   </Edit>
 * );
 */
/**
 * Recursively flattens children and unboxes React.Fragments
 */
const flattenChildren = (children: React.ReactNode): React.ReactNode[] => {
  const result: React.ReactNode[] = [];
  React.Children.forEach(children, (child) => {
    if (child === null || child === undefined || child === false || child === "") return;
    if (React.isValidElement(child) && child.type === React.Fragment) {
      result.push(...flattenChildren((child.props as any).children));
    } else {
      result.push(child);
    }
  });
  return result;
};

export const Breadcrumb = ({ children, ref }: BreadcrumbProps) => {
  const [portalElement, setPortalElement] = React.useState<HTMLElement | null>(null);
  const isMobile = useIsMobile();
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    setPortalElement(document.getElementById("breadcrumb"));
  }, []);

  if (!portalElement) return null;

  const items = flattenChildren(children);

  return createPortal(
    <>
      <Separator
        orientation="vertical"
        className="data-[orientation=vertical]:h-4 mr-4"
      />
      <BaseBreadcrumb ref={ref}>
        <BreadcrumbList>
          {isMobile && items.length > 2 ? (
            <React.Fragment>
              <BreadcrumbItem>
                <Drawer open={open} onOpenChange={setOpen}>
                  <DrawerTrigger aria-label="Toggle Menu">
                    <BreadcrumbEllipsis className="h-4 w-4" />
                  </DrawerTrigger>
                  <DrawerContent>
                    <DrawerHeader className="text-left">
                      <DrawerTitle>
                        <Translate i18nKey="ra.navigation.breadcrumb_drawer_title">
                          Navigate to
                        </Translate>
                      </DrawerTitle>
                      <DrawerDescription>
                        <Translate i18nKey="ra.navigation.breadcrumb_drawer_instructions">
                          Select a page to navigate to.
                        </Translate>
                      </DrawerDescription>
                    </DrawerHeader>
                    <ol className="grid gap-1 px-4">
                      {items.slice(0, -1).map((item, idx) => (
                        <React.Fragment key={idx}>{item}</React.Fragment>
                      ))}
                    </ol>
                    <DrawerFooter className="pt-4">
                      <DrawerClose
                        className={cn(buttonVariants({ variant: "outline" }))}
                      >
                        <Translate i18nKey="ra.action.close">Close</Translate>
                      </DrawerClose>
                    </DrawerFooter>
                  </DrawerContent>
                </Drawer>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              {items.slice(-1)}
            </React.Fragment>
          ) : (
            items.map((child, index) => (
              <React.Fragment key={index}>
                {child}
                {index < items.length - 1 ? <BreadcrumbSeparator /> : null}
              </React.Fragment>
            ))
          )}
        </BreadcrumbList>
      </BaseBreadcrumb>
    </>,
    portalElement,
  );
};
Breadcrumb.Item = BreadcrumbItem;
Breadcrumb.PageItem = BreadcrumbPage;

export { BreadcrumbItem, BreadcrumbPage };

export type BreadcrumbProps = React.ComponentProps<"nav">;
