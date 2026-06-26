# facebook — validated solutions

21 questions, each solved and verified against `nyu-datasets.facebook` on BigQuery.

## Filtering

### Get the names and sex of all liberal students

_used in 21 semester(s) · ✓ verified (6461 rows)_

```sql
SELECT Name, Sex
FROM `nyu-datasets.facebook.Profiles`
WHERE PoliticalViews = 'Liberal'
```

**Hint:** Simple WHERE equality filter on a text column (PoliticalViews = 'Liberal'). Match the value's exact capitalization.

### Get the names, sex, and political views of liberal and very liberal students

_used in 21 semester(s) · ✓ verified (8738 rows)_

```sql
SELECT Name, Sex, PoliticalViews
FROM `nyu-datasets.facebook.Profiles`
WHERE PoliticalViews IN ('Liberal', 'Very Liberal')
```

**Hint:** WHERE with IN (or OR) to match more than one allowed value: PoliticalViews IN ('Liberal','Very Liberal').

### Find all students who live in "Weinstein Hall", independent of their room number

_used in 21 semester(s) · ✓ verified (521 rows)_

```sql
SELECT Name, Residence
FROM `nyu-datasets.facebook.Profiles`
WHERE Residence LIKE 'Weinstein Hall%'
```

**Hint:** Use LIKE with a wildcard ('Weinstein Hall%') instead of '=' because the Residence field appends a room number (and a trailing space) after the building name.

### Find all students with first name "Richard"

_used in 21 semester(s) · ✓ verified (48 rows)_

```sql
SELECT Name
FROM `nyu-datasets.facebook.Profiles`
WHERE Name LIKE 'Richard %'
```

**Hint:** First name is the leading token of the single Name field; match it with LIKE 'Richard %' (note the trailing space so 'Richards' etc. is not matched).

### Find all students with first names starting with P and last names starting with I (e.g. Panos Ipeirotis)

_used in 21 semester(s) · ✓ verified (9 rows)_

```sql
SELECT Name
FROM `nyu-datasets.facebook.Profiles`
WHERE Name LIKE 'P% I%'
```

**Hint:** Two LIKE conditions on the single Name field combined in one pattern: 'P% I%' (starts with P, then a space followed by I). Correctly returns the example 'Panos Ipeirotis'.

## Final exam

### Write a query that returns the five hobbies that appear in the largest number of profiles, ordered from most to least popular. Show the hobby and the count of distinct `ProfileID`s.

_used in 7 semester(s) · ✓ verified (5 rows)_

```sql
SELECT
  Hobby,
  COUNT(DISTINCT ProfileID) AS profile_count
FROM `nyu-datasets.facebook.Hobbies`
GROUP BY Hobby
ORDER BY profile_count DESC, Hobby
LIMIT 5
```

**Hint:** GROUP BY the hobby with COUNT(DISTINCT ProfileID), then ORDER BY that count DESC and LIMIT 5.

### Produce a table with columns `Sex`, `RelationshipStatus`, and `ProfilesCount`. Count every profile that has an entry in the `Relationship` table. Order by `Sex`, then by the count descending. Do not show results for the profiles with NULL in the Sex column.

_used in 7 semester(s) · ✓ verified (11 rows)_

```sql
SELECT p.Sex, r.Status AS RelationshipStatus, COUNT(*) AS ProfilesCount
FROM `nyu-datasets.facebook.Profiles` p
JOIN `nyu-datasets.facebook.Relationship` r ON p.ProfileID = r.ProfileID
WHERE p.Sex IS NOT NULL
GROUP BY p.Sex, r.Status
ORDER BY p.Sex, ProfilesCount DESC
```

**Hint:** INNER JOIN Profiles to Relationship on ProfileID, then GROUP BY Sex and Status with COUNT(*); filter out NULL Sex in WHERE and ORDER BY Sex, count DESC.

### In the Facebook database, find the Male students, who are "InterestedIn" Men (according to the Orientation table), and are "LookingFor" Dating (according to the LookingFor table). List the ProfileID of the student, their Name, and their Birthday, eliminating students that have NULL values for their Birthday.

