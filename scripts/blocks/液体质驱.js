var hitEffect = Fx.hitLiquid;
//液体质驱弹
const LiquidMassDriverBolt = extend(BulletType, {
    damage: 50,
    lifetime: 300,
    collidesTiles: false,
    hitEffect: Fx.hitLiquid,
    despawnEffect: Fx.hitLiquid,
    update(b){
        this.super$update(b);

        var hitDst = 7;
        var data = b.data;
        //if the target is dead, just keep flying until the bullet explodes
        if(data.to.dead){
            return;
        }

        var baseDst = data.from.dst(data.to),
            dst1 = b.dst(data.from),
            dst2 = b.dst(data.to);

        var intersect = false;

        //bullet has gone past the destination point: but did it intersect it?
        if(dst1 > baseDst){
            var angleTo = b.angleTo(data.to),
                baseAngle = data.to.angleTo(data.from);

            //if angles are nearby, then yes, it did
            if(Angles.near(angleTo, baseAngle, 2)){
                intersect = true;
                //snap bullet position back; this is used for low-FPS situations
                b.set(data.to.x + Angles.trnsx(baseAngle, hitDst), data.to.y + Angles.trnsy(baseAngle, hitDst));
            }
        }
        //if on course and it's in range of the target
        if(Math.abs(dst1 + dst2 - baseDst) < 4 && dst2 <= hitDst){
            intersect = true;
        } //else, bullet has gone off course, does not get received.
        if(intersect){
            data.to.handleLiquidPayload(b, data);
        }
    },
    draw(b){
        this.super$draw(b);
        const orbSize = 4, boilTime = 5;
        var liquid = b.data.liquidType;
        if(liquid.willBoil()){
            Draw.color(liquid.color, Tmp.c3.set(liquid.gasColor), b.time / Mathf.randomSeed(b.id, boilTime));
            Fill.circle(b.x, b.y, orbSize * (b.fin() * 1.1 + 1));
        }
        else{
            Draw.color(liquid.color, Color.white, b.fout() / 100);
            Fill.circle(b.x, b.y, orbSize);
        }
        Draw.reset();
    },
    despawned(b){
        this.super$despawned(b);
        if(!b.data.liquidType.willBoil()){
            hitEffect.at(b.x, b.y, b.rotation(), b.data.liquidType.color);
        }
    },
    hit(b, hitx, hity){
        hitEffect.at(b.x, b.y, b.rotation(), b.data.liquidType.color);
        if(b.data.liquidAmount == 0) return;
        Puddles.deposit(Vars.world.tileWorld(b.x, b.y), b.data.liquidType, 6 + b.data.liquidAmount / 400);
        if(b.data.liquidType.effect != null){
            Damage.status(b.team, b.x, b.y, 4 * Vars.tilesize, b.data.liquidType.effect, 4 * 60, true, true);
        };
        if(b.data.liquidType.temperature >= 1 || b.data.liquidType.flammability >= 0.5){
            Fires.create(b.tileOn());
        };
        if(b.data.liquidType.explosiveness >= 0.5){
            Damage.damage(b.team, b.x, b.y, 4 * Vars.tilesize, this.damage, true);
        };
    }
});

//子弹DATA
function LiquidDriverBulletData(){
    const LiquidDriverBulletData = {
        from: null,
        to: null,
        liquidType: null,
        liquidAmount: 0,
        init(){
            this.liquidType = null;
            this.liquidAmount = 0;
        },
        reset(){
            this.from = null;
            this.to = null;
            this.liquidType = null;
        }
    };
    return LiquidDriverBulletData;
};

//质驱部分
var liquidRegion, topRegion;
const LiquidMassDriver = extend(MassDriver, "液体质驱", {
    receiveEffect: Fx.hitLiquid,
    group: BlockGroup.liquids,
    knockback: 1.5,
    minDistribute: 400,
    hasLiquids: true,
    outputsLiquid: true,
    hasItems: false,
    noUpdateDisabled: false,
    load(){
        this.super$load();
        liquidRegion = Core.atlas.find(this.name + "-liquid");
        topRegion = Core.atlas.find(this.name + "-top");
    },
    setBars(){
        this.super$setBars();
        this.removeBar("items");
    },
    drawPlanRegion(plan, list){
        this.super$drawPlanRegion(plan, list);
        Draw.color(Color.white);
        Draw.rect(topRegion, plan.drawx(), plan.drawy());
        Draw.reset();
    }
});

