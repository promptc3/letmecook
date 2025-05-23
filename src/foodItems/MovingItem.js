import FoodItem from "./FoodItem";

export default class MovingItem extends FoodItem {
    constructor(scene, x, y, texture, name, type = "dynamic") {
        super(scene, x, y, texture, "chicken", "dynamic");
        scene.add.existing(this);
        this.currentDirection = 1;
        this.type = type;
        this.name = name;
        this.scene = scene;
        if (name === "chicken") {
            this.setupChickenAnimations(scene);
        }
        this.state = "idle";
        if (type === "dynamic" && name === "chicken") {
            this.walkTimer = scene.time.addEvent({
                delay: 8000, // Adjust to match step timing
                callback: this.startWalking,
                callbackScope: this,
                loop: true,
            });
        }
        this.startWalkAt = 0;
        this.idleDuration = 3000;
        this.tired = false;
        this.running = false;
        this.walkingSpeed = 18;
        this.runningSpeed = 30;
        this.restTime = 0;
        const zoneSize = 50;
        this.dangerZone = scene.add.zone(x, y).setSize(zoneSize * 2, zoneSize * 2);
        // scene.matter.world.enable(this.dangerZone);
        this.playerInZone = false;
    }
    startWalking() {
        this.startWalkAt = this.scene.time.now;
        this.changeDirection();
        this.playerInZone = false;
    }
    setupDangerZoneOverlap(player) {
        // this.scene.matter.add.overlap(
        //     this.dangerZone, player, this.checkOverlapWithPlayer, null, this
        // )
    }
    checkOverlapWithPlayer(player, zone) {
        if (this.playerInZone) return;
        const playerAngle = Math.atan2(player.x, player.y);
        this.playerInZone = true;
        this.currentDirection = playerAngle + Phaser.Math.FloatBetween(-Math.PI / 3, Math.PI / 3);
    }
    setupChickenAnimations(scene) {
        const repeat = -1;
        scene.anims.create({
            key: 'chicken_idle',
            frames: scene.anims.generateFrameNumbers('chicken', { start: 0, end: 1 }),
            frameRate: 2,
            repeat: repeat
        });
        scene.anims.create({
            key: 'chicken_walking',
            frames: scene.anims.generateFrameNumbers('chicken', { start: 4, end: 7 }),
            frameRate: 4,
            repeat: repeat
        });
        this.anims.play('chicken_idle', true);
    }
    changeDirection() {
        if (!this.isPickedUp && this.name === "chicken") {
            this.currentDirection *= -1;
        }
    }
    pickup() {
        if (!this.isPickedUp) {
            const particleZone = new Phaser.Geom.Rectangle(0, 0, 16, 40);
            this.particles = this.scene.add.particles(
                this.x - 8,
                this.y - 20,
                "starParticle",
                {
                lifespan: 600,
                scale: { start: 0.5, end: 0 },
                alpha: { start: 1, end: 0 },
                speed: { min: 20, max: 50 },
                quantity: 10,
                frequency: 50,
                emitZone: {
                    type: "random",
                    source: particleZone,
                },
                blendMode: "SCREEN",
                }
            );
            this.scene.tweens.add({
                targets: this,
                scale: { from: 1, to: 0.3 },
                alpha: 0,
                duration: 1100,
                ease: "Back.easeOut",
                onComplete: () => {
                    this.isPickedUp = true;
                    this.body.enable = false;
                    this.setVisible(false);   
                    console.log(`${this.name} has been picked up by player`);
                    this.dangerZone.destroy();
                    if (this.walkTimer) {
                        this.walkTimer.remove();
                    }
                },
            });
            return true;
        }
        return false;
    }
    update(time, delta) {
        if (this.isPickedUp) return;
        const deltaSec = delta/1000;
        this.dangerZone.x = this.x;
        this.dangerZone.y = this.y;
        if (this.playerInZone) {
            if (!this.tired) {
                this.runningTime += deltaSec;
                if (this.runningTime > 4) {
                    this.tired = true;
                    this.restTime = 0;
                    this.anims.play("chicken_idle", true);
                }
            } else {
                this.restTime += deltaSec;
                if (this.restTime > 2) {
                    this.tired = false;
                    this.anims.play("chicken_walking", true);
                }
            }
            this.anims.play("chicken_walking", true);

            const currentSpeed = this.tired ? this.walkingSpeed : this.runningSpeed;

            // Run away from player
            this.setVelocity(
                Math.cos(this.currentDirection) * currentSpeed,
                Math.sin(this.currentDirection) * currentSpeed 
            );
        } else {
            this.runningTime = 0;
            this.tired = false;

            if (this.scene.time.now - this.startWalkAt > this.idleDuration) {
                this.anims.play("chicken_walking", true);
                this.body.velocity.x = this.currentDirection * 18;
            } else {
                this.setVelocity(0);
                this.anims.play("chicken_idle", true);
            }
        }
        if (!this.flipX && this.body.velocity.x < 0) {
            this.setFlipX(true);
        } else if (this.flipX && this.body.velocity.x > 0) {
            this.setFlipX(false);
        }
    }
}