import { exec } from "child_process";
import { Storage } from "@google-cloud/storage";
import { createReadStream } from "fs";

import { env } from "./env";

const uploadToGCP = async ({ name, path }: {name: string, path: string}) => {
  console.log("Uploading backup to GCP...");
  const projectId = env.GCP_PROJECT_ID;
  const clientEmail = env.GCP_CLIENT_EMAIL;
  const privateKey = env.GCP_PRIVATE_KEY;
  const bucketName = env.GCP_BUCKET_NAME;

  const storage = new Storage({ 
    projectId, 
    credentials: {
      client_email: clientEmail,
      private_key: privateKey.replace(/\\n/g, "\n")
    }
  });

  const bucket = storage.bucket(bucketName);
  const file = bucket.file(name);
  createReadStream(path).pipe(file.createWriteStream())
    .on('finish', () => {
      console.log("Backup uploaded to GCP...");
    });
}

const dumpToFile = async (path: string) => {
  console.log("Dumping DB to file...");
  await new Promise((resolve, reject) => {
    exec(
      `pg_dump ${env.BACKUP_DATABASE_URL} -F t | gzip > ${path}`,
      (error, stdout, stderr) => {
        if (error) {
          reject({ error: JSON.stringify(error), stderr });
          return;
        }

        resolve(undefined);
      }
    );
  });

  console.log("DB dumped to file...");
}

export const backup = async () => {
  console.log("Initiating DB backup...")
  var filename = 'backup.gz'
  if (env.BACKUP_FILE_PREFIX) filename = env.BACKUP_FILE_PREFIX + '-' + filename
  if (!env.GCP_USE_VERSIONING) {
    let date = new Date().toISOString()
    const timestamp = date.replace(/[:.]+/g, '-')
    filename = `backup-${timestamp}.gz`
  }

  const filepath = `/tmp/${filename}`

  await dumpToFile(filepath)
  await uploadToGCP({name: filename, path: filepath})

  console.log("DB backup complete...")
}
