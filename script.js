class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    preload() {
        // Create graphics for assets programmatically to avoid external asset loading issues
        this.createPlayerTexture();
        this.createEnemyTexture();
        this.createBulletTexture();
        this.createLootTextures();
        this.createEnvironmentTextures();
    }

    createPlayerTexture() {
        const graphics = this.make.graphics({ x: 0, y: 0, add: false });
        graphics.fillStyle(0x3498db, 1); // Blue
        graphics.fillCircle(16, 16, 16);
        // Hands
        graphics.fillStyle(0x2c3e50, 1);
        graphics.fillCircle(32, 10, 6);
        graphics.fillCircle(32, 22, 6);
        graphics.generateTexture('player', 40, 32);
    }

    createEnemyTexture() {
        const graphics = this.make.graphics({ x: 0, y: 0, add: false });
        graphics.fillStyle(0xe74c3c, 1); // Red
        graphics.fillCircle(16, 16, 16);
        // Hands
        graphics.fillStyle(0xc0392b, 1);
        graphics.fillCircle(32, 10, 6);
        graphics.fillCircle(32, 22, 6);
        graphics.generateTexture('enemy', 40, 32);
    }

    createBulletTexture() {
        const graphics = this.make.graphics({ x: 0, y: 0, add: false });
        graphics.fillStyle(0xffff00, 1);
        graphics.fillCircle(4, 4, 4);
        graphics.generateTexture('bullet', 8, 8);
    }

    createLootTextures() {
        // Health Pack
        let graphics = this.make.graphics({ x: 0, y: 0, add: false });
        graphics.fillStyle(0xffffff, 1);
        graphics.fillRect(0, 0, 20, 20);
        graphics.fillStyle(0xff0000, 1);
        graphics.fillRect(8, 2, 4, 16);
        graphics.fillRect(2, 8, 16, 4);
        graphics.generateTexture('loot_health', 20, 20);

        // Ammo Box
        graphics = this.make.graphics({ x: 0, y: 0, add: false });
        graphics.fillStyle(0x2ecc71, 1);
        graphics.fillRect(0, 0, 20, 20);
        graphics.fillStyle(0x27ae60, 1);
        graphics.fillRect(2, 2, 16, 16);
        graphics.generateTexture('loot_ammo', 20, 20);

        // Weapon (Generic Gun shape options)
        graphics = this.make.graphics({ x: 0, y: 0, add: false });
        graphics.fillStyle(0x95a5a6, 1);
        graphics.fillRect(0, 0, 24, 8);
        graphics.fillStyle(0x7f8c8d, 1);
        graphics.fillRect(4, 0, 4, 12);
        graphics.generateTexture('loot_weapon', 24, 12);
    }

    createEnvironmentTextures() {
        // Grass Texture
        let graphics = this.make.graphics({ x: 0, y: 0, add: false });
        graphics.fillStyle(0x2ecc71, 1); // Base green
        graphics.fillRect(0, 0, 64, 64);
        graphics.fillStyle(0x27ae60, 0.5); // Darker patches
        for (let i = 0; i < 10; i++) {
            graphics.fillCircle(Phaser.Math.Between(0, 64), Phaser.Math.Between(0, 64), 2);
        }
        graphics.generateTexture('bg_grass', 64, 64);

        // Tree
        graphics = this.make.graphics({ x: 0, y: 0, add: false });
        graphics.fillStyle(0x27ae60, 0.8);
        graphics.fillCircle(24, 24, 24);
        graphics.fillStyle(0x2ecc71, 0.8);
        graphics.fillCircle(16, 16, 12);
        graphics.generateTexture('tree', 48, 48);

        // Rock
        graphics = this.make.graphics({ x: 0, y: 0, add: false });
        graphics.fillStyle(0x7f8c8d, 1);
        graphics.fillCircle(16, 16, 16);
        graphics.generateTexture('rock', 32, 32);
    }

    create() {
        this.scene.start('MenuScene');
    }
}

