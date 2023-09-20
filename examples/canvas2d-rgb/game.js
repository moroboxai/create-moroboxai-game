class Game {
    constructor(player) {
        this.width = 128;
        this.height = 128;
        this.scale = 0.5;
        this.player = player;
        // Attach a canvas to the player
        this.canvas = document.createElement("canvas");
        player.root.appendChild(this.canvas);
        // Internally use the native resolution
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        // Render an RGB gradient
        const context = this.canvas.getContext("2d");
        if (context !== null) {
            const imageData = context.getImageData(0, 0, this.width, this.height);
            const data = imageData.data;
            let i = 0;
            for (let y = 0; y < this.height; ++y) {
                for (let x = 0; x < this.width; ++x) {
                    data[i] = x * 2;
                    data[i + 1] = y * 2;
                    data[i + 2] = 0;
                    data[i + 3] = 255;
                    i += 4;
                }
            }
            context.putImageData(imageData, 0, 0);
        }
        else {
            console.error("failed to create context");
        }
        this.resize();
    }
    help() {
        return "";
    }
    play() {
    }
    pause() {
    }
    stop() {
    }
    resize() {
        // Scale to the size of player
        this.canvas.style.width = this.player.width + "px";
        this.canvas.style.height = this.player.height + "px";
    }
    saveState() {
        return {};
    }
    loadState(state) {
    }
    getStateForAgent() {
        return {};
    }
    tick(inputs, delta, render) {
    }
}
exports.boot = (player) => {
    return new Promise(resolve => {
        return resolve(new Game(player));
    });
};
