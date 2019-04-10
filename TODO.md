* When discussing unnormalized databases, show the actual normalized database with the orders, not just the schema
* Explain how it fixes the insertion, deletion, and update anomalies

* When discussing cardinalities, we need to separate the min-max cardinality from the one-to-one, one-to-many, many-to-many.

* With the Employee-Jobs-Department example, do a brief introduction of keys to implement relations, and of the bridge table.
* Show the tables with the actual contents to illustrate how the relationships are implemented

* We can have two 1hr15min lectures on modeling. We can compress the ER diagram discussion and cover ER design and translation into tables (foreign keys for 1-1, 1-many; bridge tables for many-many). Then in the second lecture we do the Water Utility Database discussion, together with MySQL workbench, and CREATE TABLE queries.

* Perhaps move the "Functions" and "CASE" part earlier (in SELECT). Example: Examine the Birthday of a student (use YEAR(Birthday) as a function example) and then use CASE to flag problematic years CASE YEAR(Birthday) < 1980 AND Status='Undergrad' THEN 'Invalid'). Example for CASE, convert Political Views to Conservative / Liberal / Other)

* 


Practice

Read the "Learning MySQL" textbook, chapter 7.
Work on the online SQL Tutorial by W3Scools
Work on the SQL course on Code Academy
Work on the SQL course on Khan Academy
