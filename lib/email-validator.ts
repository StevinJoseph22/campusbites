/**
 * Validates institutional college email prefixes (student register numbers & staff email IDs).
 * 
 * Rules:
 * 1. Student Roll Numbers:
 *    - Starts with 2-digit batch year (e.g. 21, 22, 23, 24, 25...)
 *    - Followed by department code (e.g. bcaf, bca, bcom, bba, cs, mba, mca)
 *    - MUST end with roll number digits (e.g. 59, 101, 01).
 *    - Incomplete prefixes like "21bcaf" are rejected with helpful guidance.
 * 
 * 2. Staff / Faculty Usernames:
 *    - Starts with a letter (e.g. stevin.b, john.doe, principal)
 *    - Can contain letters, numbers, single dots, or hyphens.
 *    - Cannot contain consecutive dots or trailing punctuation.
 */

export interface EmailValidationResult {
  valid: boolean;
  cleanPrefix: string;
  fullEmail?: string;
  error?: string;
  type?: "STUDENT" | "STAFF";
}

export function validateCollegeEmailPrefix(
  rawPrefix: string,
  domain: string = "kristujayanti.com"
): EmailValidationResult {
  if (!rawPrefix) {
    return {
      valid: false,
      cleanPrefix: "",
      error: "Please enter your official college email ID or register number."
    };
  }

  // Strip domain if full email was typed or pasted
  let clean = rawPrefix.trim().toLowerCase();
  if (clean.includes("@")) {
    clean = clean.split("@")[0].trim();
  }
  clean = clean.replace(/\s+/g, "");

  if (clean.length < 3) {
    return {
      valid: false,
      cleanPrefix: clean,
      error: "Official ID is too short (minimum 3 characters)."
    };
  }

  if (clean.length > 35) {
    return {
      valid: false,
      cleanPrefix: clean,
      error: "Official ID is too long (maximum 35 characters)."
    };
  }

  // Check for allowed characters: lowercase letters, numbers, dot, hyphen, underscore
  if (!/^[a-z0-9][a-z0-9._-]*[a-z0-9]$/.test(clean)) {
    return {
      valid: false,
      cleanPrefix: clean,
      error: "Official ID contains invalid characters. Use only letters, numbers, dots (.), or hyphens (-)."
    };
  }

  if (clean.includes("..") || clean.includes("--") || clean.includes("__")) {
    return {
      valid: false,
      cleanPrefix: clean,
      error: "Official ID cannot contain consecutive dots, hyphens, or underscores."
    };
  }

  // 1. Check if user is entering a Student Register Number (starts with 2 digits e.g. 21, 22, 23, 24...)
  if (/^\d{2}/.test(clean)) {
    // Valid format: 2 digits (year) + 2-6 letters (dept) + 1-4 digits (roll number)
    // Examples: 21bcaf59, 22bca101, 23cs42, 20bcom05
    const studentFullPattern = /^\d{2}[a-z]{2,6}\d{1,4}$/;
    
    if (studentFullPattern.test(clean)) {
      return {
        valid: true,
        cleanPrefix: clean,
        fullEmail: `${clean}@${domain}`,
        type: "STUDENT"
      };
    }

    // Incomplete roll number check (e.g. 21bcaf without student roll digits)
    if (/^\d{2}[a-z]{2,6}$/.test(clean)) {
      return {
        valid: false,
        cleanPrefix: clean,
        error: `"${clean}" is an incomplete register number. Please add your roll number digits at the end (e.g. ${clean}59).`
      };
    }

    // Numbers only check (e.g. 212345)
    if (/^\d+$/.test(clean) && clean.length >= 6) {
      return {
        valid: true,
        cleanPrefix: clean,
        fullEmail: `${clean}@${domain}`,
        type: "STUDENT"
      };
    }

    return {
      valid: false,
      cleanPrefix: clean,
      error: `"${clean}" is not a valid student register number format. Example: 21bcaf59 or 22bca101.`
    };
  }

  // 2. Staff / Faculty format (starts with letter, e.g. stevin.b, john.doe, hod.bca, admin)
  if (/^[a-z][a-z0-9._-]{1,32}[a-z0-9]$/.test(clean)) {
    return {
      valid: true,
      cleanPrefix: clean,
      fullEmail: `${clean}@${domain}`,
      type: "STAFF"
    };
  }

  return {
    valid: false,
    cleanPrefix: clean,
    error: `"${clean}" does not match a valid college email format. Example for staff: stevin.b or for student: 21bcaf59.`
  };
}
