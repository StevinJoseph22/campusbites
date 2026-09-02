export interface VendorOrderItem {
  name: string;
  price: number;
  quantity: number;
  outOfStock?: boolean;
}

export interface VendorOrderRecord {
  orderId: string;
  stallId: string;
  tokenNumber: string;
  stallName: string;
  customerNotes?: string;
  studentName?: string | null;
  studentRegNumber?: string | null;
  pickupTimeSlot: string;
  items: VendorOrderItem[];
  subtotal: number;
  status: "PLACED" | "ACCEPTED" | "COOKING" | "PACKING" | "READY" | "FULFILLED" | "REFUNDED" | "PARTIAL_HOLD";
  placedAt?: string;
  timestamp?: number;
}

export function deduplicateAndSortOrders(orders: VendorOrderRecord[]): VendorOrderRecord[] {
  const map = new Map<string, VendorOrderRecord>();

  orders.forEach((order) => {
    const key = order.tokenNumber;
    if (!map.has(key)) {
      map.set(key, order);
    } else {
      const existing = map.get(key)!;
      // Keep most recent timestamp or updated status
      if ((order.timestamp || 0) > (existing.timestamp || 0)) {
        map.set(key, order);
      }
    }
  });

  const unique = Array.from(map.values());

  // Recent first sorting
  unique.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

  return unique;
}
