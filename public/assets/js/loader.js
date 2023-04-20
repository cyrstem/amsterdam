class Config {
    static BREAKPOINT = 1000;
    static DEBUG = location.search === '?debug';

    static CDN = '';

    static ASSETS = [
        'assets/images/alienkitty.svg',
        'assets/images/alienkitty_eyelid.svg'
    ];

    static GUI = /[?&]ui/.test(location.search);
    static ORBIT = /[?&]orbit/.test(location.search);
}

class Device {
    static agent = navigator.userAgent.toLowerCase();

    static mobile = !!navigator.maxTouchPoints;

    static tablet = this.mobile && Math.max(screen.width, screen.height) > 1000;

    static phone = this.mobile && !this.tablet;

    static webgl = (() => {
        if (typeof window === 'undefined') {
            return;
        }

        const contextOptions = {
            failIfMajorPerformanceCaveat: true
        };

        let canvas = document.createElement('canvas');
        let gl = canvas.getContext('webgl2', contextOptions);

        const result = !!gl;

        gl = null;
        canvas = null;

        return result;
    })();
}

class Events {
    static STATE_CHANGE = 'state_change';
    static VIEW_CHANGE = 'view_change';
    static KEY_DOWN = 'key_down';
    static KEY_UP = 'key_up';
    static KEY_PRESS = 'key_press';
    static RESIZE = 'resize';
    static VISIBILITY = 'visibility';
    static PROGRESS = 'progress';
    static COMPLETE = 'complete';
    static UPDATE = 'update';
    static HOVER = 'hover';
    static CLICK = 'click';

    static COLOR_PICKER = 'color_picker';
    static INVERT = 'invert';
}

const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;

function clamp( value, min, max ) {

	return Math.max( min, Math.min( max, value ) );

}

// compute euclidean modulo of m % n
// https://en.wikipedia.org/wiki/Modulo_operation
function euclideanModulo( n, m ) {

	return ( ( n % m ) + m ) % m;

}

// https://en.wikipedia.org/wiki/Linear_interpolation
function lerp( x, y, t ) {

	return ( 1 - t ) * x + t * y;

}

// Random integer from <low, high> interval
function randInt( low, high ) {

	return low + Math.floor( Math.random() * ( high - low + 1 ) );

}

function degToRad( degrees ) {

	return degrees * DEG2RAD;

}

function radToDeg( radians ) {

	return radians * RAD2DEG;

}

function isPowerOfTwo( value ) {

	return ( value & ( value - 1 ) ) === 0 && value !== 0;

}

function floorPowerOfTwo( value ) {

	return Math.pow( 2, Math.floor( Math.log( value ) / Math.LN2 ) );

}

/**
 * @author pschroen / https://ufo.ai/
 */

function shuffle(array) {
    return array.sort(() => Math.random() - 0.5);
}

function guid() {
    return (Date.now() + randInt(0, 99999)).toString();
}

function brightness(color) {
    return color.r * 0.3 + color.g * 0.59 + color.b * 0.11;
}

function absolute(path) {
    if (path.includes('//')) {
        return path;
    }

    const port = Number(location.port) > 1000 ? `:${location.port}` : '';
    const pathname = path.startsWith('/') ? path : `${location.pathname.replace(/\/[^/]*$/, '/')}${path}`;

    return `${location.protocol}//${location.hostname}${port}${pathname}`;
}

function getKeyByValue(object, value) {
    return Object.keys(object).find(key => object[key] === value);
}

