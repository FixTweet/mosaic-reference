import express from 'express';
import got from 'got';
import 'dotenv/config';
import { mosaic } from './mosaic.js';

// Basic express setup
const app = express();

app.get('/', async (req, res) => {
  const { a, b, c, d } = req.query;
  console.log(a, b, c, d);
  const images = [a, b, c, d].filter(i => i);
  const downloadedImages: Buffer[] = [];

  // Parallel downloading of an array of images
  await Promise.all(
    images.map(async image => {
      try {
        const response = await got(`https://pbs.twimg.com/media/${image}?format=png&name=large`, {
          responseType: 'buffer',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.149 Safari/537.36'
          }
        });
        downloadedImages[images.indexOf(image)] = response.body;
        console.log(`Downloaded ${image}`);
      } catch (e) {
        console.log(`Failed to download ${image}`);
      }
    })
  );

  try {
    const result: Buffer = await mosaic(downloadedImages);

    // Send buffer with webp mime
    res.setHeader('Content-Type', 'image/webp');
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    res.send(result);
  } catch (e) {
    console.log(e);
    res.status(500).end();
  }
});

app.listen(process.env.LISTEN_PORT, () => {});
