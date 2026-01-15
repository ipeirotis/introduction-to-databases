-- ============================================================================
-- PREDICTING POLITICAL ORIENTATION FROM BOOK PREFERENCES
-- A SQL Tutorial for MBA Students
-- ============================================================================
--
-- OVERVIEW
-- --------
-- This script demonstrates how to build a simple classifier using SQL. 
-- We'll predict whether Facebook users are liberal or conservative based 
-- on their favorite books.
--
-- SQL concepts you'll learn:
--   • Variables (DECLARE statements)
--   • Temporary tables (CREATE TEMP TABLE)
--   • Aggregation (COUNT, GROUP BY)
--   • JOINs (INNER JOIN, LEFT JOIN)
--   • Handling missing values (COALESCE)
--   • Conditional logic (CASE statements)
--
-- THE BUSINESS INTUITION
-- ----------------------
-- Certain books are more popular among liberals, others among conservatives. 
-- If someone likes "On The Road" by Jack Kerouac, they're statistically more 
-- likely to be liberal. If they like "Atlas Shrugged," they're more likely 
-- to be conservative.
--
-- We'll quantify these associations using "lift"—a measure of how much more 
-- likely a group is to like a book compared to the general population. Then 
-- we'll use these book-level scores to predict each user's political orientation.
-- ============================================================================


-- ============================================================================
-- STEP 1: ESTABLISH BASELINE COUNTS
-- ============================================================================
-- First, we need to know how many students fall into each category. 
-- BigQuery requires us to declare variables at the start of our script.
--
-- These variables will be used later to normalize our counts. Without 
-- normalization, we'd be comparing apples to oranges (raw counts from 
-- groups of very different sizes).
-- ============================================================================

DECLARE all_students INT64;
DECLARE liberals INT64;
DECLARE conservatives INT64;

SET all_students = (
  SELECT COUNT(*) 
  FROM `nyu-datasets.facebook.Profiles`
);


SET liberals = (
  SELECT COUNT(*) 
  FROM `nyu-datasets.facebook.Profiles` 
  WHERE PoliticalViews = 'Liberal'
);


SET conservatives = (
  SELECT COUNT(*) 
  FROM `nyu-datasets.facebook.Profiles` 
  WHERE PoliticalViews = 'Conservative'
);

-- Let's see what we're working with:
-- Expected output:
--   all_students = 25,784
--   liberals     = 6,461  (about 25% of total)
--   conservatives = 936   (about 3.6% of total)
--
-- Notice the imbalance! This is why normalization matters.
SELECT all_students, liberals, conservatives;


-- ============================================================================
-- STEP 2: COUNT BOOK LIKES ACROSS ALL STUDENTS
-- ============================================================================
-- We create a temporary table storing how many times each book was liked,
-- along with the percentage of all students who liked it.
--
-- SQL CONCEPT: TEMPORARY TABLES
-- CREATE TEMP TABLE creates a table that exists only for the duration of 
-- your session. It's useful for breaking complex analyses into manageable 
-- steps. The table disappears when your session ends.
-- ============================================================================

CREATE TEMP TABLE book_likes AS 
SELECT 
  Book, 
  COUNT(ProfileID) AS cnt, 
  COUNT(ProfileID) / all_students AS perc
FROM `nyu-datasets.facebook.FavoriteBooks` 
GROUP BY Book;

-- View the results (first 10 shown):
-- | Book                  | cnt   | perc   |
-- |-----------------------|-------|--------|
-- | Harry Potter          | 1,320 | 5.12%  |
-- | Catcher In The Rye    | 1,079 | 4.18%  |
-- | The Great Gatsby      | 963   | 3.73%  |
-- | 1984                  | 725   | 2.81%  |
-- | Pride And Prejudice   | 602   | 2.33%  |
SELECT * FROM book_likes ORDER BY cnt DESC LIMIT 100;


