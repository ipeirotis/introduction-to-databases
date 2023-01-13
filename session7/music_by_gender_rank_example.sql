DROP VIEW IF EXISTS popular_music;
CREATE VIEW popular_music AS
	SELECT M.Music AS music, COUNT(M.ProfileID) AS cnt    
	FROM FavoriteMusic M 
	GROUP BY M.Music
	ORDER BY cnt DESC;


DROP VIEW IF EXISTS popular_music_by_sex;
CREATE VIEW popular_music_by_sex AS
	SELECT M.Music AS music, P.Sex AS gender, COUNT(P.ProfileID) AS cnt    
	FROM FavoriteMusic M JOIN Profiles P ON P.ProfileID = M.ProfileID
    WHERE P.Sex IS NOT NULL
	GROUP BY M.Music, P.Sex 
	ORDER BY cnt DESC;

DROP VIEW IF EXISTS chart;
CREATE VIEW chart AS 
	SELECT music, gender, cnt,
		RANK() OVER (PARTITION BY gender ORDER BY cnt DESC) AS music_rank 	
	FROM popular_music_by_sex
    ORDER BY music_rank, gender;


    

SELECT S.music, S.cnt, 
		M.cnt AS male_cnt, M.music_rank AS male_rank,
        F.cnt AS female_cnt, F.music_rank AS female_rank
FROM popular_music S 
	LEFT JOIN chart M ON (S.music = M.music AND M.gender='Male')
    LEFT JOIN chart F ON (S.music = F.music AND F.gender='Female');
    


