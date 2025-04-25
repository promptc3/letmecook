import * as recipeBookJson from './recipes.json';
export default class BasicUtensil extends Phaser.GameObjects.Sprite {
   constructor(scene, x, y, texture, frame, name) {
        super(scene, x, y, texture, frame);
        this.add.existing(this);
        const { recipeBook } = recipeBookJson;
        this.recipes = recipeBook.find(r => r.utensil === name);
        
    }

    cook(rawIngrs) {
        if (rawIngrs === undefined) return;
        const keyStr = rawIngrs.map(r => `${i.name}-${i.quantity}`).join('|');
        const cookedItem = this.recipes.find(r => r.ingredientKey === keyStr);
        return cookedItem;
    }
}