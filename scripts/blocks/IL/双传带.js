const ILb = require("blocks/IL/双传桥");
//const ILj = require("blocks/IL/双传交叉器");
const ILduct = extend(Duct, "双传带", {
    init(){
        this.super$init();
        this.bridgeReplacement = ILb.ILbridge;
        //this.junctionReplacement = ILj.ILjunction; //自动替换
    },
    handlePlacementLine(plans){
        Placement.calculateBridges(plans, this.bridgeReplacement);
    },
    blends(tile, rotation, directional, direction, checkWorld){
        var realDir = Mathf.mod(rotation - direction, 4);
        if(directional != null && directional[realDir] != null){
            var otherx = directional[realDir].x;
            var othery = directional[realDir].y;
            var otherrot = directional[realDir].rotation;
            var otherblock = directional[realDir].block;
            if(
                (
                    (otherblock.outputsItems() || (this.lookingAt(tile, rotation, otherx, othery, otherblock) && otherblock.hasItems))
                    && this.lookingAtEither(tile, rotation, otherx, othery, otherrot, otherblock)
                ) || (
                    otherblock.hasLiquids && (otherblock.outputsLiquid || (this.lookingAt(tile, rotation, otherx, othery, otherblock))) && this.lookingAtEither(tile, rotation, otherx, othery, otherrot, otherblock)
                )
            ){
                return true;
            }
        }
        if(tile.nearbyBuild(Mathf.mod(rotation - direction, 4)) != null){
            var other2x = tile.nearbyBuild(Mathf.mod(rotation - direction, 4)).tileX();
            var other2y = tile.nearbyBuild(Mathf.mod(rotation - direction, 4)).tileY();
            var other2rot = tile.nearbyBuild(Mathf.mod(rotation - direction, 4)).rotation;
            var other2block = tile.nearbyBuild(Mathf.mod(rotation - direction, 4)).block;
        }
        return checkWorld && 
        (
            tile.nearbyBuild(Mathf.mod(rotation - direction, 4)) != null &&
            tile.nearbyBuild(Mathf.mod(rotation - direction, 4)).team == tile.team() && 
            (
                (
                    (other2block.outputsItems() || (this.lookingAt(tile, rotation, other2x, other2y, other2block) && other2block.hasItems))
                    && this.lookingAtEither(tile, rotation, other2x, other2y, other2rot, other2block)
                ) || (
                    other2block.hasLiquids && (other2block.outputsLiquid || (this.lookingAt(tile, rotation, other2x, other2y, other2block))) && this.lookingAtEither(tile, rotation, other2x, other2y, other2rot, other2block)
                )
            )
        );
    },
    canReplace(other){
        if(other.alwaysReplace) return true;
        if(other.privileged) return false;
        return other.replaceable && (other != this || (this.rotate && this.quickRotate)) && ((this.group != BlockGroup.none && (other.group == this.group || other.group == BlockGroup.liquids))|| other == this) &&
            (this.size == other.size || (this.size >= other.size && ((this.subclass != null && this.subclass == other.subclass) || group.anyReplace)));
    }
});

ILduct.buildType = (() => {
    var smoothLiquid = 0.0;
    return extend(Duct.DuctBuild, ILduct, {
        acceptLiquid(source, liquid){
            if(this.liquids == null) return true;
            return (this.liquids.current() == liquid || this.liquids.currentAmount() < 0.2)
                && (this.tile == null || source == this || (source.relativeTo(this.tile.x, this.tile.y) + 2) % 4 != this.rotation);
        },
        updateTile(){
            if(this.liquids != null && this.liquids.currentAmount() > 0.0001){
                let leaks = false;
                smoothLiquid = Mathf.lerpDelta(smoothLiquid, this.liquids.currentAmount() / this.block.liquidCapacity * 1.0, 0.05);
                this.moveLiquidForward(leaks, this.liquids.current());
            }
            this.super$updateTile();       
        },
        draw(){        
            this.super$draw();    
            this.drawLiquidLayer();  
        },
        drawLiquidLayer(){
            Draw.z(Layer.blockUnder+0.05);
            if(this.liquids.current() != null){
                //Drawf.liquid(lq, this.x, this.y, smoothLiquid, this.liquids.current().color.write(Tmp.c1));
                let frame = this.liquids.current().getAnimationFrame();
                let gas = this.liquids.current().gas ? 1 : 0;
                let liquidRegion = Vars.renderer.fluidFrames[gas][frame];
                Drawf.liquid(this.block.sliced(liquidRegion, Autotiler.SliceMode.none), this.x, this.y, smoothLiquid, this.liquids.current().color.write(Tmp.c1));
            }
        }
    });
});
exports.ILduct = ILduct;
