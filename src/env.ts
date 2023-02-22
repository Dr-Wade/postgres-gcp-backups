import { envsafe, str, bool} from "envsafe";

export const env = envsafe({
  GCP_PROJECT_ID: str(),
  GCP_CLIENT_EMAIL: str(),
  GCP_PRIVATE_KEY: str(),
  GCP_BUCKET_NAME: str(),
  GCP_USE_VERSIONING: bool(),
  BACKUP_DATABASE_URL: str({
    desc: 'The connection string of the database to backup.'
  }),
  BACKUP_CRON_SCHEDULE: str({
    desc: 'The cron schedule to run the backup on.',
    default: '0 5 * * *',
    allowEmpty: true
  })
})
