# JOIN Tutorial: Understanding INNER vs LEFT (OUTER) Joins with GROUP BY

This tutorial covers three exercises:

1. **Show the number of music likes per ProfileID** (no join required)
   - Table: `nyu-datasets.facebook.FavoriteMusic`

2. **Show the total number of music likes per PoliticalViews**, together with the count of distinct ProfileIDs for each political view
   - Tables: `nyu-datasets.facebook.FavoriteMusic`, `nyu-datasets.facebook.Profiles`

3. **Compare the results using INNER JOIN vs LEFT (OUTER) JOIN**
   - First, examine the raw join results BEFORE aggregating with GROUP BY
   - Then, observe how the choice of join affects the final counts

---

## Query 1: Number of Music Likes per ProfileID

This is a simple aggregation—no join required because all the data we need (ProfileID and Music) is in a single table.

We use `COUNT(*)` to count how many rows exist for each ProfileID. Each row represents one music preference, so `COUNT(*)` = number of bands liked.

```sql
SELECT 
  ProfileID,
  COUNT(*) AS num_music_likes
FROM `nyu-datasets.facebook.FavoriteMusic`
GROUP BY ProfileID
ORDER BY num_music_likes DESC;
```

**Example output (top 10):**

| ProfileID | num_music_likes |
|-----------|-----------------|
| 820298    | 577             |
| 808452    | 461             |
| 826988    | 413             |
| 825463    | 408             |
| 824312    | 364             |
| 800062    | 313             |
| 829466    | 293             |
| 811411    | 236             |
| 816004    | 233             |
| 823873    | 225             |

> ProfileID 820298 likes 577 bands!

---

## Query 2: Music Likes per PoliticalViews

Now we need data from **two tables**:

- **FavoriteMusic**: contains the music preferences (ProfileID, Music)
- **Profiles**: contains the political views (ProfileID, PoliticalViews)

To connect them, we JOIN on ProfileID (the common column).

Before we aggregate, let's first look at what the join produces...

---

### Step 2A: Raw INNER JOIN Result (Before GROUP BY)

An **INNER JOIN** only returns rows where ProfileID exists in **BOTH** tables. If someone has music preferences but no profile (or vice versa), they're excluded.

```sql
SELECT 
  P.ProfileID,
  P.PoliticalViews,
  M.Music
FROM `nyu-datasets.facebook.Profiles` P
INNER JOIN `nyu-datasets.facebook.FavoriteMusic` M 
  ON P.ProfileID = M.ProfileID
ORDER BY P.ProfileID ASC;
```

**Example output (first rows):**

| ProfileID | PoliticalViews | Music              |
|-----------|----------------|--------------------|
| 800002    | Libertarian    | Bill Evans         |
| 800002    | Libertarian    | Britney Spears     |
| 800002    | Libertarian    | Jon Brion          |
| 800002    | Libertarian    | Radiohead          |
| 800002    | Libertarian    | Led Zeppelin       |
| 800002    | Libertarian    | Mf Doom Et Al      |
| 800002    | Libertarian    | 2Pac               |
| 800002    | Libertarian    | Rjd2               |
| 800002    | Libertarian    | Lovage             |
| 800002    | Libertarian    | Sergei Rachmaninov |
| 800003    | null           | Country Music O    |
| 800004    | Conservative   | Acapellas          |
| 800004    | Conservative   | Mozart Concertos   |
| 800004    | Conservative   | Frou Frou          |
| ...       | ...            | ...                |

> **Key Observation:** ProfileID 800001 does **NOT** appear here! Why? They must have a profile but NO music preferences. INNER JOIN excludes them because there's no match in FavoriteMusic.

---

### Step 2B: Raw LEFT OUTER JOIN Result (Before GROUP BY)

A **LEFT JOIN** returns ALL rows from the left table (Profiles), even if there's no matching music preference. Unmatched rows show NULL for the right table's columns.

```sql
SELECT 
  P.ProfileID,
  P.PoliticalViews,
  M.Music
FROM `nyu-datasets.facebook.Profiles` P
LEFT JOIN `nyu-datasets.facebook.FavoriteMusic` M 
  ON P.ProfileID = M.ProfileID
ORDER BY P.ProfileID ASC;
```

**Example output (first rows):**

| ProfileID | PoliticalViews | Music              |
|-----------|----------------|--------------------|
| 800001    | null           | null               |
| 800002    | Libertarian    | 2Pac               |
| 800002    | Libertarian    | Led Zeppelin       |
| 800002    | Libertarian    | Britney Spears     |
| 800002    | Libertarian    | Jon Brion          |
| 800002    | Libertarian    | Radiohead          |
| 800002    | Libertarian    | Mf Doom Et Al      |
| 800002    | Libertarian    | Sergei Rachmaninov |
| 800002    | Libertarian    | Bill Evans         |
| 800002    | Libertarian    | Lovage             |
| 800002    | Libertarian    | Rjd2               |
| 800003    | null           | Country Music O    |
| 800004    | Conservative   | Jars Of Clay       |
| 800004    | Conservative   | Acapellas          |
| ...       | ...            | ...                |

> **Key Difference:** ProfileID 800001 **now appears** with NULL for Music. The LEFT JOIN keeps everyone from Profiles, even without music preferences.

---

### Step 2C: Aggregate with INNER JOIN

Now we GROUP BY PoliticalViews to get totals:

- `COUNT(*)` counts all rows (total music likes)
- `COUNT(DISTINCT ProfileID)` counts unique people

