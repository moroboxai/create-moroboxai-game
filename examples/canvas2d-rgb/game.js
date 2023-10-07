class Game {
    constructor(vm) {
        this.width = 128;
        this.height = 128;
        this.scale = 0.5;
        // Offset driven by the agent
        this.dX = 0;
        this.dY = 0;
        this.vm = vm;
        // Attach a canvas to the VM
        this.canvas = document.createElement("canvas");
        this.context = this.canvas.getContext("2d");
        this.imageData = this.context.getImageData(
            0,
            0,
            this.width,
            this.height
        );
        this.data = this.imageData.data;
        vm.root.appendChild(this.canvas);
        // Internally use the native resolution
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        // Game loop
        this.callTicker = this.callTicker.bind(this);
        window.requestAnimationFrame(this.callTicker);
        this.resize();
    }
    help() {
        return "";
    }
    play() {}
    pause() {}
    stop() {}
    resize() {
        // Scale to the size of VM
        this.canvas.style.width = this.vm.width + "px";
        this.canvas.style.height = this.vm.height + "px";
    }
    saveState() {
        return { dX: this.dX, dY: this.dY };
    }
    loadState(state) {
        this.dX = state.dX;
        this.dY = state.dY;
    }
    getStateForAgent() {
        return this.saveState();
    }
    callTicker(time) {
        if (this.oldTime === undefined) {
            this.oldTime = time;
        }
        if (this.oldTime !== time) {
            const deltaTime = time - this.oldTime;
            this.oldTime = time;
            if (this.ticker !== undefined) {
                this.ticker(deltaTime);
            }
        }
        window.requestAnimationFrame(this.callTicker);
    }
    tick(inputs, delta, render) {
        const speed = 0.1;
        // Take agent inputs into account
        if (inputs[0].left) {
            this.dX -= speed * delta;
        } else if (inputs[0].right) {
            this.dX += speed * delta;
        }
        if (inputs[0].up) {
            this.dY -= speed * delta;
        } else if (inputs[0].down) {
            this.dY += speed * delta;
        }
        // Render if requested
        if (render) {
            let i = 0;
            for (let y = 0; y < this.height; ++y) {
                for (let x = 0; x < this.width; ++x) {
                    this.data[i] = ((x + this.dX) * 2) % 256;
                    this.data[i + 1] = ((y + this.dY) * 2) % 256;
                    this.data[i + 2] = 0;
                    this.data[i + 3] = 255;
                    i += 4;
                }
            }
            this.context.putImageData(this.imageData, 0, 0);
        }
    }
}
exports.boot = (vm) => {
    return new Promise((resolve) => {
        return resolve(new Game(vm));
    });
};