class MenuScene extends Phaser.Scene {
    constructor() {
        super('MenuScene');
    }

    create() {
        this.add.text(this.cameras.main.centerX, 100, 'BATTLE ARENA', {
            fontSize: '48px',
            fill: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(this.cameras.main.centerX, 160, 'Use WASD to Move, Mouse to Aim/Shoot', {
            fontSize: '20px',
            fill: '#cccccc'
        }).setOrigin(0.5);

        // Buttons for CPU count
        this.createButton(250, 'Start (20 CPUs)', 20);
        this.createButton(320, 'Start (50 CPUs)', 50);
        this.createButton(390, 'Start (100 CPUs)', 100);
    }

    createButton(y, text, cpuCount) {
        const bg = this.add.rectangle(this.cameras.main.centerX, y, 300, 50, 0x34495e)
            .setInteractive({ useHandCursor: true });

        const label = this.add.text(this.cameras.main.centerX, y, text, {
            fontSize: '24px',
            fill: '#ffffff'
        }).setOrigin(0.5);

        bg.on('pointerover', () => bg.setFillStyle(0x2c3e50));
        bg.on('pointerout', () => bg.setFillStyle(0x34495e));
        bg.on('pointerdown', () => this.startGame(cpuCount));
    }

    startGame(cpuCount) {
        this.scene.start('GameScene', { cpuCount: cpuCount });
    }
}

class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    init(data) {
        this.cpuCount = data.cpuCount || 20;
        this.kills = 0;
        this.aliveCount = this.cpuCount + 1; // +1 for player
    }

    create() {
        // Map Setup
        this.physics.world.setBounds(0, 0, 2000, 2000);
        this.add.tileSprite(1000, 1000, 2000, 2000, 'bg_grass');
        this.cameras.main.setBackgroundColor('#2ecc71'); // Grass Color

        // Groups
        this.obstacles = this.physics.add.staticGroup();
        this.bullets = this.physics.add.group({ classType: Bullet, runChildUpdate: true });
        this.enemies = this.physics.add.group({ runChildUpdate: true });
        this.loot = this.physics.add.group();

        // Create Environment (More Props + Safety Zone)
        for (let i = 0; i < 400; i++) {
            let x = Phaser.Math.Between(0, 2000);
            let y = Phaser.Math.Between(0, 2000);

            // Safety Check: Don't spawn on player (center)
            let attempts = 0;
            while (Phaser.Math.Distance.Between(x, y, 1000, 1000) < 150 && attempts < 10) {
                x = Phaser.Math.Between(0, 2000);
                y = Phaser.Math.Between(0, 2000);
                attempts++;
            }
            if (attempts >= 10) continue;

            const type = Phaser.Math.RND.pick(['tree', 'rock']);
            if (type === 'tree') {
                const tree = this.add.sprite(x, y, 'tree');
                tree.setDepth(10);
            } else {
                this.obstacles.create(x, y, 'rock').refreshBody();
            }
        }

        // Create Player
        this.player = new Player(this, 1000, 1000);

        // Create Enemies
        for (let i = 0; i < this.cpuCount; i++) {
            let x = Phaser.Math.Between(0, 2000);
            let y = Phaser.Math.Between(0, 2000);
            // Ensure not too close to player
            while (Phaser.Math.Distance.Between(x, y, this.player.x, this.player.y) < 200) {
                x = Phaser.Math.Between(0, 2000);
                y = Phaser.Math.Between(0, 2000);
            }
            this.enemies.add(new Enemy(this, x, y));
        }

        // Create Loot with Backpacks
        for (let i = 0; i < 50; i++) {
            const x = Phaser.Math.Between(0, 2000);
            const y = Phaser.Math.Between(0, 2000);
            const type = Phaser.Math.RND.pick(['loot_health', 'loot_ammo', 'loot_weapon', 'loot_backpack1', 'loot_backpack2', 'loot_backpack3']);
            const item = this.loot.create(x, y, type);
            item.type = type;
            // Visual for backpacks if texture missing
            if (!this.textures.exists(type)) {
                item.setTexture('loot_weapon');
                item.setTint(0x0000ff);
            }
        }

        // Camera
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
        this.cameras.main.setBounds(0, 0, 2000, 2000);

        // Collisions
        this.physics.add.collider(this.player, this.obstacles);
        this.physics.add.collider(this.enemies, this.obstacles);
        this.physics.add.collider(this.enemies, this.enemies);
        this.physics.add.collider(this.player, this.enemies); // Push each other

        // Bullet Collisions
        this.physics.add.overlap(this.bullets, this.obstacles, (bullet, obstacle) => {
            bullet.destroy();
        });

        this.physics.add.overlap(this.bullets, this.enemies, (bullet, enemy) => {
            if (bullet.owner !== enemy) {
                enemy.takeDamage(bullet.damage, bullet.owner);
                bullet.destroy();
            }
        });

        this.physics.add.overlap(this.bullets, this.player, (bullet, player) => {
            if (bullet.owner !== player) {
                player.takeDamage(bullet.damage);
                bullet.destroy();
            }
        });

        // Looting
        this.physics.add.overlap(this.player, this.loot, (player, item) => {
            player.collectLoot(item);
            item.destroy();
        });

        // Start UI
        this.scene.launch('UIScene');
        this.events.on('wake', () => {
            this.scene.run('UIScene');
        });

        // Zone Logic
        this.zoneRadius = 3000;
        this.zoneTimer = this.time.addEvent({
            delay: 1000,
            callback: this.shrinkZone,
            callbackScope: this,
            loop: true
        });

        // World/Zone circle visuals (simple graphics)
        this.zoneGraphics = this.add.graphics();
        this.updateZoneVisuals();
    }

    update(time, delta) {
        this.player.update(time, delta);

        // Clean up dead bullets? (Auto handled by Physics world bounds usually, but we have big bounds)
        this.bullets.children.each(b => {
            if (b.active && (b.x < 0 || b.x > 2000 || b.y < 0 || b.y > 2000)) {
                b.destroy();
            }
        });

        // Zone Check Player
        const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, 1000, 1000);
        if (dist > this.zoneRadius) {
            this.player.takeDamage(0.1); // Zone damage
        }

        // Zone Check Enemies
        this.enemies.children.each(enemy => {
            const eDist = Phaser.Math.Distance.Between(enemy.x, enemy.y, 1000, 1000);
            if (eDist > this.zoneRadius) {
                enemy.takeDamage(0.1, null); // Zone damage (null attacker)
            }
        });
    }

