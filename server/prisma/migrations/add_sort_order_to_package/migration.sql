-- Add sortOrder field to packages table for package ordering
ALTER TABLE "packages" ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- Create index for efficient sorting
CREATE INDEX "packages_sortOrder_idx" ON "packages"("sortOrder");
