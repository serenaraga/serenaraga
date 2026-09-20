"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: (
          <CircleCheckIcon className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
        ),
        info: (
          <InfoIcon className="size-4 text-[#8b5e3c] dark:text-[#d49b6a] shrink-0" />
        ),
        warning: (
          <TriangleAlertIcon className="size-4 text-amber-600 dark:text-amber-400 shrink-0" />
        ),
        error: (
          <OctagonXIcon className="size-4 text-red-600 dark:text-red-400 shrink-0" />
        ),
        loading: (
          <Loader2Icon className="size-4 animate-spin text-[#8b5e3c] dark:text-[#d49b6a] shrink-0" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--toast-bg, #faf5f0)",
          "--normal-text": "var(--toast-text, #382313)",
          "--normal-border": "transparent",
          "--border-radius": "12px",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-[#faf5f0] dark:group-[.toaster]:bg-[#1f1712] group-[.toaster]:text-[#382313] dark:group-[.toaster]:text-[#f9efe5] group-[.toaster]:border-0! group-[.toaster]:shadow-none! group-[.toaster]:rounded-xl group-[.toaster]:px-4 group-[.toaster]:py-3 group-[.toaster]:text-xs group-[.toaster]:font-medium",
          description:
            "group-[.toast]:text-[#704e33] dark:group-[.toast]:text-[#cbb39e] group-[.toast]:text-xs",
          actionButton:
            "group-[.toast]:bg-[#8b5e3c] group-[.toast]:hover:bg-[#785033] group-[.toast]:text-white dark:group-[.toast]:bg-[#d49b6a] dark:group-[.toast]:hover:bg-[#c28a5a] dark:group-[.toast]:text-zinc-950 group-[.toast]:font-semibold group-[.toast]:rounded-lg group-[.toast]:text-xs group-[.toast]:px-2.5 group-[.toast]:py-1 group-[.toast]:shadow-none! group-[.toast]:border-0!",
          cancelButton:
            "group-[.toast]:bg-[#efe3d6] dark:group-[.toast]:bg-[#2c2018] group-[.toast]:text-[#54361e] dark:group-[.toast]:text-[#d4b396] group-[.toast]:rounded-lg group-[.toast]:text-xs group-[.toast]:shadow-none! group-[.toast]:border-0!",
          closeButton:
            "group-[.toast]:bg-[#faf5f0] dark:group-[.toast]:bg-[#1f1712] group-[.toast]:border-0! group-[.toast]:text-[#704e33] dark:group-[.toast]:text-[#cbb39e] hover:group-[.toast]:text-[#382313] dark:hover:group-[.toast]:text-[#f9efe5]",
          info: "group-[.toaster]:border-0!",
          success: "group-[.toaster]:border-0!",
          warning: "group-[.toaster]:border-0!",
          error: "group-[.toaster]:border-0!",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
