# northwind — validated solutions

17 questions, each solved and verified against `nyu-datasets.northwind` on BigQuery.

## Setup & basics

### Identify the primary key for each table above.

Remember that some tables have _composite_ primary keys.

In BigQuery, you can hover over the "PK" and "FK" designations for a column and see the description of the primary key and foreign key, respectively.

_used in 1 semester(s) · ✓ verified (8 rows)_

```sql
SELECT
  kcu.table_name,
  STRING_AGG(kcu.column_name, ', ' ORDER BY kcu.ordinal_position) AS primary_key
FROM `nyu-datasets.northwind.INFORMATION_SCHEMA.TABLE_CONSTRAINTS` tc
JOIN `nyu-datasets.northwind.INFORMATION_SCHEMA.KEY_COLUMN_USAGE` kcu
  ON tc.constraint_name = kcu.constraint_name
 AND tc.table_name = kcu.table_name
WHERE tc.constraint_type = 'PRIMARY KEY'
GROUP BY kcu.table_name
ORDER BY kcu.table_name
```

**Hint:** Primary keys live in the dataset's INFORMATION_SCHEMA: join TABLE_CONSTRAINTS (filter constraint_type = 'PRIMARY KEY') to KEY_COLUMN_USAGE, then STRING_AGG the columns per table ordered by ordinal_position so composite keys show all their columns.

## General / other

### Retrieve the names of products along with the category name they belong to. Display the ProductID, ProductName, and CategoryName. Sort the results by CategoryName and then by ProductName.

_used in 6 semester(s) · ✓ verified (77 rows)_

```sql
SELECT p.ProductID, p.ProductName, c.CategoryName
FROM `nyu-datasets.northwind.Products` p
JOIN `nyu-datasets.northwind.Categories` c ON p.CategoryID = c.CategoryID
ORDER BY c.CategoryName, p.ProductName
```

**Hint:** JOIN Products to Categories on CategoryID, select the three columns, and ORDER BY CategoryName then ProductName.

### Find the customers who have placed more than 10 orders. Display the CustomerID, CompanyName, and the total number of orders they have placed

_used in 6 semester(s) · ✓ verified (28 rows)_

```sql
SELECT c.CustomerID, c.CompanyName, COUNT(o.OrderID) AS TotalOrders
FROM `nyu-datasets.northwind.Customers` c
JOIN `nyu-datasets.northwind.Orders` o ON c.CustomerID = o.CustomerID
GROUP BY c.CustomerID, c.CompanyName
HAVING COUNT(o.OrderID) > 10
ORDER BY TotalOrders DESC
```

**Hint:** JOIN Customers to Orders, GROUP BY customer, COUNT the orders, and filter the groups with HAVING COUNT(*) > 10 (not WHERE).

### List the names and id of customers who have never placed an order. Display the CustomerID and ContactName.

_used in 6 semester(s) · ✓ verified (2 rows)_

```sql
SELECT c.CustomerID, c.ContactName
FROM `nyu-datasets.northwind.Customers` c
LEFT JOIN `nyu-datasets.northwind.Orders` o ON c.CustomerID = o.CustomerID
WHERE o.OrderID IS NULL
```

**Hint:** LEFT JOIN Customers to Orders and keep only rows where the Orders side is NULL (anti-join). NOT IN / NOT EXISTS on Orders.CustomerID also works.

### For each supplier, we want to calculate how much revenue they generated from product sales in 2014, and display suppliers who generated more than $10,000 in revenue.

Show the:

*   SupplierID and CompanyName for each supplier
*   The total revenue generated from their products (use Quantity and UnitPrice fields in the OrderDetails table; the revenue for each product is Quantity \* UnitPrice)
*   The total discount applied to their products (consider the Discount field in the OrderDetails table, together with Quantity and UnitPrice fields; the applied discount is Quantity \* UnitPrice \* Discount)

Limit the analysis only to orders placed in 2014.

Order the results by SupplierID.

_used in 6 semester(s) · ✓ verified (6 rows)_

