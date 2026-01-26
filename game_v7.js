const WIDTH = 960;
const HEIGHT = 540;

const config = {
  type: Phaser.AUTO,
  width: WIDTH,
  height: HEIGHT,
  parent: "game",
  backgroundColor: "#000000",
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 1100 },
      debug: false // OBLIGATORIO: quita las cajas verdes
    }
  },
  scene: { preload, create, update }
};

new Phaser.Game(config);

let player, cursors, keys;
let platforms, burgers, skunks, door;
let score = 0;
let scoreText;

function preload() {
  this.load.image("bg", "assets/bangkok_bg.jpg");
  this.load.image("gordoso", "assets/gordoso.png");
  this.load.image("burger", "assets/burger.png");
  this.load.image("skunk", "assets/skunk.png");
  this.load.image("door", "assets/door.png");
  this.load.image("girl", "assets/girl.png");
  this.load.image("flag", "assets/thai_flag.png");
}

function create() {
  // Asegurar que NO quede debug residual
  this.physics.world.debugGraphic?.clear?.();
  this.physics.world.drawDebug = false;

  // Fondo: que llene la pantalla (no “postal”)
  const bg = this.add.image(WIDTH / 2, HEIGHT / 2, "bg");
  bg.setDisplaySize(WIDTH, HEIGHT);

  // Crear una textura simple para plataformas (sin archivos extra)
  const g = this.add.graphics();
  g.fillStyle(0x2b2b2b, 1);
  g.fillRect(0, 0, 220, 28);
  g.generateTexture("plat", 220, 28);
  g.destroy();

  // Plataformas (VISIBLES)
  platforms = this.physics.add.staticGroup();
  platforms.create(480, 520, "plat").setScale(5.0, 1.3).refreshBody(); // suelo
  platforms.create(260, 410, "plat").refreshBody();
  platforms.create(560, 340, "plat").refreshBody();
  platforms.create(820, 270, "plat").refreshBody();

  // Jugador (tamaño normal)
  player = this.physics.add.sprite(100, 420, "gordoso");
  player.setScale(0.18);
  player.setCollideWorldBounds(true);
  player.body.setSize(player.width * 0.6, player.height * 0.85, true);

  this.physics.add.collider(player, platforms);

  // Controles
  cursors = this.input.keyboard.createCursorKeys();
  keys = this.input.keyboard.addKeys({
    A: Phaser.Input.Keyboard.KeyCodes.A,
    D: Phaser.Input.Keyboard.KeyCodes.D,
    W: Phaser.Input.Keyboard.KeyCodes.W
  });

  // Hamburguesas (coleccionables)
  burgers = this.physics.add.group({
    key: "burger",
    repeat: 5,
    setXY: { x: 180, y: 0, stepX: 130 }
  });

  burgers.children.iterate(b => {
    b.setScale(0.12);
    b.setBounce(0.2);
    b.setCollideWorldBounds(true);
  });

  this.physics.add.collider(burgers, platforms);
  this.physics.add.overlap(player, burgers, collectBurger, null, this);

  // Zorrillos (enemigos)
  skunks = this.physics.add.group();

  const s1 = skunks.create(620, 100, "skunk");
  s1.setScale(0.16).setBounce(1).setCollideWorldBounds(true).setVelocityX(160);

  const s2 = skunks.create(420, 100, "skunk");
  s2.setScale(0.16).setBounce(1).setCollideWorldBounds(true).setVelocityX(-160);

  this.physics.add.collider(skunks, platforms);
  this.physics.add.collider(player, skunks, hitSkunk, null, this);

  // Puerta final
  door = this.physics.add.staticImage(910, 210, "door").setScale(0.18).refreshBody();
  this.physics.add.overlap(player, door, reachDoor, null, this);

  // UI
  scoreText = this.add.text(16, 16, "🍔 0", {
    fontSize: "20px",
    fill: "#ffffff",
    backgroundColor: "rgba(0,0,0,0.35)",
    padding: { x: 10, y: 6 }
  });
}

function update() {
  // izquierda/derecha
  if (keys.A.isDown) {
    player.setVelocityX(-240);
  } else if (keys.D.isDown) {
    player.setVelocityX(240);
  } else {
    player.setVelocityX(0);
  }

  // salto (solo si está tocando suelo/plataforma)
  const onGround = player.body.blocked.down || player.body.touching.down;
  if ((cursors.space.isDown || keys.W.isDown) && onGround) {
    player.setVelocityY(-560);
  }
}

function collectBurger(player, burger) {
  burger.disableBody(true, true);
  score++;
  scoreText.setText("🍔 " + score);
}

function hitSkunk() {
  this.physics.pause();
  player.setTint(0xff0000);
  this.add.text(WIDTH / 2, 90, "Te atrapó el zorrillo 😵", {
    fontSize: "32px",
    fill: "#ffffff"
  }).setOrigin(0.5);
}

function reachDoor() {
  this.physics.pause();

  this.add.rectangle(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, 0x000000, 0.55);

  this.add.image(WIDTH / 2 - 90, HEIGHT / 2 + 40, "girl").setScale(0.22);
  this.add.image(WIDTH / 2 + 120, HEIGHT / 2 + 40, "flag").setScale(0.16);

  this.add.text(WIDTH / 2, 110, "¡Rescataste a la chica! 🇹🇭", {
    fontSize: "34px",
    fill: "#ffffff"
  }).setOrigin(0.5);

  this.add.text(WIDTH / 2, 160, `Hamburguesas: ${score}`, {
    fontSize: "22px",
    fill: "#ffffff"
  }).setOrigin(0.5);
}
