-- AlterTable: Remove streak from User and estimatedMinutes from Module
ALTER TABLE "User" DROP COLUMN "streak";
ALTER TABLE "Module" DROP COLUMN "estimatedMinutes";
