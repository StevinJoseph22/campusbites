const { Server } = require("socket.io");
const http = require("http");

const PORT = process.env.PORT || 4000;
const server = http.createServer();

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

io.on("connection", (socket) => {
  console.log(`[Socket.io] Client connected: ${socket.id}`);

  // Join vendor room
  socket.on("join_vendor", (vendorId) => {
    socket.join(`vendor-${vendorId}`);
    console.log(`[Socket.io] Client ${socket.id} joined vendor room: vendor-${vendorId}`);
  });

  // Join student order room
  socket.on("join_student_order", (orderId) => {
    socket.join(`order-${orderId}`);
    console.log(`[Socket.io] Client ${socket.id} joined order room: order-${orderId}`);
  });

  // Student places new order -> notify vendor(s)
  socket.on("new_order", (orderData) => {
    console.log(`[Socket.io] New order emitted: #${orderData.orderId}`);
    io.emit("vendor_new_order", orderData);
  });

  // Vendor updates order status -> notify student
  socket.on("update_order_status", (statusData) => {
    console.log(`[Socket.io] Order status updated: ${statusData.tokenNumber} -> ${statusData.status}`);
    io.emit("order_status_updated", statusData);
  });

  socket.on("disconnect", () => {
    console.log(`[Socket.io] Client disconnected: ${socket.id}`);
  });
});

server.listen(PORT, () => {
  console.log(`🚀 CampusBites Socket.io Real-Time Server running on http://localhost:${PORT}`);
});
