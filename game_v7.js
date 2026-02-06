// ================================
// GORDOSO - Bangkok Run (V7 L2 FIX)
// ================================

// ---- CONFIG BASE (responsive) ----
const BASE_W = 1280;
const BASE_H = 720;

// ---- TUNING DE TAMAÑOS (AJUSTA AQUÍ) ----
const PLAYER_SCALE = 0.20;   // baja si lo ves grande (ej: 0.18)
const SKUNK_SCALE  = 0.28;   // sube si lo ves pequeño (ej: 0.32)
const BURGER_SCALE = 0.18;
const DOOR_SCALE   = 0.22;
const GIRL_SCALE   = 0.28;
const FLAG_SCALE   = 0.25;

// ---- FÍSICA ----
const GRAVITY_Y = 900;
const PLAYER_SPEED = 300;
const PLAYER_JUMP  = 520;

// ---- UTIL: input WASD + flechas ----
function makeMoveInput(scene) {
  const cursors = scene.input.keyboard.createCursorKeys();
  const wasd = scene.input.keyboard.addKeys({
    up: Phaser.Input.Keyboard.KeyCodes.W,
    left: Phaser.Input.Keyboard.KeyCodes.A,
    right: Phaser.Input.Keyboard.KeyCodes.D,
    space: Phaser.Input.Keyboard.KeyCodes.SPACE,
    restart: Phaser.Input.Keyboard.KeyCodes.R,
    next: Phaser.Input.Keyboard.KeyCodes.N
  });
  return { cursors, wasd };
}

function anyDown(keysArr) {
  return keysArr.some(k => k && k.isDown);
}

// ---- UTIL: fondo escalado ----
function addScaledBackground(scene, key) {
  const bg = scene.add.image(BASE_W / 2, BASE_H / 2, key).setOrigin(0.5);
  const scale = Math.max(BASE_W / bg.width, BASE_H / bg.height);
  bg.setScale(scale);
  bg.setDepth(-10);
  return bg;
}

// ---- UTIL: plataformas negras (cuerpo físico + dibujo bonito) ----
function createPlatforms(scene, rects) {
  // rects: [{x,y,w,h,radius}]
  const platforms = scene.physics.add.staticGroup();

  const gfx = scene.add.graphics().setDepth(2);
  gfx.fillStyle(0x111111, 0.90);

  rects.forEach(r => {
    const h = r.h ?? 32;
    const radius = r.radius ?? 16;

    // cuerpo físico "invisible"
    const bodyObj = platforms.create(r.x, r.y, null);
    bodyObj.setVisible(false);
    bodyObj.body.setSize(r.w, h, true);
    bodyObj.refreshBody();

    // dibujo visual
    gfx.fillRoundedRect(r.x - r.w / 2, r.y - h / 2, r.w, h, radius);

    // borde verde sutil (opcional)
    const border = scene.add.graphics().setDepth(3);
    border.lineStyle(3, 0x00ff00, 0.25);
    border.strokeRoundedRect(r.x - r.w / 2, r.y - h / 2, r.w, h, radius);
  });

  return platforms;
}

// ---- UTIL: crea hamburguesas ----
function createBurgers(scene, points) {
  const burgers = scene.physics.add.group({
    allowGravity: false,
    immovable: true
  });

  points.forEach(p => {
    const b = burgers.create(p.x, p.y, "burger");
    b.setScale(BURGER_SCALE);
    b.setDepth(5);
  });

  return burgers;
}

// ---- UTIL: crea zorrillos con tween patrulla ----
function createSkunks(scene, list) {
  const skunks = scene.physics.add.group();

  list.forEach(s => {
    const k = skunks.create(s.x, s.y, "skunk");
    k.setScale(SKUNK_SCALE);
    k.setDepth(6);
    k.body.setSize(k.width * 0.55, k.height * 0.70, true);

    // patrulla horizontal
    scene.tweens.add({
      targets: k,
      x: s.x2 ?? (s.x + 260),
      duration: s.duration ?? 1600,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut"
    });
  });

  return skunks;
}

