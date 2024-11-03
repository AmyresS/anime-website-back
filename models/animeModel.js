const pool = require('../config/db');

const Anime = {
    async getAll() {
        const result = await pool.query('SELECT * FROM anime');
        return result.rows;
    },
    async getById(id) {
        const result = await pool.query('SELECT * FROM anime WHERE id = $1', [id]);
        return result.rows[0];
    },
    async create(data) {
        const result = await pool.query(
            'INSERT INTO anime (title, description, genre, episodes) VALUES ($1, $2, $3, $4) RETURNING *',
            [data.title, data.description, data.genre, data.episodes]
        );
        return result.rows[0];
    },
    async update(id, data) {
        const result = await pool.query(
            'UPDATE anime SET title = $1, description = $2, genre = $3, episodes = $4 WHERE id = $5 RETURNING *',
            [data.title, data.description, data.genre, data.episodes, id]
        );
        return result.rows[0];
    },
    async delete(id) {
        await pool.query('DELETE FROM anime WHERE id = $1', [id]);
    },
};

module.exports = Anime;
