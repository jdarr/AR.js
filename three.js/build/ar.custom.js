
var THREEx = THREEx || {}

THREEx.ArBaseControls = function(object3d){
	this.id = THREEx.ArBaseControls.id++

	this.object3d = object3d
	this.object3d.matrixAutoUpdate = false;
	this.object3d.visible = false

	// Events to honor
	// this.dispatchEvent({ type: 'becameVisible' })
	// this.dispatchEvent({ type: 'markerVisible' })	// replace markerFound
	// this.dispatchEvent({ type: 'becameUnVisible' })
}

THREEx.ArBaseControls.id = 0

Object.assign( THREEx.ArBaseControls.prototype, THREE.EventDispatcher.prototype );

//////////////////////////////////////////////////////////////////////////////
//		Functions
//////////////////////////////////////////////////////////////////////////////
/**
 * error catching function for update()
 */
THREEx.ArBaseControls.prototype.update = function(){
	console.assert(false, 'you need to implement your own update')
}

/**
 * error catching function for name()
 */
THREEx.ArBaseControls.prototype.name = function(){
	console.assert(false, 'you need to implement your own .name()')
	return 'Not yet implemented - name()'
}
var THREEx = THREEx || {}

// TODO this is useless - prefere arjs-HitTesting.js

/**
 * - maybe support .onClickFcts in each object3d
 * - seems an easy light layer for clickable object
 * - up to 
 */
THREEx.ARClickability = function(sourceElement){
	this._sourceElement = sourceElement
	// Create cameraPicking
	var fullWidth = parseInt(sourceElement.style.width)
	var fullHeight = parseInt(sourceElement.style.height)
	this._cameraPicking = new THREE.PerspectiveCamera(42, fullWidth / fullHeight, 0.1, 100);	

console.warn('THREEx.ARClickability works only in modelViewMatrix')
console.warn('OBSOLETE OBSOLETE! instead use THREEx.HitTestingPlane or THREEx.HitTestingTango')
}

THREEx.ARClickability.prototype.onResize = function(){
	var sourceElement = this._sourceElement
	var cameraPicking = this._cameraPicking
	
	var fullWidth = parseInt(sourceElement.style.width)
	var fullHeight = parseInt(sourceElement.style.height)
	cameraPicking.aspect = fullWidth / fullHeight;
	cameraPicking.updateProjectionMatrix();
}

THREEx.ARClickability.prototype.computeIntersects = function(domEvent, objects){
	var sourceElement = this._sourceElement
	var cameraPicking = this._cameraPicking

	// compute mouse coordinatge with [-1,1]
	var eventCoords = new THREE.Vector3();
	eventCoords.x =   ( domEvent.layerX / parseInt(sourceElement.style.width)  ) * 2 - 1;
	eventCoords.y = - ( domEvent.layerY / parseInt(sourceElement.style.height) ) * 2 + 1;

	// compute intersections between eventCoords and pickingPlane
	var raycaster = new THREE.Raycaster();
	raycaster.setFromCamera( eventCoords, cameraPicking );
	var intersects = raycaster.intersectObjects( objects )
	
	return intersects
}

THREEx.ARClickability.prototype.update = function(){

}

//////////////////////////////////////////////////////////////////////////////
//		Code Separator
//////////////////////////////////////////////////////////////////////////////

THREEx.ARClickability.tangoPickingPointCloud = function(artoolkitContext, mouseX, mouseY){
	
// THIS IS CRAP!!!! use THREEx.HitTestingTango
	
	var vrDisplay = artoolkitContext._tangoContext.vrDisplay
        if (vrDisplay === null ) return null
        var pointAndPlane = vrDisplay.getPickingPointAndPlaneInPointCloud(mouseX, mouseY)
        if( pointAndPlane == null ) {
                console.warn('Could not retrieve the correct point and plane.')
                return null
        }
	
	// FIXME not sure what this is
	var boundingSphereRadius = 0.01	
	
	// the bigger the number the likeliest it crash chromium-webar

        // Orient and position the model in the picking point according
        // to the picking plane. The offset is half of the model size.
        var object3d = new THREE.Object3D
        THREE.WebAR.positionAndRotateObject3DWithPickingPointAndPlaneInPointCloud(
                pointAndPlane, object3d, boundingSphereRadius
        )
	object3d.rotateZ(-Math.PI/2)

	// return the result
	var result = {}
	result.position = object3d.position
	result.quaternion = object3d.quaternion
	return result
}
var THREEx = THREEx || {}
/**
 * - videoTexture
 * - cloakWidth
 * - cloakHeight
 * - cloakSegmentsHeight
 * - remove all mentions of cache, for cloak
 */
THREEx.ArMarkerCloak = function(videoTexture){
        var updateInShaderEnabled = true

        // build cloakMesh
        // TODO if webgl2 use repeat warp, and not multi segment, this will reduce the geometry to draw
	var geometry = new THREE.PlaneGeometry(1.3+0.25,1.85+0.25, 1, 8).translate(0,-0.3,0)
	var material = new THREE.ShaderMaterial( {
		vertexShader: THREEx.ArMarkerCloak.vertexShader,
		fragmentShader: THREEx.ArMarkerCloak.fragmentShader,
                transparent: true,
		uniforms: {
			texture: {
				value: videoTexture
			},
                        opacity: {
                                value: 0.5
                        }
		},
		defines: {
			updateInShaderEnabled: updateInShaderEnabled ? 1 : 0,
		}
	});

	var cloakMesh = new THREE.Mesh( geometry, material );
        cloakMesh.rotation.x = -Math.PI/2
	this.object3d = cloakMesh

	//////////////////////////////////////////////////////////////////////////////
	//		Code Separator
	//////////////////////////////////////////////////////////////////////////////

	var xMin = -0.65
	var xMax =  0.65
	var yMin =  0.65 + 0.1
	var yMax =  0.95 + 0.1

	//////////////////////////////////////////////////////////////////////////////
	//		originalsFaceVertexUvs
	//////////////////////////////////////////////////////////////////////////////
        var originalsFaceVertexUvs = [[]]

        // build originalsFaceVertexUvs array
	for(var faceIndex = 0; faceIndex < cloakMesh.geometry.faces.length; faceIndex ++ ){
		originalsFaceVertexUvs[0][faceIndex] = []
		originalsFaceVertexUvs[0][faceIndex][0] = new THREE.Vector2()
		originalsFaceVertexUvs[0][faceIndex][1] = new THREE.Vector2()
		originalsFaceVertexUvs[0][faceIndex][2] = new THREE.Vector2()
        }

	// set values in originalsFaceVertexUvs
	for(var i = 0; i < cloakMesh.geometry.parameters.heightSegments/2; i ++ ){
		// one segment height - even row - normale orientation
		originalsFaceVertexUvs[0][i*4+0][0].set( xMin/2+0.5, yMax/2+0.5 )
		originalsFaceVertexUvs[0][i*4+0][1].set( xMin/2+0.5, yMin/2+0.5 )
		originalsFaceVertexUvs[0][i*4+0][2].set( xMax/2+0.5, yMax/2+0.5 )
		
		originalsFaceVertexUvs[0][i*4+1][0].set( xMin/2+0.5, yMin/2+0.5 )
		originalsFaceVertexUvs[0][i*4+1][1].set( xMax/2+0.5, yMin/2+0.5 )
		originalsFaceVertexUvs[0][i*4+1][2].set( xMax/2+0.5, yMax/2+0.5 )

		// one segment height - odd row - mirror-y orientation
		originalsFaceVertexUvs[0][i*4+2][0].set( xMin/2+0.5, yMin/2+0.5 )
		originalsFaceVertexUvs[0][i*4+2][1].set( xMin/2+0.5, yMax/2+0.5 )
		originalsFaceVertexUvs[0][i*4+2][2].set( xMax/2+0.5, yMin/2+0.5 )
		
		originalsFaceVertexUvs[0][i*4+3][0].set( xMin/2+0.5, yMax/2+0.5 )
		originalsFaceVertexUvs[0][i*4+3][1].set( xMax/2+0.5, yMax/2+0.5 )
		originalsFaceVertexUvs[0][i*4+3][2].set( xMax/2+0.5, yMin/2+0.5 )
	}

        if( updateInShaderEnabled === true ){
                cloakMesh.geometry.faceVertexUvs = originalsFaceVertexUvs
                cloakMesh.geometry.uvsNeedUpdate = true                
        }

	//////////////////////////////////////////////////////////////////////////////
	//		Code Separator
	//////////////////////////////////////////////////////////////////////////////

	var originalOrthoVertices = []
	originalOrthoVertices.push( new THREE.Vector3(xMin, yMax, 0))
	originalOrthoVertices.push( new THREE.Vector3(xMax, yMax, 0))
	originalOrthoVertices.push( new THREE.Vector3(xMin, yMin, 0))
	originalOrthoVertices.push( new THREE.Vector3(xMax, yMin, 0))

	// build debugMesh
        var material = new THREE.MeshNormalMaterial({
		transparent : true,
		opacity: 0.5,
		side: THREE.DoubleSide
	});
        var geometry = new THREE.PlaneGeometry(1,1);
        var orthoMesh = new THREE.Mesh(geometry, material);
	this.orthoMesh = orthoMesh

        //////////////////////////////////////////////////////////////////////////////
        //                Code Separator
        //////////////////////////////////////////////////////////////////////////////

	this.update = function(modelViewMatrix, cameraProjectionMatrix){
                updateOrtho(modelViewMatrix, cameraProjectionMatrix)

                if( updateInShaderEnabled === false ){
                        updateUvs(modelViewMatrix, cameraProjectionMatrix)
                }
	}
        
        return

        // update cloakMesh
	function updateUvs(modelViewMatrix, cameraProjectionMatrix){
		var transformedUv = new THREE.Vector3()
                originalsFaceVertexUvs[0].forEach(function(faceVertexUvs, faceIndex){
                        faceVertexUvs.forEach(function(originalUv, uvIndex){
                                // set transformedUv - from UV coord to clip coord
                                transformedUv.x = originalUv.x * 2.0 - 1.0;
                                transformedUv.y = originalUv.y * 2.0 - 1.0;
                                transformedUv.z = 0
        			// apply modelViewMatrix and projectionMatrix
        			transformedUv.applyMatrix4( modelViewMatrix )
        			transformedUv.applyMatrix4( cameraProjectionMatrix )
        			// apply perspective
        			transformedUv.x /= transformedUv.z
        			transformedUv.y /= transformedUv.z
                                // set back from clip coord to Uv coord
                                transformedUv.x = transformedUv.x / 2.0 + 0.5;
                                transformedUv.y = transformedUv.y / 2.0 + 0.5;
                                // copy the trasnformedUv into the geometry
                                cloakMesh.geometry.faceVertexUvs[0][faceIndex][uvIndex].set(transformedUv.x, transformedUv.y)
                        })
                })
        
                // cloakMesh.geometry.faceVertexUvs = faceVertexUvs
                cloakMesh.geometry.uvsNeedUpdate = true
        }

        // update orthoMesh
	function updateOrtho(modelViewMatrix, cameraProjectionMatrix){
		// compute transformedUvs
		var transformedUvs = []
		originalOrthoVertices.forEach(function(originalOrthoVertices, index){
			var transformedUv = originalOrthoVertices.clone()
			// apply modelViewMatrix and projectionMatrix
			transformedUv.applyMatrix4( modelViewMatrix )
			transformedUv.applyMatrix4( cameraProjectionMatrix )
			// apply perspective
			transformedUv.x /= transformedUv.z
			transformedUv.y /= transformedUv.z
			// store it
			transformedUvs.push(transformedUv)
		})

		// change orthoMesh vertices
		for(var i = 0; i < transformedUvs.length; i++){
			orthoMesh.geometry.vertices[i].copy(transformedUvs[i])
		}
		orthoMesh.geometry.computeBoundingSphere()
		orthoMesh.geometry.verticesNeedUpdate = true
        }

}

