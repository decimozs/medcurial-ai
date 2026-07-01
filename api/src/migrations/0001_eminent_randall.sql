CREATE TABLE "documents" (
	"id" text PRIMARY KEY NOT NULL,
	"no" serial NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"name" text NOT NULL,
	"image_urls" jsonb NOT NULL
);
