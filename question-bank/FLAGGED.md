# Flagged questions (need human review)

44 of 196 questions were not auto-confirmed. Most are conceptual ER-modeling prompts (no SQL answer); a few are ambiguous or the adversarial verifier rejected the solution.

## Not SQL-answerable / conceptual (37)

### Can a customer have an unlimited number of plans?

_topic: General / other · used in 21 semester(s)_

Not a SQL task. This is a conceptual ER-modeling cardinality question about a cellular-operator data model (the same family of questions as 'Figure 2-24' in a database textbook). The entity/relationship it refers to (a Customer having Plans) does not exist in any of the 28 datasets in nyu-datasets - the 'northwind' hint is spurious (Northwind has Customers and Orders but no telecom 'plans'). Best-

### Can a customer exist without a plan?

_topic: General / other · used in 21 semester(s)_

Not a SQL task. Conceptual ER question about whether participation of Customer in the Customer-Plan relationship is optional (min cardinality 0) or mandatory (min cardinality 1). No such relationship exists in any nyu-datasets dataset; the 'northwind' hint is spurious. Placeholder SELECT provided; runs but does not answer the prompt. Conceptual answer depends on the diagram's min-cardinality marki

### Is it possible to create a plan without knowing who the customer is?

_topic: General / other · used in 21 semester(s)_

Not a SQL task. Conceptual ER question about whether a Plan instance can exist without an associated Customer (min cardinality of the Plan side). No Plan entity exists in any nyu-datasets dataset; the 'northwind' hint is spurious. Placeholder SELECT provided; runs but does not answer the prompt.

### Does the operator want to limit the plans that each handset can be linked to?

_topic: General / other · used in 21 semester(s)_

Not a SQL task. Conceptual ER question about a business rule limiting which Plans a Handset may link to. No Handset or Plan entity exists in any nyu-datasets dataset; the 'unknown' hint is correct that no dataset matches. Placeholder SELECT provided; runs but does not answer the prompt.

### Is it possible to maintain data regarding a handset without connecting it to a plan?

_topic: General / other · used in 21 semester(s)_

Not a SQL task. Conceptual ER question about whether a Handset can be maintained without an associated Plan (min cardinality 0 on the Handset side). No Handset/Plan entity exists in nyu-datasets. Placeholder SELECT provided; runs but does not answer the prompt.

### Can a handset be associated with multiple plans?

_topic: General / other · used in 21 semester(s)_

Not a SQL task. Conceptual ER question about whether one Handset can link to many Plans (max cardinality > 1). No Handset/Plan entity exists in nyu-datasets. Placeholder SELECT provided; runs but does not answer the prompt.

### Assume a handset type exists that can utilize multiple operating systems. Could this situation be accommodated within the model included in Figure 2-24?

_topic: General / other · used in 21 semester(s)_

