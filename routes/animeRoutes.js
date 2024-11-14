const express = require('express');
const router = express.Router();
const animeController = require('../controllers/animeController');

// Маршрут для отримання всіх аніме
router.get('/', animeController.getAllAnime);

// Маршрут для отримання детальної інформації про аніме за ID
router.get('/:id/details', animeController.getAnimeById);

// Маршрут для оновлення інформації про аніме
router.put('/:id', animeController.updateAnime);

// Маршрут для додавання жанру до аніме
router.post('/:id/genre', animeController.updateAnimeGenre);

// Маршрут для видалення аніме
router.delete('/:id', animeController.deleteAnime);

// Маршрут для пошуку аніме за назвою (з підтримкою альтернативних назв)
router.get('/search', animeController.searchByTitle);

// Маршрут для додавання нового жанру
router.post('/genre', animeController.addNewGenre);

// Маршрут для додавання нової альтернативної назви до аніме
router.post('/:id/alternative-title', animeController.addNewAlternativeTitle);

// Маршрут для отримання всіх епізодів конкретного аніме
router.get('/:id/episodes', animeController.getAnimeEpisodes);

// Маршрут для отримання конкретного епізоду за номером
router.get('/:id/episode/:episodeNumber', animeController.getEpisode);

// Маршрут для потокової передачі відео епізоду
router.get('/:id/episode/:episodeNumber/video', animeController.streamEpisodeVideo);

// Маршрут для отримання списку доступних аудіо доріжок 
router.get('/:id/episode/:episodeNumber/audio/:track', animeController.streamEpisodeAudio);

// Маршрут для потокової передачі аудіо епізоду
router.get('/:id/episode/:episodeNumber/audio/:track', animeController.streamEpisodeAudio);

// Маршрут для отримання списку доступних субтитрів
router.get('/:id/episode/:episodeNumber/subtitles', animeController.getAvailableSubtitles);

// Маршрут для передачі обраних субтитрів
router.get('/:id/episode/:episodeNumber/subtitles/:subtitleName', animeController.streamSelectedSubtitle);


module.exports = router;
