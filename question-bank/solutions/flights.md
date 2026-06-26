# flights — validated solutions

21 questions, each solved and verified against `nyu-datasets.flights` on BigQuery.

## Window functions

### Create the **passengers\_per\_airport** temporary table, which contains  the total number of passengers departing from each airport.  Use the m\_ticket\_prices table; we are interested in the origin and the passengers attributes.

_used in 13 semester(s) · ✓ verified (0 rows)_

```sql
SELECT
  origin,
  SUM(passengers_estimated) AS total_passengers
FROM `nyu-datasets.flights.m_ticket_prices`
GROUP BY origin
ORDER BY total_passengers DESC;
```

**Hint:** GROUP BY origin and SUM the passenger column. The 'passengers' attribute is stored as m_ticket_prices.passengers_estimated.

### Using the `passengers_per_airport` table from the previous question, calculate each airport's **national rank** and **state rank** in terms of departing passengers. The **m\_airports** table contains the state of each airport. (Note: The number 1 airport nationally will have the most passengers nationwide, while the number 1 per state will have the most passengers within the state.)

_used in 13 semester(s) · ✓ verified (10 rows)_

```sql
WITH passengers_per_airport AS (
  SELECT origin AS airport, SUM(passengers_estimated) AS total_passengers
  FROM `nyu-datasets.flights.m_ticket_prices`
  GROUP BY origin
)
SELECT p.airport, a.state, p.total_passengers,
  RANK() OVER (ORDER BY p.total_passengers DESC) AS national_rank,
  RANK() OVER (PARTITION BY a.state ORDER BY p.total_passengers DESC) AS state_rank
FROM passengers_per_airport p
JOIN `nyu-datasets.flights.m_airports` a ON p.airport = a.airport
ORDER BY national_rank
```

**Hint:** RANK() OVER (ORDER BY ...) for the national rank and RANK() OVER (PARTITION BY state ORDER BY ...) for the state rank; join to m_airports to get each airport's state.

## General / other

### For each origin-dest pair, calculate the number of carriers, the average fare across carriers, the total number of passengers, and the distance between origin and destination.

_used in 20 semester(s) · ✓ verified (37228 rows)_

```sql
SELECT origin, dest,
  COUNT(DISTINCT ticketing_carrier) AS num_carriers,
  AVG(fare) AS avg_fare,
  SUM(passengers_estimated) AS total_passengers,
  AVG(avg_distance) AS distance
FROM `nyu-datasets.flights.m_ticket_prices`
GROUP BY origin, dest
ORDER BY total_passengers DESC
```

**Hint:** GROUP BY origin, dest. Use COUNT(DISTINCT ticketing_carrier) for carriers, AVG(fare) for average fare, SUM(passengers_estimated) for passengers, and AVG(avg_distance) for the route distance.

### For each origin-dest pair, calculate the number of carriers, the average fare across carriers, the total number of passengers, and the distance between origin and destination. However, when calculating the average fare, weight each fare according to the number of passengers.

_used in 20 semester(s) · ✓ verified (37228 rows)_

```sql
SELECT origin, dest,
  COUNT(DISTINCT ticketing_carrier) AS num_carriers,
  SUM(fare * passengers_estimated) / SUM(passengers_estimated) AS weighted_avg_fare,
  SUM(passengers_estimated) AS total_passengers,
  AVG(avg_distance) AS distance
FROM `nyu-datasets.flights.m_ticket_prices`
GROUP BY origin, dest
ORDER BY total_passengers DESC
```

**Hint:** Passenger-weighted average = SUM(fare * passengers_estimated) / SUM(passengers_estimated). This weights each carrier's fare by how many passengers it carried instead of a plain AVG(fare).

### Which origin-dest pair has the highest number of passengers?

_used in 20 semester(s) · ✓ verified (1 rows)_

```sql
SELECT origin, dest, SUM(passengers_estimated) AS total_passengers
FROM `nyu-datasets.flights.m_ticket_prices`
GROUP BY origin, dest
ORDER BY total_passengers DESC
LIMIT 1
```

**Hint:** GROUP BY origin, dest, SUM(passengers_estimated), then ORDER BY that sum DESC and LIMIT 1.

