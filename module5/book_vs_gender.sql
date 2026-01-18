-- Book vs Gender Analysis (BigQuery version)
-- This script analyzes the correlation between gender and book preferences

-- Declare variables for population counts
DECLARE males INT64;
DECLARE females INT64;
DECLARE everyone INT64;


-- Main analysis using variables and temporary tables

-- Instead of counting all users, let's focus only on users
-- that have listed books they like in their profiles

-- Set variable values
SET males = (
  SELECT COUNT(DISTINCT B.ProfileID) 
  FROM `nyu-datasets.facebook.FavoriteBooks` B 
  JOIN `nyu-datasets.facebook.Profiles` P ON P.ProfileID = B.ProfileID 
  WHERE P.Sex = 'Male'
);

SET females = (
  SELECT COUNT(DISTINCT B.ProfileID) 
  FROM `nyu-datasets.facebook.FavoriteBooks` B 
  JOIN `nyu-datasets.facebook.Profiles` P ON P.ProfileID = B.ProfileID 
  WHERE P.Sex = 'Female'
);

SET everyone = (
  SELECT COUNT(DISTINCT B.ProfileID) 
  FROM `nyu-datasets.facebook.FavoriteBooks` B 
);


-- We will only consider books that are liked by a reasonable number
-- of users. We will put the threshold at 10.
-- We divide by the total number of people that like books
CREATE TEMP TABLE popular_books AS 
  SELECT 
    Book, 
    COUNT(*) AS cnt, 
    COUNT(*) / everyone AS perc
  FROM `nyu-datasets.facebook.FavoriteBooks` B 
  JOIN `nyu-datasets.facebook.Profiles` P ON P.ProfileID = B.ProfileID
  GROUP BY Book
  HAVING cnt >= 10
  ORDER BY cnt DESC;

SELECT * FROM popular_books;


-- Calculate the number of men that like each of the popular books
-- 
-- *** There are a lot of nuanced things in this join. ***
--
-- a. Notice that we have the condition P.Sex = 'Male' in the JOIN condition
--    If we put the condition in the WHERE clause, the WHERE clause is 
--    executed after the LEFT JOIN, and eliminates all the non-matched Books
--
-- b. Notice that we do a COUNT of the P.ProfileID. If we do a count of B.ProfileID
--    the results will be completely different (and wrong). That may seem as a 
--    headscratcher, but you need to remember the behavior of LEFT JOINS for 
--    unmatched rows. Try executing the LEFT JOIN without the GROUP BY / aggregations
--    to understand what is going on before the GROUP BY aggregation. Select both
--    the B.ProfileID and the P.ProfileID, which superficially seem to be the same
--    as we have the equality condition P.ProfileID = B.ProfileID in the JOIN clause
--
-- c. We use a bit of "smoothing" and add 0.5 to the numerator and 1 to the denominator
--    when we calculate the percentage. That is to avoid zeros, as we
--    will be dividing with perc_men and perc_women in the final query
--
CREATE TEMP TABLE book_men AS 
  SELECT 
    B.Book, 
    COUNT(DISTINCT P.ProfileID) AS cnt_men, 
    (COUNT(DISTINCT P.ProfileID) + 0.5) / (males + 1) AS perc_men
  FROM popular_books B
    LEFT JOIN `nyu-datasets.facebook.FavoriteBooks` F ON B.Book = F.Book
    LEFT JOIN `nyu-datasets.facebook.Profiles` P ON P.ProfileID = F.ProfileID AND P.Sex = 'Male'
  GROUP BY B.Book
  ORDER BY perc_men DESC;


-- Repeat the process for women. Same nuances apply here as in the join just above.
CREATE TEMP TABLE book_women AS 
  SELECT 
    B.Book, 
    COUNT(DISTINCT P.ProfileID) AS cnt_women, 
    (COUNT(DISTINCT P.ProfileID) + 0.5) / (females + 1) AS perc_women
  FROM popular_books B
    LEFT JOIN `nyu-datasets.facebook.FavoriteBooks` F ON B.Book = F.Book
    LEFT JOIN `nyu-datasets.facebook.Profiles` P ON P.ProfileID = F.ProfileID AND P.Sex = 'Female'
  GROUP BY B.Book
  ORDER BY perc_women DESC;


-- Join the tables and calculate the "lift"
-- The lift is defined as the "probability of seeing something in one population" 
-- divided by the "probability of seeing something in a contrasting population".
-- In this case, we compare percentages (~probabilities) in the populations of men vs women
--
-- Notice here that we calculate the lift by dividing with perc_men (or perc_women)
-- hence the need to have a non-zero value for perc_men when creating the book_men table.
-- 
-- We could have done it with women vs the overall population as well, but the "overall" 
-- population includes women as well, so the contrast is not great.
-- 
-- Alternatively, we could have done women vs rest; and men vs rest. We leave that 
-- calculation as an exercise for the interested reader.
SELECT 
  B.Book, 
  B.cnt, 
  B.perc, 
  M.cnt_men, 
  M.perc_men, 
  F.cnt_women, 
  F.perc_women, 
  perc_men / perc_women AS lift_men_vs_women, 
  perc_women / perc_men AS lift_women_vs_men
FROM popular_books B
  LEFT JOIN book_men M ON M.Book = B.Book 
  LEFT JOIN book_women F ON F.Book = B.Book 
ORDER BY lift_women_vs_men DESC, cnt_women DESC;
