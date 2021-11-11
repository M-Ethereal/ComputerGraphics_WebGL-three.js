"use strict";

var program;
var canvas;
var gl;

var fcolor;

var screenRotateMatrix;
var moveMatrix;

var modelViewMatrix;

var trackballRotationMatrix;
var animalActionMatrix;

var myRotateMatrix = mat4();

var cmt;
var cmtLoc;

var angle = 0.0;
var axis = [0, 0, 1];

var virtual_Work = false;
var trackingMouse = false;
var trackballMove = false;

var lastPos = [0, 0, 0];
var curx, cury;
var startX, startY;

var step = 0.1;
var incAngel = 2;
var virtual_sensitivity = 1;

var minSize = 0.25;
var maxSize = 1.5;
var enlargement = vec3(0.4,0.4,0.4); //init size

var T = 99999;
var fixAngle = 5;

var auto_rotate_screen_Flag = vec3(0, 0, 0);
var auto_rotate_object_Flag = vec3(0, 0, 0);

var screenRotateSum = vec3(0,0,0);
var objectRotateSum = vec3(0,0,0);

var myRotateFlag = false;
var rotate_axis = vec3();
var fixedPoint = vec3();
var theta = 0.0;

var speed = 50;

var point_light_flag = 0;
var radio_light_rotateX = 0;
var radio_light_rotateY = 0;
var radio_light_rotateZ = 0;

var lightPosition = vec4(1.0, 1.0, -1.0, 0.0 );
var lightAmbient = vec4(0.2, 0.2, 0.2, 1.0 );
var lightDiffuse = vec4( 1.2, 1.2, 1.2, 1.0 );
var lightSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );

var materialAmbients = [ vec4( 0.25, 0.20725, 0.20725, 1.0 ), //pig purple
	vec4( 0.19225, 0.19225, 0.19225, 1.0 ),    //silver
	vec4( 0.05, 0.05, 0.0, 1.0 ),              //yellow rubber
];

var materialDiffuses = [ vec4( 1.0, 0.829, 0.829, 1.0 ),
	vec4( 0.50754, 0.50754, 0.50754, 1.0 ),
	vec4( 0.5, 0.5, 0.4, 1.0 ),
];

var materialSpeculars = [ vec4( 0.628281, 0.555802, 0.366065, 1.0  ),
	vec4( 0.508273, 0.508273, 0.508273, 1.0 ),
	vec4( 0.7, 0.7, 0.04, 1.0 ),
];

var materialShininess = [ 10,
	10,
	10,
];

var materialAmbient_0, materialDiffuse_0, materialSpecular_0,  materialShininess_0;
var materialAmbient_1, materialDiffuse_1, materialSpecular_1, materialShininess_1;
var materialAmbient_2, materialDiffuse_2, materialSpecular_2, materialShininess_2;

var ambientProduct_0, ambientProduct_1, ambientProduct_2;
var diffuseProduct_0,  diffuseProduct_1,  diffuseProduct_2;
var specularProduct_0, specularProduct_1, specularProduct_2;

var modelViewMatrixLoc;

var eyePosition = vec3(-0.15, -0.15, 0.15);
var at = vec3(0,0,0);
var up = vec3(0,0,-1)

var texture;

var num = [];
var points_num = [];
var points = [];
var texCoordsArray = [];

function configureTexture(imageFile) {
	texture = gl.createTexture();
	gl.bindTexture( gl.TEXTURE_2D, texture );
	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
	gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, imageFile );
	gl.generateMipmap( gl.TEXTURE_2D );
	gl.uniform1i(gl.getUniformLocation(program, "u_texture"), 0);
}

function vecMultInversed(v, u) {
	var result = vec4();
	for ( var i = 0; i < v.length; ++i ) {
		var sum = 0;
		for ( var j = 0; j < u.length; ++j ) {
			sum = sum + u[j] * v[i][j];
		}
		result[i] = sum;
	}
	return result;
}

function calTex() {
	var mode = mult(modelViewMatrix, cmt);
	var temp;
	for (var i = 0; i < points.length; ++i ){
		if (points[i][2] < 0.32) {
			temp = vecMultInversed(mode, points[i]);
		} else {
			temp = vecMultInversed(modelViewMatrix, points[i]);
		}
		texCoordsArray[i] = vec2(temp[0], temp[1]);
	}
	gl.bufferData( gl.ARRAY_BUFFER, flatten(texCoordsArray), gl.STATIC_DRAW );
}

function freshEyePosition(){
	document.getElementById("eye_positionX").value = 0 - eyePosition[0];
	document.getElementById("eye_positionY").value = 0 - eyePosition[1];
	document.getElementById("eye_positionZ").value = eyePosition[2];
}

function trackballView( x,  y ) {
	var v = vec3(x, y, 0);
	var d = v[0]*v[0] + v[1]*v[1];
	if (d < 1.0)
		v[2] = Math.sqrt(1.0 - d);
	else {
		v[2] = 0.0;
		var a = 1.0 /  Math.sqrt(d);
		v[0] *= a;
		v[1] *= a;
	}
	return v;
}

