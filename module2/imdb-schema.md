````mermaid
erDiagram
    movies {
        INT id PK
        VARCHAR name
        INT year
        FLOAT rating
    }
    
    roles {
        INT actor_id FK
        INT movie_id FK
        VARCHAR role
    }
    
    actors {
        INT id PK
        VARCHAR first_name
        VARCHAR last_name
        CHAR gender
    }
    
    movies_directors {
        INT director_id FK
        INT movie_id FK
    }
    
    directors {
        INT id PK
        VARCHAR first_name
        VARCHAR last_name
    }
    
    movies_genres {
        INT movie_id FK
        VARCHAR genre
    }
    
    directors_genres {
        INT director_id FK
        VARCHAR genre
        FLOAT prob
    }

    movies ||--o{ roles : "has"
    actors ||--o{ roles : "plays"
    movies ||--o{ movies_directors : "directed_by"
    directors ||--o{ movies_directors : "directs"
    movies ||--o{ movies_genres : "categorized"
    directors ||--o{ directors_genres : "associated"
````
