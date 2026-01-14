# Predicting Political Orientation from Book Preferences: A SQL Tutorial

## Overview

This tutorial demonstrates how to build a simple classifier using SQL. We'll predict whether Facebook users are liberal or conservative based on their favorite books. Along the way, you'll learn several important SQL concepts:

- **Variables** (DECLARE statements)
- **Temporary tables** (CREATE TEMP TABLE)
- **Aggregation** (COUNT, GROUP BY)
- **JOINs** (INNER JOIN, LEFT JOIN)
- **Handling missing values** (COALESCE)
- **Conditional logic** (CASE statements)

## The Business Intuition

The core idea is simple: certain books are more popular among liberals, others among conservatives. If someone likes "On The Road" by Jack Kerouac, they're statistically more likely to be liberal. If they like "Atlas Shrugged," they're more likely to be conservative.

We'll quantify these associations using **lift**—a measure of how much more likely a group is to like a book compared to the general population. Then we'll use these book-level scores to predict each user's political orientation.

---

## Step 1: Establish Baseline Counts

First, we need to know how many students fall into each category. BigQuery requires us to declare variables at the start of our script.

```sql
DECLARE all_students INT64 DEFAULT (
  SELECT COUNT(*) 
  FROM `nyu-datasets.facebook.Profiles`
);
DECLARE liberals INT64 DEFAULT (
  SELECT COUNT(*) 
  FROM `nyu-datasets.facebook.Profiles` 
  WHERE PoliticalViews = 'Liberal'
);
DECLARE conservatives INT64 DEFAULT (
  SELECT COUNT(*) 
  FROM `nyu-datasets.facebook.Profiles` 
  WHERE PoliticalViews = 'Conservative'
);

SELECT all_students, liberals, conservatives;
```

**Result:**

| all_students | liberals | conservatives |
|--------------|----------|---------------|
| 25,784       | 6,461    | 936           |

**What this tells us:** We have ~26,000 students total. About 25% identify as Liberal, but only 3.6% identify as Conservative. This imbalance is important—it's why we need to *normalize* our counts later.

---

## Step 2: Count Book Likes Across All Students

Next, we create a temporary table storing how many times each book was liked, along with the percentage of all students who liked it.

```sql
CREATE TEMP TABLE book_likes AS 
SELECT 
  Book, 
  COUNT(ProfileID) AS cnt, 
  COUNT(ProfileID) / all_students AS perc
FROM `nyu-datasets.facebook.FavoriteBooks` 
GROUP BY Book;
```

**Result (first 10 rows):**

| Book                  | cnt   | perc   |
|-----------------------|-------|--------|
| Harry Potter          | 1,320 | 5.12%  |
| Catcher In The Rye    | 1,079 | 4.18%  |
| The Great Gatsby      | 963   | 3.73%  |
| 1984                  | 725   | 2.81%  |
| Pride And Prejudice   | 602   | 2.33%  |
| To Kill A Mockingbird | 577   | 2.24%  |
| Catch 22              | 560   | 2.17%  |
| Angels And Demons     | 520   | 2.02%  |
| Memoirs Of A Geisha   | 463   | 1.80%  |
| The Da Vinci Code     | 445   | 1.73%  |

**SQL Concept: Temporary Tables**

`CREATE TEMP TABLE` creates a table that exists only for the duration of your session. It's useful for breaking complex analyses into manageable steps. The table disappears when your session ends.

---

## Step 3: Count Book Likes Among Liberals

Now we count likes *only* from users who identify as Liberal. This requires joining the FavoriteBooks table with the Profiles table.

```sql
CREATE TEMP TABLE book_liberals AS 
SELECT 
  Book, 
  COUNT(P.ProfileID) AS cnt_libs, 
  COUNT(P.ProfileID) / liberals AS perc_libs
FROM `nyu-datasets.facebook.FavoriteBooks` B
INNER JOIN `nyu-datasets.facebook.Profiles` P ON P.ProfileID = B.ProfileID
WHERE P.PoliticalViews = 'Liberal'
GROUP BY Book;
```

**Result (first 10 rows):**

| Book                  | cnt_libs | perc_libs |
|-----------------------|----------|-----------|
| Harry Potter          | 555      | 8.59%     |
| Catcher In The Rye    | 452      | 7.00%     |
| The Great Gatsby      | 371      | 5.74%     |
| 1984                  | 286      | 4.43%     |
| Pride And Prejudice   | 256      | 3.96%     |
| To Kill A Mockingbird | 244      | 3.78%     |
| Catch 22              | 205      | 3.17%     |
| Memoirs Of A Geisha   | 194      | 3.00%     |
| Angels And Demons     | 181      | 2.80%     |
| The Da Vinci Code     | 173      | 2.68%     |

**SQL Concept: INNER JOIN**

An INNER JOIN combines rows from two tables where a matching condition is satisfied. Here, we're matching `ProfileID` between the books and profiles tables. Only users who appear in *both* tables (i.e., have a profile AND have listed favorite books) are included.

