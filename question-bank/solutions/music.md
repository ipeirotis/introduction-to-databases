# music — validated solutions

31 questions, each solved and verified against `nyu-datasets.music` on BigQuery.

## Setup & basics

### Type the SQL command used to show all the tables that appear in the Music database.

_used in 14 semester(s) · ✓ verified (5 rows)_

```sql
SELECT table_name
FROM `nyu-datasets.music.INFORMATION_SCHEMA.TABLES`
ORDER BY table_name
```

**Hint:** BigQuery lists a dataset's tables through the INFORMATION_SCHEMA.TABLES view: SELECT table_name FROM `project.dataset.INFORMATION_SCHEMA.TABLES`.

### Using the DESCRIBE command, show the attributes of each table. Show the commands used to retrieve the information from each table.

_used in 14 semester(s) · ✓ verified (19 rows)_

```sql
SELECT table_name, column_name, data_type
FROM `nyu-datasets.music.INFORMATION_SCHEMA.COLUMNS`
ORDER BY table_name, ordinal_position
```

**Hint:** BigQuery has no DESCRIBE statement; the equivalent is the INFORMATION_SCHEMA.COLUMNS view, which lists each table's columns and their data types. Filter by table_name (or query per table) to mimic running DESCRIBE on each one.

## Selection

### Show all the albums.

_used in 20 semester(s) · ✓ verified (13 rows)_

```sql
SELECT * FROM `nyu-datasets.music.album`
```

**Hint:** Basic SELECT * with no filter — just read every row of the album table.

### Show all the tracks.

_used in 20 semester(s) · ✓ verified (153 rows)_

```sql
SELECT * FROM `nyu-datasets.music.track`
```

**Hint:** Basic SELECT * with no filter — read every row of the track table.

### List all the names of the artists, without the artist ids, sorted alphabetically.

_used in 20 semester(s) · ✓ verified (6 rows)_

```sql
SELECT artist_name FROM `nyu-datasets.music.artist` ORDER BY artist_name
```

**Hint:** Project a single column and add ORDER BY to sort alphabetically; omit artist_id.

### Show all the album names and the corresponding artist id, but do not show the album\_id. Rename the album\_name attribute to album\_title.

_used in 20 semester(s) · ✓ verified (13 rows)_

```sql
SELECT album_name AS album_title, artist_id FROM `nyu-datasets.music.album`
```

**Hint:** Choose only the two needed columns and use AS to rename album_name to album_title.

### List the ten shortest tracks in terms of playing time.

_used in 20 semester(s) · ✓ verified (10 rows)_

```sql
SELECT track_name, time FROM `nyu-datasets.music.track` ORDER BY time ASC LIMIT 10
```

**Hint:** ORDER BY the duration column ascending, then LIMIT 10 to take the shortest.

### Show all the artists.

_used in 19 semester(s) · ✓ verified (6 rows)_

```sql
SELECT artist_id, artist_name
FROM `nyu-datasets.music.artist`
```

**Hint:** Plain SELECT of all rows from the artist table.

### Show all the artists.

1.  Show all the albums.
2.  Show all the tracks.
3.  List all the names of the artists, without the artist ids, sorted alphabetically.
4.  Show all the album names and the corresponding artist id, but do not show the album\_id. Rename the album\_name attribute to album\_title.
5.  List the ten shortest tracks in terms of playing time.

_used in 1 semester(s) · ✓ verified (6 rows)_

```sql
SELECT * FROM `nyu-datasets.music.artist`
```

**Hint:** Plain SELECT-FROM selection practice: project columns, use column aliases (AS) to rename, ORDER BY for sorting, and LIMIT to take the N shortest. One simple query per part.

## Filtering

### Show the entry for the artist with id equal to 5.

_used in 19 semester(s) · ✓ verified (1 rows)_

```sql
SELECT artist_id, artist_name
FROM `nyu-datasets.music.artist`
WHERE artist_id = 5
```

**Hint:** Filter the artist table with WHERE artist_id = 5.

### Show the entry for the artist named The Rolling Stones.

