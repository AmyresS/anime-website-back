module.exports = {
    SELECT_EPISODE: 'SELECT * FROM episodes WHERE anime_title = $1 AND episode_name = $2',
    INSERT_EPISODE: 'INSERT INTO episodes (anime_title, episode_name, file_path, processed) VALUES ($1, $2, $3, $4)',
    UPDATE_EPISODE_STATUS: 'UPDATE episodes SET processed = $1, last_processed = $2, error = $3 WHERE id = $4',
    UPDATE_EPISODE_ERROR: 'UPDATE episodes SET error = $1, processed = $2 WHERE anime_title = $3 AND episode_name = $4',
    UPDATE_EPISODE_SUCCESS: 'UPDATE episodes SET processed = $1, last_processed = $2 WHERE anime_title = $3 AND episode_name = $4',
  };
  