console.log("✅ GORDOSO GAME V7 - LEVEL 2 BUILD LOADED");

const BASE_W = 960;
const BASE_H = 540;

// ==========================
//  LEVEL 1 (Bangkok Run)
// ==========================
class Level1 extends Phaser.Scene {
  constructor() {
    super("Level1");
  }

  preload() {
    this.load.image("bg", "assets/bangkok_bg.jpg");
    this.load.image("gordoso", "assets/gordoso.png");
    this.load.image("burger", "assets/burger.png");
    this.load.image("skunk", "assets/skunk.png");
    this.load.image("door", "assets/door.png");
    this.load.image("girl", "assets/girl.png");
    this.load.image("flag", "assets/thai_flag.png");
  }

  create() {
    this.score = 0;
    this.finished = false;

    // Fondo (cover)
    const bg = this.add.image(BASE_W / 2, BASE_H / 2, "bg");
    const cover = Math.max(BASE_W / bg.width, BASE_H / bg.height);
    bg.setScale(cover);

    // Textura plataforma generada (sin platform.png)
    const g = this.add.graphics();
    g.fillStyle(0x111111, 0.92);
    g.fillRoundedRect(0, 0, 260, 30, 10);
    g.lineStyle(3, 0xffffff, 0.18);
    g.strokeRoundedRect(0, 0, 260, 30, 10);
    g.generateTexture("plat", 260, 30);
    g.destroy();

    // Plataformas
    this.platforms = this.physics.add.staticGroup();

    // Suelo
    this.platforms.create(BASE_W / 2, 520, "plat").setScale(4.2, 1.6).refreshBody();

    // Escalones
    this.platforms.create(250, 410, "plat").refreshBody();
    this.platforms.create(520, 330, "plat").refreshBody();
    this.platforms.create(780, 250, "plat").refreshBody();
    this.platforms.create(900, 180, "plat").setScale(1.2, 1).refreshBody();

    // Player
    this.player = this.physics.add.sprite(90, 420, "gordoso");

    // Ajusta escalas aquí si quieres (proporción)
    this.player.setScale(0.065);

    this.player.setCollideWorldBounds(true);
    this.player.body.setSize(this.player.width * 0.5, this.player.height * 0.7, true);
    this.physics.add.collider(this.player, this.platforms);

    // Controles (A/D + Flechas + W/Espacio/↑)
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys({
      A: Phaser.Input.Keyboard.KeyCodes.A,
      D: Phaser.Input.Keyboard.KeyCodes.D,
      W: Phaser.Input.Keyboard.KeyCodes.W,
      R: Phaser.Input.Keyboard.KeyCodes.R
    });

    // Hamburguesas
    this.burgers = this.physics.add.group({
      key: "burger",
      repeat: 7,
      setXY: { x: 160, y: 0, stepX: 95 }
    });

    this.burgers.children.iterate((b) => {
      b.setScale(0.10);
      b.setBounce(0.15);
      b.setCollideWorldBounds(true);
    });

    this.physics.add.collider(this.burgers, this.platforms);
    this.physics.add.overlap(this.player, this.burgers, (p, b) => {
      b.disableBody(true, true);
      this.score++;
      this.scoreText.setText("🍔 " + this.score);
    });

    // Zorrillos (enemigos patrullando)
    this.skunks = this.physics.add.group();
    this.makeSkunk(520, 470, 180);
    this.makeSkunk(720, 470, -180);
    this.makeSkunk(780, 210, 180);

    this.physics.add.collider(this.skunks, this.platforms);
    this.physics.add.collider(this.player, this.skunks, () => this.gameOver(), null, this);

    // Puerta final
    this.door = this.physics.add.staticImage(930, 120, "door").setScale(0.16).refreshBody();
    this.physics.add.overlap(this.player, this.door, () => this.winLevel1(), null, this);

    // UI
    this.scoreText = this.add.text(14, 14, "🍔 0", {
      fontSize: "18px",
      fill: "#111",
      backgroundColor: "rgba(255,255,255,0.85)",
      padding: { x: 10, y: 6 }
    });

    this.add.text(14, 48, "A/D o ←→ mover • W/Espacio/↑ saltar", {
      fontSize: "14px",
      fill: "#fff",
      backgroundColor: "rgba(0,0,0,0.35)",
      padding: { x: 10, y: 6 }
    });
  }

  update() {
    if (this.finished) {
      if (this.keys.R.isDown) window.location.reload();
      return;
    }

    const left = this.keys.A.isDown || this.cursors.left.isDown;
    const right = this.keys.D.isDown || this.cursors.right.isDown;

    if (left) this.player.setVelocityX(-260);
    else if (right) this.player.setVelocityX(260);
    else this.player.setVelocityX(0);

    const onGround = this.player.body.blocked.down || this.player.body.touching.down;
    const jumpPressed = this.keys.W.isDown || this.cursors.space.isDown || this.cursors.up.isDown;
    if (jumpPressed && onGround) this.player.setVelocityY(-580);

    // Mantén zorrillos vivos (anti-freeze)
    this.skunks.children.iterate((s) => {
      if (!s?.body) return;
      if (Math.abs(s.body.velocity.x) < 10) {
        s.setVelocityX(s.getData("dir") * 180);
      }
    });
  }