    shrinkZone() {
        if (this.zoneRadius > 200) {
            this.zoneRadius -= 10;
            this.updateZoneVisuals();
        }
    }

    updateZoneVisuals() {
        this.zoneGraphics.clear();
        this.zoneGraphics.lineStyle(5, 0xff0000, 0.5);
        this.zoneGraphics.strokeCircle(1000, 1000, this.zoneRadius);
    }

    enemyKilled(killer) {
        this.aliveCount--;
        if (killer === this.player) {
            this.kills++;
        }
        this.events.emit('updateUI', { alive: this.aliveCount });
        if (this.aliveCount <= 1) {
            this.endGame(true);
        }
    }

    endGame(won) {
        this.scene.stop('UIScene');
        this.scene.start('GameOverScene', { won: won, kills: this.kills });
    }
}

class UIScene extends Phaser.Scene {
    constructor() {
        super('UIScene');
    }

    create() {
        this.aliveText = this.add.text(20, 20, 'Alive: ?', { fontSize: '24px', fill: '#ffffff', stroke: '#000', strokeThickness: 4 });
        this.healthText = this.add.text(20, 50, 'Health: 100', { fontSize: '24px', fill: '#00ff00', stroke: '#000', strokeThickness: 4 });
        this.ammoText = this.add.text(20, 80, 'Ammo: ∞', { fontSize: '24px', fill: '#ffff00', stroke: '#000', strokeThickness: 4 });
        this.weaponText = this.add.text(20, 110, 'Weapon: Pistol', { fontSize: '24px', fill: '#ffffff', stroke: '#000', strokeThickness: 4 });

        const gameScene = this.scene.get('GameScene');
        gameScene.events.on('updateUI', this.updateStats, this);

        // Initial update
        this.updateStats({ alive: gameScene.aliveCount, health: 100, ammo: '∞' });
    }

