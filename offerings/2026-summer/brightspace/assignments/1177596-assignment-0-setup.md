# Assignment 0: Setup

- **Brightspace id:** 1177596
- **Due:** 2026-05-19T03:59:59.000Z
- **Hidden:** false

## Instructions

This assignment ensures that you are all set up and ready to follow the material presented in the course. 

### Access BigQuery

*   Go to [https://console.cloud.google.com](https://console.cloud.google.com) and log in using your NYU account
*   Click on the **upper left corner** and create a "New Project"
*   Pick any name for your project and select "nyu.edu" as your organization
*   Go to [https://console.cloud.google.com/bigquery?project=nyu-datasets](https://console.cloud.google.com/bigquery?project=nyu-datasets) 
*   **Press the "star" button next to "nyu-datasets" to bookmark it**
*   When you open the "nyu-datasets", you should be able to see a few databases like "citibike", "facebook", "imdb", "google\_trends", "prosper\_data", "weather", etc.
*   Select "**citibike**" to open; select "**m\_dataset**" and press the three vertical dots next to it; then select "Query"
*   Type the query below  
    
    **SELECT \* FROM \`nyu-datasets.citibike.m\_dataset\` LIMIT 1000  
    **and execute it by pressing the "Run" button.
    

**Deliverable**: Submit a screenshot of **your query and the results**, demonstrating that:

*   You could run the query and access the datasets under "nyu-datasets".
*   You have starred the nyu-projects project, so you can access it and see it from other projects.

If you face problems:

*   **If your "Run" button is grayed out, ensure that you have set up billing. You may want to enable the free $300 trial for 90 days as a billing setup, even though we will never query BigQuery enough to exceed the monthly free tier.** 
*   **Make sure that you have selected your own project from the top-left corner.**
*   **Make sure to add the star (\*) character after SELECT**