  makeSkunk(x, y, vx) {
    const s = this.physics.add.sprite(x, y, "skunk");

    // Ajusta escalas aquí si quieres (proporción)
    s.setScale(0.32);

    s.setBounce(1);
    s.setCollideWorldBounds(true);
    s.setVelocityX(vx);
    s.setData("dir", vx >= 0 ? 1 : -1);
    s.body.setSize(s.width * 0.6, s.height * 0.75, true);
    this.skunks.add(s);
  }

  gameOver() {
    if (this.finished) return;
    this.finished = true;
    this.physics.pause();
    this.player.setTint(0xff0000);

    this.add.rectangle(BASE_W / 2, BASE_H / 2, BASE_W, BASE_H, 0x000000, 0.55);
    this.add.text(BASE_W / 2, 120, "GAME OVER", { fontSize: "44px", fill: "#fff" }).setOrigin(0.5);
    this.add.text(BASE_W / 2, 170, "Te atrapó el zorrillo 😵", { fontSize: "20px", fill: "#fff" }).setOrigin(0.5);
    this.add.text(BASE_W / 2, 215, "Presiona R para reiniciar", { fontSize: "18px", fill: "#fff" }).setOrigin(0.5);
  }

  winLevel1() {
    if (this.finished) return;
    this.finished = true;
    this.physics.pause();

    this.scene.start("SubFinalLevel1", { score: this.score });
  }
}

// ==========================
//  SUBFINAL NIVEL 1 (overlay)
// ==========================
class SubFinalLevel1 extends Phaser.Scene {
  constructor() {
    super("SubFinalLevel1");
  }

  create(data) {
    const score = data?.score ?? 0;

    // Fondo: reutiliza Bangkok (para que se sienta “subfinal encima”)
    const bg = this.add.image(BASE_W / 2, BASE_H / 2, "bg");
    const cover = Math.max(BASE_W / bg.width, BASE_H / bg.height);
    bg.setScale(cover);
    this.add.rectangle(BASE_W / 2, BASE_H / 2, BASE_W, BASE_H, 0x000000, 0.55);

    // Elementos: chica + bandera (como “subfinal” del 1)
    this.add.image(220, 410, "girl").setScale(0.22);
    this.add.image(520, 420, "flag").setScale(0.16);
    this.add.image(820, 170, "gordoso").setScale(0.10);

    this.add.text(BASE_W / 2, 120, "¡RESCATE LOGRADO! TH", {
      fontSize: "44px",
      fill: "#ffffff"
    }).setOrigin(0.5);

    this.add.text(BASE_W / 2, 185, `Hamburguesas: ${score}`, {
      fontSize: "22px",
      fill: "#ffffff"
    }).setOrigin(0.5);

    this.add.text(BASE_W / 2, 245, "ENTER para ir al Nivel 2  •  R reinicia", {
      fontSize: "18px",
      fill: "#ffffff"
    }).setOrigin(0.5);

    this.input.keyboard.once("keydown-ENTER", () => {
      this.scene.start("Level2");
    });

    this.input.keyboard.once("keydown-R", () => window.location.reload());
  }
}

// ==========================
//  LEVEL 2 (After Dark)
// ==========================
class Level2 extends Phaser.Scene {
  constructor() {
    super("Level2");
  }

  create() {
    this.finished = false;

    // Fondo oscuro (simple)
    this.cameras.main.setBackgroundColor("#0a0a12");

    // “Neon” simple con rectángulos
    this.add.rectangle(BASE_W / 2, BASE_H / 2, BASE_W, BASE_H, 0x000000, 0.35);
    this.add.rectangle(BASE_W / 2, 90, BASE_W - 120, 60, 0x1a1a33, 1);
    this.add.text(40, 70, "Nivel 2 – Bangkok After Dark", {
      fontSize: "22px",
      fill: "#ffffff"
    });

    // Suelo para colisiones
    const g = this.add.graphics();
    g.fillStyle(0x111111, 1);
    g.fillRect(0, 0, 300, 40);
    g.generateTexture("ground2", 300, 40);
    g.destroy();

    this.ground = this.physics.add.staticImage(BASE_W / 2, 520, "ground2").setScale(4.0, 1).refreshBody();

    // Gordoso
    this.player2 = this.physics.add.sprite(120, 450, "gordoso").setScale(0.07);
    this.player2.setCollideWorldBounds(true);
    this.player2.body.setSize(this.player2.width * 0.5, this.player2.height * 0.75, true);

    this.physics.add.collider(this.player2, this.ground);

    // Chica objetivo
    this.girl2 = this.physics.add.staticImage(820, 455, "girl").setScale(0.22).refreshBody();

    // Controles
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys({
      A: Phaser.Input.Keyboard.KeyCodes.A,
      D: Phaser.Input.Keyboard.KeyCodes.D,
      W: Phaser.Input.Keyboard.KeyCodes.W,
      R: Phaser.Input.Keyboard.KeyCodes.R
    });

    this.add.text(40, 110, "A/D o ←→ mover • W/Espacio/↑ saltar • R reinicia", {
      fontSize: "14px",
      fill: "#ffffff",
      backgroundColor: "rgba(0,0,0,0.25)",
      padding: { x: 10, y: 6 }
    });

    // Llegar a la chica = subfinal 2
    this.physics.add.overlap(this.player2, this.girl2, () => {
      if (this.finished) return;
      this.finished = true;
      this.scene.start("SubFinalLevel2");
    });
  }

