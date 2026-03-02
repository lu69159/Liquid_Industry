//-----------------------------------------------------------
/*
 * @author guiY
 * @Extra mod <https://github.com/guiYMOUR/mindustry-Extra-Utilities-mod>
 */
//创世神2.67版本代码
const speedyetii = 2;
var Region, centreRegion;
const 液体卸载器 = extend(LiquidSource, "液体卸载器", {
    load() {
        this.super$load();
        centreRegion = Core.atlas.find(this.name + "-centre");
        Region = Core.atlas.find(this.name);
    },
    stats(){
        this.super$stats();
        this.stats.add(Stat.speed, speedyetii * 60, StatUnit.liquidSecond);
        this.stats.remove(Stat.liquidCapacity);
    },
    drawRequestConfig(req, list) {
        this.drawRequestConfigCenter(req, req.config, centreRegion, true);
    },
});
液体卸载器.buildType = prov(() => {
    var dumpingTo = null;
    var offset = 0;
    var liquidBegin = null;
    return new JavaAdapter(LiquidSource.LiquidSourceBuild,  {
        updateTile() {
            if (liquidBegin != this.source) {
                this.liquids.clear();
                liquidBegin = this.source;
            }
            for (var i = 0; i < this.proximity.size; i++) {
                var pos = (offset + i) % this.proximity.size;
                var other = this.proximity.get(pos);

                if (other.interactable(this.team) && other.block.hasLiquids && this.source != null && other.liquids.get(this.source) > 0) {
                    dumpingTo = other;
                    if (this.liquids.currentAmount() < this.block.liquidCapacity) {
                        var amount = Math.min(speedyetii, other.liquids.get(this.source));
                        this.liquids.add(this.source, amount);
                        other.liquids.remove(this.source, amount);
                    }
                }
            }
            if (this.proximity.size > 0) {
                offset++;
                offset %= this.proximity.size;
            }
            this.dumpLiquid(this.liquids.current());
        },
        canDumpLiquid(to, liquid) {
            return to != dumpingTo;
        },
        draw() {
            Draw.rect(Region, this.x, this.y);
            if (this.source == null) {
                Draw.color(181/255, 171/255, 171/255);
                Draw.rect(centreRegion, this.x, this.y);
                Draw.color();
            } else {
                Draw.color(this.source.color);
                Draw.rect(centreRegion, this.x, this.y);
                Draw.color();
            }
        },
    }, 液体卸载器);
});

液体卸载器.buildVisibility = BuildVisibility.shown;

exports.液体卸载器 = 液体卸载器;
