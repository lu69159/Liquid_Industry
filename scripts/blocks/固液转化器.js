const MC = require("base/MultiCrafterlib");

const 固液转化器 = MC.MultiCrafter("固液转化器", [
    //液->固	
    {
        input: {       
            items: ["液体工艺-亲水质/1"],  
            liquids: ["water/300"],
            power: 8
        },
        output: {
            items: ["液体工艺-固态水/1"],
        },
        craftTime: 300 
    },
    {
        input: {
            items: ["液体工艺-亲水质/1"],
            liquids: ["液体工艺-重水/300"],
            power: 8
        },
        output: {
            items: ["液体工艺-固态重水/1"],
        },
        craftTime: 300 
    },
    {
        input: {
            items: ["液体工艺-亲水质/1"],
            liquids: ["cryofluid/300"],
            power: 8
        },
        output: {
            items: ["液体工艺-固态冷冻液/1"],
        },
        craftTime: 300 
    },
    {
        input: {
            items: ["液体工艺-亲水质/1"],
            liquids: ["oil/300"],
            power: 8
        },
        output: {
            items: ["液体工艺-固态石油/1"],
        },
        craftTime: 300 
    },
    {
        input: {
            items: ["液体工艺-亲水质/1"],
            liquids: ["液体工艺-超级冷冻液/300"],
            power: 8
        },
        output: {
            items: ["液体工艺-固态超级冷冻液/1"],
        },
        craftTime: 300 
    },
//固->液
    {
        input: {       
            items: ["液体工艺-固态水/1"],
            power: 0.1
        },
        output: {
            liquids: ["water/300"]
        },
        craftTime: 30
    },
    {
        input: {       
            items: ["液体工艺-固态重水/1"],
            power: 0.1
        },
        output: {
            liquids: ["液体工艺-重水/300"]
        },
        craftTime: 30
    },
    {
        input: {       
            items: ["液体工艺-固态冷冻液/1"],
            power: 0.1
        },
        output: {
            liquids: ["cryofluid/300"]
        },
        craftTime: 30
    },
    {
        input: {       
            items: ["液体工艺-固态石油/1"],
            power: 0.1
        },
        output: {
            liquids: ["oil/300"]
        },
        craftTime: 30
    },
    {
        input: {       
            items: ["液体工艺-固态超级冷冻液/1"],
            power: 0.1
        },
        output: {
            liquids: ["液体工艺-超级冷冻液/300"]
        },
        craftTime: 30
    }
]);
固液转化器.selectionColumns = 5;
exports.固液转化器 = 固液转化器;