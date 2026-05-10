/*
  Warnings:

  - A unique constraint covering the columns `[date,attendeeType,classId,sectionId]` on the table `AttendanceSlot` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "NotifTemplateType" AS ENUM ('ATTENDANCE', 'HOMEWORK', 'FEE_REMINDER', 'ANNOUNCEMENT', 'CUSTOM');

-- CreateEnum
CREATE TYPE "QueueStatus" AS ENUM ('PENDING', 'PROCESSING', 'SENT', 'FAILED');

-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'NOTIFICATION_MANAGER';

-- DropIndex
DROP INDEX "AttendanceSlot_date_classId_sectionId_key";

-- AlterTable
ALTER TABLE "AttendanceSlot" ADD COLUMN     "attendeeType" "AttendeeType" NOT NULL DEFAULT 'STUDENT',
ALTER COLUMN "classId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "NotificationSettings" (
    "id" TEXT NOT NULL,
    "attendanceNotificationTime" TEXT NOT NULL DEFAULT '10:30',
    "attendanceNotifEnabled" BOOLEAN NOT NULL DEFAULT true,
    "homeworkNotifEnabled" BOOLEAN NOT NULL DEFAULT false,
    "feeReminderEnabled" BOOLEAN NOT NULL DEFAULT true,
    "announcementEnabled" BOOLEAN NOT NULL DEFAULT true,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationTemplate" (
    "id" TEXT NOT NULL,
    "templateName" TEXT NOT NULL,
    "templateType" "NotifTemplateType" NOT NULL,
    "messageBody" TEXT NOT NULL,
    "variables" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationQueue" (
    "id" TEXT NOT NULL,
    "recipientType" TEXT NOT NULL,
    "recipientId" TEXT,
    "phoneNumber" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" "QueueStatus" NOT NULL DEFAULT 'PENDING',
    "notifType" "NotifTemplateType" NOT NULL,
    "templateId" TEXT,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "sentAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationQueue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationLog" (
    "id" TEXT NOT NULL,
    "recipientId" TEXT,
    "phoneNumber" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "deliveryStatus" TEXT NOT NULL,
    "notifType" "NotifTemplateType" NOT NULL,
    "providerResponse" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NotificationTemplate_templateName_key" ON "NotificationTemplate"("templateName");

-- CreateIndex
CREATE INDEX "NotificationQueue_status_idx" ON "NotificationQueue"("status");

-- CreateIndex
CREATE INDEX "NotificationQueue_scheduledAt_idx" ON "NotificationQueue"("scheduledAt");

-- CreateIndex
CREATE INDEX "NotificationQueue_notifType_idx" ON "NotificationQueue"("notifType");

-- CreateIndex
CREATE INDEX "NotificationLog_sentAt_idx" ON "NotificationLog"("sentAt");

-- CreateIndex
CREATE INDEX "NotificationLog_deliveryStatus_idx" ON "NotificationLog"("deliveryStatus");

-- CreateIndex
CREATE INDEX "NotificationLog_notifType_idx" ON "NotificationLog"("notifType");

-- CreateIndex
CREATE UNIQUE INDEX "AttendanceSlot_date_attendeeType_classId_sectionId_key" ON "AttendanceSlot"("date", "attendeeType", "classId", "sectionId");
