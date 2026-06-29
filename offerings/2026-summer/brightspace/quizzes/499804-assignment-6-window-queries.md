# Assignment 6: Window queries

- **Brightspace id:** 499804
- **Due:** 2026-01-21T04:59:59.000Z
- **Active:** false
- **Questions:** 7

## Questions (7)

### Q1

Setup: Create a **temporary table SignUpsOn**, that shows the number of people that signed up on that day (using the MemberSince attribute)

### Q2

Setup: Create a **temporary table InactiveOn**, that shows the number of people that became inactive that day (using the LastUpdate attribute)

### Q3

**SingUpsAsOf**: Using the SignUpsOn table, calculate the total number of users signed up for Facebook up to each date listed in the MemberSince column. (In other words, calculate the cumulative sum of users from the SignUpsOn table.) Use a SUM() function together with a window specification.

### Q4

**InactiveAsOf**: Using the InactiveOn table, calculate the total number of users who are inactive as of a given date (again,  up to each date in the MemberSince. Use a SUM() function together with a window specification.

### Q5

Using the **SingUpsAsOf** and **InactiveAsOf**, calculate the total\_active users for each date. We define total active users as the total signups up to that date, minus the total users that have been inactive up to that date.

### Q6

Create the **passengers\_per\_airport** temporary table, which contains  the total number of passengers departing from each airport.  Use the m\_ticket\_prices table; we are interested in the origin and the passengers attributes.

### Q7

Using the `passengers_per_airport` table from the previous question, calculate each airport's **national rank** and **state rank** in terms of departing passengers. The **m\_airports** table contains the state of each airport. (Note: The number 1 airport nationally will have the most passengers nationwide, while the number 1 per state will have the most passengers within the state.)