  update() {
    if (this.finished) return;

    const left = this.keys.A.isDown || this.cursors.left.isDown;
    const right = this.keys.D.isDown || this.cursors.right.isDown;

    if (left) this.player2.setVelocityX(-260);
    else if (right) this.player2.setVelocityX(260);
    else this.player2.setVelocityX(0);

    const onGround = this.player2.body.blocked.down || this.player2.body.touching.down;
    const jumpPressed = this.keys.W.isDown || this.cursors.space.isDown || this.cursors.up.isDown;
    if (jumpPressed && onGround) this.player2.setVelocityY(-560);

    if (this.keys.R.isDown) window.location.reload();
  }
}

// ==========================
//  SUBFINAL NIVEL 2 (censurado estilo Larry)
// ==========================
class SubFinalLevel2 extends Phaser.Scene {
  constructor() {
    super("SubFinalLevel2");
  }

  create() {
    this.cameras.main.setBackgroundColor("#000000");

    this.add.text(BASE_W / 2, 110, "SUBFINAL NIVEL 2", {
      fontSize: "38px",
      fill: "#ffffff"
    }).setOrigin(0.5);

    this.add.text(BASE_W / 2, 160, "Bangkok After Dark", {
      fontSize: "22px",
      fill: "#ffcc66"
    }).setOrigin(0.5);

    // “Cuarto” simple
    this.add.rectangle(BASE_W / 2, BASE_H / 2 + 40, BASE_W - 160, BASE_H - 220, 0x161622, 1)
      .setStrokeStyle(4, 0x2a2a44, 1);

    // Siluetas (sprites reales)
    const gordoso = this.add.image(420, 360, "gordoso").setScale(0.09);
    const chica = this.add.image(540, 360, "girl").setScale(0.22);
    const flag = this.add.image(770, 360, "flag").setScale(0.16);

    // Cortina censura (rectángulo + texto)
    const curtain = this.add.rectangle(480, 360, 420, 220, 0x000000, 1);
    curtain.setStrokeStyle(2, 0xffffff, 0.25);

    const censText = this.add.text(480, 360, "CENSURADO", {
      fontSize: "42px",
      fill: "#ffffff",
      fontStyle: "bold"
    }).setOrigin(0.5);

    // Animación sugerida (sin explícito): “bump” detrás de la cortina
    this.tweens.add({
      targets: [gordoso, chica],
      x: "+=6",
      y: "+=10",
      duration: 260,
      yoyo: true,
      repeat: -1
    });

    // Cortina vibra un poquito
    this.tweens.add({
      targets: [curtain, censText],
      scaleX: { from: 1.0, to: 1.06 },
      scaleY: { from: 1.0, to: 1.03 },
      duration: 240,
      yoyo: true,
      repeat: -1
    });

    // Texto final
    this.add.text(BASE_W / 2, 485, "ENTER para continuar  •  R reinicia", {
      fontSize: "18px",
      fill: "#ffffff"
    }).setOrigin(0.5);

    this.input.keyboard.once("keydown-ENTER", () => {
      this.scene.start("FinalScene");
    });

    this.input.keyboard.once("keydown-R", () => window.location.reload());
  }
}

// ==========================
//  FINAL (créditos simples)
// ==========================
class FinalScene extends Phaser.Scene {
  constructor() {
    super("FinalScene");
  }

  create() {
    this.cameras.main.setBackgroundColor("#000000");

    this.add.text(BASE_W / 2, BASE_H / 2 - 20, "FIN", {
      fontSize: "60px",
      fill: "#ffffff"
    }).setOrigin(0.5);

    this.add.text(BASE_W / 2, BASE_H / 2 + 50, "GORDOSO™ Bangkok Run", {
      fontSize: "24px",
      fill: "#ffffff"
    }).setOrigin(0.5);

    this.add.text(BASE_W / 2, BASE_H - 60, "R para reiniciar", {
      fontSize: "18px",
      fill: "#cccccc"
    }).setOrigin(0.5);

    this.input.keyboard.once("keydown-R", () => window.location.reload());
  }
}

// ==========================
//  GAME CONFIG
// ==========================
const config = {
  type: Phaser.AUTO,
  width: BASE_W,
  height: BASE_H,
  parent: "game",
  backgroundColor: "#000000",
  scale: {
    mode: Phaser.Scale.ENVELOP,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  physics: {
    default: "arcade",
    arcade: { gravity: { y: 1200 }, debug: false }
  },
  scene: [Level1, SubFinalLevel1, Level2, SubFinalLevel2, FinalScene]
};

new Phaser.Game(config);