//////////////////////////////////////////////////////////////////////////////
//                Shaders
//////////////////////////////////////////////////////////////////////////////

THREEx.ArMarkerCloak.markerSpaceShaderFunction = '\n'+
'        vec2 transformUvToMarkerSpace(vec2 originalUv){\n'+
'                vec3 transformedUv;\n'+
'                // set transformedUv - from UV coord to clip coord\n'+
'                transformedUv.x = originalUv.x * 2.0 - 1.0;\n'+
'                transformedUv.y = originalUv.y * 2.0 - 1.0;\n'+
'                transformedUv.z = 0.0;\n'+
'\n'+
'		// apply modelViewMatrix and projectionMatrix\n'+
'                transformedUv = (projectionMatrix * modelViewMatrix * vec4( transformedUv, 1.0 ) ).xyz;\n'+
'\n'+
'		// apply perspective\n'+
'		transformedUv.x /= transformedUv.z;\n'+
'		transformedUv.y /= transformedUv.z;\n'+
'\n'+
'                // set back from clip coord to Uv coord\n'+
'                transformedUv.x = transformedUv.x / 2.0 + 0.5;\n'+
'                transformedUv.y = transformedUv.y / 2.0 + 0.5;\n'+
'\n'+
'                // return the result\n'+
'                return transformedUv.xy;\n'+
'        }'

THREEx.ArMarkerCloak.vertexShader = THREEx.ArMarkerCloak.markerSpaceShaderFunction +
'	varying vec2 vUv;\n'+
'\n'+
'	void main(){\n'+
'                // pass the UV to the fragment\n'+
'                #if (updateInShaderEnabled == 1)\n'+
'		        vUv = transformUvToMarkerSpace(uv);\n'+
'                #else\n'+
'		        vUv = uv;\n'+
'                #endif\n'+
'\n'+
'                // compute gl_Position\n'+
'		vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );\n'+
'		gl_Position = projectionMatrix * mvPosition;\n'+
'	}';

THREEx.ArMarkerCloak.fragmentShader = '\n'+
'	varying vec2 vUv;\n'+
'	uniform sampler2D texture;\n'+
'	uniform float opacity;\n'+
'\n'+
'	void main(void){\n'+
'		vec3 color = texture2D( texture, vUv ).rgb;\n'+
'\n'+
'		gl_FragColor = vec4( color, opacity);\n'+
'	}'
var ARjs = ARjs || {}
var THREEx = THREEx || {}

ARjs.MarkerControls = THREEx.ArMarkerControls = function(context, object3d, parameters){
	var _this = this

	THREEx.ArBaseControls.call(this, object3d)

	this.context = context
	// handle default parameters
	this.parameters = {
		// size of the marker in meter
		size : 1,
		// type of marker - ['pattern', 'barcode', 'unknown' ]
		type : 'unknown',
		// url of the pattern - IIF type='pattern'
		patternUrl : null,
		// value of the barcode - IIF type='barcode'
		barcodeValue : null,
		// change matrix mode - [modelViewMatrix, cameraTransformMatrix]
		changeMatrixMode : 'modelViewMatrix',
		// minimal confidence in the marke recognition - between [0, 1] - default to 1
		minConfidence: 0.6,
		// turn on/off camera smoothing
		smooth: false,
		// number of matrices to smooth tracking over, more = smoother but slower follow
		smoothCount: 5,
		// distance tolerance for smoothing, if smoothThreshold # of matrices are under tolerance, tracking will stay still
		smoothTolerance: 0.01,
		// threshold for smoothing, will keep still unless enough matrices are over tolerance
		smoothThreshold: 2,
	}

	// sanity check
	var possibleValues = ['pattern', 'barcode', 'unknown']
	console.assert(possibleValues.indexOf(this.parameters.type) !== -1, 'illegal value', this.parameters.type)
	var possibleValues = ['modelViewMatrix', 'cameraTransformMatrix' ]
	console.assert(possibleValues.indexOf(this.parameters.changeMatrixMode) !== -1, 'illegal value', this.parameters.changeMatrixMode)


        // create the marker Root
	this.object3d = object3d
	this.object3d.matrixAutoUpdate = false;
	this.object3d.visible = false

	//////////////////////////////////////////////////////////////////////////////
	//		setParameters
	//////////////////////////////////////////////////////////////////////////////
	setParameters(parameters)
	function setParameters(parameters){
		if( parameters === undefined )	return
		for( var key in parameters ){
			var newValue = parameters[ key ]

			if( newValue === undefined ){
				console.warn( "THREEx.ArMarkerControls: '" + key + "' parameter is undefined." )
				continue
			}

			var currentValue = _this.parameters[ key ]

			if( currentValue === undefined ){
				console.warn( "THREEx.ArMarkerControls: '" + key + "' is not a property of this material." )
				continue
			}

			_this.parameters[ key ] = newValue
		}
	}

	if (this.parameters.smooth) {
		this.smoothMatrices = []; // last DEBOUNCE_COUNT modelViewMatrix
	}

	//////////////////////////////////////////////////////////////////////////////
	//		Code Separator
	//////////////////////////////////////////////////////////////////////////////
	// add this marker to artoolkitsystem
	// TODO rename that .addMarkerControls
	context.addMarker(this)

	if( _this.context.parameters.trackingBackend === 'artoolkit' ){
		this._initArtoolkit()
	}else if( _this.context.parameters.trackingBackend === 'aruco' ){
		// TODO create a ._initAruco
		// put aruco second
		this._arucoPosit = new POS.Posit(this.parameters.size, _this.context.arucoContext.canvas.width)
	}else if( _this.context.parameters.trackingBackend === 'tango' ){
		this._initTango()
	}else console.assert(false)
}