-- ============================================================================
-- STEP 3: COUNT BOOK LIKES AMONG LIBERALS
-- ============================================================================
-- Now we count likes ONLY from users who identify as Liberal. 
-- This requires joining the FavoriteBooks table with the Profiles table.
--
-- SQL CONCEPT: INNER JOIN
-- An INNER JOIN combines rows from two tables where a matching condition 
-- is satisfied. Here, we're matching ProfileID between the books and 
-- profiles tables. Only users who appear in BOTH tables are included.
--
-- WHY NORMALIZE BY POPULATION?
-- Notice that 555 liberals liked Harry Potter (8.59% of liberals) versus 
-- 1,320 total likes (5.12% of everyone). The raw count (555) is misleading 
-- because liberals are a subset of the population. The percentage (8.59%) 
-- lets us compare fairly.
-- ============================================================================

CREATE TEMP TABLE book_liberals AS 
SELECT 
  Book, 
  COUNT(P.ProfileID) AS cnt_libs, 
  COUNT(P.ProfileID) / liberals AS perc_libs
FROM `nyu-datasets.facebook.FavoriteBooks` B
INNER JOIN `nyu-datasets.facebook.Profiles` P ON P.ProfileID = B.ProfileID
WHERE P.PoliticalViews = 'Liberal'
GROUP BY Book;

-- View the results:
-- | Book                  | cnt_libs | perc_libs |
-- |-----------------------|----------|-----------|
-- | Harry Potter          | 555      | 8.59%     |
-- | Catcher In The Rye    | 452      | 7.00%     |
-- | The Great Gatsby      | 371      | 5.74%     |
SELECT * FROM book_liberals ORDER BY cnt_libs DESC LIMIT 100;


-- ============================================================================
-- STEP 4: COUNT BOOK LIKES AMONG CONSERVATIVES
-- ============================================================================
-- Same logic as Step 3, but filtering for conservatives instead.
--
-- INTERESTING OBSERVATION:
-- "The Bible" appears in the conservative top 10 but not in the liberal top 10.
-- "On The Road" appears in the liberal top 20 but not conservative.
-- These differences are what our classifier will exploit.
-- ============================================================================

CREATE TEMP TABLE book_conservatives AS 
SELECT 
  Book, 
  COUNT(P.ProfileID) AS cnt_cons, 
  COUNT(P.ProfileID) / conservatives AS perc_cons
FROM `nyu-datasets.facebook.FavoriteBooks` B
INNER JOIN `nyu-datasets.facebook.Profiles` P ON P.ProfileID = B.ProfileID
WHERE P.PoliticalViews = 'Conservative'
GROUP BY Book;

-- View the results:
-- | Book                  | cnt_cons | perc_cons |
-- |-----------------------|----------|-----------|
-- | Harry Potter          | 66       | 7.05%     |
-- | The Great Gatsby      | 59       | 6.30%     |
-- | The Bible             | 21       | 2.24%     |  <-- Notable!
SELECT * FROM book_conservatives ORDER BY cnt_cons DESC LIMIT 100;


-- ============================================================================
-- STEP 5: COMBINE EVERYTHING WITH LEFT JOINS
-- ============================================================================
-- Now we join all three tables together. We use LEFT JOINs because not 
-- every book has likes from both liberals AND conservatives—we want to 
-- keep all books from our master list.
--
-- SQL CONCEPT: LEFT JOIN
-- A LEFT JOIN keeps ALL rows from the left table (book_likes), even if 
-- there's no match in the right table. If a book has no conservative likes, 
-- the conservative columns will be NULL.
--
-- SQL CONCEPT: COALESCE
-- COALESCE(value, default) returns `value` if it's not NULL, otherwise 
-- returns `default`. Here we use it to convert NULL counts to 0—if no 
-- conservatives liked a book, we want to show 0, not NULL.
--
-- NEW COLUMNS EXPLAINED:
--   perc_nonlibs:  What percentage of NON-liberals liked this book
--   perc_noncons:  What percentage of NON-conservatives liked this book
-- These let us compare: "Do liberals like this book more than everyone else?"
-- ============================================================================