```sql
SELECT s.SupplierID, s.CompanyName,
  SUM(od.Quantity * od.UnitPrice) AS TotalRevenue,
  SUM(od.Quantity * od.UnitPrice * CAST(od.Discount AS BIGNUMERIC)) AS TotalDiscount
FROM `nyu-datasets.northwind.OrderDetails` od
JOIN `nyu-datasets.northwind.Orders` o ON od.OrderID = o.OrderID
JOIN `nyu-datasets.northwind.Products` p ON od.ProductID = p.ProductID
JOIN `nyu-datasets.northwind.Suppliers` s ON p.SupplierID = s.SupplierID
WHERE EXTRACT(YEAR FROM o.OrderDate) = 2014
GROUP BY s.SupplierID, s.CompanyName
HAVING SUM(od.Quantity * od.UnitPrice) > 10000
ORDER BY s.SupplierID
```

**Hint:** Chain four joins (OrderDetails-Orders-Products-Suppliers), filter to 2014 with EXTRACT(YEAR FROM OrderDate), then GROUP BY supplier with SUM aggregates and a HAVING on revenue > 10000. Note Discount is stored as text, so CAST it before multiplying.

### For each supplier, list the total number of products they supply and the total quantity of these products that have been ordered. Display the SupplierID, CompanyName, TotalProducts, and TotalQuantityOrdered.

_used in 5 semester(s) · ✓ verified (29 rows)_

```sql
SELECT
  s.SupplierID,
  s.CompanyName,
  COUNT(DISTINCT p.ProductID) AS TotalProducts,
  IFNULL(SUM(od.Quantity), 0)  AS TotalQuantityOrdered
FROM `nyu-datasets.northwind.Suppliers` s
JOIN `nyu-datasets.northwind.Products` p
  ON s.SupplierID = p.SupplierID
LEFT JOIN `nyu-datasets.northwind.OrderDetails` od
  ON p.ProductID = od.ProductID
GROUP BY s.SupplierID, s.CompanyName
ORDER BY s.SupplierID
```

**Hint:** Chain Suppliers → Products → OrderDetails. Use a LEFT JOIN to OrderDetails so products never ordered still count, COUNT(DISTINCT ProductID) for TotalProducts, and SUM(Quantity) (wrapped in IFNULL) for TotalQuantityOrdered, then GROUP BY supplier.

## Final exam

### For each order, show the **customerID** who placed the order, and list the **number of products** in the order, the t**otal units in the order** (each order may contain multiple units of a product as reported in the "Quantity" field or OrderDetails), and the **total order price** for all the products (using the Quantity and UnitPrice fields in the OrderDetails table; ignore the Discount field).

**Sort the results by decreasing total price and display only orders where the total price is above 10,000.**

_used in 22 semester(s) · ✓ verified (14 rows)_

```sql
SELECT o.CustomerID, COUNT(od.ProductID) AS num_products, SUM(od.Quantity) AS total_units, SUM(od.Quantity * od.UnitPrice) AS total_price FROM `nyu-datasets.northwind.Orders` o JOIN `nyu-datasets.northwind.OrderDetails` od ON o.OrderID = od.OrderID GROUP BY o.OrderID, o.CustomerID HAVING SUM(od.Quantity * od.UnitPrice) > 10000 ORDER BY total_price DESC
```

**Hint:** JOIN Orders to OrderDetails, GROUP BY OrderID (carry CustomerID), use COUNT(ProductID) for line items, SUM(Quantity) for units, SUM(Quantity*UnitPrice) for total, then HAVING > 10000 ORDER BY total DESC.

### We want to identify the **ship countries** with the highest average freight charges. Return the **top-three** ship countries with the highest average freight overall, in descending order by average **freight**. _You only need the Orders table._

_used in 17 semester(s) · ✓ verified (3 rows)_

```sql
SELECT ShipCountry, AVG(Freight) AS avg_freight
FROM `nyu-datasets.northwind.Orders`
GROUP BY ShipCountry
ORDER BY avg_freight DESC
LIMIT 3
```

**Hint:** GROUP BY ShipCountry with AVG(Freight), then ORDER BY the average descending and LIMIT 3. Only the Orders table is needed.

### We would like to see just the FirstName, LastName, and HireDate of all the employees with the title of Sales Representative who are also in the United States

_used in 11 semester(s) · ✓ verified (3 rows)_

```sql
SELECT FirstName, LastName, HireDate
FROM `nyu-datasets.northwind.Employees`
WHERE Title = 'Sales Representative' AND Country = 'USA'
```

