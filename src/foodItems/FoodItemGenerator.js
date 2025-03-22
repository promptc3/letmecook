import FoodItem from './FoodItem.js';
export default class FoodItemGenerator {
    constructor(scene, texture, mapWidth, mapHeight) {
        this.mapWidth = mapWidth || 500;
        this.mapHeight = mapHeight || 500;
        this.scene = scene;
        this.texture = texture;
    }

    generateStaticFood(count = 50) {
        const foodGroup = []
        const ings = ["Tomato", "Garlic", "Ginger", "Green Chilli", "Potato", "Egg", "Onion", "Chicken"]; 
        for(let i=0; i < count; i++) {
            const random = Math.floor(Math.random() * ings.length);
            const x = Phaser.Math.Between(0, this.mapWidth);
            const y = Phaser.Math.Between(0, this.mapHeight);
            const foodItem = new FoodItem(this.scene, x, y, this.texture, `${ings[random]}`, 'static');
            foodGroup.push(foodItem);
        }
        return foodGroup;
    }
}