const config = {
  type: Phaser.AUTO,
  width: 960,
  height: 540,
  parent: "game",
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 1200 },
      debug: false
    }
  },
  scene: {
    preload,
    create,
    update
  }
};

const game = new Phaser.Game(config);

let player;
let cursors;
let keys;
let platforms;

function preload() {
  this.load.image("bg", "assets/bangkok_bg.jpg");
  this.load.image("ground", "assets/platform.png");
  this.load.image("gordoso", "assets/gordoso.png");
}

function create() {
  // Fondo
  this.add.image(480, 270, "bg").setScale(0.5);

  // Plataformas
  platforms = this.physics.add.staticGroup();

  platforms.create(480, 520, "ground").setScale(2).refreshBody();
  platforms.create(600, 400, "ground");
  platforms.create(200, 320, "ground");
  platforms.create(750, 260, "ground");

  // Jugador
  player = this.physics.add.sprite(100, 450, "gordoso");
  player.setScale(0.25);
  player.setCollideWorldBounds(true);

  // Colisiones
  this.physics.add.collider(player, platforms);

  // Controles
  cursors = this.input.keyboard.createCursorKeys();
  keys = this.input.keyboard.addKeys({
    A: Phaser.Input.Keyboard.KeyCodes.A,
    D: Phaser.Input.Keyboard.KeyCodes.D,
    W: Phaser.Input.Keyboard.KeyCodes.W
  });
}

function update() {
  // Movimiento horizontal
  if (keys.A.isDown) {
    player.setVelocityX(-220);
  } else if (keys.D.isDown) {
    player.setVelocityX(220);
  } else {
    player.setVelocityX(0);
  }

  // Salto
  if (
    (cursors.space.isDown || keys.W.isDown) &&
    player.body.blocked.down
  ) {
    player.setVelocityY(-520);
  }
}
