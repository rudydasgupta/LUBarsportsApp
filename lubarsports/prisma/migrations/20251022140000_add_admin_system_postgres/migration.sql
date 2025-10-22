-- Add adminType column to Captain table
ALTER TABLE "Captain" ADD COLUMN "adminType" TEXT;

-- Create Admin table
CREATE TABLE "Admin" (
    "id" SERIAL PRIMARY KEY,
    "email" TEXT NOT NULL UNIQUE,
    "password" TEXT NOT NULL,
    "fullName" TEXT,
    "adminType" TEXT NOT NULL
);