Hint: 212 rows

_used in 5 semester(s) · ✓ verified (212 rows)_

```sql
SELECT DISTINCT p.ProfileID, p.Name, p.Birthday
FROM `nyu-datasets.facebook.Profiles` p
JOIN `nyu-datasets.facebook.Orientation` o ON p.ProfileID = o.ProfileID
JOIN `nyu-datasets.facebook.LookingFor` l ON p.ProfileID = l.ProfileID
WHERE p.Sex = "Male"
  AND o.InterestedIn IN ("Men", "Men & Women")
  AND l.LookingFor = "Dating"
  AND p.Birthday IS NOT NULL
```

**Hint:** Join Profiles to Orientation and LookingFor on ProfileID; filter Sex='Male', LookingFor='Dating', drop NULL Birthday. To match the 212-row target, 'InterestedIn Men' must include both 'Men' and 'Men & Women'.

### For each ProfileID, show the number of music likes, tv show likes, book likes, and movie likes.

(Warning: Difficult question; you may want to leave it last)

_used in 5 semester(s) · ✓ verified (17854 rows)_

```sql
SELECT
  p.ProfileID,
  (SELECT COUNT(*) FROM `nyu-datasets.facebook.FavoriteMusic`   m  WHERE m.ProfileID  = p.ProfileID) AS music_likes,
  (SELECT COUNT(*) FROM `nyu-datasets.facebook.FavoriteTVShows` t  WHERE t.ProfileID  = p.ProfileID) AS tvshow_likes,
  (SELECT COUNT(*) FROM `nyu-datasets.facebook.FavoriteBooks`   b  WHERE b.ProfileID  = p.ProfileID) AS book_likes,
  (SELECT COUNT(*) FROM `nyu-datasets.facebook.FavoriteMovies`  mo WHERE mo.ProfileID = p.ProfileID) AS movie_likes
FROM `nyu-datasets.facebook.Profiles` p
ORDER BY p.ProfileID
```

**Hint:** Each category lives in its own table (FavoriteMusic, FavoriteTVShows, FavoriteBooks, FavoriteMovies). Count each per ProfileID with a correlated subquery (or COUNT in separate per-table aggregations joined together). Do NOT join all four tables at once to Profiles — the rows multiply (fan-out) and inflate every count.

### For each `Concentration` in the `Concentrations` table, output the concentration name and the count of distinct profiles who listed it.
Include concentrations listed by more than 100 distinct profiles.

_used in 4 semester(s) · ✓ verified (64 rows)_

```sql
SELECT Concentration, COUNT(DISTINCT ProfileID) AS num_profiles FROM `nyu-datasets.facebook.Concentrations` GROUP BY Concentration HAVING COUNT(DISTINCT ProfileID) > 100 ORDER BY num_profiles DESC
```

**Hint:** GROUP BY Concentration, COUNT(DISTINCT ProfileID) for the distinct-profile count, then keep only groups above the threshold with HAVING COUNT(DISTINCT ProfileID) > 100.

### For each Music entry, calculate the number of ProfileIDs that like each music entry, considering only students that listed Eminem in their FavoriteMusic

_used in 4 semester(s) · ✓ verified (20 rows)_

```sql
SELECT Music, COUNT(DISTINCT ProfileID) AS num_profiles FROM `nyu-datasets.facebook.FavoriteMusic` WHERE ProfileID IN (SELECT ProfileID FROM `nyu-datasets.facebook.FavoriteMusic` WHERE Music = 'Eminem') GROUP BY Music ORDER BY num_profiles DESC
```

**Hint:** First find the set of ProfileIDs that listed 'Eminem' (a subquery on FavoriteMusic). Restrict the main query to those profiles with WHERE ProfileID IN (...), then GROUP BY Music and COUNT(DISTINCT ProfileID).

### In the Facebook database, find the most commonly declared double majors/concentrations, and rank them in descending order, based on the number of students. Keep only double majors that have at least 50 students. (Hint: You will need to use the table "Concentration" twice while constructing the query; you also need to ensure that the two concentrations are different, i.e., no "Finance-Finance")

