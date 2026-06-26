# restaurants — validated solutions

33 questions, each solved and verified against `nyu-datasets.restaurants` on BigQuery.

## Filtering

### Output the names of all the Thai restaurants stored in your DB.

_used in 21 semester(s) · ✓ verified (2 rows)_

```sql
SELECT restName
FROM `nyu-datasets.restaurants.Restaurant`
WHERE cuisine = 'Thai'
ORDER BY restName;
```

**Hint:** WHERE filter on a text column (cuisine = 'Thai'). String match is case-sensitive in BigQuery.

### Output the names of all the Brooklyn restaurants stored in your DB there were established prior to 2012.

_used in 21 semester(s) · ✓ verified (2 rows)_

```sql
SELECT restName, yearEst
FROM `nyu-datasets.restaurants.Restaurant`
WHERE borough = 'Brooklyn'
  AND yearEst < 2012
ORDER BY restName;
```

**Hint:** Combine two conditions with AND in WHERE: a string equality (borough) plus a numeric comparison (yearEst < 2012).

### Show the list of restaurants together with their cuisine and location with the average price higher than $120.00

_used in 21 semester(s) · ✓ verified (5 rows)_

```sql
SELECT restName, cuisine, borough, avgPrice
FROM `nyu-datasets.restaurants.Restaurant`
WHERE avgPrice > 120.00
ORDER BY avgPrice DESC;
```

**Hint:** WHERE filter on a numeric column (avgPrice > 120). Select the descriptive columns (name, cuisine, location) alongside the filtered value.

### Show the names of all the food critics who work in NYT or NYP together with the corresponding affiliation.

_used in 21 semester(s) · ✓ verified (5 rows)_

```sql
SELECT firstN, lastN, affiliation
FROM `nyu-datasets.restaurants.Critic`
WHERE affiliation IN ('NYT', 'NYP')
ORDER BY lastN, firstN;
```

**Hint:** Filter on a set of allowed values with IN ('NYT','NYP') (equivalent to two OR conditions), and include the affiliation column in the output.

### Output the first and last names of the reviewers who are freelancers and to not have any affiliation.

_used in 21 semester(s) · ✓ verified (2 rows)_

```sql
SELECT firstN, lastN
FROM `nyu-datasets.restaurants.Critic`
WHERE affiliation IS NULL OR TRIM(affiliation) = ""
```

**Hint:** Freelancers are critics with no publication, so filter the Critic table for a NULL (missing) affiliation using IS NULL.

### Show all the restaurant names whose length is less than 10 characters.

_used in 21 semester(s) · ✓ verified (6 rows)_

```sql
SELECT restName
FROM `nyu-datasets.restaurants.Restaurant`
WHERE LENGTH(restName) < 10
```

**Hint:** Use the LENGTH() string function in the WHERE clause to keep names with fewer than 10 characters.

### Output all the records from the Rating table for the reviews made by the critic with cID 202.

_used in 21 semester(s) · ✓ verified (1 rows)_

```sql
SELECT *
FROM `nyu-datasets.restaurants.Rating`
WHERE cID = 202
```

**Hint:** Simple equality filter: WHERE cID = 202 on the Rating table.

### Output all the records from the Rating table for the reviews with the starRating greater than 3

_used in 21 semester(s) · ✓ verified (5 rows)_

```sql
SELECT *
FROM `nyu-datasets.restaurants.Rating`
WHERE starRating > 3
```

**Hint:** Numeric comparison in WHERE: starRating > 3 (strictly greater than, so 4 and 5 stars).

### Output the names of all the Italian Manhattan restaurants.

_used in 21 semester(s) · ✓ verified (2 rows)_

```sql
SELECT restName
FROM `nyu-datasets.restaurants.Restaurant`
WHERE cuisine = "Italian" AND borough = "Manhattan"
```

**Hint:** Combine two equality conditions with AND on the cuisine and borough columns.

### Output all the names of all the Bronx restaurants with the average prices greater than $100.00

