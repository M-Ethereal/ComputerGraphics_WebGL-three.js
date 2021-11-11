"use strict";

var gl;

var bodyVertexPositionBuffer;
var bodyVertexColorBuffer;
var fcolor;
var start;
var end;

var points;
var num;
var points_num;

var right = 0.0;
var rightLoc;
var up = 0.0;
var upLoc;

var speed = 25;
var direction = true;
var autoGo = false;
var stop = false;
var count = 0;

var step = 0.05;

var jumpCount = 0;
var isMouseMove = 0;

var flower = false;
var wing = false;

var thetaLeft = 130;
var thetaRight = 40;
var control = 100;
var frequency = 50;
var amplitude = 100;

window.onload = function init()
{
    var canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    //
    //  Configure WebGL
    //
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );

    //  Load shaders and initialize attribute buffers

    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    points = new Array();
    num = new Array();
    points_num = new Array();

    //身体
    num.push(points.length/2);
    points_num.push(oval(0,45,1,0.6,0,0,0));
    num.push(points.length/2);
    points_num.push(oval(45,82.5,1,0.6,0,0,0));
    num.push(points.length/2);
    points_num.push(oval(82.5,120,1,0.6,0,0,0));
    num.push(points.length/2);
    points_num.push(oval(120,180,1,0.6,0,0,0));

    //尾巴
    num.push(points.length/2);
    points.push(0.4);
    points.push(0.05);
    points.push(0.4);
    points.push(-0.05);
    points.push(0.7);
    points.push(0);
    points_num.push(3);

    //左眼
    num.push(points.length/2);
    points.push(-0.42);//左上
    points.push(0.07);
    points.push(-0.43);//左下
    points.push(0.01);
    points.push(-0.41);//右上
    points.push(0.07);
    points.push(-0.42);//右下
    points.push(0.01);
    points_num.push(4);

    //右眼
    num.push(points.length/2);
    points.push(-0.375);//左上
    points.push(0.075);
    points.push(-0.385);//左下
    points.push(0.008);
    points.push(-0.365);//右上
    points.push(0.075);
    points.push(-0.375);//右下
    points.push(0.008);
    points_num.push(4);

    //腮红
    num.push(points.length/2);
    points_num.push(oval(0,180,0.08,0.04,-0.65,0,0));
    num.push(points.length/2);
    points_num.push(oval(0,180,0.05,0.04,-0.92,0,0));

    //花
    //花瓣0
    num.push(points.length/2);
    points_num.push(oval(0,180,0.48,0.32,0.3,-1.34,0));
    num.push(points.length/2);
    points_num.push(oval(0,180,0.45,0.37,0.1,-1.34,0));
    //花瓣1
    num.push(points.length/2);
    points_num.push(oval(0,180,0.3,0.2,0,-1.2,0));
    num.push(points.length/2);
    points_num.push(oval(0,180,0.5,0.3,0.2,-1.4,0));
    //花瓣2
    num.push(points.length/2);
    points_num.push(oval(0,180,0.35,0.25,-0.2,-1.4,10));
    num.push(points.length/2);
    points_num.push(oval(0,180,0.3,0.23,0.15,-1.35,0));
    //花瓣3
    num.push(points.length/2);
    points_num.push(oval(0,180,0.3,0.2,0.5,-1.28,-10));
    num.push(points.length/2);
    points_num.push(oval(0,180,0.25,0.18,0.2,-1.3,0));
    //花瓣4
    num.push(points.length/2);
    points_num.push(oval(0,180,0.25,0.13,0.18,-1.3,0));
    num.push(points.length/2);
    points_num.push(oval(0,180,0.2,0.12,0.25,-1.3,0));
    //花瓣5
    num.push(points.length/2);
    points_num.push(oval(0,180,0.12,0.08,0.25,-1.3,0));

    //绿叶
    //绿叶左
    num.push(points.length/2);
    points_num.push(oval(0,180,0.5,0.2,0.3,-1.8,-30));
    num.push(points.length/2);
    points.push(-0.53);//左上
    points.push(-0.7);
    points.push(-0.33);//左下
    points.push(-0.98);
    points.push(-0.66);//右上
    points.push(-0.7);
    points.push(-0.46);//右下
    points.push(-0.98);
    points_num.push(4);
    //绿叶右
    num.push(points.length/2);
    points_num.push(oval(0,180,0.5,0.2,-0.09,-1.97,30));
    num.push(points.length/2);
    points.push(0.68);//左上
    points.push(-0.7);
    points.push(0.48);//左下
    points.push(-0.98);
    points.push(0.8);//右上
    points.push(-0.7);
    points.push(0.6);//右下
    points.push(-0.98);
    points_num.push(4);

    //翅膀
    num.push(points.length/2);
    points_num.push(oval(0,180,0.25,0.2,0.55,-0.45,130));//后
    num.push(points.length/2);
    points_num.push(oval(0,180,0.4,0.25,0.85,0.3,40));//前

    // Load the data into the GPU

    bodyVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bodyVertexPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);

    // Associate out shader variables with our data buffer

    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray(vPosition);

    fcolor = gl.getUniformLocation( program, "fcolor" );
    rightLoc = gl.getUniformLocation(program, "right");
    upLoc = gl.getUniformLocation(program, "up");

    // Initialize event handlers

    document.getElementById("slider").onchange = function(event) {
        speed = 100 - event.target.value;
    };
    document.getElementById("slider_theta").onchange = function(event) {
        amplitude = event.target.value;
    };

    //菜单选项
    document.getElementById("Controls").onclick = function( event) {
        switch(event.target.index) {
            case 0:
                autoGo = !autoGo;
                stop = false;
                flower = false;
                break;

            case 1:
                stop = true;
                wing = false;
                break;

            case 2:
                right = 0.15;up = 0.15;
                stop = true;
                flower = true;
                wing = true;
                break;

            case 3:
                flower = false;
                right += step;
                break;

            case 4:
                flower = false;
                right -= step;
                break;

            case 5:
                flower = false;
                up += step;
                break;

            case 6:
                flower = false;
                up -= step;
                break;
        }
    };

    //键盘控制
    window.onkeydown = function( event ) {

        var key = String.fromCharCode(event.keyCode);
        switch( key ) {
            case 'K'://停止或继续
                stop = !stop;
                wing = !wing;
                break;

            case 'F'://花出现或消失
                flower = !flower;
                break;

            case 'W'://上飞
                flower = false;
                jumpCount = 40;
                break;

            case 'S'://下飞
                flower = false;
                jumpCount = -40;

            case 'D'://右
                flower = false;
                right += step;
                //aheadFlag = true;
                break;

            case 'A'://左
                flower = false;
                right -= step;
                //aheadFlag = false;
                break;
        }
    };

    //拖动控制
    var ce = document.getElementById('gl-canvas');
    ce.onmousedown = function(e)
    {
        isMouseMove = 1;
    }

    ce.onmouseup = function(e)
    {
        isMouseMove = 0;
    }

    ce.onmousemove = function(e)
    {
        if(isMouseMove){
            var rect = ce.getBoundingClientRect();//画布

            var x = event.clientX - rect.left * (ce.width / rect.width);
            var y = event.clientY - rect.top * (ce.height / rect.height);
            right = x / 250 - 1;
            up = 1 - y / 250;
        }
    }

    render();
};

