import { Container, Sprite, Text, Graphics } from "pixi.js";
import gsap from "gsap";

export default class Wheel extends Container {
  
  constructor(lettersString) {
    super();
    
    // --- AYARLAR ---
    this.letters = lettersString.split(',');
    this.radius = 85; 
    
    // --- DEĞİŞKENLER ---
    this.letterObjects = []; 
    this.selectedLetters = [];
    this.isDragging = false;
    this.isTutorialPlaying = false; 
    this.isLocked = false; 

    // --- KURULUM ---
    this.createWheelBackground(); 
    this.createLineGraphics();    
    this.createShuffleButton();   
    this.placeLetters();          
    this.createPreviewBox();      
    this.createHintBox();         
    this.createHand();            

    // --- INPUT ---
    this.eventMode = 'static';
    this.on('pointerdown', this.onUserInteraction.bind(this)); 
    this.on('pointermove', this.onPointerMove.bind(this));
    this.on('pointerup', this.onPointerUp.bind(this));
    this.on('pointerupoutside', this.onPointerUp.bind(this));
  }

  // ============================================================
  // 1. GÖRSEL OLUŞTURMA
  // ============================================================

  createWheelBackground() {
    const bg = new Graphics();
    bg.beginFill(0xFFFFFF, 0.7); 
    bg.drawCircle(0, 0, this.radius + 45); 
    bg.endFill();
    this.addChild(bg);
  }

  createLineGraphics() {
    this.currentLine = new Graphics();
    this.addChild(this.currentLine);
  }

  createPreviewBox() {
    this.previewContainer = new Container();
    this.previewContainer.y = -180; 
    this.previewContainer.visible = false;
    this.addChild(this.previewContainer);

    this.previewBg = new Graphics();
    this.previewContainer.addChild(this.previewBg);

    this.previewText = new Text("", {
      fontFamily: "Sniglet-Regular", fontSize: 45, fill: "#ffffff", fontWeight: "bold"
    });
    this.previewText.anchor.set(0.5);
    this.previewContainer.addChild(this.previewText);
  }

  createHintBox() {
    this.hintContainer = new Container();
    this.hintContainer.y = -330; 
    this.hintContainer.visible = false; 
    this.hintContainer.alpha = 0;
    this.addChild(this.hintContainer);

    this.hintBg = Sprite.from("green_pane"); 
    this.hintBg.anchor.set(0.5);
    this.hintBg.width = 340; 
    this.hintBg.height = 35; 
    this.hintContainer.addChild(this.hintBg);

    this.hintText = new Text("", {
      fontFamily: "Sniglet-Regular", fontSize: 28, fill: "#ffffff", fontWeight: "bold"
    });
    this.hintText.anchor.set(0.5);
    this.hintContainer.addChild(this.hintText);
  }

  createShuffleButton() {
    const btn = Sprite.from("shuffle");
    btn.anchor.set(0.5);
    btn.width = 60; btn.height = 60; 
    this.btnBaseScale = btn.scale.x; 

    btn.eventMode = 'static';
    btn.cursor = 'pointer';
    btn.on('pointerdown', (e) => {
        e.stopPropagation(); 
        // Kilitliyse karıştırmaya izin verme
        if (this.isLocked) return;

        this.onUserInteraction(); 
        this.playShuffleAnimation(btn); 
        this.shuffleLetters(); 
    });
    this.addChild(btn);
  }

  createHand() {
    this.hand = Sprite.from("hand");
    this.hand.anchor.set(0.1, 0.1); 
    this.hand.scale.set(0.4); 
    this.hand.visible = false;
    this.hand.alpha = 0; 
    this.hand.zIndex = 100; 
    this.hand.eventMode = 'none'; 
    this.addChild(this.hand);
  }

  placeLetters() {
    this.letterObjects.forEach(item => item.destroy());
    this.letterObjects = [];
    const total = this.letters.length;
    const step = (Math.PI * 2) / total;

    for (let i = 0; i < total; i++) {
      const angle = i * step - (Math.PI / 2);
      const x = Math.cos(angle) * this.radius;
      const y = Math.sin(angle) * this.radius;

      const letterCont = new Container();
      letterCont.x = x; letterCont.y = y;
      letterCont.charValue = this.letters[i];

      const bg = Sprite.from("circle");
      bg.anchor.set(0.5); bg.tint = 0xFFA500; 
      bg.width = 80; bg.height = 80; bg.visible = false; 
      letterCont.bg = bg; 

      const text = new Text(this.letters[i], {
        fontFamily: "Sniglet-Regular", fontSize: 50, fill: "#FFA500", fontWeight: "bold"
      });
      text.anchor.set(0.5);
      letterCont.text = text;

      letterCont.addChild(bg);
      letterCont.addChild(text);

      letterCont.eventMode = 'static'; 
      letterCont.cursor = 'pointer';
      
      letterCont.on('pointerdown', (e) => { 
          e.stopPropagation(); 
          
          // Kilitliyse tıklama
          if (this.isLocked) return;

          this.onUserInteraction(); 
          this.startDrag(letterCont); 
      });
      
      letterCont.on('pointerenter', () => { 
          // Kilitliyse veya sürükleme yoksa işlem yapma
          if (this.isLocked || !this.isDragging) return;
          this.addLetterToSelection(letterCont); 
      });

      this.addChild(letterCont);
      this.letterObjects.push(letterCont);
    }
  }

