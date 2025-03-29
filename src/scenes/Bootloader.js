export class Bootloader extends Phaser.Scene {
  constructor() {
    super({ key: "Bootloader" });
  }

  preload() {
    this.createProgressBar();
    this.setLoadEvents();
    this.loadImages();
    this.loadSounds();
  }

  setLoadEvents() {
    this.load.on("progress", (value) => {
        this.progressBar.clear();
        this.progressBar.fillStyle(0x0088fa, 1);
        this.progressBar.fillRect(
            this.cameras.main.width/4,
            this.cameras.main.height/2 - 16, 
            (this.cameras.main.width/2) * value, 20);
    }, this);
    this.load.on("complete", () => {
        this.scene.start("Start");
    });
  }

  loadImages() {
    this.load.image('background', './../assets/space.png');
    this.load.image('start-button', './../assets/start-button.png');
    this.load.image('player', './../assets/circle-orange.png');
    this.load.image('dash-pickup', './../assets/hexagon-blue.png');
    this.load.image('rabbit', './../assets/hexagon-gray.png');
    this.load.tilemapTiledJSON('map', './../assets/sproutMap.tmj');
    this.load.image('tiles', './../assets/Tilesets/Grass.png');
    this.load.image('biomTiles', './../assets/Objects/Basic_Grass_Biom_things.png');
    const vegetables = ["vegetable_bellpepper_green", "vegetable_carrot", "vegetable_corn", "vegetable_cucumber", "vegetable_eggplant", "vegetable_onion", "vegetable_potato", "vegetable_tomato", "vegetable_garlic", "vegetable_ginger", "vegetable_bellpepper_red","vegetable_bellpepper_yellow", "vegetable_pumpkin"];
    vegetables.forEach(item => {
        this.load.image(item, `./../assets/food/${item}.png`);
    });
    const fruits = ["fruit_apple", "fruit_banana", "fruit_cherry", "fruit_greengrape", "fruit_kiwi", "fruit_lemon", "fruit_lime", "fruit_orange", "fruit_peach", "fruit_strawberry", "fruit_watermelon"];
    fruits.forEach(item => {
        this.load.image(item, `./../assets/food/${item}.png`);
    });
  }

  loadSounds() {
    this.load.audio('pick', './../assets/sounds/pick.ogg');
    this.load.audio('drop', './../assets/sounds/drop.ogg');
  }
  createProgressBar() {
    this.loadBar = this.add.graphics();
    this.loadBar.fillStyle(0x808080, 1);
    this.loadBar.fillRect(
        this.cameras.main.width/4 - 2,
        this.cameras.main.height/2 - 20,
        this.cameras.main.width/2 + 4,
        24);
    this.progressBar = this.add.graphics();
  }
}