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
}

export interface VendorOffer {
  id: string;
  title: string;
  discountBadge: string;
  description: string;
  price: number;
  active: boolean;
}
import { 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Leaf, 
  Flame, 
  Clock,
  Sparkles,
  X,
  Tag,
  Package,
  CheckCircle2,
  Download,
  Upload
} from "lucide-react";

export default function VendorMenuPage() {
  const [activeVendor, setActiveVendor] = useState<RestaurantAccount | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [offers, setOffers] = useState<VendorOffer[]>([]);
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

  // Offer Modal State
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [offerTitle, setOfferTitle] = useState("");
  const [offerBadge, setOfferBadge] = useState("20% OFF");
  const [offerDesc, setOfferDesc] = useState("");
  const [offerPrice, setOfferPrice] = useState("199");

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
        setToastMessage(`✓ ${data.message}`);
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

  // Fetch Menu from Database
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

      try {
        const savedOffers = localStorage.getItem(`campusbites_offers_${currentVendor.id}`);
        if (savedOffers) setOffers(JSON.parse(savedOffers));
      } catch (e) {}
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
        setToastMessage(`✓ Added "${itemName}" to menu!`);
        setIsAddModalOpen(false);
        // Reset form
        setItemName("");
        setItemPrice("");
        setItemDesc("");
        setItemAvailableFrom("10:00 AM");
        setItemOfferType("NONE");
        setItemOfferValue("0");
        fetchMenuFromDatabase(activeVendor.id);
        
        // Broadcast update to students instantly
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
        setToastMessage(`✓ Updated "${editingItem.name}" menu details!`);
        setIsEditModalOpen(false);
        fetchMenuFromDatabase(activeVendor.id);

        // Broadcast update to students instantly
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
        setToastMessage("✓ Stock updated!");
        fetchMenuFromDatabase(activeVendor.id);
        try {
          getSocket().emit("menu_update", { restaurantId: activeVendor.id });
        } catch (e) {}
      }
    } catch (e) {
      console.error(e);
    }
    setTimeout(() => setToastMessage(null), 2000);
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
        setToastMessage("✓ Item deleted");
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

  const handleAddOffer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!offerTitle.trim()) return;

    const newOffer: VendorOffer = {
      id: `off-${Date.now()}`,
      title: offerTitle.trim(),
      discountBadge: offerBadge.trim(),
      description: offerDesc.trim(),
      price: Number(offerPrice) || 199,
      active: true
    };

    const updatedOffers = [newOffer, ...offers];
    setOffers(updatedOffers);
    if (activeVendor) {
      localStorage.setItem(`campusbites_offers_${activeVendor.id}`, JSON.stringify(updatedOffers));
      localStorage.setItem(`campusbites_all_offers`, JSON.stringify(updatedOffers));
    }
    setIsOfferModalOpen(false);
    setOfferTitle("");
    setToastMessage(`🎉 Special Offer "${newOffer.title}" is now LIVE!`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  if (!activeVendor) return null;

  const filtered = menuItems.filter(i => i.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="min-h-screen bg-campus-mesh text-slate-100 flex flex-col pb-12">
      <VendorNav />

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white flex items-center gap-2">
              <Package className="w-6 h-6 text-orange-400" /> Canteen Menu & Stock Manager
            </h2>
            <p className="text-xs text-slate-400">
              Configure daily opening stock, edit dish details, categories, prices, and adjust availability in real-time.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
            <button
              onClick={downloadTemplate}
              className="px-3.5 py-2 rounded-xl bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 hover:text-white flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Excel Template</span>
            </button>

            <label className="px-3.5 py-2 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Excel (CSV)</span>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            <button
              onClick={() => setIsOfferModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-purple-600/20 border border-purple-500/40 text-purple-300 hover:text-white flex items-center gap-1.5 transition-colors"
            >
              <Tag className="w-3.5 h-3.5 text-purple-400" />
              <span>+ Add Special Combo</span>
            </button>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="btn-primary-gradient px-4 py-2 rounded-xl text-white font-bold flex items-center gap-1.5 shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Add Dish</span>
            </button>
          </div>
        </div>

        {/* Toast Alert */}
        {toastMessage && (
          <div className="glass-panel p-4 rounded-2xl border-emerald-500/50 bg-emerald-500/20 text-white text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Search */}
        <div className="glass-panel p-4 rounded-2xl border-slate-800">
          <div className="relative max-w-sm">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search dishes in menu..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
            />
          </div>
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((item) => {
            const isOutOfStock = !item.available || (item.stockType === "COUNTED" && item.stockCount <= 0);

            return (
              <div key={item.id} className="glass-panel rounded-3xl p-5 border border-slate-800 flex flex-col justify-between space-y-4 shadow-xl">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                      item.isVeg ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30" : "bg-red-500/10 text-red-400 border border-red-500/30"
                    }`}>
                      {item.isVeg ? "PURE VEG" : "NON-VEG"}
                    </span>
                    <div className="flex items-center gap-1.5 font-mono">
                      {item.offerType && item.offerType !== "NONE" && item.offerValue && item.offerValue > 0 ? (
                        <>
                          <span className="text-[10px] text-slate-500 line-through">₹{item.price}</span>
                          <span className="text-sm font-black text-orange-400">
                            ₹{(item.offerType === "PERCENTAGE" 
                              ? Math.max(0, item.price - (item.price * item.offerValue / 100))
                              : Math.max(0, item.price - item.offerValue)
                            ).toFixed(2)}
                          </span>
                        </>
                      ) : (
                        <span className="text-sm font-black text-orange-400">₹{item.price}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-extrabold text-white">{item.name}</h3>
                    {item.offerType && item.offerType !== "NONE" && item.offerValue && item.offerValue > 0 && (
                      <span className="px-2 py-0.5 rounded-md bg-purple-500/20 border border-purple-500/40 text-purple-300 text-[9px] font-black tracking-wide uppercase">
                        🏷️ {item.offerType === "PERCENTAGE" ? `${item.offerValue}% OFF` : `₹${item.offerValue} OFF`}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-2">{item.description}</p>

                  <div className="pt-2 border-t border-slate-900 text-xs space-y-2">
                    {/* Live Stock adjustment */}
                    <div className="flex justify-between items-center text-slate-300">
                      <span>Stock Type:</span>
                      <span className="font-semibold text-slate-200">{item.stockType}</span>
                    </div>

                    <div className="flex justify-between items-center text-slate-300">
                      <span>Daily Stock Count:</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => updateStockQuickly(item.id, Math.max(0, item.stockCount - 5))}
                          className="w-6 h-6 rounded bg-slate-850 border border-slate-800 flex items-center justify-center font-bold hover:bg-slate-800 text-[10px]"
                        >
                          -5
                        </button>
                        <span className="font-bold text-white font-mono">{item.stockCount} Pcs</span>
                        <button
                          onClick={() => updateStockQuickly(item.id, item.stockCount + 5)}
                          className="w-6 h-6 rounded bg-slate-850 border border-slate-800 flex items-center justify-center font-bold hover:bg-slate-800 text-[10px]"
                        >
                          +5
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between gap-2">
                  <button
                    onClick={() => toggleAvailability(item.id, item.available)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                      item.available ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-red-500/10 border-red-500/30 text-red-400"
                    }`}
                  >
                    {item.available ? "✓ Available" : "Out of Stock"}
                  </button>

                  <div className="flex items-center gap-2">
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
                      className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteItem(item.id)}
                      className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-500 hover:text-red-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* ADD DISH MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="glass-panel w-full max-w-md rounded-3xl border-slate-700 bg-slate-900 p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-extrabold text-white">Add New Dish</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleAddItem} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-300">Dish Name *</label>
                <input
                  type="text"
                  required
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder="e.g. Cheese Burst Paneer Wrap"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-300">Price (₹) *</label>
                  <input
                    type="number"
                    required
                    value={itemPrice}
                    onChange={(e) => setItemPrice(e.target.value)}
                    placeholder="120"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-300">Daily Stock Count</label>
                  <input
                    type="number"
                    value={itemStockCount}
                    onChange={(e) => setItemStockCount(e.target.value)}
                    placeholder="50"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-300">Stock Type</label>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setStockType("COUNTED")}
                    className={`p-2 rounded-xl border font-bold ${stockType === "COUNTED" ? "bg-orange-500/20 border-orange-500 text-orange-400" : "bg-slate-950 border-slate-800 text-slate-400"}`}
                  >
                    Counted (Pieces)
                  </button>
                  <button
                    type="button"
                    onClick={() => setStockType("UNLIMITED")}
                    className={`p-2 rounded-xl border font-bold ${stockType === "UNLIMITED" ? "bg-purple-500/20 border-purple-500 text-purple-300" : "bg-slate-950 border-slate-800 text-slate-400"}`}
                  >
                    Unlimited (Live Prep)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-300">Discount Offer Type</label>
                  <select
                    value={itemOfferType}
                    onChange={(e) => setItemOfferType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-orange-500"
                  >
                    <option value="NONE">No Discount</option>
                    <option value="PERCENTAGE">Percentage (%) OFF</option>
                    <option value="FLAT">Flat Amount (₹) OFF</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-300">Offer Value (% or ₹)</label>
                  <input
                    type="number"
                    value={itemOfferValue}
                    onChange={(e) => setItemOfferValue(e.target.value)}
                    placeholder="e.g. 10 or 5"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-300">Available From (Constraint, e.g., 12:00 PM)</label>
                <input
                  type="text"
                  required
                  value={itemAvailableFrom}
                  onChange={(e) => setItemAvailableFrom(e.target.value)}
                  placeholder="e.g. 10:00 AM, 12:00 PM"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <button
                type="submit"
                className="w-full btn-primary-gradient py-3 text-xs font-bold text-white rounded-xl shadow-lg mt-2"
              >
                Add Dish to Menu →
              </button>
            </form>
          </div>
        </div>
      )}

      {/* EDIT DISH MODAL */}
      {isEditModalOpen && editingItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="glass-panel w-full max-w-md rounded-3xl border-slate-700 bg-slate-900 p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-extrabold text-white">Edit Canteen Dish</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleEditItemSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-300">Dish Name *</label>
                <input
                  type="text"
                  required
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                  placeholder="Dish Name"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-300">Description</label>
                <textarea
                  rows={2}
                  value={editingItem.description}
                  onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                  placeholder="Dish Description"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-300">Price (₹) *</label>
                  <input
                    type="number"
                    required
                    value={editingItem.price}
                    onChange={(e) => setEditingItem({ ...editingItem, price: Number(e.target.value) })}
                    placeholder="Price"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-300">Daily Stock Count</label>
                  <input
                    type="number"
                    value={editingItem.stockCount}
                    onChange={(e) => setEditingItem({ ...editingItem, stockCount: Number(e.target.value) })}
                    placeholder="Stock Count"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-300">Stock Type</label>
                  <select
                    value={editingItem.stockType}
                    onChange={(e) => setEditingItem({ ...editingItem, stockType: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none"
                  >
                    <option value="COUNTED">Counted (Pieces)</option>
                    <option value="UNLIMITED">Unlimited (Live Prep)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-300">Category</label>
                  <select
                    value={editingItem.category}
                    onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none"
                  >
                    <option value="Veg">Veg</option>
                    <option value="Non-Veg">Non-Veg</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-300">Takeaway Container Fee (₹)</label>
                <input
                  type="number"
                  value={editingItem.takeawayCharge}
                  onChange={(e) => setEditingItem({ ...editingItem, takeawayCharge: Number(e.target.value) })}
                  placeholder="Takeaway Charge"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="editIsVeg"
                  checked={editingItem.isVeg}
                  onChange={(e) => setEditingItem({ ...editingItem, isVeg: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-800 bg-slate-950 text-orange-500 focus:ring-0 focus:ring-offset-0"
                />
                <label htmlFor="editIsVeg" className="font-bold text-slate-300">Pure Veg Certified</label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="editIsBestseller"
                  checked={editingItem.isBestseller}
                  onChange={(e) => setEditingItem({ ...editingItem, isBestseller: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-800 bg-slate-950 text-orange-500 focus:ring-0 focus:ring-offset-0"
                />
                <label htmlFor="editIsBestseller" className="font-bold text-slate-300">Highlight as Bestseller</label>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-300">Discount Offer Type</label>
                  <select
                    value={editingItem.offerType || "NONE"}
                    onChange={(e) => setEditingItem({ ...editingItem, offerType: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-orange-500"
                  >
                    <option value="NONE">No Discount</option>
                    <option value="PERCENTAGE">Percentage (%) OFF</option>
                    <option value="FLAT">Flat Amount (₹) OFF</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-300">Offer Value (% or ₹)</label>
                  <input
                    type="number"
                    value={editingItem.offerValue || 0}
                    onChange={(e) => setEditingItem({ ...editingItem, offerValue: Number(e.target.value) })}
                    placeholder="e.g. 10 or 5"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-300">Available From (Constraint, e.g., 12:00 PM)</label>
                <input
                  type="text"
                  required
                  value={editingItem.availableFrom || "10:00 AM"}
                  onChange={(e) => setEditingItem({ ...editingItem, availableFrom: e.target.value })}
                  placeholder="e.g. 10:00 AM, 12:00 PM"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <button
                type="submit"
                className="w-full btn-primary-gradient py-3 text-xs font-bold text-white rounded-xl shadow-lg mt-2"
              >
                Save Menu Item Changes →
              </button>
            </form>
          </div>
        </div>
      )}

      {/* SPECIAL COMBO MODAL */}
      {isOfferModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="glass-panel w-full max-w-md rounded-3xl border-slate-700 bg-slate-900 p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-extrabold text-white">Create Combo Offer</h3>
              <button onClick={() => setIsOfferModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleAddOffer} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-300">Combo Title *</label>
                <input
                  type="text"
                  required
                  value={offerTitle}
                  onChange={(e) => setOfferTitle(e.target.value)}
                  placeholder="e.g. Kristu Special Burger Feast"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-300">Discount Tag Badge</label>
                  <input
                    type="text"
                    value={offerBadge}
                    onChange={(e) => setOfferBadge(e.target.value)}
                    placeholder="e.g. 20% OFF"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-300">Combo Price (₹)</label>
                  <input
                    type="number"
                    value={offerPrice}
                    onChange={(e) => setOfferPrice(e.target.value)}
                    placeholder="199"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-300">Description</label>
                <textarea
                  rows={2}
                  value={offerDesc}
                  onChange={(e) => setOfferDesc(e.target.value)}
                  placeholder="Details of combo..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 text-xs font-bold rounded-xl shadow-lg mt-2"
              >
                Launch Combo Offer →
              </button>
            </form>
          </div>
        </div>
      )}
      {/* BULK IMPORT CONFIRMATION MODAL */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="glass-panel w-full max-w-6xl rounded-3xl border-slate-700 bg-slate-900 p-6 space-y-4 shadow-2xl relative flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <Upload className="w-5 h-5 text-orange-400" />
                  Verify Excel (CSV) Import Items ({parsedItems.length})
                </h3>
                <p className="text-[11px] text-slate-400">
                  Review and make edits to the imported rows directly in the table cells before importing.
                </p>
              </div>
              <button onClick={() => setIsBulkModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="flex-1 overflow-auto border border-slate-800 rounded-2xl bg-slate-950">
              <table className="w-full border-collapse text-xs text-left min-w-[900px]">
                <thead>
                  <tr className="bg-slate-900 border-b border-slate-800 font-extrabold text-slate-400">
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
                <tbody className="divide-y divide-slate-800/80 text-xs">
                  {parsedItems.map((item, index) => (
                    <tr key={index} className="hover:bg-slate-900/40">
                      <td className="p-2">
                        <input
                          type="text"
                          required
                          value={item.name}
                          onChange={(e) => updateParsedItemField(index, "name", e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-white"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => updateParsedItemField(index, "description", e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-white"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          required
                          value={item.price}
                          onChange={(e) => updateParsedItemField(index, "price", Number(e.target.value))}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-white"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={item.category}
                          onChange={(e) => updateParsedItemField(index, "category", e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-white"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          value={item.prepTime}
                          onChange={(e) => updateParsedItemField(index, "prepTime", Number(e.target.value))}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-white"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          disabled={item.stockType === "UNLIMITED"}
                          value={item.stockType === "UNLIMITED" ? "" : item.stockCount}
                          onChange={(e) => updateParsedItemField(index, "stockCount", Number(e.target.value))}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-white disabled:opacity-40"
                        />
                      </td>
                      <td className="p-2">
                        <select
                          value={item.stockType}
                          onChange={(e) => updateParsedItemField(index, "stockType", e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-white"
                        >
                          <option value="COUNTED">Counted</option>
                          <option value="UNLIMITED">Unlimited</option>
                        </select>
                      </td>
                      <td className="p-2">
                        <select
                          value={String(item.isVeg)}
                          onChange={(e) => updateParsedItemField(index, "isVeg", e.target.value === "true")}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-white"
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
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-white"
                        />
                      </td>
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => deleteParsedRow(index)}
                          className="p-1.5 text-red-400 hover:text-red-600 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between border-t border-slate-800 pt-3">
              <button
                type="button"
                onClick={addParsedRow}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Row</span>
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsBulkModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveBulkImport}
                  disabled={bulkImportLoading || parsedItems.length === 0}
                  className="btn-primary-gradient px-6 py-2 rounded-xl text-xs font-extrabold text-white shadow-lg shadow-orange-500/25 flex items-center gap-1.5 disabled:opacity-40"
                >
                  {bulkImportLoading ? "Importing..." : "✓ Confirm & Import Menu"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
