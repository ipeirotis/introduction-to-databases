# Assignment 2: Navigating, Selecting, and Filtering (CarConnect)

> **Draft.** Proposed replacement for Assignments 2a (Selection) and 2b
> (Filtering). Same SQL scope, but on the CarConnect database you designed in
> Assignment 1a, and with a "review the assistant" section instead of pure
> syntax drills. Solutions live in the private answers repo.

All queries are for the `nyu-datasets.carconnect_teaching` database. The
schema is documented in [`schemas/carconnect_teaching.md`](../schemas/carconnect_teaching.md).

**How to work.** The tables are tiny (4 vehicles, 8 listings, 8 sales), so
before you run each query, write down how many rows you expect and why. Then
run it. If the count differs, figure out which of the two was wrong before
moving on. You may use any AI assistant to help write queries, but you are
responsible for checking that the query answers the question that was asked.

---

## Part A: Navigation (2 questions)

### A1

List the tables in the `carconnect_teaching` dataset and, for each table,
name its primary key. The tables declare their keys, so you can read them
from the metadata views: `carconnect_teaching.INFORMATION_SCHEMA.TABLE_CONSTRAINTS`
lists each constraint and its type (`PRIMARY KEY` or `FOREIGN KEY`), and
`carconnect_teaching.INFORMATION_SCHEMA.KEY_COLUMN_USAGE` lists the columns
that make up each constraint. One table has a primary key made of two
columns; make sure your answer shows both. (`INFORMATION_SCHEMA.COLUMNS`
shows column names and types but not which columns are keys.)

### A2

Compare the implemented schema with the ER diagram and relational schema you
submitted for Assignment 1a. Name **one** place where the implementation
differs from your design (a table, a column, or a key) and explain in two or
three sentences what that difference changes about the queries you would
write. There is no single right answer; the point is to read a schema you
did not write.

---

## Part B: Requests from the CarConnect operations manager (7 questions)

Each item is a request as the manager would phrase it. Write one query per
request.

### B1

"Give me the inventory list: make, model, and model year of every vehicle,
newest first. Call the year column `year`."

### B2

"Which makes do we carry? I want one row per make, nothing else."

### B3

"What are our three cheapest listings right now? Show the listing id, the
VIN, and the asking price."

### B4

"Pull every listing that ended without a sale, meaning its status is either
Expired or Withdrawn. Show the listing id, the VIN, and the status."

### B5

"Show the listings posted in September 2026 with an asking price of at most
21,000. Show listing id, date posted, and asking price."

### B6

"How many of our sales closed without a buyer-side agent? List them:
transaction id, sale date, and the buyer agent column so I can see it is
empty."

First try the condition with `= NULL` and note what happens. Then write the
correct condition.

### B7

"One of our customers is asking about a car whose VIN ends in `2`. Show every
listing for a VIN ending in `2`, with the listing id, VIN, and status."

---

## Part C: Review the assistant (5 questions)

An analyst asked an AI assistant to write each of the following queries. For
each one, decide whether the query answers the request. If it does, say so
and explain in one sentence why. If it does not, explain what is wrong and
submit a corrected query. **At least one of the five is correct as written.**

### C1

**Request:** "Show the listings that are no longer available to buyers."

**Assistant's query:**

```sql
SELECT listing_id, vin, status
FROM `nyu-datasets.carconnect_teaching.listings`
WHERE status = 'Sold'
```

**Assistant's explanation:** "A listing is no longer available once the car
has been sold, so we filter on the Sold status."

### C2

**Request:** "List the sales handled by buyer agent 1 or buyer agent 2, and
also the sales that had no buyer agent at all."

**Assistant's query:**

```sql
SELECT transaction_id, sale_date, buyer_agent_id
FROM `nyu-datasets.carconnect_teaching.sale_transactions`
WHERE buyer_agent_id IN (1, 2, NULL)
```

**Assistant's explanation:** "The IN operator checks membership in the list,
and including NULL in the list picks up the sales with no agent."

### C3

**Request:** "Show the listings with an asking price between 14,000 and
21,000, inclusive."

**Assistant's query:**

```sql
SELECT listing_id, asking_price
FROM `nyu-datasets.carconnect_teaching.listings`
WHERE asking_price > 14000 AND asking_price < 21000
```

**Assistant's explanation:** "Two comparisons bound the price on both sides."

### C4

**Request:** "Which listing was posted most recently?"

**Assistant's query:**

```sql
SELECT listing_id, date_posted
FROM `nyu-datasets.carconnect_teaching.listings`
ORDER BY date_posted
LIMIT 1
```

**Assistant's explanation:** "Sorting by date and taking the first row gives
the most recent listing."

### C5

**Request:** "Show the vehicles currently stored at dealership 2, newest
model year first."

**Assistant's query:**

```sql
SELECT vin, make, model, model_year
FROM `nyu-datasets.carconnect_teaching.vehicles`
WHERE current_dealership_id = 2
ORDER BY model_year DESC
```

**Assistant's explanation:** "Filter on the current dealership, then sort by
model year descending."

---

## What's next

Module 3 uses the same database for joins: reconstructing a vehicle's
ownership history from `sale_transactions` and `transaction_buyers`, and
matching listings to the sales they produced.
