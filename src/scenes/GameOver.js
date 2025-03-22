export class GameOver extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOver'});
    }
    
    init(data) {
        // Get data passed from the game scene
        this.score = data.score || 0;
    }

    preload() {
        // Load assets for game over screen
        this.load.image('game-over-bg', '../assets/space.png');
        this.load.image('retry-button', '../assets/retry-button.png');
    }

    create() {
        // Add background
        this.add.image(400, 300, 'game-over-bg');
        
        // Add game over text
        this.add.text(400, 150, 'GAME OVER', {
            fontFamily: 'Arial',
            fontSize: 64,
            color: '#ff0000',
            fontStyle: 'bold',
            shadow: {
                offsetX: 2,
                offsetY: 2,
                color: '#000',
                blur: 2,
                stroke: true,
                fill: true
            }
        }).setOrigin(0.5);
        
        // Display final score
        this.add.text(400, 250, `SCORE: ${this.score}`, {
            fontFamily: 'Arial',
            fontSize: 32,
            color: '#ffffff'
        }).setOrigin(0.5);
        
        // Add retry button
        const retryButton = this.add.image(500, 350, 'retry-button')
            .setInteractive({ useHandCursor: true })
            .on('pointerover', () => retryButton.setScale(1.0))
            .on('pointerout', () => retryButton.setScale(0.9))
            .on('pointerdown', () => this.retryGame());
    }
    
    retryGame() {
        // Restart the game scene
        this.cameras.main.fadeOut(500, 0, 0, 0);
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
            this.scene.start('Game');
        });
    }
}
