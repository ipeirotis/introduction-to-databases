USE facebook;

# Store the number of people that have liked (any) music
SET @allmusicfans = (SELECT COUNT(DISTINCT ProfileID) FROM FavoriteMusic);

# Set the band that we are analyzing
SET @band =  'Jay Z';

# Store the number of people that like the specific band
SET @bandfans = (SELECT COUNT(DISTINCT ProfileID) FROM FavoriteMusic WHERE Music = @band);

# Create a table/view that stores the preferences across all the population
# We store the band and the percentage of people that liked it
DROP TABLE IF EXISTS MusicPreferences;
CREATE TEMPORARY TABLE MusicPreferences AS
	SELECT Music, ROUND(COUNT(*)/@allmusicfans,4) AS perc, COUNT(*) AS cnt
	FROM FavoriteMusic
	GROUP BY Music
	ORDER BY perc DESC;

# Create a table with the percentages across only people that like the band 
# that we specified in the variable @band
DROP TABLE IF EXISTS BandFans;
CREATE TEMPORARY TABLE BandFans AS
	SELECT Music, ROUND(COUNT(*)/@bandfans,4) AS perc, COUNT(*) AS cnt
	FROM FavoriteMusic
	WHERE ProfileID  IN (
		SELECT ProfileID 
		FROM FavoriteMusic
		WHERE Music = @band
	)
	GROUP BY Music
	ORDER BY perc DESC;

# Join the two tables above to compare the percentages of likes 
# in the overall population (T.perc) vs the percentage of likes
# across the population of people that like the @band (R.perc)
# We calculate the lift by dividing the two percentages
# To avoid noise, we keep only bands that have at least 1% likes 
# in the overall population.
SELECT R.Music, 
		R.perc AS perc_focus, R.cnt AS cnt_focus, 
        T.perc AS perc_total, T.cnt AS cnt_total,
        R.perc/T.perc AS lift_ratio
FROM BandFans R INNER JOIN MusicPreferences T ON R.Music = T.Music
WHERE T.perc>0.01 AND R.Music != @band
ORDER BY lift_ratio DESC

