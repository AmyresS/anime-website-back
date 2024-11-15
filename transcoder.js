const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const chokidar = require('chokidar');
const async = require('async');
const { createLogger, format, transports } = require('winston');
const pool = require('./config/db');
const queries = require('./config/queries');
const { networkPath, maxConcurrentProcesses } = require('./config/config.js');

const processingFiles = new Set();

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
    await transcodeFile(task.fileName, task.animeTitle, task.episodeNumber, task.episode);
  } catch (err) {
    logger.error(`Помилка при перекодуванні файлу ${task.fileName}: ${err}`);
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
  
  async function transcodeFile(fileName, animeTitle, episodeNumber, episode) {
    const originalDir = path.join(animeTitle, 'Raw', `${fileName}.mkv`);
    const outputDir = path.join(animeTitle, 'Processed', fileName);

    // Перевіряємо, чи файл вже обробляється
    if (processingFiles.has(fileName)) {
      logger.info(`Файл "${fileName}" вже обробляється. Пропускаємо.`);
      return;
    }

    // Додаємо файл до оброблюваних
    processingFiles.add(fileName);

    try {
        if (episode && episode.processed) {
            logger.info(`Епізод "${fileName}" вже перекодований. Пропускаємо.`);
            return;
        }

        const animeId = await getOrCreateAnimeId(animeTitle);
        let episodeId;

        if (!episode) {
            // Вставляємо новий запис для епізоду і одразу отримуємо його id
            const insertResult = await pool.query(queries.INSERT_EPISODE, [animeTitle, episodeNumber, fileName, originalDir, false]);
            episodeId = insertResult.rows[0].id;

            const episodeCountRes = await pool.query(queries.SELECT_EPISODES_COUNT, [animeId]);
            const episodeCount = parseInt(episodeCountRes.rows[0].count, 10);
            await pool.query(queries.UPDATE_ANIME_EPISODE_COUNT, [episodeCount, animeId]);
        } else {
            episodeId = episode.id;
            await pool.query(queries.UPDATE_EPISODE_STATUS, [false, new Date(), null, episodeId]);
        }

        if (!fs.existsSync(path.join(networkPath, outputDir))) {
            fs.mkdirSync(path.join(networkPath, outputDir), { recursive: true });
        }

        ffmpeg.ffprobe(path.join(networkPath, originalDir), async (err, metadata) => {
            if (err) {
                logger.error(`Помилка при аналізі файлу ${fileName}: ${err}`);
                await pool.query(queries.UPDATE_EPISODE_ERROR, [err.message, false, episodeId]);
                return;
            }

            const videoStreams = metadata.streams.filter(stream => stream.codec_type === 'video');
            const audioStreams = metadata.streams.filter(stream => stream.codec_type === 'audio');
            const subtitleStreams = metadata.streams.filter(stream => stream.codec_type === 'subtitle');

            let command = ffmpeg(path.join(networkPath, originalDir));

            if (videoStreams.length > 0) {
              const videoOutput = path.join(outputDir, 'video.mp4');
              command = command
                  .output(path.join(networkPath, outputDir, 'video.mp4'))
                  .noAudio()
                  .videoCodec('copy')
                  .outputOptions(['-map 0:v:0', '-sn']);

              // Додаємо запис про відео у таблицю media_files
              await pool.query(queries.INSERT_MEDIA_FILE, [episodeId, 'video', videoOutput, 'Video', null]);
          }

          audioStreams.forEach(async (audioStream, index) => {
              const language = audioStream.tags && audioStream.tags.language ? audioStream.tags.language : null;
              const audioName = audioStream.tags && audioStream.tags.title ? audioStream.tags.title : `audio_track_${index}`;
              const audioOutput = path.join(outputDir, `${audioName}.aac`);
              
              command = command
                  .output(path.join(networkPath, outputDir, `${audioName}.aac`))
                  .noVideo()
                  .audioCodec('copy')
                  .outputOptions([`-map 0:a:${index}`, '-vn', '-sn']);

              // Додаємо запис про аудіо у таблицю media_files
              try {
                await pool.query(queries.INSERT_MEDIA_FILE, [episodeId, 'audio', audioOutput, audioName, language]);
              } catch (dbErr) {
                  if (dbErr.code === '23505') {
                      logger.info(`Дублюючий запис для аудіо, пропускаємо вставку.`);
                  } else {
                      throw dbErr;
                  }
              }            
          });

          subtitleStreams.forEach(async (subtitleStream, index) => {
              const language = subtitleStream.tags && subtitleStream.tags.language ? subtitleStream.tags.language : null;
              const subtitleName = subtitleStream.tags && subtitleStream.tags.title ? subtitleStream.tags.title : `subs_${index}`;
              const subtitleOutput = path.join(outputDir, `${subtitleName}.ass`);
              
              command = command
                  .output(path.join(networkPath, outputDir, `${subtitleName}.ass`))
                  .noVideo()
                  .noAudio()
                  .outputOptions([`-map 0:s:${index}`, '-vn', '-an', '-c:s copy']);

              // Додаємо запис про субтитри у таблицю media_files
              await pool.query(queries.INSERT_MEDIA_FILE, [episodeId, 'subtitles', subtitleOutput, subtitleName, language]);
          });

            command
                .on('start', (commandLine) => {
                    logger.info('Команда FFmpeg: ' + commandLine);
                })
                .on('stderr', function(stderrLine) {
                    logger.warn('FFmpeg stderr: ' + stderrLine);
                })
                .on('end', async () => {
                    logger.info(`Перекодування завершено для ${fileName}`);
                    await pool.query(queries.UPDATE_EPISODE_SUCCESS, [true, new Date(), episodeId]);
                })
                .on('error', async (err) => {
                    logger.error(`Помилка при перекодуванні файлу ${filePath}: ${err}`);
                    await pool.query(queries.UPDATE_EPISODE_ERROR, [err.message, false, episodeId]);

                    try {
                        if (fs.existsSync(path.join(networkPath, outputDir))) {
                            fs.rmSync(path.join(networkPath, outputDir), { recursive: true, force: true });
                            logger.info(`Папку "${outputDir}" було видалено через помилку.`);
                        }
                    } catch (fsErr) {
                        logger.error(`Помилка при видаленні директорії ${outputDir}: ${fsErr}`);
                    }
                })
                .run();
        });
    } catch (err) {
        logger.error(`Помилка при обробці файлу ${fileName}: ${err}`);
    } finally {
        processingFiles.delete(fileName);
    }
}

function watchAnimeDirectory() {
  const watcher = chokidar.watch(networkPath, {
    ignored: /(^|[\/\\])\..|Processed/,
    persistent: true,
    depth: 3,
  });

  watcher
    .on('addDir', async (dirPath) => {
      if (path.basename(dirPath) === 'Raw') {
        const animeTitle = path.basename(path.dirname(dirPath));

        try {
          const files = fs.readdirSync(dirPath)
            .filter(file => file.endsWith('.mkv'))
            .sort((a, b) => {
              const numA = parseInt(a.match(/\[(\d+)\]/)[1], 10);
              const numB = parseInt(b.match(/\[(\d+)\]/)[1], 10);
              return numA - numB;
            });

          for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const episodeNumber = i + 1;
            const fileName = path.basename(file, '.mkv');

            const res = await pool.query(queries.SELECT_EPISODE, [animeTitle, fileName]);
            let episode = res.rows[0];

            if (!episode) {
              queue.push({ fileName, animeTitle, episodeNumber });
            } else if (!episode.processed) {
              queue.push({ fileName, animeTitle, episodeNumber, episode });
            }
          }
        } catch (err) {
          logger.error(`Помилка при обробці файлів у папці ${dirPath}: ${err}`);
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