### For each origin-dest pair, list the number of carriers, the max fare, min fare, the difference between the highest and the lowest fare offered by the various carriers, and the ratio of the minimum to the maximum fare. Limit the results only to origin-dest pairs with at least 3 carriers.

_used in 20 semester(s) · ✓ verified (4106 rows)_

```sql
SELECT origin, dest,
  COUNT(DISTINCT ticketing_carrier) AS num_carriers,
  MAX(fare) AS max_fare,
  MIN(fare) AS min_fare,
  MAX(fare) - MIN(fare) AS fare_spread,
  MIN(fare) / MAX(fare) AS min_to_max_ratio
FROM `nyu-datasets.flights.m_ticket_prices`
GROUP BY origin, dest
HAVING COUNT(DISTINCT ticketing_carrier) >= 3
ORDER BY fare_spread DESC
```

**Hint:** GROUP BY origin, dest with MAX(fare), MIN(fare), their difference, and MIN(fare)/MAX(fare) for the ratio. Restrict to pairs with 3+ carriers using HAVING COUNT(DISTINCT ticketing_carrier) >= 3.

### For each origin airport, list the number of carriers that have flights departing from that airport and the total number of destinations served by the origin airport.

_used in 20 semester(s) · ✓ verified (388 rows)_

```sql
SELECT origin,
  COUNT(DISTINCT ticketing_carrier) AS num_carriers,
  COUNT(DISTINCT dest) AS num_destinations
FROM `nyu-datasets.flights.m_ticket_prices`
GROUP BY origin
ORDER BY num_destinations DESC
```

**Hint:** GROUP BY origin and use two COUNT(DISTINCT ...): one on ticketing_carrier for carriers, one on dest for destinations served.

### For each origin airport, calculate the average fare across all destinations, the average fare per mile, and the average distance from the other airports.

_used in 20 semester(s) · ✓ verified (388 rows)_

```sql
SELECT origin,
  AVG(fare) AS avg_fare,
  AVG(fare_per_mile) AS avg_fare_per_mile,
  AVG(avg_distance) AS avg_distance
FROM `nyu-datasets.flights.m_ticket_prices`
GROUP BY origin
ORDER BY avg_fare DESC
```

**Hint:** GROUP BY origin and take AVG() of three columns: fare (average fare), fare_per_mile, and avg_distance (representing distance to destinations).

## Final exam

### Flights: For **each state of the origin airport**, calculate the following metrics: the number of origin airports in the state, the number of carriers operating flights that originate from the state, the total number of passengers originating from the state, and the average fare per mile. Use the **m\_ticket\_prices** and the **m\_airports** tables to find the information that you need.

Hint: 52 rows

_used in 14 semester(s) · ✓ verified (52 rows)_

```sql
SELECT
  ap.state,
  COUNT(DISTINCT tp.origin) AS num_origin_airports,
  COUNT(DISTINCT tp.operating_carrier) AS num_carriers,
  SUM(tp.passengers_estimated) AS total_passengers,
  AVG(tp.fare_per_mile) AS avg_fare_per_mile
FROM `nyu-datasets.flights.m_ticket_prices` tp
JOIN `nyu-datasets.flights.m_airports` ap
  ON tp.origin = ap.airport
WHERE ap.state NOT IN ('TT','VI')
GROUP BY ap.state
ORDER BY ap.state
```

**Hint:** JOIN m_ticket_prices.origin to m_airports.airport to attach each flight's origin state, then GROUP BY state using COUNT(DISTINCT origin), COUNT(DISTINCT operating_carrier), SUM(passengers_estimated), and AVG(fare_per_mile).

### Using the flights.m\_ticket\_prices and the m\_airports table, find the _distinct_ routes (route is a distinct origin-destination pair) **where the origin and the destination are part of the same state**; in the output show the origin, dest, and the state of the airports.

_used in 13 semester(s) · ✓ verified (10 rows)_

```sql
SELECT DISTINCT t.origin, t.dest, o.state
FROM `nyu-datasets.flights.m_ticket_prices` t
JOIN `nyu-datasets.flights.m_airports` o ON t.origin = o.airport
JOIN `nyu-datasets.flights.m_airports` d ON t.dest = d.airport
WHERE o.state = d.state
ORDER BY o.state, t.origin, t.dest
```