  // ============================================================
  // 2. TUTORIAL 
  // ============================================================

  playTutorialWord(wordToSolve) {
      if (this.isDragging || this.isTutorialPlaying || this.isLocked) return;
      this.isTutorialPlaying = true;

      // İpucu
      this.hintText.text = "Connect the letters " + wordToSolve;
      this.hintContainer.visible = true;
      this.hintContainer.y = -200; 
      this.hintContainer.alpha = 0;
      gsap.to(this.hintContainer, { alpha: 1, y: -250, duration: 0.5 });

      // El
      this.hand.visible = true;
      this.hand.alpha = 0; 
      gsap.to(this.hand, { alpha: 1, duration: 1.0 }); 

      const targetPath = [];
      let tempObjects = [...this.letterObjects];
      for(let char of wordToSolve) {
          const found = tempObjects.find(obj => obj.charValue === char);
          if(found) targetPath.push(found);
      }
      if(targetPath.length === 0) { this.stopTutorial(); return; }

      this.tutorialTimeline = gsap.timeline();

      //  GÖSTERME
      for (let i = 0; i < 2; i++) {
          this.tutorialTimeline.set(this.hand, { x: targetPath[0].x + 30, y: targetPath[0].y + 30 });
          targetPath.forEach((letterObj, idx) => {
              if (idx === 0) return;
              this.tutorialTimeline.to(this.hand, {
                  x: letterObj.x + 30, y: letterObj.y + 30, 
                  duration: 0.8, 
                  ease: "sine.inOut"
              });
          });
          this.tutorialTimeline.to(this.hand, { alpha: 0.2, duration: 0.2 });
          this.tutorialTimeline.to(this.hand, { alpha: 1, duration: 0.2 });
      }

      //  OYNAMA
      this.tutorialTimeline.call(() => {
          this.hand.x = targetPath[0].x + 30;
          this.hand.y = targetPath[0].y + 30;
          this.startDrag(targetPath[0]); 
      });

      targetPath.forEach((letterObj, idx) => {
          if (idx === 0) return;
          this.tutorialTimeline.to(this.hand, {
              x: letterObj.x + 30, 
              y: letterObj.y + 30, 
              duration: 0.8, 
              ease: "sine.inOut",
              onUpdate: () => { this.drawTutorialLine(); }, 
              onComplete: () => { this.addLetterToSelection(letterObj); }
          });
      });

      //  BEKLEME
      this.tutorialTimeline.to({}, { duration: 2.0 }); 

      this.tutorialTimeline.call(() => {
          gsap.to(this.hintContainer, { alpha: 0, duration: 0.3 });
          this.onPointerUp(); 
          gsap.to(this.hand, { alpha: 0, duration: 0.8, onComplete: () => {
              this.stopTutorial();
          }});
      });
  }

  stopTutorial() {
      if (this.tutorialTimeline) this.tutorialTimeline.kill();
      this.isTutorialPlaying = false;
      this.hand.visible = false;
      this.hintContainer.visible = false; 
      this.resetSelection();
      this.currentLine.clear();
  }

  onUserInteraction() {
      if (this.isTutorialPlaying) {
          this.stopTutorial();
      }
      this.emit("userInteraction");
  }

  // ============================================================
  // 3. OYUN MEKANİKLERİ
  // ============================================================

  startDrag(firstLetter) {
    if (this.isLocked) return;

    // Temizlik
    this.resetSelection(); 
    
    this.isDragging = true;
    this.previewContainer.visible = true; 
    this.previewContainer.x = 0; 
    this.addLetterToSelection(firstLetter);
  }

  addLetterToSelection(letterObj) {
    if (this.isLocked) return;
    if (this.selectedLetters.includes(letterObj)) return;
    
    this.selectedLetters.push(letterObj);
    
    letterObj.bg.visible = true; 
    letterObj.text.style.fill = "#FFFFFF"; 
    gsap.to(letterObj.scale, { x: 1, y: 1, duration: 0.05 }); 
    
    this.updatePreviewBox();
  }