_used in 19 semester(s) · ✓ verified (1 rows)_

```sql
SELECT artist_id, artist_name
FROM `nyu-datasets.music.artist`
WHERE artist_name = 'The Rolling Stones'
```

**Hint:** Filter the artist table on the string column with WHERE artist_name = 'The Rolling Stones' (exact match).

### Find the tracks for the artist with id 3, from the _artist's_ album with id 2.

_used in 19 semester(s) · ✓ verified (2 rows)_

```sql
SELECT track_id, track_name
FROM `nyu-datasets.music.track`
WHERE artist_id = 3
  AND album_id = 2
```

**Hint:** Filter the track table with two ANDed conditions: artist_id = 3 AND album_id = 2. The track table already carries both columns, so no join is needed.

### Find the tracks with names that are earlier alphabetically than (is less than) M. Note that inequality queries can be used with text and not only with numbers.

_used in 19 semester(s) · ✓ verified (82 rows)_

```sql
SELECT track_id, track_name
FROM `nyu-datasets.music.track`
WHERE track_name < 'M'
ORDER BY track_name
```

**Hint:** String inequality in WHERE: track_name < 'M' keeps names that sort alphabetically before M. Comparison operators work on text, not just numbers.

### List all the tracts for the artists with ids 1, 3, and 5. Show two variations of the query:  one using the OR Boolean condition and one using the IN operation.

_used in 19 semester(s) · ✓ verified (112 rows)_

```sql
-- Variation 1: using IN
SELECT track_id, artist_id, album_id, track_name
FROM `nyu-datasets.music.track`
WHERE artist_id IN (1, 3, 5)
ORDER BY artist_id, track_id;

-- Variation 2: using OR
-- SELECT track_id, artist_id, album_id, track_name
-- FROM `nyu-datasets.music.track`
-- WHERE artist_id = 1 OR artist_id = 3 OR artist_id = 5
-- ORDER BY artist_id, track_id;
```

**Hint:** Two equivalent ways to filter on a set of values: WHERE artist_id IN (1,3,5) is shorthand for WHERE artist_id = 1 OR artist_id = 3 OR artist_id = 5. Both return identical rows.

### Find all the tracks that include the word "Love" anywhere in the title. It is fine to include tracks where love is part of a bigger word (e.g., lovebird).

_used in 19 semester(s) · ✓ verified (11 rows)_

```sql
SELECT track_id, artist_id, album_id, track_name
FROM `nyu-datasets.music.track`
WHERE LOWER(track_name) LIKE '%love%'
ORDER BY track_id
```

**Hint:** Substring search with LIKE and the % wildcard on both sides ('%love%') matches the word anywhere in the title. Wrap the column in LOWER() (or use a case-insensitive match) so 'Love', 'LOVE', and 'love' all match.

### Using the id of Rolling Stones from Question 2, list all the albums of The Rolling Stones.

_used in 5 semester(s) · ✓ verified (1 rows)_

```sql
SELECT a.album_id, a.album_name
FROM `nyu-datasets.music.album` a
WHERE a.artist_id = 4
ORDER BY a.album_name
```

**Hint:** Filter album by the artist_id you found for The Rolling Stones (WHERE artist_id = <id>). You can hard-code the id from Question 2 or replace it with a subquery selecting artist_id from artist WHERE artist_name = 'The Rolling Stones'.

## Joins

### List all the album names by the band `New Order`

_used in 20 semester(s) · ✓ verified (7 rows)_

```sql
SELECT al.album_name FROM `nyu-datasets.music.album` AS al JOIN `nyu-datasets.music.artist` AS ar ON al.artist_id = ar.artist_id WHERE ar.artist_name = 'New Order'
```

**Hint:** JOIN album to artist on artist_id, then filter on the artist name in WHERE.

### List the tracks for the album `Second Coming`

_used in 20 semester(s) · ✓ verified (13 rows)_

```sql
SELECT t.track_name FROM `nyu-datasets.music.track` AS t JOIN `nyu-datasets.music.album` AS al ON t.artist_id = al.artist_id AND t.album_id = al.album_id WHERE al.album_name = 'Second Coming'
```

