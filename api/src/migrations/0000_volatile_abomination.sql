-- Alter the existing signatures table
ALTER TABLE "signatures" DROP COLUMN IF EXISTS "url";
ALTER TABLE "signatures" ADD COLUMN IF NOT EXISTS "image_urls" jsonb NOT NULL DEFAULT '{}'::jsonb;