//跳跃按键
function jump() {
    if (jumpCount > 20) {
        --jumpCount;
        up += 0.02;
    } else if (jumpCount > 0) {
        --jumpCount;
        up -= 0.02;
    }

    if (jumpCount < -20) {
        ++jumpCount;
        up -= 0.02;
    } else if (jumpCount < 0) {
        ++jumpCount;
        up += 0.02;
    }
}

//扇翅膀
function wingSwing() {
    for(var i = 0; i < points_num[25] + points_num[24]; i++){
        points.pop();
    }
    points_num.pop();
    points_num.pop();
    num.pop();
    num.pop();
    var thetaIncrement = frequency*amplitude*0.001;
    if(control > 0) {
        control-= frequency;
        thetaLeft -= thetaIncrement;
        thetaRight += thetaIncrement;
    }
    else if(control > -100) {
        control-= frequency;
        thetaLeft += thetaIncrement;
        thetaRight -= thetaIncrement;
    }
    else{
        control = 100;
    }

    num.push(points.length/2);
    points_num.push(oval(0,180,0.25,0.15,0.55,-0.45,thetaLeft));//后
    num.push(points.length/2);
    points_num.push(oval(0,180,0.4,0.25,0.85,0.3,thetaRight));//前
    gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);
}

//画椭圆
function oval(start_degree, end_degree, radius_x, radius_y, origin_x, origin_y, turn_angle) {
    start = start_degree/180;
    end = end_degree/180;
    turn_angle = turn_angle/180
    var length = 0;
    radius_x = radius_x/2;
    radius_y = radius_y/2;
    origin_x = origin_x/2;
    origin_y = origin_y/2;

    for( var i = start; i <= end + 0.01; i = i + 0.01){
        var x_up = origin_x + Math.cos(Math.PI*i)*radius_x;//上半个椭圆
        var y_up = origin_y + Math.sin(Math.PI*i)*radius_y;
        points.push( Math.cos(Math.PI*turn_angle)*x_up - Math.sin(Math.PI*turn_angle)*y_up );
        points.push( Math.sin(Math.PI*turn_angle)*x_up + Math.cos(Math.PI*turn_angle)*y_up );
        y_up = origin_y - Math.sin(Math.PI*i)*radius_y;//下半个椭圆
        points.push( Math.cos(Math.PI*turn_angle)*x_up - Math.sin(Math.PI*turn_angle)*y_up );
        points.push( Math.sin(Math.PI*turn_angle)*x_up + Math.cos(Math.PI*turn_angle)*y_up );
        length+=2;
    }
    return length; // 计算一共有多少个点
}