Hint: 28 rows

_used in 3 semester(s) · ✓ verified (28 rows)_

```sql
SELECT c1.Concentration AS conc1, c2.Concentration AS conc2, COUNT(*) AS num_students FROM `nyu-datasets.facebook.Concentrations` c1 JOIN `nyu-datasets.facebook.Concentrations` c2 ON c1.ProfileID = c2.ProfileID AND c1.Concentration < c2.Concentration GROUP BY conc1, conc2 HAVING COUNT(*) >= 50 ORDER BY num_students DESC
```

**Hint:** Self-join the Concentrations table on ProfileID to pair up two concentrations of the same student. Use the asymmetric condition c1.Concentration < c2.Concentration to force the two majors to differ AND to count each unordered pair once (avoids Finance-Finance and duplicate Finance-Accounting/Accounting-Finance). GROUP BY the pair, HAVING COUNT(*) >= 50.

### In the Facebook database, for each book, list the number of women that like the book. Limit the list to books that have at least 100 likes from women.

Hint: 55 books

_used in 2 semester(s) · ✓ verified (55 rows)_

```sql
SELECT fb.Book, COUNT(*) AS num_women
FROM `nyu-datasets.facebook.FavoriteBooks` fb
JOIN `nyu-datasets.facebook.Profiles` p ON fb.ProfileID = p.ProfileID
WHERE p.Sex = 'Female'
GROUP BY fb.Book
HAVING COUNT(*) >= 100
ORDER BY num_women DESC
```

**Hint:** Join FavoriteBooks to Profiles on ProfileID, filter to Sex='Female', then GROUP BY Book with HAVING COUNT(*) >= 100 to keep only popular books. The HAVING threshold applies to the per-book count of women.

### The film **“The Godfather”** is stored as a value in `FavoriteMovies.Movie`. For each `Orientation.InterestedIn` value, count how many members list that movie.

_used in 2 semester(s) · ✓ verified (3 rows)_

```sql
SELECT o.InterestedIn, COUNT(DISTINCT f.ProfileID) AS num_members
FROM `nyu-datasets.facebook.FavoriteMovies` f
JOIN `nyu-datasets.facebook.Orientation` o ON f.ProfileID = o.ProfileID
WHERE f.Movie = 'The Godfather'
GROUP BY o.InterestedIn
ORDER BY num_members DESC
```

**Hint:** Join FavoriteMovies to Orientation on ProfileID, filter Movie='The Godfather', then GROUP BY InterestedIn with COUNT(DISTINCT ProfileID).

### List the `ProfileID`s of members who have more than 200 different entries in `FavoriteMusic`. Show each qualifying ProfileID and the number of music entries for each profile.

_used in 2 semester(s) · ✓ verified (11 rows)_

```sql
SELECT ProfileID, COUNT(DISTINCT Music) AS num_music
FROM `nyu-datasets.facebook.FavoriteMusic`
GROUP BY ProfileID
HAVING COUNT(DISTINCT Music) > 200
ORDER BY num_music DESC
```

**Hint:** GROUP BY ProfileID over FavoriteMusic, count distinct Music entries, and filter with HAVING COUNT(DISTINCT Music) > 200.

### For each ProfileID, show the number of music likes, tv show likes, book likes, and movie likes.

_used in 2 semester(s) · ✓ verified (10 rows)_

```sql
SELECT
  p.ProfileID,
  (SELECT COUNT(*) FROM `nyu-datasets.facebook.FavoriteMusic` mu WHERE mu.ProfileID = p.ProfileID) AS music_likes,
  (SELECT COUNT(*) FROM `nyu-datasets.facebook.FavoriteTVShows` tv WHERE tv.ProfileID = p.ProfileID) AS tvshow_likes,
  (SELECT COUNT(*) FROM `nyu-datasets.facebook.FavoriteBooks` bk WHERE bk.ProfileID = p.ProfileID) AS book_likes,
  (SELECT COUNT(*) FROM `nyu-datasets.facebook.FavoriteMovies` mo WHERE mo.ProfileID = p.ProfileID) AS movie_likes
FROM `nyu-datasets.facebook.Profiles` p
ORDER BY p.ProfileID
```