function mouseMotion( x,  y ) {
	var dx, dy, dz;

	var curPos = trackballView(x, y);
	if(trackingMouse) {
		dx = curPos[0] - lastPos[0];
		dy = curPos[1] - lastPos[1];
		dz = curPos[2] - lastPos[2];

		if (dx || dy || dz) {
			//弧线近似为直线， sin(theta) = theta
			angle = -virtual_sensitivity * Math.sqrt(dx*dx + dy*dy + dz*dz);

			// lastPos X curPos，  lastPos 叉乘 curPos
			axis[0] = lastPos[1]*curPos[2] - lastPos[2]*curPos[1];
			axis[1] = lastPos[2]*curPos[0] - lastPos[0]*curPos[2];
			axis[2] = lastPos[0]*curPos[1] - lastPos[1]*curPos[0];

			lastPos[0] = curPos[0];
			lastPos[1] = curPos[1];
			lastPos[2] = curPos[2];
		}
		render();
	}
}

function startMotion( x,  y ) {
	trackingMouse = true;
	startX = x;
	startY = y;
	curx = x;
	cury = y;

	lastPos = trackballView(x, y);
	trackballMove = true;
}

function stopMotion( x,  y ) {
	// trackingMouse = false;
	// if (startX != x || startY != y) {
	// }
	// else { // mouse position does not change
	// angle = 0.0;
	// trackballMove = false;
	// }
	trackingMouse = false;
	angle = 0.0;
	trackballMove = false;
}

// automatically refresh data in test and sliders
function refreshData() {

	document.getElementById("rotate_angle").value = theta % 360;

	if (auto_rotate_screen_Flag[0] == 1 || auto_rotate_screen_Flag[1] == 1 || auto_rotate_screen_Flag[2] == 1) screenRotate();
	document.getElementById("text_rotate_screen_X").value = (conversionAtoB(-180, 180, 0, 3600, screenRotateSum[0]) / 10 - 180).toFixed(2);
	document.getElementById("text_rotate_screen_Y").value = (conversionAtoB(-180, 180, 0, 3600, screenRotateSum[1]) / 10 - 180).toFixed(2);
	document.getElementById("text_rotate_screen_Z").value = (conversionAtoB(-180, 180, 0, 3600, screenRotateSum[2]) / 10 - 180).toFixed(2);

	if (auto_rotate_object_Flag[0] == 1 || auto_rotate_object_Flag[1] == 1 || auto_rotate_object_Flag[2] == 1) objectRotate();
	document.getElementById("text_rotate_object_X").value = (conversionAtoB(-180, 180, 0, 3600, objectRotateSum[0]) / 10 - 180).toFixed(2);
	document.getElementById("text_rotate_object_Y").value = (conversionAtoB(-180, 180, 0, 3600, objectRotateSum[1]) / 10 - 180).toFixed(2);
	document.getElementById("text_rotate_object_Z").value = (conversionAtoB(-180, 180, 0, 3600, objectRotateSum[2]) / 10 - 180).toFixed(2);

}

// value conversion used for auto refresh
function conversionAtoB(Amin,Amax,Bmin,Bmax,Avalue){
	Avalue = Avalue % (Amax-Amin);
	if(Avalue < Amin){
		Avalue += (Amax-Amin);
	}
	else if(Avalue > Amax){
		Avalue -= (Amax-Amin);
	}
	return (Avalue-Amin)*(Bmax-Bmin)/(Amax-Amin) + Bmin;
}

function screenRotate() {
	if (auto_rotate_screen_Flag[0] == 1) {
		cmt = mult(rotateX(incAngel), cmt);
		screenRotateSum[0] += incAngel;
	}
	if (auto_rotate_screen_Flag[1] == 1) {
		cmt = mult(rotateY(incAngel), cmt);
		screenRotateSum[1] += incAngel;
	}
	if (auto_rotate_screen_Flag[2] == 1) {
		cmt = mult(rotateZ(incAngel), cmt);
		screenRotateSum[2] += incAngel;
	}
}

function objectRotate() {
	if (auto_rotate_object_Flag[0] == 1) {
		cmt = mult(cmt, rotateX(incAngel));
		objectRotateSum[0] += incAngel;
	}
	if (auto_rotate_object_Flag[1] == 1) {
		cmt = mult(cmt, rotateY(incAngel));
		objectRotateSum[1] += incAngel;
	}
	if (auto_rotate_object_Flag[2] == 1) {
		cmt = mult(cmt, rotateZ(incAngel));
		objectRotateSum[2] += incAngel;
	}
}

function myRotateAction() {
	// rotate around d by angel theta with m a fixed point 固定点为m绕d旋转theta的变换矩阵
	cmt = mult(myRotate(fixedPoint, 1, rotate_axis), cmt);
	++theta;
}

// rorate around rotate_axis by angel theta with m a fixed point
function myRotate(m, theta, rotate_axis) {
	var R = mat4();
	var result = mat4();

	if (rotate_axis[0] == 0 && rotate_axis[1] == 0 && rotate_axis[2] == 0) return mat4();
	if (rotate_axis[2] == 0 && rotate_axis[1] == 0) {
		R = rotateX(theta);
	} else {
		var d = normalize(rotate_axis);
		var length = Math.sqrt(d[1] * d[1] + d[2] * d[2]);
		var R_X = mat4(vec4(1,0,0,0),
			vec4(0,d[2] / length, -d[1] / length, 0),
			vec4(0,d[1] / length, d[2] / length, 0),
			vec4(0,0,0,1));
		var R_Y = mat4(vec4(length,0,0,0),
			vec4(0,1,0,0),
			vec4(d[0],0,length,0),
			vec4(0,0,0,1));
		R = mult(R, transpose(R_X));
		R = mult(R, transpose(R_Y));
		R = mult(R, rotateZ(-theta));
		R = mult(R, R_Y);
		R = mult(R, R_X);
	}

	result = translate(m);
	result = mult(result, R);
	result = mult(result, translate(negate(m)));

	return result;
}

