"use client";

import * as React from "react";
import { useCallback, useEffect } from "react";
import { toast } from "sonner";
import {
  CloseNotificationContext,
  useNotificationContext,
  useTakeUndoableMutation,
  useTranslate,
} from "ra-core";

/**
 * Bridges react-admin notifications triggered with useNotify to the global Sonner toast at the top of the screen.
 * Does not mount a duplicate bottom Toaster instance.
 */
export const Notification = () => {
  const translate = useTranslate();
  const { notifications, takeNotification } = useNotificationContext();
  const takeMutation = useTakeUndoableMutation();

  useEffect(() => {
    if (notifications.length) {
      const notification = takeNotification();
      if (notification) {
        const { message, type = "info", notificationOptions } = notification;
        const { messageArgs, undoable, autoHideDuration } =
          notificationOptions || {};

        const beforeunload = (e: BeforeUnloadEvent) => {
          e.preventDefault();
          const confirmationMessage = "";
          e.returnValue = confirmationMessage;
          return confirmationMessage;
        };

        if (undoable) {
          window.addEventListener("beforeunload", beforeunload);
        }

        const mutation = takeMutation();

        const handleExited = () => {
          if (undoable) {
            if (mutation) {
              mutation({ isUndo: false });
            }
            window.removeEventListener("beforeunload", beforeunload);
          }
        };

        const handleUndo = () => {
          if (mutation) {
            mutation({ isUndo: true });
          }
          window.removeEventListener("beforeunload", beforeunload);
        };

        const finalMessage = message
          ? typeof message === "string"
            ? translate(message, messageArgs)
            : React.isValidElement(message)
              ? message
              : undefined
          : undefined;

        const duration =
          autoHideDuration === null ? Infinity : autoHideDuration;

        const toastFn =
          (toast as any)[type] && typeof (toast as any)[type] === "function"
            ? (toast as any)[type]
            : toast.info;

        toastFn(finalMessage, {
          duration: duration || 4000,
          action: undoable
            ? {
                label: translate("ra.action.undo"),
                onClick: handleUndo,
              }
            : undefined,
          onDismiss: handleExited,
          onAutoClose: handleExited,
        });
      }
    }
  }, [notifications, takeMutation, takeNotification, translate]);

  const handleRequestClose = useCallback(() => {
    // Dismiss all toasts
    toast.dismiss();
  }, []);

  return (
    <CloseNotificationContext.Provider value={handleRequestClose}>
      {null}
    </CloseNotificationContext.Provider>
  );
};
