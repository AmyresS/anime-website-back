const AnimeService = require('../services/animeService');
const path = require('path');
const { networkPath } = require('../config/config');

exports.getAllAnime = async (req, res) => {
    try {
        const animeList = await AnimeService.getAllAnime();
        res.json(animeList);
    } catch (error) {
        res.status(500).json({ message: 'Помилка сервера', error });
    }
};

exports.getAnimeById = async (req, res) => {
    try {
        const anime = await AnimeService.getAnimeById(req.params.id);
        if (!anime) return res.status(404).json({ message: 'Аніме не знайдено' });

        const genres = await AnimeService.getGenres(req.params.id);
        const alternativeTitles = await AnimeService.getAlternativeTitles(req.params.id);

        anime.genres = genres;
        anime.alternativeTitles = alternativeTitles;

        res.json(anime);
    } catch (error) {
        res.status(500).json({ message: 'Помилка сервера', error });
    }
};

exports.updateAnime = async (req, res) => {
    try {
        const updatedAnime = await AnimeService.updateAnime(req.params.id, req.body);
        res.json(updatedAnime);
    } catch (error) {
        res.status(500).json({ message: 'Помилка сервера', error });
    }
};

exports.deleteAnime = async (req, res) => {
    try {
        await AnimeService.deleteAnime(req.params.id);
        res.status(204).end();
    } catch (error) {
        res.status(500).json({ message: 'Помилка сервера', error });
    }
};

exports.searchByTitle = async (req, res) => {
    try {
        const animeList = await AnimeService.searchByTitle(req.query.title);
        res.json(animeList);
    } catch (error) {
        res.status(500).json({ message: 'Помилка сервера', error });
    }
};

exports.streamEpisodeVideo = async (req, res) => {
    const { id, episodeNumber } = req.params;

    try {
        const anime = await AnimeService.getAnimeById(id);
        if (!anime) return res.status(404).json({ message: 'Аніме не знайдено' });

        const episodePath = path.join(networkPath, anime.title, 'Processed', `episode_${episodeNumber}`, 'video.mp4');
        await AnimeService.streamFile(episodePath, res, "video/mp4");
    } catch (error) {
        res.status(500).json({ message: 'Помилка сервера', error });
    }
};

exports.streamEpisodeAudio = async (req, res) => {
    const { id, episodeNumber, track } = req.params;

    try {
        const anime = await AnimeService.getAnimeById(id);
        if (!anime) return res.status(404).json({ message: 'Аніме не знайдено' });

        const episodePath = path.join(networkPath, anime.title, 'Processed', `episode_${episodeNumber}`, `audio_track_${track}.aac`);
        await AnimeService.streamFile(episodePath, res, "audio/aac");
    } catch (error) {
        res.status(500).json({ message: 'Помилка сервера', error });
    }
};

exports.streamSelectedSubtitle = async (req, res) => {
    const { id, episodeNumber, subtitleName } = req.params;

    try {
        const anime = await AnimeService.getAnimeById(id);
        if (!anime) return res.status(404).json({ message: 'Аніме не знайдено' });

        const subtitlePath = path.join(networkPath, anime.title, 'Processed', `episode_${episodeNumber}`, `${subtitleName}.ass`);
        await AnimeService.streamFile(subtitlePath, res, "text/plain; charset=utf-8");
    } catch (error) {
        res.status(500).json({ message: 'Помилка сервера', error });
    }
};

exports.getAvailableSubtitles = async (req, res) => {
    const { id, episodeNumber } = req.params;

    try {
        const subtitles = await AnimeService.getAvailableSubtitles(id, episodeNumber);
        res.json({ subtitles });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
