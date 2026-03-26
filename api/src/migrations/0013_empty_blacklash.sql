CREATE TABLE "review_findings" (
	"id" text PRIMARY KEY NOT NULL,
	"no" serial NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"document_id" text NOT NULL,
	"user_id" text NOT NULL,
	"content" text NOT NULL,
	"type" text NOT NULL,
	"status" text
);
--> statement-breakpoint
ALTER TABLE "review_findings" ADD CONSTRAINT "review_findings_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_findings" ADD CONSTRAINT "review_findings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;