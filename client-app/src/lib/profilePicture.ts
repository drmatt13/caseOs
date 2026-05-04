const PROFILE_PICTURE_SIZE = 200;

export const PROFILE_PICTURE_CONTENT_TYPE = "image/jpeg";

export async function createProfilePictureJpeg(file: File): Promise<Blob> {
  const image = await createImageBitmap(file);
  const cropSize = Math.min(image.width, image.height);
  const sourceX = (image.width - cropSize) / 2;
  const sourceY = (image.height - cropSize) / 2;

  const canvas = document.createElement("canvas");
  canvas.width = PROFILE_PICTURE_SIZE;
  canvas.height = PROFILE_PICTURE_SIZE;

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Could not prepare profile picture upload.");
  }

  context.drawImage(
    image,
    sourceX,
    sourceY,
    cropSize,
    cropSize,
    0,
    0,
    PROFILE_PICTURE_SIZE,
    PROFILE_PICTURE_SIZE,
  );

  image.close();

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Could not convert profile picture to JPEG."));
          return;
        }

        resolve(blob);
      },
      PROFILE_PICTURE_CONTENT_TYPE,
      0.9,
    );
  });
}
