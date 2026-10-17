CREATE TABLE "admin_user_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"admin_user_id" text NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" bigint NOT NULL,
	"created_at" bigint NOT NULL,
	CONSTRAINT "admin_user_sessions_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "admin_users" (
	"id" text PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"name" text NOT NULL,
	"password_hash" text NOT NULL,
	"password_salt" text NOT NULL,
	"role" text DEFAULT 'sales' NOT NULL,
	"branch" text DEFAULT '' NOT NULL,
	"branch_id" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" bigint NOT NULL,
	CONSTRAINT "admin_users_role_check" CHECK ("admin_users"."role" IN ('owner', 'manager', 'sales', 'consultant', 'warranty', 'repair', 'inventory'))
);
--> statement-breakpoint
CREATE TABLE "bank_payment_events" (
	"id" text PRIMARY KEY NOT NULL,
	"order_code" text NOT NULL,
	"amount" bigint NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"account_number" text DEFAULT '' NOT NULL,
	"created_at" bigint NOT NULL,
	CONSTRAINT "bank_payment_events_amount_check" CHECK ("bank_payment_events"."amount" >= 0)
);
--> statement-breakpoint
CREATE TABLE "branch_cameras" (
	"id" text PRIMARY KEY NOT NULL,
	"branch_id" text NOT NULL,
	"name" text NOT NULL,
	"location" text DEFAULT '' NOT NULL,
	"stream_url" text NOT NULL,
	"stream_type" text DEFAULT 'embed' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" bigint NOT NULL,
	CONSTRAINT "branch_cameras_stream_type_check" CHECK ("branch_cameras"."stream_type" IN ('embed', 'video', 'snapshot'))
);
--> statement-breakpoint
CREATE TABLE "branch_inventory" (
	"branch_id" text NOT NULL,
	"product_id" text NOT NULL,
	"quantity" integer DEFAULT 0 NOT NULL,
	"updated_at" bigint NOT NULL,
	CONSTRAINT "branch_inventory_branch_id_product_id_pk" PRIMARY KEY("branch_id","product_id"),
	CONSTRAINT "branch_inventory_quantity_check" CHECK ("branch_inventory"."quantity" >= 0)
);
--> statement-breakpoint
CREATE TABLE "branches" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"address" text NOT NULL,
	"phone" text DEFAULT '' NOT NULL,
	"hours" text DEFAULT '08:00–22:00' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" bigint NOT NULL,
	CONSTRAINT "branches_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "camera_branch_permissions" (
	"id" text PRIMARY KEY NOT NULL,
	"admin_user_id" text NOT NULL,
	"branch_id" text NOT NULL,
	"created_at" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_password_reset_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"customer_id" text NOT NULL,
	"token_hash" text NOT NULL,
	"channel" text NOT NULL,
	"destination" text NOT NULL,
	"expires_at" bigint NOT NULL,
	"verified_at" bigint DEFAULT 0 NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"created_at" bigint NOT NULL,
	CONSTRAINT "customer_password_reset_sessions_token_hash_unique" UNIQUE("token_hash"),
	CONSTRAINT "customer_password_reset_attempts_check" CHECK ("customer_password_reset_sessions"."attempts" >= 0)
);
--> statement-breakpoint
CREATE TABLE "customer_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"customer_id" text NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" bigint NOT NULL,
	"created_at" bigint NOT NULL,
	CONSTRAINT "customer_sessions_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "customer_verification_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"customer_id" text NOT NULL,
	"token_hash" text NOT NULL,
	"channel" text NOT NULL,
	"destination" text NOT NULL,
	"expires_at" bigint NOT NULL,
	"created_at" bigint NOT NULL,
	CONSTRAINT "customer_verification_sessions_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" text PRIMARY KEY NOT NULL,
	"username" text DEFAULT '' NOT NULL,
	"avatar_url" text DEFAULT '' NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text DEFAULT '' NOT NULL,
	"password_hash" text NOT NULL,
	"password_salt" text NOT NULL,
	"provider" text DEFAULT 'password' NOT NULL,
	"google_sub" text DEFAULT '' NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"phone_verified" boolean DEFAULT false NOT NULL,
	"profile_completed" boolean DEFAULT true NOT NULL,
	"verification_channel" text DEFAULT 'email' NOT NULL,
	"created_at" bigint NOT NULL,
	CONSTRAINT "customers_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "employee_attendance" (
	"id" text PRIMARY KEY NOT NULL,
	"admin_user_id" text NOT NULL,
	"work_date" text NOT NULL,
	"check_in" text DEFAULT '' NOT NULL,
	"check_out" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'present' NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"recorded_by" text DEFAULT '' NOT NULL,
	"created_at" bigint NOT NULL,
	"updated_at" bigint NOT NULL,
	CONSTRAINT "employee_attendance_date_check" CHECK ("employee_attendance"."work_date" ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$')
);
--> statement-breakpoint
CREATE TABLE "employee_attendance_challenges" (
	"id" text PRIMARY KEY NOT NULL,
	"admin_user_id" text NOT NULL,
	"kind" text NOT NULL,
	"challenge" text NOT NULL,
	"expires_at" bigint NOT NULL,
	"created_at" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employee_attendance_passkeys" (
	"id" text PRIMARY KEY NOT NULL,
	"admin_user_id" text NOT NULL,
	"public_key" text NOT NULL,
	"counter" bigint DEFAULT 0 NOT NULL,
	"transports" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"device_type" text DEFAULT 'singleDevice' NOT NULL,
	"backed_up" boolean DEFAULT false NOT NULL,
	"created_at" bigint NOT NULL,
	"last_used_at" bigint DEFAULT 0 NOT NULL,
	CONSTRAINT "employee_attendance_passkeys_counter_check" CHECK ("employee_attendance_passkeys"."counter" >= 0)
);
--> statement-breakpoint
CREATE TABLE "employee_payroll_records" (
	"id" text PRIMARY KEY NOT NULL,
	"admin_user_id" text NOT NULL,
	"payroll_month" text NOT NULL,
	"base_salary" bigint DEFAULT 0 NOT NULL,
	"payable_amount" bigint DEFAULT 0 NOT NULL,
	"bonus_amount" bigint DEFAULT 0 NOT NULL,
	"social_insurance_amount" bigint DEFAULT 0 NOT NULL,
	"personal_income_tax_amount" bigint DEFAULT 0 NOT NULL,
	"work_days" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"paid_at" bigint DEFAULT 0 NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"updated_at" bigint NOT NULL,
	CONSTRAINT "employee_payroll_month_check" CHECK ("employee_payroll_records"."payroll_month" ~ '^[0-9]{4}-[0-9]{2}$'),
	CONSTRAINT "employee_payroll_amounts_check" CHECK ("employee_payroll_records"."base_salary" >= 0 AND "employee_payroll_records"."payable_amount" >= 0 AND "employee_payroll_records"."bonus_amount" >= 0
    AND "employee_payroll_records"."social_insurance_amount" >= 0 AND "employee_payroll_records"."personal_income_tax_amount" >= 0),
	CONSTRAINT "employee_payroll_work_days_check" CHECK ("employee_payroll_records"."work_days" BETWEEN 0 AND 31)
);
--> statement-breakpoint
CREATE TABLE "employee_profiles" (
	"admin_user_id" text PRIMARY KEY NOT NULL,
	"date_of_birth" text DEFAULT '' NOT NULL,
	"joined_date" text DEFAULT '' NOT NULL,
	"citizen_id_encrypted" text DEFAULT '' NOT NULL,
	"permanent_address_encrypted" text DEFAULT '' NOT NULL,
	"temporary_address_encrypted" text DEFAULT '' NOT NULL,
	"photo_key" text DEFAULT '' NOT NULL,
	"bank_name" text DEFAULT '' NOT NULL,
	"bank_account_name_encrypted" text DEFAULT '' NOT NULL,
	"bank_account_number_encrypted" text DEFAULT '' NOT NULL,
	"monthly_salary" bigint DEFAULT 0 NOT NULL,
	"updated_at" bigint NOT NULL,
	CONSTRAINT "employee_profiles_salary_check" CHECK ("employee_profiles"."monthly_salary" >= 0)
);
--> statement-breakpoint
CREATE TABLE "inventory_movements" (
	"id" text PRIMARY KEY NOT NULL,
	"branch_id" text NOT NULL,
	"product_id" text NOT NULL,
	"product_name" text NOT NULL,
	"operation" text NOT NULL,
	"quantity" integer NOT NULL,
	"before_quantity" integer NOT NULL,
	"after_quantity" integer NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"actor_id" text NOT NULL,
	"actor_name" text NOT NULL,
	"created_at" bigint NOT NULL,
	CONSTRAINT "inventory_movements_operation_check" CHECK ("inventory_movements"."operation" IN ('receive', 'issue', 'count')),
	CONSTRAINT "inventory_movements_quantity_check" CHECK ("inventory_movements"."quantity" >= 0 AND "inventory_movements"."before_quantity" >= 0 AND "inventory_movements"."after_quantity" >= 0)
);
--> statement-breakpoint
CREATE TABLE "live_chat_conversations" (
	"id" text PRIMARY KEY NOT NULL,
	"customer_name" text NOT NULL,
	"phone" text NOT NULL,
	"token" text NOT NULL,
	"status" text DEFAULT 'waiting' NOT NULL,
	"assigned_admin" text DEFAULT '' NOT NULL,
	"branch_id" text DEFAULT '' NOT NULL,
	"branch_name" text DEFAULT '' NOT NULL,
	"created_at" bigint NOT NULL,
	"updated_at" bigint NOT NULL,
	CONSTRAINT "live_chat_conversations_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "live_chat_messages" (
	"id" text PRIMARY KEY NOT NULL,
	"conversation_id" text NOT NULL,
	"sender" text NOT NULL,
	"sender_name" text DEFAULT '' NOT NULL,
	"text" text NOT NULL,
	"created_at" bigint NOT NULL,
	CONSTRAINT "live_chat_messages_sender_check" CHECK ("live_chat_messages"."sender" IN ('customer', 'admin', 'system'))
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" text PRIMARY KEY NOT NULL,
	"order_code" text NOT NULL,
	"customer_name" text NOT NULL,
	"phone" text NOT NULL,
	"email" text DEFAULT '' NOT NULL,
	"product_slug" text DEFAULT '' NOT NULL,
	"product_name" text NOT NULL,
	"color" text DEFAULT '' NOT NULL,
	"storage" text DEFAULT '' NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"delivery_method" text DEFAULT '' NOT NULL,
	"address" text DEFAULT '' NOT NULL,
	"payment_method" text DEFAULT '' NOT NULL,
	"contact_time" text DEFAULT '' NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"payment_status" text DEFAULT 'unpaid' NOT NULL,
	"total" bigint DEFAULT 0 NOT NULL,
	"shipping_fee" bigint DEFAULT 0 NOT NULL,
	"discount" bigint DEFAULT 0 NOT NULL,
	"finance_company" text DEFAULT '' NOT NULL,
	"installment_name" text DEFAULT '' NOT NULL,
	"installment_phone" text DEFAULT '' NOT NULL,
	"date_of_birth" text DEFAULT '' NOT NULL,
	"citizen_id" text DEFAULT '' NOT NULL,
	"citizen_id_issue_date" text DEFAULT '' NOT NULL,
	"citizen_id_issue_place" text DEFAULT '' NOT NULL,
	"down_payment_percent" integer DEFAULT 0 NOT NULL,
	"down_payment_amount" bigint DEFAULT 0 NOT NULL,
	"financed_amount" bigint DEFAULT 0 NOT NULL,
	"installment_term" integer DEFAULT 0 NOT NULL,
	"monthly_payment" bigint DEFAULT 0 NOT NULL,
	"estimated_interest" bigint DEFAULT 0 NOT NULL,
	"customer_id" text,
	"voucher_code" text DEFAULT '' NOT NULL,
	"items" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"invoice_status" text DEFAULT 'not_created' NOT NULL,
	"invoice_number" text DEFAULT '' NOT NULL,
	"invoice_template_code" text DEFAULT '' NOT NULL,
	"invoice_series" text DEFAULT '' NOT NULL,
	"invoice_date" text DEFAULT '' NOT NULL,
	"invoice_buyer_type" text DEFAULT 'individual' NOT NULL,
	"invoice_buyer_name" text DEFAULT '' NOT NULL,
	"invoice_company_name" text DEFAULT '' NOT NULL,
	"invoice_tax_code" text DEFAULT '' NOT NULL,
	"invoice_address" text DEFAULT '' NOT NULL,
	"invoice_email" text DEFAULT '' NOT NULL,
	"invoice_seller_name" text DEFAULT '' NOT NULL,
	"invoice_seller_tax_code" text DEFAULT '' NOT NULL,
	"invoice_seller_address" text DEFAULT '' NOT NULL,
	"invoice_seller_phone" text DEFAULT '' NOT NULL,
	"invoice_tax_rate" integer DEFAULT 0 NOT NULL,
	"invoice_tax_included" boolean DEFAULT true NOT NULL,
	"invoice_note" text DEFAULT '' NOT NULL,
	"warranty_months" integer DEFAULT 12 NOT NULL,
	"warranty_start_date" text DEFAULT '' NOT NULL,
	"warranty_serials" text DEFAULT '' NOT NULL,
	"warranty_policy" text DEFAULT '' NOT NULL,
	"branch_id" text,
	"branch_name" text DEFAULT '' NOT NULL,
	"assigned_admin_id" text,
	"assigned_admin_name" text DEFAULT '' NOT NULL,
	"created_at" bigint NOT NULL,
	CONSTRAINT "orders_order_code_unique" UNIQUE("order_code"),
	CONSTRAINT "orders_quantity_check" CHECK ("orders"."quantity" > 0),
	CONSTRAINT "orders_status_check" CHECK ("orders"."status" IN ('pending', 'confirmed', 'processing', 'shipping', 'delivered', 'cancelled', 'returned')),
	CONSTRAINT "orders_payment_status_check" CHECK ("orders"."payment_status" IN ('not_required', 'unpaid', 'paid', 'refunded', 'failed')),
	CONSTRAINT "orders_money_check" CHECK ("orders"."total" >= 0 AND "orders"."shipping_fee" >= 0 AND "orders"."discount" >= 0
    AND "orders"."down_payment_amount" >= 0 AND "orders"."financed_amount" >= 0 AND "orders"."monthly_payment" >= 0
    AND "orders"."estimated_interest" >= 0),
	CONSTRAINT "orders_down_payment_check" CHECK ("orders"."down_payment_percent" BETWEEN 0 AND 100),
	CONSTRAINT "orders_invoice_check" CHECK ("orders"."invoice_tax_rate" BETWEEN 0 AND 100)
);
--> statement-breakpoint
CREATE TABLE "product_views" (
	"id" text PRIMARY KEY NOT NULL,
	"product_slug" text NOT NULL,
	"visitor_id" text NOT NULL,
	"viewed_at" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"brand" text NOT NULL,
	"category" text NOT NULL,
	"sku" text DEFAULT '' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"image" text NOT NULL,
	"images" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"badge" text DEFAULT '' NOT NULL,
	"tagline" text DEFAULT '' NOT NULL,
	"price" text NOT NULL,
	"cost_price" text DEFAULT '' NOT NULL,
	"selling_price" text DEFAULT '' NOT NULL,
	"sale_price" text DEFAULT '' NOT NULL,
	"price_vnd" bigint GENERATED ALWAYS AS (NULLIF(left(regexp_replace(substring(
      COALESCE(NULLIF(sale_price, ''), NULLIF(selling_price, ''), price) from '[0-9][0-9.,]*'), '[^0-9]', '', 'g'), 15), '')::bigint) STORED,
	"stock" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"condition" text DEFAULT 'new' NOT NULL,
	"seo_title" text DEFAULT '' NOT NULL,
	"seo_description" text DEFAULT '' NOT NULL,
	"variants" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"colors" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"specs" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"source" text DEFAULT '' NOT NULL,
	"created_at" bigint NOT NULL,
	"updated_at" bigint NOT NULL,
	CONSTRAINT "products_slug_unique" UNIQUE("slug"),
	CONSTRAINT "products_stock_check" CHECK ("products"."stock" >= 0),
	CONSTRAINT "products_status_check" CHECK ("products"."status" IN ('draft', 'active', 'inactive')),
	CONSTRAINT "products_condition_check" CHECK ("products"."condition" IN ('new', 'like-new'))
);
--> statement-breakpoint
CREATE TABLE "student_verifications" (
	"id" text PRIMARY KEY NOT NULL,
	"customer_id" text NOT NULL,
	"school" text NOT NULL,
	"student_code" text NOT NULL,
	"graduation_year" text DEFAULT '' NOT NULL,
	"faculty" text DEFAULT '' NOT NULL,
	"document_key" text NOT NULL,
	"document_name" text DEFAULT '' NOT NULL,
	"document_type" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"review_note" text DEFAULT '' NOT NULL,
	"reviewed_by" text DEFAULT '' NOT NULL,
	"reviewed_by_name" text DEFAULT '' NOT NULL,
	"created_at" bigint NOT NULL,
	"updated_at" bigint NOT NULL,
	"reviewed_at" bigint DEFAULT 0 NOT NULL,
	CONSTRAINT "student_verifications_customer_id_unique" UNIQUE("customer_id"),
	CONSTRAINT "student_verifications_status_check" CHECK ("student_verifications"."status" IN ('pending', 'approved', 'rejected'))
);
--> statement-breakpoint
CREATE TABLE "vouchers" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"type" text NOT NULL,
	"value" bigint NOT NULL,
	"min_order" bigint DEFAULT 0 NOT NULL,
	"max_discount" bigint DEFAULT 0 NOT NULL,
	"usage_limit" integer DEFAULT 0 NOT NULL,
	"used_count" integer DEFAULT 0 NOT NULL,
	"starts_at" bigint DEFAULT 0 NOT NULL,
	"expires_at" bigint DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" bigint NOT NULL,
	CONSTRAINT "vouchers_code_unique" UNIQUE("code"),
	CONSTRAINT "vouchers_type_check" CHECK ("vouchers"."type" IN ('percent', 'fixed')),
	CONSTRAINT "vouchers_value_check" CHECK ("vouchers"."value" > 0 AND ("vouchers"."type" <> 'percent' OR "vouchers"."value" <= 100)),
	CONSTRAINT "vouchers_amounts_check" CHECK ("vouchers"."min_order" >= 0 AND "vouchers"."max_discount" >= 0 AND "vouchers"."usage_limit" >= 0 AND "vouchers"."used_count" >= 0),
	CONSTRAINT "vouchers_period_check" CHECK ("vouchers"."expires_at" = 0 OR "vouchers"."expires_at" >= "vouchers"."starts_at")
);
--> statement-breakpoint
CREATE TABLE "work_task_reports" (
	"id" text PRIMARY KEY NOT NULL,
	"task_id" text NOT NULL,
	"author_id" text NOT NULL,
	"author_name" text NOT NULL,
	"message" text NOT NULL,
	"progress" integer DEFAULT 0 NOT NULL,
	"attachment_key" text DEFAULT '' NOT NULL,
	"attachment_name" text DEFAULT '' NOT NULL,
	"attachment_type" text DEFAULT '' NOT NULL,
	"created_at" bigint NOT NULL,
	CONSTRAINT "work_task_reports_progress_check" CHECK ("work_task_reports"."progress" BETWEEN 0 AND 100)
);
--> statement-breakpoint
CREATE TABLE "work_tasks" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"priority" text DEFAULT 'normal' NOT NULL,
	"due_date" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'assigned' NOT NULL,
	"branch_id" text DEFAULT '' NOT NULL,
	"branch_name" text DEFAULT '' NOT NULL,
	"assigned_to" text NOT NULL,
	"assigned_name" text NOT NULL,
	"created_by" text NOT NULL,
	"created_by_name" text NOT NULL,
	"attachment_key" text DEFAULT '' NOT NULL,
	"attachment_name" text DEFAULT '' NOT NULL,
	"attachment_type" text DEFAULT '' NOT NULL,
	"created_at" bigint NOT NULL,
	"updated_at" bigint NOT NULL
);
--> statement-breakpoint
ALTER TABLE "admin_user_sessions" ADD CONSTRAINT "admin_user_sessions_admin_user_id_admin_users_id_fk" FOREIGN KEY ("admin_user_id") REFERENCES "public"."admin_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_users" ADD CONSTRAINT "admin_users_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "branch_cameras" ADD CONSTRAINT "branch_cameras_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "branch_inventory" ADD CONSTRAINT "branch_inventory_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "branch_inventory" ADD CONSTRAINT "branch_inventory_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "camera_branch_permissions" ADD CONSTRAINT "camera_branch_permissions_admin_user_id_admin_users_id_fk" FOREIGN KEY ("admin_user_id") REFERENCES "public"."admin_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "camera_branch_permissions" ADD CONSTRAINT "camera_branch_permissions_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_password_reset_sessions" ADD CONSTRAINT "customer_password_reset_sessions_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_sessions" ADD CONSTRAINT "customer_sessions_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_verification_sessions" ADD CONSTRAINT "customer_verification_sessions_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_attendance" ADD CONSTRAINT "employee_attendance_admin_user_id_admin_users_id_fk" FOREIGN KEY ("admin_user_id") REFERENCES "public"."admin_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_attendance_challenges" ADD CONSTRAINT "employee_attendance_challenges_admin_user_id_admin_users_id_fk" FOREIGN KEY ("admin_user_id") REFERENCES "public"."admin_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_attendance_passkeys" ADD CONSTRAINT "employee_attendance_passkeys_admin_user_id_admin_users_id_fk" FOREIGN KEY ("admin_user_id") REFERENCES "public"."admin_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_payroll_records" ADD CONSTRAINT "employee_payroll_records_admin_user_id_admin_users_id_fk" FOREIGN KEY ("admin_user_id") REFERENCES "public"."admin_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_profiles" ADD CONSTRAINT "employee_profiles_admin_user_id_admin_users_id_fk" FOREIGN KEY ("admin_user_id") REFERENCES "public"."admin_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "live_chat_messages" ADD CONSTRAINT "live_chat_messages_conversation_id_live_chat_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."live_chat_conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_assigned_admin_id_admin_users_id_fk" FOREIGN KEY ("assigned_admin_id") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_verifications" ADD CONSTRAINT "student_verifications_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_task_reports" ADD CONSTRAINT "work_task_reports_task_id_work_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."work_tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_tasks" ADD CONSTRAINT "work_tasks_assigned_to_admin_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."admin_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "admin_user_sessions_user_idx" ON "admin_user_sessions" USING btree ("admin_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "admin_users_username_idx" ON "admin_users" USING btree (lower("username"));--> statement-breakpoint
CREATE INDEX "admin_users_branch_idx" ON "admin_users" USING btree ("branch_id","active");--> statement-breakpoint
CREATE INDEX "bank_payment_events_order_code_idx" ON "bank_payment_events" USING btree ("order_code");--> statement-breakpoint
CREATE INDEX "branch_cameras_branch_idx" ON "branch_cameras" USING btree ("branch_id","active");--> statement-breakpoint
CREATE INDEX "branch_inventory_branch_idx" ON "branch_inventory" USING btree ("branch_id","updated_at");--> statement-breakpoint
CREATE INDEX "branch_inventory_product_idx" ON "branch_inventory" USING btree ("product_id");--> statement-breakpoint
CREATE UNIQUE INDEX "camera_permission_unique_idx" ON "camera_branch_permissions" USING btree ("admin_user_id","branch_id");--> statement-breakpoint
CREATE INDEX "camera_permission_branch_idx" ON "camera_branch_permissions" USING btree ("branch_id");--> statement-breakpoint
CREATE INDEX "customer_password_reset_customer_idx" ON "customer_password_reset_sessions" USING btree ("customer_id","created_at");--> statement-breakpoint
CREATE INDEX "customer_sessions_customer_idx" ON "customer_sessions" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "customer_verification_customer_idx" ON "customer_verification_sessions" USING btree ("customer_id");--> statement-breakpoint
CREATE UNIQUE INDEX "customers_google_sub_idx" ON "customers" USING btree ("google_sub") WHERE "customers"."google_sub" <> '';--> statement-breakpoint
CREATE UNIQUE INDEX "customers_username_idx" ON "customers" USING btree (lower("username")) WHERE "customers"."username" <> '';--> statement-breakpoint
CREATE UNIQUE INDEX "employee_attendance_user_date_idx" ON "employee_attendance" USING btree ("admin_user_id","work_date");--> statement-breakpoint
CREATE INDEX "employee_attendance_date_idx" ON "employee_attendance" USING btree ("work_date","admin_user_id");--> statement-breakpoint
CREATE INDEX "employee_attendance_challenges_user_idx" ON "employee_attendance_challenges" USING btree ("admin_user_id","expires_at");--> statement-breakpoint
CREATE INDEX "employee_attendance_passkeys_user_idx" ON "employee_attendance_passkeys" USING btree ("admin_user_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "employee_payroll_user_month_idx" ON "employee_payroll_records" USING btree ("admin_user_id","payroll_month");--> statement-breakpoint
CREATE INDEX "employee_payroll_month_idx" ON "employee_payroll_records" USING btree ("payroll_month","status");--> statement-breakpoint
CREATE INDEX "inventory_movements_branch_idx" ON "inventory_movements" USING btree ("branch_id","created_at");--> statement-breakpoint
CREATE INDEX "live_chat_conversations_branch_idx" ON "live_chat_conversations" USING btree ("branch_id","status","updated_at");--> statement-breakpoint
CREATE INDEX "live_chat_messages_conversation_idx" ON "live_chat_messages" USING btree ("conversation_id","created_at");--> statement-breakpoint
CREATE INDEX "orders_created_at_idx" ON "orders" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "orders_customer_idx" ON "orders" USING btree ("customer_id","created_at");--> statement-breakpoint
CREATE INDEX "orders_branch_created_idx" ON "orders" USING btree ("branch_id","created_at");--> statement-breakpoint
CREATE INDEX "orders_assigned_admin_idx" ON "orders" USING btree ("assigned_admin_id","created_at");--> statement-breakpoint
CREATE INDEX "orders_status_idx" ON "orders" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "product_views_slug_date_idx" ON "product_views" USING btree ("product_slug","viewed_at");--> statement-breakpoint
CREATE INDEX "product_views_visitor_idx" ON "product_views" USING btree ("visitor_id","product_slug","viewed_at");--> statement-breakpoint
CREATE INDEX "products_category_active_idx" ON "products" USING btree ("category","active");--> statement-breakpoint
CREATE INDEX "products_price_vnd_idx" ON "products" USING btree ("price_vnd");--> statement-breakpoint
CREATE INDEX "student_verifications_status_idx" ON "student_verifications" USING btree ("status","updated_at");--> statement-breakpoint
CREATE INDEX "work_task_reports_task_idx" ON "work_task_reports" USING btree ("task_id","created_at");--> statement-breakpoint
CREATE INDEX "work_tasks_assignee_idx" ON "work_tasks" USING btree ("assigned_to","status","due_date");--> statement-breakpoint
CREATE INDEX "work_tasks_branch_idx" ON "work_tasks" USING btree ("branch_id","status","due_date");