function render()
{
    gl.clear( gl.COLOR_BUFFER_BIT );

    //自动运动
    if (autoGo == true && (!stop)) {
        wingSwing();

        count = (count + 1) % 50;
        if (count < 50) {
            right -= step;
        }

        if (count < 20) {
            up += 0.02;
        } else if (count < 40) {
            up -= 0.02;
        }

        //出画布就重置
        if (right < -1)
            right = 0.99;
        if (right > 1)
            right = -0.99;
    }

    jump();//跳跃监听

    if (wing)
        wingSwing();

    if (1 < right || right < -1) right = 0;

    gl.uniform1f(rightLoc, right);
    gl.uniform1f(upLoc, up);

    gl.uniform4fv(fcolor,flatten(vec4( 0, 0, 0, 1 )));
    gl.drawArrays( gl.TRIANGLE_STRIP, num[0], points_num[0]);
    gl.drawArrays( gl.TRIANGLE_STRIP, num[2], points_num[2]);
    gl.drawArrays( gl.TRIANGLE_STRIP, num[4], points_num[4]);

    gl.uniform4fv(fcolor,flatten(vec4( 255, 255, 0, 1 )));
    gl.drawArrays( gl.TRIANGLE_STRIP, num[1], points_num[1]);
    gl.drawArrays( gl.TRIANGLE_STRIP, num[3], points_num[3]);

    gl.uniform4fv(fcolor,flatten(vec4( 0, 0, 0, 1 )));
    gl.drawArrays( gl.TRIANGLE_STRIP, num[5], points_num[5]);
    gl.drawArrays( gl.TRIANGLE_STRIP, num[6], points_num[6]);
    //腮红
    gl.uniform4fv(fcolor,flatten(vec4( 255, 0, 0, 0.6 )));
    gl.drawArrays( gl.TRIANGLE_STRIP, num[7], points_num[7]);
    gl.drawArrays( gl.TRIANGLE_STRIP, num[8], points_num[8]);

    if (flower)
    {
        // var header = document.getElementById("header");
        // header.innerHTML = "<i>一只小蜜蜂啊！飞在花丛中啊！</i>"
        //花
        gl.uniform4fv(fcolor,flatten(vec4( 255, 0, 0, 0.8 )));
        gl.drawArrays( gl.TRIANGLE_STRIP, num[9], points_num[9]);
        gl.uniform4fv(fcolor,flatten(vec4( 255, 255, 255, 1 )));
        gl.drawArrays( gl.TRIANGLE_STRIP, num[10], points_num[10]);

        gl.uniform4fv(fcolor,flatten(vec4( 255, 0, 0, 0.8 )));
        gl.drawArrays( gl.TRIANGLE_STRIP, num[11], points_num[11]);
        gl.uniform4fv(fcolor,flatten(vec4( 255, 255, 255, 1 )));
        gl.drawArrays( gl.TRIANGLE_STRIP, num[12], points_num[12]);

        gl.uniform4fv(fcolor,flatten(vec4( 255, 0, 0, 0.8 )));
        gl.drawArrays( gl.TRIANGLE_STRIP, num[13], points_num[13]);
        gl.uniform4fv(fcolor,flatten(vec4( 255, 255, 255, 1 )));
        gl.drawArrays( gl.TRIANGLE_STRIP, num[14], points_num[14]);

        gl.uniform4fv(fcolor,flatten(vec4( 255, 0, 0, 0.8 )));
        gl.drawArrays( gl.TRIANGLE_STRIP, num[15], points_num[15]);
        gl.uniform4fv(fcolor,flatten(vec4( 255, 255, 255, 1 )));
        gl.drawArrays( gl.TRIANGLE_STRIP, num[16], points_num[16]);

        gl.uniform4fv(fcolor,flatten(vec4( 255, 0, 0, 0.8 )));
        gl.drawArrays( gl.TRIANGLE_STRIP, num[17], points_num[17]);
        gl.uniform4fv(fcolor,flatten(vec4( 255, 255, 255, 1 )));
        gl.drawArrays( gl.TRIANGLE_STRIP, num[18], points_num[18]);

        gl.uniform4fv(fcolor,flatten(vec4( 255, 0, 0, 0.8 )));
        gl.drawArrays( gl.TRIANGLE_STRIP, num[19], points_num[19]);

        //叶子
        gl.uniform4fv(fcolor,flatten(vec4( 0, 255, 0, 0.8 )));
        gl.drawArrays( gl.TRIANGLE_STRIP, num[20], points_num[20]);
        gl.uniform4fv(fcolor,flatten(vec4( 255, 255, 255, 1 )));
        gl.drawArrays( gl.TRIANGLE_STRIP, num[21], points_num[21]);

        gl.uniform4fv(fcolor,flatten(vec4( 0, 255, 0, 0.8 )));
        gl.drawArrays( gl.TRIANGLE_STRIP, num[22], points_num[22]);
        gl.uniform4fv(fcolor,flatten(vec4( 255, 255, 255, 1 )));
        gl.drawArrays( gl.TRIANGLE_STRIP, num[23], points_num[23]);
    }

    //翅膀
    gl.uniform4fv(fcolor,flatten(vec4( 0, 0, 255, 0.3 )));
    gl.drawArrays( gl.TRIANGLE_STRIP, num[24], points_num[24]);
    gl.uniform4fv(fcolor,flatten(vec4( 0, 0, 255, 0.8 )));
    gl.drawArrays( gl.TRIANGLE_STRIP, num[25], points_num[25]);

    setTimeout(
        function () {requestAnimFrame( render );},
        speed
    );
}