Not a SQL task. Explicitly a textbook ER-diagram question (references 'Figure 2-24', from Hoffer's Modern Database Management). Asks whether a handset type with multiple operating systems can be accommodated - i.e., whether the diagram's HandsetModel-OperatingSystem cardinality allows many-to-many. No such entities exist in any nyu-datasets dataset. Placeholder SELECT provided; runs but cannot ans

### Is the company able to track a manufacturer without maintaining information about its handsets?

_topic: General / other · used in 21 semester(s)_

Not a SQL task. Conceptual ER question about whether a Manufacturer can be recorded without any associated Handsets (min cardinality 0 on the Manufacturer side). No Manufacturer or Handset entity exists in any nyu-datasets dataset; the 'music' hint is spurious (music has artist/album/track, not manufacturers/handsets). Placeholder SELECT provided; runs but does not answer the prompt.

### Can the same operating system be used on multiple handset types?

_topic: General / other · used in 21 semester(s)_

This is an ER-modeling conceptual question from the cellular_operator teaching example, not a SQL task. The dataset hint ('unknown') is wrong and no handset/operating-system tables exist in schemas.md. Answer is conceptual: yes, if OS-to-Handset is one-to-many, the same OS (e.g. Android) can run on many handset types. Cannot be executed.

### There are two relationships between Customer and Plan. Explain how they differ.

_topic: General / other · used in 21 semester(s)_

ER-modeling conceptual question from the cellular_operator example. Dataset hint 'northwind' is wrong (Northwind has no Customer-Plan relationship; it has no Plan table at all). No relevant tables in schemas.md. Two relationships between Customer and Plan would be modeled as two separate foreign-key/association links capturing different roles (e.g. a customer who is the billing/account holder of a

### Is it possible to link a handset to a specific customer in a plan with multiple customers?

_topic: General / other · used in 21 semester(s)_

ER-modeling conceptual question from the cellular_operator example. Dataset hint 'northwind' is wrong; no handset/plan/customer telecom tables exist in schemas.md. Answer is conceptual: only if the Handset entity carries a foreign key to a specific Customer (not just to the Plan) can a handset be linked to one customer within a multi-customer plan. Cannot be executed.

### Can the company track a handset without identifying its operating system?

_topic: General / other · used in 21 semester(s)_

ER-modeling conceptual question from the cellular_operator example. Dataset hint 'music' is wrong; the music dataset (album/artist/track/users) has nothing to do with handsets or operating systems, and no telecom tables exist in schemas.md. Answer is conceptual: yes, if the Handset-to-OS relationship is optional (handset's OS foreign key is nullable / partial participation). Cannot be executed.

### Output the first and last names of authors whose last name starts with the letter 'A'.

_topic: Filtering · used in 21 semester(s)_

AMBIGUOUS: no 'authors' table exists in any in-scope dataset (checked music, imdb, northwind, facebook, restaurants, collisions, flights). This question almost certainly belongs to a books/library dataset not provisioned here. Best-guess solution runs against imdb.actors (the canonical course table with first_name/last_name columns), but those are actors, not authors - so it does not faithfully an

### Using the results from step 3, identify the primary key for each table above.

_topic: Setup & basics · used in 14 semester(s)_

Not a pure SQL task -- BigQuery does not store/enforce primary-key constraints, so PKs must be reasoned from the schema (Q102 output). The provided query empirically tests candidate keys and confirms: artist -> artist_id; users -> user_id; track -> (artist_id, album_id, track_id); album -> (artist_id, album_id) [album_id alone is NOT unique]. tracks_played is an event/log table with no natural sin

### A customer can have one or more rates.

_topic: Final exam · used in 13 semester(s)_

This item is an entity-relationship modeling statement about a utility/cellular-operator domain (customer, meter, rate, reading, bill). It is not a SQL task. The entities referenced (customer/rate in this telecom sense) do not map to any table in the project: there is no cellular_operator dataset, and zero tables across all 28 datasets contain 'meter','rate','reading', or 'bill' in their names. Th

### A meter belongs to one and only one customer.

_topic: Final exam · used in 13 semester(s)_

Entity-relationship modeling statement (utility/cellular-operator domain), not a SQL task. No 'meter' or 'customer' (telecom-meter) table exists anywhere in nyu-datasets: no cellular_operator dataset and zero tables match 'meter'. Dataset hint 'northwind' is wrong. Best-guess SQL echoes the constraint so it runs; it does not answer against data.

### A meter has one or more rates.

_topic: Final exam · used in 13 semester(s)_

Entity-relationship modeling statement (utility/cellular-operator domain), not a SQL task. Entities 'meter'/'rate' have no table anywhere in the project (no cellular_operator dataset; zero name matches for meter/rate). Dataset hint 'unknown' confirms the generator could not place it. Best-guess SQL echoes the constraint so it executes.

### Each reading can be performed by zero, one, or more employees.

_topic: Final exam · used in 13 semester(s)_

Entity-relationship modeling statement (utility/cellular-operator domain), not a SQL task. No 'reading' or telecom 'employee' table maps here: northwind has Employees but no Reading/Meter/Bill, and zero tables anywhere match 'reading'. Dataset hint 'unknown'. Best-guess SQL echoes the constraint so it executes.

### Each bill is associated with zero or more customers.

_topic: Final exam · used in 13 semester(s)_

Entity-relationship modeling statement (utility/cellular-operator domain), not a SQL task. No 'bill' table exists anywhere in nyu-datasets (zero name matches for 'bill'; no cellular_operator dataset). Dataset hint 'northwind' is wrong. The stated cardinality is itself semantically odd (a bill tied to zero-or-more customers), reinforcing that this is a modeling/critique exercise, not a query. Best-

### Each bill contains one or more readings.

_topic: Final exam · used in 13 semester(s)_

Entity-relationship modeling statement (utility/cellular-operator domain), not a SQL task. Neither 'bill' nor 'reading' exists as a table anywhere in the project (zero name matches; no cellular_operator dataset). Dataset hint 'unknown'. Best-guess SQL echoes the constraint so it executes.

### The employee name is a unique identifier of the employee.

_topic: Final exam · used in 13 semester(s)_

Entity-relationship / data-modeling statement about a candidate key on Employee, not a SQL task. It is also a deliberately dubious claim (employee names are not reliably unique), suggesting a true/false or critique exam item. northwind.Employees exists but is the order-management domain, not the utility-meter scenario these items share (customer/meter/rate/reading/bill), so it is not the right tab

### A set of customers can be associated with the same rate\_id.

_topic: Final exam · used in 13 semester(s)_

Entity-relationship modeling statement (utility/cellular-operator domain), not a SQL task; it is essentially the inverse-direction reading of item 107 (Customer-Rate). No 'customer'(telecom)/'rate' table exists anywhere in nyu-datasets (zero matches for 'rate'; no cellular_operator dataset). Dataset hint 'northwind' is wrong. Best-guess SQL echoes the constraint so it executes.

### The Customer-Rate relationship is a one-to-one relationship.

_topic: Final exam · used in 13 semester(s)_

Not a SQL task and the dataset hint is wrong: the `northwind` dataset has only Categories, Customers, Employees, OrderDetails, Orders, Products, Shippers, Suppliers -- there is no Rate (or Meter) table. The Customer/Rate/Meter entities belong to the cellular_operator ER-modeling example (per CLAUDE.md), which is not loaded as a queryable BigQuery dataset. Conceptually a Customer-Rate relationship 

### The Customer-Meter relationship is a one-to-one relationship.

_topic: Final exam · used in 13 semester(s)_

Not a SQL task; dataset hint `northwind` is wrong -- it contains no Meter table (only the 8 standard Northwind tables). Customer/Meter come from the cellular_operator / utility-billing ER example referenced in CLAUDE.md, which is not a loaded BigQuery dataset. Conceptually a customer can own multiple meters, so 'one-to-one' is generally FALSE. Cannot be verified against data.

### An Agent can only list one house at a time.

_topic: Final exam · used in 7 semester(s)_

Not a SQL exercise. It is a true/false ER-modeling statement (likely from a final-exam ER diagram about a real-estate domain with Agent/House/Lot/Building/Dwelling entities). No real-estate dataset exists in the provided schemas (only restaurants, flights, music, facebook, collisions, imdb, northwind), so it cannot be validated against data. The dataset hint 'northwind' is wrong. Provided placehol

### The HasBuilding relationship signifies that a Lot must have one Building.

_topic: Final exam · used in 7 semester(s)_

Not a SQL exercise. It is a true/false ER-modeling statement about a real-estate schema (Lot / Building / HasBuilding relationship). No such dataset exists in the provided schemas, so it cannot be validated against BigQuery. The 'northwind' dataset hint is incorrect. Placeholder SQL only.

### A Dwelling is uniquely identified by its UnitNumber attribute.

_topic: Final exam · used in 7 semester(s)_

Not a SQL exercise. It is a true/false ER-modeling statement about whether UnitNumber is a unique identifier of the Dwelling entity. No real-estate dataset is present in the provided schemas, so it cannot be validated against data. The 'northwind' dataset hint is incorrect. Placeholder SQL only.

### The SaleTransaction entity must always have a corresponding Listing entity.

_topic: Final exam · used in 7 semester(s)_

Not a SQL exercise. This is a conceptual ER-diagram true/false statement from the final exam about a real-estate schema (SaleTransaction, Listing, etc.). No matching tables exist in any nyu-datasets dataset (restaurants, flights, music, facebook, collisions, imdb, northwind), so it cannot be validated against data. Dataset hint 'unknown' is correct in that there is no backing dataset.

### Each SaleTransaction can involve multiple Owners who buy the Dwelling

_topic: Final exam · used in 7 semester(s)_

Not a SQL exercise. Conceptual ER-diagram statement from the final exam about a real-estate schema (SaleTransaction, Owner, Dwelling). No backing tables exist in any nyu-datasets dataset, so it cannot be validated against data.

### The Contains relationship between Building and Dwelling is one-to-one.

_topic: Final exam · used in 7 semester(s)_

Not a SQL exercise. Conceptual ER-diagram true/false statement from the final exam about a real-estate schema (Building, Dwelling, Contains). No backing tables exist in any nyu-datasets dataset, so it cannot be validated against data. (Semantically a Building usually contains many Dwellings, making the stated 1:1 false, but this is a modeling judgment, not a data query.)

### The ListingSold relationship between SaleTransaction and Listing indicates that not all Listings result in SaleTransactions.

_topic: Final exam · used in 7 semester(s)_

Not a SQL exercise. Conceptual ER-diagram statement from the final exam about a real-estate schema (SaleTransaction, Listing, ListingSold). No backing tables exist in any nyu-datasets dataset, so it cannot be validated against data.

### A SaleTransactionOwner must have at least one participating Owner.

_topic: Final exam · used in 7 semester(s)_

Not a SQL exercise. Conceptual ER-diagram statement from the final exam about a real-estate schema (SaleTransactionOwner associative entity, Owner). No backing tables exist in any nyu-datasets dataset, so it cannot be validated against data.

### An Agent can assist buyers in multiple SaleTransactions, but a SaleTransaction can only involve one buyer Agent.

_topic: Final exam · used in 7 semester(s)_

Not a SQL exercise. Conceptual ER-diagram statement from the final exam about a real-estate schema (Agent, SaleTransaction). No backing tables exist in any nyu-datasets dataset, so it cannot be validated against data.

### It is possible to use the LotID to identify a Building entity.

_topic: Final exam · used in 7 semester(s)_

Not a SQL exercise. Conceptual ER-diagram true/false statement from the final exam about a real-estate schema (Building, LotID). No backing tables exist in any nyu-datasets dataset, so it cannot be validated against data.

### Draw the relational schema of the nyu-datasets.music database (e.g., using ERD Plus).

_topic: Setup & basics · used in 5 semester(s)_

Not a runnable SQL question: it asks the student to draw the relational schema (e.g. in ERD Plus). The provided SQL is only a surrogate that lists every table/column in the music dataset so the student can build the diagram; it ran cleanly (19 columns across 5 tables) but does not 'answer' the drawing task, hence verified=false.

### Identify the primary key for each table above.

Remember that some tables have _composite_ primary keys.

_topic: Setup & basics · used in 4 semester(s)_

Not answerable as a SQL query: it asks the student to identify primary keys of the tables 'above' (a schema printed in the exercise that is not part of this input), and the dataset is 'unknown'. BigQuery has no PRIMARY KEY metadata to query here. The surrogate SQL (lists columns; shown for the music dataset) only helps a reader reason about candidate keys. verified=false due to missing context and

### ![](https://www.dropbox.com/s/d5kkd19uh4esw59/water_utility_ER.png?raw=1)

1.  A customer can have one or more rates. True or False?
2.  A meter belongs to one and only one customer. True or False?
3.  A meter has one or more rates. True or False?
4.  Each reading can be performed by zero, one, or more employees.  True or False?
5.  Each bill is associated with zero or more customers.  True or False?
6.  Each bill contains one or more readings.  True or False?
7.  The employee name is a unique identifier of the employee.  True or False?
8.  A set of customers can be associated with the same rate\_id. True or False?
9.  The Customer-Rate relationship is a one-to-one relationship. True or False?
10.  The Customer-Meter relationship is a one-to-one relationship. True or False?

_topic: Final exam · used in 2 semester(s)_

This is a 10-part True/False ER-modeling question about an external water_utility ER diagram image (Dropbox link). It is NOT a SQL task and does not map to any table in the dataset; the 'northwind' dataset hint is spurious. Set verified=false. No data query can answer it.

## Verifier rejected the proposed solution (7)

### Find all albums with a title that begins with a character greater than E (not inclusive of albums that start with E) but less than S (again, not inclusive of albums that start with S).

_dataset: music · topic: Filtering_

- Issue: Question requires filtering on the FIRST CHARACTER of the title ('begins with a character greater than E ... not inclusive of albums that start with E'). The solution compares the whole string (album_name > 'E'), so 'Exile On Main Street' — which begins with 'E' — evaluates as > 'E' and is wrongly INCLUDED. The hint's claim that titles starting with 'E' are excluded automatically is false. Correct result has 8 rows, not 9.
- Proposed:
```sql
SELECT album_id, album_name
FROM `nyu-datasets.music.album`
WHERE album_name > 'E' AND album_name < 'S'
ORDER BY album_name
```
- Suggested fix:
```sql
SELECT album_id, album_name
FROM `nyu-datasets.music.album`
WHERE SUBSTR(album_name, 1, 1) > 'E' AND SUBSTR(album_name, 1, 1) < 'S'
ORDER BY album_name
```

### For every user, show the total tracks they played and the total amount of time they listened. Assume that each track is played fully. List also the users that have not played any track

_dataset: music · topic: Aggregations_

- Issue: Wrong join key causes ~10x fan-out. The `track` table is keyed by (track_id, album_id, artist_id) — it has 153 rows but only 18 distinct track_id values (track_id is just a within-album position). Joining tracks_played to track on track_id alone matches each play to every track row sharing that track_id, inflating both COUNT and SUM(time) ~10x. E.g. user 3 (Genevie Williams) has 178 real plays / 847.84 time but the solution reports 1893 / 10060.6. It also changes the ORDER BY total_tracks DESC ranking (users 10 and 2 swap). LEFT JOIN/IFNULL logic is fine; only the join condition is wrong.
- Proposed:
```sql
SELECT u.user_id, u.first_name, u.last_name, COUNT(tp.track_id) AS total_tracks, IFNULL(SUM(t.time), 0) AS total_time
FROM `nyu-datasets.music.users` u
LEFT JOIN `nyu-datasets.music.tracks_played` tp ON u.user_id = tp.user_id
LEFT JOIN `nyu-datasets.music.track` t ON tp.track_id = t.track_id
GROUP BY u.user_id, u.first_name, u.last_name
ORDER BY total_tracks DESC
```
- Suggested fix:
```sql
SELECT u.user_id, u.first_name, u.last_name, COUNT(tp.track_id) AS total_tracks, IFNULL(SUM(t.time), 0) AS total_time
FROM `nyu-datasets.music.users` u
LEFT JOIN `nyu-datasets.music.tracks_played` tp ON u.user_id = tp.user_id
LEFT JOIN `nyu-datasets.music.track` t ON tp.track_id = t.track_id AND tp.album_id = t.album_id AND tp.artist_id = t.artist_id
GROUP BY u.user_id, u.first_name, u.last_name
ORDER BY total_tracks DESC
```

### Show the name of each track and the first and last time it was played. Include tracks that were not played at all.

_dataset: music · topic: Aggregations_

- Issue: Same composite-key bug. Tracks are identified by (track_id, album_id, artist_id); track_id alone is non-unique (153 rows, 18 distinct track_id, up to 13 different track_names per track_id). Joining/grouping on track_id alone collapses the 153 real tracks into name-based groups (152 rows) and matches each track's plays to ALL plays sharing that track_id regardless of album/artist, so MIN/MAX are wrong. E.g. the real 'Elegia' (track_id 0, album 1, artist 1) has 3 plays with first=1.67033942E9/last=1.671923469E9, but the solution reports its first/last as the global span over 91 plays. With the correct join there are 153 tracks and 16 were never played (NULL first/last), contradicting the claim that all 153 have a play.
- Proposed:
```sql
SELECT t.track_name, MIN(tp.played_on) AS first_played, MAX(tp.played_on) AS last_played
FROM `nyu-datasets.music.track` t
LEFT JOIN `nyu-datasets.music.tracks_played` tp ON t.track_id = tp.track_id
GROUP BY t.track_id, t.track_name
ORDER BY first_played
```
- Suggested fix:
```sql
SELECT t.track_name, MIN(tp.played_on) AS first_played, MAX(tp.played_on) AS last_played
FROM `nyu-datasets.music.track` t
LEFT JOIN `nyu-datasets.music.tracks_played` tp ON t.track_id = tp.track_id AND t.album_id = tp.album_id AND t.artist_id = tp.artist_id
GROUP BY t.track_id, t.album_id, t.artist_id, t.track_name
ORDER BY first_played
```

### Flights: Using the table **flights.m\_ticket\_prices**, for each carrier, report the number of routes they maintain, the number of airports their flights leave from, and their average fare per mile. Report results only for carriers having more than 20,000 passengers across all their flights.

_Hint: 11 rows in the outcome_

_dataset: flights · topic: Final exam_

- Issue: Result does not match the prompt's explicit 'Hint: 11 rows'. The technique (GROUP BY carrier; COUNT(DISTINCT route), COUNT(DISTINCT origin), AVG(fare_per_mile); HAVING SUM(passengers_estimated) > threshold) is correct, but the literal threshold 20000 returns 44 rows, not 11. Per-carrier passenger totals in the current data are in the hundreds of millions (11th carrier NW ~221.5M, 12th G4 ~184.5M), so exactly 11 carriers qualify only at a threshold around 200,000,000 — the authored data is ~10,000x larger than the 20,000 in the prompt. As written the deliverable row count is wrong.
- Proposed:
```sql
SELECT ticketing_carrier AS carrier,
       COUNT(DISTINCT route) AS num_routes,
       COUNT(DISTINCT origin) AS num_airports_departed,
       AVG(fare_per_mile) AS avg_fare_per_mile
FROM `nyu-datasets.flights.m_ticket_prices`
GROUP BY ticketing_carrier
HAVING SUM(passengers_estimated) > 20000
ORDER BY carrier
```
- Suggested fix:
```sql
SELECT ticketing_carrier AS carrier,
       COUNT(DISTINCT route) AS num_routes,
       COUNT(DISTINCT origin) AS num_airports_departed,
       AVG(fare_per_mile) AS avg_fare_per_mile
FROM `nyu-datasets.flights.m_ticket_prices`
GROUP BY ticketing_carrier
HAVING SUM(passengers_estimated) > 200000000
ORDER BY carrier
```

### Using the **SingUpsAsOf** and **InactiveAsOf**, calculate the total\_active users for each date. We define total active users as the total signups up to that date, minus the total users that have been inactive up to that date.

_dataset: facebook · topic: Window functions_

- Issue: Wrong join key/grain produces an incorrect total_inactive. SignUpsAsOf and InactiveAsOf are joined on exact date equality (i.LastUpdate = s.MemberSince), but InactiveAsOf is a cumulative running total along the inactivity-date axis. On any reporting date that is NOT also a date on which someone went inactive, i.total_inactive is NULL -> IFNULL forces it to 0, so total_inactive collapses to 0 and total_active wrongly equals total_signups for that date. Verified: e.g. 2004-07-01/03/04 report total_inactive=0 (so active=signups) when the true cumulative inactive is 2/3/3. The prompt requires 'total users inactive UP TO that date', i.e. a running total that must carry forward on every date, not just on inactive-event dates.
- Proposed:
```sql
WITH SignUpsAsOf AS (
  SELECT MemberSince, SUM(signups) OVER (ORDER BY MemberSince) AS total_signups
  FROM (
    SELECT DATE(MemberSince) AS MemberSince, COUNT(*) AS signups
    FROM `nyu-datasets.facebook.Profiles`
    WHERE MemberSince IS NOT NULL
    GROUP BY MemberSince
  )
),
InactiveAsOf AS (
  SELECT LastUpdate, SUM(inactives) OVER (ORDER BY LastUpdate) AS total_inactive
  FROM (
    SELECT DATE(LastUpdate) AS LastUpdate, COUNT(*) AS inactives
    FROM `nyu-datasets.facebook.Profiles`
    WHERE LastUpdate IS NOT NULL
    GROUP BY LastUpdate
  )
)
SELECT
  s.MemberSince AS the_day,
  s.total_signups,
  IFNULL(i.total_inactive, 0) AS total_inactive,
  s.total_signups - IFNULL(i.total_inactive, 0) AS total_active
FROM SignUpsAsOf s
LEFT JOIN InactiveAsOf i ON i.LastUpdate = s.MemberSince
ORDER BY s.MemberSince;
```
- Suggested fix:
```sql
WITH SignUpsOn AS (
  SELECT DATE(MemberSince) AS the_day, COUNT(*) AS signups
  FROM `nyu-datasets.facebook.Profiles`
  WHERE MemberSince IS NOT NULL
  GROUP BY the_day
),
InactiveOn AS (
  SELECT DATE(LastUpdate) AS the_day, COUNT(*) AS inactives
  FROM `nyu-datasets.facebook.Profiles`
  WHERE LastUpdate IS NOT NULL
  GROUP BY the_day
),
Days AS (
  SELECT the_day FROM SignUpsOn
  UNION DISTINCT
  SELECT the_day FROM InactiveOn
),
Joined AS (
  SELECT
    d.the_day,
    IFNULL(s.signups, 0) AS signups,
    IFNULL(i.inactives, 0) AS inactives
  FROM Days d
  LEFT JOIN SignUpsOn s ON s.the_day = d.the_day
  LEFT JOIN InactiveOn i ON i.the_day = d.the_day
)
SELECT
  the_day,
  SUM(signups) OVER (ORDER BY the_day) AS total_signups,
  SUM(inactives) OVER (ORDER BY the_day) AS total_inactive,
  SUM(signups) OVER (ORDER BY the_day)
    - SUM(inactives) OVER (ORDER BY the_day) AS total_active
FROM Joined
ORDER BY the_day;
```

### For every distinct value in `PoliticalViews`, report the average number of favorite books its members list.

_dataset: facebook · topic: Final exam_

- Issue: Bad NULL handling: AVG(b.cnt) silently excludes members who list zero favorite books (their cnt is NULL after the LEFT JOIN, and AVG ignores NULLs). The prompt asks for 'the average number of favorite books its members list' over all members of each PoliticalViews group, so members with no books must count as 0. As written the query averages only over book-listing members, materially inflating every group (e.g. Liberal 5.87 vs correct 4.83). The LEFT JOIN is pointless if NULLs are then dropped by AVG.
- Proposed:
```sql
SELECT p.PoliticalViews, AVG(b.cnt) AS AvgFavoriteBooks
FROM `nyu-datasets.facebook.Profiles` p
LEFT JOIN (
  SELECT ProfileID, COUNT(*) AS cnt
  FROM `nyu-datasets.facebook.FavoriteBooks`
  GROUP BY ProfileID
) b ON p.ProfileID = b.ProfileID
GROUP BY p.PoliticalViews
ORDER BY p.PoliticalViews
```
- Suggested fix:
```sql
SELECT p.PoliticalViews, AVG(IFNULL(b.cnt, 0)) AS AvgFavoriteBooks
FROM `nyu-datasets.facebook.Profiles` p
LEFT JOIN (
  SELECT ProfileID, COUNT(*) AS cnt
  FROM `nyu-datasets.facebook.FavoriteBooks`
  GROUP BY ProfileID
) b ON p.ProfileID = b.ProfileID
GROUP BY p.PoliticalViews
ORDER BY p.PoliticalViews
```

### For every _date_ listed in the tracked\_played table (_**not**_ date _\+ time_), show the artist's name, the artist id, the number of users that listened to the artist, and the total amount of time users listened to the artist. Assume that each track is played fully.

_dataset: music · topic: Aggregations_

- Issue: Fan-out bug: track_id is NOT unique in the track table (153 rows but only 18 distinct track_id; the real key is the composite artist_id+album_id+track_id, 153 distinct). Joining tracks_played to track ON track_id ALONE multiplies each play by ~12 matching track rows, so SUM(t.time) (total_listen_time) is inflated ~12x: the query's grand total is 65880.72 vs the correct 5564.87, and every per-row total_listen_time value is wrong. num_users (COUNT DISTINCT) and the date/artist grouping are fine. (Side note: the result actually has 116 date-by-artist rows, not the claimed 81.) Fix by joining on the full composite key.
- Proposed:
```sql
SELECT
  DATE(tp.played_on)            AS play_date,
  ar.artist_name,
  ar.artist_id,
  COUNT(DISTINCT tp.user_id)   AS num_users,
  SUM(t.time)                  AS total_listen_time
FROM `nyu-datasets.music.tracks_played` tp
JOIN `nyu-datasets.music.track`  t  ON tp.track_id  = t.track_id
JOIN `nyu-datasets.music.artist` ar ON tp.artist_id = ar.artist_id
GROUP BY play_date, ar.artist_name, ar.artist_id
ORDER BY play_date, ar.artist_id
```
- Suggested fix:
```sql
SELECT
  DATE(tp.played_on)            AS play_date,
  ar.artist_name,
  ar.artist_id,
  COUNT(DISTINCT tp.user_id)   AS num_users,
  SUM(t.time)                  AS total_listen_time
FROM `nyu-datasets.music.tracks_played` tp
JOIN `nyu-datasets.music.track`  t
  ON tp.track_id = t.track_id
 AND tp.album_id = t.album_id
 AND tp.artist_id = t.artist_id
JOIN `nyu-datasets.music.artist` ar ON tp.artist_id = ar.artist_id
GROUP BY play_date, ar.artist_name, ar.artist_id
ORDER BY play_date, ar.artist_id
```
