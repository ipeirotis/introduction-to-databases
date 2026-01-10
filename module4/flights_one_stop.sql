###########################################################################
# ONE-STOP FLIGHT FINDER USING SELF-JOIN
# 
# Purpose: Find all possible one-stop itineraries from JFK to LAX
#          using the same ticketing carrier for both legs
#
# Technique: Self-join - joining a table to itself to chain flight segments
#            (first leg connects to second leg via intermediate airport)
###########################################################################

SELECT 
    T1.ticketing_carrier,                    -- Airline operating both legs
    T1.origin,                               -- Trip origin (JFK)
    T1.dest AS connection,                   -- Intermediate airport
    T2.dest,                                 -- Final destination (LAX)
    T1.fare AS first_leg_fare,               -- JFK → connection fare
    T2.fare AS second_leg_fare,              -- Connection → LAX fare
    (T1.fare + T2.fare) AS total_fare        -- Combined itinerary cost

FROM 
    nyu-datasets.flights.m_ticket_prices T1  -- Alias T1: first leg flights

INNER JOIN 
    nyu-datasets.flights.m_ticket_prices T2  -- Alias T2: second leg flights
    ON T1.ticketing_carrier = T2.ticketing_carrier  -- Same airline for both legs
    AND T2.origin = T1.dest                         -- Second leg starts where first leg ended
    AND T2.Year = T1.Year                           -- Same year
    AND T2.Quarter = T1.Quarter                     -- Same quarter

WHERE 
    -- ===== DATA FILTERS =====
    T1.Year = 2025                           -- Time period
    AND T1.Quarter = 2                       -- Q2 2025
    AND T1.origin = 'JFK'                    -- Trip starts at JFK
    AND T2.dest = 'LAX'                      -- Trip ends at LAX
    AND T1.is_codeshare = FALSE              -- Exclude codeshare arrangements
    AND T2.is_codeshare = FALSE

###########################################################################
# KEY CONCEPTS ILLUSTRATED:
#
# 1. CHAINING FLIGHTS: The join condition T2.origin = T1.dest creates a
#    chain where the first leg's destination becomes the second leg's origin
#
# 2. FILTERING ENDPOINTS: We only specify T1.origin (start) and T2.dest (end)
#    - the intermediate airport emerges naturally from the join
#
# 3. COMBINATORIAL EXPLOSION: This query finds ALL possible connections,
#    which could be many rows (every intermediate airport × every fare class)
#
###########################################################################
