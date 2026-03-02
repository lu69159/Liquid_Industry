exports.WallLiquidRouter = (name) => {
    var bottomRegion,Region;
    const wall = extend(Wall, name, {
        load(){
            this.super$load();
            bottomRegion = Core.atlas.find(this.name + "-bottom");
            Region = Core.atlas.find(this.name);
        },
        drawPlanRegion(plan, list){
            Draw.rect(bottomRegion, plan.drawx(), plan.drawy());
            Draw.rect(Region, plan.drawx(), plan.drawy());
        },
        icons(){
            return [bottomRegion, Region];
        }
    });
    wall.update = true;
    wall.buildCostMultiplier = 2.5
    wall.buildType = (() => {
        return extend(Wall.WallBuild, wall, {
            acceptLiquid(source, liquid){
                if(this.liquids.current() == null) return true;
                return (this.liquids.current() == liquid || this.liquids.currentAmount() < 0.2);
            },
            draw(){
                Draw.rect(bottomRegion, this.x, this.y);
                if(this.liquids.current() != null && this.liquids.currentAmount() > 0.001){
                    this.drawLiquid();
                }
                Draw.rect(Region, this.x, this.y);
            },
            drawLiquid(){
                let frame = this.liquids.current().getAnimationFrame();
                let gas = this.liquids.current().gas ? 1 : 0;
                let lq = Vars.renderer.fluidFrames[gas][frame];
                let liquidRegion = Tmp.tr1;
                liquidRegion.set(lq);
                Drawf.liquid(liquidRegion, this.x, this.y, this.liquids.currentAmount() / this.block.liquidCapacity * 1.0, this.liquids.current().color.write(Tmp.c1));
            },
            updateTile(){
                if(this.liquids.current() != null && this.liquids.currentAmount() > 0.01){
                    this.dumpLiquid(this.liquids.current());
                }
                this.super$updateTile();
            }
        });
    });

    return wall;
};

exports.StatusProjetor = (name, status) => {        //支持单个/多个状态效果
    if(name == null) throw new Error("name为空");
    if(status == null) throw new Error("status为空");

    var isSeq;
    let stflag = true;
    if(status instanceof StatusEffect){
        isSeq = false;
    }
    else if(status instanceof Seq){
        status.each(s => {
            if(!(s instanceof StatusEffect)){
                stflag = false;
            }
        });
        isSeq = true;
    }
    else{
        stflag = false;
    }

    if(!stflag) throw new Error("status参数错误");

    const statusStat = new Stat("status", StatCat.function),  //状态效果
        statusTime = new Stat("statustime", StatCat.function), //状态施加间隔
        statusDuration = new Stat("statusduration", StatCat.function);  //状态持续时间
    
    //useTime -> 状态持续时间
    //reload -> 施加状态间隔时间
    const SP = extend(OverdriveProjector, name, {
        setStats(){
            this.super$setStats();
            this.stats.remove(Stat.speedIncrease);
            this.stats.remove(Stat.productionTime);

            if(isSeq){
                var statusStr = "";
                status.each(s => {
                    statusStr += (s.hasEmoji() ? s.emoji() : "") + "[stat]" + s.localizedName + " ";
                });
                this.stats.add(statusStat, statusStr);
            }
            else{
                this.stats.add(statusStat, (status.hasEmoji() ? status.emoji() : "") + "[stat]" + status.localizedName);
            }

            this.stats.add(statusTime, this.reload / 60, StatUnit.seconds);
            this.stats.add(statusDuration, this.useTime / 60, StatUnit.seconds);

        },
        setBars(){
            this.super$setBars();
            this.removeBar("boost");
        },
        drawPlace(x, y, rotation, valid){
            this.drawPotentialLinks(x, y);
            this.drawOverlay(x * Vars.tilesize + this.offset, y * Vars.tilesize + this.offset, rotation);
            Drawf.dashCircle(x * Vars.tilesize + this.offset, y * Vars.tilesize + this.offset, this.range, Pal.accent);
        }
    });

    SP.hasBoost = false;
    SP.emitLight = true;
    SP.hasItems = false;

    //多状态效果时使用白色
    var color = (isSeq)?Color.valueOf("FFFFFF"):status.color; 
    const SE = new WaveEffect();

    Events.on(ContentInitEvent, cons(e => {
        SE.sizeFrom = 0;
        SE.sizeTo = SP.range;
        SE.strokeFrom = 3;
        SE.strokeTo = 0;
        SE.colorFrom = color;
        SE.colorTo = color
        SE.sides = 12;
        SE.lifetime = 60;

        SP.lightRadius = SP.range * 1.1;
    }));

    SP.buildType = prov(() => {
        var targets = new Seq();

        return extend(OverdriveProjector.OverdriveBuild, SP, {
            created(){
                this.super$created();
                this.refresh = 0;
                this.sflag = false;
            },
            updateTile(){
                if(this.efficiency > 0 && (this.refresh += Time.delta * this.efficiency) >= this.block.reload){
                    targets.clear();
                    this.refresh = 0;
                    this.sflag = true;
                    Units.nearby(this.team, this.x, this.y, this.block.range, u => {
                        targets.add(u);
                    });     
                }

                if(this.efficiency > 0 && this.sflag){
                    targets.each(target => {
                        if(isSeq){
                            status.each(s => {
                                target.apply(s, this.block.useTime);
                            });
                        }
                        else{
                            target.apply(status, this.block.useTime);
                        }  
                    });
                    this.sflag = false;
                    SE.at(this.x, this.y);
                }
            },
            drawSelect(){
                Drawf.dashCircle(this.x, this.y, this.block.range, Pal.accent);
            },
            draw(){
                Draw.rect(this.block.region, this.x, this.y, 0);

                let f = 1 - (Time.time / 100) % 1;
                Draw.alpha(1);
                Draw.color(color);
                Lines.stroke((2 * f + 0.2) * this.efficiency);
                Lines.square(this.x, this.y, Math.min(1 + (1 - f) * this.block.size * Vars.tilesize / 2, this.block.size * Vars.tilesize/2));

                Draw.reset();
            },
            write(write){
                write.f(this.refresh);
                write.bool(this.sflag);
            },
            read(read, revision){
                this.refresh = read.f();
                this.sflag = read.bool();
            }
        });
    });

    return SP;
};