**Hint:** Multi-column JOIN: album_id is only unique per artist, so join on BOTH artist_id AND album_id, then filter by album name.

### List all the track names, the corresponding album name, and the corresponding artist name

_used in 20 semester(s) · ✓ verified (153 rows)_

```sql
SELECT t.track_name, al.album_name, ar.artist_name FROM `nyu-datasets.music.track` AS t JOIN `nyu-datasets.music.album` AS al ON t.artist_id = al.artist_id AND t.album_id = al.album_id JOIN `nyu-datasets.music.artist` AS ar ON t.artist_id = ar.artist_id
```

**Hint:** Three-table JOIN; join track to album on the composite key (artist_id AND album_id), then to artist on artist_id.

### List all the tracks by the artist `The Stone Roses` and rank them by time length, from shortest to longest

_used in 20 semester(s) · ✓ verified (13 rows)_

```sql
SELECT t.track_name, t.time
FROM `nyu-datasets.music.track` t
JOIN `nyu-datasets.music.artist` a
  ON t.artist_id = a.artist_id
WHERE a.artist_name = 'The Stone Roses'
ORDER BY t.time ASC
```

**Hint:** JOIN track to artist on artist_id, filter by artist_name, then ORDER BY time ASC for shortest-to-longest.

### The table `tracks_played` contains the tracks the users listened to and the time they listened to the songs. For every track listed in the tracks\_played table, show the user's first and last name, the user id, the album name, the track name, and the date/time it was played.

_used in 20 semester(s) · ✓ verified (1176 rows)_

```sql
SELECT u.first_name, u.last_name, u.user_id, al.album_name, t.track_name, tp.played_on
FROM `nyu-datasets.music.tracks_played` tp
JOIN `nyu-datasets.music.users` u
  ON tp.user_id = u.user_id
JOIN `nyu-datasets.music.album` al
  ON tp.album_id = al.album_id AND tp.artist_id = al.artist_id
JOIN `nyu-datasets.music.track` t
  ON tp.track_id = t.track_id AND tp.album_id = t.album_id AND tp.artist_id = t.artist_id
ORDER BY tp.played_on
```

**Hint:** Multi-table JOIN of tracks_played to users, album, and track. CRITICAL: track_id and album_id are scoped per artist, so the join keys to track/album must include artist_id (composite key), otherwise you get a cartesian blow-up.

### List the first and last names of the users that have not listened to any tracks.

_used in 20 semester(s) · ✓ verified (2 rows)_

```sql
SELECT u.first_name, u.last_name
FROM `nyu-datasets.music.users` u
LEFT JOIN `nyu-datasets.music.tracks_played` tp
  ON u.user_id = tp.user_id
WHERE tp.user_id IS NULL
```

**Hint:** LEFT JOIN users to tracks_played and keep only rows where the right side IS NULL (anti-join). NOT IN / NOT EXISTS on user_id also works.

## Aggregations

### Count the number of artists in the database

_used in 19 semester(s) · ✓ verified (1 rows)_

```sql
SELECT COUNT(*) AS num_artists
FROM `nyu-datasets.music.artist`
```

**Hint:** COUNT(*) over the whole artist table returns the total number of rows (artists). No GROUP BY is needed for a single grand-total count.

### Count the number of tracks in the database

_used in 19 semester(s) · ✓ verified (1 rows)_

```sql
SELECT COUNT(*) AS num_tracks
FROM `nyu-datasets.music.track`
```

**Hint:** COUNT(*) over the track table gives the total number of track rows. A plain aggregate with no GROUP BY produces one summary row.

### For each artist, count the number of albums in the database. You only need to show the id of the artist, not the name of the artist.

_used in 19 semester(s) · ✓ verified (6 rows)_

```sql
SELECT artist_id, COUNT(*) AS num_albums
FROM `nyu-datasets.music.album`
GROUP BY artist_id
ORDER BY artist_id
```

