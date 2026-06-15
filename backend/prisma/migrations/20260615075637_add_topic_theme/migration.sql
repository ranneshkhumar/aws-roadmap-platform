-- CreateEnum
CREATE TYPE "TopicTheme" AS ENUM ('TECH', 'FORGE', 'CITADEL', 'HARBOR', 'CRYSTAL');

-- AlterTable
ALTER TABLE "Topic" ADD COLUMN     "theme" "TopicTheme" NOT NULL DEFAULT 'TECH';
