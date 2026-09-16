export interface RestaurantAccount {
  id: string;
  name: string;
  tokenPrefix: string; // e.g. KJU-TC
  floor: string; // e.g. Ground Floor, 1st Floor, 2nd Floor, 3rd Floor
  managerEmail: string;
  cuisine: string;
  rating: number;
  logo: string;
  location: string;
  type: "PURE_VEG" | "MIXED";
  pinCode: string; // 6-digit security PIN (e.g. 123456)
  isOpen?: boolean;
  campus: string; // e.g. "Central Campus" or "Airport Road Campus"
}

export const RESTAURANT_ACCOUNTS: RestaurantAccount[] = [
  // Kristu Jayanti University (Airport Road Campus) - Live Database Canteens
  {
    id: "slurrppARC",
    name: "Slurrpp",
    tokenPrefix: "KJC-SL-ARC",
    floor: "Ground Floor",
    managerEmail: "slurrppARC@kristujayanti.com",
    cuisine: "Burgers, Fast Food & Loaded Fries",
    rating: 4.8,
    logo: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=120&h=120&fit=crop",
    location: "Main Food Court — Stall #01",
    type: "MIXED",
    pinCode: "123456",
    campus: "Airport Road Campus"
  },
  {
    id: "cafezamorin1stfloorARC",
    name: "Cafe Zamorin (1st Floor)",
    tokenPrefix: "KJC-CZ1-ARC",
    floor: "1st Floor",
    managerEmail: "cafezamorin1stfloorARC@kristujayanti.com",
    cuisine: "Beverages, Bakery & Snacks",
    rating: 4.9,
    logo: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=120&h=120&fit=crop",
    location: "Academic Block — Floor 1",
    type: "MIXED",
    pinCode: "123456",
    campus: "Airport Road Campus"
  },
  {
    id: "cafezamorin2ndfloorARC",
    name: "Cafe Zamorin (2nd Floor)",
    tokenPrefix: "KJC-CZ2-ARC",
    floor: "2nd Floor",
    managerEmail: "cafezamorin2ndfloorARC@kristujayanti.com",
    cuisine: "Continental, Sandwiches & Shakes",
    rating: 4.9,
    logo: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=120&h=120&fit=crop",
    location: "Academic Block — Floor 2",
    type: "MIXED",
    pinCode: "123456",
    campus: "Airport Road Campus"
  },
  {
    id: "ohhmomosARC",
    name: "Ohh Momos",
    tokenPrefix: "KJC-OM-ARC",
    floor: "Ground Floor",
    managerEmail: "ohhmomosARC@kristujayanti.com",
    cuisine: "Steam, Fried & Kurkure Momos",
    rating: 4.7,
    logo: "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=120&h=120&fit=crop",
    location: "Main Food Court — Stall #03",
    type: "MIXED",
    pinCode: "123456",
    campus: "Airport Road Campus"
  },
  {
    id: "annapradaARC",
    name: "Annaprada",
    tokenPrefix: "KJC-AN-ARC",
    floor: "Ground Floor",
    managerEmail: "annapradaARC@kristujayanti.com",
    cuisine: "South Indian Meals, Thali & Dosa",
    rating: 4.8,
    logo: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=120&h=120&fit=crop",
    location: "Main Dining Hall — Ground Floor",
    type: "PURE_VEG",
    pinCode: "123456",
    campus: "Airport Road Campus"
  },
  {
    id: "campusfeastARC",
    name: "Campus Feast",
    tokenPrefix: "KJC-CF-ARC",
    floor: "Ground Floor",
    managerEmail: "campusfeastARC@kristujayanti.com",
    cuisine: "Biryani, Rolls & Chinese Platters",
    rating: 4.7,
    logo: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=120&h=120&fit=crop",
    location: "Main Food Court — Stall #05",
    type: "MIXED",
    pinCode: "123456",
    campus: "Airport Road Campus"
  },

  // Kristu Jayanti University (Central Campus)
  {
    id: "campusgrillCC",
    name: "The Campus Grill & Burger Club (Central Campus)",
    tokenPrefix: "KJU-TC-CC",
    floor: "Ground Floor",
    managerEmail: "campusgrillCC@campusbites.edu",
    cuisine: "Burgers, Wraps & Loaded Fries",
    rating: 4.8,
    logo: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=120&h=120&fit=crop",
    location: "Main Canteen Block — Stall #01",
    type: "MIXED",
    pinCode: "123456",
    campus: "Central Campus"
  },
  {
    id: "southexpressCC",
    name: "South Express Dosa & Tiffins (Central Campus)",
    tokenPrefix: "KJU-SE-CC",
    floor: "Ground Floor",
    managerEmail: "southexpressCC@campusbites.edu",
    cuisine: "Crispy Dosa, Idli & Filter Coffee",
    rating: 4.9,
    logo: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=120&h=120&fit=crop",
    location: "Main Canteen Block — Stall #04",
    type: "PURE_VEG",
    pinCode: "123456",
    campus: "Central Campus"
  }
];

export function getStoredRestaurants(): RestaurantAccount[] {
  if (typeof window === "undefined") return RESTAURANT_ACCOUNTS;
  try {
    const saved = localStorage.getItem("campusbites_registered_restaurants");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0 && parsed.every(r => r.campus)) {
        return parsed;
      } else {
        localStorage.removeItem("campusbites_registered_restaurants");
      }
    }
  } catch (e) {
    console.error(e);
  }
  return RESTAURANT_ACCOUNTS;
}

export function registerNewRestaurant(account: RestaurantAccount): RestaurantAccount[] {
  const current = getStoredRestaurants();
  const updated = [account, ...current.filter(r => r.id !== account.id)];
  try {
    localStorage.setItem("campusbites_registered_restaurants", JSON.stringify(updated));
  } catch (e) {
    console.error(e);
  }
  return updated;
}

export function getActiveRestaurant(): RestaurantAccount {
  if (typeof window === "undefined") return RESTAURANT_ACCOUNTS[0];
  try {
    const saved = localStorage.getItem("campusbites_active_vendor_id");
    const savedUser = localStorage.getItem("campusbites_student_reg");
    const savedName = localStorage.getItem("campusbites_user_name");
    const list = getStoredRestaurants();

    if (saved) {
      const found = list.find(r => 
        r.id.toLowerCase() === saved.toLowerCase() ||
        r.name.toLowerCase() === saved.toLowerCase() ||
        r.tokenPrefix.toLowerCase() === saved.toLowerCase() ||
        r.id.toLowerCase().startsWith(saved.toLowerCase())
      );
      if (found) return found;
    }

    if (savedUser) {
      const found = list.find(r => 
        r.id.toLowerCase().includes(savedUser.toLowerCase()) ||
        r.name.toLowerCase().includes(savedUser.toLowerCase())
      );
      if (found) return found;
    }

    if (savedName) {
      const found = list.find(r => r.name.toLowerCase() === savedName.toLowerCase());
      if (found) return found;
    }
  } catch (e) {}
  return RESTAURANT_ACCOUNTS[0];
}

export function setActiveRestaurant(restaurantId: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("campusbites_active_vendor_id", restaurantId);
  } catch (e) {}
}