//其实就改了颜色和Units.nearby
exports.EnemyStatusProjetor = (name, status) => {        //支持单个/多个状态效果
    if(name == null) throw new Error("name为空");
    if(status == null) throw new Error("status为空");

    var isSeq;
    let stflag = true;
    if(status instanceof StatusEffect){
        isSeq = false;
    }
    else if(status instanceof Seq){
        status.each(s => {
            if(!(s instanceof StatusEffect)){
                stflag = false;
            }
        });
        isSeq = true;
    }
    else{
        stflag = false;
    }

    if(!stflag) throw new Error("status参数错误");

    const statusStat = new Stat("status", StatCat.function),  //状态效果
        statusTime = new Stat("statustime", StatCat.function), //状态施加间隔
        statusDuration = new Stat("statusduration", StatCat.function);  //状态持续时间
    
    //useTime -> 状态持续时间
    //reload -> 施加状态间隔时间
    const SP = extend(OverdriveProjector, name, {
        setStats(){
            this.super$setStats();
            this.stats.remove(Stat.speedIncrease);
            this.stats.remove(Stat.productionTime);

            if(isSeq){
                var statusStr = "";
                status.each(s => {
                    statusStr += (s.hasEmoji() ? s.emoji() : "") + "[stat]" + s.localizedName + " ";
                });
                this.stats.add(statusStat, statusStr);
            }
            else{
                this.stats.add(statusStat, (status.hasEmoji() ? status.emoji() : "") + "[stat]" + status.localizedName);
            }

            this.stats.add(statusTime, this.reload / 60, StatUnit.seconds);
            this.stats.add(statusDuration, this.useTime / 60, StatUnit.seconds);

        },
        setBars(){
            this.super$setBars();
            this.removeBar("boost");
        },
        drawPlace(x, y, rotation, valid){
            this.drawPotentialLinks(x, y);
            this.drawOverlay(x * Vars.tilesize + this.offset, y * Vars.tilesize + this.offset, rotation);
            Drawf.dashCircle(x * Vars.tilesize + this.offset, y * Vars.tilesize + this.offset, this.range, Pal.accent);
        }
    });

    SP.hasBoost = false;
    SP.emitLight = true;
    SP.hasItems = false;

    //多状态效果时使用黑色
    var color = (isSeq)?Color.valueOf("000000"):status.color; 
    const SE = new WaveEffect();

    Events.on(ContentInitEvent, cons(e => {
        SE.sizeFrom = 0;
        SE.sizeTo = SP.range;
        SE.strokeFrom = 3;
        SE.strokeTo = 0;
        SE.colorFrom = color;
        SE.colorTo = color
        SE.sides = 12;
        SE.lifetime = 60;

        SP.lightRadius = SP.range * 1.1;
    }));

    SP.buildType = prov(() => {
        var targets = new Seq();

        return extend(OverdriveProjector.OverdriveBuild, SP, {
            created(){
                this.super$created();
                this.refresh = 0;
                this.sflag = false;
            },
            updateTile(){
                if(this.efficiency > 0 && (this.refresh += Time.delta * this.efficiency) >= this.block.reload){
                    targets.clear();
                    this.refresh = 0;
                    this.sflag = true;
                    Units.nearbyEnemies(this.team, this.x, this.y, this.block.range, u => {
                        targets.add(u);
                    });     
                }

                if(this.efficiency > 0 && this.sflag){
                    targets.each(target => {
                        if(isSeq){
                            status.each(s => {
                                target.apply(s, this.block.useTime);
                            });
                        }
                        else{
                            target.apply(status, this.block.useTime);
                        }  
                    });
                    this.sflag = false;
                    SE.at(this.x, this.y);
                }
            },
            drawSelect(){
                Drawf.dashCircle(this.x, this.y, this.block.range, Pal.accent);
            },
            draw(){
                Draw.rect(this.block.region, this.x, this.y, 0);

                let f = 1 - (Time.time / 100) % 1;
                Draw.alpha(1);
                Draw.color(color);
                Lines.stroke((2 * f + 0.2) * this.efficiency);
                Lines.square(this.x, this.y, Math.min(1 + (1 - f) * this.block.size * Vars.tilesize / 2, this.block.size * Vars.tilesize/2));

                Draw.reset();
            },
            write(write){
                write.f(this.refresh);
                write.bool(this.sflag);
            },
            read(read, revision){
                this.refresh = read.f();
                this.sflag = read.bool();
            }
        });
    });

    return SP;
};

