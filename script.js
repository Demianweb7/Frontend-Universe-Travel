// 游戏状态
const state = {
    stars: [],
    events: [],
    collectedEvents: {
        'quantum_fluctuation': false,
        'supernova': false,
        'blackhole': false,
        'pulsar': false,
        'comet': false,
        'nebula': false,
        'planet': false,
        'interstellar_dust': false,
        'gravitational_wave': false,
        'wormhole': false,
        'spaceship': false,
        'dark_matter': false,
        'plasma_storm': false,
        'star_birth': false,
        'ftl_neutrinos': false,
        'blackhole_merger': false
    },
    normalClicks: 0,
    significantClicks: 0,
    lastClickTime: 0,
    universeTime: 0,
    playerX: 0,
    playerY: 0,
    isMuted: false,
    lastEventTime: 0,
    timeSpeed: 0.2,
    clickListenerVisible: false,
    threeBodyTriggered: false,
    clickTimeout: null,
    lastWidth: window.innerWidth,  // 记录上一次窗口宽度
    lastHeight: window.innerHeight // 记录上一次窗口高度
};

// 初始化游戏
function initGame() {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');

    // 设置画布大小
    let resizeTimeout;
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        // 延迟初始化星星，防止频繁刷新
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            // 仅在窗口大小变化超过5%时重新初始化
            if (!state.stars.length || 
                Math.abs(canvas.width - state.lastWidth) / state.lastWidth > 0.05 ||
                Math.abs(canvas.height - state.lastHeight) / state.lastHeight > 0.05) {
                
                // 修改：渐进式更新星星位置而不是完全重建
                if (state.stars.length > 0) {
                    // 根据新尺寸调整现有星星位置
                    const widthRatio = canvas.width / state.lastWidth;
                    const heightRatio = canvas.height / state.lastHeight;
                    
                    state.stars.forEach(star => {
                        star.x *= widthRatio;
                        star.y *= heightRatio;
                    });
                    
                    // 更新记录的尺寸
                    state.lastWidth = canvas.width;
                    state.lastHeight = canvas.height;
                } else {
                    // 初始化新星星
                    initStars();
                    state.lastWidth = canvas.width;
                    state.lastHeight = canvas.height;
                }
            }
        }, 500);
    }

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // 初始化星星
    function initStars() {
        state.stars = [];
        // 修改：将星星数量减少至原有90%
        const starCount = Math.floor(canvas.width * canvas.height / 800 * 0.9); // 原为/800
        
        // 定义星座分组（示例：北斗七星）
        const constellationGroups = [
            { id: 'ursa_major', stars: [], flashRate: 0.003, phaseOffset: 0 },
            { id: 'orion', stars: [], flashRate: 0.002, phaseOffset: Math.PI },
            { id: 'cassiopeia', stars: [], flashRate: 0.004, phaseOffset: Math.PI/2 }
        ];
        
        for (let i = 0; i < starCount; i++) {
            const starType = Math.random();
            let size, brightness, twinkleSpeed;
            
            if (starType < 0.7) { // 普通星星
                size = 1;
                brightness = 0.2 + Math.random() * 0.3;
                twinkleSpeed = Math.random() * 0.0015 + 0.0005;
            } else if (starType < 0.9) { // 明亮星星
                size = 1.5;
                brightness = 0.6 + Math.random() * 0.3;
                twinkleSpeed = Math.random() * 0.003 + 0.001;
            } else { // 非常明亮的恒星
                size = 2;
                brightness = 0.8 + Math.random() * 0.2;
                twinkleSpeed = Math.random() * 0.004 + 0.002;
            }
            
            // 随机分配星座组
            const constellation = constellationGroups[
                Math.floor(Math.random() * constellationGroups.length)
            ];
            
            const star = {
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: size,
                brightness: brightness,
                twinkleSpeed: twinkleSpeed,
                twinkleIntensity: 0,
                twinklePhase: Math.random() * Math.PI * 4,
                color: getStarColor(brightness),
                visible: true,
                // 添加星座属性
                constellation: constellation.id,
                flashPhase: Math.random() * Math.PI * 2 // 独立闪烁相位
            };
            
            constellation.stars.push(star);
            state.stars.push(star);
        }
        
        // 保存星座定义
        state.constellations = constellationGroups;
    }

    // 根据亮度获取星星颜色
    function getStarColor(brightness) {
        if (brightness < 0.4) return '#ffffff';
        const colors = [
            '#9db5ff', // 蓝白色
            '#ffdf91', // 黄白色
            '#ffadad', // 红色
            '#c6a8ff'  // 蓝紫色
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    // 修改绘制星星函数添加渐进式更新
    function drawStars() {
        ctx.fillStyle = '#0a0a2a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        const time = Date.now();
        const visibleStars = state.stars.filter(star => star.visible);
        
        // 使用星座定义进行分组闪烁
        if (state.constellations) {
            state.constellations.forEach(constellation => {
                // 每个星座独立控制闪烁
                constellation.stars.forEach(star => {
                    // 基于星座频率的随机闪烁
                    const flashChance = constellation.flashRate * 0.5;
                    if (Math.random() < flashChance) {
                        // 基于正弦波的平滑闪烁
                        const phase = (time * star.twinkleSpeed * 0.8 + star.flashPhase);
                        const flashIntensity = 0.5 + 0.5 * Math.sin(phase);
                        
                        // 动态调整可见性
                        star.visible = flashIntensity > 0.3 || Math.random() < 0.1;
                        
                        // 随机生成新星星补充消失的星星
                        if (!star.visible && Math.random() < 0.05) {
                            // 在原位置附近生成新星星
                            const newStar = {...star};
                            newStar.x = star.x + (Math.random() - 0.5) * 20;
                            newStar.y = star.y + (Math.random() - 0.5) * 20;
                            newStar.flashPhase = Math.random() * Math.PI * 2;
                            newStar.visible = true;
                            
                            // 替换旧星星
                            const index = state.stars.indexOf(star);
                            if (index > -1) {
                                state.stars[index] = newStar;
                                constellation.stars[index % constellation.stars.length] = newStar;
                            }
                        }
                    }
                });
            });
        }
        
        visibleStars.forEach(star => {
            // 使用更平滑的正弦曲线，增加相位偏移
            let alpha = 0.5 + 0.5 * Math.sin(time * star.twinkleSpeed * 0.8 + star.twinklePhase);
            
            // 添加指数衰减因子使变化更柔和
            if (star.twinkleIntensity && time < star.twinkleEndTime) {
                alpha *= star.twinkleIntensity;
                // 减缓衰减速度（从0.985改为0.99）
                star.twinkleIntensity *= 0.99;
            } else {
                star.twinkleIntensity = 0;
            }
            
            // 添加颜色混合模式增强光学效果
            ctx.fillStyle = star.color;
            ctx.globalAlpha = alpha * star.brightness * 0.8; // 降低整体对比度
            
            ctx.fillRect(star.x, star.y, star.size, star.size);
            
            // 添加光晕效果（仅针对大星星）
            if (star.size > 1) {
                ctx.globalAlpha = alpha * star.brightness * 0.3;
                ctx.fillRect(star.x-1, star.y-1, star.size+2, star.size+2);
            }
            
            ctx.globalAlpha = 1;
        });
    }

    // 事件类型定义
    const eventTypes = {
        'supernova': {
            name: '超新星',
            description: '大质量恒星生命终结时爆发的剧烈天文现象，重元素主要来源',
            color: '#ff00ff',
            duration: 1500,
            draw: function(event) {
                const progress = (Date.now() - event.startTime) / this.duration;
                if (progress >= 1) return false;
        
                // 核心爆炸（更明亮中心）
                ctx.fillStyle = `rgba(255, 255, 255, ${1 - progress * 0.5})`;
                ctx.fillRect(event.x - 3, event.y - 3, 6, 6);
        
                // 冲击波（更清晰的同心圆）
                ctx.strokeStyle = `rgba(255, 0, 255, ${0.7 * (1 - progress)})`;
                ctx.lineWidth = 2;
                ctx.beginPath();
        
                // 多层冲击波
                for(let i = 0; i < 3; i++) {
                    const waveRadius = progress * 50 + i * 8;
                    ctx.arc(event.x, event.y, waveRadius, 0, Math.PI*2);
                }
        
                ctx.stroke();
        
                // 放射性碎片（更真实分布）
                for (let i = 0; i < 15; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const dist = progress * 50 * Math.pow(Math.random(), 0.5);
                    const px = event.x + Math.cos(angle) * dist;
                    const py = event.y + Math.sin(angle) * dist;
                    
                    ctx.fillStyle = `rgba(255, ${Math.floor(100 + Math.random() * 155)}, 255, ${0.5 * (1 - progress)})`;
                    ctx.fillRect(px, py, 1, 1);
                }
        
                return true;
            }
        },
        'blackhole': {
            name: '黑洞',
            description: '极端密集的天体，引力强大到连光都无法逃脱，宇宙中的神秘存在',
            color: '#ff9900',
            duration: 3000,
            draw: function(event) {
                const progress = (Date.now() - event.startTime) / this.duration;
                if (progress >= 1) return false;
        
                const maxRadius = 30;
                const radius = maxRadius * (0.5 + Math.sin(progress * Math.PI) * 0.5);
                
                // 事件视界（更暗的核心）
                ctx.fillStyle = '#000033';
                ctx.beginPath();
                ctx.arc(event.x, event.y, radius, 0, Math.PI*2);
                ctx.fill();
                
                // 吸积盘（更动态的旋转）
                ctx.strokeStyle = `rgba(255, 153, 0, ${1 - progress * 0.7})`;
                ctx.lineWidth = 3;
                ctx.beginPath();
                
                // 动态扭曲效果
                const twist = Math.sin(Date.now() * 0.005) * 5;
                ctx.arc(event.x, event.y, radius + 5 + twist, 0, Math.PI*2);
                ctx.stroke();
                
                // 引力透镜效应（更真实的星光扭曲）
                if (progress > 0.3 && progress < 0.7) {
                    const distortion = (progress - 0.3) * 2.5;
                    const starsNearby = state.stars.filter(star => {
                        const dx = star.x - event.x;
                        const dy = star.y - event.y;
                        return Math.sqrt(dx*dx + dy*dy) < 200;
                    });
                    
                    starsNearby.forEach(star => {
                        const dx = star.x - event.x;
                        const dy = star.y - event.y;
                        const dist = Math.sqrt(dx*dx + dy*dy);
                        const angle = Math.atan2(dy, dx);
                        
                        // 非线性扭曲计算
                        const bendFactor = (200 - dist) / 200 * distortion * 15 / (dist/50 + 1);
                        const bendAngle = Math.sin(dist * 0.01) * distortion;
                        
                        ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness * 0.7})`;
                        ctx.fillRect(
                            star.x + Math.cos(angle + bendAngle) * bendFactor,
                            star.y + Math.sin(angle + bendAngle) * bendFactor,
                            star.size,
                            star.size
                        );
                    });
                }
                
                return true;
            }
        },
        'pulsar': {
            name: '脉冲星',
            description: '快速旋转的中子星，周期性发射电磁波，宇宙中的天然灯塔',
            color: '#00ff00',
            duration: 1000,
            draw: function(event) {
                const pulseTime = (Date.now() - event.startTime) % 1000;
                const pulseProgress = pulseTime / 1000;
        
                // 核心脉冲信号（固定位置）
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(event.x - 3, event.y - 3, 6, 6);
                
                // 极向辐射光束
                if (pulseProgress < 0.5) {
                    const beamLength = 80 + Math.sin(pulseProgress * Math.PI * 2) * 20;
                    const angle = (Date.now() - event.startTime) * 0.005;
                    
                    ctx.strokeStyle = `rgba(0, 255, 0, ${pulseProgress * 2 * 0.7})`;
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(event.x, event.y);
                    ctx.lineTo(
                        event.x + Math.cos(angle) * beamLength,
                        event.y + Math.sin(angle) * beamLength
                    );
                    ctx.stroke();
                }
                
                // 磁层辐射带（周期性闪烁）
                for (let i = 0; i < 3; i++) {
                    const pulse = (pulseProgress + i * 0.3) % 1;
                    const radius = 10 + Math.sin(pulse * Math.PI) * 8;
                    const alpha = Math.sin(pulse * Math.PI);
                    
                    ctx.strokeStyle = `rgba(0, 255, 0, ${alpha * 0.5})`;
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.arc(event.x, event.y, radius, 0, Math.PI * 2);
                    ctx.stroke();
                }
                
                return (Date.now() - event.startTime) < this.duration;
            }
        },
        'comet': {
            name: '彗星',
            description: '由冰和尘埃组成的天体，接近太阳时释放气体形成明亮的彗尾，宇宙中的旅行者',
            color: '#88ff88',
            duration: 3500,
            draw: function(event) {
                const progress = (Date.now() - event.startTime) / this.duration;
                // 增加轨迹长度检查
                if (progress >= 1.2 || 
                    event.x > canvas.width + 20 || event.x < -20 || 
                    event.y > canvas.height + 20 || event.y < -20) {
                    return false;
                }
                
                const x = event.startX + (event.endX - event.startX) * progress;
                const y = event.startY + (event.endY - event.startY) * progress;
                
                // 核心区域（更明亮中心）
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(event.x - 2, event.y - 2, 4, 4);
                
                // 气态尾迹（更长更柔和）
                const angle = Math.atan2(event.endY - event.startY, event.endX - event.startX);
                const tailLength = 50 + Math.sin(Date.now() * 0.005) * 15;
                
                // 主要离子尾（蓝色）
                for (let i = 1; i <= tailLength; i++) {
                    const tailX = x - Math.cos(angle) * i * 2;
                    const tailY = y - Math.sin(angle) * i * 2;
                    const alpha = 1 - (i / tailLength) * 0.8;
                    
                    ctx.fillStyle = `rgba(136, 255, 136, ${alpha * 0.5})`;
                    const size = 3 - (i / tailLength) * 1.5;
                    ctx.fillRect(tailX - size/2, tailY - size/2, size, size);
                }
                
                // 尘埃尾迹（黄色，受太阳风影响）
                if (Math.random() < 0.2) {
                    const particleX = x - Math.cos(angle) * (10 + Math.random() * tailLength);
                    const particleY = y - Math.sin(angle) * (10 + Math.random() * tailLength);
                    ctx.fillStyle = `rgba(255, 255, 150, ${0.3 + Math.random() * 0.4})`;
                    ctx.fillRect(particleX, particleY, 1, 1);
                }
                
                return true;
            }
        },
        'nebula': {
            name: '星云',
            description: '由气体和尘埃组成的巨大云团，恒星诞生和死亡的摇篮',
            color: '#9d65ff',
            duration: 8000,
            draw: function(event) {
                if (!event.gradient) {
                    // 创建多层渐变模拟不同气体成分
                    event.gradient = ctx.createRadialGradient(
                        event.x, event.y, 10,
                        event.x, event.y, 60
                    );
                    
                    event.gradient.addColorStop(0, this.color);
                    event.gradient.addColorStop(0.5, 'rgba(157, 101, 255, 0.3)');
                    event.gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
                    
                    event.size = 60;
                    event.particles = [];
                    
                    // 添加不同速度的粒子群
                    for (let i = 0; i < 50; i++) {
                        const speedFactor = Math.random();
                        event.particles.push({
                            x: event.x + Math.random() * 40 - 20,
                            y: event.y + Math.random() * 40 - 20,
                            vx: (Math.random() - 0.5) * (0.05 + speedFactor * 0.1),
                            vy: (Math.random() - 0.5) * (0.05 + speedFactor * 0.1),
                            size: 1 + Math.random() * 2,
                            alpha: 0.2 + Math.random() * 0.3,
                            life: Math.random(),
                            type: Math.floor(Math.random() * 3) // 0-电离氢，1-尘埃，2-高能粒子
                        });
                    }
                }
                
                const progress = (Date.now() - event.startTime) / this.duration;
                if (progress >= 1) return false;
                
                // 绘制基础星云
                ctx.fillStyle = event.gradient;
                ctx.beginPath();
                ctx.arc(event.x, event.y, event.size, 0, Math.PI * 2);
                ctx.fill();
                
                // 动态粒子系统
                ctx.save();
                ctx.globalCompositeOperation = 'lighter';
                
                event.particles.forEach(p => {
                    p.x += p.vx;
                    p.y += p.vy;
                    
                    // 根据粒子类型应用不同运动模式
                    if (p.type === 0) { // 电离氢
                        p.alpha *= 0.99;
                        ctx.fillStyle = `rgba(255, 100, 255, ${p.alpha})`;
                    } else if (p.type === 1) { // 尘埃
                        p.alpha *= 0.98;
                        ctx.fillStyle = `rgba(200, 150, 50, ${p.alpha})`;
                    } else { // 高能粒子
                        p.alpha *= 0.97;
                        ctx.fillStyle = `rgba(0, 255, 255, ${p.alpha})`;
                    }
                    
                    // 粒子生命周期管理
                    if (p.life > 0.5) {
                        ctx.fillRect(p.x, p.y, p.size, p.size);
                    } else {
                        ctx.beginPath();
                        ctx.arc(p.x, p.y, p.size/2, 0, Math.PI*2);
                        ctx.fill();
                    }
                    
                    p.life -= 0.001;
                });
                
                ctx.restore();
                
                // 星云膨胀动画
                event.size = 60 + Math.sin(progress * Math.PI) * 20;
                
                return true;
            }
        },
        'planet': {
            name: '行星',
            description: '围绕恒星运行的天体，可能孕育生命，宇宙中的家园',
            color: '#55aaff',
            duration: 5000,
            draw: function(event) {
                if (!event.init) {
                    event.radius = 20 + Math.random() * 15;
                    event.ringRadius = event.radius * (1.8 + Math.random() * 0.4);
                    event.rotation = 0;
                    event.rotationSpeed = Math.random() * 0.01 + 0.005;
                    
                    // 添加卫星系统
                    event.satellites = [];
                    const satelliteCount = Math.floor(Math.random() * 3) + 2;
                    
                    for (let i = 0; i < satelliteCount; i++) {
                        event.satellites.push({
                            angle: Math.random() * Math.PI * 2,
                            distance: event.ringRadius * (0.6 + Math.random() * 0.3),
                            size: 2 + Math.random() * 2,
                            speed: 0.002 + Math.random() * 0.003
                        });
                    }
                    
                    event.init = true;
                }
                
                ctx.save();
                ctx.translate(event.x, event.y);
                
                // 行星本体（带大气散射）
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(0, 0, event.radius, 0, Math.PI * 2);
                ctx.fill();
                
                // 大气层模拟
                ctx.globalAlpha = 0.3;
                ctx.strokeStyle = '#3388cc';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(0, 0, event.radius * 1.2, 0, Math.PI * 2);
                ctx.stroke();
                ctx.globalAlpha = 1;
                
                // 地质特征
                ctx.fillStyle = '#3388cc';
                for (let i = 0; i < 10; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const dist = Math.random() * event.radius * 0.7;
                    const size = 1 + Math.random() * 2;
                    ctx.fillRect(
                        Math.cos(angle) * dist - size/2,
                        Math.sin(angle) * dist - size/2,
                        size, size
                    );
                }
                
                // 动态卫星环
                ctx.rotate(event.rotation);
                ctx.strokeStyle = '#88ccff';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.ellipse(0, 0, event.ringRadius, event.ringRadius * 0.3, 0, 0, Math.PI * 2);
                ctx.stroke();
                
                // 卫星绘制
                event.satellites.forEach(sat => {
                    sat.angle += sat.speed;
                    ctx.fillStyle = '#ffffff';
                    ctx.beginPath();
                    ctx.arc(
                        Math.cos(sat.angle) * sat.distance,
                        Math.sin(sat.angle) * sat.distance,
                        sat.size, 0, Math.PI * 2
                    );
                    ctx.fill();
                });
                
                event.rotation += event.rotationSpeed;
                
                ctx.restore();
                
                return (Date.now() - event.startTime) < this.duration;
            }
        },
        'interstellar_dust': {
            name: '星际尘埃',
            description: '宇宙中漂浮的微小颗粒，影响恒星和行星的形成',
            color: '#cccccc',
            duration: 6000,
            draw: function(event) {
                if (!event.particles) {
                    event.particles = [];
                    for (let i = 0; i < 100; i++) {
                        event.particles.push({
                            x: event.x + Math.random() * 100 - 50,
                            y: event.y + Math.random() * 100 - 50,
                            vx: Math.random() * 0.5 - 0.25,
                            vy: Math.random() * 0.5 - 0.25,
                            size: Math.random() > 0.8 ? 2 : 1,
                            alpha: Math.random() * 0.5 + 0.2
                        });
                    }
                }
                
                event.particles.forEach(p => {
                    p.x += p.vx;
                    p.y += p.vy;
                    
                    if (p.x < event.x - 60 || p.x > event.x + 60) p.vx = -p.vx;
                    if (p.y < event.y - 60 || p.y > event.y + 60) p.vy = -p.vy;
                    
                    ctx.fillStyle = `rgba(204, 204, 204, ${p.alpha})`;
                    ctx.fillRect(p.x, p.y, p.size, p.size);
                });
                
                return (Date.now() - event.startTime) < this.duration;
            }
        },
        'gravitational_wave': {
            name: '引力波',
            description: '由大质量天体碰撞产生的时空波动，验证爱因斯坦广义相对论',
            color: '#00ffcc',
            duration: 3000,
            draw: function(event) {
                const progress = (Date.now() - event.startTime) / this.duration;
                if (progress >= 1) return false;
        
                // 主要引力波纹
                for (let i = 0; i < 3; i++) {
                    const waveRadius = progress * 100 + i * 20;
                    const alpha = 0.7 - progress * 0.7 + i * 0.2;
                    
                    ctx.strokeStyle = `rgba(0, 255, 204, ${alpha})`;
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    
                    // 添加频率调制
                    const frequencyModulation = Math.sin(waveRadius * 0.1);
                    
                    // 绘制波动时空网格
                    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI/16) {
                        const x1 = event.x + Math.cos(angle) * waveRadius;
                        const y1 = event.y + Math.sin(angle) * waveRadius;
                        const x2 = event.x + Math.cos(angle) * (waveRadius + 10);
                        const y2 = event.y + Math.sin(angle) * (waveRadius + 10);
                        
                        // 应用时空扭曲效果
                        const distortion = frequencyModulation * 5 * (1 - progress);
                        
                        ctx.beginPath();
                        ctx.moveTo(x1, y1);
                        ctx.lineTo(
                            x2 + Math.sin(angle + Date.now() * 0.002) * distortion,
                            y2 + Math.cos(angle + Date.now() * 0.002) * distortion
                        );
                        ctx.stroke();
                    }
                }
                
                // 星空扭曲效果
                if (progress > 0.2 && progress < 0.7) {
                    state.stars.forEach(star => {
                        const dx = star.x - event.x;
                        const dy = star.y - event.y;
                        const dist = Math.sqrt(dx*dx + dy*dy);
                        
                        if (dist < 150) {
                            const angle = Math.atan2(dy, dx);
                            // 非线性扭曲计算
                            const pull = (1 - progress) * (150 - dist) / 150 * 10 * (Math.sin(dist * 0.05 - progress * Math.PI * 2) + 1);
                            
                            ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness * 0.8})`;
                            ctx.fillRect(
                                star.x + Math.cos(angle) * pull,
                                star.y + Math.sin(angle) * pull,
                                star.size,
                                star.size
                            );
                        }
                    });
                }
                
                return true;
            }
        },
        'quantum_fluctuation': {
            name: '量子涨落',
            description: '量子场的随机波动现象，揭示微观世界的不确定性原理',
            color: '#0099ff',
            duration: 6000,
            draw: function(event) {
                const progress = (Date.now() - event.startTime) / this.duration;
                if (progress >= 1) return false;

                // 创建蓝色波纹扩散效果
                ctx.save();
                ctx.globalAlpha = 0.3 * (1 - progress);
                ctx.strokeStyle = '#0099ff';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(event.x, event.y, progress * 80, 0, Math.PI*2);
                ctx.stroke();
                ctx.restore();

                // 随机影响区域内的星星
                if (Math.random() < 0.05) {
                    const radius = 60;
                    state.stars.forEach(star => {
                        const dx = star.x - event.x;
                        const dy = star.y - event.y;
                        const dist = Math.sqrt(dx*dx + dy*dy);
                        
                        if (dist < radius) {
                            // 随机闪烁效果
                            star.visible = Math.random() > 0.7;
                            // 添加量子态标记
                            star.quantumState = true;
                            star.quantumTimer = Date.now() + 500;
                        }
                    });
                }

                // 像素点闪烁效果
                if (Math.random() < 0.3) {
                    const px = event.x + Math.random() * 40 - 20;
                    const py = event.y + Math.random() * 40 - 20;
                    ctx.save();
                    ctx.globalAlpha = Math.random() * 0.8 + 0.2;
                    ctx.fillStyle = '#00ccff';
                    ctx.fillRect(px, py, 1, 1);
                    ctx.restore();
                }

                // 持续时间检测
                return (Date.now() - event.startTime) < this.duration;
            }
        },
        'spaceship': {
            name: '星际飞船',
            description: '人类探索宇宙的工具，承载着对未知的渴望',
            color: '#ff5555',
            duration: 5000,
            draw: function(event) {
                if (!event.init) {
                    event.path = [
                        { x: -50, y: canvas.height / 2 },
                        { x: canvas.width / 3, y: canvas.height / 3 },
                        { x: canvas.width + 50, y: canvas.height / 2 }
                    ];
                    event.progress = 0;
                    event.speed = 0.001;
                    
                    // 创建飞船画布（带推进器闪光）
                    event.shipImg = document.createElement('canvas');
                    const shipCtx = event.shipImg.getContext('2d');
                    event.shipImg.width = 20;
                    event.shipImg.height = 12;
                    
                    shipCtx.fillStyle = '#ff5555';
                    shipCtx.fillRect(5, 0, 10, 12);
                    shipCtx.fillRect(15, 4, 5, 4);
                    shipCtx.fillStyle = '#ff9999';
                    shipCtx.fillRect(0, 4, 5, 4);
                    
                    // 添加推进器位置
                    event.thrusters = [
                        { x: 0, y: 8, color: '#ff3300' },
                        { x: 18, y: 8, color: '#ff3300' }
                    ];
                    
                    event.init = true;
                }
                
                event.progress += event.speed;
                if (event.progress >= 1) return false;
                
                const p0 = event.path[0];
                const p1 = event.path[1];
                const p2 = event.path[2];
                
                // 贝塞尔曲线计算
                const x = Math.pow(1-event.progress, 2)*p0.x + 
                         2*(1-event.progress)*event.progress*p1.x + 
                         Math.pow(event.progress, 2)*p2.x;
                const y = Math.pow(1-event.progress, 2)*p0.y + 
                         2*(1-event.progress)*event.progress*p1.y + 
                         Math.pow(event.progress, 2)*p2.y;
                
                // 计算速度矢量（用于多普勒效应）
                const dx = 2*(1-event.progress)*(p1.x-p0.x) + 2*event.progress*(p2.x-p1.x);
                const dy = 2*(1-event.progress)*(p1.y-p0.y) + 2*event.progress*(p2.y-p1.y);
                const angle = Math.atan2(dy, dx);
                
                ctx.save();
                ctx.translate(x, y);
                ctx.rotate(angle);
                
                // 多普勒频移效果
                const dopplerFactor = 1 + (Math.cos(angle) * 0.2);
                
                // 绘制飞船本体
                ctx.drawImage(event.shipImg, -10, -6);
                
                // 引力透镜效应
                if (Math.random() < 0.3) {
                    ctx.strokeStyle = `rgba(255, ${Math.floor(100 + Math.random() * 155)}, 0, ${0.8 * dopplerFactor})`;
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.arc(-15, 0, 8 + Math.sin(Date.now() * 0.01) * 4, 0, Math.PI * 2);
                    ctx.stroke();
                }
                
                // 推进器火焰（带相对论性喷流）
                if (Math.random() < 0.5) {
                    const flameSize = 8 + Math.sin(Date.now() * 0.01) * 4;
                    const redShift = Math.max(0, 255 - Math.floor(dopplerFactor * 100));
                    
                    ctx.fillStyle = `rgba(${redShift}, ${Math.floor(100 + Math.random() * 155)}, 0, ${0.8 * dopplerFactor})`;
                    ctx.fillRect(-15, -2, flameSize, 4);
                    
                    // 喷流粒子
                    if (Math.random() < 0.3) {
                        ctx.fillStyle = `rgba(${redShift}, 200, 0, ${Math.random() * 0.5})`;
                        ctx.fillRect(
                            -15 - Math.random() * 10,
                            -2 + Math.random() * 4,
                            1 + Math.random() * 2,
                            1 + Math.random() * 2
                        );
                    }
                }
                
                ctx.restore();
                
                return true;
            }
        },
        'dark_matter': {
            name: '暗物质云',
            description: '不可见的神秘物质云团，通过其引力效应揭示宇宙结构',
            color: '#330066',
            duration: 8000,
            draw: function(event) {
                const progress = (Date.now() - event.startTime) / this.duration;
                if (progress >= 1) return false;

                // 创建半透明黑色云团
                ctx.save();
                ctx.globalAlpha = 0.4 * (1 - Math.abs(progress - 0.5) * 2);
                
                // 扭曲网格效果
                const waveAmplitude = 15;
                const waveFrequency = 0.01;
                const timeFactor = Date.now() * 0.001;
                
                // 使用setTransform实现扭曲变形
                for (let y = 0; y < canvas.height; y += 20) {
                    const offsetX = Math.sin(y * waveFrequency + timeFactor) * waveAmplitude;
                    ctx.setTransform(1, 0, 0, 1, offsetX, y);
                    ctx.fillStyle = this.color;
                    ctx.fillRect(-offsetX, 0, canvas.width, 10);
                }
                
                // 恢复变换
                ctx.restore();

                // 降低经过区域星星亮度
                const radius = 50;
                state.stars.forEach(star => {
                    const dx = star.x - canvas.width/2;
                    const dy = star.y - canvas.height/2;
                    const dist = Math.sqrt(dx*dx + dy*dy);
                    
                    if (dist < radius) {
                        // 动态调整星星亮度
                        star.brightness = Math.max(0.1, star.brightness * (0.5 + progress * 0.5));
                        // 添加暗物质标记
                        star.darkMatterEffect = true;
                    } else if (star.darkMatterEffect) {
                        // 逐渐恢复亮度
                        star.brightness = Math.min(1, star.brightness * 1.1);
                        delete star.darkMatterEffect;
                    }
                });

                return true;
            }
        },
        'plasma_storm': {
            name: '等离子体风暴',
            description: '高能带电粒子流，展现宇宙中最剧烈的电磁现象',
            color: '#ff3300',
            duration: 5000,
            draw: function(event) {
                const progress = (Date.now() - event.startTime) / this.duration;
                if (progress >= 1) return false;

                // 屏幕震动效果
                if (Math.random() < 0.3) {
                    document.body.style.transform = `translate(${Math.random()*4-2}px, ${Math.random()*4-2}px)`;
                    setTimeout(() => {
                        document.body.style.transform = 'translate(0, 0)';
                    }, 50);
                }

                // 粒子系统
                ctx.save();
                ctx.globalAlpha = 0.6 * (1 - progress);
                
                for (let i = 0; i < 20; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const speed = Math.random() * 5 + 3;
                    const size = Math.random() * 3 + 1;
                    const life = Math.random() * this.duration * 0.8;
                    
                    const x = canvas.width/2 + Math.cos(angle) * (canvas.width * progress);
                    const y = canvas.height/2 + Math.sin(angle) * (canvas.height * progress);
                    
                    // 颜色渐变：红色到橙色
                    const gradient = ctx.createLinearGradient(x, y, canvas.width/2, canvas.height/2);
                    gradient.addColorStop(0, '#ff3300');
                    gradient.addColorStop(1, '#ff9900');
                    
                    ctx.fillStyle = gradient;
                    ctx.beginPath();
                    ctx.arc(x, y, size, 0, Math.PI*2);
                    ctx.fill();
                }
                
                ctx.restore();

                // 触发新的随机事件（增加屏幕上的视觉多样性）
                if (progress > 0.3 && progress < 0.7 && Math.random() < 0.02) {
                    triggerRandomEvent();
                }

                return true;
            }
        },
        'star_birth': {
            name: '恒星诞生',
            description: '星际物质在引力作用下坍缩形成新恒星的壮观过程',
            color: '#ffff66',
            duration: 7000,
            draw: function(event) {
                const progress = (Date.now() - event.startTime) / this.duration;
                if (progress >= 1) return false;

                // 星云粒子聚集效果
                if (!event.particles) {
                    event.particles = [];
                    for (let i = 0; i < 200; i++) {
                        event.particles.push({
                            x: Math.random() * canvas.width,
                            y: Math.random() * canvas.height,
                            vx: (canvas.width/2 - Math.random() * canvas.width) * 0.001,
                            vy: (canvas.height/2 - Math.random() * canvas.height) * 0.001,
                            size: Math.random() * 2 + 0.5,
                            alpha: Math.random() * 0.5 + 0.2,
                            life: Math.random()
                        });
                    }
                }

                // 径向渐变亮度变化
                const gradient = ctx.createRadialGradient(
                    canvas.width/2, canvas.height/2, 
                    20 * (1 - progress * 0.8),
                    canvas.width/2, canvas.height/2, 
                    100 * (progress * 1.2)
                );
                
                gradient.addColorStop(0, 'rgba(255, 255, 102, 0.8)');
                gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.4)');
                gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
                
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                // 绘制粒子系统
                event.particles.forEach(p => {
                    p.x += p.vx * (1 - progress);
                    p.y += p.vy * (1 - progress);
                    
                    ctx.fillStyle = `rgba(255, 255, 102, ${p.alpha * (0.5 + progress * 0.5)})`;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.size * (1 + progress * 0.5), 0, Math.PI*2);
                    ctx.fill();
                });

                // 突然闪光效果（在90%进度时触发）
                if (progress > 0.9 && !event.flashTriggered) {
                    event.flashTriggered = true;
                    
                    ctx.fillStyle = 'white';
                    ctx.globalAlpha = 0.3;
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.globalAlpha = 1;
                    
                    // 创建新星星
                    const newStar = {
                        x: canvas.width/2,
                        y: canvas.height/2,
                        size: 2,
                        brightness: 1,
                        twinkleSpeed: 0.002,
                        twinklePhase: Math.random() * Math.PI * 4,
                        color: '#ffffff',
                        visible: true
                    };
                    
                    state.stars.push(newStar);
                }

                return true;
            }
        },
        'ftl_neutrinos': {
            name: '超光速中微子',
            description: '以超越光速的速度穿越宇宙的神秘粒子，在时空中留下蓝色能量轨迹',
            color: '#00ccff',
            duration: 1000,
            draw: function(event) {
                const progress = (Date.now() - event.startTime) / this.duration;
                if (progress >= 1) return false;

                ctx.strokeStyle = this.color;
                ctx.lineWidth = 1;
                
                // 绘制5-8条随机穿透轨迹
                for(let i = 0; i < Math.floor(Math.random() * 4) + 5; i++) {
                    const startX = Math.random() * canvas.width;
                    const endX = Math.random() * canvas.width;
                    const startY = Math.random() * canvas.height;
                    const endY = Math.random() * canvas.height;
                    
                    // 随机相位偏移创造不同轨迹
                    const phaseOffset = Math.random() * Math.PI * 2;
                    
                    ctx.beginPath();
                    ctx.moveTo(startX, startY);
                    // 使用正弦波扰动创造粒子轨迹效果
                    for(let t = 0; t <= 1; t += 0.1) {
                        const x = startX + (endX - startX) * t + Math.sin(t * Math.PI * 2 + phaseOffset) * 5;
                        const y = startY + (endY - startY) * t + Math.cos(t * Math.PI * 2 + phaseOffset) * 5;
                        ctx.lineTo(x, y);
                    }
                    ctx.stroke();
                }
                
                // 快速闪烁效果
                if(Math.random() < 0.7) {
                    const intensity = Math.sin(progress * Math.PI * 4) * 0.5 + 0.5;
                    ctx.fillStyle = `rgba(0, 204, 255, ${intensity * 0.3})`;
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                }
                
                return true;
            }
        }
    };

    // 修改静音按钮逻辑
