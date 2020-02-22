import { resolve } from 'path';
import fs from 'fs';
import { PromisePm2 } from './PromisePm2';

export class Monitor {
  protected pm2: PromisePm2;
  protected readonly appName: string = 'App';
  protected readonly appPath: string = `${__dirname}/App.js`;

  constructor() {
    this.pm2 = new PromisePm2();
  }

  async start(pathToCredentials: string) {
    try {
      await this.pm2.runWithPm2(async pm2 => {
        process.env.LOG_FILES = process.env.LOG_FILES || '';
        if (!await this.fileExists(pathToCredentials)) {
          console.error('Credentials files must exist');
          return;
        }

        process.env.GOOGLE_APPLICATION_CREDENTIALS = pathToCredentials;
        return pm2.start({
          script: this.appPath,
          exec_mode: 'fork',
          interpreter: 'node'
        });
      });
    } catch (e) {
      console.log(e);
    }
  }

  async stop() {
    try {
      await this.pm2.runWithPm2(async pm2 => {
        try {
          await pm2.stop(this.appName);
        } catch (e) {
          if (e.message !== 'process or namespace not found') {
            console.log(e);
          }
        }

        try {
          await pm2.delete(this.appName);
        } catch (e) {
          if (e.message !== 'process or namespace not found') {
            console.log(e);
          }
        }
      });
    } catch (e) {
      if (e.message === 'process or namespace not found') {
        return;
      }

      console.log(e.message);
    }
  }

  async addFile(file: string) {
    let currentFiles: Set<string>;
    try {
      currentFiles = await this.currentFiles();
    } catch (e) {
      console.error('logger not started');
      return;
    }
    const filePath = resolve(file);
    if (!await this.fileExists(filePath)) {
      console.error(`failed to add ${file} as it does not exist`);
      return;
    }

    currentFiles.add(filePath);
    process.env.LOG_FILES = Array.from(currentFiles).join(',');
    await this.reload();
  }

  async removeFile(file: string) {
    let currentFiles: Set<string>;
    try {
      currentFiles = await this.currentFiles();
    } catch (e) {
      console.error('logger not started');
      return;
    }
    const filePath = resolve(file);
    if (!await this.fileExists(filePath)) {
      console.error(`failed to add ${file} as it does not exist`);
      return;
    }

    currentFiles.delete(filePath);
    process.env.LOG_FILES = Array.from(currentFiles).join(',');
    await this.reload();
  }

  async files() {
    const currentFiles = await this.currentFiles();
    if (currentFiles.size === 0) {
      console.log('No files are currently being monitored');
      return;
    }

    console.log('currently monitored files:');
    currentFiles.forEach(file => {
      console.log(`  ${file}`);
    });
  }

  protected async currentFiles(): Promise<Set<string>> {
    let env: {[key: string]: any} | undefined;
    try {
      env = await this.getEnv();
    } catch {
      return new Set();
    }
    if (!env || !env.LOG_FILES || typeof env.LOG_FILES !== 'string') {
      return new Set();
    }

    return new Set(env.LOG_FILES.split(','));
  }

  protected async getEnv() {
    try {
      const proc = await this.pm2.runWithPm2(async pm2 => {
        return pm2.env(this.appName);
      });

      return proc;
    } catch (e) {
      console.log(e.message);
      return {};
    }
  }

  protected async reload() {
    try {
      const proc = await this.pm2.runWithPm2(async pm2 => {
        return pm2.reload(this.appName, true);
      });

      return proc;
    } catch (e) {
      console.log(e.message);
      return {};
    }
  }

  protected fileExists(filePath: string): Promise<boolean> {
    return new Promise(accept => {
      fs.access(filePath, fs.constants.F_OK, err => {
        accept(!err);
      });
    });
  }
}
