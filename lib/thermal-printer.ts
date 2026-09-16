/**
 * Thermal Receipt Printer Utility for Essae PR-55 and Standard 58mm / 80mm POS Printers
 * Formats Kitchen Order Tickets (KOT) and Cancellation Slips without price as required.
 */

export interface ThermalSlipItem {
  name: string;
  quantity: number;
  isVeg?: boolean;
  outOfStock?: boolean;
  notes?: string;
  variants?: string;
}

export interface ThermalSlipData {
  tokenNumber: string;
  orderId?: string;
  stallName: string;
  campus?: string;
  placedAt?: string;
  pickupTimeSlot?: string;
  studentName?: string | null;
  studentRegNumber?: string | null;
  orderType?: "TAKEAWAY" | "DINE_IN" | "DELIVERY" | string;
  customerNotes?: string;
  items: ThermalSlipItem[];
  status?: "PLACED" | "CONFIRMED" | "READY" | "FULFILLED" | "REFUNDED" | "CANCELLED" | "PARTIAL_HOLD" | string;
  cancelReason?: string;
  isCancellation?: boolean;
}

/**
 * Generates printer-optimized 58mm thermal slip HTML content
 */
export function generateThermalSlipHtml(data: ThermalSlipData): string {
  const isCancelled = Boolean(
    data.isCancellation ||
    data.status === "REFUNDED" ||
    data.status === "CANCELLED" ||
    data.items.every(i => i.outOfStock)
  );

  const totalQuantity = data.items.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);
  const printTimestamp = data.placedAt || new Date().toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata"
  });

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Token ${data.tokenNumber} - ${isCancelled ? "CANCELLED" : "KOT"}</title>
  <style>
    @page {
      size: 58mm auto;
      margin: 0mm;
    }
    @media print {
      body {
        margin: 0;
        padding: 2mm 3mm;
        width: 58mm;
        background: #fff;
        color: #000;
        font-family: 'Courier New', Courier, monospace, monospace;
        font-size: 11px;
        line-height: 1.25;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .no-print {
        display: none !important;
      }
    }
    body {
      width: 58mm;
      max-width: 58mm;
      margin: 0 auto;
      padding: 3mm;
      background: #fff;
      color: #000;
      font-family: 'Courier New', Courier, monospace;
      font-size: 11px;
      line-height: 1.3;
      box-sizing: border-box;
    }
    .text-center { text-align: center; }
    .text-left { text-align: left; }
    .text-right { text-align: right; }
    .bold { font-weight: bold; }
    .bolder { font-weight: 900; }
    
    .divider {
      border-top: 1px dashed #000;
      margin: 4px 0;
    }
    .double-divider {
      border-top: 2px solid #000;
      margin: 4px 0;
    }
    .thick-box {
      border: 2px solid #000;
      padding: 4px 2px;
      margin: 4px 0;
      text-align: center;
    }
    .cancelled-box {
      border: 3px solid #000;
      padding: 4px 2px;
      margin: 4px 0;
      background: #eee;
      text-align: center;
    }
    
    .token-title {
      font-size: 10px;
      letter-spacing: 1px;
      text-transform: uppercase;
    }
    .token-large {
      font-size: 26px;
      font-weight: 900;
      line-height: 1.1;
      margin: 2px 0;
    }
    
    .item-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 4px;
    }
    .item-qty {
      width: 22px;
      font-weight: 900;
      font-size: 13px;
      flex-shrink: 0;
    }
    .item-desc {
      flex: 1;
      padding-left: 2px;
    }
    .item-name {
      font-weight: bold;
      font-size: 12px;
    }
    .item-notes {
      font-size: 9px;
      font-style: italic;
      margin-top: 1px;
    }
    .line-through {
      text-decoration: line-through;
    }
    .tag {
      font-size: 9px;
      font-weight: bold;
      border: 1px solid #000;
      padding: 0 2px;
      margin-left: 2px;
    }
    .footer-cut {
      margin-top: 12px;
      padding-top: 6px;
      font-size: 9px;
      text-align: center;
    }
  </style>
