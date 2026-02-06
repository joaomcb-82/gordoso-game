console.log("✅ GAME_V7 — NIVEL 1 + NIVEL 2 + SUBFINALES + RESTART POR NIVEL + AUTO WALK");

const BASE_W = 960;
const BASE_H = 540;

// ============================
// NIVEL 1
// ============================
class PlayScene extends Phaser.Scene {
  constructor() {
    super("play");
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
    this.ended = false;

    // Fondo (cover)
    const bg = this.add.image(BASE_W / 2, BASE_H / 2, "bg");
    const cover = Math.max(BASE_W / bg.width, BASE_H / bg.height);
    bg.setScale(cover);

    // Textura plataforma
    const g = this.add.graphics();
    g.fillStyle(0x111111, 0.92);
    g.fillRoundedRect(0, 0, 260, 30, 10);
    g.lineStyle(3, 0xffffff, 0.22);
    g.strokeRoundedRect(0, 0, 260, 30, 10);
    g.generateTexture("plat", 260, 30);
    g.destroy();

    // Plataformas
    this.platforms = this.physics.add.staticGroup();

    const ground = this.platforms.create(BASE_W / 2, 520, "plat").setScale(4.2, 1.5);
    ground.refreshBody();

    const p1 = this.platforms.create(250, 410, "plat"); p1.refreshBody();
    const p2 = this.platforms.create(520, 330, "plat"); p2.refreshBody();
    const p3 = this.platforms.create(780, 250, "plat"); p3.refreshBody();
    const p4 = this.platforms.create(900, 180, "plat").setScale(1.2, 1); p4.refreshBody();

    // Bounds útiles para zorrillos
    const boundsFrom = (plat) => {
      const b = plat.getBounds();
      return { left: b.left + 18, right: b.right - 18 };
    };
    const bGround = boundsFrom(ground);
    const bP2 = boundsFrom(p2);

    // Gordoso
    this.player = this.physics.add.sprite(90, 420, "gordoso");
    this.player.setOrigin(0.5, 0.88);
    this.player.setScale(0.10);
    this.player.setCollideWorldBounds(true);

    const pw = this.player.width * 0.45;
    const ph = this.player.height * 0.55;
    this.player.body.setSize(pw, ph);
    this.player.body.setOffset((this.player.width - pw) / 2, this.player.height - ph);

    this.physics.add.collider(this.player, this.platforms);

    // Controles
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys({
      A: Phaser.Input.Keyboard.KeyCodes.A,
      D: Phaser.Input.Keyboard.KeyCodes.D,
      W: Phaser.Input.Keyboard.KeyCodes.W,
      R: Phaser.Input.Keyboard.KeyCodes.R
    });

    // Hamburguesas (solo puntos)
    this.burgers = this.physics.add.group({ allowGravity: false, immovable: true });

    const makeBurger = (x, y) => {
      const b = this.burgers.create(x, y, "burger");
      b.setScale(0.09);
      b.body.setSize(b.displayWidth, b.displayHeight, true);
      return b;
    };

    makeBurger(200, 380);
    makeBurger(320, 380);
    makeBurger(520, 300);
    makeBurger(640, 300);
    makeBurger(780, 220);
    makeBurger(900, 150);

    this.physics.add.overlap(this.player, this.burgers, (_p, b) => {
      b.disableBody(true, true);
      this.score++;
      this.scoreText.setText("🍔 " + this.score);
    });

    // Zorrillos
    this.skunks = this.physics.add.group();
    this.makeSkunkWalker(420, 470, bGround.left, bGround.right, 160);
    this.makeSkunkWalker(520, 0, bP2.left, bP2.right, 140);

    this.physics.add.collider(this.skunks, this.platforms);
    this.physics.add.overlap(this.player, this.skunks, () => this.gameOver(), null, this);

    // Puerta Nivel 1
    this.door = this.physics.add.staticImage(930, 120, "door").setScale(0.16);
    this.door.refreshBody();
    this.physics.add.overlap(this.player, this.door, () => this.win(), null, this);

    // UI
    this.scoreText = this.add.text(14, 14, "🍔 0", {
      fontSize: "18px",
      fill: "#111",
      backgroundColor: "rgba(255,255,255,0.85)",
      padding: { x: 10, y: 6 }
    });

    this.add.text(14, 48, "A/D o ←→ mover • W/Espacio/↑ saltar • R reinicia", {
      fontSize: "14px",
      fill: "#fff",
      backgroundColor: "rgba(0,0,0,0.35)",
      padding: { x: 10, y: 6 }
    });
  }