**Why normalize by population?** Notice that 555 liberals liked Harry Potter (8.59% of liberals) versus 1,320 total likes (5.12% of everyone). The raw count (555) is misleading because liberals are a subset of the population. The percentage (8.59%) lets us compare fairly.

---

## Step 4: Count Book Likes Among Conservatives

Same logic, different filter:

```sql
CREATE TEMP TABLE book_conservatives AS 
SELECT 
  Book, 
  COUNT(P.ProfileID) AS cnt_cons, 
  COUNT(P.ProfileID) / conservatives AS perc_cons
FROM `nyu-datasets.facebook.FavoriteBooks` B
INNER JOIN `nyu-datasets.facebook.Profiles` P ON P.ProfileID = B.ProfileID
WHERE P.PoliticalViews = 'Conservative'
GROUP BY Book;
```

**Result (first 10 rows):**

| Book                  | cnt_cons | perc_cons |
|-----------------------|----------|-----------|
| Harry Potter          | 66       | 7.05%     |
| The Great Gatsby      | 59       | 6.30%     |
| 1984                  | 32       | 3.42%     |
| Catcher In The Rye    | 32       | 3.42%     |
| Angels And Demons     | 31       | 3.31%     |
| Pride And Prejudice   | 26       | 2.78%     |
| To Kill A Mockingbird | 26       | 2.78%     |
| Crime And Punishment  | 23       | 2.46%     |
| The Bible             | 21       | 2.24%     |
| Catch 22              | 21       | 2.24%     |

**Interesting observation:** "The Bible" appears in the conservative top 10 but not in the liberal top 10. "On The Road" appears in the liberal top 20 but not conservative. These differences are what our classifier will exploit.

---

## Step 5: Combine Everything with LEFT JOINs

Now we join all three tables together. We use LEFT JOINs because not every book has likes from both liberals AND conservatives—we want to keep all books from our master list.

```sql
CREATE TEMP TABLE book_comparison AS 
SELECT 
  B.Book, 
  B.cnt, 
  B.perc AS perc, 
  COALESCE(L.cnt_libs, 0) AS cnt_libs, 
  COALESCE(L.perc_libs, 0) AS perc_libs, 
  COALESCE(C.cnt_cons, 0) AS cnt_cons, 
  COALESCE(C.perc_cons, 0) AS perc_cons, 
  (B.cnt - COALESCE(L.cnt_libs, 0)) / (all_students - liberals) AS perc_nonlibs, 
  (B.cnt - COALESCE(C.cnt_cons, 0)) / (all_students - conservatives) AS perc_noncons
FROM 
  book_likes B
LEFT JOIN 
  book_liberals L ON B.Book = L.Book
LEFT JOIN 
  book_conservatives C ON B.Book = C.Book
WHERE 
  B.cnt > 5;  -- Filter out rarely-mentioned books
```

**Result (selected rows):**

| Book                     | cnt   | perc  | cnt_libs | perc_libs | cnt_cons | perc_cons | perc_nonlibs | perc_noncons |
|--------------------------|-------|-------|----------|-----------|----------|-----------|--------------|--------------|
| Harry Potter             | 1,320 | 5.12% | 555      | 8.59%     | 66       | 7.05%     | 3.96%        | 5.05%        |
| On The Road              | 306   | 1.19% | 136      | 2.10%     | 4        | 0.43%     | 0.88%        | 1.22%        |
| The Bell Jar             | 279   | 1.08% | 112      | 1.73%     | 5        | 0.53%     | 0.86%        | 1.10%        |
| Crime And Punishment     | 336   | 1.30% | 113      | 1.75%     | 23       | 2.46%     | 1.15%        | 1.26%        |

**SQL Concept: LEFT JOIN**

A LEFT JOIN keeps *all* rows from the left table (book_likes), even if there's no match in the right table. If a book has no conservative likes, the conservative columns will be NULL.

**SQL Concept: COALESCE**

`COALESCE(value, default)` returns `value` if it's not NULL, otherwise returns `default`. Here we use it to convert NULL counts to 0—if no conservatives liked a book, we want to show 0, not NULL.

**New columns explained:**
- `perc_nonlibs`: What percentage of *non-liberals* liked this book
- `perc_noncons`: What percentage of *non-conservatives* liked this book

These let us compare: "Do liberals like this book more than everyone else?"

---

## Step 6: Calculate Lift Scores

Now the key analytical step—calculating how much more (or less) likely each group is to like each book compared to everyone else.

```sql
CREATE TEMP TABLE book_scores AS
SELECT 
  *, 
  perc_libs / (perc_cons + 0.001) AS libs_vs_cons,
  perc_cons / (perc_libs + 0.001) AS cons_vs_libs,
  perc_libs / perc_nonlibs AS lift_libs, 
  LOG10(perc_libs / perc_nonlibs + 0.001) AS logodds_libs, 
  perc_cons / perc_noncons AS lift_cons, 
  LOG10(perc_cons / perc_nonlibs + 0.001) AS logodds_cons
FROM book_comparison;
```

**Key metrics explained:**

