import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

function getR2Client() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error("Cloudflare R2 ortam degiskenleri eksik.");
  }

  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

async function uploadImageToR2(file: File, folder: string) {
  if (!file.type.startsWith("image/")) {
    throw new Error("Sadece gorsel dosyalari yukleyebilirsiniz.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = file.name.includes(".") ? file.name.split(".").pop() : "jpg";
  const key = `${folder}/${Date.now()}-${crypto.randomUUID()}.${ext}`;

  const r2BucketName = process.env.R2_BUCKET_NAME;
  const r2PublicUrl = process.env.R2_PUBLIC_URL;
  if (!r2BucketName || !r2PublicUrl) {
    throw new Error("Cloudflare R2 ortam degiskenleri eksik.");
  }

  const client = getR2Client();

  await client.send(
    new PutObjectCommand({
      Bucket: r2BucketName,
      Key: key,
      Body: buffer,
      ContentType: file.type,
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );

  return `${r2PublicUrl.replace(/\/$/, "")}/${key}`;
}

export async function uploadEventImageToR2(file: File) {
  return uploadImageToR2(file, "events");
}

export async function uploadProfileImageToR2(file: File) {
  return uploadImageToR2(file, "avatars");
}

export async function deleteR2Object(key: string) {
  const r2BucketName = process.env.R2_BUCKET_NAME;
  if (!r2BucketName) {
    throw new Error("Cloudflare R2 ortam degiskenleri eksik.");
  }

  const client = getR2Client();
  await client.send(
    new DeleteObjectCommand({
      Bucket: r2BucketName,
      Key: key,
    }),
  );
}

export async function deleteR2ObjectByUrl(url: string) {
  const r2PublicUrl = process.env.R2_PUBLIC_URL;
  if (!r2PublicUrl) {
    return;
  }

  let publicUrl: URL;
  let imageUrl: URL;
  try {
    publicUrl = new URL(r2PublicUrl.replace(/\/$/, ""));
    imageUrl = new URL(url);
  } catch {
    return;
  }

  if (publicUrl.origin !== imageUrl.origin) {
    return;
  }

  const key = imageUrl.pathname.replace(/^[\/]+/, "");
  if (!key) {
    return;
  }

  await deleteR2Object(key);
}