  onPointerMove(event) {
    if (!this.isDragging || this.isLocked) return;
    
    this.currentLine.clear();
    this.currentLine.lineStyle(10, 0xFFA500, 1.5); 
    this.currentLine.lineCap = 'round';
    this.currentLine.lineJoin = 'round';

    if (this.selectedLetters.length > 0) {
        this.currentLine.moveTo(this.selectedLetters[0].x, this.selectedLetters[0].y);
        for (let i = 1; i < this.selectedLetters.length; i++) {
            this.currentLine.lineTo(this.selectedLetters[i].x, this.selectedLetters[i].y);
        }
        const localPos = this.toLocal(event.global);
        this.currentLine.lineTo(localPos.x, localPos.y);
    }
  }

  onPointerUp() {
    if (!this.isDragging || this.isLocked) return;
    
    this.isDragging = false;
    this.currentLine.clear();
    const formedWord = this.selectedLetters.map(l => l.charValue).join("");
    this.emit("wordCreated", formedWord); 
  }

  drawTutorialLine() {
      if (!this.isDragging) return;
      this.currentLine.clear();
      this.currentLine.lineStyle(10, 0xFFA500, 1.5); 
      this.currentLine.lineCap = 'round';
      this.currentLine.lineJoin = 'round';

      if (this.selectedLetters.length > 0) {
          this.currentLine.moveTo(this.selectedLetters[0].x, this.selectedLetters[0].y);
          for (let i = 1; i < this.selectedLetters.length; i++) {
              this.currentLine.lineTo(this.selectedLetters[i].x, this.selectedLetters[i].y);
          }
          this.currentLine.lineTo(this.hand.x - 30, this.hand.y - 30);
      }
  }

  shuffleLetters() {
    for (let i = this.letterObjects.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [this.letterObjects[i], this.letterObjects[j]] = [this.letterObjects[j], this.letterObjects[i]];
    }
    const total = this.letterObjects.length;
    const step = (Math.PI * 2) / total;
    for (let i = 0; i < total; i++) {
        const angle = i * step - (Math.PI / 2);
        const targetX = Math.cos(angle) * this.radius;
        const targetY = Math.sin(angle) * this.radius;
        gsap.to(this.letterObjects[i], { x: targetX, y: targetY, duration: 0.8, ease: "back.out(1.2)" });
    }
  }

  playShuffleAnimation(target) {
    gsap.killTweensOf(target);
    gsap.killTweensOf(target.scale);
    target.scale.set(this.btnBaseScale);
    target.rotation = 0; 
    gsap.to(target, { rotation: Math.PI * 2, duration: 0.5, ease: "back.out(1.7)" });
    gsap.to(target.scale, { x: this.btnBaseScale * 0.8, y: this.btnBaseScale * 0.8, duration: 0.1, yoyo: true, repeat: 1 });
  }

  handleCorrect() { this.resetSelection(); }
  
  // --- GÜNCELLENEN FONKSİYON: 0.6 sn Bekle + Kilit ---
  handleWrong() {
    if (this.isLocked) return; // Zaten kilitliyse tekrar girme
    this.isLocked = true; // KİLİTLE

    // Titreme Efekti
    gsap.fromTo(this.previewContainer, 
        { x: -10 }, 
        { x: 10, duration: 0.08, repeat: 5, yoyo: true, ease: "sine.inOut", 
          onComplete: () => { this.previewContainer.x = 0; } 
        }
    );

    // 0.6 sn bekle, sonra sıfırla ve kilidi aç
    gsap.delayedCall(0.6, () => { 
        this.resetSelection(); 
        this.isLocked = false; // KİLİDİ AÇ
    });
  }

  resetSelection() {
    this.letterObjects.forEach(obj => {
        obj.bg.visible = false; 
        obj.text.style.fill = "#FFA500"; 
        gsap.killTweensOf(obj.scale); 
        obj.scale.set(1); 
    });

    this.selectedLetters = [];
    this.previewText.text = "";
    this.previewContainer.visible = false; 
    this.previewContainer.x = 0; 
  }

  updatePreviewBox() {
    const word = this.selectedLetters.map(l => l.charValue).join("");
    this.previewText.text = word;
    const textWidth = this.previewText.width;
    const boxWidth = textWidth + 40; const boxHeight = 50;
    this.previewBg.clear();
    this.previewBg.beginFill(0xFFA500); 
    this.previewBg.drawRoundedRect(-boxWidth/2, -boxHeight/2, boxWidth, boxHeight, 20); 
    this.previewBg.endFill();
    this.previewContainer.scale.set(1.1);
    gsap.to(this.previewContainer.scale, {x: 1, y: 1, duration: 0.1});
  }
}