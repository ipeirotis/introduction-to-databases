# CarConnect Teaching Database Schema

BigQuery dataset: `nyu-datasets.carconnect_teaching`

This is the implemented version of the **CarConnect** business scenario used
in Assignment 1a (ER diagrams and relational schemas). Students design the
schema in Module 1 and then query this implementation in Module 2 onward.
The data is small (fewer than a dozen rows per table) and fully fictional, so
queries can be checked by hand.

```mermaid
erDiagram
    vehicles {
        STRING vin PK
        STRING make
        STRING model
        INT model_year
        STRING factory_color
        STRING factory_trim
        INT current_dealership_id FK "FK to dealerships"
    }
    dealerships {
        INT dealership_id PK
        STRING legal_name
        STRING lot_address
        STRING franchise_brand "NULL when independent"
    }
    owners {
        INT owner_id PK
        STRING owner_name
    }
    agents {
        INT agent_id PK
        STRING agent_name
        STRING license_no
    }
    listing_statuses {
        STRING status PK "Active, Withdrawn, Expired, Sold"
    }
    listings {
        INT listing_id PK
        STRING vin FK "FK to vehicles"
        DATE date_posted
        NUMERIC asking_price
        STRING status FK "FK to listing_statuses"
        INT seller_agent_id FK "FK to agents"
        INT created_by_owner_id FK "FK to owners; who posted it"
    }
    sale_transactions {
        INT transaction_id PK
        STRING vin FK "FK to vehicles"
        DATE sale_date
        NUMERIC sale_price
        INT listing_id FK "FK to listings; NULL if no listing"
        INT buyer_agent_id FK "FK to agents; NULL if none"
    }
    transaction_buyers {
        INT transaction_id PK "Composite PK (1/2), FK to sale_transactions"
        INT owner_id PK "Composite PK (2/2), FK to owners"
    }

    dealerships ||--o{ vehicles : "stores"
    vehicles ||--o{ listings : "advertised in"
    vehicles ||--o{ sale_transactions : "sold in"
    owners ||--o{ listings : "posts"
    agents ||--o{ listings : "seller-side agent"
    agents |o--o{ sale_transactions : "buyer-side agent (optional)"
    listing_statuses ||--o{ listings : "status of"
    listings |o--o| sale_transactions : "may lead to"
    sale_transactions ||--|{ transaction_buyers : "bought by"
    owners ||--o{ transaction_buyers : "buys in"
```

## Notes for reading the schema

- **Ownership is inferred, not stored.** There is no "current owner" column.
  The buyers of the most recent `sale_transactions` row for a VIN are the
  current owners; the buyers of the sale before that were the sellers. Joint
  purchases appear as multiple `transaction_buyers` rows for one transaction.
- **Listings and sales are optional in both directions.** A listing may never
  lead to a sale (`Expired`, `Withdrawn`, or still `Active`), and a sale may
  have no listing (`sale_transactions.listing_id IS NULL`), e.g. a private
  sale or an initial dealer sale.
- **Two agent roles, one table.** `listings.seller_agent_id` is required (every
  listing has exactly one seller-side agent). `sale_transactions.buyer_agent_id`
  is optional and often NULL.
- **Status values** are documented by the `listing_statuses` lookup table, so
  `SELECT * FROM listing_statuses` lists the valid values. The foreign key
  from `listings.status` to it is declared but, like all BigQuery key
  constraints, not enforced: BigQuery would accept a listing with a status
  outside the lookup table. The lookup records the valid domain; enforcing it
  would be the job of whatever loads the data.
- **Differences from the Assignment 1a spec** worth pointing out to students:
  `transaction_buyers` is the bridge table that implements "multiple buyers
  may purchase jointly"; `listings.created_by_owner_id` is an explicit
  extension recording who posted the listing; `vehicles.current_dealership_id`
  stores only the *current* lot, so lot history is not recoverable.

## Size

Every table holds fewer than a dozen rows, so any query result can be checked
by hand. Exact row counts are answer-side material and live in the private
answers repo (see `CLAUDE.md`).
