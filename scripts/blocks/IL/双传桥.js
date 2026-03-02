
const ILbridge = extend(ItemBridge, "双传桥", {
    canReplace(other){ 
        if(other.alwaysReplace) return true;
        if(other.privileged) return false;
        return other.replaceable && (other != this) && ((this.group != BlockGroup.none && (other.group == this.group || other.group == BlockGroup.liquids))) &&
            (this.size == other.size || (this.size >= other.size && ((this.subclass != null && this.subclass == other.subclass) || group.anyReplace)));
    }
});

ILbridge.buildType = (() => {
    return extend(ItemBridge.ItemBridgeBuild, ILbridge, {
        updateTransport(other){
            if(this.warmup > 0){
                this.moved = (this.moveLiquidQuick() > 0.05) || this.moved;
                var item = this.items.take();
                if(item != null && other.acceptItem(this, item)){
                    other.handleItem(this, item);
                    this.moved = true;
                }else if(item != null){
                    this.items.add(item, 1);
                    this.items.undoFlow(item);
                }
            }
        },
        moveLiquidQuick(){
            let other = Vars.world.build(this.link);
            if(other != null && this.block.linkValid(this.tile, other.tile)){
                let amount = Math.min(20, this.liquids.currentAmount(), 20 - other.liquids.currentAmount());   
                if(amount == 0)return 0;
                other.liquids.add(this.liquids.current(), amount);
                this.liquids.remove(this.liquids.current(), amount);  
                return amount;
            }
        },
        doDump(){
            this.dumpLiquid(this.liquids.current(), 1);
            this.super$doDump();
        }
    });
});
exports.ILbridge = ILbridge;