-- ============================================================================
-- JOIN TUTORIAL: Understanding INNER vs LEFT (OUTER) Joins with GROUP BY
-- ============================================================================
--
-- This tutorial covers three exercises:
--
-- 1. Show the number of music likes per ProfileID (no join required)
--    - Table: `nyu-datasets.facebook.FavoriteMusic`
--
-- 2. Show the total number of music likes per PoliticalViews, together with 
--    the count of distinct ProfileIDs for each political view
--    - Tables: `nyu-datasets.facebook.FavoriteMusic` 
--              `nyu-datasets.facebook.Profiles`
--
-- 3. Compare the results using INNER JOIN vs LEFT (OUTER) JOIN
--    - First, examine the raw join results BEFORE aggregating with GROUP BY
--    - Then, observe how the choice of join affects the final counts
--
-- ============================================================================



-- ============================================================================
-- QUERY 1: Number of music likes per ProfileID
-- ============================================================================
-- This is a simple aggregation - no join required because all the data 
-- we need (ProfileID and Music) is in a single table.
--
-- We use COUNT(*) to count how many rows exist for each ProfileID.
-- Each row represents one music preference, so COUNT(*) = number of bands liked.

SELECT 
  ProfileID,
  COUNT(*) AS num_music_likes
FROM `nyu-datasets.facebook.FavoriteMusic`
GROUP BY ProfileID
ORDER BY num_music_likes DESC;

-- Example output (top 10):
-- +-----------+-----------------+
-- | ProfileID | num_music_likes |
-- +-----------+-----------------+
-- | 820298    | 577             |  <-- This user likes 577 bands!
-- | 808452    | 461             |
-- | 826988    | 413             |
-- | 825463    | 408             |
-- | 824312    | 364             |
-- | 800062    | 313             |
-- | 829466    | 293             |
-- | 811411    | 236             |
-- | 816004    | 233             |
-- | 823873    | 225             |
-- +-----------+-----------------+


-- ============================================================================
-- QUERY 2: Music likes per PoliticalViews
-- ============================================================================
-- Now we need data from TWO tables:
--   - FavoriteMusic: contains the music preferences (ProfileID, Music)
--   - Profiles: contains the political views (ProfileID, PoliticalViews)
--
-- To connect them, we JOIN on ProfileID (the common column).
--
-- BEFORE WE AGGREGATE: Let's first look at what the join produces...


-- ============================================================================
-- STEP 2A: See the raw INNER JOIN result (before GROUP BY)
-- ============================================================================
-- An INNER JOIN only returns rows where ProfileID exists in BOTH tables.
-- If someone has music preferences but no profile (or vice versa), they're excluded.

SELECT 
  P.ProfileID,
  P.PoliticalViews,
  M.Music
FROM `nyu-datasets.facebook.Profiles` P
INNER JOIN `nyu-datasets.facebook.FavoriteMusic` M 
  ON P.ProfileID = M.ProfileID
ORDER BY P.ProfileID ASC;

-- Example output (first 48 rows):
-- +-----------+----------------+-------------------------+
-- | ProfileID | PoliticalViews | Music                   |
-- +-----------+----------------+-------------------------+
-- | 800002    | Libertarian    | Bill Evans              |
-- | 800002    | Libertarian    | Britney Spears          |  <-- Same person appears
-- | 800002    | Libertarian    | Jon Brion               |      multiple times (once
-- | 800002    | Libertarian    | Radiohead               |      per music preference)
-- | 800002    | Libertarian    | Led Zeppelin            |
-- | 800002    | Libertarian    | Mf Doom Et Al           |
-- | 800002    | Libertarian    | 2Pac                    |
-- | 800002    | Libertarian    | Rjd2                    |
-- | 800002    | Libertarian    | Lovage                  |
-- | 800002    | Libertarian    | Sergei Rachmaninov      |
-- | 800003    | null           | Country Music O         |  <-- Some people have NULL political views
-- | 800004    | Conservative   | Acapellas               |
-- | 800004    | Conservative   | Mozart Concertos        |
-- | 800004    | Conservative   | Frou Frou               |
-- | ...       | ...            | ...                     |
-- | 800005    | null           | Motion City Soundtrack  |
-- | 800005    | null           | Gatsby S American Dream |
-- | 800005    | null           | Fall Out Boy            |
-- | 800005    | null           | Jimmy Eat World         |
-- +-----------+----------------+-------------------------+
-- 
-- KEY OBSERVATION: ProfileID 800001 does NOT appear here!
-- Why? They must have a profile but NO music preferences.
-- INNER JOIN excludes them because there's no match in FavoriteMusic.