**Hint:** Simple WHERE with two AND-ed conditions on Title and Country; select only the three requested columns.

### From the Products table, we want to see the ProductID and ProductName for those products where the ProductName includes the string "queso"

_used in 11 semester(s) · ✓ verified (2 rows)_

```sql
SELECT ProductID, ProductName
FROM `nyu-datasets.northwind.Products`
WHERE LOWER(ProductName) LIKE '%queso%'
```

**Hint:** Pattern match with LIKE '%queso%'; because BigQuery's LIKE is case-sensitive and the names are capitalized ('Queso ...'), wrap the column in LOWER() (or use the case-insensitive operators).

### We would like to know, for each product, the associated Supplier. Show the ProductID, ProductName, and the CompanyName of the Supplier. Sort the results by ProductID.

_used in 11 semester(s) · ✓ verified (10 rows)_

```sql
SELECT p.ProductID, p.ProductName, s.CompanyName
FROM `nyu-datasets.northwind.Products` p
JOIN `nyu-datasets.northwind.Suppliers` s ON p.SupplierID = s.SupplierID
ORDER BY p.ProductID
```

**Hint:** Inner JOIN Products to Suppliers on SupplierID, then ORDER BY ProductID. Note CompanyName is shared by both Suppliers and Customers, so it comes from the Suppliers table here.

### For every customer in the database list the number of orders they have placed.

_used in 11 semester(s) · ✓ verified (10 rows)_

```sql
SELECT c.CustomerID, c.CompanyName, COUNT(o.OrderID) AS num_orders
FROM `nyu-datasets.northwind.Customers` c
LEFT JOIN `nyu-datasets.northwind.Orders` o ON c.CustomerID = o.CustomerID
GROUP BY c.CustomerID, c.CompanyName
ORDER BY num_orders DESC
```

**Hint:** LEFT JOIN Customers to Orders so customers with zero orders are kept, then GROUP BY customer and COUNT(o.OrderID) (counting the order key, not *, so empty customers score 0).

### For each customer, we want to calculate how much they spent within 2016.

Show the:

*   **CustomerID** and **CompanyName** for each customer
*   The **total price** for their orders, ignoring the discount (use Quantity and UnitPrice fields in the OrderDetails table; the amount paid for each product is **Quantity \* UnitPrice**. )
*   the **total discount applied** to the order (consider the Discount field in the OrderDetails table, together with Quantity and UnitPrice fields; the applied discount is **Quantity \* UnitPrice \* Discount**)

Limit the analysis only to orders placed in 2016.

Order the results by CustomerID.

_used in 11 semester(s) · ✓ verified (10 rows)_

```sql
SELECT c.CustomerID, c.CompanyName,
  SUM(od.Quantity * od.UnitPrice) AS total_price,
  SUM(od.Quantity * od.UnitPrice * CAST(od.Discount AS FLOAT64)) AS total_discount
FROM `nyu-datasets.northwind.Customers` c
JOIN `nyu-datasets.northwind.Orders` o ON c.CustomerID = o.CustomerID
JOIN `nyu-datasets.northwind.OrderDetails` od ON o.OrderID = od.OrderID
WHERE EXTRACT(YEAR FROM o.OrderDate) = 2016
GROUP BY c.CustomerID, c.CompanyName
ORDER BY c.CustomerID
```

**Hint:** Three-table join (Customers - Orders - OrderDetails), filter to 2016 with EXTRACT(YEAR FROM OrderDate); SUM(Quantity*UnitPrice) for gross and SUM(Quantity*UnitPrice*Discount) for the discount. Discount is stored as text, so CAST it to a number first.

### **_Hard question. Requires use of subqueries and CASE WHEN._**

We want to create groups of customers **based on their total amount spent _after_ discounts**, in 2016. We will create three groups:

*   **Low**, for customers spending between 0 and 1000
*   **Medium**, for customers spending between 1000 and 5000,
*   **High**, for customers spending above 5000

The output should list the CustomerID, the CompanyName, the total amount spent before discounts, the total discount applied, and the grouping

You will need to use the results from the question "**_Total amount spent per customer in 2016_**" as a subquery, and then use the CASE WHEN structure to define the three groups. Do not worry about edge cases for the three groups (ie for amounts spent equal to 1000 and 5000).

