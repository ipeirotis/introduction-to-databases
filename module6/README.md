# Module 6: Window Queries

## Learning Outcomes

By the end of this lesson, you will be able to:

- Understand the notion of window functions and how they differ from aggregation queries
- Recognize when to use window functions vs. GROUP BY (preserving rows vs. collapsing them)
- Learn the three main types of window functions:
  - **Ranking functions**: ROW_NUMBER, RANK, DENSE_RANK, NTILE, PERCENT_RANK
  - **Value functions**: LAG, LEAD, FIRST_VALUE, LAST_VALUE
  - **Aggregation functions**: SUM, AVG, COUNT, MIN, MAX (used with OVER)
- Use the OVER clause to specify windows
- Understand PARTITION BY (grouping within windows) and ORDER BY (sorting within partitions)
- Understand frame clauses (ROWS BETWEEN) for rolling calculations
- Filter window results using CTEs and QUALIFY
- Apply window functions to business problems: rankings, time-series analysis, growth metrics, and deduplication

---

## Videos

| Topic | Link |
|-------|------|
| Introduction to Window Functions | Coming Soon |
| Window Functions vs GROUP BY | Coming Soon |
| Ranking Functions (RANK, ROW_NUMBER, DENSE_RANK) | Coming Soon |
| PARTITION BY for Grouping | Coming Soon |
| NTILE and PERCENT_RANK for Segmentation | Coming Soon |
| LAG and LEAD for Time Comparisons | Coming Soon |
| Rolling Calculations with Frame Clauses | Coming Soon |
| Filtering Window Results (CTE and QUALIFY) | Coming Soon |

---

## Slides