LiquidMassDriver.buildType = (() => {
    return extend(MassDriver.MassDriverBuild, LiquidMassDriver, {
//关键逻辑更改
        created(){
            this.super$created();
            this.waitingShooter = -1; //POS
        },
        liquidLinkValid(){
            if(this.link == -1) return false;
            var other = Vars.world.build(this.link);
            return other != null && other.isValid() && other.block == this.block && other.team == this.team && this.within(other, this.block.range);
        },
        liquidShooterValid(){
            if(this.waitingShooter == -1) return false;
            var other = Vars.world.build(this.waitingShooter);
            return other != null && other.isValid() && other.efficiency > 0 && other.block == this.block && other.team == this.team && other.link == this.pos() && this.within(other, this.block.range);
        },
        setShooter(shooter){
            if(shooter == null){
                this.waitingShooter = -1;
            }
            else{
                this.waitingShooter = shooter.pos();
            }      
        },
//点击,需要客户端的配置同步
        onConfigureBuildTapped(other){
            if(this == other){
                if(this.link == -1){
                    Vars.control.input.config.hideConfig();
                }
                else{
                    this.configure(-1);
                }
                return false;
            }
            else if(this.link == other.pos()){
                this.configure(-1);
                return false;
            }
            else if(this.block == other.block && other.dst(this.tile) <= this.block.range && this.team == other.team && this.liquidShooterValid() == false && other.liquidShooterValid() == false && other.liquidLinkValid() == false){
                //只能连接没有任何其他连接的质驱，并且自己没有被连接
                this.configure(other.pos());
                return false;
            }

            return true;
        },
        configured(builder, value){
            if(builder != null && builder.isPlayer()){
                this.updateLastAccess(builder.getPlayer());
            }

            if(value == -1){
                let oth = Vars.world.build(this.link);
                if(oth != null) oth.setShooter(null);
                this.link = -1;
            }
            //POS返回坐标的BUG
            else if(typeof value === 'object' && value.x !== undefined && value.y !== undefined){
                // 如果是坐标对象，尝试从坐标获取建筑
                let oth = Vars.world.tileWorld(value.x, value.y);
                if(oth != null && oth.build != null){
                    oth.setShooter(this);
                    this.link = oth.pos();
                }
            }
            //
            else{
                let oth = Vars.world.build(value);
                if(oth != null) oth.setShooter(this);
                this.link = value;
            }
        },
        drawConfigure(){
            var sin = Mathf.absin(Time.time, 6, 1);

            Draw.color(Pal.accent);
            Lines.stroke(1);
            Drawf.circles(this.x, this.y, (this.block.size / 2 + 1) * Vars.tilesize + sin - 2, Pal.accent);

            if(this.liquidLinkValid()){
                var shooter = Vars.world.build(this.link);
                Drawf.circles(shooter.x, shooter.y, (shooter.block.size / 2 + 1) * Vars.tilesize + sin - 2, Pal.place);
                Drawf.arrow(this.x, this.y, shooter.x, shooter.y, (this.block.size / 2 + 1) * Vars.tilesize + sin, 4 + sin, Pal.accent);
            }

            Drawf.dashCircle(this.x, this.y, this.block.range, Pal.accent);
        },
//其他逻辑
        acceptItem(source, item){
            return false;
        },
        acceptLiquid(source, liquid){
            return this.liquidLinkValid() && this.state == MassDriver.DriverState.shooting && !liquid.gas && (this.liquids.current() == null || (this.liquids.current() == liquid && this.liquids.currentAmount() < this.block.liquidCapacity) || this.liquids.currentAmount() < this.block.minDistribute);
        },
        canDumpLiquid(to, liquid){
            return !(this.liquidLinkValid());
        },
        draw(){
            this.super$draw();

            if(this.liquids.current() != null){
                let color = Color.valueOf("000000FF").cpy().lerp(this.liquids.current().color, this.liquids.currentAmount() / this.block.liquidCapacity);
                Draw.color(color);
                Draw.rect(liquidRegion,
                this.x + Angles.trnsx(this.rotation + 180, this.reloadCounter * this.block.knockback),
                this.y + Angles.trnsy(this.rotation + 180, this.reloadCounter * this.block.knockback), this.rotation - 90);
            };

            Draw.color(Color.white);

            Draw.rect(topRegion,
            this.x + Angles.trnsx(this.rotation + 180, this.reloadCounter * this.block.knockback),
            this.y + Angles.trnsy(this.rotation + 180, this.reloadCounter * this.block.knockback), this.rotation - 90);
        },
        updateTile(){
            var link = Vars.world.build(this.link);
            var hasLink = this.liquidLinkValid();
            var shooter = Vars.world.build(this.waitingShooter);
            var hasShooter = this.liquidShooterValid();

            if(hasLink){
                this.link = link.pos();
            }
            if(hasShooter){
                this.waitingShooter = shooter.pos();
            }
            if(this.reloadCounter > 0){
                this.reloadCounter = Mathf.clamp(this.reloadCounter - this.edelta() / this.block.reload);
            }
            
            //初始空闲，检查是否转变
            if(this.state == MassDriver.DriverState.idle){
                if(hasShooter){
                    this.state = MassDriver.DriverState.accepting;
                }
                else if(hasLink){
                    this.state = MassDriver.DriverState.shooting;
                }
            }
            //接受
            if(this.state == MassDriver.DriverState.accepting){
                if(!hasShooter){
                    this.setShooter(null);
                    this.state = MassDriver.DriverState.idle;
                    return;
                }
                var shooterRotation = this.angleTo(shooter);
                this.rotation = Angles.moveToward(this.rotation, shooterRotation, this.block.rotateSpeed * this.efficiency);
            }

            //空闲/接受时倒出液体
            if(this.state == MassDriver.DriverState.idle || this.state == MassDriver.DriverState.accepting){
                this.dumpLiquid(this.liquids.current(), 1);
            }

            if(this.efficiency <= 0){ //没电直接RETURN
                return;
            }

            //发射
            if(this.state == MassDriver.DriverState.shooting){
                if(!hasLink){
                    this.link = -1;
                    this.state = MassDriver.DriverState.idle;
                    return;
                }
                //先转向再判断是否可以发射
                var targetRotation = this.angleTo(link);
                this.rotation = Angles.moveToward(this.rotation, targetRotation, this.block.rotateSpeed * this.efficiency);

                if(this.liquidLinkValid() && this.liquids.current() != null && this.liquids.currentAmount() >= this.block.minDistribute &&  // 连接有效，液体不为空，发射量足够
                (link.liquids.current() == null || (link.liquids.current() == this.liquids.current() && link.block.liquidCapacity - link.liquids.currentAmount() >= this.block.minDistribute) || (link.liquids.currentAmount() < 1))){  // 目标的液体为空/相且有容量接纳/不同但量足够少(少于1)
                    var other = link;

                    if(this.reloadCounter <= 0.0001){
                        
                        if(other.state == MassDriver.DriverState.accepting &&
                        Angles.near(this.rotation, targetRotation, 2) && 
                        Angles.near(other.rotation, targetRotation + 180, 2)){
                            this.fireLiquid(other);
                            const timeToArrive = Math.min(this.block.bulletLifetime, this.dst(other) / this.block.bulletSpeed);
                            Time.run(timeToArrive, () => {
                                other.state = MassDriver.DriverState.idle;
                            });
                            this.state = MassDriver.DriverState.idle;
                        }
                    }
                }
            }
        },
        fireLiquid(target){
            this.reloadCounter = 1;

            var data = LiquidDriverBulletData();
                data.from = this;
                data.to = target;

            let maxTransfer = Math.min(this.liquids.currentAmount(), target.block.liquidCapacity - target.liquids.currentAmount());
            data.liquidAmount = maxTransfer;
            this.liquids.remove(this.liquids.current(), maxTransfer);
            data.liquidType = this.liquids.current();

            let angle = this.tile.angleTo(target);

            LiquidMassDriverBolt.create(this, this.team,
            this.x + Angles.trnsx(angle, this.block.translation), this.y + Angles.trnsy(angle, this.block.translation),
            angle, -1, this.block.bulletSpeed, this.block.bulletLifetime, data);

            this.block.shootEffect.at(this.x + Angles.trnsx(angle, this.block.translation), this.y + Angles.trnsy(angle, this.block.translation), angle);
            this.block.smokeEffect.at(this.x + Angles.trnsx(angle, this.block.translation), this.y + Angles.trnsy(angle, this.block.translation), angle);
            Effect.shake(this.block.shake, this.block.shake, this);
            this.block.shootSound.at(this.tile, Mathf.random(0.9, 1.1));
        },
        handleLiquidPayload(bullet, data){
            this.liquids.add(data.liquidType, data.liquidAmount);
            data.liquidAmount = 0;
            if(this.liquids.current() !=null && this.liquids.currentAmount() >= 1.5 * this.block.liquidCapacity){
                var RM = this.liquids.currentAmount() - 1.5 * this.block.liquidCapacity;
                this.liquids.remove(this.liquids.current(), RM);  //超额接收液体时最多接收1.5倍容量
            }
            
            Effect.shake(this.block.shake, this.block.shake, this);
            this.block.receiveEffect.at(bullet);

            this.reloadCounter = 1;
            bullet.remove();
        },
        write(write){
            this.super$write(write);
            write.i(this.waitingShooter);
        },
        read(read, revision){
            this.super$read(read, revision);
            this.waitingShooter = read.i();
        }
    })
});

exports.液体质驱 = LiquidMassDriver;
