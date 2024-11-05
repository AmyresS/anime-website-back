const Anime = require('../models/animeModel');
const fs = require('fs');
const path = require('path');
const networkPath = 'E:/Media/Anime';

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

exports.getAnimeEpisodes = async (req, res) => {
    const animeTitle = req.params.title;
    const animePath = path.join(networkPath, animeTitle);

    // Читаємо файли в директорії
    fs.readdir(animePath, (err, files) => {
        if (err) return res.status(500).json({ message: 'Помилка при доступі до файлів', error: err });
        
        // Фільтруємо файли з розширенням .mkv та сортуємо їх за номером епізоду
        const episodes = files
            .filter(file => file.endsWith('.mkv'))
            .sort((a, b) => {
                const numA = parseInt(a.match(/\[(\d+)\]/)?.[1] || '0', 10);
                const numB = parseInt(b.match(/\[(\d+)\]/)?.[1] || '0', 10);
                return numA - numB;
            });

        res.json(episodes);
    });
};



exports.streamEpisode = (req, res) => {
    const animeTitle = req.params.title;
    const episode = req.params.episode;
    const filePath = path.join(networkPath, animeTitle, episode);

    // Перевірка на наявність файлу
    fs.stat(filePath, (err, stats) => {
        if (err) return res.status(404).json({ message: 'Файл не знайдено' });

        // Налаштовуємо заголовки для потокового передавання
        const { range } = req.headers;
        if (!range) {
            return res.status(416).send('Requires Range header');
        }

        const fileSize = stats.size;
        const chunkSize = 10 ** 6;
        const start = Number(range.replace(/\D/g, ""));
        const end = Math.min(start + chunkSize, fileSize - 1);

        const contentLength = end - start + 1;
        const headers = {
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': contentLength,
            'Content-Type': 'video/mkv',
        };

        res.writeHead(206, headers);
        const stream = fs.createReadStream(filePath, { start, end });
        stream.pipe(res);
    });
};