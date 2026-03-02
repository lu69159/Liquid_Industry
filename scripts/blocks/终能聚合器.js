var lightRegion;
var fireTimer = 0;

const F = new Fires();
const {NT} = require("planets/Nepture");
const 衰变熔岩 = extend(Liquid, "衰变熔岩", {
    update(puddle){
        if(!Vars.state.rules.fire) return;
        fireTimer += Time.delta;
        if(fireTimer >= 60){
            F.create(puddle.tile);
            fireTimer = 0;
        }
    }
});
衰变熔岩.shownPlanets.add(NT);
衰变熔岩.shownPlanets.add(Planets.serpulo);

const 终能聚合器 = extend(GenericCrafter, "终能聚合器", {
    load(){
        this.super$load();
        lightRegion = Core.atlas.find(this.name + "-light");
    }
});

const explosionBullet = new ExplosionBulletType(2400, 12.0 * 8);

const exWaveEffect = new WaveEffect();
exWaveEffect.lifetime = 25;
exWaveEffect.sizeFrom = 0;
exWaveEffect.sizeTo = 96;
exWaveEffect.strokeFrom = 4;
exWaveEffect.strokeTo = 0;
exWaveEffect.colorFrom = Color.valueOf("FFFFFFD0");
exWaveEffect.colorTo = Color.valueOf("FF1010D0");

终能聚合器.buildType = prov(() => {
    return extend(GenericCrafter.GenericCrafterBuild, 终能聚合器, {
        created(){
            this.super$created();
            this.flash = 0.0;
        },
        draw(){
            this.super$draw();

            let coolColor = new Color(1, 1, 1, 0);
            let hotColor = Color.valueOf("FF5050A0");
            let warn = this.liquids.get(衰变熔岩) / this.block.liquidCapacity;

            Draw.color(coolColor, hotColor, Math.max((warn-0.3)/0.7, 0));
            Fill.rect(this.x, this.y, this.block.size * 8, this.block.size * 8);
                 
            if(warn > 0.3){
                this.flash += (1 + ((warn - 0.3) / (1 - 0.3)) * 6) * Time.delta;
                Draw.color(Color.valueOf("FF0000"), Color.valueOf("FFFF00"), Mathf.absin(this.flash, 9, 1));
                Draw.alpha(0.3);
                Draw.rect(lightRegion, this.x, this.y);
            }
        },
        updateTile(){
            this.super$updateTile();
            if(this.liquids.get(衰变熔岩) >= this.block.liquidCapacity - 0.01){
                this.kill();
                explosionBullet.create(this, Team.derelict, this.x, this.y, 0);
                exWaveEffect.at(this.x, this.y);
            }
        }
    });
});
exports.终能聚合器 = 终能聚合器;