## [](https://github.com/ipeirotis/introduction-to-databases/blob/master/session3/practice_questions_filtering.md#facebook-database)

_used in 21 semester(s) · ✓ verified (0 rows)_

```sql
SELECT restName
FROM `nyu-datasets.restaurants.Restaurant`
WHERE borough = "Bronx" AND avgPrice > 100.00
```

> Note: 0 rows — correctly empty (no Bronx restaurant exceeds the threshold).

**Hint:** Filter on borough = 'Bronx' AND avgPrice > 100 using AND in the WHERE clause.

## Joins

### Output the names of the restaurants together with the comments written for these restaurants.  Your output should include only those restaurants for which reviews were submitted; do not output empty comments (NULL values)

_used in 21 semester(s) · ✓ verified (10 rows)_

```sql
SELECT r.restName, rt.comments
FROM `nyu-datasets.restaurants.Restaurant` AS r
JOIN `nyu-datasets.restaurants.Rating` AS rt
  ON r.restCode = rt.restCode
WHERE rt.comments IS NOT NULL
```

**Hint:** INNER JOIN Restaurant to Rating on restCode (only matched, i.e. reviewed, restaurants), then filter out missing comments with WHERE comments IS NOT NULL.

### Output the names of the restaurants together with the star rating and the comments written for these restaurants.  Your output should contain the names of all the restaurants from your database; if some restaurants are not reviewed or their comments are empty, these restaurants should still be included in your output (with NULL values for the star and/or comments attribute);

_used in 21 semester(s) · ✓ verified (19 rows)_

```sql
SELECT r.restName, rt.starRating, rt.comments
FROM `nyu-datasets.restaurants.Restaurant` AS r
LEFT JOIN `nyu-datasets.restaurants.Rating` AS rt
  ON r.restCode = rt.restCode
```

**Hint:** LEFT JOIN from Restaurant to Rating so every restaurant is kept; unreviewed restaurants (and reviews with no comment) come back with NULL star/comments. Do NOT add a WHERE filter on comments here.

### For every review stored in the database output the review id, first and last names of the critic together with the comments left by this critic for each of the reviews.

_used in 21 semester(s) · ✓ verified (14 rows)_

```sql
SELECT rt.code, c.firstN, c.lastN, rt.comments
FROM `nyu-datasets.restaurants.Rating` AS rt
JOIN `nyu-datasets.restaurants.Critic` AS c
  ON rt.cID = c.cID
```

**Hint:** INNER JOIN Rating to Critic on cID to attach each reviewer's name to their review; the review id is Rating.code.

### Output the critic's first and last names, restaurant name, and the star rating assigned by the critic to the restaurant for all the reviews where the star rating is greater or equal to 3.

_used in 21 semester(s) · ✓ verified (10 rows)_

```sql
SELECT c.firstN, c.lastN, r.restName, rt.starRating
FROM `nyu-datasets.restaurants.Rating` rt
JOIN `nyu-datasets.restaurants.Critic` c ON rt.cID = c.cID
JOIN `nyu-datasets.restaurants.Restaurant` r ON rt.restCode = r.restCode
WHERE rt.starRating >= 3
```

**Hint:** Three-table INNER JOIN (Rating to Critic via cID, Rating to Restaurant via restCode) plus a WHERE on starRating >= 3.

### For all the Manhattan restaurants output the following information regarding all the reviews submitted for these restaurants: the name of the restaurant, its cuisine, the name of the food critic, food critic's affiliation, star rating assigned by the critic, date the review was written and the comments. Include in the output only those restaurants for which there are reviews in your DB.

_used in 21 semester(s) · ✓ verified (6 rows)_

```sql
SELECT r.restName, r.cuisine, c.firstN, c.lastN, c.affiliation, rt.starRating, rt.ratingDate, rt.comments
FROM `nyu-datasets.restaurants.Restaurant` r
JOIN `nyu-datasets.restaurants.Rating` rt ON r.restCode = rt.restCode
JOIN `nyu-datasets.restaurants.Critic` c ON rt.cID = c.cID
WHERE r.borough = "Manhattan"
```

