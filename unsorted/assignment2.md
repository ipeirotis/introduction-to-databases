# ER Diagram and Database Design for Time Card Application


## Instructions 

* Create an ER diagram, illustrating the entities, their attributes, the relationship among entities, and the cardinalities of the entities
* Translate the ER diagram into a set of tables, indicating clearly the attributes of each table, the primary key of each table, and the foreign keys that are used to implement the relationships.
* Write the SQL that generates the tables that you created in the step above.

## Scenario

The company you work for wants to digitize their time cards. You are asked to design the database for submitting and approving time cards.

* Each timecard should have a unique id, hours worked, date submitted, and status, which is either approved, not approved, or pending.
* Each employee has a unique id, name and address, and method of payment: either direct deposit or physical check.
* Each employee submits a time card every pay period (i.e., in 1 year, they will submit multiple time cards).
* Each manager has a unique id and a name.
* Each employee is associated with exactly one manager; each manager is in charge of multiple employees.
* Each manager approves time cards. The manager may approve also timecards for employees that are not necessarily managed by him/her.
* _Trickier part_: How would you handle the case when each manager is also an employee?

_A quick reminder: In databases, we can limit the domain of values of a variable using two ways:_

* By making the variable a foreign key, pointing to a different table where we store the potential values.
* By making the domain of the variable an "ENUM" variable that lists the (pre-defined) set of values that the variable can take.

_Option (1) allows for a bit more flexibility, allowing us to modify the domain of values over time. Option (2) is preferred when the set of values is small, pre-determined, and unlikely to change in the future._

## Deliverables

You can submit your diagram and SQL queries as a Word or PDF file, or any format that we can easily read.
