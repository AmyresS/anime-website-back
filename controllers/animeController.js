const Anime = require('../models/animeModel');

exports.getAllAnime = async (req, res) => {
    try {
        const animeList = await Anime.getAll();
        res.json(animeList);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

exports.getAnimeById = async (req, res) => {
    try {
        const anime = await Anime.getById(req.params.id);
        if (!anime) return res.status(404).json({ message: 'Anime not found' });
        res.json(anime);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

exports.createAnime = async (req, res) => {
    try {
        const newAnime = await Anime.create(req.body);
        res.status(201).json(newAnime);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

exports.updateAnime = async (req, res) => {
    try {
        const updatedAnime = await Anime.update(req.params.id, req.body);
        res.json(updatedAnime);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

exports.deleteAnime = async (req, res) => {
    try {
        await Anime.delete(req.params.id);
        res.status(204).end();
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};
