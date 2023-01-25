[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/ipeirotis/introduction-to-databases/blob/master/)

# Relational Databases and SQL

This is a brief introductory module to relational databases and SQL. It mainly targets people that are interested in learning SQL, and does not cover topics such as indexing, transactions, stored procedures, etc.

## Videos for the class 

[Videos for the class](https://www.youtube.com/playlist?list=PLqAPn_b_yx0QcOgEvAKQQ5yzplFI-FOQI)

## Indicative Schedule

### Session 1: Entity-Relationship Model and Relational Databases

* Entities, Primary Keys, and Attributes
* Relations
* Cardinality: One-to-One, One-to-Many, Many-to-Many
* From ER Diagram to a Relational Schema
* (Optional) SQL Statements for Creating Tables
* (Optional) Populating a Database with Data
* Activity 1: Artist-Gallery-Painting example
* Activity 2: Creating a relational schema from an ER diagram
* Activity 3: From Spreadsheet to a Normalized Database


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
* CASE WHEN clause
* Attribute-level functions: NULL functions, date functions, etc.
* Activity: Find People that Live in "New York" (exploration for data cleaning)


### Session 4: JOIN queries

* Inner Joins
* Self Joins
* Outer Joins
* Antinoins and Semijoins

### Session 5: Aggregate queries

* Aggregation functions (COUNT, COUNT DISTINC, SUM, AVG, MAX, MIN, STDEV, CONCAT)
* GROUP BY on a single attribute
* GROUP BY on multiple attributes
* HAVING clause
* Integrated JOIN and GROUP BY queries

### Session 6: Subqueries

* Subqueries with single-value results
* Semijoins and Antijoins using subqueries with the IN clause
* Subqueries with derived tables
* Comparison of WITH, temporary tables, views, and tables
* Activity 1: Music recommendations
* Activity 2: Compare Tastes Across Demographic Segments

### Session 7: Window queries

* Window definition: `OVER(ORDER BY)`
* Ranking window functions: `RANK`, `DENSE_RANK`, etc
* Aggregation functions and windows `OVER(PARITION BY ORDER BY)`
* Offset window functions: `LEAD`, `LAG` etc
* Aggregation functions and windows
* Frame definitions and rolling aggregations


### Misceallaneous

* Functions
* UNION
* CASE
* ANY/ALL
* ROLLUP



## Additional Resources for Learning SQL

* [StrataScratch](https://platform.stratascratch.com/coding) and [Leetcode](https://leetcode.com/problemset/database/): SQL Interview questions for data science positions in many tech companies
* [Introduction to SQL](https://www.khanacademy.org/computing/computer-programming/sql) from Khan Academy. Introductory course, with videos explaining the various aspects of SQL.
* [W3Schools SQL](http://www.w3schools.com/sql/): An introduction to SQL with hands-on examples
* [Learn SQL](https://www.codecademy.com/learn/learn-sql) and [SQL: Analyzing Business Metrics](https://www.codecademy.com/learn/sql-analyzing-business-metrics): Two short, self-directed online course from Code Academy
* [SQL Tutorial](http://www.w3resource.com/sql/tutorials.php) 
* [Learning MySQL](http://shop.oreilly.com/product/9780596008642.do): A useful textbook for those interested in learning more about SQL
* [W3 Resource](https://www.w3resource.com/sql/tutorials.php) and [SQL exercises](https://www.w3resource.com/sql-exercises/)
* [Become a SELECT Star!](https://gumroad.com/l/sql-zine) by Julia Evans:  A very useful e-zine that summarizes in a cartoonish way most of the SQL concepts that we cover in class. Worth the $12.
* [How to Teach People SQL](https://dataschool.com/how-to-teach-people-sql/): Great visualizations for the various SQL operations that we learn.
* [SQL Data Manipulation for Data Scientists](https://www.stratascratch.com/guides/): Advanced data manipulation techniques using SQL.

## Useful Pointers

* [Best practices for SQL](https://data36.com/sql-best-practices-data-analysts/): A set of useful guidelines for writing readable SQL statements.


