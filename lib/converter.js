/**

 * Credits:

 * - Baileys Library by @adiwajshing

 * - Enhanced by Gift md Bot Team

 */

 

const fs = require('fs')

const path = require('path')

const { spawn, exec } = require('child_process')

const { promisify } = require('util')

const execAsync = promisify(exec)

// Ensure temp directories exist

const tempDir = path.join(__dirname, '../tmp')

const dbDir = path.join(__dirname, '../data/cvt.son')

if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true })

if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true })

/**

 * Enhanced FFmpeg wrapper with better error handling

 * @param {Buffer} buffer Input buffer

 * @param {Array} args FFmpeg arguments

 * @param {String} ext Input extension

 * @param {String} ext2 Output extension

 * @param {String} tempPath Custom temp path

 */

function ffmpeg(buffer, args = [], ext = '', ext2 = '', tempPath = tempDir) {

  return new Promise(async (resolve, reject) => {

    try {

      const timestamp = Date.now()

      const tmp = path.join(tempPath, `input_${timestamp}.${ext}`)

      const out = path.join(tempPath, `output_${timestamp}.${ext2}`)

      

      await fs.promises.writeFile(tmp, buffer)

      

      const ffmpegProcess = spawn('ffmpeg', [

        '-y',

        '-i', tmp,

        ...args,

        out

      ])

      

      let stderr = ''

      ffmpegProcess.stderr.on('data', (data) => {

        stderr += data.toString()

      })

      

      ffmpegProcess.on('error', (error) => {

        cleanup([tmp, out])

        reject(new Error(`FFmpeg spawn error: ${error.message}`))

      })

      

      ffmpegProcess.on('close', async (code) => {

        try {

          await fs.promises.unlink(tmp).catch(() => {})

          

          if (code !== 0) {

            await fs.promises.unlink(out).catch(() => {})

            return reject(new Error(`FFmpeg failed with code ${code}: ${stderr}`))

          }

          

          if (!fs.existsSync(out)) {

            return reject(new Error('Output file not created'))

          }

          

          const result = await fs.promises.readFile(out)

          await fs.promises.unlink(out).catch(() => {})

          resolve(result)

        } catch (e) {

          cleanup([tmp, out])

          reject(e)

        }

      })

    } catch (e) {

      reject(e)

    }

  })

}

/**

 * Clean up temporary files

 * @param {Array} files Array of file paths to delete

 */

function cleanup(files) {

  files.forEach(file => {

    if (fs.existsSync(file)) {

      fs.unlinkSync(file)

    }

  })

}

/**

 * Convert Audio to Playable WhatsApp Audio

 * @param {Buffer} buffer Audio Buffer

 * @param {String} ext File Extension 

 */

function toAudio(buffer, ext) {

  return ffmpeg(buffer, [

    '-vn',

    '-ac', '2',

    '-b:a', '128k',

    '-ar', '44100',

    '-f', 'mp3'

  ], ext, 'mp3')

}

/**

 * Convert Audio to High Quality Audio

 * @param {Buffer} buffer Audio Buffer

 * @param {String} ext File Extension 

 */

function toHQAudio(buffer, ext) {

  return ffmpeg(buffer, [

    '-vn',

    '-ac', '2',

    '-b:a', '320k',

    '-ar', '48000',

    '-f', 'mp3'

  ], ext, 'mp3')

}

/**

 * Convert Audio to Playable WhatsApp PTT

 * @param {Buffer} buffer Audio Buffer

 * @param {String} ext File Extension 

 */

function toPTT(buffer, ext) {

  return ffmpeg(buffer, [

    '-vn',

    '-c:a', 'libopus',

    '-b:a', '128k',

    '-vbr', 'on',

    '-compression_level', '10'

  ], ext, 'opus')

}

/**

 * Convert to WhatsApp Video

 * @param {Buffer} buffer Video Buffer

 * @param {String} ext File Extension 

 */

function toVideo(buffer, ext) {

  return ffmpeg(buffer, [

    '-c:v', 'libx264',

    '-c:a', 'aac',

    '-ab', '128k',

    '-ar', '44100',

    '-crf', '32',

    '-preset', 'slow'

  ], ext, 'mp4')

}

/**

 * Convert to High Quality Video

 * @param {Buffer} buffer Video Buffer

 * @param {String} ext File Extension 

 */

function toHQVideo(buffer, ext) {

  return ffmpeg(buffer, [

    '-c:v', 'libx264',

    '-c:a', 'aac',

    '-ab', '192k',

    '-ar', '48000',

    '-crf', '18',

    '-preset', 'medium'

  ], ext, 'mp4')

}

/**

 * Convert to GIF

 * @param {Buffer} buffer Video Buffer

 * @param {String} ext File Extension 

 * @param {Number} fps Frames per second (default: 10)

 * @param {String} scale Scale (default: 320:-1)

 */

