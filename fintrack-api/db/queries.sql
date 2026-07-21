-- 1. Shows all expense transactions for account 1, newest first.
SELECT id,
    amount,
    description,
    transaction_date
FROM transactions
WHERE account_id = 1
    AND type = 'expense'
ORDER BY transaction_date DESC,
    id DESC;
-- 2. Shows transaction details together with their user, account, and category.
SELECT t.id,
    u.name AS user_name,
    a.name AS account_name,
    c.name AS category_name,
    t.type,
    t.amount,
    t.transaction_date
FROM transactions AS t
    JOIN accounts AS a ON a.id = t.account_id
    JOIN users AS u ON u.id = a.user_id
    JOIN categories AS c ON c.id = t.category_id
ORDER BY t.transaction_date DESC,
    t.id DESC;
-- 3. Calculates total expense per category for each calendar month.
SELECT DATE_TRUNC('month', t.transaction_date)::DATE AS month,
    c.name AS category_name,
    SUM(t.amount) AS total_expense
FROM transactions AS t
    JOIN categories AS c ON c.id = t.category_id
WHERE t.type = 'expense'
GROUP BY DATE_TRUNC('month', t.transaction_date),
    c.id,
    c.name
ORDER BY month,
    total_expense DESC;
-- 4. Surfaces every category, including categories that have zero transactions.
SELECT c.id,
    c.name,
    c.type,
    COUNT(t.id) AS transaction_count
FROM categories AS c
    LEFT JOIN transactions AS t ON t.category_id = c.id
GROUP BY c.id,
    c.name,
    c.type
ORDER BY transaction_count,
    c.name;
-- 5. Finds accounts whose balance is below their owner's average account balance.
SELECT a.id,
    u.name AS user_name,
    a.name AS account_name,
    a.balance
FROM accounts AS a
    JOIN users AS u ON u.id = a.user_id
WHERE a.balance < (
        SELECT AVG(peer.balance)
        FROM accounts AS peer
        WHERE peer.user_id = a.user_id
    )
ORDER BY u.name,
    a.balance;
-- 6. Summarizes total income, expense, and net recorded cash flow per user.
SELECT u.id,
    u.name,
    COALESCE(
        SUM(t.amount) FILTER (
            WHERE t.type = 'income'
        ),
        0
    ) AS total_income,
    COALESCE(
        SUM(t.amount) FILTER (
            WHERE t.type = 'expense'
        ),
        0
    ) AS total_expense,
    COALESCE(
        SUM(t.amount) FILTER (
            WHERE t.type = 'income'
        ),
        0
    ) - COALESCE(
        SUM(t.amount) FILTER (
            WHERE t.type = 'expense'
        ),
        0
    ) AS net_cash_flow
FROM users AS u
    LEFT JOIN accounts AS a ON a.user_id = u.id
    LEFT JOIN transactions AS t ON t.account_id = a.id
GROUP BY u.id,
    u.name
ORDER BY u.name;
-- 7. Ranks each user's expense categories and returns their highest-spending one.
WITH category_spending AS (
    SELECT u.id AS user_id,
        u.name AS user_name,
        c.name AS category_name,
        SUM(t.amount) AS total_spent
    FROM users AS u
        JOIN accounts AS a ON a.user_id = u.id
        JOIN transactions AS t ON t.account_id = a.id
        AND t.type = 'expense'
        JOIN categories AS c ON c.id = t.category_id
    GROUP BY u.id,
        u.name,
        c.id,
        c.name
),
ranked_spending AS (
    SELECT category_spending.*,
        DENSE_RANK() OVER (
            PARTITION BY user_id
            ORDER BY total_spent DESC
        ) AS spending_rank
    FROM category_spending
)
SELECT user_name,
    category_name,
    total_spent
FROM ranked_spending
WHERE spending_rank = 1
ORDER BY user_name;
-- 8. Shows each account's latest transaction date and transaction count.
SELECT a.id,
    u.name AS user_name,
    a.name AS account_name,
    COUNT(t.id) AS transaction_count,
    MAX(t.transaction_date) AS latest_transaction_date
FROM accounts AS a
    JOIN users AS u ON u.id = a.user_id
    LEFT JOIN transactions AS t ON t.account_id = a.id
GROUP BY a.id,
    u.name,
    a.name
ORDER BY u.name,
    a.name;