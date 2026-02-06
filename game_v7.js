console.log("✅ GAME_V7 FINAL CARGADO (ESCENAS) — ZORRILLOS MÁS GRANDES");

const BASE_W = 960;
const BASE_H = 540;

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

    // ===== Fondo =====
    const bg = this.add.image(BASE_W / 2, BASE_H / 2, "bg");
    const cover = Math.max(BASE_W / bg.width, BASE_H / bg.height);
    bg.setScale(cover);

    // ===== Textura plataforma =====
    const g = this.add.graphics();
    g.fillStyle(0x111111, 0.92);
    g.fillRoundedRect(0, 0, 260, 30, 10);
    g.lineStyle(3, 0xffffff, 0.22);
    g.strokeRoundedRect(0, 0, 260, 30, 10);
    g.generateTexture("plat", 260, 30);
    g.destroy();

    // ===== Plataformas =====
    this.platforms = this.physics.add.staticGroup();

    const ground = this.platforms.create(BASE_W / 2, 520, "plat").setScale(4.2, 1.5);
    ground.refreshBody();

    const p1 = this.platforms.create(250, 410, "plat"); p1.refreshBody();
    const p2 = this.platforms.create(520, 330, "plat"); p2.refreshBody();
    const p3 = this.platforms.create(780, 250, "plat"); p3.refreshBody();
    const p4 = this.platforms.create(900, 180, "plat").setScale(1.2, 1); p4.refreshBody();

    const boundsFrom = (plat) => {
      const b = plat.getBounds();
      return { left: b.left + 18, right: b.right - 18 };
    };

    const bGround = boundsFrom(ground);
    const bP2 = boundsFrom(p2);

    // ===== Gordoso =====
    this.player = this.physics.add.sprite(90, 420, "gordoso");
    this.player.setOrigin(0.5, 0.88);
    this.player.setScale(0.10);
    this.player.setCollideWorldBounds(true);

    const pw = this.player.width * 0.45;
    const ph = this.player.height * 0.55;
    this.player.body.setSize(pw, ph);
    this.player.body.setOffset((this.player.width - pw) / 2, this.player.height - ph);

    this.physics.add.collider(this.player, this.platforms);

    // ===== Controles =====
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys({
      A: Phaser.Input.Keyboard.KeyCodes.A,
      D: Phaser.Input.Keyboard.KeyCodes.D,
      W: Phaser.Input.Keyboard.KeyCodes.W,
      R: Phaser.Input.Keyboard.KeyCodes.R
    });

    // ===== Hamburguesas (solo puntos) =====
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

    // ===== ZORRILLOS (MÁS GRANDES) =====
    this.skunks = this.physics.add.group();

    this.makeSkunkWalker(420, 470, bGround.left, bGround.right, 160);
    this.makeSkunkWalker(520, 0, bP2.left, bP2.right, 140);

    this.physics.add.collider(this.skunks, this.platforms);
    this.physics.add.overlap(this.player, this.skunks, () => this.gameOver(), null, this);

    // ===== Puerta =====
    this.door = this.physics.add.staticImage(930, 120, "door").setScale(0.16);
    this.door.refreshBody();
    this.physics.add.overlap(this.player, this.door, () => this.win(), null, this);

    // ===== UI =====
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
    if (this.ended) {
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

    if (jumpPressed && onGround) {
      this.player.setVelocityY(-580);
    }

    this.skunks.children.iterate((s) => {
      if (!s?.body) return;
      const dir = s.getData("dir");
      s.setVelocityX(dir * s.getData("speed"));
      if (s.x < s.getData("left")) s.setData("dir", 1);
      if (s.x > s.getData("right")) s.setData("dir", -1);
      s.setFlipX(s.getData("dir") < 0);
    });
  }

  // 🔥 FUNCIÓN CLAVE — ZORRILLOS GRANDES
  makeSkunkWalker(x, y, leftBound, rightBound, speed) {
    const s = this.physics.add.sprite(x, y, "skunk");

    // 👉 MÁS GRANDES AQUÍ
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

  gameOver() {
    if (this.ended) return;
    this.ended = true;
    this.physics.pause();
    this.player.setTint(0xff0000);

    this.add.rectangle(BASE_W / 2, BASE_H / 2, BASE_W, BASE_H, 0x000000, 0.55);
    this.add.text(BASE_W / 2, 115, "GAME OVER", { fontSize: "44px", fill: "#fff" }).setOrigin(0.5);
    this.add.text(BASE_W / 2, 165, "Te atrapó Toxin 😵", { fontSize: "20px", fill: "#fff" }).setOrigin(0.5);
    this.add.text(BASE_W / 2, 210, "Presiona R para reiniciar", { fontSize: "18px", fill: "#fff" }).setOrigin(0.5);
  }

  win() {
    if (this.ended) return;
    this.ended = true;
    this.scene.start("finalRoom", { score: this.score });
  }
}

class FinalRoomScene extends Phaser.Scene {
  constructor() {
    super("finalRoom");
  }

  create(data) {
    const score = data?.score ?? 0;

    this.cameras.main.setBackgroundColor("#1b1b1b");

    this.add.text(BASE_W / 2, 70, "¡RESCATE LOGRADO! 🇹🇭", {
      fontSize: "40px",
      fill: "#ffffff"
    }).setOrigin(0.5);

    this.add.text(BASE_W / 2, 118, `Hamburguesas: ${score}`, {
      fontSize: "22px",
      fill: "#ffffff"
    }).setOrigin(0.5);

    this.add.image(260, 360, "gordoso").setScale(0.15);
    this.add.image(520, 360, "girl").setScale(0.26);
    this.add.image(740, 360, "flag").setScale(0.18);

    this.add.text(BASE_W / 2, 470, "Presiona R para reiniciar", {
      fontSize: "18px",
      fill: "#ffffff"
    }).setOrigin(0.5);

    this.input.keyboard.on("keydown-R", () => window.location.reload());
  }
}

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
  scene: [PlayScene, FinalRoomScene]
};

new Phaser.Game(config);