-- ============================================================================
-- STEP 2B: See the raw LEFT OUTER JOIN result (before GROUP BY)
-- ============================================================================
-- A LEFT JOIN returns ALL rows from the left table (Profiles), 
-- even if there's no matching music preference.
-- Unmatched rows show NULL for the right table's columns.

SELECT 
  P.ProfileID,
  P.PoliticalViews,
  M.Music
FROM `nyu-datasets.facebook.Profiles` P
LEFT JOIN `nyu-datasets.facebook.FavoriteMusic` M 
  ON P.ProfileID = M.ProfileID
ORDER BY P.ProfileID ASC;

-- Example output (first 30 rows):
-- +-----------+----------------+-------------------------+
-- | ProfileID | PoliticalViews | Music                   |
-- +-----------+----------------+-------------------------+
-- | 800001    | null           | null                    |  <-- NOW 800001 APPEARS!
-- | 800002    | Libertarian    | 2Pac                    |      They have no music
-- | 800002    | Libertarian    | Led Zeppelin            |      preferences (Music=null)
-- | 800002    | Libertarian    | Britney Spears          |
-- | 800002    | Libertarian    | Jon Brion               |
-- | 800002    | Libertarian    | Radiohead               |
-- | 800002    | Libertarian    | Mf Doom Et Al           |
-- | 800002    | Libertarian    | Sergei Rachmaninov      |
-- | 800002    | Libertarian    | Bill Evans              |
-- | 800002    | Libertarian    | Lovage                  |
-- | 800002    | Libertarian    | Rjd2                    |
-- | 800003    | null           | Country Music O         |
-- | 800004    | Conservative   | Jars Of Clay            |
-- | 800004    | Conservative   | Acapellas               |
-- | ...       | ...            | ...                     |
-- +-----------+----------------+-------------------------+
--
-- KEY DIFFERENCE: ProfileID 800001 now appears with NULL for Music.
-- The LEFT JOIN keeps everyone from Profiles, even without music preferences.


-- ============================================================================
-- STEP 2C: Aggregate with INNER JOIN
-- ============================================================================
-- Now we GROUP BY PoliticalViews to get totals.
-- COUNT(*) counts all rows (total music likes)
-- COUNT(DISTINCT ProfileID) counts unique people

SELECT 
  P.PoliticalViews,
  COUNT(*) AS total_music_likes,
  COUNT(DISTINCT P.ProfileID) AS num_people
FROM `nyu-datasets.facebook.Profiles` P
INNER JOIN `nyu-datasets.facebook.FavoriteMusic` M 
  ON P.ProfileID = M.ProfileID
GROUP BY P.PoliticalViews
ORDER BY total_music_likes DESC;

-- Output:
-- +-------------------+-------------------+------------+
-- | PoliticalViews    | total_music_likes | num_people |
-- +-------------------+-------------------+------------+
-- | Liberal           | 82369             | 5537       |
-- | null              | 42874             | 3967       |
-- | Very Liberal      | 32909             | 1951       |
-- | Moderate          | 30297             | 2435       |
-- | Other             | 10074             | 687        |
-- | Apathetic         | 8594              | 680        |
-- | Conservative      | 8180              | 747        |
-- | Libertarian       | 3881              | 284        |
-- | Very Conservative | 1064              | 134        |
-- +-------------------+-------------------+------------+
-- 
-- NOTE: Only includes people who have BOTH a profile AND music preferences.


