# collisions — validated solutions

10 questions, each solved and verified against `nyu-datasets.collisions` on BigQuery.

## General / other

### Break down the number of collisions by borough.

_used in 20 semester(s) · ✓ verified (5 rows)_

```sql
SELECT BOROUGH, COUNT(*) AS num_collisions
FROM `nyu-datasets.collisions.collisions`
GROUP BY BOROUGH
ORDER BY num_collisions DESC
```

**Hint:** Simple GROUP BY one column (BOROUGH) with COUNT(*); ORDER BY the count to rank.

### Find out the how many collisions had 0 persons injured, 1 persons injured, etc. persons injured in each accident.

_used in 20 semester(s) · ✓ verified (30 rows)_

```sql
SELECT PERSONS_INJURED, COUNT(*) AS num_collisions
FROM `nyu-datasets.collisions.collisions`
GROUP BY PERSONS_INJURED
ORDER BY PERSONS_INJURED
```

**Hint:** GROUP BY the PERSONS_INJURED count itself, then COUNT(*) per group -> a frequency distribution of injuries-per-accident.

### Compute the average number of injuries and deaths per accident, broken down by borough.

_used in 20 semester(s) · ✓ verified (5 rows)_

```sql
SELECT BOROUGH,
       AVG(PERSONS_INJURED) AS avg_injuries,
       AVG(PERSONS_KILLED) AS avg_deaths
FROM `nyu-datasets.collisions.collisions`
GROUP BY BOROUGH
ORDER BY avg_injuries DESC
```

**Hint:** GROUP BY BOROUGH and apply AVG() to two separate columns (injuries and deaths) in one query.

### Compute the average number of injuries and deaths per accident, broken down by  the cause for the accident

_used in 20 semester(s) · ✓ verified (60 rows)_

```sql
SELECT ct.CAUSE,
       AVG(c.PERSONS_INJURED) AS avg_injuries,
       AVG(c.PERSONS_KILLED) AS avg_deaths,
       COUNT(*) AS num_accidents
FROM `nyu-datasets.collisions.collisions` AS c
JOIN (SELECT DISTINCT UNIQUE_KEY, CAUSE
      FROM `nyu-datasets.collisions.causes_types`) AS ct
  ON c.UNIQUE_KEY = ct.UNIQUE_KEY
GROUP BY ct.CAUSE
ORDER BY avg_injuries DESC
```

**Hint:** JOIN collisions to causes_types on UNIQUE_KEY, but first SELECT DISTINCT (UNIQUE_KEY, CAUSE) so a cause shared by multiple vehicles in one accident isn't double-counted; then GROUP BY CAUSE with AVG().

### Break down the number of accidents by borough and cause.

_used in 20 semester(s) · ✓ verified (280 rows)_

```sql
SELECT c.BOROUGH, ct.CAUSE,
       COUNT(DISTINCT c.UNIQUE_KEY) AS num_accidents
FROM `nyu-datasets.collisions.collisions` AS c
JOIN `nyu-datasets.collisions.causes_types` AS ct
  ON c.UNIQUE_KEY = ct.UNIQUE_KEY
GROUP BY c.BOROUGH, ct.CAUSE
ORDER BY num_accidents DESC
```

**Hint:** JOIN collisions to causes_types, GROUP BY two columns (BOROUGH, CAUSE), and use COUNT(DISTINCT UNIQUE_KEY) so multiple vehicle rows per accident count the accident once.

### Find the dates with the most accidents. Can you figure out what happened on these days?

_used in 20 semester(s) · ✓ verified (10 rows)_

```sql
SELECT DATE(DATE_TIME) AS accident_date, COUNT(*) AS num_accidents
FROM `nyu-datasets.collisions.collisions`
GROUP BY accident_date
ORDER BY num_accidents DESC
LIMIT 10
```