  update() {
    if (this.ended) return;

    const left = this.keys.A.isDown || this.cursors.left.isDown;
    const right = this.keys.D.isDown || this.cursors.right.isDown;

    if (left) this.player.setVelocityX(-260);
    else if (right) this.player.setVelocityX(260);
    else this.player.setVelocityX(0);

    const onGround = this.player.body.blocked.down || this.player.body.touching.down;
    const jumpPressed = this.keys.W.isDown || this.cursors.space.isDown || this.cursors.up.isDown;
    if (jumpPressed && onGround) this.player.setVelocityY(-580);

    this.skunks.children.iterate((s) => {
      if (!s?.body) return;
      const dir = s.getData("dir");
      s.setVelocityX(dir * s.getData("speed"));
      if (s.x < s.getData("left")) s.setData("dir", 1);
      if (s.x > s.getData("right")) s.setData("dir", -1);
      s.setFlipX(s.getData("dir") < 0);
    });
  }

  makeSkunkWalker(x, y, leftBound, rightBound, speed) {
    const s = this.physics.add.sprite(x, y, "skunk");
    s.setScale(0.16);
    s.setOrigin(0.5, 0.95);
    s.setBounce(0);
    s.setCollideWorldBounds(true);

    const bw = s.width * 0.65;
    const bh = s.height * 0.65;
    s.body.setSize(bw, bh);
    s.body.setOffset((s.width - bw) / 2, s.height - bh);

    s.setData("left", leftBound);
    s.setData("right", rightBound);
    s.setData("speed", speed);
    s.setData("dir", Math.random() > 0.5 ? 1 : -1);

    this.skunks.add(s);
  }

  // ✅ Reinicia en Nivel 1
  gameOver() {
    if (this.ended) return;
    this.ended = true;
    this.physics.pause();
    this.player.setTint(0xff0000);

    this.add.rectangle(BASE_W / 2, BASE_H / 2, BASE_W, BASE_H, 0x000000, 0.55);
    this.add.text(BASE_W / 2, 115, "GAME OVER", { fontSize: "44px", fill: "#fff" }).setOrigin(0.5);
    this.add.text(BASE_W / 2, 165, "Te atrapó Toxin 😵", { fontSize: "20px", fill: "#fff" }).setOrigin(0.5);
    this.add.text(BASE_W / 2, 210, "Reiniciando Nivel 1...", { fontSize: "18px", fill: "#fff" }).setOrigin(0.5);

    this.time.delayedCall(900, () => this.scene.restart());
  }

  win() {
    if (this.ended) return;
    this.ended = true;
    this.scene.start("finalRoom", { score: this.score });
  }
}

// ============================
// SUBFINAL NIVEL 1 (idéntico visual)
// ============================
class FinalRoomScene extends Phaser.Scene {
  constructor() {
    super("finalRoom");
  }

  create(data) {
    const score = data?.score ?? 0;

    this.cameras.main.setBackgroundColor("#1b1b1b");
    this.add.rectangle(BASE_W / 2, BASE_H / 2, BASE_W - 120, BASE_H - 120, 0x2a2a2a, 1)
      .setStrokeStyle(6, 0x111111, 1);

    this.add.circle(BASE_W / 2, 120, 55, 0xffe08a, 0.18);
    this.add.circle(BASE_W / 2, 120, 28, 0xffe08a, 0.25);

    this.add.text(BASE_W / 2, 70, "¡RESCATE LOGRADO! 🇹🇭", { fontSize: "40px", fill: "#ffffff" }).setOrigin(0.5);
    this.add.text(BASE_W / 2, 118, `Hamburguesas: ${score}`, { fontSize: "22px", fill: "#ffffff" }).setOrigin(0.5);

    this.add.image(260, 360, "gordoso").setScale(0.15);
    this.add.image(520, 360, "girl").setScale(0.26);
    this.add.image(740, 360, "flag").setScale(0.18);

    this.add.text(BASE_W / 2, 470, "Presiona R para reiniciar", { fontSize: "18px", fill: "#ffffff" }).setOrigin(0.5);
    this.input.keyboard.on("keydown-R", () => window.location.reload());

    // Puente a Nivel 2
    this.time.delayedCall(1500, () => {
      this.cameras.main.fadeOut(350, 0, 0, 0);
      this.time.delayedCall(380, () => {
        this.scene.start("level2", { carryScore: score });
      });
    });
  }
}

