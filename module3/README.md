# Module 3: JOIN Queries

## Learning Outcomes

By the end of this lesson, you will be able to:

- Understand the notion of a join in databases
- Join two or more tables together using an inner join
- Combine joins with filtering conditions
- Understand the notion of an outer join and why it differs from an inner join
- Join a table to itself (self-joins)
- Understand the meaning of "semi-join" and "anti-join"
- Understand how joins behave for 1-to-1, 1-to-many, and many-to-many relationships and the implications for data analysis

---

## Videos

| Topic | Link |
|-------|------|
| Joins: What are they? | [Watch](https://www.youtube.com/watch?v=bf0jqYTg2v0&list=PLqAPn_b_yx0QcOgEvAKQQ5yzplFI-FOQI&index=21) |
| Introduction to Inner Joins | [Watch](https://www.youtube.com/watch?v=S9WHppyJsek&list=PLqAPn_b_yx0QcOgEvAKQQ5yzplFI-FOQI&index=22) |
| Inner Joins Examples | [Watch](https://www.youtube.com/watch?v=oonbm3p-YGw&list=PLqAPn_b_yx0QcOgEvAKQQ5yzplFI-FOQI&index=23) |
| Inner Joins Examples Part II | [Watch](https://www.youtube.com/watch?v=RQUSMes6bjY&list=PLqAPn_b_yx0QcOgEvAKQQ5yzplFI-FOQI&index=24) |
| Step by Step: Top Dramas in 2000 | [Watch](https://www.youtube.com/watch?v=44h-u_x7u5o&list=PLqAPn_b_yx0QcOgEvAKQQ5yzplFI-FOQI&index=25) |
| Step by Step: James Bond Movies | [Watch](https://www.youtube.com/watch?v=zOwfDSznLsk&list=PLqAPn_b_yx0QcOgEvAKQQ5yzplFI-FOQI&index=26) |
| Step by Step: Brad Pitt Movies | [Watch](https://www.youtube.com/watch?v=w3nOROdb09s&list=PLqAPn_b_yx0QcOgEvAKQQ5yzplFI-FOQI&index=27) |
| Example JOIN: Facebook | [Watch](https://www.youtube.com/watch?v=ThOnlXcMTAc&list=PLqAPn_b_yx0QcOgEvAKQQ5yzplFI-FOQI&index=28) |
| Self Joins | [Watch](https://www.youtube.com/watch?v=TfSv_VbLikc&list=PLqAPn_b_yx0QcOgEvAKQQ5yzplFI-FOQI&index=29) |
| Outer Joins Introduction | [Watch](https://www.youtube.com/watch?v=YxsXj47MW_E&list=PLqAPn_b_yx0QcOgEvAKQQ5yzplFI-FOQI&index=30) |
| Outer Joins Example | [Watch](https://www.youtube.com/watch?v=ZxY4_szHaF8&list=PLqAPn_b_yx0QcOgEvAKQQ5yzplFI-FOQI&index=31) |

## Slides

- [SQL: Joins](https://docs.google.com/presentation/d/YOUR_SLIDES_ID/edit?usp=sharing)

## Notebooks

- [SQL Join Queries](C-Join_Queries.ipynb) — Inner joins, self joins, outer joins, semi-joins, anti-joins

## Setup

This notebook uses Google BigQuery. To run it:

1. Open the notebook in Google Colab
2. Authenticate with your Google account
3. Replace `'your-project-id'` with your Google Cloud project ID

The queries use datasets in the `nyu-datasets` project:
- `nyu-datasets.imdb` — Movies, actors, directors, roles, genres
- `nyu-datasets.facebook` — Student profiles, hobbies, relationships

## Resources

* [A nice explanation of inner vs outer joins](https://www.stratascratch.com/blog/types-of-pandas-joins-and-how-to-use-them-in-python/)


