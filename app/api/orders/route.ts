import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const restaurantId = searchParams.get("restaurantId");
    const orderId = searchParams.get("orderId");
    const studentEmail = searchParams.get("studentEmail");
    const checkSlots = searchParams.get("checkSlots");
    const tokenNumber = searchParams.get("tokenNumber");

    if (tokenNumber) {
      const portion = await prisma.orderItem.findUnique({
        where: { tokenNumber }
      });
      if (!portion) {
        return NextResponse.json({ success: false, error: "Token not found" }, { status: 404 });
      }
      return NextResponse.json({
        success: true,
        order: {
          orderId: portion.orderId,
          tokenNumber: portion.tokenNumber,
          stallName: portion.stallName,
          pickupTimeSlot: portion.pickupTimeSlot,
          items: JSON.parse(portion.itemsJson),
          subtotal: portion.subtotal,
          customerNotes: portion.customerNotes || "No notes",
          status: portion.status
        }
      });
    }

    if (checkSlots === "true") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const orderItems = await prisma.orderItem.findMany({
        where: {
          createdAt: {
            gte: today
          }
        },
        select: {
          pickupTimeSlot: true
        }
      });

      const counts: Record<string, number> = {};
      orderItems.forEach(item => {
        counts[item.pickupTimeSlot] = (counts[item.pickupTimeSlot] || 0) + 1;
      });

      return NextResponse.json({ success: true, slotCounts: counts });
    }

    // Fetch all orders for a student by email
    if (studentEmail) {
      const orders = await prisma.order.findMany({
        where: { email: studentEmail },
        include: {
          vendorPortions: true
        },
        orderBy: { createdAt: "desc" }
      });

      const mapped = orders.map(order => {
        const mappedPortions = order.vendorPortions.map(p => ({
          stallId: p.stallId,
          stallName: p.stallName,
          tokenNumber: p.tokenNumber,
          pickupTimeSlot: p.pickupTimeSlot,
          customerNotes: p.customerNotes || "No notes",
          items: JSON.parse(p.itemsJson),
          subtotal: p.subtotal,
          status: p.status
        }));

        return {
          orderId: order.orderId,
          masterToken: order.masterToken,
          placedAt: order.placedAt,
          placedTimestamp: order.placedTimestamp ? Number(order.placedTimestamp) : Date.now(),
          paymentMethod: order.paymentMethod,
          paymentStatus: order.paymentStatus,
          totalAmount: order.totalAmount,
          customerNotes: order.customerNotes || "",
          vendorPortions: mappedPortions
        };
      });

      return NextResponse.json({ success: true, orders: mapped });
    }

    // Fetch details of a single order by orderId
    if (orderId) {
      const order = await prisma.order.findUnique({
        where: { orderId },
        include: {
          vendorPortions: true
        }
      });

      if (!order) {
        return NextResponse.json(
          { success: false, error: "Order not found" },
          { status: 404 }
        );
      }

      const mappedPortions = order.vendorPortions.map(p => ({
        stallId: p.stallId,
        stallName: p.stallName,
        tokenNumber: p.tokenNumber,
        pickupTimeSlot: p.pickupTimeSlot,
        customerNotes: p.customerNotes || "No notes",
        items: JSON.parse(p.itemsJson),
        subtotal: p.subtotal,
        status: p.status
      }));

      const mappedOrder = {
        orderId: order.orderId,
        masterToken: order.masterToken,
        placedAt: order.placedAt,
        placedTimestamp: order.placedTimestamp ? Number(order.placedTimestamp) : Date.now(),
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        totalAmount: order.totalAmount,
        customerNotes: order.customerNotes || "",
        vendorPortions: mappedPortions
      };

      return NextResponse.json({ success: true, order: mappedOrder });
    }

    // Super Admin: Fetch all orders across all canteens
    const isAdmin = searchParams.get("isAdmin");
    if (isAdmin === "true") {
      const orders = await prisma.order.findMany({
        include: {
          vendorPortions: true
        },
        orderBy: { createdAt: "desc" }
      });

      const mapped = orders.map(order => {
        const mappedPortions = order.vendorPortions.map(p => ({
          stallId: p.stallId,
          stallName: p.stallName,
          tokenNumber: p.tokenNumber,
          pickupTimeSlot: p.pickupTimeSlot,
          customerNotes: p.customerNotes || "No notes",
          items: JSON.parse(p.itemsJson),
          subtotal: p.subtotal,
          status: p.status
        }));

        return {
          orderId: order.orderId,
          masterToken: order.masterToken,
          placedAt: order.placedAt,
          placedTimestamp: order.placedTimestamp ? Number(order.placedTimestamp) : Date.now(),
          paymentMethod: order.paymentMethod,
          paymentStatus: order.paymentStatus,
          totalAmount: order.totalAmount,
          customerNotes: order.customerNotes || "",
          createdAt: order.createdAt,
          vendorPortions: mappedPortions
        };
      });

      return NextResponse.json({ success: true, orders: mapped });
    }

    // Otherwise, fetch all orders for a restaurant stall
    if (!restaurantId) {
      return NextResponse.json(
        { success: false, error: "Restaurant ID or Order ID is required" },
        { status: 400 }
      );
    }

    const items = await prisma.orderItem.findMany({
      where: { stallId: restaurantId },
      orderBy: { createdAt: "desc" }
    });

    // Map DB items to front-end records
    const mapped = items.map(o => ({
      orderId: o.orderId,
      stallId: o.stallId,
      tokenNumber: o.tokenNumber,
      stallName: o.stallName,
      customerNotes: o.customerNotes || "No notes",
      pickupTimeSlot: o.pickupTimeSlot,
      items: JSON.parse(o.itemsJson),
      subtotal: o.subtotal,
      status: o.status,
      placedAt: new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: new Date(o.createdAt).getTime()
    }));

    return NextResponse.json({ success: true, orders: mapped });
  } catch (error: any) {
    console.error("GET orders error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      orderId,
      masterToken,
      totalAmount,
      customerNotes,
      vendorPortions,
      email
    } = body;

    if (!orderId || !vendorPortions || !Array.isArray(vendorPortions)) {
      return NextResponse.json(
        { success: false, error: "Invalid order payload" },
        { status: 400 }
      );
    }

    let studentEmail = email?.trim() || "";
    if (!studentEmail.includes("@")) {
      if (studentEmail && /^[a-zA-Z0-9]+$/.test(studentEmail)) {
        studentEmail = `${studentEmail}@kristujayanti.com`;
      } else {
        studentEmail = "student@kristujayanti.com";
      }
    }

    // Save master order
    const masterOrder = await prisma.order.create({
      data: {
        orderId,
        masterToken,
        totalAmount,
        customerNotes,
        email: studentEmail,
        paymentStatus: "PAID",
        paymentMethod: "Razorpay"
      }
    });

    // Save portions & decrement stock count
    for (const portion of vendorPortions) {
      await prisma.orderItem.create({
        data: {
          orderId: masterOrder.id,
          stallId: portion.stallId,
          stallName: portion.stallName,
          tokenNumber: portion.tokenNumber,
          pickupTimeSlot: portion.pickupTimeSlot,
          customerNotes: portion.customerNotes,
          itemsJson: JSON.stringify(portion.items),
          subtotal: portion.subtotal,
          status: "PLACED"
        }
      });

      // Decrement stock in database for COUNTED items
      for (const item of portion.items) {
        // Find menu item
        const dbItem = await prisma.menuItem.findFirst({
          where: {
            restaurantId: portion.stallId,
            name: item.name
          }
        });

        if (dbItem && dbItem.stockType === "COUNTED") {
          const newStock = Math.max(0, dbItem.stockCount - item.quantity);
          await prisma.menuItem.update({
            where: { id: dbItem.id },
            data: { stockCount: newStock }
          });
        }
      }
    }

    return NextResponse.json({ success: true, message: "Order stored in database" });
  } catch (error: any) {
    console.error("POST order error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create order" },
      { status: 500 }
    );
  }
}

