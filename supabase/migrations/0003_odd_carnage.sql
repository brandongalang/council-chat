CREATE TABLE "council_responses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"message_id" uuid NOT NULL,
	"model_id" text NOT NULL,
	"content" text,
	"prompt_tokens" integer,
	"completion_tokens" integer,
	"cost" double precision,
	"duration_ms" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "prompt_tokens" integer;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "completion_tokens" integer;--> statement-breakpoint
ALTER TABLE "council_responses" ADD CONSTRAINT "council_responses_message_id_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE cascade ON UPDATE no action;