// =====================
// SCENE: NIVEL 1
// =====================
class Level1Scene extends Phaser.Scene {
  constructor() {
    super("LEVEL_1");
  }

  preload() {
    this.load.image("bg1", "assets/bangkok_bg.jpg");
    this.load.image("gordoso", "assets/gordoso.png");
    this.load.image("skunk", "assets/skunk.png");
    this.load.image("burger", "assets/burger.png");
    this.load.image("door", "assets/door.png");
    this.load.image("girl", "assets/girl.png");
    this.load.image("flag", "assets/thai_flag.png");
  }

  create() {
    addScaledBackground(this, "bg1");

    // Input
    this.move = makeMoveInput(this);

    // Hint
    this.add.text(
      18, 14,
      "←/→ o A/D para moverte · W/↑/Espacio para saltar · R reinicia",
      { fontFamily: "monospace", fontSize: "18px", color: "#ffffff", backgroundColor: "rgba(0,0,0,0.55)", padding: { x: 10, y: 6 } }
    ).setDepth(50);

    // Plataformas NIVEL 1 (las “originales”)
    this.platforms = createPlatforms(this, [
      { x: BASE_W / 2, y: BASE_H - 40, w: BASE_W - 120, h: 36, radius: 18 }, // piso
      { x: 360, y: 520, w: 520, h: 30, radius: 14 },
      { x: 680, y: 380, w: 520, h: 30, radius: 14 },
      { x: 980, y: 250, w: 520, h: 30, radius: 14 }
    ]);

    // Jugador
    this.player = this.physics.add.sprite(120, BASE_H - 120, "gordoso");
    this.player.setScale(PLAYER_SCALE);
    this.player.setDepth(10);
    this.player.setCollideWorldBounds(true);
    this.player.body.setSize(this.player.width * 0.45, this.player.height * 0.75, true);

    // Puerta (se activa cuando recoges todo)
    this.door = this.physics.add.staticImage(BASE_W - 90, 210, "door");
    this.door.setScale(DOOR_SCALE);
    this.door.setDepth(9);
    this.door.setVisible(false);

    // Hamburguesas
    this.burgerCount = 0;
    this.totalBurgers = 7;

    this.burgers = createBurgers(this, [
      { x: 220, y: 470 },
      { x: 360, y: 470 },
      { x: 520, y: 470 },
      { x: 600, y: 330 },
      { x: 760, y: 330 },
      { x: 980, y: 200 },
      { x: 1120, y: 200 }
    ]);

    // Zorrillos
    this.skunks = createSkunks(this, [
      { x: 520, y: 470, x2: 700, duration: 1400 },
      { x: 860, y: 330, x2: 1060, duration: 1500 },
      { x: 980, y: 200, x2: 1160, duration: 1200 }
    ]);

    // Colisiones
    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.collider(this.skunks, this.platforms);

    // Pickup burgers
    this.physics.add.overlap(this.player, this.burgers, (player, burger) => {
      if (!burger.active) return;
      burger.disableBody(true, true);
      this.burgerCount += 1;
      if (this.burgerCount >= this.totalBurgers) {
        this.door.setVisible(true);
      }
    });

    // Game over (skunk)
    this.physics.add.overlap(this.player, this.skunks, () => {
      this.scene.start("GAME_OVER", { level: 1 });
    });

    // Win: entrar por la puerta cuando esté visible
    this.physics.add.overlap(this.player, this.door, () => {
      if (!this.door.visible) return;
      this.scene.start("SUBFINAL_1", { burgers: this.burgerCount });
    });

    // Restart
    this.input.keyboard.on("keydown-R", () => this.scene.restart());
  }