**Hint:** INNER JOIN across all three tables, filtered to borough = 'Manhattan'. Inner join naturally drops restaurants with no reviews.

### For all the Manhattan restaurants output the following information regarding all the reviews submitted for these restaurants: the name of the restaurant, its cuisine, the name of the food critic, food critic's affiliation, star rating assigned by the critic, date the review was written and the comments. Include in your output all the information about all the Manhattan restaurants. If there are Manhattan restaurants for which there are no reviews then the fields for the critic and review should be null.

_used in 21 semester(s) · ✓ verified (8 rows)_

```sql
SELECT r.restName, r.cuisine, c.firstN, c.lastN, c.affiliation, rt.starRating, rt.ratingDate, rt.comments
FROM `nyu-datasets.restaurants.Restaurant` r
LEFT JOIN `nyu-datasets.restaurants.Rating` rt ON r.restCode = rt.restCode
LEFT JOIN `nyu-datasets.restaurants.Critic` c ON rt.cID = c.cID
WHERE r.borough = "Manhattan"
```

**Hint:** LEFT JOIN from Restaurant so every Manhattan restaurant is kept; critic/review columns come out NULL when there are no reviews.

### Output the rating code, the critic's name who submitted this rating, the borough of the restaurant for which the rating was given, and the star rating for all the ratings submitted on or after January 1, 2010.

_used in 11 semester(s) · ✓ verified (8 rows)_

```sql
SELECT
  rt.code,
  CONCAT(c.firstN, ' ', c.lastN) AS critic_name,
  r.borough,
  rt.starRating
FROM `nyu-datasets.restaurants.Rating` rt
JOIN `nyu-datasets.restaurants.Critic` c ON rt.cID = c.cID
JOIN `nyu-datasets.restaurants.Restaurant` r ON rt.restCode = r.restCode
WHERE rt.ratingDate >= DATE '2010-01-01'
ORDER BY rt.ratingDate
```

**Hint:** Three-table JOIN: Rating to Critic (on cID) for the critic name, and Rating to Restaurant (on restCode) for the borough. Filter dates with ratingDate >= DATE '2010-01-01' ('on or after' means >=).

### Output the rating code, the critic's name who submitted this rating, the borough of the restaurant for which the rating was given, and the star rating for all the ratings submitted after January 1, 2010.

_used in 10 semester(s) · ✓ verified (8 rows)_

```sql
SELECT
  rt.code,
  CONCAT(c.firstN, ' ', c.lastN) AS critic_name,
  r.borough,
  rt.starRating
FROM `nyu-datasets.restaurants.Rating` rt
JOIN `nyu-datasets.restaurants.Critic` c ON rt.cID = c.cID
JOIN `nyu-datasets.restaurants.Restaurant` r ON rt.restCode = r.restCode
WHERE rt.ratingDate > DATE '2010-01-01'
ORDER BY rt.ratingDate
```

**Hint:** Same three-table JOIN as the 'on or after' version (Rating-Critic on cID, Rating-Restaurant on restCode), but here 'after January 1, 2010' is a strict lower bound, so use ratingDate > DATE '2010-01-01'.

## Aggregations

### How many Manhattan restaurants are listed in your database?

_used in 31 semester(s) · ✓ verified (1 rows)_

```sql
SELECT COUNT(*) AS n FROM `nyu-datasets.restaurants.Restaurant` WHERE borough = 'Manhattan'
```

**Hint:** COUNT(*) with a WHERE filter on borough.

### Output the affiliation (or '-' for freelancers) and how many critics are associated with this affiliation?

_used in 31 semester(s) · ✓ verified (6 rows)_

```sql
SELECT IFNULL(affiliation, '-') AS affiliation, COUNT(*) AS num_critics FROM `nyu-datasets.restaurants.Critic` GROUP BY affiliation ORDER BY affiliation
```