// ============================
// NIVEL 2 (termina en puerta)
// ============================
class Level2Scene extends Phaser.Scene {
  constructor() {
    super("level2");
  }

  create(data) {
    this.score2 = 0;
    this.ended = false;
    this.carryScore = data?.carryScore ?? 0;

    const bg = this.add.image(BASE_W / 2, BASE_H / 2, "bg");
    const cover = Math.max(BASE_W / bg.width, BASE_H / bg.height);
    bg.setScale(cover);

    // Si entran directo a nivel2, asegurar textura plat
    if (!this.textures.exists("plat")) {
      const g = this.add.graphics();
      g.fillStyle(0x111111, 0.92);
      g.fillRoundedRect(0, 0, 260, 30, 10);
      g.lineStyle(3, 0xffffff, 0.22);
      g.strokeRoundedRect(0, 0, 260, 30, 10);
      g.generateTexture("plat", 260, 30);
      g.destroy();
    }

    this.platforms = this.physics.add.staticGroup();

    const ground = this.platforms.create(BASE_W / 2, 520, "plat").setScale(4.2, 1.5);
    ground.refreshBody();

    const a = this.platforms.create(180, 420, "plat"); a.refreshBody();
    const b = this.platforms.create(420, 340, "plat"); b.refreshBody();
    const c = this.platforms.create(680, 280, "plat"); c.refreshBody();
    const d = this.platforms.create(860, 210, "plat").setScale(1.1, 1); d.refreshBody();

    const boundsFrom = (plat) => {
      const bb = plat.getBounds();
      return { left: bb.left + 18, right: bb.right - 18 };
    };

    const bGround = boundsFrom(ground);
    const bB = boundsFrom(b);
    const bC = boundsFrom(c);

    // Gordoso
    this.player = this.physics.add.sprite(80, 420, "gordoso");
    this.player.setOrigin(0.5, 0.88);
    this.player.setScale(0.10);
    this.player.setCollideWorldBounds(true);

    const pw = this.player.width * 0.45;
    const ph = this.player.height * 0.55;
    this.player.body.setSize(pw, ph);
    this.player.body.setOffset((this.player.width - pw) / 2, this.player.height - ph);

    this.physics.add.collider(this.player, this.platforms);

    // Controles
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys({
      A: Phaser.Input.Keyboard.KeyCodes.A,
      D: Phaser.Input.Keyboard.KeyCodes.D,
      W: Phaser.Input.Keyboard.KeyCodes.W,
      R: Phaser.Input.Keyboard.KeyCodes.R
    });

    // Hamburguesas
    this.burgers = this.physics.add.group({ allowGravity: false, immovable: true });
    const makeBurger = (x, y) => {
      const bb2 = this.burgers.create(x, y, "burger");
      bb2.setScale(0.09);
      bb2.body.setSize(bb2.displayWidth, bb2.displayHeight, true);
      return bb2;
    };

    makeBurger(180, 390);
    makeBurger(420, 310);
    makeBurger(680, 250);
    makeBurger(860, 180);

    this.physics.add.overlap(this.player, this.burgers, (_p, bgr) => {
      bgr.disableBody(true, true);
      this.score2++;
      this.scoreText.setText(`🍔 ${this.carryScore + this.score2}`);
    });

    // Zorrillos
    this.skunks = this.physics.add.group();
    this.makeSkunkWalker(420, 0, bB.left, bB.right, 150);
    this.makeSkunkWalker(680, 0, bC.left, bC.right, 170);
    this.makeSkunkWalker(520, 470, bGround.left, bGround.right, 190);

    this.physics.add.collider(this.skunks, this.platforms);
    this.physics.add.overlap(this.player, this.skunks, () => this.gameOver(), null, this);

    // Puerta Nivel 2
    this.door2 = this.physics.add.staticImage(910, 165, "door").setScale(0.16);
    this.door2.refreshBody();
    this.physics.add.overlap(this.player, this.door2, () => this.level2Door(), null, this);

    // UI
    this.scoreText = this.add.text(14, 14, `🍔 ${this.carryScore}`, {
      fontSize: "18px",
      fill: "#111",
      backgroundColor: "rgba(255,255,255,0.85)",
      padding: { x: 10, y: 6 }
    });

    this.add.text(14, 48, "NIVEL 2 — llega a la puerta • R reinicia", {
      fontSize: "14px",
      fill: "#fff",
      backgroundColor: "rgba(0,0,0,0.35)",
      padding: { x: 10, y: 6 }
    });
  }

