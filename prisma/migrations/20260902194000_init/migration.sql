-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'STUDENT',
    "isTempPassword" BOOLEAN NOT NULL DEFAULT false,
    "campus" TEXT DEFAULT 'Airport Road Campus',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OtpVerification" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "otpCode" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OtpVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Restaurant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tokenPrefix" TEXT NOT NULL,
    "floor" TEXT NOT NULL DEFAULT 'Ground Floor',
    "cuisine" TEXT NOT NULL,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 4.8,
    "logo" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'PURE_VEG',
    "pinCodeHash" TEXT NOT NULL DEFAULT '123456',
    "isOpen" BOOLEAN NOT NULL DEFAULT true,
    "campus" TEXT NOT NULL DEFAULT 'Airport Road Campus',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Restaurant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenuItem" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'Veg',
    "prepTime" INTEGER NOT NULL DEFAULT 10,
    "image" TEXT,
    "isVeg" BOOLEAN NOT NULL DEFAULT true,
    "takeawayCharge" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "stockCount" INTEGER NOT NULL DEFAULT 100,
    "stockType" TEXT NOT NULL DEFAULT 'COUNTED',
    "available" BOOLEAN NOT NULL DEFAULT true,
    "availableFrom" TEXT NOT NULL DEFAULT '10:00 AM',
    "isBestseller" BOOLEAN NOT NULL DEFAULT false,
    "offerType" TEXT NOT NULL DEFAULT 'NONE',
    "offerValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "variants" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MenuItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "masterToken" TEXT NOT NULL,
    "userId" TEXT,
    "email" TEXT,
    "studentName" TEXT,
    "studentRegNumber" TEXT,
    "placedAt" TEXT NOT NULL DEFAULT '12:15 PM',
    "placedTimestamp" BIGINT,
    "paymentMethod" TEXT NOT NULL DEFAULT 'UPI',
    "paymentStatus" TEXT NOT NULL DEFAULT 'PAID',
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "customerNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "stallId" TEXT NOT NULL,
    "stallName" TEXT NOT NULL,
    "tokenNumber" TEXT NOT NULL,
    "pickupTimeSlot" TEXT NOT NULL,
    "customerNotes" TEXT,
    "itemsJson" TEXT NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PLACED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemSetting" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "platformFee" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
    "takeawayFee" DOUBLE PRECISION NOT NULL DEFAULT 10.0,

    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Order_orderId_key" ON "Order"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "OrderItem_tokenNumber_key" ON "OrderItem"("tokenNumber");

-- AddForeignKey
ALTER TABLE "MenuItem" ADD CONSTRAINT "MenuItem_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_stallId_fkey" FOREIGN KEY ("stallId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
