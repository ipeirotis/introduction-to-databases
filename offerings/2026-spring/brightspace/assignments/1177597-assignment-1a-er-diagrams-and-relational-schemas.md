# Assignment 1a: ER Diagrams and Relational Schemas

- **Brightspace id:** 1177597
- **Due:** 2026-05-19T03:59:59.000Z
- **Hidden:** false

## Instructions

#### Business Scenario

You have been hired by **CarConnect**, an online marketplace that links private vehicle owners, franchised dealers, and buyers nationwide. The data team needs an operational database that:

*   preserves the complete ownership history of every vehicle,
    
*   supports listings that may or may not convert into sales, and
    
*   captures the roles of professionals (“agents”) who assist the parties.
    

The domain expert supplied the following specifications.

1.  **Vehicle**
    
    *   Every car is identified by its **VIN** (Vehicle Identification Number) — globally unique and immutable.
        
    *   Fixed attributes: make, model, model-year, factory color, factory trim.
        
    *   Each vehicle is physically stored at one **Dealership** lot at any point in time. (A dealership may store zero or many vehicles; a vehicle is always stored at exactly one lot.)
        
2.  **Ownership & Transfers**
    
    *   At any moment a vehicle has one or more **Owner**(s).
        
    *   A change of ownership occurs exclusively through a **SaleTransaction**.
        
    *   A sale records `TransactionID`, `SaleDate`, and `SalePrice`.
        
    *   Each sale lists the **buyer**(s) only; the seller(s) are inferred from the immediately preceding sale.
        
    *   Multiple buyers may purchase jointly, and a buyer may participate in many transactions over time (collectors, leasing companies, etc.).
        
3.  **Listings**
    
    *   Before selling, an owner can create a **Listing** that advertises the vehicle.
        
    *   A vehicle may have zero, one, or many listings over its life.
        
    *   A listing stores `ListingID`, `DatePosted`, `AskingPrice`, and a status flag (`Active`, `Withdrawn`, `Expired`, `Sold`).
        
    *   Exactly one **seller-side Agent** (a licensed dealer or private broker) manages each listing.
        
    *   A listing may, optionally, lead to a SaleTransaction. If it does, there is a one-to-one link between that listing and the resulting sale.
        
4.  **Agents**
    
    *   **Buyer-side Agent**: an (optional) professional who assists buyers; recorded only when a sale is completed.
        
    *   **Seller-side Agent**: described above; tied to listings, never directly to transactions.
        
    *   A single person or firm may take both roles in different deals, but never both roles in the same sale.
        
5.  **Dealership**
    
    *   Identified by `DealershipID`, with static attributes: legal name, lot address, and franchise brand (if any).
        

**Design objectives**

*   Produce an **ER diagram** that shows all entities, attributes, and relationship cardinalities.
    
*   Translate the diagram into relational tables with primary keys and foreign keys that enforce those cardinalities.
    
*   Ensure the design eliminates redundancy and guards against anomalies (e.g., a vehicle simultaneously stored in two lots, conflicting owner histories, orphan listings).
    

**Deliverables**

*   Create an ER diagram illustrating the entities, their attributes, the relationships among entities, and the cardinalities of the entities.
*   Create the relational schema (i.e., tables with attributes, primary keys, and foreign keys) that implements the ER diagram as a relational schema.
*   You can submit your diagram and the tables as a Word or PDF file, or in any format we can easily read.

**Tools**

The [ERD Plus website](https://erdplus-old.com/) offers an easy-to-use tool for creating diagrams and schemas.

The ERD Plus website allows the easy transformation of an ER Diagram to a relational schema. Once you create the ER diagram, on the main screen, click on "options" (the three vertical dots) and then "Convert to Relational Schema." If you encounter problems in this step, something is missing from your ER Diagram; probably, you did not add a primary key for some entity, or you have not finished setting up the cardinalities of the relationships. Please ensure that the generated schema is correct; ERD Plus works well, but is not always perfect.
