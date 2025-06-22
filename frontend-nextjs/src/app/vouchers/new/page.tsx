"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Breadcrumb from "@/components/ui/Breadcrumb";
import { VoucherForm } from "@/components/forms";
import { useCompany } from "@/contexts/CompanyContext";

export default function NewVoucherPage() {
  const router = useRouter();
  const { currentCompany } = useCompany();

  const handleSuccess = () => {
    router.push("/vouchers");
  };

  const handleCancel = () => {
    router.push("/vouchers");
  };

  if (!currentCompany) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900">No Company Selected</h2>
        <p className="mt-2 text-gray-600">Please select a company to create vouchers.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { title: "Vouchers", href: "/vouchers" },
          { title: "Create New" },
        ]}
      />

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Create New Voucher</h1>
        <p className="mt-1 text-sm text-gray-600">
          Create a new voucher for {currentCompany.displayName || currentCompany.name}
        </p>
      </div>

      {/* Form */}
      <VoucherForm
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </div>
  );
}