function vecMult(u, v) {
	var result = vec4();
	for ( var i = 0; i < u.length; ++i ) {
		var sum = 0;
		for ( var j = 0; j < v.length; ++j ) {
			sum = sum + u[j] * v[j][i];
		}
		result[i] = sum;
	}
	return result;
}

function storePoints(){
	//身体0
	num.push(0);
	var vertices = [
		vec4( -0.5, -0.4,  0.2, 1.0 ),
		vec4( -0.5,  0.4,  0.2, 1.0 ),
		vec4(  0.5,  0.4,  0.2, 1.0 ),
		vec4(  0.5, -0.4,  0.2, 1.0 ),
		vec4( -0.5, -0.4, -0.4, 1.0 ),
		vec4( -0.5,  0.4, -0.4, 1.0 ),
		vec4(  0.5,  0.4, -0.4, 1.0 ),
		vec4(  0.5, -0.4, -0.4, 1.0 )
	];
	quad( 1, 0, 3, 2 ,vertices);
	quad( 2, 3, 7, 6 ,vertices);
	quad( 3, 0, 4, 7 ,vertices);
	quad( 6, 5, 1, 2 ,vertices);
	quad( 4, 5, 6, 7 ,vertices);
	quad( 5, 4, 0, 1 ,vertices);
	points_num.push(36);

	//左耳1-4
	num.push(points.length);
	points.push(vec4(0.4, 0.3, -0.9));
	points.push(vec4(0.5, 0.4, -0.4));
	points.push(vec4(0.3, 0.4, -0.4));
	points_num.push(3);

	num.push(points.length);
	points.push(vec4(0.4, 0.3, -0.9));
	points.push(vec4(0.5, 0.4, -0.4));
	points.push(vec4(0.5, 0.2, -0.4));
	points_num.push(3);

	num.push(points.length);
	points.push(vec4(0.4, 0.3, -0.9));
	points.push(vec4(0.3, 0.2, -0.4));
	points.push(vec4(0.5, 0.2, -0.4));
	points_num.push(3);

	num.push(points.length);
	points.push(vec4(0.4, 0.3, -0.9));
	points.push(vec4(0.3, 0.2, -0.4));
	points.push(vec4(0.3, 0.4, -0.4));
	points_num.push(3);

	//右耳5-8
	num.push(points.length);
	points.push(vec4(0.4, -0.3, -0.9));
	points.push(vec4(0.5, -0.4, -0.4));
	points.push(vec4(0.3, -0.4, -0.4));
	points_num.push(3);

	num.push(points.length);
	points.push(vec4(0.4, -0.3, -0.9));
	points.push(vec4(0.5, -0.4, -0.4));
	points.push(vec4(0.5, -0.2, -0.4));
	points_num.push(3);

	num.push(points.length);
	points.push(vec4(0.4, -0.3, -0.9));
	points.push(vec4(0.3, -0.2, -0.4));
	points.push(vec4(0.5, -0.2, -0.4));
	points_num.push(3);

	num.push(points.length);
	points.push(vec4(0.4, -0.3, -0.9));
	points.push(vec4(0.3, -0.2, -0.4));
	points.push(vec4(0.3, -0.4, -0.4));
	points_num.push(3);

	//前左脚9
	num.push(points.length);
	var vertices = [
		vec4(  0.3,  0.2,  0.2, 1.0 ),
		vec4(  0.3,  0.4,  0.2, 1.0 ),
		vec4(  0.5,  0.4,  0.2, 1.0 ),
		vec4(  0.5,  0.2,  0.2, 1.0 ),
		vec4(  0.3,  0.2,  0.3, 1.0 ),
		vec4(  0.3,  0.4,  0.3, 1.0 ),
		vec4(  0.5,  0.4,  0.3, 1.0 ),
		vec4(  0.5,  0.2,  0.3, 1.0 )
	];
	quad( 1, 0, 3, 2 ,vertices);
	quad( 2, 3, 7, 6 ,vertices);
	quad( 3, 0, 4, 7 ,vertices);
	quad( 6, 5, 1, 2 ,vertices);
	quad( 4, 5, 6, 7 ,vertices);
	quad( 5, 4, 0, 1 ,vertices);
	points_num.push(36);

	//前右脚10
	num.push(points.length);
	var vertices = [
		vec4(  0.3,  -0.2,  0.2, 1.0 ),
		vec4(  0.3,  -0.4,  0.2, 1.0 ),
		vec4(  0.5,  -0.4,  0.2, 1.0 ),
		vec4(  0.5,  -0.2,  0.2, 1.0 ),
		vec4(  0.3,  -0.2,  0.3, 1.0 ),
		vec4(  0.3,  -0.4,  0.3, 1.0 ),
		vec4(  0.5,  -0.4,  0.3, 1.0 ),
		vec4(  0.5,  -0.2,  0.3, 1.0 )
	];
	quad( 1, 0, 3, 2 ,vertices);
	quad( 2, 3, 7, 6 ,vertices);
	quad( 3, 0, 4, 7 ,vertices);
	quad( 6, 5, 1, 2 ,vertices);
	quad( 4, 5, 6, 7 ,vertices);
	quad( 5, 4, 0, 1 ,vertices);
	points_num.push(36);

	//后左脚11
	num.push(points.length);
	var vertices = [
		vec4(  -0.3,  0.2,  0.2, 1.0 ),
		vec4(  -0.3,  0.4,  0.2, 1.0 ),
		vec4(  -0.5,  0.4,  0.2, 1.0 ),
		vec4(  -0.5,  0.2,  0.2, 1.0 ),
		vec4(  -0.3,  0.2,  0.3, 1.0 ),
		vec4(  -0.3,  0.4,  0.3, 1.0 ),
		vec4(  -0.5,  0.4,  0.3, 1.0 ),
		vec4(  -0.5,  0.2,  0.3, 1.0 )
	];
	quad( 1, 0, 3, 2 ,vertices);
	quad( 2, 3, 7, 6 ,vertices);
	quad( 3, 0, 4, 7 ,vertices);
	quad( 6, 5, 1, 2 ,vertices);
	quad( 4, 5, 6, 7 ,vertices);
	quad( 5, 4, 0, 1 ,vertices);
	points_num.push(36);

	//后右脚12
	num.push(points.length);
	var vertices = [
		vec4(  -0.3,  -0.2,  0.2, 1.0 ),
		vec4(  -0.3,  -0.4,  0.2, 1.0 ),
		vec4(  -0.5,  -0.4,  0.2, 1.0 ),
		vec4(  -0.5,  -0.2,  0.2, 1.0 ),
		vec4(  -0.3,  -0.2,  0.3, 1.0 ),
		vec4(  -0.3,  -0.4,  0.3, 1.0 ),
		vec4(  -0.5,  -0.4,  0.3, 1.0 ),
		vec4(  -0.5,  -0.2,  0.3, 1.0 )
	];
	quad( 1, 0, 3, 2 ,vertices);
	quad( 2, 3, 7, 6 ,vertices);
	quad( 3, 0, 4, 7 ,vertices);
	quad( 6, 5, 1, 2 ,vertices);
	quad( 4, 5, 6, 7 ,vertices);
	quad( 5, 4, 0, 1 ,vertices);
	points_num.push(36);

}