**Hint:** GROUP BY affiliation + COUNT, and IFNULL to display freelancers (NULL affiliation) as '-'.

### Output the critic id together with the maximal star rating ever issued by this critic;

_used in 31 semester(s) · ✓ verified (8 rows)_

```sql
SELECT cID, MAX(starRating) AS max_star FROM `nyu-datasets.restaurants.Rating` GROUP BY cID ORDER BY cID
```

**Hint:** GROUP BY cID with MAX(starRating).

### Output the critic id and the restaurant code together with the maximal star rating ever issued by this critic for this restaurant

_used in 31 semester(s) · ✓ verified (12 rows)_

```sql
SELECT cID, restCode, MAX(starRating) AS max_star FROM `nyu-datasets.restaurants.Rating` GROUP BY cID, restCode ORDER BY cID, restCode
```

**Hint:** GROUP BY two columns (cID, restCode) with MAX(starRating).

### For every borough, cuisine pair output the minimal price and order the output by borough in the ascending order (consider only the restaurants outside of Manhattan)

_used in 31 semester(s) · ✓ verified (6 rows)_

```sql
SELECT borough, cuisine, MIN(avgPrice) AS min_price FROM `nyu-datasets.restaurants.Restaurant` WHERE borough != 'Manhattan' GROUP BY borough, cuisine ORDER BY borough ASC
```

**Hint:** Filter Manhattan out in WHERE (pre-aggregation), then GROUP BY borough, cuisine with MIN, ORDER BY borough.

### For every borough, cuisine pair output the minimal price where the minimal price is greater than 100

_used in 31 semester(s) · ✓ verified (4 rows)_

```sql
SELECT borough, cuisine, MIN(avgPrice) AS min_price FROM `nyu-datasets.restaurants.Restaurant` GROUP BY borough, cuisine HAVING MIN(avgPrice) > 100
```

**Hint:** GROUP BY borough, cuisine then HAVING on the aggregate MIN(avgPrice) > 100 (a post-aggregation filter, so HAVING not WHERE).

### For every borough, cuisine pair output the minimal price where the minimal price is greater than 100 and order the output by the price value in the descending order.

_used in 31 semester(s) · ✓ verified (4 rows)_

```sql
SELECT borough, cuisine, MIN(avgPrice) AS min_price FROM `nyu-datasets.restaurants.Restaurant` GROUP BY borough, cuisine HAVING MIN(avgPrice) > 100 ORDER BY min_price DESC
```

**Hint:** Same as the HAVING-filtered group query, plus ORDER BY the aggregated price DESC.

### Output the restaurant name together with the number of reviews submitted for this restaurant.

_used in 21 semester(s) · ✓ verified (11 rows)_

```sql
SELECT r.restName, COUNT(rt.code) AS num_reviews
FROM `nyu-datasets.restaurants.Restaurant` r
LEFT JOIN `nyu-datasets.restaurants.Rating` rt ON r.restCode = rt.restCode
GROUP BY r.restName
```

**Hint:** LEFT JOIN + GROUP BY, then COUNT a column from the Rating side (not COUNT(*)) so restaurants with zero reviews count as 0.

### For every Manhattan restaurant output its name and the number of reviews submitted for this restaurant.

_used in 21 semester(s) · ✓ verified (5 rows)_

```sql
SELECT r.restName, COUNT(rt.code) AS num_reviews
FROM `nyu-datasets.restaurants.Restaurant` r
LEFT JOIN `nyu-datasets.restaurants.Rating` rt ON r.restCode = rt.restCode
WHERE r.borough = "Manhattan"
GROUP BY r.restName
```

**Hint:** Same LEFT JOIN + GROUP BY count, but filter borough = 'Manhattan'. 'Every Manhattan restaurant' means keep zero-review ones too.

### For every restaurant that was reviewed more than once output it name and the number or reviews submitted for this restaurant.