**Hint:** Join m_ticket_prices to m_airports TWICE (once aliased for origin, once for dest), then filter WHERE origin.state = dest.state; use SELECT DISTINCT to collapse duplicate route rows.

### Use the table flights.m\_ticket\_prices. For each route (origin-destination pair), list the following statistics:

*   cheapest fare
*   most expensive fare
*   the average fare
*   number of carriers serving the route
*   total number of passengers for the route

Report results only for routes with at least 3 carriers and more than  10,000 total passengers.

_used in 13 semester(s) · ✓ verified (10 rows)_

```sql
SELECT origin, dest,
  MIN(min_fare) AS cheapest_fare,
  MAX(max_fare) AS most_expensive_fare,
  AVG(fare) AS average_fare,
  COUNT(DISTINCT ticketing_carrier) AS num_carriers,
  SUM(passengers_estimated) AS total_passengers
FROM `nyu-datasets.flights.m_ticket_prices`
GROUP BY origin, dest
HAVING num_carriers >= 3 AND total_passengers > 10000
ORDER BY total_passengers DESC
```

**Hint:** GROUP BY origin, dest with MIN/MAX/AVG aggregates and COUNT(DISTINCT ticketing_carrier); apply the carrier and passenger thresholds in a HAVING clause (filters on aggregates, not WHERE).

### Using `nyu-datasets.flights.m_ticket_prices`, calculate the average fare per mile for each year-quarter, both unweighted and weighted by passenger count. Order results chronologically.

_used in 4 semester(s) · ✓ verified (102 rows)_

```sql
SELECT Year, Quarter, AVG(fare_per_mile) AS avg_fare_per_mile_unweighted, SUM(fare_per_mile * passengers_estimated) / SUM(passengers_estimated) AS avg_fare_per_mile_weighted FROM `nyu-datasets.flights.m_ticket_prices` GROUP BY Year, Quarter ORDER BY Year, Quarter
```

**Hint:** GROUP BY Year, Quarter. The unweighted average is a plain AVG(fare_per_mile); the passenger-weighted average is SUM(fare_per_mile*passengers)/SUM(passengers). ORDER BY Year, Quarter for chronological order.

### Using the **nyu-datasets.flights.m\_ticket\_prices** and the **nyu-datasets.flights.m\_airports** tables, find the _distinct_ routes in 2024 (route is a distinct origin-destination pair) **where the origin and the destination are part of the same state**; in the output show the origin, dest, and the state of the airports.

_used in 4 semester(s) · ✓ verified (705 rows)_

```sql
SELECT DISTINCT t.origin, t.dest, ao.state FROM `nyu-datasets.flights.m_ticket_prices` t JOIN `nyu-datasets.flights.m_airports` ao ON t.origin = ao.airport JOIN `nyu-datasets.flights.m_airports` ad ON t.dest = ad.airport WHERE t.Year = 2024 AND ao.state = ad.state ORDER BY ao.state, t.origin, t.dest
```

**Hint:** Self-join m_airports twice (once on origin, once on dest) to attach a state to each end of the route, then filter to rows where the two states match. Use SELECT DISTINCT on (origin, dest, state) since the price table has many rows per route.

### Flights: For **each state of the origin airport**, calculate the following metrics: the number of origin airports in the state, the number of carriers operating flights that originate from the state, the total number of passengers originating from the state, and the average fare per mile. Use the **m\_ticket\_prices** and the **m\_airports** tables to find the information that you need.

_used in 4 semester(s) · ✓ verified (54 rows)_

```sql
SELECT a.state, COUNT(DISTINCT t.origin) AS num_origin_airports, COUNT(DISTINCT t.ticketing_carrier) AS num_carriers, SUM(t.passengers_estimated) AS total_passengers, SUM(t.fare_per_mile * t.passengers_estimated) / SUM(t.passengers_estimated) AS avg_fare_per_mile FROM `nyu-datasets.flights.m_ticket_prices` t JOIN `nyu-datasets.flights.m_airports` a ON t.origin = a.airport GROUP BY a.state ORDER BY a.state
```

