import FoodItem from './FoodItem.js';
export default class FoodItemGenerator {
    constructor(scene, mapWidth, mapHeight) {
        this.mapWidth = mapWidth || 500;
        this.mapHeight = mapHeight || 500;
        this.scene = scene;
    }

    generateStaticFood(count = 50, recipe) {
        const foodGroup = []
        const vegetables = recipe.ingredients;
        // create min quantity of each ingredient
        vegetables.forEach(ing => {
            const x = Phaser.Math.Between(0, this.mapWidth);
            const y = Phaser.Math.Between(0, this.mapHeight);
            for (let i = 0; i < ing.quantity; i++) {
                const foodItem = new FoodItem(this.scene, x, y, ing.texture, ing.name, 'static');
                foodGroup.push(foodItem);
            }
        });
        // add random quantity of random ingredients
        for(let i=0; i < count; i++) {
            const random = Math.floor(Math.random() * vegetables.length);
            const x = Phaser.Math.Between(0, this.mapWidth);
            const y = Phaser.Math.Between(0, this.mapHeight);
            const foodItem = new FoodItem(this.scene, x, y, vegetables[random].texture, vegetables[random].name, 'static');
            foodGroup.push(foodItem);
        }
        return foodGroup;
    }
}