CREATE TEMP TABLE book_comparison AS 
SELECT 
  B.Book, 
  B.cnt, 
  B.perc AS perc, 
  COALESCE(L.cnt_libs, 0) AS cnt_libs, 
  COALESCE(L.perc_libs, 0) AS perc_libs, 
  COALESCE(C.cnt_cons, 0) AS cnt_cons, 
  COALESCE(C.perc_cons, 0) AS perc_cons, 
  -- Calculate what % of NON-liberals liked each book
  -- Formula: (total likes - liberal likes) / (total students - liberals)
  (B.cnt - COALESCE(L.cnt_libs, 0)) / (all_students - liberals) AS perc_nonlibs, 
  -- Same for non-conservatives
  (B.cnt - COALESCE(C.cnt_cons, 0)) / (all_students - conservatives) AS perc_noncons
FROM 
  book_likes B
LEFT JOIN 
  book_liberals L ON B.Book = L.Book
LEFT JOIN 
  book_conservatives C ON B.Book = C.Book
WHERE 
  B.cnt > 5;  -- Filter out rarely-mentioned books (reduces noise)

-- View the combined data:
SELECT * FROM book_comparison ORDER BY cnt DESC;


-- ============================================================================
-- STEP 6: CALCULATE LIFT SCORES
-- ============================================================================
-- Now the key analytical step—calculating how much more (or less) likely 
-- each group is to like each book compared to everyone else.
--
-- KEY METRICS EXPLAINED:
-- ┌─────────────────┬────────────────────────────┬─────────────────────────────────────┐
-- │ Metric          │ Formula                    │ Interpretation                      │
-- ├─────────────────┼────────────────────────────┼─────────────────────────────────────┤
-- │ lift_libs       │ perc_libs / perc_nonlibs   │ How many times MORE likely liberals │
-- │                 │                            │ are to like this vs. non-liberals.  │
-- │                 │                            │ Lift > 1 means liberals over-index. │
-- ├─────────────────┼────────────────────────────┼─────────────────────────────────────┤
-- │ lift_cons       │ perc_cons / perc_noncons   │ Same for conservatives              │
-- ├─────────────────┼────────────────────────────┼─────────────────────────────────────┤
-- │ libs_vs_cons    │ perc_libs / perc_cons      │ Direct comparison: how much more    │
-- │                 │                            │ popular among liberals vs cons      │
-- ├─────────────────┼────────────────────────────┼─────────────────────────────────────┤
-- │ logodds_libs    │ LOG10(lift)                │ Log-transformed lift. Makes scale   │
-- │                 │                            │ symmetric: negative = under-index,  │
-- │                 │                            │ positive = over-index               │
-- └─────────────────┴────────────────────────────┴─────────────────────────────────────┘
--
-- WHY ADD 0.001?
-- This prevents division by zero. If no conservatives liked a book, 
-- perc_cons would be 0, and division would fail.
--
-- WHY USE LOG10?
-- Lift is multiplicative—a book twice as popular (lift=2) and half as 
-- popular (lift=0.5) should be equally "extreme" but opposite. 
-- Log transformation makes this symmetric: log(2) ≈ 0.3, log(0.5) ≈ -0.3
-- ============================================================================

CREATE TEMP TABLE book_scores AS
SELECT 
  *, 
  -- Direct liberal vs conservative comparison
  perc_libs / (perc_cons + 0.001) AS libs_vs_cons,
  perc_cons / (perc_libs + 0.001) AS cons_vs_libs,
  -- Lift: how much does each group over-index?
  perc_libs / perc_nonlibs AS lift_libs, 
  LOG10(perc_libs / perc_nonlibs + 0.001) AS logodds_libs, 
  perc_cons / perc_noncons AS lift_cons, 
  LOG10(perc_cons / perc_nonlibs + 0.001) AS logodds_cons
FROM book_comparison;

