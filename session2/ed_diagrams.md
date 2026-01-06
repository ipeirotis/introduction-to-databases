````mermaid
erDiagram
    movies {
        INT id PK
        VARCHAR name
        INT year
        FLOAT rating
    }
    actors {
        INT id PK
        VARCHAR first_name
        VARCHAR last_name
        CHAR gender
    }
    roles {
        INT actor_id FK
        INT movie_id FK
        VARCHAR role
    }
    directors {
        INT id PK
        VARCHAR first_name
        VARCHAR last_name
    }
    movies_directors {
        INT director_id FK
        INT movie_id FK
    }
    movies_genres {
        INT movie_id FK
        VARCHAR genre
    }
    
    actors ||--o{ roles : "plays"
    movies ||--o{ roles : "has"
    directors ||--o{ movies_directors : "directs"
    movies ||--o{ movies_directors : "directed_by"
    movies ||--o{ movies_genres : "has"
```
