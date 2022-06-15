USE facebook;

-- We introduce variables to avoid hardcoding
SET @all_students = (SELECT COUNT(*) FROM Profiles);

-- This is our master table. Contains the total likes for each book.
-- It also contains the "percentage" which normalizes the number of likes
-- with the population that is available to like a book
DROP TABLE IF EXISTS book_likes;
CREATE TEMPORARY TABLE book_likes AS 
	SELECT Book, COUNT(ProfileID) AS cnt, COUNT(ProfileID)/@all_students AS perc
	FROM FavoriteBooks 
	GROUP BY Book
	ORDER BY cnt DESC;



-- We now introduce the table that stores the likes for the liberal population,
-- together with the normalized percentage, after dividing with the number of
-- liberal students
SET @liberals      = (SELECT COUNT(*) AS cnt FROM Profiles WHERE PoliticalViews = 'Liberal');

DROP TABLE IF EXISTS book_liberals;
CREATE TEMPORARY TABLE book_liberals AS 
	SELECT Book, COUNT(P.ProfileID) AS cnt_libs, COUNT(P.ProfileID)/@liberals AS perc_libs
	FROM FavoriteBooks B INNER JOIN Profiles P ON P.ProfileID = B.ProfileID
	WHERE P.PoliticalViews = 'Liberal'
	GROUP BY Book
	ORDER BY cnt_libs DESC;


-- And same for the conservatives
SET @conservatives = (SELECT COUNT(*) AS cnt FROM Profiles WHERE PoliticalViews = 'Conservative');

DROP TABLE IF EXISTS book_conservatives;
CREATE TEMPORARY TABLE book_conservatives AS 
	SELECT Book, COUNT(P.ProfileID) AS cnt_cons, COUNT(P.ProfileID)/@conservatives AS perc_cons
	FROM FavoriteBooks B INNER JOIN Profiles P ON P.ProfileID = B.ProfileID
	WHERE P.PoliticalViews = 'Conservative'
	GROUP BY Book
	ORDER BY cnt_cons DESC;


-- Once we have the full list of likes for all books, we can now
-- perform two LEFT JOINS with liberal and conservative likes
-- and have a list of all books. Notice what would have happened
-- if we had used an INNER JOIN instead (we would have missed 
-- books without likes in the liberal or in the conservative 
-- population)
--
-- Notice also the use of the COALESCE function, which checks
-- if an attribute is NULL; if yes, replaces it with the second
-- argument. In our case, we replace NULLs with 0, as these are the
-- "zero likes" books.
--
-- Finally, notice the calculation of "perc_nonlibs" and "perc_noncons"
-- that is done in a way to remove the "liberals" and "conservatives"
DROP TABLE IF EXISTS book_comparison;
CREATE TEMPORARY TABLE book_comparison AS 
SELECT B.Book
        , B.cnt
        , B.perc AS perc
		, COALESCE(L.cnt_libs,0) AS cnt_libs
        , COALESCE(L.perc_libs,0) AS perc_libs
        , COALESCE(C.cnt_cons,0) AS cnt_cons
        , COALESCE(C.perc_cons,0) AS perc_cons
        , (B.cnt - COALESCE(L.cnt_libs,0)) / (@all_students - @liberals)  AS perc_nonlibs
        , (B.cnt - COALESCE(C.cnt_cons,0)) / (@all_students - @conservatives) AS perc_noncons
FROM 
	book_likes B
	LEFT JOIN book_liberals L  ON B.Book = L.Book
	LEFT JOIN book_conservatives C ON B.Book = C.Book
WHERE B.cnt > 5 -- Only keep books with at least 5 likes overall, to avoid very noisy entries
ORDER BY cnt DESC;



DROP TABLE IF EXISTS book_scores;
CREATE TEMPORARY TABLE book_scores AS
	SELECT *
		, perc_libs/perc_nonlibs AS lift_libs
		, LOG10(perc_libs/perc_nonlibs + 0.001) AS logodds_libs
		, perc_cons/perc_noncons AS lift_cons
		, LOG10(perc_cons/perc_nonlibs + 0.001) AS logodds_cons
	FROM book_comparison;
    
SELECT * FROM book_scores;

-- Now that we have the scores for each book, we can try to score individuals
DROP TABLE IF EXISTS user_scores;
CREATE TEMPORARY TABLE user_scores  AS 
SELECT P.ProfileID, P.PoliticalViews
	, AVG(logodds_libs) AS avg_lib
	, AVG(logodds_cons) AS avg_cons
	, COUNT(*) AS cnt_books
    , CASE WHEN AVG(logodds_libs) > AVG(logodds_cons)  THEN "Liberal" ELSE "Conservative" END AS Estimate
FROM 
	Profiles P 
	JOIN FavoriteBooks B ON P.ProfileID = B.ProfileID
    JOIN book_scores S ON B.Book = S.Book
GROUP BY ProfileID, P.PoliticalViews
ORDER BY ProfileID;

-- Classification Statistics
SELECT PoliticalViews, Estimate, COUNT(*)
FROM user_scores
GROUP BY PoliticalViews, Estimate
ORDER BY PoliticalViews, Estimate;

--
-- 		            Classified		
-- 		            Cons	Libs	
-- Correct	Cons	360	166	    526
-- 	        Libs	455	3829	4284
-- 				
-- 		    Cons	    Libs	
-- 	Cons	0.684410646	0.315589354	
-- 	Libs	0.10620915	0.89379085
