"use client";

import React from "react";
import { Modal, ModalContent } from "@/components/ui/Modal";

interface FormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  showCloseButton?: boolean;
}

const FormModal: React.FC<FormModalProps> = ({
  open,
  onOpenChange,
  title,
  description,
  children,
  size = "lg",
  showCloseButton = true,
}) => {
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      size={size}
      showCloseButton={showCloseButton}
    >
      <ModalContent className="max-h-[90vh] overflow-y-auto">
        {children}
      </ModalContent>
    </Modal>
  );
};

export default FormModal;
