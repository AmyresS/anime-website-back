const pool = require('../config/db');
const queries = require('../config/queries');
const fs = require('fs');
const path = require('path');
const { networkPath } = require('../config/config');

const { createLogger, format, transports } = require('winston');
const logger = createLogger({
    level: 'info',
    format: format.combine(
      format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      format.printf(({ timestamp, level, message }) => `${timestamp} [${level.toUpperCase()}]: ${message}`)
    ),
    transports: [
      new transports.Console(),
      new transports.File({ filename: 'application.log' })
    ],
  });

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

    async streamFile(filePath, res, contentType) {
        fs.stat(filePath, (err, stats) => {
            if (err) {
                return res.status(404).json({ message: `${contentType} файл не знайдено` });
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
            const stream = fs.createReadStream(filePath, { start, end });
            stream.pipe(res);
        });
    },

    async getAvailableSubtitles(animeId, episodeNumber) {
        const episode = await pool.query(queries.SELECT_EPISODE_ID_BY_ANIME_AND_NUMBER, [animeId, episodeNumber]);
        if (episode.rowCount === 0) {
            throw new Error('Епізод не знайдено');
        }
        // const episodeName = `episode_${episodeNumber}`;
        const subtitlesList = await pool.query(queries.SELECT_MEDIA_BY_EPISODE_AND_TYPE, [episode.rows[0].id, "subtitles"]);

        return subtitlesList.rows;
        // const subtitlesDir = path.join(networkPath, episodeName);

        // logger.info("hi");
        // console.log("hi2");
        // return new Promise((resolve, reject) => {
        //     fs.readdir(subtitlesDir, (err, files) => {
        //         if (err) {
        //             reject('Помилка при зчитуванні субтитрів');
        //         }
        //         const subtitles = files
        //             .filter(file => file.endsWith('.ass'))
        //             .map(file => ({
        //                 name: file.split('.')[0],
        //                 path: file
        //             }));
        //         resolve(subtitles);
        //     });
        // });
    }
};

module.exports = AnimeService;
