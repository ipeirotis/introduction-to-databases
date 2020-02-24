SELECT PoliticalViews, COUNT(*) AS cnt
FROM Profiles 
GROUP BY PoliticalViews;

CREATE TEMPORARY TABLE book_liberals AS 
	SELECT Book, COUNT(P.ProfileID) AS cnt_liberal, COUNT(P.ProfileID)/6461 AS perc_liberal 
	FROM FavoriteBooks B INNER JOIN Profiles P ON P.ProfileID = B.ProfileID
	WHERE P.PoliticalViews = 'Liberal'
	GROUP BY Book
	ORDER BY cnt_liberal DESC;

CREATE TEMPORARY TABLE book_conservatives AS 
	SELECT Book, COUNT(P.ProfileID) AS cnt_conservative, COUNT(P.ProfileID)/936 AS perc_conservative
	FROM FavoriteBooks B INNER JOIN Profiles P ON P.ProfileID = B.ProfileID
	WHERE P.PoliticalViews = 'Conservative'
	GROUP BY Book
	ORDER BY cnt_conservative DESC;

# Conservative	936
# Liberal	6461

SELECT C.Book, L.cnt_liberal, L.perc_liberal, C.cnt_conservative, C.perc_conservative,
			L.perc_liberal / C.perc_conservative AS lift_liberal, 
            C.perc_conservative / L.perc_liberal AS lift_conservatives
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
WHERE C.cnt_conservative>5
ORDER BY lift_conservatives DESC;


SELECT C.Book, L.cnt_liberal, L.perc_liberal, C.cnt_conservative, C.perc_conservative,
			L.perc_liberal / C.perc_conservative AS lift_liberal, 
            C.perc_conservative / L.perc_liberal AS lift_conservatives
FROM book_liberals L INNER JOIN book_conservatives C ON C.Book = L.Book
WHERE C.cnt_conservative>5
ORDER BY lift_conservatives DESC
