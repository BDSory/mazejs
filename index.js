//destructuring: everything we need is contained in obj Matter; short hand to create objects of types contained in Matter.
//what's below is boilerplate, an example of.... 
const {Engine, Render, Runner, World, Bodies, Body, Events } = Matter;

const width = window.innerWidth;
const height = window.innerHeight;
const cellsHorizontal = 4;
const cellsVertical = 3;

const unitLengthX = width / cellsHorizontal;
const unitLengthY = height / cellsVertical; 

const engine = Engine.create();
engine.world.gravity.y=0;
//world extends from engine and is a snapshot of all the shapes at our disposal.
const {world} = engine;
const render = Render.create({
    element: document.body,
    engine: engine,
    options: {
        wireframes: false,
        width,
        height
    }
});
Render.run(render);
Runner.run(Runner.create(),engine);

//walls
const walls = [
    Bodies.rectangle(width/2,0, width, 20, {isStatic:true}), 
    Bodies.rectangle(width/2,height, width, 20, {isStatic:true}), 
    Bodies.rectangle(0,height/2, 20, height, {isStatic:true}),
    Bodies.rectangle(width,height/2, 20, height, {isStatic:true})];


World.add(world, walls);

//Maze generation; grid is a hasVisited tracker

const shuffle = (arr) => {
    let counter = arr.length;

    while(counter >0) {
        const index = Math.floor(Math.random() * counter);

        counter --;

        const temp = arr[counter];
        arr[counter] = arr[index];
        arr[index] = temp;
    }
    return arr;
};

const grid = Array(cellsVertical).fill(null).map(() => Array(cellsHorizontal).fill(false));

const verticals = Array(cellsVertical).fill(null).map(() => Array(cellsHorizontal-1).fill(false));

const horizontals = Array(cellsVertical-1).fill(null).map(() => Array(cellsHorizontal).fill(false));

//Enter the maze

let startRow = Math.floor(Math.random() * cellsVertical);
let startColumn = Math.floor(Math.random() * cellsHorizontal);
// Bryan's first guess; Grider's solution after
// let entryPoint = [entryPointX, entryPointY];
// console.log(entryPoint)
const stepThru = (row, column)=> {
    if(grid[row][column]){
        return;
    } 
    grid[row][column] = true;

    const neighbors = shuffle([
        [row-1,column, 'up'],
        [row,column+1, 'right'],
        [row+1,column, 'down'],
        [row,column-1,'left']
    ]);
    //for each neighbor
    for(let neighbor of neighbors) {
        //LP: *nextRow/Col get interpolated thru destructuring in the next line b/c neighbor has an x and a y. So, in this case, the args as it were are defined in the destructuring. The language is doing the work. 
        const[nextRow, nextColumn, direction] = neighbor;
        //is neighbor out of bounds
        if (nextRow < 0  || nextRow >= cellsVertical || nextColumn < 0 || nextColumn >= cellsHorizontal) {
            continue;
        } 
        //if have visited neighbor, con't. to next neighbor; eg. 'is it true?'
        if (grid[nextRow][nextColumn]) {
            continue;
        }
        //remove wall from either horiz or vert
        if(direction==='left'){
            verticals[row][column-1] = true;
        } else if (direction==='right'){
            verticals[row][column] = true;
        } else if (direction==='up') {
            horizontals[row-1][column] = true;
        } else if (direction==='down') {
            horizontals[row][column] = true;
        }
        stepThru(nextRow, nextColumn);
    };
};
stepThru(startRow, startColumn);

horizontals.forEach((row, rowIndex) => {
    row.forEach((open, columnIndex) => {
        if (open) {
            return;
        }
        const wall = Bodies.rectangle(
            columnIndex * unitLengthX + unitLengthX / 2,
            rowIndex * unitLengthY + unitLengthY,
            unitLengthX,
            5,
            {
                label: 'wall',
                isStatic: true,
                render: {
                    fillStyle: 'red'
                }
            }
        );
        World.add(world, wall);
    })
});

verticals.forEach((row, rowIndex) => {
    row.forEach((open, columnIndex) => {
        if (open) {
            return;
        }
        const wall = Bodies.rectangle(
            columnIndex * unitLengthX + unitLengthX,
            rowIndex * unitLengthY + unitLengthY /2,
            5,
            unitLengthY,
            {
                label: 'wall',
                isStatic: true,
                render: {
                    fillStyle: 'red'
                }
            }
        );
        World.add(world, wall);
    })
});
//Goal
const goal = Bodies.rectangle(
    width - unitLengthX / 2,
    height - unitLengthY / 2,
    unitLengthX * .4,
    unitLengthY * .4,
    {
        label: 'goal',
        isStatic: true, 
        Render: {
            fillStyle: 'green'
        }
    }
);
World.add(world, goal);

//Ball
const ballRadius = Math.min(unitLengthX, unitLengthY / 5);
const ball = Bodies.circle(
    unitLengthX / 2,
    unitLengthY / 2,
    ballRadius, 
    {
        label: 'ball',
        render: {
            fillStyle: 'blue'
        }
    }
);
World.add(world, ball);

document.addEventListener('keydown', event => {
    const {x, y} = ball.velocity;
    //up
    if (event.key === 'w'){
        Body.setVelocity(ball, {x, y: y - 5});
    }
    //right
    if (event.key === 'd'){
        Body.setVelocity(ball, {x: x + 5, y});
    }
    //down
    if (event.key === 's'){
        Body.setVelocity(ball, {x, y: y + 5});
    }
    //left
    if (event.key === 'a'){
        Body.setVelocity(ball, {x: x - 5, y});
    }
});

//win condition

Events.on(engine, 'collisionStart', event => {
    event.pairs.forEach((collision) => {
        const labels = ['ball', 'goal'];

        if (
            labels.includes(collision.bodyA.label) &&
            labels.includes(collision.bodyB.label)
        ){
            document.querySelector('.winner').classList.remove('hidden');
            world.gravity.y = 1;
            world.bodies.forEach(body => {
                Body.setStatic(body, false);
            })
        }
    })
})