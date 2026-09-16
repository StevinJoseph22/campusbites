/**
 * CampusBites Universal Direct Silent Hardware Thermal Printer Driver
 * Supports WebSerial (USB Virtual COM / Essae PR-55 / TVS / Epson / Posiflex),
 * WebBluetooth (Wireless 58mm & 80mm POS printers), and WebUSB.
 * 
 * Delivers 0-click automated background printing with zero browser dialogs.
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

export type PrinterConnectionType = "NONE" | "SERIAL" | "BLUETOOTH" | "USB";
export type PaperWidth = "58mm" | "80mm";

class HardwarePrinterManager {
  private serialPort: any = null;
  private bluetoothDevice: any = null;
  private bluetoothCharacteristic: any = null;
  private connectionType: PrinterConnectionType = "NONE";
  private deviceName: string = "Not Connected";
  private paperWidth: PaperWidth = "58mm";
  private listeners: Array<() => void> = [];

  constructor() {
    if (typeof window !== "undefined") {
      const savedWidth = localStorage.getItem("campusbites_printer_paper_width") as PaperWidth;
      if (savedWidth === "58mm" || savedWidth === "80mm") {
        this.paperWidth = savedWidth;
      }
    }
  }

  public subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => {
      try { l(); } catch (e) {}
    });
  }

  public getStatus() {
    return {
      connectionType: this.connectionType,
      isConnected: this.connectionType !== "NONE",
      deviceName: this.deviceName,
      paperWidth: this.paperWidth,
      isWebSerialSupported: typeof navigator !== "undefined" && "serial" in navigator,
      isWebBluetoothSupported: typeof navigator !== "undefined" && "bluetooth" in navigator,
      isWebUsbSupported: typeof navigator !== "undefined" && "usb" in navigator
    };
  }

  public setPaperWidth(width: PaperWidth) {
    this.paperWidth = width;
    if (typeof window !== "undefined") {
      localStorage.setItem("campusbites_printer_paper_width", width);
    }
    this.notify();
  }

  /**
   * Automatically try to reconnect to previously paired WebSerial port
   */
  public async tryAutoReconnect(): Promise<boolean> {
    if (typeof navigator === "undefined" || !("serial" in navigator)) return false;
    try {
      const ports = await (navigator as any).serial.getPorts();
      if (ports && ports.length > 0) {
        const port = ports[0];
        await port.open({ baudRate: 9600 });
        this.serialPort = port;
        this.connectionType = "SERIAL";
        const info = port.getInfo ? port.getInfo() : {};
        this.deviceName = info.usbVendorId ? `USB POS Printer (VID:${info.usbVendorId.toString(16)})` : "Essae / USB Thermal Printer";
        this.notify();
        return true;
      }
    } catch (e) {
      console.warn("Auto-reconnect serial printer:", e);
    }
    return false;
  }

  /**
   * Pair USB / Serial Thermal Printer (Essae PR-55, TVS, Epson, Posiflex, NGX)
   */
  public async pairSerialPrinter(baudRate: number = 9600): Promise<{ success: boolean; error?: string }> {
    if (typeof navigator === "undefined" || !("serial" in navigator)) {
      return { success: false, error: "WebSerial is not supported in this browser. Use Google Chrome or MS Edge on Desktop." };
    }

    try {
      const port = await (navigator as any).serial.requestPort();
      await port.open({ baudRate });
      this.serialPort = port;
      this.connectionType = "SERIAL";

      const info = port.getInfo ? port.getInfo() : {};
      this.deviceName = info.usbVendorId ? `USB Serial Printer (${info.usbVendorId.toString(16)})` : "Essae PR-55 / USB POS Printer";
      this.notify();
      return { success: true };
    } catch (err: any) {
      console.error("Pairing serial printer error:", err);
      return { success: false, error: err.message || "Failed to pair USB printer." };
    }
  }

  /**
   * Pair Bluetooth Thermal Receipt Printer (58mm / 80mm wireless printers)
   */
  public async pairBluetoothPrinter(): Promise<{ success: boolean; error?: string }> {
    if (typeof navigator === "undefined" || !("bluetooth" in navigator)) {
      return { success: false, error: "WebBluetooth is not supported in this browser." };
    }

    const KNOWN_SERVICES = [
      "000018f0-0000-1000-8000-00805f9b34fb",
      "0000ffe0-0000-1000-8000-00805f9b34fb",
      "0000fff0-0000-1000-8000-00805f9b34fb",
      "49535343-fe7d-4ae5-8fa9-9fafd205e455",
      "e7810a71-73ae-499d-8c15-faa9aef0c3f2"
    ];

    try {
      const device = await (navigator as any).bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: KNOWN_SERVICES
      });

      if (!device || !device.gatt) {
        return { success: false, error: "Bluetooth device or GATT not available" };
      }

      const server = await device.gatt.connect();

      // Find first matching printable service and characteristic
      let writableChar: any = null;
      for (const serviceUuid of KNOWN_SERVICES) {
        try {
          const service = await server.getPrimaryService(serviceUuid);
          const characteristics = await service.getCharacteristics();
          for (const char of characteristics) {
            if (char.properties.write || char.properties.writeWithoutResponse) {
              writableChar = char;
              break;
            }
          }
          if (writableChar) break;
        } catch (sErr) {
          // Continue scanning next service
        }
      }

      if (!writableChar) {
        return { success: false, error: "Connected to Bluetooth device, but no printable ESC/POS GATT characteristic found." };
      }

      this.bluetoothDevice = device;
      this.bluetoothCharacteristic = writableChar;
      this.connectionType = "BLUETOOTH";
      this.deviceName = device.name || "Bluetooth POS Printer";

      device.addEventListener("gattserverdisconnected", () => {
        this.connectionType = "NONE";
        this.bluetoothDevice = null;
        this.bluetoothCharacteristic = null;
        this.deviceName = "Disconnected";
        this.notify();
      });

      this.notify();
      return { success: true };
    } catch (err: any) {
      console.error("Pairing bluetooth printer error:", err);
      return { success: false, error: err.message || "Failed to pair Bluetooth printer." };
    }
  }

  /**
   * Disconnect any active hardware connection
   */
  public async disconnect(): Promise<void> {
    try {
      if (this.serialPort && this.serialPort.close) {
        await this.serialPort.close();
      }
    } catch (e) {}
    try {
      if (this.bluetoothDevice && this.bluetoothDevice.gatt && this.bluetoothDevice.gatt.connected) {
        this.bluetoothDevice.gatt.disconnect();
      }
    } catch (e) {}

    this.serialPort = null;
    this.bluetoothDevice = null;
    this.bluetoothCharacteristic = null;
    this.connectionType = "NONE";
    this.deviceName = "Not Connected";
    this.notify();
  }

  /**
   * Send raw binary byte buffer to connected hardware printer
   */
  public async sendRawBytes(bytes: Uint8Array): Promise<{ success: boolean; method: string; error?: string }> {
    // 1. Direct WebSerial (USB Virtual COM)
    if (this.connectionType === "SERIAL" && this.serialPort && this.serialPort.writable) {
      try {
        const writer = this.serialPort.writable.getWriter();
        await writer.write(bytes);
        writer.releaseLock();
        return { success: true, method: "SERIAL" };
      } catch (err: any) {
        console.error("Serial write failed:", err);
        return { success: false, method: "SERIAL", error: err.message };
      }
    }

    // 2. Direct WebBluetooth
    if (this.connectionType === "BLUETOOTH" && this.bluetoothCharacteristic) {
      try {
        const CHUNK_SIZE = 100;
        for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
          const chunk = bytes.slice(i, i + CHUNK_SIZE);
          if (this.bluetoothCharacteristic.writeValueWithoutResponse) {
            await this.bluetoothCharacteristic.writeValueWithoutResponse(chunk);
          } else {
            await this.bluetoothCharacteristic.writeValue(chunk);
          }
          await new Promise(r => setTimeout(r, 20));
        }
        return { success: true, method: "BLUETOOTH" };
      } catch (err: any) {
        console.error("Bluetooth write failed:", err);
        return { success: false, method: "BLUETOOTH", error: err.message };
      }
    }

    // 3. Fallback: Hidden iframe
    return { success: false, method: "NONE", error: "No hardware printer connected" };
  }

  /**
   * Builds ESC/POS Byte Buffer for KOT, Cancellation, or Test slips
   */
  public buildEscPosBytes(data: ThermalSlipData): Uint8Array {
    const encoder = new TextEncoder();
    const chunks: number[] = [];
    const is80mm = this.paperWidth === "80mm";
    const lineLength = is80mm ? 48 : 32;
    const divider = "-".repeat(lineLength) + "\n";
    const doubleDivider = "=".repeat(lineLength) + "\n";

    const isCancelled = Boolean(
      data.isCancellation ||
      data.status === "REFUNDED" ||
      data.status === "CANCELLED" ||
      data.items.every(i => i.outOfStock)
    );

    // Initialize printer (ESC @)
    chunks.push(0x1B, 0x40);

    // Alignment: Center (ESC a 1)
    chunks.push(0x1B, 0x61, 0x01);

    if (isCancelled) {
      chunks.push(0x1D, 0x21, 0x11); // Double width & height
      chunks.push(...encoder.encode("*** ORDER CANCELLED ***\n"));
      chunks.push(0x1D, 0x21, 0x00); // Normal size
      chunks.push(...encoder.encode("[ OUT OF STOCK / VOID ]\n"));
    } else {
      chunks.push(0x1D, 0x21, 0x01); // Double height
      chunks.push(...encoder.encode("KITCHEN ORDER TICKET (KOT)\n"));
      chunks.push(0x1D, 0x21, 0x00); // Normal size
      chunks.push(...encoder.encode(doubleDivider));
    }

    // Stall Name & Campus
    chunks.push(0x1B, 0x45, 0x01); // Bold ON
    chunks.push(...encoder.encode(`${data.stallName.toUpperCase()}\n`));
    if (data.campus) {
      chunks.push(...encoder.encode(`${data.campus}\n`));
    }
    chunks.push(0x1B, 0x45, 0x00); // Bold OFF

    chunks.push(...encoder.encode(divider));

    // Token Number (Highlight: Quad size 2x width, 2x height)
    chunks.push(...encoder.encode("TOKEN NUMBER\n"));
    chunks.push(0x1D, 0x21, 0x22); // Quad size
    chunks.push(0x1B, 0x45, 0x01); // Bold ON
    chunks.push(...encoder.encode(`${data.tokenNumber}\n`));
    chunks.push(0x1B, 0x45, 0x00); // Bold OFF
    chunks.push(0x1D, 0x21, 0x00); // Normal size

    if (data.orderId) {
      chunks.push(...encoder.encode(`Ref: #${data.orderId.slice(-8)}\n`));
    }

    chunks.push(...encoder.encode(divider));

    // Alignment: Left (ESC a 0)
    chunks.push(0x1B, 0x61, 0x00);

    const printTimestamp = data.placedAt || new Date().toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Kolkata"
    });

    chunks.push(...encoder.encode(`TIME : ${printTimestamp}\n`));
    if (data.pickupTimeSlot) chunks.push(...encoder.encode(`SLOT : ${data.pickupTimeSlot}\n`));
    if (data.studentName || data.studentRegNumber) {
      chunks.push(...encoder.encode(`STUD : ${data.studentName || ""} ${data.studentRegNumber ? `(${data.studentRegNumber})` : ""}\n`));
    }
    if (data.orderType) chunks.push(...encoder.encode(`TYPE : ${data.orderType}\n`));
    if (data.customerNotes) {
      chunks.push(...encoder.encode(`NOTE : ${data.customerNotes}\n`));
    }

    chunks.push(...encoder.encode(divider));
    chunks.push(0x1B, 0x45, 0x01); // Bold ON
    chunks.push(...encoder.encode(is80mm ? "QTY    ITEM DESCRIPTION                         STATUS\n" : "QTY  ITEM DESCRIPTION             STATUS\n"));
    chunks.push(0x1B, 0x45, 0x00); // Bold OFF
    chunks.push(...encoder.encode(divider));

    // Items (Strictly NO Price)
    data.items.forEach(item => {
      const qty = Number(item.quantity) || 1;
      const qtyStr = `${qty}x`.padEnd(5, " ");
      const statusStr = isCancelled || item.outOfStock ? " [VOID]" : "";
      const vegTag = item.isVeg !== undefined ? (item.isVeg ? " (V)" : " (NV)") : "";
      
      chunks.push(0x1B, 0x45, 0x01); // Bold ON
      chunks.push(...encoder.encode(`${qtyStr} ${item.name}${vegTag}${statusStr}\n`));
      chunks.push(0x1B, 0x45, 0x00); // Bold OFF

      if (item.variants) {
        chunks.push(...encoder.encode(`      Style: ${item.variants}\n`));
      }
      if (item.notes) {
        chunks.push(...encoder.encode(`      * ${item.notes}\n`));
      }
      if (item.outOfStock) {
        chunks.push(...encoder.encode("      *** ITEM OUT OF STOCK ***\n"));
      }
    });

    chunks.push(...encoder.encode(divider));

    const totalQty = data.items.reduce((s, i) => s + (Number(i.quantity) || 1), 0);
    chunks.push(0x1B, 0x45, 0x01); // Bold ON
    chunks.push(...encoder.encode(`TOTAL FOOD ITEMS: ${totalQty} QTY\n`));
    chunks.push(0x1B, 0x45, 0x00); // Bold OFF

    if (isCancelled) {
      chunks.push(0x1B, 0x61, 0x01); // Center
      chunks.push(0x1B, 0x45, 0x01); // Bold ON
      chunks.push(...encoder.encode("\n*** DO NOT PREPARE THIS ORDER ***\n"));
      if (data.cancelReason) {
        chunks.push(...encoder.encode(`Reason: ${data.cancelReason}\n`));
      }
      chunks.push(0x1B, 0x45, 0x00); // Bold OFF
    }

    chunks.push(...encoder.encode(doubleDivider));

    // Paper feed and cut
    chunks.push(0x1B, 0x64, 0x04); // Feed 4 lines (ESC d 4)
    chunks.push(0x1D, 0x56, 0x41, 0x00); // GS V 65 0 (Full Cut)

    return new Uint8Array(chunks);
  }

  /**
   * Main Automated Print Dispatcher (0-click silent execution)
   */
  public async printSlip(data: ThermalSlipData): Promise<{ success: boolean; method: string; error?: string }> {
    const bytes = this.buildEscPosBytes(data);

    // If direct hardware is paired, write binary ESC/POS stream directly
    if (this.connectionType !== "NONE") {
      const res = await this.sendRawBytes(bytes);
      if (res.success) {
        return res;
      }
    }

    // Otherwise, fallback to background invisible iframe
    return this.fallbackIframePrint(data);
  }

  /**
   * Test Print Utility
   */
  public async printTestSlip(): Promise<{ success: boolean; method: string; error?: string }> {
    const testData: ThermalSlipData = {
      tokenNumber: "TEST-01",
      stallName: "CampusBites Kitchen POS",
      campus: "Hardware Test Slip",
      placedAt: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
      pickupTimeSlot: "12:00 PM - 12:15 PM",
      studentName: "Test Student",
      studentRegNumber: "26BCAF00",
      orderType: "DINE_IN",
      items: [
        { name: "Hardware Connection Test Item", quantity: 1, isVeg: true },
        { name: "Direct Silent Thermal Print OK", quantity: 2, isVeg: false }
      ]
    };
    return this.printSlip(testData);
  }

  private fallbackIframePrint(data: ThermalSlipData): Promise<{ success: boolean; method: string; error?: string }> {
    return new Promise((resolve) => {
      try {
        if (typeof window === "undefined") {
          resolve({ success: false, method: "IFRAME", error: "Window undefined" });
          return;
        }

        const existing = document.getElementById("campusbites-thermal-print-iframe");
        if (existing) existing.remove();

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

        const doc = iframe.contentWindow?.document || iframe.contentDocument;
        if (!doc) {
          resolve({ success: false, method: "IFRAME", error: "Iframe doc inaccessible" });
          return;
        }

        const isCancelled = Boolean(
          data.isCancellation ||
          data.status === "REFUNDED" ||
          data.status === "CANCELLED" ||
          data.items.every(i => i.outOfStock)
        );

        const totalQty = data.items.reduce((s, i) => s + (Number(i.quantity) || 1), 0);
        const printTime = data.placedAt || new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

        const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    @page { size: ${this.paperWidth === "80mm" ? "80mm" : "58mm"} auto; margin: 0mm; }
    body {
      width: ${this.paperWidth === "80mm" ? "78mm" : "54mm"};
      margin: 0 auto;
      padding: 2mm;
      font-family: 'Courier New', Courier, monospace;
      font-size: 11px;
      line-height: 1.25;
      color: #000;
      background: #fff;
    }
    .center { text-align: center; }
    .bold { font-weight: bold; }
    .bolder { font-weight: 900; }
    .token-large { font-size: 26px; font-weight: 900; margin: 2px 0; }
    .divider { border-top: 1px dashed #000; margin: 4px 0; }
    .double-divider { border-top: 2px solid #000; margin: 4px 0; }
    .box { border: 2px solid #000; padding: 3px; text-align: center; margin: 4px 0; }
    .item-row { display: flex; justify-content: space-between; margin-bottom: 3px; }
  </style>
</head>
<body>
  ${isCancelled ? `
    <div class="box" style="background:#eee;">
      <div class="bolder" style="font-size:13px;">*** ORDER CANCELLED ***</div>
      <div class="bold">[ OUT OF STOCK / VOID ]</div>
    </div>
  ` : `
    <div class="box">
      <div class="bolder">KITCHEN ORDER TICKET (KOT)</div>
      <div style="font-size:9px;">CampusBites Thermal Slip</div>
    </div>
  `}
  <div class="center bold" style="font-size:13px;">${escapeXml(data.stallName)}</div>
  ${data.campus ? `<div class="center" style="font-size:9px;">${escapeXml(data.campus)}</div>` : ""}
  <div class="double-divider"></div>

  <div class="center">
    <div style="font-size:10px;" class="bold">ORDER TOKEN NUMBER</div>
    <div class="token-large">${escapeXml(data.tokenNumber)}</div>
    ${data.orderId ? `<div style="font-size:9px;">Ref: #${escapeXml(data.orderId.slice(-8))}</div>` : ""}
  </div>
  <div class="divider"></div>

  <div style="font-size:10px;">
    <div><span class="bold">TIME:</span> ${escapeXml(printTime)}</div>
    ${data.pickupTimeSlot ? `<div><span class="bold">SLOT:</span> ${escapeXml(data.pickupTimeSlot)}</div>` : ""}
    ${data.studentName ? `<div><span class="bold">STUD:</span> ${escapeXml(data.studentName)} (${escapeXml(data.studentRegNumber || "")})</div>` : ""}
    ${data.orderType ? `<div><span class="bold">TYPE:</span> ${escapeXml(data.orderType)}</div>` : ""}
    ${data.customerNotes ? `<div style="background:#eee; padding:2px;"><span class="bold">NOTE:</span> ${escapeXml(data.customerNotes)}</div>` : ""}
  </div>

  <div class="divider"></div>
  <div style="display:flex; justify-content:space-between; font-weight:bold; font-size:10px;">
    <span>QTY  ITEM DESCRIPTION</span>
    <span>STATUS</span>
  </div>
  <div class="divider"></div>

  ${data.items.map(item => `
    <div class="item-row ${item.outOfStock || isCancelled ? 'style="text-decoration:line-through;"' : ''}">
      <div>
        <span class="bold">${item.quantity}x</span> ${escapeXml(item.name)}
        ${item.variants ? `<div style="font-size:9px; font-style:italic;">(${escapeXml(item.variants)})</div>` : ""}
      </div>
      <div class="bold" style="font-size:9px;">${isCancelled || item.outOfStock ? 'VOID' : 'OK'}</div>
    </div>
  `).join("")}

  <div class="divider"></div>
  <div style="display:flex; justify-content:space-between; font-weight:bold;">
    <span>TOTAL FOOD ITEMS:</span>
    <span>${totalQty} QTY</span>
  </div>

  ${isCancelled ? `
    <div class="double-divider"></div>
    <div class="center bold">
      *** DO NOT PREPARE THIS ORDER ***
      ${data.cancelReason ? `<div style="font-size:9px; font-weight:normal;">Reason: ${escapeXml(data.cancelReason)}</div>` : ""}
    </div>
  ` : ""}
  <div class="double-divider"></div>
</body>
</html>`;

        doc.open();
        doc.write(html);
        doc.close();

        setTimeout(() => {
          try {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
            resolve({ success: true, method: "IFRAME" });
          } catch (e: any) {
            resolve({ success: false, method: "IFRAME", error: e.message });
          }
        }, 300);
      } catch (err: any) {
        resolve({ success: false, method: "IFRAME", error: err.message });
      }
    });
  }
}

function escapeXml(str: string): string {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export const hardwarePrinter = new HardwarePrinterManager();
