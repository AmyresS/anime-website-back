const pool = require('../config/db');
const queries = require('../config/queries');
const fs = require('fs');
const path = require('path');
const { networkPath } = require('../config/config');

const AnimeService = {
    async getAllAnime() {
        const result = await pool.query(queries.SELECT_ANIME);
        return result.rows;
    },

    async getAnimeById(id) {
        const result = await pool.query(queries.SELECT_ANIME_BY_ID, [id]);
        return result.rows[0];
    },

    async updateAnime(id, data) {
        const result = await pool.query(queries.UPDATE_ANIME, [data.title, data.description, data.year_released, id]);
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
        return result.rows.map(row => row.name);
    },

    async addNewGenre(data) {
        const result = await pool.query(queries.INSERT_GENRE, [data.genre]);
        return result.rows[0];
    },

    async getAlternativeTitles(animeId) {
        const result = await pool.query(queries.GET_ALTERNATIVE_TITLES, [animeId]);
        return result.rows.map(row => row.title);
    },

    async getAnimeEpisodes(animeId) {
        const result = await pool.query(queries.SELECT_EPISODES_BY_ANIME_ID, [animeId]);
        return result.rows;
    },

    async getEpisode(animeId, episodeNumber) {
        const result = await pool.query(queries.GET_EPISODE_BY_ANIME_ID, [animeId, episodeNumber]);
        return result.rows[0];
    },

    async getMedia(animeId, episodeNumber) {
        const episode = await pool.query(queries.SELECT_EPISODE_ID_BY_ANIME_AND_NUMBER, [animeId, episodeNumber]);
        if (episode.rowCount === 0) {
            throw new Error('Episode not found');
        }
        const mediaList = await pool.query(queries.SELECT_MEDIA_BY_EPISODE, [episode.rows[0].id]);
    
        return mediaList.rows;
    },

    async getMediaFilepath (id) {
        const result = await pool.query(queries.GET_MEDIA_FILEPATH, [id]);
        return result.rows[0];
    },

    async streamFile(filePath, res, contentType) {
        const realPath = path.join(networkPath, filePath);
        fs.stat(realPath, (err, stats) => {
            if (err) {
                return res.status(404).json({ message: `${contentType} file not found` });
            }

            const range = res.req.headers.range;
            if (!range) {
                return res.status(416).send('Requires Range header');
            }

            const CHUNK_SIZE = 10 ** 6;
            const start = Number(range.replace(/\D/g, ""));
            const end = Math.min(start + CHUNK_SIZE, stats.size - 1);

            const contentLength = end - start + 1;
            const headers = {
                "Content-Range": `bytes ${start}-${end}/${stats.size}`,
                "Accept-Ranges": "bytes",
                "Content-Length": contentLength,
                "Content-Type": contentType,
            };

            res.writeHead(206, headers);
            const stream = fs.createReadStream(realPath, { start, end });
            stream.pipe(res);
        });
    },
};

module.exports = AnimeService;
