# Module 5: Subqueries

## Learning Outcomes

By the end of this lesson, you will be able to:

- Understand the notion of a subquery and that we can write queries that reuse the results of other queries
- Learn about variables and how they can be used to make our code more readable
- Understand the similarities and differences between views, temporary tables, and common table expressions (CTEs / WITH)
- Practice creating queries that use subqueries and temporary tables to create advanced analytics solutions

---

## Videos

| Topic | Link |
|-------|------|
| Subqueries for a single-value calculation | [Watch](https://storage.googleapis.com/gslide_videos/F-SQL_Subqueries-7.1--1s_41ty_BGC4OzUnzmLhuX_S2eY6I-9QG2cB_eZM02kM/panos--z3zYFzY2KtTTLjvOecBO/video/output_video-59629ac9978e284983759db8e858417e.mp4) ([alt](https://storage.googleapis.com/gslide_videos/F-SQL_Subqueries-7.1--1s_41ty_BGC4OzUnzmLhuX_S2eY6I-9QG2cB_eZM02kM/michael--flq6f7yk4E4fJM5XTYuZ/video/output_video-ebf2784fb8b7fb860fd39b141c8facf8.mp4)) |
| Subqueries using IN for semijoins and antijoins | [Watch](https://storage.googleapis.com/gslide_videos/F-SQL_Subqueries-7.2--1BgL7sTbfrOa2vSwgDF14pWyx6URWdMqrE1JJrhV9Wjw/panos--z3zYFzY2KtTTLjvOecBO/video/output_video-15245a31e629a277bfb050337b0078d6.mp4) ([alt](https://storage.googleapis.com/gslide_videos/F-SQL_Subqueries-7.2--1BgL7sTbfrOa2vSwgDF14pWyx6URWdMqrE1JJrhV9Wjw/michael--flq6f7yk4E4fJM5XTYuZ/video/output_video-110e4302edba27baeb7728de217bbf8e.mp4)) |
| Subqueries using derived tables | [Watch](https://drive.google.com/file/d/1-PbSFssoxWxuMc9mNeuTkmWZv51fMZyE/view?usp=drive_link) |


## Slides

- [Subqueries for single value calculation and variables](https://docs.google.com/presentation/d/1s_41ty_BGC4OzUnzmLhuX_S2eY6I-9QG2cB_eZM02kM/edit?usp=sharing)
- [Subqueries for semijoins and antijoins](https://docs.google.com/presentation/d/1BgL7sTbfrOa2vSwgDF14pWyx6URWdMqrE1JJrhV9Wjw/edit?usp=sharing)
- [Subqueries with derived tables](https://docs.google.com/presentation/d/1vNFw7nqQgmd6P1vEOOfsp7vwmf0z_9VmXlZfG9K9nNA/edit?usp=drive_link)

---

## Advanced Examples

### Music Recommendations

The "music recommendations" example shows how we can write a query that implements a simple recommendation engine, such as "people who listen to this artist also like that artist." We use it as a running example to use variables more extensively.

- [SQL Code](music_recommendations.sql)
- [Slides](https://drive.google.com/file/d/1KI0IRpa9K9tlpF_pZYyNAiNUvykubvDI/view?usp=sharing)
- [Video Explainer](https://drive.google.com/file/d/1X4uAB8U8K7Oy_5pN14w_tZi8pBNRFqjB/view?usp=sharing)

### Books and Political Views

The "books and political views" example shows how we can go from "book likes" to extracting connections between book preferences and political views (and therefore, how we can infer the political views of someone by just knowing the books, music, TV shows, etc. they like). We use this application as a working (and extensive) example for using subqueries. We also use the opportunity to get brief glimpses of concepts such as lift and measurement of classification accuracy, which will be discussed in more detail in other data science courses.

- [SQL Code](books_and_political_views.sql)
- [Slides](https://drive.google.com/file/d/1qRJw-IQfsrTLXRD4gFEtg0oADT5bvv8q/view?usp=drive_link)
- [Video Explainer](https://drive.google.com/file/d/1jO08bcLcFKebmaYNqA3CvEFRppWlqydv/view?usp=drive_link)

### Books and Gender

The books and gender analysis shows how we can correlate gender and book preferences.

- [SQL Code](../session6/book_vs_gender.sql)
