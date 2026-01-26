// Gordoso - Bangkok Run (FIX FREEZE: HITBOX PUERTA PEQUEÑO + CHECK DISTANCIA + BOTONES MÓVIL)

const BASE_W = 960;
const BASE_H = 540;
const WORLD_WIDTH = 2400;

const PLAYER_SCALE = 0.10;
const SKUNK_SCALE  = 0.34;
const DOOR_SCALE   = 0.35;
const BURGER_SCALE = 0.12;

const STOMP_BOUNCE = 380;
const STOMP_MARGIN = 10;

const config = {
  type: Phaser.AUTO,
  parent: "game",
  width: BASE_W,
  height: BASE_H,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: BASE_W,
    height: BASE_H,
  },
  physics: {
    default: "arcade",
    arcade: { gravity: { y: 1200 }, debug: false },
  },
  scene: [MainScene, EndScene],
};

new Phaser.Game(config);

function MainScene() { Phaser.Scene.call(this, { key: "MainScene" }); }
MainScene.prototype = Object.create(Phaser.Scene.prototype);
MainScene.prototype.constructor = MainScene;

MainScene.prototype.preload = function () {
  this.load.image("bg", "assets/bangkok_bg.jpg");
  this.load.image("gordoso", "assets/gordoso.png");
  this.load.image("burger", "assets/burger.png");
  this.load.image("skunk", "assets/skunk.png");
  this.load.image("door", "assets/door.png");

  this.load.image("girl", "assets/girl.png");
  this.load.image("thaiFlag", "assets/thai_flag.png");
};

MainScene.prototype.create = function () {
  // Multi-touch iPhone
  this.input.addPointer(3);
  this.input.setTopOnly(false);

  // Fondo
  const bg = this.add.image(0, 0, "bg").setOrigin(0, 0).setScrollFactor(0);
  bg.displayWidth = WORLD_WIDTH;
  bg.displayHeight = BASE_H;

  // Mundo/cámara
  this.physics.world.setBounds(0, 0, WORLD_WIDTH, BASE_H);
  this.cameras.main.setBounds(0, 0, WORLD_WIDTH, BASE_H);

  // Teclas PC
  this.cursors = this.input.keyboard.createCursorKeys();
  this.keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
  this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
  this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
  this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);

  // Estado móvil
  this.mobileLeft = false;
  this.mobileRight = false;
  this.mobileJumpQueued = false;

  this.leftPID = null;
  this.rightPID = null;
  this.jumpPID = null;

  const hardResetMobile = () => {
    this.mobileLeft = false;
    this.mobileRight = false;
    this.mobileJumpQueued = false;
    this.leftPID = null;
    this.rightPID = null;
    this.jumpPID = null;
  };

  this.input.on("pointerup", (p) => {
    if (this.leftPID === p.id) { this.mobileLeft = false; this.leftPID = null; }
    if (this.rightPID === p.id) { this.mobileRight = false; this.rightPID = null; }
    if (this.jumpPID === p.id) { this.jumpPID = null; }
  });
  this.input.on("pointercancel", hardResetMobile);
  this.game.events.on("blur", hardResetMobile);
  window.addEventListener("touchend", hardResetMobile, { passive: true });
  window.addEventListener("touchcancel", hardResetMobile, { passive: true });

  // Plataformas textura
  const g = this.add.graphics();
  g.fillStyle(0x1ddc00, 1);
  g.fillRect(0, 0, 220, 22);
  g.generateTexture("plat220x22", 220, 22);
  g.clear();
  g.fillRect(0, 0, WORLD_WIDTH, 40);
  g.generateTexture("ground", WORLD_WIDTH, 40);
  g.destroy();

  // Plataformas
  this.platforms = this.physics.add.staticGroup();
  this.platforms.create(WORLD_WIDTH / 2, BASE_H - 20, "ground").refreshBody();

  this.platforms.create(420, 420, "plat220x22").refreshBody();
  this.platforms.create(750, 340, "plat220x22").refreshBody();
  this.platforms.create(1120, 420, "plat220x22").refreshBody();
  this.platforms.create(1450, 320, "plat220x22").refreshBody();
  this.platforms.create(1700, 420, "plat220x22").refreshBody();
  this.platforms.create(2050, 360, "plat220x22").refreshBody();

  // Jugador
  this.player = this.physics.add.sprite(120, 380, "gordoso");
  this.player.setScale(PLAYER_SCALE);
  this.player.setCollideWorldBounds(true);
  this.player.body.setSize(this.player.width * 0.55, this.player.height * 0.80, true);

  this.physics.add.collider(this.player, this.platforms);

  // Cámara
  this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
  this.cameras.main.setDeadzone(160, 120);

  // Hamburguesas
  this.burgers = this.physics.add.group({ bounceY: 0.2 });
  [420, 760, 1120, 1450, 1700, 2050, 2280].forEach((x) => {
    const b = this.burgers.create(x, 0, "burger");
    b.setScale(BURGER_SCALE);
    b.body.setSize(b.width * 0.7, b.height * 0.7, true);
  });

  this.physics.add.collider(this.burgers, this.platforms);
  this.physics.add.overlap(this.player, this.burgers, this.collectBurger, null, this);

  // Enemigos
  this.enemies = this.physics.add.group();
  const s1 = this.enemies.create(1200, 380, "skunk").setScale(SKUNK_SCALE);
  const s2 = this.enemies.create(1600, 380, "skunk").setScale(SKUNK_SCALE);

  s1.setVelocityX(-80); s2.setVelocityX(80);
  s1.setCollideWorldBounds(true); s2.setCollideWorldBounds(true);
  s1.body.setSize(s1.width * 0.78, s1.height * 0.80, true);
  s2.body.setSize(s2.width * 0.78, s2.height * 0.80, true);

  this.physics.add.collider(this.enemies, this.platforms);
  this.physics.add.collider(this.player, this.enemies, this.playerEnemyCollide, null, this);

  // ✅ PUERTA (FIX HITBOX)
  this.door = this.physics.add.staticSprite(WORLD_WIDTH - 150, 410, "door");
  this.door.setScale(DOOR_SCALE);
  this.door.refreshBody();

  // Reducimos hitbox a algo razonable (centrado)
  // OJO: después de refreshBody(), body ya existe
  const doorBodyW = 70;
  const doorBodyH = 140;
  this.door.body.setSize(doorBodyW, doorBodyH, false);
  this.door.body.setOffset(
    (this.door.displayWidth - doorBodyW) / 2,
    (this.door.displayHeight - doorBodyH)
  );
  this.door.refreshBody();

  // ✅ Solo overlap con condición extra (evita ganar “en el aire” lejos)
  this.physics.add.overlap(this.player, this.door, (player, door) => {
    // Solo si estás realmente al lado de la puerta
    if (player.x > door.x - 40) this.winLevel();
  }, null, this);

  // Score
  this.score = 0;
  this.scoreText = this.add.text(16, 16, "Score: 0", {
    fontSize: "20px",
    color: "#fff",
    backgroundColor: "rgba(0,0,0,0.45)",
    padding: { x: 10, y: 6 },
  }).setScrollFactor(0).setDepth(9999);

  // Botones móvil
  this.createMobileButtons();
  this.scale.on("resize", () => this.positionMobileButtons());
  this.positionMobileButtons();
};