-- ============================================================================
-- STEP 2D: Aggregate with LEFT OUTER JOIN
-- ============================================================================
-- This version includes ALL people from Profiles, even those with no music likes.

SELECT 
  P.PoliticalViews,
  COUNT(M.Music) AS total_music_likes,  -- Count non-NULL music entries
  COUNT(DISTINCT P.ProfileID) AS num_people
FROM `nyu-datasets.facebook.Profiles` P
LEFT JOIN `nyu-datasets.facebook.FavoriteMusic` M 
  ON P.ProfileID = M.ProfileID
GROUP BY P.PoliticalViews
ORDER BY total_music_likes DESC;

-- Output:
-- +-------------------+-------------------+------------+
-- | PoliticalViews    | total_music_likes | num_people |
-- +-------------------+-------------------+------------+
-- | Liberal           | 82369             | 6461       |
-- | null              | 42874             | 11091      |
-- | Very Liberal      | 32909             | 2277       |
-- | Moderate          | 30297             | 2898       |
-- | Other             | 10074             | 824        |
-- | Apathetic         | 8594              | 805        |
-- | Conservative      | 8180              | 936        |
-- | Libertarian       | 3881              | 325        |
-- | Very Conservative | 1064              | 167        |
-- +-------------------+-------------------+------------+


-- ============================================================================
-- COMPARING INNER JOIN vs LEFT JOIN RESULTS
-- ============================================================================
--
-- +-------------------+---------------------+----------------------+
-- |                   |     INNER JOIN      |      LEFT JOIN       |
-- | PoliticalViews    | likes  | people     | likes  | people      |
-- +-------------------+--------+------------+--------+-------------+
-- | Liberal           | 82,369 | 5,537      | 82,369 | 6,461       | +924 people
-- | null              | 42,874 | 3,967      | 42,874 | 11,091      | +7,124 people!
-- | Very Liberal      | 32,909 | 1,951      | 32,909 | 2,277       | +326 people
-- | Moderate          | 30,297 | 2,435      | 30,297 | 2,898       | +463 people
-- | Other             | 10,074 | 687        | 10,074 | 824         | +137 people
-- | Apathetic         |  8,594 | 680        |  8,594 | 805         | +125 people
-- | Conservative      |  8,180 | 747        |  8,180 | 936         | +189 people
-- | Libertarian       |  3,881 | 284        |  3,881 | 325         | +41 people
-- | Very Conservative |  1,064 | 134        |  1,064 | 167         | +33 people
-- +-------------------+--------+------------+--------+-------------+
--
-- KEY INSIGHTS:
-- 1. The total_music_likes is THE SAME in both queries!
--    (People with no music preferences contribute 0 likes either way)
--
-- 2. The num_people is HIGHER in the LEFT JOIN for every group.
--    These extra people have profiles but NO music preferences.
--
-- 3. The biggest difference is in the NULL political views group:
--    7,124 additional people (11,091 - 3,967) have profiles but no music likes.
--    Many users create profiles but never fill in their music preferences!
--
-- 4. This reveals DATA QUALITY insight: A large portion of users have 
--    incomplete profiles (no political view and/or no music preferences).


-- ============================================================================
-- WHY COUNT(M.Music) INSTEAD OF COUNT(*) FOR LEFT JOIN?
-- ============================================================================
-- 
-- With LEFT JOIN, people without music preferences appear with Music = NULL.
--
-- COUNT(*)       - counts ALL rows, including NULLs (would overcount!)
-- COUNT(M.Music) - counts only non-NULL values (actual music preferences)
--
-- Example: If ProfileID 800001 has no music preferences:
--   - LEFT JOIN creates 1 row: (800001, null, NULL)
--   - COUNT(*) would count this as 1 (wrong - they have 0 music likes!)
--   - COUNT(M.Music) counts this as 0 (correct!)