_used in 11 semester(s) · ✓ verified (81 rows)_

```sql
WITH per_customer AS (
  SELECT
    c.CustomerID,
    c.CompanyName,
    SUM(od.UnitPrice * od.Quantity) AS total_before_discount,
    SUM(od.UnitPrice * od.Quantity * CAST(od.Discount AS FLOAT64)) AS total_discount,
    SUM(od.UnitPrice * od.Quantity * (1 - CAST(od.Discount AS FLOAT64))) AS total_after_discount
  FROM `nyu-datasets.northwind.Customers` c
  JOIN `nyu-datasets.northwind.Orders` o ON c.CustomerID = o.CustomerID
  JOIN `nyu-datasets.northwind.OrderDetails` od ON o.OrderID = od.OrderID
  WHERE EXTRACT(YEAR FROM o.OrderDate) = 2016
  GROUP BY c.CustomerID, c.CompanyName
)
SELECT
  CustomerID,
  CompanyName,
  total_before_discount,
  total_discount,
  CASE
    WHEN total_after_discount < 1000 THEN 'Low'
    WHEN total_after_discount < 5000 THEN 'Medium'
    ELSE 'High'
  END AS spending_group
FROM per_customer
ORDER BY total_after_discount DESC
```

**Hint:** Build a subquery/CTE that aggregates per customer for 2016 (join Customers-Orders-OrderDetails, filter with EXTRACT(YEAR FROM OrderDate)=2016), then bucket the after-discount total with CASE WHEN. Amount before discount = SUM(UnitPrice*Quantity); after-discount uses the (1 - Discount) factor.

### Show the date/time of the first order ever date in the Orders table

_used in 1 semester(s) · ✓ verified (1 rows)_

```sql
SELECT MIN(OrderDate) AS first_order_date
FROM `nyu-datasets.northwind.Orders`
```

**Hint:** Use the MIN() aggregate on the OrderDate column to get the earliest order timestamp.

### We would like to see, **for each shipper**, the number of orders they have handled and the number of distinct days that they came to the warehouse to pick the orders (according to the the ShippedDate column in Orders). Show the **ShipperID**, the **CompanyName** of the shipper, the **number of orders** the shipper handled, and the **number of distinct days** that each shipper came to the warehouse.

_used in 1 semester(s) · ✓ verified (3 rows)_

```sql
SELECT
  s.ShipperID,
  s.CompanyName,
  COUNT(o.OrderID) AS num_orders,
  COUNT(DISTINCT DATE(o.ShippedDate)) AS distinct_ship_days
FROM `nyu-datasets.northwind.Shippers` s
LEFT JOIN `nyu-datasets.northwind.Orders` o
  ON o.ShipVia = s.ShipperID
GROUP BY s.ShipperID, s.CompanyName
ORDER BY s.ShipperID
```

**Hint:** LEFT JOIN Shippers to Orders on ShipVia = ShipperID, then GROUP BY shipper; COUNT(OrderID) for orders and COUNT(DISTINCT DATE(ShippedDate)) for the distinct delivery days.

### For each supplier, list the total number of products they supply and the total quantity of these products that have been ordered. Display the SupplierID, CompanyName, TotalProducts, and TotalQuantityOrdered. (7.5pts)

_used in 1 semester(s) · ✓ verified (29 rows)_

```sql
SELECT
  s.SupplierID,
  s.CompanyName,
  COUNT(DISTINCT p.ProductID) AS TotalProducts,
  IFNULL(SUM(od.Quantity), 0) AS TotalQuantityOrdered
FROM `nyu-datasets.northwind.Suppliers` s
JOIN `nyu-datasets.northwind.Products` p
  ON p.SupplierID = s.SupplierID
LEFT JOIN `nyu-datasets.northwind.OrderDetails` od
  ON od.ProductID = p.ProductID
GROUP BY s.SupplierID, s.CompanyName
ORDER BY s.SupplierID
```

**Hint:** Join Suppliers -> Products (count distinct products) and LEFT JOIN to OrderDetails to SUM(Quantity) ordered; GROUP BY supplier. Use IFNULL so suppliers with no orders show 0.