function toGIF(buffer, ext, fps = 10, scale = '320:-1') {

  return ffmpeg(buffer, [

    '-vf', `fps=${fps},scale=${scale}:flags=lanczos`,

    '-c:v', 'gif'

  ], ext, 'gif')

}

/**

 * Convert to WebP Sticker

 * @param {Buffer} buffer Image/Video Buffer

 * @param {String} ext File Extension 

 */

function toWebP(buffer, ext) {

  return ffmpeg(buffer, [

    '-vcodec', 'libwebp',

    '-vf', 'scale=512:512:force_original_aspect_ratio=increase,crop=512:512',

    '-loop', '0',

    '-preset', 'default',

    '-an',

    '-vsync', '0'

  ], ext, 'webp')

}

/**

 * Convert to Animated WebP Sticker

 * @param {Buffer} buffer Video Buffer

 * @param {String} ext File Extension 

 */

function toAnimatedWebP(buffer, ext) {

  return ffmpeg(buffer, [

    '-vcodec', 'libwebp',

    '-vf', 'scale=512:512:force_original_aspect_ratio=increase,crop=512:512,fps=15',

    '-loop', '0',

    '-preset', 'default',

    '-an',

    '-vsync', '0',

    '-t', '10'

  ], ext, 'webp')

}

/**

 * Extract Audio from Video

 * @param {Buffer} buffer Video Buffer

 * @param {String} ext File Extension 

 */

function extractAudio(buffer, ext) {

  return ffmpeg(buffer, [

    '-vn',

    '-acodec', 'copy'

  ], ext, 'mp3')

}

/**

 * Add Watermark to Video

 * @param {Buffer} buffer Video Buffer

 * @param {String} ext File Extension 

 * @param {String} text Watermark text

 * @param {String} position Position (topleft, topright, bottomleft, bottomright)

 */

function addWatermark(buffer, ext, text = 'Gift MD', position = 'bottomright') {

  const positions = {

    topleft: '10:10',

    topright: 'main_w-text_w-10:10',

    bottomleft: '10:main_h-text_h-10',

    bottomright: 'main_w-text_w-10:main_h-text_h-10'

  }

  

  return ffmpeg(buffer, [

    '-vf', `drawtext=text='${text}':fontcolor=white:fontsize=24:box=1:boxcolor=black@0.5:boxborderw=5:x=${positions[position]}`

  ], ext, 'mp4')

}

/**

 * Compress Video

 * @param {Buffer} buffer Video Buffer

 * @param {String} ext File Extension 

 * @param {Number} crf Quality (0-51, lower = better quality)

 */

function compressVideo(buffer, ext, crf = 28) {

  return ffmpeg(buffer, [

    '-c:v', 'libx264',

    '-crf', crf.toString(),

    '-c:a', 'aac',

    '-b:a', '128k'

  ], ext, 'mp4')

}

/**

 * Change Video Speed

 * @param {Buffer} buffer Video Buffer

 * @param {String} ext File Extension 

 * @param {Number} speed Speed multiplier (0.5 = half speed, 2 = double speed)

 */

function changeSpeed(buffer, ext, speed = 1.0) {

  const audioSpeed = 1 / speed

  return ffmpeg(buffer, [

    '-filter_complex', `[0:v]setpts=${audioSpeed}*PTS[v];[0:a]atempo=${speed}[a]`,

    '-map', '[v]',

    '-map', '[a]'

  ], ext, 'mp4')

}

/**

 * Resize Video

 * @param {Buffer} buffer Video Buffer

 * @param {String} ext File Extension 

 * @param {Number} width Width

 * @param {Number} height Height

 */

function resizeVideo(buffer, ext, width = 720, height = 720) {

  return ffmpeg(buffer, [

    '-vf', `scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height}`

  ], ext, 'mp4')

}

/**

 * Create Video Thumbnail

 * @param {Buffer} buffer Video Buffer

 * @param {String} ext File Extension 

 * @param {Number} time Time in seconds for thumbnail

 */

function createThumbnail(buffer, ext, time = 1) {

  return ffmpeg(buffer, [

    '-ss', time.toString(),

    '-vframes', '1',

    '-q:v', '2'

  ], ext, 'jpg')

}

/**

 * Convert Image Format

 * @param {Buffer} buffer Image Buffer

 * @param {String} ext Input File Extension 

 * @param {String} outputFormat Output format (jpg, png, webp)

 */

function convertImage(buffer, ext, outputFormat = 'jpg') {

  return ffmpeg(buffer, [

    '-q:v', '2'

  ], ext, outputFormat)

}

/**

 * Resize Image

 * @param {Buffer} buffer Image Buffer

 * @param {String} ext File Extension 

 * @param {Number} width Width

 * @param {Number} height Height

 */

function resizeImage(buffer, ext, width = 512, height = 512) {

  return ffmpeg(buffer, [

    '-vf', `scale=${width}:${height}`

  ], ext, 'jpg')

}

