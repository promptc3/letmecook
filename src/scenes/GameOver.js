export class GameOver extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOver'});
    }
    
    init(data) {
        // Get data passed from the game scene
        this.score = data.score || 0;
    }

    create() {
        
        const textStart = this.cameras.main.width / 2;
        // Add game over text
        this.add.text(textStart, 150, 'GAME OVER', {
            fontFamily: 'Arial',
            fontSize: 64,
            color: '#ff0000',
            fontStyle: 'bold',
            align: 'center',
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
        this.add.text(textStart, 250, `SCORE: ${this.score}`, {
            fontFamily: 'Arial',
            fontSize: 32,
            color: '#ffffff',
            align: 'center',
        }).setOrigin(0.5);
        
        // Add retry button
        const retryButton = this.add.image(textStart, 350, 'retry-button')
            .setScale(0.4)
            .setInteractive({ useHandCursor: true })
            .on('pointerover', () => retryButton.setScale(0.6))
            .on('pointerout', () => retryButton.setScale(0.4))
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
