// Admin uploads to the investor site's S3 bucket, so new announcements and
// reports are stored exactly where the existing ones are: the bucket
// `nurengroup.com` (ap-southeast-1), at <folder>/pdf/<slug>.pdf. Requests are
// signed with aws4fetch (AWS Signature V4, no other dependencies).
//
// Off until AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are set; uploads then
// fall back to this server's volume (see store.js). The key needs
// s3:PutObject on the bucket's announcement/ and finance-report/ folders.
import { AwsClient } from 'aws4fetch';
import { S3_FOLDERS } from './validate.js';

const DEFAULT_BUCKET = 'nurengroup.com';
const DEFAULT_REGION = 'ap-southeast-1';
const MAX_NAME_ATTEMPTS = 50;

export function createS3Uploader({ bucket, region, signedFetch, publicFetch = fetch }) {
  // Path-style: the bucket name has dots, which break virtual-host TLS.
  const base = `https://s3.${region}.amazonaws.com/${bucket}`;

  return {
    bucket,
    region,

    /** Uploads without ever overwriting: an existing name moves on to -2, -3… */
    async upload({ folder, slug, buffer, mime, ext }) {
      if (!S3_FOLDERS.includes(folder)) throw new Error(`Unknown S3 folder: ${folder}`);
      const stem = slug || 'document';

      for (let n = 1; n <= MAX_NAME_ATTEMPTS; n += 1) {
        const key = `${folder}/pdf/${n === 1 ? stem : `${stem}-${n}`}.${ext}`;
        const url = `${base}/${key}`;
        const res = await signedFetch(url, {
          method: 'PUT',
          // If-None-Match makes S3 refuse (412) rather than replace an existing object.
          headers: { 'Content-Type': mime, 'If-None-Match': '*' },
          body: buffer,
        });
        if (res.status === 412) continue;
        if (!res.ok) throw new Error(`S3 refused the upload (${res.status}).`);

        // The site links to the file directly, so it must open without credentials.
        const check = await publicFetch(url, { method: 'HEAD' });
        if (!check.ok) {
          throw new Error(`Uploaded to ${key}, but the file is not publicly readable (${check.status}). Check the bucket policy.`);
        }
        return { url, key };
      }
      throw new Error('Could not find a free file name in S3.');
    },
  };
}

/** The uploader configured from the environment, or null when S3 isn't set up. */
export function s3UploaderFromEnv(env = process.env) {
  const accessKeyId = env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = env.AWS_SECRET_ACCESS_KEY;
  if (!accessKeyId || !secretAccessKey) return null;
  const region = env.AWS_REGION || DEFAULT_REGION;
  const client = new AwsClient({ accessKeyId, secretAccessKey, service: 's3', region });
  return createS3Uploader({
    bucket: env.S3_BUCKET || DEFAULT_BUCKET,
    region,
    signedFetch: (url, init) => client.fetch(url, init),
  });
}