function quad(a, b, c, d,vertices) {

	var indices = [ a, b, c, a, c, d ];

	for ( var i = 0; i < indices.length; ++i ) {
		points.push( vertices[indices[i]] );
	}
}

function render() {
	gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	// for trackball view
	if (virtual_Work) {
		if(trackballMove) {
			axis = normalize(axis); //归一化
			trackballRotationMatrix = mult(mat4(), rotate(angle, axis));
			cmt = mult(cmt, trackballRotationMatrix);
		}
	}

	if (myRotateFlag) myRotateAction();

	// for jump action
	if (T < 5.5) {
		animalActionMatrix = mat4();
		//animalActionMatrix[2][3] = -0.25 * T + 0.5 * 0.05 * T * T;
		animalActionMatrix[2][3] = -0.5 * (5 - T) / 5;
		cmt = mult(cmt, animalActionMatrix);
		++T;
	} else if (T < 10.5) {
		animalActionMatrix = mat4();
		//animalActionMatrix[2][3] = -0.25 * T + 0.5 * 0.05 * T * T;
		animalActionMatrix[2][3] = 0.5 * (T - 5) / 5;
		cmt = mult(cmt, animalActionMatrix);
		++T;
	}


	if (radio_light_rotateX == 1) lightPosition = vecMult(lightPosition, rotateX(fixAngle));
	if (radio_light_rotateY == 1) lightPosition = vecMult(lightPosition, rotateY(fixAngle));
	if (radio_light_rotateZ == 1) lightPosition = vecMult(lightPosition, rotateZ(fixAngle));

	gl.uniform4fv( gl.getUniformLocation(program,"lightPosition"),flatten(lightPosition) );

	//身体
	gl.drawArrays( gl.TRIANGLES, num[0], points_num[0] );

	//左耳
	gl.drawArrays( gl.TRIANGLES, num[1], points_num[1] );
	gl.drawArrays( gl.TRIANGLES, num[2], points_num[2] );
	gl.drawArrays( gl.TRIANGLES, num[3], points_num[3] );
	gl.drawArrays( gl.TRIANGLES, num[4], points_num[4] );

	//右耳
	gl.drawArrays( gl.TRIANGLES, num[5], points_num[5] );
	gl.drawArrays( gl.TRIANGLES, num[6], points_num[6] );
	gl.drawArrays( gl.TRIANGLES, num[7], points_num[7] );
	gl.drawArrays( gl.TRIANGLES, num[8], points_num[8] );

	//脚
	gl.drawArrays( gl.TRIANGLES, num[9], points_num[9] );
	gl.drawArrays( gl.TRIANGLES, num[10], points_num[10] );
	gl.drawArrays( gl.TRIANGLES, num[11], points_num[11] );
	gl.drawArrays( gl.TRIANGLES, num[12], points_num[12] );
	
	gl.uniformMatrix4fv(cmtLoc, false, flatten(cmt));

	//Model-view matrix for the ugly pig

	modelViewMatrix = lookAt(eyePosition, at, up);

	gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix) );

	gl.uniform3fv( gl.getUniformLocation(program,"eyePosition"),flatten(eyePosition));
	
	refreshData();
	calTex();

	setTimeout(
		function () {requestAnimFrame( render );},
		speed
	);
}

