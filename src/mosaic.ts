import sharp from 'sharp';
import sizeOf from 'image-size';

const spacingSize = 10;

const createBackground = async (x: number, y: number) =>
  await sharp({
    create: {
      width: x,
      height: y,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 255 }
    }
  })
    .webp({ quality: 90 })
    .toBuffer();

const combine2Images = async (images: Buffer[]) => {
  let imageSizes = images.map(image => sizeOf(image));
  let maxHeight = Math.max(...imageSizes.map(i => i.height));

  console.log(imageSizes, maxHeight);

  // Resize all images to the max height
  let resizedImages: Buffer[] = [];
  for (const image of images) {
    const resizedImage = await sharp(image).resize({ height: maxHeight }).toBuffer();
    resizedImages.push(resizedImage);
  }

  let newImageSizes = resizedImages.map(image => {
    return sizeOf(image);
  });

  console.log(newImageSizes);

  // Add up all the widths of images
  let newMaxWidth = newImageSizes.reduce((a, b) => a + b.width, 0) + spacingSize;
  let newBackground = await createBackground(newMaxWidth, maxHeight);

  return await sharp(newBackground)
    .composite([
      { input: resizedImages[0], gravity: 'northwest' },
      { input: resizedImages[1], gravity: 'northeast' }
    ])
    .webp({ quality: 90 })
    .toBuffer();
};

export const mosaic = async (images: Buffer[]) => {
  console.log(images);

  // Why bother
  if (images.length < 2) {
    return await sharp(images[0]).webp({ quality: 90 }).toBuffer();
  } else if (images.length === 2) {
    return await combine2Images(images);
  } else if (images.length === 3) {
    let first2 = await combine2Images([images[0], images[1]]);
    let size = sizeOf(first2);
    const resizedImage = await sharp(images[2]).resize({ width: size.width }).toBuffer();
    let thirdSize = sizeOf(resizedImage);

    /* If the sizing of the 3rd image is weirdly tall
       then put it to the right of the other 2 */
    if (thirdSize.height * 1.5 > size.height) {
      return await combine2Images([first2, images[2]]);
    } else {
      const resizedImageHeight = sizeOf(resizedImage).height;
      let newBackground = await createBackground(
        size.width,
        size.height + resizedImageHeight + spacingSize
      );
      return await sharp(newBackground)
        .composite([
          { input: first2, gravity: 'northwest' },
          { input: resizedImage, gravity: 'southwest' }
        ])
        .webp({ quality: 90 })
        .toBuffer();
    }
  } else if (images.length === 4) {
    let top2 = await combine2Images([images[0], images[1]]);
    let topSize = sizeOf(top2);
    let bottom2 = await combine2Images([images[2], images[3]]);
    let bottomSize = sizeOf(bottom2);

    if (topSize.width > bottomSize.width) {
      bottom2 = await sharp(bottom2).resize({ width: topSize.width }).toBuffer();
      bottomSize = sizeOf(bottom2);
    } else if (topSize.width < bottomSize.width) {
      top2 = await sharp(top2).resize({ width: bottomSize.width }).toBuffer();
      topSize = sizeOf(top2);
    }

    let newBackground = await createBackground(
      Math.max(topSize.width, bottomSize.width),
      topSize.height + bottomSize.height + spacingSize
    );
    return await sharp(newBackground)
      .composite([
        { input: top2, gravity: 'northwest' },
        { input: bottom2, gravity: 'southwest' }
      ])
      .webp({ quality: 90 })
      .toBuffer();
  }
};