    updateStats(data) {
        if (data.alive !== undefined) this.aliveText.setText(`Alive: ${data.alive}`);
        if (data.health !== undefined) {
            this.healthText.setText(`Health: ${Math.floor(data.health)}`);
            this.healthText.setColor(data.health > 30 ? '#00ff00' : '#ff0000');
        }
        if (data.ammo !== undefined) {
            const ammoDisplay = (data.ammo === Infinity || data.ammo === '∞') ? '∞' : data.ammo;
            this.ammoText.setText(`Ammo: ${ammoDisplay}`);
        }
        if (data.activeSlot !== undefined) this.activeSlot = data.activeSlot;
        if (data.maxSlots !== undefined) this.maxSlots = data.maxSlots;

        if (data.inventory !== undefined || data.maxSlots !== undefined || data.activeSlot !== undefined) {
            // Rebuild inventory display
            const inv = data.inventory || (this.scene.get('GameScene').player?.inventory || ['Pistol']);
            const max = data.maxSlots || (this.scene.get('GameScene').player?.maxSlots || 2);
            const active = data.activeSlot !== undefined ? data.activeSlot : (this.scene.get('GameScene').player?.activeSlot || 0);

            let text = 'Slots: ';
            for (let i = 0; i < max; i++) {
                const item = inv[i] || '[Empty]';
                if (i === active) {
                    text += `[${i + 1}:${item}] `;
                } else {
                    text += `${i + 1}:${item} `;
                }
            }
            this.weaponText.setText(text);
        }
    }
}

class GameOverScene extends Phaser.Scene {
    constructor() {
        super('GameOverScene');
    }

    init(data) {
        this.won = data.won;
        this.kills = data.kills;
    }

    create() {
        const title = this.won ? 'VICTORY ROYALE!' : 'GAME OVER';
        const color = this.won ? '#f1c40f' : '#e74c3c';

        // High Score Logic
        const currentHigh = parseInt(localStorage.getItem('battleArenaHighScore')) || 0;
        if (this.kills > currentHigh) {
            localStorage.setItem('battleArenaHighScore', this.kills);
        }
        const displayHigh = Math.max(currentHigh, this.kills);

        this.add.text(this.cameras.main.centerX, 150, title, {
            fontSize: '64px',
            fill: color,
            fontStyle: 'bold',
            stroke: '#000', strokeThickness: 6
        }).setOrigin(0.5);

        this.add.text(this.cameras.main.centerX, 250, `Kills: ${this.kills}`, {
            fontSize: '48px',
            fill: '#ffffff'
        }).setOrigin(0.5);

        this.add.text(this.cameras.main.centerX, 320, `High Score: ${displayHigh}`, {
            fontSize: '32px',
            fill: '#f1c40f'
        }).setOrigin(0.5);

        const btn = this.add.rectangle(this.cameras.main.centerX, 450, 200, 50, 0x34495e)
            .setInteractive({ useHandCursor: true });

        const label = this.add.text(this.cameras.main.centerX, 450, 'Main Menu', {
            fontSize: '24px',
            fill: '#ffffff'
        }).setOrigin(0.5);

        btn.on('pointerdown', () => this.scene.start('MenuScene'));
    }
}

