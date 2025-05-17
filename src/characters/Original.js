export default class Original extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y, texture, frame, name) {
        super(scene, x, y, texture, frame);
        this.add.existing(this);
        this.name = name;
        this.hunger = 1000;
        this.satiationConstant = 5;
    }
    // store liked recipes and likeness for it in json
    // hunger is satiated proportional to likeness of recipe
    // there's a proportional constant for the recipe called satiation constant
    // hunger satitated = satiation constant * likeness
    // maybe in future satiation can be increase through certain items 

    update() {
        const { overlaps, foodItem } = checkOverlapWithFood();
        if (overlaps) {
            const hungerReduced = this.satiationConstant*getLikeness(foodItem);
            this.hunger -= hungerReduced;
            foodItem.destroy();
        }
    }

}