**Hint:** One row per profile with four counts. Easiest is correlated scalar subqueries (one COUNT(*) per Favorite* table) keyed on ProfileID; alternatively LEFT JOIN each Favorite* table and COUNT per table. Drive from Profiles so profiles with zero likes still appear.

### For each `Concentration` in the `Concentration` table, output the concentration name and the count of distinct profiles who listed it.
Include concentrations listed by more than 100 distinct profiles.

_used in 2 semester(s) · ✓ verified (64 rows)_

```sql
SELECT Concentration, COUNT(DISTINCT ProfileID) AS num_profiles
FROM `nyu-datasets.facebook.Concentrations`
GROUP BY Concentration
HAVING COUNT(DISTINCT ProfileID) > 100
ORDER BY num_profiles DESC
```

**Hint:** GROUP BY Concentration over the Concentrations table, COUNT(DISTINCT ProfileID), and filter with HAVING > 100.

### List the 10 most popular Music entries and the number of students that like them, across students that are concentrating in Finance.

Hint: The results are the

Coldplay

151

Hip Hop

93

Jay Z

86

U2

78

Green Day

73

Maroon 5

72

R And B

71

Radiohead

69

The Killers

65

Jack Johnson

63

_used in 1 semester(s) · ✓ verified (10 rows)_

```sql
SELECT
  m.Music,
  COUNT(DISTINCT m.ProfileID) AS num_students
FROM `nyu-datasets.facebook.FavoriteMusic` m
JOIN `nyu-datasets.facebook.Concentrations` c
  ON m.ProfileID = c.ProfileID
WHERE c.Concentration = 'Finance'
GROUP BY m.Music
ORDER BY num_students DESC, m.Music
LIMIT 10
```

**Hint:** JOIN FavoriteMusic to Concentrations on ProfileID, filter WHERE Concentration = 'Finance', then GROUP BY the music entry, COUNT distinct students, ORDER BY count DESC and LIMIT 10.

### **(This is a hard question)**

In the Facebook database, calculate the average number of hobbies listed by each person in the database, and report the average number of hobbies broken down by "Sex".

You will need the Profiles table to get the Sex of each person, and the Hobbies table to get the hobbies. You will probably need to use a subquery to compute the averages.

Hint: The correct result of the query will be

Female

7.2005

Male

5.5941

_NULL_

1.1225

If you get that Females have 9.577 hobbies on average and males have 7.6512 hobbies on average, then you need to remember that there are people that have listed no hobbies.

_used in 1 semester(s) · ✓ verified (3 rows)_

```sql
WITH hobby_counts AS (
  SELECT
    p.ProfileID,
    p.Sex,
    (SELECT COUNT(*)
     FROM `nyu-datasets.facebook.Hobbies` h
     WHERE h.ProfileID = p.ProfileID) AS num_hobbies
  FROM `nyu-datasets.facebook.Profiles` p
)
SELECT
  Sex,
  AVG(num_hobbies) AS avg_hobbies
FROM hobby_counts
GROUP BY Sex
ORDER BY avg_hobbies DESC
```

**Hint:** Count hobbies per profile with a correlated subquery (or LEFT JOIN) starting from Profiles so people with zero hobbies still count as 0, then AVG those per-person counts grouped by Sex.

### For **every calendar day** present in `MemberSince`, the following metrics:

Output column

Definition

`the_day`

the `MemberSince` date

`new_users`

count of profiles whose `MemberSince` **equals** `the_day`

`total_users`

running total of all profiles created **up to and including** `the_day`

`daily_growth_pct`

this is equal to `100 × new_users / total_users_on_previous_day`
(for the first day, show `NULL`)

You can assume, for simplicity, that MemberSince includes all dates, no need to worry about dates with 0 signups.

_used in 1 semester(s) · ✓ verified (671 rows)_

