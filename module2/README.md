# Module 2: SQL Selection and Filtering Queries

## Learning Outcomes

By the end of this lesson, you will be able to:

- Connect to the database that you want to query, see the tables, and discover the attributes for each table
- Show the contents of the table, select which columns you want to retrieve, rename the columns, and order the results
- Filter the results of a query to include only rows that satisfy a given condition
- Express complex conditions using Boolean operators (AND, OR, NOT)
- Use the LIKE operator in SQL for writing approximate matching conditions
- Use the IN operator for writing containment queries
- Understand the NULL mark and how to write conditions that involve NULL
- Write complex queries that retrieve noisy data, and reformulate your queries iteratively

---

## Videos

| Topic | Link |
|-------|------|
| Intro to SQL | [Watch](https://www.youtube.com/watch?v=XqGKb235IVs&list=PLqAPn_b_yx0QcOgEvAKQQ5yzplFI-FOQI&index=6) |
| Navigating a Database | [Watch](https://www.youtube.com/watch?v=pyBN57RvmBE&list=PLqAPn_b_yx0QcOgEvAKQQ5yzplFI-FOQI&index=7) |
| SELECT * Statement | [Watch](https://www.youtube.com/watch?v=rgWZ51xb3mw&list=PLqAPn_b_yx0QcOgEvAKQQ5yzplFI-FOQI&index=8) |
| SELECT * Statement EXTRA | [Watch](https://www.youtube.com/watch?v=QMfCxGnTTws&list=PLqAPn_b_yx0QcOgEvAKQQ5yzplFI-FOQI&index=9) |
| SELECT Attributes & SELECT Attributes As | [Watch](https://www.youtube.com/watch?v=9vvcCcMcJS4&list=PLqAPn_b_yx0QcOgEvAKQQ5yzplFI-FOQI&index=10) |
| SELECT DISTINCT | [Watch](https://www.youtube.com/watch?v=Q38lmyjZPK8&list=PLqAPn_b_yx0QcOgEvAKQQ5yzplFI-FOQI&index=11) |
| ORDER BY / LIMIT | [Watch](https://www.youtube.com/watch?v=UkY1YFi_MT4&list=PLqAPn_b_yx0QcOgEvAKQQ5yzplFI-FOQI&index=12) |
| WHERE: Simple Equality Conditions | [Watch](https://www.youtube.com/watch?v=gcym62xq8FI&list=PLqAPn_b_yx0QcOgEvAKQQ5yzplFI-FOQI&index=13) |
| WHERE: Boolean Operators | [Watch](https://www.youtube.com/watch?v=_IhZWskHbhE&list=PLqAPn_b_yx0QcOgEvAKQQ5yzplFI-FOQI&index=14) |
| WHERE: Inequality Operators | [Watch](https://www.youtube.com/watch?v=IOwmyujzvgo&list=PLqAPn_b_yx0QcOgEvAKQQ5yzplFI-FOQI&index=15) |
| WHERE: IN Operator | [Watch](https://www.youtube.com/watch?v=1qYZxh87Ug4&list=PLqAPn_b_yx0QcOgEvAKQQ5yzplFI-FOQI&index=16) |
| Approximate Queries using LIKE | [Watch](https://www.youtube.com/watch?v=20DEOiSwJ9o&list=PLqAPn_b_yx0QcOgEvAKQQ5yzplFI-FOQI&index=17) |
| NULL Mark | [Watch](https://www.youtube.com/watch?v=6OHuAEF440Q&list=PLqAPn_b_yx0QcOgEvAKQQ5yzplFI-FOQI&index=18) |
| Floating Point Numbers | [Watch](https://newclasses.nyu.edu/access/lessonbuilder/item/30468649/) |
| Activity: Dealing with Dirty Data | [Watch](https://www.youtube.com/watch?v=xalQLiqVT6w&list=PLqAPn_b_yx0QcOgEvAKQQ5yzplFI-FOQI&index=20) |

## Slides

- [Introduction to SQL and IMDb & Facebook schemas](https://docs.google.com/presentation/d/1I9-rvitpP2bXNFoIKZWlWHTkxUuqxZLMEu44efcsvYY/edit?usp=sharing)
- [SQL: Selection Queries](https://docs.google.com/presentation/d/13FdfbHb8HMmDJ2VB_IVOGaDjQqvvQfv2/edit?usp=sharing&ouid=103666871486129948108&rtpof=true&sd=true)
- [SQL: Filtering Queries](https://docs.google.com/presentation/d/1338Tdn3jhicTjiF7c1yQ_W1rH145rKGLwvxUlrAuxhU/edit?usp=sharing)

## Notebooks

- [SQL: Selection Queries](B-Selection_Queries.ipynb) — SELECT, AS, DISTINCT, ORDER BY, LIMIT
- [SQL: Filtering Queries](B3-Filtering_Queries.ipynb) — WHERE, Boolean operators, IN, LIKE, NULL, CASE

## Setup

These notebooks use Google BigQuery. To run them:

1. Open the notebook in Google Colab
2. Authenticate with your Google account
3. Replace `'your-project-id'` with your Google Cloud project ID

The queries use datasets in the `nyu-datasets` project:
- `nyu-datasets.imdb` — Movies, actors, directors, roles, genres
- `nyu-datasets.facebook` — Student profiles, hobbies, relationships
