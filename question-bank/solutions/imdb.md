# imdb — validated solutions

13 questions, each solved and verified against `nyu-datasets.imdb` on BigQuery.

## Subqueries

### For _**eligible**_ names that appear for _**both**_ males and females, report the names and the frequencies for males and females. Rank the most ambiguous names on top. We consider as most ambiguous names the ones where the formula **log( male\_freq / female\_freq )** is close to 0. Remember that the log can be positive and negative; ranking by absolute value (using the [ABS() function](https://www.w3schools.com/sql/func_mysql_abs.asp)) will allow you to rank the smallest numbers first.

_used in 19 semester(s) · ✓ verified (925 rows)_

```sql
WITH eligible AS (
  SELECT first_name
  FROM `nyu-datasets.imdb.actors`
  WHERE first_name NOT LIKE '%.%'
    AND first_name NOT LIKE '%(%'
    AND first_name NOT LIKE '%)%'
  GROUP BY first_name
  HAVING COUNT(*) >= 50
),
gender_counts AS (
  SELECT a.first_name,
         COUNTIF(a.gender = 'M') AS male_freq,
         COUNTIF(a.gender = 'F') AS female_freq
  FROM `nyu-datasets.imdb.actors` a
  JOIN eligible e ON a.first_name = e.first_name
  GROUP BY a.first_name
)
SELECT first_name, male_freq, female_freq
FROM gender_counts
WHERE male_freq > 0 AND female_freq > 0
ORDER BY ABS(LOG(male_freq / female_freq)) ASC
```

**Hint:** Build an 'eligible names' subquery (first names with no dot/parentheses appearing >= 50 times overall), then count M and F per name with COUNTIF; keep names with both > 0 and ORDER BY ABS(LOG(male_freq/female_freq)) so the most balanced (ambiguous) names sort first.

### Find the eligible names that appear only for male actors but for no female actresses, and report the corresponding frequencies.

_used in 16 semester(s) · ✓ verified (678 rows)_

```sql
WITH eligible AS (
  SELECT first_name
  FROM `nyu-datasets.imdb.actors`
  WHERE first_name NOT LIKE '%.%'
    AND first_name NOT LIKE '%(%'
    AND first_name NOT LIKE '%)%'
  GROUP BY first_name
  HAVING COUNT(*) >= 50
),
gender_counts AS (
  SELECT a.first_name,
         COUNTIF(a.gender = 'M') AS male_freq,
         COUNTIF(a.gender = 'F') AS female_freq
  FROM `nyu-datasets.imdb.actors` a
  JOIN eligible e ON a.first_name = e.first_name
  GROUP BY a.first_name
)
SELECT first_name, male_freq, female_freq
FROM gender_counts
WHERE female_freq = 0 AND male_freq > 0
ORDER BY male_freq DESC
```

**Hint:** Reuse the eligible-names subquery, count M and F per name with COUNTIF, then keep only names where female_freq = 0 (and male_freq > 0). The 'only male' condition is the zero-count on the other gender.

### Find the eligible names that appear only for female actors but for no male actresses, and report the corresponding frequencies.

_used in 16 semester(s) · ✓ verified (466 rows)_

```sql
WITH eligible AS (
  SELECT first_name
  FROM `nyu-datasets.imdb.actors`
  WHERE first_name NOT LIKE '%.%'
    AND first_name NOT LIKE '%(%'
    AND first_name NOT LIKE '%)%'
  GROUP BY first_name
  HAVING COUNT(*) >= 50
),
gender_counts AS (
  SELECT a.first_name,
         COUNTIF(a.gender = 'M') AS male_freq,
         COUNTIF(a.gender = 'F') AS female_freq
  FROM `nyu-datasets.imdb.actors` a
  JOIN eligible e ON a.first_name = e.first_name
  GROUP BY a.first_name
)
SELECT first_name, male_freq, female_freq
FROM gender_counts
WHERE male_freq = 0 AND female_freq > 0
ORDER BY female_freq DESC
```

**Hint:** Same eligible-names + COUNTIF setup as the male-only question, but flip the filter: keep names where male_freq = 0 (and female_freq > 0).

### As a first step, limit your analysis only to first names that do not include a dot "." or parentheses (i.e, ignore "A.", "J.B.", "Alfred (I)" etc); also only consider first names that appear at least 50 times in the actors table (across both genders; ie., a name that appears in 35 males and 20 females qualifies as eligible). Create a temporary table with the results, called "eligible\_names". (You will use the table in later questions)

