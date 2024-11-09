const pool = require('../config/db');
const queries = require('../config/queries');

const Anime = {

    async getAll() {
        const result = await pool.query(queries.SELECT_ANIME);
        return result.rows;
    },

    async getById(id) {
        const result = await pool.query(queries.SELECT_ANIME_BY_ID, [id]);
        return result.rows[0];
    },

    async updateAnime(id, data) {
        const result = await pool.query(queries.UPDATE_ANIME, [data.title, data.description, data.year_released, id]);
        return result.rows[0];
    },

    async updateAnimeGenre(id, data) {
      const result = await pool.query(queries.LINK_ANIME_GENRE, [id, data.genreId]);
      return result.rows[0];
    },

    async deleteAnime(id) {
        await pool.query(queries.DELETE_ANIME, [id]);
    },

    async searchByTitle(title) {
        const values = [`%${title}%`];
        const result = await pool.query(queries.SEARCH_ANIME, values);
        return result.rows;
    },
    
    async getGenres(animeId) {
        const result = await pool.query(queries.GET_GENRES, [animeId]);
        return result.rows;
    },
    
    async addNewGenre(data){
        const result = await pool.query(queries.INSERT_GENRE, [data.genre]);
        return result.rows[0];
    },

    async getAlternativeTitles(animeId) {
        const result = await pool.query(queries.GET_ALTERNATIVE_TITLES, [animeId]);
        return result.rows;
    },

    async addNewAlternativeTitle(animeId, data) {
        const result = await pool.query(queries.INSERT_ALTERNATIVE_TITLE, [animeId, data.title, data.language]);
        return result.rows[0];
    },

    async getAnimeEpisodes(animeId) {
        const result = await pool.query(queries.SELECT_EPISODES_BY_ANIME_ID, [animeId]);
        return result.rows;
    },

    async getEpisode(animeId, data) {
        const result = await pool.query(queries.GET_EPISODE_BY_ANIME_ID, [animeId, data.episodeNumber]);
        return result.rows[0];
    }
};

module.exports = Anime;
