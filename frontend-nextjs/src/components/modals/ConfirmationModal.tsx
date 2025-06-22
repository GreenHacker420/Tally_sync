"use client";

import React from "react";
import { ExclamationTriangleIcon, InformationCircleIcon, CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription, ModalFooter } from "@/components/ui/Modal";
import Button from "@/components/common/Button";

interface ConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info" | "success";
  onConfirm: () => void | Promise<void>;
  loading?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "warning",
  onConfirm,
  loading = false,
}) => {
  const getIcon = () => {
    switch (variant) {
      case "danger":
        return <XCircleIcon className="h-6 w-6 text-error-600" />;
      case "warning":
        return <ExclamationTriangleIcon className="h-6 w-6 text-warning-600" />;
      case "info":
        return <InformationCircleIcon className="h-6 w-6 text-primary-600" />;
      case "success":
        return <CheckCircleIcon className="h-6 w-6 text-success-600" />;
      default:
        return <ExclamationTriangleIcon className="h-6 w-6 text-warning-600" />;
    }
  };

  const getConfirmButtonVariant = () => {
    switch (variant) {
      case "danger":
        return "danger" as const;
      case "warning":
        return "primary" as const;
      case "info":
        return "primary" as const;
      case "success":
        return "primary" as const;
      default:
        return "primary" as const;
    }
  };

  const handleConfirm = async () => {
    try {
      await onConfirm();
      onOpenChange(false);
    } catch (error) {
      // Error handling is done in the parent component
      console.error("Confirmation action failed:", error);
    }
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange} size="sm">
      <ModalContent>
        <ModalHeader>
          <div className="flex items-center space-x-3">
            {getIcon()}
            <div>
              <ModalTitle>{title}</ModalTitle>
              <ModalDescription>{description}</ModalDescription>
            </div>
          </div>
        </ModalHeader>

        <ModalFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            {cancelText}
          </Button>
          <Button
            variant={getConfirmButtonVariant()}
            onClick={handleConfirm}
            loading={loading}
            disabled={loading}
          >
            {confirmText}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ConfirmationModal;