```sql
SELECT 
  P.PoliticalViews,
  COUNT(*) AS total_music_likes,
  COUNT(DISTINCT P.ProfileID) AS num_people,
  ROUND(COUNT(*) / COUNT(DISTINCT P.ProfileID), 2) AS likes_per_user
FROM `nyu-datasets.facebook.Profiles` P
INNER JOIN `nyu-datasets.facebook.FavoriteMusic` M 
  ON P.ProfileID = M.ProfileID
GROUP BY P.PoliticalViews
ORDER BY total_music_likes DESC;
```

**Output:**

| PoliticalViews    | total_music_likes | num_people | likes_per_user |
|-------------------|-------------------|------------|----------------|
| Liberal           | 82369             | 5537       | 14.88          |
| null              | 42874             | 3967       | 10.81          |
| Very Liberal      | 32909             | 1951       | 16.87          |
| Moderate          | 30297             | 2435       | 12.44          |
| Other             | 10074             | 687        | 14.66          |
| Apathetic         | 8594              | 680        | 12.64          |
| Conservative      | 8180              | 747        | 10.95          |
| Libertarian       | 3881              | 284        | 13.67          |
| Very Conservative | 1064              | 134        | 7.94           |

> **Note:** Only includes people who have BOTH a profile AND music preferences.

---

### Step 2D: Aggregate with LEFT OUTER JOIN

This version includes ALL people from Profiles, even those with no music likes.

```sql
SELECT 
  P.PoliticalViews,
  COUNT(M.Music) AS total_music_likes,  -- Count non-NULL music entries
  COUNT(DISTINCT P.ProfileID) AS num_people,
  ROUND(COUNT(M.Music) / COUNT(DISTINCT P.ProfileID), 2) AS likes_per_user
FROM `nyu-datasets.facebook.Profiles` P
LEFT JOIN `nyu-datasets.facebook.FavoriteMusic` M 
  ON P.ProfileID = M.ProfileID
GROUP BY P.PoliticalViews
ORDER BY total_music_likes DESC;
```

**Output:**

| PoliticalViews    | total_music_likes | num_people | likes_per_user |
|-------------------|-------------------|------------|----------------|
| Liberal           | 82369             | 6461       | 12.75          |
| null              | 42874             | 11091      | 3.87           |
| Very Liberal      | 32909             | 2277       | 14.45          |
| Moderate          | 30297             | 2898       | 10.45          |
| Other             | 10074             | 824        | 12.23          |
| Apathetic         | 8594              | 805        | 10.68          |
| Conservative      | 8180              | 936        | 8.74           |
| Libertarian       | 3881              | 325        | 11.94          |
| Very Conservative | 1064              | 167        | 6.37           |

---

## Comparing INNER JOIN vs LEFT JOIN Results

| PoliticalViews    | INNER JOIN |        |            | LEFT JOIN |         |            |
|-------------------|------------|--------|------------|-----------|---------|------------|
|                   | likes      | people | per user   | likes     | people  | per user   |
| Liberal           | 82,369     | 5,537  | 14.88      | 82,369    | 6,461   | 12.75      |
| null              | 42,874     | 3,967  | 10.81      | 42,874    | 11,091  | 3.87       |
| Very Liberal      | 32,909     | 1,951  | 16.87      | 32,909    | 2,277   | 14.45      |
| Moderate          | 30,297     | 2,435  | 12.44      | 30,297    | 2,898   | 10.45      |
| Other             | 10,074     | 687    | 14.66      | 10,074    | 824     | 12.23      |
| Apathetic         | 8,594      | 680    | 12.64      | 8,594     | 805     | 10.68      |
| Conservative      | 8,180      | 747    | 10.95      | 8,180     | 936     | 8.74       |
| Libertarian       | 3,881      | 284    | 13.67      | 3,881     | 325     | 11.94      |
| Very Conservative | 1,064      | 134    | 7.94       | 1,064     | 167     | 6.37       |

### Key Insights

1. **The total_music_likes is THE SAME in both queries!** People with no music preferences contribute 0 likes either way.

2. **The num_people is HIGHER in the LEFT JOIN for every group.** These extra people have profiles but NO music preferences.

3. **The likes_per_user is LOWER in the LEFT JOIN for every group.** This makes sense—we're dividing the same number of likes by more people (those with zero likes are now included in the denominator).

4. **The biggest difference is in the NULL political views group:** 7,124 additional people (11,091 - 3,967) have profiles but no music likes. Many users create profiles but never fill in their music preferences!

5. **Data Quality Insight:** A large portion of users have incomplete profiles (no political view and/or no music preferences). The dramatic drop in likes_per_user for the NULL group (10.81 → 3.87) shows that users without a stated political view are also less likely to fill in music preferences.

---

## Why COUNT(M.Music) Instead of COUNT(*) for LEFT JOIN?

With LEFT JOIN, people without music preferences appear with `Music = NULL`.

| Function         | Behavior                                            |
|------------------|-----------------------------------------------------|
| `COUNT(*)`       | Counts ALL rows, including NULLs (would overcount!) |
| `COUNT(M.Music)` | Counts only non-NULL values (actual music preferences) |

**Example:** If ProfileID 800001 has no music preferences:

- LEFT JOIN creates 1 row: `(800001, null, NULL)`
- `COUNT(*)` would count this as 1 ❌ (wrong—they have 0 music likes!)
- `COUNT(M.Music)` counts this as 0 ✓ (correct!)
