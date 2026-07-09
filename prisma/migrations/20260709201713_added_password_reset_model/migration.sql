-- CreateTable
CREATE TABLE "PasswordResetOTP" (
    "email" TEXT NOT NULL,
    "otp" INTEGER NOT NULL,
    "expiredAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PasswordResetOTP_pkey" PRIMARY KEY ("email")
);
