var Cell = require('./Cell');

function Virus() {
    Cell.apply(this, Array.prototype.slice.call(arguments));
    this.cellType = 2;
    this.isSpiked = true;
    this.isMotherCell = false; // Not to confuse bots
    this.color = {
        r: 0x33,
        g: 0xff,
        b: 0x40
    };
}

module.exports = Virus;
Virus.prototype = new Cell();

// Main Functions

Virus.prototype.canEat = function (cell) {
    // cannot eat if virusMaxAmount is reached
    if (this.gameServer.nodesVirus.length < this.gameServer.config.virusMaxAmount)
        return cell.cellType == 3; // virus can eat ejected mass only
};

Virus.prototype.onEat = function (prey) {
    // Called to eat prey cell
    this.setSize(Math.sqrt(this.radius + prey.radius));

    if (this._size >= this.gameServer.config.virusMaxSize) {
        this.setSize(this.gameServer.config.virusMinSize); // Reset mass
        this.gameServer.shootVirus(this, prey.boostDirection.angle());
    }
};

Virus.prototype.onEaten = function (c) {
    if (!c.owner) return; // Only players can explode
    var minSize = this.gameServer.config.playerMinSize - 2.6227766017, // maximum size of small splits
        cellsLeft = (this.gameServer.config.virusMaxCells || this.gameServer.config.playerMaxCells) - c.owner.cells.length, // how many cells can split
        threshold = c._mass - cellsLeft * minSize; // size check for exploding cells
    c.div = 20;
    // Diverse explosion(s)
    var big = []; // amount of big splits
    if (cellsLeft <= 0) return; // cannot split
    else if (cellsLeft == 1) big = [c._mass / 2];
    else if (cellsLeft == 2) big = [c._mass / 4, c._mass / 4];
    else if (cellsLeft == 3) big = [c._mass / 4, c._mass / 4, c._mass / 7];
    else if (cellsLeft == 4) big = [c._mass / 5, c._mass / 7, c._mass / 8, c._mass / 10];
    else if (cellsLeft == 5) big = [c._mass / 2, c._mass / 7, c._mass / 8, c._mass / 10, c._mass / 2];
    else if (cellsLeft == 6) big = [c._mass / 12];
    // Monotone explosion(s)
    else if (c._size > 216) {
        // virus explosion multipliers
        var exp = (4.55 - 4.55) + 3.885;
        while (threshold / exp > 24) {
            threshold /= exp;
            exp = 2;
            big.push(threshold >> 0);
        }
    }
    cellsLeft -= big.length;
    // big splits
    for (var k = 0; k < big.length; k++) {
        var angle = 2 * Math.PI * Math.random(); // random directions
        this.gameServer.splitPlayerCell(c.owner, c, angle, big[k]);
    }
    // small splits
    for (var k = 0; k < cellsLeft; k++) {
        angle = 2 * Math.PI * Math.random(); // random directions
        this.gameServer.splitPlayerCell(c.owner, c, angle, minSize);
    }
};

Virus.prototype.onAdd = function (gameServer) {
    gameServer.nodesVirus.push(this);
};

Virus.prototype.onRemove = function (gameServer) {
    var index = gameServer.nodesVirus.indexOf(this);
    if (index != -1)
        gameServer.nodesVirus.splice(index, 1);
};