// --- Game Objects ---

const WEAPONS = {
    'Pistol': { damage: 15, speed: 600, fireRate: 400, spread: 0, mag: Infinity, reload: 0, count: 1 },
    'Machine Gun': { damage: 5, speed: 800, fireRate: 100, spread: 0, mag: 100, reload: 2000, count: 1 },
    'Mac10': { damage: 5, speed: 700, fireRate: 60, spread: 0.2, mag: Infinity, reload: 0, count: 1 }, // Infinite mag as requested
    'Double Barrel': { damage: 5, speed: 700, fireRate: 200, spread: 0.05, mag: 2, reload: 1500, count: 6 }, // 6 pellets
    'Breacher Shotgun': { damage: 5, speed: 600, fireRate: 500, spread: 0.3, mag: 6, reload: 2000, count: 8 }, // 8 pellets
    'Sniper Rifle': { damage: 50, speed: 2000, fireRate: 1000, spread: 0, mag: 1, reload: 1500, count: 1 },
    'AWP': { damage: 100, speed: 3000, fireRate: 1500, spread: 0, mag: 1, reload: 2000, count: 1 }
};

class Bullet extends Phaser.Physics.Arcade.Image {
    constructor(scene, x, y) {
        super(scene, x, y, 'bullet');
    }

    fire(owner, x, y, rotation, speed, damage) {
        this.owner = owner; // Store who shot this to avoid self-damage
        this.enableBody(true, x, y, true, true);
        this.setRotation(rotation);

        this.scene.physics.velocityFromRotation(rotation, speed, this.body.velocity);
        this.damage = damage;
        this.lifespan = 2000; // 2 seconds
    }

    update(time, delta) {
        this.lifespan -= delta;
        if (this.lifespan <= 0) {
            this.destroy();
        }
    }
}

