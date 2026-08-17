"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Package,
  Loader2,
  ArrowLeft,
  Download,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  MapPin,
  Calendar,
  Leaf,
} from "lucide-react";
import useOrderStore from "@/store/useOrderStore";
import useUserStore from "@/store/useUserStore";

function formatPrice(n) {
  return `₹${Number(n || 0).toLocaleString("en-IN")}`;
}

function formatDate(date) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatusBadge({ status }) {
  const configs = {
    placed: {
      bg: "bg-blue-100",
      text: "text-blue-700",
      icon: Clock,
      label: "Order Placed",
    },
    processing: {
      bg: "bg-amber-100",
      text: "text-amber-700",
      icon: Package,
      label: "Processing",
    },
    shipped: {
      bg: "bg-purple-100",
      text: "text-purple-700",
      icon: Truck,
      label: "Shipped",
    },
    delivered: {
      bg: "bg-green-100",
      text: "text-green-700",
      icon: CheckCircle,
      label: "Delivered",
    },
    cancelled: {
      bg: "bg-red-100",
      text: "text-red-700",
      icon: XCircle,
      label: "Cancelled",
    },
  };
  const config = configs[status] || configs.placed;
  const Icon = config.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${config.bg} ${config.text}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </span>
  );
}

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params?.orderId;

  const { user, authChecked } = useUserStore();
  const { singleOrder, loading, getSingleOrder } = useOrderStore();

  useEffect(() => {
    if (!authChecked) return;
    if (!user) {
      router.replace(`/login?redirect=/orders/${orderId}`);
      return;
    }
    if (orderId) getSingleOrder(orderId);
  }, [authChecked, user, orderId]);

  if (!authChecked || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-green-600" />
          <p className="mt-3 text-sm text-gray-600">Loading order...</p>
        </div>
      </div>
    );
  }

  if (!singleOrder) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <Package className="mx-auto h-12 w-12 text-gray-300" />
        <h1 className="mt-4 text-xl font-semibold text-gray-900">
          Order not found
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          This order may not exist or you do not have permission to view it.
        </p>
        <Link
          href="/orders"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-green-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to orders
        </Link>
      </div>
    );
  }

  const order = singleOrder;
  const address = order.shippingAddress || {};
  const tracking = order.shippingDetails?.trackingUrl;

  return (
    <div className="min-h-screen bg-gray-50 pb-16 pt-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <Link
          href="/orders"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-green-700"
        >
          <ArrowLeft className="h-4 w-4" />
          All orders
        </Link>

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 bg-gray-50 px-5 py-5 sm:px-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Order
                </p>
                <h1 className="mt-1 font-mono text-lg font-bold text-gray-900">
                  {order.easebuzzOrderId || order._id}
                </h1>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <StatusBadge status={order.orderStatus} />
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      order.paymentStatus === "paid"
                        ? "bg-green-100 text-green-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {order.paymentStatus === "paid" ? "Paid" : "Payment pending"}
                  </span>
                </div>
                <p className="mt-3 flex items-center gap-1.5 text-xs text-gray-500">
                  <Calendar className="h-3.5 w-3.5" />
                  Placed {formatDate(order.createdAt)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Total</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatPrice(order.finalAmount)}
                </p>
                {order.invoiceUrl && (
                  <a
                    href={order.invoiceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-green-50 hover:text-green-700"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Invoice
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6 px-5 py-6 sm:px-6">
            <section>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-900">
                <Leaf className="h-4 w-4 text-green-600" />
                Items
              </h2>
              <div className="space-y-3">
                {(order.items || []).map((item, idx) => (
                  <div
                    key={idx}
                    className="flex gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3"
                  >
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-white">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.name || "Product"}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-gray-300">
                          <Package className="h-6 w-6" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-gray-900">
                        {item.name}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-500">
                        Qty {item.quantity}
                        {item.color ? ` · ${item.color}` : ""}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-green-700">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-900">
                <MapPin className="h-4 w-4 text-green-600" />
                Shipping address
              </h2>
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm text-gray-700">
                <p className="font-semibold text-gray-900">{address.fullName}</p>
                {address.companyName && <p>{address.companyName}</p>}
                <p>{address.streetAddress}</p>
                {address.landmark && <p>{address.landmark}</p>}
                <p>
                  {address.city}, {address.state} - {address.pincode}
                </p>
                <p className="mt-2">Phone: {address.phone}</p>
                {address.email && <p>Email: {address.email}</p>}
              </div>
            </section>

            {(order.shippingDetails?.trackingNumber || tracking) && (
              <section>
                <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-900">
                  <Truck className="h-4 w-4 text-green-600" />
                  Tracking
                </h2>
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm">
                  {order.shippingDetails?.courierName && (
                    <p>Courier: {order.shippingDetails.courierName}</p>
                  )}
                  {order.shippingDetails?.trackingNumber && (
                    <p className="mt-1 font-mono">
                      AWB: {order.shippingDetails.trackingNumber}
                    </p>
                  )}
                  {tracking && (
                    <a
                      href={tracking}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-block font-semibold text-green-700 hover:underline"
                    >
                      Track shipment →
                    </a>
                  )}
                </div>
              </section>
            )}

            {Array.isArray(order.statusHistory) &&
              order.statusHistory.length > 0 && (
                <section>
                  <h2 className="mb-3 text-sm font-bold text-gray-900">
                    Status history
                  </h2>
                  <ol className="space-y-3 border-l-2 border-green-100 pl-4">
                    {order.statusHistory.map((entry, idx) => (
                      <li key={idx} className="relative text-sm">
                        <span className="absolute -left-[1.3rem] top-1 h-2.5 w-2.5 rounded-full bg-green-500" />
                        <p className="font-semibold capitalize text-gray-900">
                          {entry.status}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(entry.timestamp)}
                        </p>
                        {entry.note && (
                          <p className="mt-0.5 text-xs text-gray-600">
                            {entry.note}
                          </p>
                        )}
                      </li>
                    ))}
                  </ol>
                </section>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}
