# Module 4: Aggregation Queries

## Learning Outcomes

By the end of this lesson, you will be able to:

- Use aggregation functions (COUNT, SUM, AVG, MIN, MAX, STDEV) to summarize data
- Understand the difference between COUNT(*), COUNT(column), and COUNT(DISTINCT column)
- Use GROUP BY to compute aggregates for subgroups of data
- Use GROUP BY with multiple attributes
- Use the HAVING clause to filter groups based on aggregate values
- Combine JOIN and GROUP BY queries to compute statistics across multiple tables

---

## Videos

### Single Table Aggregations

| Topic | Link |
|-------|------|
| Introduction to Aggregation Functions | [Watch](https://www.youtube.com/watch?v=laOjeBGHbVw&list=PLqAPn_b_yx0QcOgEvAKQQ5yzplFI-FOQI&index=31) |
| Common Aggregation Functions | [Watch](https://www.youtube.com/watch?v=SXu_kMMUYSM&list=PLqAPn_b_yx0QcOgEvAKQQ5yzplFI-FOQI&index=33) |
| Introduction to GROUP BY | [Watch](https://www.youtube.com/watch?v=3HfICr3G2gc&list=PLqAPn_b_yx0QcOgEvAKQQ5yzplFI-FOQI&index=33) |
| Example GROUP BY: Movie Statistics by Year | [Watch](https://www.youtube.com/watch?v=6jmu1IAvKz8&list=PLqAPn_b_yx0QcOgEvAKQQ5yzplFI-FOQI&index=34) |
| GROUP BY Examples: Additional IMDB Examples | [Watch](https://www.youtube.com/watch?v=KZXcAOIDPzo&list=PLqAPn_b_yx0QcOgEvAKQQ5yzplFI-FOQI&index=36) |
| Aggregates with Multiple Attributes in GROUP BY | [Watch](https://www.youtube.com/watch?v=HA_AAr0pNxY&list=PLqAPn_b_yx0QcOgEvAKQQ5yzplFI-FOQI&index=37) |
| Introduction to HAVING Clause | [Watch](https://www.youtube.com/watch?v=Zg4nR8QPeaY&list=PLqAPn_b_yx0QcOgEvAKQQ5yzplFI-FOQI&index=37) |
| HAVING Examples | [Watch](https://www.youtube.com/watch?v=K7SBAurJXyo&list=PLqAPn_b_yx0QcOgEvAKQQ5yzplFI-FOQI&index=39) |

### Aggregations Across Multiple Tables

| Topic | Link |
|-------|------|
| Integrated Queries: Statistics on Movie Genres | [Watch](https://www.youtube.com/watch?v=Pbifh2BHPFM&list=PLqAPn_b_yx0QcOgEvAKQQ5yzplFI-FOQI&index=39) |
| Integrated Queries: Statistics on Directors | [Watch](https://www.youtube.com/watch?v=aeXWO4xHsTw&list=PLqAPn_b_yx0QcOgEvAKQQ5yzplFI-FOQI&index=41) |
| Integrated Queries: Role Analysis | [Watch](https://www.youtube.com/watch?v=T0w4uhj5-2c&list=PLqAPn_b_yx0QcOgEvAKQQ5yzplFI-FOQI&index=41) |
| Conclusion | [Watch](https://www.youtube.com/watch?v=eUrmYZpRYA0&list=PLqAPn_b_yx0QcOgEvAKQQ5yzplFI-FOQI&index=42) |

## Slides

- [Aggregation Queries](https://docs.google.com/presentation/d/1uyd1lEi1DVJxCRa6b_6Yn3SF_KENT4Zk8FKRmyZ_XJE/edit?usp=sharing)

## Notebooks

- [SQL GROUP BY Queries](D-SQL_Aggregation_Queries.ipynb) — Aggregation functions, GROUP BY, HAVING, integrated queries

## Topics Covered

### Aggregation Functions
- `COUNT(*)` — count all rows
- `COUNT(column)` — count non-NULL values
- `COUNT(DISTINCT column)` — count unique values
- `SUM`, `AVG`, `MIN`, `MAX`, `STDEV`

### GROUP BY
- Grouping by a single attribute
- Grouping by multiple attributes
- Combining with ORDER BY and LIMIT

### HAVING Clause
- Filtering groups (vs. WHERE which filters rows)
- Using aggregate conditions

### Integrated Queries
- Combining JOINs with GROUP BY
- Statistics across related tables (genres, directors, actors)

## Setup

This notebook uses Google BigQuery. To run it:

1. Open the notebook in Google Colab
2. Authenticate with your Google account
3. Replace `'your-project-id'` with your Google Cloud project ID

The queries use datasets in the `nyu-datasets` project:
- `nyu-datasets.imdb` — Movies, actors, directors, roles, genres
- `nyu-datasets.facebook` — Student profiles, hobbies, relationships