MainScene.prototype.createMobileButtons = function () {
  this.ui = this.add.container(0, 0).setScrollFactor(0).setDepth(9999);

  const btnW = 88, btnH = 66;
  const jumpW = 120, jumpH = 66;

  this.leftBtn = this.add.rectangle(0, 0, btnW, btnH, 0x000000, 0.22)
    .setStrokeStyle(2, 0xffffff, 0.7)
    .setInteractive();
  this.leftTxt = this.add.text(0, 0, "◀", { fontFamily: "Arial", fontSize: "34px", color: "#fff" }).setOrigin(0.5);

  this.rightBtn = this.add.rectangle(0, 0, btnW, btnH, 0x000000, 0.22)
    .setStrokeStyle(2, 0xffffff, 0.7)
    .setInteractive();
  this.rightTxt = this.add.text(0, 0, "▶", { fontFamily: "Arial", fontSize: "34px", color: "#fff" }).setOrigin(0.5);

  this.jumpBtn = this.add.rectangle(0, 0, jumpW, jumpH, 0x000000, 0.22)
    .setStrokeStyle(2, 0xffffff, 0.7)
    .setInteractive();
  this.jumpTxt = this.add.text(0, 0, "JUMP", { fontFamily: "Arial", fontSize: "20px", color: "#fff" }).setOrigin(0.5);

  this.ui.add([this.leftBtn, this.leftTxt, this.rightBtn, this.rightTxt, this.jumpBtn, this.jumpTxt]);

  // pointerId por botón
  this.leftBtn.on("pointerdown", (p) => { this.mobileLeft = true; this.leftPID = p.id; });
  this.rightBtn.on("pointerdown", (p) => { this.mobileRight = true; this.rightPID = p.id; });
  this.jumpBtn.on("pointerdown", (p) => { this.jumpPID = p.id; this.mobileJumpQueued = true; });
};

