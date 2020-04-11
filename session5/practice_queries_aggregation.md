# Aggregation, practice queries

## Restaurant Database

GROUP BY, aggregation functions (MAX, MIN, COUNT, etc.)
Review also HAVING (condition for the GROUP BY) and ORDER

1. How many Manhattan restaurants are listed in your database;
2. Output the affiliation (or '-' for freelancers) and how many critics are associated with this affiliation;
3. Output the critic id together with the maximal star rating ever issued by this critic;
4. Output the critic id and the restaurant code together with the maximal star rating ever issued by this critic for this restaurant;
5. For every borough, cuisine pair output the minimal price and order the output by borough in the ascending order (consider only the restaurants outside of Manhattan);
6. For every borough, cuisine pair output the minimal price where the minimal price is greater than $100;
7. For every borough, cuisine pair output the minimal price where the minimal price is greater than $100 and order the output by the price value in the descending order.