_used in 11 semester(s) · ✓ verified (2069 rows)_

```sql
CREATE TEMP TABLE eligible_names AS
SELECT
  first_name,
  COUNT(*) AS name_count
FROM `nyu-datasets.imdb.actors`
WHERE first_name NOT LIKE '%.%'
  AND first_name NOT LIKE '%(%'
  AND first_name NOT LIKE '%)%'
GROUP BY first_name
HAVING COUNT(*) >= 50;
```

**Hint:** GROUP BY first_name with HAVING COUNT(*) >= 50, and exclude names containing punctuation using NOT LIKE '%.%' / '%(%' / '%)%'. Because you don't filter on gender, COUNT(*) automatically counts across both genders. Wrap in CREATE TEMP TABLE eligible_names AS ... to persist for later questions.

### As a first step, limit your analysis only to first names that do not include a dot "." or parentheses (i.e, ignore "A.", "J.B.", "Alfred (I)" etc); also only consider first names that appear at least 50 times in the actors table (across both genders, ie a name with 35 males and 20 females qualifies). Create a temporary table with the results, called "**eligible\_names**". (You will use the table in later questions)

_used in 3 semester(s) · ✓ verified (2069 rows)_

```sql
SELECT first_name, COUNT(*) AS freq
FROM `nyu-datasets.imdb.actors`
WHERE first_name NOT LIKE '%.%'
  AND first_name NOT LIKE '%(%'
  AND first_name NOT LIKE '%)%'
GROUP BY first_name
HAVING COUNT(*) >= 50
```

**Hint:** Filter out unwanted names with WHERE ... NOT LIKE '%.%' (and same for parentheses), then GROUP BY first_name with HAVING COUNT(*) >= 50. The HAVING runs after grouping so it can test the per-name total. To persist it, wrap the SELECT in CREATE TEMP TABLE eligible_names AS ( ... ).

### Find the eligible names (see definition of eligible names from Q1) that appear only for male actors but for no female actresses, and report the corresponding frequencies.

_used in 3 semester(s) · ✓ verified (678 rows)_

```sql
WITH eligible AS (
  SELECT first_name
  FROM `nyu-datasets.imdb.actors`
  WHERE first_name NOT LIKE '%.%'
    AND first_name NOT LIKE '%(%'
    AND first_name NOT LIKE '%)%'
  GROUP BY first_name
  HAVING COUNT(*) >= 50
)
SELECT a.first_name, COUNT(*) AS frequency
FROM `nyu-datasets.imdb.actors` a
JOIN eligible e ON a.first_name = e.first_name
GROUP BY a.first_name
HAVING COUNTIF(a.gender = 'F') = 0
   AND COUNTIF(a.gender = 'M') > 0
ORDER BY frequency DESC
```

**Hint:** Restrict to the eligible names (CTE or join to eligible_names), then GROUP BY name and use a conditional-count HAVING: COUNTIF(gender='F') = 0 keeps names with zero female actors. COUNTIF is the BigQuery shortcut for SUM(CASE WHEN ... THEN 1 ELSE 0 END).

### Find the eligible names (see definition of eligible names from Q1) that appear only for female actors but for no male actresses, and report the corresponding frequencies.

_used in 3 semester(s) · ✓ verified (466 rows)_

```sql
WITH eligible AS (
  SELECT first_name
  FROM `nyu-datasets.imdb.actors`
  WHERE first_name NOT LIKE '%.%'
    AND first_name NOT LIKE '%(%'
    AND first_name NOT LIKE '%)%'
  GROUP BY first_name
  HAVING COUNT(*) >= 50
)
SELECT a.first_name, COUNT(*) AS frequency
FROM `nyu-datasets.imdb.actors` a
JOIN eligible e ON a.first_name = e.first_name
GROUP BY a.first_name
HAVING COUNTIF(a.gender = 'M') = 0
   AND COUNTIF(a.gender = 'F') > 0
ORDER BY frequency DESC
```

**Hint:** Same pattern as the male-only question but flip the condition: HAVING COUNTIF(gender='M') = 0 keeps names that appear only for women. Use COUNTIF for the gender-conditional counts after GROUP BY.

## General / other

