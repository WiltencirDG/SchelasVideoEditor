const state = require('./state');
const fs = require('fs')
const { getVideoDurationInSeconds } = require('get-video-duration')

async function robot(){

    const content = state.load();
    content.cuts = []
    const folder = content.folder;
    let dirCont = fs.readdirSync(folder)
    const videos = dirCont.filter( function( elm ) {return elm.match(/.*\.(mp4)/ig);});
    let times = content.time;

    for(let group of times.map((time) => time.split(/[\[\]]+/)[1]).filter((group,index,self) => {return self.indexOf(group) == index})){
        let timesGroup = times.filter((time) => { return time.split(/[\[\]]+/)[1] == group})
        let time = timesGroup[0];
        
        let start = time.split(/[()]+/)[1].split(',')[0];
        
        content.cuts.push('['+group+'](00:00:00,'+start+')');

        for(let index = 1; index < timesGroup.length; index++){
            let time = timesGroup[index];
            let endPrevTime = timesGroup[index-1].split(/[()]+/)[1].split(',')[1];
            let group = time.split(/[\[\]]+/)[1];
            let start = time.split(/[()]+/)[1].split(',')[0];
            
            content.cuts.push('['+group+']('+endPrevTime+','+start+')');
        }

        time = timesGroup[timesGroup.length-1];
        group = time.split(/[\[\]]+/)[1];
        let endPrevTime = time.split(/[()]+/)[1].split(',')[1];
        let duration = await getVideoDurationInSeconds(folder+videos[group-1]);
        content.cuts.push('['+group+']('+endPrevTime+','+new Date(duration * 1000).toISOString().substr(11, 8)+')');
    }
    
    content.cuts = content.cuts.filter((cut) => cut.split(/[()]+/)[1].split(',')[0] != cut.split(/[()]+/)[1].split(',')[1])

    state.save(content);
}

module.exports = robot;