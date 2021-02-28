const makeAfterEffectsInterface = require('after-effects-node').makeAfterEffectsInterface
const ae = require('after-effects')

async function robot(content){
    
    const folder = content.folder+'\\edits';

    var create_composition = new ae.Command(name => {
        name = typeof name === "string" ? name : "New Comp";
        app.project.items.addComp(name, 1920, 1080, 1, 10800, 30);
    });
    
    for(let comp of content.comps){
        let compName = comp
        await ae.execute(create_composition, compName);
    }
    
    // // These options will be passed to the after effects process and our function will receive them as a paramter to the function
    const options = {
        "assetFolder": folder,
        "compositionMain": {
            "name": content.comps[0],
            "layerOverlapSeconds": 0,
            "videoLengthLimitSeconds": 3600
        },
    }
     
    const aeInterface = makeAfterEffectsInterface({afterEffectsPath: 'C:\\Program Files\\Adobe\\Adobe After Effects CC 2019'})
    const result = aeInterface.executeFunctionInAfterEffects(optionsFromNode => {
        log.info('Starting...')
     
        const {options} = optionsFromNode
        const assetsInterface = makeAssetsInterface(app.project)
        const projectInterface = makeProjectInterface(app.project)
        const layersInterface = makeLayersInterface(assetsInterface.findByName(options.compositionMain.name))
        const importedAssets = projectInterface.importAssets(options.assetFolder, '*.mp4')
        
        const videoEndTimes = []
     
        log.info('Creating layers')
        layersInterface.addAll(importedAssets, options.compositionMain.layerOverlapSeconds, (layer, previousLayer) => {
            if (previousLayer) {
                videoEndTimes.push(previousLayer.outPoint)
            }
     
            if (layer.outPoint > options.compositionMain.videoLengthLimitSeconds) return true // don't add anymore beyond time limit
        })
     
        log.info('After Effects finished processing script')
        return videoEndTimes
    }, {options});
     
}

module.exports = robot;