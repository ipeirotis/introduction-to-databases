-- Orientation vs Preferences (BigQuery version)
-- This script analyzes how stated sexual orientation correlates with the
-- books, music, movies, TV shows, and hobbies that people list in their
-- profiles. It follows the same lift recipe as book_vs_gender.sql and
-- books_and_political_views.sql, but with four groups instead of two.
--
-- Each profile lists a Sex (Profiles.Sex) and who they are interested in
-- (Orientation.InterestedIn: 'Men', 'Women', or 'Men & Women'). Combining
-- the two gives four groups:
--
--   MF = men interested in women only
--   FM = women interested in men only
--   MM = men interested in men (including 'Men & Women')
--   FF = women interested in women (including 'Men & Women')
--
-- Profiles that leave Sex blank are left out.
--
-- Why compare within the same sex? Comparing MM against everyone else mostly
-- rediscovers gender differences (e.g., "men like Scarface more than women").
-- Comparing MM against MF, and FF against FM, holds gender fixed so the lift
-- reflects orientation.

DECLARE n_mm INT64;
DECLARE n_mf INT64;
DECLARE n_ff INT64;
DECLARE n_fm INT64;


-- Step 1: Label each profile with its group.
-- Orientation has exactly one row per ProfileID, so a plain JOIN works.
-- The CASE returns NULL when Sex is blank. We can't filter
-- on the alias `grp` in the same SELECT, so we wrap it in a derived table
-- and filter outside.
CREATE TEMP TABLE profile_groups AS
  SELECT *
  FROM (
    SELECT
      P.ProfileID,
      CASE
        WHEN P.Sex = 'Male'   AND O.InterestedIn = 'Women'                 THEN 'MF'
        WHEN P.Sex = 'Male'   AND O.InterestedIn IN ('Men', 'Men & Women')   THEN 'MM'
        WHEN P.Sex = 'Female' AND O.InterestedIn = 'Men'                   THEN 'FM'
        WHEN P.Sex = 'Female' AND O.InterestedIn IN ('Women', 'Men & Women') THEN 'FF'
      END AS grp
    FROM `nyu-datasets.facebook.Profiles` P
      JOIN `nyu-datasets.facebook.Orientation` O ON O.ProfileID = P.ProfileID
  )
  WHERE grp IS NOT NULL;

SET n_mm = (SELECT COUNT(*) FROM profile_groups WHERE grp = 'MM');
SET n_mf = (SELECT COUNT(*) FROM profile_groups WHERE grp = 'MF');
SET n_ff = (SELECT COUNT(*) FROM profile_groups WHERE grp = 'FF');
SET n_fm = (SELECT COUNT(*) FROM profile_groups WHERE grp = 'FM');

-- Expect: MF 5,320 | FM 7,053 | MM 719 | FF 593
-- MM and FF are small groups (12% of men, 8% of women), so we require a
-- minimum count per item in the lift queries below.
SELECT n_mf, n_fm, n_mm, n_ff;


-- Step 2: Stack all the "favorites" tables into one long table.
-- UNION ALL lets us run a single analysis across books, music, movies, etc.
-- The `kind` column remembers where each row came from.
CREATE TEMP TABLE favorites AS
  SELECT ProfileID, 'book' AS kind, Book AS item FROM `nyu-datasets.facebook.FavoriteBooks`
  UNION ALL
  SELECT ProfileID, 'music', Music FROM `nyu-datasets.facebook.FavoriteMusic`
  UNION ALL
  SELECT ProfileID, 'movie', Movie FROM `nyu-datasets.facebook.FavoriteMovies`
  UNION ALL
  SELECT ProfileID, 'tv', TVShow FROM `nyu-datasets.facebook.FavoriteTVShows`
  UNION ALL
  SELECT ProfileID, 'hobby', Hobby FROM `nyu-datasets.facebook.Hobbies`;


