/**
 * CampusBites College Restaurant Token Generator
 * Format: KJU-[First Letter Word 1][First Letter Word 2]-[3 Digit Number]
 * Example: "The Campus Grill" -> KJU-TC-101
 * Example: "South Express Dosa" -> KJU-SE-204
 */
export function generateVendorToken(stallName: string): string {
  // Extract words from stall name ignoring common stop words if needed
  const words = stallName
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .trim()
    .split(/\s+/);

  let letter1 = "K";
  let letter2 = "B";

  if (words.length >= 2) {
    letter1 = words[0][0].toUpperCase();
    letter2 = words[1][0].toUpperCase();
  } else if (words.length === 1 && words[0].length >= 2) {
    letter1 = words[0][0].toUpperCase();
    letter2 = words[0][1].toUpperCase();
  }

  // Generate guaranteed 3-digit random number (100 - 999)
  const num = Math.floor(100 + Math.random() * 900);

  return `KJU-${letter1}${letter2}-${num}`;
}

export function generateMasterOrderToken(): string {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `KJU-MASTER-${num}`;
}
