USE facebook;

SELECT PoliticalViews, COUNT(*) AS cnt
FROM Profiles 
GROUP BY PoliticalViews;

-- Conservative	936
-- Liberal	6461


-- First the solution with inlined sub-queries

SELECT C.Book, L.cnt_liberal, L.perc_liberal, C.cnt_conservative, C.perc_conservative,
	    L.perc_liberal / C.perc_conservative AS lift_liberal, 
		C.perc_conservative / L.perc_liberal AS lift_conservatives,
	    LOG10(L.perc_liberal / C.perc_conservative) AS logodds_liberal, 
	    LOG10(C.perc_conservative / L.perc_liberal) AS logodds_conservatives
FROM (
	SELECT Book, COUNT(P.ProfileID) AS cnt_liberal, COUNT(P.ProfileID)/6461 AS perc_liberal 
	FROM FavoriteBooks B INNER JOIN Profiles P ON P.ProfileID = B.ProfileID
	WHERE P.PoliticalViews = 'Liberal'
	GROUP BY Book
	ORDER BY cnt_liberal DESC
) L 
INNER JOIN 
(
	SELECT Book, COUNT(P.ProfileID) AS cnt_conservative, COUNT(P.ProfileID)/936 AS perc_conservative
	FROM FavoriteBooks B INNER JOIN Profiles P ON P.ProfileID = B.ProfileID
	WHERE P.PoliticalViews = 'Conservative'
	GROUP BY Book
	ORDER BY cnt_conservative DESC
) C ON C.Book = L.Book
WHERE C.cnt_conservative>5 -- to avoid overly noisy entries
ORDER BY lift_conservatives DESC;


-- We introduce variables to avoid hardcoding
SET @conservatives = (SELECT COUNT(*) AS cnt FROM Profiles WHERE PoliticalViews = 'Conservative');
SET @liberals      = (SELECT COUNT(*) AS cnt FROM Profiles WHERE PoliticalViews = 'Liberal');


-- Using temporary tables for the subqueries
DROP TABLE IF EXISTS book_liberals;
CREATE TEMPORARY TABLE book_liberals AS 
	SELECT Book, COUNT(P.ProfileID) AS cnt_libs, COUNT(P.ProfileID)/@liberals AS perc_libs
	FROM FavoriteBooks B INNER JOIN Profiles P ON P.ProfileID = B.ProfileID
	WHERE P.PoliticalViews = 'Liberal'
	GROUP BY Book
	ORDER BY cnt_libs DESC;

DROP TABLE IF EXISTS book_conservatives;
CREATE TEMPORARY TABLE book_conservatives AS 
	SELECT Book, COUNT(P.ProfileID) AS cnt_cons, COUNT(P.ProfileID)/@conservatives AS perc_cons
	FROM FavoriteBooks B INNER JOIN Profiles P ON P.ProfileID = B.ProfileID
	WHERE P.PoliticalViews = 'Conservative'
	GROUP BY Book
	ORDER BY cnt_cons DESC;



SELECT C.Book
		, L.cnt_libs
        , L.perc_libs
        , C.cnt_cons
        , C.perc_cons
        , L.perc_libs / C.perc_cons AS lift_libs
        , C.perc_cons / L.perc_libs AS lift_cons
        , LOG10(L.perc_libs / C.perc_cons) AS logodds_libs
        , LOG10(C.perc_cons / L.perc_libs) AS logodds_cons
FROM book_liberals L INNER JOIN book_conservatives C ON C.Book = L.Book
WHERE C.cnt_cons>5
ORDER BY lift_cons DESC;

-- INNER JOINs miss books that are liked by only one of the subpopulations
-- We need to create a reference table for all books, and then use LEFT JOINS
-- to add the liberal and conservative counts

SET @all_students = (SELECT COUNT(*) FROM Profiles);

DROP TABLE IF EXISTS book_likes;
CREATE TEMPORARY TABLE book_likes AS 
	SELECT Book, COUNT(ProfileID) AS cnt, COUNT(ProfileID)/@all_students AS perc
	FROM FavoriteBooks 
	GROUP BY Book
	ORDER BY cnt DESC;

SELECT * FROM book_likes;

-- Once we have the full list of likes for all books, we can now
-- perform two LEFT JOINS with liberal and conservative likes
-- and have a list of all books.
-- We can also calculate the "perc_nonlibs" and "perc_noncons"
-- that can be used as a basis for the lift. (As a quick hack,
-- we could also use the "perc" from the overall population,
-- but the number is hugely influenced by the liberal population
-- making the comparisons rather biased.
DROP TABLE IF EXISTS book_comparison;
CREATE TEMPORARY TABLE book_comparison AS 
SELECT B.Book
        , B.cnt
        , 100 * B.perc AS perc
		, COALESCE(L.cnt_libs,0) AS cnt_libs
        , 100 * COALESCE(L.perc_libs,0) AS perc_libs
        , COALESCE(C.cnt_cons,0) AS cnt_cons
        , 100 * COALESCE(C.perc_cons,0) AS perc_cons
        , 100 * (B.cnt - COALESCE(L.cnt_libs,0)) / (@all_students - @liberals)  AS perc_nonlibs
        , 100 * (B.cnt - COALESCE(C.cnt_cons,0)) / (@all_students - @conservatives) AS perc_noncons
FROM 
	book_likes B
	LEFT JOIN book_liberals L  ON B.Book = L.Book
	LEFT JOIN book_conservatives C ON B.Book = C.Book
WHERE B.cnt > 5 -- Only keep books with at least 5 likes overall, to avoid very noisy entries
ORDER BY cnt DESC;


SELECT *, perc_libs/perc_nonlibs AS lift_libs 
FROM book_comparison 
WHERE perc_libs > 0.5
ORDER BY lift_libs DESC;

SELECT *, perc_cons/perc_noncons AS lift_cons
FROM book_comparison 
WHERE perc_cons > 0.5
ORDER BY lift_cons DESC;

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
