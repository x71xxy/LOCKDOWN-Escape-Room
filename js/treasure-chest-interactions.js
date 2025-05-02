// 宝箱交互控制器
class TreasureChestInteractions {
    constructor(model, scene, camera) {
        this.model = model;
        this.scene = scene;
        this.camera = camera;
        
        // 宝箱状态
        this.isLocked = true;      // 宝箱是否锁着
        this.isOpen = false;       // 宝箱是否打开
        this.canToggleLid = false; // 是否可以自由开关盖子
        
        // 存储宝箱各部分的引用
        this.lid = null;           // 盖子
        this.paper = null;         // 内部纸张
        this.displayPanel = null;  // 密码显示区域
        
        // 密码锁
        this.correctCode = "4721"; // 正确的密码
        this.currentCode = "";     // 当前输入的密码
        this.lockButtons = [];     // 数字按钮引用
        this.codeDisplay = null;   // 密码显示对象
        
        // 初始化
        this.initialize();
    }
    
    // 初始化交互元素
    initialize() {
        console.log("开始初始化宝箱交互");
        
        // 打印整个模型的层次结构，以便了解可用组件
        console.log("宝箱模型结构:", this.model);
        
        // 遍历模型查找可交互部分
        this.model.traverse((child) => {
            // 打印每个组件的名称，帮助调试
            if (child.isMesh) {
                console.log("找到模型部件:", child.name, child);
            }
            
            if (!child.isMesh) return;
            
            // 根据名称或属性识别不同部分
            if (child.name.includes('lid') || child.name.includes('top') || child.name.includes('盖')) {
                this.lid = child;
                child.userData.isInteractive = true;
                child.userData.type = 'lid';
                console.log("找到盖子部件:", child.name);
            }
            else if (child.name.includes('paper') || child.name.includes('note') || child.name.includes('纸')) {
                this.paper = child;
                child.userData.isInteractive = true;
                child.userData.type = 'paper';
                // 初始状态纸张不可交互
                child.userData.canMove = false;
                console.log("找到纸张部件:", child.name);
            }
            else if (child.name.includes('button') || child.name.includes('key') || 
                    child.name.includes('lock') || child.name.includes('锁')) {
                // 数字按钮
                const buttonIndex = this.lockButtons.length;
                child.userData.isInteractive = true;
                child.userData.type = 'button';
                child.userData.value = buttonIndex.toString();
                this.lockButtons.push(child);
                console.log("找到按钮/锁部件:", child.name, "值:", buttonIndex);
            }
            
            // 设置所有网格可以接收阴影
            child.castShadow = true;
            child.receiveShadow = true;
        });
        
        // 如果没有找到预定义的锁按钮，创建虚拟按钮
        if (this.lockButtons.length === 0) {
            console.log("未找到现有按钮部件，创建虚拟按钮");
            this.createVirtualLockButtons();
        } else {
            console.log("找到",this.lockButtons.length,"个按钮部件，不需要创建虚拟按钮");
        }
        
        // 重置密码显示
        this.updateCodeDisplay();
        
        console.log("宝箱交互系统初始化完成");
    }
    