//以下是单位相关/////////////////////////////////////////////////////////////////////////////

exports.HoverTank = (name) => {

    const 倍乘级单位直构工厂 = require("base/LIblockslib").倍乘级单位直构工厂;
    const 多幂级单位直构工厂 = require("base/LIblockslib").多幂级单位直构工厂;
    const 无量级单位直构工厂 = require("base/LIblockslib").无量级单位直构工厂;

    const HT = extend(UnitType, name, {
        getDependencies(cons){ //用来防止直构工厂被添加到单位研究要求中
            Vars.content.blocks().each(block => {
                if(block != 倍乘级单位直构工厂 && block != 多幂级单位直构工厂 && block != 无量级单位直构工厂 && block instanceof Reconstructor){
                    block.upgrades.each(recipe => {
                        if(recipe[1] == this){
                            cons.get(block);
                        }
                    });
                }
            });

            let researchReqs = this.researchRequirements();
            for(let i = 0; i < researchReqs.length; i++){
                let stack = researchReqs[i];
                cons.get(stack.item);
            }
        }
    });
    HT.constructor = prov(() => extend(UnitTypes.elude.constructor.get().class, {}));

    return HT;
};

exports.HealCommand = () => {
    //healAI:寻找残血单位治疗，优先寻找高血量、掉血多的单位，当附近有敌人且单位血量高于50%时优先后退
    function healAI(){
        const fleeRange = 300;
        const retreatDst = 160;
        const retreatDelay = Time.toSeconds * 1;
        const healAI = extend(DefenderAI, {
            retreatTimer: 0,
            avoid: null,
            damagedTarget: null,
            escape: false,
            canEscape(){
                return this.avoid != null && (this.target == null || this.target.dead || this.target.health / this.target.maxHealth > 0.5);
            },
            updateMovement(){
                if(this.timer.get(this.timerTarget4, 40)){
                    this.avoid = Units.closestTarget(this.unit.team, this.unit.x, this.unit.y, fleeRange);
                    this.escape = this.canEscape();
                }           
                if(this.escape){
                    if((this.retreatTimer += Time.delta) >= retreatDelay){
                            var core = this.unit.closestCore();
                            if(core != null && !this.unit.within(core, retreatDst)){
                                this.moveTo(core, retreatDst);
                            }
                    }
                }
                else{
                    this.retreatTimer = 0;
                    if(this.target instanceof Unit && this.target.team == this.unit.team){
                        if(!this.target.within(this.unit, this.unit.type.range * 0.65)){
                            this.moveTo(this.target, this.unit.type.range * 0.65);
                        }
                    }
                }
            },
            updateTargeting(){
                if(this.timer.get(this.timerTarget, 15)){
                    this.damagedTarget = Units.closest(this.unit.team, this.unit.x, this.unit.y, 4000, u => !u.dead && u.type != this.unit.type && u.health < u.maxHealth, (u, tx, ty) =>  -u.maxHealth - (u.maxHealth - u.health) + Mathf.dst2(u.x, u.y, tx, ty) / 6400);
                }

                if(this.damagedTarget == null){
                    this.super$updateTargeting();
                }
                else{
                    this.target = this.damagedTarget;
                }
            }
        });
        return healAI;
    };
    const HC = new UnitCommand("heal", "add", u => new healAI());
    return HC;
};
