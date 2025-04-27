'use client';

import { toast } from "sonner";

type ToastType = "success" | "error" | "info" | "warning";

interface ToastOptions {
  id?: string | number;
  duration?: number;
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "top-center" | "bottom-center";
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  cancel?: {
    label: string;
    onClick: () => void;
  };
  onDismiss?: () => void;
  onAutoClose?: () => void;
}

export const showToast = (
  type: ToastType,
  title: string,
  message?: string,
  options?: ToastOptions
) => {
  switch (type) {
    case "success":
      return toast.success(message ? message : title, {
        id: options?.id,
        duration: options?.duration || 3000,
        position: options?.position || "top-center",
        icon: options?.icon,
        action: options?.action,
        cancel: options?.cancel,
        onDismiss: options?.onDismiss,
        onAutoClose: options?.onAutoClose,
        description: message ? title : undefined,
      });
    case "error":
      return toast.error(message ? message : title, {
        id: options?.id,
        duration: options?.duration || 5000,
        position: options?.position || "top-center",
        icon: options?.icon,
        action: options?.action,
        cancel: options?.cancel,
        onDismiss: options?.onDismiss,
        onAutoClose: options?.onAutoClose,
        description: message ? title : undefined,
      });
    case "info":
      return toast.info(message ? message : title, {
        id: options?.id,
        duration: options?.duration || 4000,
        position: options?.position || "top-center",
        icon: options?.icon,
        action: options?.action,
        cancel: options?.cancel,
        onDismiss: options?.onDismiss,
        onAutoClose: options?.onAutoClose,
        description: message ? title : undefined,
      });
    case "warning":
      return toast.warning(message ? message : title, {
        id: options?.id,
        duration: options?.duration || 4000,
        position: options?.position || "top-center",
        icon: options?.icon,
        action: options?.action,
        cancel: options?.cancel,
        onDismiss: options?.onDismiss,
        onAutoClose: options?.onAutoClose,
        description: message ? title : undefined,
      });
    default:
      return toast(message ? message : title, {
        id: options?.id,
        duration: options?.duration || 3000,
        position: options?.position || "top-center",
        icon: options?.icon,
        action: options?.action,
        cancel: options?.cancel,
        onDismiss: options?.onDismiss,
        onAutoClose: options?.onAutoClose,
        description: message ? title : undefined,
      });
  }
};
