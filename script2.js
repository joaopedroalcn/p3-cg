window.addEventListener('load', init);

function init() {
    // Obter referência para o canvas
    const canvas = document.getElementById('canvas');

    // Inicializar o contexto WebGL
    const gl = canvas.getContext('webgl');

    // Verificar se o WebGL está disponível no navegador
    if (!gl) {
        alert('WebGL não está disponível no seu navegador.');
        return;
    }

    // Definir as cores de limpeza para o buffer de cor e o buffer de profundidade
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clearDepth(1.0);

    // Habilitar teste de profundidade
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    // Fragment shader
    const gouraudFragmentShaderSource = `
precision mediump float;

varying vec3 vNormal;
varying vec3 vDiffuse;
varying vec3 vSpecular;

void main() {
    vec3 ambient = vec3(0.2, 0.2, 0.2);
    
    vec3 diffuseColor = vDiffuse;
    vec3 specularColor = vSpecular;
    
    gl_FragColor = vec4(ambient + diffuseColor + specularColor, 1.0);
}
`;

    // Vertex shader
    const gouraudVertexShaderSource = `
attribute vec3 aPosition;
attribute vec3 aNormal;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
uniform mat3 uNormalMatrix;

uniform vec3 uLightPosition1;
uniform vec3 uLightPosition2;

varying vec3 vNormal;
varying vec3 vDiffuse;
varying vec3 vSpecular;

void main() {
    vec3 ambient = vec3(0.2, 0.2, 0.2);
    vec3 diffuse1 = vec3(0.4, 0.4, 0.4);
    vec3 diffuse2 = vec3(0.4, 0.4, 0.4);
    vec3 specular = vec3(1.0, 1.0, 1.0);
    
    vec3 lightDirection1 = normalize(uLightPosition1 - vec3(uModelViewMatrix * vec4(aPosition, 1.0)));
    vec3 lightDirection2 = normalize(uLightPosition2 - vec3(uModelViewMatrix * vec4(aPosition, 1.0)));
    vec3 normal = normalize(uNormalMatrix * aNormal);
    
    float diffuseFactor1 = max(dot(normal, lightDirection1), 0.0);
    float diffuseFactor2 = max(dot(normal, lightDirection2), 0.0);
    
    vec3 diffuseColor = diffuseFactor1 * diffuse1 + diffuseFactor2 * diffuse2;
    vec3 specularColor = specular * pow(max(dot(reflect(-lightDirection1, normal), normalize(-vec3(uModelViewMatrix * vec4(aPosition, 1.0)))), 0.0), 32.0);
    
    vNormal = normal;
    vDiffuse = diffuseColor;
    vSpecular = specularColor;
    
    gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aPosition, 1.0);
}
`;

    // Fragment shader
    const phongFragmentShaderSource = `
    precision mediump float;
    
    varying vec3 vPosition;
    varying vec3 vNormal;
    
    uniform vec3 uLightPosition1;
    uniform vec3 uLightPosition2;
    
    void main() {
        vec3 ambient = vec3(0.2, 0.2, 0.2);
        
        vec3 lightDirection1 = normalize(uLightPosition1 - vPosition);
        vec3 lightDirection2 = normalize(uLightPosition2 - vPosition);
        vec3 normal = normalize(vNormal);
        
        vec3 viewDirection = normalize(-vPosition);
        
        vec3 diffuseColor1 = vec3(0.4, 0.4, 0.4);
        vec3 diffuseColor2 = vec3(0.4, 0.4, 0.4);
        vec3 specularColor = vec3(1.0, 1.0, 1.0);
        
        float diffuseFactor1 = max(dot(normal, lightDirection1), 0.0);
        float diffuseFactor2 = max(dot(normal, lightDirection2), 0.0);
        
        vec3 diffuseColor = diffuseFactor1 * diffuseColor1 + diffuseFactor2 * diffuseColor2;
        vec3 reflectionDirection1 = reflect(-lightDirection1, normal);
        vec3 reflectionDirection2 = reflect(-lightDirection2, normal);
        
        float specularFactor1 = pow(max(dot(reflectionDirection1, viewDirection), 0.0), 32.0);
        float specularFactor2 = pow(max(dot(reflectionDirection2, viewDirection), 0.0), 32.0);
        
        vec3 specularColor1 = specularFactor1 * specularColor;
        vec3 specularColor2 = specularFactor2 * specularColor;
        
        gl_FragColor = vec4(ambient + diffuseColor + specularColor1 + specularColor2, 1.0);
    }
`;

    // Vertex shader
    const phongVertexShaderSource = `
    attribute vec3 aPosition;
    attribute vec3 aNormal;
    
    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;
    uniform mat3 uNormalMatrix;
    
    varying vec3 vPosition;
    varying vec3 vNormal;
    
    void main() {
        vPosition = vec3(uModelViewMatrix * vec4(aPosition, 1.0));
        vNormal = normalize(uNormalMatrix * aNormal);
        
        gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aPosition, 1.0);
    }
`;


    // Código para sombreamento de Gouraud
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, gouraudVertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, gouraudFragmentShaderSource);

    // Código para sombreamento de Phong
    // const vertexShader = createShader(gl, gl.VERTEX_SHADER, phongVertexShaderSource);
    // const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, phongFragmentShaderSource);


    // Criar o programa de shader
    const program = createProgram(gl, vertexShader, fragmentShader);

    // Obter as localizações dos atributos e uniformes
    const attributes = {
        aPosition: gl.getAttribLocation(program, 'aPosition'),
        aNormal: gl.getAttribLocation(program, 'aNormal')
    };

    const uniforms = {
        uModelViewMatrix: gl.getUniformLocation(program, 'uModelViewMatrix'),
        uProjectionMatrix: gl.getUniformLocation(program, 'uProjectionMatrix'),
        uNormalMatrix: gl.getUniformLocation(program, 'uNormalMatrix'),
        uLightPosition1: gl.getUniformLocation(program, 'uLightPosition1'),
        uLightPosition2: gl.getUniformLocation(program, 'uLightPosition2')
    };

    // Criar os dados do objeto (cubo)
    const positions = [
        // Frente
        -1.0, -1.0, 1.0,
        1.0, -1.0, 1.0,
        1.0, 1.0, 1.0,
        -1.0, 1.0, 1.0,
        // Trás
        -1.0, -1.0, -1.0,
        1.0, -1.0, -1.0,
        1.0, 1.0, -1.0,
        -1.0, 1.0, -1.0,
        // Topo
        -1.0, 1.0, -1.0,
        1.0, 1.0, -1.0,
        1.0, 1.0, 1.0,
        -1.0, 1.0, 1.0,
        // Base
        -1.0, -1.0, -1.0,
        1.0, -1.0, -1.0,
        1.0, -1.0, 1.0,
        -1.0, -1.0, 1.0,
        // Direita
        1.0, -1.0, -1.0,
        1.0, 1.0, -1.0,
        1.0, 1.0, 1.0,
        1.0, -1.0, 1.0,
        // Esquerda
        -1.0, -1.0, -1.0,
        -1.0, 1.0, -1.0,
        -1.0, 1.0, 1.0,
        -1.0, -1.0, 1.0
    ];

    const normals = [
        // Frente
        0.0, 0.0, 1.0,
        0.0, 0.0, 1.0,
        0.0, 0.0, 1.0,
        0.0, 0.0, 1.0,
        // Trás
        0.0, 0.0, -1.0,
        0.0, 0.0, -1.0,
        0.0, 0.0, -1.0,
        0.0, 0.0, -1.0,
        // Topo
        0.0, 1.0, 0.0,
        0.0, 1.0, 0.0,
        0.0, 1.0, 0.0,
        0.0, 1.0, 0.0,
        // Base
        0.0, -1.0, 0.0,
        0.0, -1.0, 0.0,
        0.0, -1.0, 0.0,
        0.0, -1.0, 0.0,
        // Direita
        1.0, 0.0, 0.0,
        1.0, 0.0, 0.0,
        1.0, 0.0, 0.0,
        1.0, 0.0, 0.0,
        // Esquerda
        -1.0, 0.0, 0.0,
        -1.0, 0.0, 0.0,
        -1.0, 0.0, 0.0,
        -1.0, 0.0, 0.0
    ];

    const indices = [
        0, 1, 2, 0, 2, 3,   // Frente
        4, 5, 6, 4, 6, 7,   // Trás
        8, 9, 10, 8, 10, 11,   // Topo
        12, 13, 14, 12, 14, 15,   // Base
        16, 17, 18, 16, 18, 19,   // Direita
        20, 21, 22, 20, 22, 23    // Esquerda
    ];

    // Criar os buffers
    const positionBuffer = createBuffer(gl, positions);
    const normalBuffer = createBuffer(gl, normals);
    const indexBuffer = createIndexBuffer(gl, indices);

    // Definir as posições das luzes pontuais
    const lightPosition1 = [2.0, 2.0, 2.0];
    const lightPosition2 = [-2.0, -2.0, -2.0];

    // Atualizar os parâmetros de visualização quando os controles são alterados
    const nearSlider = document.getElementById('near');
    const farSlider = document.getElementById('far');
    const cameraZSlider = document.getElementById('cameraZ');
    const fovySlider = document.getElementById('fovy');

    nearSlider.addEventListener('input', updateProjectionMatrix);
    farSlider.addEventListener('input', updateProjectionMatrix);
    cameraZSlider.addEventListener('input', updateModelViewMatrix);
    fovySlider.addEventListener('input', updateProjectionMatrix);

    // Definir as matrizes de projeção e de visualização
    let projectionMatrix = mat4.create();
    let modelViewMatrix = mat4.create();

    function updateProjectionMatrix() {
        const near = parseFloat(nearSlider.value);
        const far = parseFloat(farSlider.value);
        const fovy = parseFloat(fovySlider.value);
        const aspect = canvas.clientWidth / canvas.clientHeight;

        mat4.perspective(projectionMatrix, degToRad(fovy), aspect, near, far);

        // Renderizar a cena novamente
        renderScene();
    }

    function updateModelViewMatrix() {
        const cameraZ = parseFloat(cameraZSlider.value);

        mat4.identity(modelViewMatrix);
        mat4.translate(modelViewMatrix, modelViewMatrix, [0.0, 0.0, -cameraZ]);

        // Renderizar a cena novamente
        renderScene();
    }

    function renderScene() {
        // Limpar o canvas
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // Usar o programa de shader
        gl.useProgram(program);

        // Passar os atributos para o shader
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.vertexAttribPointer(attributes.aPosition, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(attributes.aPosition);

        gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
        gl.vertexAttribPointer(attributes.aNormal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(attributes.aNormal);

        // Passar os uniformes para o shader
        gl.uniformMatrix4fv(uniforms.uModelViewMatrix, false, modelViewMatrix);
        gl.uniformMatrix4fv(uniforms.uProjectionMatrix, false, projectionMatrix);

        const normalMatrix = mat3.create();
        mat3.normalFromMat4(normalMatrix, modelViewMatrix);
        gl.uniformMatrix3fv(uniforms.uNormalMatrix, false, normalMatrix);

        gl.uniform3fv(uniforms.uLightPosition1, lightPosition1);
        gl.uniform3fv(uniforms.uLightPosition2, lightPosition2);

        // Renderizar o objeto
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
    }

    updateProjectionMatrix();
    updateModelViewMatrix();
}

function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Erro ao compilar shader:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }

    return shader;
}

function createProgram(gl, vertexShader, fragmentShader) {
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Erro ao criar programa de shader:', gl.getProgramInfoLog(program));
        gl.deleteProgram(program);
        return null;
    }

    return program;
}

function createBuffer(gl, data) {
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
    return buffer;
}

function createIndexBuffer(gl, data) {
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(data), gl.STATIC_DRAW);
    return buffer;
}

function degToRad(degrees) {
    return degrees * Math.PI / 180;
}