-- View scores for interpretation:
-- 
-- EXAMPLE INTERPRETATIONS:
-- | Book                 | lift_libs | lift_cons | libs_vs_cons | Meaning                    |
-- |----------------------|-----------|-----------|--------------|----------------------------|
-- | On The Road          | 2.39      | 0.35      | 3.99         | Strong liberal signal      |
-- | The Bell Jar         | 2.01      | 0.48      | 2.73         | Strong liberal (Plath)     |
-- | Crime And Punishment | 1.52      | 1.95      | 0.68         | Conservatives over-index   |
-- | The Fountainhead     | 1.43      | 1.65      | 0.75         | Slight conservative (Rand) |
-- | Harry Potter         | 2.17      | 1.40      | 1.20         | Popular with both          |
SELECT * FROM book_scores ORDER BY cnt DESC ;

-- Books most skewed toward liberals:
SELECT Book, cnt, cnt_libs, cnt_cons, perc_libs, perc_cons, lift_libs, libs_vs_cons 
FROM book_scores 
WHERE cnt > 10 
ORDER BY libs_vs_cons DESC 
LIMIT 50;

-- Books most skewed toward conservatives:
SELECT Book, cnt, cnt_libs, cnt_cons, perc_libs, perc_cons, lift_cons, cons_vs_libs 
FROM book_scores 
WHERE cnt > 10 
ORDER BY cons_vs_libs DESC 
LIMIT 50;


-- ============================================================================
-- STEP 7: SCORE INDIVIDUAL USERS
-- ============================================================================
-- Finally, we use the book scores to predict each user's political orientation.
-- 
-- THE LOGIC:
-- For each user, we average together the liberal log-odds of all books they like.
-- If this average is higher than their average conservative score, we predict 
-- they're liberal.
--
-- SQL CONCEPT: CASE STATEMENT
-- CASE WHEN ... THEN ... ELSE ... END is SQL's if-then-else. Here, if the 
-- average liberal score exceeds the average conservative score, we predict "Liberal."
--
-- HOW THE SCORING WORKS (Example):
-- Suppose a user likes three books with these scores:
--
-- | Book                 | logodds_libs | logodds_cons |
-- |----------------------|--------------|--------------|
-- | On The Road          | 0.38         | -0.31        |
-- | The Bell Jar         | 0.30         | -0.21        |
-- | Crime And Punishment | 0.18         | 0.33         |
--
-- Average liberal score:      (0.38 + 0.30 + 0.18) / 3 = 0.29
-- Average conservative score: (-0.31 + -0.21 + 0.33) / 3 = -0.06
--
-- Since 0.29 > -0.06, we predict this user is LIBERAL.
-- ============================================================================

CREATE TEMP TABLE user_scores AS 
SELECT 
  P.ProfileID, 
  P.PoliticalViews, 
  AVG(logodds_libs) AS avg_lib, 
  AVG(logodds_cons) AS avg_cons, 
  COUNT(*) AS cnt_books, 
  CASE 
    WHEN AVG(logodds_libs) > AVG(logodds_cons) THEN "Liberal" 
    ELSE "Conservative" 
  END AS Estimate
FROM 
  `nyu-datasets.facebook.Profiles` P 
JOIN 
  `nyu-datasets.facebook.FavoriteBooks` B ON P.ProfileID = B.ProfileID
JOIN 
  book_scores S ON B.Book = S.Book
GROUP BY 
  P.ProfileID, 
  P.PoliticalViews;

-- View some individual predictions:
SELECT * FROM user_scores ORDER BY avg_lib DESC LIMIT 50;
SELECT * FROM user_scores ORDER BY avg_cons DESC LIMIT 50;

-- ============================================================================
-- STEP 8: EVALUATE THE CLASSIFIER (CONFUSION MATRIX)
-- ============================================================================
-- How well does this work? We compare predictions to actual labels.
--
-- A "confusion matrix" shows:
--   - TRUE POSITIVES:  Correctly predicted
--   - FALSE POSITIVES: Incorrectly predicted as positive
--   - FALSE NEGATIVES: Incorrectly predicted as negative
--   - TRUE NEGATIVES:  Correctly predicted as negative
-- ============================================================================

-- Generate the confusion matrix:
SELECT 
  PoliticalViews, 
  Estimate, 
  COUNT(*) AS count
FROM user_scores
GROUP BY 
  PoliticalViews, 
  Estimate
ORDER BY 
  PoliticalViews, 
  Estimate;

