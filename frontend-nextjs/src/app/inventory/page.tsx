"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  PlusIcon,
  FunnelIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  PhotoIcon,
  QrCodeIcon,
  ArrowPathIcon
} from "@heroicons/react/24/outline";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import Breadcrumb from "@/components/ui/Breadcrumb";
import { ConfirmationModal, FormModal } from "@/components/modals";
import { InventoryItemForm } from "@/components/forms";
import {
  useInventoryItems,
  useDeleteInventoryItem,
  useGenerateBarcode,
  useSyncInventoryWithTally,
  useInventoryCategories
} from "@/hooks/useInventory";
import { useCompany } from "@/contexts/CompanyContext";
import { InventoryItem, TableColumn } from "@/types";
import { formatCurrency, formatNumber } from "@/lib/utils";

export default function InventoryPage() {
  const { currentCompany } = useCompany();
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [filters, setFilters] = useState({
    type: "",
    category: "",
    lowStock: false,
    search: "",
    isActive: true,
  });

  // Modal states
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Fetch data
  const { data: itemsData, isLoading } = useInventoryItems(page, limit, filters);
  const { data: categories } = useInventoryCategories();

  // Mutations
  const deleteItemMutation = useDeleteInventoryItem();
  const generateBarcodeMutation = useGenerateBarcode();
  const syncTallyMutation = useSyncInventoryWithTally();

  const handleFilterChange = (key: string, value: string | boolean) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1); // Reset to first page when filtering
  };

  const handleEdit = (item: InventoryItem) => {
    setSelectedItem(item);
    setShowEditModal(true);
  };

  const handleDelete = (item: InventoryItem) => {
    setSelectedItem(item);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (selectedItem) {
      await deleteItemMutation.mutateAsync(selectedItem._id);
      setSelectedItem(null);
    }
  };

  const handleGenerateBarcode = async (item: InventoryItem) => {
    await generateBarcodeMutation.mutateAsync(item._id);
  };

  const handleSyncTally = async () => {
    await syncTallyMutation.mutateAsync();
  };

  if (!currentCompany) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900">No Company Selected</h2>
        <p className="mt-2 text-gray-600">Please select a company to view inventory.</p>
      </div>
    );
  }

  const getStockStatusBadge = (item: InventoryItem) => {
    if (item.type === "service") {
      return <Badge variant="secondary">Service</Badge>;
    }

    const { quantity, reorderLevel } = item.stock;

    if (quantity <= 0) {
      return <Badge variant="error">Out of Stock</Badge>;
    } else if (reorderLevel && quantity <= reorderLevel) {
      return <Badge variant="warning">Low Stock</Badge>;
    } else {
      return <Badge variant="success">In Stock</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    return (
      <Badge variant={type === "product" ? "primary" : "secondary"}>
        {type.toUpperCase()}
      </Badge>
    );
  };

  const columns: TableColumn<InventoryItem>[] = [
    {
      key: "name",
      title: "Item Name",
      sorter: true,
      render: (_, item) => (
        <div className="flex items-center space-x-3">
          {item.images && item.images.length > 0 ? (
            <img
              src={item.images[0]}
              alt={item.name}
              className="h-10 w-10 rounded-lg object-cover"
            />
          ) : (
            <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
              <PhotoIcon className="h-5 w-5 text-gray-400" />
            </div>
          )}
          <div>
            <div className="font-medium text-gray-900">{item.name}</div>
            {item.code && (
              <div className="text-sm text-gray-500">Code: {item.code}</div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "type",
      title: "Type",
      render: (_, item) => getTypeBadge(item.type),
    },
    {
      key: "category",
      title: "Category",
      render: (_, item) => (
        <div className="text-gray-900">{item.category || "-"}</div>
      ),
    },
    {
      key: "pricing",
      title: "Selling Price",
      align: "right",
      render: (_, item) => (
        <div className="font-medium text-gray-900">
          {item.pricing?.sellingPrice ? formatCurrency(item.pricing.sellingPrice) : "-"}
        </div>
      ),
    },
    {
      key: "stock",
      title: "Stock",
      align: "right",
      render: (_, item) => (
        <div>
          {item.type === "product" ? (
            <div className="text-gray-900">
              {formatNumber(item.stock.quantity)} {item.stock.unit}
            </div>
          ) : (
            <div className="text-gray-500">N/A</div>
          )}
        </div>
      ),
    },
    {
      key: "status",
      title: "Status",
      render: (_, item) => getStockStatusBadge(item),
    },
    {
      key: "gstRate",
      title: "GST Rate",
      align: "center",
      render: (_, item) => (
        <div className="text-gray-900">
          {item.taxation?.gstRate ? `${item.taxation.gstRate}%` : "-"}
        </div>
      ),
    },
    {
      key: "actions",
      title: "Actions",
      render: (_, item) => (
        <div className="flex items-center space-x-2">
          <Link href={`/inventory/${item._id}`}>
            <Button variant="ghost" size="sm">
              <EyeIcon className="h-4 w-4" />
            </Button>
          </Link>
          <Button variant="ghost" size="sm" onClick={() => handleEdit(item)}>
            <PencilIcon className="h-4 w-4" />
          </Button>
          {item.type === "product" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleGenerateBarcode(item)}
              loading={generateBarcodeMutation.isPending}
            >
              <QrCodeIcon className="h-4 w-4" />
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => handleDelete(item)}>
            <TrashIcon className="h-4 w-4 text-error-500" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { title: "Inventory" },
        ]}
      />

      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your products and services
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={handleSyncTally}
            loading={syncTallyMutation.isPending}
          >
            <ArrowPathIcon className="h-4 w-4 mr-2" />
            Sync with Tally
          </Button>
          <Link href="/inventory/new">
            <Button>
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FunnelIcon className="h-5 w-5 mr-2" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <Input
              placeholder="Search items..."
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
            />

            <Select
              value={filters.type}
              onValueChange={(value) => handleFilterChange("type", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Types</SelectItem>
                <SelectItem value="product">Product</SelectItem>
                <SelectItem value="service">Service</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.category}
              onValueChange={(value) => handleFilterChange("category", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Categories</SelectItem>
                {categories?.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="lowStock"
                checked={filters.lowStock}
                onChange={(e) => handleFilterChange("lowStock", e.target.checked)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="lowStock" className="text-sm font-medium text-gray-700">
                Low Stock Only
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                checked={filters.isActive}
                onChange={(e) => handleFilterChange("isActive", e.target.checked)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                Active Only
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardContent className="p-0">
          <DataTable
            data={itemsData?.data || []}
            columns={columns}
            loading={isLoading}
            pagination={
              itemsData?.pagination
                ? {
                    current: page,
                    pageSize: limit,
                    total: itemsData.pagination.total,
                    onChange: (newPage) => setPage(newPage),
                  }
                : undefined
            }
            searchable={false} // We have custom search
            emptyMessage="No inventory items found"
          />
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <FormModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        title="Edit Item"
        size="xl"
      >
        {selectedItem && (
          <InventoryItemForm
            item={selectedItem}
            onSuccess={() => {
              setShowEditModal(false);
              setSelectedItem(null);
            }}
            onCancel={() => {
              setShowEditModal(false);
              setSelectedItem(null);
            }}
          />
        )}
      </FormModal>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        open={showDeleteModal}
        onOpenChange={setShowDeleteModal}
        title="Delete Item"
        description={`Are you sure you want to delete "${selectedItem?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        onConfirm={confirmDelete}
        loading={deleteItemMutation.isPending}
      />
    </div>
  );
}
