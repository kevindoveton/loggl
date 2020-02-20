// import { Tail } from 'tail';
// @ts-ignore
import { createReadStream } from 'tail-stream';
import {
  writeFileSync, read, readFile, existsSync, open, stat
} from 'fs';
import { createInterface as createReadLineInterface } from 'readline';
import { PassThrough as PassThroughStream } from 'stream';

export type onNewMessageCallback = (msg: string) => void;

export class File {
  // protected tail: Tail;
  protected queuedMessages: string[] = [];
  protected replayingMissedMessages = false;
  protected positionFile: string;
  protected logFile: string;
  protected lastKnownPosition: number = 0;

  constructor(filePath: string, positionFile?: string) {
    const positionFileIfNotDeclared = `${filePath}.pos`;
    this.logFile = filePath;

    // read missed data
    this.positionFile = positionFile || positionFileIfNotDeclared;
    this.setupPositionFile(this.positionFile).then(() => { this.sendQueuedMessages(); });

    // set up the tail
    const tail = createReadStream(filePath, {
      beginAt: 'end',
      onMove: 'stay',
      detectTruncate: true,
      onTruncate: 'end',
      endOnError: false
    });
    tail.on('data', async (buffer: Buffer) => {
      const messages = await this.bufferToLines(buffer);
      for (const msg of messages) {
        if (this.replayingMissedMessages) {
          this.queuedMessages.push(msg);
          continue;
        }

        this.sendMessage(msg);
      }
    });
    // this.tail = new Tail(filePath);
    // this.tail.on('line', msg => {
    // });
    // this.tail.watch();
  }

  /**
   * onNewMessage
   * add a new subscriber to be alerted on new messages
   */
  protected onNewMessageSubscribers: onNewMessageCallback[] = [];
  onNewMessage(cb: onNewMessageCallback) {
    this.onNewMessageSubscribers.push(cb);
  }

  /**
   * sendMessage
   * pass the message to the subscribers
   * @param msg the message to send
   */
  protected sendMessage(msg: string) {
    for (const subscriber of this.onNewMessageSubscribers) {
      subscriber(msg);
    }

    const startPos = this.lastKnownPosition;
    const newPos = startPos + Buffer.byteLength(msg, 'utf8') + 1;
    this.updatePositionFile(this.positionFile, newPos);
    this.lastKnownPosition = newPos;
  }

  /**
   * setupPositionFile
   * create / read the position file
   * then read the messages and pass back to subscribers
   * @param filePath path to position file
   */
  protected async setupPositionFile(filePath: string) {
    if (!existsSync(filePath)) {
      writeFileSync(filePath, '0');
      this.lastKnownPosition = 0;
    }

    this.replayingMissedMessages = true;
    this.readPositionFile(filePath).then(pos => {
      this.lastKnownPosition = Number(pos);
      this.readAndSendMissedMessages(this.lastKnownPosition);
    });
  }

  /**
   * readAndSendMissedMessages
   * read messages from position and send back to subscribers
   * @param position
   */
  protected async readAndSendMissedMessages(position: number) {
    return new Promise(accept => {
      stat(this.logFile, (err, stats) => {
        open(this.logFile, 'r', (err, fd) => {
          const bytesToRead = stats.size - position;
          const writeBuffer = Buffer.alloc(bytesToRead);
          read(fd, writeBuffer, 0, bytesToRead, position, (errRead, bytesRead, buffer) => {
            const stream = new PassThroughStream();
            stream.end(buffer);
            const rl = createReadLineInterface({ input: stream });

            rl.on('line', line => {
              this.sendMessage(line);
            });

            rl.on('close', () => {
              accept();
            });
          });
        });
      });
    });
  }

  protected async bufferToLines(buffer: Buffer): Promise<string[]> {
    return new Promise<string[]>(accept => {
      const lines: string[] = [];
      const stream = new PassThroughStream();
      stream.end(buffer);
      const rl = createReadLineInterface({ input: stream });

      rl.on('line', line => {
        lines.push(line);
      });

      rl.on('close', () => {
        accept(lines);
      });
    });
  }

  /**
   * read the position file
   * @param filePath path to position file
   */
  protected async readPositionFile(filePath: string): Promise<string> {
    return new Promise(accept => {
      readFile(filePath, (err, data) => {
        accept(data.toString());
      });
    });
  }

  /**
   * updatePositionFile
   * update the position file
   * @param filePath path to position file to update
   * @param newPosition last read position
   */
  protected async updatePositionFile(filePath: string, newPosition: number): Promise<void> {
    writeFileSync(filePath, newPosition);
  }

  /**
   * sendQueuedMessages
   * send all queued messages received while reading the previously missed messages
   */
  protected sendQueuedMessages() {
    for (const msg of this.queuedMessages) {
      this.sendMessage(msg);
    }

    this.replayingMissedMessages = false;
  }
}
