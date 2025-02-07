"use strict";
document.addEventListener("DOMContentLoaded", () => {
    const globalParams = {
        isRunning: false,
        radius: 2,
        edgeDumping: 0,
        friction: 50,
        nucleusRepulsion: 0.5,
        margin: 0,
        mouseInteraction: false,
        backgroundOpacity: 1,
        randomizeRules: () => {
            randomizeRules();
        },
    };
    // @ts-expect-error
    const controlGui = new lil.GUI();
    controlGui.close();
    const globalSettingsFolder = controlGui.addFolder("Global settings");
    globalSettingsFolder.add(globalParams, "isRunning").name("Is running");
    globalSettingsFolder
        .add(globalParams, "radius", 1, 5)
        .name("Particle radius");
    globalSettingsFolder
        .add(globalParams, "edgeDumping", 0, 1, 0.01)
        .name("Edge dumping");
    globalSettingsFolder
        .add(globalParams, "friction", 0, 1_000, 0.1)
        .name("Friction");
    globalSettingsFolder
        .add(globalParams, "nucleusRepulsion", 0, 1, 0.01)
        .name("Nucleus repulsion");
    globalSettingsFolder.add(globalParams, "margin", 0, 100, 1).name("Margin");
    globalSettingsFolder
        .add(globalParams, "mouseInteraction")
        .name("Mouse interaction");
    globalSettingsFolder
        .add(globalParams, "backgroundOpacity", 0, 1, 0.01)
        .name("Background opacity");
    globalSettingsFolder
        .add(globalParams, "randomizeRules")
        .name("Randomize rules");
    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    const GROUPS = ["Group 1", "Group 2", "Group 3"];
    const colorTheme = {
        background: `rgba(0, 0, 0, ${globalParams.backgroundOpacity})`,
        // groups: ["#FF18C8", "#1BEAFF", "#7BFF00"],
        groups: {
            [GROUPS[0]]: "#FF18C8",
            [GROUPS[1]]: "#1BEAFF",
            [GROUPS[2]]: "#7BFF00",
        },
    };
    const rules = [];
    for (const who of GROUPS) {
        for (const to of GROUPS) {
            rules.push({
                who,
                to,
                distance: 100,
                attraction: 0,
            });
        }
        rules.push({
            who,
            to: "mouse",
            distance: 100,
            attraction: 0,
        });
    }
    const rulesFolder = controlGui.addFolder("Rules");
    rulesFolder.close();
    for (const group of GROUPS) {
        const groupRules = rules.filter((r) => r.who === group);
        const groupFolder = rulesFolder.addFolder(group);
        groupFolder.addColor(colorTheme.groups, group).name("Color");
        for (const rule of groupRules) {
            const ruleFolder = groupFolder.addFolder(rule.to);
            ruleFolder.add(rule, "distance", 0, 1_000).name("Distance");
            ruleFolder.add(rule, "attraction", -1, 1, 0.01).name("Attraction");
            ruleFolder.close();
        }
        groupFolder.close();
    }
    const mousePosition = {
        x: 0,
        y: 0,
    };
    function addParticles(group, count) {
        return Array.from({
            length: count,
        }).map(() => ({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            group,
            vx: (Math.random() - 1) / 1000,
            vy: (Math.random() - 1) / 1000,
        }));
    }
    const particles = GROUPS.flatMap((c) => addParticles(c, 300));
    function bounceLimits(particle) {
        const heightMargin = (canvas.height / 2) * (globalParams.margin / 100);
        const widthMargin = (canvas.width / 2) * (globalParams.margin / 100);
        if (particle.y > canvas.height - heightMargin) {
            particle.vy *= -1 + globalParams.edgeDumping;
            particle.y = canvas.height - heightMargin;
        }
        if (particle.y < heightMargin) {
            particle.vy *= -1 + globalParams.edgeDumping;
            particle.y = heightMargin;
        }
        if (particle.x > canvas.width - widthMargin) {
            particle.vx *= -1 + globalParams.edgeDumping;
            particle.x = canvas.width - widthMargin;
        }
        if (particle.x < 0 + widthMargin) {
            particle.vx *= -1 + globalParams.edgeDumping;
            particle.x = widthMargin;
        }
    }
    function bounceDistance(p1, p2) {
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return [distance, dx, dy];
    }
    function infinityDistance(p1, p2) {
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return [distance, dx, dy];
    }
    function inifintyLoop(particle) {
        if (particle.y > canvas.height) {
            particle.y = 0;
        }
        if (particle.y < 0) {
            particle.y = canvas.height;
        }
        if (particle.x > canvas.width) {
            particle.x = 0;
        }
        if (particle.x < 0) {
            particle.x = canvas.width;
        }
    }
    function applyAttraction(p1, p2) {
        const rule = rules.find((r) => {
            return r.who === p1.group && r.to === p2.group;
        });
        if (!rule) {
            return;
        }
        let fx = 0;
        let fy = 0;
        const [distance, dx, dy] = bounceDistance(p1, p2);
        if (distance > globalParams.radius * 2 && distance < rule.distance) {
            const F = rule.attraction / distance;
            fx = F * dx;
            fy = F * dy;
        }
        else if (distance < globalParams.radius * 2) {
            const F = 0.01 *
                globalParams.nucleusRepulsion *
                (1 / (distance / (globalParams.radius * 2)));
            fx = -1 * F * dx;
            fy = -1 * F * dy;
            p2.vx = -1 * (p2.vx + fx) * (1 - globalParams.friction / 2_000);
            p2.vy = -1 * (p2.vy + fy) * (1 - globalParams.friction / 2_000);
        }
        p1.vx = (p1.vx + fx) * (1 - globalParams.friction / 2_000);
        p1.vy = (p1.vy + fy) * (1 - globalParams.friction / 2_000);
        p1.x += p1.vx;
        p1.y += p1.vy;
        bounceLimits(p1);
        // inifintyLoop(p1);
    }
    function applyRules() {
        for (const particle1 of particles) {
            for (const particle2 of particles) {
                if (particle1 === particle2) {
                    continue;
                }
                applyAttraction(particle1, particle2);
            }
            if (globalParams.mouseInteraction) {
                applyAttraction(particle1, {
                    x: mousePosition.x,
                    y: mousePosition.y,
                    group: "mouse",
                    vx: 0,
                    vy: 0,
                });
            }
        }
    }
    function drawBoundingBox() {
        ctx.strokeStyle = "white";
        const heightMargin = (canvas.height / 2) * (globalParams.margin / 100);
        const widthMargin = (canvas.width / 2) * (globalParams.margin / 100);
        ctx.strokeRect(widthMargin - globalParams.radius, heightMargin - globalParams.radius, canvas.width - widthMargin * 2 + globalParams.radius * 2, canvas.height - heightMargin * 2 + globalParams.radius * 2);
    }
    function render() {
        clearCanvas();
        for (const particle of particles) {
            if (particle.group !== "mouse") {
                drawCircle(particle.x, particle.y, colorTheme.groups[particle.group]);
            }
        }
        drawBoundingBox();
        if (globalParams.isRunning) {
            applyRules();
        }
        window.requestAnimationFrame(render);
    }
    render();
    function clearCanvas() {
        ctx.fillStyle = `rgba(0, 0, 0, ${globalParams.backgroundOpacity})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    function drawCircle(x, y, color = "white") {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.ellipse(x, y, globalParams.radius, globalParams.radius, 0, 0, 2 * Math.PI);
        ctx.fill();
    }
    function randomColorChannelValue() {
        return Math.round(Math.random() * 255);
    }
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    canvas.addEventListener("mousemove", (event) => {
        mousePosition.x = event.clientX;
        mousePosition.y = event.clientY;
    });
    canvas.addEventListener("mousedown", (event) => {
        console.log("mousedown");
        globalParams.mouseInteraction = true;
    });
    canvas.addEventListener("mouseup", (event) => {
        globalParams.mouseInteraction = false;
    });
    function randomizeRules() {
        for (const rule of rules) {
            rule.distance = Math.round(Math.random() * 1_000);
            rule.attraction = Math.random() * 2 - 1;
        }
        for (const ruleFolder of rulesFolder.children) {
            for (const controller of ruleFolder.controllers) {
                controller.updateDisplay();
            }
        }
    }
});
