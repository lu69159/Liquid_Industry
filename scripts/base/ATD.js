/**
 * Add To Database V1.0.4
 * @author Space
 * 推荐require放在星球JS下面
 */

function ATD(myplanet, func){
    var CA = Vars.content.getContentMap();

    for(var j = 0; j < CA.length; j++){
        var ALLC = CA[j];
        if(ALLC.size != 0){
            for(var i = 0; i < ALLC.size; i++){
                var thing = ALLC.get(i);
                if(thing instanceof UnlockableContent && func(thing)){
                    if(!thing.databaseTabs.contains(myplanet)){
                        thing.databaseTabs.add(myplanet);
                    }
                    if(!thing.shownPlanets.contains(myplanet)){
                        thing.shownPlanets.add(myplanet);
                    }
                }
            }
        }
    }
}

//把MOD中的所有东西加入MYPLANET星球数据库
exports.AddAllToDatabase = (modname, myplanet) => {
    if(!modname) throw "modname is null";
    if(typeof modname != "string") throw "modname is not string";

    if(!myplanet) throw "myplanet is null";
    if(!myplanet instanceof Planet) throw "myplanet is not Planet";

    Events.on(ContentInitEvent, cons(e => {
        ATD(myplanet, (thing) => {
            var mn = String(thing.name).split("-");
            return mn[0] == modname;
        });
    }));
}

//把PLANET星球的所有东西加入MYPLANET星球数据库
exports.AddPlanetToDatabase = (planet, myplanet) => {
    if(!planet) throw "planet is null";
    if(!planet instanceof Planet) throw "planet is not Planet";
    
    if(!myplanet) throw "myplanet is null";
    if(!myplanet instanceof Planet) throw "myplanet is not Planet";

    Events.on(ContentInitEvent, cons(e => {
        ATD(myplanet, (thing) => {
            return thing.shownPlanets.contains(planet);
        });
    }));
}

//把PLANET星球的所有东西加入MYPLANET星球数据库(不添加区块)
exports.AddPlanetToDatabaseWithoutSectors = (planet, myplanet) => {
    if(!planet) throw "planet is null";
    if(!planet instanceof Planet) throw "planet is not Planet";
    
    if(!myplanet) throw "myplanet is null";
    if(!myplanet instanceof Planet) throw "myplanet is not Planet";

    Events.on(ContentInitEvent, cons(e => {
        ATD(myplanet, (thing) => {
            return !(thing instanceof SectorPreset) && thing.shownPlanets.contains(planet);
        });
    }));
}

//把PLANET星球的所有东西加入MYPLANET星球数据库(自定义条件)
exports.AddPlanetToDatabaseWithFunc = (planet, myplanet, func) => {
    if(!planet) throw "planet is null";
    if(!planet instanceof Planet) throw "planet is not Planet";
    
    if(!myplanet) throw "myplanet is null";
    if(!myplanet instanceof Planet) throw "myplanet is not Planet";

    Events.on(ContentInitEvent, cons(e => {
        ATD(myplanet, (thing) => {
            return func(thing) && thing.shownPlanets.contains(planet);
        });
    }));
}

//添加(多个)东西到MYPLANET星球数据库，如果有添加ITEM会自动根据ITEM需求添加方块
exports.AddThingsToDatabase = (modname, things, myplanet) => {
    if(!modname) throw "modname is null";
    if(typeof modname != "string") throw "modname is not string";

    if(!myplanet) throw "myplanet is null";
    if(!myplanet instanceof Planet) throw "myplanet is not Planet";

    if(!things || things.length == 0) throw "things are null";

    Events.on(ContentInitEvent, cons(e => {
        var tmpitems = new Seq();
        ATD(myplanet, (thing) => {
            let bool = false;
            for(let thingname of things){
                let modthingname = modname + "-" + thingname;
                if(thing.name == thingname || thing.name == modthingname || 
                    (thing instanceof Unit && (thing.type.name == thingname || thing.type.name == modthingname))){
                    bool = true;
                    if(thing instanceof Item) tmpitems.add(thing);
                }
            }
            return bool;
        });

        if(tmpitems.size > 0){
            ATD(myplanet, (thing) => {
                return thing instanceof Block && tmpitems.contains(thing);  
            });
        }
    }));
}

