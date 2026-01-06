# Databases for Business Analytics

A brief introductory course to relational databases and SQL, targeting people interested in learning SQL for data analysis. This course does not cover database administration topics such as indexing, transactions, or stored procedures.

**Platform:** Google BigQuery  
**Datasets:** `nyu-datasets.imdb` and `nyu-datasets.facebook`

---

## Course Videos

[Full YouTube Playlist](https://www.youtube.com/playlist?list=PLqAPn_b_yx0QcOgEvAKQQ5yzplFI-FOQI)

---

## Modules

### [Module 1: Entity-Relationship Model and Relational Databases](module1/)

- Entities, Primary Keys, and Attributes
- Relations and Cardinality (One-to-One, One-to-Many, Many-to-Many)
- From ER Diagram to Relational Schema
- SQL Statements for Creating Tables

### [Module 2: Selection & Filtering Queries](module2/)

- Navigating a Database
- Selection queries: `SELECT`, `AS`, `DISTINCT`, `ORDER BY`, `LIMIT`
- Filtering with `WHERE`: Boolean operators, `IN`, `LIKE`, `BETWEEN`
- Handling `NULL` values
- Conditional logic with `CASE WHEN`
- Attribute-level functions: string, date, and NULL functions

### [Module 3: JOIN Queries](module3/)

- Inner Joins
- Self Joins
- Outer Joins (LEFT, RIGHT, FULL)
- Semi-joins and Anti-joins

### [Module 4: Aggregate Queries](module4/)

- Aggregation functions: `COUNT`, `SUM`, `AVG`, `MAX`, `MIN`, `STDEV`
- `GROUP BY` on single and multiple attributes
- Filtering groups with `HAVING`
- Combining JOINs and GROUP BY

### [Module 5: Subqueries](module4/)

- Subqueries with single-value results
- Semi-joins and Anti-joins using `IN`
- Derived tables
- `WITH` clause (Common Table Expressions)
- Comparison: CTEs vs. temporary tables vs. views

### [Module 6: Window Functions](module6/)

- Window definition: `OVER(ORDER BY)`
- Ranking functions: `RANK`, `DENSE_RANK`, `ROW_NUMBER`
- Partitioned windows: `OVER(PARTITION BY ... ORDER BY ...)`
- Offset functions: `LEAD`, `LAG`, `FIRST_VALUE`, `LAST_VALUE`
- Frame definitions and rolling aggregations

---

## Additional Resources

### Practice Platforms

- [StrataScratch](https://platform.stratascratch.com/coding) — SQL interview questions from tech companies
- [LeetCode Database Problems](https://leetcode.com/problemset/database/)
- [DataLemur](https://datalemur.com/) — SQL interview prep
- [W3Resource SQL Exercises](https://www.w3resource.com/sql-exercises/)

### Tutorials

- [Mode SQL Tutorial](https://mode.com/sql-tutorial/) — Basics to advanced
- [Khan Academy: Introduction to SQL](https://www.khanacademy.org/computing/computer-programming/sql) — Video-based intro
- [W3Schools SQL](http://www.w3schools.com/sql/) — Hands-on examples
- [Codecademy: Learn SQL](https://www.codecademy.com/learn/learn-sql)
- [How to Teach People SQL](https://dataschool.com/how-to-teach-people-sql/) — Great visualizations

### Books & Guides

- [Learning MySQL](http://shop.oreilly.com/product/9780596008642.do) — Comprehensive textbook
- [Become a SELECT Star!](https://gumroad.com/l/sql-zine) by Julia Evans — Visual SQL zine
- [SQL Data Manipulation for Data Scientists](https://www.stratascratch.com/guides/) — Advanced techniques
- [SQL Best Practices](https://data36.com/sql-best-practices-data-analysts/) — Writing readable SQL

---

## Setup

All notebooks use Google BigQuery. To run them:

1. Open any notebook in Google Colab (use the badge above)
2. Authenticate with your Google account
3. Replace `'your-project-id'` with your Google Cloud project ID

The queries use publicly accessible datasets in the `nyu-datasets` project.