  update() {
    if (this.ended) return;

    const left = this.keys.A.isDown || this.cursors.left.isDown;
    const right = this.keys.D.isDown || this.cursors.right.isDown;

    if (left) this.player.setVelocityX(-260);
    else if (right) this.player.setVelocityX(260);
    else this.player.setVelocityX(0);

    const onGround = this.player.body.blocked.down || this.player.body.touching.down;
    const jumpPressed = this.keys.W.isDown || this.cursors.space.isDown || this.cursors.up.isDown;
    if (jumpPressed && onGround) this.player.setVelocityY(-580);

    this.skunks.children.iterate((s) => {
      if (!s?.body) return;
      const dir = s.getData("dir");
      s.setVelocityX(dir * s.getData("speed"));
      if (s.x < s.getData("left")) s.setData("dir", 1);
      if (s.x > s.getData("right")) s.setData("dir", -1);
      s.setFlipX(s.getData("dir") < 0);
    });
  }

  makeSkunkWalker(x, y, leftBound, rightBound, speed) {
    const s = this.physics.add.sprite(x, y, "skunk");
    s.setScale(0.16);
    s.setOrigin(0.5, 0.95);
    s.setBounce(0);
    s.setCollideWorldBounds(true);

    const bw = s.width * 0.65;
    const bh = s.height * 0.65;
    s.body.setSize(bw, bh);
    s.body.setOffset((s.width - bw) / 2, s.height - bh);

    s.setData("left", leftBound);
    s.setData("right", rightBound);
    s.setData("speed", speed);
    s.setData("dir", Math.random() > 0.5 ? 1 : -1);

    this.skunks.add(s);
  }

  // ✅ Reinicia en Nivel 2 (con carryScore intacto)
  gameOver() {
    if (this.ended) return;
    this.ended = true;
    this.physics.pause();
    this.player.setTint(0xff0000);

    this.add.rectangle(BASE_W / 2, BASE_H / 2, BASE_W, BASE_H, 0x000000, 0.55);
    this.add.text(BASE_W / 2, 115, "GAME OVER", { fontSize: "44px", fill: "#fff" }).setOrigin(0.5);
    this.add.text(BASE_W / 2, 165, "Te atrapó Toxin 😵", { fontSize: "20px", fill: "#fff" }).setOrigin(0.5);
    this.add.text(BASE_W / 2, 210, "Reiniciando Nivel 2...", { fontSize: "18px", fill: "#fff" }).setOrigin(0.5);

    const carry = this.carryScore ?? 0;
    this.time.delayedCall(900, () => this.scene.restart({ carryScore: carry }));
  }

  level2Door() {
    if (this.ended) return;
    this.ended = true;
    this.physics.pause();
    const total = (this.carryScore ?? 0) + (this.score2 ?? 0);
    this.scene.start("finalRoom2", { totalScore: total });
  }
}

// ============================
// SUBFINAL NIVEL 2 (habitación) + AUTO WALK
// ============================
class FinalRoom2Scene extends Phaser.Scene {
  constructor() {
    super("finalRoom2");
  }

  create(data) {
    const totalScore = data?.totalScore ?? 0;
    this.totalScore = totalScore;

    // Habitación
    this.cameras.main.setBackgroundColor("#111111");
    this.add.rectangle(BASE_W / 2, BASE_H / 2, BASE_W - 120, BASE_H - 120, 0x222222, 1)
      .setStrokeStyle(6, 0x000000, 0.8);

    // Luz
    this.add.circle(BASE_W / 2, 120, 60, 0xffd27d, 0.18);
    this.add.circle(BASE_W / 2, 120, 30, 0xffd27d, 0.25);

    this.add.text(BASE_W / 2, 60, "SUBFINAL — NIVEL 2", { fontSize: "34px", fill: "#ffffff" }).setOrigin(0.5);
    this.add.text(BASE_W / 2, 105, `Puntaje total: ${totalScore}`, { fontSize: "20px", fill: "#ffffff" }).setOrigin(0.5);

    // ✅ Suelo invisible sin cuadro verde
    const floorRect = this.add.rectangle(BASE_W / 2, 500, BASE_W, 60, 0x000000, 0);
    this.physics.add.existing(floorRect, true); // static body

    // Gordoso (más arriba para verse completo)
    this.player = this.physics.add.sprite(240, 430, "gordoso").setScale(0.14);
    this.player.setOrigin(0.5, 0.88);
    this.player.setCollideWorldBounds(true);
    this.physics.add.collider(this.player, floorRect);

    const pw = this.player.width * 0.45;
    const ph = this.player.height * 0.55;
    this.player.body.setSize(pw, ph);
    this.player.body.setOffset((this.player.width - pw) / 2, this.player.height - ph);

    // Chica
    this.girl = this.physics.add.staticImage(720, 430, "girl").setScale(0.26);
    this.girl.refreshBody();

    // ✅ Auto caminar hacia la chica
    this.autoWalk = true;
    this.player.setVelocityX(170);

  this.physics.add.overlap(this.player, this.girl, () => {
  if (!this.autoWalk) return;
  this.autoWalk = false;

  // 1) se detiene
  this.player.setVelocityX(0);

  // 2) mini temblor
  this.cameras.main.shake(220, 0.006);

  // 3) pausa corta
  this.time.delayedCall(350, () => {
    // 4) fade out
    this.cameras.main.fadeOut(350, 0, 0, 0);

    // 5) entrar a la cortina
    this.time.delayedCall(380, () => {
      this.scene.start("curtain", { totalScore: this.totalScore });
    });
  });
}, null, this);


    // R reinicia (se mantiene)
    this.input.keyboard.on("keydown-R", () => window.location.reload());
  }

