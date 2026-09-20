"use client";

import { AlertCircle, CheckCircle } from "lucide-react";
import { useTranslate } from "ra-core";
import * as React from "react";
import type { ComponentType, MouseEventHandler } from "react";
import { useCallback } from "react";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Confirm = (props: ConfirmProps) => {
  const {
    className,
    isOpen = false,
    loading,
    title,
    content,
    cancel = "ra.action.cancel",
    confirm = "ra.action.confirm",
    confirmColor = "warning",
    ConfirmIcon = CheckCircle,
    CancelIcon = AlertCircle,
    onClose,
    onConfirm,
    translateOptions = {},
    titleTranslateOptions = translateOptions,
    contentTranslateOptions = translateOptions,
    ...rest
  } = props;

  const translate = useTranslate();

  const handleConfirm = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      onConfirm(e);
    },
    [onConfirm],
  );

  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
  }, []);

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className={className} onClick={handleClick} {...rest}>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {typeof title === "string"
              ? translate(title, { _: title, ...titleTranslateOptions })
              : title}
          </AlertDialogTitle>
          {typeof content === "string" ? (
            <AlertDialogDescription>
              {translate(content, {
                _: content,
                ...contentTranslateOptions,
              })}
            </AlertDialogDescription>
          ) : (
            content
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button
            variant="outline"
            disabled={loading}
            onClick={onClose}
            className="gap-1.5 h-8 text-xs font-medium"
          >
            <CancelIcon className="h-3.5 w-3.5" />
            {translate(cancel, { _: cancel })}
          </Button>
          <Button
            disabled={loading}
            onClick={handleConfirm}
            className="gap-1.5 h-8 text-xs font-medium"
            variant={confirmColor === "warning" ? "destructive" : "default"}
          >
            <ConfirmIcon className="h-3.5 w-3.5" />
            {translate(confirm, { _: confirm })}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export interface ConfirmProps {
  cancel?: string;
  className?: string;
  confirm?: string;
  confirmColor?: "primary" | "warning";
  ConfirmIcon?: ComponentType;
  CancelIcon?: ComponentType;
  content?: React.ReactNode;
  isOpen?: boolean;
  loading?: boolean;
  onClose: () => void;
  onConfirm: MouseEventHandler;
  title: React.ReactNode;
  /**
   * @deprecated use `titleTranslateOptions` and `contentTranslateOptions` instead
   */
  translateOptions?: object;
  titleTranslateOptions?: object;
  contentTranslateOptions?: object;
}
