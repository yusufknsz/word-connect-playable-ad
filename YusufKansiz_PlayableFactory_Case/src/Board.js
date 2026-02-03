import { Container, Graphics, Text, Sprite } from "pixi.js";
import gsap from "gsap";

export default class Board extends Container {
    constructor(levelWordsData) {
        super();
        this.wordsData = levelWordsData;
        this.cells = [];
        this.tileSize = 80; 
        this.padding = 10;

        this.createGrid();
        
        // Pivotu merkeze al
        const bounds = this.getBounds();
        this.pivot.set(bounds.width / 2 + bounds.x, bounds.height / 2 + bounds.y);
    }

    createGrid() {
        const wordDefinitions = this.wordsData.split('|');
        wordDefinitions.forEach(def => {
            const [rowStr, colStr, word, direction] = def.split(',');
            let row = parseInt(rowStr);
            let col = parseInt(colStr);

            for (let i = 0; i < word.length; i++) {
                const char = word[i];
                let cell = this.findCell(row, col);
                if (!cell) {
                    cell = this.createCell(row, col, char);
                    this.cells.push(cell);
                    this.addChild(cell);
                }
                if (direction === 'H') col++; else row++;
            }
        });
    }

    createCell(row, col, char) {
        const cell = new Container();
        cell.x = col * (this.tileSize + this.padding);
        cell.y = row * (this.tileSize + this.padding);
        cell.correctChar = char; 
        cell.isSolved = false;
        cell.gridPosition = { r: row, c: col };

        // 1. ZEMİN (RENK DEĞİŞİMİ İÇİN HAZIRLIK)
        const bg = new Graphics();
       
        
        bg.beginFill(0xFFFFFF); 
        bg.drawRoundedRect(0, 0, this.tileSize, this.tileSize, 15);
        bg.endFill();
        
        // Başlangıç Rengi: Krem (#FFFAE6)
        bg.tint = 0xFFFAE6; 
        
        cell.bg = bg; // Referansını kaydet (Sonra turuncu yapacağız)
        cell.addChild(bg);

        // 2. HARF (GİZLİ)
        const text = new Text(char, {
            fontFamily: "Sniglet-Regular", fontSize: 48,
            fill: "#F39C12", // Başlangıçta turuncu (Ama görünmez)
            fontWeight: "bold"
        });
        text.anchor.set(0.5);
        text.x = this.tileSize / 2; text.y = this.tileSize / 2;
        text.visible = false;
        cell.textObj = text;
        cell.addChild(text);
        return cell;
    }

    findCell(row, col) {
        return this.cells.find(c => c.gridPosition.r === row && c.gridPosition.c === col);
    }

    checkAndReveal(guessedWord, startPos) {
        const wordDefinitions = this.wordsData.split('|');
        let foundAny = false;
        
        wordDefinitions.forEach(def => {
            const [rowStr, colStr, word, direction] = def.split(',');
            if (word === guessedWord) {
                this.revealWord(parseInt(rowStr), parseInt(colStr), word, direction, startPos);
                foundAny = true;
            }
        });
        return foundAny;
    }

    revealWord(startRow, startCol, word, direction, startPos) {
        let row = startRow; let col = startCol;

        for (let i = 0; i < word.length; i++) {
            const cell = this.findCell(row, col);
            if (cell && !cell.isSolved) {
                cell.isSolved = true;
                if (startPos) {
                    this.flyToCell(cell, startPos, i * 0.1); 
                } else {
                    // Animasyonsuz açılışta da renkleri güncelle
                    cell.bg.tint = 0xFFA500; // Turuncu Kutu
                    cell.textObj.style.fill = "#FFFFFF"; // Beyaz Yazı
                    cell.textObj.visible = true;
                }
            }
            if (direction === 'H') col++; else row++;
        }
    }

    flyToCell(targetCell, startGlobalPos, delay) {
        const flyingObj = new Container();
        
        const localStart = this.toLocal(startGlobalPos);
        flyingObj.x = localStart.x;
        flyingObj.y = localStart.y;

        // ---  UÇAN HARF BEYAZ OLSUN ---
        const text = new Text(targetCell.correctChar, {
            fontFamily: "Sniglet-Regular", fontSize: 50,
            fill: "#FFFFFF", 
            fontWeight: "bold"
        });
        text.anchor.set(0.5);
        flyingObj.addChild(text);

        this.addChild(flyingObj); 

        const targetX = targetCell.x + this.tileSize / 2;
        const targetY = targetCell.y + this.tileSize / 2;

        gsap.to(flyingObj, {
            x: targetX,
            y: targetY,
            duration: 0.5, 
            delay: delay,
            ease: "power2.out",
            onComplete: () => {
                flyingObj.destroy(); 
                
                // --- KUTUYU RENKLENDİR ---
                // Kutunun arka planını Turuncu yap
                targetCell.bg.tint = 0xFFA500; 
                
                // Harfin rengini Beyaz yap
                targetCell.textObj.style.fill = "#FFFFFF";
                
                // Görünür yap
                targetCell.textObj.visible = true; 
                
                // Pop Efekti
                targetCell.textObj.scale.set(0);
                gsap.to(targetCell.textObj.scale, { x: 1, y: 1, duration: 0.3, ease: "back.out" });
            }
        });
        
        gsap.to(text.scale, { x: 0.8, y: 0.8, duration: 0.5, delay: delay });
    }
}