-- EXPECTED OUTPUT:
-- ┌──────────────────────┬─────────────────────┬────────────────────────┐
-- │ Actual Views         │ Predicted Liberal   │ Predicted Conservative │
-- ├──────────────────────┼─────────────────────┼────────────────────────┤
-- │ Liberal              │ 3,840 ✓             │ 444                    │
-- │ Conservative         │ 167                 │ 359 ✓                  │
-- │ Very Liberal         │ 1,324 ✓             │ 118                    │
-- │ Very Conservative    │ 49                  │ 24 ✓                   │
-- │ Moderate             │ 1,403               │ 391                    │
-- │ Libertarian          │ 153                 │ 43                     │
-- │ Apathetic            │ 336                 │ 87                     │
-- │ Other                │ 371                 │ 70                     │
-- │ (null)               │ 2,049               │ 468                    │
-- └──────────────────────┴─────────────────────┴────────────────────────┘


-- ============================================================================
-- STEP 9: CALCULATE ACCURACY METRICS
-- ============================================================================
-- Let's compute actual accuracy numbers for our classifier.
-- ============================================================================

-- Accuracy for self-identified Liberals:
-- Correctly predicted: 3,840 / (3,840 + 444) = 89.6%
SELECT 
  'Liberal' AS group_analyzed,
  SUM(CASE WHEN Estimate = 'Liberal' THEN 1 ELSE 0 END) AS correct,
  SUM(CASE WHEN Estimate = 'Conservative' THEN 1 ELSE 0 END) AS incorrect,
  ROUND(100.0 * SUM(CASE WHEN Estimate = 'Liberal' THEN 1 ELSE 0 END) / COUNT(*), 1) AS accuracy_pct
FROM user_scores
WHERE PoliticalViews = 'Liberal';

-- Accuracy for self-identified Conservatives:
-- Correctly predicted: 359 / (359 + 167) = 68.3%
SELECT 
  'Conservative' AS group_analyzed,
  SUM(CASE WHEN Estimate = 'Conservative' THEN 1 ELSE 0 END) AS correct,
  SUM(CASE WHEN Estimate = 'Liberal' THEN 1 ELSE 0 END) AS incorrect,
  ROUND(100.0 * SUM(CASE WHEN Estimate = 'Conservative' THEN 1 ELSE 0 END) / COUNT(*), 1) AS accuracy_pct
FROM user_scores
WHERE PoliticalViews = 'Conservative';

-- WHY IS CONSERVATIVE PREDICTION WORSE?
-- Two reasons:
-- 1. SAMPLE SIZE: Only 936 conservatives vs. 6,461 liberals—less data to learn from
-- 2. BASE RATE: Since liberals dominate, the average book skews liberal, 
--    making liberal predictions more common


-- ============================================================================
-- KEY TAKEAWAYS
-- ============================================================================
--
-- SQL CONCEPTS LEARNED:
--   1. DECLARE creates variables for reuse throughout a script
--   2. CREATE TEMP TABLE breaks complex logic into steps
--   3. INNER JOIN combines tables where matches exist
--   4. LEFT JOIN keeps all rows from left table even without matches
--   5. COALESCE handles NULL values gracefully
--   6. CASE statements implement conditional logic
--   7. GROUP BY with aggregation summarizes data by categories
--
-- ANALYTICAL CONCEPTS LEARNED:
--   1. Normalization is essential when comparing groups of different sizes
--   2. Lift measures how much a group over-indexes on a behavior
--   3. Log transformation creates symmetric scales for ratios
--   4. Smoothing (adding 0.001) prevents division by zero
--   5. Confusion matrices evaluate classifier performance
--
-- BUSINESS APPLICATIONS:
-- This same technique can predict:
--   • Customer segments from purchase history
--   • Churn risk from product usage patterns
--   • Employee attrition from engagement signals
--   • Fraud likelihood from transaction patterns
--
-- The key insight: seemingly innocuous preferences (books, products, behaviors) 
-- often correlate with deeper characteristics—and SQL can uncover these patterns 
-- at scale.
-- ============================================================================