  update() {
    const { cursors, wasd } = this.move;

    const left = anyDown([cursors.left, wasd.left]);
    const right = anyDown([cursors.right, wasd.right]);
    const jump = anyDown([cursors.up, wasd.up, wasd.space]);

    if (left) {
      this.player.setVelocityX(-PLAYER_SPEED);
      this.player.setFlipX(true);
    } else if (right) {
      this.player.setVelocityX(PLAYER_SPEED);
      this.player.setFlipX(false);
    } else {
      this.player.setVelocityX(0);
    }

    if (jump && this.player.body.blocked.down) {
      this.player.setVelocityY(-PLAYER_JUMP);
    }
  }
}

// =====================
// SCENE: GAME OVER
// =====================
class GameOverScene extends Phaser.Scene {
  constructor() {
    super("GAME_OVER");
  }
  init(data) {
    this.level = data?.level ?? 1;
  }
  create() {
    this.cameras.main.setBackgroundColor("#000000");
    this.add.text(BASE_W / 2, 200, "GAME OVER", {
      fontFamily: "monospace",
      fontSize: "74px",
      color: "#ffffff"
    }).setOrigin(0.5);

    this.add.text(BASE_W / 2, 300, "Te atrapó el zorrillo 😵", {
      fontFamily: "monospace",
      fontSize: "28px",
      color: "#ffffff"
    }).setOrigin(0.5);

    this.add.text(BASE_W / 2, 390, "Presiona R para reiniciar", {
      fontFamily: "monospace",
      fontSize: "26px",
      color: "#ffffff"
    }).setOrigin(0.5);

    this.input.keyboard.on("keydown-R", () => {
      this.scene.start(this.level === 2 ? "LEVEL_2" : "LEVEL_1");
    });
  }
}

// =====================
// SCENE: SUBFINAL NIVEL 1
// (se mantiene como “subfinal”)
// =====================
class SubFinal1Scene extends Phaser.Scene {
  constructor() {
    super("SUBFINAL_1");
  }
  init(data) {
    this.burgers = data?.burgers ?? 0;
  }
  create() {
    this.cameras.main.setBackgroundColor("#0b0b0b");

    // “Cuarto” simple
    const panel = this.add.rectangle(BASE_W / 2, BASE_H / 2, BASE_W - 160, BASE_H - 160, 0x1b1b2a, 0.95);
    panel.setStrokeStyle(6, 0x2b2b44, 1);

    this.add.text(BASE_W / 2, 120, "¡RESCATE LOGRADO! (TH)", {
      fontFamily: "monospace",
      fontSize: "56px",
      color: "#ffffff"
    }).setOrigin(0.5);

    this.add.text(BASE_W / 2, 190, `Hamburguesas: ${this.burgers}`, {
      fontFamily: "monospace",
      fontSize: "26px",
      color: "#ffffff"
    }).setOrigin(0.5);

    const girl = this.add.image(340, 450, "girl").setScale(GIRL_SCALE).setOrigin(0.5);
    const flag = this.add.image(930, 470, "flag").setScale(FLAG_SCALE).setOrigin(0.5);

    this.add.text(BASE_W / 2, 610, "N = ir al Nivel 2 · R = reiniciar Nivel 1", {
      fontFamily: "monospace",
      fontSize: "22px",
      color: "#ffffff"
    }).setOrigin(0.5);

    this.input.keyboard.on("keydown-N", () => this.scene.start("LEVEL_2"));
    this.input.keyboard.on("keydown-R", () => this.scene.start("LEVEL_1"));
  }
}

// =====================
// SCENE: NIVEL 2 (con gameplay)
// =====================
class Level2Scene extends Phaser.Scene {
  constructor() {
    super("LEVEL_2");
  }

