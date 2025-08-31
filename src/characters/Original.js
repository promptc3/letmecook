export default class Original extends Phaser.Physics.Matter.Sprite {
    constructor(scene, x, y, texture, name) {
        super(scene.matter.world, x, y, texture);
        scene.add.existing(this);
        this.name = name;
        this.hunger = 1000;
        this.satiationConstant = 5;
        this.rateOfSpawn = 0.1; // rate at which wrath spawns 0.1 means 1 in 10 seconds
    }
    // store liked recipes and likeness for it in json
    // hunger is satiated proportional to likeness of recipe
    // there's a proportional constant for the recipe called satiation constant
    // hunger satitated = satiation constant * likeness
    // maybe in future satiation can be increase through certain items 
}