ARjs.MarkerControls.prototype = Object.create( THREEx.ArBaseControls.prototype );
ARjs.MarkerControls.prototype.constructor = THREEx.ArMarkerControls;

ARjs.MarkerControls.prototype.dispose = function(){
	this.context.removeMarker(this)

	// TODO remove the event listener if needed
	// unloadMaker ???
}

//////////////////////////////////////////////////////////////////////////////
//		update controls with new modelViewMatrix
//////////////////////////////////////////////////////////////////////////////

/**
 * When you actually got a new modelViewMatrix, you need to perfom a whole bunch
 * of things. it is done here.
 */
ARjs.MarkerControls.prototype.updateWithModelViewMatrix = function(modelViewMatrix){
	var markerObject3D = this.object3d;

	// mark object as visible
	markerObject3D.visible = true

	if( this.context.parameters.trackingBackend === 'artoolkit' ){
		// apply context._axisTransformMatrix - change artoolkit axis to match usual webgl one
		var tmpMatrix = new THREE.Matrix4().copy(this.context._artoolkitProjectionAxisTransformMatrix)
		tmpMatrix.multiply(modelViewMatrix)

		modelViewMatrix.copy(tmpMatrix)
	}else if( this.context.parameters.trackingBackend === 'aruco' ){
		// ...
	}else if( this.context.parameters.trackingBackend === 'tango' ){
		// ...
	}else console.assert(false)


	if( this.context.parameters.trackingBackend !== 'tango' ){

		// change axis orientation on marker - artoolkit say Z is normal to the marker - ar.js say Y is normal to the marker
		var markerAxisTransformMatrix = new THREE.Matrix4().makeRotationX(Math.PI/2)
		modelViewMatrix.multiply(markerAxisTransformMatrix)
	}

	var renderReqd = false;

	// change markerObject3D.matrix based on parameters.changeMatrixMode
	if( this.parameters.changeMatrixMode === 'modelViewMatrix' ){
		if (this.parameters.smooth) {
			var sum,
					i, j,
					averages, // average values for matrix over last smoothCount
					exceedsAverageTolerance = 0;

			this.smoothMatrices.push(modelViewMatrix.elements.slice()); // add latest

			if (this.smoothMatrices.length < (this.parameters.smoothCount + 1)) {
				markerObject3D.matrix.copy(modelViewMatrix); // not enough for average
			} else {
				this.smoothMatrices.shift(); // remove oldest entry
				averages = [];

				for (i in modelViewMatrix.elements) { // loop over entries in matrix
					sum = 0;
					for (j in this.smoothMatrices) { // calculate average for this entry
						sum += this.smoothMatrices[j][i];
					}
					averages[i] = sum / this.parameters.smoothCount;
					// check how many elements vary from the average by at least AVERAGE_MATRIX_TOLERANCE
					if (Math.abs(averages[i] - modelViewMatrix.elements[i]) >= this.parameters.smoothTolerance) {
						exceedsAverageTolerance++;
					}
				}
				
				// if moving (i.e. at least AVERAGE_MATRIX_THRESHOLD entries are over AVERAGE_MATRIX_TOLERANCE)
				if (exceedsAverageTolerance >= this.parameters.smoothThreshold) {
					// then update matrix values to average, otherwise, don't render to minimize jitter
					for (i in modelViewMatrix.elements) {
						modelViewMatrix.elements[i] = averages[i];
					}
					markerObject3D.matrix.copy(modelViewMatrix);
					renderReqd = true; // render required in animation loop
				}
			}
		} else {
			markerObject3D.matrix.copy(modelViewMatrix)
		}
	}else if( this.parameters.changeMatrixMode === 'cameraTransformMatrix' ){
		markerObject3D.matrix.getInverse( modelViewMatrix )
	}else {
		console.assert(false)
	}

	// decompose - the matrix into .position, .quaternion, .scale
	markerObject3D.matrix.decompose(markerObject3D.position, markerObject3D.quaternion, markerObject3D.scale)

	// dispatchEvent
	this.dispatchEvent( { type: 'markerFound' } );

	return renderReqd;
}

//////////////////////////////////////////////////////////////////////////////
//		utility functions
//////////////////////////////////////////////////////////////////////////////

/**
 * provide a name for a marker
 * - silly heuristic for now
 * - should be improved
 */
