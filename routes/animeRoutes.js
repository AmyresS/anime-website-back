const express = require('express');
const router = express.Router();
const animeController = require('../controllers/animeController');

// Маршрут для отримання всіх аніме
router.get('/', animeController.getAllAnime);

// Маршрут для отримання детальної інформації про аніме за ID
router.get('/:id/details', animeController.getAnimeById);

// Маршрут для оновлення інформації про аніме
router.put('/:id', animeController.updateAnime);

// Маршрут для видалення аніме
router.delete('/:id', animeController.deleteAnime);

// Маршрут для пошуку аніме за назвою
router.get('/search', animeController.searchByTitle);

// Маршрут для отримання усіх медіа файлів епізоду конкретних типів (audio/video/subtitles)
router.get('/:id/episode/:episodeNumber/media', animeController.getMedia);

// Маршрут для потокової передачі обраного файлу
router.get('/stream/:id', animeController.streamFile);

module.exports = router;
