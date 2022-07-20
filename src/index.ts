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

  // TODO: Simultaneous download of images

  for (const image of images) {
    try {
      const response = await got.get(
        `https://pbs.twimg.com/media/${image}?format=png&name=large`,
        {
          responseType: 'buffer'
        }
      );
      console.log(`Downloaded ${image}`);
      downloadedImages.push(response.body);
    } catch (e) {
      console.log(e);
    }
  }

  try {
    const result: Buffer = await mosaic(downloadedImages);

    // Send buffer with webp mime
    res.setHeader('Content-Type', 'image/webp');
    res.send(result);
  } catch (e) {
    console.log(e);
    res.status(500).end();
  }
});

app.listen(process.env.LISTEN_PORT, () => {});
