console.log("✅ GAME_V7 FINAL CARGADO (ESCENAS)");

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

    // Fondo (cover)
    const bg = this.add.image(BASE_W / 2, BASE_H / 2, "bg");
    const cover = Math.max(BASE_W / bg.width, BASE_H / bg.height);
    bg.setScale(cover);

    // Textura plataforma (sin platform.png)
    const g = this.add.graphics();
    g.fillStyle(0x111111, 0.9);
    g.fillRoundedRect(0, 0, 260, 30, 10);
    g.lineStyle(3, 0xffffff, 0.25);
    g.strokeRoundedRect(0, 0, 260, 30, 10);
    g.generateTexture("plat", 260, 30);
    g.destroy();

    // Plataformas
    this.platforms = this.physics.add.staticGroup();
    this.platforms.create(BASE_W / 2, 520, "plat").setScale(4.2, 1.5).refreshBody(); // suelo
    this.platforms.create(250, 410, "plat").refreshBody();
    this.platforms.create(520, 330, "plat").refreshBody();
    this.platforms.create(780, 250, "plat").refreshBody();
    this.platforms.create(900, 180, "plat").setScale(1.2, 1).refreshBody();

    // Player
    this.player = this.physics.add.sprite(90, 420, "gordoso");
    this.player.setScale(0.085);
    this.player.setCollideWorldBounds(true);
    this.player.body.setSize(this.player.width * 0.5, this.player.height * 0.7, true);
    this.physics.add.collider(this.player, this.platforms);

    // Controles: A/D + Flechas + W/Space + Flecha arriba
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
      repeat: 6,
      setXY: { x: 160, y: 0, stepX: 120 }
    });

    this.burgers.children.iterate((b) => {
      b.setScale(0.10);
      b.setBounce(0.2);
      b.setCollideWorldBounds(true);
    });

    this.physics.add.collider(this.burgers, this.platforms);
    this.physics.add.overlap(this.player, this.burgers, (p, b) => {
      b.disableBody(true, true);
      this.score++;
      this.scoreText.setText("🍔 " + this.score);
    });

    // Zorrillos patrullando
    this.skunks = this.physics.add.group();
    this.makeSkunk(520, 470, 180);
    this.makeSkunk(720, 470, -180);

    this.physics.add.collider(this.skunks, this.platforms);
    this.physics.add.collider(this.player, this.skunks, () => this.gameOver(), null, this);

    // Puerta final
    this.door = this.physics.add.staticImage(930, 120, "door").setScale(0.16).refreshBody();
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
    if (this.ended) {
      if (this.keys.R.isDown) window.location.reload();
      return;
    }

    // Izquierda / derecha: A/D o flechas
    const left = this.keys.A.isDown || this.cursors.left.isDown;
    const right = this.keys.D.isDown || this.cursors.right.isDown;

    if (left) this.player.setVelocityX(-260);
    else if (right) this.player.setVelocityX(260);
    else this.player.setVelocityX(0);

    // Salto: W o Espacio o Flecha arriba
    const onGround = this.player.body.blocked.down || this.player.body.touching.down;
    const jumpPressed = this.keys.W.isDown || this.cursors.space.isDown || this.cursors.up.isDown;

    if (jumpPressed && onGround) {
      this.player.setVelocityY(-580);
    }

    // Anti-freeze para zorrillos
    this.skunks.children.iterate((s) => {
      if (!s?.body) return;
      if (Math.abs(s.body.velocity.x) < 10) {
        s.setVelocityX(s.getData("dir") * 180);
      }
    });
  }

  makeSkunk(x, y, vx) {
    const s = this.physics.add.sprite(x, y, "skunk");
    s.setScale(0.40);
    s.setBounce(1);
    s.setCollideWorldBounds(true);
    s.setVelocityX(vx);
    s.setData("dir", vx >= 0 ? 1 : -1);
    s.body.setSize(s.width * 0.65, s.height * 0.7, true);
    this.skunks.add(s);
  }

  gameOver() {
    if (this.ended) return;
    this.ended = true;
    this.physics.pause();
    this.player.setTint(0xff0000);

    this.add.rectangle(BASE_W / 2, BASE_H / 2, BASE_W, BASE_H, 0x000000, 0.55);
    this.add.text(BASE_W / 2, 115, "GAME OVER", { fontSize: "44px", fill: "#fff" }).setOrigin(0.5);
    this.add.text(BASE_W / 2, 165, "Te atrapó el zorrillo 😵", { fontSize: "20px", fill: "#fff" }).setOrigin(0.5);
    this.add.text(BASE_W / 2, 210, "Presiona R para reiniciar", { fontSize: "18px", fill: "#fff" }).setOrigin(0.5);
  }

  win() {
    if (this.ended) return;
    this.ended = true;

    // Cambia a otra pantalla (otra escena)
    this.scene.start("finalRoom", { score: this.score });
  }
}

class FinalRoomScene extends Phaser.Scene {
  constructor() {
    super("finalRoom");
  }

  create(data) {
    const score = data?.score ?? 0;

    // Fondo "cuarto" simple (sin assets extra)
    this.cameras.main.setBackgroundColor("#1b1b1b");
    this.add.rectangle(BASE_W / 2, BASE_H / 2, BASE_W - 120, BASE_H - 120, 0x2a2a2a, 1).setStrokeStyle(6, 0x111111, 1);

    // “Luz” en el cuarto
    this.add.circle(BASE_W / 2, 120, 55, 0xffe08a, 0.18);
    this.add.circle(BASE_W / 2, 120, 28, 0xffe08a, 0.25);

    // Texto
    this.add.text(BASE_W / 2, 70, "¡RESCATE LOGRADO! 🇹🇭", {
      fontSize: "40px",
      fill: "#ffffff"
    }).setOrigin(0.5);

    this.add.text(BASE_W / 2, 118, `Hamburguesas: ${score}`, {
      fontSize: "22px",
      fill: "#ffffff"
    }).setOrigin(0.5);

    // Personajes (Gordoso + chica + bandera)
    this.add.image(260, 360, "gordoso").setScale(0.15);
    this.add.image(520, 360, "girl").setScale(0.26);
    this.add.image(740, 360, "flag").setScale(0.18);

    // Mensaje final
    this.add.text(BASE_W / 2, 470, "Presiona R para reiniciar", {
      fontSize: "18px",
      fill: "#ffffff"
    }).setOrigin(0.5);

    // R reinicia
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

