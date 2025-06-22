"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Breadcrumb from "@/components/ui/Breadcrumb";
import { InventoryItemForm } from "@/components/forms";
import { useCompany } from "@/contexts/CompanyContext";

export default function NewInventoryItemPage() {
  const router = useRouter();
  const { currentCompany } = useCompany();

  const handleSuccess = () => {
    router.push("/inventory");
  };

  const handleCancel = () => {
    router.push("/inventory");
  };

  if (!currentCompany) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900">No Company Selected</h2>
        <p className="mt-2 text-gray-600">Please select a company to manage inventory.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { title: "Inventory", href: "/inventory" },
          { title: "Add New Item" },
        ]}
      />

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Add New Item</h1>
        <p className="mt-1 text-sm text-gray-600">
          Add a new inventory item to {currentCompany.displayName || currentCompany.name}
        </p>
      </div>

      {/* Form */}
      <InventoryItemForm
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </div>
  );
}
