-- Keep database-level business rules aligned with db/schema.sql. Prisma's
-- schema language does not currently model CHECK constraints, so these rules
-- live in a custom SQL migration.
ALTER TABLE "accounts"
ADD CONSTRAINT "accounts_type_check"
CHECK ("type" IN ('cash', 'bank', 'e-wallet'));

ALTER TABLE "categories"
ADD CONSTRAINT "categories_type_check"
CHECK ("type" IN ('income', 'expense'));

ALTER TABLE "transactions"
ADD CONSTRAINT "transactions_type_check"
CHECK ("type" IN ('income', 'expense', 'transfer')),
ADD CONSTRAINT "transactions_amount_positive_check"
CHECK ("amount" > 0),
ADD CONSTRAINT "transactions_category_required_check"
CHECK (
  ("type" IN ('income', 'expense') AND "category_id" IS NOT NULL)
  OR "type" = 'transfer'
),
ADD CONSTRAINT "transactions_transfer_destination_check"
CHECK (
  (
    "type" = 'transfer'
    AND "to_account_id" IS NOT NULL
    AND "to_account_id" <> "account_id"
  )
  OR ("type" IN ('income', 'expense') AND "to_account_id" IS NULL)
);
