module.exports = {
  // Запит для вибору епізоду за аніме та назвою епізоду
  SELECT_EPISODE: `
      SELECT * FROM episodes 
      WHERE anime_id = (SELECT id FROM anime WHERE title = $1) 
      AND episode_name = $2
  `,

  // Запит для вставки нового епізоду
  INSERT_EPISODE: `
      INSERT INTO episodes (anime_id, episode_name, file_path, processed) 
      VALUES ((SELECT id FROM anime WHERE title = $1), $2, $3, $4)
  `,

  // Запит для оновлення статусу обробки епізоду
  UPDATE_EPISODE_STATUS: `
      UPDATE episodes 
      SET processed = $1, last_processed = $2, error = $3
      WHERE id = $4
  `,

  // Запит для оновлення помилки епізоду
  UPDATE_EPISODE_ERROR: `
      UPDATE episodes 
      SET error = $1, processed = $2 
      WHERE anime_id = (SELECT id FROM anime WHERE title = $3) 
      AND episode_name = $4
  `,

  // Запит для оновлення успішної обробки епізоду
  UPDATE_EPISODE_SUCCESS: `
      UPDATE episodes 
      SET processed = $1, last_processed = $2 
      WHERE anime_id = (SELECT id FROM anime WHERE title = $3) 
      AND episode_name = $4
  `,

  // Додатковий запит для вставки нового аніме (після індексації)
  INSERT_ANIME: `
      INSERT INTO anime (title, description, year_released, episode_count) 
      VALUES ($1, $2, $3, $4) 
      RETURNING id
  `,

  // Додатковий запит для оновлення кількості епізодів аніме
  UPDATE_ANIME_EPISODE_COUNT: `
      UPDATE anime 
      SET episode_count = $1 
      WHERE title = $2
  `,

  // Запит для вставки нового жанру
  INSERT_GENRE: `
      INSERT INTO genres (name) 
      VALUES ($1) 
      ON CONFLICT (name) DO NOTHING
  `,

  // Запит для зв’язку аніме з жанром у таблиці `anime_genres`
  LINK_ANIME_GENRE: `
      INSERT INTO anime_genres (anime_id, genre_id) 
      VALUES ($1, $2)
  `,

  // Запит для додавання альтернативної назви
  INSERT_ALTERNATIVE_TITLE: `
      INSERT INTO alternative_titles (anime_id, title, language) 
      VALUES ($1, $2, $3)
  `,
};