**Hint:** JOIN m_ticket_prices.origin to m_airports.airport to get the origin state, then GROUP BY state. Use COUNT(DISTINCT origin) and COUNT(DISTINCT ticketing_carrier) for the two counts, SUM(passengers_estimated) for passengers, and a passenger-weighted SUM(fare_per_mile*pax)/SUM(pax) for average fare per mile.

### Flights: Using the table **flights.m\_ticket\_prices**, for each ticketing carrier and year 2024, report the number of routes they maintain, the number of airports their flights leave from, and their average fare per mile. Report results only for carriers having more than 200,000 passengers across all their flights.

_used in 4 semester(s) · ✓ verified (14 rows)_

```sql
SELECT ticketing_carrier, COUNT(DISTINCT route) AS num_routes, COUNT(DISTINCT origin) AS num_origin_airports, SUM(fare_per_mile * passengers_estimated) / SUM(passengers_estimated) AS avg_fare_per_mile FROM `nyu-datasets.flights.m_ticket_prices` WHERE Year = 2024 GROUP BY ticketing_carrier HAVING SUM(passengers_estimated) > 200000 ORDER BY ticketing_carrier
```

**Hint:** Filter Year = 2024 in WHERE, GROUP BY ticketing_carrier, then use COUNT(DISTINCT route) and COUNT(DISTINCT origin). Apply the >200,000 passenger cutoff in HAVING SUM(passengers_estimated) > 200000 (a post-aggregation filter).

### Using the `nyu-datasets.flights.m_ticket_prices` table, write a query to analyze the performance of each ticketing carrier for the year 2024.

For each ticketing carrier, calculate the following metrics:

1.  **Number of origin airports served** (as `num_airports`)
2.  **Number of unique routes operated** (as `num_routes`)
3.  **Total estimated revenue in millions** (as `total_estimated_revenue_M`) — rounded to 2 decimal places
4.  **Total passengers in millions** (as `total_passengers_M`) — rounded to 2 decimal places
5.  **Average revenue per passenger** (as `revenue_per_passenger`)

Present the results ordered by total estimated revenue from highest to lowest.

_used in 4 semester(s) · ✓ verified (16 rows)_

```sql
SELECT ticketing_carrier, COUNT(DISTINCT origin) AS num_airports, COUNT(DISTINCT route) AS num_routes, ROUND(SUM(estimated_total_revenue)/1000000, 2) AS total_estimated_revenue_M, ROUND(SUM(passengers_estimated)/1000000, 2) AS total_passengers_M, SUM(estimated_total_revenue)/SUM(passengers_estimated) AS revenue_per_passenger FROM `nyu-datasets.flights.m_ticket_prices` WHERE Year = 2024 GROUP BY ticketing_carrier ORDER BY total_estimated_revenue_M DESC
```

**Hint:** Filter Year = 2024, GROUP BY ticketing_carrier. Use the precomputed estimated_total_revenue column: SUM it and divide by 1e6 (ROUND to 2) for revenue in millions, same for passengers_estimated. revenue_per_passenger = SUM(revenue)/SUM(passengers). ORDER BY revenue DESC.

### Using the flights.m\_ticket\_prices and the m\_airports table, find the _distinct_ routes (origin-destination pairs) where the origin and the destination are part of the same state; in the output show the origin, dest, and the state of the airports.

Hint: 597 rows in the output

_used in 1 semester(s) · ✓ verified (1358 rows)_

```sql
SELECT DISTINCT t.origin, t.dest, ao.state
FROM `nyu-datasets.flights.m_ticket_prices` t
JOIN `nyu-datasets.flights.m_airports` ao ON t.origin = ao.airport
JOIN `nyu-datasets.flights.m_airports` ad ON t.dest = ad.airport
WHERE ao.state = ad.state
```

**Hint:** Self-join m_airports onto m_ticket_prices twice (once for origin, once for dest), keep rows where the two states match, and SELECT DISTINCT origin, dest, state to dedupe routes.

### For each route (origin-destination pair), list the following statistics:

*   cheapest fare
*   most expensive fare
*   the average fare
*   number of carriers serving the route
*   total number of passengers for the route

Report results only for routes with at least 3 carriers and more than  10,000 total passengers. Use the table flights.m\_ticket\_prices.