### As a first step, limit your analysis only to first names that do not include a dot "." or parentheses (i.e, ignore "A.", "J.B.", "Alfred (I)" etc); also only consider first names that appear at least 50 times in the actors table (across both genders). Create a temporary table with the results, called "eligible\_names". (You will use the table in later questions)

_used in 5 semester(s) · ✓ verified (2069 rows)_

```sql
SELECT first_name, COUNT(*) AS name_count
FROM `nyu-datasets.imdb.actors`
WHERE first_name NOT LIKE "%.%"
  AND first_name NOT LIKE "%(%"
  AND first_name NOT LIKE "%)%"
GROUP BY first_name
HAVING COUNT(*) >= 50
ORDER BY name_count DESC
```

**Hint:** GROUP BY first_name with COUNT(*), exclude names containing '.', '(' or ')' using NOT LIKE patterns, and keep groups with HAVING COUNT(*) >= 50. Wrap it in CREATE TEMP TABLE eligible_names AS (...) to persist for later questions.

## Final exam

### In the IMDb database, find the actors that have starred in at least 5 rated movies. List their first and last names, the first and last year that they starred in a movie (rated or not) and the number of years they have been active. Also list the total number of movies that the actor participated, the number of rated movies they participated, and their average rating of these movies.

_used in 2 semester(s) · ✓ verified (53754 rows)_

```sql
WITH actor_movies AS (
  SELECT DISTINCT r.actor_id, m.id AS movie_id, m.year, m.rating
  FROM `nyu-datasets.imdb.roles` r
  JOIN `nyu-datasets.imdb.movies` m ON r.movie_id = m.id
)
SELECT
  a.first_name,
  a.last_name,
  MIN(am.year) AS first_year,
  MAX(am.year) AS last_year,
  MAX(am.year) - MIN(am.year) AS years_active,
  COUNT(*) AS total_movies,
  COUNTIF(am.rating IS NOT NULL) AS rated_movies,
  ROUND(AVG(am.rating), 2) AS avg_rating
FROM actor_movies am
JOIN `nyu-datasets.imdb.actors` a ON am.actor_id = a.id
GROUP BY a.id, a.first_name, a.last_name
HAVING COUNTIF(am.rating IS NOT NULL) >= 5
ORDER BY rated_movies DESC
```

**Hint:** Join roles to movies (dedupe to DISTINCT actor-movie pairs first, since an actor can hold several roles in one film), then GROUP BY actor. MIN(year)/MAX(year) give first/last active year and their difference gives years active; COUNT(*) is total movies, COUNTIF(rating IS NOT NULL) is rated movies, AVG(rating) is the mean over rated movies. Filter with HAVING COUNTIF(rating IS NOT NULL) >= 5.

### In the IMDb database, you are asked to analyze the first names of the actors and how they correlate to gender. Limit your analysis only to first names that do not include a dot "." or parentheses (i.e, ignore "A.", "J.B.", "Alfred (I)" etc), and only consider first names that appear at least 50 times in the actors table.

Find the names that appear only for male actors but for no female actresses, and report the corresponding frequencies (Hint: the results start with "Richard, 2403", "Mark, 2086", etc)

_used in 2 semester(s) · ✓ verified (678 rows)_

```sql
WITH eligible AS (
  SELECT first_name
  FROM `nyu-datasets.imdb.actors`
  WHERE first_name NOT LIKE '%.%'
    AND first_name NOT LIKE '%(%'
    AND first_name NOT LIKE '%)%'
  GROUP BY first_name
  HAVING COUNT(*) >= 50
)
SELECT a.first_name, COUNT(*) AS frequency
FROM `nyu-datasets.imdb.actors` a
JOIN eligible e ON a.first_name = e.first_name
GROUP BY a.first_name
HAVING COUNTIF(a.gender = 'F') = 0
   AND COUNTIF(a.gender = 'M') > 0
ORDER BY frequency DESC
```

**Hint:** First build the eligible-name set (no '.'/parentheses, COUNT(*) >= 50) in a CTE, then group the actors by name and keep those with COUNTIF(gender='F') = 0 (appear only for men). COUNTIF makes the gender-conditional count concise.

### In the IMDb database, you are asked to analyze the first names of the actors and how they correlate to gender. Limit your analysis only to first names that do not include a dot "." or parentheses (i.e, ignore "A.", "J.B.", "Alfred (I)" etc), and only consider first names that appear at least 50 times in the actors table.

