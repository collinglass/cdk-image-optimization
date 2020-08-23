import { Context, S3Event } from "aws-lambda";
import AWS = require("aws-sdk");
import sharp = require("sharp");

const S3 = new AWS.S3({
  signatureVersion: "v4",
});

const destinationBucket = process.env.DESTINATION_BUCKET!;
const IMAGE_WIDTH = parseInt(process.env.WIDTH || "618", 10);
const IMAGE_HEIGHT = parseInt(process.env.HEIGHT || "618", 10);

export const handler = async (event: S3Event, context: Context) => {
  console.log(JSON.stringify(event));

  const { Records: records } = event;

  await Promise.all(
    records.map(async ({ eventName, s3 }) => {
      try {
        if (
          ![
            "ObjectCreated:CompleteMultipartUpload",
            "ObjectCreated:Put",
          ].includes(eventName)
        ) {
          return;
        }

        const { object: obj, bucket } = s3;
        const { key: rawkey } = obj;
        const [slug, filename] = rawkey.split("/");

        if (!filename) {
          return;
        }

        const key = decodeURIComponent(rawkey.replace(/\+/g, " "));

        const { Body } = await S3.getObject({
          Bucket: bucket.name,
          Key: key,
        }).promise();

        const { width = 0, height = 0 } = await sharp(
          Body as Buffer
        ).metadata();

        console.log(key, width, height);

        const buffer = await sharp(Body as Buffer)
          // CONVERTS TRANSPARENT BACKGROUND TO WHITE
          .flatten({ background: { r: 255, g: 255, b: 255, alpha: 1 } })
          // RESIZES IMAGE AND CONVERTS BACKGROUND TO WHITE
          .resize({
            width: IMAGE_WIDTH,
            height: IMAGE_HEIGHT,
            fit: sharp.fit.contain,
            position: sharp.strategy.attention,
            background: { r: 255, g: 255, b: 255, alpha: 1 },
          })
          // CONVERTS IMAGE TO JPEG
          .jpeg({ quality: 80, progressive: true })
          .toBuffer();

        // INSERTS OPTIMIZED IMAGE
        console.log(`Inserting ${key.split(".")[0]}.jpg`);
        const result = await S3.putObject({
          Body: buffer,
          Bucket: destinationBucket,
          ContentType: "image/jpeg",
          CacheControl: "max-age=31536000",
          Key: `${key.split(".")[0]}.jpg`,
          ACL: "public-read",
        }).promise();
        console.log(`Success`, JSON.stringify(result, null, 2));
      } catch (error) {
        console.log(error);
      }

      return {};
    })
  );

  context.succeed({
    success: true,
  });
};
