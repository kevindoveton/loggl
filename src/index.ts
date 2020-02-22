#!/usr/bin/env node
import yargs from 'yargs';
import { Monitor } from './Monitor';

const { argv } = yargs
  .command('start', 'starts file monitor', y => {
    y.option('credentials', {
      demand: false,
      description: 'path credentials file',
      type: 'string'
    });
  })
  .command('stop', 'stop the logger')
  .command('add', 'add a new file to be logged', y => {
    y.option('file', {
      demand: true,
      description: 'path to file to add',
      type: 'string'
    });
  })
  .command('remove', 'stop logging a file', y => {
    y.option('file', {
      demand: true,
      description: 'path to file to add',
      type: 'string'
    });
  })
  .command('files', 'view current files')
  .demandCommand(1) // lets us assume a command is passed
  .strict() // unknown command error
  .help();

const command = argv._[0];
const monitor = new Monitor();

switch (command) {
  case 'start': {
    // eslint-disable-next-line
    const pathToCredentials: string | undefined = process.env.GOOGLE_APPLICATION_CREDENTIALS || (argv as any).credentials;
    if (typeof pathToCredentials === 'undefined') {
      console.error('You must either pass credentials as an option or set GOOGLE_APPLICATION_CREDENIALS as environment variable');
      break;
    }

    monitor.start(pathToCredentials);
    break;
  }
  case 'stop':
    monitor.stop();
    break;
  case 'add':
    monitor.addFile((argv as any).file);
    break;
  case 'remove':
    monitor.removeFile((argv as any).file);
    break;
  case 'files':
    monitor.files();
    break;
  default:
    console.error(`Error: command "${command}" not implemented yet`);
}