async function sendOrderStatusEmail(email: string, status: string, stallName: string, itemsJsonStr: string, tokenNumber: string) {
  try {
    const items = JSON.parse(itemsJsonStr);
    const itemsHtml = items.map((i: any) => `<li><strong>${i.name}</strong> x ${i.quantity}</li>`).join("");
    
    let subject = "";
    let bodyTitle = "";
    let bodyDesc = "";
    let statusColor = "";
    
    if (status === "READY") {
      subject = `🍔 Your Order from ${stallName} is Packed & Ready!`;
      bodyTitle = "Your food is packed and ready!";
      bodyDesc = `Great news! Your order from <strong>${stallName}</strong> (Token: <strong>${tokenNumber}</strong>) has been packed and is ready for pickup at the counter. Please present your token number to collect your hot meal.`;
      statusColor = "#10b981"; // emerald
    } else if (status === "REFUNDED") {
      subject = `⚠️ Refund Confirmation: Order from ${stallName}`;
      bodyTitle = "Order Refund Issued";
      bodyDesc = `Your order from <strong>${stallName}</strong> (Token: <strong>${tokenNumber}</strong>) has been cancelled and a full refund has been credited back to your payment account. We apologize for any inconvenience.`;
      statusColor = "#ef4444"; // red
    } else {
      return; // Do not send email for other statuses
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${bodyTitle}</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #0b1329;
            color: #f1f5f9;
            margin: 0;
            padding: 40px 20px;
          }
          .email-card {
            max-width: 500px;
            margin: 0 auto;
            background: rgba(30, 41, 59, 0.7);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 20px;
            padding: 30px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(10px);
          }
          .logo {
            font-size: 16px;
            font-weight: 900;
            color: #f97316;
            margin-bottom: 25px;
            text-align: center;
          }
          h2 {
            font-size: 20px;
            font-weight: 800;
            color: #ffffff;
            margin-top: 0;
            text-align: center;
          }
          p {
            font-size: 13px;
            line-height: 1.6;
            color: #94a3b8;
          }
          .status-badge {
            background-color: ${statusColor};
            color: #ffffff;
            font-size: 12px;
            font-weight: 800;
            padding: 6px 12px;
            border-radius: 8px;
            display: inline-block;
            margin-bottom: 15px;
            text-transform: uppercase;
          }
          .items-box {
            background-color: #0f172a;
            border: 1px solid #1e293b;
            border-radius: 12px;
            padding: 15px 20px;
            margin: 20px 0;
          }
          .items-box ul {
            margin: 0;
            padding-left: 20px;
            color: #cbd5e1;
            font-size: 13px;
          }
          .items-box li {
            margin-bottom: 8px;
          }
          .footer {
            margin-top: 30px;
            border-top: 1px solid rgba(255, 255, 255, 0.05);
            padding-top: 20px;
            font-size: 10px;
            color: #64748b;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="email-card">
          <div class="logo">Kristu Jayanti University • CampusBites</div>
          <h2>${bodyTitle}</h2>
          <center>
            <div class="status-badge">${status}</div>
          </center>
          <p>${bodyDesc}</p>
          
          <div class="items-box">
            <p style="margin-top:0; font-weight:800; color:#f97316;">Order Details:</p>
            <ul>
              ${itemsHtml}
            </ul>
          </div>
          
          <p style="font-size:11px; text-align:center; color:#64748b;">
            This is an automated order update from the CampusBites Canteen Hub.
          </p>
          <div class="footer">
            © 2026 Kristu Jayanti University, Canteen Hub. All rights reserved.
          </div>
        </div>
      </body>
      </html>
    `;

    const nodemailer = require("nodemailer");
    if (process.env.SMTP_HOST) {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === "true",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });

      await transporter.sendMail({
        from: `"CampusBites" <noreply@kristujayanti.com>`,
        to: email,
        subject,
        html: htmlContent
      });
      console.log(`[SMTP EMAIL LOG] Sent status update (${status}) to ${email}`);
    } else {
      console.log(`[SMTP SKIPPED] No SMTP credentials. Mock status update (${status}) printed for ${email}`);
    }

    // Save to public directory for easy previewing
    try {
      const fs = require("fs");
      const path = require("path");
      const publicDir = path.join(process.cwd(), "public", "emails");
      if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
      }
      fs.writeFileSync(path.join(publicDir, "last-status.html"), htmlContent);
    } catch (fsErr) {
      console.error("Failed to write mock status email file:", fsErr);
    }
  } catch (err) {
    console.error("sendOrderStatusEmail error:", err);
  }
}

async function sendPartialHoldEmail(email: string, stallName: string, oosItemName: string, tokenNumber: string) {
  try {
    const subject = `⚠️ ACTION REQUIRED: Item Out of Stock in your Order from ${stallName}`;
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Action Required: Item Out of Stock</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #0b1329;
            color: #f1f5f9;
            margin: 0;
            padding: 40px 20px;
          }
          .email-card {
            max-width: 500px;
            margin: 0 auto;
            background: rgba(30, 41, 59, 0.7);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 20px;
            padding: 30px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(10px);
          }
          .logo {
            font-size: 16px;
            font-weight: 900;
            color: #f97316;
            margin-bottom: 25px;
            text-align: center;
          }
          h2 {
            font-size: 20px;
            font-weight: 800;
            color: #ffffff;
            margin-top: 0;
            text-align: center;
          }
          p {
            font-size: 13px;
            line-height: 1.6;
            color: #94a3b8;
          }
          .warning-badge {
            background-color: #f59e0b;
            color: #ffffff;
            font-size: 12px;
            font-weight: 800;
            padding: 6px 12px;
            border-radius: 8px;
            display: inline-block;
            margin-bottom: 15px;
            text-transform: uppercase;
          }
          .action-box {
            background-color: #0f172a;
            border: 1px solid #1e293b;
            border-radius: 12px;
            padding: 15px 20px;
            margin: 20px 0;
            text-align: center;
          }
          .footer {
            margin-top: 30px;
            border-top: 1px solid rgba(255, 255, 255, 0.05);
            padding-top: 20px;
            font-size: 10px;
            color: #64748b;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="email-card">
          <div class="logo">Kristu Jayanti University • CampusBites</div>
          <h2>Item Out of Stock Alert</h2>
          <center>
            <div class="warning-badge">Action Required</div>
          </center>
          <p>
            The kitchen at <strong>${stallName}</strong> has flagged that the item "<strong>${oosItemName}</strong>" from your order (Token: <strong>${tokenNumber}</strong>) is currently **out of stock**.
          </p>
          <p>
            Please open the CampusBites web app and navigate to your order confirmation page to choose whether you would like to:
          </p>
          
          <div class="action-box">
            <p style="margin: 0; font-weight:800; color:#f97316; font-size:13px; line-height:1.6;">
              1. Continue with remaining items (Partial Refund)<br>
              OR<br>
              2. Cancel whole order (Full Refund)
            </p>
          </div>
          
          <p style="font-size:11px; text-align:center; color:#64748b;">
            Your response is required to resume cooking or generate your refund.
          </p>
          <div class="footer">
            © 2026 Kristu Jayanti University, Canteen Hub. All rights reserved.
          </div>
        </div>
      </body>
      </html>
    `;

    const nodemailer = require("nodemailer");
    if (process.env.SMTP_HOST) {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === "true",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });

      await transporter.sendMail({
        from: `"CampusBites" <noreply@kristujayanti.com>`,
        to: email,
        subject,
        html: htmlContent
      });
      console.log(`[SMTP EMAIL LOG] Sent Partial Hold alert email to ${email}`);
    }
  } catch (err) {
    console.error("sendPartialHoldEmail error:", err);
  }
}

