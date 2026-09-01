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
  // Kristu Jayanti University (Central Campus) - CC
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
  },
  {
    id: "coldbrewCC",
    name: "Cold Brew & Sandwich Bar (Central Campus)",
    tokenPrefix: "KJU-CB-CC",
    floor: "1st Floor",
    managerEmail: "coldbrewCC@campusbites.edu",
    cuisine: "Artisanal Coffee & Grilled Panini",
    rating: 4.7,
    logo: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=120&h=120&fit=crop",
    location: "Student Activity Center — Floor 1",
    type: "PURE_VEG",
    pinCode: "123456",
    campus: "Central Campus"
  },
  {
    id: "wokrollCC",
    name: "Wok & Roll Noodle Hub (Central Campus)",
    tokenPrefix: "KJU-WR-CC",
    floor: "2nd Floor",
    managerEmail: "wokrollCC@campusbites.edu",
    cuisine: "Hakka Noodles, Dimsums & Manchow",
    rating: 4.6,
    logo: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=120&h=120&fit=crop",
    location: "Food Plaza — Floor 2",
    type: "MIXED",
    pinCode: "123456",
    campus: "Central Campus"
  },

  // Kristu Jayanti University (Airport Road Campus) - ARC
  {
    id: "campusgrillARC",
    name: "The Campus Grill & Burger Club (Airport Road Campus)",
    tokenPrefix: "KJU-TC-ARC",
    floor: "Ground Floor",
    managerEmail: "campusgrillARC@campusbites.edu",
    cuisine: "Burgers, Wraps & Loaded Fries",
    rating: 4.8,
    logo: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=120&h=120&fit=crop",
    location: "Main Canteen Block — Stall #01",
    type: "MIXED",
    pinCode: "123456",
    campus: "Airport Road Campus"
  },
  {
    id: "southexpressARC",
    name: "South Express Dosa & Tiffins (Airport Road Campus)",
    tokenPrefix: "KJU-SE-ARC",
    floor: "Ground Floor",
    managerEmail: "southexpressARC@campusbites.edu",
    cuisine: "Crispy Dosa, Idli & Filter Coffee",
    rating: 4.9,
    logo: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=120&h=120&fit=crop",
    location: "Main Canteen Block — Stall #04",
    type: "PURE_VEG",
    pinCode: "123456",
    campus: "Airport Road Campus"
  },
  {
    id: "coldbrewARC",
    name: "Cold Brew & Sandwich Bar (Airport Road Campus)",
    tokenPrefix: "KJU-CB-ARC",
    floor: "1st Floor",
    managerEmail: "coldbrewARC@campusbites.edu",
    cuisine: "Artisanal Coffee & Grilled Panini",
    rating: 4.7,
    logo: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=120&h=120&fit=crop",
    location: "Student Activity Center — Floor 1",
    type: "PURE_VEG",
    pinCode: "123456",
    campus: "Airport Road Campus"
  },
  {
    id: "wokrollARC",
    name: "Wok & Roll Noodle Hub (Airport Road Campus)",
    tokenPrefix: "KJU-WR-ARC",
    floor: "2nd Floor",
    managerEmail: "wokrollARC@campusbites.edu",
    cuisine: "Hakka Noodles, Dimsums & Manchow",
    rating: 4.6,
    logo: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=120&h=120&fit=crop",
    location: "Food Plaza — Floor 2",
    type: "MIXED",
    pinCode: "123456",
    campus: "Airport Road Campus"
  }
];

export function getStoredRestaurants(): RestaurantAccount[] {
  if (typeof window === "undefined") return RESTAURANT_ACCOUNTS;
  try {
    const saved = localStorage.getItem("campusbites_registered_restaurants");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.every(r => r.campus)) {
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
  const updated = [account, ...current];
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
    const list = getStoredRestaurants();
    const found = list.find(r => r.id === saved);
    if (found) return found;
  } catch (e) {}
  return RESTAURANT_ACCOUNTS[0];
}

export function setActiveRestaurant(restaurantId: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("campusbites_active_vendor_id", restaurantId);
  } catch (e) {}
}
