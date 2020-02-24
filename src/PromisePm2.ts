import pm2 from 'pm2';

export class PromisePm2 {
  async runWithPm2<T>(fn: (promisePm2: this) => T|Promise<T>): Promise<T> {
    let error: Error | undefined;
    let response: T | undefined;
    await this.connect();

    try {
      response = await fn(this);
    } catch (e) {
      error = e;
    }

    this.disconnect();

    if (error) {
      throw error;
    }

    return response as T;
  }

  connect(): Promise<void> {
    return new Promise((accept, reject) => {
      pm2.connect(err => {
        if (err) {
          console.log(err);
          reject(err);
        }

        return accept();
      });
    });
  }

  start(options: pm2.StartOptions): Promise<pm2.Proc> {
    return new Promise((accept, reject) => {
      pm2.start(options, (err, apps) => {
        if (err) {
          reject(err);
        }

        return accept(apps);
      });
    });
  }

  stop(app: string) {
    return new Promise((accept, reject) => {
      pm2.stop(app, (err, apps) => {
        if (err) {
          reject(err);
        }

        return accept(apps);
      });
    });
  }

  delete(app: string) {
    return new Promise((accept, reject) => {
      pm2.delete(app, (err, apps) => {
        if (err) {
          reject(err);
        }

        return accept(apps);
      });
    });
  }

  disconnect(): void {
    pm2.disconnect();
  }

  env(app: string): Promise<{[key: string]: any}> {
    return new Promise((accept, reject) => {
      pm2.describe(app, (err, apps) => {
        if (err || apps.length === 0) {
          return reject(err);
        }

        accept(apps[0].pm2_env);
      });
    });
  }

  running(app: string): Promise<boolean> {
    return new Promise(accept => {
      pm2.describe(app, (err, apps) => {
        if (err || apps.length === 0) {
          return accept(false);
        }

        accept(apps[0].pm2_env && apps[0].pm2_env.status === 'online');
      });
    });
  }

  reload(app:string, reloadEnv: boolean = false) {
    return new Promise((accept, reject) => {
      (pm2 as any).reload(
        app,
        { updateEnv: reloadEnv },
        (err: any, proc: pm2.ProcessDescription) => {
          if (err) {
            return reject(err);
          }

          accept(proc);
        }
      );
    });
  }
}
