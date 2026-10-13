/*
  Warnings:

  - You are about to drop the `course_comments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `course_likes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `course_ratings` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `news_comments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `news_likes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `news_ratings` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `podcast_comments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `podcast_likes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `podcast_ratings` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "EntityType" AS ENUM ('NEWS', 'COURSE', 'PODCAST');

-- DropForeignKey
ALTER TABLE "course_comments" DROP CONSTRAINT "course_comments_courseId_fkey";

-- DropForeignKey
ALTER TABLE "course_comments" DROP CONSTRAINT "course_comments_parentId_fkey";

-- DropForeignKey
ALTER TABLE "course_comments" DROP CONSTRAINT "course_comments_userId_fkey";

-- DropForeignKey
ALTER TABLE "course_likes" DROP CONSTRAINT "course_likes_courseId_fkey";

-- DropForeignKey
ALTER TABLE "course_likes" DROP CONSTRAINT "course_likes_userId_fkey";

-- DropForeignKey
ALTER TABLE "course_ratings" DROP CONSTRAINT "course_ratings_courseId_fkey";

-- DropForeignKey
ALTER TABLE "course_ratings" DROP CONSTRAINT "course_ratings_userId_fkey";

-- DropForeignKey
ALTER TABLE "news_comments" DROP CONSTRAINT "news_comments_newsId_fkey";

-- DropForeignKey
ALTER TABLE "news_comments" DROP CONSTRAINT "news_comments_parentId_fkey";

-- DropForeignKey
ALTER TABLE "news_comments" DROP CONSTRAINT "news_comments_userId_fkey";

-- DropForeignKey
ALTER TABLE "news_likes" DROP CONSTRAINT "news_likes_newsId_fkey";

-- DropForeignKey
ALTER TABLE "news_likes" DROP CONSTRAINT "news_likes_userId_fkey";

-- DropForeignKey
ALTER TABLE "news_ratings" DROP CONSTRAINT "news_ratings_newsId_fkey";

-- DropForeignKey
ALTER TABLE "news_ratings" DROP CONSTRAINT "news_ratings_userId_fkey";

-- DropForeignKey
ALTER TABLE "podcast_comments" DROP CONSTRAINT "podcast_comments_parentId_fkey";

-- DropForeignKey
ALTER TABLE "podcast_comments" DROP CONSTRAINT "podcast_comments_podcastId_fkey";

-- DropForeignKey
ALTER TABLE "podcast_comments" DROP CONSTRAINT "podcast_comments_userId_fkey";

-- DropForeignKey
ALTER TABLE "podcast_likes" DROP CONSTRAINT "podcast_likes_podcastId_fkey";

-- DropForeignKey
ALTER TABLE "podcast_likes" DROP CONSTRAINT "podcast_likes_userId_fkey";

-- DropForeignKey
ALTER TABLE "podcast_ratings" DROP CONSTRAINT "podcast_ratings_podcastId_fkey";

-- DropForeignKey
ALTER TABLE "podcast_ratings" DROP CONSTRAINT "podcast_ratings_userId_fkey";

-- DropTable
DROP TABLE "course_comments";

-- DropTable
DROP TABLE "course_likes";

-- DropTable
DROP TABLE "course_ratings";

-- DropTable
DROP TABLE "news_comments";

-- DropTable
DROP TABLE "news_likes";

-- DropTable
DROP TABLE "news_ratings";

-- DropTable
DROP TABLE "podcast_comments";

-- DropTable
DROP TABLE "podcast_likes";

-- DropTable
DROP TABLE "podcast_ratings";

-- CreateTable
CREATE TABLE "comments" (
    "id" TEXT NOT NULL,
    "entityType" "EntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "parentId" TEXT,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "likes" (
    "id" TEXT NOT NULL,
    "entityType" "EntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "ReactionType" NOT NULL DEFAULT 'LIKE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "likes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ratings" (
    "id" TEXT NOT NULL,
    "entityType" "EntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ratings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "comments_entityType_entityId_idx" ON "comments"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "likes_entityType_entityId_idx" ON "likes"("entityType", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "likes_entityType_entityId_userId_key" ON "likes"("entityType", "entityId", "userId");

-- CreateIndex
CREATE INDEX "ratings_entityType_entityId_idx" ON "ratings"("entityType", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "ratings_entityType_entityId_userId_key" ON "ratings"("entityType", "entityId", "userId");

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "likes" ADD CONSTRAINT "likes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
