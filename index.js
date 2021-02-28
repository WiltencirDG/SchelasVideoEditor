const fs = require('fs')
const { resolve } = require('path');
const robots = {
    state: require('./robots/state'),
    cutter: require('./robots/cutVideos'),
    after: require('./robots/afterEffects'),
    time: require('./robots/time.js')
}

async function start(){
    deleteFiles()
    await robots.time();
    const content = await robots.state.load()
    await robots.cutter(content)
    await robots.after(content)
}

function deleteFiles(){
    const deleteDirFilesUsingPattern = (pattern, dirPath = __dirname) => {
        fs.readdir(resolve(dirPath), (err, fileNames) => {
          if (err) throw err;
          for (const name of fileNames) {
            if (pattern.test(name)) {
              fs.unlink(resolve(name), (err) => {
                if (err) throw err;
              });
            }
          }
        });
      }
      
      deleteDirFilesUsingPattern(/^after-effects+/);
}

start()