</head>
<body>
  ${isCancelled ? `
    <div class="cancelled-box">
      <div class="bolder" style="font-size: 14px; letter-spacing: 1px;">*** ORDER CANCELLED ***</div>
      <div class="bold" style="font-size: 11px;">[ OUT OF STOCK / VOID ]</div>
    </div>
  ` : `
    <div class="thick-box">
      <div class="bolder" style="font-size: 12px; letter-spacing: 0.5px;">KITCHEN ORDER TICKET (KOT)</div>
      <div style="font-size: 9px;">ESSAE PR-55 THERMAL RECEIPT</div>
    </div>
  `}

  <!-- Stall Info -->
  <div class="text-center">
    <div class="bold" style="font-size: 13px; text-transform: uppercase;">${escapeHtml(data.stallName)}</div>
    ${data.campus ? `<div style="font-size: 9px;">${escapeHtml(data.campus)}</div>` : ""}
  </div>

  <div class="double-divider"></div>

  <!-- Token & Time (Main Highlights) -->
  <div class="text-center" style="margin: 3px 0;">
    <div class="token-title bold">ORDER TOKEN NUMBER</div>
    <div class="token-large">${escapeHtml(data.tokenNumber)}</div>
    ${data.orderId ? `<div style="font-size: 9px;">Order ID: #${escapeHtml(data.orderId.slice(-8))}</div>` : ""}
  </div>

  <div class="divider"></div>

  <!-- Meta Info -->
  <div style="font-size: 10px; margin: 3px 0;">
    <div><span class="bold">TIME:</span> ${escapeHtml(printTimestamp)}</div>
    ${data.pickupTimeSlot ? `<div><span class="bold">SLOT:</span> ${escapeHtml(data.pickupTimeSlot)}</div>` : ""}
    ${data.studentName || data.studentRegNumber ? `
      <div><span class="bold">STUD:</span> ${escapeHtml(data.studentName || "")} ${data.studentRegNumber ? `(${escapeHtml(data.studentRegNumber)})` : ""}</div>
    ` : ""}
    ${data.orderType ? `<div><span class="bold">TYPE:</span> ${escapeHtml(data.orderType)}</div>` : ""}
  </div>

  ${data.customerNotes ? `
    <div class="divider"></div>
    <div style="font-size: 10px; background: #eee; padding: 2px 4px; border-left: 2px solid #000;">
      <span class="bold">NOTE:</span> ${escapeHtml(data.customerNotes)}
    </div>
  ` : ""}

  <div class="divider"></div>

  <!-- Items Table Header (Strictly NO Price) -->
  <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 10px; margin-bottom: 2px;">
    <span>QTY  ITEM DESCRIPTION</span>
    <span>STATUS</span>
  </div>
  <div class="divider"></div>

  <!-- Items List (Strictly WITHOUT Price) -->
  <div style="margin: 4px 0;">
    ${data.items.map(item => `
      <div class="item-row ${item.outOfStock || isCancelled ? 'line-through' : ''}">
        <div class="item-qty">${item.quantity}x</div>
        <div class="item-desc">
          <div class="item-name">
            ${escapeHtml(item.name)}
            ${item.isVeg !== undefined ? (item.isVeg ? '<span class="tag">VEG</span>' : '<span class="tag">NON-VEG</span>') : ''}
          </div>
          ${item.variants ? `<div class="item-notes">(${escapeHtml(item.variants)})</div>` : ''}
          ${item.notes ? `<div class="item-notes">* ${escapeHtml(item.notes)}</div>` : ''}
          ${item.outOfStock ? `<div class="bold" style="color:#000; font-size:9px;">[OUT OF STOCK]</div>` : ''}
        </div>
        <div style="font-size: 9px; font-weight: bold; flex-shrink: 0; padding-left: 4px;">
          ${isCancelled || item.outOfStock ? 'VOID' : 'OK'}
        </div>
      </div>
    `).join("")}
  </div>

  <div class="divider"></div>

  <!-- Total Summary (Count only, NO Price) -->
  <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 11px;">
    <span>TOTAL FOOD ITEMS:</span>
    <span>${totalQuantity} QTY</span>
  </div>

  ${isCancelled ? `
    <div class="double-divider"></div>
    <div class="text-center bold" style="font-size: 11px; margin: 4px 0;">
      *** DO NOT PREPARE THIS ORDER ***
      <div style="font-size: 9px; font-weight: normal; margin-top: 2px;">
        ${data.cancelReason ? `Reason: ${escapeHtml(data.cancelReason)}` : "Order cancelled / refunded to student"}
      </div>
    </div>
  ` : ""}

  <div class="double-divider"></div>
  <div class="footer-cut">
    --------------------------------<br>
    . . . . . . . . CUT HERE . . . . . . . .<br>
    <br>
  </div>
