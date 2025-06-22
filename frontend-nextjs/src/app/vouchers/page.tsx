"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  PlusIcon,
  FunnelIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  DocumentArrowDownIcon,
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
import { VoucherForm } from "@/components/forms";
import { useVouchers, useDeleteVoucher, useGenerateVoucherPDF, useSyncVoucherWithTally } from "@/hooks/useVouchers";
import { useCompany } from "@/contexts/CompanyContext";
import { Voucher, TableColumn } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function VouchersPage() {
  const { currentCompany } = useCompany();
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [filters, setFilters] = useState({
    voucherType: "",
    status: "",
    search: "",
    dateFrom: "",
    dateTo: "",
  });

  // Modal states
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Fetch vouchers
  const { data: vouchersData, isLoading } = useVouchers(page, limit, filters);

  // Mutations
  const deleteVoucherMutation = useDeleteVoucher();
  const generatePDFMutation = useGenerateVoucherPDF();
  const syncTallyMutation = useSyncVoucherWithTally();

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1); // Reset to first page when filtering
  };

  const handleEdit = (voucher: Voucher) => {
    setSelectedVoucher(voucher);
    setShowEditModal(true);
  };

  const handleDelete = (voucher: Voucher) => {
    setSelectedVoucher(voucher);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (selectedVoucher) {
      await deleteVoucherMutation.mutateAsync(selectedVoucher._id);
      setSelectedVoucher(null);
    }
  };

  const handleGeneratePDF = async (voucher: Voucher) => {
    await generatePDFMutation.mutateAsync(voucher._id);
  };

  const handleSyncTally = async (voucher: Voucher) => {
    await syncTallyMutation.mutateAsync(voucher._id);
  };

  if (!currentCompany) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900">No Company Selected</h2>
        <p className="mt-2 text-gray-600">Please select a company to view vouchers.</p>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      draft: "secondary" as const,
      pending: "warning" as const,
      approved: "success" as const,
      cancelled: "error" as const,
      paid: "success" as const,
      partially_paid: "warning" as const,
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] || "secondary"}>
        {status.replace("_", " ").toUpperCase()}
      </Badge>
    );
  };

  const getVoucherTypeBadge = (type: string) => {
    const colors = {
      sales: "success" as const,
      purchase: "primary" as const,
      receipt: "success" as const,
      payment: "warning" as const,
      contra: "secondary" as const,
      journal: "secondary" as const,
      debit_note: "error" as const,
      credit_note: "success" as const,
    };

    return (
      <Badge variant={colors[type as keyof typeof colors] || "secondary"}>
        {type.replace("_", " ").toUpperCase()}
      </Badge>
    );
  };

  const columns: TableColumn<Voucher>[] = [
    {
      key: "voucherNumber",
      title: "Voucher No.",
      sorter: true,
      render: (_, voucher) => (
        <div className="font-medium text-gray-900">
          {voucher.voucherNumber}
        </div>
      ),
    },
    {
      key: "voucherType",
      title: "Type",
      render: (_, voucher) => getVoucherTypeBadge(voucher.voucherType),
    },
    {
      key: "date",
      title: "Date",
      sorter: true,
      render: (_, voucher) => formatDate(voucher.date),
    },
    {
      key: "party",
      title: "Party",
      render: (_, voucher) => (
        <div className="text-gray-900">
          {typeof voucher.party === "string" ? voucher.party : voucher.party?.name || "-"}
        </div>
      ),
    },
    {
      key: "totals",
      title: "Amount",
      align: "right",
      render: (_, voucher) => (
        <div className="font-medium text-gray-900">
          {formatCurrency(voucher.totals?.grandTotal || 0)}
        </div>
      ),
    },
    {
      key: "status",
      title: "Status",
      render: (_, voucher) => getStatusBadge(voucher.status),
    },
    {
      key: "tallySync",
      title: "Tally",
      render: (_, voucher) => (
        <div className="flex items-center">
          {voucher.tallySync?.synced ? (
            <Badge variant="success" size="sm">Synced</Badge>
          ) : (
            <Badge variant="outline" size="sm">Not Synced</Badge>
          )}
        </div>
      ),
    },
    {
      key: "actions",
      title: "Actions",
      render: (_, voucher) => (
        <div className="flex items-center space-x-2">
          <Link href={`/vouchers/${voucher._id}`}>
            <Button variant="ghost" size="sm">
              <EyeIcon className="h-4 w-4" />
            </Button>
          </Link>
          <Button variant="ghost" size="sm" onClick={() => handleEdit(voucher)}>
            <PencilIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleGeneratePDF(voucher)}
            loading={generatePDFMutation.isPending}
          >
            <DocumentArrowDownIcon className="h-4 w-4" />
          </Button>
          {!voucher.tallySync?.synced && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleSyncTally(voucher)}
              loading={syncTallyMutation.isPending}
            >
              <ArrowPathIcon className="h-4 w-4" />
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => handleDelete(voucher)}>
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
          { title: "Vouchers" },
        ]}
      />

      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vouchers</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your vouchers and transactions
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link href="/vouchers/new">
            <Button>
              <PlusIcon className="h-4 w-4 mr-2" />
              Create Voucher
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
              placeholder="Search vouchers..."
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
            />

            <Select
              value={filters.voucherType}
              onValueChange={(value) => handleFilterChange("voucherType", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Types</SelectItem>
                <SelectItem value="sales">Sales</SelectItem>
                <SelectItem value="purchase">Purchase</SelectItem>
                <SelectItem value="receipt">Receipt</SelectItem>
                <SelectItem value="payment">Payment</SelectItem>
                <SelectItem value="contra">Contra</SelectItem>
                <SelectItem value="journal">Journal</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.status}
              onValueChange={(value) => handleFilterChange("status", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="date"
              placeholder="From Date"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
            />

            <Input
              type="date"
              placeholder="To Date"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange("dateTo", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardContent className="p-0">
          <DataTable
            data={vouchersData?.data || []}
            columns={columns}
            loading={isLoading}
            pagination={
              vouchersData?.pagination
                ? {
                    current: page,
                    pageSize: limit,
                    total: vouchersData.pagination.total,
                    onChange: (newPage) => setPage(newPage),
                  }
                : undefined
            }
            searchable={false} // We have custom search
            emptyMessage="No vouchers found"
          />
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <FormModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        title="Edit Voucher"
        size="xl"
      >
        {selectedVoucher && (
          <VoucherForm
            voucher={selectedVoucher}
            onSuccess={() => {
              setShowEditModal(false);
              setSelectedVoucher(null);
            }}
            onCancel={() => {
              setShowEditModal(false);
              setSelectedVoucher(null);
            }}
          />
        )}
      </FormModal>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        open={showDeleteModal}
        onOpenChange={setShowDeleteModal}
        title="Delete Voucher"
        description={`Are you sure you want to delete voucher ${selectedVoucher?.voucherNumber}? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        onConfirm={confirmDelete}
        loading={deleteVoucherMutation.isPending}
      />
    </div>
  );
}
