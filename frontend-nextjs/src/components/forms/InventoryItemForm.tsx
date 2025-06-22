"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { PhotoIcon, TrashIcon } from "@heroicons/react/24/outline";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import { CreateInventoryItemData, InventoryItem } from "@/services/inventoryService";
import { useCreateInventoryItem, useUpdateInventoryItem, useUploadItemImages } from "@/hooks/useInventory";

interface InventoryItemFormProps {
  item?: InventoryItem;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const InventoryItemForm: React.FC<InventoryItemFormProps> = ({
  item,
  onSuccess,
  onCancel,
}) => {
  const isEditing = !!item;
  const [activeTab, setActiveTab] = useState<"basic" | "pricing" | "stock" | "tax">("basic");
  const [selectedImages, setSelectedImages] = useState<File[]>([]);

  const createItemMutation = useCreateInventoryItem();
  const updateItemMutation = useUpdateInventoryItem();
  const uploadImagesMutation = useUploadItemImages();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateInventoryItemData>({
    defaultValues: {
      name: item?.name || "",
      code: item?.code || "",
      barcode: item?.barcode || "",
      type: item?.type || "product",
      category: item?.category || "",
      description: item?.description || "",
      pricing: {
        costPrice: item?.pricing?.costPrice || 0,
        sellingPrice: item?.pricing?.sellingPrice || 0,
        mrp: item?.pricing?.mrp || 0,
      },
      stock: {
        quantity: item?.stock?.quantity || 0,
        unit: item?.stock?.unit || "pcs",
        reorderLevel: item?.stock?.reorderLevel || 0,
        maxLevel: item?.stock?.maxLevel || 0,
        location: item?.stock?.location || "",
      },
      taxation: {
        hsnCode: item?.taxation?.hsnCode || "",
        sacCode: item?.taxation?.sacCode || "",
        gstRate: item?.taxation?.gstRate || 18,
        taxable: item?.taxation?.taxable ?? true,
      },
    },
  });

  const watchedType = watch("type");

  const onSubmit = async (data: CreateInventoryItemData) => {
    try {
      let result;
      if (isEditing) {
        result = await updateItemMutation.mutateAsync({
          itemId: item._id,
          data,
        });
      } else {
        result = await createItemMutation.mutateAsync(data);
      }

      // Upload images if any are selected
      if (selectedImages.length > 0 && result.data) {
        await uploadImagesMutation.mutateAsync({
          itemId: result.data._id,
          files: selectedImages,
        });
      }

      onSuccess?.();
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedImages(prev => [...prev, ...files]);
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const tabs = [
    { id: "basic", label: "Basic Info" },
    { id: "pricing", label: "Pricing" },
    { id: "stock", label: "Stock" },
    { id: "tax", label: "Taxation" },
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

      {/* Basic Info Tab */}
      {activeTab === "basic" && (
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Item Name *"
                placeholder="Enter item name"
                error={errors.name?.message}
                {...register("name", { required: "Item name is required" })}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type *
                </label>
                <Select
                  value={watchedType}
                  onValueChange={(value) => setValue("type", value as "product" | "service")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="product">Product</SelectItem>
                    <SelectItem value="service">Service</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Item Code"
                placeholder="Enter item code"
                {...register("code")}
              />

              <Input
                label="Barcode"
                placeholder="Enter barcode"
                {...register("barcode")}
              />
            </div>

            <Input
              label="Category"
              placeholder="Enter category"
              {...register("category")}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                rows={3}
                placeholder="Enter item description"
                {...register("description")}
              />
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Images
              </label>
              <div className="space-y-4">
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <PhotoIcon className="w-8 h-8 mb-2 text-gray-400" />
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">PNG, JPG or JPEG (MAX. 5MB)</p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      multiple
                      accept="image/*"
                      onChange={handleImageSelect}
                    />
                  </label>
                </div>

                {/* Selected Images Preview */}
                {selectedImages.length > 0 && (
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    {selectedImages.map((file, index) => (
                      <div key={index} className="relative">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-20 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 bg-error-500 text-white rounded-full p-1 hover:bg-error-600"
                        >
                          <TrashIcon className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pricing Tab */}
      {activeTab === "pricing" && (
        <Card>
          <CardHeader>
            <CardTitle>Pricing Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Input
                label="Cost Price"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                {...register("pricing.costPrice", { valueAsNumber: true })}
              />

              <Input
                label="Selling Price"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                {...register("pricing.sellingPrice", { valueAsNumber: true })}
              />

              <Input
                label="MRP"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                {...register("pricing.mrp", { valueAsNumber: true })}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stock Tab */}
      {activeTab === "stock" && watchedType === "product" && (
        <Card>
          <CardHeader>
            <CardTitle>Stock Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Current Quantity"
                type="number"
                step="0.01"
                min="0"
                placeholder="0"
                {...register("stock.quantity", { valueAsNumber: true })}
              />

              <Input
                label="Unit"
                placeholder="e.g., pcs, kg, ltr"
                {...register("stock.unit")}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Reorder Level"
                type="number"
                step="0.01"
                min="0"
                placeholder="0"
                {...register("stock.reorderLevel", { valueAsNumber: true })}
              />

              <Input
                label="Maximum Level"
                type="number"
                step="0.01"
                min="0"
                placeholder="0"
                {...register("stock.maxLevel", { valueAsNumber: true })}
              />
            </div>

            <Input
              label="Storage Location"
              placeholder="Enter storage location"
              {...register("stock.location")}
            />
          </CardContent>
        </Card>
      )}

      {/* Taxation Tab */}
      {activeTab === "tax" && (
        <Card>
          <CardHeader>
            <CardTitle>Taxation Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="taxable"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                {...register("taxation.taxable")}
              />
              <label htmlFor="taxable" className="text-sm font-medium text-gray-700">
                Taxable Item
              </label>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {watchedType === "product" ? (
                <Input
                  label="HSN Code"
                  placeholder="Enter HSN code"
                  {...register("taxation.hsnCode")}
                />
              ) : (
                <Input
                  label="SAC Code"
                  placeholder="Enter SAC code"
                  {...register("taxation.sacCode")}
                />
              )}

              <Input
                label="GST Rate (%)"
                type="number"
                step="0.01"
                min="0"
                max="100"
                placeholder="18"
                {...register("taxation.gstRate", { valueAsNumber: true })}
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
          loading={isSubmitting || createItemMutation.isPending || updateItemMutation.isPending}
          disabled={isSubmitting || createItemMutation.isPending || updateItemMutation.isPending}
        >
          {isEditing ? "Update Item" : "Create Item"}
        </Button>
      </div>
    </form>
  );
};

export default InventoryItemForm;
