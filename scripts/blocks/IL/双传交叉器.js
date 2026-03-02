var Region;
const ILjunction = extend(Sorter, "双传交叉器", {
    load(){
        this.super$load();
        Region = Core.atlas.find(this.name);
    },
    drawPlanRegion(plan, list){
        Draw.rect(Region, plan.drawx(), plan.drawy());
    },
    drawPlanConfig(plan, list){
        return;
    },
    canReplace(other){ 
        if(other.alwaysReplace) return true;
        if(other.privileged) return false;
        return other.replaceable && (other != this) && ((this.group != BlockGroup.none && (other.group == this.group || other.group == BlockGroup.liquids))) &&
            (this.size == other.size || (this.size >= other.size && ((this.subclass != null && this.subclass == other.subclass) || group.anyReplace)));
    },
    setStats(){
        this.super$setStats();
        this.stats.remove(Stat.liquidCapacity);
    },
    setBars(){
        this.super$setBars();
        this.removeBar("liquid");
    }
});

ILjunction.configurable = false;

ILjunction.buildType = (() => {
    return extend(Sorter.SorterBuild, ILjunction, {
        acceptLiquid(source, liquid){
            return true;
        },
        config(){
            return null;
        },
        draw(){
            Draw.rect(Region, this.x, this.y);
        },
        getLiquidDestination(source, liquid){
            if(this.enabled == 0) return this;

            var dir = (source.relativeTo(this.tile.x, this.tile.y) + 4) % 4;
            var next = this.nearby(dir);
            if(next == null || (!next.acceptLiquid(this, liquid) && !(next.block instanceof LiquidJunction))){
                return this;
            }
            if(this.isSame(source) && this.isSame(next)){
                return this;
            }
            return next.getLiquidDestination(this, liquid);
        }
    });
});
exports.ILjunction = ILjunction;