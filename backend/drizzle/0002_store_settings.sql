CREATE TABLE "store_settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"updated_by" text DEFAULT '' NOT NULL,
	"updated_at" bigint NOT NULL
);
