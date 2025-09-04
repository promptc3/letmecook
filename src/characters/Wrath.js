export default class Wrath extends Phaser.Physics.Matter.Sprite {
    constructor(scene, x, y, texture, name) {
        super(scene.matter.world, x, y, texture);
        scene.add.existing(this);
        this.name = name;
        this.setAngularVelocity(0);
        this.setFixedRotation(true);
    }

    getId() {
        return this.name;
    }

    getName() {
        return this.name;
    }

    // update() {
    //     // get player position
    //     const player = this.scene.player;
    //     if (!player) return;
    //     // calculate direction vector to player
    //     const direction = new Phaser.Math.Vector2(player.x - this.x, player.y - this.y);
    //     const distance = direction.length();
    //     // normalize direction vector
    //     direction.normalize();
    //     // set speed based on distance (closer = slower, farther = faster)
    //     const speed = Phaser.Math.Clamp(distance / 100, 1, 3);  
    //     // set velocity towards player
    //     this.setVelocity(direction.x * speed, direction.y * speed);
    // }
}