  update() {
    // ✅ Sin controles aquí (solo auto-walk)
  }
}

// ============================
// CUTSCENE CENSURADA (estilo Larry)
// ============================
class CurtainScene extends Phaser.Scene {
  constructor() {
    super("curtain");
  }

  create(data) {
    const totalScore = data?.totalScore ?? 0;

    this.cameras.main.setBackgroundColor("#120006");
    this.add.rectangle(BASE_W / 2, BASE_H / 2, BASE_W, BASE_H, 0x000000, 0.55);

    this.add.text(BASE_W / 2, 80, "ESCENA CENSURADA", { fontSize: "40px", fill: "#ffffff" }).setOrigin(0.5);
    this.add.text(BASE_W / 2, 130, `Puntaje total: ${totalScore}`, { fontSize: "22px", fill: "#ffffff" }).setOrigin(0.5);

    const leftCurtain = this.add.rectangle(-BASE_W * 0.25, BASE_H / 2, BASE_W * 0.55, BASE_H, 0x8b0016, 1);
    const rightCurtain = this.add.rectangle(BASE_W * 1.25, BASE_H / 2, BASE_W * 0.55, BASE_H, 0x8b0016, 1);

    for (let i = 0; i < 10; i++) {
      this.add.rectangle(60 + i * 80, BASE_H / 2, 10, BASE_H, 0x5a0010, 0.22);
    }

    const hearts = [];
    for (let i = 0; i < 10; i++) {
      const t = this.add.text(
        Phaser.Math.Between(200, 760),
        Phaser.Math.Between(220, 460),
        "❤",
        { fontSize: Phaser.Math.Between(24, 48) + "px", fill: "#ff4d6d" }
      ).setAlpha(0);
      hearts.push(t);
    }

    const behind = this.add.text(BASE_W / 2, BASE_H / 2, "…\n(Mmmm Travas - ruidos sospechosos - Take Take)\n…", {
      fontSize: "28px",
      fill: "#ffd6e0",
      align: "center"
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: leftCurtain,
      x: BASE_W * 0.27,
      duration: 650,
      ease: "Sine.easeOut"
    });

    this.tweens.add({
      targets: rightCurtain,
      x: BASE_W * 0.73,
      duration: 650,
      ease: "Sine.easeOut",
      onComplete: () => {
        behind.setAlpha(1);

        hearts.forEach((h, idx) => {
          this.time.delayedCall(idx * 120, () => {
            h.setAlpha(1);
            this.tweens.add({
              targets: h,
              y: h.y - Phaser.Math.Between(30, 80),
              alpha: 0,
              duration: 1200,
              ease: "Sine.easeOut"
            });
          });
        });

        this.tweens.add({
          targets: behind,
          x: BASE_W / 2 + 6,
          yoyo: true,
          repeat: 7,
          duration: 90
        });
      }
    });

    this.add.text(BASE_W / 2, 490, "Presiona R para reiniciar", { fontSize: "18px", fill: "#ffffff" }).setOrigin(0.5);
    this.input.keyboard.on("keydown-R", () => window.location.reload());
  }
}

// ============================
// CONFIG
// ============================
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
  scene: [PlayScene, FinalRoomScene, Level2Scene, FinalRoom2Scene, CurtainScene]
};

new Phaser.Game(config);