Find the names that appear only for female actresses but for no male actors, and report the corresponding frequencies (Hint: the results start with "Anna, 1612", "Lisa, 1227", etc)

_used in 2 semester(s) · ✓ verified (10 rows)_

```sql
SELECT first_name, COUNT(*) AS freq
FROM `nyu-datasets.imdb.actors`
WHERE first_name NOT LIKE '%.%'
  AND first_name NOT LIKE '%(%'
  AND first_name NOT LIKE '%)%'
GROUP BY first_name
HAVING COUNT(*) >= 50
  AND COUNTIF(gender = 'M') = 0
ORDER BY freq DESC
```

**Hint:** GROUP BY first_name with HAVING; use COUNTIF(gender='M')=0 to keep names that never occur for a male actor, plus a COUNT(*) >= 50 frequency floor. Exclude names with '.', '(' or ')' via NOT LIKE.

### Find the number of movies that each actress (i.e., gender being 'F') has played, the number of rated movies that she has played in, and the average rating of their movies. Keep only actresses that have played in at least 40 movies and at least 30 rated movies, and order in descending order based on the average rating of their movies. Restrict your analysis only to non-Adult movies (otherwise, surprise surprise, plenty of pornstars have a rating of 9.9).

_used in 2 semester(s) · ✓ verified (10 rows)_

```sql
SELECT
  a.id,
  a.first_name,
  a.last_name,
  COUNT(DISTINCT m.id) AS num_movies,
  COUNT(DISTINCT IF(m.rating IS NOT NULL, m.id, NULL)) AS num_rated_movies,
  AVG(m.rating) AS avg_rating
FROM `nyu-datasets.imdb.actors` a
JOIN `nyu-datasets.imdb.roles` r ON a.id = r.actor_id
JOIN `nyu-datasets.imdb.movies` m ON r.movie_id = m.id
WHERE a.gender = 'F'
  AND m.id NOT IN (
    SELECT movie_id FROM `nyu-datasets.imdb.movies_genres` WHERE genre = 'Adult'
  )
GROUP BY a.id, a.first_name, a.last_name
HAVING COUNT(DISTINCT m.id) >= 40
  AND COUNT(DISTINCT IF(m.rating IS NOT NULL, m.id, NULL)) >= 30
ORDER BY avg_rating DESC
```

**Hint:** Join actors->roles->movies, filter gender='F'; exclude Adult movies via NOT IN a movies_genres subquery. Use COUNT(DISTINCT movie_id) for total movies and COUNT(DISTINCT IF(rating IS NOT NULL,...)) for rated movies, then HAVING on both thresholds and ORDER BY AVG(rating) DESC.

### You are asked to analyze the first names of the actors and how they correlate to gender. Limit your analysis only to first names that do not include a dot "." or parentheses (i.e, ignore "A.", "J.B.", "Alfred (I)" etc), and only consider first names that appear at least 50 times in the actors table.

For names that appear for both males and females, report the names and the frequencies for males and females. Rank on top the most ambiguous names, as measured by the ratio of the frequencies. Remember that the most ambiguous names are the ones with the absolute values of the ratio is 1:1 across males:females. (Hint: Mika, Dany, Devon, Toni are the most ambiguous.)

_used in 2 semester(s) · ✓ verified (10 rows)_

```sql
SELECT first_name,
  COUNTIF(gender = 'M') AS male_freq,
  COUNTIF(gender = 'F') AS female_freq
FROM `nyu-datasets.imdb.actors`
WHERE first_name NOT LIKE '%.%'
  AND first_name NOT LIKE '%(%'
  AND first_name NOT LIKE '%)%'
GROUP BY first_name
HAVING COUNT(*) >= 50
  AND COUNTIF(gender = 'M') > 0
  AND COUNTIF(gender = 'F') > 0
ORDER BY ABS(LOG(COUNTIF(gender = 'M') / COUNTIF(gender = 'F'))) ASC
```

**Hint:** GROUP BY first_name with conditional COUNTIF for each gender; keep names used by both sexes (both COUNTIF>0) with COUNT(*)>=50. Rank ambiguity by how close the M:F ratio is to 1 -- order by ABS(LOG(male/female)) ascending (equivalently MAX/MIN ratio ascending).