**Hint:** GROUP BY artist_id, then COUNT(*) within each group gives albums per artist. The grouping column (artist_id) is the only non-aggregated column in the SELECT.

### For each album, count the number of tracks for that album and the total length of all the tracks in the album. You only need to show the primary key of the album, not its name.

_used in 19 semester(s) · ✓ verified (13 rows)_

```sql
SELECT artist_id, album_id, COUNT(*) AS num_tracks, SUM(time) AS total_length
FROM `nyu-datasets.music.track`
GROUP BY artist_id, album_id
ORDER BY artist_id, album_id
```

**Hint:** Per-group aggregation: GROUP BY the album's key, then use COUNT(*) for the number of tracks and SUM(time) for total length in the same SELECT. Note the album's primary key here is the composite (artist_id, album_id), not album_id alone.

### List the IDs of the albums, where the total album length (across all the album's tracks) is longer than 60 minutes.

_used in 19 semester(s) · ✓ verified (8 rows)_

```sql
SELECT artist_id, album_id, SUM(time) AS total_minutes
FROM `nyu-datasets.music.track`
GROUP BY artist_id, album_id
HAVING SUM(time) > 60
ORDER BY artist_id, album_id
```

**Hint:** GROUP BY the album key, then filter the aggregated groups with HAVING SUM(time) > 60 (HAVING filters on aggregates, unlike WHERE which filters individual rows). The album key is the composite (artist_id, album_id).

### Show the name of the artist and the number of albums for each artist in the database. Name the column that shows the number of albums as num\_albums.

_used in 19 semester(s) · ✓ verified (6 rows)_

```sql
SELECT ar.artist_name, COUNT(al.album_id) AS num_albums
FROM `nyu-datasets.music.artist` ar
LEFT JOIN `nyu-datasets.music.album` al ON ar.artist_id = al.artist_id
GROUP BY ar.artist_name
ORDER BY num_albums DESC
```

**Hint:** GROUP BY artist with COUNT of albums; use a LEFT JOIN (artist -> album) so any artist with zero albums still appears, and alias the count AS num_albums.

### Show the average and standard deviation of the track length

_used in 15 semester(s) · ✓ verified (1 rows)_

```sql
SELECT AVG(time) AS avg_length, STDDEV(time) AS stddev_length
FROM `nyu-datasets.music.track`
```

**Hint:** Apply the AVG() and STDDEV() aggregate functions to the track.time column in a single SELECT (no GROUP BY needed for an overall summary).

### For every _date_ listed in the tracked\_played table, show the artist's name, the artist id, the number of users that listened to the artist, and the total amount of time users listened to the artist. Assume that each track is played fully.

_used in 15 semester(s) · ✓ verified (50 rows)_

```sql
SELECT
  DATE(tp.played_on) AS play_date,
  a.artist_name,
  a.artist_id,
  COUNT(DISTINCT tp.user_id) AS num_users,
  SUM(t.time) AS total_listen_time
FROM `nyu-datasets.music.tracks_played` tp
JOIN `nyu-datasets.music.artist` a
  ON tp.artist_id = a.artist_id
JOIN `nyu-datasets.music.track` t
  ON tp.track_id = t.track_id
 AND tp.album_id = t.album_id
 AND tp.artist_id = t.artist_id
GROUP BY play_date, a.artist_name, a.artist_id
ORDER BY play_date, a.artist_id
```

**Hint:** Truncate the played_on TIMESTAMP to a DATE, join tracks_played to artist (for the name) and to track (for each track's length), then GROUP BY date + artist using COUNT(DISTINCT user_id) and SUM(track.time).

### Show the average and standard deviation of the track length; round both to two decimal digits

_used in 4 semester(s) · ✓ verified (1 rows)_

```sql
SELECT
  ROUND(AVG(time), 2)    AS avg_track_length,
  ROUND(STDDEV(time), 2) AS stddev_track_length
FROM `nyu-datasets.music.track`
```

**Hint:** Aggregate the track.time column with AVG and STDDEV, wrapping each in ROUND(..., 2) to get two decimals.