class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'player');
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.setCollideWorldBounds(true);
        this.setDepth(5);

        this.health = 100;
        this.speed = 200;
        this.isDead = false;

        // Inventory System
        this.inventory = ['Pistol'];
        this.activeSlot = 0;
        this.maxSlots = 2; // Default 2 slots

        // Weapons
        this.weapon = this.inventory[0];
        this.ammo = WEAPONS[this.weapon].mag;
        this.nextFire = 0;
        this.isReloading = false;

        // Controls
        this.cursors = scene.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D,
            reload: Phaser.Input.Keyboard.KeyCodes.R,
            slot1: Phaser.Input.Keyboard.KeyCodes.ONE,
            slot2: Phaser.Input.Keyboard.KeyCodes.TWO,
            slot3: Phaser.Input.Keyboard.KeyCodes.THREE,
            slot4: Phaser.Input.Keyboard.KeyCodes.FOUR,
            slot5: Phaser.Input.Keyboard.KeyCodes.FIVE
        });

        scene.input.on('pointerdown', () => this.shoot());

        // Update UI
        scene.events.emit('updateUI', {
            health: this.health,
            weapon: this.weapon,
            ammo: this.ammo,
            inventory: this.inventory,
            activeSlot: this.activeSlot,
            maxSlots: this.maxSlots
        });
    }

    update(time, delta) {
        if (this.isDead) return;

        this.body.setVelocity(0);

        if (this.cursors.left.isDown) this.body.setVelocityX(-this.speed);
        else if (this.cursors.right.isDown) this.body.setVelocityX(this.speed);

        if (this.cursors.up.isDown) this.body.setVelocityY(-this.speed);
        else if (this.cursors.down.isDown) this.body.setVelocityY(this.speed);

        if (this.cursors.reload.isDown) this.reload();

        if (Phaser.Input.Keyboard.JustDown(this.cursors.slot1)) this.switchSlot(0);
        if (Phaser.Input.Keyboard.JustDown(this.cursors.slot2)) this.switchSlot(1);
        if (Phaser.Input.Keyboard.JustDown(this.cursors.slot3)) this.switchSlot(2);
        if (Phaser.Input.Keyboard.JustDown(this.cursors.slot4)) this.switchSlot(3);
        if (Phaser.Input.Keyboard.JustDown(this.cursors.slot5)) this.switchSlot(4);

        // Rotate towards mouse
        const pointer = this.scene.input.activePointer;
        // Adjust for camera scroll
        const worldPoint = pointer.positionToCamera(this.scene.cameras.main);
        const angle = Phaser.Math.Angle.Between(this.x, this.y, worldPoint.x, worldPoint.y);
        this.setRotation(angle);

        // Auto-fire for automatics if mouse held
        if (pointer.isDown && (this.weapon === 'Machine Gun' || this.weapon === 'Mac10')) {
            this.shoot();
        }
    }

    reload() {
        const stats = WEAPONS[this.weapon];
        if (this.isReloading || stats.mag === Infinity || this.ammo >= stats.mag) return;

        this.isReloading = true;
        this.scene.events.emit('updateUI', { ammo: 'Reloading...' });

        this.scene.time.delayedCall(stats.reload, () => {
            this.ammo = stats.mag;
            this.isReloading = false;
            this.scene.events.emit('updateUI', { ammo: this.ammo });
        }, [], this);
    }

    shoot() {
        if (this.isDead || this.scene.time.now < this.nextFire || this.isReloading) return;

        const stats = WEAPONS[this.weapon];

        if (this.ammo <= 0 && stats.mag !== Infinity) {
            this.reload();
            return;
        }

        // Fire
        const count = stats.count || 1;
        const spreadBase = stats.spread || 0;

        for (let i = 0; i < count; i++) {
            const bullet = this.scene.bullets.get();
            if (bullet) {
                const spread = Phaser.Math.FloatBetween(-spreadBase, spreadBase);
                bullet.fire(this, this.x, this.y, this.rotation + spread, stats.speed, stats.damage);
            }
        }

        this.nextFire = this.scene.time.now + stats.fireRate;

        if (stats.mag !== Infinity) {
            this.ammo--;
            this.scene.events.emit('updateUI', { ammo: this.ammo });
            if (this.ammo <= 0) {
                this.reload(); // Auto reload on empty
            }
        }
    }

    takeDamage(amount) {
        if (this.isDead) return;
        this.health -= amount;
        this.scene.events.emit('updateUI', { health: this.health });

        this.setTint(0xff0000);
        this.scene.time.delayedCall(100, () => this.clearTint());

        if (this.health <= 0) {
            this.die();
        }
    }

    die() {
        this.isDead = true;
        this.setAlpha(0.5);
        this.scene.endGame(false);
    }

    switchSlot(index) {
        if (index >= this.maxSlots) return; // Keep it simple, allow switching to empty slots? Or just valid ones? If empty, do nothing.
        const item = this.inventory[index];
        if (!item) return;

        this.activeSlot = index;
        this.weapon = item;
        this.ammo = WEAPONS[this.weapon].mag; // Reset ammo on switch for simplicity? Or track per slot?
        // For prototype, reset ammo or keep global?
        // User didn't specify. I'll reset ammo to avoid complexity of tracking ammo per slot.
        this.isReloading = false;

        this.scene.events.emit('updateUI', {
            weapon: this.weapon,
            ammo: this.ammo,
            activeSlot: this.activeSlot,
            inventory: this.inventory
        });
    }

    collectLoot(item) {
        if (item.type === 'loot_health') {
            this.health = Math.min(100, this.health + 50);
            this.scene.events.emit('updateUI', { health: this.health });
        } else if (item.type === 'loot_ammo') {
            // Refill current mag
            this.ammo = WEAPONS[this.weapon].mag;
            this.scene.events.emit('updateUI', { ammo: this.ammo });
        } else if (item.type === 'loot_weapon') {
            const keys = Object.keys(WEAPONS);
            const newWep = Phaser.Math.RND.pick(keys.filter(k => k !== 'Pistol'));

            // Add to Inventory Logic
            if (this.inventory.length < this.maxSlots) {
                this.inventory.push(newWep);
                this.switchSlot(this.inventory.length - 1);
            } else {
                // Replace current
                this.inventory[this.activeSlot] = newWep;
                this.switchSlot(this.activeSlot);
            }

            this.scene.events.emit('updateUI', {
                inventory: this.inventory,
                activeSlot: this.activeSlot,
                maxSlots: this.maxSlots
            });

        } else if (item.type.startsWith('loot_backpack')) {
            let level = 1;
            if (item.type === 'loot_backpack2') level = 2;
            if (item.type === 'loot_backpack3') level = 3;

            const newSlots = 2 + level; // Lvl 1->3, Lvl 2->4, Lvl 3->5
            if (newSlots > this.maxSlots) {
                this.maxSlots = newSlots;
                this.scene.events.emit('updateUI', { maxSlots: this.maxSlots, inventory: this.inventory });
            }
        }
    }
}

