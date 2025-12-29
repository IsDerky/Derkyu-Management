-- CreateTable
CREATE TABLE "InstallmentPlan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "description" TEXT NOT NULL,
    "totalAmount" REAL NOT NULL,
    "numberOfPayments" INTEGER NOT NULL DEFAULT 3,
    "dayOfMonth" INTEGER NOT NULL,
    "firstPaymentDate" DATETIME NOT NULL,
    "categoryId" TEXT,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "InstallmentPlan_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "FinanceCategory" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "InstallmentPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InstallmentPayment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "installmentPlanId" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "dueDate" DATETIME NOT NULL,
    "paymentNumber" INTEGER NOT NULL,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "paidDate" DATETIME,
    "expenseId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "InstallmentPayment_installmentPlanId_fkey" FOREIGN KEY ("installmentPlanId") REFERENCES "InstallmentPlan" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "InstallmentPlan_userId_idx" ON "InstallmentPlan"("userId");

-- CreateIndex
CREATE INDEX "InstallmentPlan_categoryId_idx" ON "InstallmentPlan"("categoryId");

-- CreateIndex
CREATE INDEX "InstallmentPlan_status_idx" ON "InstallmentPlan"("status");

-- CreateIndex
CREATE UNIQUE INDEX "InstallmentPayment_expenseId_key" ON "InstallmentPayment"("expenseId");

-- CreateIndex
CREATE INDEX "InstallmentPayment_installmentPlanId_idx" ON "InstallmentPayment"("installmentPlanId");

-- CreateIndex
CREATE INDEX "InstallmentPayment_dueDate_idx" ON "InstallmentPayment"("dueDate");

-- CreateIndex
CREATE INDEX "InstallmentPayment_isPaid_idx" ON "InstallmentPayment"("isPaid");