</body>
</html>`;
}

function escapeHtml(text: string): string {
  if (!text) return "";
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Triggers instant printing to thermal printer (Essae PR-55 / 58mm / 80mm) via hidden iframe
 */
export function printThermalSlip(data: ThermalSlipData): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      if (typeof window === "undefined") {
        resolve(false);
        return;
      }

      // Check for existing print iframe and remove
      const existingIframe = document.getElementById("campusbites-thermal-print-iframe");
      if (existingIframe) {
        existingIframe.remove();
      }

      const iframe = document.createElement("iframe");
      iframe.id = "campusbites-thermal-print-iframe";
      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "0";
      iframe.style.visibility = "hidden";

      document.body.appendChild(iframe);

      const iframeDoc = iframe.contentWindow?.document || iframe.contentDocument;
      if (!iframeDoc) {
        console.error("Could not access thermal print iframe document");
        resolve(false);
        return;
      }

      const htmlContent = generateThermalSlipHtml(data);
      iframeDoc.open();
      iframeDoc.write(htmlContent);
      iframeDoc.close();

      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          resolve(true);
        } catch (printErr) {
          console.error("Print execution failed:", printErr);
          resolve(false);
        }
      }, 250);
    } catch (e) {
      console.error("Thermal print error:", e);
      resolve(false);
    }
  });
}

/**
 * ESC/POS raw command format for direct hardware serial/USB printer communication (Essae PR-55)
 */
export function generateEscPosCommands(data: ThermalSlipData): Uint8Array {
  const encoder = new TextEncoder();
  const chunks: number[] = [];

  const isCancelled = Boolean(
    data.isCancellation ||
    data.status === "REFUNDED" ||
    data.status === "CANCELLED" ||
    data.items.every(i => i.outOfStock)
  );

  // Initialize printer
  chunks.push(0x1B, 0x40); // ESC @ (Initialize)

  // Alignment Center
  chunks.push(0x1B, 0x61, 0x01); // ESC a 1 (Center)

  if (isCancelled) {
    // Double width & double height for CANCELLED
    chunks.push(0x1D, 0x21, 0x11);
    chunks.push(...encoder.encode("*** ORDER CANCELLED ***\n"));
    chunks.push(0x1D, 0x21, 0x00);
    chunks.push(...encoder.encode("[ OUT OF STOCK / VOID ]\n"));
  } else {
    chunks.push(0x1D, 0x21, 0x01); // Double height
    chunks.push(...encoder.encode("KITCHEN ORDER TICKET (KOT)\n"));
    chunks.push(0x1D, 0x21, 0x00);
    chunks.push(...encoder.encode("================================\n"));
  }

  // Stall Name
  chunks.push(0x1B, 0x45, 0x01); // Bold ON
  chunks.push(...encoder.encode(`${data.stallName.toUpperCase()}\n`));
  if (data.campus) {
    chunks.push(...encoder.encode(`${data.campus}\n`));
  }
  chunks.push(0x1B, 0x45, 0x00); // Bold OFF

  chunks.push(...encoder.encode("--------------------------------\n"));

  // Token Number (Very Large & Bold)
  chunks.push(...encoder.encode("TOKEN NUMBER\n"));
  chunks.push(0x1D, 0x21, 0x22); // Quad size (2x width, 2x height)
  chunks.push(0x1B, 0x45, 0x01); // Bold ON
  chunks.push(...encoder.encode(`${data.tokenNumber}\n`));
  chunks.push(0x1B, 0x45, 0x00); // Bold OFF
  chunks.push(0x1D, 0x21, 0x00); // Normal size

  chunks.push(...encoder.encode("--------------------------------\n"));

  // Alignment Left
  chunks.push(0x1B, 0x61, 0x00); // ESC a 0 (Left)
  const printTimestamp = data.placedAt || new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" });
  chunks.push(...encoder.encode(`TIME : ${printTimestamp}\n`));
  if (data.pickupTimeSlot) chunks.push(...encoder.encode(`SLOT : ${data.pickupTimeSlot}\n`));
  if (data.studentName) chunks.push(...encoder.encode(`STUD : ${data.studentName} (${data.studentRegNumber || ""})\n`));
  if (data.customerNotes) chunks.push(...encoder.encode(`NOTE : ${data.customerNotes}\n`));

  chunks.push(...encoder.encode("--------------------------------\n"));
  chunks.push(...encoder.encode("QTY   ITEM DESCRIPTION\n"));
  chunks.push(...encoder.encode("--------------------------------\n"));

  data.items.forEach(item => {
    const qtyStr = `${item.quantity} x `.padEnd(6, " ");
    chunks.push(0x1B, 0x45, 0x01); // Bold ON
    chunks.push(...encoder.encode(`${qtyStr}${item.name}\n`));
    chunks.push(0x1B, 0x45, 0x00); // Bold OFF
    if (item.outOfStock) {
      chunks.push(...encoder.encode("      [OUT OF STOCK / VOID]\n"));
    }
  });

  chunks.push(...encoder.encode("--------------------------------\n"));
  const totalQuantity = data.items.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);
  chunks.push(...encoder.encode(`TOTAL ITEMS: ${totalQuantity}\n`));

  if (isCancelled) {
    chunks.push(0x1B, 0x61, 0x01); // Center
    chunks.push(...encoder.encode("\n*** DO NOT PREPARE ***\n"));
  }

  // Feed and cut paper
  chunks.push(0x1B, 0x64, 0x04); // Feed 4 lines
  chunks.push(0x1D, 0x56, 0x41, 0x00); // GS V 65 0 (Full Cut)

  return new Uint8Array(chunks);
}
