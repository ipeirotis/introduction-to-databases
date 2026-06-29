# General Practice: Northwind Dataset

- **Brightspace id:** 499813
- **Active:** true
- **Attempts:** Unlimited
- **Questions:** 8

## Questions (8)

### Q1 — Product names and categories

Retrieve the names of products along with the category name they belong to. Display the ProductID, ProductName, and CategoryName. Sort the results by CategoryName and then by ProductName.

### Q2 — Customers who have placed more than 10 orders

Find the customers who have placed more than 10 orders. Display the CustomerID, CompanyName, and the total number of orders they have placed

### Q3 — Customers without orders

List the names and id of customers who have never placed an order. Display the CustomerID and ContactName.

### Q4 — Countries with high Freight price

We want to identify the **ship countries** with the highest average freight charges. Return the **top-three** ship countries with the highest average freight overall, in descending order by average **freight**. _You only need the Orders table._

### Q5 — Number of orders each customer has placed

For each supplier, list the total number of products they supply and the total quantity of these products that have been ordered. Display the SupplierID, CompanyName, TotalProducts, and TotalQuantityOrdered.

### Q6 — Total price and number of products for each order

For each order, show the **customerID** who placed the order, and list the **number of products** in the order, the t**otal units in the order** (each order may contain multiple units of a product as reported in the "Quantity" field or OrderDetails), and the **total order price** for all the products (using the Quantity and UnitPrice fields in the OrderDetails table; ignore the Discount field). 

**Sort the results by decreasing total price and display only orders where the total price is above 10,000.**

### Q7 — Total revenue per supplier in 2014

For each supplier, we want to calculate how much revenue they generated from product sales in 2014, and display suppliers who generated more than $10,000 in revenue.

Show the:

*   SupplierID and CompanyName for each supplier
*   The total revenue generated from their products (use Quantity and UnitPrice fields in the OrderDetails table; the revenue for each product is Quantity \* UnitPrice)
*   The total discount applied to their products (consider the Discount field in the OrderDetails table, together with Quantity and UnitPrice fields; the applied discount is Quantity \* UnitPrice \* Discount)

Limit the analysis only to orders placed in 2014.

Order the results by SupplierID.

### Q8 — Total price and number of products for each order

For each order, show the **customerID** who placed the order, and list the **number of products** in the order, the t**otal units in the order** (each order may contain multiple units of a product as reported in the "Quantity" field or OrderDetails), and the **total order price** for all the products (using the Quantity and UnitPrice fields in the OrderDetails table; ignore the Discount field). 

**Sort the results by decreasing total price and display only orders where the total price is above 10,000.**