  create() {
    // fondo “after dark”
    this.cameras.main.setBackgroundColor("#060615");
    const topBar = this.add.rectangle(BASE_W / 2, 70, BASE_W, 140, 0x111133, 0.95);
    topBar.setDepth(-5);

    this.add.text(20, 18, "Nivel 2 — Bangkok After Dark", {
      fontFamily: "monospace",
      fontSize: "28px",
      color: "#ffffff"
    }).setDepth(50);

    this.add.text(
      20, 70,
      "←/→ o A/D mover · W/↑/Espacio saltar · R reinicia",
      { fontFamily: "monospace", fontSize: "18px", color: "#ffffff", backgroundColor: "rgba(0,0,0,0.45)", padding: { x: 10, y: 6 } }
    ).setDepth(50);

    // Input
    this.move = makeMoveInput(this);

    // Plataformas Nivel 2
    this.platforms = createPlatforms(this, [
      { x: BASE_W / 2, y: BASE_H - 40, w: BASE_W - 120, h: 36, radius: 18 }, // piso
      { x: 360, y: 520, w: 560, h: 30, radius: 14 },
      { x: 760, y: 420, w: 520, h: 30, radius: 14 },
      { x: 1020, y: 320, w: 520, h: 30, radius: 14 },
      { x: 520, y: 280, w: 420, h: 26, radius: 14 }
    ]);

    // Jugador
    this.player = this.physics.add.sprite(120, BASE_H - 120, "gordoso");
    this.player.setScale(PLAYER_SCALE);
    this.player.setDepth(10);
    this.player.setCollideWorldBounds(true);
    this.player.body.setSize(this.player.width * 0.45, this.player.height * 0.75, true);

    // Girl (objetivo final del nivel 2)
    this.girl = this.physics.add.staticImage(BASE_W - 160, BASE_H - 115, "girl");
    this.girl.setScale(GIRL_SCALE);
    this.girl.setDepth(9);

    // Burgers (sí hay en nivel 2)
    this.burgerCount = 0;
    this.totalBurgers = 8;

    this.burgers = createBurgers(this, [
      { x: 260, y: 470 },
      { x: 420, y: 470 },
      { x: 600, y: 470 },
      { x: 760, y: 370 },
      { x: 920, y: 370 },
      { x: 1020, y: 270 },
      { x: 540, y: 230 },
      { x: 1160, y: 270 }
    ]);

    // Skunks (sí hay en nivel 2)
    this.skunks = createSkunks(this, [
      { x: 520, y: 470, x2: 820, duration: 1200 },
      { x: 960, y: 370, x2: 1150, duration: 1100 },
      { x: 560, y: 230, x2: 720, duration: 900 }
    ]);

    // Colliders
    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.collider(this.skunks, this.platforms);

    // Pickup burgers
    this.physics.add.overlap(this.player, this.burgers, (player, burger) => {
      if (!burger.active) return;
      burger.disableBody(true, true);
      this.burgerCount += 1;
    });

    // Game over
    this.physics.add.overlap(this.player, this.skunks, () => {
      this.scene.start("GAME_OVER", { level: 2 });
    });

    // Subfinal nivel 2: llegar a la chica (no explícito; solo “censura” animada)
    this.physics.add.overlap(this.player, this.girl, () => {
      this.scene.start("SUBFINAL_2", { burgers: this.burgerCount });
    });

    // Restart
    this.input.keyboard.on("keydown-R", () => this.scene.restart());
  }

  update() {
    const { cursors, wasd } = this.move;

    const left = anyDown([cursors.left, wasd.left]);
    const right = anyDown([cursors.right, wasd.right]);
    const jump = anyDown([cursors.up, wasd.up, wasd.space]);

    if (left) {
      this.player.setVelocityX(-PLAYER_SPEED);
      this.player.setFlipX(true);
    } else if (right) {
      this.player.setVelocityX(PLAYER_SPEED);
      this.player.setFlipX(false);
    } else {
      this.player.setVelocityX(0);
    }

    if (jump && this.player.body.blocked.down) {
      this.player.setVelocityY(-PLAYER_JUMP);
    }
  }
}

