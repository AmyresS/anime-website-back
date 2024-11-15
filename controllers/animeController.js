const AnimeService = require('../services/animeService');

exports.getAllAnime = async (req, res) => {
    try {
        const animeList = await AnimeService.getAllAnime();
        res.json(animeList);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

exports.getAnimeById = async (req, res) => {
    try {
        const anime = await AnimeService.getAnimeById(req.params.id);
        if (!anime) return res.status(404).json({ message: 'Anime not found' });

        const genres = await AnimeService.getGenres(req.params.id);
        const alternativeTitles = await AnimeService.getAlternativeTitles(req.params.id);

        anime.genres = genres;
        anime.alternativeTitles = alternativeTitles;

        res.json(anime);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

exports.getMedia = async (req, res) => {
    const { id, episodeNumber } = req.params;
    try {
        const media = await AnimeService.getMedia(id, episodeNumber);
        res.json({ media });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


exports.updateAnime = async (req, res) => {
    try {
        const updatedAnime = await AnimeService.updateAnime(req.params.id, req.body);
        res.json(updatedAnime);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

exports.deleteAnime = async (req, res) => {
    try {
        await AnimeService.deleteAnime(req.params.id);
        res.status(204).end();
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

exports.searchByTitle = async (req, res) => {
    try {
        const animeList = await AnimeService.searchByTitle(req.query.title);
        res.json(animeList);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

exports.streamFile = async (req, res) => {
    const { id } = req.params;
    const { type } = req.query;

    if (!ALLOWED_MEDIA_TYPES.includes(type)) {
        return res.status(400).json({ message: `Wrong media type: '${type}'. Allowed types: ${ALLOWED_MEDIA_TYPES.join(' / ')}` });
    }

    try {
        const { filePath, fileType } = await AnimeService.getMediaFilepath(id);

        if (fileType !== type) {
            return res.status(400).json({ message: `Type mismatch: requested '${type}', but file is of type '${fileType}'` });
        }

        let mimeType;
        switch (type) {
            case 'subtitles':
                mimeType = "text/plain; charset=utf-8";
                break;
            case 'audio':
                mimeType = "audio/aac";
                break;
            case 'video':
                mimeType = "video/mp4";
                break;
        }

        await AnimeService.streamFile(filePath, res, mimeType);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error});
    }
}