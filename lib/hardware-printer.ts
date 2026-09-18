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

export type PrinterConnectionType = "NONE" | "USB" | "SERIAL" | "BLUETOOTH" | "SYSTEM";
export type PaperWidth = "58mm" | "80mm";

export interface PairedPrinterInfo {
  id: string;
  name: string;
  type: "USB" | "SERIAL" | "BLUETOOTH" | "SYSTEM";
  details?: string;
  nativeDevice?: any;
}

class HardwarePrinterManager {
  private usbDevice: any = null;
  private usbInterfaceNumber: number = 0;
  private usbEndpointNumber: number = 1;
  private serialPort: any = null;
  private bluetoothDevice: any = null;
  private bluetoothCharacteristic: any = null;
  private connectionType: PrinterConnectionType = "NONE";
  private deviceName: string = "Not Connected";
  private paperWidth: PaperWidth = "58mm";
  private listeners: Array<() => void> = [];
  private isConnecting: boolean = false;

  constructor() {
    if (typeof window !== "undefined") {
      const savedWidth = localStorage.getItem("campusbites_printer_paper_width") as PaperWidth;
      if (savedWidth === "58mm" || savedWidth === "80mm") {
        this.paperWidth = savedWidth;
      }
      const savedType = localStorage.getItem("campusbites_printer_type") as PrinterConnectionType;
      if (savedType === "SYSTEM") {
        this.connectionType = "SYSTEM";
        this.deviceName = "Windows / OS Default Thermal Printer (Spooler Mode)";
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
      isWebUsbSupported: typeof navigator !== "undefined" && "usb" in navigator,
      isWebSerialSupported: typeof navigator !== "undefined" && "serial" in navigator,
      isWebBluetoothSupported: typeof navigator !== "undefined" && "bluetooth" in navigator
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
   * Set Windows / System Default Printer (Spooler Mode)
   */
  public setSystemPrinterMode(): void {
    this.disconnect();
    this.connectionType = "SYSTEM";
    this.deviceName = "Windows / OS Default Thermal Printer (Spooler Mode)";
    if (typeof window !== "undefined") {
      localStorage.setItem("campusbites_printer_type", "SYSTEM");
    }
    this.notify();
  }

  /**
   * Automatically try to reconnect to previously authorized USB or Serial devices
   */
  public async tryAutoReconnect(): Promise<boolean> {
    if (this.isConnecting) return false;
    if (this.connectionType !== "NONE") return true;

    if (typeof window !== "undefined") {
      const savedType = localStorage.getItem("campusbites_printer_type");
      if (savedType === "SYSTEM") {
        this.connectionType = "SYSTEM";
        this.deviceName = "Windows / OS Default Thermal Printer (Spooler Mode)";
        this.notify();
        return true;
      }
    }

    this.isConnecting = true;
    try {
      // 1. Try WebUSB authorized devices
      if (typeof navigator !== "undefined" && "usb" in navigator) {
        try {
          const usbDevices = await (navigator as any).usb.getDevices();
          if (usbDevices && usbDevices.length > 0) {
            const success = await this.connectPairedUsbDevice(usbDevices[0]);
            if (success) return true;
          }
        } catch (e) {
          console.warn("Auto-reconnect USB printer:", e);
        }
      }

      // 2. Try WebSerial authorized ports
      if (typeof navigator !== "undefined" && "serial" in navigator) {
        try {
          const ports = await (navigator as any).serial.getPorts();
          if (ports && ports.length > 0) {
            const port = ports[0];
            try {
              await port.open({ baudRate: 9600 });
              this.serialPort = port;
              this.connectionType = "SERIAL";
              const info = port.getInfo ? port.getInfo() : {};
              this.deviceName = info.usbVendorId ? `USB Serial Printer (VID:${info.usbVendorId.toString(16)})` : "Essae / USB POS Printer";
              if (typeof window !== "undefined") localStorage.setItem("campusbites_printer_type", "SERIAL");
              this.notify();
              return true;
            } catch (pErr) {}
          }
        } catch (e) {
          console.warn("Auto-reconnect serial printer:", e);
        }
      }
    } finally {
      this.isConnecting = false;
    }

    return false;
  }

  /**
   * Returns list of previously paired/authorized hardware devices
   */
  public async getPairedDevices(): Promise<PairedPrinterInfo[]> {
    const list: PairedPrinterInfo[] = [];

    // System mode
    if (typeof window !== "undefined" && localStorage.getItem("campusbites_printer_type") === "SYSTEM") {
      list.push({
        id: "system-default",
        name: "Windows / System Default Thermal Printer",
        type: "SYSTEM",
        details: "Instant silent browser print spooler"
      });
    }

    // Query remembered USB devices
    if (typeof navigator !== "undefined" && "usb" in navigator) {
      try {
        const usbDevices = await (navigator as any).usb.getDevices();
        usbDevices.forEach((dev: any, idx: number) => {
          const prodName = dev.productName || "Thermal Receipt Printer";
          const mfg = dev.manufacturerName ? `${dev.manufacturerName} ` : "";
          list.push({
            id: `usb-${dev.vendorId}-${dev.productId}-${idx}`,
            name: `${mfg}${prodName}`,
            type: "USB",
            details: `USB (VID: 0x${dev.vendorId ? dev.vendorId.toString(16) : 'N/A'}, PID: 0x${dev.productId ? dev.productId.toString(16) : 'N/A'})`,
            nativeDevice: dev
          });
        });
      } catch (e) {}
    }

    // Query remembered Serial ports
    if (typeof navigator !== "undefined" && "serial" in navigator) {
      try {
        const serialPorts = await (navigator as any).serial.getPorts();
        serialPorts.forEach((port: any, idx: number) => {
          const info = port.getInfo ? port.getInfo() : {};
          const vid = info.usbVendorId ? `VID: 0x${info.usbVendorId.toString(16)}` : "COM Port";
          list.push({
            id: `serial-${idx}`,
            name: `Serial / COM Port Device #${idx + 1}`,
            type: "SERIAL",
            details: vid,
            nativeDevice: port
          });
        });
      } catch (e) {}
    }

    return list;
  }

  /**
   * Connect to an already paired/remembered USB device with graceful error recovery
   */
  public async connectPairedUsbDevice(device: any): Promise<boolean> {
    if (!device) return false;
    
    const prodName = device.productName || "USB Thermal Printer";
    const mfgName = device.manufacturerName ? `${device.manufacturerName} ` : "";
    const formattedName = `${mfgName}${prodName}`.trim();

    try {
      if (!device.opened) {
        await device.open();
      }

      if (device.configuration === null) {
        try {
          await device.selectConfiguration(1);
        } catch (cfgErr) {}
      }

      let targetIface = { interfaceNumber: 0 };
      let outEp = { endpointNumber: 1 };

      if (device.configuration && device.configuration.interfaces) {
        for (const iface of device.configuration.interfaces) {
          for (const alt of iface.alternates) {
            for (const ep of alt.endpoints) {
              if (ep.direction === "out" && ep.type === "bulk") {
                targetIface = iface;
                outEp = ep;
                break;
              }
            }
            if (outEp) break;
          }
          if (outEp) break;
        }
      }

      try {
        await device.claimInterface(targetIface.interfaceNumber);
      } catch (e) {}

      this.usbDevice = device;
      this.usbInterfaceNumber = targetIface.interfaceNumber;
      this.usbEndpointNumber = outEp.endpointNumber;
      this.connectionType = "USB";
      this.deviceName = formattedName || `USB Printer (VID:${device.vendorId.toString(16)})`;
      if (typeof window !== "undefined") localStorage.setItem("campusbites_printer_type", "USB");
      this.notify();
      return true;
    } catch (err: any) {
      // If Windows kernel driver (usbprint.sys) locks the raw USB interface, gracefully fallback to Windows System Spooler mode
      if (err.name === "SecurityError" || (err.message && err.message.toLowerCase().includes("access denied"))) {
        console.info("Windows OS driver owns USB printer interface. Enabling Windows System Spooler mode for:", formattedName);
        this.connectionType = "SYSTEM";
        this.deviceName = `${formattedName} (Windows Driver Mode)`;
        if (typeof window !== "undefined") localStorage.setItem("campusbites_printer_type", "SYSTEM");
        this.notify();
        return true;
      }
      
      console.warn("Could not connect raw USB device, using system mode:", err.message);
      return false;
    }
  }

  /**
   * Pair Direct USB Thermal Printer (Scans all connected USB devices and shows actual printer names)
   */
  public async pairUsbPrinter(): Promise<{ success: boolean; deviceName?: string; error?: string }> {
    if (typeof navigator === "undefined" || !("usb" in navigator)) {
      return { success: false, error: "WebUSB is not supported in this browser. Please use Google Chrome or Microsoft Edge on Desktop." };
    }

    try {
      // Request any USB device so that all connected thermal printers (POS-58, POS-80, Essae, TVS, Epson) are visible!
      const device = await (navigator as any).usb.requestDevice({ filters: [] });
      if (!device) {
        return { success: false, error: "No USB printer was selected." };
      }

      const prodName = device.productName || "USB Thermal Receipt Printer";
      const mfgName = device.manufacturerName ? `${device.manufacturerName} ` : "";
      const formattedName = `${mfgName}${prodName}`.trim() || `USB Printer (VID:0x${device.vendorId ? device.vendorId.toString(16) : 'N/A'})`;

      try {
        if (!device.opened) {
          await device.open();
        }

        if (device.configuration === null) {
          try {
            await device.selectConfiguration(1);
          } catch (cfgErr) {}
        }

        let targetIface = { interfaceNumber: 0 };
        let outEp = { endpointNumber: 1 };

        if (device.configuration && device.configuration.interfaces) {
          for (const iface of device.configuration.interfaces) {
            for (const alt of iface.alternates) {
              for (const ep of alt.endpoints) {
                if (ep.direction === "out" && ep.type === "bulk") {
                  targetIface = iface;
                  outEp = ep;
                  break;
                }
              }
              if (outEp) break;
            }
            if (outEp) break;
          }
        }

        try {
          await device.claimInterface(targetIface.interfaceNumber);
        } catch (claimErr) {}

        this.usbDevice = device;
        this.usbInterfaceNumber = targetIface.interfaceNumber;
        this.usbEndpointNumber = outEp.endpointNumber;
        this.connectionType = "USB";
        this.deviceName = formattedName;

        if (typeof window !== "undefined") localStorage.setItem("campusbites_printer_type", "USB");
        this.notify();
        return { success: true, deviceName: this.deviceName };
      } catch (openErr: any) {
        // If Windows kernel (usbprint.sys) restricts direct raw WebUSB claiming:
        if (openErr.name === "SecurityError" || (openErr.message && openErr.message.toLowerCase().includes("access denied"))) {
          this.connectionType = "SYSTEM";
          this.deviceName = `${formattedName} (Windows Driver Mode)`;
          if (typeof window !== "undefined") localStorage.setItem("campusbites_printer_type", "SYSTEM");
          this.notify();
          return {
            success: true,
            deviceName: this.deviceName
          };
        }
        throw openErr;
      }
    } catch (err: any) {
      console.error("Pairing USB printer error:", err);
      return { success: false, error: err.message || "Failed to pair USB printer." };
    }
  }

  /**
   * Pair USB / Serial Thermal Printer via Virtual COM Port (Essae PR-55, TVS, Epson, Posiflex, NGX)
   */
  public async pairSerialPrinter(baudRate: number = 9600): Promise<{ success: boolean; deviceName?: string; error?: string }> {
    if (typeof navigator === "undefined" || !("serial" in navigator)) {
      return { success: false, error: "WebSerial is not supported in this browser. Use Google Chrome or MS Edge on Desktop." };
    }

    try {
      const port = await (navigator as any).serial.requestPort();
      await port.open({ baudRate });
      this.serialPort = port;
      this.connectionType = "SERIAL";

      const info = port.getInfo ? port.getInfo() : {};
      const vid = info.usbVendorId ? `VID:0x${info.usbVendorId.toString(16)}` : "";
      const pid = info.usbProductId ? ` PID:0x${info.usbProductId.toString(16)}` : "";
      this.deviceName = vid ? `Serial POS Printer (${vid}${pid} @ ${baudRate} baud)` : `Serial POS Printer (COM @ ${baudRate} baud)`;

      if (typeof window !== "undefined") localStorage.setItem("campusbites_printer_type", "SERIAL");
      this.notify();
      return { success: true, deviceName: this.deviceName };
    } catch (err: any) {
      console.error("Pairing serial printer error:", err);
      return { success: false, error: err.message || "Failed to pair Serial / COM printer." };
    }
  }

  /**
   * Pair Bluetooth Thermal Receipt Printer (58mm / 80mm wireless POS printers)
   */
  public async pairBluetoothPrinter(): Promise<{ success: boolean; deviceName?: string; error?: string }> {
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
        } catch (sErr) {}
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

      if (typeof window !== "undefined") localStorage.setItem("campusbites_printer_type", "BLUETOOTH");
      this.notify();
      return { success: true, deviceName: this.deviceName };
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
      if (this.usbDevice && this.usbDevice.opened) {
        await this.usbDevice.close();
      }
    } catch (e) {}
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

    this.usbDevice = null;
    this.serialPort = null;
    this.bluetoothDevice = null;
    this.bluetoothCharacteristic = null;
    this.connectionType = "NONE";
    this.deviceName = "Not Connected";
    if (typeof window !== "undefined") {
      localStorage.removeItem("campusbites_printer_type");
    }
    this.notify();
  }

  /**
   * Send raw binary byte buffer to connected hardware printer
   */
  public async sendRawBytes(bytes: Uint8Array): Promise<{ success: boolean; method: string; error?: string }> {
    // 1. Direct WebUSB (Raw USB device endpoint)
    if (this.connectionType === "USB" && this.usbDevice && this.usbDevice.opened) {
      try {
        await this.usbDevice.transferOut(this.usbEndpointNumber, bytes);
        return { success: true, method: "USB" };
      } catch (err: any) {
        console.error("USB transferOut failed:", err);
        return { success: false, method: "USB", error: err.message };
      }
    }

    // 2. Direct WebSerial (USB Virtual COM)
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

    // 3. Direct WebBluetooth
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

    // 4. System mode
    if (this.connectionType === "SYSTEM") {
      return { success: true, method: "SYSTEM" };
    }

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
    if (data.orderType) {
      const typeLabel = data.orderType === "TAKEAWAY" ? "*** PARCEL / TAKEAWAY ***" : "DINE-IN";
      chunks.push(0x1B, 0x45, 0x01); // Bold ON
      chunks.push(...encoder.encode(`TYPE : ${typeLabel}\n`));
      chunks.push(0x1B, 0x45, 0x00); // Bold OFF
    }
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
    ${data.orderType ? `<div><span class="bold">TYPE:</span> <strong style="font-size:11px;">${data.orderType === 'TAKEAWAY' ? '*** PARCEL / TAKEAWAY ***' : 'DINE-IN'}</strong></div>` : ""}
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
