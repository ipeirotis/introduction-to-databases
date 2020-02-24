* When discussing unnormalized databases, show the actual normalized database with the orders, not just the schema
* Explain how it fixes the insertion, deletion, and update anomalies

* With the Employee-Jobs-Department example, do a brief introduction of keys to implement relations, and of the bridge table.

* Show the tables with the actual contents to illustrate how the relationships are implemented

* Perhaps move the "Functions" and "CASE" part earlier (in SELECT). Example: Examine the Birthday of a student (use YEAR(Birthday) as a function example) and then use CASE to flag problematic years CASE YEAR(Birthday) < 1980 AND Status='Undergrad' THEN 'Invalid'). Example for CASE, convert Political Views to Conservative / Liberal / Other)

* Move UNION earlier as well?


* OVER / PARTITION queries 

FIRST_VALUE()
LAG()
LAST_VALUE()
LEAD()

* PERCENTILE aggregate

CUME_DIST()
DENSE_RANK()
NTILE()
PERCENT_RANK()
RANK()
ROW_NUMBER()

* FRAME condition for range within window functions

Syntax
{ ROWS | RANGE } BETWEEN window_start AND window_end
window_start
= { UNBOUNDED PRECEDING
   | CURRENT ROW
   | constant-value { PRECEDING | FOLLOWING } }
window_end
= { UNBOUNDED FOLLOWING
   | CURRENT ROW
   | constant-value { PRECEDING | FOLLOWING } }

* COALESCE




Practice

Read the "Learning MySQL" textbook, chapter 7.
Work on the online SQL Tutorial by W3Scools
Work on the SQL course on Code Academy
Work on the SQL course on Khan Academy
