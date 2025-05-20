export class Start extends Phaser.Scene
{
    constructor()
    {
        super({key: 'Start'});
    }
    
    create() {
        
        const textStart = this.cameras.main.width / 2;
        // Add start button
        const startButton = this.add.image(textStart, 320, 'play-button')
            .setFrame(2)
            .setScale(2)
            .setInteractive({ useHandCursor: true })
            .on('pointerover', () => startButton.setFrame(3))
            .on('pointerout', () => startButton.setFrame(2))
            .on('pointerdown', () => this.startGame());
            
        // Add game title
        this.add.text(textStart, 100, 'LET ME COOK', {
            fontFamily: 'pixelFont',
            fontSize: 48,
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        // Add instructions
        this.add.text(textStart, 500, 'Use W,A,S,D to move, X to dash and SPACE to drop items', {
            fontFamily: 'pixelFont',
            fontSize: 16,
            color: '#ffffff'
        }).setOrigin(0.5);

    }

    startGame() {
        
        // Transition to the main game scene
        this.cameras.main.fadeOut(200, 0, 0, 0);
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
            this.scene.start('Game');
            this.scene.start('UIScene');
            this.scene.start('CookingOptions');
        });
    }

}