document.getElementById('muteButton').addEventListener('click', () => {
    state.isMuted = !state.isMuted;
    document.getElementById('muteButton').textContent = 
        state.isMuted ? '🔈' : '🔇';
});

// 在canvas点击事件中添加量子场稳定逻辑
canvas.addEventListener('click', (e) => {
    createClickEffect(e.clientX, e.clientY);
    
    const now = Date.now();
    const isSignificant = (now - state.lastClickTime) < 5000;
    
    if (isSignificant) {
        state.significantClicks++;
        showClickListener();
        updateClickCounter();
        
        if (state.significantClicks >= 99 && !state.threeBodyTriggered) {
            triggerThreeBodyEvent();
        }
    } else {
        state.normalClicks++;
        state.significantClicks = 1;
        showClickListener();
        updateClickCounter();
    }
    
    state.lastClickTime = now;
    
    // 修改点击计数逻辑：从每10次触发改为每20次触发
    if (state.normalClicks % 20 === 0 && Math.random() < 0.5) {  // 将概率从70%降低到50%
        triggerRandomEvent();
    }
    
    // 添加量子场稳定逻辑
    if (state.events.some(event => event.type === 'quantum_fluctuation')) {
        const quantumEvents = state.events.filter(e => e.type === 'quantum_fluctuation');
        quantumEvents.forEach(event => {
            const dx = e.clientX - event.x;
            const dy = e.clientY - event.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            
            if (dist < 40) { // 点击量子波动中心区域尝试稳定
                // 30%成功率
                if (Math.random() < 0.3) {
                    // 成功稳定量子态
                    event.stabilized = true;
                    showNotification('成功记录量子态！');
                    
                    // 恢复受影响的星星
                    state.stars.forEach(star => {
                        if (star.quantumState) {
                            star.visible = true;
                            delete star.quantumState;
                            delete star.quantumTimer;
                        }
                    });
                } else {
                    showNotification('量子场不稳定，继续尝试...');
                }
            }
        });
    }
    
    // 重置点击监听器
    showClickListener();
    resetClickListenerTimeout();
});