**Hint:** Truncate the TIMESTAMP to a day with DATE(), GROUP BY that date, COUNT(*), then ORDER BY count DESC and LIMIT to find the worst days.

### Plot the number of accidents per day. Try to eliminate the effects of seasonality by resampling and calculating average daily values using a rolling window of a year for the calculation of the daily averages.

_used in 20 semester(s) · ✓ verified (2557 rows)_

```sql
WITH daily AS (
  SELECT DATE(DATE_TIME) AS d, COUNT(*) AS n
  FROM `nyu-datasets.collisions.collisions`
  GROUP BY d
)
SELECT d, n,
       AVG(n) OVER (
         ORDER BY UNIX_DATE(d)
         RANGE BETWEEN 364 PRECEDING AND CURRENT ROW
       ) AS rolling_year_avg
FROM daily
ORDER BY d
```

**Hint:** First aggregate to one row per day (COUNT per DATE), then a windowed AVG() OVER (ORDER BY ... RANGE BETWEEN 364 PRECEDING AND CURRENT ROW) gives a 365-day rolling mean; RANGE over UNIX_DATE keeps it calendar-correct even if some days are missing.

### We want to analyze the timing patterns of accidents that lead to death or injury. Calculate the probability of an accident resulting in an injury (one or more injured people) and the probability of an accident resulting in one or more deaths, broken down the by the hour of the day. Also list the total number of collisions for the given hour of the day.

_used in 20 semester(s) · ✓ verified (24 rows)_

```sql
SELECT EXTRACT(HOUR FROM DATE_TIME) AS hour_of_day,
       COUNT(*) AS total_collisions,
       AVG(IF(PERSONS_INJURED > 0, 1, 0)) AS prob_injury,
       AVG(IF(PERSONS_KILLED > 0, 1, 0)) AS prob_death
FROM `nyu-datasets.collisions.collisions`
GROUP BY hour_of_day
ORDER BY hour_of_day
```

**Hint:** EXTRACT(HOUR FROM ...) to bucket by hour, then GROUP BY it; a probability is just the average of a 0/1 flag, so AVG(IF(PERSONS_INJURED>0,1,0)) gives P(injury). Add COUNT(*) for the per-hour totals.

### Find out the most common contributing factors to the collisions, for all accidents after Jan-1-2020. The causes are listed in the `vehicles_involved` table

_used in 15 semester(s) · ✓ verified (60 rows)_

```sql
SELECT ct.CAUSE, COUNT(*) AS num_occurrences
FROM `nyu-datasets.collisions.causes_types` ct
JOIN `nyu-datasets.collisions.collisions` c
  ON ct.UNIQUE_KEY = c.UNIQUE_KEY
WHERE c.DATE_TIME > TIMESTAMP('2020-01-01')
GROUP BY ct.CAUSE
ORDER BY num_occurrences DESC
```

**Hint:** JOIN causes_types to collisions on UNIQUE_KEY so you can filter by DATE_TIME, then GROUP BY the CAUSE and COUNT(*), ordering descending to find the most common.

### Collisions: Find out the most common contributing factors to the collisions, for all accidents after Jan-1-2020. The causes are listed in the `vehicles_involved` table

_used in 5 semester(s) · ✓ verified (59 rows)_

```sql
SELECT ct.CAUSE, COUNT(*) AS num_collisions
FROM `nyu-datasets.collisions.collisions` c
JOIN `nyu-datasets.collisions.causes_types` ct
  ON c.UNIQUE_KEY = ct.UNIQUE_KEY
WHERE c.DATE_TIME >= TIMESTAMP('2020-01-01')
GROUP BY ct.CAUSE
ORDER BY num_collisions DESC
```

**Hint:** JOIN collisions to the causes table on UNIQUE_KEY, filter DATE_TIME >= '2020-01-01', then GROUP BY CAUSE with COUNT(*) and ORDER BY the count DESC. Optionally exclude CAUSE = 'UNSPECIFIED' since it dominates.
