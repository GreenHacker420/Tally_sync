"use client";

import React, { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import { CreateVoucherData } from "@/services/voucherService";
import { useVoucherTypes, useCreateVoucher, useUpdateVoucher } from "@/hooks/useVouchers";
import { Voucher } from "@/types";

interface VoucherFormProps {
  voucher?: Voucher;
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface VoucherFormData extends Omit<CreateVoucherData, 'date' | 'dueDate'> {
  date: string;
  dueDate?: string;
}

const VoucherForm: React.FC<VoucherFormProps> = ({
  voucher,
  onSuccess,
  onCancel,
}) => {
  const isEditing = !!voucher;
  const [activeTab, setActiveTab] = useState<"basic" | "items" | "payment">("basic");

  const { data: voucherTypes } = useVoucherTypes();
  const createVoucherMutation = useCreateVoucher();
  const updateVoucherMutation = useUpdateVoucher();

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<VoucherFormData>({
    defaultValues: {
      voucherType: voucher?.voucherType || "sales",
      date: voucher?.date ? new Date(voucher.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      narration: voucher?.narration || "",
      items: voucher?.items || [
        {
          description: "",
          quantity: 1,
          rate: 0,
          discount: { percentage: 0, amount: 0 },
          taxable: true,
          gst: { cgst: 0, sgst: 0, igst: 0, cess: 0 },
        },
      ],
      ledgerEntries: voucher?.ledgerEntries || [
        { ledger: "", debit: 0, credit: 0, narration: "" },
      ],
    },
  });

  const { fields: itemFields, append: appendItem, remove: removeItem } = useFieldArray({
    control,
    name: "items",
  });

  const { fields: ledgerFields, append: appendLedger, remove: removeLedger } = useFieldArray({
    control,
    name: "ledgerEntries",
  });

  const watchedVoucherType = watch("voucherType");

  const onSubmit = async (data: VoucherFormData) => {
    try {
      const voucherData: CreateVoucherData = {
        ...data,
        date: data.date,
        dueDate: data.dueDate || undefined,
      };

      if (isEditing) {
        await updateVoucherMutation.mutateAsync({
          voucherId: voucher._id,
          data: voucherData,
        });
      } else {
        await createVoucherMutation.mutateAsync(voucherData);
      }

      onSuccess?.();
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  const calculateItemTotal = (index: number) => {
    const items = watch("items");
    const item = items[index];
    if (!item) return 0;

    const subtotal = item.quantity * item.rate;
    const discountAmount = item.discount.amount || (subtotal * item.discount.percentage) / 100;
    const taxableAmount = subtotal - discountAmount;
    const gstAmount = item.taxable ? (taxableAmount * (item.gst.cgst + item.gst.sgst + item.gst.igst)) / 100 : 0;
    
    return taxableAmount + gstAmount;
  };

  const tabs = [
    { id: "basic", label: "Basic Details" },
    { id: "items", label: "Items" },
    { id: "payment", label: "Payment" },
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? "border-primary-500 text-primary-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Basic Details Tab */}
      {activeTab === "basic" && (
        <Card>
          <CardHeader>
            <CardTitle>Basic Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Voucher Type *
                </label>
                <Select
                  value={watchedVoucherType}
                  onValueChange={(value) => setValue("voucherType", value as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select voucher type" />
                  </SelectTrigger>
                  <SelectContent>
                    {voucherTypes?.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.voucherType && (
                  <p className="mt-1 text-sm text-error-600">{errors.voucherType.message}</p>
                )}
              </div>

              <Input
                label="Date *"
                type="date"
                error={errors.date?.message}
                {...register("date", { required: "Date is required" })}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Reference Number"
                placeholder="Enter reference number"
                {...register("reference.number")}
              />

              <Input
                label="Reference Date"
                type="date"
                {...register("reference.date")}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Narration
              </label>
              <textarea
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                rows={3}
                placeholder="Enter narration"
                {...register("narration")}
              />
            </div>

            {(watchedVoucherType === "sales" || watchedVoucherType === "purchase") && (
              <Input
                label="Due Date"
                type="date"
                {...register("dueDate")}
              />
            )}
          </CardContent>
        </Card>
      )}

      {/* Items Tab */}
      {activeTab === "items" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Items</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  appendItem({
                    description: "",
                    quantity: 1,
                    rate: 0,
                    discount: { percentage: 0, amount: 0 },
                    taxable: true,
                    gst: { cgst: 0, sgst: 0, igst: 0, cess: 0 },
                  })
                }
              >
                <PlusIcon className="h-4 w-4 mr-1" />
                Add Item
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {itemFields.map((field, index) => (
                <div key={field.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-medium text-gray-900">Item {index + 1}</h4>
                    {itemFields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(index)}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Input
                      label="Description *"
                      placeholder="Item description"
                      {...register(`items.${index}.description`, {
                        required: "Description is required",
                      })}
                      error={errors.items?.[index]?.description?.message}
                    />

                    <Input
                      label="Quantity *"
                      type="number"
                      step="0.01"
                      min="0"
                      {...register(`items.${index}.quantity`, {
                        required: "Quantity is required",
                        min: { value: 0.01, message: "Quantity must be greater than 0" },
                        valueAsNumber: true,
                      })}
                      error={errors.items?.[index]?.quantity?.message}
                    />

                    <Input
                      label="Rate *"
                      type="number"
                      step="0.01"
                      min="0"
                      {...register(`items.${index}.rate`, {
                        required: "Rate is required",
                        min: { value: 0, message: "Rate must be non-negative" },
                        valueAsNumber: true,
                      })}
                      error={errors.items?.[index]?.rate?.message}
                    />

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Total
                      </label>
                      <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-sm text-gray-900">
                        ₹{calculateItemTotal(index).toFixed(2)}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mt-4">
                    <Input
                      label="Discount %"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      {...register(`items.${index}.discount.percentage`, {
                        valueAsNumber: true,
                      })}
                    />

                    <Input
                      label="CGST %"
                      type="number"
                      step="0.01"
                      min="0"
                      {...register(`items.${index}.gst.cgst`, {
                        valueAsNumber: true,
                      })}
                    />

                    <Input
                      label="SGST %"
                      type="number"
                      step="0.01"
                      min="0"
                      {...register(`items.${index}.gst.sgst`, {
                        valueAsNumber: true,
                      })}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Tab */}
      {activeTab === "payment" && (
        <Card>
          <CardHeader>
            <CardTitle>Payment Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Method
                </label>
                <Select onValueChange={(value) => setValue("payment.method", value as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="bank">Bank Transfer</SelectItem>
                    <SelectItem value="upi">UPI</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Input
                label="Transaction ID"
                placeholder="Enter transaction ID"
                {...register("payment.transactionId")}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Cheque Number"
                placeholder="Enter cheque number"
                {...register("payment.chequeNumber")}
              />

              <Input
                label="Cheque Date"
                type="date"
                {...register("payment.chequeDate")}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Form Actions */}
      <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          loading={isSubmitting || createVoucherMutation.isPending || updateVoucherMutation.isPending}
          disabled={isSubmitting || createVoucherMutation.isPending || updateVoucherMutation.isPending}
        >
          {isEditing ? "Update Voucher" : "Create Voucher"}
        </Button>
      </div>
    </form>
  );
};

export default VoucherForm;
