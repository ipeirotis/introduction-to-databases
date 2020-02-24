# Relational Databases and SQL

This is a brief introductory module to relational databases and SQL. It mainly targets people that are interested in learning SQL, and does not cover topics such as indexing, transactions, stored procedures, etc.

## Indicative Schedule

### Session 1: Entity-Relationship Model and Relational Databases

* Entities, Primary Keys, and Attributes
* Relations
* Cardinality: One-to-One, One-to-Many, Many-to-Many
* From ER Diagram to a Relational Database
* (Optional) SQL Statements for Creating Tables
* (Optional) Populating a Database with Data

##### In class: Artist-Gallery-Painting example

##### In class: From Spreadsheet to a Normalized Database

##### In class: Water Utility Company example



### Session 2: Selection Queries

* Understand the design of our example databases
* Navigating a Database: `USE`, `SHOW TABLES`, `DESCRIBE`
* Selection queries: `SELECT *`, `SELECT column`, `column AS`, 
* Selection queries: `DISTINCT`, `ORDER BY`, `LIMIT`


### Session 3: Filtering Queries

* `WHERE` clause
* Boolean conditions: `AND`, `OR`, `NOT`, `BETWEEN`
* Containment condition: `IN`, 
* Approximate matches: `LIKE`
* `NULL` values

##### In class: Find People that Live in "New York" (exploration for data cleaning)


### Session 4: JOIN queries

* Inner Joins
* Self Joins
* Outer Joins


### Session 5: Aggregate queries

* Aggregation functions (COUNT, COUNT DISTINC, SUM, AVG, MAX, MIN, STDEV, CONCAT)
* GROUP BY on a single attribute
* GROUP BY on multiple attributes
* HAVING clause
* Integrated JOIN and GROUP BY queries

### Session 6: Subqueries

* Views and temporary tables
* The `WITH` clause
* Subqueries
* Variables

##### In-class Exercise: Compare Tastes Across Demographic Segments

##### In-class Exercise: Music Recommendation Service

_Note: The in-class activities in this section usually take longer time than planned. I often go faster
in the prior sessions, so that I can start describing the concept of veiw_

### Misceallaneous

* Functions
* UNION
* CASE
* ANY/ALL
* ROLLUP



## Additional Resources for Learning SQL

* [Introduction to SQL](https://www.khanacademy.org/computing/computer-programming/sql) from Khan Academy. Introductory course, with videos explaining the various aspects of SQL.
* [W3Schools SQL](http://www.w3schools.com/sql/): An introduction to SQL with hands-on examples
* [Learn SQL](https://www.codecademy.com/learn/learn-sql) and [SQL: Analyzing Business Metrics](https://www.codecademy.com/learn/sql-analyzing-business-metrics): Two short, self-directed online course from Code Academy
* [SQL Tutorial](http://www.w3resource.com/sql/tutorials.php) 
* [Learning MySQL](http://shop.oreilly.com/product/9780596008642.do): A useful textbook for those interested in learning more about SQL
* [W3 Resource](https://www.w3resource.com/sql/tutorials.php) and [SQL exercises](https://www.w3resource.com/sql-exercises/)
* [Become a SELECT Star!](https://gumroad.com/l/sql-zine) by Julia Evans:  A very useful e-zine that summarizes in a cartoonish way most of the SQL concepts that we cover in class. Worth the $12.
* [How to Teach People SQL](https://dataschool.com/how-to-teach-people-sql/): Great visualizations for the various SQL operations that we learn.

## Useful Pointers

* [Best practices for SQL](https://data36.com/sql-best-practices-data-analysts/): A set of useful guidelines for writing readable SQL statements.


