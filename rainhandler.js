import VPObject from "./Libraries/NLib/NViewport/vp_object.js";
import NPoint from "./Libraries/NLib/npoint.js";
import NColor from "./Libraries/NLib/ncolor.js";
import {
    lerp,
    clamp
} from "./Libraries/NLib/nmath.js";

// wrap with RainParticleHandler because VPObjects have a lot of overhead
class Raindrop {
    constructor(handler) {
        /**
         * modes
         * 1 : falling
         * 2 : riding edge
         * 3 : bursting
         */
        this.color;
        this.age = 0;
        this.position = NPoint.ZERO;
        this.velocity = NPoint.ZERO;
        this.maxVelocity;
    }
}


export default class RainParticleHandler extends VPObject {
    constructor(viewport, {
        spawnDelay = 0.02,
        spawnCount = 2,
    } = {}) {
        super(viewport, {
            zOrder: -65536,
            mouseListening: true,
            tickable: true,
        });

        this.spawnDelay = spawnDelay;
        this.spawnCount = spawnCount;
        this.drops = new Set();
        this.maxDrops = 0;
        this.gravity = new NPoint(0, 2000);
        this.spawnDelayCounter = 0;

        this.maxDropAge = 3;
        this.dropTrailFactor = 0.1;

        this.minColor = NColor.fromHex("#83b0d4");
        this.maxColor = NColor.fromHex("#4a779b");
        this.audioPlayThreshold = 0.1;
        this.audioPlayCounter = 0;

        const gradOffset = 50;
        this.circleGradient = this._vp._ctx.createLinearGradient(
            0, this._vp._activeAreaCorners[2].y + gradOffset,
            0, this._vp._activeAreaCorners[0].y + gradOffset
        );
        this.circleGradient.addColorStop(0, "#05060D");
        this.circleGradient.addColorStop(1, "#132431");

        this.balls = [{
            position: NPoint.ZERO
        }];
    }

    intersects(point, isInBounds) {
        return true;
    }

    onClicked(mouseClickEvent) {
        super.onClicked(mouseClickEvent);
        this.balls.push({
            position: this._vp._pointerPos,
            velocity: NPoint.ZERO,
            size: 50,
        });
    }

    onTick(deltaT, tickMultiplier, overflow) {
        this.audioPlayCounter += deltaT;

        if (this.maxDrops <= 0 || this.drops.size < this.maxDrops) {
            this.spawnDelayCounter += deltaT;
            if (this.spawnDelayCounter >= this.spawnDelay) {
                this.spawnDelayCounter = 0;

                let q = this.spawnCount;
                if (this.maxDrops > 0) {
                    q = Math.min(this.spawnCount, this.maxDrops - this.drops.size);
                }

                for (let i = 0; i < q; i++) {
                    const drop = new Raindrop();
                    this.drops.add(drop);

                    drop.position = NPoint.lerp(
                        this._vp._activeAreaCorners[2],
                        this._vp._activeAreaCorners[3],
                        Math.random()
                    );

                    const closeness = Math.random();

                    drop.velocity = new NPoint(0, lerp(800, 1600, closeness)).rotate((Math.random() - 0.5) * 0.3);
                    drop.maxVelocity = 1500;
                    // drop.color = NColor.lerp(this.minColor, this.maxColor, Math.random()).toHex();
                    drop.color = this.minColor.setAlpha(closeness).toHex();
                }
            }
        }

        this.balls[0] = {
            position: this._vp._pointerPos,
            velocity: this._vp._pointerPos.subtractp(this.balls[0].position),
            size: 50,
        };
        for (const drop of this.drops) {
            if (!this._vp.isInBounds(drop.position, drop.velocity.length() * this.dropTrailFactor)) {
                this.killDrop(drop);
            }

            drop.age += deltaT;
            if (this.maxDropAge > 0 && drop.age > this.maxDropAge) {
                this.killDrop(drop);
            }

            drop.position = drop.position.addp(drop.velocity.multiply1(deltaT));

            drop.velocity = drop.velocity.addp(this.gravity.multiply1(deltaT));

            for (const ball of this.balls) {
                const ballPos = ball.position;
                const size = ball.size;

                const diff = drop.position.subtractp(ballPos);
                const dist = diff.length();
                
                // check if drop is aiming towards the cursor
                if (dist <= size) {
                    // drop.velocity = drop.velocity.addp(ball.velocity.multiply1(50));
                    const vDist = drop.position.addp(drop.velocity.multiply1(deltaT)).subtractp(ballPos.addp(ball.velocity)).length();
                    if (vDist < dist) {
                        const normal = diff.divide1(dist);
                        drop.position = ballPos.addp(normal.multiply1(size));
                        if (drop.velocity.project(normal).length() > size) {
                            drop.velocity = drop.velocity.reflect(normal).multiply1(0.2);
                            // if(this.audioPlayCounter >= this.audioPlayThreshold){
                            //     const audio = new Audio("./Assets/plunk2.mp3");
                            //     audio.play();
                            //     this.audioPlayCounter = 0;
                            // }
                        } else {
                            drop.velocity = drop.velocity.reject(normal);
                        }
                    }
                }
            }

            // clamp veloicty to max
            let mag = drop.velocity.length();
            drop.velocity = drop.velocity.divide1(mag).multiply1(Math.min(mag, drop.maxVelocity));
        }

        this._vp.queueRedraw();
    }

    killDrop(drop) {
        this.drops.delete(drop);
    }

    draw(ctx) {
        ctx.lineCap = "round";
        for (const drop of this.drops) {
            const x = drop.position.x;
            const y = drop.position.y;
            const tail = drop.position.subtractp(drop.velocity.multiply1(this.dropTrailFactor))

            const grad = ctx.createLinearGradient(0, y, 0, tail.y);
            grad.addColorStop(0, drop.color);
            grad.addColorStop(1, "#83b0d400");
            ctx.strokeStyle = grad;
            ctx.lineWidth = 2;

            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(tail.x, tail.y);
            ctx.stroke();
        }

        ctx.fillStyle = this.circleGradient;
        for (const ball of this.balls) {
            const ballPos = ball.position;
            const size = ball.size;
            ctx.beginPath();
            ctx.ellipse(
                ~~ballPos.x, ~~ballPos.y,
                size - 2, size - 2,
                0,
                0, 2 * Math.PI);
            ctx.fill();
        }
    }
}