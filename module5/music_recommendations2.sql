# We use this number to go from raw number of likes to _percentage_ of people that like a band
SET @allfans = (SELECT COUNT(DISTINCT ProfileID) FROM FavoriteMusic);

 # We will not consider bands with less than 100 fans
SET @min_fans = 40;

WITH

# Calculate number of people that line a band
# To avoid noise, we keep only bands with more than @min_fans
MusicPreferences AS ( 
	SELECT Music, COUNT(ProfileID) AS cnt, COUNT(ProfileID)/@allfans AS perc
	FROM FavoriteMusic
	GROUP BY Music
  HAVING cnt >= @min_fans 
), 

# For all pairs of bands, calculate number of people that like both bands
# The M1.Music<M2.Music condition allows to avoid listing the same band twice,
# and also avoids listing duplicate pairs like <Radiohead, Coldplay> and <Coldplay, Radiohead>
CommonFans AS ( 
	SELECT M1.Music AS Music1, M2.music AS Music2, COUNT(*) AS common_fans
	FROM FavoriteMusic M1 
		JOIN FavoriteMusic M2 ON M1.ProfileID = M2.ProfileID AND M1.Music<M2.Music
	GROUP BY M1.Music, M2.Music
), 

# Put together data about common fans, and overall fans for each band, 
# calculate percentages of fans of band1 that like band2, and vice versa
JoinedTogether AS ( 
                    
SELECT M1.Music AS Music1, M1.cnt AS cnt1_overall, M1.perc AS perc_fans1_overall,
       M2.Music AS Music2, M2.cnt AS cnt2_overall, M2.perc AS perc_fans2_overall,
       C.common_fans, 
       C.common_fans/M1.cnt AS perc_fans2_among_fans1, 
       C.common_fans/M2.cnt AS perc_fans1_among_fans2
FROM CommonFans C 
  JOIN MusicPreferences M1 ON M1.Music = C.Music1
	JOIN MusicPreferences M2 ON M2.Music = C.Music2
) 

# We calculate lifts separately, mainly for readability. 
# We could have easily done that in the JoinedTogether
# We put the highest lift numbers on top.
SELECT *
    , perc_fans1_among_fans2 / perc_fans1_overall AS lift_among_fans2
    , perc_fans2_among_fans1 / perc_fans2_overall AS lift_among_fans1
FROM JoinedTogether
ORDER BY lift_among_fans2 + lift_among_fans1 DESC;