| Module | Topic | Link |
|--------|-------|------|
| 6.1 | Windows vs Groups | [View](https://docs.google.com/presentation/d/1rr3eCjPEfNrPxnj-OpYhm40sjrTzWTaYpgs9FAwy9l0/edit?usp=sharing) |
| 6.2 | Ranking and Comparing | [View](https://docs.google.com/presentation/d/1yhdnK2WYIYxaQ5kASrSiC56fLpp2vm0S63K_Kcg7QKQ/edit?usp=sharing) |
| 6.3 | Time Travel with Data | [View](https://docs.google.com/presentation/d/1DFJv0z7uR-FN5JKOcFq3zXMj_hsnOaAvtW0hvXC8kMQ/edit?usp=sharing) |
| 6.4 | Filtering Window Results | [View](https://docs.google.com/presentation/d/1Ey-DvEfXCud2XWrgai5YG4nAfy4dYnDsnh9Bdp3xRAg/edit?usp=sharing) |
| Ref | Reference Slides | [View](https://docs.google.com/presentation/d/1nR-UYuyWL4JUu5W02cbk8bGDfWiOSYmfnzYNjka6TOI/edit?usp=sharing) |

---

## Topics Covered

### Module 6.1: Windows vs Groups
- The "Manager's Dilemma": showing individual values alongside group aggregates
- GROUP BY collapses rows; window functions preserve them
- The OVER clause and PARTITION BY
- Mental model: "VLOOKUP-ing a Pivot Table back to raw data"

### Module 6.2: Ranking and Comparing
| Function | Description | Tie Behavior |
|----------|-------------|--------------|
| `ROW_NUMBER()` | Unique sequential number | No ties (arbitrary order) |
| `RANK()` | Rank with gaps after ties | 1, 2, 2, 4, 5 |
| `DENSE_RANK()` | Rank without gaps | 1, 2, 2, 3, 4 |
| `NTILE(n)` | Divide into n equal buckets | Quartiles, deciles, percentiles |
| `PERCENT_RANK()` | Relative position (0 to 1) | Top 1%, Top 10% analysis |

- PARTITION BY for ranking within groups
- The "Olympic Medal" problem: understanding RANK vs DENSE_RANK
- Customer segmentation with NTILE (VIP tiers, 80/20 analysis)

### Module 6.3: Time Travel with Data
| Function | Description |
|----------|-------------|
| `LAG(col, n)` | Value from n rows before |
| `LEAD(col, n)` | Value from n rows after |
| `FIRST_VALUE(col)` | First value in window |
| `LAST_VALUE(col)` | Last value in window |

- Comparing current row to previous (no self-join needed)
- Growth metrics: QoQ and YoY calculations
- Rolling averages with frame clauses: `ROWS BETWEEN n PRECEDING AND CURRENT ROW`
- Detecting anomalies (e.g., stock price crashes)

### Module 6.4: Filtering Window Results
- The #1 beginner mistake: `WHERE RANK() < 3` doesn't work
- SQL order of operations: WHERE runs before SELECT/windows
- Solution 1: CTE pattern (calculate first, filter second)
- Solution 2: QUALIFY clause (BigQuery, Snowflake, Databricks)
- The deduplication pattern: keeping only the most recent record per group

---

## Notebooks

- [SQL Window Queries](G-SQL_Window_Queries.ipynb) — All window function examples from the slides

---

## BigQuery Setup

The teaching examples use pre-built views in the `examples` dataset:

| View | Purpose |
|------|---------|
| `employee_salaries` | Basic window vs GROUP BY comparison |
| `popular_music` | RANK introduction |
| `music_by_gender` | PARTITION BY examples |
| `customer_revenue` | NTILE segmentation |
| `quarterly_revenue` | YoY/QoQ growth |
| `stock_prices` | Crash detection exercise |
| `daily_accidents` | Rolling averages |
| `movies_by_year` | Top-N per group |
| `real_estate` | ROI capstone exercise |

Setup SQL: [bigquery_window_teaching_setup.sql](bigquery_window_teaching_setup.sql)

---

## Key Patterns

### Top-N Per Group
```sql
WITH ranked AS (
  SELECT *, ROW_NUMBER() OVER (PARTITION BY category ORDER BY value DESC) AS rn
  FROM table
)
SELECT * FROM ranked WHERE rn <= 3;
```

### Year-over-Year Growth
```sql
SELECT 
  quarter, 
  revenue,
  (revenue - LAG(revenue, 4) OVER (ORDER BY quarter)) 
    / LAG(revenue, 4) OVER (ORDER BY quarter) AS yoy_growth
FROM quarterly_revenue;
```

### Rolling 7-Day Average
```sql
SELECT 
  date, 
  value,
  AVG(value) OVER (ORDER BY date ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) AS rolling_avg
FROM daily_data;
```

### Deduplication (Keep Most Recent)
```sql
SELECT * FROM transactions
QUALIFY ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY date DESC) = 1;
```

---

## External Resources

### Tutorials
- [SQL Window Functions Book](https://antonz.org/sql-window-functions-book/) — Free online book with interactive examples
- [MySQL Window Functions Tutorial](https://www.mysqltutorial.org/mysql-window-functions/)
- [Mode Analytics: SQL Window Functions](https://mode.com/sql-tutorial/sql-window-functions/)
- [StrataScratch: Ultimate Guide to Window Functions](https://www.stratascratch.com/blog/the-ultimate-guide-to-sql-window-functions/)

### Reference
- [GeeksforGeeks: Window Functions in SQL](https://www.geeksforgeeks.org/window-functions-in-sql/)
- [Toptal: Intro to SQL Window Functions](https://www.toptal.com/sql/intro-to-sql-windows-functions)
- [Medium: A Guide to Advanced SQL Window Functions](https://medium.com/data-science/a-guide-to-advanced-sql-window-functions-f63f2642cbf9)
- [Towards Data Science: Anatomy of Window Functions](https://towardsdatascience.com/anatomy-of-windows-functions-08f04938b12b/)

---

## BigQuery vs MySQL Notes

| Concept | BigQuery | MySQL |
|---------|----------|-------|
| QUALIFY clause | ✅ Supported | ❌ Use CTE instead |
| Frame clause default | RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW | Same |
| PERCENT_RANK | ✅ Supported | ✅ Supported (8.0+) |
| NTILE | ✅ Supported | ✅ Supported (8.0+) |

---

## Prerequisites

Before starting this module, you should be comfortable with:
- SELECT, FROM, WHERE, ORDER BY
- JOIN queries (Module 3)
- GROUP BY and HAVING (Module 4)
- Subqueries and CTEs (Module 5)