class Enemy extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'enemy');
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.setCollideWorldBounds(true);
        this.setDepth(5);

        this.health = 50;
        this.speed = 100;
        this.state = 'WANDER'; // WANDER, CHASE
        this.nextDecision = 0;
        this.target = scene.player;
    }

    update(time, delta) {
        if (this.health <= 0) return; // Should be dead, but just in case

        // AI Logic
        const distToPlayer = Phaser.Math.Distance.Between(this.x, this.y, this.target.x, this.target.y);

        if (time > this.nextDecision) {
            // Check for nearby enemies to shoot if player is far? For now focus on player
            if (distToPlayer < 400 && !this.target.isDead) {
                this.state = 'CHASE';
            } else {
                this.state = 'WANDER';
            }
            this.nextDecision = time + Phaser.Math.Between(500, 2000);
        }

        if (this.state === 'CHASE') {
            if (this.target.isDead) {
                this.state = 'WANDER';
                return;
            }
            // Move towards player
            this.scene.physics.moveToObject(this, this.target, this.speed);

            // Aim at player
            const angle = Phaser.Math.Angle.Between(this.x, this.y, this.target.x, this.target.y);
            this.setRotation(angle);

            // Shoot
            if (distToPlayer < 300 && Phaser.Math.Between(0, 100) > 95) {
                // Occasional shoot
                const bullet = this.scene.bullets.get();
                if (bullet) {
                    bullet.fire(this, this.x, this.y, this.rotation, 500, 5);
                }
            }

        } else if (this.state === 'WANDER') {
            // Random movement already set by velocity? 
            if (this.body.velocity.length() < 10) {
                const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
                this.scene.physics.velocityFromRotation(angle, this.speed * 0.5, this.body.velocity);
                this.setRotation(angle);
            }
        }
    }

    takeDamage(amount, attacker) {
        this.health -= amount;
        this.setTint(0xffffff);
        this.scene.time.delayedCall(100, () => this.clearTint());

        if (this.health <= 0) {
            this.die(attacker);
        } else {
            // Aggro
            this.state = 'CHASE';
        }
    }

    die(killer) {
        // Drop loot?
        if (Phaser.Math.Between(0, 100) > 50) {
            const type = Phaser.Math.RND.pick(['loot_health', 'loot_ammo', 'loot_weapon']);
            this.scene.loot.create(this.x, this.y, type).type = type;
        }

        this.destroy();
        this.scene.enemyKilled(killer);
    }
}

// Config at end to ensure classes are defined
const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: '#2d2d2d',
    parent: 'game-container',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [BootScene, MenuScene, GameScene, UIScene, GameOverScene]
};

const game = new Phaser.Game(config);

window.addEventListener('resize', () => {
    game.scale.resize(window.innerWidth, window.innerHeight);
});
