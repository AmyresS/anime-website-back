const Anime = require('../models/animeModel');
const pool = require('../config/db');
const fs = require('fs');
const path = require('path');
const { networkPath } = require('../config/config');


exports.getAllAnime = async (req, res) => {
    try {
        const animeList = await Anime.getAll();
        res.json(animeList);
    } catch (error) {
        res.status(500).json({ message: 'Помилка сервера', error });
    }
};

exports.getAnimeById = async (req, res) => {
    try {
        const anime = await Anime.getById(req.params.id);
        if (!anime) return res.status(404).json({ message: 'Аніме не знайдено' });

        const genres = await Anime.getGenres(req.params.id);
        const alternativeTitles = await Anime.getAlternativeTitles(req.params.id);

        anime.genres = genres.map(g => g.name);
        anime.alternativeTitles = alternativeTitles.map(t => t.title);

        res.json(anime);
    } catch (error) {
        res.status(500).json({ message: 'Помилка сервера', error });
    }
};

exports.updateAnime = async (req, res) => {
    try {
        const updatedAnime = await Anime.updateAnime(req.params.id, req.body);
        res.json(updatedAnime);
    } catch (error) {
        res.status(500).json({ message: 'Помилка сервера', error });
    }
};

exports.updateAnimeGenre = async (req, res) => {
    try {
        const result = await Anime.updateAnimeGenre(req.params.id, req.body);
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: 'Помилка сервера', error });
    }
};

exports.deleteAnime = async (req, res) => {
    try {
        await Anime.deleteAnime(req.params.id);
        res.status(204).end();
    } catch (error) {
        res.status(500).json({ message: 'Помилка сервера', error });
    }
};

exports.searchByTitle = async (req, res) => {
    try {
        const title = req.query.title;
        const animeList = await Anime.searchByTitle(title);
        res.json(animeList);
    } catch (error) {
        res.status(500).json({ message: 'Помилка сервера', error });
    }
};

exports.addNewGenre = async (req, res) => {
    try {
        const newGenre = await Anime.addNewGenre(req.body);
        res.status(201).json(newGenre);
    } catch (error) {
        res.status(500).json({ message: 'Помилка сервера', error });
    }
};

exports.addNewAlternativeTitle = async (req, res) => {
    try {
        const newAlternativeTitle = await Anime.addNewAlternativeTitle(req.params.id, req.body);
        res.status(201).json(newAlternativeTitle);
    } catch (error) {
        res.status(500).json({ message: 'Помилка сервера', error });
    }
};

exports.getAnimeEpisodes = async (req, res) => {
    try {
        const episodes = await Anime.getAnimeEpisodes(req.params.id);
        res.json(episodes);
    } catch (error) {
        res.status(500).json({ message: 'Помилка сервера', error });
    }
};

exports.getEpisode = async (req, res) => {
    try {
        const episode = await Anime.getEpisode(req.params.id, req.params);
        if (!episode) return res.status(404).json({ message: 'Епізод не знайдено' });
        res.json(episode);
    } catch (error) {
        res.status(500).json({ message: 'Помилка сервера', error });
    }
};

exports.streamEpisodeVideo = async (req, res) => {
    const { id, episodeNumber } = req.params;

    try {
        // Отримуємо назву аніме (title) та назву епізоду (episode_name)
        const animeQuery = await pool.query('SELECT title FROM anime WHERE id = $1', [id]);
        const episodeQuery = await pool.query('SELECT episode_name FROM episodes WHERE anime_id = $1 AND episode_number = $2', [id, episodeNumber]);

        if (animeQuery.rowCount === 0 || episodeQuery.rowCount === 0) {
            return res.status(404).json({ message: 'Аніме або епізод не знайдено' });
        }

        const animeTitle = animeQuery.rows[0].title;
        const episodeName = episodeQuery.rows[0].episode_name;

        const episodePath = path.join(networkPath, animeTitle, 'Processed', episodeName, 'video.mp4');

        fs.stat(episodePath, (err, stats) => {
            if (err) {
                return res.status(404).json({ message: 'Відеофайл не знайдено' });
            }

            const range = req.headers.range;
            if (!range) {
                return res.status(416).send('Requires Range header');
            }

            const CHUNK_SIZE = 10 ** 6; // 1MB
            const start = Number(range.replace(/\D/g, ""));
            const end = Math.min(start + CHUNK_SIZE, stats.size - 1);

            const contentLength = end - start + 1;
            const headers = {
                "Content-Range": `bytes ${start}-${end}/${stats.size}`,
                "Accept-Ranges": "bytes",
                "Content-Length": contentLength,
                "Content-Type": "video/mp4",
            };

            res.writeHead(206, headers);

            const videoStream = fs.createReadStream(episodePath, { start, end });
            videoStream.pipe(res);
        });
    } catch (error) {
        console.error('Помилка при потоковій передачі відео:', error);
        res.status(500).json({ message: 'Помилка сервера' });
    }
};

exports.streamEpisodeAudio = async (req, res) => {
    const { id, episodeNumber, track } = req.params;

    try {
        const animeQuery = await pool.query('SELECT title FROM anime WHERE id = $1', [id]);
        const episodeQuery = await pool.query('SELECT episode_name FROM episodes WHERE anime_id = $1 AND episode_number = $2', [id, episodeNumber]);

        if (animeQuery.rowCount === 0 || episodeQuery.rowCount === 0) {
            return res.status(404).json({ message: 'Аніме або епізод не знайдено' });
        }

        const animeTitle = animeQuery.rows[0].title;
        const episodeName = episodeQuery.rows[0].episode_name;

        const audioPath = path.join(networkPath, animeTitle, 'Processed', episodeName, `audio_track_${track}.aac`);

        fs.stat(audioPath, (err, stats) => {
            if (err) {
                return res.status(404).json({ message: 'Аудіофайл не знайдено' });
            }

            res.setHeader("Content-Type", "audio/aac");
            fs.createReadStream(audioPath).pipe(res);
        });
    } catch (error) {
        console.error('Помилка при потоковій передачі аудіо:', error);
        res.status(500).json({ message: 'Помилка сервера' });
    }
};

exports.streamEpisodeSubtitles = async (req, res) => {
    const { id, episodeNumber, subTrack } = req.params;

    try {
        const animeQuery = await pool.query('SELECT title FROM anime WHERE id = $1', [id]);
        const episodeQuery = await pool.query('SELECT episode_name FROM episodes WHERE anime_id = $1 AND episode_number = $2', [id, episodeNumber]);

        if (animeQuery.rowCount === 0 || episodeQuery.rowCount === 0) {
            return res.status(404).json({ message: 'Аніме або епізод не знайдено' });
        }

        const animeTitle = animeQuery.rows[0].title;
        const episodeName = episodeQuery.rows[0].episode_name;

        const subtitlePath = path.join(networkPath, animeTitle, 'Processed', episodeName, `subs_${subTrack}.vtt`);

        fs.stat(subtitlePath, (err, stats) => {
            if (err) {
                return res.status(404).json({ message: 'Файл субтитрів не знайдено' });
            }

            res.setHeader("Content-Type", "text/vtt");
            fs.createReadStream(subtitlePath).pipe(res);
        });
    } catch (error) {
        console.error('Помилка при потоковій передачі субтитрів:', error);
        res.status(500).json({ message: 'Помилка сервера' });
    }
};