function getConstructor(object) {
    const isInstance = typeof object !== 'function';
    const code = isInstance ? object.constructor.toString() : object.toString();
    const name = code.match(/(?:class|function)\s([^\s{(]+)/)[1];

    return { name, code, isInstance };
}

/**
 * @author pschroen / https://ufo.ai/
 */

class Assets {
    static path = '';
    static crossOrigin;
    static options;
    static cache = false;
    static files = {};

    static add(key, file) {
        if (!this.cache) {
            return;
        }

        this.files[key] = file;
    }

    static get(key) {
        if (!this.cache) {
            return;
        }

        return this.files[key];
    }

    static remove(key) {
        delete this.files[key];
    }

    static clear() {
        this.files = {};
    }

    static filter(callback) {
        const files = Object.keys(this.files).filter(callback).reduce((object, key) => {
            object[key] = this.files[key];

            return object;
        }, {});

        return files;
    }

    static getPath(path) {
        return this.path + path;
    }

    static loadImage(path, callback) {
        const image = new Image();

        image.crossOrigin = this.crossOrigin;
        image.src = this.getPath(path);

        const promise = new Promise((resolve, reject) => {
            image.onload = () => {
                resolve(image);

                image.onload = null;
            };

            image.onerror = event => {
                reject(event);

                image.onerror = null;
            };
        });

        if (callback) {
            promise.then(callback);
        }

        return promise;
    }

    static loadData(path, callback) {
        const promise = fetch(`${this.getPath(path)}?${guid()}`, this.options).then(response => {
            return response.json();
        });

        if (callback) {
            promise.then(callback);
        }

        return promise;
    }
}

/**
 * @author pschroen / https://ufo.ai/
 */

class EventEmitter {
    constructor() {
        this.callbacks = {};
    }

    on(type, callback) {
        if (!this.callbacks[type]) {
            this.callbacks[type] = [];
        }

        this.callbacks[type].push(callback);
    }

    off(type, callback) {
        if (!this.callbacks[type]) {
            return;
        }

        if (callback) {
            const index = this.callbacks[type].indexOf(callback);

            if (~index) {
                this.callbacks[type].splice(index, 1);
            }
        } else {
            delete this.callbacks[type];
        }
    }

    emit(type, event = {}) {
        if (!this.callbacks[type]) {
            return;
        }

        const stack = this.callbacks[type].slice();

        for (let i = 0, l = stack.length; i < l; i++) {
            stack[i].call(this, event);
        }
    }

    destroy() {
        for (const prop in this) {
            this[prop] = null;
        }

        return null;
    }
}

/**
 * @author pschroen / https://ufo.ai/
 */

class Loader {
    constructor(assets = [], callback) {
        this.assets = assets;
        this.callback = callback;
        this.events = new EventEmitter();
        this.total = 0;
        this.loaded = 0;
        this.progress = 0;
        this.promise = new Promise(resolve => this.resolve = resolve);

        assets.forEach(path => this.load(path));
    }

    load(/* path, callback */) {}

    loadAsync(path) {
        return new Promise(resolve => this.load(path, resolve));
    }

    increment() {
        this.progress = ++this.loaded / this.total;

        this.events.emit(Events.PROGRESS, { progress: this.progress });

        if (this.loaded === this.total) {
            this.complete();
        }
    }

    complete() {
        this.resolve();

        this.events.emit(Events.COMPLETE);

        if (this.callback) {
            this.callback();
        }
    }

    add(num = 1) {
        this.total += num;
    }

    trigger(num = 1) {
        for (let i = 0; i < num; i++) {
            this.increment();
        }
    }

    ready() {
        return this.total ? this.promise : Promise.resolve();
    }

    destroy() {
        this.events.destroy();

        for (const prop in this) {
            this[prop] = null;
        }

        return null;
    }
}

/**
 * @author pschroen / https://ufo.ai/
 */

class MultiLoader extends Loader {
    constructor() {
        super();

        this.loaders = [];
        this.weights = [];
    }

    load(loader, weight = 1) {
        loader.events.on(Events.PROGRESS, this.onProgress);
        loader.events.on(Events.COMPLETE, this.onComplete);

        this.loaders.push(loader);
        this.weights.push(weight);

        this.total += weight;
    }

    /**
     * Event handlers
     */

    onProgress = () => {
        let loaded = this.loaded;

        for (let i = 0, l = this.loaders.length; i < l; i++) {
            loaded += this.weights[i] * this.loaders[i].progress;
        }

        const progress = loaded / this.total;

        if (progress < 1) {
            this.events.emit(Events.PROGRESS, { progress });
        }
    };

    onComplete = () => {
        this.increment();
    };

    /**
     * Public methods
     */

    destroy = () => {
        for (let i = this.loaders.length - 1; i >= 0; i--) {
            if (this.loaders[i] && this.loaders[i].destroy) {
                this.loaders[i].destroy();
            }
        }

        return super.destroy();
    };
}

/**
 * @author pschroen / https://ufo.ai/
 */

class FontLoader extends Loader {
    constructor() {
        super();

        this.load();
    }

    load() {
        document.fonts.ready.then(() => {
            this.increment();
        }).catch(() => {
            this.increment();
        });

        this.total++;
    }
}

/**
 * @author pschroen / https://ufo.ai/
 */

class AssetLoader extends Loader {
    load(path, callback) {
        const cached = Assets.get(path);

        let promise;

        if (cached) {
            promise = Promise.resolve(cached);
        } else if (/\.(jpe?g|png|gif|svg)/.test(path)) {
            promise = Assets.loadImage(path);
        } else if (/\.json/.test(path)) {
            promise = Assets.loadData(path);
        } else {
            promise = fetch(Assets.getPath(path), Assets.options).then(response => {
                if (/\.(mp3|m4a|ogg|wav|aiff?)/.test(path)) {
                    return response.arrayBuffer();
                } else {
                    return response.text();
                }
            });
        }

        promise.then(data => {
            Assets.add(path, data);

            this.increment();

            if (callback) {
                callback(data);
            }
        }).catch(event => {
            this.increment();

            if (callback) {
                callback(event);
            }
        });

        this.total++;
    }
}

/**
 * @author pschroen / https://ufo.ai/
 *
 * Based on https://github.com/gre/bezier-easing
 */

// These values are established by empiricism with tests (tradeoff: performance VS precision)
const NEWTON_ITERATIONS = 4;
const NEWTON_MIN_SLOPE = 0.001;
const SUBDIVISION_PRECISION = 0.0000001;
const SUBDIVISION_MAX_ITERATIONS = 10;

const kSplineTableSize = 11;
const kSampleStepSize = 1 / (kSplineTableSize - 1);

const float32ArraySupported = typeof Float32Array === 'function';

function A(aA1, aA2) {
    return 1 - 3 * aA2 + 3 * aA1;
}

function B(aA1, aA2) {
    return 3 * aA2 - 6 * aA1;
}

function C(aA1) {
    return 3 * aA1;
}

// Returns x(t) given t, x1, and x2, or y(t) given t, y1, and y2
function calcBezier(aT, aA1, aA2) {
    return ((A(aA1, aA2) * aT + B(aA1, aA2)) * aT + C(aA1)) * aT;
}

// Returns dx/dt given t, x1, and x2, or dy/dt given t, y1, and y2
function getSlope(aT, aA1, aA2) {
    return 3 * A(aA1, aA2) * aT * aT + 2 * B(aA1, aA2) * aT + C(aA1);
}

function binarySubdivide(aX, aA, aB, mX1, mX2) {
    let currentX;
    let currentT;
    let i = 0;

    do {
        currentT = aA + (aB - aA) / 2;
        currentX = calcBezier(currentT, mX1, mX2) - aX;

        if (currentX > 0) {
            aB = currentT;
        } else {
            aA = currentT;
        }
    } while (Math.abs(currentX) > SUBDIVISION_PRECISION && ++i < SUBDIVISION_MAX_ITERATIONS);

    return currentT;
}

function newtonRaphsonIterate(aX, aGuessT, mX1, mX2) {
    for (let i = 0; i < NEWTON_ITERATIONS; i++) {
        const currentSlope = getSlope(aGuessT, mX1, mX2);

        if (currentSlope === 0) {
            return aGuessT;
        }

        const currentX = calcBezier(aGuessT, mX1, mX2) - aX;
        aGuessT -= currentX / currentSlope;
    }

    return aGuessT;
}

function LinearEasing(x) {
    return x;
}

function bezier(mX1, mY1, mX2, mY2) {
    if (!(0 <= mX1 && mX1 <= 1 && 0 <= mX2 && mX2 <= 1)) {
        throw new Error('Bezier x values must be in [0, 1] range');
    }

    if (mX1 === mY1 && mX2 === mY2) {
        return LinearEasing;
    }

    // Precompute samples table
    const sampleValues = float32ArraySupported ? new Float32Array(kSplineTableSize) : new Array(kSplineTableSize);
    for (let i = 0; i < kSplineTableSize; i++) {
        sampleValues[i] = calcBezier(i * kSampleStepSize, mX1, mX2);
    }

    function getTForX(aX) {
        let intervalStart = 0;
        let currentSample = 1;
        const lastSample = kSplineTableSize - 1;

        for (; currentSample !== lastSample && sampleValues[currentSample] <= aX; currentSample++) {
            intervalStart += kSampleStepSize;
        }
        currentSample--;

        // Interpolate to provide an initial guess for t
        const dist = (aX - sampleValues[currentSample]) / (sampleValues[currentSample + 1] - sampleValues[currentSample]);
        const guessForT = intervalStart + dist * kSampleStepSize;

        const initialSlope = getSlope(guessForT, mX1, mX2);
        if (initialSlope >= NEWTON_MIN_SLOPE) {
            return newtonRaphsonIterate(aX, guessForT, mX1, mX2);
        } else if (initialSlope === 0) {
            return guessForT;
        } else {
            return binarySubdivide(aX, intervalStart, intervalStart + kSampleStepSize, mX1, mX2);
        }
    }

    return function BezierEasing(x) {
        // Because JavaScript numbers are imprecise, we should guarantee the extremes are right
        if (x === 0 || x === 1) {
            return x;
        }

        return calcBezier(getTForX(x), mY1, mY2);
    };
}

/**
 * @author pschroen / https://ufo.ai/
 *
 * Based on https://github.com/danro/easing-js
 * Based on https://github.com/CreateJS/TweenJS
 * Based on https://github.com/tweenjs/tween.js
 * Based on https://easings.net/
 */

class Easing {
    static linear(t) {
        return t;
    }

    static easeInQuad(t) {
        return t * t;
    }

    static easeOutQuad(t) {
        return t * (2 - t);
    }

    static easeInOutQuad(t) {
        if ((t *= 2) < 1) {
            return 0.5 * t * t;
        }

        return -0.5 * (--t * (t - 2) - 1);
    }

    static easeInCubic(t) {
        return t * t * t;
    }

    static easeOutCubic(t) {
        return --t * t * t + 1;
    }

    static easeInOutCubic(t) {
        if ((t *= 2) < 1) {
            return 0.5 * t * t * t;
        }

        return 0.5 * ((t -= 2) * t * t + 2);
    }

    static easeInQuart(t) {
        return t * t * t * t;
    }

    static easeOutQuart(t) {
        return 1 - --t * t * t * t;
    }

    static easeInOutQuart(t) {
        if ((t *= 2) < 1) {
            return 0.5 * t * t * t * t;
        }

        return -0.5 * ((t -= 2) * t * t * t - 2);
    }

    static easeInQuint(t) {
        return t * t * t * t * t;
    }

    static easeOutQuint(t) {
        return --t * t * t * t * t + 1;
    }

    static easeInOutQuint(t) {
        if ((t *= 2) < 1) {
            return 0.5 * t * t * t * t * t;
        }

        return 0.5 * ((t -= 2) * t * t * t * t + 2);
    }

    static easeInSine(t) {
        return 1 - Math.sin(((1 - t) * Math.PI) / 2);
    }

    static easeOutSine(t) {
        return Math.sin((t * Math.PI) / 2);
    }

    static easeInOutSine(t) {
        return 0.5 * (1 - Math.sin(Math.PI * (0.5 - t)));
    }

    static easeInExpo(t) {
        return t === 0 ? 0 : Math.pow(1024, t - 1);
    }

    static easeOutExpo(t) {
        return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
    }

    static easeInOutExpo(t) {
        if (t === 0 || t === 1) {
            return t;
        }

        if ((t *= 2) < 1) {
            return 0.5 * Math.pow(1024, t - 1);
        }

        return 0.5 * (-Math.pow(2, -10 * (t - 1)) + 2);
    }

    static easeInCirc(t) {
        return 1 - Math.sqrt(1 - t * t);
    }

    static easeOutCirc(t) {
        return Math.sqrt(1 - --t * t);
    }

    static easeInOutCirc(t) {
        if ((t *= 2) < 1) {
            return -0.5 * (Math.sqrt(1 - t * t) - 1);
        }

        return 0.5 * (Math.sqrt(1 - (t -= 2) * t) + 1);
    }

    static easeInBack(t) {
        const s = 1.70158;

        return t === 1 ? 1 : t * t * ((s + 1) * t - s);
    }

    static easeOutBack(t) {
        const s = 1.70158;

        return t === 0 ? 0 : --t * t * ((s + 1) * t + s) + 1;
    }

    static easeInOutBack(t) {
        const s = 1.70158 * 1.525;

        if ((t *= 2) < 1) {
            return 0.5 * (t * t * ((s + 1) * t - s));
        }

        return 0.5 * ((t -= 2) * t * ((s + 1) * t + s) + 2);
    }

    static easeInElastic(t, amplitude = 1, period = 0.3) {
        if (t === 0 || t === 1) {
            return t;
        }

        const pi2 = Math.PI * 2;
        const s = period / pi2 * Math.asin(1 / amplitude);

        return -(amplitude * Math.pow(2, 10 * --t) * Math.sin((t - s) * pi2 / period));
    }

    static easeOutElastic(t, amplitude = 1, period = 0.3) {
        if (t === 0 || t === 1) {
            return t;
        }

        const pi2 = Math.PI * 2;
        const s = period / pi2 * Math.asin(1 / amplitude);

        return amplitude * Math.pow(2, -10 * t) * Math.sin((t - s) * pi2 / period) + 1;
    }

    static easeInOutElastic(t, amplitude = 1, period = 0.3 * 1.5) {
        if (t === 0 || t === 1) {
            return t;
        }

        const pi2 = Math.PI * 2;
        const s = period / pi2 * Math.asin(1 / amplitude);

        if ((t *= 2) < 1) {
            return -0.5 * (amplitude * Math.pow(2, 10 * --t) * Math.sin((t - s) * pi2 / period));
        }

        return amplitude * Math.pow(2, -10 * --t) * Math.sin((t - s) * pi2 / period) * 0.5 + 1;
    }

    static easeInBounce(t) {
        return 1 - this.easeOutBounce(1 - t);
    }

    static easeOutBounce(t) {
        const n1 = 7.5625;
        const d1 = 2.75;

        if (t < 1 / d1) {
            return n1 * t * t;
        } else if (t < 2 / d1) {
            return n1 * (t -= 1.5 / d1) * t + 0.75;
        } else if (t < 2.5 / d1) {
            return n1 * (t -= 2.25 / d1) * t + 0.9375;
        } else {
            return n1 * (t -= 2.625 / d1) * t + 0.984375;
        }
    }

    static easeInOutBounce(t) {
        if (t < 0.5) {
            return this.easeInBounce(t * 2) * 0.5;
        }

        return this.easeOutBounce(t * 2 - 1) * 0.5 + 0.5;
    }

    static addBezier(name, mX1, mY1, mX2, mY2) {
        this[name] = bezier(mX1, mY1, mX2, mY2);
    }
}

/**
 * @author pschroen / https://ufo.ai/
 */

var RequestFrame;
var CancelFrame;

if (typeof window !== 'undefined') {
    RequestFrame = window.requestAnimationFrame;
    CancelFrame = window.cancelAnimationFrame;
} else {
    const startTime = performance.now();
    const timestep = 1000 / 60;

    RequestFrame = callback => {
        return setTimeout(() => {
            callback(performance.now() - startTime);
        }, timestep);
    };

    CancelFrame = clearTimeout;
}

class Ticker {
    constructor() {
        this.callbacks = [];
        this.last = performance.now();
        this.time = 0;
        this.delta = 0;
        this.frame = 0;
        this.isAnimating = false;
    }

    onTick = time => {
        if (this.isAnimating) {
            this.requestId = RequestFrame(this.onTick);
        }

        this.delta = Math.min(150, time - this.last);
        this.last = time;
        this.time = time * 0.001;
        this.frame++;

        for (let i = this.callbacks.length - 1; i >= 0; i--) {
            const callback = this.callbacks[i];

            if (!callback) {
                continue;
            }

            if (callback.fps) {
                const delta = time - callback.last;

                if (delta < 1000 / callback.fps) {
                    continue;
                }

                callback.last = time;
                callback.frame++;

                callback(this.time, delta, callback.frame);

                continue;
            }

            callback(this.time, this.delta, this.frame);
        }
    };

    add(callback, fps) {
        if (fps) {
            callback.fps = fps;
            callback.last = performance.now();
            callback.frame = 0;
        }

        this.callbacks.unshift(callback);
    }

    remove(callback) {
        const index = this.callbacks.indexOf(callback);

        if (~index) {
            this.callbacks.splice(index, 1);
        }
    }

    start() {
        if (this.isAnimating) {
            return;
        }

        this.isAnimating = true;

        this.requestId = RequestFrame(this.onTick);
    }

    stop() {
        if (!this.isAnimating) {
            return;
        }

        this.isAnimating = false;

        CancelFrame(this.requestId);
    }

    setRequestFrame(request) {
        RequestFrame = request;
    }

    setCancelFrame(cancel) {
        CancelFrame = cancel;
    }
}

const ticker = new Ticker();

/**
 * @author pschroen / https://ufo.ai/
 */

const Tweens = [];

class Tween {
    constructor(object, props, duration, ease, delay = 0, complete, update) {
        if (typeof delay !== 'number') {
            update = complete;
            complete = delay;
            delay = 0;
        }

        this.object = object;
        this.duration = duration;
        this.elapsed = 0;
        this.ease = typeof ease === 'function' ? ease : Easing[ease] || Easing['easeOutCubic'];
        this.delay = delay;
        this.complete = complete;
        this.update = update;
        this.isAnimating = false;

        this.from = {};
        this.to = Object.assign({}, props);

        this.spring = this.to.spring;
        this.damping = this.to.damping;

        delete this.to.spring;
        delete this.to.damping;

        for (const prop in this.to) {
            if (typeof this.to[prop] === 'number' && typeof object[prop] === 'number') {
                this.from[prop] = object[prop];
            }
        }

        this.start();
    }

    onUpdate = (time, delta) => {
        this.elapsed += delta;

        const progress = Math.max(0, Math.min(1, (this.elapsed - this.delay) / this.duration));
        const alpha = this.ease(progress, this.spring, this.damping);

        for (const prop in this.from) {
            this.object[prop] = this.from[prop] + (this.to[prop] - this.from[prop]) * alpha;
        }

        if (this.update) {
            this.update();
        }

        if (progress === 1) {
            clearTween(this);

            if (this.complete) {
                this.complete();
            }
        }
    };

    start() {
        if (this.isAnimating) {
            return;
        }

        this.isAnimating = true;

        ticker.add(this.onUpdate);
    }

    stop() {
        if (!this.isAnimating) {
            return;
        }

        this.isAnimating = false;

        ticker.remove(this.onUpdate);
    }
}

/**
 * Defers a function by the specified duration.
 *
 * @export
 * @param {number} duration Time to wait in milliseconds.
 * @param {function} complete Callback function.
 * @returns {Tween}
 * @example
 * delayedCall(500, animateIn);
 * @example
 * delayedCall(500, () => animateIn(delay));
 * @example
 * timeout = delayedCall(500, () => animateIn(delay));
 */
function delayedCall(duration, complete) {
    const tween = new Tween(complete, null, duration, 'linear', 0, complete);

    Tweens.push(tween);

    return tween;
}

/**
 * Tween that animates to the specified destination properties.
 *
 * See the Easing Functions Cheat Sheet for examples by name.
 * https://easings.net/
 *
 * @export
 * @param {object} object Target object.
 * @param {object} props Tween properties.
 * @param {number} duration Time in milliseconds.
 * @param {string|function} ease Ease string or function.
 * @param {number} [delay=0] Time to wait in milliseconds.
 * @param {function} [complete] Callback function when the animation has completed.
 * @param {function} [update] Callback function every time the animation updates.
 * @returns {Promise}
 * @example
 * tween(data, { value: 0.3 }, 1000, 'linear');
 */
function tween(object, props, duration, ease, delay = 0, complete, update) {
    if (typeof delay !== 'number') {
        update = complete;
        complete = delay;
        delay = 0;
    }

    const promise = new Promise(resolve => {
        const tween = new Tween(object, props, duration, ease, delay, resolve, update);

        Tweens.push(tween);
    });

    if (complete) {
        promise.then(complete);
    }

    return promise;
}

/**
 * Immediately clears all delayedCalls and tweens of the specified object.
 *
 * @export
 * @param {object} object Target object.
 * @returns {void}
 * @example
 * delayedCall(500, animateIn);
 * clearTween(animateIn);
 * @example
 * clearTween(timeout);
 * timeout = delayedCall(500, () => animateIn());
 * @example
 * tween(data, { value: 0.3 }, 1000, 'linear');
 * clearTween(data);
 */
function clearTween(object) {
    if (object instanceof Tween) {
        object.stop();

        const index = Tweens.indexOf(object);

        if (~index) {
            Tweens.splice(index, 1);
        }
    } else {
        for (let i = Tweens.length - 1; i >= 0; i--) {
            if (Tweens[i].object === object) {
                clearTween(Tweens[i]);
            }
        }
    }
}

/**
 * @author pschroen / https://ufo.ai/
 */

// https://developer.mozilla.org/en-US/docs/Web/CSS/transform
// https://developer.mozilla.org/en-US/docs/Web/CSS/filter
const Transforms = ['x', 'y', 'z', 'skewX', 'skewY', 'rotation', 'rotationX', 'rotationY', 'rotationZ', 'scale', 'scaleX', 'scaleY', 'scaleZ'];
const Filters = ['blur', 'brightness', 'contrast', 'grayscale', 'hue', 'invert', 'saturate', 'sepia'];
const Numeric = ['opacity', 'zIndex', 'fontWeight', 'strokeWidth', 'strokeDashoffset', 'stopOpacity'];
const Lacuna1 = ['opacity', 'brightness', 'contrast', 'saturate', 'scale', 'stopOpacity'];

class Interface {
    constructor(name, type = 'div', qualifiedName) {
        this.events = new EventEmitter();
        this.children = [];
        this.timeouts = [];
        this.style = {};
        this.isTransform = false;
        this.isFilter = false;

        if (typeof name === 'object' && name !== null) {
            this.element = name;
        } else if (type !== null) {
            this.name = name;
            this.type = type;

            if (type === 'svg') {
                this.element = document.createElementNS('http://www.w3.org/2000/svg', qualifiedName || 'svg');
            } else {
                this.element = document.createElement(type);
            }

            if (typeof name === 'string') {
                if (name.startsWith('.')) {
                    this.element.className = name.slice(1);
                } else {
                    this.element.id = name;
                }
            }
        }
    }

    add(child) {
        if (!this.children) {
            return;
        }

        this.children.push(child);

        child.parent = this;

        if (child.element) {
            this.element.appendChild(child.element);
        } else if (child.nodeName) {
            this.element.appendChild(child);
        }

        return child;
    }

    remove(child) {
        if (!this.children) {
            return;
        }

        if (child.element) {
            child.element.parentNode.removeChild(child.element);
        } else if (child.nodeName) {
            child.parentNode.removeChild(child);
        }

        const index = this.children.indexOf(child);

        if (~index) {
            this.children.splice(index, 1);
        }
    }

    clone() {
        if (!this.element) {
            return;
        }

        return new Interface(this.element.cloneNode(true));
    }

    empty() {
        if (!this.element) {
            return;
        }

        for (let i = this.children.length - 1; i >= 0; i--) {
            if (this.children[i] && this.children[i].destroy) {
                this.children[i].destroy();
            }
        }

        this.children.length = 0;

        this.element.innerHTML = '';

        return this;
    }

    attr(props) {
        if (!this.element) {
            return;
        }

        for (const key in props) {
            this.element.setAttribute(key, props[key]);
        }

        return this;
    }

    css(props) {
        if (!this.element) {
            return;
        }

        const style = this.style;

        for (const key in props) {
            if (~Transforms.indexOf(key)) {
                style[key] = props[key];
                this.isTransform = true;
                continue;
            }

            if (~Filters.indexOf(key)) {
                style[key] = props[key];
                this.isFilter = true;
                continue;
            }

            let val;

            if (~Numeric.indexOf(key)) {
                val = props[key];
                style[key] = val;
            } else {
                val = typeof props[key] !== 'string' ? props[key] + 'px' : props[key];
            }

            this.element.style[key] = val;
        }

        if (this.isTransform) {
            let transform = '';

            if (typeof style.x !== 'undefined' || typeof style.y !== 'undefined' || typeof style.z !== 'undefined') {
                const x = typeof style.x !== 'undefined' ? style.x : 0;
                const y = typeof style.y !== 'undefined' ? style.y : 0;
                const z = typeof style.z !== 'undefined' ? style.z : 0;

                transform += `translate3d(${x}px, ${y}px, ${z}px)`;
            }

            if (typeof style.skewX !== 'undefined') {
                transform += `skewX(${style.skewX}deg)`;
            }

            if (typeof style.skewY !== 'undefined') {
                transform += `skewY(${style.skewY}deg)`;
            }

            if (typeof style.rotation !== 'undefined') {
                transform += `rotate(${style.rotation}deg)`;
            }

            if (typeof style.rotationX !== 'undefined') {
                transform += `rotateX(${style.rotationX}deg)`;
            }

            if (typeof style.rotationY !== 'undefined') {
                transform += `rotateY(${style.rotationY}deg)`;
            }

            if (typeof style.rotationZ !== 'undefined') {
                transform += `rotateZ(${style.rotationZ}deg)`;
            }

            if (typeof style.scale !== 'undefined') {
                transform += `scale(${style.scale})`;
            }

            if (typeof style.scaleX !== 'undefined') {
                transform += `scaleX(${style.scaleX})`;
            }

            if (typeof style.scaleY !== 'undefined') {
                transform += `scaleY(${style.scaleY})`;
            }

            if (typeof style.scaleZ !== 'undefined') {
                transform += `scaleZ(${style.scaleZ})`;
            }

            this.element.style.transform = transform;
        }

        if (this.isFilter) {
            let filter = '';

            if (typeof style.blur !== 'undefined') {
                filter += `blur(${style.blur}px)`;
            }

            if (typeof style.brightness !== 'undefined') {
                filter += `brightness(${style.brightness})`;
            }

            if (typeof style.contrast !== 'undefined') {
                filter += `contrast(${style.contrast})`;
            }

            if (typeof style.grayscale !== 'undefined') {
                filter += `grayscale(${style.grayscale})`;
            }

            if (typeof style.hue !== 'undefined') {
                filter += `hue-rotate(${style.hue}deg)`;
            }

            if (typeof style.invert !== 'undefined') {
                filter += `invert(${style.invert})`;
            }

            if (typeof style.saturate !== 'undefined') {
                filter += `saturate(${style.saturate})`;
            }

            if (typeof style.sepia !== 'undefined') {
                filter += `sepia(${style.sepia})`;
            }

            this.element.style.filter = filter;
        }

        return this;
    }

    tween(props, duration, ease, delay = 0, complete, update) {
        if (!this.element) {
            return;
        }

        if (typeof delay !== 'number') {
            update = complete;
            complete = delay;
            delay = 0;
        }

        const style = getComputedStyle(this.element);

        for (const key in props) {
            let val;

            if (typeof this.style[key] !== 'undefined') {
                val = this.style[key];
            } else if (~Transforms.indexOf(key) || ~Filters.indexOf(key) || ~Numeric.indexOf(key)) {
                val = ~Lacuna1.indexOf(key) ? 1 : 0;
            } else if (typeof style[key] === 'string') {
                val = parseFloat(style[key]);
            }

            if (!isNaN(val)) {
                this.style[key] = val;
            }
        }

        const promise = tween(this.style, props, duration, ease, delay, complete, () => {
            this.css(this.style);

            if (update) {
                update();
            }
        });

        return promise;
    }

    clearTween() {
        clearTween(this.style);

        return this;
    }

    delayedCall(duration, complete) {
        if (!this.timeouts) {
            return;
        }

        const timeout = delayedCall(duration, () => {
            this.clearTimeout(timeout, true);

            if (complete) {
                complete();
            }
        });

        this.timeouts.push(timeout);

        return timeout;
    }

    clearTimeout(timeout, isStopped) {
        if (!this.timeouts) {
            return;
        }

        if (!isStopped) {
            clearTween(timeout);
        }

        const index = this.timeouts.indexOf(timeout);

        if (~index) {
            this.timeouts.splice(index, 1);
        }
    }

    clearTimeouts() {
        if (!this.timeouts) {
            return;
        }

        for (let i = this.timeouts.length - 1; i >= 0; i--) {
            this.clearTimeout(this.timeouts[i]);
        }
    }

    text(str) {
        if (!this.element) {
            return;
        }

        if (typeof str === 'undefined') {
            return this.element.textContent;
        } else {
            this.element.textContent = str;
        }

        return this;
    }

    html(str) {
        if (!this.element) {
            return;
        }

        if (typeof str === 'undefined') {
            return this.element.innerHTML;
        } else {
            this.element.innerHTML = str;
        }

        return this;
    }

    hide() {
        return this.css({ display: 'none' });
    }

    show() {
        return this.css({ display: '' });
    }

    invisible() {
        return this.css({ visibility: 'hidden' });
    }

    visible() {
        return this.css({ visibility: '' });
    }

    bg(path, backgroundSize = 'contain', backgroundPosition = 'center', backgroundRepeat = 'no-repeat') {
        const style = {
            backgroundImage: `url(${Assets.getPath(path)})`,
            backgroundSize,
            backgroundPosition,
            backgroundRepeat
        };

        return this.css(style);
    }

    line(progress = this.progress || 0) {
        const start = this.start || 0;
        const offset = this.offset || 0;

        const length = this.element.getTotalLength();
        const dash = length * progress;
        const gap = length - dash;

        const style = {
            strokeDasharray: `${dash},${gap}`,
            strokeDashoffset: -length * (start + offset)
        };

        return this.css(style);
    }

    load(path) {
        const promise = fetch(Assets.getPath(path), Assets.options).then(response => {
            return response.text();
        }).then(str => {
            this.html(str);
        });

        return promise;
    }

    destroy() {
        if (!this.children) {
            return;
        }

        if (this.parent && this.parent.remove) {
            this.parent.remove(this);
        }

        this.clearTimeouts();
        this.clearTween();

        this.events.destroy();

        for (let i = this.children.length - 1; i >= 0; i--) {
            if (this.children[i] && this.children[i].destroy) {
                this.children[i].destroy();
            }
        }

        this.element.object = null;

        for (const prop in this) {
            this[prop] = null;
        }

        return null;
    }
}

/**
 * @author pschroen / https://ufo.ai/
 */

var Stage;

if (typeof window !== 'undefined') {
    Stage = new Interface(null, null);

    function addListeners() {
        window.addEventListener('popstate', onPopState);
        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('keyup', onKeyUp);
        window.addEventListener('keypress', onKeyPress);
        window.addEventListener('resize', onResize);
        document.addEventListener('visibilitychange', onVisibility);

        ticker.start();
    }

    /**
     * Event handlers
     */

    function onPopState(e) {
        Stage.path = location.pathname;

        Stage.events.emit(Events.STATE_CHANGE, e);
    }

    function onKeyDown(e) {
        Stage.events.emit(Events.KEY_DOWN, e);
    }

    function onKeyUp(e) {
        Stage.events.emit(Events.KEY_UP, e);
    }

    function onKeyPress(e) {
        Stage.events.emit(Events.KEY_PRESS, e);
    }

    function onResize(e) {
        Stage.width = document.documentElement.clientWidth;
        Stage.height = document.documentElement.clientHeight;
        Stage.dpr = window.devicePixelRatio;
        Stage.aspect = Stage.width / Stage.height;

        Stage.events.emit(Events.RESIZE, e);
    }

    function onVisibility(e) {
        Stage.events.emit(Events.VISIBILITY, e);
    }

    /**
     * Public methods
     */

    Stage.init = element => {
        Stage.element = element;

        addListeners();
        onPopState();
        onResize();
    };

    Stage.setPath = path => {
        if (path === location.pathname) {
            return;
        }

        history.pushState(null, null, path);

        onPopState();
    };

    Stage.setTitle = title => {
        document.title = title;
    };

    Stage.setContent =content =>{
        document.textContent = content;
    };
 }

class ProgressCanvas extends Interface {
    constructor() {
        super(null, 'canvas');

        const size = 32;

        this.width = size;
        this.height = size;
        this.x = size / 2;
        this.y = size / 2;
        this.radius = size * 0.4;
        this.startAngle = degToRad(-90);
        this.progress = 0;
        this.needsUpdate = false;

        this.initCanvas();
    }

    initCanvas() {
        this.context = this.element.getContext('2d');
    }

    addListeners() {
        ticker.add(this.onUpdate);
    }

    removeListeners() {
        ticker.remove(this.onUpdate);
    }

    /**
     * Event handlers
     */

    onUpdate = () => {
        if (this.needsUpdate) {
            this.update();
        }
    };

    onProgress = ({ progress }) => {
        clearTween(this);

        this.needsUpdate = true;

        tween(this, { progress }, 500, 'easeOutCubic', () => {
            this.needsUpdate = false;

            if (this.progress >= 1) {
                this.onComplete();
            }
        });
    };

    onComplete = () => {
        this.removeListeners();

        this.events.emit(Events.COMPLETE);
    };

    /**
     * Public methods
     */

    resize = () => {
        const dpr = 2;

        this.element.width = Math.round(this.width * dpr);
        this.element.height = Math.round(this.height * dpr);
        this.element.style.width = this.width + 'px';
        this.element.style.height = this.height + 'px';
        this.context.scale(dpr, dpr);

        this.context.lineWidth = 1.5;
        this.context.strokeStyle = Stage.rootStyle.getPropertyValue('--ui-color').trim();

        this.update();
    };

    update = () => {
        this.context.clearRect(0, 0, this.element.width, this.element.height);
        this.context.beginPath();
        this.context.arc(this.x, this.y, this.radius, this.startAngle, this.startAngle + degToRad(360 * this.progress));
        this.context.stroke();
    };

    animateIn = () => {
        this.addListeners();
        this.resize();
    };

    animateOut = () => {
        this.tween({ scale: 1.1, opacity: 0 }, 400, 'easeInCubic');
    };

    destroy = () => {
        this.removeListeners();

        clearTween(this);

        return super.destroy();
    };
}

class PreloaderView extends Interface {
    constructor() {
        super('.preloader');

        this.initHTML();
        this.initView();

        this.addListeners();
    }

    initHTML() {
        this.css({
            position: 'fixed',
            left: 0,
            top: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'var(--bg-color)',
            zIndex: 1,
            pointerEvents: 'none'
        });
    }

    initView() {
        this.view = new ProgressCanvas();
        this.view.css({
            left: '50%',
            top: '50%',
            marginLeft: -this.view.width / 2,
            marginTop: -this.view.height / 2
        });
        this.add(this.view);
    }

    addListeners() {
        this.view.events.on(Events.COMPLETE, this.onComplete);
    }

    removeListeners() {
        this.view.events.off(Events.COMPLETE, this.onComplete);
    }

    /**
     * Event handlers
     */

    onProgress = e => {
        this.view.onProgress(e);
    };

    onComplete = () => {
        this.events.emit(Events.COMPLETE);
    };

    /**
     * Public methods
     */

    animateIn = () => {
        this.view.animateIn();
    };

    animateOut = () => {
        this.view.animateOut();
        return this.tween({ opacity: 0 }, 250, 'easeOutSine', 500);
    };

    destroy = () => {
        this.removeListeners();

        return super.destroy();
    };
}

class Preloader {
    static init() {
        if (!Device.webgl) {
            return location.href = 'fallback.html';
        }

        Assets.path = Config.CDN;
        Assets.crossOrigin = 'anonymous';

        Assets.options = {
            mode: 'cors',
            // credentials: 'include'
        };

        Assets.cache = true;

        this.initStage();
        this.initView();
        this.initLoader();

        this.addListeners();
    }

    static initStage() {
        Stage.init(document.querySelector('#root'));

        Stage.root = document.querySelector(':root');
        Stage.rootStyle = getComputedStyle(Stage.root);
    }

    static initView() {
        this.view = new PreloaderView();
        Stage.add(this.view);
    }

    static async initLoader() {
        this.view.animateIn();

        let assets = Config.ASSETS.slice();

        if (Device.mobile) {
            assets = assets.filter(path => !/desktop/.test(path));
        } else {
            assets = assets.filter(path => !/mobile/.test(path));
        }

        this.loader = new MultiLoader();
        this.loader.load(new FontLoader());
        this.loader.load(new AssetLoader(assets));
        this.loader.add(2);

        const { App } = await import('./app.js');
        this.loader.trigger(1);

        this.app = App;

        await this.app.init(this.loader.loaders[1]);
        this.loader.trigger(1);
    }

    static addListeners() {
        this.loader.events.on(Events.PROGRESS, this.view.onProgress);
        this.view.events.on(Events.COMPLETE, this.onComplete);
    }

    static removeListeners() {
        this.loader.events.off(Events.PROGRESS, this.view.onProgress);
        this.view.events.off(Events.COMPLETE, this.onComplete);
    }

    /**
     * Event handlers
     */

    static onComplete = async () => {
        this.removeListeners();

        this.loader = this.loader.destroy();

        await this.view.animateOut();
        this.view = this.view.destroy();

        this.app.animateIn();
    };
}

export { Assets, Config, Device, EventEmitter, Events, Interface, Loader, Preloader, Stage, absolute, brightness, clamp, clearTween, degToRad, delayedCall, euclideanModulo, floorPowerOfTwo, getConstructor, getKeyByValue, guid, isPowerOfTwo, lerp, radToDeg, shuffle, ticker, tween };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9hZGVyLmpzIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvY29uZmlnL0NvbmZpZy5qcyIsIi4uLy4uLy4uL3NyYy9jb25maWcvRGV2aWNlLmpzIiwiLi4vLi4vLi4vc3JjL2NvbmZpZy9FdmVudHMuanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvdGhyZWUvc3JjL21hdGgvTWF0aFV0aWxzLmpzIiwiLi4vLi4vLi4vc3JjL3V0aWxzL1V0aWxzLmpzIiwiLi4vLi4vLi4vc3JjL2xvYWRlcnMvQXNzZXRzLmpzIiwiLi4vLi4vLi4vc3JjL3V0aWxzL0V2ZW50RW1pdHRlci5qcyIsIi4uLy4uLy4uL3NyYy9sb2FkZXJzL0xvYWRlci5qcyIsIi4uLy4uLy4uL3NyYy9sb2FkZXJzL011bHRpTG9hZGVyLmpzIiwiLi4vLi4vLi4vc3JjL2xvYWRlcnMvRm9udExvYWRlci5qcyIsIi4uLy4uLy4uL3NyYy9sb2FkZXJzL0Fzc2V0TG9hZGVyLmpzIiwiLi4vLi4vLi4vc3JjL3R3ZWVuL0JlemllckVhc2luZy5qcyIsIi4uLy4uLy4uL3NyYy90d2Vlbi9FYXNpbmcuanMiLCIuLi8uLi8uLi9zcmMvdHdlZW4vVGlja2VyLmpzIiwiLi4vLi4vLi4vc3JjL3R3ZWVuL1R3ZWVuLmpzIiwiLi4vLi4vLi4vc3JjL3V0aWxzL0ludGVyZmFjZS5qcyIsIi4uLy4uLy4uL3NyYy91dGlscy9TdGFnZS5qcyIsIi4uLy4uLy4uL3NyYy92aWV3cy9Qcm9ncmVzc0NhbnZhcy5qcyIsIi4uLy4uLy4uL3NyYy92aWV3cy9QcmVsb2FkZXJWaWV3LmpzIiwiLi4vLi4vLi4vc3JjL2NvbnRyb2xsZXJzL1ByZWxvYWRlci5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgY2xhc3MgQ29uZmlnIHtcbiAgICBzdGF0aWMgQlJFQUtQT0lOVCA9IDEwMDA7XG4gICAgc3RhdGljIERFQlVHID0gbG9jYXRpb24uc2VhcmNoID09PSAnP2RlYnVnJztcblxuICAgIHN0YXRpYyBDRE4gPSAnJztcblxuICAgIHN0YXRpYyBBU1NFVFMgPSBbXG4gICAgICAgICdhc3NldHMvaW1hZ2VzL2FsaWVua2l0dHkuc3ZnJyxcbiAgICAgICAgJ2Fzc2V0cy9pbWFnZXMvYWxpZW5raXR0eV9leWVsaWQuc3ZnJ1xuICAgIF07XG5cbiAgICBzdGF0aWMgR1VJID0gL1s/Jl11aS8udGVzdChsb2NhdGlvbi5zZWFyY2gpO1xuICAgIHN0YXRpYyBPUkJJVCA9IC9bPyZdb3JiaXQvLnRlc3QobG9jYXRpb24uc2VhcmNoKTtcbn1cbiIsImV4cG9ydCBjbGFzcyBEZXZpY2Uge1xuICAgIHN0YXRpYyBhZ2VudCA9IG5hdmlnYXRvci51c2VyQWdlbnQudG9Mb3dlckNhc2UoKTtcblxuICAgIHN0YXRpYyBtb2JpbGUgPSAhIW5hdmlnYXRvci5tYXhUb3VjaFBvaW50cztcblxuICAgIHN0YXRpYyB0YWJsZXQgPSB0aGlzLm1vYmlsZSAmJiBNYXRoLm1heChzY3JlZW4ud2lkdGgsIHNjcmVlbi5oZWlnaHQpID4gMTAwMDtcblxuICAgIHN0YXRpYyBwaG9uZSA9IHRoaXMubW9iaWxlICYmICF0aGlzLnRhYmxldDtcblxuICAgIHN0YXRpYyB3ZWJnbCA9ICgoKSA9PiB7XG4gICAgICAgIGlmICh0eXBlb2Ygd2luZG93ID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgY29udGV4dE9wdGlvbnMgPSB7XG4gICAgICAgICAgICBmYWlsSWZNYWpvclBlcmZvcm1hbmNlQ2F2ZWF0OiB0cnVlXG4gICAgICAgIH07XG5cbiAgICAgICAgbGV0IGNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuICAgICAgICBsZXQgZ2wgPSBjYW52YXMuZ2V0Q29udGV4dCgnd2ViZ2wyJywgY29udGV4dE9wdGlvbnMpO1xuXG4gICAgICAgIGNvbnN0IHJlc3VsdCA9ICEhZ2w7XG5cbiAgICAgICAgZ2wgPSBudWxsO1xuICAgICAgICBjYW52YXMgPSBudWxsO1xuXG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfSkoKTtcbn1cbiIsImV4cG9ydCBjbGFzcyBFdmVudHMge1xuICAgIHN0YXRpYyBTVEFURV9DSEFOR0UgPSAnc3RhdGVfY2hhbmdlJztcbiAgICBzdGF0aWMgVklFV19DSEFOR0UgPSAndmlld19jaGFuZ2UnO1xuICAgIHN0YXRpYyBLRVlfRE9XTiA9ICdrZXlfZG93bic7XG4gICAgc3RhdGljIEtFWV9VUCA9ICdrZXlfdXAnO1xuICAgIHN0YXRpYyBLRVlfUFJFU1MgPSAna2V5X3ByZXNzJztcbiAgICBzdGF0aWMgUkVTSVpFID0gJ3Jlc2l6ZSc7XG4gICAgc3RhdGljIFZJU0lCSUxJVFkgPSAndmlzaWJpbGl0eSc7XG4gICAgc3RhdGljIFBST0dSRVNTID0gJ3Byb2dyZXNzJztcbiAgICBzdGF0aWMgQ09NUExFVEUgPSAnY29tcGxldGUnO1xuICAgIHN0YXRpYyBVUERBVEUgPSAndXBkYXRlJztcbiAgICBzdGF0aWMgSE9WRVIgPSAnaG92ZXInO1xuICAgIHN0YXRpYyBDTElDSyA9ICdjbGljayc7XG5cbiAgICBzdGF0aWMgQ09MT1JfUElDS0VSID0gJ2NvbG9yX3BpY2tlcic7XG4gICAgc3RhdGljIElOVkVSVCA9ICdpbnZlcnQnO1xufVxuIiwiY29uc3QgX2x1dCA9IFsgJzAwJywgJzAxJywgJzAyJywgJzAzJywgJzA0JywgJzA1JywgJzA2JywgJzA3JywgJzA4JywgJzA5JywgJzBhJywgJzBiJywgJzBjJywgJzBkJywgJzBlJywgJzBmJywgJzEwJywgJzExJywgJzEyJywgJzEzJywgJzE0JywgJzE1JywgJzE2JywgJzE3JywgJzE4JywgJzE5JywgJzFhJywgJzFiJywgJzFjJywgJzFkJywgJzFlJywgJzFmJywgJzIwJywgJzIxJywgJzIyJywgJzIzJywgJzI0JywgJzI1JywgJzI2JywgJzI3JywgJzI4JywgJzI5JywgJzJhJywgJzJiJywgJzJjJywgJzJkJywgJzJlJywgJzJmJywgJzMwJywgJzMxJywgJzMyJywgJzMzJywgJzM0JywgJzM1JywgJzM2JywgJzM3JywgJzM4JywgJzM5JywgJzNhJywgJzNiJywgJzNjJywgJzNkJywgJzNlJywgJzNmJywgJzQwJywgJzQxJywgJzQyJywgJzQzJywgJzQ0JywgJzQ1JywgJzQ2JywgJzQ3JywgJzQ4JywgJzQ5JywgJzRhJywgJzRiJywgJzRjJywgJzRkJywgJzRlJywgJzRmJywgJzUwJywgJzUxJywgJzUyJywgJzUzJywgJzU0JywgJzU1JywgJzU2JywgJzU3JywgJzU4JywgJzU5JywgJzVhJywgJzViJywgJzVjJywgJzVkJywgJzVlJywgJzVmJywgJzYwJywgJzYxJywgJzYyJywgJzYzJywgJzY0JywgJzY1JywgJzY2JywgJzY3JywgJzY4JywgJzY5JywgJzZhJywgJzZiJywgJzZjJywgJzZkJywgJzZlJywgJzZmJywgJzcwJywgJzcxJywgJzcyJywgJzczJywgJzc0JywgJzc1JywgJzc2JywgJzc3JywgJzc4JywgJzc5JywgJzdhJywgJzdiJywgJzdjJywgJzdkJywgJzdlJywgJzdmJywgJzgwJywgJzgxJywgJzgyJywgJzgzJywgJzg0JywgJzg1JywgJzg2JywgJzg3JywgJzg4JywgJzg5JywgJzhhJywgJzhiJywgJzhjJywgJzhkJywgJzhlJywgJzhmJywgJzkwJywgJzkxJywgJzkyJywgJzkzJywgJzk0JywgJzk1JywgJzk2JywgJzk3JywgJzk4JywgJzk5JywgJzlhJywgJzliJywgJzljJywgJzlkJywgJzllJywgJzlmJywgJ2EwJywgJ2ExJywgJ2EyJywgJ2EzJywgJ2E0JywgJ2E1JywgJ2E2JywgJ2E3JywgJ2E4JywgJ2E5JywgJ2FhJywgJ2FiJywgJ2FjJywgJ2FkJywgJ2FlJywgJ2FmJywgJ2IwJywgJ2IxJywgJ2IyJywgJ2IzJywgJ2I0JywgJ2I1JywgJ2I2JywgJ2I3JywgJ2I4JywgJ2I5JywgJ2JhJywgJ2JiJywgJ2JjJywgJ2JkJywgJ2JlJywgJ2JmJywgJ2MwJywgJ2MxJywgJ2MyJywgJ2MzJywgJ2M0JywgJ2M1JywgJ2M2JywgJ2M3JywgJ2M4JywgJ2M5JywgJ2NhJywgJ2NiJywgJ2NjJywgJ2NkJywgJ2NlJywgJ2NmJywgJ2QwJywgJ2QxJywgJ2QyJywgJ2QzJywgJ2Q0JywgJ2Q1JywgJ2Q2JywgJ2Q3JywgJ2Q4JywgJ2Q5JywgJ2RhJywgJ2RiJywgJ2RjJywgJ2RkJywgJ2RlJywgJ2RmJywgJ2UwJywgJ2UxJywgJ2UyJywgJ2UzJywgJ2U0JywgJ2U1JywgJ2U2JywgJ2U3JywgJ2U4JywgJ2U5JywgJ2VhJywgJ2ViJywgJ2VjJywgJ2VkJywgJ2VlJywgJ2VmJywgJ2YwJywgJ2YxJywgJ2YyJywgJ2YzJywgJ2Y0JywgJ2Y1JywgJ2Y2JywgJ2Y3JywgJ2Y4JywgJ2Y5JywgJ2ZhJywgJ2ZiJywgJ2ZjJywgJ2ZkJywgJ2ZlJywgJ2ZmJyBdO1xuXG5sZXQgX3NlZWQgPSAxMjM0NTY3O1xuXG5cbmNvbnN0IERFRzJSQUQgPSBNYXRoLlBJIC8gMTgwO1xuY29uc3QgUkFEMkRFRyA9IDE4MCAvIE1hdGguUEk7XG5cbi8vIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvMTA1MDM0L2hvdy10by1jcmVhdGUtYS1ndWlkLXV1aWQtaW4tamF2YXNjcmlwdC8yMTk2MzEzNiMyMTk2MzEzNlxuZnVuY3Rpb24gZ2VuZXJhdGVVVUlEKCkge1xuXG5cdGNvbnN0IGQwID0gTWF0aC5yYW5kb20oKSAqIDB4ZmZmZmZmZmYgfCAwO1xuXHRjb25zdCBkMSA9IE1hdGgucmFuZG9tKCkgKiAweGZmZmZmZmZmIHwgMDtcblx0Y29uc3QgZDIgPSBNYXRoLnJhbmRvbSgpICogMHhmZmZmZmZmZiB8IDA7XG5cdGNvbnN0IGQzID0gTWF0aC5yYW5kb20oKSAqIDB4ZmZmZmZmZmYgfCAwO1xuXHRjb25zdCB1dWlkID0gX2x1dFsgZDAgJiAweGZmIF0gKyBfbHV0WyBkMCA+PiA4ICYgMHhmZiBdICsgX2x1dFsgZDAgPj4gMTYgJiAweGZmIF0gKyBfbHV0WyBkMCA+PiAyNCAmIDB4ZmYgXSArICctJyArXG5cdFx0XHRfbHV0WyBkMSAmIDB4ZmYgXSArIF9sdXRbIGQxID4+IDggJiAweGZmIF0gKyAnLScgKyBfbHV0WyBkMSA+PiAxNiAmIDB4MGYgfCAweDQwIF0gKyBfbHV0WyBkMSA+PiAyNCAmIDB4ZmYgXSArICctJyArXG5cdFx0XHRfbHV0WyBkMiAmIDB4M2YgfCAweDgwIF0gKyBfbHV0WyBkMiA+PiA4ICYgMHhmZiBdICsgJy0nICsgX2x1dFsgZDIgPj4gMTYgJiAweGZmIF0gKyBfbHV0WyBkMiA+PiAyNCAmIDB4ZmYgXSArXG5cdFx0XHRfbHV0WyBkMyAmIDB4ZmYgXSArIF9sdXRbIGQzID4+IDggJiAweGZmIF0gKyBfbHV0WyBkMyA+PiAxNiAmIDB4ZmYgXSArIF9sdXRbIGQzID4+IDI0ICYgMHhmZiBdO1xuXG5cdC8vIC50b0xvd2VyQ2FzZSgpIGhlcmUgZmxhdHRlbnMgY29uY2F0ZW5hdGVkIHN0cmluZ3MgdG8gc2F2ZSBoZWFwIG1lbW9yeSBzcGFjZS5cblx0cmV0dXJuIHV1aWQudG9Mb3dlckNhc2UoKTtcblxufVxuXG5mdW5jdGlvbiBjbGFtcCggdmFsdWUsIG1pbiwgbWF4ICkge1xuXG5cdHJldHVybiBNYXRoLm1heCggbWluLCBNYXRoLm1pbiggbWF4LCB2YWx1ZSApICk7XG5cbn1cblxuLy8gY29tcHV0ZSBldWNsaWRlYW4gbW9kdWxvIG9mIG0gJSBuXG4vLyBodHRwczovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9Nb2R1bG9fb3BlcmF0aW9uXG5mdW5jdGlvbiBldWNsaWRlYW5Nb2R1bG8oIG4sIG0gKSB7XG5cblx0cmV0dXJuICggKCBuICUgbSApICsgbSApICUgbTtcblxufVxuXG4vLyBMaW5lYXIgbWFwcGluZyBmcm9tIHJhbmdlIDxhMSwgYTI+IHRvIHJhbmdlIDxiMSwgYjI+XG5mdW5jdGlvbiBtYXBMaW5lYXIoIHgsIGExLCBhMiwgYjEsIGIyICkge1xuXG5cdHJldHVybiBiMSArICggeCAtIGExICkgKiAoIGIyIC0gYjEgKSAvICggYTIgLSBhMSApO1xuXG59XG5cbi8vIGh0dHBzOi8vd3d3LmdhbWVkZXYubmV0L3R1dG9yaWFscy9wcm9ncmFtbWluZy9nZW5lcmFsLWFuZC1nYW1lcGxheS1wcm9ncmFtbWluZy9pbnZlcnNlLWxlcnAtYS1zdXBlci11c2VmdWwteWV0LW9mdGVuLW92ZXJsb29rZWQtZnVuY3Rpb24tcjUyMzAvXG5mdW5jdGlvbiBpbnZlcnNlTGVycCggeCwgeSwgdmFsdWUgKSB7XG5cblx0aWYgKCB4ICE9PSB5ICkge1xuXG5cdFx0cmV0dXJuICggdmFsdWUgLSB4ICkgLyAoIHkgLSB4ICk7XG5cblx0fSBlbHNlIHtcblxuXHRcdHJldHVybiAwO1xuXG5cdH1cblxufVxuXG4vLyBodHRwczovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9MaW5lYXJfaW50ZXJwb2xhdGlvblxuZnVuY3Rpb24gbGVycCggeCwgeSwgdCApIHtcblxuXHRyZXR1cm4gKCAxIC0gdCApICogeCArIHQgKiB5O1xuXG59XG5cbi8vIGh0dHA6Ly93d3cucm9yeWRyaXNjb2xsLmNvbS8yMDE2LzAzLzA3L2ZyYW1lLXJhdGUtaW5kZXBlbmRlbnQtZGFtcGluZy11c2luZy1sZXJwL1xuZnVuY3Rpb24gZGFtcCggeCwgeSwgbGFtYmRhLCBkdCApIHtcblxuXHRyZXR1cm4gbGVycCggeCwgeSwgMSAtIE1hdGguZXhwKCAtIGxhbWJkYSAqIGR0ICkgKTtcblxufVxuXG4vLyBodHRwczovL3d3dy5kZXNtb3MuY29tL2NhbGN1bGF0b3IvdmNzam55ejd4NFxuZnVuY3Rpb24gcGluZ3BvbmcoIHgsIGxlbmd0aCA9IDEgKSB7XG5cblx0cmV0dXJuIGxlbmd0aCAtIE1hdGguYWJzKCBldWNsaWRlYW5Nb2R1bG8oIHgsIGxlbmd0aCAqIDIgKSAtIGxlbmd0aCApO1xuXG59XG5cbi8vIGh0dHA6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvU21vb3Roc3RlcFxuZnVuY3Rpb24gc21vb3Roc3RlcCggeCwgbWluLCBtYXggKSB7XG5cblx0aWYgKCB4IDw9IG1pbiApIHJldHVybiAwO1xuXHRpZiAoIHggPj0gbWF4ICkgcmV0dXJuIDE7XG5cblx0eCA9ICggeCAtIG1pbiApIC8gKCBtYXggLSBtaW4gKTtcblxuXHRyZXR1cm4geCAqIHggKiAoIDMgLSAyICogeCApO1xuXG59XG5cbmZ1bmN0aW9uIHNtb290aGVyc3RlcCggeCwgbWluLCBtYXggKSB7XG5cblx0aWYgKCB4IDw9IG1pbiApIHJldHVybiAwO1xuXHRpZiAoIHggPj0gbWF4ICkgcmV0dXJuIDE7XG5cblx0eCA9ICggeCAtIG1pbiApIC8gKCBtYXggLSBtaW4gKTtcblxuXHRyZXR1cm4geCAqIHggKiB4ICogKCB4ICogKCB4ICogNiAtIDE1ICkgKyAxMCApO1xuXG59XG5cbi8vIFJhbmRvbSBpbnRlZ2VyIGZyb20gPGxvdywgaGlnaD4gaW50ZXJ2YWxcbmZ1bmN0aW9uIHJhbmRJbnQoIGxvdywgaGlnaCApIHtcblxuXHRyZXR1cm4gbG93ICsgTWF0aC5mbG9vciggTWF0aC5yYW5kb20oKSAqICggaGlnaCAtIGxvdyArIDEgKSApO1xuXG59XG5cbi8vIFJhbmRvbSBmbG9hdCBmcm9tIDxsb3csIGhpZ2g+IGludGVydmFsXG5mdW5jdGlvbiByYW5kRmxvYXQoIGxvdywgaGlnaCApIHtcblxuXHRyZXR1cm4gbG93ICsgTWF0aC5yYW5kb20oKSAqICggaGlnaCAtIGxvdyApO1xuXG59XG5cbi8vIFJhbmRvbSBmbG9hdCBmcm9tIDwtcmFuZ2UvMiwgcmFuZ2UvMj4gaW50ZXJ2YWxcbmZ1bmN0aW9uIHJhbmRGbG9hdFNwcmVhZCggcmFuZ2UgKSB7XG5cblx0cmV0dXJuIHJhbmdlICogKCAwLjUgLSBNYXRoLnJhbmRvbSgpICk7XG5cbn1cblxuLy8gRGV0ZXJtaW5pc3RpYyBwc2V1ZG8tcmFuZG9tIGZsb2F0IGluIHRoZSBpbnRlcnZhbCBbIDAsIDEgXVxuZnVuY3Rpb24gc2VlZGVkUmFuZG9tKCBzICkge1xuXG5cdGlmICggcyAhPT0gdW5kZWZpbmVkICkgX3NlZWQgPSBzO1xuXG5cdC8vIE11bGJlcnJ5MzIgZ2VuZXJhdG9yXG5cblx0bGV0IHQgPSBfc2VlZCArPSAweDZEMkI3OUY1O1xuXG5cdHQgPSBNYXRoLmltdWwoIHQgXiB0ID4+PiAxNSwgdCB8IDEgKTtcblxuXHR0IF49IHQgKyBNYXRoLmltdWwoIHQgXiB0ID4+PiA3LCB0IHwgNjEgKTtcblxuXHRyZXR1cm4gKCAoIHQgXiB0ID4+PiAxNCApID4+PiAwICkgLyA0Mjk0OTY3Mjk2O1xuXG59XG5cbmZ1bmN0aW9uIGRlZ1RvUmFkKCBkZWdyZWVzICkge1xuXG5cdHJldHVybiBkZWdyZWVzICogREVHMlJBRDtcblxufVxuXG5mdW5jdGlvbiByYWRUb0RlZyggcmFkaWFucyApIHtcblxuXHRyZXR1cm4gcmFkaWFucyAqIFJBRDJERUc7XG5cbn1cblxuZnVuY3Rpb24gaXNQb3dlck9mVHdvKCB2YWx1ZSApIHtcblxuXHRyZXR1cm4gKCB2YWx1ZSAmICggdmFsdWUgLSAxICkgKSA9PT0gMCAmJiB2YWx1ZSAhPT0gMDtcblxufVxuXG5mdW5jdGlvbiBjZWlsUG93ZXJPZlR3byggdmFsdWUgKSB7XG5cblx0cmV0dXJuIE1hdGgucG93KCAyLCBNYXRoLmNlaWwoIE1hdGgubG9nKCB2YWx1ZSApIC8gTWF0aC5MTjIgKSApO1xuXG59XG5cbmZ1bmN0aW9uIGZsb29yUG93ZXJPZlR3byggdmFsdWUgKSB7XG5cblx0cmV0dXJuIE1hdGgucG93KCAyLCBNYXRoLmZsb29yKCBNYXRoLmxvZyggdmFsdWUgKSAvIE1hdGguTE4yICkgKTtcblxufVxuXG5mdW5jdGlvbiBzZXRRdWF0ZXJuaW9uRnJvbVByb3BlckV1bGVyKCBxLCBhLCBiLCBjLCBvcmRlciApIHtcblxuXHQvLyBJbnRyaW5zaWMgUHJvcGVyIEV1bGVyIEFuZ2xlcyAtIHNlZSBodHRwczovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9FdWxlcl9hbmdsZXNcblxuXHQvLyByb3RhdGlvbnMgYXJlIGFwcGxpZWQgdG8gdGhlIGF4ZXMgaW4gdGhlIG9yZGVyIHNwZWNpZmllZCBieSAnb3JkZXInXG5cdC8vIHJvdGF0aW9uIGJ5IGFuZ2xlICdhJyBpcyBhcHBsaWVkIGZpcnN0LCB0aGVuIGJ5IGFuZ2xlICdiJywgdGhlbiBieSBhbmdsZSAnYydcblx0Ly8gYW5nbGVzIGFyZSBpbiByYWRpYW5zXG5cblx0Y29uc3QgY29zID0gTWF0aC5jb3M7XG5cdGNvbnN0IHNpbiA9IE1hdGguc2luO1xuXG5cdGNvbnN0IGMyID0gY29zKCBiIC8gMiApO1xuXHRjb25zdCBzMiA9IHNpbiggYiAvIDIgKTtcblxuXHRjb25zdCBjMTMgPSBjb3MoICggYSArIGMgKSAvIDIgKTtcblx0Y29uc3QgczEzID0gc2luKCAoIGEgKyBjICkgLyAyICk7XG5cblx0Y29uc3QgYzFfMyA9IGNvcyggKCBhIC0gYyApIC8gMiApO1xuXHRjb25zdCBzMV8zID0gc2luKCAoIGEgLSBjICkgLyAyICk7XG5cblx0Y29uc3QgYzNfMSA9IGNvcyggKCBjIC0gYSApIC8gMiApO1xuXHRjb25zdCBzM18xID0gc2luKCAoIGMgLSBhICkgLyAyICk7XG5cblx0c3dpdGNoICggb3JkZXIgKSB7XG5cblx0XHRjYXNlICdYWVgnOlxuXHRcdFx0cS5zZXQoIGMyICogczEzLCBzMiAqIGMxXzMsIHMyICogczFfMywgYzIgKiBjMTMgKTtcblx0XHRcdGJyZWFrO1xuXG5cdFx0Y2FzZSAnWVpZJzpcblx0XHRcdHEuc2V0KCBzMiAqIHMxXzMsIGMyICogczEzLCBzMiAqIGMxXzMsIGMyICogYzEzICk7XG5cdFx0XHRicmVhaztcblxuXHRcdGNhc2UgJ1pYWic6XG5cdFx0XHRxLnNldCggczIgKiBjMV8zLCBzMiAqIHMxXzMsIGMyICogczEzLCBjMiAqIGMxMyApO1xuXHRcdFx0YnJlYWs7XG5cblx0XHRjYXNlICdYWlgnOlxuXHRcdFx0cS5zZXQoIGMyICogczEzLCBzMiAqIHMzXzEsIHMyICogYzNfMSwgYzIgKiBjMTMgKTtcblx0XHRcdGJyZWFrO1xuXG5cdFx0Y2FzZSAnWVhZJzpcblx0XHRcdHEuc2V0KCBzMiAqIGMzXzEsIGMyICogczEzLCBzMiAqIHMzXzEsIGMyICogYzEzICk7XG5cdFx0XHRicmVhaztcblxuXHRcdGNhc2UgJ1pZWic6XG5cdFx0XHRxLnNldCggczIgKiBzM18xLCBzMiAqIGMzXzEsIGMyICogczEzLCBjMiAqIGMxMyApO1xuXHRcdFx0YnJlYWs7XG5cblx0XHRkZWZhdWx0OlxuXHRcdFx0Y29uc29sZS53YXJuKCAnVEhSRUUuTWF0aFV0aWxzOiAuc2V0UXVhdGVybmlvbkZyb21Qcm9wZXJFdWxlcigpIGVuY291bnRlcmVkIGFuIHVua25vd24gb3JkZXI6ICcgKyBvcmRlciApO1xuXG5cdH1cblxufVxuXG5mdW5jdGlvbiBkZW5vcm1hbGl6ZSggdmFsdWUsIGFycmF5ICkge1xuXG5cdHN3aXRjaCAoIGFycmF5LmNvbnN0cnVjdG9yICkge1xuXG5cdFx0Y2FzZSBGbG9hdDMyQXJyYXk6XG5cblx0XHRcdHJldHVybiB2YWx1ZTtcblxuXHRcdGNhc2UgVWludDE2QXJyYXk6XG5cblx0XHRcdHJldHVybiB2YWx1ZSAvIDY1NTM1LjA7XG5cblx0XHRjYXNlIFVpbnQ4QXJyYXk6XG5cblx0XHRcdHJldHVybiB2YWx1ZSAvIDI1NS4wO1xuXG5cdFx0Y2FzZSBJbnQxNkFycmF5OlxuXG5cdFx0XHRyZXR1cm4gTWF0aC5tYXgoIHZhbHVlIC8gMzI3NjcuMCwgLSAxLjAgKTtcblxuXHRcdGNhc2UgSW50OEFycmF5OlxuXG5cdFx0XHRyZXR1cm4gTWF0aC5tYXgoIHZhbHVlIC8gMTI3LjAsIC0gMS4wICk7XG5cblx0XHRkZWZhdWx0OlxuXG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoICdJbnZhbGlkIGNvbXBvbmVudCB0eXBlLicgKTtcblxuXHR9XG5cbn1cblxuZnVuY3Rpb24gbm9ybWFsaXplKCB2YWx1ZSwgYXJyYXkgKSB7XG5cblx0c3dpdGNoICggYXJyYXkuY29uc3RydWN0b3IgKSB7XG5cblx0XHRjYXNlIEZsb2F0MzJBcnJheTpcblxuXHRcdFx0cmV0dXJuIHZhbHVlO1xuXG5cdFx0Y2FzZSBVaW50MTZBcnJheTpcblxuXHRcdFx0cmV0dXJuIE1hdGgucm91bmQoIHZhbHVlICogNjU1MzUuMCApO1xuXG5cdFx0Y2FzZSBVaW50OEFycmF5OlxuXG5cdFx0XHRyZXR1cm4gTWF0aC5yb3VuZCggdmFsdWUgKiAyNTUuMCApO1xuXG5cdFx0Y2FzZSBJbnQxNkFycmF5OlxuXG5cdFx0XHRyZXR1cm4gTWF0aC5yb3VuZCggdmFsdWUgKiAzMjc2Ny4wICk7XG5cblx0XHRjYXNlIEludDhBcnJheTpcblxuXHRcdFx0cmV0dXJuIE1hdGgucm91bmQoIHZhbHVlICogMTI3LjAgKTtcblxuXHRcdGRlZmF1bHQ6XG5cblx0XHRcdHRocm93IG5ldyBFcnJvciggJ0ludmFsaWQgY29tcG9uZW50IHR5cGUuJyApO1xuXG5cdH1cblxufVxuXG5jb25zdCBNYXRoVXRpbHMgPSB7XG5cdERFRzJSQUQ6IERFRzJSQUQsXG5cdFJBRDJERUc6IFJBRDJERUcsXG5cdGdlbmVyYXRlVVVJRDogZ2VuZXJhdGVVVUlELFxuXHRjbGFtcDogY2xhbXAsXG5cdGV1Y2xpZGVhbk1vZHVsbzogZXVjbGlkZWFuTW9kdWxvLFxuXHRtYXBMaW5lYXI6IG1hcExpbmVhcixcblx0aW52ZXJzZUxlcnA6IGludmVyc2VMZXJwLFxuXHRsZXJwOiBsZXJwLFxuXHRkYW1wOiBkYW1wLFxuXHRwaW5ncG9uZzogcGluZ3BvbmcsXG5cdHNtb290aHN0ZXA6IHNtb290aHN0ZXAsXG5cdHNtb290aGVyc3RlcDogc21vb3RoZXJzdGVwLFxuXHRyYW5kSW50OiByYW5kSW50LFxuXHRyYW5kRmxvYXQ6IHJhbmRGbG9hdCxcblx0cmFuZEZsb2F0U3ByZWFkOiByYW5kRmxvYXRTcHJlYWQsXG5cdHNlZWRlZFJhbmRvbTogc2VlZGVkUmFuZG9tLFxuXHRkZWdUb1JhZDogZGVnVG9SYWQsXG5cdHJhZFRvRGVnOiByYWRUb0RlZyxcblx0aXNQb3dlck9mVHdvOiBpc1Bvd2VyT2ZUd28sXG5cdGNlaWxQb3dlck9mVHdvOiBjZWlsUG93ZXJPZlR3byxcblx0Zmxvb3JQb3dlck9mVHdvOiBmbG9vclBvd2VyT2ZUd28sXG5cdHNldFF1YXRlcm5pb25Gcm9tUHJvcGVyRXVsZXI6IHNldFF1YXRlcm5pb25Gcm9tUHJvcGVyRXVsZXIsXG5cdG5vcm1hbGl6ZTogbm9ybWFsaXplLFxuXHRkZW5vcm1hbGl6ZTogZGVub3JtYWxpemVcbn07XG5cbmV4cG9ydCB7XG5cdERFRzJSQUQsXG5cdFJBRDJERUcsXG5cdGdlbmVyYXRlVVVJRCxcblx0Y2xhbXAsXG5cdGV1Y2xpZGVhbk1vZHVsbyxcblx0bWFwTGluZWFyLFxuXHRpbnZlcnNlTGVycCxcblx0bGVycCxcblx0ZGFtcCxcblx0cGluZ3BvbmcsXG5cdHNtb290aHN0ZXAsXG5cdHNtb290aGVyc3RlcCxcblx0cmFuZEludCxcblx0cmFuZEZsb2F0LFxuXHRyYW5kRmxvYXRTcHJlYWQsXG5cdHNlZWRlZFJhbmRvbSxcblx0ZGVnVG9SYWQsXG5cdHJhZFRvRGVnLFxuXHRpc1Bvd2VyT2ZUd28sXG5cdGNlaWxQb3dlck9mVHdvLFxuXHRmbG9vclBvd2VyT2ZUd28sXG5cdHNldFF1YXRlcm5pb25Gcm9tUHJvcGVyRXVsZXIsXG5cdG5vcm1hbGl6ZSxcblx0ZGVub3JtYWxpemUsXG5cdE1hdGhVdGlsc1xufTtcbiIsIi8qKlxuICogQGF1dGhvciBwc2Nocm9lbiAvIGh0dHBzOi8vdWZvLmFpL1xuICovXG5cbmltcG9ydCB7IHJhbmRJbnQgfSBmcm9tICd0aHJlZS9zcmMvbWF0aC9NYXRoVXRpbHMuanMnO1xuXG5leHBvcnQgKiBmcm9tICd0aHJlZS9zcmMvbWF0aC9NYXRoVXRpbHMuanMnO1xuXG5leHBvcnQgZnVuY3Rpb24gc2h1ZmZsZShhcnJheSkge1xuICAgIHJldHVybiBhcnJheS5zb3J0KCgpID0+IE1hdGgucmFuZG9tKCkgLSAwLjUpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaGVhZHNUYWlscyhoZWFkcywgdGFpbHMpIHtcbiAgICBpZiAodHlwZW9mIGhlYWRzID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICByZXR1cm4gcmFuZEludCgwLCAxKTtcbiAgICB9XG5cbiAgICByZXR1cm4gcmFuZEludCgwLCAxKSA/IHRhaWxzIDogaGVhZHM7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBndWlkKCkge1xuICAgIHJldHVybiAoRGF0ZS5ub3coKSArIHJhbmRJbnQoMCwgOTk5OTkpKS50b1N0cmluZygpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYnJpZ2h0bmVzcyhjb2xvcikge1xuICAgIHJldHVybiBjb2xvci5yICogMC4zICsgY29sb3IuZyAqIDAuNTkgKyBjb2xvci5iICogMC4xMTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGJhc2VuYW1lKHBhdGgsIGV4dCkge1xuICAgIGNvbnN0IG5hbWUgPSBwYXRoLnNwbGl0KCcvJykucG9wKCkuc3BsaXQoJz8nKVswXTtcblxuICAgIHJldHVybiAhZXh0ID8gbmFtZS5zcGxpdCgnLicpWzBdIDogbmFtZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGV4dGVuc2lvbihwYXRoKSB7XG4gICAgcmV0dXJuIHBhdGguc3BsaXQoJy4nKS5wb3AoKS5zcGxpdCgnPycpWzBdLnRvTG93ZXJDYXNlKCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhYnNvbHV0ZShwYXRoKSB7XG4gICAgaWYgKHBhdGguaW5jbHVkZXMoJy8vJykpIHtcbiAgICAgICAgcmV0dXJuIHBhdGg7XG4gICAgfVxuXG4gICAgY29uc3QgcG9ydCA9IE51bWJlcihsb2NhdGlvbi5wb3J0KSA+IDEwMDAgPyBgOiR7bG9jYXRpb24ucG9ydH1gIDogJyc7XG4gICAgY29uc3QgcGF0aG5hbWUgPSBwYXRoLnN0YXJ0c1dpdGgoJy8nKSA/IHBhdGggOiBgJHtsb2NhdGlvbi5wYXRobmFtZS5yZXBsYWNlKC9cXC9bXi9dKiQvLCAnLycpfSR7cGF0aH1gO1xuXG4gICAgcmV0dXJuIGAke2xvY2F0aW9uLnByb3RvY29sfS8vJHtsb2NhdGlvbi5ob3N0bmFtZX0ke3BvcnR9JHtwYXRobmFtZX1gO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0S2V5QnlWYWx1ZShvYmplY3QsIHZhbHVlKSB7XG4gICAgcmV0dXJuIE9iamVjdC5rZXlzKG9iamVjdCkuZmluZChrZXkgPT4gb2JqZWN0W2tleV0gPT09IHZhbHVlKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldENvbnN0cnVjdG9yKG9iamVjdCkge1xuICAgIGNvbnN0IGlzSW5zdGFuY2UgPSB0eXBlb2Ygb2JqZWN0ICE9PSAnZnVuY3Rpb24nO1xuICAgIGNvbnN0IGNvZGUgPSBpc0luc3RhbmNlID8gb2JqZWN0LmNvbnN0cnVjdG9yLnRvU3RyaW5nKCkgOiBvYmplY3QudG9TdHJpbmcoKTtcbiAgICBjb25zdCBuYW1lID0gY29kZS5tYXRjaCgvKD86Y2xhc3N8ZnVuY3Rpb24pXFxzKFteXFxzeyhdKykvKVsxXTtcblxuICAgIHJldHVybiB7IG5hbWUsIGNvZGUsIGlzSW5zdGFuY2UgfTtcbn1cbiIsIi8qKlxuICogQGF1dGhvciBwc2Nocm9lbiAvIGh0dHBzOi8vdWZvLmFpL1xuICovXG5cbmltcG9ydCB7IGd1aWQgfSBmcm9tICcuLi91dGlscy9VdGlscy5qcyc7XG5cbmV4cG9ydCBjbGFzcyBBc3NldHMge1xuICAgIHN0YXRpYyBwYXRoID0gJyc7XG4gICAgc3RhdGljIGNyb3NzT3JpZ2luO1xuICAgIHN0YXRpYyBvcHRpb25zO1xuICAgIHN0YXRpYyBjYWNoZSA9IGZhbHNlO1xuICAgIHN0YXRpYyBmaWxlcyA9IHt9O1xuXG4gICAgc3RhdGljIGFkZChrZXksIGZpbGUpIHtcbiAgICAgICAgaWYgKCF0aGlzLmNhY2hlKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmZpbGVzW2tleV0gPSBmaWxlO1xuICAgIH1cblxuICAgIHN0YXRpYyBnZXQoa2V5KSB7XG4gICAgICAgIGlmICghdGhpcy5jYWNoZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuZmlsZXNba2V5XTtcbiAgICB9XG5cbiAgICBzdGF0aWMgcmVtb3ZlKGtleSkge1xuICAgICAgICBkZWxldGUgdGhpcy5maWxlc1trZXldO1xuICAgIH1cblxuICAgIHN0YXRpYyBjbGVhcigpIHtcbiAgICAgICAgdGhpcy5maWxlcyA9IHt9O1xuICAgIH1cblxuICAgIHN0YXRpYyBmaWx0ZXIoY2FsbGJhY2spIHtcbiAgICAgICAgY29uc3QgZmlsZXMgPSBPYmplY3Qua2V5cyh0aGlzLmZpbGVzKS5maWx0ZXIoY2FsbGJhY2spLnJlZHVjZSgob2JqZWN0LCBrZXkpID0+IHtcbiAgICAgICAgICAgIG9iamVjdFtrZXldID0gdGhpcy5maWxlc1trZXldO1xuXG4gICAgICAgICAgICByZXR1cm4gb2JqZWN0O1xuICAgICAgICB9LCB7fSk7XG5cbiAgICAgICAgcmV0dXJuIGZpbGVzO1xuICAgIH1cblxuICAgIHN0YXRpYyBnZXRQYXRoKHBhdGgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucGF0aCArIHBhdGg7XG4gICAgfVxuXG4gICAgc3RhdGljIGxvYWRJbWFnZShwYXRoLCBjYWxsYmFjaykge1xuICAgICAgICBjb25zdCBpbWFnZSA9IG5ldyBJbWFnZSgpO1xuXG4gICAgICAgIGltYWdlLmNyb3NzT3JpZ2luID0gdGhpcy5jcm9zc09yaWdpbjtcbiAgICAgICAgaW1hZ2Uuc3JjID0gdGhpcy5nZXRQYXRoKHBhdGgpO1xuXG4gICAgICAgIGNvbnN0IHByb21pc2UgPSBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICBpbWFnZS5vbmxvYWQgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZShpbWFnZSk7XG5cbiAgICAgICAgICAgICAgICBpbWFnZS5vbmxvYWQgPSBudWxsO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgaW1hZ2Uub25lcnJvciA9IGV2ZW50ID0+IHtcbiAgICAgICAgICAgICAgICByZWplY3QoZXZlbnQpO1xuXG4gICAgICAgICAgICAgICAgaW1hZ2Uub25lcnJvciA9IG51bGw7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9KTtcblxuICAgICAgICBpZiAoY2FsbGJhY2spIHtcbiAgICAgICAgICAgIHByb21pc2UudGhlbihjYWxsYmFjayk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcHJvbWlzZTtcbiAgICB9XG5cbiAgICBzdGF0aWMgbG9hZERhdGEocGF0aCwgY2FsbGJhY2spIHtcbiAgICAgICAgY29uc3QgcHJvbWlzZSA9IGZldGNoKGAke3RoaXMuZ2V0UGF0aChwYXRoKX0/JHtndWlkKCl9YCwgdGhpcy5vcHRpb25zKS50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgIHJldHVybiByZXNwb25zZS5qc29uKCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmIChjYWxsYmFjaykge1xuICAgICAgICAgICAgcHJvbWlzZS50aGVuKGNhbGxiYWNrKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBwcm9taXNlO1xuICAgIH1cbn1cbiIsIi8qKlxuICogQGF1dGhvciBwc2Nocm9lbiAvIGh0dHBzOi8vdWZvLmFpL1xuICovXG5cbmV4cG9ydCBjbGFzcyBFdmVudEVtaXR0ZXIge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLmNhbGxiYWNrcyA9IHt9O1xuICAgIH1cblxuICAgIG9uKHR5cGUsIGNhbGxiYWNrKSB7XG4gICAgICAgIGlmICghdGhpcy5jYWxsYmFja3NbdHlwZV0pIHtcbiAgICAgICAgICAgIHRoaXMuY2FsbGJhY2tzW3R5cGVdID0gW107XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmNhbGxiYWNrc1t0eXBlXS5wdXNoKGNhbGxiYWNrKTtcbiAgICB9XG5cbiAgICBvZmYodHlwZSwgY2FsbGJhY2spIHtcbiAgICAgICAgaWYgKCF0aGlzLmNhbGxiYWNrc1t0eXBlXSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGNhbGxiYWNrKSB7XG4gICAgICAgICAgICBjb25zdCBpbmRleCA9IHRoaXMuY2FsbGJhY2tzW3R5cGVdLmluZGV4T2YoY2FsbGJhY2spO1xuXG4gICAgICAgICAgICBpZiAofmluZGV4KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jYWxsYmFja3NbdHlwZV0uc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzLmNhbGxiYWNrc1t0eXBlXTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGVtaXQodHlwZSwgZXZlbnQgPSB7fSkge1xuICAgICAgICBpZiAoIXRoaXMuY2FsbGJhY2tzW3R5cGVdKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBzdGFjayA9IHRoaXMuY2FsbGJhY2tzW3R5cGVdLnNsaWNlKCk7XG5cbiAgICAgICAgZm9yIChsZXQgaSA9IDAsIGwgPSBzdGFjay5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgICAgIHN0YWNrW2ldLmNhbGwodGhpcywgZXZlbnQpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZGVzdHJveSgpIHtcbiAgICAgICAgZm9yIChjb25zdCBwcm9wIGluIHRoaXMpIHtcbiAgICAgICAgICAgIHRoaXNbcHJvcF0gPSBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxufVxuIiwiLyoqXG4gKiBAYXV0aG9yIHBzY2hyb2VuIC8gaHR0cHM6Ly91Zm8uYWkvXG4gKi9cblxuaW1wb3J0IHsgRXZlbnRzIH0gZnJvbSAnLi4vY29uZmlnL0V2ZW50cy5qcyc7XG5pbXBvcnQgeyBFdmVudEVtaXR0ZXIgfSBmcm9tICcuLi91dGlscy9FdmVudEVtaXR0ZXIuanMnO1xuXG5leHBvcnQgY2xhc3MgTG9hZGVyIHtcbiAgICBjb25zdHJ1Y3Rvcihhc3NldHMgPSBbXSwgY2FsbGJhY2spIHtcbiAgICAgICAgdGhpcy5hc3NldHMgPSBhc3NldHM7XG4gICAgICAgIHRoaXMuY2FsbGJhY2sgPSBjYWxsYmFjaztcbiAgICAgICAgdGhpcy5ldmVudHMgPSBuZXcgRXZlbnRFbWl0dGVyKCk7XG4gICAgICAgIHRoaXMudG90YWwgPSAwO1xuICAgICAgICB0aGlzLmxvYWRlZCA9IDA7XG4gICAgICAgIHRoaXMucHJvZ3Jlc3MgPSAwO1xuICAgICAgICB0aGlzLnByb21pc2UgPSBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHRoaXMucmVzb2x2ZSA9IHJlc29sdmUpO1xuXG4gICAgICAgIGFzc2V0cy5mb3JFYWNoKHBhdGggPT4gdGhpcy5sb2FkKHBhdGgpKTtcbiAgICB9XG5cbiAgICBsb2FkKC8qIHBhdGgsIGNhbGxiYWNrICovKSB7fVxuXG4gICAgbG9hZEFzeW5jKHBhdGgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKHJlc29sdmUgPT4gdGhpcy5sb2FkKHBhdGgsIHJlc29sdmUpKTtcbiAgICB9XG5cbiAgICBpbmNyZW1lbnQoKSB7XG4gICAgICAgIHRoaXMucHJvZ3Jlc3MgPSArK3RoaXMubG9hZGVkIC8gdGhpcy50b3RhbDtcblxuICAgICAgICB0aGlzLmV2ZW50cy5lbWl0KEV2ZW50cy5QUk9HUkVTUywgeyBwcm9ncmVzczogdGhpcy5wcm9ncmVzcyB9KTtcblxuICAgICAgICBpZiAodGhpcy5sb2FkZWQgPT09IHRoaXMudG90YWwpIHtcbiAgICAgICAgICAgIHRoaXMuY29tcGxldGUoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGNvbXBsZXRlKCkge1xuICAgICAgICB0aGlzLnJlc29sdmUoKTtcblxuICAgICAgICB0aGlzLmV2ZW50cy5lbWl0KEV2ZW50cy5DT01QTEVURSk7XG5cbiAgICAgICAgaWYgKHRoaXMuY2FsbGJhY2spIHtcbiAgICAgICAgICAgIHRoaXMuY2FsbGJhY2soKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGFkZChudW0gPSAxKSB7XG4gICAgICAgIHRoaXMudG90YWwgKz0gbnVtO1xuICAgIH1cblxuICAgIHRyaWdnZXIobnVtID0gMSkge1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG51bTsgaSsrKSB7XG4gICAgICAgICAgICB0aGlzLmluY3JlbWVudCgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmVhZHkoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnRvdGFsID8gdGhpcy5wcm9taXNlIDogUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgfVxuXG4gICAgZGVzdHJveSgpIHtcbiAgICAgICAgdGhpcy5ldmVudHMuZGVzdHJveSgpO1xuXG4gICAgICAgIGZvciAoY29uc3QgcHJvcCBpbiB0aGlzKSB7XG4gICAgICAgICAgICB0aGlzW3Byb3BdID0gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbn1cbiIsIi8qKlxuICogQGF1dGhvciBwc2Nocm9lbiAvIGh0dHBzOi8vdWZvLmFpL1xuICovXG5cbmltcG9ydCB7IEV2ZW50cyB9IGZyb20gJy4uL2NvbmZpZy9FdmVudHMuanMnO1xuaW1wb3J0IHsgTG9hZGVyIH0gZnJvbSAnLi9Mb2FkZXIuanMnO1xuXG5leHBvcnQgY2xhc3MgTXVsdGlMb2FkZXIgZXh0ZW5kcyBMb2FkZXIge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBzdXBlcigpO1xuXG4gICAgICAgIHRoaXMubG9hZGVycyA9IFtdO1xuICAgICAgICB0aGlzLndlaWdodHMgPSBbXTtcbiAgICB9XG5cbiAgICBsb2FkKGxvYWRlciwgd2VpZ2h0ID0gMSkge1xuICAgICAgICBsb2FkZXIuZXZlbnRzLm9uKEV2ZW50cy5QUk9HUkVTUywgdGhpcy5vblByb2dyZXNzKTtcbiAgICAgICAgbG9hZGVyLmV2ZW50cy5vbihFdmVudHMuQ09NUExFVEUsIHRoaXMub25Db21wbGV0ZSk7XG5cbiAgICAgICAgdGhpcy5sb2FkZXJzLnB1c2gobG9hZGVyKTtcbiAgICAgICAgdGhpcy53ZWlnaHRzLnB1c2god2VpZ2h0KTtcblxuICAgICAgICB0aGlzLnRvdGFsICs9IHdlaWdodDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBFdmVudCBoYW5kbGVyc1xuICAgICAqL1xuXG4gICAgb25Qcm9ncmVzcyA9ICgpID0+IHtcbiAgICAgICAgbGV0IGxvYWRlZCA9IHRoaXMubG9hZGVkO1xuXG4gICAgICAgIGZvciAobGV0IGkgPSAwLCBsID0gdGhpcy5sb2FkZXJzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICAgICAgbG9hZGVkICs9IHRoaXMud2VpZ2h0c1tpXSAqIHRoaXMubG9hZGVyc1tpXS5wcm9ncmVzcztcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHByb2dyZXNzID0gbG9hZGVkIC8gdGhpcy50b3RhbDtcblxuICAgICAgICBpZiAocHJvZ3Jlc3MgPCAxKSB7XG4gICAgICAgICAgICB0aGlzLmV2ZW50cy5lbWl0KEV2ZW50cy5QUk9HUkVTUywgeyBwcm9ncmVzcyB9KTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBvbkNvbXBsZXRlID0gKCkgPT4ge1xuICAgICAgICB0aGlzLmluY3JlbWVudCgpO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBQdWJsaWMgbWV0aG9kc1xuICAgICAqL1xuXG4gICAgZGVzdHJveSA9ICgpID0+IHtcbiAgICAgICAgZm9yIChsZXQgaSA9IHRoaXMubG9hZGVycy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgICAgICAgaWYgKHRoaXMubG9hZGVyc1tpXSAmJiB0aGlzLmxvYWRlcnNbaV0uZGVzdHJveSkge1xuICAgICAgICAgICAgICAgIHRoaXMubG9hZGVyc1tpXS5kZXN0cm95KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gc3VwZXIuZGVzdHJveSgpO1xuICAgIH07XG59XG4iLCIvKipcbiAqIEBhdXRob3IgcHNjaHJvZW4gLyBodHRwczovL3Vmby5haS9cbiAqL1xuXG5pbXBvcnQgeyBMb2FkZXIgfSBmcm9tICcuL0xvYWRlci5qcyc7XG5cbmV4cG9ydCBjbGFzcyBGb250TG9hZGVyIGV4dGVuZHMgTG9hZGVyIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgc3VwZXIoKTtcblxuICAgICAgICB0aGlzLmxvYWQoKTtcbiAgICB9XG5cbiAgICBsb2FkKCkge1xuICAgICAgICBkb2N1bWVudC5mb250cy5yZWFkeS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuaW5jcmVtZW50KCk7XG4gICAgICAgIH0pLmNhdGNoKCgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuaW5jcmVtZW50KCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMudG90YWwrKztcbiAgICB9XG59XG4iLCIvKipcbiAqIEBhdXRob3IgcHNjaHJvZW4gLyBodHRwczovL3Vmby5haS9cbiAqL1xuXG5pbXBvcnQgeyBBc3NldHMgfSBmcm9tICcuL0Fzc2V0cy5qcyc7XG5pbXBvcnQgeyBMb2FkZXIgfSBmcm9tICcuL0xvYWRlci5qcyc7XG5cbmV4cG9ydCBjbGFzcyBBc3NldExvYWRlciBleHRlbmRzIExvYWRlciB7XG4gICAgbG9hZChwYXRoLCBjYWxsYmFjaykge1xuICAgICAgICBjb25zdCBjYWNoZWQgPSBBc3NldHMuZ2V0KHBhdGgpO1xuXG4gICAgICAgIGxldCBwcm9taXNlO1xuXG4gICAgICAgIGlmIChjYWNoZWQpIHtcbiAgICAgICAgICAgIHByb21pc2UgPSBQcm9taXNlLnJlc29sdmUoY2FjaGVkKTtcbiAgICAgICAgfSBlbHNlIGlmICgvXFwuKGpwZT9nfHBuZ3xnaWZ8c3ZnKS8udGVzdChwYXRoKSkge1xuICAgICAgICAgICAgcHJvbWlzZSA9IEFzc2V0cy5sb2FkSW1hZ2UocGF0aCk7XG4gICAgICAgIH0gZWxzZSBpZiAoL1xcLmpzb24vLnRlc3QocGF0aCkpIHtcbiAgICAgICAgICAgIHByb21pc2UgPSBBc3NldHMubG9hZERhdGEocGF0aCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBwcm9taXNlID0gZmV0Y2goQXNzZXRzLmdldFBhdGgocGF0aCksIEFzc2V0cy5vcHRpb25zKS50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoL1xcLihtcDN8bTRhfG9nZ3x3YXZ8YWlmZj8pLy50ZXN0KHBhdGgpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXNwb25zZS5hcnJheUJ1ZmZlcigpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXNwb25zZS50ZXh0KCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICBwcm9taXNlLnRoZW4oZGF0YSA9PiB7XG4gICAgICAgICAgICBBc3NldHMuYWRkKHBhdGgsIGRhdGEpO1xuXG4gICAgICAgICAgICB0aGlzLmluY3JlbWVudCgpO1xuXG4gICAgICAgICAgICBpZiAoY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhkYXRhKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSkuY2F0Y2goZXZlbnQgPT4ge1xuICAgICAgICAgICAgdGhpcy5pbmNyZW1lbnQoKTtcblxuICAgICAgICAgICAgaWYgKGNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2soZXZlbnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLnRvdGFsKys7XG4gICAgfVxufVxuIiwiLyoqXG4gKiBAYXV0aG9yIHBzY2hyb2VuIC8gaHR0cHM6Ly91Zm8uYWkvXG4gKlxuICogQmFzZWQgb24gaHR0cHM6Ly9naXRodWIuY29tL2dyZS9iZXppZXItZWFzaW5nXG4gKi9cblxuLy8gVGhlc2UgdmFsdWVzIGFyZSBlc3RhYmxpc2hlZCBieSBlbXBpcmljaXNtIHdpdGggdGVzdHMgKHRyYWRlb2ZmOiBwZXJmb3JtYW5jZSBWUyBwcmVjaXNpb24pXG5jb25zdCBORVdUT05fSVRFUkFUSU9OUyA9IDQ7XG5jb25zdCBORVdUT05fTUlOX1NMT1BFID0gMC4wMDE7XG5jb25zdCBTVUJESVZJU0lPTl9QUkVDSVNJT04gPSAwLjAwMDAwMDE7XG5jb25zdCBTVUJESVZJU0lPTl9NQVhfSVRFUkFUSU9OUyA9IDEwO1xuXG5jb25zdCBrU3BsaW5lVGFibGVTaXplID0gMTE7XG5jb25zdCBrU2FtcGxlU3RlcFNpemUgPSAxIC8gKGtTcGxpbmVUYWJsZVNpemUgLSAxKTtcblxuY29uc3QgZmxvYXQzMkFycmF5U3VwcG9ydGVkID0gdHlwZW9mIEZsb2F0MzJBcnJheSA9PT0gJ2Z1bmN0aW9uJztcblxuZnVuY3Rpb24gQShhQTEsIGFBMikge1xuICAgIHJldHVybiAxIC0gMyAqIGFBMiArIDMgKiBhQTE7XG59XG5cbmZ1bmN0aW9uIEIoYUExLCBhQTIpIHtcbiAgICByZXR1cm4gMyAqIGFBMiAtIDYgKiBhQTE7XG59XG5cbmZ1bmN0aW9uIEMoYUExKSB7XG4gICAgcmV0dXJuIDMgKiBhQTE7XG59XG5cbi8vIFJldHVybnMgeCh0KSBnaXZlbiB0LCB4MSwgYW5kIHgyLCBvciB5KHQpIGdpdmVuIHQsIHkxLCBhbmQgeTJcbmZ1bmN0aW9uIGNhbGNCZXppZXIoYVQsIGFBMSwgYUEyKSB7XG4gICAgcmV0dXJuICgoQShhQTEsIGFBMikgKiBhVCArIEIoYUExLCBhQTIpKSAqIGFUICsgQyhhQTEpKSAqIGFUO1xufVxuXG4vLyBSZXR1cm5zIGR4L2R0IGdpdmVuIHQsIHgxLCBhbmQgeDIsIG9yIGR5L2R0IGdpdmVuIHQsIHkxLCBhbmQgeTJcbmZ1bmN0aW9uIGdldFNsb3BlKGFULCBhQTEsIGFBMikge1xuICAgIHJldHVybiAzICogQShhQTEsIGFBMikgKiBhVCAqIGFUICsgMiAqIEIoYUExLCBhQTIpICogYVQgKyBDKGFBMSk7XG59XG5cbmZ1bmN0aW9uIGJpbmFyeVN1YmRpdmlkZShhWCwgYUEsIGFCLCBtWDEsIG1YMikge1xuICAgIGxldCBjdXJyZW50WDtcbiAgICBsZXQgY3VycmVudFQ7XG4gICAgbGV0IGkgPSAwO1xuXG4gICAgZG8ge1xuICAgICAgICBjdXJyZW50VCA9IGFBICsgKGFCIC0gYUEpIC8gMjtcbiAgICAgICAgY3VycmVudFggPSBjYWxjQmV6aWVyKGN1cnJlbnRULCBtWDEsIG1YMikgLSBhWDtcblxuICAgICAgICBpZiAoY3VycmVudFggPiAwKSB7XG4gICAgICAgICAgICBhQiA9IGN1cnJlbnRUO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgYUEgPSBjdXJyZW50VDtcbiAgICAgICAgfVxuICAgIH0gd2hpbGUgKE1hdGguYWJzKGN1cnJlbnRYKSA+IFNVQkRJVklTSU9OX1BSRUNJU0lPTiAmJiArK2kgPCBTVUJESVZJU0lPTl9NQVhfSVRFUkFUSU9OUyk7XG5cbiAgICByZXR1cm4gY3VycmVudFQ7XG59XG5cbmZ1bmN0aW9uIG5ld3RvblJhcGhzb25JdGVyYXRlKGFYLCBhR3Vlc3NULCBtWDEsIG1YMikge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgTkVXVE9OX0lURVJBVElPTlM7IGkrKykge1xuICAgICAgICBjb25zdCBjdXJyZW50U2xvcGUgPSBnZXRTbG9wZShhR3Vlc3NULCBtWDEsIG1YMik7XG5cbiAgICAgICAgaWYgKGN1cnJlbnRTbG9wZSA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIGFHdWVzc1Q7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBjdXJyZW50WCA9IGNhbGNCZXppZXIoYUd1ZXNzVCwgbVgxLCBtWDIpIC0gYVg7XG4gICAgICAgIGFHdWVzc1QgLT0gY3VycmVudFggLyBjdXJyZW50U2xvcGU7XG4gICAgfVxuXG4gICAgcmV0dXJuIGFHdWVzc1Q7XG59XG5cbmZ1bmN0aW9uIExpbmVhckVhc2luZyh4KSB7XG4gICAgcmV0dXJuIHg7XG59XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGJlemllcihtWDEsIG1ZMSwgbVgyLCBtWTIpIHtcbiAgICBpZiAoISgwIDw9IG1YMSAmJiBtWDEgPD0gMSAmJiAwIDw9IG1YMiAmJiBtWDIgPD0gMSkpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdCZXppZXIgeCB2YWx1ZXMgbXVzdCBiZSBpbiBbMCwgMV0gcmFuZ2UnKTtcbiAgICB9XG5cbiAgICBpZiAobVgxID09PSBtWTEgJiYgbVgyID09PSBtWTIpIHtcbiAgICAgICAgcmV0dXJuIExpbmVhckVhc2luZztcbiAgICB9XG5cbiAgICAvLyBQcmVjb21wdXRlIHNhbXBsZXMgdGFibGVcbiAgICBjb25zdCBzYW1wbGVWYWx1ZXMgPSBmbG9hdDMyQXJyYXlTdXBwb3J0ZWQgPyBuZXcgRmxvYXQzMkFycmF5KGtTcGxpbmVUYWJsZVNpemUpIDogbmV3IEFycmF5KGtTcGxpbmVUYWJsZVNpemUpO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwga1NwbGluZVRhYmxlU2l6ZTsgaSsrKSB7XG4gICAgICAgIHNhbXBsZVZhbHVlc1tpXSA9IGNhbGNCZXppZXIoaSAqIGtTYW1wbGVTdGVwU2l6ZSwgbVgxLCBtWDIpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdldFRGb3JYKGFYKSB7XG4gICAgICAgIGxldCBpbnRlcnZhbFN0YXJ0ID0gMDtcbiAgICAgICAgbGV0IGN1cnJlbnRTYW1wbGUgPSAxO1xuICAgICAgICBjb25zdCBsYXN0U2FtcGxlID0ga1NwbGluZVRhYmxlU2l6ZSAtIDE7XG5cbiAgICAgICAgZm9yICg7IGN1cnJlbnRTYW1wbGUgIT09IGxhc3RTYW1wbGUgJiYgc2FtcGxlVmFsdWVzW2N1cnJlbnRTYW1wbGVdIDw9IGFYOyBjdXJyZW50U2FtcGxlKyspIHtcbiAgICAgICAgICAgIGludGVydmFsU3RhcnQgKz0ga1NhbXBsZVN0ZXBTaXplO1xuICAgICAgICB9XG4gICAgICAgIGN1cnJlbnRTYW1wbGUtLTtcblxuICAgICAgICAvLyBJbnRlcnBvbGF0ZSB0byBwcm92aWRlIGFuIGluaXRpYWwgZ3Vlc3MgZm9yIHRcbiAgICAgICAgY29uc3QgZGlzdCA9IChhWCAtIHNhbXBsZVZhbHVlc1tjdXJyZW50U2FtcGxlXSkgLyAoc2FtcGxlVmFsdWVzW2N1cnJlbnRTYW1wbGUgKyAxXSAtIHNhbXBsZVZhbHVlc1tjdXJyZW50U2FtcGxlXSk7XG4gICAgICAgIGNvbnN0IGd1ZXNzRm9yVCA9IGludGVydmFsU3RhcnQgKyBkaXN0ICoga1NhbXBsZVN0ZXBTaXplO1xuXG4gICAgICAgIGNvbnN0IGluaXRpYWxTbG9wZSA9IGdldFNsb3BlKGd1ZXNzRm9yVCwgbVgxLCBtWDIpO1xuICAgICAgICBpZiAoaW5pdGlhbFNsb3BlID49IE5FV1RPTl9NSU5fU0xPUEUpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXd0b25SYXBoc29uSXRlcmF0ZShhWCwgZ3Vlc3NGb3JULCBtWDEsIG1YMik7XG4gICAgICAgIH0gZWxzZSBpZiAoaW5pdGlhbFNsb3BlID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gZ3Vlc3NGb3JUO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIGJpbmFyeVN1YmRpdmlkZShhWCwgaW50ZXJ2YWxTdGFydCwgaW50ZXJ2YWxTdGFydCArIGtTYW1wbGVTdGVwU2l6ZSwgbVgxLCBtWDIpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGZ1bmN0aW9uIEJlemllckVhc2luZyh4KSB7XG4gICAgICAgIC8vIEJlY2F1c2UgSmF2YVNjcmlwdCBudW1iZXJzIGFyZSBpbXByZWNpc2UsIHdlIHNob3VsZCBndWFyYW50ZWUgdGhlIGV4dHJlbWVzIGFyZSByaWdodFxuICAgICAgICBpZiAoeCA9PT0gMCB8fCB4ID09PSAxKSB7XG4gICAgICAgICAgICByZXR1cm4geDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBjYWxjQmV6aWVyKGdldFRGb3JYKHgpLCBtWTEsIG1ZMik7XG4gICAgfTtcbn1cbiIsIi8qKlxuICogQGF1dGhvciBwc2Nocm9lbiAvIGh0dHBzOi8vdWZvLmFpL1xuICpcbiAqIEJhc2VkIG9uIGh0dHBzOi8vZ2l0aHViLmNvbS9kYW5yby9lYXNpbmctanNcbiAqIEJhc2VkIG9uIGh0dHBzOi8vZ2l0aHViLmNvbS9DcmVhdGVKUy9Ud2VlbkpTXG4gKiBCYXNlZCBvbiBodHRwczovL2dpdGh1Yi5jb20vdHdlZW5qcy90d2Vlbi5qc1xuICogQmFzZWQgb24gaHR0cHM6Ly9lYXNpbmdzLm5ldC9cbiAqL1xuXG5pbXBvcnQgQmV6aWVyRWFzaW5nIGZyb20gJy4vQmV6aWVyRWFzaW5nLmpzJztcblxuZXhwb3J0IGNsYXNzIEVhc2luZyB7XG4gICAgc3RhdGljIGxpbmVhcih0KSB7XG4gICAgICAgIHJldHVybiB0O1xuICAgIH1cblxuICAgIHN0YXRpYyBlYXNlSW5RdWFkKHQpIHtcbiAgICAgICAgcmV0dXJuIHQgKiB0O1xuICAgIH1cblxuICAgIHN0YXRpYyBlYXNlT3V0UXVhZCh0KSB7XG4gICAgICAgIHJldHVybiB0ICogKDIgLSB0KTtcbiAgICB9XG5cbiAgICBzdGF0aWMgZWFzZUluT3V0UXVhZCh0KSB7XG4gICAgICAgIGlmICgodCAqPSAyKSA8IDEpIHtcbiAgICAgICAgICAgIHJldHVybiAwLjUgKiB0ICogdDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiAtMC41ICogKC0tdCAqICh0IC0gMikgLSAxKTtcbiAgICB9XG5cbiAgICBzdGF0aWMgZWFzZUluQ3ViaWModCkge1xuICAgICAgICByZXR1cm4gdCAqIHQgKiB0O1xuICAgIH1cblxuICAgIHN0YXRpYyBlYXNlT3V0Q3ViaWModCkge1xuICAgICAgICByZXR1cm4gLS10ICogdCAqIHQgKyAxO1xuICAgIH1cblxuICAgIHN0YXRpYyBlYXNlSW5PdXRDdWJpYyh0KSB7XG4gICAgICAgIGlmICgodCAqPSAyKSA8IDEpIHtcbiAgICAgICAgICAgIHJldHVybiAwLjUgKiB0ICogdCAqIHQ7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gMC41ICogKCh0IC09IDIpICogdCAqIHQgKyAyKTtcbiAgICB9XG5cbiAgICBzdGF0aWMgZWFzZUluUXVhcnQodCkge1xuICAgICAgICByZXR1cm4gdCAqIHQgKiB0ICogdDtcbiAgICB9XG5cbiAgICBzdGF0aWMgZWFzZU91dFF1YXJ0KHQpIHtcbiAgICAgICAgcmV0dXJuIDEgLSAtLXQgKiB0ICogdCAqIHQ7XG4gICAgfVxuXG4gICAgc3RhdGljIGVhc2VJbk91dFF1YXJ0KHQpIHtcbiAgICAgICAgaWYgKCh0ICo9IDIpIDwgMSkge1xuICAgICAgICAgICAgcmV0dXJuIDAuNSAqIHQgKiB0ICogdCAqIHQ7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gLTAuNSAqICgodCAtPSAyKSAqIHQgKiB0ICogdCAtIDIpO1xuICAgIH1cblxuICAgIHN0YXRpYyBlYXNlSW5RdWludCh0KSB7XG4gICAgICAgIHJldHVybiB0ICogdCAqIHQgKiB0ICogdDtcbiAgICB9XG5cbiAgICBzdGF0aWMgZWFzZU91dFF1aW50KHQpIHtcbiAgICAgICAgcmV0dXJuIC0tdCAqIHQgKiB0ICogdCAqIHQgKyAxO1xuICAgIH1cblxuICAgIHN0YXRpYyBlYXNlSW5PdXRRdWludCh0KSB7XG4gICAgICAgIGlmICgodCAqPSAyKSA8IDEpIHtcbiAgICAgICAgICAgIHJldHVybiAwLjUgKiB0ICogdCAqIHQgKiB0ICogdDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiAwLjUgKiAoKHQgLT0gMikgKiB0ICogdCAqIHQgKiB0ICsgMik7XG4gICAgfVxuXG4gICAgc3RhdGljIGVhc2VJblNpbmUodCkge1xuICAgICAgICByZXR1cm4gMSAtIE1hdGguc2luKCgoMSAtIHQpICogTWF0aC5QSSkgLyAyKTtcbiAgICB9XG5cbiAgICBzdGF0aWMgZWFzZU91dFNpbmUodCkge1xuICAgICAgICByZXR1cm4gTWF0aC5zaW4oKHQgKiBNYXRoLlBJKSAvIDIpO1xuICAgIH1cblxuICAgIHN0YXRpYyBlYXNlSW5PdXRTaW5lKHQpIHtcbiAgICAgICAgcmV0dXJuIDAuNSAqICgxIC0gTWF0aC5zaW4oTWF0aC5QSSAqICgwLjUgLSB0KSkpO1xuICAgIH1cblxuICAgIHN0YXRpYyBlYXNlSW5FeHBvKHQpIHtcbiAgICAgICAgcmV0dXJuIHQgPT09IDAgPyAwIDogTWF0aC5wb3coMTAyNCwgdCAtIDEpO1xuICAgIH1cblxuICAgIHN0YXRpYyBlYXNlT3V0RXhwbyh0KSB7XG4gICAgICAgIHJldHVybiB0ID09PSAxID8gMSA6IDEgLSBNYXRoLnBvdygyLCAtMTAgKiB0KTtcbiAgICB9XG5cbiAgICBzdGF0aWMgZWFzZUluT3V0RXhwbyh0KSB7XG4gICAgICAgIGlmICh0ID09PSAwIHx8IHQgPT09IDEpIHtcbiAgICAgICAgICAgIHJldHVybiB0O1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCh0ICo9IDIpIDwgMSkge1xuICAgICAgICAgICAgcmV0dXJuIDAuNSAqIE1hdGgucG93KDEwMjQsIHQgLSAxKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiAwLjUgKiAoLU1hdGgucG93KDIsIC0xMCAqICh0IC0gMSkpICsgMik7XG4gICAgfVxuXG4gICAgc3RhdGljIGVhc2VJbkNpcmModCkge1xuICAgICAgICByZXR1cm4gMSAtIE1hdGguc3FydCgxIC0gdCAqIHQpO1xuICAgIH1cblxuICAgIHN0YXRpYyBlYXNlT3V0Q2lyYyh0KSB7XG4gICAgICAgIHJldHVybiBNYXRoLnNxcnQoMSAtIC0tdCAqIHQpO1xuICAgIH1cblxuICAgIHN0YXRpYyBlYXNlSW5PdXRDaXJjKHQpIHtcbiAgICAgICAgaWYgKCh0ICo9IDIpIDwgMSkge1xuICAgICAgICAgICAgcmV0dXJuIC0wLjUgKiAoTWF0aC5zcXJ0KDEgLSB0ICogdCkgLSAxKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiAwLjUgKiAoTWF0aC5zcXJ0KDEgLSAodCAtPSAyKSAqIHQpICsgMSk7XG4gICAgfVxuXG4gICAgc3RhdGljIGVhc2VJbkJhY2sodCkge1xuICAgICAgICBjb25zdCBzID0gMS43MDE1ODtcblxuICAgICAgICByZXR1cm4gdCA9PT0gMSA/IDEgOiB0ICogdCAqICgocyArIDEpICogdCAtIHMpO1xuICAgIH1cblxuICAgIHN0YXRpYyBlYXNlT3V0QmFjayh0KSB7XG4gICAgICAgIGNvbnN0IHMgPSAxLjcwMTU4O1xuXG4gICAgICAgIHJldHVybiB0ID09PSAwID8gMCA6IC0tdCAqIHQgKiAoKHMgKyAxKSAqIHQgKyBzKSArIDE7XG4gICAgfVxuXG4gICAgc3RhdGljIGVhc2VJbk91dEJhY2sodCkge1xuICAgICAgICBjb25zdCBzID0gMS43MDE1OCAqIDEuNTI1O1xuXG4gICAgICAgIGlmICgodCAqPSAyKSA8IDEpIHtcbiAgICAgICAgICAgIHJldHVybiAwLjUgKiAodCAqIHQgKiAoKHMgKyAxKSAqIHQgLSBzKSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gMC41ICogKCh0IC09IDIpICogdCAqICgocyArIDEpICogdCArIHMpICsgMik7XG4gICAgfVxuXG4gICAgc3RhdGljIGVhc2VJbkVsYXN0aWModCwgYW1wbGl0dWRlID0gMSwgcGVyaW9kID0gMC4zKSB7XG4gICAgICAgIGlmICh0ID09PSAwIHx8IHQgPT09IDEpIHtcbiAgICAgICAgICAgIHJldHVybiB0O1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgcGkyID0gTWF0aC5QSSAqIDI7XG4gICAgICAgIGNvbnN0IHMgPSBwZXJpb2QgLyBwaTIgKiBNYXRoLmFzaW4oMSAvIGFtcGxpdHVkZSk7XG5cbiAgICAgICAgcmV0dXJuIC0oYW1wbGl0dWRlICogTWF0aC5wb3coMiwgMTAgKiAtLXQpICogTWF0aC5zaW4oKHQgLSBzKSAqIHBpMiAvIHBlcmlvZCkpO1xuICAgIH1cblxuICAgIHN0YXRpYyBlYXNlT3V0RWxhc3RpYyh0LCBhbXBsaXR1ZGUgPSAxLCBwZXJpb2QgPSAwLjMpIHtcbiAgICAgICAgaWYgKHQgPT09IDAgfHwgdCA9PT0gMSkge1xuICAgICAgICAgICAgcmV0dXJuIHQ7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBwaTIgPSBNYXRoLlBJICogMjtcbiAgICAgICAgY29uc3QgcyA9IHBlcmlvZCAvIHBpMiAqIE1hdGguYXNpbigxIC8gYW1wbGl0dWRlKTtcblxuICAgICAgICByZXR1cm4gYW1wbGl0dWRlICogTWF0aC5wb3coMiwgLTEwICogdCkgKiBNYXRoLnNpbigodCAtIHMpICogcGkyIC8gcGVyaW9kKSArIDE7XG4gICAgfVxuXG4gICAgc3RhdGljIGVhc2VJbk91dEVsYXN0aWModCwgYW1wbGl0dWRlID0gMSwgcGVyaW9kID0gMC4zICogMS41KSB7XG4gICAgICAgIGlmICh0ID09PSAwIHx8IHQgPT09IDEpIHtcbiAgICAgICAgICAgIHJldHVybiB0O1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgcGkyID0gTWF0aC5QSSAqIDI7XG4gICAgICAgIGNvbnN0IHMgPSBwZXJpb2QgLyBwaTIgKiBNYXRoLmFzaW4oMSAvIGFtcGxpdHVkZSk7XG5cbiAgICAgICAgaWYgKCh0ICo9IDIpIDwgMSkge1xuICAgICAgICAgICAgcmV0dXJuIC0wLjUgKiAoYW1wbGl0dWRlICogTWF0aC5wb3coMiwgMTAgKiAtLXQpICogTWF0aC5zaW4oKHQgLSBzKSAqIHBpMiAvIHBlcmlvZCkpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGFtcGxpdHVkZSAqIE1hdGgucG93KDIsIC0xMCAqIC0tdCkgKiBNYXRoLnNpbigodCAtIHMpICogcGkyIC8gcGVyaW9kKSAqIDAuNSArIDE7XG4gICAgfVxuXG4gICAgc3RhdGljIGVhc2VJbkJvdW5jZSh0KSB7XG4gICAgICAgIHJldHVybiAxIC0gdGhpcy5lYXNlT3V0Qm91bmNlKDEgLSB0KTtcbiAgICB9XG5cbiAgICBzdGF0aWMgZWFzZU91dEJvdW5jZSh0KSB7XG4gICAgICAgIGNvbnN0IG4xID0gNy41NjI1O1xuICAgICAgICBjb25zdCBkMSA9IDIuNzU7XG5cbiAgICAgICAgaWYgKHQgPCAxIC8gZDEpIHtcbiAgICAgICAgICAgIHJldHVybiBuMSAqIHQgKiB0O1xuICAgICAgICB9IGVsc2UgaWYgKHQgPCAyIC8gZDEpIHtcbiAgICAgICAgICAgIHJldHVybiBuMSAqICh0IC09IDEuNSAvIGQxKSAqIHQgKyAwLjc1O1xuICAgICAgICB9IGVsc2UgaWYgKHQgPCAyLjUgLyBkMSkge1xuICAgICAgICAgICAgcmV0dXJuIG4xICogKHQgLT0gMi4yNSAvIGQxKSAqIHQgKyAwLjkzNzU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gbjEgKiAodCAtPSAyLjYyNSAvIGQxKSAqIHQgKyAwLjk4NDM3NTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHN0YXRpYyBlYXNlSW5PdXRCb3VuY2UodCkge1xuICAgICAgICBpZiAodCA8IDAuNSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZWFzZUluQm91bmNlKHQgKiAyKSAqIDAuNTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzLmVhc2VPdXRCb3VuY2UodCAqIDIgLSAxKSAqIDAuNSArIDAuNTtcbiAgICB9XG5cbiAgICBzdGF0aWMgYWRkQmV6aWVyKG5hbWUsIG1YMSwgbVkxLCBtWDIsIG1ZMikge1xuICAgICAgICB0aGlzW25hbWVdID0gQmV6aWVyRWFzaW5nKG1YMSwgbVkxLCBtWDIsIG1ZMik7XG4gICAgfVxufVxuIiwiLyoqXG4gKiBAYXV0aG9yIHBzY2hyb2VuIC8gaHR0cHM6Ly91Zm8uYWkvXG4gKi9cblxudmFyIFJlcXVlc3RGcmFtZTtcbnZhciBDYW5jZWxGcmFtZTtcblxuaWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgUmVxdWVzdEZyYW1lID0gd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZTtcbiAgICBDYW5jZWxGcmFtZSA9IHdpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZTtcbn0gZWxzZSB7XG4gICAgY29uc3Qgc3RhcnRUaW1lID0gcGVyZm9ybWFuY2Uubm93KCk7XG4gICAgY29uc3QgdGltZXN0ZXAgPSAxMDAwIC8gNjA7XG5cbiAgICBSZXF1ZXN0RnJhbWUgPSBjYWxsYmFjayA9PiB7XG4gICAgICAgIHJldHVybiBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgIGNhbGxiYWNrKHBlcmZvcm1hbmNlLm5vdygpIC0gc3RhcnRUaW1lKTtcbiAgICAgICAgfSwgdGltZXN0ZXApO1xuICAgIH07XG5cbiAgICBDYW5jZWxGcmFtZSA9IGNsZWFyVGltZW91dDtcbn1cblxuZXhwb3J0IGNsYXNzIFRpY2tlciB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuY2FsbGJhY2tzID0gW107XG4gICAgICAgIHRoaXMubGFzdCA9IHBlcmZvcm1hbmNlLm5vdygpO1xuICAgICAgICB0aGlzLnRpbWUgPSAwO1xuICAgICAgICB0aGlzLmRlbHRhID0gMDtcbiAgICAgICAgdGhpcy5mcmFtZSA9IDA7XG4gICAgICAgIHRoaXMuaXNBbmltYXRpbmcgPSBmYWxzZTtcbiAgICB9XG5cbiAgICBvblRpY2sgPSB0aW1lID0+IHtcbiAgICAgICAgaWYgKHRoaXMuaXNBbmltYXRpbmcpIHtcbiAgICAgICAgICAgIHRoaXMucmVxdWVzdElkID0gUmVxdWVzdEZyYW1lKHRoaXMub25UaWNrKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuZGVsdGEgPSBNYXRoLm1pbigxNTAsIHRpbWUgLSB0aGlzLmxhc3QpO1xuICAgICAgICB0aGlzLmxhc3QgPSB0aW1lO1xuICAgICAgICB0aGlzLnRpbWUgPSB0aW1lICogMC4wMDE7XG4gICAgICAgIHRoaXMuZnJhbWUrKztcblxuICAgICAgICBmb3IgKGxldCBpID0gdGhpcy5jYWxsYmFja3MubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgICAgIGNvbnN0IGNhbGxiYWNrID0gdGhpcy5jYWxsYmFja3NbaV07XG5cbiAgICAgICAgICAgIGlmICghY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGNhbGxiYWNrLmZwcykge1xuICAgICAgICAgICAgICAgIGNvbnN0IGRlbHRhID0gdGltZSAtIGNhbGxiYWNrLmxhc3Q7XG5cbiAgICAgICAgICAgICAgICBpZiAoZGVsdGEgPCAxMDAwIC8gY2FsbGJhY2suZnBzKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGNhbGxiYWNrLmxhc3QgPSB0aW1lO1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrLmZyYW1lKys7XG5cbiAgICAgICAgICAgICAgICBjYWxsYmFjayh0aGlzLnRpbWUsIGRlbHRhLCBjYWxsYmFjay5mcmFtZSk7XG5cbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY2FsbGJhY2sodGhpcy50aW1lLCB0aGlzLmRlbHRhLCB0aGlzLmZyYW1lKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBhZGQoY2FsbGJhY2ssIGZwcykge1xuICAgICAgICBpZiAoZnBzKSB7XG4gICAgICAgICAgICBjYWxsYmFjay5mcHMgPSBmcHM7XG4gICAgICAgICAgICBjYWxsYmFjay5sYXN0ID0gcGVyZm9ybWFuY2Uubm93KCk7XG4gICAgICAgICAgICBjYWxsYmFjay5mcmFtZSA9IDA7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmNhbGxiYWNrcy51bnNoaWZ0KGNhbGxiYWNrKTtcbiAgICB9XG5cbiAgICByZW1vdmUoY2FsbGJhY2spIHtcbiAgICAgICAgY29uc3QgaW5kZXggPSB0aGlzLmNhbGxiYWNrcy5pbmRleE9mKGNhbGxiYWNrKTtcblxuICAgICAgICBpZiAofmluZGV4KSB7XG4gICAgICAgICAgICB0aGlzLmNhbGxiYWNrcy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgc3RhcnQoKSB7XG4gICAgICAgIGlmICh0aGlzLmlzQW5pbWF0aW5nKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmlzQW5pbWF0aW5nID0gdHJ1ZTtcblxuICAgICAgICB0aGlzLnJlcXVlc3RJZCA9IFJlcXVlc3RGcmFtZSh0aGlzLm9uVGljayk7XG4gICAgfVxuXG4gICAgc3RvcCgpIHtcbiAgICAgICAgaWYgKCF0aGlzLmlzQW5pbWF0aW5nKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmlzQW5pbWF0aW5nID0gZmFsc2U7XG5cbiAgICAgICAgQ2FuY2VsRnJhbWUodGhpcy5yZXF1ZXN0SWQpO1xuICAgIH1cblxuICAgIHNldFJlcXVlc3RGcmFtZShyZXF1ZXN0KSB7XG4gICAgICAgIFJlcXVlc3RGcmFtZSA9IHJlcXVlc3Q7XG4gICAgfVxuXG4gICAgc2V0Q2FuY2VsRnJhbWUoY2FuY2VsKSB7XG4gICAgICAgIENhbmNlbEZyYW1lID0gY2FuY2VsO1xuICAgIH1cbn1cblxuZXhwb3J0IGNvbnN0IHRpY2tlciA9IG5ldyBUaWNrZXIoKTtcbiIsIi8qKlxuICogQGF1dGhvciBwc2Nocm9lbiAvIGh0dHBzOi8vdWZvLmFpL1xuICovXG5cbmltcG9ydCB7IEVhc2luZyB9IGZyb20gJy4vRWFzaW5nLmpzJztcblxuaW1wb3J0IHsgdGlja2VyIH0gZnJvbSAnLi9UaWNrZXIuanMnO1xuXG5jb25zdCBUd2VlbnMgPSBbXTtcblxuZXhwb3J0IGNsYXNzIFR3ZWVuIHtcbiAgICBjb25zdHJ1Y3RvcihvYmplY3QsIHByb3BzLCBkdXJhdGlvbiwgZWFzZSwgZGVsYXkgPSAwLCBjb21wbGV0ZSwgdXBkYXRlKSB7XG4gICAgICAgIGlmICh0eXBlb2YgZGVsYXkgIT09ICdudW1iZXInKSB7XG4gICAgICAgICAgICB1cGRhdGUgPSBjb21wbGV0ZTtcbiAgICAgICAgICAgIGNvbXBsZXRlID0gZGVsYXk7XG4gICAgICAgICAgICBkZWxheSA9IDA7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLm9iamVjdCA9IG9iamVjdDtcbiAgICAgICAgdGhpcy5kdXJhdGlvbiA9IGR1cmF0aW9uO1xuICAgICAgICB0aGlzLmVsYXBzZWQgPSAwO1xuICAgICAgICB0aGlzLmVhc2UgPSB0eXBlb2YgZWFzZSA9PT0gJ2Z1bmN0aW9uJyA/IGVhc2UgOiBFYXNpbmdbZWFzZV0gfHwgRWFzaW5nWydlYXNlT3V0Q3ViaWMnXTtcbiAgICAgICAgdGhpcy5kZWxheSA9IGRlbGF5O1xuICAgICAgICB0aGlzLmNvbXBsZXRlID0gY29tcGxldGU7XG4gICAgICAgIHRoaXMudXBkYXRlID0gdXBkYXRlO1xuICAgICAgICB0aGlzLmlzQW5pbWF0aW5nID0gZmFsc2U7XG5cbiAgICAgICAgdGhpcy5mcm9tID0ge307XG4gICAgICAgIHRoaXMudG8gPSBPYmplY3QuYXNzaWduKHt9LCBwcm9wcyk7XG5cbiAgICAgICAgdGhpcy5zcHJpbmcgPSB0aGlzLnRvLnNwcmluZztcbiAgICAgICAgdGhpcy5kYW1waW5nID0gdGhpcy50by5kYW1waW5nO1xuXG4gICAgICAgIGRlbGV0ZSB0aGlzLnRvLnNwcmluZztcbiAgICAgICAgZGVsZXRlIHRoaXMudG8uZGFtcGluZztcblxuICAgICAgICBmb3IgKGNvbnN0IHByb3AgaW4gdGhpcy50bykge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiB0aGlzLnRvW3Byb3BdID09PSAnbnVtYmVyJyAmJiB0eXBlb2Ygb2JqZWN0W3Byb3BdID09PSAnbnVtYmVyJykge1xuICAgICAgICAgICAgICAgIHRoaXMuZnJvbVtwcm9wXSA9IG9iamVjdFtwcm9wXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuc3RhcnQoKTtcbiAgICB9XG5cbiAgICBvblVwZGF0ZSA9ICh0aW1lLCBkZWx0YSkgPT4ge1xuICAgICAgICB0aGlzLmVsYXBzZWQgKz0gZGVsdGE7XG5cbiAgICAgICAgY29uc3QgcHJvZ3Jlc3MgPSBNYXRoLm1heCgwLCBNYXRoLm1pbigxLCAodGhpcy5lbGFwc2VkIC0gdGhpcy5kZWxheSkgLyB0aGlzLmR1cmF0aW9uKSk7XG4gICAgICAgIGNvbnN0IGFscGhhID0gdGhpcy5lYXNlKHByb2dyZXNzLCB0aGlzLnNwcmluZywgdGhpcy5kYW1waW5nKTtcblxuICAgICAgICBmb3IgKGNvbnN0IHByb3AgaW4gdGhpcy5mcm9tKSB7XG4gICAgICAgICAgICB0aGlzLm9iamVjdFtwcm9wXSA9IHRoaXMuZnJvbVtwcm9wXSArICh0aGlzLnRvW3Byb3BdIC0gdGhpcy5mcm9tW3Byb3BdKSAqIGFscGhhO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMudXBkYXRlKSB7XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHByb2dyZXNzID09PSAxKSB7XG4gICAgICAgICAgICBjbGVhclR3ZWVuKHRoaXMpO1xuXG4gICAgICAgICAgICBpZiAodGhpcy5jb21wbGV0ZSkge1xuICAgICAgICAgICAgICAgIHRoaXMuY29tcGxldGUoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBzdGFydCgpIHtcbiAgICAgICAgaWYgKHRoaXMuaXNBbmltYXRpbmcpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuaXNBbmltYXRpbmcgPSB0cnVlO1xuXG4gICAgICAgIHRpY2tlci5hZGQodGhpcy5vblVwZGF0ZSk7XG4gICAgfVxuXG4gICAgc3RvcCgpIHtcbiAgICAgICAgaWYgKCF0aGlzLmlzQW5pbWF0aW5nKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmlzQW5pbWF0aW5nID0gZmFsc2U7XG5cbiAgICAgICAgdGlja2VyLnJlbW92ZSh0aGlzLm9uVXBkYXRlKTtcbiAgICB9XG59XG5cbi8qKlxuICogRGVmZXJzIGEgZnVuY3Rpb24gYnkgdGhlIHNwZWNpZmllZCBkdXJhdGlvbi5cbiAqXG4gKiBAZXhwb3J0XG4gKiBAcGFyYW0ge251bWJlcn0gZHVyYXRpb24gVGltZSB0byB3YWl0IGluIG1pbGxpc2Vjb25kcy5cbiAqIEBwYXJhbSB7ZnVuY3Rpb259IGNvbXBsZXRlIENhbGxiYWNrIGZ1bmN0aW9uLlxuICogQHJldHVybnMge1R3ZWVufVxuICogQGV4YW1wbGVcbiAqIGRlbGF5ZWRDYWxsKDUwMCwgYW5pbWF0ZUluKTtcbiAqIEBleGFtcGxlXG4gKiBkZWxheWVkQ2FsbCg1MDAsICgpID0+IGFuaW1hdGVJbihkZWxheSkpO1xuICogQGV4YW1wbGVcbiAqIHRpbWVvdXQgPSBkZWxheWVkQ2FsbCg1MDAsICgpID0+IGFuaW1hdGVJbihkZWxheSkpO1xuICovXG5leHBvcnQgZnVuY3Rpb24gZGVsYXllZENhbGwoZHVyYXRpb24sIGNvbXBsZXRlKSB7XG4gICAgY29uc3QgdHdlZW4gPSBuZXcgVHdlZW4oY29tcGxldGUsIG51bGwsIGR1cmF0aW9uLCAnbGluZWFyJywgMCwgY29tcGxldGUpO1xuXG4gICAgVHdlZW5zLnB1c2godHdlZW4pO1xuXG4gICAgcmV0dXJuIHR3ZWVuO1xufVxuXG4vKipcbiAqIERlZmVycyBieSB0aGUgc3BlY2lmaWVkIGR1cmF0aW9uLlxuICpcbiAqIEBleHBvcnRcbiAqIEBwYXJhbSB7bnVtYmVyfSBbZHVyYXRpb249MF0gVGltZSB0byB3YWl0IGluIG1pbGxpc2Vjb25kcy5cbiAqIEByZXR1cm5zIHtQcm9taXNlfVxuICogQGV4YW1wbGVcbiAqIGF3YWl0IHdhaXQoMjUwKTtcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHdhaXQoZHVyYXRpb24gPSAwKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKHJlc29sdmUgPT4gZGVsYXllZENhbGwoZHVyYXRpb24sIHJlc29sdmUpKTtcbn1cblxuLyoqXG4gKiBEZWZlcnMgdG8gdGhlIG5leHQgdGljay5cbiAqXG4gKiBAZXhwb3J0XG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBbY29tcGxldGVdIENhbGxiYWNrIGZ1bmN0aW9uLlxuICogQHJldHVybnMge1Byb21pc2V9XG4gKiBAZXhhbXBsZVxuICogZGVmZXIocmVzaXplKTtcbiAqIEBleGFtcGxlXG4gKiBkZWZlcigoKSA9PiByZXNpemUoKSk7XG4gKiBAZXhhbXBsZVxuICogYXdhaXQgZGVmZXIoKTtcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRlZmVyKGNvbXBsZXRlKSB7XG4gICAgY29uc3QgcHJvbWlzZSA9IG5ldyBQcm9taXNlKHJlc29sdmUgPT4gZGVsYXllZENhbGwoMCwgcmVzb2x2ZSkpO1xuXG4gICAgaWYgKGNvbXBsZXRlKSB7XG4gICAgICAgIHByb21pc2UudGhlbihjb21wbGV0ZSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHByb21pc2U7XG59XG5cbi8qKlxuICogVHdlZW4gdGhhdCBhbmltYXRlcyB0byB0aGUgc3BlY2lmaWVkIGRlc3RpbmF0aW9uIHByb3BlcnRpZXMuXG4gKlxuICogU2VlIHRoZSBFYXNpbmcgRnVuY3Rpb25zIENoZWF0IFNoZWV0IGZvciBleGFtcGxlcyBieSBuYW1lLlxuICogaHR0cHM6Ly9lYXNpbmdzLm5ldC9cbiAqXG4gKiBAZXhwb3J0XG4gKiBAcGFyYW0ge29iamVjdH0gb2JqZWN0IFRhcmdldCBvYmplY3QuXG4gKiBAcGFyYW0ge29iamVjdH0gcHJvcHMgVHdlZW4gcHJvcGVydGllcy5cbiAqIEBwYXJhbSB7bnVtYmVyfSBkdXJhdGlvbiBUaW1lIGluIG1pbGxpc2Vjb25kcy5cbiAqIEBwYXJhbSB7c3RyaW5nfGZ1bmN0aW9ufSBlYXNlIEVhc2Ugc3RyaW5nIG9yIGZ1bmN0aW9uLlxuICogQHBhcmFtIHtudW1iZXJ9IFtkZWxheT0wXSBUaW1lIHRvIHdhaXQgaW4gbWlsbGlzZWNvbmRzLlxuICogQHBhcmFtIHtmdW5jdGlvbn0gW2NvbXBsZXRlXSBDYWxsYmFjayBmdW5jdGlvbiB3aGVuIHRoZSBhbmltYXRpb24gaGFzIGNvbXBsZXRlZC5cbiAqIEBwYXJhbSB7ZnVuY3Rpb259IFt1cGRhdGVdIENhbGxiYWNrIGZ1bmN0aW9uIGV2ZXJ5IHRpbWUgdGhlIGFuaW1hdGlvbiB1cGRhdGVzLlxuICogQHJldHVybnMge1Byb21pc2V9XG4gKiBAZXhhbXBsZVxuICogdHdlZW4oZGF0YSwgeyB2YWx1ZTogMC4zIH0sIDEwMDAsICdsaW5lYXInKTtcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHR3ZWVuKG9iamVjdCwgcHJvcHMsIGR1cmF0aW9uLCBlYXNlLCBkZWxheSA9IDAsIGNvbXBsZXRlLCB1cGRhdGUpIHtcbiAgICBpZiAodHlwZW9mIGRlbGF5ICE9PSAnbnVtYmVyJykge1xuICAgICAgICB1cGRhdGUgPSBjb21wbGV0ZTtcbiAgICAgICAgY29tcGxldGUgPSBkZWxheTtcbiAgICAgICAgZGVsYXkgPSAwO1xuICAgIH1cblxuICAgIGNvbnN0IHByb21pc2UgPSBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHtcbiAgICAgICAgY29uc3QgdHdlZW4gPSBuZXcgVHdlZW4ob2JqZWN0LCBwcm9wcywgZHVyYXRpb24sIGVhc2UsIGRlbGF5LCByZXNvbHZlLCB1cGRhdGUpO1xuXG4gICAgICAgIFR3ZWVucy5wdXNoKHR3ZWVuKTtcbiAgICB9KTtcblxuICAgIGlmIChjb21wbGV0ZSkge1xuICAgICAgICBwcm9taXNlLnRoZW4oY29tcGxldGUpO1xuICAgIH1cblxuICAgIHJldHVybiBwcm9taXNlO1xufVxuXG4vKipcbiAqIEltbWVkaWF0ZWx5IGNsZWFycyBhbGwgZGVsYXllZENhbGxzIGFuZCB0d2VlbnMgb2YgdGhlIHNwZWNpZmllZCBvYmplY3QuXG4gKlxuICogQGV4cG9ydFxuICogQHBhcmFtIHtvYmplY3R9IG9iamVjdCBUYXJnZXQgb2JqZWN0LlxuICogQHJldHVybnMge3ZvaWR9XG4gKiBAZXhhbXBsZVxuICogZGVsYXllZENhbGwoNTAwLCBhbmltYXRlSW4pO1xuICogY2xlYXJUd2VlbihhbmltYXRlSW4pO1xuICogQGV4YW1wbGVcbiAqIGNsZWFyVHdlZW4odGltZW91dCk7XG4gKiB0aW1lb3V0ID0gZGVsYXllZENhbGwoNTAwLCAoKSA9PiBhbmltYXRlSW4oKSk7XG4gKiBAZXhhbXBsZVxuICogdHdlZW4oZGF0YSwgeyB2YWx1ZTogMC4zIH0sIDEwMDAsICdsaW5lYXInKTtcbiAqIGNsZWFyVHdlZW4oZGF0YSk7XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjbGVhclR3ZWVuKG9iamVjdCkge1xuICAgIGlmIChvYmplY3QgaW5zdGFuY2VvZiBUd2Vlbikge1xuICAgICAgICBvYmplY3Quc3RvcCgpO1xuXG4gICAgICAgIGNvbnN0IGluZGV4ID0gVHdlZW5zLmluZGV4T2Yob2JqZWN0KTtcblxuICAgICAgICBpZiAofmluZGV4KSB7XG4gICAgICAgICAgICBUd2VlbnMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAgIGZvciAobGV0IGkgPSBUd2VlbnMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgICAgIGlmIChUd2VlbnNbaV0ub2JqZWN0ID09PSBvYmplY3QpIHtcbiAgICAgICAgICAgICAgICBjbGVhclR3ZWVuKFR3ZWVuc1tpXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59XG4iLCIvKipcbiAqIEBhdXRob3IgcHNjaHJvZW4gLyBodHRwczovL3Vmby5haS9cbiAqL1xuXG5pbXBvcnQgeyBBc3NldHMgfSBmcm9tICcuLi9sb2FkZXJzL0Fzc2V0cy5qcyc7XG5pbXBvcnQgeyBFdmVudEVtaXR0ZXIgfSBmcm9tICcuL0V2ZW50RW1pdHRlci5qcyc7XG5cbmltcG9ydCB7IGNsZWFyVHdlZW4sIGRlbGF5ZWRDYWxsLCB0d2VlbiB9IGZyb20gJy4uL3R3ZWVuL1R3ZWVuLmpzJztcblxuLy8gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQ1NTL3RyYW5zZm9ybVxuLy8gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQ1NTL2ZpbHRlclxuY29uc3QgVHJhbnNmb3JtcyA9IFsneCcsICd5JywgJ3onLCAnc2tld1gnLCAnc2tld1knLCAncm90YXRpb24nLCAncm90YXRpb25YJywgJ3JvdGF0aW9uWScsICdyb3RhdGlvblonLCAnc2NhbGUnLCAnc2NhbGVYJywgJ3NjYWxlWScsICdzY2FsZVonXTtcbmNvbnN0IEZpbHRlcnMgPSBbJ2JsdXInLCAnYnJpZ2h0bmVzcycsICdjb250cmFzdCcsICdncmF5c2NhbGUnLCAnaHVlJywgJ2ludmVydCcsICdzYXR1cmF0ZScsICdzZXBpYSddO1xuY29uc3QgTnVtZXJpYyA9IFsnb3BhY2l0eScsICd6SW5kZXgnLCAnZm9udFdlaWdodCcsICdzdHJva2VXaWR0aCcsICdzdHJva2VEYXNob2Zmc2V0JywgJ3N0b3BPcGFjaXR5J107XG5jb25zdCBMYWN1bmExID0gWydvcGFjaXR5JywgJ2JyaWdodG5lc3MnLCAnY29udHJhc3QnLCAnc2F0dXJhdGUnLCAnc2NhbGUnLCAnc3RvcE9wYWNpdHknXTtcblxuZXhwb3J0IGNsYXNzIEludGVyZmFjZSB7XG4gICAgY29uc3RydWN0b3IobmFtZSwgdHlwZSA9ICdkaXYnLCBxdWFsaWZpZWROYW1lKSB7XG4gICAgICAgIHRoaXMuZXZlbnRzID0gbmV3IEV2ZW50RW1pdHRlcigpO1xuICAgICAgICB0aGlzLmNoaWxkcmVuID0gW107XG4gICAgICAgIHRoaXMudGltZW91dHMgPSBbXTtcbiAgICAgICAgdGhpcy5zdHlsZSA9IHt9O1xuICAgICAgICB0aGlzLmlzVHJhbnNmb3JtID0gZmFsc2U7XG4gICAgICAgIHRoaXMuaXNGaWx0ZXIgPSBmYWxzZTtcblxuICAgICAgICBpZiAodHlwZW9mIG5hbWUgPT09ICdvYmplY3QnICYmIG5hbWUgIT09IG51bGwpIHtcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudCA9IG5hbWU7XG4gICAgICAgIH0gZWxzZSBpZiAodHlwZSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgICAgICAgICAgIHRoaXMudHlwZSA9IHR5cGU7XG5cbiAgICAgICAgICAgIGlmICh0eXBlID09PSAnc3ZnJykge1xuICAgICAgICAgICAgICAgIHRoaXMuZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUygnaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnLCBxdWFsaWZpZWROYW1lIHx8ICdzdmcnKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5lbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCh0eXBlKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHR5cGVvZiBuYW1lID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgIGlmIChuYW1lLnN0YXJ0c1dpdGgoJy4nKSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmVsZW1lbnQuY2xhc3NOYW1lID0gbmFtZS5zbGljZSgxKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmVsZW1lbnQuaWQgPSBuYW1lO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIGFkZChjaGlsZCkge1xuICAgICAgICBpZiAoIXRoaXMuY2hpbGRyZW4pIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuY2hpbGRyZW4ucHVzaChjaGlsZCk7XG5cbiAgICAgICAgY2hpbGQucGFyZW50ID0gdGhpcztcblxuICAgICAgICBpZiAoY2hpbGQuZWxlbWVudCkge1xuICAgICAgICAgICAgdGhpcy5lbGVtZW50LmFwcGVuZENoaWxkKGNoaWxkLmVsZW1lbnQpO1xuICAgICAgICB9IGVsc2UgaWYgKGNoaWxkLm5vZGVOYW1lKSB7XG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQuYXBwZW5kQ2hpbGQoY2hpbGQpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGNoaWxkO1xuICAgIH1cblxuICAgIHJlbW92ZShjaGlsZCkge1xuICAgICAgICBpZiAoIXRoaXMuY2hpbGRyZW4pIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChjaGlsZC5lbGVtZW50KSB7XG4gICAgICAgICAgICBjaGlsZC5lbGVtZW50LnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoY2hpbGQuZWxlbWVudCk7XG4gICAgICAgIH0gZWxzZSBpZiAoY2hpbGQubm9kZU5hbWUpIHtcbiAgICAgICAgICAgIGNoaWxkLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoY2hpbGQpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgaW5kZXggPSB0aGlzLmNoaWxkcmVuLmluZGV4T2YoY2hpbGQpO1xuXG4gICAgICAgIGlmICh+aW5kZXgpIHtcbiAgICAgICAgICAgIHRoaXMuY2hpbGRyZW4uc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGNsb25lKCkge1xuICAgICAgICBpZiAoIXRoaXMuZWxlbWVudCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG5ldyBJbnRlcmZhY2UodGhpcy5lbGVtZW50LmNsb25lTm9kZSh0cnVlKSk7XG4gICAgfVxuXG4gICAgZW1wdHkoKSB7XG4gICAgICAgIGlmICghdGhpcy5lbGVtZW50KSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBmb3IgKGxldCBpID0gdGhpcy5jaGlsZHJlbi5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgICAgICAgaWYgKHRoaXMuY2hpbGRyZW5baV0gJiYgdGhpcy5jaGlsZHJlbltpXS5kZXN0cm95KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jaGlsZHJlbltpXS5kZXN0cm95KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmNoaWxkcmVuLmxlbmd0aCA9IDA7XG5cbiAgICAgICAgdGhpcy5lbGVtZW50LmlubmVySFRNTCA9ICcnO1xuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIGF0dHIocHJvcHMpIHtcbiAgICAgICAgaWYgKCF0aGlzLmVsZW1lbnQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAoY29uc3Qga2V5IGluIHByb3BzKSB7XG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQuc2V0QXR0cmlidXRlKGtleSwgcHJvcHNba2V5XSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBjc3MocHJvcHMpIHtcbiAgICAgICAgaWYgKCF0aGlzLmVsZW1lbnQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHN0eWxlID0gdGhpcy5zdHlsZTtcblxuICAgICAgICBmb3IgKGNvbnN0IGtleSBpbiBwcm9wcykge1xuICAgICAgICAgICAgaWYgKH5UcmFuc2Zvcm1zLmluZGV4T2Yoa2V5KSkge1xuICAgICAgICAgICAgICAgIHN0eWxlW2tleV0gPSBwcm9wc1trZXldO1xuICAgICAgICAgICAgICAgIHRoaXMuaXNUcmFuc2Zvcm0gPSB0cnVlO1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAofkZpbHRlcnMuaW5kZXhPZihrZXkpKSB7XG4gICAgICAgICAgICAgICAgc3R5bGVba2V5XSA9IHByb3BzW2tleV07XG4gICAgICAgICAgICAgICAgdGhpcy5pc0ZpbHRlciA9IHRydWU7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGxldCB2YWw7XG5cbiAgICAgICAgICAgIGlmICh+TnVtZXJpYy5pbmRleE9mKGtleSkpIHtcbiAgICAgICAgICAgICAgICB2YWwgPSBwcm9wc1trZXldO1xuICAgICAgICAgICAgICAgIHN0eWxlW2tleV0gPSB2YWw7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHZhbCA9IHR5cGVvZiBwcm9wc1trZXldICE9PSAnc3RyaW5nJyA/IHByb3BzW2tleV0gKyAncHgnIDogcHJvcHNba2V5XTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5lbGVtZW50LnN0eWxlW2tleV0gPSB2YWw7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5pc1RyYW5zZm9ybSkge1xuICAgICAgICAgICAgbGV0IHRyYW5zZm9ybSA9ICcnO1xuXG4gICAgICAgICAgICBpZiAodHlwZW9mIHN0eWxlLnggIT09ICd1bmRlZmluZWQnIHx8IHR5cGVvZiBzdHlsZS55ICE9PSAndW5kZWZpbmVkJyB8fCB0eXBlb2Ygc3R5bGUueiAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICBjb25zdCB4ID0gdHlwZW9mIHN0eWxlLnggIT09ICd1bmRlZmluZWQnID8gc3R5bGUueCA6IDA7XG4gICAgICAgICAgICAgICAgY29uc3QgeSA9IHR5cGVvZiBzdHlsZS55ICE9PSAndW5kZWZpbmVkJyA/IHN0eWxlLnkgOiAwO1xuICAgICAgICAgICAgICAgIGNvbnN0IHogPSB0eXBlb2Ygc3R5bGUueiAhPT0gJ3VuZGVmaW5lZCcgPyBzdHlsZS56IDogMDtcblxuICAgICAgICAgICAgICAgIHRyYW5zZm9ybSArPSBgdHJhbnNsYXRlM2QoJHt4fXB4LCAke3l9cHgsICR7en1weClgO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodHlwZW9mIHN0eWxlLnNrZXdYICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgIHRyYW5zZm9ybSArPSBgc2tld1goJHtzdHlsZS5za2V3WH1kZWcpYDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHR5cGVvZiBzdHlsZS5za2V3WSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICB0cmFuc2Zvcm0gKz0gYHNrZXdZKCR7c3R5bGUuc2tld1l9ZGVnKWA7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0eXBlb2Ygc3R5bGUucm90YXRpb24gIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgdHJhbnNmb3JtICs9IGByb3RhdGUoJHtzdHlsZS5yb3RhdGlvbn1kZWcpYDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHR5cGVvZiBzdHlsZS5yb3RhdGlvblggIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgdHJhbnNmb3JtICs9IGByb3RhdGVYKCR7c3R5bGUucm90YXRpb25YfWRlZylgO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodHlwZW9mIHN0eWxlLnJvdGF0aW9uWSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICB0cmFuc2Zvcm0gKz0gYHJvdGF0ZVkoJHtzdHlsZS5yb3RhdGlvbll9ZGVnKWA7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0eXBlb2Ygc3R5bGUucm90YXRpb25aICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgIHRyYW5zZm9ybSArPSBgcm90YXRlWigke3N0eWxlLnJvdGF0aW9uWn1kZWcpYDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHR5cGVvZiBzdHlsZS5zY2FsZSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICB0cmFuc2Zvcm0gKz0gYHNjYWxlKCR7c3R5bGUuc2NhbGV9KWA7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0eXBlb2Ygc3R5bGUuc2NhbGVYICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgIHRyYW5zZm9ybSArPSBgc2NhbGVYKCR7c3R5bGUuc2NhbGVYfSlgO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodHlwZW9mIHN0eWxlLnNjYWxlWSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICB0cmFuc2Zvcm0gKz0gYHNjYWxlWSgke3N0eWxlLnNjYWxlWX0pYDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHR5cGVvZiBzdHlsZS5zY2FsZVogIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgdHJhbnNmb3JtICs9IGBzY2FsZVooJHtzdHlsZS5zY2FsZVp9KWA7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5zdHlsZS50cmFuc2Zvcm0gPSB0cmFuc2Zvcm07XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5pc0ZpbHRlcikge1xuICAgICAgICAgICAgbGV0IGZpbHRlciA9ICcnO1xuXG4gICAgICAgICAgICBpZiAodHlwZW9mIHN0eWxlLmJsdXIgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgZmlsdGVyICs9IGBibHVyKCR7c3R5bGUuYmx1cn1weClgO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodHlwZW9mIHN0eWxlLmJyaWdodG5lc3MgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgZmlsdGVyICs9IGBicmlnaHRuZXNzKCR7c3R5bGUuYnJpZ2h0bmVzc30pYDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHR5cGVvZiBzdHlsZS5jb250cmFzdCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICBmaWx0ZXIgKz0gYGNvbnRyYXN0KCR7c3R5bGUuY29udHJhc3R9KWA7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0eXBlb2Ygc3R5bGUuZ3JheXNjYWxlICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgIGZpbHRlciArPSBgZ3JheXNjYWxlKCR7c3R5bGUuZ3JheXNjYWxlfSlgO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodHlwZW9mIHN0eWxlLmh1ZSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICBmaWx0ZXIgKz0gYGh1ZS1yb3RhdGUoJHtzdHlsZS5odWV9ZGVnKWA7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0eXBlb2Ygc3R5bGUuaW52ZXJ0ICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgIGZpbHRlciArPSBgaW52ZXJ0KCR7c3R5bGUuaW52ZXJ0fSlgO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodHlwZW9mIHN0eWxlLnNhdHVyYXRlICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgIGZpbHRlciArPSBgc2F0dXJhdGUoJHtzdHlsZS5zYXR1cmF0ZX0pYDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHR5cGVvZiBzdHlsZS5zZXBpYSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICBmaWx0ZXIgKz0gYHNlcGlhKCR7c3R5bGUuc2VwaWF9KWA7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5zdHlsZS5maWx0ZXIgPSBmaWx0ZXI7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICB0d2Vlbihwcm9wcywgZHVyYXRpb24sIGVhc2UsIGRlbGF5ID0gMCwgY29tcGxldGUsIHVwZGF0ZSkge1xuICAgICAgICBpZiAoIXRoaXMuZWxlbWVudCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHR5cGVvZiBkZWxheSAhPT0gJ251bWJlcicpIHtcbiAgICAgICAgICAgIHVwZGF0ZSA9IGNvbXBsZXRlO1xuICAgICAgICAgICAgY29tcGxldGUgPSBkZWxheTtcbiAgICAgICAgICAgIGRlbGF5ID0gMDtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHN0eWxlID0gZ2V0Q29tcHV0ZWRTdHlsZSh0aGlzLmVsZW1lbnQpO1xuXG4gICAgICAgIGZvciAoY29uc3Qga2V5IGluIHByb3BzKSB7XG4gICAgICAgICAgICBsZXQgdmFsO1xuXG4gICAgICAgICAgICBpZiAodHlwZW9mIHRoaXMuc3R5bGVba2V5XSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICB2YWwgPSB0aGlzLnN0eWxlW2tleV07XG4gICAgICAgICAgICB9IGVsc2UgaWYgKH5UcmFuc2Zvcm1zLmluZGV4T2Yoa2V5KSB8fCB+RmlsdGVycy5pbmRleE9mKGtleSkgfHwgfk51bWVyaWMuaW5kZXhPZihrZXkpKSB7XG4gICAgICAgICAgICAgICAgdmFsID0gfkxhY3VuYTEuaW5kZXhPZihrZXkpID8gMSA6IDA7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBzdHlsZVtrZXldID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgIHZhbCA9IHBhcnNlRmxvYXQoc3R5bGVba2V5XSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICghaXNOYU4odmFsKSkge1xuICAgICAgICAgICAgICAgIHRoaXMuc3R5bGVba2V5XSA9IHZhbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHByb21pc2UgPSB0d2Vlbih0aGlzLnN0eWxlLCBwcm9wcywgZHVyYXRpb24sIGVhc2UsIGRlbGF5LCBjb21wbGV0ZSwgKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5jc3ModGhpcy5zdHlsZSk7XG5cbiAgICAgICAgICAgIGlmICh1cGRhdGUpIHtcbiAgICAgICAgICAgICAgICB1cGRhdGUoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIHByb21pc2U7XG4gICAgfVxuXG4gICAgY2xlYXJUd2VlbigpIHtcbiAgICAgICAgY2xlYXJUd2Vlbih0aGlzLnN0eWxlKTtcblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBkZWxheWVkQ2FsbChkdXJhdGlvbiwgY29tcGxldGUpIHtcbiAgICAgICAgaWYgKCF0aGlzLnRpbWVvdXRzKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCB0aW1lb3V0ID0gZGVsYXllZENhbGwoZHVyYXRpb24sICgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuY2xlYXJUaW1lb3V0KHRpbWVvdXQsIHRydWUpO1xuXG4gICAgICAgICAgICBpZiAoY29tcGxldGUpIHtcbiAgICAgICAgICAgICAgICBjb21wbGV0ZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLnRpbWVvdXRzLnB1c2godGltZW91dCk7XG5cbiAgICAgICAgcmV0dXJuIHRpbWVvdXQ7XG4gICAgfVxuXG4gICAgY2xlYXJUaW1lb3V0KHRpbWVvdXQsIGlzU3RvcHBlZCkge1xuICAgICAgICBpZiAoIXRoaXMudGltZW91dHMpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghaXNTdG9wcGVkKSB7XG4gICAgICAgICAgICBjbGVhclR3ZWVuKHRpbWVvdXQpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgaW5kZXggPSB0aGlzLnRpbWVvdXRzLmluZGV4T2YodGltZW91dCk7XG5cbiAgICAgICAgaWYgKH5pbmRleCkge1xuICAgICAgICAgICAgdGhpcy50aW1lb3V0cy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgY2xlYXJUaW1lb3V0cygpIHtcbiAgICAgICAgaWYgKCF0aGlzLnRpbWVvdXRzKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBmb3IgKGxldCBpID0gdGhpcy50aW1lb3V0cy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgICAgICAgdGhpcy5jbGVhclRpbWVvdXQodGhpcy50aW1lb3V0c1tpXSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB0ZXh0KHN0cikge1xuICAgICAgICBpZiAoIXRoaXMuZWxlbWVudCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHR5cGVvZiBzdHIgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5lbGVtZW50LnRleHRDb250ZW50O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5lbGVtZW50LnRleHRDb250ZW50ID0gc3RyO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgaHRtbChzdHIpIHtcbiAgICAgICAgaWYgKCF0aGlzLmVsZW1lbnQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0eXBlb2Ygc3RyID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZWxlbWVudC5pbm5lckhUTUw7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQuaW5uZXJIVE1MID0gc3RyO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgaGlkZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY3NzKHsgZGlzcGxheTogJ25vbmUnIH0pO1xuICAgIH1cblxuICAgIHNob3coKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNzcyh7IGRpc3BsYXk6ICcnIH0pO1xuICAgIH1cblxuICAgIGludmlzaWJsZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY3NzKHsgdmlzaWJpbGl0eTogJ2hpZGRlbicgfSk7XG4gICAgfVxuXG4gICAgdmlzaWJsZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY3NzKHsgdmlzaWJpbGl0eTogJycgfSk7XG4gICAgfVxuXG4gICAgYmcocGF0aCwgYmFja2dyb3VuZFNpemUgPSAnY29udGFpbicsIGJhY2tncm91bmRQb3NpdGlvbiA9ICdjZW50ZXInLCBiYWNrZ3JvdW5kUmVwZWF0ID0gJ25vLXJlcGVhdCcpIHtcbiAgICAgICAgY29uc3Qgc3R5bGUgPSB7XG4gICAgICAgICAgICBiYWNrZ3JvdW5kSW1hZ2U6IGB1cmwoJHtBc3NldHMuZ2V0UGF0aChwYXRoKX0pYCxcbiAgICAgICAgICAgIGJhY2tncm91bmRTaXplLFxuICAgICAgICAgICAgYmFja2dyb3VuZFBvc2l0aW9uLFxuICAgICAgICAgICAgYmFja2dyb3VuZFJlcGVhdFxuICAgICAgICB9O1xuXG4gICAgICAgIHJldHVybiB0aGlzLmNzcyhzdHlsZSk7XG4gICAgfVxuXG4gICAgbGluZShwcm9ncmVzcyA9IHRoaXMucHJvZ3Jlc3MgfHwgMCkge1xuICAgICAgICBjb25zdCBzdGFydCA9IHRoaXMuc3RhcnQgfHwgMDtcbiAgICAgICAgY29uc3Qgb2Zmc2V0ID0gdGhpcy5vZmZzZXQgfHwgMDtcblxuICAgICAgICBjb25zdCBsZW5ndGggPSB0aGlzLmVsZW1lbnQuZ2V0VG90YWxMZW5ndGgoKTtcbiAgICAgICAgY29uc3QgZGFzaCA9IGxlbmd0aCAqIHByb2dyZXNzO1xuICAgICAgICBjb25zdCBnYXAgPSBsZW5ndGggLSBkYXNoO1xuXG4gICAgICAgIGNvbnN0IHN0eWxlID0ge1xuICAgICAgICAgICAgc3Ryb2tlRGFzaGFycmF5OiBgJHtkYXNofSwke2dhcH1gLFxuICAgICAgICAgICAgc3Ryb2tlRGFzaG9mZnNldDogLWxlbmd0aCAqIChzdGFydCArIG9mZnNldClcbiAgICAgICAgfTtcblxuICAgICAgICByZXR1cm4gdGhpcy5jc3Moc3R5bGUpO1xuICAgIH1cblxuICAgIGxvYWQocGF0aCkge1xuICAgICAgICBjb25zdCBwcm9taXNlID0gZmV0Y2goQXNzZXRzLmdldFBhdGgocGF0aCksIEFzc2V0cy5vcHRpb25zKS50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgIHJldHVybiByZXNwb25zZS50ZXh0KCk7XG4gICAgICAgIH0pLnRoZW4oc3RyID0+IHtcbiAgICAgICAgICAgIHRoaXMuaHRtbChzdHIpO1xuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gcHJvbWlzZTtcbiAgICB9XG5cbiAgICBkZXN0cm95KCkge1xuICAgICAgICBpZiAoIXRoaXMuY2hpbGRyZW4pIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLnBhcmVudCAmJiB0aGlzLnBhcmVudC5yZW1vdmUpIHtcbiAgICAgICAgICAgIHRoaXMucGFyZW50LnJlbW92ZSh0aGlzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuY2xlYXJUaW1lb3V0cygpO1xuICAgICAgICB0aGlzLmNsZWFyVHdlZW4oKTtcblxuICAgICAgICB0aGlzLmV2ZW50cy5kZXN0cm95KCk7XG5cbiAgICAgICAgZm9yIChsZXQgaSA9IHRoaXMuY2hpbGRyZW4ubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgICAgIGlmICh0aGlzLmNoaWxkcmVuW2ldICYmIHRoaXMuY2hpbGRyZW5baV0uZGVzdHJveSkge1xuICAgICAgICAgICAgICAgIHRoaXMuY2hpbGRyZW5baV0uZGVzdHJveSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5lbGVtZW50Lm9iamVjdCA9IG51bGw7XG5cbiAgICAgICAgZm9yIChjb25zdCBwcm9wIGluIHRoaXMpIHtcbiAgICAgICAgICAgIHRoaXNbcHJvcF0gPSBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxufVxuIiwiLyoqXG4gKiBAYXV0aG9yIHBzY2hyb2VuIC8gaHR0cHM6Ly91Zm8uYWkvXG4gKi9cblxuaW1wb3J0IHsgRXZlbnRzIH0gZnJvbSAnLi4vY29uZmlnL0V2ZW50cy5qcyc7XG5pbXBvcnQgeyBJbnRlcmZhY2UgfSBmcm9tICcuL0ludGVyZmFjZS5qcyc7XG5cbmltcG9ydCB7IHRpY2tlciB9IGZyb20gJy4uL3R3ZWVuL1RpY2tlci5qcyc7XG5cbmV4cG9ydCB2YXIgU3RhZ2U7XG5cbmlmICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJykge1xuICAgIFN0YWdlID0gbmV3IEludGVyZmFjZShudWxsLCBudWxsKTtcblxuICAgIGZ1bmN0aW9uIGFkZExpc3RlbmVycygpIHtcbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3BvcHN0YXRlJywgb25Qb3BTdGF0ZSk7XG4gICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgb25LZXlEb3duKTtcbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2tleXVwJywgb25LZXlVcCk7XG4gICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdrZXlwcmVzcycsIG9uS2V5UHJlc3MpO1xuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigncmVzaXplJywgb25SZXNpemUpO1xuICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCd2aXNpYmlsaXR5Y2hhbmdlJywgb25WaXNpYmlsaXR5KTtcblxuICAgICAgICB0aWNrZXIuc3RhcnQoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBFdmVudCBoYW5kbGVyc1xuICAgICAqL1xuXG4gICAgZnVuY3Rpb24gb25Qb3BTdGF0ZShlKSB7XG4gICAgICAgIFN0YWdlLnBhdGggPSBsb2NhdGlvbi5wYXRobmFtZTtcblxuICAgICAgICBTdGFnZS5ldmVudHMuZW1pdChFdmVudHMuU1RBVEVfQ0hBTkdFLCBlKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBvbktleURvd24oZSkge1xuICAgICAgICBTdGFnZS5ldmVudHMuZW1pdChFdmVudHMuS0VZX0RPV04sIGUpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIG9uS2V5VXAoZSkge1xuICAgICAgICBTdGFnZS5ldmVudHMuZW1pdChFdmVudHMuS0VZX1VQLCBlKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBvbktleVByZXNzKGUpIHtcbiAgICAgICAgU3RhZ2UuZXZlbnRzLmVtaXQoRXZlbnRzLktFWV9QUkVTUywgZSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gb25SZXNpemUoZSkge1xuICAgICAgICBTdGFnZS53aWR0aCA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGllbnRXaWR0aDtcbiAgICAgICAgU3RhZ2UuaGVpZ2h0ID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNsaWVudEhlaWdodDtcbiAgICAgICAgU3RhZ2UuZHByID0gd2luZG93LmRldmljZVBpeGVsUmF0aW87XG4gICAgICAgIFN0YWdlLmFzcGVjdCA9IFN0YWdlLndpZHRoIC8gU3RhZ2UuaGVpZ2h0O1xuXG4gICAgICAgIFN0YWdlLmV2ZW50cy5lbWl0KEV2ZW50cy5SRVNJWkUsIGUpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIG9uVmlzaWJpbGl0eShlKSB7XG4gICAgICAgIFN0YWdlLmV2ZW50cy5lbWl0KEV2ZW50cy5WSVNJQklMSVRZLCBlKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBQdWJsaWMgbWV0aG9kc1xuICAgICAqL1xuXG4gICAgU3RhZ2UuaW5pdCA9IGVsZW1lbnQgPT4ge1xuICAgICAgICBTdGFnZS5lbGVtZW50ID0gZWxlbWVudDtcblxuICAgICAgICBhZGRMaXN0ZW5lcnMoKTtcbiAgICAgICAgb25Qb3BTdGF0ZSgpO1xuICAgICAgICBvblJlc2l6ZSgpO1xuICAgIH07XG5cbiAgICBTdGFnZS5zZXRQYXRoID0gcGF0aCA9PiB7XG4gICAgICAgIGlmIChwYXRoID09PSBsb2NhdGlvbi5wYXRobmFtZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaGlzdG9yeS5wdXNoU3RhdGUobnVsbCwgbnVsbCwgcGF0aCk7XG5cbiAgICAgICAgb25Qb3BTdGF0ZSgpO1xuICAgIH07XG5cbiAgICBTdGFnZS5zZXRUaXRsZSA9IHRpdGxlID0+IHtcbiAgICAgICAgZG9jdW1lbnQudGl0bGUgPSB0aXRsZTtcbiAgICB9O1xuXG4gICAgU3RhZ2Uuc2V0Q29udGVudCA9Y29udGVudCA9PntcbiAgICAgICAgZG9jdW1lbnQudGV4dENvbnRlbnQgPSBjb250ZW50XG4gICAgfVxuIH1cbiIsImltcG9ydCB7IEV2ZW50cyB9IGZyb20gJy4uL2NvbmZpZy9FdmVudHMuanMnO1xuaW1wb3J0IHsgSW50ZXJmYWNlIH0gZnJvbSAnLi4vdXRpbHMvSW50ZXJmYWNlLmpzJztcbmltcG9ydCB7IFN0YWdlIH0gZnJvbSAnLi4vdXRpbHMvU3RhZ2UuanMnO1xuXG5pbXBvcnQgeyB0aWNrZXIgfSBmcm9tICcuLi90d2Vlbi9UaWNrZXIuanMnO1xuaW1wb3J0IHsgY2xlYXJUd2VlbiwgdHdlZW4gfSBmcm9tICcuLi90d2Vlbi9Ud2Vlbi5qcyc7XG5pbXBvcnQgeyBkZWdUb1JhZCB9IGZyb20gJy4uL3V0aWxzL1V0aWxzLmpzJztcblxuZXhwb3J0IGNsYXNzIFByb2dyZXNzQ2FudmFzIGV4dGVuZHMgSW50ZXJmYWNlIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgc3VwZXIobnVsbCwgJ2NhbnZhcycpO1xuXG4gICAgICAgIGNvbnN0IHNpemUgPSAzMjtcblxuICAgICAgICB0aGlzLndpZHRoID0gc2l6ZTtcbiAgICAgICAgdGhpcy5oZWlnaHQgPSBzaXplO1xuICAgICAgICB0aGlzLnggPSBzaXplIC8gMjtcbiAgICAgICAgdGhpcy55ID0gc2l6ZSAvIDI7XG4gICAgICAgIHRoaXMucmFkaXVzID0gc2l6ZSAqIDAuNDtcbiAgICAgICAgdGhpcy5zdGFydEFuZ2xlID0gZGVnVG9SYWQoLTkwKTtcbiAgICAgICAgdGhpcy5wcm9ncmVzcyA9IDA7XG4gICAgICAgIHRoaXMubmVlZHNVcGRhdGUgPSBmYWxzZTtcblxuICAgICAgICB0aGlzLmluaXRDYW52YXMoKTtcbiAgICB9XG5cbiAgICBpbml0Q2FudmFzKCkge1xuICAgICAgICB0aGlzLmNvbnRleHQgPSB0aGlzLmVsZW1lbnQuZ2V0Q29udGV4dCgnMmQnKTtcbiAgICB9XG5cbiAgICBhZGRMaXN0ZW5lcnMoKSB7XG4gICAgICAgIHRpY2tlci5hZGQodGhpcy5vblVwZGF0ZSk7XG4gICAgfVxuXG4gICAgcmVtb3ZlTGlzdGVuZXJzKCkge1xuICAgICAgICB0aWNrZXIucmVtb3ZlKHRoaXMub25VcGRhdGUpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEV2ZW50IGhhbmRsZXJzXG4gICAgICovXG5cbiAgICBvblVwZGF0ZSA9ICgpID0+IHtcbiAgICAgICAgaWYgKHRoaXMubmVlZHNVcGRhdGUpIHtcbiAgICAgICAgICAgIHRoaXMudXBkYXRlKCk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgb25Qcm9ncmVzcyA9ICh7IHByb2dyZXNzIH0pID0+IHtcbiAgICAgICAgY2xlYXJUd2Vlbih0aGlzKTtcblxuICAgICAgICB0aGlzLm5lZWRzVXBkYXRlID0gdHJ1ZTtcblxuICAgICAgICB0d2Vlbih0aGlzLCB7IHByb2dyZXNzIH0sIDUwMCwgJ2Vhc2VPdXRDdWJpYycsICgpID0+IHtcbiAgICAgICAgICAgIHRoaXMubmVlZHNVcGRhdGUgPSBmYWxzZTtcblxuICAgICAgICAgICAgaWYgKHRoaXMucHJvZ3Jlc3MgPj0gMSkge1xuICAgICAgICAgICAgICAgIHRoaXMub25Db21wbGV0ZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgb25Db21wbGV0ZSA9ICgpID0+IHtcbiAgICAgICAgdGhpcy5yZW1vdmVMaXN0ZW5lcnMoKTtcblxuICAgICAgICB0aGlzLmV2ZW50cy5lbWl0KEV2ZW50cy5DT01QTEVURSk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIFB1YmxpYyBtZXRob2RzXG4gICAgICovXG5cbiAgICByZXNpemUgPSAoKSA9PiB7XG4gICAgICAgIGNvbnN0IGRwciA9IDI7XG5cbiAgICAgICAgdGhpcy5lbGVtZW50LndpZHRoID0gTWF0aC5yb3VuZCh0aGlzLndpZHRoICogZHByKTtcbiAgICAgICAgdGhpcy5lbGVtZW50LmhlaWdodCA9IE1hdGgucm91bmQodGhpcy5oZWlnaHQgKiBkcHIpO1xuICAgICAgICB0aGlzLmVsZW1lbnQuc3R5bGUud2lkdGggPSB0aGlzLndpZHRoICsgJ3B4JztcbiAgICAgICAgdGhpcy5lbGVtZW50LnN0eWxlLmhlaWdodCA9IHRoaXMuaGVpZ2h0ICsgJ3B4JztcbiAgICAgICAgdGhpcy5jb250ZXh0LnNjYWxlKGRwciwgZHByKTtcblxuICAgICAgICB0aGlzLmNvbnRleHQubGluZVdpZHRoID0gMS41O1xuICAgICAgICB0aGlzLmNvbnRleHQuc3Ryb2tlU3R5bGUgPSBTdGFnZS5yb290U3R5bGUuZ2V0UHJvcGVydHlWYWx1ZSgnLS11aS1jb2xvcicpLnRyaW0oKTtcblxuICAgICAgICB0aGlzLnVwZGF0ZSgpO1xuICAgIH07XG5cbiAgICB1cGRhdGUgPSAoKSA9PiB7XG4gICAgICAgIHRoaXMuY29udGV4dC5jbGVhclJlY3QoMCwgMCwgdGhpcy5lbGVtZW50LndpZHRoLCB0aGlzLmVsZW1lbnQuaGVpZ2h0KTtcbiAgICAgICAgdGhpcy5jb250ZXh0LmJlZ2luUGF0aCgpO1xuICAgICAgICB0aGlzLmNvbnRleHQuYXJjKHRoaXMueCwgdGhpcy55LCB0aGlzLnJhZGl1cywgdGhpcy5zdGFydEFuZ2xlLCB0aGlzLnN0YXJ0QW5nbGUgKyBkZWdUb1JhZCgzNjAgKiB0aGlzLnByb2dyZXNzKSk7XG4gICAgICAgIHRoaXMuY29udGV4dC5zdHJva2UoKTtcbiAgICB9O1xuXG4gICAgYW5pbWF0ZUluID0gKCkgPT4ge1xuICAgICAgICB0aGlzLmFkZExpc3RlbmVycygpO1xuICAgICAgICB0aGlzLnJlc2l6ZSgpO1xuICAgIH07XG5cbiAgICBhbmltYXRlT3V0ID0gKCkgPT4ge1xuICAgICAgICB0aGlzLnR3ZWVuKHsgc2NhbGU6IDEuMSwgb3BhY2l0eTogMCB9LCA0MDAsICdlYXNlSW5DdWJpYycpO1xuICAgIH07XG5cbiAgICBkZXN0cm95ID0gKCkgPT4ge1xuICAgICAgICB0aGlzLnJlbW92ZUxpc3RlbmVycygpO1xuXG4gICAgICAgIGNsZWFyVHdlZW4odGhpcyk7XG5cbiAgICAgICAgcmV0dXJuIHN1cGVyLmRlc3Ryb3koKTtcbiAgICB9O1xufVxuIiwiaW1wb3J0IHsgRXZlbnRzIH0gZnJvbSAnLi4vY29uZmlnL0V2ZW50cy5qcyc7XG5pbXBvcnQgeyBJbnRlcmZhY2UgfSBmcm9tICcuLi91dGlscy9JbnRlcmZhY2UuanMnO1xuaW1wb3J0IHsgUHJvZ3Jlc3NDYW52YXMgfSBmcm9tICcuL1Byb2dyZXNzQ2FudmFzLmpzJztcblxuZXhwb3J0IGNsYXNzIFByZWxvYWRlclZpZXcgZXh0ZW5kcyBJbnRlcmZhY2Uge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBzdXBlcignLnByZWxvYWRlcicpO1xuXG4gICAgICAgIHRoaXMuaW5pdEhUTUwoKTtcbiAgICAgICAgdGhpcy5pbml0VmlldygpO1xuXG4gICAgICAgIHRoaXMuYWRkTGlzdGVuZXJzKCk7XG4gICAgfVxuXG4gICAgaW5pdEhUTUwoKSB7XG4gICAgICAgIHRoaXMuY3NzKHtcbiAgICAgICAgICAgIHBvc2l0aW9uOiAnZml4ZWQnLFxuICAgICAgICAgICAgbGVmdDogMCxcbiAgICAgICAgICAgIHRvcDogMCxcbiAgICAgICAgICAgIHdpZHRoOiAnMTAwJScsXG4gICAgICAgICAgICBoZWlnaHQ6ICcxMDAlJyxcbiAgICAgICAgICAgIGJhY2tncm91bmRDb2xvcjogJ3ZhcigtLWJnLWNvbG9yKScsXG4gICAgICAgICAgICB6SW5kZXg6IDEsXG4gICAgICAgICAgICBwb2ludGVyRXZlbnRzOiAnbm9uZSdcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgaW5pdFZpZXcoKSB7XG4gICAgICAgIHRoaXMudmlldyA9IG5ldyBQcm9ncmVzc0NhbnZhcygpO1xuICAgICAgICB0aGlzLnZpZXcuY3NzKHtcbiAgICAgICAgICAgIGxlZnQ6ICc1MCUnLFxuICAgICAgICAgICAgdG9wOiAnNTAlJyxcbiAgICAgICAgICAgIG1hcmdpbkxlZnQ6IC10aGlzLnZpZXcud2lkdGggLyAyLFxuICAgICAgICAgICAgbWFyZ2luVG9wOiAtdGhpcy52aWV3LmhlaWdodCAvIDJcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuYWRkKHRoaXMudmlldyk7XG4gICAgfVxuXG4gICAgYWRkTGlzdGVuZXJzKCkge1xuICAgICAgICB0aGlzLnZpZXcuZXZlbnRzLm9uKEV2ZW50cy5DT01QTEVURSwgdGhpcy5vbkNvbXBsZXRlKTtcbiAgICB9XG5cbiAgICByZW1vdmVMaXN0ZW5lcnMoKSB7XG4gICAgICAgIHRoaXMudmlldy5ldmVudHMub2ZmKEV2ZW50cy5DT01QTEVURSwgdGhpcy5vbkNvbXBsZXRlKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBFdmVudCBoYW5kbGVyc1xuICAgICAqL1xuXG4gICAgb25Qcm9ncmVzcyA9IGUgPT4ge1xuICAgICAgICB0aGlzLnZpZXcub25Qcm9ncmVzcyhlKTtcbiAgICB9O1xuXG4gICAgb25Db21wbGV0ZSA9ICgpID0+IHtcbiAgICAgICAgdGhpcy5ldmVudHMuZW1pdChFdmVudHMuQ09NUExFVEUpO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBQdWJsaWMgbWV0aG9kc1xuICAgICAqL1xuXG4gICAgYW5pbWF0ZUluID0gKCkgPT4ge1xuICAgICAgICB0aGlzLnZpZXcuYW5pbWF0ZUluKCk7XG4gICAgfTtcblxuICAgIGFuaW1hdGVPdXQgPSAoKSA9PiB7XG4gICAgICAgIHRoaXMudmlldy5hbmltYXRlT3V0KCk7XG4gICAgICAgIHJldHVybiB0aGlzLnR3ZWVuKHsgb3BhY2l0eTogMCB9LCAyNTAsICdlYXNlT3V0U2luZScsIDUwMCk7XG4gICAgfTtcblxuICAgIGRlc3Ryb3kgPSAoKSA9PiB7XG4gICAgICAgIHRoaXMucmVtb3ZlTGlzdGVuZXJzKCk7XG5cbiAgICAgICAgcmV0dXJuIHN1cGVyLmRlc3Ryb3koKTtcbiAgICB9O1xufVxuIiwiaW1wb3J0IHsgQ29uZmlnIH0gZnJvbSAnLi4vY29uZmlnL0NvbmZpZy5qcyc7XG5pbXBvcnQgeyBEZXZpY2UgfSBmcm9tICcuLi9jb25maWcvRGV2aWNlLmpzJztcbmltcG9ydCB7IEV2ZW50cyB9IGZyb20gJy4uL2NvbmZpZy9FdmVudHMuanMnO1xuaW1wb3J0IHsgQXNzZXRzIH0gZnJvbSAnLi4vbG9hZGVycy9Bc3NldHMuanMnO1xuaW1wb3J0IHsgTXVsdGlMb2FkZXIgfSBmcm9tICcuLi9sb2FkZXJzL011bHRpTG9hZGVyLmpzJztcbmltcG9ydCB7IEZvbnRMb2FkZXIgfSBmcm9tICcuLi9sb2FkZXJzL0ZvbnRMb2FkZXIuanMnO1xuaW1wb3J0IHsgQXNzZXRMb2FkZXIgfSBmcm9tICcuLi9sb2FkZXJzL0Fzc2V0TG9hZGVyLmpzJztcbmltcG9ydCB7IFN0YWdlIH0gZnJvbSAnLi4vdXRpbHMvU3RhZ2UuanMnO1xuaW1wb3J0IHsgUHJlbG9hZGVyVmlldyB9IGZyb20gJy4uL3ZpZXdzL1ByZWxvYWRlclZpZXcuanMnO1xuXG5leHBvcnQgY2xhc3MgUHJlbG9hZGVyIHtcbiAgICBzdGF0aWMgaW5pdCgpIHtcbiAgICAgICAgaWYgKCFEZXZpY2Uud2ViZ2wpIHtcbiAgICAgICAgICAgIHJldHVybiBsb2NhdGlvbi5ocmVmID0gJ2ZhbGxiYWNrLmh0bWwnO1xuICAgICAgICB9XG5cbiAgICAgICAgQXNzZXRzLnBhdGggPSBDb25maWcuQ0ROO1xuICAgICAgICBBc3NldHMuY3Jvc3NPcmlnaW4gPSAnYW5vbnltb3VzJztcblxuICAgICAgICBBc3NldHMub3B0aW9ucyA9IHtcbiAgICAgICAgICAgIG1vZGU6ICdjb3JzJyxcbiAgICAgICAgICAgIC8vIGNyZWRlbnRpYWxzOiAnaW5jbHVkZSdcbiAgICAgICAgfTtcblxuICAgICAgICBBc3NldHMuY2FjaGUgPSB0cnVlO1xuXG4gICAgICAgIHRoaXMuaW5pdFN0YWdlKCk7XG4gICAgICAgIHRoaXMuaW5pdFZpZXcoKTtcbiAgICAgICAgdGhpcy5pbml0TG9hZGVyKCk7XG5cbiAgICAgICAgdGhpcy5hZGRMaXN0ZW5lcnMoKTtcbiAgICB9XG5cbiAgICBzdGF0aWMgaW5pdFN0YWdlKCkge1xuICAgICAgICBTdGFnZS5pbml0KGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNyb290JykpO1xuXG4gICAgICAgIFN0YWdlLnJvb3QgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCc6cm9vdCcpO1xuICAgICAgICBTdGFnZS5yb290U3R5bGUgPSBnZXRDb21wdXRlZFN0eWxlKFN0YWdlLnJvb3QpO1xuICAgIH1cblxuICAgIHN0YXRpYyBpbml0VmlldygpIHtcbiAgICAgICAgdGhpcy52aWV3ID0gbmV3IFByZWxvYWRlclZpZXcoKTtcbiAgICAgICAgU3RhZ2UuYWRkKHRoaXMudmlldyk7XG4gICAgfVxuXG4gICAgc3RhdGljIGFzeW5jIGluaXRMb2FkZXIoKSB7XG4gICAgICAgIHRoaXMudmlldy5hbmltYXRlSW4oKTtcblxuICAgICAgICBsZXQgYXNzZXRzID0gQ29uZmlnLkFTU0VUUy5zbGljZSgpO1xuXG4gICAgICAgIGlmIChEZXZpY2UubW9iaWxlKSB7XG4gICAgICAgICAgICBhc3NldHMgPSBhc3NldHMuZmlsdGVyKHBhdGggPT4gIS9kZXNrdG9wLy50ZXN0KHBhdGgpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGFzc2V0cyA9IGFzc2V0cy5maWx0ZXIocGF0aCA9PiAhL21vYmlsZS8udGVzdChwYXRoKSk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmxvYWRlciA9IG5ldyBNdWx0aUxvYWRlcigpO1xuICAgICAgICB0aGlzLmxvYWRlci5sb2FkKG5ldyBGb250TG9hZGVyKCkpO1xuICAgICAgICB0aGlzLmxvYWRlci5sb2FkKG5ldyBBc3NldExvYWRlcihhc3NldHMpKTtcbiAgICAgICAgdGhpcy5sb2FkZXIuYWRkKDIpO1xuXG4gICAgICAgIGNvbnN0IHsgQXBwIH0gPSBhd2FpdCBpbXBvcnQoJy4vQXBwLmpzJyk7XG4gICAgICAgIHRoaXMubG9hZGVyLnRyaWdnZXIoMSk7XG5cbiAgICAgICAgdGhpcy5hcHAgPSBBcHA7XG5cbiAgICAgICAgYXdhaXQgdGhpcy5hcHAuaW5pdCh0aGlzLmxvYWRlci5sb2FkZXJzWzFdKTtcbiAgICAgICAgdGhpcy5sb2FkZXIudHJpZ2dlcigxKTtcbiAgICB9XG5cbiAgICBzdGF0aWMgYWRkTGlzdGVuZXJzKCkge1xuICAgICAgICB0aGlzLmxvYWRlci5ldmVudHMub24oRXZlbnRzLlBST0dSRVNTLCB0aGlzLnZpZXcub25Qcm9ncmVzcyk7XG4gICAgICAgIHRoaXMudmlldy5ldmVudHMub24oRXZlbnRzLkNPTVBMRVRFLCB0aGlzLm9uQ29tcGxldGUpO1xuICAgIH1cblxuICAgIHN0YXRpYyByZW1vdmVMaXN0ZW5lcnMoKSB7XG4gICAgICAgIHRoaXMubG9hZGVyLmV2ZW50cy5vZmYoRXZlbnRzLlBST0dSRVNTLCB0aGlzLnZpZXcub25Qcm9ncmVzcyk7XG4gICAgICAgIHRoaXMudmlldy5ldmVudHMub2ZmKEV2ZW50cy5DT01QTEVURSwgdGhpcy5vbkNvbXBsZXRlKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBFdmVudCBoYW5kbGVyc1xuICAgICAqL1xuXG4gICAgc3RhdGljIG9uQ29tcGxldGUgPSBhc3luYyAoKSA9PiB7XG4gICAgICAgIHRoaXMucmVtb3ZlTGlzdGVuZXJzKCk7XG5cbiAgICAgICAgdGhpcy5sb2FkZXIgPSB0aGlzLmxvYWRlci5kZXN0cm95KCk7XG5cbiAgICAgICAgYXdhaXQgdGhpcy52aWV3LmFuaW1hdGVPdXQoKTtcbiAgICAgICAgdGhpcy52aWV3ID0gdGhpcy52aWV3LmRlc3Ryb3koKTtcblxuICAgICAgICB0aGlzLmFwcC5hbmltYXRlSW4oKTtcbiAgICB9O1xufVxuIl0sIm5hbWVzIjpbIkJlemllckVhc2luZyJdLCJtYXBwaW5ncyI6IkFBQU8sTUFBTSxNQUFNLENBQUM7QUFDcEIsSUFBSSxPQUFPLFVBQVUsR0FBRyxJQUFJLENBQUM7QUFDN0IsSUFBSSxPQUFPLEtBQUssR0FBRyxRQUFRLENBQUMsTUFBTSxLQUFLLFFBQVEsQ0FBQztBQUNoRDtBQUNBLElBQUksT0FBTyxHQUFHLEdBQUcsRUFBRSxDQUFDO0FBQ3BCO0FBQ0EsSUFBSSxPQUFPLE1BQU0sR0FBRztBQUNwQixRQUFRLDhCQUE4QjtBQUN0QyxRQUFRLHFDQUFxQztBQUM3QyxLQUFLLENBQUM7QUFDTjtBQUNBLElBQUksT0FBTyxHQUFHLEdBQUcsUUFBUSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDaEQsSUFBSSxPQUFPLEtBQUssR0FBRyxXQUFXLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUNyRDs7QUNiTyxNQUFNLE1BQU0sQ0FBQztBQUNwQixJQUFJLE9BQU8sS0FBSyxHQUFHLFNBQVMsQ0FBQyxTQUFTLENBQUMsV0FBVyxFQUFFLENBQUM7QUFDckQ7QUFDQSxJQUFJLE9BQU8sTUFBTSxHQUFHLENBQUMsQ0FBQyxTQUFTLENBQUMsY0FBYyxDQUFDO0FBQy9DO0FBQ0EsSUFBSSxPQUFPLE1BQU0sR0FBRyxJQUFJLENBQUMsTUFBTSxJQUFJLElBQUksQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsTUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDO0FBQ2hGO0FBQ0EsSUFBSSxPQUFPLEtBQUssR0FBRyxJQUFJLENBQUMsTUFBTSxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQztBQUMvQztBQUNBLElBQUksT0FBTyxLQUFLLEdBQUcsQ0FBQyxNQUFNO0FBQzFCLFFBQVEsSUFBSSxPQUFPLE1BQU0sS0FBSyxXQUFXLEVBQUU7QUFDM0MsWUFBWSxPQUFPO0FBQ25CLFNBQVM7QUFDVDtBQUNBLFFBQVEsTUFBTSxjQUFjLEdBQUc7QUFDL0IsWUFBWSw0QkFBNEIsRUFBRSxJQUFJO0FBQzlDLFNBQVMsQ0FBQztBQUNWO0FBQ0EsUUFBUSxJQUFJLE1BQU0sR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBQ3RELFFBQVEsSUFBSSxFQUFFLEdBQUcsTUFBTSxDQUFDLFVBQVUsQ0FBQyxRQUFRLEVBQUUsY0FBYyxDQUFDLENBQUM7QUFDN0Q7QUFDQSxRQUFRLE1BQU0sTUFBTSxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUM7QUFDNUI7QUFDQSxRQUFRLEVBQUUsR0FBRyxJQUFJLENBQUM7QUFDbEIsUUFBUSxNQUFNLEdBQUcsSUFBSSxDQUFDO0FBQ3RCO0FBQ0EsUUFBUSxPQUFPLE1BQU0sQ0FBQztBQUN0QixLQUFLLEdBQUcsQ0FBQztBQUNUOztBQzVCTyxNQUFNLE1BQU0sQ0FBQztBQUNwQixJQUFJLE9BQU8sWUFBWSxHQUFHLGNBQWMsQ0FBQztBQUN6QyxJQUFJLE9BQU8sV0FBVyxHQUFHLGFBQWEsQ0FBQztBQUN2QyxJQUFJLE9BQU8sUUFBUSxHQUFHLFVBQVUsQ0FBQztBQUNqQyxJQUFJLE9BQU8sTUFBTSxHQUFHLFFBQVEsQ0FBQztBQUM3QixJQUFJLE9BQU8sU0FBUyxHQUFHLFdBQVcsQ0FBQztBQUNuQyxJQUFJLE9BQU8sTUFBTSxHQUFHLFFBQVEsQ0FBQztBQUM3QixJQUFJLE9BQU8sVUFBVSxHQUFHLFlBQVksQ0FBQztBQUNyQyxJQUFJLE9BQU8sUUFBUSxHQUFHLFVBQVUsQ0FBQztBQUNqQyxJQUFJLE9BQU8sUUFBUSxHQUFHLFVBQVUsQ0FBQztBQUNqQyxJQUFJLE9BQU8sTUFBTSxHQUFHLFFBQVEsQ0FBQztBQUM3QixJQUFJLE9BQU8sS0FBSyxHQUFHLE9BQU8sQ0FBQztBQUMzQixJQUFJLE9BQU8sS0FBSyxHQUFHLE9BQU8sQ0FBQztBQUMzQjtBQUNBLElBQUksT0FBTyxZQUFZLEdBQUcsY0FBYyxDQUFDO0FBQ3pDLElBQUksT0FBTyxNQUFNLEdBQUcsUUFBUSxDQUFDO0FBQzdCOztBQ1hBLE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxFQUFFLEdBQUcsR0FBRyxDQUFDO0FBQzlCLE1BQU0sT0FBTyxHQUFHLEdBQUcsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDO0FBa0I5QjtBQUNBLFNBQVMsS0FBSyxFQUFFLEtBQUssRUFBRSxHQUFHLEVBQUUsR0FBRyxHQUFHO0FBQ2xDO0FBQ0EsQ0FBQyxPQUFPLElBQUksQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLElBQUksQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLEtBQUssRUFBRSxFQUFFLENBQUM7QUFDaEQ7QUFDQSxDQUFDO0FBQ0Q7QUFDQTtBQUNBO0FBQ0EsU0FBUyxlQUFlLEVBQUUsQ0FBQyxFQUFFLENBQUMsR0FBRztBQUNqQztBQUNBLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQzlCO0FBQ0EsQ0FBQztBQXVCRDtBQUNBO0FBQ0EsU0FBUyxJQUFJLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEdBQUc7QUFDekI7QUFDQSxDQUFDLE9BQU8sRUFBRSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQzlCO0FBQ0EsQ0FBQztBQXNDRDtBQUNBO0FBQ0EsU0FBUyxPQUFPLEVBQUUsR0FBRyxFQUFFLElBQUksR0FBRztBQUM5QjtBQUNBLENBQUMsT0FBTyxHQUFHLEdBQUcsSUFBSSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsTUFBTSxFQUFFLEtBQUssSUFBSSxHQUFHLEdBQUcsR0FBRyxDQUFDLEVBQUUsRUFBRSxDQUFDO0FBQy9EO0FBQ0EsQ0FBQztBQWdDRDtBQUNBLFNBQVMsUUFBUSxFQUFFLE9BQU8sR0FBRztBQUM3QjtBQUNBLENBQUMsT0FBTyxPQUFPLEdBQUcsT0FBTyxDQUFDO0FBQzFCO0FBQ0EsQ0FBQztBQUNEO0FBQ0EsU0FBUyxRQUFRLEVBQUUsT0FBTyxHQUFHO0FBQzdCO0FBQ0EsQ0FBQyxPQUFPLE9BQU8sR0FBRyxPQUFPLENBQUM7QUFDMUI7QUFDQSxDQUFDO0FBQ0Q7QUFDQSxTQUFTLFlBQVksRUFBRSxLQUFLLEdBQUc7QUFDL0I7QUFDQSxDQUFDLE9BQU8sRUFBRSxLQUFLLEtBQUssS0FBSyxHQUFHLENBQUMsRUFBRSxPQUFPLENBQUMsSUFBSSxLQUFLLEtBQUssQ0FBQyxDQUFDO0FBQ3ZEO0FBQ0EsQ0FBQztBQU9EO0FBQ0EsU0FBUyxlQUFlLEVBQUUsS0FBSyxHQUFHO0FBQ2xDO0FBQ0EsQ0FBQyxPQUFPLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLEdBQUcsRUFBRSxLQUFLLEVBQUUsR0FBRyxJQUFJLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQztBQUNsRTtBQUNBOztBQzNLQTtBQUNBO0FBQ0E7QUFLQTtBQUNPLFNBQVMsT0FBTyxDQUFDLEtBQUssRUFBRTtBQUMvQixJQUFJLE9BQU8sS0FBSyxDQUFDLElBQUksQ0FBQyxNQUFNLElBQUksQ0FBQyxNQUFNLEVBQUUsR0FBRyxHQUFHLENBQUMsQ0FBQztBQUNqRCxDQUFDO0FBU0Q7QUFDTyxTQUFTLElBQUksR0FBRztBQUN2QixJQUFJLE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLEdBQUcsT0FBTyxDQUFDLENBQUMsRUFBRSxLQUFLLENBQUMsRUFBRSxRQUFRLEVBQUUsQ0FBQztBQUN2RCxDQUFDO0FBQ0Q7QUFDTyxTQUFTLFVBQVUsQ0FBQyxLQUFLLEVBQUU7QUFDbEMsSUFBSSxPQUFPLEtBQUssQ0FBQyxDQUFDLEdBQUcsR0FBRyxHQUFHLEtBQUssQ0FBQyxDQUFDLEdBQUcsSUFBSSxHQUFHLEtBQUssQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDO0FBQzNELENBQUM7QUFXRDtBQUNPLFNBQVMsUUFBUSxDQUFDLElBQUksRUFBRTtBQUMvQixJQUFJLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsRUFBRTtBQUM3QixRQUFRLE9BQU8sSUFBSSxDQUFDO0FBQ3BCLEtBQUs7QUFDTDtBQUNBLElBQUksTUFBTSxJQUFJLEdBQUcsTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFJLEdBQUcsQ0FBQyxDQUFDLEVBQUUsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDO0FBQ3pFLElBQUksTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsR0FBRyxJQUFJLEdBQUcsQ0FBQyxFQUFFLFFBQVEsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLFVBQVUsRUFBRSxHQUFHLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7QUFDMUc7QUFDQSxJQUFJLE9BQU8sQ0FBQyxFQUFFLFFBQVEsQ0FBQyxRQUFRLENBQUMsRUFBRSxFQUFFLFFBQVEsQ0FBQyxRQUFRLENBQUMsRUFBRSxJQUFJLENBQUMsRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDO0FBQzFFLENBQUM7QUFDRDtBQUNPLFNBQVMs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SUFBSSxJQUFJLENBQUMsTUFBTSxFQUFFLE1BQU0sR0FBRyxDQUFDLEVBQUU7QUFDN0IsUUFBUSxNQUFNLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUMzRCxRQUFRLE1BQU0sQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO0FBQzNEO0FBQ0EsUUFBUSxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUNsQyxRQUFRLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQ2xDO0FBQ0EsUUFBUSxJQUFJLENBQUMsS0FBSyxJQUFJLE1BQU0sQ0FBQztBQUM3QixLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUksVUFBVSxHQUFHLE1BQU07QUFDdkIsUUFBUSxJQUFJLE1BQU0sR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDO0FBQ2pDO0FBQ0EsUUFBUSxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRTtBQUM3RCxZQUFZLE1BQU0sSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDO0FBQ2pFLFNBQVM7QUFDVDtBQUNBLFFBQVEsTUFBTSxRQUFRLEdBQUcsTUFBTSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUM7QUFDN0M7QUFDQSxRQUFRLElBQUksUUFBUSxHQUFHLENBQUMsRUFBRTtBQUMxQixZQUFZLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsRUFBRSxRQUFRLEVBQUUsQ0FB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LENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztBQUNyRCxTQUFTO0FBQ1Q7QUFDQSxRQUFRLE9BQU8sR0FBRyxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztBQUN2RCxLQUFLO0FBQ0w7QUFDQSxJQUFJLE9BQU8sVUFBVSxDQUFDLENBQUMsRUFBRTtBQUN6QixRQUFRLE1BQU0sQ0FBQyxHQUFHLE9BQU8sQ0FBQztBQUMxQjtBQUNBLFFBQVEsT0FBTyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7QUFDdkQsS0FBSztBQUNMO0FBQ0EsSUFBSSxPQUFPLFdBQVcsQ0FBQyxDQUFDLEVBQUU7QUFDMUIsUUFBUSxNQUFNLENBQUMsR0FBRyxPQUFPLENBQUM7QUFDMUI7QUFDQSxRQUFRLE9BQU8sQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQzdELEtBQUs7QUFDTDtBQUNBLElBQUksT0FBTyxhQUFhLENBQUMsQ0FBQyxFQUFFO0FBQzVCLFFBQVEsTUFBTSxDQUFDLEdBQUcsT0FBTyxHQUFHLEtBQUssQ0FBQztBQUNsQztBQUNBLFFBQVEsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFO0FBQzFCLFlBQVksT0FBTyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDckQsU0FBUztBQUNUO0FBQ0EsUUFBUSxPQUFPLEdBQUcsSUFBSSxDQUFDLENB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QU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3BELFFBQVEsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDL0IsS0FBSztBQUNMO0FBQ0EsSUFBSSxPQUFPLFlBQVksR0FBRztBQUMxQixRQUFRLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7QUFDckUsUUFBUSxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7QUFDOUQsS0FBSztBQUNMO0FBQ0EsSUFBSSxPQUFPLGVBQWUsR0FBRztBQUM3QixRQUFRLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7QUFDdEUsUUFBUSxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7QUFDL0QsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFJLE9BQU8sVUFBVSxHQUFHLFlBQVk7QUFDcEMsUUFBUSxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7QUFDL0I7QUFDQSxRQUFRLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUUsQ0FBQztBQUM1QztBQUNBLFFBQVEsTUFBTSxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO0FBQ3JDLFFBQVEsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO0FBQ3hDO0FBQ0EsUUFBUSxJQUFJLENBQUMsR0FBRyxDQUFDLFNBQVMsRUFBRSxDQUFDO0FBQzdCLEtBQUssQ0FBQztBQUNOOzs7OyJ9
