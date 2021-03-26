var Game = {};
Game.Images = [];

function InitGame() {
    Game.Canvas = document.getElementById("canvas_numeralDisplay");
    Game.GL = Game.Canvas.getContext("webgl");
    if (!Game.GL) {
        console.log("WebGL unsupported!");
        return;
    }

    InitWebGL(Game.GL);

    ResizeCanvas(256, 64);
}

function ResizeCanvas(W, H) {
    Game.Canvas.width = W;
    Game.Canvas.height = H;
    Game.GL.viewport(0, 0, W, H);

    var x = (1 / (W / 64)) * 2;
    var y = 2;
    Game.GL.uniformMatrix4fv(Game.u_projectionLoc, false, [
        x, 0, 0, 0,
        0, y, 0, 0,
        0, 0, 1, 0,
        -1, -1, 0, 1
    ]);
}

function InitWebGL(gl) {
    var vShader = CreateVertexShader(gl);
    var fShader = CreateFragmentShader(gl);
    var prog = CreaterShaderProgram(gl, vShader, fShader);
    gl.useProgram(prog);

    var a_vertexLoc = gl.getAttribLocation(prog, "a_vertex");
    gl.enableVertexAttribArray(a_vertexLoc);

    Game.u_projectionLoc = gl.getUniformLocation(prog, "u_projection");
    Game.u_positionLoc = gl.getUniformLocation(prog, "u_position");
    Game.u_quadValsLoc = gl.getUniformLocation(prog, "u_quadVals");

    Game.u_textureLoc = gl.getUniformLocation(prog, "u_texture");
    Game.u_texSizeLoc = gl.getUniformLocation(prog, "u_texSize");



    CreateVertexBuffer(gl, a_vertexLoc);
    CreateTextureSheet(gl);

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
}

function CreateVertexBuffer(gl, a_vertexLoc) {
    var data = [
        0, 0,
        1, 0,
        1, 1,
        1, 1,
        0, 1,
        0, 0
        ];

    var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
    gl.vertexAttribPointer(a_vertexLoc, 2, gl.FLOAT, false, 0, 0);
}

function CreateVertexShader(gl) {
    var code = document.getElementById("standardVertexShader").textContent;
    var shader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(shader, code);
    gl.compileShader(shader);
    var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (!success) {
        throw "Failed to compile vertex shader!";
    }
    return shader;
}

function CreateFragmentShader(gl) {
    var code = document.getElementById("standardFragmentShader").textContent;
    var shader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(shader, code);
    gl.compileShader(shader);
    var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (!success) {
        throw "Failed to compile fragment shader!";
    }
    return shader;
}

function CreaterShaderProgram(gl, vertex, fragment) {
    var program = gl.createProgram();
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    var success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (!success) {
        throw "Failed to link shader program!";
    }
    return program;
}

function CreateTextureSheet() {
    Game.ImagesLoading = 0;
    for (var k = 0; k < 10; k++) {
        LoadImage(k);
    }
}

function LoadImage(num) {
    var BaseDir = "content/";

    Game.ImagesLoading++;

    var img = document.createElement("img");
    img.onload = function() {
        var W = img.width;
        var H = img.height;

        Game.ImagesLoading--;
        CheckImageLoading();
    }.bind(this);
    img.src = BaseDir + num + ".png";;

    Game.Images.push([num, img]);
}

var DoneLoadingImages = false;
function CheckImageLoading() {
    if (Game.ImagesLoading > 0 || DoneLoadingImages) { return; }

    DoneLoadingImages = true;

    var imgSize = 64;

    var gl = Game.GL;
    var numImg = Game.Images.length;

    Game.TexSize = Math.pow(2, Math.ceil(Math.log2(Math.sqrt(numImg))));
    gl.uniform1f(Game.u_texSizeLoc, Game.TexSize);

    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, Game.TexSize * imgSize, Game.TexSize * imgSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

    for (var k = 0; k < numImg; k++) {
        var thisObj = Game.Images[k];
        var num = thisObj[0];
        var img = thisObj[1];

        var offsetX = (num % Game.TexSize);
        var offsetY = Math.floor(num / Game.TexSize);

        gl.texSubImage2D(gl.TEXTURE_2D, 0, offsetX * imgSize, offsetY * imgSize, gl.RGBA, gl.UNSIGNED_BYTE, img)
    }

    RenderFrame();
}



var num = 1;
var nextTick = 0;
var numStep = 1;
var tickRate = 1000;

function RenderFrame() {
    requestAnimationFrame(RenderFrame);

    Game.GL.clear(Game.GL.COLOR_BUFFER_BIT);

    var numDigits = Math.ceil(Math.log(num) / Math.log(10000));
    var thisDigit = num;
    for (var k = 0; k < numDigits; k++) {
        var d1 = Math.floor(thisDigit % 10);
        var d2 = Math.floor(thisDigit / 10) % 10;
        var d3 = Math.floor(thisDigit / 100) % 10;
        var d4 = Math.floor(thisDigit / 1000) % 10;

        Game.GL.uniform2f(Game.u_positionLoc, numDigits - k - 1, 0);
        Game.GL.uniform4f(Game.u_quadValsLoc, d1, d2, d3, d4);
        Game.GL.drawArrays(Game.GL.TRIANGLES, 0, 6);

        thisDigit /= 10000;
    }

    document.getElementById("NumericDisplay").innerHTML = num.toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",");

    var dNow = Date.now();
    if (dNow > nextTick) {
        nextTick = dNow + tickRate;
        num += numStep;
    }
}

function IncreaseNumber(btn) {
    numStep++;
    btn.innerHTML = `Increase number +1 (${numStep})`;
}

function IncreaseTickrate(btn) {
    tickRate = Math.round(tickRate * 0.9);
    btn.innerHTML = `Increase speed (${tickRate}ms)`;
}
