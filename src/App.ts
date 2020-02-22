import { writeFileSync, existsSync } from 'fs';
import { track } from 'temp';
import { File } from './File';
import { StackdriverLog } from './Logger';


function saveCredentials() {
  const temp = track();
  const googleApplicationCredentialsFileName = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const dialogFlowServiceAccountKeyData = process.env.DIALOGFLOW_SERVICE_ACCOUNT;
  if (typeof dialogFlowServiceAccountKeyData !== 'undefined') {
    const pathToWrite: string = googleApplicationCredentialsFileName || temp.path();
    process.env.GOOGLE_APPLICATIONS_CREDENTIALS = pathToWrite;

    writeFileSync(pathToWrite, dialogFlowServiceAccountKeyData);
    console.info(`Wrote google service account file to ${pathToWrite}`); // eslint-disable-line
  }
}

async function snooze(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


async function main() {
  saveCredentials();

  const logger = new StackdriverLog('trace');

  if (typeof process.env.LOG_FILES !== 'string') {
    throw new Error('must be started with LOG_FILES env variable');
  }

  const files = process.env.LOG_FILES.split(',');
  if (files.length === 1 && files[0] === '') {
    // eslint-disable-next-line
    while (true) {
      console.log('nothing to do, sleeping');
      // eslint-disable-next-line
      await snooze(60000);
    }
  }

  for (const file of files) {
    if (!existsSync(file)) {
      logger.error(`skipping ${file} as it does not exist`);
      continue;
    }

    new File(file, `${file}.log-push-pos`).onNewMessage(msg => {
      logger.info(msg);
    });
  }
}

main();
