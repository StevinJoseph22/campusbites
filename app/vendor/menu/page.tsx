"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect } from "react";
import { VendorNav } from "@/components/VendorNav";
import { getActiveRestaurant, RestaurantAccount } from "@/lib/restaurants-data";
import { getSocket } from "@/lib/socket-client";
export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  prepTime: number;
  image: string;
  isVeg: boolean;
  takeawayCharge?: number;
  available: boolean;
  stockCount: number;
  stockType: "COUNTED" | "UNLIMITED";
  isBestseller?: boolean;
  availableFrom?: string;
  offerType?: string;
  offerValue?: number;
  variants?: string | null;
}

export interface MenuItemVariant {
  label: string;
  price: number;
}

import {
  Plus,
  Search,
  Edit3,
  Trash2,
  CheckCircle2,
  Download,
  Upload,
  Package
} from "lucide-react";

export default function VendorMenuPage() {
  const [activeVendor, setActiveVendor] = useState<RestaurantAccount | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Add Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [itemName, setItemName] = useState("");
  const [itemDesc, setItemDesc] = useState("");
  const [itemPrice, setItemPrice] = useState("");
  const [itemCategory, setItemCategory] = useState("Veg");
  const [itemPrepTime, setItemPrepTime] = useState("10");
  const [itemTakeawayCharge, setItemTakeawayCharge] = useState("10");
  const [itemStockCount, setItemStockCount] = useState("50");
  const [stockType, setStockType] = useState<"COUNTED" | "UNLIMITED">("COUNTED");
  const [itemImage, setItemImage] = useState("https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&h=200&fit=crop");
  const [isVeg, setIsVeg] = useState(true);
  const [itemAvailableFrom, setItemAvailableFrom] = useState("10:00 AM");
  const [itemOfferType, setItemOfferType] = useState("NONE");
  const [itemOfferValue, setItemOfferValue] = useState("0");

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  // Bulk CSV Import states
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [parsedItems, setParsedItems] = useState<any[]>([]);
  const [bulkImportLoading, setBulkImportLoading] = useState(false);

  const downloadTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8,Name,Description,Price,Category,PrepTime,TakeawayCharge,StockCount,StockType,IsVeg,AvailableFrom\n"
      + "Double Cheese Chicken Burger,Premium cheese chicken burger,149,Mains,10,10,50,COUNTED,false,10:00 AM\n"
      + "Paneer Tikka Roll,Grilled paneer stuffed roll,120,Rolls,8,5,999,UNLIMITED,true,10:00 AM\n"
      + "Chicken Biryani,Spicy lunch special chicken biryani,180,Mains,15,10,100,COUNTED,false,12:00 PM\n"
      + "Peri Peri Loaded Fries,Golden fries with seasoning,110,Sides,6,5,100,COUNTED,true,10:00 AM\n";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "canteen_menu_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split("\n").map(l => l.trim()).filter(l => l.length > 0);
      if (lines.length <= 1) {
        alert("Empty file or template has no data rows.");
        return;
      }

      const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
      const itemsList: any[] = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",").map(v => v.trim());
        if (values.length < headers.length) continue;

        const itemObj: any = {
          name: values[0] || "Unnamed Dish",
          description: values[1] || "",
          price: Number(values[2]) || 0,
          category: values[3] || "Mains",
          prepTime: Number(values[4]) || 10,
          takeawayCharge: Number(values[5]) || 10,
          stockCount: Number(values[6]) || 50,
          stockType: (values[7] || "COUNTED").toUpperCase() === "UNLIMITED" ? "UNLIMITED" : "COUNTED",
          isVeg: (values[8] || "true").toLowerCase() === "true",
          availableFrom: values[9] || "10:00 AM"
        };
        itemsList.push(itemObj);
      }

      setParsedItems(itemsList);
      setIsBulkModalOpen(true);
      e.target.value = "";
    };
    reader.readAsText(file);
  };

  const handleSaveBulkImport = async () => {
    if (!activeVendor) return;
    setBulkImportLoading(true);

    try {
      const res = await fetch("/api/menu/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId: activeVendor.id,
          items: parsedItems
        })
      });

      const data = await res.json();
      if (data.success) {
        setToastMessage(data.message);
        setIsBulkModalOpen(false);
        setParsedItems([]);
        fetchMenuFromDatabase(activeVendor.id);
      } else {
        alert("Failed to import items: " + data.error);
      }
    } catch (err: any) {
      alert("Import error: " + err.message);
    }
    setBulkImportLoading(false);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const updateParsedItemField = (index: number, field: string, value: any) => {
    const updated = [...parsedItems];
    updated[index] = { ...updated[index], [field]: value };
    setParsedItems(updated);
  };

  const deleteParsedRow = (index: number) => {
    const updated = parsedItems.filter((_, i) => i !== index);
    setParsedItems(updated);
  };

  const addParsedRow = () => {
    setParsedItems([
      ...parsedItems,
      {
        name: "New Dish",
        description: "",
        price: 100,
        category: "Mains",
        prepTime: 10,
        takeawayCharge: 10,
        stockCount: 50,
        stockType: "COUNTED",
        isVeg: true,
        availableFrom: "10:00 AM"
      }
    ]);
  };

  const fetchMenuFromDatabase = async (restaurantId: string) => {
    try {
      const res = await fetch(`/api/menu?restaurantId=${restaurantId}`);
      const data = await res.json();
      if (data.success) {
        setMenuItems(data.items);
      }
    } catch (e) {
      console.error("Failed to load menu from DB:", e);
    }
  };

  useEffect(() => {
    const currentId = typeof window !== "undefined" ? localStorage.getItem("campusbites_active_vendor_id") : null;

    const loadVendorDetailsAndMenu = async () => {
      let currentVendor = getActiveRestaurant();
      try {
        const res = await fetch("/api/restaurants");
        const data = await res.json();
        if (data.success && data.restaurants && currentId) {
          const found = data.restaurants.find((r: any) => r.id === currentId);
          if (found) {
            currentVendor = found;
          }
        }
      } catch (e) {
        console.error("Failed to fetch live restaurant details for menu page:", e);
      }

      setActiveVendor(currentVendor);
      fetchMenuFromDatabase(currentVendor.id);
    };

    loadVendorDetailsAndMenu();
  }, []);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeVendor || !itemName.trim() || !itemPrice) return;

    try {
      const res = await fetch("/api/menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId: activeVendor.id,
          name: itemName.trim(),
          description: itemDesc.trim(),
          price: Number(itemPrice),
          category: itemCategory,
          prepTime: Number(itemPrepTime),
          image: itemImage.trim(),
          isVeg,
          takeawayCharge: Number(itemTakeawayCharge) || 10,
          stockCount: stockType === "COUNTED" ? Number(itemStockCount) : 999,
          stockType,
          available: true,
          availableFrom: itemAvailableFrom || "10:00 AM",
          offerType: itemOfferType,
          offerValue: Number(itemOfferValue)
        })
      });

      const data = await res.json();
      if (data.success) {
        setToastMessage(`Added "${itemName}" to menu`);
        setIsAddModalOpen(false);
        setItemName("");
        setItemPrice("");
        setItemDesc("");
        setItemAvailableFrom("10:00 AM");
        setItemOfferType("NONE");
        setItemOfferValue("0");
        fetchMenuFromDatabase(activeVendor.id);

        try {
          const socket = getSocket();
          socket.emit("menu_update", { restaurantId: activeVendor.id });
        } catch (e) {
          console.error(e);
        }
      } else {
        alert("Failed to add menu item: " + data.error);
      }
    } catch (err) {
      console.error(err);
    }
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleEditItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeVendor || !editingItem) return;

    try {
      const res = await fetch("/api/menu", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingItem.id,
          name: editingItem.name,
          description: editingItem.description,
          price: Number(editingItem.price),
          category: editingItem.category,
          prepTime: Number(editingItem.prepTime),
          image: editingItem.image,
          isVeg: editingItem.isVeg,
          takeawayCharge: Number(editingItem.takeawayCharge),
          stockCount: Number(editingItem.stockCount),
          stockType: editingItem.stockType,
          available: editingItem.available,
          availableFrom: editingItem.availableFrom || "10:00 AM",
          isBestseller: editingItem.isBestseller,
          offerType: editingItem.offerType || "NONE",
          offerValue: Number(editingItem.offerValue) || 0
        })
      });

      const data = await res.json();
      if (data.success) {
        setToastMessage(`Updated "${editingItem.name}"`);
        setIsEditModalOpen(false);
        fetchMenuFromDatabase(activeVendor.id);

        try {
          const socket = getSocket();
          socket.emit("menu_update", { restaurantId: activeVendor.id });
        } catch (e) {
          console.error(e);
        }
      } else {
        alert("Failed to update item: " + data.error);
      }
    } catch (err) {
      console.error(err);
    }
    setTimeout(() => setToastMessage(null), 3000);
  };

  const updateStockQuickly = async (itemId: string, newStock: number) => {
    if (!activeVendor) return;
    try {
      const res = await fetch("/api/menu", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: itemId,
          stockCount: newStock
        })
      });
      const data = await res.json();
      if (data.success) {
        fetchMenuFromDatabase(activeVendor.id);
        try {
          getSocket().emit("menu_update", { restaurantId: activeVendor.id });
        } catch (e) {}
      }
    } catch (e) {
      console.error(e);
    }
  };

  const toggleAvailability = async (itemId: string, currentAvailable: boolean) => {
    if (!activeVendor) return;
    try {
      const res = await fetch("/api/menu", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: itemId,
          available: !currentAvailable
        })
      });
      const data = await res.json();
      if (data.success) {
        fetchMenuFromDatabase(activeVendor.id);
        try {
          getSocket().emit("menu_update", { restaurantId: activeVendor.id });
        } catch (e) {}
      }
    } catch (e) {
      console.error(e);
    }
  };

  const deleteItem = async (itemId: string) => {
    if (!activeVendor) return;
    if (!confirm("Are you sure you want to delete this menu item?")) return;

    try {
      const res = await fetch(`/api/menu?id=${itemId}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (data.success) {
        setToastMessage("Item deleted");
        fetchMenuFromDatabase(activeVendor.id);
        try {
          getSocket().emit("menu_update", { restaurantId: activeVendor.id });
        } catch (e) {}
      }
    } catch (e) {
      console.error(e);
    }
    setTimeout(() => setToastMessage(null), 3000);
  };

  if (!activeVendor) return null;

  const filtered = menuItems.filter(i => i.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="min-h-screen bg-paper text-ink flex flex-col pb-12">
      <VendorNav />

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-ink flex items-center gap-2">
              <Package className="w-5 h-5 text-marigold" /> Menu & Stock
            </h2>
            <p className="text-xs text-ink-soft">Add dishes, update prices, and manage daily stock.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
            <button
              onClick={downloadTemplate}
              className="px-3.5 py-2 rounded bg-cardstock border border-ink/15 text-ink-soft hover:text-ink flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Template</span>
            </button>

            <label className="px-3.5 py-2 rounded bg-cardstock border border-ink/15 text-ink-soft hover:text-ink flex items-center gap-1.5 transition-colors cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              <span>Upload CSV</span>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-marigold hover:bg-marigold-hover px-4 py-2 rounded text-white font-bold flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Dish</span>
            </button>
          </div>
        </div>

        {/* Toast Alert */}
        {toastMessage && (
          <div className="card-surface p-4 border-sage/30 bg-sage-soft text-sage text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="w-3.5 h-3.5 text-ink-soft absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search dishes in menu..."
            className="w-full card-surface pl-9 pr-3 py-2 text-xs text-ink placeholder-ink-soft focus:outline-none"
          />
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item) => (
            <div key={item.id} className="card-surface p-4 flex flex-col justify-between space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${
                    item.isVeg ? "bg-sage-soft text-sage border-sage/30" : "bg-chili-soft text-chili border-chili/30"
                  }`}>
                    {item.isVeg ? "VEG" : "NON-VEG"}
                  </span>
                  <div className="flex items-center gap-1.5 font-mono">
                    {item.offerType && item.offerType !== "NONE" && item.offerValue && item.offerValue > 0 ? (
                      <>
                        <span className="text-[10px] text-ink-soft line-through">₹{item.price}</span>
                        <span className="text-sm font-bold text-marigold">
                          ₹{(item.offerType === "PERCENTAGE"
                            ? Math.max(0, item.price - (item.price * item.offerValue / 100))
                            : Math.max(0, item.price - item.offerValue)
                          ).toFixed(2)}
                        </span>
                      </>
                    ) : (
                      <span className="text-sm font-bold text-marigold">₹{item.price}</span>
                    )}
                  </div>
                </div>

                <h3 className="text-sm font-bold text-ink">{item.name}</h3>
                <p className="text-xs text-ink-soft line-clamp-2">{item.description}</p>

                <div className="pt-2 border-t border-ink/10 text-xs space-y-2">
                  <div className="flex justify-between items-center text-ink-soft">
                    <span>Stock Type</span>
                    <span className="font-semibold text-ink">{item.stockType}</span>
                  </div>

                  {item.stockType === "COUNTED" && (
                    <div className="flex justify-between items-center text-ink-soft">
                      <span>Daily Stock</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => updateStockQuickly(item.id, Math.max(0, item.stockCount - 5))}
                          className="w-6 h-6 rounded bg-cardstock border border-ink/15 flex items-center justify-center font-bold hover:bg-cardstock-hover text-[10px]"
                        >
                          -5
                        </button>
                        <span className="font-bold text-ink font-mono">{item.stockCount}</span>
                        <button
                          onClick={() => updateStockQuickly(item.id, item.stockCount + 5)}
                          className="w-6 h-6 rounded bg-cardstock border border-ink/15 flex items-center justify-center font-bold hover:bg-cardstock-hover text-[10px]"
                        >
                          +5
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-ink/10 flex items-center justify-between gap-2">
                <button
                  onClick={() => toggleAvailability(item.id, item.available)}
                  className={`px-3 py-1.5 rounded text-xs font-bold border transition-colors ${
                    item.available ? "bg-sage-soft border-sage/30 text-sage" : "bg-chili-soft border-chili/30 text-chili"
                  }`}
                >
                  {item.available ? "Available" : "Out of Stock"}
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      setEditingItem({
                        ...item,
                        description: item.description || "",
                        takeawayCharge: item.takeawayCharge ?? 10,
                        offerType: item.offerType || "NONE",
                        offerValue: item.offerValue ?? 0,
                        isBestseller: item.isBestseller ?? false
                      });
                      setIsEditModalOpen(true);
                    }}
                    className="p-2 rounded bg-cardstock border border-ink/15 text-ink-soft hover:text-ink"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => deleteItem(item.id)}
                    className="p-2 rounded bg-cardstock border border-ink/15 text-ink-soft hover:text-chili"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* ADD DISH MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card-surface w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-ink/10 pb-3">
              <h3 className="text-base font-bold text-ink">Add New Dish</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-ink-soft hover:text-ink">✕</button>
            </div>

            <form onSubmit={handleAddItem} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-ink-soft">Dish Name *</label>
                <input
                  type="text"
                  required
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder="e.g. Cheese Burst Paneer Wrap"
                  className="w-full bg-paper border border-ink/15 rounded p-2.5 text-ink focus:outline-none focus:border-marigold"
                />
              </div>

              <div>
                <label className="font-bold text-ink-soft">Description</label>
                <input
                  type="text"
                  value={itemDesc}
                  onChange={(e) => setItemDesc(e.target.value)}
                  placeholder="Short description"
                  className="w-full bg-paper border border-ink/15 rounded p-2.5 text-ink focus:outline-none focus:border-marigold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-ink-soft">Price (₹) *</label>
                  <input
                    type="number"
                    required
                    value={itemPrice}
                    onChange={(e) => setItemPrice(e.target.value)}
                    placeholder="120"
                    className="w-full bg-paper border border-ink/15 rounded p-2.5 text-ink focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-ink-soft">Daily Stock Count</label>
                  <input
                    type="number"
                    value={itemStockCount}
                    onChange={(e) => setItemStockCount(e.target.value)}
                    placeholder="50"
                    className="w-full bg-paper border border-ink/15 rounded p-2.5 text-ink focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-ink-soft">Stock Type</label>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setStockType("COUNTED")}
                    className={`p-2 rounded border font-bold ${stockType === "COUNTED" ? "bg-marigold/10 border-marigold text-marigold" : "bg-paper border-ink/15 text-ink-soft"}`}
                  >
                    Counted
                  </button>
                  <button
                    type="button"
                    onClick={() => setStockType("UNLIMITED")}
                    className={`p-2 rounded border font-bold ${stockType === "UNLIMITED" ? "bg-marigold/10 border-marigold text-marigold" : "bg-paper border-ink/15 text-ink-soft"}`}
                  >
                    Unlimited
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="addIsVeg"
                  checked={isVeg}
                  onChange={(e) => setIsVeg(e.target.checked)}
                  className="w-4 h-4 rounded border-ink/20"
                />
                <label htmlFor="addIsVeg" className="font-bold text-ink-soft">Pure Veg</label>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-ink-soft">Discount Type</label>
                  <select
                    value={itemOfferType}
                    onChange={(e) => setItemOfferType(e.target.value)}
                    className="w-full bg-paper border border-ink/15 rounded p-2.5 text-ink focus:outline-none focus:border-marigold"
                  >
                    <option value="NONE">No Discount</option>
                    <option value="PERCENTAGE">Percentage (%) OFF</option>
                    <option value="FLAT">Flat Amount (₹) OFF</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-ink-soft">Offer Value</label>
                  <input
                    type="number"
                    value={itemOfferValue}
                    onChange={(e) => setItemOfferValue(e.target.value)}
                    placeholder="e.g. 10 or 5"
                    className="w-full bg-paper border border-ink/15 rounded p-2.5 text-ink focus:outline-none focus:border-marigold"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-ink-soft">Available From</label>
                <input
                  type="text"
                  required
                  value={itemAvailableFrom}
                  onChange={(e) => setItemAvailableFrom(e.target.value)}
                  placeholder="e.g. 10:00 AM, 12:00 PM"
                  className="w-full bg-paper border border-ink/15 rounded p-2.5 text-ink focus:outline-none focus:border-marigold"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-marigold hover:bg-marigold-hover py-3 text-xs font-bold text-white rounded mt-2 transition-colors"
              >
                Add Dish to Menu →
              </button>
            </form>
          </div>
        </div>
      )}

      {/* EDIT DISH MODAL */}
      {isEditModalOpen && editingItem && (
        <div className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card-surface w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-ink/10 pb-3">
              <h3 className="text-base font-bold text-ink">Edit Dish</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-ink-soft hover:text-ink">✕</button>
            </div>

            <form onSubmit={handleEditItemSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-ink-soft">Dish Name *</label>
                <input
                  type="text"
                  required
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                  className="w-full bg-paper border border-ink/15 rounded p-2.5 text-ink focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-ink-soft">Description</label>
                <textarea
                  rows={2}
                  value={editingItem.description}
                  onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                  className="w-full bg-paper border border-ink/15 rounded p-2.5 text-ink focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-ink-soft">Price (₹) *</label>
                  <input
                    type="number"
                    required
                    value={editingItem.price}
                    onChange={(e) => setEditingItem({ ...editingItem, price: Number(e.target.value) })}
                    className="w-full bg-paper border border-ink/15 rounded p-2.5 text-ink focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-ink-soft">Daily Stock Count</label>
                  <input
                    type="number"
                    value={editingItem.stockCount}
                    onChange={(e) => setEditingItem({ ...editingItem, stockCount: Number(e.target.value) })}
                    className="w-full bg-paper border border-ink/15 rounded p-2.5 text-ink focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-ink-soft">Stock Type</label>
                  <select
                    value={editingItem.stockType}
                    onChange={(e) => setEditingItem({ ...editingItem, stockType: e.target.value as any })}
                    className="w-full bg-paper border border-ink/15 rounded p-2.5 text-ink focus:outline-none"
                  >
                    <option value="COUNTED">Counted</option>
                    <option value="UNLIMITED">Unlimited</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-ink-soft">Category</label>
                  <select
                    value={editingItem.category}
                    onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                    className="w-full bg-paper border border-ink/15 rounded p-2.5 text-ink focus:outline-none"
                  >
                    <option value="Veg">Veg</option>
                    <option value="Non-Veg">Non-Veg</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-ink-soft">Takeaway Container Fee (₹)</label>
                <input
                  type="number"
                  value={editingItem.takeawayCharge}
                  onChange={(e) => setEditingItem({ ...editingItem, takeawayCharge: Number(e.target.value) })}
                  className="w-full bg-paper border border-ink/15 rounded p-2.5 text-ink focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="editIsVeg"
                  checked={editingItem.isVeg}
                  onChange={(e) => setEditingItem({ ...editingItem, isVeg: e.target.checked })}
                  className="w-4 h-4 rounded border-ink/20"
                />
                <label htmlFor="editIsVeg" className="font-bold text-ink-soft">Pure Veg</label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="editIsBestseller"
                  checked={editingItem.isBestseller}
                  onChange={(e) => setEditingItem({ ...editingItem, isBestseller: e.target.checked })}
                  className="w-4 h-4 rounded border-ink/20"
                />
                <label htmlFor="editIsBestseller" className="font-bold text-ink-soft">Highlight as Bestseller</label>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-ink-soft">Discount Type</label>
                  <select
                    value={editingItem.offerType || "NONE"}
                    onChange={(e) => setEditingItem({ ...editingItem, offerType: e.target.value })}
                    className="w-full bg-paper border border-ink/15 rounded p-2.5 text-ink focus:outline-none focus:border-marigold"
                  >
                    <option value="NONE">No Discount</option>
                    <option value="PERCENTAGE">Percentage (%) OFF</option>
                    <option value="FLAT">Flat Amount (₹) OFF</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-ink-soft">Offer Value</label>
                  <input
                    type="number"
                    value={editingItem.offerValue || 0}
                    onChange={(e) => setEditingItem({ ...editingItem, offerValue: Number(e.target.value) })}
                    className="w-full bg-paper border border-ink/15 rounded p-2.5 text-ink focus:outline-none focus:border-marigold"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-ink-soft">Available From</label>
                <input
                  type="text"
                  required
                  value={editingItem.availableFrom || "10:00 AM"}
                  onChange={(e) => setEditingItem({ ...editingItem, availableFrom: e.target.value })}
                  placeholder="e.g. 10:00 AM, 12:00 PM"
                  className="w-full bg-paper border border-ink/15 rounded p-2.5 text-ink focus:outline-none focus:border-marigold"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-marigold hover:bg-marigold-hover py-3 text-xs font-bold text-white rounded mt-2 transition-colors"
              >
                Save Changes →
              </button>
            </form>
          </div>
        </div>
      )}

      {/* BULK IMPORT CONFIRMATION MODAL */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card-surface w-full max-w-6xl p-6 space-y-4 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-ink/10 pb-3">
              <div>
                <h3 className="text-base font-bold text-ink flex items-center gap-2">
                  <Upload className="w-4 h-4 text-marigold" />
                  Verify CSV Import ({parsedItems.length} items)
                </h3>
                <p className="text-[11px] text-ink-soft">Review and edit rows before importing.</p>
              </div>
              <button onClick={() => setIsBulkModalOpen(false)} className="text-ink-soft hover:text-ink">✕</button>
            </div>

            <div className="flex-1 overflow-auto border border-ink/10 rounded">
              <table className="w-full border-collapse text-xs text-left min-w-[900px]">
                <thead>
                  <tr className="bg-cardstock border-b border-ink/10 font-bold text-ink-soft">
                    <th className="p-3">Dish Name *</th>
                    <th className="p-3">Description</th>
                    <th className="p-3 w-20">Price (₹) *</th>
                    <th className="p-3 w-28">Category</th>
                    <th className="p-3 w-24">Prep (Min)</th>
                    <th className="p-3 w-28">Stock Count</th>
                    <th className="p-3 w-28">Stock Type</th>
                    <th className="p-3 w-24">Is Veg</th>
                    <th className="p-3 w-28">Available From</th>
                    <th className="p-3 w-16 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/10">
                  {parsedItems.map((item, index) => (
                    <tr key={index} className="hover:bg-cardstock-hover">
                      <td className="p-2">
                        <input
                          type="text"
                          required
                          value={item.name}
                          onChange={(e) => updateParsedItemField(index, "name", e.target.value)}
                          className="w-full bg-paper border border-ink/15 rounded p-1.5 text-ink"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => updateParsedItemField(index, "description", e.target.value)}
                          className="w-full bg-paper border border-ink/15 rounded p-1.5 text-ink"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          required
                          value={item.price}
                          onChange={(e) => updateParsedItemField(index, "price", Number(e.target.value))}
                          className="w-full bg-paper border border-ink/15 rounded p-1.5 text-ink"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={item.category}
                          onChange={(e) => updateParsedItemField(index, "category", e.target.value)}
                          className="w-full bg-paper border border-ink/15 rounded p-1.5 text-ink"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          value={item.prepTime}
                          onChange={(e) => updateParsedItemField(index, "prepTime", Number(e.target.value))}
                          className="w-full bg-paper border border-ink/15 rounded p-1.5 text-ink"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          disabled={item.stockType === "UNLIMITED"}
                          value={item.stockType === "UNLIMITED" ? "" : item.stockCount}
                          onChange={(e) => updateParsedItemField(index, "stockCount", Number(e.target.value))}
                          className="w-full bg-paper border border-ink/15 rounded p-1.5 text-ink disabled:opacity-40"
                        />
                      </td>
                      <td className="p-2">
                        <select
                          value={item.stockType}
                          onChange={(e) => updateParsedItemField(index, "stockType", e.target.value)}
                          className="w-full bg-paper border border-ink/15 rounded p-1.5 text-ink"
                        >
                          <option value="COUNTED">Counted</option>
                          <option value="UNLIMITED">Unlimited</option>
                        </select>
                      </td>
                      <td className="p-2">
                        <select
                          value={String(item.isVeg)}
                          onChange={(e) => updateParsedItemField(index, "isVeg", e.target.value === "true")}
                          className="w-full bg-paper border border-ink/15 rounded p-1.5 text-ink"
                        >
                          <option value="true">Veg</option>
                          <option value="false">Non-Veg</option>
                        </select>
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={item.availableFrom || "10:00 AM"}
                          onChange={(e) => updateParsedItemField(index, "availableFrom", e.target.value)}
                          placeholder="e.g. 12:00 PM"
                          className="w-full bg-paper border border-ink/15 rounded p-1.5 text-ink"
                        />
                      </td>
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => deleteParsedRow(index)}
                          className="p-1.5 text-chili hover:bg-chili-soft rounded transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between border-t border-ink/10 pt-3">
              <button
                type="button"
                onClick={addParsedRow}
                className="px-4 py-2 bg-cardstock hover:bg-cardstock-hover text-ink text-xs font-bold rounded flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Row</span>
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsBulkModalOpen(false)}
                  className="px-4 py-2 bg-cardstock hover:bg-cardstock-hover text-ink-soft text-xs font-bold rounded transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveBulkImport}
                  disabled={bulkImportLoading || parsedItems.length === 0}
                  className="bg-marigold hover:bg-marigold-hover px-6 py-2 rounded text-xs font-bold text-white flex items-center gap-1.5 disabled:opacity-40 transition-colors"
                >
                  {bulkImportLoading ? "Importing..." : "Confirm & Import"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
