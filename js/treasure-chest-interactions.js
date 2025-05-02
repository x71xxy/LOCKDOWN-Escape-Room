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
        
        // 密码锁
        this.correctCode = "4721"; // 正确的密码
        this.currentCode = "";     // 当前输入的密码
        this.lockButtons = [];     // 数字按钮引用
        
        // 初始化
        this.initialize();
    }
    
    // 初始化交互元素
    initialize() {
        // 遍历模型查找可交互部分
        this.model.traverse((child) => {
            if (!child.isMesh) return;
            
            // 根据名称或属性识别不同部分
            if (child.name.includes('lid') || child.name.includes('top')) {
                this.lid = child;
                child.userData.isInteractive = true;
                child.userData.type = 'lid';
            }
            else if (child.name.includes('paper') || child.name.includes('note')) {
                this.paper = child;
                child.userData.isInteractive = true;
                child.userData.type = 'paper';
                // 初始状态纸张不可交互
                child.userData.canMove = false;
            }
            else if (child.name.includes('button') || child.name.includes('key')) {
                // 数字按钮
                const buttonIndex = this.lockButtons.length;
                child.userData.isInteractive = true;
                child.userData.type = 'button';
                child.userData.value = buttonIndex.toString();
                this.lockButtons.push(child);
            }
            
            // 设置所有网格可以接收阴影
            child.castShadow = true;
            child.receiveShadow = true;
        });
        
        // 如果没有找到预定义的锁按钮，创建虚拟按钮
        if (this.lockButtons.length === 0) {
            this.createVirtualLockButtons();
        }
        
        // 重置密码显示
        this.updateCodeDisplay();
        
        console.log("Treasure chest interaction system initialized");
    }
    
    // 创建虚拟锁按钮（如果模型中没有）
    createVirtualLockButtons() {
        const buttonSize = 0.15;
        const buttonGap = 0.05;
        const startX = -0.3;
        const buttonY = 0.5;
        const buttonZ = 0.51;
        
        // 创建10个数字按钮 (0-9)
        for (let i = 0; i < 10; i++) {
            const value = (i === 9) ? 0 : i + 1; // 按钮0放在最后
            
            // 创建按钮几何体
            const geometry = new THREE.CylinderGeometry(buttonSize, buttonSize, 0.05, 32);
            const material = new THREE.MeshStandardMaterial({ 
                color: 0x555555,
                metalness: 0.7,
                roughness: 0.3
            });
            
            const button = new THREE.Mesh(geometry, material);
            
            // 设置按钮位置
            const row = Math.floor(i / 3);
            const col = i % 3;
            button.position.x = startX + col * (buttonSize * 2 + buttonGap);
            button.position.y = buttonY - row * (buttonSize * 2 + buttonGap);
            button.position.z = buttonZ;
            button.rotation.x = Math.PI / 2; // 旋转按钮使其面向前方
            
            // 设置按钮数据
            button.userData.isInteractive = true;
            button.userData.type = 'button';
            button.userData.value = value.toString();
            
            // 添加按钮到模型和按钮数组
            this.model.add(button);
            this.lockButtons.push(button);
            
            // 创建数字标签
            this.createButtonLabel(button, value.toString());
        }
    }
    
    // 创建按钮上的数字标签
    createButtonLabel(button, text) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 64;
        canvas.height = 64;
        
        // 绘制数字
        context.fillStyle = 'white';
        context.font = 'bold 48px Arial';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(text, 32, 32);
        
        // 创建纹理
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true
        });
        
        // 创建标签平面
        const labelGeometry = new THREE.PlaneGeometry(button.geometry.parameters.radius * 1.5, button.geometry.parameters.radius * 1.5);
        const label = new THREE.Mesh(labelGeometry, material);
        
        // 定位标签稍微在按钮前面
        label.position.z = 0.01;
        
        // 添加到按钮
        button.add(label);
    }
    
    // 处理点击事件
    handleClick(object) {
        if (!object.userData.isInteractive) return;
        
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
    }
    
    // 处理按钮点击
    handleButtonClick(button) {
        console.log("Button clicked: " + button.userData.value);
        
        // 如果宝箱已解锁，不处理按钮点击
        if (!this.isLocked) return;
        
        // 按下按钮动画
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
    
    // 更新密码显示UI
    updateCodeDisplay() {
        const codeDigits = document.querySelectorAll('.code-digit');
        if (!codeDigits.length) return;
        
        // 填充当前代码到显示UI
        for (let i = 0; i < 4; i++) {
            if (i < this.currentCode.length) {
                codeDigits[i].textContent = this.currentCode[i];
            } else {
                codeDigits[i].textContent = '-';
            }
        }
    }
    
    // 按钮按下动画
    animateButtonPress(button) {
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
    
    // 解锁宝箱
    unlockChest() {
        if (!this.isLocked) return;
        
        console.log("Treasure chest unlocked!");
        this.isLocked = false;
        this.canToggleLid = true;
        
        // 更新密码显示UI状态
        const codeDisplay = document.getElementById('code-display');
        if (codeDisplay) {
            codeDisplay.style.backgroundColor = 'rgba(0, 100, 0, 0.7)';
            const codeHint = codeDisplay.querySelector('.code-hint');
            if (codeHint) {
                codeHint.textContent = '宝箱已解锁！点击盖子可以打开或关闭';
            }
        }
        
        // 播放解锁动画
        this.animateUnlock();
        
        // 自动打开宝箱
        setTimeout(() => {
            this.openChest();
        }, 1000);
    }
    
    // 解锁动画
    animateUnlock() {
        // 锁按钮闪烁动画
        this.lockButtons.forEach(button => {
            if (!button.material) return;
            
            const originalColor = button.material.color.clone();
            
            gsap.to(button.material.color, {
                r: 0.0,
                g: 1.0,
                b: 0.0,
                duration: 0.3,
                onComplete: () => {
                    gsap.to(button.material.color, {
                        r: originalColor.r,
                        g: originalColor.g,
                        b: originalColor.b,
                        duration: 0.3
                    });
                }
            });
        });
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