/**

 * Get Media Info

 * @param {Buffer} buffer Media Buffer

 * @param {String} ext File Extension 

 */

async function getMediaInfo(buffer, ext) {

  try {

    const timestamp = Date.now()

    const tmp = path.join(tempDir, `info_${timestamp}.${ext}`)

    

    await fs.promises.writeFile(tmp, buffer)

    

    const { stdout } = await execAsync(`ffprobe -v quiet -print_format json -show_format -show_streams "${tmp}"`)

    

    await fs.promises.unlink(tmp).catch(() => {})

    

    return JSON.parse(stdout)

  } catch (error) {

    throw new Error(`Failed to get media info: ${error.message}`)

  }

}

/**

 * Convert Audio Format

 * @param {Buffer} buffer Audio Buffer

 * @param {String} ext Input Extension

 * @param {String} outputFormat Output format (mp3, wav, flac, ogg)

 */

function convertAudioFormat(buffer, ext, outputFormat = 'mp3') {

  const formats = {

    mp3: ['-c:a', 'libmp3lame', '-b:a', '192k'],

    wav: ['-c:a', 'pcm_s16le'],

    flac: ['-c:a', 'flac'],

    ogg: ['-c:a', 'libvorbis', '-b:a', '192k']

  }

  

  return ffmpeg(buffer, formats[outputFormat] || formats.mp3, ext, outputFormat)

}

/**

 * Merge Audio and Video

 * @param {Buffer} videoBuffer Video Buffer

 * @param {Buffer} audioBuffer Audio Buffer

 * @param {String} videoExt Video Extension

 * @param {String} audioExt Audio Extension

 */

async function mergeAudioVideo(videoBuffer, audioBuffer, videoExt, audioExt) {

  try {

    const timestamp = Date.now()

    const videoPath = path.join(tempDir, `video_${timestamp}.${videoExt}`)

    const audioPath = path.join(tempDir, `audio_${timestamp}.${audioExt}`)

    const outputPath = path.join(tempDir, `merged_${timestamp}.mp4`)

    

    await fs.promises.writeFile(videoPath, videoBuffer)

    await fs.promises.writeFile(audioPath, audioBuffer)

    

    await execAsync(`ffmpeg -y -i "${videoPath}" -i "${audioPath}" -c:v copy -c:a aac -shortest "${outputPath}"`)

    

    const result = await fs.promises.readFile(outputPath)

    

    cleanup([videoPath, audioPath, outputPath])

    

    return result

  } catch (error) {

    throw new Error(`Failed to merge audio and video: ${error.message}`)

  }

}

/**

 * Extract Frames from Video

 * @param {Buffer} buffer Video Buffer

 * @param {String} ext File Extension 

 * @param {Number} fps Frames per second to extract

 */

function extractFrames(buffer, ext, fps = 1) {

  return ffmpeg(buffer, [

    '-vf', `fps=${fps}`,

    '-q:v', '2'

  ], ext, 'jpg')

}

/**

 * Add Audio to Image (Create Video)

 * @param {Buffer} imageBuffer Image Buffer

 * @param {Buffer} audioBuffer Audio Buffer

 * @param {String} imageExt Image Extension

 * @param {String} audioExt Audio Extension

 */

async function addAudioToImage(imageBuffer, audioBuffer, imageExt, audioExt) {

  try {

    const timestamp = Date.now()

    const imagePath = path.join(tempDir, `image_${timestamp}.${imageExt}`)

    const audioPath = path.join(tempDir, `audio_${timestamp}.${audioExt}`)

    const outputPath = path.join(tempDir, `output_${timestamp}.mp4`)

    

    await fs.promises.writeFile(imagePath, imageBuffer)

    await fs.promises.writeFile(audioPath, audioBuffer)

    

    await execAsync(`ffmpeg -y -loop 1 -i "${imagePath}" -i "${audioPath}" -c:v libx264 -tune stillimage -c:a aac -b:a 192k -pix_fmt yuv420p -shortest "${outputPath}"`)

    

    const result = await fs.promises.readFile(outputPath)

    

    cleanup([imagePath, audioPath, outputPath])

    

    return result

  } catch (error) {

    throw new Error(`Failed to add audio to image: ${error.message}`)

  }

}

module.exports = {

  // Basic conversions

  ffmpeg,

  toAudio,

  toHQAudio,

  toPTT,

  toVideo,

  toHQVideo,

  

  // Image conversions

  toWebP,

  toAnimatedWebP,

  convertImage,

  resizeImage,

  

  // Video processing

  toGIF,

  extractAudio,

  addWatermark,

  compressVideo,

  changeSpeed,

  resizeVideo,

  createThumbnail,

  extractFrames,

  

  // Audio processing

  convertAudioFormat,

  

  // Advanced operations

  mergeAudioVideo,

  addAudioToImage,

  getMediaInfo,

  

  // Utility

  cleanup

}