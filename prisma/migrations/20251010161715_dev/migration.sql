/*
  Warnings:

  - You are about to drop the column `mapId` on the `Channel` table. All the data in the column will be lost.
  - You are about to drop the column `episodeId` on the `Map` table. All the data in the column will be lost.
  - You are about to drop the column `createdBy` on the `Tracker` table. All the data in the column will be lost.
  - The `level` column on the `Tracker` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to alter the column `status` on the `Tracker` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - A unique constraint covering the columns `[episodeId]` on the table `Episode` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `episodeId` to the `Episode` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Episode` table without a default value. This is not possible if the table is not empty.
  - Added the required column `episodeNumber` to the `Map` table without a default value. This is not possible if the table is not empty.
  - Added the required column `level` to the `Map` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Map` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('VIEWER', 'CHATTER', 'EDITOR', 'ADMIN');

-- DropForeignKey
ALTER TABLE "public"."Channel" DROP CONSTRAINT "Channel_mapId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Map" DROP CONSTRAINT "Map_episodeId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Tracker" DROP CONSTRAINT "Tracker_channelId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Tracker" DROP CONSTRAINT "Tracker_createdBy_fkey";

-- DropIndex
DROP INDEX "public"."Tracker_episodeId_mapId_channelId_idx";

-- DropIndex
DROP INDEX "public"."Tracker_nickname_idx";

-- DropIndex
DROP INDEX "public"."Tracker_status_idx";

-- AlterTable
ALTER TABLE "Channel" DROP COLUMN "mapId";

-- AlterTable
ALTER TABLE "Episode" ADD COLUMN     "episodeId" INTEGER NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Map" DROP COLUMN "episodeId",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "episodeNumber" INTEGER NOT NULL,
ADD COLUMN     "level" INTEGER NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Tracker" DROP COLUMN "createdBy",
ADD COLUMN     "userId" INTEGER,
DROP COLUMN "level",
ADD COLUMN     "level" INTEGER,
ALTER COLUMN "status" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "nickname" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'VIEWER';

-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MapFavorite" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "mapId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MapFavorite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MapFavorite_userId_mapId_key" ON "MapFavorite"("userId", "mapId");

-- CreateIndex
CREATE UNIQUE INDEX "Episode_episodeId_key" ON "Episode"("episodeId");

-- AddForeignKey
ALTER TABLE "Map" ADD CONSTRAINT "Map_episodeNumber_fkey" FOREIGN KEY ("episodeNumber") REFERENCES "Episode"("episodeId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MapFavorite" ADD CONSTRAINT "MapFavorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MapFavorite" ADD CONSTRAINT "MapFavorite_mapId_fkey" FOREIGN KEY ("mapId") REFERENCES "Map"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tracker" ADD CONSTRAINT "Tracker_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
