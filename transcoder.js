const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const chokidar = require('chokidar');
const async = require('async');
const { createLogger, format, transports } = require('winston');
const pool = require('./config/db');
const queries = require('./config/queries');
const { networkPath, maxConcurrentProcesses } = require('./config/config.js');

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

const queue = async.queue(async (task) => {
    try {
      await transcodeFile(task.filePath, task.animeTitle, task.episode);
    } catch (err) {
      logger.error(`Помилка при перекодуванні файлу ${task.filePath}: ${err}`);
      throw err;
    }
  }, maxConcurrentProcesses);

  async function getOrCreateAnimeId(animeTitle) {
    let animeId;
  
    // Виконуємо транзакцію для безпечного створення або отримання anime_id
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
  
      // Блокуємо таблицю `anime`, щоб уникнути конкурентних записів з однаковою назвою
      const lockResult = await client.query('LOCK TABLE anime IN SHARE ROW EXCLUSIVE MODE');
  
      // Перевіряємо, чи аніме вже існує в БД
      const selectResult = await client.query('SELECT id FROM anime WHERE title = $1', [animeTitle]);
      if (selectResult.rowCount > 0) {
        // Якщо запис існує, отримуємо його id
        animeId = selectResult.rows[0].id;
      } else {
        // Якщо запису немає, створюємо його
        const insertResult = await client.query(queries.INSERT_ANIME, [animeTitle, '', null, 0]);
        animeId = insertResult.rows[0].id;
      }
  
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  
    return animeId;
  }
  
  async function transcodeFile(filePath, animeTitle, episode) {
    const fileName = path.basename(filePath, '.mkv');
    const outputDir = path.join(networkPath, animeTitle, 'Processed', fileName);
  
    try {
      if (episode && episode.processed) {
        logger.info(`Епізод "${fileName}" вже перекодований. Пропускаємо.`);
        return;
      }
  
      // Отримуємо або створюємо animeId, блокуючи конкурентні записи
      const animeId = await getOrCreateAnimeId(animeTitle);
  
      if (!episode) {
        // Додаємо запис епізоду
        await pool.query(queries.INSERT_EPISODE, [animeTitle, fileName, filePath, false]);

        const episodeCountRes = await pool.query('SELECT COUNT(*) FROM episodes WHERE anime_id = $1', [animeId]);
        const episodeCount = parseInt(episodeCountRes.rows[0].count, 10);
        await pool.query(queries.UPDATE_ANIME_EPISODE_COUNT, [episodeCount, animeTitle]);
      } else {
        await pool.query(queries.UPDATE_EPISODE_STATUS, [false, new Date(), null, episode.id]);
      }

    try {
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
    } catch (err) {
      logger.error(`Помилка при створенні директорії ${outputDir}: ${err}`);
      throw err;
    }

    ffmpeg.ffprobe(filePath, async (err, metadata) => {
      if (err) {
        logger.error(`Помилка при аналізі файлу ${filePath}: ${err}`);
        await pool.query(queries.UPDATE_EPISODE_ERROR, [err.message, false, animeTitle, fileName]);
        return;
      }

      const videoStreams = metadata.streams.filter(stream => stream.codec_type === 'video');
      const audioStreams = metadata.streams.filter(stream => stream.codec_type === 'audio');
      const subtitleStreams = metadata.streams.filter(stream => stream.codec_type === 'subtitle');

      let command = ffmpeg(filePath);

      if (videoStreams.length > 0) {
        const videoOutput = path.join(outputDir, 'video.mp4');
        command = command
          .output(videoOutput)
          .noAudio()
          .videoCodec('copy')
          .outputOptions(['-map 0:v:0', '-sn']);
      }

      audioStreams.forEach((audioStream, index) => {
        const audioOutput = path.join(outputDir, `audio_track_${index}.aac`);
        command = command
          .output(audioOutput)
          .noVideo()
          .audioCodec('copy')
          .outputOptions([`-map 0:a:${index}`, '-vn', '-sn']);
      });

      subtitleStreams.forEach((subtitleStream, index) => {
        const subtitleOutput = path.join(outputDir, `subs_${index}.vtt`);
        command = command
          .output(subtitleOutput)
          .noVideo()
          .noAudio()
          .outputOptions([`-map 0:s:${index}`, '-vn', '-an', '-c:s webvtt']);
      });

      command
        .on('start', (commandLine) => {
          logger.info('Команда FFmpeg: ' + commandLine);
        })
        .on('stderr', function(stderrLine) {
          logger.warn('FFmpeg stderr: ' + stderrLine);
        })
        .on('end', async () => {
          logger.info(`Перекодування завершено для ${filePath}`);
          await pool.query(queries.UPDATE_EPISODE_SUCCESS, [true, new Date(), animeTitle, fileName]);
        })
        .on('error', async (err) => {
          logger.error(`Помилка при перекодуванні файлу ${filePath}: ${err}`);
          await pool.query(queries.UPDATE_EPISODE_ERROR, [err.message, false, animeTitle, fileName]);

          try {
            if (fs.existsSync(outputDir)) {
              fs.rmSync(outputDir, { recursive: true, force: true });
              logger.info(`Папку "${outputDir}" було видалено через помилку.`);
            }
          } catch (fsErr) {
            logger.error(`Помилка при видаленні директорії ${outputDir}: ${fsErr}`);
          }
        })
        .run();
    });
  } catch (err) {
    logger.error(`Помилка при обробці файлу ${filePath}: ${err}`);
  }
}

function watchAnimeDirectory() {
  const watcher = chokidar.watch(networkPath, {
    ignored: /(^|[\/\\])\..|Processed/,
    persistent: true,
    depth: 3,
  });

  watcher
    .on('add', async (filePath) => {
      if (path.extname(filePath) === '.mkv' && filePath.includes(`${path.sep}Raw${path.sep}`)) {
        const relativePath = path.relative(networkPath, filePath);
        const pathParts = relativePath.split(path.sep);

        if (pathParts.length < 3 || pathParts[1] !== 'Raw') {
          logger.error(`Невірний шлях до файлу: ${filePath}`);
          return;
        }

        const animeTitle = pathParts[0];
        const fileNameWithExt = pathParts[2];
        const fileName = path.basename(fileNameWithExt, '.mkv');

        try {
          const res = await pool.query(queries.SELECT_EPISODE, [animeTitle, fileName]);
          let episode = res.rows[0];

          if (!episode) {
            queue.push({ filePath, animeTitle });
          } else if (!episode.processed) {
            queue.push({ filePath, animeTitle, episode });
          }
        } catch (err) {
          logger.error(`Помилка при обробці файлу ${filePath}: ${err}`);
        }
      }
    })
    .on('error', (error) => {
      logger.error('Помилка спостерігача:', error);
    });
}

try {
  watchAnimeDirectory();
} catch (error) {
  logger.error('Помилка при запуску спостерігача:', error);
}
