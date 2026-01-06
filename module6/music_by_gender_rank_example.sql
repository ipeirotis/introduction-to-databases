USE facebook;

# We create first a table of popular music across everyone
# For efficiency we only keep music liked by more than 10 people
DROP TEMPORARY TABLE IF EXISTS popular_music;
CREATE TEMPORARY TABLE popular_music AS
	SELECT M.Music AS music, COUNT(M.ProfileID) AS cnt    
	FROM FavoriteMusic M 
	GROUP BY M.Music
    HAVING cnt > 10
	ORDER BY cnt DESC;


# We now calculate popularity of each music broken down by sex
DROP TEMPORARY TABLE IF EXISTS popular_music_by_sex;
CREATE TEMPORARY TABLE popular_music_by_sex AS
	SELECT M.Music AS music, P.Sex AS gender, COUNT(P.ProfileID) AS cnt    
	FROM FavoriteMusic M JOIN Profiles P ON P.ProfileID = M.ProfileID
	WHERE P.Sex IS NOT NULL
	GROUP BY M.Music, P.Sex 
	ORDER BY cnt DESC;

# We will now create two tables with music rank, one per gender
# In principle, we could also do a window OVER (PARTITION BY gender ORDER BY cnt DESC)
# However, MySQL has a bug that does not allow temporary tables to 
# join with itself, so we end up creating one temp table for males and another for females
DROP TEMPORARY TABLE IF EXISTS chart_male;
CREATE TEMPORARY TABLE chart_male AS 
	SELECT music, cnt,
		RANK() OVER (ORDER BY cnt DESC) AS music_rank 	
	FROM popular_music_by_sex
    WHERE gender = 'Male' 
	ORDER BY music_rank;

DROP TEMPORARY TABLE IF EXISTS chart_female;
CREATE TEMPORARY TABLE chart_female AS 
	SELECT music, cnt,
		RANK() OVER (ORDER BY cnt DESC) AS music_rank 	
	FROM popular_music_by_sex
    WHERE gender = 'Female'
	ORDER BY music_rank;

# Finally we bring everything together.
# Note that we start with popular_music as a reference table
# and we left join the other two tables, as there is no guarantee
# that we will encounter a music in both males and females tables
# To estimate the difference between males and females we take the
# log of the rank, and then the difference; the reason we do that 
# is because a difference of 5 between No1 and No6 is very different
# than a difference of 5 between No605 and No610. With LOG we kind
# of estimate difference in "orders of magnitude"
SELECT S.music, S.cnt, 
	M.cnt AS male_cnt, M.music_rank AS male_rank,
	F.cnt AS female_cnt, F.music_rank AS female_rank,
    ROUND(-LOG(F.music_rank / M.music_rank),2) AS diff_females
FROM popular_music S 
	LEFT JOIN chart_female M ON (S.music = M.music)
	LEFT JOIN chart_male F ON (S.music = F.music)
ORDER BY diff_females DESC;
