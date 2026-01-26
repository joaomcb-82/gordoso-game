console.log("✅ CARGÓ game_v7.js");

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
    arcade: { gravity: { y: 1200 }, debug: false }
  },
  scene: { preload, create, update }
};

new Phaser.Game(config);

let player, cursors, keys;
let platforms, burgers, skunks, door;
let score = 0, scoreText;
let ended = false;

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
  // Fondo full screen
  const bg = this.add.image(WIDTH / 2, HEIGHT / 2, "bg");
  bg.setDisplaySize(WIDTH, HEIGHT);

  // Textura de plataforma (no necesitas platform.png)
  const g = this.add.graphics();
  g.fillStyle(0x2e2e2e, 1);
  g.fillRoundedRect(0, 0, 240, 28, 10);
  g.lineStyle(3, 0x151515, 1);
  g.strokeRoundedRect(0, 0, 240, 28, 10);
  g.generateTexture("plat", 240, 28);
  g.destroy();

  platforms = this.physics.add.staticGroup();
  platforms.create(WIDTH / 2, 520, "plat").setScale(5.2, 1.5).refreshBody(); // suelo
  platforms.create(260, 410, "plat").refreshBody();
  platforms.create(560, 330, "plat").refreshBody();
  platforms.create(820, 250, "plat").refreshBody();

  player = this.physics.add.sprite(90, 420, "gordoso");
  player.setScale(0.17);
  player.setCollideWorldBounds(true);

  player.body.setSize(
    Math.max(10, player.width * 0.55),
    Math.max(10, player.height * 0.82),
    true
  );

  this.physics.add.collider(player, platforms);

  cursors = this.input.keyboard.createCursorKeys();
  keys = this.input.keyboard.addKeys({
    A: Phaser.Input.Keyboard.KeyCodes.A,
    D: Phaser.Input.Keyboard.KeyCodes.D,
    W: Phaser.Input.Keyboard.KeyCodes.W
  });

  burgers = this.physics.add.group({
    key: "burger",
    repeat: 7,
    setXY: { x: 160, y: 0, stepX: 105 }
  });

  burgers.children.iterate((b) => {
    b.setScale(0.11);
    b.setBounce(0.25);
    b.setCollideWorldBounds(true);
  });

  this.physics.add.collider(burgers, platforms);
  this.physics.add.overlap(player, burgers, (p, b) => {
    b.disableBody(true, true);
    score++;
    scoreText.setText("🍔 " + score);
  });

  skunks = this.physics.add.group();
  makeSkunk(this, 520, 100, 170);
  makeSkunk(this, 740, 100, -170);

  this.physics.add.collider(skunks, platforms);
  this.physics.add.collider(player, skunks, () => endGame.call(this, false));

  door = this.physics.add.staticImage(915, 200, "door").setScale(0.18).refreshBody();
  this.physics.add.overlap(player, door, () => endGame.call(this, true));

  scoreText = this.add.text(14, 14, "🍔 0", {
    fontSize: "20px",
    fill: "#fff",
    backgroundColor: "rgba(0,0,0,0.45)",
    padding: { x: 10, y: 6 }
  });

  this.add.text(14, 46, "A/D mover • W o Espacio saltar • R reinicia", {
    fontSize: "14px",
    fill: "#fff",
    backgroundColor: "rgba(0,0,0,0.25)",
    padding: { x: 10, y: 6 }
  });

  this.input.keyboard.on("keydown-R", () => window.location.reload());
}

function update() {
  if (ended) return;

  if (keys.A.isDown) player.setVelocityX(-260);
  else if (keys.D.isDown) player.setVelocityX(260);
  else player.setVelocityX(0);

  const onGround = player.body.blocked.down || player.body.touching.down;
  if ((keys.W.isDown || cursors.space.isDown) && onGround) {
    player.setVelocityY(-580);
  }
}

function makeSkunk(scene, x, y, vx) {
  const s = scene.physics.add.sprite(x, y, "skunk");
  s.setScale(0.16);
  s.setBounce(1);
  s.setCollideWorldBounds(true);
  s.setVelocityX(vx);
  s.body.setSize(Math.max(10, s.width * 0.7), Math.max(10, s.height * 0.7), true);
  skunks.add(s);
}

function endGame(win) {
  if (ended) return;
  ended = true;

  this.physics.pause();
  player.setVelocity(0, 0);

  this.add.rectangle(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, 0x000000, 0.55);

  if (!win) {
    player.setTint(0xff0000);
    this.add.text(WIDTH / 2, 110, "GAME OVER", { fontSize: "44px", fill: "#fff" }).setOrigin(0.5);
    this.add.text(WIDTH / 2, 160, "Te atrapó el zorrillo 😵", { fontSize: "20px", fill: "#fff" }).setOrigin(0.5);
  } else {
    this.add.text(WIDTH / 2, 90, "¡RESCATE LOGRADO! 🇹🇭", { fontSize: "38px", fill: "#fff" }).setOrigin(0.5);
    this.add.image(WIDTH / 2 - 120, HEIGHT / 2 + 40, "girl").setScale(0.22);
    this.add.image(WIDTH / 2 + 140, HEIGHT / 2 + 40, "flag").setScale(0.16);
    this.add.text(WIDTH / 2, 155, `Hamburguesas: ${score}`, { fontSize: "22px", fill: "#fff" }).setOrigin(0.5);
  }

  this.add.text(WIDTH / 2, 210, "Presiona R para reiniciar", { fontSize: "18px", fill: "#fff" }).setOrigin(0.5);
}
