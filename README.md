# Node Tail File
Tail files and push the results to the centralised log server of your choice.

## Usage
```bash
npm i -g loggl

loggl start # start main process

loggl add --file test.txt # start monitoring a file

loggl files # view all files being monitored
## currently monitored files:
##  /path/to/test.txt

loggl remove --file /path/to/test.txt # stop monitoring a file

loggl files
## No files are currently being monitored

loggl stop # stop the main process
```
