const ffmpeg = require('fluent-ffmpeg');
const moment = require('moment');
const fs = require('fs')
async function robot(content){

    const endVideo = '\\cuts\\cutted';
    const endVideoEdit = '\\edits\\edited';
    const folder = content.folder;
    const chunkSize = 2;

    if (!fs.existsSync(folder+'\\cuts')){
        fs.mkdirSync(folder+'\\cuts');
    }

    if (!fs.existsSync(folder+'\\edits')){
        fs.mkdirSync(folder+'\\edits');
    }

    let dirCont = fs.readdirSync(folder)
    let cutsCont = fs.readdirSync(folder+'\\cuts\\')
    const videos = dirCont.filter( function( elm ) {return elm.match(/.*\.(mp4)/ig);});

    const editedVideos = cutsCont.filter( function( elm ) {return elm.match(/.*\.(mp4)/ig);}).map((video) => {return folder+'\\cuts\\'+video});
    let command;
    let ordem = -1
    
    await cutVideos()
    // await editVideos()

    async function cutVideos(){

        for (i=0,j=content.cuts.length; i<j; i+=chunkSize) {
            await Promise.all(
                content.cuts.slice(i,i+chunkSize).map((cut)=> {
                    return new Promise((res,rej) => {
                        let index = cut.split(/[\[\]]+/)[1];
                        ordem ++
                    
                        let startTime = moment(cut.split(/[()]+/)[1].split(',')[0],"HH:mm:ss");
                        let endTime  = moment(cut.split(/[()]+/)[1].split(',')[1],"HH:mm:ss");
                        var duration = moment.duration(endTime.diff(startTime));
                        duration = parseInt(duration.asSeconds()).toString();
                        let video = folder+videos[index-1];
                        let output = folder+endVideo+'_'+ordem+'_['+index+']'+'.mp4';
                        console.log(output)
                        if(editedVideos.filter((e) => e == output)[0] == null){
                            command = ffmpeg().input(video)
                            .setStartTime(cut.split(/[()]+/)[1].split(',')[0])
                            .setDuration(duration)
                            .output(output)
                            .on('start', function(commandLine) {console.log('Started conversion...');})
                            .on('end', function(err) {if(!err){console.log('Conversion done.');editedVideos.push(output);res();}})
                            .on('error', function(err){console.log('Conversion error: '+video);rej(err);})
                            .run();
                        }else{
                            res()
                        }
                    })
                })
            )
        }
    }

    async function editVideos(){
        await Promise.all(
            content.groups.map(async (group) => {
                return new Promise((res,rej) => {
                    let groupNumber = group.split(/[\[\]]+/)[1];
                    let groupMembers = group.split(/[()]+/)[1].split(',')
                    let command = ffmpeg()
                    groupMembers.forEach((member) => {
                        editedVideos.filter((video) => video.indexOf('['+member+']') > 0).forEach((video) => {
                            command.addInput(video)
                        })
                    })
                    command.mergeToFile(folder+endVideoEdit+'['+groupNumber+'].mp4')
                    .on('start', function(commandLine) {console.log('Started merge groups...: ');})
                    .on('end', function(err) {if(!err){console.log('Conversion done.');res();}})
                    .on('error', function(err){console.log('Conversion error: ', +err);rej(err);})
                })
            })
        )
    }
}

module.exports = robot