// game_v7.js (PC) — Gordoso + burgers + skunks + rescue ending
(() => {
  const WIDTH = 960;
  const HEIGHT = 540;

  const cfg = {
    type: Phaser.AUTO,
    width: WIDTH,
    height: HEIGHT,
    parent: "game",
    backgroundColor: "#000000",
    physics: {
      default: "arcade",
      arcade: {
        gravity: { y: 1200 },
        debug: false
      }
    },
    scene: { preload, create, update }
  };

  new Phaser.Game(cfg);

  let player, platforms, burgers, skunks, door;
  let keys, cursors;
  let score = 0, scoreText;
  let gameOver = false, won = false;

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
    // Fondo full-screen
    const bg = this.add.image(WIDTH / 2, HEIGHT / 2, "bg");
    bg.setDisplaySize(WIDTH, HEIGHT);

    // Textura simple para plataforma (sin archivo externo)
    const g = this.add.graphics();
    g.fillStyle(0x2f2f2f, 1);
    g.fillRoundedRect(0, 0, 240, 28, 10);
    g.lineStyle(3, 0x1a1a1a, 1);
    g.strokeRoundedRect(0, 0, 240, 28, 10);
    g.generateTexture("plat", 240, 28);
    g.destroy();

    // Plataformas
    platforms = this.physics.add.staticGroup();
    // Suelo grande
    platforms.create(WIDTH / 2, 520, "plat").setScale(5.2, 1.5).refreshBody();
    // Ledges
    platforms.create(260, 410, "plat").refreshBody();
    platforms.create(560, 330, "plat").refreshBody();
    platforms.create(820, 250, "plat").refreshBody();

    // Jugador
    player = this.physics.add.sprite(90, 420, "gordoso");
    player.setScale(0.17);
    player.setCollideWorldBounds(true);

    // Ajuste de hitbox (para que no “choque raro”)
    const bw = Math.max(10, player.width * 0.55);
    const bh = Math.max(10, player.height * 0.82);
    player.body.setSize(bw, bh, true);

    this.physics.add.collider(player, platforms);

    // Controles PC
    cursors = this.input.keyboard.createCursorKeys();
    keys = this.input.keyboard.addKeys({
      A: Phaser.Input.Keyboard.KeyCodes.A,
      D: Phaser.Input.Keyboard.KeyCodes.D,
      W: Phaser.Input.Keyboard.KeyCodes.W
    });

    // Hamburguesas
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
    this.physics.add.overlap(player, burgers, onBurger, null, this);

    // Zorrillos (enemigos)
    skunks = this.physics.add.group();

    spawnSkunk(this, 520, 100, 170);
    spawnSkunk(this, 740, 100, -170);

    this.physics.add.collider(skunks, platforms);
    this.physics.add.collider(player, skunks, onSkunk, null, this);

    // Puerta final (arriba a la derecha)
    door = this.physics.add.staticImage(915, 200, "door");
    door.setScale(0.18).refreshBody();

    this.physics.add.overlap(player, door, onDoor, null, this);

    // UI
    scoreText = this.add.text(14, 14, "🍔 0", {
      fontSize: "20px",
      fill: "#ffffff",
      backgroundColor: "rgba(0,0,0,0.45)",
      padding: { x: 10, y: 6 }
    });

    // Hint
    this.add.text(14, 46, "A/D mover • W o Espacio saltar", {
      fontSize: "14px",
      fill: "#ffffff",
      backgroundColor: "rgba(0,0,0,0.25)",
      padding: { x: 10, y: 6 }
    });

    // Reinicio rápido (R)
    this.input.keyboard.on("keydown-R", () => {
      // recarga la página (simple y efectivo en Pages)
      window.location.reload();
    });
  }

  function update() {
    if (gameOver || won) return;

    // Movimiento
    if (keys.A.isDown) {
      player.setVelocityX(-260);
    } else if (keys.D.isDown) {
      player.setVelocityX(260);
    } else {
      player.setVelocityX(0);
    }

    // Salto
    const onGround = player.body.blocked.down || player.body.touching.down;
    if ((keys.W.isDown || cursors.space.isDown) && onGround) {
      player.setVelocityY(-580);
    }
  }

  function onBurger(player, burger) {
    burger.disableBody(true, true);
    score += 1;
    scoreText.setText("🍔 " + score);
  }

  function onSkunk() {
    if (gameOver || won) return;
    gameOver = true;

    this.physics.pause();
    player.setTint(0xff0000);

    const panel = this.add.rectangle(WIDTH / 2, HEIGHT / 2, 560, 220, 0x000000, 0.6);
    panel.setStrokeStyle(2, 0xffffff, 0.6);

    this.add.text(WIDTH / 2, HEIGHT / 2 - 50, "GAME OVER", {
      fontSize: "44px",
      fill: "#ffffff"
    }).setOrigin(0.5);

    this.add.text(WIDTH / 2, HEIGHT / 2 + 10, "Te atrapó el zorrillo 😵", {
      fontSize: "20px",
      fill: "#ffffff"
    }).setOrigin(0.5);

    this.add.text(WIDTH / 2, HEIGHT / 2 + 55, "Presiona R para reiniciar", {
      fontSize: "18px",
      fill: "#ffffff"
    }).setOrigin(0.5);
  }

  function onDoor() {
    if (gameOver || won) return;
    won = true;

    this.physics.pause();
    player.setVelocity(0, 0);

    this.add.rectangle(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, 0x000000, 0.55);

    this.add.text(WIDTH / 2, 90, "¡RESCATE LOGRADO! 🇹🇭", {
      fontSize: "38px",
      fill: "#ffffff"
    }).setOrigin(0.5);

    // chica + bandera
    this.add.image(WIDTH / 2 - 120, HEIGHT / 2 + 40, "girl").setScale(0.22);
    this.add.image(WIDTH / 2 + 140, HEIGHT / 2 + 40, "flag").setScale(0.16);

    this.add.text(WIDTH / 2, 155, `Hamburguesas: ${score}`, {
      fontSize: "22px",
      fill: "#ffffff"
    }).setOrigin(0.5);

    this.add.text(WIDTH / 2, 200, "Presiona R para jugar otra vez", {
      fontSize: "18px",
      fill: "#ffffff"
    }).setOrigin(0.5);
  }

  function spawnSkunk(scene, x, y, vx) {
    const s = scene.physics.add.sprite(x, y, "skunk");
    s.setScale(0.16);
    s.setBounce(1);
    s.setCollideWorldBounds(true);
    s.setVelocityX(vx);
    // hitbox compacta
    const bw = Math.max(10, s.width * 0.7);
    const bh = Math.max(10, s.height * 0.7);
    s.body.setSize(bw, bh, true);
    skunks.add(s);
  }
})();
