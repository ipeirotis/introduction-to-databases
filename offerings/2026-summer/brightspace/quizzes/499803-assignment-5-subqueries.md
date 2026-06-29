# Assignment 5: Subqueries

- **Brightspace id:** 499803
- **Due:** 2026-06-05T03:59:59.000Z
- **Active:** true
- **Attempts:** Unlimited
- **Questions:** 4

## Questions (4)

### Q1

As a first step, limit your analysis only to first names that do not include a dot "." or parentheses (i.e, ignore "A.", "J.B.", "Alfred (I)" etc); also only consider first names that appear at least 50 times in the actors table (across both genders; ie., a name that appears in 35 males and 20 females qualifies as eligible). Create a temporary table with the results, called "eligible\_names". (You will use the table in later questions)

### Q2

Find the eligible names that appear only for male actors but for no female actresses, and report the corresponding frequencies.

### Q3

Find the eligible names that appear only for female actors but for no male actresses, and report the corresponding frequencies.

### Q4

For _**eligible**_ names that appear for _**both**_ males and females, report the names and the frequencies for males and females. Rank the most ambiguous names on top. We consider as most ambiguous names the ones where the formula **log( male\_freq / female\_freq )** is close to 0. Remember that the log can be positive and negative; ranking by absolute value (using the [ABS() function](https://www.w3schools.com/sql/func_mysql_abs.asp)) will allow you to rank the smallest numbers first.
