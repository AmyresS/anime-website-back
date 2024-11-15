module.exports = {

    // Запит для вибору всіх аніме  
    SELECT_ANIME: `
        SELECT * FROM "anime"
    `,
  
    // Запит для вибору конкретного аніме за айді
    SELECT_ANIME_BY_ID: `
        SELECT * FROM "anime" WHERE "id" = $1
    `,
  
    // Запит для видалення аніме
    DELETE_ANIME: `
        DELETE FROM "anime" WHERE "id" = $1
    `,
  
    // Запит для вибору епізоду за аніме та назвою епізоду
    SELECT_EPISODE: `
        SELECT * FROM "episodes" 
        WHERE "animeId" = (SELECT "id" FROM "anime" WHERE "title" = $1) 
        AND "episodeName" = $2
    `,

    // Запит для вибору числа к-сті серій у аніме
    SELECT_EPISODES_COUNT: `
        SELECT COUNT(*) FROM episodes 
        WHERE "animeId" = $1
    `,
  
    // Запит для вибору всіх епізодів за айді аніме
    SELECT_EPISODES_BY_ANIME_ID: `
        SELECT * FROM "episodes" 
        WHERE "animeId" = $1
    `,
  
    // Запит для отримання шляху та мови медіафайлу за айді епізоду та типом файлу
    SELECT_MEDIA_BY_EPISODE_AND_TYPE: `
        SELECT "id", "filePath", "fileName", "language" 
        FROM "media_files" 
        WHERE "episodeId" = $1 AND "fileType" = $2
    `,
  
    // Запит для отримання айді епізоду за айді аніме та номером епізоду
    SELECT_EPISODE_ID_BY_ANIME_AND_NUMBER: `
        SELECT "id" 
        FROM "episodes" 
        WHERE "animeId" = $1 AND "episodeNumber" = $2
    `,
  
    // Запит для вставки нового епізоду
    INSERT_EPISODE: `
        INSERT INTO "episodes" ("animeId", "episodeNumber", "episodeName", "filePath", "processed") 
        VALUES ((SELECT "id" FROM "anime" WHERE "title" = $1), $2, $3, $4, $5)
        RETURNING "id"
    `,
  
    // Запит для оновлення статусу обробки епізоду
    UPDATE_EPISODE_STATUS: `
        UPDATE "episodes" 
        SET "processed" = $1, "lastProcessed" = $2, "error" = $3
        WHERE "id" = $4
    `,
  
    // Запит для оновлення помилки епізоду
    UPDATE_EPISODE_ERROR: `
        UPDATE "episodes" 
        SET "error" = $1, "processed" = $2 
        WHERE "id" = $3
    `,
  
    // Запит для оновлення успішної обробки епізоду
    UPDATE_EPISODE_SUCCESS: `
        UPDATE "episodes" 
        SET "processed" = $1, "lastProcessed" = $2 
        WHERE "id" = $3
    `,
  
    // Додатковий запит для вставки нового аніме (після індексації)
    INSERT_ANIME: `
        INSERT INTO "anime" ("title", "description", "yearReleased", "episodeCount") 
        VALUES ($1, $2, $3, $4) 
        RETURNING "id"
    `,
  
    // Додатковий запит для оновлення кількості епізодів аніме (після індексації)
    UPDATE_ANIME_EPISODE_COUNT: `
        UPDATE "anime" 
        SET "episodeCount" = $1 
        WHERE "id" = $2
    `,
  
    // Запит для оновлення даних про аніме
    UPDATE_ANIME: `
        UPDATE "anime" 
        SET "title" = $1, "description" = $2, "yearReleased" = $3 
        WHERE "id" = $4 RETURNING *
    `,
  
    // Запит для вставки нового жанру
    INSERT_GENRE: `
        INSERT INTO "genres" ("name") 
        VALUES ($1) 
        ON CONFLICT ("name") DO NOTHING
    `,
  
    // Запит для зв’язку аніме з жанром у таблиці `anime_genres`
    LINK_ANIME_GENRE: `
        INSERT INTO "anime_genres" ("animeId", "genreId") 
        VALUES ($1, $2)
    `,
  
    // Запит для додавання альтернативної назви
    INSERT_ALTERNATIVE_TITLE: `
        INSERT INTO "alternative_titles" ("animeId", "title", "language") 
        VALUES ($1, $2, $3)
    `,
  
    // Запит для пошуку аніме за оригінальною та альтернативними назвами
    SEARCH_ANIME: `
        SELECT DISTINCT a.* 
        FROM "anime" a
        LEFT JOIN "alternative_titles" at ON a."id" = at."animeId"
        WHERE LOWER(a."title") LIKE LOWER($1) 
        OR LOWER(at."title") LIKE LOWER($1)
    `,
  
    // Запит для вставки нового медіафайлу
    INSERT_MEDIA_FILE: `
      INSERT INTO "media_files" ("episodeId", "fileType", "filePath", "fileName", "language") 
      VALUES ($1, $2, $3, $4, $5)
    `,
  
    // Запит для отримання жанрів аніме із таблиці `anime_genres`
    GET_GENRES: `
        SELECT g."name" FROM "genres" g
        JOIN "anime_genres" ag ON g."id" = ag."genreId"
        WHERE ag."animeId" = $1
    `,
  
    // Запит для отримання додаткових назв аніме
    GET_ALTERNATIVE_TITLES: `
      SELECT "title" FROM "alternative_titles"
      WHERE "animeId" = $1
    `,
  
    // Запит для отримання епізоду за айді аніме
    GET_EPISODE_BY_ANIME_ID: `
        SELECT * FROM "episodes" 
        WHERE "animeId" = $1
        AND "episodeNumber" = $2
    `,
  };
  