```sql
WITH daily AS (
  SELECT DATE(MemberSince) AS the_day, COUNT(*) AS new_users
  FROM `nyu-datasets.facebook.Profiles`
  GROUP BY the_day
),
running AS (
  SELECT
    the_day,
    new_users,
    SUM(new_users) OVER (ORDER BY the_day) AS total_users
  FROM daily
)
SELECT
  the_day,
  new_users,
  total_users,
  ROUND(100 * new_users / LAG(total_users) OVER (ORDER BY the_day), 4) AS daily_growth_pct
FROM running
ORDER BY the_day
```

**Hint:** Aggregate sign-ups per day, then use a running SUM(...) OVER (ORDER BY the_day) for total_users. For daily_growth_pct, divide today's new_users by the PREVIOUS day's running total via LAG over a separate CTE (you cannot nest a window function inside LAG). First day is NULL automatically.

### This is an OPTIONAL, extra credit query. It builds on the growth calculation question, and expands it to calculate user churn, in addition to growth.

You have the table **`Profiles`**, with these columns:

Column

Type

Meaning

`ProfileID`

INT

primary key

`MemberSince`

DATE

creation date of the profile (already day-granular)

`LastUpdate`

DATE

most recent activity timestamp

A user is considered **churned** exactly 30 days after their last activity:
`churn_day = DATE(LastUpdate + INTERVAL 30 DAY)`.

Write a single query that produces, for **every calendar day on which either a sign-up or a churn event occurs**, the following metrics:

Output column

Definition

`the_day`

calendar day (DATE)

`new_users`

`COUNT(*)` of profiles whose `MemberSince = the_day`

`churned_users`

`COUNT(*)` of profiles whose `churn_day = the_day`

`signedup_users`

running total of all sign-ups up to and including `the_day`

`inactive_users`

running total of all churned users up to and including `the_day`

`active_users`

`signedup_users − inactive_users`

`daily_growth_pct`

`100 × new_users / active_users_on_previous_day`, rounded to 2 decimals; show `NULL` on the first day

`daily_churn_pct`

`100 × churned_users / active_users_on_previous_day`, rounded to 2 decimals; show `NULL` on the first day

_used in 1 semester(s) · ✓ verified (700 rows)_

```sql
WITH signups AS (
  SELECT DATE(MemberSince) AS the_day, COUNT(*) AS new_users
  FROM `nyu-datasets.facebook.Profiles`
  GROUP BY the_day
),
churns AS (
  SELECT DATE(DATE_ADD(DATE(LastUpdate), INTERVAL 30 DAY)) AS the_day, COUNT(*) AS churned_users
  FROM `nyu-datasets.facebook.Profiles`
  GROUP BY the_day
),
events AS (
  SELECT
    COALESCE(s.the_day, c.the_day) AS the_day,
    COALESCE(s.new_users, 0) AS new_users,
    COALESCE(c.churned_users, 0) AS churned_users
  FROM signups s
  FULL OUTER JOIN churns c ON s.the_day = c.the_day
),
running AS (
  SELECT
    the_day,
    new_users,
    churned_users,
    SUM(new_users) OVER (ORDER BY the_day) AS signedup_users,
    SUM(churned_users) OVER (ORDER BY the_day) AS inactive_users
  FROM events
),
withactive AS (
  SELECT
    the_day, new_users, churned_users, signedup_users, inactive_users,
    signedup_users - inactive_users AS active_users
  FROM running
)
SELECT
  the_day, new_users, churned_users, signedup_users, inactive_users, active_users,
  ROUND(100 * new_users / LAG(active_users) OVER (ORDER BY the_day), 2) AS daily_growth_pct,
  ROUND(100 * churned_users / LAG(active_users) OVER (ORDER BY the_day), 2) AS daily_churn_pct
FROM withactive
ORDER BY the_day
```

**Hint:** Build two per-day event streams (sign-ups by MemberSince, churns by LastUpdate + INTERVAL 30 DAY), FULL OUTER JOIN them so every day with either event appears, COALESCE missing counts to 0, then running-SUM each. active_users = signedup - inactive, and both pct columns divide by the PREVIOUS day's active_users via LAG (NULL on the first day).
