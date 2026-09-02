import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { brandEmailShell, emailBadge, emailRow, sendBrandedEmail } from "@/lib/email";

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
        where: { tokenNumber },
        include: { order: true }
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
          studentName: portion.order?.studentName || null,
          studentRegNumber: portion.order?.studentRegNumber || null,
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
        studentName: order.studentName || null,
        studentRegNumber: order.studentRegNumber || null,
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
          studentName: order.studentName || null,
          studentRegNumber: order.studentRegNumber || null,
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
      orderBy: { createdAt: "desc" },
      include: { order: true }
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
      studentName: o.order?.studentName || null,
      studentRegNumber: o.order?.studentRegNumber || null,
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
      email,
      studentName,
      studentRegNumber
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
        studentName: studentName?.trim() || null,
        studentRegNumber: studentRegNumber?.trim() || null,
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

    if (studentEmail && studentEmail !== "student@kristujayanti.com") {
      await sendOrderPlacedEmail(studentEmail, masterToken, totalAmount, vendorPortions);
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

async function sendOrderPlacedEmail(email: string, masterToken: string, totalAmount: number, vendorPortions: any[]) {
  const portionsHtml = vendorPortions.map((p: any) => {
    const itemsHtml = (p.items || [])
      .map((i: any) => emailRow(`${i.quantity}x ${i.name}`, `₹${(i.price * i.quantity).toFixed(2)}`))
      .join("");
    return `
      <div style="margin:16px 0; padding:14px 16px; background-color:#F5F6F2; border:1px solid rgba(25,28,30,0.15); border-radius:4px;">
        <div style="display:flex; justify-content:space-between; font-size:13px; font-weight:700; margin-bottom:8px;">
          <span>${p.stallName}</span>
          <span style="font-family:'Courier New',monospace;">${p.tokenNumber}</span>
        </div>
        <div style="font-size:11px; color:#534437; margin-bottom:8px;">Pickup slot: ${p.pickupTimeSlot || "—"}</div>
        ${itemsHtml}
      </div>`;
  }).join("");

  const html = brandEmailShell({
    eyebrow: "Order placed",
    heading: "We've got your order!",
    bodyHtml: `
      <p style="margin:0 0 12px;">Payment confirmed. Your master token is:</p>
      <div style="text-align:center; margin:16px 0;">
        <span style="display:inline-block; font-family:'Courier New',monospace; font-size:20px; font-weight:700; background-color:#F5F6F2; border:1px solid rgba(25,28,30,0.15); padding:10px 20px; border-radius:6px;">${masterToken}</span>
      </div>
      ${portionsHtml}
      ${emailRow("Total paid", `₹${Number(totalAmount).toFixed(2)}`, { strong: true })}
      <p style="margin:16px 0 0; color:#534437; font-size:12px;">We'll email you again the moment each stall has your food ready for pickup.</p>
    `
  });

  await sendBrandedEmail({ to: email, subject: `Order confirmed — token ${masterToken}`, html });
}

async function sendOrderStatusEmail(email: string, status: string, stallName: string, itemsJsonStr: string, tokenNumber: string, subtotal?: number) {
  try {
    const items = JSON.parse(itemsJsonStr);
    const itemsHtml = items
      .map((i: any) => emailRow(`${i.quantity}x ${i.name}`, `₹${(i.price * i.quantity).toFixed(2)}`))
      .join("");

    let subject = "";
    let heading = "";
    let bodyDesc = "";
    let badge = "";
    let tone: "marigold" | "sage" | "chili" = "marigold";

    if (status === "READY") {
      subject = `Ready for pickup — ${stallName}`;
      heading = "Your food is ready!";
      bodyDesc = `Your order from <strong>${stallName}</strong> has been packed and is ready at the counter. Show your token to collect it.`;
      badge = "READY FOR PICKUP";
      tone = "sage";
    } else if (status === "FULFILLED") {
      subject = `Order collected — receipt from ${stallName}`;
      heading = "Thanks for picking up your order";
      bodyDesc = `Here's your receipt from <strong>${stallName}</strong>. Enjoy your meal!`;
      badge = "COLLECTED";
      tone = "sage";
    } else if (status === "REFUNDED") {
      subject = `Refund issued — ${stallName}`;
      heading = "Your order was refunded";
      bodyDesc = `Your order from <strong>${stallName}</strong> was cancelled and a full refund has been credited back to your payment account. We're sorry for the inconvenience.`;
      badge = "REFUNDED";
      tone = "chili";
    } else {
      return; // Do not send email for other statuses
    }

    const html = brandEmailShell({
      eyebrow: "Order update",
      heading,
      bodyHtml: `
        <div style="margin-bottom:14px;">${emailBadge(badge, tone)}</div>
        <p style="margin:0 0 14px;">${bodyDesc}</p>
        ${emailRow("Token", tokenNumber, { strong: true })}
        <div style="margin:14px 0; padding:12px 14px; background-color:#F5F6F2; border:1px solid rgba(25,28,30,0.15); border-radius:4px;">
          ${itemsHtml}
          ${subtotal !== undefined ? emailRow("Subtotal", `₹${subtotal.toFixed(2)}`, { strong: true }) : ""}
        </div>
      `
    });

    await sendBrandedEmail({ to: email, subject, html });
  } catch (err) {
    console.error("sendOrderStatusEmail error:", err);
  }
}

async function sendPartialHoldEmail(email: string, stallName: string, oosItemName: string, tokenNumber: string) {
  try {
    const html = brandEmailShell({
      eyebrow: "Action required",
      heading: "One item ran out",
      bodyHtml: `
        <div style="margin-bottom:14px;">${emailBadge("ACTION REQUIRED", "chili")}</div>
        <p style="margin:0 0 14px;">The kitchen at <strong>${stallName}</strong> is out of "<strong>${oosItemName}</strong>" from your order (Token: <strong>${tokenNumber}</strong>).</p>
        <div style="margin:14px 0; padding:14px 16px; background-color:#F5F6F2; border:1px solid rgba(25,28,30,0.15); border-radius:4px; text-align:center; font-size:12px; font-weight:700;">
          Open your order page to choose:<br />
          Continue with the rest (partial refund) — or — Cancel the whole order (full refund)
        </div>
        <p style="margin:0; color:#534437; font-size:12px;">We'll hold cooking until you decide.</p>
      `
    });

    await sendBrandedEmail({
      to: email,
      subject: `Action needed — an item is out of stock at ${stallName}`,
      html
    });
  } catch (err) {
    console.error("sendPartialHoldEmail error:", err);
  }
}

async function sendPartialResolutionEmail(email: string, resolution: "CONTINUE" | "CANCEL", stallName: string, itemsJsonStr: string, tokenNumber: string, refundAmount: number) {
  try {
    const items = JSON.parse(itemsJsonStr);
    const itemsHtml = items
      .map((i: any) => i.outOfStock
        ? emailRow(`${i.quantity}x ${i.name} (out of stock)`, "—", { color: "#B23A2A" })
        : emailRow(`${i.quantity}x ${i.name}`, `₹${(i.price * i.quantity).toFixed(2)}`))
      .join("");

    let subject = "";
    let heading = "";
    let bodyDesc = "";
    let badge = "";

    if (resolution === "CONTINUE") {
      subject = `Order adjusted — ${stallName}`;
      heading = "Continuing with the rest of your order";
      bodyDesc = `You chose to continue with the available items. A partial refund of <strong>₹${refundAmount}</strong> is on its way back to your payment account. The kitchen is preparing what's left.`;
      badge = "CONTINUING";
    } else {
      subject = `Order cancelled — ${stallName}`;
      heading = "Your order was cancelled";
      bodyDesc = `As requested, your order from <strong>${stallName}</strong> (Token: <strong>${tokenNumber}</strong>) has been cancelled and a full refund of <strong>₹${refundAmount}</strong> has been credited back.`;
      badge = "CANCELLED";
    }

    const html = brandEmailShell({
      eyebrow: "Resolution confirmed",
      heading,
      bodyHtml: `
        <div style="margin-bottom:14px;">${emailBadge(badge, resolution === "CONTINUE" ? "sage" : "chili")}</div>
        <p style="margin:0 0 14px;">${bodyDesc}</p>
        <div style="margin:14px 0; padding:12px 14px; background-color:#F5F6F2; border:1px solid rgba(25,28,30,0.15); border-radius:4px;">
          ${itemsHtml}
        </div>
        ${emailRow("Refund amount", `₹${refundAmount}`, { strong: true, color: "#3F7A55" })}
      `
    });

    await sendBrandedEmail({ to: email, subject, html });
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
        updated.tokenNumber,
        updated.subtotal
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
