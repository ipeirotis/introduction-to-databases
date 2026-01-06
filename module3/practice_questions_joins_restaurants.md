# JOIN practice queries. 

## Restaurants Database


1. Output the names of the restaurants together with the comments written for these restaurants:

    a. Your output should include only those restaurants for which reviews were submitted; do
not output empty comments (NULL values);

    b. Your output should contain the names of all the restaurants from your database; if some
restaurants are not reviewed or their comments are empty, these restaurants should
still be included in your output (with NULL values for the comment attribute);

    c. Your output should contain the names of all the restaurants from your database; if some
restaurants are not reviewed or their comments are empty, these restaurants should
still be included in your output (with NULL values for the comment attribute); make sure
that the output contains only distinct records (e.g., if a restaurant has two reviews with
empty comments, there should be only one record in the output relation corresponding
to this situation).

2. For every review stored in the database output the review id, first and last names of the critic
together with the comments left by this critic for each of the reviews.

3. Output the critic’s first and last names, restaurant name, and the star rating assigned by the
critic to the restaurant for all the reviews where the star rating is greater or equal to 3.

4. For all the Manhattan restaurants output the following information regarding all the reviews
submitted for these restaurants: the name of the restaurant, its cuisine, the name of the food
critic, food critic’s affiliation, star rating assigned by the critic, date the review was written and
the comments:

    a. Include in the output only those restaurants for which there are reviews in your DB.
    
    b. Include in your output all the information about all the Manhattan restaurants. If there
are Manhattan restaurants for which there are no reviews then the fields for the critic
and review should be null.

5. Output the rating code, the critic’s name who submitted this rating, the borough of the
restaurant for which the rating was given, and the star rating for all the ratings submitted after
January 1, 2010.
