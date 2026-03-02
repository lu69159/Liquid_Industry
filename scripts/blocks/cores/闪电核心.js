let range = 12;
let powerout = 200;
const coreP = extend(PowerTurret, "闪电核心P", {});
const core = extend(CoreBlock, "闪电核心", {
    setStats() {
        this.super$setStats();
        this.stats.add(Stat.basePowerGeneration, powerout, StatUnit.powerSecond);
    },
    setBars() {
        this.super$setBars();
        this.addBar("power", func((entity) => new Bar(
            prov(() => Core.bundle.format("bar.poweroutput", Strings.fixed(entity.getPowerProduction() * 60, 1))),
            prov(() => Pal.powerBar),
            floatp(() => 1)
        )));
    },
    drawPlace(x, y, rotation, valid) {
        this.super$drawPlace(x, y, rotation, valid);
        Drawf.dashCircle(x * 8 + this.offset, y * 8 + this.offset, range * 8, Pal.accent);
    }
});

core.buildType = prov(() => {
    const p = new BuildPayload(coreP, Team.derelict); //这里写炮塔
    return new JavaAdapter(CoreBlock.CoreBuild, {
        getPowerProduction() {
            return powerout / 60;
        },
        updateTile() {
            this.super$updateTile();
            if (p.build.team != this.team) {
                p.build.team = this.team;
            }
            p.update(null, this);
            p.set(this.x, this.y, p.build.payloadRotation);
        },
        drawSelect() {
            this.super$drawSelect();
            Drawf.dashCircle(this.x, this.y, range * 8, Pal.accent); //点击时显示的虚线圆
        }
    }, core);
});

exports.SDcore = core;