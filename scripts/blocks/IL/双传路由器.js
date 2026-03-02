var bottomRegion,Region;
const ILrouter = extend(Router, "双传路由器", {
    load(){
        this.super$load();
        Region = Core.atlas.find(this.name);
        bottomRegion = Core.atlas.find(this.name + "-bottom");
    },
    canReplace(other){ 
        if(other.alwaysReplace) return true;
        if(other.privileged) return false;
        return other.replaceable && (other != this) && ((this.group != BlockGroup.none && (other.group == this.group || other.group == BlockGroup.liquids))) &&
            (this.size == other.size || (this.size >= other.size && ((this.subclass != null && this.subclass == other.subclass) || group.anyReplace)));
    },
    drawPlanRegion(plan, list){
        Draw.rect(bottomRegion, plan.drawx(), plan.drawy());
        Draw.rect(this.region,plan.drawx(), plan.drawy());
    },
    icon(){
        return [bottomRegion, Region];
    }
});

ILrouter.buildType = (() => {
    return extend(Router.RouterBuild, ILrouter, {
        acceptLiquid(source,liquid){
            if(this.liquids.current() == null) return false;
            return (this.liquids.current() == liquid || this.liquids.currentAmount() < 0.2);
        },
        canControl(){
            return false;
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
            if(this.liquids != null && this.liquids.currentAmount() > 0.0001){
                this.dumpLiquid(this.liquids.current());
            }
            this.super$updateTile();
        }
    });
});
exports.ILrouter = ILrouter;