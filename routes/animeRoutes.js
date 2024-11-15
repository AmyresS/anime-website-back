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

// Маршрут для потокової передачі відео епізоду
router.get('/:id/episode/:episodeNumber/video', animeController.streamEpisodeVideo);

// Маршрут для отримання списку доступних субтитрів
router.get('/:id/episode/:episodeNumber/subtitles', animeController.getAvailableSubtitles);

// Маршрут для потокової передачі обраних субтитрів
router.get('/:id/episode/:episodeNumber/subtitles/:subtitleName', animeController.streamSelectedSubtitle);

// Маршрут для потокової передачі аудіо епізоду
router.get('/:id/episode/:episodeNumber/audio/:track', animeController.streamEpisodeAudio);

module.exports = router;
