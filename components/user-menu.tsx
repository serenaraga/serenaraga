"use client";

import { Children, useCallback, useState } from "react";
import {
  Translate,
  useAuthProvider,
  useGetIdentity,
  useLogout,
  useLocaleState,
  useNavigate,
  UserMenuContext,
} from "ra-core";
import { ChevronsUpDown, LogOut, ShieldCheck, SlidersHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

export type UserMenuProps = {
  children?: React.ReactNode;
};

/**
 * A user menu component displayed at the bottom of the sidebar.
 *
 * Provides access to user-related actions such as profile details and logout.
 * Displays the user's avatar, name, and email from the identity provider.
 */
export function UserMenu({ children }: UserMenuProps) {
  const { isMobile } = useSidebar();
  const [open, setOpen] = useState(false);
  const handleOpenChange = useCallback((open: boolean) => setOpen(open), []);
  const handleClose = useCallback(() => setOpen(false), []);
  const authProvider = useAuthProvider();
  const { identity } = useGetIdentity();
  const logout = useLogout();
  const navigate = useNavigate();
  const [locale] = useLocaleState();
  const isEn = locale === "en";

  if (!authProvider) return null;

  const fullName = identity?.fullName || (isEn ? "Administrator" : "Admin Utama");
  const email = identity?.email || "admin@serenaraga.com";
  const avatar = identity?.avatar || "";
  const role = identity?.role || "admin";
  const isAdmin = role === "admin";
  const initials = fullName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  return (
    <UserMenuContext.Provider value={{ onClose: handleClose }}>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu open={open} onOpenChange={handleOpenChange}>
            <DropdownMenuTrigger
              render={
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src={avatar} alt={fullName} />
                    <AvatarFallback className="rounded-lg bg-primary/10 text-primary font-bold text-xs">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-xs leading-tight">
                    <span className="truncate font-semibold text-foreground">
                      {fullName}
                    </span>
                    <span className="truncate text-[11px] text-muted-foreground flex items-center gap-1">
                      <span>{email}</span>
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4" />
                </SidebarMenuButton>
              }
            />
            <DropdownMenuContent
              className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg p-1.5"
              side={isMobile ? "bottom" : "right"}
              align="end"
              sideOffset={4}
            >
              <DropdownMenuGroup>
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2.5 px-1 py-1.5 text-left text-xs">
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarImage src={avatar} alt={fullName} />
                      <AvatarFallback className="rounded-lg bg-primary/10 text-primary font-bold text-xs">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-xs leading-tight">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate font-semibold text-foreground">
                          {fullName}
                        </span>
                        {isAdmin ? (
                          <ShieldCheck className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        ) : (
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        )}
                      </div>
                      <span className="truncate text-[11px] text-muted-foreground">
                        {email}
                      </span>
                    </div>
                  </div>
                </DropdownMenuLabel>
              </DropdownMenuGroup>

              {isAdmin && (
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    onClick={() => {
                      navigate("/settings");
                      handleClose();
                    }}
                    className="cursor-pointer rounded-lg px-2 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
                  >
                    <SlidersHorizontal className="w-4 h-4 mr-2 text-primary" />
                    <span>{isEn ? "Settings" : "Pengaturan"}</span>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              )}

              <DropdownMenuSeparator className="my-1" />

              {children}
              {Children.count(children) > 0 && <DropdownMenuSeparator className="my-1" />}

              <DropdownMenuItem
                onClick={() => logout()}
                className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10 rounded-lg px-2 py-1.5 text-xs font-medium"
              >
                <LogOut className="w-4 h-4 mr-2" />
                <Translate i18nKey="ra.auth.logout">Log out</Translate>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
    </UserMenuContext.Provider>
  );
}