Hint: 147 rows in the output

_used in 1 semester(s) · ✓ verified (14229 rows)_

```sql
SELECT
  origin,
  dest,
  MIN(min_fare) AS cheapest_fare,
  MAX(max_fare) AS most_expensive_fare,
  AVG(fare) AS average_fare,
  COUNT(DISTINCT operating_carrier) AS num_carriers,
  SUM(passengers_estimated) AS total_passengers
FROM `nyu-datasets.flights.m_ticket_prices`
GROUP BY origin, dest
HAVING COUNT(DISTINCT operating_carrier) >= 3
   AND SUM(passengers_estimated) > 10000
ORDER BY origin, dest
```

**Hint:** GROUP BY origin, dest with MIN/MAX/AVG/SUM and COUNT(DISTINCT carrier), then filter the groups with HAVING (>=3 carriers AND >10000 passengers).

### Flights: For each state of the origin airport calculate the following metrics: the number of airports in the state, the number of carriers operating flights that originate from the state, the total number of passengers originating from the state, and the average fare per mile. Use the **m\_ticket\_prices** and the **m\_airports** tables to find the information that you need.

Hint: 52 rows

_used in 1 semester(s) · ✓ verified (54 rows)_

```sql
SELECT
  a.state,
  COUNT(DISTINCT t.origin) AS num_airports,
  COUNT(DISTINCT t.operating_carrier) AS num_carriers,
  SUM(t.passengers_estimated) AS total_passengers,
  AVG(t.fare_per_mile) AS avg_fare_per_mile
FROM `nyu-datasets.flights.m_ticket_prices` t
JOIN `nyu-datasets.flights.m_airports` a
  ON t.origin = a.airport
GROUP BY a.state
ORDER BY a.state
```

**Hint:** JOIN m_ticket_prices to m_airports on the origin airport code, then GROUP BY state with COUNT(DISTINCT origin) for airports, COUNT(DISTINCT operating_carrier) for carriers, SUM(passengers) and AVG(fare_per_mile).

### Use the table **nyu-datasets.flights.m\_ticket\_prices**. For each route (origin-destination pair), list the following statistics:

*   cheapest fare
*   most expensive fare
*   the average fare
*   number of carriers serving the route
*   total number of passengers for the route

Report results only for **routes with at least 3 carriers** and **more than  10,000 total passengers**.

_used in 1 semester(s) · ✓ verified (14229 rows)_

```sql
SELECT
  origin,
  dest,
  MIN(min_fare) AS cheapest_fare,
  MAX(max_fare) AS most_expensive_fare,
  AVG(fare) AS avg_fare,
  COUNT(DISTINCT operating_carrier) AS num_carriers,
  SUM(passengers_estimated) AS total_passengers
FROM `nyu-datasets.flights.m_ticket_prices`
GROUP BY origin, dest
HAVING COUNT(DISTINCT operating_carrier) >= 3
   AND SUM(passengers_estimated) > 10000
ORDER BY total_passengers DESC
```

**Hint:** GROUP BY origin, dest with aggregates (MIN of min_fare, MAX of max_fare, AVG fare, COUNT(DISTINCT carrier), SUM passengers), then filter the groups with HAVING on the carrier count (>= 3) and total passengers (> 10000).

### Using the **nyu-datasets.flights.m\_ticket\_prices** and the **nyu-datasets.flights.m\_airports** tables, find the _distinct_ routes (route is a distinct origin-destination pair) **where the origin and the destination are part of the same state**; in the output show the origin, dest, and the state of the airports.

_used in 1 semester(s) · ✓ verified (1358 rows)_

```sql
SELECT DISTINCT
  t.origin,
  t.dest,
  o.state AS state
FROM `nyu-datasets.flights.m_ticket_prices` t
JOIN `nyu-datasets.flights.m_airports` o ON t.origin = o.airport
JOIN `nyu-datasets.flights.m_airports` d ON t.dest = d.airport
WHERE o.state = d.state
ORDER BY state, origin, dest
```

**Hint:** Join m_ticket_prices to m_airports TWICE (once on origin, once on dest), keep rows where the two joined states are equal, and use SELECT DISTINCT to collapse to one row per origin-dest pair.
