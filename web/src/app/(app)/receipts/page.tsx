"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { apiFetch, ApiError, extractItems, extractPagination } from "@/lib/api";

interface Receipt {
  id: string;
  paymentId: string;
  payment: {
    id: string;
    amount: number;
    paymentDate: string;
    paymentMode: string;
    student: { firstName: string; lastName: string; admissionNo: string };
    studentFee: {
      fee: { name: string; amount: number; frequency: string; feeType?: { name: string } };
      academicYear: { name: string };
    };
  };
  studentId: string;
  student: { id: string; firstName: string; lastName: string; admissionNo: string };
  academicYearId: string;
  academicYear: { id: string; name: string };
  receiptNumber: string;
  receiptDate: string;
  amount: number;
  generatedById: string;
  generatedBy: { id: string; firstName: string; lastName: string };
  pdfUrl?: string;
  createdAt: string;
}
interface PaginatedResponse<T> {
  data: {
    items: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
export default function ReceiptsPage() {
  const { user } = useAuth();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [payments, setPayments] = useState<{id: string, amount: number, paymentDate: string, paymentMode: string, student: {firstName: string, lastName: string, admissionNo: string}, studentFee: {fee: {name: string}, academicYear: {name: string}}}[]>([]);
  const [filters, setFilters] = useState({
    studentId: "",
    academicYearId: "",
    startDate: "",
    endDate: "",
  });

  const fetchReceipts = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)),
      });
      const res = await apiFetch<PaginatedResponse<Receipt>>(`/receipts?${params}`);
      setReceipts(extractItems(res));
      const pg = extractPagination(res);
      if (pg) setPagination((prev) => ({ ...prev, total: pg.total, totalPages: pg.totalPages }));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to fetch receipts");
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filters]);

  // Type for payments list
  type PaymentListItem = {
    id: string;
    amount: number;
    paymentDate: string;
    paymentMode: string;
    student: {firstName: string; lastName: string; admissionNo: string};
    studentFee: {fee: {name: string}; academicYear: {name: string}};
  };

  const fetchPayments = useCallback(async () => {
    try {
      const res = await apiFetch<PaginatedResponse<PaymentListItem>>("/payments?limit=200");
      const paymentsData = extractItems(res) as PaymentListItem[];
      setPayments(paymentsData.filter(p => (p as any).status === "COMPLETED"));
    } catch (err) {
      console.error("Failed to fetch payments", err);
    }
  }, []);

  useEffect(() => {
    fetchReceipts();
    fetchPayments();
  }, [fetchReceipts, fetchPayments]);

  const handleGenerateReceipt = async (paymentId: string) => {
    try {
      setError("");
      await apiFetch(`/receipts/generate/${paymentId}`, {
        method: "POST",
      });
      fetchReceipts();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to generate receipt");
    }
  };

  const handleDownload = async (id: string) => {
    try {
      const res = await apiFetch<{downloadUrl: string}>(`/receipts/download/${id}`, {
        method: "GET",
      });
      // In a real app, this would trigger a download
      window.open(res.downloadUrl, "_blank");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to download receipt");
    }
  };

  const handleViewReceipt = (receipt: Receipt) => {
    // Open receipt in a modal or new window
    const receiptWindow = window.open("", "_blank", "width=600,height=800");
    if (receiptWindow) {
      receiptWindow.document.write(generateReceiptHTML(receipt));
      receiptWindow.document.close();
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const canView = user && user.permissions.includes("receipt:view");
  const canCreate = user && user.permissions.includes("receipt:create");
  const canDownload = user && user.permissions.includes("receipt:download");

  if (!canView) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🚫</div>
        <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
        <p className="text-gray-500 mt-2">You don't have permission to view receipts.</p>
      </div>
    );
  }

  const getModeLabel = (mode: string) => {
    switch (mode) {
      case "CASH": return "Cash";
      case "CARD": return "Card";
      case "UPI": return "UPI";
      case "NET_BANKING": return "Net Banking";
      case "CHEQUE": return "Cheque";
      case "DD": return "DD";
      case "ONLINE": return "Online";
      default: return mode;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Receipts</h1>
          <p className="text-gray-500 mt-1">View and download payment receipts</p>
        </div>
      </div>
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg" role="alert">
          {error}
        </div>
      )}
      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Student</label>
            <select
              value={filters.studentId}
              onChange={(e) => handleFilterChange("studentId", e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Students</option>
              {payments.map((p) => (
                <option key={p.id} value={p.student.admissionNo}>
                  {p.student.firstName} {p.student.lastName} ({p.student.admissionNo})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
            <select
              value={filters.academicYearId}
              onChange={(e) => handleFilterChange("academicYearId", e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Years</option>
              {payments.map((p) => (
                <option key={p.studentFee.academicYear.name} value={p.studentFee.academicYear.name}>
                  {p.studentFee.academicYear.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange("startDate", e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange("endDate", e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Receipt No.</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Academic Year</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Mode</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Generated By</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                      Loading...
                    </div>
                  </td>
                </tr>
              ) : receipts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-gray-500">No receipts found</td>
                </tr>
              ) : (
                receipts.map((receipt) => (
                  <tr key={receipt.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-mono text-blue-600 font-medium">{receipt.receiptNumber}</td>
                    <td className="px-6 py-4 text-gray-900">{new Date(receipt.receiptDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{receipt.student.firstName} {receipt.student.lastName}</div>
                      <div className="text-sm text-gray-500">{receipt.student.admissionNo}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{receipt.payment.studentFee.fee.name}</div>
                      <div className="text-sm text-gray-500">{receipt.payment.studentFee.fee.feeType?.name || ""}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-900">{receipt.academicYear.name}</td>
                    <td className="px-6 py-4 text-gray-900 font-mono">₹{Number(receipt.amount).toLocaleString()}</td>
                    <td className="px-6 py-4 text-gray-900">{getModeLabel(receipt.payment.paymentMode)}</td>
                    <td className="px-6 py-4 text-gray-900 text-sm">{receipt.generatedBy.firstName} {receipt.generatedBy.lastName}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewReceipt(receipt)}
                          className="px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                        >
                          View
                        </button>
                        {canDownload && (
                          <button
                            onClick={() => handleDownload(receipt.id)}
                            className="px-3 py-1.5 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                          >
                            Download
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-700">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                disabled={pagination.page === 1}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              <span className="px-3 py-1.5 text-sm text-gray-700">Page {pagination.page} of {pagination.totalPages}</span>
              <button
                onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                disabled={pagination.page === pagination.totalPages}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
      {/* Generate Receipt Section */}
      {payments.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Generate Receipt</h2>
          <p className="text-gray-500 mb-4">Select a completed payment to generate a receipt</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {payments.map((payment) => (
              <button
                key={payment.id}
                onClick={() => handleGenerateReceipt(payment.id)}
                disabled={receipts.some(r => r.paymentId === payment.id)}
                className={`p-4 border rounded-lg text-left transition-colors ${
                  receipts.some(r => r.paymentId === payment.id)
                    ? "bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed"
                    : "border-gray-300 hover:border-blue-500 hover:bg-blue-50"
                }`}
              >
                <div className="font-medium text-gray-900">
                  {payment.student.firstName} {payment.student.lastName} ({payment.student.admissionNo})
                </div>
                <div className="text-sm text-gray-500">{payment.studentFee.fee.name}</div>
                <div className="text-sm text-gray-500">{payment.studentFee.academicYear.name}</div>
                <div className="font-mono text-green-600 mt-1">₹{Number(payment.amount).toLocaleString()}</div>
                <div className="text-xs text-gray-400 mt-1">{getModeLabel(payment.paymentMode)} • {new Date(payment.paymentDate).toLocaleDateString()}</div>
                {receipts.some(r => r.paymentId === payment.id) && (
                  <div className="text-xs text-gray-400 mt-1">Receipt already generated</div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function generateReceiptHTML(receipt: Receipt): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Receipt ${receipt.receiptNumber}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
        .receipt-header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
        .school-name { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
        .receipt-title { font-size: 20px; color: #666; margin-top: 10px; }
        .receipt-details { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 20px 0; }
        .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
        .detail-label { font-weight: bold; }
        .amount-row { font-size: 18px; font-weight: bold; color: #2563eb; border-top: 2px solid #333; border-bottom: 2px solid #333; padding: 15px 0; }
        .footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; }
        .signature { margin-top: 60px; display: flex; justify-content: space-between; }
        .sig-line { border-top: 1px solid #333; width: 200px; text-align: center; padding-top: 5px; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="receipt-header">
        <div class="school-name">CampusOne School</div>
        <div class="receipt-title">Official Receipt</div>
        <div>Receipt No: <strong>${receipt.receiptNumber}</strong></div>
        <div>Date: ${new Date(receipt.receiptDate).toLocaleDateString()}</div>
      </div>
      <div class="receipt-details">
        <div>
          <div class="detail-row"><span class="detail-label">Student:</span> <span>${receipt.student.firstName} ${receipt.student.lastName}</span></div>
          <div class="detail-row"><span class="detail-label">Admission No:</span> <span>${receipt.student.admissionNo}</span></div>
        </div>
        <div>
          <div class="detail-row"><span class="detail-label">Fee:</span> <span>${receipt.payment.studentFee.fee.name}</span></div>
          <div class="detail-row"><span class="detail-label">Academic Year:</span> <span>${receipt.academicYear.name}</span></div>
        </div>
      </div>
      <div class="detail-row amount-row">
        <span class="detail-label">Amount Paid:</span>
        <span>₹${Number(receipt.amount).toLocaleString()}</span>
      </div>
      <div class="receipt-details">
        <div>
          <div class="detail-row"><span class="detail-label">Payment Mode:</span> <span>${receipt.payment.paymentMode.replace("_", " ")}</span></div>
          <div class="detail-row"><span class="detail-label">Payment Date:</span> <span>${new Date(receipt.payment.paymentDate).toLocaleDateString()}</span></div>
        </div>
        <div>
          <div class="detail-row"><span class="detail-label">Generated By:</span> <span>${receipt.generatedBy.firstName} ${receipt.generatedBy.lastName}</span></div>
          <div class="detail-row"><span class="detail-label">Generated On:</span> <span>${new Date(receipt.createdAt).toLocaleDateString()}</span></div>
        </div>
      </div>
      <div class="footer">
        <p>This is a computer-generated receipt. No signature required.</p>
        <p>CampusOne School Management System</p>
      </div>
    </body>
    </html>
  `;
}