_used in 21 semester(s) · ✓ verified (5 rows)_

```sql
SELECT r.restName, COUNT(rt.code) AS num_reviews
FROM `nyu-datasets.restaurants.Restaurant` r
JOIN `nyu-datasets.restaurants.Rating` rt ON r.restCode = rt.restCode
GROUP BY r.restName
HAVING COUNT(rt.code) > 1
```

**Hint:** GROUP BY restaurant then filter the aggregate with HAVING COUNT(...) > 1 (HAVING, not WHERE, because it filters on the count).

### Output the critic's last name and the restaurant name together with the maximal star rating ever issued by this critic for this restaurant.

_used in 21 semester(s) · ✓ verified (12 rows)_

```sql
SELECT c.lastN, r.restName, MAX(rt.starRating) AS max_star
FROM `nyu-datasets.restaurants.Rating` rt
JOIN `nyu-datasets.restaurants.Critic` c ON rt.cID = c.cID
JOIN `nyu-datasets.restaurants.Restaurant` r ON rt.restCode = r.restCode
GROUP BY c.lastN, r.restName
```

**Hint:** GROUP BY the critic+restaurant pair and apply MAX(starRating) to get each critic's highest rating per restaurant.

### For each NYT reporter, output the number of distinct restaurants this reporter reviewed.

_used in 21 semester(s) · ✓ verified (3 rows)_

```sql
SELECT c.firstN, c.lastN, COUNT(DISTINCT rt.restCode) AS distinct_restaurants
FROM `nyu-datasets.restaurants.Critic` c
JOIN `nyu-datasets.restaurants.Rating` rt ON c.cID = rt.cID
WHERE c.affiliation = "NYT"
GROUP BY c.cID, c.firstN, c.lastN
```

**Hint:** Filter critics by affiliation = 'NYT', then COUNT(DISTINCT restCode) per critic to avoid double-counting repeat reviews of the same restaurant.

### For every news outlet, output the average star rating submitted by all the reviewers of this outlet. a. consider only Italian restaurants b. consider only Italian restaurants outside of Manhattan

_used in 21 semester(s) · ✓ verified (3 rows)_

```sql
SELECT c.affiliation, AVG(r.starRating) AS avg_star
FROM `nyu-datasets.restaurants.Rating` r
JOIN `nyu-datasets.restaurants.Critic` c ON r.cID = c.cID
JOIN `nyu-datasets.restaurants.Restaurant` res ON r.restCode = res.restCode
WHERE res.cuisine = 'Italian'
GROUP BY c.affiliation
ORDER BY avg_star DESC
```

**Hint:** Join Rating -> Critic (for the outlet via affiliation) -> Restaurant (to filter cuisine), then GROUP BY affiliation with AVG(starRating). 'News outlet' = Critic.affiliation. For part (b) add AND res.borough <> 'Manhattan' to the WHERE.

### For every borough output the max star rating submitted for any restaurant within this borough (in which borough do you have the best restaurant)

_used in 21 semester(s) · ✓ verified (3 rows)_

```sql
SELECT res.borough, MAX(r.starRating) AS max_star
FROM `nyu-datasets.restaurants.Rating` r
JOIN `nyu-datasets.restaurants.Restaurant` res ON r.restCode = res.restCode
GROUP BY res.borough
ORDER BY max_star DESC
```

**Hint:** Join Rating to Restaurant on restCode, then GROUP BY borough with MAX(starRating). The top row tells you which borough holds the best-rated restaurant.

### For each cuisine-borough pair, output the number of the corresponding restaurants.

_used in 10 semester(s) · ✓ verified (10 rows)_

```sql
SELECT
  cuisine,
  borough,
  COUNT(*) AS num_restaurants
FROM `nyu-datasets.restaurants.Restaurant`
GROUP BY cuisine, borough
ORDER BY cuisine, borough
```

**Hint:** GROUP BY two columns (cuisine, borough) and COUNT(*) the restaurants in each group.
