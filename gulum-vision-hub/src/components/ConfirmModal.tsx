import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Trash2 } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning";
  isLoading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Are you sure?",
  description = "This action cannot be undone. Please confirm to proceed.",
  confirmText = "Delete",
  cancelText = "Cancel",
  variant = "danger",
  isLoading = false,
}) => {
  const handleConfirm = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await onConfirm();
    } catch (err) {
      console.error("Error in confirmation action:", err);
    } finally {
      onClose();
    }
  };

  const Icon = variant === "danger" ? Trash2 : AlertTriangle;
  const iconBgColor =
    variant === "danger"
      ? "bg-destructive/15 text-destructive"
      : "bg-amber-500/15 text-amber-500";
  const confirmButtonVariant = variant === "danger" ? "destructive" : "default";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-white dark:bg-zinc-900 sm:max-w-[400px] rounded-2xl border border-white/20 dark:border-white/10 shadow-2xl p-6">
        <div className="flex flex-col items-center text-center space-y-4 py-2">
          <div className={`p-3.5 rounded-full ${iconBgColor} shrink-0`}>
            <Icon className="h-6 w-6" />
          </div>
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-lg font-bold text-foreground text-center">
              {title}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground text-center">
              {description}
            </DialogDescription>
          </DialogHeader>
        </div>
        <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-4 sm:justify-center w-full">
          <Button
            type="button"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            disabled={isLoading}
            className="rounded-xl flex-1 w-full sm:w-auto"
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            variant={confirmButtonVariant}
            onClick={handleConfirm}
            disabled={isLoading}
            className="rounded-xl flex-1 w-full sm:w-auto"
          >
            {isLoading ? "Processing..." : confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
