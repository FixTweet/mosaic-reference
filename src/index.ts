import express from 'express';
import got from 'got';
import sharp from 'sharp';
import sizeOf from 'image-size';
import 'dotenv/config';

// Basic express setup
const app = express();

app.get('/', async (req, res) => {
  const { a, b, c, d } = req.query;
  console.log(a, b, c, d);
  const images = [a, b, c, d].filter(i => i);
  const downloadedImages: Buffer[] = [];

  // TODO: Simultaneous download of images

  for (const image of images) {
    const response = await got.get(
      `https://pbs.twimg.com/media/${image}?format=jpg&name=large`,
      {
        responseType: 'buffer'
      }
    );
    downloadedImages.push(response.body);
  }

  console.log(downloadedImages);

  let imageSizes = downloadedImages.map(image => {
    return sizeOf(image);
  });

  console.log(imageSizes);

  let maxHeight = Math.max(...imageSizes.map(i => i.height));

  console.log(maxHeight);

  // Resize all images to the max height
  let resizedImages: Buffer[] = [];
  for (const image of downloadedImages) {
    const resizedImage = await sharp(image)
      .resize({ height: maxHeight})
      .toBuffer();
    resizedImages.push(resizedImage);
  }

  let newImageSizes = resizedImages.map(image => {
    return sizeOf(image);
  });

  console.log(newImageSizes);

  // Add up all the widths of images
  let newMaxWidth = newImageSizes.reduce((a, b) => a + b.width, 0);

  let newBackground = await sharp({
    create: {
      width: newMaxWidth,
      height: maxHeight,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  }).webp( { quality: 90 } ).toBuffer();

  let result = await sharp(newBackground)
  .composite([
    { input: resizedImages[0], gravity: 'northeast' },
    { input: resizedImages[1], gravity: 'northwest' },
  ])
  .webp( { quality: 90 } )
  .toBuffer();
  
  // Send buffer with webp mime
  res.setHeader('Content-Type', 'image/webp');
  res.send(result);
});

app.listen(process.env.LISTEN_PORT, () => {});
