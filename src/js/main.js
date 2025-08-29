import Phaser from 'phaser';
import { Bootloader } from '../scenes/Bootloader.js';
import { Start } from '../scenes/Start.js';
import { Game } from '../scenes/Game.js';
import { GameOver } from '../scenes/GameOver.js';
import { UIScene } from  '../scenes/UIScene.js';
import { CookingOptions } from '../scenes/CookingOptions.js';
import PhaserMatterCollisionPlugin from "phaser-matter-collision-plugin";
// Prevent right click menu from showing because it is annoying
document.addEventListener('contextmenu', event => event.preventDefault());
const config = {
    type: Phaser.AUTO,
    title: 'LetHimCook',
    parent: 'game-container',
    width: window.innerWidth * window.devicePixelRatio,
    height: window.innerHeight * window.devicePixelRatio,
    pixelArt: false,
    scene: [
        Bootloader, Start, Game, UIScene, CookingOptions, GameOver
    ],
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
        default: 'matter',
        matter: {
            gravity: { y: 0 },
            debug: false 
        }
    },
    plugins: {
        scene: [
        {
            plugin: PhaserMatterCollisionPlugin,
            key: "matterCollision", // Where to store in Scene.Systems, e.g. scene.sys.matterCollision
            mapping: "matterCollision", // Where to store in the Scene, e.g. scene.matterCollision
        }],
    }

}
new Phaser.Game(config);
            