ARjs.MarkerControls.prototype.name = function(){
	var name = ''
	name += this.parameters.type;
	if( this.parameters.type === 'pattern' ){
		var url = this.parameters.patternUrl
		var basename = url.replace(/^.*\//g, '')
		name += ' - ' + basename
	}else if( this.parameters.type === 'barcode' ){
		name += ' - ' + this.parameters.barcodeValue
	}else{
		console.assert(false, 'no .name() implemented for this marker controls')
	}
	return name
}

//////////////////////////////////////////////////////////////////////////////
//		init for Artoolkit
//////////////////////////////////////////////////////////////////////////////
ARjs.MarkerControls.prototype._initArtoolkit = function(){
	var _this = this

	var artoolkitMarkerId = null

	var delayedInitTimerId = setInterval(function(){
		// check if arController is init
		var arController = _this.context.arController
		if( arController === null )	return
		// stop looping if it is init
		clearInterval(delayedInitTimerId)
		delayedInitTimerId = null
		// launch the _postInitArtoolkit
		postInit()
	}, 1000/50)

	return

	function postInit(){
		// check if arController is init
		var arController = _this.context.arController
		console.assert(arController !== null )

		// start tracking this pattern
		if( _this.parameters.type === 'pattern' ){
	                arController.loadMarker(_this.parameters.patternUrl, function(markerId) {
				artoolkitMarkerId = markerId
	                        arController.trackPatternMarkerId(artoolkitMarkerId, _this.parameters.size);
	                });
		}else if( _this.parameters.type === 'barcode' ){
			artoolkitMarkerId = _this.parameters.barcodeValue
			arController.trackBarcodeMarkerId(artoolkitMarkerId, _this.parameters.size);
		}else if( _this.parameters.type === 'unknown' ){
			artoolkitMarkerId = null
		}else{
			console.log(false, 'invalid marker type', _this.parameters.type)
		}

		// listen to the event
		arController.addEventListener('getMarker', function(event){
			if( event.data.type === artoolkit.PATTERN_MARKER && _this.parameters.type === 'pattern' ){
				if( artoolkitMarkerId === null )	return
				if( event.data.marker.idPatt === artoolkitMarkerId ) onMarkerFound(event)
			}else if( event.data.type === artoolkit.BARCODE_MARKER && _this.parameters.type === 'barcode' ){
				// console.log('BARCODE_MARKER idMatrix', event.data.marker.idMatrix, artoolkitMarkerId )
				if( artoolkitMarkerId === null )	return
				if( event.data.marker.idMatrix === artoolkitMarkerId )  onMarkerFound(event)
			}else if( event.data.type === artoolkit.UNKNOWN_MARKER && _this.parameters.type === 'unknown'){
				onMarkerFound(event)
			}
		})

	}

	function onMarkerFound(event){
		// honor his.parameters.minConfidence
		if( event.data.type === artoolkit.PATTERN_MARKER && event.data.marker.cfPatt < _this.parameters.minConfidence )	return
		if( event.data.type === artoolkit.BARCODE_MARKER && event.data.marker.cfMatt < _this.parameters.minConfidence )	return

		var modelViewMatrix = new THREE.Matrix4().fromArray(event.data.matrix)
		_this.updateWithModelViewMatrix(modelViewMatrix)
	}
}

//////////////////////////////////////////////////////////////////////////////
//		aruco specific
//////////////////////////////////////////////////////////////////////////////
ARjs.MarkerControls.prototype._initAruco = function(){
	this._arucoPosit = new POS.Posit(this.parameters.size, _this.context.arucoContext.canvas.width)
}

//////////////////////////////////////////////////////////////////////////////
//		init for Artoolkit
//////////////////////////////////////////////////////////////////////////////
ARjs.MarkerControls.prototype._initTango = function(){
	var _this = this
	console.log('init tango ArMarkerControls')
}
var THREEx = THREEx || {}

THREEx.ArMarkerHelper = function(markerControls){
	this.object3d = new THREE.Group

	var mesh = new THREE.AxesHelper()
	this.object3d.add(mesh)

	var text = markerControls.id
	// debugger
	// var text = markerControls.parameters.patternUrl.slice(-1).toUpperCase();

	var canvas = document.createElement( 'canvas' );
	canvas.width =  64;
	canvas.height = 64;

	var context = canvas.getContext( '2d' );
	var texture = new THREE.CanvasTexture( canvas );

	// put the text in the sprite
	context.font = '48px monospace';
	context.fillStyle = 'rgba(192,192,255, 0.5)';
	context.fillRect( 0, 0, canvas.width, canvas.height );
	context.fillStyle = 'darkblue';
	context.fillText(text, canvas.width/4, 3*canvas.height/4 )
	texture.needsUpdate = true

	// var geometry = new THREE.CubeGeometry(1, 1, 1)
	var geometry = new THREE.PlaneGeometry(1, 1)
	var material = new THREE.MeshBasicMaterial({
		map: texture,
		transparent: true
	});
	var mesh = new THREE.Mesh(geometry, material)
	mesh.rotation.x = -Math.PI/2

	this.object3d.add(mesh)

}
var THREEx = THREEx || {}

/**
 * - lerp position/quaternino/scale
 * - minDelayDetected
 * - minDelayUndetected
 * @param {[type]} object3d   [description]
 * @param {[type]} parameters [description]
 */
THREEx.ArSmoothedControls = function(object3d, parameters){
	var _this = this
	
	THREEx.ArBaseControls.call(this, object3d)
	
	// copy parameters
	this.object3d.visible = false
	
	this._lastLerpStepAt = null
	this._visibleStartedAt = null
	this._unvisibleStartedAt = null

	// handle default parameters
	parameters = parameters || {}
	this.parameters = {
		// lerp coeficient for the position - between [0,1] - default to 1
		lerpPosition: 0.8,
		// lerp coeficient for the quaternion - between [0,1] - default to 1
		lerpQuaternion: 0.2,
		// lerp coeficient for the scale - between [0,1] - default to 1
		lerpScale: 0.7,
		// delay for lerp fixed steps - in seconds - default to 1/120
		lerpStepDelay: 1/60,
		// minimum delay the sub-control must be visible before this controls become visible - default to 0 seconds
		minVisibleDelay: 0.0,
		// minimum delay the sub-control must be unvisible before this controls become unvisible - default to 0 seconds
		minUnvisibleDelay: 0.2,
	}
	
	//////////////////////////////////////////////////////////////////////////////
	//		setParameters
	//////////////////////////////////////////////////////////////////////////////
	setParameters(parameters)
	function setParameters(parameters){
		if( parameters === undefined )	return
		for( var key in parameters ){
			var newValue = parameters[ key ]

			if( newValue === undefined ){
				console.warn( "THREEx.ArSmoothedControls: '" + key + "' parameter is undefined." )
				continue
			}

			var currentValue = _this.parameters[ key ]

			if( currentValue === undefined ){
				console.warn( "THREEx.ArSmoothedControls: '" + key + "' is not a property of this material." )
				continue
			}

			_this.parameters[ key ] = newValue
		}
	}
}
	
THREEx.ArSmoothedControls.prototype = Object.create( THREEx.ArBaseControls.prototype );
THREEx.ArSmoothedControls.prototype.constructor = THREEx.ArSmoothedControls;

//////////////////////////////////////////////////////////////////////////////
//		update function
//////////////////////////////////////////////////////////////////////////////

THREEx.ArSmoothedControls.prototype.update = function(targetObject3d){
	var object3d = this.object3d
	var parameters = this.parameters
	var wasVisible = object3d.visible
	var present = performance.now()/1000


	//////////////////////////////////////////////////////////////////////////////
	//		handle object3d.visible with minVisibleDelay/minUnvisibleDelay
	//////////////////////////////////////////////////////////////////////////////
	if( targetObject3d.visible === false )	this._visibleStartedAt = null
	if( targetObject3d.visible === true )	this._unvisibleStartedAt = null

	if( targetObject3d.visible === true && this._visibleStartedAt === null )	this._visibleStartedAt = present
	if( targetObject3d.visible === false && this._unvisibleStartedAt === null )	this._unvisibleStartedAt = present

	if( wasVisible === false && targetObject3d.visible === true ){
		var visibleFor = present - this._visibleStartedAt
		if( visibleFor >= this.parameters.minVisibleDelay ){
			object3d.visible = true
			snapDirectlyToTarget()
		}
		// console.log('visibleFor', visibleFor)
	}

	if( wasVisible === true && targetObject3d.visible === false ){
		var unvisibleFor = present - this._unvisibleStartedAt
		if( unvisibleFor >= this.parameters.minUnvisibleDelay ){
			object3d.visible = false			
		}
	}
	
	//////////////////////////////////////////////////////////////////////////////
	//		apply lerp on positon/quaternion/scale
	//////////////////////////////////////////////////////////////////////////////

	// apply lerp steps - require fix time steps to behave the same no matter the fps
	if( this._lastLerpStepAt === null ){
		applyOneSlerpStep()
		this._lastLerpStepAt = present
	}else{
		var nStepsToDo = Math.floor( (present - this._lastLerpStepAt)/this.parameters.lerpStepDelay )
		for(var i = 0; i < nStepsToDo; i++){
			applyOneSlerpStep()
			this._lastLerpStepAt += this.parameters.lerpStepDelay
		}
	}

	// disable the lerp by directly copying targetObject3d position/quaternion/scale
	if( false ){		
		snapDirectlyToTarget()
	}

	// update the matrix
	this.object3d.updateMatrix()

	//////////////////////////////////////////////////////////////////////////////
	//		honor becameVisible/becameUnVisible event
	//////////////////////////////////////////////////////////////////////////////
	// honor becameVisible event
	if( wasVisible === false && object3d.visible === true ){
		this.dispatchEvent({ type: 'becameVisible' })
	}
	// honor becameUnVisible event
	if( wasVisible === true && object3d.visible === false ){
		this.dispatchEvent({ type: 'becameUnVisible' })
	}
	return

	function snapDirectlyToTarget(){
		object3d.position.copy( targetObject3d.position )
		object3d.quaternion.copy( targetObject3d.quaternion )
		object3d.scale.copy( targetObject3d.scale )
	}	
	
	function applyOneSlerpStep(){
		object3d.position.lerp(targetObject3d.position, parameters.lerpPosition)
		object3d.quaternion.slerp(targetObject3d.quaternion, parameters.lerpQuaternion)
		object3d.scale.lerp(targetObject3d.scale, parameters.lerpScale)
	}
}
var ARjs = ARjs || {}
var THREEx = THREEx || {}

ARjs.Context = THREEx.ArToolkitContext = function(parameters){
	var _this = this

	_this._updatedAt = null

	// handle default parameters
	this.parameters = {
		// AR backend - ['artoolkit', 'aruco', 'tango']
		trackingBackend: 'artoolkit',
		// debug - true if one should display artoolkit debug canvas, false otherwise
		debug: false,
		// the mode of detection - ['color', 'color_and_matrix', 'mono', 'mono_and_matrix']
		detectionMode: 'mono',
		// type of matrix code - valid iif detectionMode end with 'matrix' - [3x3, 3x3_HAMMING63, 3x3_PARITY65, 4x4, 4x4_BCH_13_9_3, 4x4_BCH_13_5_5]
		matrixCodeType: '3x3',

		// url of the camera parameters
		cameraParametersUrl: ARjs.Context.baseURL + 'parameters/camera_para.dat',

		// tune the maximum rate of pose detection in the source image
		maxDetectionRate: 60,
		// resolution of at which we detect pose in the source image
		canvasWidth: 640,
		canvasHeight: 480,

		// the patternRatio inside the artoolkit marker - artoolkit only
		patternRatio: 0.5,

		// enable image smoothing or not for canvas copy - default to true
		// https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/imageSmoothingEnabled
		imageSmoothingEnabled : false,
	}
	// parameters sanity check
	console.assert(['artoolkit', 'aruco', 'tango'].indexOf(this.parameters.trackingBackend) !== -1, 'invalid parameter trackingBackend', this.parameters.trackingBackend)
	console.assert(['color', 'color_and_matrix', 'mono', 'mono_and_matrix'].indexOf(this.parameters.detectionMode) !== -1, 'invalid parameter detectionMode', this.parameters.detectionMode)

        this.arController = null;
        this.arucoContext = null;

	_this.initialized = false


	this._arMarkersControls = []

	//////////////////////////////////////////////////////////////////////////////
	//		setParameters
	//////////////////////////////////////////////////////////////////////////////
	setParameters(parameters)
	function setParameters(parameters){
		if( parameters === undefined )	return
		for( var key in parameters ){
			var newValue = parameters[ key ]

			if( newValue === undefined ){
				console.warn( "THREEx.ArToolkitContext: '" + key + "' parameter is undefined." )
				continue
			}

			var currentValue = _this.parameters[ key ]

			if( currentValue === undefined ){
				console.warn( "THREEx.ArToolkitContext: '" + key + "' is not a property of this material." )
				continue
			}

			_this.parameters[ key ] = newValue
		}
	}
}

Object.assign( ARjs.Context.prototype, THREE.EventDispatcher.prototype );

// ARjs.Context.baseURL = '../'
// default to github page
ARjs.Context.baseURL = 'https://jeromeetienne.github.io/AR.js/three.js/'
ARjs.Context.REVISION = '2.0.5';

/**
 * Create a default camera for this trackingBackend
 * @param {string} trackingBackend - the tracking to user
 * @return {THREE.Camera} the created camera
 */
ARjs.Context.createDefaultCamera = function( trackingBackend ){
	console.assert(false, 'use ARjs.Utils.createDefaultCamera instead')
	// Create a camera
	if( trackingBackend === 'artoolkit' ){
		var camera = new THREE.Camera();
	}else if( trackingBackend === 'aruco' ){
		var camera = new THREE.PerspectiveCamera(42, renderer.domElement.width / renderer.domElement.height, 0.01, 100);
	}else if( trackingBackend === 'tango' ){
		var camera = new THREE.PerspectiveCamera(42, renderer.domElement.width / renderer.domElement.height, 0.01, 100);
	}else console.assert(false)
	return camera
}


//////////////////////////////////////////////////////////////////////////////
//		init functions
//////////////////////////////////////////////////////////////////////////////
ARjs.Context.prototype.init = function(onCompleted){
	var _this = this
	if( this.parameters.trackingBackend === 'artoolkit' ){
		this._initArtoolkit(done)
	}else if( this.parameters.trackingBackend === 'aruco' ){
		this._initAruco(done)
	}else if( this.parameters.trackingBackend === 'tango' ){
		this._initTango(done)
	}else console.assert(false)
	return

	function done(){
		// dispatch event
		_this.dispatchEvent({
			type: 'initialized'
		});

		_this.initialized = true

		onCompleted && onCompleted()
	}

}
////////////////////////////////////////////////////////////////////////////////
//          update function
////////////////////////////////////////////////////////////////////////////////
ARjs.Context.prototype.update = function(srcElement){

	// be sure arController is fully initialized
        if(this.parameters.trackingBackend === 'artoolkit' && this.arController === null) return false;

	// honor this.parameters.maxDetectionRate
	var present = performance.now()
	if( this._updatedAt !== null && present - this._updatedAt < 1000/this.parameters.maxDetectionRate ){
		return false
	}
	this._updatedAt = present

	// mark all markers to invisible before processing this frame
	this._arMarkersControls.forEach(function(markerControls){
		markerControls.object3d.visible = false
	})

	// process this frame
	if(this.parameters.trackingBackend === 'artoolkit'){
		this._updateArtoolkit(srcElement)
	}else if( this.parameters.trackingBackend === 'aruco' ){
		this._updateAruco(srcElement)
	}else if( this.parameters.trackingBackend === 'tango' ){
		this._updateTango(srcElement)
	}else{
		console.assert(false)
	}

	// dispatch event
	this.dispatchEvent({
		type: 'sourceProcessed'
	});


	// return true as we processed the frame
	return true;
}

////////////////////////////////////////////////////////////////////////////////
//          Add/Remove markerControls
////////////////////////////////////////////////////////////////////////////////
ARjs.Context.prototype.addMarker = function(arMarkerControls){
	console.assert(arMarkerControls instanceof THREEx.ArMarkerControls)
	this._arMarkersControls.push(arMarkerControls)
}

ARjs.Context.prototype.removeMarker = function(arMarkerControls){
	console.assert(arMarkerControls instanceof THREEx.ArMarkerControls)
	// console.log('remove marker for', arMarkerControls)
	var index = this.arMarkerControlss.indexOf(artoolkitMarker);
	console.assert(index !== index )
	this._arMarkersControls.splice(index, 1)
}

//////////////////////////////////////////////////////////////////////////////
//		artoolkit specific
//////////////////////////////////////////////////////////////////////////////
ARjs.Context.prototype._initArtoolkit = function(onCompleted){
        var _this = this

	// set this._artoolkitProjectionAxisTransformMatrix to change artoolkit projection matrix axis to match usual webgl one
	this._artoolkitProjectionAxisTransformMatrix = new THREE.Matrix4()
	this._artoolkitProjectionAxisTransformMatrix.multiply(new THREE.Matrix4().makeRotationY(Math.PI))
	this._artoolkitProjectionAxisTransformMatrix.multiply(new THREE.Matrix4().makeRotationZ(Math.PI))

	// get cameraParameters
        var cameraParameters = new ARCameraParam(_this.parameters.cameraParametersUrl, function(){
        	// init controller
                var arController = new ARController(_this.parameters.canvasWidth, _this.parameters.canvasHeight, cameraParameters);
                _this.arController = arController

		// honor this.parameters.imageSmoothingEnabled
		arController.ctx.mozImageSmoothingEnabled = _this.parameters.imageSmoothingEnabled;
		arController.ctx.webkitImageSmoothingEnabled = _this.parameters.imageSmoothingEnabled;
		arController.ctx.msImageSmoothingEnabled = _this.parameters.imageSmoothingEnabled;
		arController.ctx.imageSmoothingEnabled = _this.parameters.imageSmoothingEnabled;

		// honor this.parameters.debug
                if( _this.parameters.debug === true ){
			arController.debugSetup();
			arController.canvas.style.position = 'absolute'
			arController.canvas.style.top = '0px'
			arController.canvas.style.opacity = '0.6'
			arController.canvas.style.pointerEvents = 'none'
			arController.canvas.style.zIndex = '-1'
		}

		// setPatternDetectionMode
		var detectionModes = {
			'color'			: artoolkit.AR_TEMPLATE_MATCHING_COLOR,
			'color_and_matrix'	: artoolkit.AR_TEMPLATE_MATCHING_COLOR_AND_MATRIX,
			'mono'			: artoolkit.AR_TEMPLATE_MATCHING_MONO,
			'mono_and_matrix'	: artoolkit.AR_TEMPLATE_MATCHING_MONO_AND_MATRIX,
		}
		var detectionMode = detectionModes[_this.parameters.detectionMode]
		console.assert(detectionMode !== undefined)
		arController.setPatternDetectionMode(detectionMode);

		// setMatrixCodeType
		var matrixCodeTypes = {
			'3x3'		: artoolkit.AR_MATRIX_CODE_3x3,
			'3x3_HAMMING63'	: artoolkit.AR_MATRIX_CODE_3x3_HAMMING63,
			'3x3_PARITY65'	: artoolkit.AR_MATRIX_CODE_3x3_PARITY65,
			'4x4'		: artoolkit.AR_MATRIX_CODE_4x4,
			'4x4_BCH_13_9_3': artoolkit.AR_MATRIX_CODE_4x4_BCH_13_9_3,
			'4x4_BCH_13_5_5': artoolkit.AR_MATRIX_CODE_4x4_BCH_13_5_5,
		}
		var matrixCodeType = matrixCodeTypes[_this.parameters.matrixCodeType]
		console.assert(matrixCodeType !== undefined)
		arController.setMatrixCodeType(matrixCodeType);

		// set the patternRatio for artoolkit
		arController.setPattRatio(_this.parameters.patternRatio);

		// set thresholding in artoolkit
		// this seems to be the default
		// arController.setThresholdMode(artoolkit.AR_LABELING_THRESH_MODE_MANUAL)
		// adatative consume a LOT of cpu...
		// arController.setThresholdMode(artoolkit.AR_LABELING_THRESH_MODE_AUTO_ADAPTIVE)
		// arController.setThresholdMode(artoolkit.AR_LABELING_THRESH_MODE_AUTO_OTSU)

		// notify
                onCompleted()
        })
	return this
}

/**
 * return the projection matrix
 */
ARjs.Context.prototype.getProjectionMatrix = function(srcElement){


// FIXME rename this function to say it is artoolkit specific - getArtoolkitProjectMatrix
// keep a backward compatibility with a console.warn

	console.assert( this.parameters.trackingBackend === 'artoolkit' )
	console.assert(this.arController, 'arController MUST be initialized to call this function')
	// get projectionMatrixArr from artoolkit
	var projectionMatrixArr = this.arController.getCameraMatrix();
	var projectionMatrix = new THREE.Matrix4().fromArray(projectionMatrixArr)

	// apply context._axisTransformMatrix - change artoolkit axis to match usual webgl one
	projectionMatrix.multiply(this._artoolkitProjectionAxisTransformMatrix)

	// return the result
	return projectionMatrix
}

ARjs.Context.prototype._updateArtoolkit = function(srcElement){
	this.arController.process(srcElement)
}

//////////////////////////////////////////////////////////////////////////////
//		aruco specific
//////////////////////////////////////////////////////////////////////////////
ARjs.Context.prototype._initAruco = function(onCompleted){
	this.arucoContext = new THREEx.ArucoContext()

	// honor this.parameters.canvasWidth/.canvasHeight
	this.arucoContext.canvas.width = this.parameters.canvasWidth
	this.arucoContext.canvas.height = this.parameters.canvasHeight

	// honor this.parameters.imageSmoothingEnabled
	var context = this.arucoContext.canvas.getContext('2d')
	// context.mozImageSmoothingEnabled = this.parameters.imageSmoothingEnabled;
	context.webkitImageSmoothingEnabled = this.parameters.imageSmoothingEnabled;
	context.msImageSmoothingEnabled = this.parameters.imageSmoothingEnabled;
	context.imageSmoothingEnabled = this.parameters.imageSmoothingEnabled;


	setTimeout(function(){
		onCompleted()
	}, 0)
}


ARjs.Context.prototype._updateAruco = function(srcElement){
	// console.log('update aruco here')
	var _this = this
	var arMarkersControls = this._arMarkersControls
        var detectedMarkers = this.arucoContext.detect(srcElement)

	detectedMarkers.forEach(function(detectedMarker){
		var foundControls = null
		for(var i = 0; i < arMarkersControls.length; i++){
			console.assert( arMarkersControls[i].parameters.type === 'barcode' )
			if( arMarkersControls[i].parameters.barcodeValue === detectedMarker.id ){
				foundControls = arMarkersControls[i]
				break;
			}
		}
		if( foundControls === null )	return

		var tmpObject3d = new THREE.Object3D
                _this.arucoContext.updateObject3D(tmpObject3d, foundControls._arucoPosit, foundControls.parameters.size, detectedMarker);
		tmpObject3d.updateMatrix()

		foundControls.updateWithModelViewMatrix(tmpObject3d.matrix)
	})
}

//////////////////////////////////////////////////////////////////////////////
//		tango specific
//////////////////////////////////////////////////////////////////////////////
ARjs.Context.prototype._initTango = function(onCompleted){
	var _this = this
	// check webvr is available
	if (navigator.getVRDisplays){
		// do nothing
	} else if (navigator.getVRDevices){
		alert("Your browser supports WebVR but not the latest version. See <a href='http://webvr.info'>webvr.info</a> for more info.");
	} else {
		alert("Your browser does not support WebVR. See <a href='http://webvr.info'>webvr.info</a> for assistance.");
	}


	this._tangoContext = {
		vrDisplay: null,
		vrPointCloud: null,
		frameData: new VRFrameData(),
	}


	// get vrDisplay
	navigator.getVRDisplays().then(function (vrDisplays){
		if( vrDisplays.length === 0 )	alert('no vrDisplays available')
		var vrDisplay = _this._tangoContext.vrDisplay = vrDisplays[0]

		console.log('vrDisplays.displayName :', vrDisplay.displayName)

		// init vrPointCloud
		if( vrDisplay.displayName === "Tango VR Device" ){
                	_this._tangoContext.vrPointCloud = new THREE.WebAR.VRPointCloud(vrDisplay, true)
		}

		// NOTE it doesnt seem necessary and it fails on tango
		// var canvasElement = document.createElement('canvas')
		// document.body.appendChild(canvasElement)
		// _this._tangoContext.requestPresent([{ source: canvasElement }]).then(function(){
		// 	console.log('vrdisplay request accepted')
		// });

		onCompleted()
	});
}


ARjs.Context.prototype._updateTango = function(srcElement){
	// console.log('update aruco here')
	var _this = this
	var arMarkersControls = this._arMarkersControls
	var tangoContext= this._tangoContext
	var vrDisplay = this._tangoContext.vrDisplay

	// check vrDisplay is already initialized
	if( vrDisplay === null )	return


        // Update the point cloud. Only if the point cloud will be shown the geometry is also updated.
	if( vrDisplay.displayName === "Tango VR Device" ){
	        var showPointCloud = true
		var pointsToSkip = 0
	        _this._tangoContext.vrPointCloud.update(showPointCloud, pointsToSkip, true)
	}


	if( this._arMarkersControls.length === 0 )	return

	// TODO here do a fake search on barcode/1001 ?

	var foundControls = this._arMarkersControls[0]

	var frameData = this._tangoContext.frameData

	// read frameData
	vrDisplay.getFrameData(frameData);

	if( frameData.pose.position === null )		return
	if( frameData.pose.orientation === null )	return

	// create cameraTransformMatrix
	var position = new THREE.Vector3().fromArray(frameData.pose.position)
	var quaternion = new THREE.Quaternion().fromArray(frameData.pose.orientation)
	var scale = new THREE.Vector3(1,1,1)
	var cameraTransformMatrix = new THREE.Matrix4().compose(position, quaternion, scale)
	// compute modelViewMatrix from cameraTransformMatrix
	var modelViewMatrix = new THREE.Matrix4()
	modelViewMatrix.getInverse( cameraTransformMatrix )

	foundControls.updateWithModelViewMatrix(modelViewMatrix)

	// console.log('position', position)
	// if( position.x !== 0 ||  position.y !== 0 ||  position.z !== 0 ){
	// 	console.log('vrDisplay tracking')
	// }else{
	// 	console.log('vrDisplay NOT tracking')
	// }

}
var ARjs = ARjs || {}
var THREEx = THREEx || {}

/**
 * ArToolkitProfile helps you build parameters for artoolkit
 * - it is fully independent of the rest of the code
 * - all the other classes are still expecting normal parameters
 * - you can use this class to understand how to tune your specific usecase
 * - it is made to help people to build parameters without understanding all the underlying details.
 */
ARjs.Profile = THREEx.ArToolkitProfile = function () {
    this.reset()

    this.performance('default')
}


ARjs.Profile.prototype._guessPerformanceLabel = function () {
    var isMobile = navigator.userAgent.match(/Android/i)
        || navigator.userAgent.match(/webOS/i)
        || navigator.userAgent.match(/iPhone/i)
        || navigator.userAgent.match(/iPad/i)
        || navigator.userAgent.match(/iPod/i)
        || navigator.userAgent.match(/BlackBerry/i)
        || navigator.userAgent.match(/Windows Phone/i)
        ? true : false
    if (isMobile === true) {
        return 'phone-normal'
    }
    return 'desktop-normal'
}

//////////////////////////////////////////////////////////////////////////////
//		Code Separator
//////////////////////////////////////////////////////////////////////////////

/**
 * reset all parameters
 */
ARjs.Profile.prototype.reset = function () {
    this.sourceParameters = {
        // to read from the webcam
        sourceType: 'webcam',
    }

    this.contextParameters = {
        cameraParametersUrl: THREEx.ArToolkitContext.baseURL + '../data/data/camera_para.dat',
        detectionMode: 'mono',
    }
    this.defaultMarkerParameters = {
        type: 'pattern',
        patternUrl: THREEx.ArToolkitContext.baseURL + '../data/data/patt.hiro',
        changeMatrixMode: 'modelViewMatrix',
    }
    return this
};

//////////////////////////////////////////////////////////////////////////////
//		Performance
//////////////////////////////////////////////////////////////////////////////



ARjs.Profile.prototype.performance = function (label) {

    if (label === 'default') {
        label = this._guessPerformanceLabel()
    }

    if (label === 'desktop-fast') {
        this.contextParameters.canvasWidth = 640 * 3
        this.contextParameters.canvasHeight = 480 * 3

        this.contextParameters.maxDetectionRate = 30
    } else if (label === 'desktop-normal') {
        this.contextParameters.canvasWidth = 640
        this.contextParameters.canvasHeight = 480

        this.contextParameters.maxDetectionRate = 60
    } else if (label === 'phone-normal') {
        this.contextParameters.canvasWidth = 80 * 4
        this.contextParameters.canvasHeight = 60 * 4

        this.contextParameters.maxDetectionRate = 30
    } else if (label === 'phone-slow') {
        this.contextParameters.canvasWidth = 80 * 3
        this.contextParameters.canvasHeight = 60 * 3

        this.contextParameters.maxDetectionRate = 30
    } else {
        console.assert(false, 'unknonwn label ' + label)
    }
    return this
}

//////////////////////////////////////////////////////////////////////////////
//		Marker
//////////////////////////////////////////////////////////////////////////////


ARjs.Profile.prototype.defaultMarker = function (trackingBackend) {
    trackingBackend = trackingBackend || this.contextParameters.trackingBackend

    if (trackingBackend === 'artoolkit') {
        this.contextParameters.detectionMode = 'mono'
        this.defaultMarkerParameters.type = 'pattern'
        this.defaultMarkerParameters.patternUrl = THREEx.ArToolkitContext.baseURL + '../data/data/patt.hiro'
    } else if (trackingBackend === 'aruco') {
        this.contextParameters.detectionMode = 'mono'
        this.defaultMarkerParameters.type = 'barcode'
        this.defaultMarkerParameters.barcodeValue = 1001
    } else if (trackingBackend === 'tango') {
        // FIXME temporary placeholder - to reevaluate later
        this.defaultMarkerParameters.type = 'barcode'
        this.defaultMarkerParameters.barcodeValue = 1001
    } else console.assert(false)

    return this
}
//////////////////////////////////////////////////////////////////////////////
//		Source
//////////////////////////////////////////////////////////////////////////////
ARjs.Profile.prototype.sourceWebcam = function () {
    this.sourceParameters.sourceType = 'webcam'
    delete this.sourceParameters.sourceUrl
    return this
}

ARjs.Profile.prototype.sourceVideo = function (url) {
    this.sourceParameters.sourceType = 'video'
    this.sourceParameters.sourceUrl = url
    return this
}

ARjs.Profile.prototype.sourceImage = function (url) {
    this.sourceParameters.sourceType = 'image'
    this.sourceParameters.sourceUrl = url
    return this
}

//////////////////////////////////////////////////////////////////////////////
//		trackingBackend
//////////////////////////////////////////////////////////////////////////////
ARjs.Profile.prototype.trackingBackend = function (trackingBackend) {
    console.warn('stop profile.trackingBackend() obsolete function. use .trackingMethod instead')
    this.contextParameters.trackingBackend = trackingBackend
    return this
}

//////////////////////////////////////////////////////////////////////////////
//		trackingBackend
//////////////////////////////////////////////////////////////////////////////
ARjs.Profile.prototype.changeMatrixMode = function (changeMatrixMode) {
    this.defaultMarkerParameters.changeMatrixMode = changeMatrixMode
    return this
}

//////////////////////////////////////////////////////////////////////////////
//		trackingBackend
//////////////////////////////////////////////////////////////////////////////
ARjs.Profile.prototype.trackingMethod = function (trackingMethod) {
    var data = ARjs.Utils.parseTrackingMethod(trackingMethod)
    this.defaultMarkerParameters.markersAreaEnabled = data.markersAreaEnabled
    this.contextParameters.trackingBackend = data.trackingBackend
    return this
}

/**
 * check if the profile is valid. Throw an exception is not valid
 */
ARjs.Profile.prototype.checkIfValid = function () {
    if (this.contextParameters.trackingBackend === 'tango') {
        this.sourceImage(THREEx.ArToolkitContext.baseURL + '../data/images/img.jpg')
    }
    return this
}
var ARjs = ARjs || {}
var THREEx = THREEx || {}

ARjs.Source = THREEx.ArToolkitSource = function(parameters){
	var _this = this

	this.ready = false
        this.domElement = null

	// handle default parameters
	this.parameters = {
		// type of source - ['webcam', 'image', 'video']
		sourceType : 'webcam',
		// url of the source - valid if sourceType = image|video
		sourceUrl : null,

		// Device id of the camera to use (optional)
		deviceId : null,

		// resolution of at which we initialize in the source image
		sourceWidth: 640,
		sourceHeight: 480,
		// resolution displayed for the source
		displayWidth: 640,
		displayHeight: 480,
	}
	//////////////////////////////////////////////////////////////////////////////
	//		setParameters
	//////////////////////////////////////////////////////////////////////////////
	setParameters(parameters)
	function setParameters(parameters){
		if( parameters === undefined )	return
		for( var key in parameters ){
			var newValue = parameters[ key ]

			if( newValue === undefined ){
				console.warn( "THREEx.ArToolkitSource: '" + key + "' parameter is undefined." )
				continue
			}

			var currentValue = _this.parameters[ key ]

			if( currentValue === undefined ){
				console.warn( "THREEx.ArToolkitSource: '" + key + "' is not a property of this material." )
				continue
			}

			_this.parameters[ key ] = newValue
		}
	}
}

//////////////////////////////////////////////////////////////////////////////
//		Code Separator
//////////////////////////////////////////////////////////////////////////////
ARjs.Source.prototype.init = function(onReady, onError){
	var _this = this

        if( this.parameters.sourceType === 'image' ){
                var domElement = this._initSourceImage(onSourceReady, onError)
        }else if( this.parameters.sourceType === 'video' ){
                var domElement = this._initSourceVideo(onSourceReady, onError)
        }else if( this.parameters.sourceType === 'webcam' ){
                // var domElement = this._initSourceWebcamOld(onSourceReady)
                var domElement = this._initSourceWebcam(onSourceReady, onError)
        }else{
                console.assert(false)
        }

	// attach
        this.domElement = domElement
        this.domElement.style.position = 'absolute'
        this.domElement.style.top = '0px'
        this.domElement.style.left = '0px'
		this.domElement.style.zIndex = '-2'
		this.domElement.setAttribute('id', 'arjs-video');

	return this
        function onSourceReady(){
        document.body.appendChild(_this.domElement);
        window.dispatchEvent(new CustomEvent('arjs-video-loaded', {
            detail: {
                component: document.querySelector('#arjs-video'),
            },
        }));

		_this.ready = true

		onReady && onReady()
        }
}

////////////////////////////////////////////////////////////////////////////////
//          init image source
////////////////////////////////////////////////////////////////////////////////


ARjs.Source.prototype._initSourceImage = function(onReady) {
	// TODO make it static
        var domElement = document.createElement('img')
	domElement.src = this.parameters.sourceUrl

	domElement.width = this.parameters.sourceWidth
	domElement.height = this.parameters.sourceHeight
	domElement.style.width = this.parameters.displayWidth+'px'
	domElement.style.height = this.parameters.displayHeight+'px'

	// wait until the video stream is ready
	var interval = setInterval(function() {
		if (!domElement.naturalWidth)	return;
		onReady()
		clearInterval(interval)
	}, 1000/50);

	return domElement
}

////////////////////////////////////////////////////////////////////////////////
//          init video source
////////////////////////////////////////////////////////////////////////////////


ARjs.Source.prototype._initSourceVideo = function(onReady) {
	// TODO make it static
	var domElement = document.createElement('video');
	domElement.src = this.parameters.sourceUrl

	domElement.style.objectFit = 'initial'

	domElement.autoplay = true;
	domElement.webkitPlaysinline = true;
	domElement.controls = false;
	domElement.loop = true;
	domElement.muted = true

	// trick to trigger the video on android
	document.body.addEventListener('click', function onClick(){
		document.body.removeEventListener('click', onClick);
		domElement.play()
	})

	domElement.width = this.parameters.sourceWidth
	domElement.height = this.parameters.sourceHeight
	domElement.style.width = this.parameters.displayWidth+'px'
	domElement.style.height = this.parameters.displayHeight+'px'

	// wait until the video stream is ready
	var interval = setInterval(function() {
		if (!domElement.videoWidth)	return;
		onReady()
		clearInterval(interval)
	}, 1000/50);
	return domElement
}

////////////////////////////////////////////////////////////////////////////////
//          handle webcam source
////////////////////////////////////////////////////////////////////////////////

ARjs.Source.prototype._initSourceWebcam = function(onReady, onError) {
	var _this = this

	// init default value
	onError = onError || function(error){
		alert('Webcam Error\nName: '+error.name + '\nMessage: '+error.message)
		var event = new CustomEvent('camera-error', {error: error});
		window.dispatchEvent(event);
	}

	var domElement = document.createElement('video');
	domElement.setAttribute('autoplay', '');
	domElement.setAttribute('muted', '');
	domElement.setAttribute('playsinline', '');
	domElement.style.width = this.parameters.displayWidth+'px'
	domElement.style.height = this.parameters.displayHeight+'px'

	// check API is available
	if (navigator.mediaDevices === undefined
			|| navigator.mediaDevices.enumerateDevices === undefined
			|| navigator.mediaDevices.getUserMedia === undefined  ){
		if( navigator.mediaDevices === undefined )				var fctName = 'navigator.mediaDevices'
		else if( navigator.mediaDevices.enumerateDevices === undefined )	var fctName = 'navigator.mediaDevices.enumerateDevices'
		else if( navigator.mediaDevices.getUserMedia === undefined )		var fctName = 'navigator.mediaDevices.getUserMedia'
		else console.assert(false)
		onError({
			name: '',
			message: 'WebRTC issue-! '+fctName+' not present in your browser'
		})
		return null
	}

	// get available devices
	navigator.mediaDevices.enumerateDevices().then(function(devices) {
                var userMediaConstraints = {
			audio: false,
			video: {
				facingMode: 'environment',
				width: {
					ideal: _this.parameters.sourceWidth,
					// min: 1024,
					// max: 1920
				},
				height: {
					ideal: _this.parameters.sourceHeight,
					// min: 776,
					// max: 1080
				}
		  	}
		}

		if (null !== _this.parameters.deviceId) {
			userMediaConstraints.video.deviceId = {
				exact: _this.parameters.deviceId
			};
		}

		// get a device which satisfy the constraints
		navigator.mediaDevices.getUserMedia(userMediaConstraints).then(function success(stream) {
			// set the .src of the domElement
            domElement.srcObject = stream;

			var event = new CustomEvent('camera-init', {stream: stream});
			window.dispatchEvent(event);
			// to start the video, when it is possible to start it only on userevent. like in android
			document.body.addEventListener('click', function(){
				domElement.play();
			});
			// domElement.play();

// TODO listen to loadedmetadata instead
			// wait until the video stream is ready
			var interval = setInterval(function() {
				if (!domElement.videoWidth)	return;
				onReady()
				clearInterval(interval)
			}, 1000/50);
		}).catch(function(error) {
			onError({
				name: error.name,
				message: error.message
			});
		});
	}).catch(function(error) {
		onError({
			message: error.message
		});
	});

	return domElement
}

//////////////////////////////////////////////////////////////////////////////
//		Handle Mobile Torch
//////////////////////////////////////////////////////////////////////////////
ARjs.Source.prototype.hasMobileTorch = function(){
	var stream = arToolkitSource.domElement.srcObject
	if( stream instanceof MediaStream === false )	return false

	if( this._currentTorchStatus === undefined ){
		this._currentTorchStatus = false
	}

	var videoTrack = stream.getVideoTracks()[0];

	// if videoTrack.getCapabilities() doesnt exist, return false now
	if( videoTrack.getCapabilities === undefined )	return false

	var capabilities = videoTrack.getCapabilities()

	return capabilities.torch ? true : false
}

/**
 * toggle the flash/torch of the mobile fun if applicable.
 * Great post about it https://www.oberhofer.co/mediastreamtrack-and-its-capabilities/
 */
ARjs.Source.prototype.toggleMobileTorch = function(){
	// sanity check
	console.assert(this.hasMobileTorch() === true)

	var stream = arToolkitSource.domElement.srcObject
	if( stream instanceof MediaStream === false ){
		alert('enabling mobile torch is available only on webcam')
		return
	}

	if( this._currentTorchStatus === undefined ){
		this._currentTorchStatus = false
	}

	var videoTrack = stream.getVideoTracks()[0];
	var capabilities = videoTrack.getCapabilities()

	if( !capabilities.torch ){
		alert('no mobile torch is available on your camera')
		return
	}

	this._currentTorchStatus = this._currentTorchStatus === false ? true : false
	videoTrack.applyConstraints({
		advanced: [{
			torch: this._currentTorchStatus
		}]
	}).catch(function(error){
		console.log(error)
	});
}

ARjs.Source.prototype.domElementWidth = function(){
	return parseInt(this.domElement.style.width)
}
ARjs.Source.prototype.domElementHeight = function(){
	return parseInt(this.domElement.style.height)
}

////////////////////////////////////////////////////////////////////////////////
//          handle resize
////////////////////////////////////////////////////////////////////////////////

ARjs.Source.prototype.onResizeElement = function(){
	var _this = this
	var screenWidth = window.innerWidth
	var screenHeight = window.innerHeight

	// sanity check
	console.assert( arguments.length === 0 )

	// compute sourceWidth, sourceHeight
	if( this.domElement.nodeName === "IMG" ){
		var sourceWidth = this.domElement.naturalWidth
		var sourceHeight = this.domElement.naturalHeight
	}else if( this.domElement.nodeName === "VIDEO" ){
		var sourceWidth = this.domElement.videoWidth
		var sourceHeight = this.domElement.videoHeight
	}else{
		console.assert(false)
	}

	// compute sourceAspect
	var sourceAspect = sourceWidth / sourceHeight
	// compute screenAspect
	var screenAspect = screenWidth / screenHeight

	// if screenAspect < sourceAspect, then change the width, else change the height
	if( screenAspect < sourceAspect ){
		// compute newWidth and set .width/.marginLeft
		var newWidth = sourceAspect * screenHeight
		this.domElement.style.width = newWidth+'px'
		this.domElement.style.marginLeft = -(newWidth-screenWidth)/2+'px'

		// init style.height/.marginTop to normal value
		this.domElement.style.height = screenHeight+'px'
		this.domElement.style.marginTop = '0px'
	}else{
		// compute newHeight and set .height/.marginTop
		var newHeight = 1 / (sourceAspect / screenWidth)
		this.domElement.style.height = newHeight+'px'
		this.domElement.style.marginTop = -(newHeight-screenHeight)/2+'px'

		// init style.width/.marginLeft to normal value
		this.domElement.style.width = screenWidth+'px'
		this.domElement.style.marginLeft = '0px'
	}
}
/*
ARjs.Source.prototype.copyElementSizeTo = function(otherElement){
	otherElement.style.width = this.domElement.style.width
	otherElement.style.height = this.domElement.style.height
	otherElement.style.marginLeft = this.domElement.style.marginLeft
	otherElement.style.marginTop = this.domElement.style.marginTop
}
*/

ARjs.Source.prototype.copyElementSizeTo = function(otherElement){

	if (window.innerWidth > window.innerHeight)
	{
		//landscape
		otherElement.style.width = this.domElement.style.width
		otherElement.style.height = this.domElement.style.height
		otherElement.style.marginLeft = this.domElement.style.marginLeft
		otherElement.style.marginTop = this.domElement.style.marginTop
	}
	else {
		//portrait
		otherElement.style.height = this.domElement.style.height
		otherElement.style.width = (parseInt(otherElement.style.height) * 4/3)+"px";
		otherElement.style.marginLeft = ((window.innerWidth- parseInt(otherElement.style.width))/2)+"px";
		otherElement.style.marginTop = 0;
	}

}

//////////////////////////////////////////////////////////////////////////////
//		Code Separator
//////////////////////////////////////////////////////////////////////////////

ARjs.Source.prototype.copySizeTo = function(){
	console.warn('obsolete function arToolkitSource.copySizeTo. Use arToolkitSource.copyElementSizeTo' )
	this.copyElementSizeTo.apply(this, arguments)
}

//////////////////////////////////////////////////////////////////////////////
//		Code Separator
//////////////////////////////////////////////////////////////////////////////

ARjs.Source.prototype.onResize	= function(arToolkitContext, renderer, camera){
	if( arguments.length !== 3 ){
		console.warn('obsolete function arToolkitSource.onResize. Use arToolkitSource.onResizeElement' )
		return this.onResizeElement.apply(this, arguments)
	}

	var trackingBackend = arToolkitContext.parameters.trackingBackend


	// RESIZE DOMELEMENT
	if( trackingBackend === 'artoolkit' ){

		this.onResizeElement()

		var isAframe = renderer.domElement.dataset.aframeCanvas ? true : false
		if( isAframe === false ){
			this.copyElementSizeTo(renderer.domElement)
		}else{

		}

		if( arToolkitContext.arController !== null ){
			this.copyElementSizeTo(arToolkitContext.arController.canvas)
		}
	}else if( trackingBackend === 'aruco' ){
		this.onResizeElement()
		this.copyElementSizeTo(renderer.domElement)

		this.copyElementSizeTo(arToolkitContext.arucoContext.canvas)
	}else if( trackingBackend === 'tango' ){
		renderer.setSize( window.innerWidth, window.innerHeight )
	}else console.assert(false, 'unhandled trackingBackend '+trackingBackend)


	// UPDATE CAMERA
	if( trackingBackend === 'artoolkit' ){
		if( arToolkitContext.arController !== null ){
			camera.projectionMatrix.copy( arToolkitContext.getProjectionMatrix() );
		}
	}else if( trackingBackend === 'aruco' ){
		camera.aspect = renderer.domElement.width / renderer.domElement.height;
		camera.updateProjectionMatrix();
	}else if( trackingBackend === 'tango' ){
		var vrDisplay = arToolkitContext._tangoContext.vrDisplay
		// make camera fit vrDisplay
		if( vrDisplay && vrDisplay.displayName === "Tango VR Device" ) THREE.WebAR.resizeVRSeeThroughCamera(vrDisplay, camera)
	}else console.assert(false, 'unhandled trackingBackend '+trackingBackend)
}
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(factory);
  } else if (typeof exports === 'object') {
    module.exports = factory();
  } else {
    root = factory();
  }
}(this, function() {
    return { 
      WebAR: THREE.WebAR,
      THREEx: THREEx,
      ARjs: ARjs,
    };
}));