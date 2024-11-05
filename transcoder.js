const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const chokidar = require('chokidar');
const async = require('async');
const { createLogger, format, transports } = require('winston');
const pool = require('./config/db');
const queries = require('./config/queries');
const { networkPath, maxConcurrentProcesses } = require('./config/config.js');

// Налаштування логера
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

// Черга завдань для обмеження кількості одночасних процесів
const queue = async.queue(async (task, callback) => {
  try {
    await transcodeFile(task.filePath, task.animeTitle, task.episode);
    callback();
  } catch (err) {
    logger.error(`Помилка при перекодуванні файлу ${task.filePath}: ${err}`);
    callback(err);
  }
}, maxConcurrentProcesses);

async function transcodeFile(filePath, animeTitle, episode) {
  const fileName = path.basename(filePath, '.mkv');
  const outputDir = path.join(networkPath, animeTitle, 'Processed', fileName);

  try {
    if (episode && episode.processed) {
      logger.info(`Епізод "${fileName}" вже перекодований. Пропускаємо.`);
      return;
    }

    if (!episode) {
      // Вставляємо новий запис у базу даних
      await pool.query(queries.INSERT_EPISODE, [animeTitle, fileName, filePath, false]);
    } else {
      // Оновлюємо статус перед початком перекодування
      await pool.query(queries.UPDATE_EPISODE_STATUS, [false, new Date(), null, episode.id]);
    }

    // Перевіряємо чи існує вихідна директорія
    try {
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
    } catch (err) {
      logger.error(`Помилка при створенні директорії ${outputDir}: ${err}`);
      throw err;
    }

    // Використовуємо ffprobe для отримання інформації про потоки
    ffmpeg.ffprobe(filePath, async (err, metadata) => {
      if (err) {
        logger.error(`Помилка при аналізі файлу ${filePath}: ${err}`);
        await pool.query(queries.UPDATE_EPISODE_ERROR, [err.message, false, animeTitle, fileName]);
        return;
      }

      // Отримуємо відео, аудіо та субтитрові потоки
      const videoStreams = metadata.streams.filter(stream => stream.codec_type === 'video');
      const audioStreams = metadata.streams.filter(stream => stream.codec_type === 'audio');
      const subtitleStreams = metadata.streams.filter(stream => stream.codec_type === 'subtitle');

      let command = ffmpeg(filePath);

      // Обробка відео
      if (videoStreams.length > 0) {
        const videoOutput = path.join(outputDir, 'video.mp4');
        command = command
          .output(videoOutput)
          .noAudio()
          .videoCodec('copy')
          .outputOptions([
            '-map 0:v:0',
            '-sn'
          ]);
      }

      // Обробка аудіодоріжок
      audioStreams.forEach((audioStream, index) => {
        const audioOutput = path.join(outputDir, `audio_track_${index}.aac`);
        command = command
          .output(audioOutput)
          .noVideo()
          .audioCodec('copy')
          .outputOptions([
            `-map 0:a:${index}`,
            '-vn',
            '-sn'
          ]);
      });

      // Обробка субтитрів
      subtitleStreams.forEach((subtitleStream, index) => {
        const subtitleOutput = path.join(outputDir, `subs_${index}.vtt`);
        command = command
          .output(subtitleOutput)
          .noVideo()
          .noAudio()
          .outputOptions([
            `-map 0:s:${index}`,
            '-vn',
            '-an',
            '-c:s webvtt'
          ]);
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

          // Видаляємо папку outputDir
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
    ignored: /(^|[\/\\])\..|Processed/, // Ігноруємо приховані файли та 'Processed' директорії
    persistent: true,
    depth: 2,
  });

  watcher
    .on('add', async (filePath) => {
      logger.info(`Додано файл: ${filePath}`);
      if (path.extname(filePath) === '.mkv') {
        const relativePath = path.relative(networkPath, filePath);
        const pathParts = relativePath.split(path.sep);
        if (pathParts.length < 2) {
          logger.error(`Невірний шлях до файлу: ${filePath}`);
          return;
        }
        const [animeTitle, fileNameWithExt] = pathParts;
        const fileName = path.basename(fileNameWithExt, '.mkv');

        try {
          // Перевіряємо, чи файл вже є в базі даних
          const res = await pool.query(queries.SELECT_EPISODE, [animeTitle, fileName]);
          let episode = res.rows[0];

          if (!episode) {
            // Додаємо новий запис у базу даних
            await pool.query(queries.INSERT_EPISODE, [animeTitle, fileName, filePath, false]);

            // Додаємо завдання в чергу
            queue.push({ filePath, animeTitle });
          } else if (!episode.processed) {
            // Додаємо завдання в чергу
            queue.push({ filePath, animeTitle, episode });
          } else {
            logger.info(`Епізод "${fileName}" вже перекодований. Пропускаємо.`);
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