MainScene.prototype.positionMobileButtons = function () {
  const w = this.scale.width;
  const h = this.scale.height;

  const side = 18;
  const bottom = 20;
  const y = h - bottom - 40;

  const leftX  = side + 55;
  const rightX = side + 55 + 105;
  const jumpX  = w - side - 70;

  this.leftBtn.setPosition(leftX, y);
  this.leftTxt.setPosition(leftX, y);

  this.rightBtn.setPosition(rightX, y);
  this.rightTxt.setPosition(rightX, y);

  this.jumpBtn.setPosition(jumpX, y);
  this.jumpTxt.setPosition(jumpX, y);
};

MainScene.prototype.update = function () {
  const left = this.cursors.left.isDown || this.keyA.isDown || this.mobileLeft;
  const right = this.cursors.right.isDown || this.keyD.isDown || this.mobileRight;

  if (left) {
    this.player.setVelocityX(-220);
    this.player.setFlipX(true);
  } else if (right) {
    this.player.setVelocityX(220);
    this.player.setFlipX(false);
  } else {
    this.player.setVelocityX(0);
  }

  const jumpPressedPC =
    Phaser.Input.Keyboard.JustDown(this.keySpace) ||
    Phaser.Input.Keyboard.JustDown(this.keyW) ||
    Phaser.Input.Keyboard.JustDown(this.cursors.up);

  const jumpPressedMobile = this.mobileJumpQueued;

  if ((jumpPressedPC || jumpPressedMobile) && this.player.body.blocked.down) {
    this.player.setVelocityY(-520);
  }
  this.mobileJumpQueued = false;

  this.enemies.children.iterate((e) => {
    if (!e) return;
    if (e.body.blocked.left) e.setVelocityX(80);
    if (e.body.blocked.right) e.setVelocityX(-80);
  });
};

MainScene.prototype.collectBurger = function (player, burger) {
  burger.disableBody(true, true);
  this.score += 10;
  this.scoreText.setText("Score: " + this.score);
};

MainScene.prototype.playerEnemyCollide = function (player, enemy) {
  if (!enemy.active || !player.active) return;

  const playerFalling = player.body.velocity.y > 0;
  const playerBottom = player.body.y + player.body.height;
  const enemyTop = enemy.body.y;
  const comingFromAbove = playerBottom <= enemyTop + STOMP_MARGIN;

  if (playerFalling && comingFromAbove) {
    enemy.disableBody(true, true);
    player.setVelocityY(-STOMP_BOUNCE);
    this.score += 25;
    this.scoreText.setText("Score: " + this.score);
  } else {
    player.setTint(0xff0000);
    this.time.delayedCall(150, () => {
      player.clearTint();
      player.setVelocity(0, 0);
      player.setPosition(120, 380);
    });
  }
};

MainScene.prototype.winLevel = function () {
  // Evita doble-trigger
  if (this._won) return;
  this._won = true;

  this.player.setVelocity(0, 0);
  this.player.body.enable = false;

  this.time.delayedCall(250, () => {
    this.scene.start("EndScene", { score: this.score });
  });
};

// =================== END SCENE ===================
function EndScene() { Phaser.Scene.call(this, { key: "EndScene" }); }
EndScene.prototype = Object.create(Phaser.Scene.prototype);
EndScene.prototype.constructor = EndScene;

EndScene.prototype.init = function (data) { this.score = data.score || 0; };

EndScene.prototype.create = function () {
  const w = this.scale.width;
  const h = this.scale.height;

  this.add.image(w / 2, h / 2, "bg").setDisplaySize(w, h);
  this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.4);

  this.add.text(w / 2, 60, "¡RESCATE COMPLETADO!", {
    fontSize: "36px",
    color: "#fff",
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: { x: 14, y: 10 },
  }).setOrigin(0.5);

  this.add.text(w / 2, 110, `Score: ${this.score}`, {
    fontSize: "20px",
    color: "#fff",
  }).setOrigin(0.5);

  this.add.sprite(w * 0.25, h * 0.65, "gordoso").setScale(PLAYER_SCALE * 1.4);

  const girlX = w * 0.60;
  const girlY = h * 0.65;

  const girl = this.add.sprite(girlX, girlY, "girl").setScale(0.34);
  const flag = this.add.sprite(girlX + 46, girlY - 18, "thaiFlag").setScale(0.20);

  this.tweens.add({
    targets: [girl, flag],
    y: girlY - 12,
    duration: 700,
    yoyo: true,
    repeat: -1,
    ease: "Sine.easeInOut",
  });

  this.add.text(w / 2, h - 60, "Presiona R para reiniciar", {
    fontSize: "18px",
    color: "#fff",
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: { x: 12, y: 8 },
  }).setOrigin(0.5);

  this.input.keyboard.once("keydown-R", () => this.scene.start("MainScene"));
};