async function sendPartialResolutionEmail(email: string, resolution: "CONTINUE" | "CANCEL", stallName: string, itemsJsonStr: string, tokenNumber: string, refundAmount: number) {
  try {
    const items = JSON.parse(itemsJsonStr);
    const itemsHtml = items.map((i: any) => `<li>${i.outOfStock ? `<del style="color:#ef4444;">${i.name}</del> <span style="color:#ef4444;">[OUT OF STOCK]</span>` : `<strong>${i.name}</strong>`} x ${i.quantity}</li>`).join("");

    let subject = "";
    let bodyTitle = "";
    let bodyDesc = "";
    let statusColor = "";

    if (resolution === "CONTINUE") {
      subject = `✓ Resolution Confirmed: Continuing Order from ${stallName}`;
      bodyTitle = "Order Adjusted - Continuing Prep";
      bodyDesc = `You chose to **continue** with the available items. A partial refund of <strong>₹${refundAmount}</strong> has been processed to your account. The kitchen is preparing the remaining items for pickup.`;
      statusColor = "#10b981"; // green
    } else {
      subject = `❌ Order Cancelled: ${stallName}`;
      bodyTitle = "Entire Order Cancelled";
      bodyDesc = `As requested, your entire order from <strong>${stallName}</strong> (Token: <strong>${tokenNumber}</strong>) has been cancelled. A full refund of <strong>₹${refundAmount}</strong> has been credited back to your payment account.`;
      statusColor = "#ef4444"; // red
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${bodyTitle}</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #0b1329;
            color: #f1f5f9;
            margin: 0;
            padding: 40px 20px;
          }
          .email-card {
            max-width: 500px;
            margin: 0 auto;
            background: rgba(30, 41, 59, 0.7);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 20px;
            padding: 30px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(10px);
          }
          .logo {
            font-size: 16px;
            font-weight: 900;
            color: #f97316;
            margin-bottom: 25px;
            text-align: center;
          }
          h2 {
            font-size: 20px;
            font-weight: 800;
            color: #ffffff;
            margin-top: 0;
            text-align: center;
          }
          p {
            font-size: 13px;
            line-height: 1.6;
            color: #94a3b8;
          }
          .status-badge {
            background-color: ${statusColor};
            color: #ffffff;
            font-size: 12px;
            font-weight: 800;
            padding: 6px 12px;
            border-radius: 8px;
            display: inline-block;
            margin-bottom: 15px;
            text-transform: uppercase;
          }
          .items-box {
            background-color: #0f172a;
            border: 1px solid #1e293b;
            border-radius: 12px;
            padding: 15px 20px;
            margin: 20px 0;
          }
          .items-box ul {
            margin: 0;
            padding-left: 20px;
            color: #cbd5e1;
            font-size: 13px;
          }
          .items-box li {
            margin-bottom: 8px;
          }
          .footer {
            margin-top: 30px;
            border-top: 1px solid rgba(255, 255, 255, 0.05);
            padding-top: 20px;
            font-size: 10px;
            color: #64748b;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="email-card">
          <div class="logo">Kristu Jayanti University • CampusBites</div>
          <h2>${bodyTitle}</h2>
          <center>
            <div class="status-badge">${resolution}</div>
          </center>
          <p>${bodyDesc}</p>
          
          <div class="items-box">
            <p style="margin-top:0; font-weight:800; color:#f97316;">Order Resolution Summary:</p>
            <ul>
              ${itemsHtml}
            </ul>
          </div>
          
          <p style="font-size:12px; text-align:center; font-weight:bold; color:#10b981;">
            Refund Value Generated: ₹${refundAmount}
          </p>
          
          <div class="footer">
            © 2026 Kristu Jayanti University, Canteen Hub. All rights reserved.
          </div>
        </div>
      </body>
      </html>
    `;

    const nodemailer = require("nodemailer");
    if (process.env.SMTP_HOST) {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === "true",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });

      await transporter.sendMail({
        from: `"CampusBites" <noreply@kristujayanti.com>`,
        to: email,
        subject,
        html: htmlContent
      });
      console.log(`[SMTP EMAIL LOG] Sent Partial Resolution (${resolution}) email to ${email}`);
    }
  } catch (err) {
    console.error("sendPartialResolutionEmail error:", err);
  }
}

export async function PUT(req: Request) {
  try {
    const { tokenNumber, status, flagOutOfStockItem, resolution } = await req.json();

    if (!tokenNumber) {
      return NextResponse.json(
        { success: false, error: "Token number is required" },
        { status: 400 }
      );
    }

    // 1. Action: Vendor flags an item as out of stock
    if (flagOutOfStockItem) {
      const orderItem = await prisma.orderItem.findUnique({
        where: { tokenNumber }
      });

      if (!orderItem) {
        return NextResponse.json(
          { success: false, error: "Order item not found" },
          { status: 404 }
        );
      }

      const items = JSON.parse(orderItem.itemsJson);
      const updatedItems = items.map((i: any) => 
        i.name === flagOutOfStockItem ? { ...i, outOfStock: true } : i
      );

      const updated = await prisma.orderItem.update({
        where: { tokenNumber },
        data: {
          itemsJson: JSON.stringify(updatedItems),
          status: "PARTIAL_HOLD"
        },
        include: {
          order: true
        }
      });

      // Send email alert to user that an item is out of stock and requires resolution
      if (updated.order && updated.order.email) {
        await sendPartialHoldEmail(
          updated.order.email,
          updated.stallName,
          flagOutOfStockItem,
          updated.tokenNumber
        );
      }

      return NextResponse.json({ success: true, order: updated });
    }

    // 2. Action: Student resolves the partial hold (CONTINUE vs CANCEL)
    if (resolution) {
      const orderItem = await prisma.orderItem.findUnique({
        where: { tokenNumber },
        include: { order: true }
      });

      if (!orderItem) {
        return NextResponse.json(
          { success: false, error: "Order item not found" },
          { status: 404 }
        );
      }

      if (resolution === "CONTINUE") {
        const items = JSON.parse(orderItem.itemsJson);
        const oosItem = items.find((i: any) => i.outOfStock);
        let refundAmount = 0;
        if (oosItem) {
          refundAmount = oosItem.price * oosItem.quantity;
        }

        const newSubtotal = Math.max(0, orderItem.subtotal - refundAmount);

        const updated = await prisma.orderItem.update({
          where: { tokenNumber },
          data: {
            status: "ACCEPTED",
            subtotal: newSubtotal
          },
          include: {
            order: true
          }
        });

        if (updated.order && updated.order.email) {
          await sendPartialResolutionEmail(
            updated.order.email,
            "CONTINUE",
            updated.stallName,
            updated.itemsJson,
            updated.tokenNumber,
            refundAmount
          );
        }

        return NextResponse.json({ success: true, order: updated });
      } else if (resolution === "CANCEL") {
        const updated = await prisma.orderItem.update({
          where: { tokenNumber },
          data: {
            status: "REFUNDED"
          },
          include: {
            order: true
          }
        });

        if (updated.order && updated.order.email) {
          await sendPartialResolutionEmail(
            updated.order.email,
            "CANCEL",
            updated.stallName,
            updated.itemsJson,
            updated.tokenNumber,
            orderItem.subtotal
          );
        }

        return NextResponse.json({ success: true, order: updated });
      }
    }

    if (!status) {
      return NextResponse.json(
        { success: false, error: "Status or resolution or flagOutOfStockItem is required" },
        { status: 400 }
      );
    }

    const updated = await prisma.orderItem.update({
      where: { tokenNumber },
      data: { status },
      include: {
        order: true
      }
    });

    // Send email when status is set to READY or REFUNDED
    if (updated.order && updated.order.email) {
      await sendOrderStatusEmail(
        updated.order.email,
        status,
        updated.stallName,
        updated.itemsJson,
        updated.tokenNumber
      );
    }

    return NextResponse.json({ success: true, order: updated });
  } catch (error: any) {
    console.error("PUT order status error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update order status" },
      { status: 500 }
    );
  }
}