-- Step 3: Count each item once per group, in a single pass.
-- In book_vs_gender.sql we built one temp table per group (book_men,
-- book_women) and joined them. With four groups that gets long. Instead,
-- COUNTIF splits the count by group inside one GROUP BY.
CREATE TEMP TABLE item_counts AS
  SELECT
    F.kind,
    F.item,
    COUNTIF(G.grp = 'MM') AS cnt_mm,
    COUNTIF(G.grp = 'MF') AS cnt_mf,
    COUNTIF(G.grp = 'FF') AS cnt_ff,
    COUNTIF(G.grp = 'FM') AS cnt_fm
  FROM favorites F
    JOIN profile_groups G ON G.ProfileID = F.ProfileID
  GROUP BY F.kind, F.item;


-- Step 4: Lift for men interested in men vs. men interested in women.
-- Same smoothing as book_vs_gender.sql: +0.5 in the numerator, +1 in the
-- denominator, so we never divide by zero.
-- We require at least 15 MM profiles per item, so a single person's taste
-- can't produce a large lift on its own.
SELECT
  kind,
  item,
  cnt_mm,
  cnt_mf,
  ROUND(100 * cnt_mm / n_mm, 1) AS pct_mm,
  ROUND(100 * cnt_mf / n_mf, 1) AS pct_mf,
  ROUND(((cnt_mm + 0.5) / (n_mm + 1)) / ((cnt_mf + 0.5) / (n_mf + 1)), 1) AS lift_mm_vs_mf
FROM item_counts
WHERE cnt_mm >= 15
ORDER BY lift_mm_vs_mf DESC
LIMIT 25;


-- Step 5: The other direction: what do MM profiles list much LESS often?
-- Here we require the item to be common among MF (at least 150 profiles),
-- so the low lift is not just a rare item.
SELECT
  kind,
  item,
  cnt_mm,
  cnt_mf,
  ROUND(100 * cnt_mm / n_mm, 1) AS pct_mm,
  ROUND(100 * cnt_mf / n_mf, 1) AS pct_mf,
  ROUND(((cnt_mm + 0.5) / (n_mm + 1)) / ((cnt_mf + 0.5) / (n_mf + 1)), 2) AS lift_mm_vs_mf
FROM item_counts
WHERE cnt_mf >= 150
ORDER BY lift_mm_vs_mf ASC
LIMIT 15;


-- Step 6: Lift for women interested in women vs. women interested in men only.
-- Same minimum of 15 profiles as for men.
SELECT
  kind,
  item,
  cnt_ff,
  cnt_fm,
  ROUND(100 * cnt_ff / n_ff, 1) AS pct_ff,
  ROUND(100 * cnt_fm / n_fm, 1) AS pct_fm,
  ROUND(((cnt_ff + 0.5) / (n_ff + 1)) / ((cnt_fm + 0.5) / (n_fm + 1)), 1) AS lift_ff_vs_fm
FROM item_counts
WHERE cnt_ff >= 15
ORDER BY lift_ff_vs_fm DESC
LIMIT 15;


-- Step 7: Profile fields, not just favorites.
-- Political views and LookingFor by group, as the percentage of each group.
-- Reading across a row compares the groups.
SELECT
  'politics' AS field,
  COALESCE(P.PoliticalViews, '(blank)') AS value,
  ROUND(100 * COUNTIF(G.grp = 'MM') / n_mm, 1) AS pct_mm,
  ROUND(100 * COUNTIF(G.grp = 'MF') / n_mf, 1) AS pct_mf,
  ROUND(100 * COUNTIF(G.grp = 'FF') / n_ff, 1) AS pct_ff,
  ROUND(100 * COUNTIF(G.grp = 'FM') / n_fm, 1) AS pct_fm
FROM profile_groups G
  JOIN `nyu-datasets.facebook.Profiles` P ON P.ProfileID = G.ProfileID
GROUP BY value
UNION ALL
SELECT
  'looking for',
  L.LookingFor,
  ROUND(100 * COUNTIF(G.grp = 'MM') / n_mm, 1),
  ROUND(100 * COUNTIF(G.grp = 'MF') / n_mf, 1),
  ROUND(100 * COUNTIF(G.grp = 'FF') / n_ff, 1),
  ROUND(100 * COUNTIF(G.grp = 'FM') / n_fm, 1)
FROM profile_groups G
  JOIN `nyu-datasets.facebook.LookingFor` L ON L.ProfileID = G.ProfileID
GROUP BY L.LookingFor
ORDER BY field, value;