    // 创建虚拟锁按钮（如果模型中没有）
    createVirtualLockButtons() {
        console.log("开始创建文本数字锁面板");
        
        // 计算宝箱的边界框以确定面板位置
        const boundingBox = new THREE.Box3().setFromObject(this.model);
        const size = boundingBox.getSize(new THREE.Vector3());
        const center = boundingBox.getCenter(new THREE.Vector3());
        
        // 面板尺寸和位置
        const panelWidth = size.x * 0.6;
        const panelHeight = size.y * 0.3;
        const panelDepth = size.z * 0.02;
        
        // 面板位置 - 放在宝箱前面
        const panelX = center.x;
        const panelY = center.y - size.y * 0.15;
        const panelZ = center.z + size.z * 0.51;
        
        // 创建面板
        const panelGeometry = new THREE.BoxGeometry(panelWidth, panelHeight, panelDepth);
        const panelMaterial = new THREE.MeshStandardMaterial({
            color: 0xe0e0e0,
            roughness: 0.2,
            metalness: 0.3
        });
        
        const panel = new THREE.Mesh(panelGeometry, panelMaterial);
        panel.position.set(panelX, panelY, panelZ);
        this.model.add(panel);
        
        // 创建密码显示区域 - 在面板顶部
        this.createCodeDisplay(
            panelX, 
            panelY + panelHeight * 0.35, 
            panelZ + panelDepth/2 + 0.001, 
            panelWidth * 0.7, 
            panelHeight * 0.2
        );
        
        // 创建数字按钮 (1-9,0)
        // 第一行：1 2 3 4 5
        // 第二行：6 7 8 9 0
        const buttonSize = panelWidth / 6; // 按钮尺寸
        const spacingX = buttonSize * 1.2; // 横向间距
        const spacingY = buttonSize * 1.2; // 纵向间距
        const offsetX = -spacingX * 2; // 起始X偏移 (居中5个按钮)
        const offsetY = spacingY / 2 - panelHeight * 0.1; // 起始Y偏移，让按钮更靠下
        
        // 两行数字的布局
        const numberLayout = [
            ['1', '2', '3', '4', '5'],
            ['6', '7', '8', '9', '0']
        ];
        
        // 为每个数字创建可点击区域
        for (let row = 0; row < 2; row++) {
            for (let col = 0; col < 5; col++) {
                const value = numberLayout[row][col];
                
                // 计算位置
                const x = panelX + offsetX + col * spacingX;
                const y = panelY + offsetY - row * spacingY;
                const z = panelZ + panelDepth/2 + 0.001; // 稍微突出于面板
                
                // 创建数字文本
                this.createTextNumber(x, y, z, value, buttonSize);
            }
        }
        
        console.log("文本数字锁面板创建完成");
    }
    
