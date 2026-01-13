-- ============================================================================
-- LIFT ANALYSIS: Finding Music Preferences of Band Fans
-- ============================================================================
-- 
-- BUSINESS QUESTION: 
-- "What other music do Bon Jovi fans like, and how does that compare to the 
-- general population?"
--
-- This is called "LIFT ANALYSIS" - a technique used in marketing to find 
-- associations between products/preferences. It's the same logic behind 
-- Amazon's "Customers who bought X also bought Y" recommendations.
--
-- WHAT IS LIFT?
-- Lift measures how much MORE likely a group is to like something compared 
-- to the general population.
--   - Lift = 1.0 means the group likes it the same as everyone else
--   - Lift = 2.0 means the group is TWICE as likely to like it
--   - Lift = 0.5 means the group is HALF as likely to like it
--
-- Example: If 10% of ALL users like "AC/DC", but 30% of Bon Jovi fans like 
-- "AC/DC", then lift = 30%/10% = 3.0 (Bon Jovi fans are 3x more likely to 
-- like AC/DC than the average person)
--
-- ============================================================================


-- ============================================================================
-- STEP 1: DECLARE VARIABLES
-- ============================================================================
-- Variables let us store values and reuse them throughout our script.
-- This makes the code easier to modify - just change the variable value once!

DECLARE allmusicfans INT64;          -- Will store: total number of users who like ANY music
DECLARE band STRING DEFAULT 'Bon Jovi';  -- The band we're analyzing (change this to analyze different bands!)
DECLARE bandfans INT64;              -- Will store: number of users who like our target band
DECLARE min_fans INT64 DEFAULT 100;  -- Minimum popularity filter (removes obscure bands from results)


-- ============================================================================
-- STEP 2: COUNT THE TOTAL POPULATION
-- ============================================================================
-- First, we need to know: how many people have expressed ANY music preference?
-- This becomes our "denominator" when calculating percentages for the general population.
--
-- The DISTINCT keyword ensures we count each person only once, even if they 
-- like multiple bands.

SET allmusicfans = (
  SELECT COUNT(DISTINCT ProfileID) 
  FROM `nyu-datasets.facebook.FavoriteMusic`
);
-- After this runs, allmusicfans equals 16422


-- ============================================================================
-- STEP 3: BUILD THE "GENERAL POPULATION" PREFERENCES TABLE
-- ============================================================================
-- This temporary table shows what percentage of ALL music fans like each band.
-- 
-- WHAT IS A SUBQUERY?
-- A subquery is a query nested inside another query. Here, our entire SELECT 
-- statement becomes a subquery because it's used inside "CREATE TABLE AS".
-- The outer command (CREATE TABLE) takes the RESULTS of the inner query 
-- and saves them as a new table.
--
-- TEMPORARY TABLES:
-- A "temp table" only exists for the duration of your session/script.
-- It's like scratch paper - useful for intermediate calculations, but 
-- disappears when you're done.

CREATE OR REPLACE TEMP TABLE MusicPreferences AS
  SELECT 
    Music,                                                    -- The band/artist name
    ROUND(COUNT(DISTINCT ProfileID) / allmusicfans, 4) AS perc,  -- What % of all users like this band?
    COUNT(DISTINCT ProfileID) AS cnt                          -- Raw count of fans
  FROM `nyu-datasets.facebook.FavoriteMusic`
  GROUP BY Music      -- Calculate separate counts for each band
  ORDER BY perc DESC; -- Show most popular bands first

-- Let's check out the output of our temporary table:
SELECT * FROM MusicPreferences;

-- | Music          | perc   | cnt   |
-- |----------------|--------|-------|
-- | Coldplay       | 0.1264 | 2075  |  <-- 12.64% of all users like Coldplay
-- | Radiohead      | 0.1060 | 1741  |
-- | The Beatles    | 0.1042 | 1711  |
-- | ...            | ...    | ...   |


-- ============================================================================
-- STEP 4: COUNT THE TARGET BAND'S FANS
-- ============================================================================
-- Now we need to know: how many people specifically like Bon Jovi?
-- This becomes our denominator when calculating percentages for the fan group.
--
-- This is a SCALAR SUBQUERY - a subquery that returns exactly ONE value.
-- We're looking up the count we already calculated in Step 3.

SET bandfans = (
  SELECT cnt 
  FROM MusicPreferences 
  WHERE Music = band  -- band = 'Bon Jovi' (from our variable)
);
-- After this runs, bandfans equal 227 (for Bon Jovi)


-- ============================================================================
-- STEP 5: BUILD THE "BON JOVI FANS" PREFERENCES TABLE
-- ============================================================================
-- This is where subqueries really shine!
-- We want to know: among people who like Bon Jovi, what ELSE do they like?
--
-- NESTED SUBQUERY EXPLANATION:
-- The WHERE clause contains a subquery that first finds all ProfileIDs of 
-- Bon Jovi fans, then the outer query only looks at those people's preferences.
--
-- Think of it as two steps:
--   1. Inner query: "Give me a list of all Bon Jovi fan IDs"
--   2. Outer query: "Now show me what music those specific people like"

