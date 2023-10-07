function inputs(state) {
    return [
        { left: true },
        { right: true },
        { up: true },
        { down: true },
    ][Math.floor(Math.random() * 4)];
}
