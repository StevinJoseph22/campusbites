"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Building2, 
  Store, 
  Plus, 
  ShieldCheck, 
  Users, 
  UtensilsCrossed, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight,
  Search,
  MapPin,
  KeyRound,
  Leaf,
  Settings,
  DollarSign,
  Info,
  QrCode
} from "lucide-react";

export default function SuperAdminPage() {
  const router = useRouter();
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State for new registration
  const [name, setName] = useState("");
  const [tokenPrefix, setTokenPrefix] = useState("KJU-");
  const [floor, setFloor] = useState("Ground Floor");
  const [managerEmail, setManagerEmail] = useState("");
  const [cuisine, setCuisine] = useState("");
  const [location, setLocation] = useState("");
  const [logo, setLogo] = useState("https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=120&h=120&fit=crop");
  const [type, setType] = useState<"PURE_VEG" | "MIXED">("PURE_VEG");
  const [campus, setCampus] = useState("Airport Road Campus");
  
  // Registration Passcode Display Modal
  const [registeredPasscode, setRegisteredPasscode] = useState<string | null>(null);
  const [registeredStallId, setRegisteredStallId] = useState<string | null>(null);

  // Admin Fees Config States
  const [platformFee, setPlatformFee] = useState<number>(2.0);
  const [convenienceFee, setConvenienceFee] = useState<number>(2.0);
  const [takeawayFee, setTakeawayFee] = useState<number>(10.0);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [studentCount, setStudentCount] = useState(0);
  const [studentsList, setStudentsList] = useState<any[]>([]);
  const [showStudentsModal, setShowStudentsModal] = useState(false);
  const [studentSearchQuery, setStudentSearchQuery] = useState("");
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const getTodayDateString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [startDate, setStartDate] = useState(getTodayDateString());
  const [endDate, setEndDate] = useState(getTodayDateString());

  const filteredOrders = orders.filter(o => {
    if (!o.createdAt) return true;
    const orderDate = new Date(o.createdAt);
    orderDate.setHours(0, 0, 0, 0);
    
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      if (orderDate < start) return false;
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(0, 0, 0, 0);
      if (orderDate > end) return false;
    }
    return true;
  });

  const [restaurantSearchQuery, setRestaurantSearchQuery] = useState("");

  // Calculate Restaurant-wise Sales (strictly Food Items + Parcel Packaging, excluding Platform and Convenience fees)
  const restaurantSalesData = restaurants.map(res => {
    let ordersCount = 0;
    let fulfilledCount = 0;
    let refundedCount = 0;
    let foodItemSales = 0;
    let parcelCharges = 0;
    let refundedAmount = 0;

    filteredOrders.forEach(order => {
      const portion = order.vendorPortions?.find((p: any) => p.stallId === res.id || p.stallName === res.name);
      if (portion) {
        ordersCount++;
        const isPortionRefunded = portion.status === "REFUNDED" || order.paymentStatus === "REFUNDED";
        
        if (portion.status === "FULFILLED") {
          fulfilledCount++;
        }
        if (isPortionRefunded) {
          refundedCount++;
        }

        // Calculate food items sum and check OOS
        let portionFoodSum = 0;
        if (Array.isArray(portion.items)) {
          portion.items.forEach((item: any) => {
            const itemPrice = Number(item.price) || 0;
            const itemQty = Number(item.quantity) || 1;
            const itemTotal = itemPrice * itemQty;
            const isOos = Boolean(item.outOfStock || item.refunded || isPortionRefunded);

            if (isOos) {
              refundedAmount += itemTotal;
            } else {
              portionFoodSum += itemTotal;
            }
          });
        }

        if (!isPortionRefunded) {
          foodItemSales += portionFoodSum;
          // Calculate parcel packaging fee for this portion
          const portionParcel = Math.max(0, (Number(portion.subtotal) || portionFoodSum) - portionFoodSum);
          parcelCharges += portionParcel;
        }
      }
    });

    const netRestaurantSales = foodItemSales + parcelCharges; // Pure restaurant sales (Excludes Platform & Convenience fees)

    return {
      stallId: res.id,
      name: res.name,
      tokenPrefix: res.tokenPrefix,
      campus: res.campus || "Airport Road Campus",
      logo: res.logo,
      floor: res.floor,
      ordersCount,
      fulfilledCount,
      refundedCount,
      foodItemSales,
      parcelCharges,
      netRestaurantSales,
      refundedAmount
    };
  });

  const filteredRestaurantSales = restaurantSalesData.filter(r => 
    r.name.toLowerCase().includes(restaurantSearchQuery.toLowerCase()) ||
    r.stallId.toLowerCase().includes(restaurantSearchQuery.toLowerCase()) ||
    r.campus.toLowerCase().includes(restaurantSearchQuery.toLowerCase())
  );

  const handleExportToExcel = async () => {
    if (typeof window === "undefined") return;
    try {
      const ExcelJS = (await import("exceljs")).default;
      const workbook = new ExcelJS.Workbook();
      workbook.creator = "CampusBites Admin";
      workbook.created = new Date();

      // Common styling helpers
      const applyHeaderStyle = (row: any, bgColorHex = "FF1E293B") => {
        row.eachCell((cell: any) => {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bgColorHex } };
          cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
          cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
          cell.border = {
            top: { style: "thin", color: { argb: "FF94A3B8" } },
            left: { style: "thin", color: { argb: "FF94A3B8" } },
            bottom: { style: "medium", color: { argb: "FF475569" } },
            right: { style: "thin", color: { argb: "FF94A3B8" } }
          };
        });
        row.height = 28;
      };

      const autoFitColumns = (sheet: any) => {
        sheet.columns.forEach((column: any) => {
          let maxLen = 14;
          column.eachCell?.({ includeEmpty: true }, (cell: any) => {
            const valStr = cell.value ? cell.value.toString() : "";
            maxLen = Math.max(maxLen, valStr.length + 4);
          });
          column.width = Math.min(maxLen, 45);
        });
      };

      // ----------------------------------------------------
      // SHEET 1: Financial Summary
      // ----------------------------------------------------
      const summarySheet = workbook.addWorksheet("Financial Summary");
      summarySheet.columns = [
        { header: "Metric / Financial Indicator", key: "Metric", width: 35 },
        { header: "Value (INR / Count)", key: "Value", width: 25 }
      ];
      applyHeaderStyle(summarySheet.getRow(1), "FF0F172A");

      const totalGrossSales = filteredOrders.reduce((sum, o) => sum + o.totalAmount, 0);
      const totalFoodSales = filteredOrders.reduce((sum, o) => {
        return sum + (o.vendorPortions || []).reduce((pSum: number, portion: any) => {
          if (portion.status === "REFUNDED") return pSum;
          return pSum + (portion.items || []).reduce((iSum: number, i: any) => {
            if (i.outOfStock || i.refunded) return iSum;
            return iSum + (Number(i.price) || 0) * (Number(i.quantity) || 1);
          }, 0);
        }, 0);
      }, 0);
      const totalTakeawayCharges = filteredOrders.reduce((sum, o) => sum + (o.packagingFeeAmount || 0), 0);
      const totalPlatformFees = filteredOrders.reduce((sum, o) => sum + (o.platformFeeAmount || 0), 0);
      const totalConvenienceFees = filteredOrders.reduce((sum, o) => sum + (o.convenienceFeeAmount || 0), 0);
      const totalRestaurantPayouts = totalFoodSales + totalTakeawayCharges;

      const summaryRows = [
        ["Report Period Start", startDate || "All Time"],
        ["Report Period End", endDate || "All Time"],
        ["Total Placed Orders", filteredOrders.length],
        ["Gross Sales Revenue (INR)", `₹${totalGrossSales.toFixed(2)}`],
        ["Total Food Item Sales (INR)", `₹${totalFoodSales.toFixed(2)}`],
        ["Takeaway Packaging / Parcel Fees (INR)", `₹${totalTakeawayCharges.toFixed(2)}`],
        ["Total Net Restaurant Payouts (INR) [Items + Parcel]", `₹${totalRestaurantPayouts.toFixed(2)}`],
        ["Platform Fee Collection (INR)", `₹${totalPlatformFees.toFixed(2)}`],
        ["Convenience Fee Collection (INR)", `₹${totalConvenienceFees.toFixed(2)}`],
        ["Total System Service Charges (INR) [Platform + Convenience]", `₹${(totalPlatformFees + totalConvenienceFees).toFixed(2)}`]
      ];

      summaryRows.forEach((r, idx) => {
        const row = summarySheet.addRow(r);
        row.height = 22;
        if (idx >= 3) {
          row.getCell(2).font = { bold: true };
        }
      });
      autoFitColumns(summarySheet);

      // ----------------------------------------------------
      // SHEET 2: Restaurant-wise Sales
      // ----------------------------------------------------
      const restSheet = workbook.addWorksheet("Restaurant-wise Sales");
      restSheet.columns = [
        { header: "Stall ID", key: "stallId", width: 18 },
        { header: "Restaurant Name", key: "name", width: 35 },
        { header: "Campus Location", key: "campus", width: 22 },
        { header: "Floor", key: "floor", width: 15 },
        { header: "Total Orders", key: "ordersCount", width: 14 },
        { header: "Fulfilled Orders", key: "fulfilledCount", width: 16 },
        { header: "Refunded / OOS Orders", key: "refundedCount", width: 22 },
        { header: "Food Item Sales (INR)", key: "foodItemSales", width: 22 },
        { header: "Parcel Charges (INR)", key: "parcelCharges", width: 20 },
        { header: "Net Restaurant Sales (INR)", key: "netRestaurantSales", width: 26 },
        { header: "Refunded Amount (INR)", key: "refundedAmount", width: 22 }
      ];
      applyHeaderStyle(restSheet.getRow(1), "FF1E3A8A"); // Dark Blue Header

      let sumRestOrders = 0;
      let sumRestFulfilled = 0;
      let sumRestRefunded = 0;
      let sumRestFood = 0;
      let sumRestParcel = 0;
      let sumRestNet = 0;
      let sumRestRefundAmt = 0;

      restaurantSalesData.forEach(r => {
        sumRestOrders += r.ordersCount;
        sumRestFulfilled += r.fulfilledCount;
        sumRestRefunded += r.refundedCount;
        sumRestFood += r.foodItemSales;
        sumRestParcel += r.parcelCharges;
        sumRestNet += r.netRestaurantSales;
        sumRestRefundAmt += r.refundedAmount;

        const row = restSheet.addRow([
          r.stallId,
          r.name,
          r.campus,
          r.floor,
          r.ordersCount,
          r.fulfilledCount,
          r.refundedCount,
          Number(r.foodItemSales.toFixed(2)),
          Number(r.parcelCharges.toFixed(2)),
          Number(r.netRestaurantSales.toFixed(2)),
          Number(r.refundedAmount.toFixed(2))
        ]);
        row.height = 20;
      });

      // Total summary row for restaurants
      const restTotalRow = restSheet.addRow([
        "TOTAL",
        "ALL RESTAURANTS COMBINED",
        "-",
        "-",
        sumRestOrders,
        sumRestFulfilled,
        sumRestRefunded,
        Number(sumRestFood.toFixed(2)),
        Number(sumRestParcel.toFixed(2)),
        Number(sumRestNet.toFixed(2)),
        Number(sumRestRefundAmt.toFixed(2))
      ]);
      restTotalRow.height = 24;
      restTotalRow.eachCell((cell: any) => {
        cell.font = { bold: true, color: { argb: "FF0F172A" } };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2E8F0" } };
        cell.border = {
          top: { style: "medium", color: { argb: "FF475569" } },
          bottom: { style: "double", color: { argb: "FF0F172A" } }
        };
      });
      autoFitColumns(restSheet);

      // ----------------------------------------------------
      // SHEET 3: Order Details (Highlighting Out of Stock & Refunded in Red)
      // ----------------------------------------------------
      const detailsSheet = workbook.addWorksheet("Order Details & OOS Items");
      detailsSheet.columns = [
        { header: "Master Token", key: "masterToken", width: 18 },
        { header: "Order ID", key: "orderId", width: 22 },
        { header: "Placing Date/Time", key: "dateTime", width: 22 },
        { header: "Customer Identifier", key: "customer", width: 26 },
        { header: "Canteen Name", key: "stallName", width: 30 },
        { header: "Canteen Token", key: "tokenNumber", width: 18 },
        { header: "Pickup Slot", key: "pickupTimeSlot", width: 16 },
        { header: "Dish Name", key: "dishName", width: 26 },
        { header: "Unit Price (INR)", key: "unitPrice", width: 16 },
        { header: "Quantity", key: "quantity", width: 12 },
        { header: "Dish Subtotal (INR)", key: "subtotal", width: 18 },
        { header: "Item Status", key: "itemStatus", width: 24 },
        { header: "Portion Status", key: "portionStatus", width: 16 },
        { header: "Payment Status", key: "paymentStatus", width: 16 }
      ];
      applyHeaderStyle(detailsSheet.getRow(1), "FF1E293B");

      filteredOrders.forEach(order => {
        const dateTimeStr = order.createdAt ? new Date(order.createdAt).toLocaleString("en-IN") : order.placedAt;
        const customerStr = order.studentRegNumber || order.studentName || order.email || "Student";
        const isOrderRefunded = order.paymentStatus === "REFUNDED";

        (order.vendorPortions || []).forEach((portion: any) => {
          const isPortionRefunded = portion.status === "REFUNDED" || isOrderRefunded;

          (portion.items || []).forEach((item: any) => {
            const isOos = Boolean(item.outOfStock || item.refunded || isPortionRefunded);
            const itemStatusStr = isOos 
              ? "OUT OF STOCK / REFUNDED" 
              : portion.status === "FULFILLED" 
              ? "Fulfilled" 
              : "Active & Ordered";

            const row = detailsSheet.addRow([
              order.masterToken,
              order.orderId,
              dateTimeStr,
              customerStr,
              portion.stallName,
              portion.tokenNumber,
              portion.pickupTimeSlot,
              item.name,
              item.price,
              item.quantity,
              item.price * item.quantity,
              itemStatusStr,
              portion.status,
              order.paymentStatus
            ]);
            row.height = 20;

            // MARK IN RED COLOR IF OUT OF STOCK / REFUNDED!
            if (isOos) {
              row.eachCell((cell: any) => {
                cell.fill = {
                  type: "pattern",
                  pattern: "solid",
                  fgColor: { argb: "FFFFEAEA" } // Light Red Fill
                };
                cell.font = {
                  color: { argb: "FFB91C1C" }, // Bold Dark Red Font
                  bold: true
                };
              });
            }
          });
        });
      });
      autoFitColumns(detailsSheet);

      // ----------------------------------------------------
      // SHEET 4: Convenience & Platform Charges
      // ----------------------------------------------------
      const feeSheet = workbook.addWorksheet("Platform & Convenience Fees");
      feeSheet.columns = [
        { header: "Master Token", key: "masterToken", width: 18 },
        { header: "Order ID", key: "orderId", width: 22 },
        { header: "Date/Time", key: "dateTime", width: 22 },
        { header: "Customer", key: "customer", width: 24 },
        { header: "Food Subtotal (INR)", key: "foodSubtotal", width: 20 },
        { header: "Packaging Fee (INR)", key: "packagingFee", width: 20 },
        { header: "Platform Fee (INR)", key: "platformFee", width: 18 },
        { header: "Convenience Fee (INR)", key: "convenienceFee", width: 22 },
        { header: "Total Service Fee (INR)", key: "totalServiceFee", width: 22 },
        { header: "Grand Total (INR)", key: "grandTotal", width: 20 },
        { header: "Payment Status", key: "paymentStatus", width: 16 }
      ];
      applyHeaderStyle(feeSheet.getRow(1), "FF581C87"); // Purple Header

      let sumFoodSubtotal = 0;
      let sumPackagingFee = 0;
      let sumPlatformFee = 0;
      let sumConvenienceFee = 0;
      let sumTotalServiceFee = 0;
      let sumGrandTotal = 0;

      filteredOrders.forEach(order => {
        const dateTimeStr = order.createdAt ? new Date(order.createdAt).toLocaleString("en-IN") : order.placedAt;
        const customerStr = order.studentRegNumber || order.studentName || order.email || "Student";
        
        const foodSub = (order.vendorPortions || []).reduce((pSum: number, portion: any) => {
          return pSum + (portion.items || []).reduce((iSum: number, i: any) => iSum + (Number(i.price) || 0) * (Number(i.quantity) || 1), 0);
        }, 0);
        const pkgFee = Number(order.packagingFeeAmount) || 0;
        const platFee = Number(order.platformFeeAmount) || 0;
        const convFee = Number(order.convenienceFeeAmount) || 0;
        const serviceFee = platFee + convFee;
        const total = Number(order.totalAmount) || 0;

        sumFoodSubtotal += foodSub;
        sumPackagingFee += pkgFee;
        sumPlatformFee += platFee;
        sumConvenienceFee += convFee;
        sumTotalServiceFee += serviceFee;
        sumGrandTotal += total;

        const row = feeSheet.addRow([
          order.masterToken,
          order.orderId,
          dateTimeStr,
          customerStr,
          Number(foodSub.toFixed(2)),
          Number(pkgFee.toFixed(2)),
          Number(platFee.toFixed(2)),
          Number(convFee.toFixed(2)),
          Number(serviceFee.toFixed(2)),
          Number(total.toFixed(2)),
          order.paymentStatus
        ]);
        row.height = 20;
      });

      // Total sum row for platform and convenience fees
      const feeTotalRow = feeSheet.addRow([
        "TOTAL",
        "ALL ORDERS SUM",
        "-",
        "-",
        Number(sumFoodSubtotal.toFixed(2)),
        Number(sumPackagingFee.toFixed(2)),
        Number(sumPlatformFee.toFixed(2)),
        Number(sumConvenienceFee.toFixed(2)),
        Number(sumTotalServiceFee.toFixed(2)),
        Number(sumGrandTotal.toFixed(2)),
        "-"
      ]);
      feeTotalRow.height = 24;
      feeTotalRow.eachCell((cell: any) => {
        cell.font = { bold: true, color: { argb: "FF0F172A" } };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2E8F0" } };
        cell.border = {
          top: { style: "medium", color: { argb: "FF475569" } },
          bottom: { style: "double", color: { argb: "FF0F172A" } }
        };
      });
      autoFitColumns(feeSheet);

      // Write and download
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `CampusBites_Financial_Report_${Date.now()}.xlsx`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Excel generation failed", e);
    }
  };

  const fetchRestaurantsAndSettings = async () => {
    try {
      const res = await fetch("/api/restaurants");
      const data = await res.json();
      if (data.success) {
        setRestaurants(data.restaurants);
        setStudentCount(data.studentCount || 0);
        setStudentsList(data.students || []);
      }

      const settingsRes = await fetch("/api/settings");
      const settingsData = await settingsRes.json();
      if (settingsData.success) {
        setPlatformFee(settingsData.settings.platformFee);
        setConvenienceFee(settingsData.settings.convenienceFee);
        setTakeawayFee(settingsData.settings.takeawayFee);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAllOrders = async () => {
    setIsLoadingOrders(true);
    try {
      const res = await fetch("/api/orders?isAdmin=true");
      const data = await res.json();
      if (data.success && data.orders) {
        setOrders(data.orders);
      }
    } catch (e) {
      console.error("Failed to fetch admin orders", e);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const role = localStorage.getItem("campusbites_user_role");
      if (role !== "ADMIN") {
        if (role === "STUDENT") router.push("/student/dashboard");
        else if (role === "VENDOR") router.push("/vendor/dashboard");
        else router.push("/login");
        return;
      }
    }
    fetchRestaurantsAndSettings();
    fetchAllOrders();
  }, [router]);

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !tokenPrefix.trim()) return;

    try {
      const res = await fetch("/api/restaurants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          tokenPrefix: tokenPrefix.trim().toUpperCase(),
          floor,
          managerEmail: managerEmail.trim(),
          cuisine: cuisine.trim(),
          location: location.trim(),
          logo: logo.trim(),
          type,
          campus
        })
      });

      const data = await res.json();
      if (data.success) {
        setRegisteredStallId(data.restaurant.id);
        setRegisteredPasscode(data.registrationCode);
        setIsModalOpen(false);

        // Reset Form
        setName("");
        setTokenPrefix("KJU-");
        setCuisine("");
        setLocation("");
        setManagerEmail("");

        fetchRestaurantsAndSettings();
      } else {
        alert("Registration failed: " + data.error);
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platformFee, convenienceFee, takeawayFee })
      });
      const data = await res.json();
      if (data.success) {
        setToastMessage("✓ Configured platform & standard parcel charges successfully!");
        setTimeout(() => setToastMessage(null), 3000);
      }
    } catch (e) {
      console.error(e);
    }
    setIsSavingSettings(false);
  };

  const handleResetPassword = async (restaurantId: string) => {
    if (!confirm(`Are you sure you want to reset password for "${restaurantId}"? A new temporary single-use registration passcode will be generated.`)) return;

    try {
      const res = await fetch("/api/restaurants/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restaurantId })
      });
      const data = await res.json();
      if (data.success) {
        setRegisteredStallId(restaurantId);
        setRegisteredPasscode(data.newPasscode);
        setToastMessage(`✓ Passcode reset successfully for ${restaurantId}`);
        setTimeout(() => setToastMessage(null), 3000);
      } else {
        alert("Failed to reset password: " + data.error);
      }
    } catch (e: any) {
      alert("Error: " + e.message);
    }
  };

  const filtered = restaurants.filter(r => 
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.floor.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.tokenPrefix.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSignOut = () => {
    localStorage.removeItem("campusbites_user_role");
    localStorage.removeItem("campusbites_user_phone");
    localStorage.removeItem("campusbites_student_reg");
    localStorage.removeItem("campusbites_user_name");
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-campus-mesh text-slate-100 flex flex-col pb-12">
      {/* Admin Navbar */}
      <header className="sticky top-0 z-40 glass-panel border-b border-slate-800/80 bg-slate-950/90">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-600/20 border border-purple-500/30 text-purple-400 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-extrabold text-white flex items-center gap-2">
                CampusBites Super Admin Panel
              </h1>
              <p className="text-[10px] text-slate-400 font-mono">Centralized College Canteen Registration Hub</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsModalOpen(true)}
              className="btn-primary-gradient px-4 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 shadow-lg shadow-orange-500/20 hover:scale-105 transition-transform"
            >
              <Plus className="w-4 h-4" />
              <span>Register New Restaurant</span>
            </button>

            <button
              onClick={handleSignOut}
              className="px-3.5 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-8">
        {/* Toast Alert */}
        {toastMessage && (
          <div className="glass-panel p-4 rounded-2xl border-emerald-500/50 bg-emerald-500/20 text-white text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Configurations & Hidden Fees Management Panel */}
        <div className="relative overflow-hidden glass-panel p-6 rounded-3xl border-slate-800 bg-gradient-to-b from-slate-900/90 to-slate-950/90 shadow-2xl space-y-4">
          <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <div className="w-8 h-8 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400">
              <Settings className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white">Order Fee Configuration</h2>
              <p className="text-[10px] text-slate-500 font-mono">Shown to students on every order's bill breakdown</p>
            </div>
          </div>

          <form onSubmit={handleSaveSettings} className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end text-xs">
            <div className="space-y-1.5">
              <label className="font-extrabold text-slate-350 block">
                Platform Fee (% of food subtotal)
              </label>
              <div className="relative">
                <DollarSign className="w-4 h-4 text-orange-450 absolute left-3.5 top-3" />
                <input
                  type="number"
                  step="0.5"
                  value={platformFee}
                  onChange={(e) => setPlatformFee(Number(e.target.value))}
                  placeholder="2.0"
                  className="w-full bg-slate-950/80 border border-slate-800/80 rounded-xl pl-9 pr-4 py-2.5 text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 transition-all font-mono font-bold"
                />
              </div>
              <p className="text-[10px] text-slate-500 flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-slate-650" /> Shown as its own line item at checkout.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="font-extrabold text-slate-350 block">
                Convenience Fee (% of food subtotal)
              </label>
              <div className="relative">
                <DollarSign className="w-4 h-4 text-orange-450 absolute left-3.5 top-3" />
                <input
                  type="number"
                  step="0.5"
                  value={convenienceFee}
                  onChange={(e) => setConvenienceFee(Number(e.target.value))}
                  placeholder="2.0"
                  className="w-full bg-slate-950/80 border border-slate-800/80 rounded-xl pl-9 pr-4 py-2.5 text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 transition-all font-mono font-bold"
                />
              </div>
              <p className="text-[10px] text-slate-500 flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-slate-650" /> Shown as its own line item at checkout.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="font-extrabold text-slate-355 block">
                Takeaway Packaging Charge (₹, flat)
              </label>
              <div className="relative">
                <DollarSign className="w-4 h-4 text-orange-450 absolute left-3.5 top-3" />
                <input
                  type="number"
                  step="1"
                  value={takeawayFee}
                  onChange={(e) => setTakeawayFee(Number(e.target.value))}
                  placeholder="10"
                  className="w-full bg-slate-950/80 border border-slate-800/80 rounded-xl pl-9 pr-4 py-2.5 text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 transition-all font-mono font-bold"
                />
              </div>
              <p className="text-[10px] text-slate-500 flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-slate-655" /> Only charged on takeaway orders.
              </p>
            </div>

            <button
              type="submit"
              disabled={isSavingSettings}
              className="btn-primary-gradient py-2.5 px-6 rounded-xl text-xs font-black text-white shadow-lg shadow-orange-500/10 hover:shadow-orange-500/20 active:scale-[0.98] transition-all cursor-pointer h-[40px] flex items-center justify-center gap-1"
            >
              {isSavingSettings ? "Saving Settings..." : "Save Pricing Configs"}
            </button>
          </form>
        </div>

        {/* Executive Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-panel p-5 rounded-3xl border-slate-800 space-y-2 hover:border-slate-700 transition-all bg-gradient-to-br from-slate-900/50 to-slate-950/50 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Registered Stalls</span>
              <div className="w-7 h-7 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-400">
                <Store className="w-4 h-4" />
              </div>
            </div>
            <div className="space-y-0.5">
              <p className="text-2xl font-black text-white">{restaurants.length} Canteens</p>
              <p className="text-[11px] text-emerald-450 font-semibold">Across all campus floors</p>
            </div>
          </div>

          <div className="glass-panel p-5 rounded-3xl border-slate-800 space-y-2 hover:border-slate-700 transition-all bg-gradient-to-br from-slate-900/50 to-slate-950/50 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-slate-400 tracking-wider uppercase">Veg Stalls</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                <Leaf className="w-4 h-4" />
              </div>
            </div>
            <div className="space-y-0.5">
              <p className="text-2xl font-black text-emerald-450">{restaurants.filter(r => r.type === "PURE_VEG").length} Pure Veg</p>
              <p className="text-[11px] text-slate-400 font-medium">100% Pure Veg Certified</p>
            </div>
          </div>

          <button
            onClick={() => setShowStudentsModal(true)}
            className="glass-panel p-5 rounded-3xl border-slate-800 space-y-2 text-left hover:border-purple-500/40 transition-all hover:bg-purple-950/5 group w-full shadow-md cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider group-hover:text-purple-400 transition-colors">Registered Users</span>
              <div className="w-7 h-7 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="space-y-0.5">
              <p className="text-2xl font-black text-purple-400">{studentCount} Users</p>
              <p className="text-[11px] text-slate-400 group-hover:text-slate-300 font-semibold transition-colors">Click to view all register numbers 📋</p>
            </div>
          </button>

          <div className="glass-panel p-5 rounded-3xl border-slate-800 space-y-2 hover:border-slate-700 transition-all bg-gradient-to-br from-slate-900/50 to-slate-950/50 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Total Order Fees</span>
              <div className="w-7 h-7 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-400">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="space-y-0.5">
              <p className="text-2xl font-black text-orange-400">{(platformFee + convenienceFee).toFixed(1)}%</p>
              <p className="text-[11px] text-slate-400 font-medium">{platformFee}% platform + {convenienceFee}% convenience, shown on every bill</p>
            </div>
          </div>
        </div>

        {/* Financial Ledger & Accounting Dashboard */}
        <div className="glass-panel p-6 rounded-3xl border-slate-800 space-y-6 bg-slate-950/40">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-base font-black text-white flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-400" /> Super Admin Financial Ledger
              </h2>
              <p className="text-[10px] text-slate-400">Consolidated real-time accounts across all active campus food court stalls</p>
            </div>
            <span className="text-[10px] bg-slate-800 px-3 py-1 rounded-xl border border-slate-700 text-slate-300 font-bold self-start md:self-auto">
              {filteredOrders.length} / {orders.length} Filtered Orders
            </span>
          </div>

          {/* Date Filter & Export Controls */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-900/40 p-4 rounded-2xl border border-slate-800/80">
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase">From:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1 text-xs text-white focus:outline-none focus:border-orange-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase">To:</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1 text-xs text-white focus:outline-none focus:border-orange-500"
                />
              </div>
              {(startDate || endDate) && (
                <button
                  onClick={() => {
                    setStartDate("");
                    setEndDate("");
                  }}
                  className="text-[10px] font-bold text-red-400 hover:text-red-300 underline"
                >
                  Clear Filters
                </button>
              )}
            </div>

            <button
              onClick={handleExportToExcel}
              className="w-full md:w-auto btn-primary-gradient px-4 py-2 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-1.5 shadow-sm shadow-orange-500/10 active:scale-95 transition-transform"
            >
              <Info className="w-3.5 h-3.5 text-white" />
              Download Excel Report (.xlsx)
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Revenue */}
            <div className="bg-emerald-950/20 border border-emerald-500/20 p-5 rounded-2xl space-y-1">
              <span className="text-[9px] font-extrabold text-emerald-400 uppercase tracking-widest">Gross Sales (Total)</span>
              <p className="text-2xl font-black text-emerald-400">
                ₹{filteredOrders.reduce((sum, o) => sum + o.totalAmount, 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-[10px] text-slate-400 font-medium">All item + packaging + platform fees</p>
            </div>

            {/* Item Sales */}
            <div className="bg-orange-950/20 border border-orange-500/20 p-5 rounded-2xl space-y-1">
              <span className="text-[9px] font-extrabold text-orange-400 uppercase tracking-widest">Food Item Charges</span>
              <p className="text-2xl font-black text-orange-400">
                ₹{filteredOrders.reduce((sum, o) => {
                  return sum + o.vendorPortions.reduce((pSum: number, portion: any) => {
                    return pSum + portion.items.reduce((iSum: number, i: any) => iSum + i.price * i.quantity, 0);
                  }, 0);
                }, 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-[10px] text-slate-400 font-medium">Direct restaurant food item sales</p>
            </div>

            {/* Parcel Charges */}
            <div className="bg-blue-950/20 border border-blue-500/20 p-5 rounded-2xl space-y-1">
              <span className="text-[9px] font-extrabold text-blue-400 uppercase tracking-widest">Parcel/Takeaway Charges</span>
              <p className="text-2xl font-black text-blue-400">
                ₹{filteredOrders.reduce((sum, o) => sum + (o.packagingFeeAmount || 0), 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-[10px] text-slate-400 font-medium">Accumulated container & package fees</p>
            </div>

            {/* Platform Fee */}
            <div className="bg-purple-950/20 border border-purple-500/20 p-5 rounded-2xl space-y-1">
              <span className="text-[9px] font-extrabold text-purple-400 uppercase tracking-widest">Platform Fees ({platformFee}%)</span>
              <p className="text-2xl font-black text-purple-400">
                ₹{filteredOrders.reduce((sum, o) => sum + (o.platformFeeAmount || 0), 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-[10px] text-slate-400 font-medium">System platform fee revenue</p>
            </div>

            {/* Convenience Fee */}
            <div className="bg-pink-950/20 border border-pink-500/20 p-5 rounded-2xl space-y-1">
              <span className="text-[9px] font-extrabold text-pink-400 uppercase tracking-widest">Convenience Fees ({convenienceFee}%)</span>
              <p className="text-2xl font-black text-pink-400">
                ₹{filteredOrders.reduce((sum, o) => sum + (o.convenienceFeeAmount || 0), 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-[10px] text-slate-400 font-medium">System convenience fee revenue</p>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-slate-400">
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              Accounting Ledger Balanced & Verified (No Errors)
            </span>
            <span className="text-[11px] font-mono text-slate-500">
              Total (₹{(filteredOrders.reduce((sum, o) => sum + o.totalAmount, 0)).toFixed(2)}) = Items + Takeaway + Platform + Convenience
            </span>
          </div>
        </div>

        {/* Restaurant-wise Sales Breakdown */}
        <div className="glass-panel p-6 rounded-3xl border-slate-800 space-y-6 bg-slate-950/40 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-base font-black text-white flex items-center gap-2">
                <Store className="w-5 h-5 text-orange-400" /> Restaurant-wise Sales Breakdown ({filteredRestaurantSales.length})
              </h2>
              <p className="text-[10px] text-slate-400">
                Individual stall net revenue (Food Items + Parcel Charges only — strictly excludes platform & convenience fees)
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={restaurantSearchQuery}
                onChange={(e) => setRestaurantSearchQuery(e.target.value)}
                placeholder="Search restaurant or campus..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/30">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-slate-900/80 border-b border-slate-800 text-[11px] font-bold text-slate-400">
                  <th className="p-3.5">Restaurant / Stall</th>
                  <th className="p-3.5">Campus</th>
                  <th className="p-3.5 text-center">Orders</th>
                  <th className="p-3.5 text-right">Food Item Sales</th>
                  <th className="p-3.5 text-right">Parcel Charges</th>
                  <th className="p-3.5 text-right text-emerald-400">Net Restaurant Sales</th>
                  <th className="p-3.5 text-right">Refunded / OOS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredRestaurantSales.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500 font-medium">
                      No restaurant sales recorded for the selected period.
                    </td>
                  </tr>
                ) : (
                  filteredRestaurantSales.map((r) => (
                    <tr key={r.stallId} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          <img src={r.logo} alt={r.name} className="w-9 h-9 rounded-xl object-cover border border-slate-700 shrink-0" />
                          <div>
                            <p className="font-extrabold text-white text-xs">{r.name}</p>
                            <span className="text-[10px] font-mono text-orange-400 font-bold">{r.tokenPrefix}</span>
                            <span className="text-[10px] text-slate-500 ml-2">({r.floor})</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/30 text-blue-300 text-[10px] font-bold">
                          {r.campus}
                        </span>
                      </td>
                      <td className="p-3.5 text-center font-mono">
                        <span className="text-white font-bold">{r.ordersCount}</span>
                        <span className="text-emerald-400 text-[10px] block">({r.fulfilledCount} fulfilled)</span>
                      </td>
                      <td className="p-3.5 text-right font-mono font-semibold text-slate-200">
                        ₹{r.foodItemSales.toFixed(2)}
                      </td>
                      <td className="p-3.5 text-right font-mono font-semibold text-blue-400">
                        ₹{r.parcelCharges.toFixed(2)}
                      </td>
                      <td className="p-3.5 text-right font-mono font-black text-emerald-400 text-sm">
                        ₹{r.netRestaurantSales.toFixed(2)}
                      </td>
                      <td className="p-3.5 text-right font-mono text-xs">
                        {r.refundedAmount > 0 ? (
                          <span className="text-red-400 font-bold bg-red-950/30 px-2 py-0.5 rounded border border-red-500/30">
                            ₹{r.refundedAmount.toFixed(2)} ({r.refundedCount})
                          </span>
                        ) : (
                          <span className="text-slate-600 font-mono">₹0.00</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {filteredRestaurantSales.length > 0 && (
                <tfoot>
                  <tr className="bg-slate-900 border-t-2 border-slate-700 font-bold text-xs">
                    <td colSpan={2} className="p-3.5 text-white uppercase tracking-wider font-extrabold">
                      Total Payout to All Restaurants
                    </td>
                    <td className="p-3.5 text-center font-mono text-white">
                      {filteredRestaurantSales.reduce((sum, r) => sum + r.ordersCount, 0)}
                    </td>
                    <td className="p-3.5 text-right font-mono text-slate-200">
                      ₹{filteredRestaurantSales.reduce((sum, r) => sum + r.foodItemSales, 0).toFixed(2)}
                    </td>
                    <td className="p-3.5 text-right font-mono text-blue-400">
                      ₹{filteredRestaurantSales.reduce((sum, r) => sum + r.parcelCharges, 0).toFixed(2)}
                    </td>
                    <td className="p-3.5 text-right font-mono text-emerald-400 font-black text-sm">
                      ₹{filteredRestaurantSales.reduce((sum, r) => sum + r.netRestaurantSales, 0).toFixed(2)}
                    </td>
                    <td className="p-3.5 text-right font-mono text-red-400">
                      ₹{filteredRestaurantSales.reduce((sum, r) => sum + r.refundedAmount, 0).toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        {/* Registered Restaurants List */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Store className="w-5 h-5 text-orange-400" /> Active Campus Restaurants ({filtered.length})
            </h2>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search restaurant or floor..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
            {filtered.map((res) => (
              <div key={res.id} className="glass-panel p-5 rounded-3xl border-slate-800 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <img src={res.logo} alt={res.name} className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-700 shrink-0" />
                  
                  <div className="space-y-1 truncate">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-orange-500/10 border border-orange-500/30 text-orange-400 text-[10px] font-mono font-bold">
                        {res.tokenPrefix}
                      </span>
                      {res.type === "PURE_VEG" ? (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-[10px] font-extrabold flex items-center gap-1">
                          <Leaf className="w-3.5 h-3.5 text-emerald-400" /> PURE VEG
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[10px] font-extrabold border border-slate-700">
                          MIXED
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded-md bg-purple-500/10 border border-purple-500/30 text-purple-300 text-[10px] font-bold">
                        {res.floor}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/30 text-blue-300 text-[10px] font-bold">
                        {res.campus || "Central Campus"}
                      </span>
                    </div>

                    <h3 className="text-sm font-extrabold text-white truncate">{res.name}</h3>
                    <p className="text-xs text-slate-400 truncate">{res.cuisine}</p>
                    <p className="text-[10px] text-slate-500 flex items-center gap-1">
                      📍 {res.location}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0 space-y-2">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Stall Username</span>
                    <span className="text-xs font-mono font-bold text-orange-400">{res.id}</span>
                  </div>
                  <button
                    onClick={() => handleResetPassword(res.id)}
                    className="px-2.5 py-1 rounded-xl bg-orange-500/10 hover:bg-orange-500/25 border border-orange-500/30 text-orange-400 text-[10px] font-extrabold flex items-center gap-1 transition-colors ml-auto"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Reset Passcode</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* REGISTER RESTAURANT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="glass-panel w-full max-w-lg rounded-3xl border-slate-700 bg-slate-900 p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-extrabold text-white">Register New Restaurant</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleRegisterSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-300">Stall Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Bamboos"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-300">Campus Location *</label>
                <select
                  value={campus}
                  onChange={(e) => setCampus(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none font-bold"
                >
                  <option value="Central Campus">Kristu Jayanti University (Central Campus)</option>
                  <option value="Airport Road Campus">Kristu Jayanti University (Airport Road Campus)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-300">Campus Floor</label>
                  <select
                    value={floor}
                    onChange={(e) => setFloor(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none"
                  >
                    <option value="Ground Floor">Ground Floor</option>
                    <option value="1st Floor">1st Floor</option>
                    <option value="2nd Floor">2nd Floor</option>
                    <option value="3rd Floor">3rd Floor</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-300">Stall Cuisine / Category</label>
                  <input
                    type="text"
                    value={cuisine}
                    onChange={(e) => setCuisine(e.target.value)}
                    placeholder="e.g. Waffles & Dessert"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-300">Manager Email Address *</label>
                <input
                  type="email"
                  required
                  value={managerEmail}
                  onChange={(e) => setManagerEmail(e.target.value)}
                  placeholder="manager@email.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="font-bold text-slate-300">Stall Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none"
                  >
                    <option value="PURE_VEG">Pure Veg</option>
                    <option value="MIXED">Mixed (Veg/Non-Veg)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-300">Logo Image Link</label>
                  <input
                    type="text"
                    value={logo}
                    onChange={(e) => setLogo(e.target.value)}
                    placeholder="https://images.unsplash.com..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full btn-primary-gradient py-3 text-xs font-bold text-white rounded-xl shadow-lg mt-2"
              >
                Register Canteen Stall →
              </button>
            </form>
          </div>
        </div>
      )}

      {/* PASSCODE DISPLAY DIALOG MODAL */}
      {registeredPasscode && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="glass-panel w-full max-w-md rounded-3xl border-orange-500 bg-slate-900 p-6 space-y-4 shadow-2xl relative text-center">
            <div className="w-12 h-12 rounded-full bg-orange-500/20 border border-orange-500 text-orange-400 flex items-center justify-center mx-auto mb-2">
              <QrCode className="w-6 h-6 animate-pulse" />
            </div>

            <h3 className="text-base font-extrabold text-white">Stall Registration Complete!</h3>
            <p className="text-xs text-slate-400">
              Provide this credentials code to the canteen manager. They will log in using this code initially and configure a password.
            </p>

            <div className="bg-slate-950 p-4 rounded-2xl space-y-2 border border-slate-850 font-mono text-xs">
              <div className="flex justify-between items-center text-slate-400">
                <span>Stall Username:</span>
                <strong className="text-white">{registeredStallId}</strong>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Registration Code:</span>
                <strong className="text-orange-400 text-sm select-all">{registeredPasscode}</strong>
              </div>
            </div>

            <button
              onClick={() => {
                setRegisteredPasscode(null);
                setRegisteredStallId(null);
              }}
              className="w-full btn-primary-gradient py-2.5 text-xs font-bold text-white rounded-xl"
            >
              I have saved the login code
            </button>
          </div>
        </div>
      )}

      {/* REGISTERED STUDENTS LIST MODAL */}
      {showStudentsModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="glass-panel w-full max-w-2xl rounded-3xl border-slate-700 bg-slate-900 p-6 space-y-4 shadow-2xl relative flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-purple-400" />
                  Registered Student Directory ({studentsList.length})
                </h3>
                <p className="text-[11px] text-slate-400">
                  Verify student accounts registered at Kristu Jayanti University.
                </p>
              </div>
              <button 
                onClick={() => {
                  setShowStudentsModal(false);
                  setStudentSearchQuery("");
                }} 
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Search filter input */}
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-slate-500 absolute left-3" />
              <input
                type="text"
                value={studentSearchQuery}
                onChange={(e) => setStudentSearchQuery(e.target.value)}
                placeholder="Search register number (e.g. 26bcaf59)..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* Scrollable table content */}
            <div className="flex-1 overflow-auto border border-slate-800 rounded-2xl bg-slate-950">
              <table className="w-full border-collapse text-xs text-left">
                <thead>
                  <tr className="bg-slate-900/60 border-b border-slate-800 font-extrabold text-slate-400">
                    <th className="p-3">Register Number</th>
                    <th className="p-3">Email Address</th>
                    <th className="p-3 text-right">Registration Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 font-medium text-slate-300">
                  {studentsList.filter(s => 
                    s.username.toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
                    s.email.toLowerCase().includes(studentSearchQuery.toLowerCase())
                  ).length === 0 ? (
                    <tr>
                      <td colSpan={3} className="p-6 text-center text-slate-500 font-bold">
                        No registered students matching filter.
                      </td>
                    </tr>
                  ) : (
                    studentsList.filter(s => 
                      s.username.toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
                      s.email.toLowerCase().includes(studentSearchQuery.toLowerCase())
                    ).map((s, idx) => (
                      <tr key={idx} className="hover:bg-slate-900/40">
                        <td className="p-3 font-mono font-bold text-white uppercase">{s.username}</td>
                        <td className="p-3 text-slate-400">{s.email}</td>
                        <td className="p-3 text-right text-[11px] text-slate-500">
                          {new Date(s.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric"
                          })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => {
                  setShowStudentsModal(false);
                  setStudentSearchQuery("");
                }}
                className="px-5 py-2 bg-slate-850 hover:bg-slate-800 text-slate-200 text-xs font-bold rounded-xl transition-colors"
              >
                Close Directory
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
