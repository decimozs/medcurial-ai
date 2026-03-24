ALTER TABLE "documents" ADD COLUMN "approval_status" text DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "approval_notes" text;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "approved_at" timestamp;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "rejected_at" timestamp;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "approved_by" text;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "rejected_by" text;