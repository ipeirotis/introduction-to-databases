# Final Exam

- **Brightspace id:** 499805
- **Start:** 2026-06-02T19:30:00.000Z
- **Due:** 2026-06-08T03:59:59.000Z
- **End:** 2026-06-08T03:59:59.000Z
- **Active:** true
- **Attempts:** 1
- **Questions:** 22

## Description

The exam has two parts.  
  
In the first part, you have to answer some True/False questions about an ER diagram. In the second part, you have to construct SQL queries to answer the questions. We provide hints about the number of rows in the answer to give you a bit of confidence on whether you got the answer right or not.  
  
Notice that the exam is tightly timed, so do not spend all your time on a single query if you feel something is wrong. We will provide generous partial credit if your SQL query was in the right direction.  
  
You have 120 minutes for the exam, plus 5 minutes of "grace time", to wrap up, validate that everything is correct, and so on. Roughly speaking, you need to calculate around a minute per point.

## Questions (22)

### Q1

An Agent can only list one house at a time.

### Q2

The HasBuilding relationship signifies that a Lot must have one Building.

### Q3

A Dwelling is uniquely identified by its UnitNumber attribute.

### Q4

The SaleTransaction entity must always have a corresponding Listing entity.

### Q5

Each SaleTransaction can involve multiple Owners who buy the Dwelling

### Q6

The Contains relationship between Building and Dwelling is one-to-one.

### Q7

The ListingSold relationship between SaleTransaction and Listing indicates that not all Listings result in SaleTransactions.

### Q8

A SaleTransactionOwner must have at least one participating Owner.

### Q9

An Agent can assist buyers in multiple SaleTransactions, but a SaleTransaction can only involve one buyer Agent.

### Q10

It is possible to use the LotID to identify a Building entity.

### Q11 — Flights: Fare per mile over time

Using `nyu-datasets.flights.m_ticket_prices`, calculate the average fare per mile for each year-quarter, both unweighted and weighted by passenger count. Order results chronologically.

### Q12 — Flights: Routes that start and end in the same state

Using the **nyu-datasets.flights.m\_ticket\_prices** and the **nyu-datasets.flights.m\_airports** tables, find the _distinct_ routes in 2024 (route is a distinct origin-destination pair) **where the origin and the destination are part of the same state**; in the output show the origin, dest, and the state of the airports.

### Q13 — Flights: Statistics about states of the origin airport

Flights: For **each state of the origin airport**, calculate the following metrics: the number of origin airports in the state, the number of carriers operating flights that originate from the state, the total number of passengers originating from the state, and the average fare per mile. Use the **m\_ticket\_prices** and the **m\_airports** tables to find the information that you need.

### Q14 — Flights: Carrier statistics

Flights: Using the table **flights.m\_ticket\_prices**, for each ticketing carrier and year 2024, report the number of routes they maintain, the number of airports their flights leave from, and their average fare per mile. Report results only for carriers having more than 200,000 passengers across all their flights.

### Q15 — Flights: Who are the top carriers by total revenue?

Using the `nyu-datasets.flights.m_ticket_prices` table, write a query to analyze the performance of each ticketing carrier for the year 2024.

For each ticketing carrier, calculate the following metrics:

1.  **Number of origin airports served** (as `num_airports`)
2.  **Number of unique routes operated** (as `num_routes`)
3.  **Total estimated revenue in millions** (as `total_estimated_revenue_M`) — rounded to 2 decimal places
4.  **Total passengers in millions** (as `total_passengers_M`) — rounded to 2 decimal places
5.  **Average revenue per passenger** (as `revenue_per_passenger`)

Present the results ordered by total estimated revenue from highest to lowest.

### Q16 — Most-Popular Hobbies

Write a query that returns the five hobbies that appear in the largest number of profiles, ordered from most to least popular. Show the hobby and the count of distinct `ProfileID`s.

### Q17 — Relationship Status by Sex

Produce a table with columns `Sex`, `RelationshipStatus`, and `ProfilesCount`. Count every profile that has an entry in the `Relationship` table. Order by `Sex`, then by the count descending. Do not show results for the profiles with NULL in the Sex column.

### Q18 — Most popular concentrations

For each `Concentration` in the `Concentrations` table, output the concentration name and the count of distinct profiles who listed it.  
Include concentrations listed by more than 100 distinct profiles.

### Q19 — Most popular Music across Eminem fans

For each Music entry, calculate the number of ProfileIDs that like each music entry, considering only students that listed Eminem in their FavoriteMusic

### Q20 — Male students interested in dating males

In the Facebook database, find the Male students, who are "InterestedIn" Men (according to the Orientation table), and are "LookingFor" Dating (according to the LookingFor table). List the ProfileID of the student, their Name, and their Birthday, eliminating students that have NULL values for their Birthday.  
  
Hint: 212 rows

### Q21 — Book likes per Political View

For every distinct value in `PoliticalViews`, report the average number of favorite books its members list.

### Q22 — Report of likes per user and each category (books, movies, tv shows, music)

For each ProfileID, show the number of music likes, tv show likes, book likes, and movie likes.  
  
(Warning: Difficult question; you may want to leave it last)
