BEGIN

-- We introduce variables at the start, which is required by BigQuery.
-- We also use the fully-qualified table names.
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

-- This is our master table. Contains the total likes for each book.
-- It also contains the "percentage," which normalizes the number of likes
-- with the population that is available to like a book
CREATE TEMP TABLE book_likes AS 
SELECT 
  Book, 
  COUNT(ProfileID) AS cnt, 
  COUNT(ProfileID) / all_students AS perc
FROM `nyu-datasets.facebook.FavoriteBooks` 
GROUP BY Book;


-- We now introduce the table that stores the likes for the liberal population,
-- together with the normalized percentage, after dividing by the number of
-- liberal students
CREATE TEMP TABLE book_liberals AS 
SELECT 
  Book, 
  COUNT(P.ProfileID) AS cnt_libs, 
  COUNT(P.ProfileID) / liberals AS perc_libs
FROM `nyu-datasets.facebook.FavoriteBooks` B
INNER JOIN `nyu-datasets.facebook.Profiles` P ON P.ProfileID = B.ProfileID
WHERE P.PoliticalViews = 'Liberal'
GROUP BY Book;


-- And same for the conservatives
CREATE TEMP TABLE book_conservatives AS 
SELECT 
  Book, 
  COUNT(P.ProfileID) AS cnt_cons, 
  COUNT(P.ProfileID) / conservatives AS perc_cons
FROM `nyu-datasets.facebook.FavoriteBooks` B
INNER JOIN `nyu-datasets.facebook.Profiles` P ON P.ProfileID = B.ProfileID
WHERE P.PoliticalViews = 'Conservative'
GROUP BY Book;


-- Once we have the full list of likes for all books, we can now
-- perform two LEFT JOINS with liberal and conservative likes
-- and have a list of all books. 
--
-- Notice also the COALESCE function, which is identical in BigQuery.
--
-- Finally, notice the calculation of "perc_nonlibs" and "perc_noncons"
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
  B.cnt > 5; -- Only keep books with at least 5 likes overall


CREATE TEMP TABLE book_scores AS
SELECT 
  *, 
  perc_libs / perc_nonlibs AS lift_libs, 
  LOG10(perc_libs / perc_nonlibs + 0.001) AS logodds_libs, 
  perc_cons / perc_noncons AS lift_cons, 
  -- This calculation from the original script is kept as-is
  LOG10(perc_cons / perc_nonlibs + 0.001) AS logodds_cons
FROM book_comparison;

-- This SELECT statement will output the results of the book_scores table
SELECT * FROM book_scores;

-- Now that we have the scores for each book, we can try to score individuals
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

-- Classification Statistics
-- This final SELECT statement will output the classification statistics
SELECT 
  PoliticalViews, 
  Estimate, 
  COUNT(*)
FROM user_scores
GROUP BY 
  PoliticalViews, 
  Estimate
ORDER BY 
  PoliticalViews, 
  Estimate;

END