window.onload = function init() {

	canvas = document.getElementById( "gl-canvas" );

	gl = WebGLUtils.setupWebGL( canvas );
	if ( !gl ) { alert( "WebGL isn't available" ); }

	gl.viewport( 0, 0, canvas.width, canvas.height );
	gl.clearColor( 1.0, 1.0, 1.0, 1.0 );

	gl.enable(gl.DEPTH_TEST);

	//  Load shaders and initialize attribute buffers
	program = initShaders( gl, "vertex-shader", "fragment-shader" );
	gl.useProgram( program );

	materialAmbient_0 = materialAmbients[0];
	materialDiffuse_0 = materialDiffuses[0];
	materialSpecular_0 = materialSpeculars[0];
	materialShininess_0 = materialShininess[0];

	materialAmbient_1 = materialAmbients[1];
	materialDiffuse_1 = materialDiffuses[1];
	materialSpecular_1 = materialSpeculars[1];
	materialShininess_1 = materialShininess[1];

	materialAmbient_2 = materialAmbients[2];
	materialDiffuse_2 = materialDiffuses[2];
	materialSpecular_2 = materialSpeculars[2];
	materialShininess_2 = materialShininess[2];


	ambientProduct_0 = mult(lightAmbient, materialAmbient_0);
	diffuseProduct_0 = mult(lightDiffuse, materialDiffuse_0);
	specularProduct_0 = mult(lightSpecular, materialSpecular_0);

	ambientProduct_1 = mult(lightAmbient, materialAmbient_1);
	diffuseProduct_1 = mult(lightDiffuse, materialDiffuse_1);
	specularProduct_1 = mult(lightSpecular, materialSpecular_1);

	ambientProduct_2 = mult(lightAmbient, materialAmbient_2);
	diffuseProduct_2 = mult(lightDiffuse, materialDiffuse_2);
	specularProduct_2 = mult(lightSpecular, materialSpecular_2);

	trackballRotationMatrix = mat4();
	moveMatrix = mat4();
	animalActionMatrix = mat4();
	screenRotateMatrix = mat4();
	cmt = mat4();
	cmt = mult(cmt, scalem(enlargement))
	cmtLoc = gl.getUniformLocation(program, "cmt");

	modelViewMatrixLoc = gl.getUniformLocation( program, "modelViewMatrix" );
	//set materials for each part
	gl.uniform4fv( gl.getUniformLocation(program, "ambientProduct_0"),flatten(ambientProduct_0) );
	gl.uniform4fv( gl.getUniformLocation(program, "diffuseProduct_0"),flatten(diffuseProduct_0) );
	gl.uniform4fv( gl.getUniformLocation(program, "specularProduct_0"),flatten(specularProduct_0) );
	gl.uniform1f( gl.getUniformLocation(program, "shininess_0"),materialShininess_0 );

	gl.uniform4fv( gl.getUniformLocation(program, "ambientProduct_1"),flatten(ambientProduct_1) );
	gl.uniform4fv( gl.getUniformLocation(program, "diffuseProduct_1"),flatten(diffuseProduct_1) );
	gl.uniform4fv( gl.getUniformLocation(program, "specularProduct_1"),flatten(specularProduct_1) );
	gl.uniform1f( gl.getUniformLocation(program, "shininess_1"),materialShininess_1 );

	gl.uniform4fv( gl.getUniformLocation(program, "ambientProduct_2"),flatten(ambientProduct_2) );
	gl.uniform4fv( gl.getUniformLocation(program, "diffuseProduct_2"),flatten(diffuseProduct_2) );
	gl.uniform4fv( gl.getUniformLocation(program, "specularProduct_2"),flatten(specularProduct_2) );
	gl.uniform1f( gl.getUniformLocation(program, "shininess_2"),materialShininess_2 );

	gl.uniform4fv( gl.getUniformLocation(program, "lightPosition"),flatten(lightPosition) );
	gl.uniform3fv( gl.getUniformLocation(program, "eyePosition"),flatten(eyePosition) );

	// add event listener
	canvas.addEventListener("mousedown", function(event){
		var x = 2*event.clientX/canvas.width-1;
		var y = 2*(canvas.height-event.clientY)/canvas.height-1;
		if (virtual_Work) startMotion(x, y);
	});

	canvas.addEventListener("mouseup", function(event){
		var x = 2*event.clientX/canvas.width-1;
		var y = 2*(canvas.height-event.clientY)/canvas.height-1;
		stopMotion(x, y);
	});

	canvas.addEventListener("mousemove", function(event){
		var x = 2*event.clientX/canvas.width-1;
		var y = 2*(canvas.height-event.clientY)/canvas.height-1;
		if (virtual_Work) mouseMotion(x, y);
	} );

	// clear actions and init it to the normal size
	document.getElementById("btn_clear").onclick = function(event) {
		cmt = mat4();
		screenRotateSum = vec3(0,0,0);
		objectRotateSum = vec3(0,0,0);
		theta = 0;
	};

	//change the size of the figure
	document.getElementById("slider").onchange = function(event) {
		enlargement = event.target.value / 100 * (maxSize - minSize) + minSize;
		cmt = mult(cmt, scalem(enlargement, enlargement, enlargement));     // enlarge 缩放
		document.getElementById("text_figure_size").value = enlargement;
	};

	//change the speed
	document.getElementById("speed_slider").onchange = function(event) {
		speed = event.target.value;
	};

	// switch virtual ball mode
	document.getElementById("virtual_ball").onclick = function(event) {
		virtual_Work = !virtual_Work;
		if (virtual_Work) {
			document.getElementById("virtual_ball").checked = "checked";
		} else {
			document.getElementById("virtual_ball").checked = "";
		}
	};

	// rorate around d by angel theta with m a fixed point
	document.getElementById("btn_myRotate").onclick = function(event) {
		rotate_axis = vec3(document.getElementById("rotate_axisX").value,
			document.getElementById("rotate_axisY").value,
			document.getElementById("rotate_axisZ").value);
		fixedPoint = vec3(document.getElementById("fiexed_pointX").value,
			document.getElementById("fiexed_pointY").value,
			document.getElementById("fiexed_pointZ").value);
		theta =  document.getElementById("rotate_angle").value % 360;
		cmt = mult(myRotateMatrix, myRotate(fixedPoint, theta, rotate_axis));
	};

	document.getElementById("auto_myRotate").onclick = function(event) {
		myRotateFlag = !myRotateFlag;
		if (myRotateFlag) {
			document.getElementById("auto_myRotate").checked = "checked";
			rotate_axis = vec3(document.getElementById("rotate_axisX").value,
				document.getElementById("rotate_axisY").value,
				document.getElementById("rotate_axisZ").value);
			fixedPoint = vec3(document.getElementById("fiexed_pointX").value,
				document.getElementById("fiexed_pointY").value,
				document.getElementById("fiexed_pointZ").value);
			theta = document.getElementById("rotate_angle").value % 360;
		} else {
			document.getElementById("auto_myRotate").checked = "";
			//document.getElementById("rotate_angle").value = theta;
		}
	};

	//rotate angel control at screen asix by slider
	document.getElementById("rotate_screen_X").onchange = function(event) {
		screenRotateSum[0] += event.target.value / 10 - 180;
		cmt = mult(rotateX(event.target.value / 10 - 180), cmt);
		document.getElementById("text_rotate_screen_X").value = screenRotateSum[0].toFixed(2);
	};

	document.getElementById("rotate_screen_Y").onchange = function(event) {
		screenRotateSum[1] += event.target.value / 10 - 180;
		cmt = mult(rotateY(event.target.value / 10 - 180), cmt);
		document.getElementById("text_rotate_screen_Y").value = screenRotateSum[2].toFixed(2);
	};

	document.getElementById("rotate_screen_Z").onchange = function(event) {
		screenRotateSum[3] += event.target.value / 10 - 180;
		cmt = mult(rotateZ(event.target.value / 10 - 180), cmt);
		document.getElementById("text_rotate_screen_Z").value = screenRotateSum[3].toFixed(2);
	};

	// rotate input button at screen axis
	document.getElementById("reset_rotate_screen_X").onclick = function(event) {
		cmt = mult(cmt, rotateX(-screenRotateSum[0]));
		screenRotateSum[0] = 0;
	};
	document.getElementById("reset_rotate_screen_Y").onclick = function(event) {
		cmt = mult(cmt, rotateY(-screenRotateSum[1]));
		screenRotateSum[1] = 0;
	};
	document.getElementById("reset_rotate_screen_Z").onclick = function(event) {
		cmt = mult(cmt, rotateZ(-screenRotateSum[2]));
		screenRotateSum[2] = 0;
	};

	// auto rotate radio at screen axis
	document.getElementById("radio_auto_rotate_screen_X").onclick = function(event) {
		if (auto_rotate_screen_Flag[0] == 0){
			document.getElementById("radio_auto_rotate_screen_X").checked = "checked";
			auto_rotate_screen_Flag[0] = 1;
		} else {
			document.getElementById("radio_auto_rotate_screen_X").checked = "";
			auto_rotate_screen_Flag[0] = 0;
		}
	};
	document.getElementById("radio_auto_rotate_screen_Y").onclick = function(event) {
		if (auto_rotate_screen_Flag[1] == 0){
			document.getElementById("radio_auto_rotate_screen_Y").checked = "checked";
			auto_rotate_screen_Flag[1] = 1;
		} else {
			document.getElementById("radio_auto_rotate_screen_Y").checked = "";
			auto_rotate_screen_Flag[1] = 0;
		}
	};
	document.getElementById("radio_auto_rotate_screen_Z").onclick = function(event) {
		if (auto_rotate_screen_Flag[2] == 0){
			document.getElementById("radio_auto_rotate_screen_Z").checked = "checked";
			auto_rotate_screen_Flag[2] = 1;
		} else {
			document.getElementById("radio_auto_rotate_screen_Z").checked = "";
			auto_rotate_screen_Flag[2] = 0;
		}
	};

	//rotate angel control at object axis by slider
	document.getElementById("rotate_object_X").onchange = function(event) {
		objectRotateSum[0] += event.target.value / 10 - 180;
		cmt = mult(cmt, rotateX(event.target.value / 10 - 180));
	};

	document.getElementById("rotate_object_Y").onchange = function(event) {
		objectRotateSum[1] += event.target.value / 10 - 180;
		cmt = mult(cmt, rotateY(event.target.value / 10 - 180));
	};

	document.getElementById("rotate_object_Z").onchange = function(event) {
		objectRotateSum[2] += event.target.value / 10 - 180;
		cmt = mult(cmt, rotateZ(event.target.value / 10 - 180));
	};

	// rotate input button at object axis
	document.getElementById("reset_rotate_object_X").onclick = function(event) {
		cmt = mult(cmt, rotateX(-objectRotateSum[0]));
		objectRotateSum[0] = 0;

	};
	document.getElementById("reset_rotate_object_Y").onclick = function(event) {
		cmt = mult(cmt, rotateY(-objectRotateSum[1]));
		objectRotateSum[1] = 0;
	};
	document.getElementById("reset_rotate_object_Z").onclick = function(event) {
		cmt = mult(cmt, rotateZ(-objectRotateSum[2]));
		objectRotateSum[2] = 0;
	};

	// auto rotate button at object axis
	document.getElementById("radio_auto_rotate_object_X").onclick = function(event) {
		if (auto_rotate_object_Flag[0] == 0){
			document.getElementById("radio_auto_rotate_object_X").checked = "checked";
			auto_rotate_object_Flag[0] = 1;
		} else {
			document.getElementById("radio_auto_rotate_object_X").checked = "";
			auto_rotate_object_Flag[0] = 0;
		}
	};
	document.getElementById("radio_auto_rotate_object_Y").onclick = function(event) {
		if (auto_rotate_object_Flag[1] == 0){
			document.getElementById("radio_auto_rotate_object_Y").checked = "checked";
			auto_rotate_object_Flag[1] = 1;
		} else {
			document.getElementById("radio_auto_rotate_object_Y").checked = "";
			auto_rotate_object_Flag[1] = 0;
		}
	};
	document.getElementById("radio_auto_rotate_object_Z").onclick = function(event) {
		if (auto_rotate_object_Flag[2] == 0){
			document.getElementById("radio_auto_rotate_object_Z").checked = "checked";
			auto_rotate_object_Flag[2] = 1;
		} else {
			document.getElementById("radio_auto_rotate_object_Z").checked = "";
			auto_rotate_object_Flag[2] = 0;
		}
	};

	// move at screen axises
	document.getElementById("moveForward").onclick = function(event) {
		moveMatrix = mat4();
		moveMatrix[0][3] += step;
		cmt = mult(moveMatrix, cmt);
	};

	document.getElementById("moveBackward").onclick = function(event) {
		moveMatrix = mat4();
		moveMatrix[0][3] -= step;
		cmt = mult(moveMatrix, cmt);
	};

	document.getElementById("moveRight").onclick = function(event) {
		moveMatrix = mat4();
		moveMatrix[1][3] -= step;
		cmt = mult(moveMatrix, cmt);
	};

	document.getElementById("moveLeft").onclick = function(event) {
		moveMatrix = mat4();
		moveMatrix[1][3] += step;
		cmt = mult(moveMatrix, cmt);
	};

	document.getElementById("moveDown").onclick = function(event) {
		moveMatrix = mat4();
		moveMatrix[2][3] += step;
		cmt = mult(moveMatrix, cmt);
	};

	document.getElementById("moveUp").onclick = function(event) {
		moveMatrix = mat4();
		moveMatrix[2][3] -= step;
		cmt = mult(moveMatrix, cmt);
	};

	// move at object axises
	// control by keyboard
	window.onkeydown = function( event ) {
		switch( String.fromCharCode(event.keyCode) ) {
			case 'W': // go forward
				animalActionMatrix = mat4();
				animalActionMatrix[0][3] += step;
				cmt = mult(cmt, animalActionMatrix);
				break;
			case 'S': // go backword
				animalActionMatrix = mat4();
				animalActionMatrix[0][3] -= step;
				cmt = mult(cmt, animalActionMatrix);
				break;
			case 'A': // turn left
				animalActionMatrix = mat4();
				animalActionMatrix[1][3] += step;
				cmt = mult(cmt, animalActionMatrix);
				break;
			case 'D': // turn right
				animalActionMatrix = mat4();
				animalActionMatrix[1][3] -= step;
				cmt = mult(cmt, animalActionMatrix);
				break;
			case 'Z': // jump
				T = 0;
				break;

			case 'J':	//walk through
				eyePosition[0] -= 0.02;
				freshEyePosition();
				break;
			case 'L':
				eyePosition[0] += 0.02;
				freshEyePosition();
				break;
			case 'U':
				eyePosition[1] -= 0.02;
				freshEyePosition();
				break;
			case 'O':
				eyePosition[1] += 0.02;
				freshEyePosition();
				break;
			case 'K':
				eyePosition[2] -= 0.02;
				freshEyePosition();
				break;
			case 'I':
				eyePosition[2] += 0.02;
				freshEyePosition();
				break;
			case 'H':
				var temp = [eyePosition[0], eyePosition[1], eyePosition[2], 1];
				temp = vecMult(temp, rotateX(5));
				eyePosition[0] = temp[0];
				eyePosition[1] = temp[1];
				eyePosition[2] = temp[2];
				eyePosition = normalize(eyePosition);
				freshEyePosition();
				break;
		}
	};

	// radio button for point light
	document.getElementById("point_source").onclick = function(event) {
		if (point_light_flag == 0){
			document.getElementById("point_source").checked = "checked";
			point_light_flag = 1;
		} else {
			document.getElementById("point_source").checked = "";
			point_light_flag = 0;
		}
		lightPosition[3] = point_light_flag;
	};

	document.getElementById("btn_light_rotateX").onclick = function(event) {
		lightPosition = vecMult(lightPosition, rotateX(fixAngle));
	};

	document.getElementById("btn_light_rotateY").onclick = function(event) {
		lightPosition = vecMult(lightPosition, rotateY(fixAngle));
	};

	document.getElementById("btn_light_rotateZ").onclick = function(event) {
		lightPosition = vecMult(lightPosition, rotateZ(fixAngle));
	};

	// set light position
	document.getElementById("btn_light_position").onclick = function(event) {
		lightPosition = vec4(document.getElementById("light_positionX").value - 0,
			document.getElementById("light_positionY").value - 0,
			0 - document.getElementById("light_positionZ").value,
			point_light_flag);
	};

	document.getElementById("radio_light_rotateX").onclick = function(event) {
		if (radio_light_rotateX == 0){
			document.getElementById("radio_light_rotateX").checked = "checked";
			radio_light_rotateX = 1;
		} else {
			document.getElementById("radio_light_rotateX").checked = "";
			radio_light_rotateX = 0;
		}
	};

	document.getElementById("radio_light_rotateY").onclick = function(event) {
		if (radio_light_rotateY == 0){
			document.getElementById("radio_light_rotateY").checked = "checked";
			radio_light_rotateY = 1;
		} else {
			document.getElementById("radio_light_rotateY").checked = "";
			radio_light_rotateY = 0;
		}
	};

	document.getElementById("radio_light_rotateZ").onclick = function(event) {
		if (radio_light_rotateZ == 0){
			document.getElementById("radio_light_rotateZ").checked = "checked";
			radio_light_rotateZ = 1;
		} else {
			document.getElementById("radio_light_rotateZ").checked = "";
			radio_light_rotateZ = 0;
		}
	};

	// set eye position
	document.getElementById("btn_eye_position").onclick = function(event) {
		eyePosition = vec3(0 - document.getElementById("eye_positionX").value,
			0 - document.getElementById("eye_positionY").value,
			document.getElementById("eye_positionZ").value - 0)
	};

	// set material
	document.getElementById('ears_material').onchange = function(event){
		var val = this.value;

		materialAmbient_0 = materialAmbients[val];
		materialDiffuse_0 = materialDiffuses[val];
		materialSpecular_0 = materialSpeculars[val];
		materialShininess_0 = materialShininess[val];

		ambientProduct_0 = mult(lightAmbient, materialAmbient_0);
		diffuseProduct_0 = mult(lightDiffuse, materialDiffuse_0);
		specularProduct_0 = mult(lightSpecular, materialSpecular_0);

		gl.uniform4fv( gl.getUniformLocation(program, "ambientProduct_0"),flatten(ambientProduct_0) );
		gl.uniform4fv( gl.getUniformLocation(program, "diffuseProduct_0"),flatten(diffuseProduct_0) );
		gl.uniform4fv( gl.getUniformLocation(program, "specularProduct_0"),flatten(specularProduct_0) );
		gl.uniform1f( gl.getUniformLocation(program, "shininess_0"),materialShininess_0 );

	};

	document.getElementById('body_material').onchange = function(event){
		var val = this.value;

		materialAmbient_1 = materialAmbients[val];
		materialDiffuse_1 = materialDiffuses[val];
		materialSpecular_1 = materialSpeculars[val];
		materialShininess_1 = materialShininess[val];

		ambientProduct_1 = mult(lightAmbient, materialAmbient_1);
		diffuseProduct_1 = mult(lightDiffuse, materialDiffuse_1);
		specularProduct_1 = mult(lightSpecular, materialSpecular_1);

		gl.uniform4fv( gl.getUniformLocation(program, "ambientProduct_1"),flatten(ambientProduct_1) );
		gl.uniform4fv( gl.getUniformLocation(program, "diffuseProduct_1"),flatten(diffuseProduct_1) );
		gl.uniform4fv( gl.getUniformLocation(program, "specularProduct_1"),flatten(specularProduct_1) );
		gl.uniform1f( gl.getUniformLocation(program, "shininess_1"),materialShininess_1 );

	};

	document.getElementById('floor_material').onchange = function(event){
		var val = this.value;

		materialAmbient_2 = materialAmbients[val];
		materialDiffuse_2 = materialDiffuses[val];
		materialSpecular_2 = materialSpeculars[val];
		materialShininess_2 = materialShininess[val];

		ambientProduct_2 = mult(lightAmbient, materialAmbient_2);
		diffuseProduct_2 = mult(lightDiffuse, materialDiffuse_2);
		specularProduct_2 = mult(lightSpecular, materialSpecular_2);

		gl.uniform4fv( gl.getUniformLocation(program, "ambientProduct_2"),flatten(ambientProduct_2) );
		gl.uniform4fv( gl.getUniformLocation(program, "diffuseProduct_2"),flatten(diffuseProduct_2) );
		gl.uniform4fv( gl.getUniformLocation(program, "specularProduct_2"),flatten(specularProduct_2) );
		gl.uniform1f( gl.getUniformLocation(program, "shininess_2"), materialShininess_2 );

	};

	document.getElementById("texture").onchange = function (event) {
		switch (this.value) {
			case '0': configureTexture(document.getElementById("WaterImage")); break;
			case '1': configureTexture(document.getElementById("MistImage")); break;
			case '2': configureTexture(document.getElementById("BlueImage")); break;
			case '3': configureTexture(document.getElementById("GalaxyImage")); break;
			case '4': configureTexture(document.getElementById("GoldenImage")); break;
			default: configureTexture(document.getElementById("WaterImage")); break;
		}
		render();
	};

	storePoints(); //存点

	fcolor = gl.getUniformLocation( program, "fcolor" );

	// push point vector
	var vBuffer = gl.createBuffer();
	gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
	gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );

	var vNormal = gl.getAttribLocation( program, "vNormal" );
	gl.vertexAttribPointer( vNormal, 4, gl.FLOAT, false, 0, 0 );
	gl.enableVertexAttribArray( vNormal);

	var vPosition = gl.getAttribLocation( program, "vPosition" );
	gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
	gl.enableVertexAttribArray( vPosition );

	var tBuffer = gl.createBuffer();
	gl.bindBuffer( gl.ARRAY_BUFFER, tBuffer);
	gl.bufferData( gl.ARRAY_BUFFER, flatten(texCoordsArray), gl.STATIC_DRAW );

	var vTexCoord = gl.getAttribLocation( program, "a_texcoord" );
	gl.vertexAttribPointer( vTexCoord, 2, gl.FLOAT, false, 0, 0 );
	gl.enableVertexAttribArray( vTexCoord );
	configureTexture(document.getElementById("WaterImage"));
	render();
};