// =====================
// SCENE: SUBFINAL NIVEL 2
// Cortina animada estética
// =====================
class SubFinal2Scene extends Phaser.Scene {
  constructor() {
    super("SUBFINAL_2");
  }
  init(data) {
    this.burgers = data?.burgers ?? 0;
  }
  create() {
    this.cameras.main.setBackgroundColor("#05050f");

    // Marco “cuarto”
    const frame = this.add.rectangle(BASE_W / 2, BASE_H / 2, BASE_W - 140, BASE_H - 160, 0x151533, 0.98);
    frame.setStrokeStyle(6, 0x2b2b55, 1);

    this.add.text(BASE_W / 2, 90, "SUBFINAL NIVEL 2", {
      fontFamily: "monospace",
      fontSize: "58px",
      color: "#ffffff"
    }).setOrigin(0.5);

    this.add.text(BASE_W / 2, 150, `Hamburguesas en Nivel 2: ${this.burgers}`, {
      fontFamily: "monospace",
      fontSize: "24px",
      color: "#ffffff"
    }).setOrigin(0.5);

    // Gordoso + chica + bandera
    const gord = this.add.image(270, 510, "gordoso").setScale(PLAYER_SCALE).setOrigin(0.5);
    const girl = this.add.image(1010, 510, "girl").setScale(GIRL_SCALE).setOrigin(0.5);
    const flag = this.add.image(1110, 470, "flag").setScale(FLAG_SCALE).setOrigin(0.5);

    // “Escenario” al centro (donde va la cortina)
    const stageW = 720;
    const stageH = 260;
    const stageX = BASE_W / 2;
    const stageY = 420;

    const stage = this.add.rectangle(stageX, stageY, stageW, stageH, 0x0a0a0a, 0.85);
    stage.setStrokeStyle(4, 0xffffff, 0.15);

    // Cortinas (2 paneles) que se mueven + pequeña onda
    const curtainLeft = this.add.rectangle(stageX - stageW / 4, stageY, stageW / 2, stageH, 0x7a1020, 0.95);
    const curtainRight = this.add.rectangle(stageX + stageW / 4, stageY, stageW / 2, stageH, 0x7a1020, 0.95);

    // Pliegues (líneas) para que se vea más “tela”
    const folds = this.add.graphics().setDepth(10);
    folds.lineStyle(2, 0x000000, 0.18);
    for (let i = 0; i < 18; i++) {
      const x = (stageX - stageW / 2) + i * (stageW / 18);
      folds.beginPath();
      folds.moveTo(x, stageY - stageH / 2);
      folds.lineTo(x, stageY + stageH / 2);
      folds.strokePath();
    }

    const label = this.add.text(stageX, stageY, "CENSURADO", {
      fontFamily: "monospace",
      fontSize: "64px",
      color: "#ffffff"
    }).setOrigin(0.5);

    // Animación tipo “cortina moviéndose”
    this.tweens.add({
      targets: curtainLeft,
      x: curtainLeft.x - 18,
      duration: 260,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut"
    });

    this.tweens.add({
      targets: curtainRight,
      x: curtainRight.x + 18,
      duration: 260,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut"
    });

    this.tweens.add({
      targets: label,
      scale: 1.05,
      duration: 300,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut"
    });

    this.add.text(BASE_W / 2, 650, "R = reiniciar Nivel 2 · N = volver al Nivel 1", {
      fontFamily: "monospace",
      fontSize: "22px",
      color: "#ffffff"
    }).setOrigin(0.5);

    this.input.keyboard.on("keydown-R", () => this.scene.start("LEVEL_2"));
    this.input.keyboard.on("keydown-N", () => this.scene.start("LEVEL_1"));
  }
}

// =====================
// GAME CONFIG + START
// =====================
const config = {
  type: Phaser.AUTO,
  parent: "game",
  width: BASE_W,
  height: BASE_H,
  backgroundColor: "#000000",
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: GRAVITY_Y },
      debug: false
    }
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [Level1Scene, GameOverScene, SubFinal1Scene, Level2Scene, SubFinal2Scene]
};

new Phaser.Game(config);

// Log útil para confirmar que sí cargó este archivo
console.log("GAME_V7 L2 FIX cargado OK");