CREATE OR REPLACE TEMP TABLE BandFans AS
  SELECT 
    Music,                                                  -- The band/artist name
    ROUND(COUNT(DISTINCT ProfileID) / bandfans, 4) AS perc, -- What % of BON JOVI FANS like this band?
    COUNT(DISTINCT ProfileID) AS cnt                        -- Raw count
  FROM `nyu-datasets.facebook.FavoriteMusic`
  
  -- *** THIS IS THE KEY SUBQUERY ***
  WHERE ProfileID IN (
    -- This inner query returns a LIST of ProfileIDs
    -- It finds everyone who has 'Bon Jovi' in their favorites
    SELECT ProfileID 
    FROM `nyu-datasets.facebook.FavoriteMusic`
    WHERE Music = band  -- band = 'Bon Jovi'
  )
  -- The outer query then filters to ONLY include rows where 
  -- the ProfileID appears in that list
  GROUP BY Music
  ORDER BY perc DESC;

-- Let's check how the BandFans table looks like
SELECT * FROM BandFans;

-- Example output (only looking at Bon Jovi fans now):
-- | Music          | perc   | cnt  |
-- |----------------|--------|------|
-- | Bon Jovi       | 1.0000 | 227  |  <-- 100% of Bon Jovi fans like Bon Jovi (obviously!)
-- | Billy Joel     | 0.3348 |  76  |  <-- 33.48% of Bon Jovi fans also like Billy Joel
-- | Green Day      | 0.2467 |  56  |  <-- 24.67% of Bon Jovi fans also like Green Day
-- | Coldplay       | 0.2467 |  56  |  <-- 24.67% of Bon Jovi fans also like Coldplay
-- | ...            | ...    | ...  |


-- ============================================================================
-- STEP 6: CALCULATE LIFT 
-- ============================================================================
-- Now we JOIN our two tables to compare:
--   - What % of EVERYONE likes each band (general population)
--   - What % of BON JOVI FANS likes each band (our focus group)
--
-- The LIFT RATIO tells us how much more/less likely Bon Jovi fans are to 
-- like each band compared to the average person.
--
-- To understand LIFT, consider the Green Day and Coldplay from above.
-- 

SELECT 
  T.Music, 
  R.perc AS perc_focus,     -- % of Bon Jovi fans who like this band
  R.cnt AS cnt_focus,       -- # of Bon Jovi fans who like this band
  T.perc AS perc_total,     -- % of ALL users who like this band
  T.cnt AS cnt_total,       -- # of ALL users who like this band
  R.perc / T.perc AS lift_ratio  -- THE KEY METRIC!
FROM BandFans R 
JOIN MusicPreferences T ON R.Music = T.Music
WHERE T.cnt > min_fans  -- Only include bands with enough total fans (reduces noise)
  AND T.Music != band   -- Exclude Bon Jovi itself from results
ORDER BY lift_ratio DESC;

-- Output:
-- +---------------------+------------+-----------+------------+-----------+------------+
-- | Music               | perc_focus | cnt_focus | perc_total | cnt_total | lift_ratio |
-- +---------------------+------------+-----------+------------+-----------+------------+
-- | Aerosmith           | 0.2203     | 50        | 0.0211     | 346       | 10.44      |
-- | Journey             | 0.1410     | 32        | 0.0154     | 253       |  9.16      |
-- | Guns N Roses        | 0.1322     | 30        | 0.0146     | 239       |  9.05      |
-- | Van Halen           | 0.0573     | 13        | 0.0065     | 107       |  8.82      |
-- | Bruce Springsteen   | 0.1101     | 25        | 0.0139     | 228       |  7.92      |
-- | The Ataris          | 0.0529     | 12        | 0.0067     | 110       |  7.90      |
-- | New Found Glory     | 0.0441     | 10        | 0.0062     | 102       |  7.11      |
-- | Josh Groban         | 0.0617     | 14        | 0.0089     | 146       |  6.93      |
-- | Matchbox 20         | 0.0837     | 19        | 0.0122     | 200       |  6.86      |
-- | Goo Goo Dolls       | 0.1278     | 29        | 0.0191     | 313       |  6.69      |
-- +---------------------+------------+-----------+------------+-----------+------------+
--
-- INTERPRETATION:
-- KEY INSIGHT: 22% of Bon Jovi fans like Aerosmith, vs only 2% of all users.
-- That's a lift of 10.44x - strong evidence these fan bases overlap!
-- This makes sense - both are classic rock bands from the same era!
-- Notice how the top results are mostly 80s rock bands (Aerosmith, Journey, 
-- Guns N Roses, Van Halen, Bruce Springsteen) - this reveals the "rock fan cluster."
