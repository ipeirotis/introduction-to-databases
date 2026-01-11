###########################################################################
# ROUND-TRIP FARE CALCULATOR USING SELF-JOIN
# 
# Purpose: Calculate total round-trip fares for JFK ↔ LAX flights when 
#          booking both legs with the same ticketing carrier
#
# Technique: Self-join - joining a table to itself to pair related records
#            (outgoing flight with its corresponding return flight)
###########################################################################

SELECT 
    T1.ticketing_carrier,                    -- Airline operating both legs
    T1.fare AS outgoing_fare,                -- JFK → LAX fare
    T2.fare AS return_fare,                  -- LAX → JFK fare  
    (T1.fare + T2.fare) AS total_fare        -- Combined round-trip cost
FROM 
    nyu-datasets.flights.m_ticket_prices T1  -- Alias T1: outgoing flights
INNER JOIN 
    nyu-datasets.flights.m_ticket_prices T2  -- Alias T2: return flights (same table!)
    ON T1.ticketing_carrier = T2.ticketing_carrier  -- Same airline must operate both legs
    AND T2.origin = T1.dest                         -- Return starts where outgoing ended
    AND T2.dest = T1.origin                         -- Return ends where outgoing started
    AND T2.Year = T1.Year                           -- Same year
    AND T2.Quarter = T1.Quarter                     -- Same quarter    
WHERE 
    -- Data filters: which subset we're analyzing
    T1.Year = 2025                           -- Time period filter
    AND T1.Quarter = 2                       -- Q2 2025
    AND T1.origin = 'JFK'                    -- Depart from New York JFK
    AND T1.dest = 'LAX'                      -- Arrive at Los Angeles LAX
    AND T1.is_codeshare = FALSE              -- Exclude codeshare arrangements
    AND T2.is_codeshare = FALSE              -- Exclude codeshare arrangements

###########################################################################
# KEY CONCEPTS ILLUSTRATED:
#
# 1. SELF-JOIN: The same table appears twice with different aliases (T1, T2)
#    allowing us to compare/combine rows within the same table
#
# 2. TABLE ALIASES: T1 and T2 are mandatory here - without them, column
#    references would be ambiguous
#
# 3. DYNAMIC FILTERING: Using T2.origin = T1.dest instead of hardcoding
#    'LAX' makes the pattern reusable for any origin-destination pair
#
###########################################################################
