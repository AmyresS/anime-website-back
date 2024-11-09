const Anime = require('../models/animeModel');

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
