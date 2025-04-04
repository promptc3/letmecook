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
    this.load.image('dash-pickup', './../assets/food/soda_coke.png');
    this.load.image('rabbit', './../assets/hexagon-gray.png');
    this.load.tilemapTiledJSON('map', './../assets/sproutMap.tmj');
    this.load.image('tiles', './../assets/Tilesets/Grass.png');
    this.load.image('biomTiles', './../assets/objects/Basic_Grass_Biom_things.png');
    this.load.image('retry-button', '../assets/retry-button.png');
    const vegetables = ["vegetable_bellpepper_green", "vegetable_carrot", "vegetable_corn", "vegetable_cucumber", "vegetable_eggplant", "vegetable_onion", "vegetable_potato", "vegetable_tomato", "vegetable_garlic", "vegetable_ginger", "vegetable_bellpepper_red","vegetable_bellpepper_yellow", "vegetable_pumpkin"];
    vegetables.forEach(item => {
        this.load.image(item, `./../assets/food/${item}.png`);
    });
    const fruits = ["fruit_apple", "fruit_banana", "fruit_cherry", "fruit_greengrape", "fruit_kiwi", "fruit_lemon", "fruit_lime", "fruit_orange", "fruit_peach", "fruit_strawberry", "fruit_watermelon"];
    fruits.forEach(item => {
        this.load.image(item, `./../assets/food/${item}.png`);
    });
    this.load.spritesheet('orange_player_idle', './../assets/characters/Orange/orange_8direction_standing-Sheet.png', {
      frameWidth: 32,
      frameHeight: 48
    });
    this.load.spritesheet('orange_walk_e', './../assets/characters/Orange/orange_walk_EAST-Sheet.png', {
      frameWidth: 32,
      frameHeight: 48
    });
    this.load.spritesheet('orange_walk_ne', './../assets/characters/Orange/orange_walk_NORTH-EAST-Sheet.png', {
      frameWidth: 32,
      frameHeight: 48
    });
    this.load.spritesheet('orange_walk_n', './../assets/characters/Orange/orange_walk_NORTH-Sheet.png', {
      frameWidth: 32,
      frameHeight: 48
    });
    this.load.spritesheet('orange_walk_nw', './../assets/characters/Orange/orange_walk_NORTH-WEST-Sheet.png', {
      frameWidth: 32,
      frameHeight: 48
    });
    this.load.spritesheet('orange_walk_se', './../assets/characters/Orange/orange_walk_SOUTH-EAST-Sheet.png', {
      frameWidth: 32,
      frameHeight: 48
    });
    this.load.spritesheet('orange_walk_s', './../assets/characters/Orange/orange_walk_SOUTH-Sheet.png', {
      frameWidth: 32,
      frameHeight: 48
    });
    this.load.spritesheet('orange_walk_sw', './../assets/characters/Orange/orange_walk_SOUTH-WEST-Sheet.png', {
      frameWidth: 32,
      frameHeight: 48
    });
    this.load.spritesheet('orange_walk_w', './../assets/characters/Orange/orange_walk_WEST-Sheet.png', {
      frameWidth: 32,
      frameHeight: 48
    });
  }

  loadSounds() {
    this.load.audio('pick', './../assets/sounds/pick.ogg');
    this.load.audio('drop', './../assets/sounds/drop.ogg');
    this.load.audio('footstep1', './../assets/sounds/footstep_1.ogg');
    this.load.audio('footstep2', './../assets/sounds/footstep_2.ogg');
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