// 在触发事件时播放音效
function triggerRandomEvent() {
    const now = Date.now();
    if (now - state.lastEventTime < 8000) return;
    
    const uncollected = Object.keys(eventTypes).filter(type => !state.collectedEvents[type]);
    const availableEvents = uncollected.length > 0 ? 
        (Math.random() > 0.3 ? uncollected : Object.keys(eventTypes)) : 
        Object.keys(eventTypes);
    
    if (availableEvents.length === 0) return;
    
    const eventType = availableEvents[Math.floor(Math.random() * availableEvents.length)];
    const typeData = eventTypes[eventType];
    
    let event;
    event = {
        type: eventType,
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        startTime: now,
        duration: typeData.duration
    };
    
    // 特殊处理量子涨落事件：增加出现概率
    if (eventType === 'quantum_fluctuation') {
        event.x = canvas.width * 0.5;
        event.y = canvas.height * 0.5;
        event.duration = 6000;
    }
    
    state.events.push(event);
    state.lastEventTime = now;
    
    if (!state.collectedEvents[eventType]) {
        state.collectedEvents[eventType] = true;
        showNotification(`发现新事件: ${typeData.name}`);
        updateCollectionUI();
    }
}

    // 绘制事件
    function drawEvents() {
        state.events = state.events.filter(event => {
            return eventTypes[event.type].draw(event);
        });
    }

    // 显示通知
    function showNotification(message) {
        const notification = document.getElementById('eventNotification');
        notification.textContent = message;
        notification.style.opacity = 1;
        
        setTimeout(() => {
            notification.style.opacity = 0;
        }, 2000);
    }

    // 点击效果
    function createClickEffect(x, y) {
        const effect = document.createElement('div');
        effect.className = 'click-effect';
        effect.style.left = `${x}px`;
        effect.style.top = `${y}px`;
        document.body.appendChild(effect);
        
        setTimeout(() => {
            effect.remove();
        }, 600);
    }

    // 新增计时器重置函数
    function resetClickListenerTimeout() {
        if (state.clickTimeout) {
            clearTimeout(state.clickTimeout);
        }
        
        state.clickTimeout = setTimeout(() => {
            const listener = document.getElementById('clickListener');
            listener.style.opacity = 0;
            state.clickListenerVisible = false;
            state.significantClicks = 0;
            updateClickCounter();
        }, 5000);
    }

    // 修改后的显示监听器函数
    function showClickListener() {
        if (state.clickListenerVisible) return;
        
        state.clickListenerVisible = true;
        const listener = document.getElementById('clickListener');
        listener.style.opacity = 1;
    }

    // 显示点击监听器
    function showClickListener() {
        if (state.clickListenerVisible) return;
        
        state.clickListenerVisible = true;
        const listener = document.getElementById('clickListener');
        listener.style.opacity = 1;
        
        // 重置5秒计时器
        if (state.clickTimeout) {
            clearTimeout(state.clickTimeout);
        }
        
        state.clickTimeout = setTimeout(() => {
            listener.style.opacity = 0;
            state.clickListenerVisible = false;
            state.significantClicks = 0;
            updateClickCounter();
        }, 5000);
    }

    // 更新点击计数器
    function updateClickCounter() {
        const counter = document.getElementById('clickCounter');
        const meter = document.querySelector('#clickMeter div');
        
        counter.textContent = state.significantClicks;
        meter.style.width = `${Math.min(100, (state.significantClicks / 99) * 100)}%`;
    }

    // 触发三体事件
    function triggerThreeBodyEvent() {
        state.threeBodyTriggered = true;
        
        const originalGameLoop = gameLoop;
        gameLoop = function() {};
        
        const threeBodyEvent = document.createElement('div');
        threeBodyEvent.id = 'threeBodyEvent';
        threeBodyEvent.style.backgroundColor = '#000000'; // 添加基础背景色
        document.body.appendChild(threeBodyEvent);
        
        function flashScreen() {
            // 修改：仅保留蓝光和白光
            const colors = ['#00ccff', '#ffffff'];
            threeBodyEvent.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            threeBodyEvent.style.transition = 'none';
            
            setTimeout(() => {
                threeBodyEvent.style.transition = 'background-color 0.3s';
                threeBodyEvent.style.backgroundColor = 'transparent';
            }, 100);
        }
        
        function showText() {
            // 随机选择文本
            const texts = ['宇宙为你闪烁。', '不要回答！'];
            const randomText = texts[Math.floor(Math.random() * texts.length)];
            
            // 随机选择颜色效果
            const colorClasses = ['blue-glow', 'white-glow'];
            const randomColor = colorClasses[Math.floor(Math.random() * colorClasses.length)];
            
            // 随机选择动画类型
            const animations = ['slide', 'pulse', 'glitch', 'scan-line'];
            const randomAnim = animations[Math.floor(Math.random() * animations.length)];
            
            const textElement = document.createElement('div');
            textElement.className = `cyberpunk-text ${randomColor} ${randomAnim}`;
            textElement.textContent = randomText;
            threeBodyEvent.appendChild(textElement);
            
            // 设置动画持续时间
            const durations = [1000, 1500, 2000, 2500];
            textElement.style.animationDuration = `${durations[Math.floor(Math.random() * durations.length)]}ms`;
            
            setTimeout(() => {
                textElement.style.opacity = '0.5';
                // 随机应用另一种动画
                if (Math.random() < 0.5) {
                    textElement.classList.add('scan-line');
                }
            }, 500);
        }
        
        setTimeout(flashScreen, 1000);
        setTimeout(showText, 1500);
        setTimeout(flashScreen, 3000);
        
        setTimeout(() => {
            threeBodyEvent.remove();
            gameLoop = originalGameLoop;
            requestAnimationFrame(gameLoop);
        }, 10000);
    }

    // 更新UI函数
    function updateUI() {
        const collectedCount = Object.values(state.collectedEvents).filter(Boolean).length;
        document.getElementById('eventCount').textContent = collectedCount;
        
        // 动态获取并显示事件总数
        const totalEvents = Object.keys(eventTypes).length;
        document.getElementById('totalEvents').textContent = totalEvents;
        
        document.getElementById('progress').textContent = 
            Math.floor((collectedCount / totalEvents) * 100);
        
        // 宇宙观察维度统计
        document.getElementById('coordX').textContent = 
            Math.floor(state.playerX * 10).toString().padStart(5, '0');
        document.getElementById('coordY').textContent = 
            Math.floor(state.playerY * 10).toString().padStart(5, '0');
        
        // 计算时空曲率（基于玩家位置和宇宙时间的正弦波组合）
        const curvature = Math.sin(state.playerX * 0.01) * Math.cos(state.playerY * 0.01) * Math.sin(state.universeTime * 0.001);
        document.getElementById('curvature').textContent = 
            Math.abs(curvature).toFixed(2);
        
        document.getElementById('universeTime').textContent = Math.floor(state.universeTime / 20);
    }

    // 更新收集图鉴
    function updateCollectionUI() {
        const grid = document.getElementById('collectionGrid');
        grid.innerHTML = '';
        
        // 过滤掉未实现的事件（如果有的话）
        const validEvents = Object.entries(state.collectedEvents).filter(([type]) => 
            Object.prototype.hasOwnProperty.call(state.collectedEvents, type)
        );

        validEvents.forEach(([type, collected]) => {
            const item = document.createElement('div');
            item.className = 'collection-item';
            
            if (collected) {
                item.style.backgroundColor = eventTypes[type].color;
                item.textContent = 
                    type === 'quantum_fluctuation' ? '⚛️' : 
                    type === 'supernova' ? '💥' : 
                    type === 'blackhole' ? '⚫' : 
                    type === 'comet' ? '🌠' : 
                    type === 'nebula' ? '🌌' : 
                    type === 'planet' ? '🪐' : 
                    type === 'interstellar_dust' ? '✨' : 
                    type === 'gravitational_wave' ? '🌀' : 
                    type === 'pulsar' ? '⭐' : 
                    type === 'wormhole' ? '🕳️' : 
                    type === 'spaceship' ? '🚀' : 
                    type === 'dark_matter' ? '⬛' : 
                    type === 'plasma_storm' ? '⚡' : 
                    type === 'star_birth' ? '🌟' : '?';
                
                // 添加点击事件
                item.addEventListener('click', () => {
                    const modal = document.getElementById('descriptionModal');
                    const content = document.getElementById('descriptionContent');
                    // 获取事件名称和描述
                    const eventName = eventTypes[type].name || '未知事件';
                    const description = eventTypes[type].description || '暂无详细说明';
                    // 在名称和描述之间添加冒号和空格
                    content.textContent = `${eventName}: \n\n${description}`;
                    modal.style.display = 'block';
                });
            } else {
                item.textContent = '?';
            }
            
            grid.appendChild(item);
        });
    }

    // 设置事件监听器
    function setupEventListeners() {
        document.getElementById('collectionButton').addEventListener('click', () => {
            document.getElementById('collectionModal').style.display = 'block';
        });
        
        document.getElementById('closeCollection').addEventListener('click', () => {
            document.getElementById('collectionModal').style.display = 'none';
        });
        
        document.getElementById('closeDescription').addEventListener('click', () => {
            document.getElementById('descriptionModal').style.display = 'none';
        });
    }

    // 游戏主循环
    function gameLoop() {
        drawStars();
        drawEvents();
        updateUI();
        
        // 修改自动触发概率
        if (Math.random() < 0.002) {  // 原为0.005
            triggerRandomEvent();
        }
        
        state.universeTime += state.timeSpeed;
        state.playerX += Math.sin(state.universeTime * 0.01) * 0.1;
        state.playerY += Math.cos(state.universeTime * 0.015) * 0.1;
        
        requestAnimationFrame(gameLoop);
    }

    // 初始化并启动游戏
    initStars();
    updateCollectionUI();
    setupEventListeners();
    gameLoop();
}

// 页面加载完成后初始化游戏
document.addEventListener('DOMContentLoaded', initGame);