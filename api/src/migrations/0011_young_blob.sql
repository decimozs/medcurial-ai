ALTER TABLE "documents" ADD COLUMN "fiu_status" text DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "fiu_notes" text;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "fiu_investigated_at" timestamp;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "fiu_investigated_by" text;