| Metric | Formula | Interpretation |
|--------|---------|----------------|
| `lift_libs` | perc_libs / perc_nonlibs | How many times more likely liberals are to like this book vs. non-liberals. Lift > 1 means liberals over-index. |
| `lift_cons` | perc_cons / perc_noncons | Same for conservatives |
| `libs_vs_cons` | perc_libs / perc_cons | Direct comparison: how much more popular is this among liberals vs. conservatives |
| `logodds_libs` | LOG10(lift) | Log-transformed lift. Makes the scale symmetric (negative = under-index, positive = over-index) |

**Example interpretations from the data:**

| Book | lift_libs | lift_cons | libs_vs_cons | Interpretation |
|------|-----------|-----------|--------------|----------------|
| On The Road | 2.39 | 0.35 | 3.99 | Liberals are 2.4x more likely to like this than non-liberals. Strong liberal signal. |
| The Bell Jar | 2.01 | 0.48 | 2.73 | Another strong liberal signal (Sylvia Plath) |
| Crime And Punishment | 1.52 | 1.95 | 0.68 | Conservatives over-index here |
| The Fountainhead | 1.43 | 1.65 | 0.75 | Slight conservative lean (Ayn Rand) |
| Harry Potter | 2.17 | 1.40 | 1.20 | Popular with both, slight liberal lean |

**Why add 0.001?** This prevents division by zero. If no conservatives liked a book, `perc_cons` would be 0, and division would fail.

**Why use LOG10?** Lift is multiplicative—a book twice as popular (lift=2) and half as popular (lift=0.5) should be equally "extreme" but opposite. Log transformation makes this symmetric: log(2) ≈ 0.3, log(0.5) ≈ -0.3.

---

## Step 7: Score Individual Users

Finally, we use the book scores to predict each user's political orientation. The logic: average together the liberal log-odds of all books a person likes.

```sql
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
```

**SQL Concept: CASE Statement**

`CASE WHEN ... THEN ... ELSE ... END` is SQL's if-then-else. Here, if the average liberal score exceeds the average conservative score, we predict "Liberal."

**How the scoring works:**

Suppose a user likes three books with these scores:

| Book | logodds_libs | logodds_cons |
|------|--------------|--------------|
| On The Road | 0.38 | -0.31 |
| The Bell Jar | 0.30 | -0.21 |
| Crime And Punishment | 0.18 | 0.33 |

- Average liberal score: (0.38 + 0.30 + 0.18) / 3 = **0.29**
- Average conservative score: (-0.31 + -0.21 + 0.33) / 3 = **-0.06**

Since 0.29 > -0.06, we predict this user is **Liberal**.

---

## Step 8: Evaluate the Classifier

How well does this work? We compare predictions to actual labels:

```sql
SELECT 
  PoliticalViews, 
  Estimate, 
  COUNT(*)
FROM user_scores
GROUP BY PoliticalViews, Estimate
ORDER BY PoliticalViews, Estimate;
```

**Confusion Matrix Results:**

| Actual Political Views | Predicted Liberal | Predicted Conservative |
|------------------------|-------------------|------------------------|
| Liberal                | 3,840 ✓           | 444                    |
| Conservative           | 167               | 359 ✓                  |
| Very Liberal           | 1,324 ✓           | 118                    |
| Very Conservative      | 49                | 24 ✓                   |
| Moderate               | 1,403             | 391                    |
| Libertarian            | 153               | 43                     |
| Apathetic              | 336               | 87                     |
| Other                  | 371               | 70                     |
| (not specified)        | 2,049             | 468                    |

**Performance Analysis:**

For users who self-identified as Liberal:
- Correctly predicted: 3,840
- Incorrectly predicted: 444
- **Accuracy: 89.6%**

For users who self-identified as Conservative:
- Correctly predicted: 359
- Incorrectly predicted: 167
- **Accuracy: 68.3%**

**Why is conservative prediction worse?** Two reasons:
1. **Sample size:** Only 936 conservatives vs. 6,461 liberals—less data to learn from
2. **Base rate:** Since liberals dominate, the average book skews liberal, making liberal predictions more common

---

## Key Takeaways

### SQL Concepts Learned:
1. **DECLARE** creates variables for reuse throughout a script
2. **CREATE TEMP TABLE** breaks complex logic into steps
3. **INNER JOIN** combines tables where matches exist
4. **LEFT JOIN** keeps all rows from the left table even without matches
5. **COALESCE** handles NULL values gracefully
6. **CASE statements** implement conditional logic
7. **Aggregation with GROUP BY** summarizes data by categories

### Analytical Concepts Learned:
1. **Normalization** is essential when comparing groups of different sizes
2. **Lift** measures how much a group over-indexes on a behavior
3. **Log transformation** creates symmetric scales for ratios
4. **Smoothing** (adding 0.001) prevents division by zero
5. **Confusion matrices** evaluate classifier performance

### Business Applications:
This same technique can predict:
- Customer segments from purchase history
- Churn risk from product usage patterns  
- Employee attrition from engagement signals
- Fraud likelihood from transaction patterns

The key insight: seemingly innocuous preferences (books, products, behaviors) often correlate with deeper characteristics—and SQL can uncover these patterns at scale.
