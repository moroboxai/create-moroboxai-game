class Game {
    constructor(vm) {
        // Offset driven by the agent
        this.dX = 0;
        this.dY = 0;
        this.vm = vm;
        // Create a new canvas
        this.canvas = document.createElement("canvas");
        this.context = this.canvas.getContext("2d");
        // Internally use the native resolution of 256x256 pixels
        this.canvas.width = 256;
        this.canvas.height = 256;
        this.imageData = this.context.getImageData(
            0,
            0,
            this.canvas.width,
            this.canvas.height
        );
        // Attach to the VM
        this.data = this.imageData.data;
        vm.root.appendChild(this.canvas);
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
    tick(controllers, delta, render) {
        const speed = 0.1;
        const inputs = controllers[0].inputs;
        // Take agent inputs into account
        if (inputs.left) {
            this.dX -= speed * delta;
        } else if (inputs.right) {
            this.dX += speed * delta;
        }
        if (inputs.up) {
            this.dY -= speed * delta;
        } else if (inputs.down) {
            this.dY += speed * delta;
        }
        // Render if requested
        if (render) {
            let i = 0;
            for (let y = 0; y < this.vm.height; ++y) {
                for (let x = 0; x < this.vm.width; ++x) {
                    this.data[i] = (x + this.dX) % 256;
                    this.data[i + 1] = (y + this.dY) % 256;
                    this.data[i + 2] = 0;
                    this.data[i + 3] = 255;
                    i += 4;
                }
            }
            this.context.putImageData(this.imageData, 0, 0);
        }
    }
}
exports.boot = (options) => {
    return new Promise((resolve) => {
        return resolve(new Game(options.vm));
    });
};