    // 创建密码显示区域
    createCodeDisplay(x, y, z, width, height) {
        // 创建显示背景
        const bgGeometry = new THREE.PlaneGeometry(width, height);
        const bgMaterial = new THREE.MeshBasicMaterial({
            color: 0x222222,
            side: THREE.DoubleSide
        });
        
        this.displayPanel = new THREE.Mesh(bgGeometry, bgMaterial);
        this.displayPanel.position.set(x, y, z);
        this.model.add(this.displayPanel);
        
        // 创建文本画布
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 512;
        canvas.height = 128;
        
        // 初始化显示为空
        this.drawCodeText(context, "----");
        
        // 创建纹理和材质
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true
        });
        
        // 创建显示平面
        const geometry = new THREE.PlaneGeometry(width * 0.9, height * 0.7);
        this.codeDisplay = new THREE.Mesh(geometry, material);
        this.codeDisplay.position.set(0, 0, 0.001); // 稍微在面板前面
        
        // 将显示添加到面板
        this.displayPanel.add(this.codeDisplay);
        
        // 保存画布上下文引用，以便后续更新
        this.codeDisplayContext = context;
        this.codeDisplayTexture = texture;
    }
    
    // 在显示区域绘制代码文本
    drawCodeText(context, text) {
        // 清除画布
        context.clearRect(0, 0, context.canvas.width, context.canvas.height);
        
        // 绘制背景
        context.fillStyle = '#222222';
        context.fillRect(0, 0, context.canvas.width, context.canvas.height);
        
        // 绘制文本
        context.fillStyle = '#00ff00'; // 绿色数字，像LCD显示
        context.font = 'bold 80px monospace'; // 使用等宽字体
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(text, context.canvas.width / 2, context.canvas.height / 2);
    }
    
    // 更新密码显示
    updateCodeDisplay() {
        // 如果有网页UI元素，也更新它
        const codeDigits = document.querySelectorAll('.code-digit');
        if (codeDigits.length) {
            for (let i = 0; i < 4; i++) {
                if (i < this.currentCode.length) {
                    codeDigits[i].textContent = this.currentCode[i];
                } else {
                    codeDigits[i].textContent = '-';
                }
            }
        }
        
        // 更新3D显示
        if (this.codeDisplayContext && this.codeDisplayTexture) {
            let displayText = "";
            
            // 构建显示文本
            for (let i = 0; i < 4; i++) {
                if (i < this.currentCode.length) {
                    displayText += this.currentCode[i];
                } else {
                    displayText += "-";
                }
            }
            
            // 绘制文本
            this.drawCodeText(this.codeDisplayContext, displayText);
            
            // 更新纹理
            this.codeDisplayTexture.needsUpdate = true;
        }
    }
    
    // 创建文本数字并使其可点击
    createTextNumber(x, y, z, text, size) {
        // 创建画布来绘制数字
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 128;
        canvas.height = 128;
        
        // 绘制数字
        context.fillStyle = '#000000';
        context.font = 'bold 80px Arial';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(text, 64, 64);
        
        // 创建纹理
        const texture = new THREE.CanvasTexture(canvas);
        
        // 创建可点击区域
        const geometry = new THREE.PlaneGeometry(size, size);
        const material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            opacity: 1
        });
        
        const numberButton = new THREE.Mesh(geometry, material);
        numberButton.position.set(x, y, z);
        numberButton.userData.isInteractive = true;
        numberButton.userData.type = 'button';
        numberButton.userData.value = text;
        
        // 添加到模型
        this.model.add(numberButton);
        this.lockButtons.push(numberButton);
        
        console.log(`创建数字按钮 ${text} 在位置 (${x.toFixed(2)}, ${y.toFixed(2)}, ${z.toFixed(2)})`);
        
        return numberButton;
    }
    
    // 处理点击事件
    handleClick(object) {
        console.log("处理点击事件:", object.name, object);
        
        // 首先检查是否是已知的交互元素
        if (object.userData.isInteractive) {
            switch (object.userData.type) {
                case 'button':
                    this.handleButtonClick(object);
                    break;
                case 'lid':
                    this.handleLidClick();
                    break;
                case 'paper':
                    this.handlePaperClick(object);
                    break;
            }
            return;
        }
        
        // 如果没有明确标记为交互式，尝试根据名称或位置识别
        const objName = object.name.toLowerCase();
        
        // 检查是否与锁相关 - 可以基于命名、位置、材质等
        if (objName.includes('lock') || objName.includes('button') || objName.includes('key') || 
            objName.includes('锁') || objName.includes('按钮')) {
            console.log("检测到锁或按钮点击");
            // 为这个对象分配一个数字值（0-9之间）
            // 这里简单地使用对象位置的哈希值模除10来分配一个值
            const positionHash = Math.abs(
                object.position.x * 1000 + 
                object.position.y * 100 + 
                object.position.z * 10
            );
            const value = (positionHash % 10).toString();
            
            console.log(`将锁组件 ${objName} 分配为按钮 ${value}`);
            
            // 临时设置按钮属性
            object.userData.isInteractive = true;
            object.userData.type = 'button';
            object.userData.value = value;
            
            // 处理按钮点击
            this.handleButtonClick(object);
            return;
        }
        
        // 检查是否是盖子
        if (objName.includes('lid') || objName.includes('top') || objName.includes('盖')) {
            console.log("检测到盖子点击");
            this.lid = object;
            this.handleLidClick();
            return;
        }
        
        // 检查是否是内部纸张
        if (objName.includes('paper') || objName.includes('note') || objName.includes('纸')) {
            console.log("检测到纸张点击");
            this.paper = object;
            this.handlePaperClick(object);
            return;
        }
        
        // 如果无法识别具体部件，可以尝试根据位置判断
        // 例如，如果点击位置在宝箱的上部区域，可能是盖子
        if (object.position.y > 0.5 * this.model.position.y) {
            console.log("基于位置检测到可能是盖子的点击");
            this.lid = object;
            this.handleLidClick();
            return;
        }
        
        console.log("无法识别的点击目标:", object.name);
    }
    
    // 处理按钮点击
    handleButtonClick(button) {
        console.log("Button clicked: " + button.userData.value);
        
        // 如果宝箱已解锁，不处理按钮点击
        if (!this.isLocked) return;
        
        // 按下按钮动画 - 闪烁高亮效果
        this.animateButtonPress(button);
        
        // 添加按钮值到当前代码
        this.currentCode += button.userData.value;
        
        // 保持代码长度为4位
        if (this.currentCode.length > 4) {
            this.currentCode = this.currentCode.slice(1);
        }
        
        // 更新密码显示UI
        this.updateCodeDisplay();
        
        console.log("Current code: " + this.currentCode);
        
        // 检查密码是否正确
        if (this.currentCode === this.correctCode) {
            this.unlockChest();
        }
    }
    
    // 按钮按下动画
    animateButtonPress(button) {
        // 保存原始材质颜色或不透明度
        const originalMaterial = button.material.clone();
        
        // 对于文本数字按钮，改变不透明度和颜色
        if (button.material.map) {
            // 创建高亮材质
            const highlightMaterial = button.material.clone();
            highlightMaterial.color.set(0x00ff00); // 绿色高亮
            highlightMaterial.emissive = new THREE.Color(0x33ff33);
            highlightMaterial.emissiveIntensity = 0.5;
            
            // 应用高亮材质
            button.material = highlightMaterial;
            
            // 播放点击声音效果
            this.playClickSound();
            
            // 0.2秒后恢复原样
            setTimeout(() => {
                button.material = originalMaterial;
            }, 200);
        } 
        // 对于3D按钮，通过位移动画
        else {
            const originalPosition = button.position.z;
            const pressDepth = -0.02;
            
            // 使用GSAP动画
            gsap.to(button.position, {
                z: originalPosition + pressDepth,
                duration: 0.1,
                onComplete: () => {
                    gsap.to(button.position, {
                        z: originalPosition,
                        duration: 0.1
                    });
                }
            });
        }
    }
    
    // 播放按钮点击声音
    playClickSound() {
        // 创建音频上下文
        if (!this.audioContext) {
            try {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            } catch (e) {
                console.warn("WebAudio API不受支持:", e);
                return;
            }
        }
        
        // 创建简单的按键音效
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, this.audioContext.currentTime); // A5音
        
        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.1);
    }
    
    // 解锁宝箱
    unlockChest() {
        if (!this.isLocked) return;
        
        console.log("Treasure chest unlocked!");
        this.isLocked = false;
        this.canToggleLid = true;
        
        // 更新Web UI显示
        const webCodeDisplay = document.getElementById('code-display');
        if (webCodeDisplay) {
            webCodeDisplay.style.backgroundColor = 'rgba(0, 100, 0, 0.7)';
            const codeHint = webCodeDisplay.querySelector('.code-hint');
            if (codeHint) {
                codeHint.textContent = '宝箱已解锁！点击盖子可以打开或关闭';
            }
        }
        
        // 播放解锁动画
        this.animateUnlock();
        
        // 播放解锁成功的声音
        this.playUnlockSound();
        
        // 自动打开宝箱
        setTimeout(() => {
            this.openChest();
        }, 1500);
    }
    
    // 解锁动画
    animateUnlock() {
        // 数字面板显示成功消息
        if (this.codeDisplayContext && this.codeDisplayTexture) {
            this.flashSuccessMessage();
        }
        
        // 锁按钮闪烁动画
        this.lockButtons.forEach(button => {
            if (!button.material) return;
            
            const originalColor = button.material.color.clone();
            const originalEmissive = button.material.emissive ? button.material.emissive.clone() : new THREE.Color(0x000000);
            
            // 创建闪烁序列
            const flashSequence = () => {
                gsap.to(button.material.color, {
                    r: 0.0,
                    g: 1.0,
                    b: 0.0,
                    duration: 0.2,
                    onComplete: () => {
                        gsap.to(button.material.color, {
                            r: originalColor.r,
                            g: originalColor.g,
                            b: originalColor.b,
                            duration: 0.2
                        });
                    }
                });
                
                if (button.material.emissive) {
                    gsap.to(button.material.emissive, {
                        r: 0.0,
                        g: 0.5,
                        b: 0.0,
                        duration: 0.2,
                        onComplete: () => {
                            gsap.to(button.material.emissive, {
                                r: originalEmissive.r,
                                g: originalEmissive.g,
                                b: originalEmissive.b,
                                duration: 0.2
                            });
                        }
                    });
                }
            };
            
            // 执行三次闪烁
            flashSequence();
            setTimeout(flashSequence, 400);
            setTimeout(flashSequence, 800);
        });
        
        // 如果有锁面板，也让它闪烁
        if (this.displayPanel) {
            const originalColor = this.displayPanel.material.color.clone();
            
            // 三次绿色闪烁
            const panelFlash = () => {
                gsap.to(this.displayPanel.material.color, {
                    r: 0.0,
                    g: 0.8,
                    b: 0.0,
                    duration: 0.3,
                    onComplete: () => {
                        gsap.to(this.displayPanel.material.color, {
                            r: originalColor.r,
                            g: originalColor.g,
                            b: originalColor.b,
                            duration: 0.3
                        });
                    }
                });
            };
            
            panelFlash();
            setTimeout(panelFlash, 600);
            setTimeout(panelFlash, 1200);
        }
    }
    
    // 在显示屏上闪烁成功消息
    flashSuccessMessage() {
        const messages = [
            "正确",
            "解锁成功",
            "密码正确",
            "UNLOCKED"
        ];
        
        // 随机选择一条成功消息
        const successMessage = messages[Math.floor(Math.random() * messages.length)];
        
        // 绘制消息
        this.drawCodeText(this.codeDisplayContext, successMessage);
        this.codeDisplayTexture.needsUpdate = true;
        
        // 设置绿色背景
        if (this.displayPanel && this.displayPanel.material) {
            this.displayPanel.material.color.set(0x005500);
        }
        
        // 1.5秒后再次更新显示
        setTimeout(() => {
            this.drawCodeText(this.codeDisplayContext, this.correctCode);
            this.codeDisplayTexture.needsUpdate = true;
            
            // 重置背景颜色
            if (this.displayPanel && this.displayPanel.material) {
                this.displayPanel.material.color.set(0x222222);
            }
        }, 1500);
    }
    
    // 播放解锁成功的声音
    playUnlockSound() {
        // 创建音频上下文
        if (!this.audioContext) {
            try {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            } catch (e) {
                console.warn("WebAudio API不受支持:", e);
                return;
            }
        }
        
        // 创建成功音效 - 上升音调的音效
        const playNote = (frequency, startTime, duration) => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(frequency, startTime);
            
            gainNode.gain.setValueAtTime(0.3, startTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.start(startTime);
            oscillator.stop(startTime + duration);
        };
        
        // 播放成功音效序列
        const now = this.audioContext.currentTime;
        playNote(523.25, now, 0.15);      // C5
        playNote(659.25, now + 0.15, 0.15); // E5
        playNote(783.99, now + 0.3, 0.3);  // G5
    }
    
    // 处理盖子点击
    handleLidClick() {
        // 只有解锁后才能手动操作盖子
        if (!this.canToggleLid) return;
        
        if (this.isOpen) {
            this.closeChest();
        } else {
            this.openChest();
        }
    }
    
    // 打开宝箱
    openChest() {
        if (this.isOpen || !this.lid) return;
        
        console.log("Opening chest");
        this.isOpen = true;
        
        // 盖子旋转动画
        gsap.to(this.lid.rotation, {
            x: -Math.PI / 2, // 旋转90度打开
            duration: 1,
            ease: "power2.out"
        });
        
        // 打开后纸张变为可交互
        if (this.paper) {
            this.paper.userData.canMove = true;
        }
    }
    
    // 关闭宝箱
    closeChest() {
        if (!this.isOpen || !this.lid) return;
        
        console.log("Closing chest");
        this.isOpen = false;
        
        // 盖子关闭动画
        gsap.to(this.lid.rotation, {
            x: 0, // 恢复原位
            duration: 1,
            ease: "power2.out"
        });
    }
    
    // 处理纸张点击
    handlePaperClick(paper) {
        // 只有宝箱打开后才能移动纸张
        if (!paper.userData.canMove) return;
        
        console.log("Paper clicked");
        
        // 纸张移动动画
        this.animatePaperMove(paper);
    }
    
    // 纸张移动动画
    animatePaperMove(paper) {
        // 检查纸张是否已经移动出来
        const isExtracted = paper.userData.isExtracted;
        
        if (isExtracted) {
            // 收回纸张
            gsap.to(paper.position, {
                y: paper.userData.originalY,
                z: paper.userData.originalZ,
                duration: 0.5,
                ease: "power1.out"
            });
            paper.userData.isExtracted = false;
        } else {
            // 存储原始位置
            if (!paper.userData.originalY) {
                paper.userData.originalY = paper.position.y;
                paper.userData.originalZ = paper.position.z;
            }
            
            // 移出纸张
            gsap.to(paper.position, {
                y: paper.userData.originalY + 0.2, // 向上移动
                z: paper.userData.originalZ + 0.2, // 向前移动
                duration: 0.5,
                ease: "power1.out"
            });
            paper.userData.isExtracted = true;
        }
    }
    
    // 更新方法（可以在动画循环中调用）
    update() {
        // 可以添加持续的动画或状态更新
    }
}

// 导出交互控制器
window.TreasureChestInteractions = TreasureChestInteractions; 