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

        //this.app.animateIn();
    };
}

export { Assets, Config, Device, EventEmitter, Events, Interface, Loader, Preloader, Stage, absolute, brightness, clamp, clearTween, degToRad, delayedCall, euclideanModulo, floorPowerOfTwo, getConstructor, getKeyByValue, guid, isPowerOfTwo, lerp, radToDeg, shuffle, ticker, tween };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9hZGVyLmpzIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvY29uZmlnL0NvbmZpZy5qcyIsIi4uLy4uLy4uL3NyYy9jb25maWcvRGV2aWNlLmpzIiwiLi4vLi4vLi4vc3JjL2NvbmZpZy9FdmVudHMuanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvdGhyZWUvc3JjL21hdGgvTWF0aFV0aWxzLmpzIiwiLi4vLi4vLi4vc3JjL3V0aWxzL1V0aWxzLmpzIiwiLi4vLi4vLi4vc3JjL2xvYWRlcnMvQXNzZXRzLmpzIiwiLi4vLi4vLi4vc3JjL3V0aWxzL0V2ZW50RW1pdHRlci5qcyIsIi4uLy4uLy4uL3NyYy9sb2FkZXJzL0xvYWRlci5qcyIsIi4uLy4uLy4uL3NyYy9sb2FkZXJzL011bHRpTG9hZGVyLmpzIiwiLi4vLi4vLi4vc3JjL2xvYWRlcnMvRm9udExvYWRlci5qcyIsIi4uLy4uLy4uL3NyYy9sb2FkZXJzL0Fzc2V0TG9hZGVyLmpzIiwiLi4vLi4vLi4vc3JjL3R3ZWVuL0JlemllckVhc2luZy5qcyIsIi4uLy4uLy4uL3NyYy90d2Vlbi9FYXNpbmcuanMiLCIuLi8uLi8uLi9zcmMvdHdlZW4vVGlja2VyLmpzIiwiLi4vLi4vLi4vc3JjL3R3ZWVuL1R3ZWVuLmpzIiwiLi4vLi4vLi4vc3JjL3V0aWxzL0ludGVyZmFjZS5qcyIsIi4uLy4uLy4uL3NyYy91dGlscy9TdGFnZS5qcyIsIi4uLy4uLy4uL3NyYy92aWV3cy9Qcm9ncmVzc0NhbnZhcy5qcyIsIi4uLy4uLy4uL3NyYy92aWV3cy9QcmVsb2FkZXJWaWV3LmpzIiwiLi4vLi4vLi4vc3JjL2NvbnRyb2xsZXJzL1ByZWxvYWRlci5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgY2xhc3MgQ29uZmlnIHtcbiAgICBzdGF0aWMgQlJFQUtQT0lOVCA9IDEwMDA7XG4gICAgc3RhdGljIERFQlVHID0gbG9jYXRpb24uc2VhcmNoID09PSAnP2RlYnVnJztcblxuICAgIHN0YXRpYyBDRE4gPSAnJztcblxuICAgIHN0YXRpYyBBU1NFVFMgPSBbXG4gICAgICAgICdhc3NldHMvaW1hZ2VzL2FsaWVua2l0dHkuc3ZnJyxcbiAgICAgICAgJ2Fzc2V0cy9pbWFnZXMvYWxpZW5raXR0eV9leWVsaWQuc3ZnJ1xuICAgIF07XG5cbiAgICBzdGF0aWMgR1VJID0gL1s/Jl11aS8udGVzdChsb2NhdGlvbi5zZWFyY2gpO1xuICAgIHN0YXRpYyBPUkJJVCA9IC9bPyZdb3JiaXQvLnRlc3QobG9jYXRpb24uc2VhcmNoKTtcbn1cbiIsImV4cG9ydCBjbGFzcyBEZXZpY2Uge1xuICAgIHN0YXRpYyBhZ2VudCA9IG5hdmlnYXRvci51c2VyQWdlbnQudG9Mb3dlckNhc2UoKTtcblxuICAgIHN0YXRpYyBtb2JpbGUgPSAhIW5hdmlnYXRvci5tYXhUb3VjaFBvaW50cztcblxuICAgIHN0YXRpYyB0YWJsZXQgPSB0aGlzLm1vYmlsZSAmJiBNYXRoLm1heChzY3JlZW4ud2lkdGgsIHNjcmVlbi5oZWlnaHQpID4gMTAwMDtcblxuICAgIHN0YXRpYyBwaG9uZSA9IHRoaXMubW9iaWxlICYmICF0aGlzLnRhYmxldDtcblxuICAgIHN0YXRpYyB3ZWJnbCA9ICgoKSA9PiB7XG4gICAgICAgIGlmICh0eXBlb2Ygd2luZG93ID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgY29udGV4dE9wdGlvbnMgPSB7XG4gICAgICAgICAgICBmYWlsSWZNYWpvclBlcmZvcm1hbmNlQ2F2ZWF0OiB0cnVlXG4gICAgICAgIH07XG5cbiAgICAgICAgbGV0IGNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuICAgICAgICBsZXQgZ2wgPSBjYW52YXMuZ2V0Q29udGV4dCgnd2ViZ2wyJywgY29udGV4dE9wdGlvbnMpO1xuXG4gICAgICAgIGNvbnN0IHJlc3VsdCA9ICEhZ2w7XG5cbiAgICAgICAgZ2wgPSBudWxsO1xuICAgICAgICBjYW52YXMgPSBudWxsO1xuXG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfSkoKTtcbn1cbiIsImV4cG9ydCBjbGFzcyBFdmVudHMge1xuICAgIHN0YXRpYyBTVEFURV9DSEFOR0UgPSAnc3RhdGVfY2hhbmdlJztcbiAgICBzdGF0aWMgVklFV19DSEFOR0UgPSAndmlld19jaGFuZ2UnO1xuICAgIHN0YXRpYyBLRVlfRE9XTiA9ICdrZXlfZG93bic7XG4gICAgc3RhdGljIEtFWV9VUCA9ICdrZXlfdXAnO1xuICAgIHN0YXRpYyBLRVlfUFJFU1MgPSAna2V5X3ByZXNzJztcbiAgICBzdGF0aWMgUkVTSVpFID0gJ3Jlc2l6ZSc7XG4gICAgc3RhdGljIFZJU0lCSUxJVFkgPSAndmlzaWJpbGl0eSc7XG4gICAgc3RhdGljIFBST0dSRVNTID0gJ3Byb2dyZXNzJztcbiAgICBzdGF0aWMgQ09NUExFVEUgPSAnY29tcGxldGUnO1xuICAgIHN0YXRpYyBVUERBVEUgPSAndXBkYXRlJztcbiAgICBzdGF0aWMgSE9WRVIgPSAnaG92ZXInO1xuICAgIHN0YXRpYyBDTElDSyA9ICdjbGljayc7XG5cbiAgICBzdGF0aWMgQ09MT1JfUElDS0VSID0gJ2NvbG9yX3BpY2tlcic7XG4gICAgc3RhdGljIElOVkVSVCA9ICdpbnZlcnQnO1xufVxuIiwiY29uc3QgX2x1dCA9IFsgJzAwJywgJzAxJywgJzAyJywgJzAzJywgJzA0JywgJzA1JywgJzA2JywgJzA3JywgJzA4JywgJzA5JywgJzBhJywgJzBiJywgJzBjJywgJzBkJywgJzBlJywgJzBmJywgJzEwJywgJzExJywgJzEyJywgJzEzJywgJzE0JywgJzE1JywgJzE2JywgJzE3JywgJzE4JywgJzE5JywgJzFhJywgJzFiJywgJzFjJywgJzFkJywgJzFlJywgJzFmJywgJzIwJywgJzIxJywgJzIyJywgJzIzJywgJzI0JywgJzI1JywgJzI2JywgJzI3JywgJzI4JywgJzI5JywgJzJhJywgJzJiJywgJzJjJywgJzJkJywgJzJlJywgJzJmJywgJzMwJywgJzMxJywgJzMyJywgJzMzJywgJzM0JywgJzM1JywgJzM2JywgJzM3JywgJzM4JywgJzM5JywgJzNhJywgJzNiJywgJzNjJywgJzNkJywgJzNlJywgJzNmJywgJzQwJywgJzQxJywgJzQyJywgJzQzJywgJzQ0JywgJzQ1JywgJzQ2JywgJzQ3JywgJzQ4JywgJzQ5JywgJzRhJywgJzRiJywgJzRjJywgJzRkJywgJzRlJywgJzRmJywgJzUwJywgJzUxJywgJzUyJywgJzUzJywgJzU0JywgJzU1JywgJzU2JywgJzU3JywgJzU4JywgJzU5JywgJzVhJywgJzViJywgJzVjJywgJzVkJywgJzVlJywgJzVmJywgJzYwJywgJzYxJywgJzYyJywgJzYzJywgJzY0JywgJzY1JywgJzY2JywgJzY3JywgJzY4JywgJzY5JywgJzZhJywgJzZiJywgJzZjJywgJzZkJywgJzZlJywgJzZmJywgJzcwJywgJzcxJywgJzcyJywgJzczJywgJzc0JywgJzc1JywgJzc2JywgJzc3JywgJzc4JywgJzc5JywgJzdhJywgJzdiJywgJzdjJywgJzdkJywgJzdlJywgJzdmJywgJzgwJywgJzgxJywgJzgyJywgJzgzJywgJzg0JywgJzg1JywgJzg2JywgJzg3JywgJzg4JywgJzg5JywgJzhhJywgJzhiJywgJzhjJywgJzhkJywgJzhlJywgJzhmJywgJzkwJywgJzkxJywgJzkyJywgJzkzJywgJzk0JywgJzk1JywgJzk2JywgJzk3JywgJzk4JywgJzk5JywgJzlhJywgJzliJywgJzljJywgJzlkJywgJzllJywgJzlmJywgJ2EwJywgJ2ExJywgJ2EyJywgJ2EzJywgJ2E0JywgJ2E1JywgJ2E2JywgJ2E3JywgJ2E4JywgJ2E5JywgJ2FhJywgJ2FiJywgJ2FjJywgJ2FkJywgJ2FlJywgJ2FmJywgJ2IwJywgJ2IxJywgJ2IyJywgJ2IzJywgJ2I0JywgJ2I1JywgJ2I2JywgJ2I3JywgJ2I4JywgJ2I5JywgJ2JhJywgJ2JiJywgJ2JjJywgJ2JkJywgJ2JlJywgJ2JmJywgJ2MwJywgJ2MxJywgJ2MyJywgJ2MzJywgJ2M0JywgJ2M1JywgJ2M2JywgJ2M3JywgJ2M4JywgJ2M5JywgJ2NhJywgJ2NiJywgJ2NjJywgJ2NkJywgJ2NlJywgJ2NmJywgJ2QwJywgJ2QxJywgJ2QyJywgJ2QzJywgJ2Q0JywgJ2Q1JywgJ2Q2JywgJ2Q3JywgJ2Q4JywgJ2Q5JywgJ2RhJywgJ2RiJywgJ2RjJywgJ2RkJywgJ2RlJywgJ2RmJywgJ2UwJywgJ2UxJywgJ2UyJywgJ2UzJywgJ2U0JywgJ2U1JywgJ2U2JywgJ2U3JywgJ2U4JywgJ2U5JywgJ2VhJywgJ2ViJywgJ2VjJywgJ2VkJywgJ2VlJywgJ2VmJywgJ2YwJywgJ2YxJywgJ2YyJywgJ2YzJywgJ2Y0JywgJ2Y1JywgJ2Y2JywgJ2Y3JywgJ2Y4JywgJ2Y5JywgJ2ZhJywgJ2ZiJywgJ2ZjJywgJ2ZkJywgJ2ZlJywgJ2ZmJyBdO1xuXG5sZXQgX3NlZWQgPSAxMjM0NTY3O1xuXG5cbmNvbnN0IERFRzJSQUQgPSBNYXRoLlBJIC8gMTgwO1xuY29uc3QgUkFEMkRFRyA9IDE4MCAvIE1hdGguUEk7XG5cbi8vIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvMTA1MDM0L2hvdy10by1jcmVhdGUtYS1ndWlkLXV1aWQtaW4tamF2YXNjcmlwdC8yMTk2MzEzNiMyMTk2MzEzNlxuZnVuY3Rpb24gZ2VuZXJhdGVVVUlEKCkge1xuXG5cdGNvbnN0IGQwID0gTWF0aC5yYW5kb20oKSAqIDB4ZmZmZmZmZmYgfCAwO1xuXHRjb25zdCBkMSA9IE1hdGgucmFuZG9tKCkgKiAweGZmZmZmZmZmIHwgMDtcblx0Y29uc3QgZDIgPSBNYXRoLnJhbmRvbSgpICogMHhmZmZmZmZmZiB8IDA7XG5cdGNvbnN0IGQzID0gTWF0aC5yYW5kb20oKSAqIDB4ZmZmZmZmZmYgfCAwO1xuXHRjb25zdCB1dWlkID0gX2x1dFsgZDAgJiAweGZmIF0gKyBfbHV0WyBkMCA+PiA4ICYgMHhmZiBdICsgX2x1dFsgZDAgPj4gMTYgJiAweGZmIF0gKyBfbHV0WyBkMCA+PiAyNCAmIDB4ZmYgXSArICctJyArXG5cdFx0XHRfbHV0WyBkMSAmIDB4ZmYgXSArIF9sdXRbIGQxID4+IDggJiAweGZmIF0gKyAnLScgKyBfbHV0WyBkMSA+PiAxNiAmIDB4MGYgfCAweDQwIF0gKyBfbHV0WyBkMSA+PiAyNCAmIDB4ZmYgXSArICctJyArXG5cdFx0XHRfbHV0WyBkMiAmIDB4M2YgfCAweDgwIF0gKyBfbHV0WyBkMiA+PiA4ICYgMHhmZiBdICsgJy0nICsgX2x1dFsgZDIgPj4gMTYgJiAweGZmIF0gKyBfbHV0WyBkMiA+PiAyNCAmIDB4ZmYgXSArXG5cdFx0XHRfbHV0WyBkMyAmIDB4ZmYgXSArIF9sdXRbIGQzID4+IDggJiAweGZmIF0gKyBfbHV0WyBkMyA+PiAxNiAmIDB4ZmYgXSArIF9sdXRbIGQzID4+IDI0ICYgMHhmZiBdO1xuXG5cdC8vIC50b0xvd2VyQ2FzZSgpIGhlcmUgZmxhdHRlbnMgY29uY2F0ZW5hdGVkIHN0cmluZ3MgdG8gc2F2ZSBoZWFwIG1lbW9yeSBzcGFjZS5cblx0cmV0dXJuIHV1aWQudG9Mb3dlckNhc2UoKTtcblxufVxuXG5mdW5jdGlvbiBjbGFtcCggdmFsdWUsIG1pbiwgbWF4ICkge1xuXG5cdHJldHVybiBNYXRoLm1heCggbWluLCBNYXRoLm1pbiggbWF4LCB2YWx1ZSApICk7XG5cbn1cblxuLy8gY29tcHV0ZSBldWNsaWRlYW4gbW9kdWxvIG9mIG0gJSBuXG4vLyBodHRwczovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9Nb2R1bG9fb3BlcmF0aW9uXG5mdW5jdGlvbiBldWNsaWRlYW5Nb2R1bG8oIG4sIG0gKSB7XG5cblx0cmV0dXJuICggKCBuICUgbSApICsgbSApICUgbTtcblxufVxuXG4vLyBMaW5lYXIgbWFwcGluZyBmcm9tIHJhbmdlIDxhMSwgYTI+IHRvIHJhbmdlIDxiMSwgYjI+XG5mdW5jdGlvbiBtYXBMaW5lYXIoIHgsIGExLCBhMiwgYjEsIGIyICkge1xuXG5cdHJldHVybiBiMSArICggeCAtIGExICkgKiAoIGIyIC0gYjEgKSAvICggYTIgLSBhMSApO1xuXG59XG5cbi8vIGh0dHBzOi8vd3d3LmdhbWVkZXYubmV0L3R1dG9yaWFscy9wcm9ncmFtbWluZy9nZW5lcmFsLWFuZC1nYW1lcGxheS1wcm9ncmFtbWluZy9pbnZlcnNlLWxlcnAtYS1zdXBlci11c2VmdWwteWV0LW9mdGVuLW92ZXJsb29rZWQtZnVuY3Rpb24tcjUyMzAvXG5mdW5jdGlvbiBpbnZlcnNlTGVycCggeCwgeSwgdmFsdWUgKSB7XG5cblx0aWYgKCB4ICE9PSB5ICkge1xuXG5cdFx0cmV0dXJuICggdmFsdWUgLSB4ICkgLyAoIHkgLSB4ICk7XG5cblx0fSBlbHNlIHtcblxuXHRcdHJldHVybiAwO1xuXG5cdH1cblxufVxuXG4vLyBodHRwczovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9MaW5lYXJfaW50ZXJwb2xhdGlvblxuZnVuY3Rpb24gbGVycCggeCwgeSwgdCApIHtcblxuXHRyZXR1cm4gKCAxIC0gdCApICogeCArIHQgKiB5O1xuXG59XG5cbi8vIGh0dHA6Ly93d3cucm9yeWRyaXNjb2xsLmNvbS8yMDE2LzAzLzA3L2ZyYW1lLXJhdGUtaW5kZXBlbmRlbnQtZGFtcGluZy11c2luZy1sZXJwL1xuZnVuY3Rpb24gZGFtcCggeCwgeSwgbGFtYmRhLCBkdCApIHtcblxuXHRyZXR1cm4gbGVycCggeCwgeSwgMSAtIE1hdGguZXhwKCAtIGxhbWJkYSAqIGR0ICkgKTtcblxufVxuXG4vLyBodHRwczovL3d3dy5kZXNtb3MuY29tL2NhbGN1bGF0b3IvdmNzam55ejd4NFxuZnVuY3Rpb24gcGluZ3BvbmcoIHgsIGxlbmd0aCA9IDEgKSB7XG5cblx0cmV0dXJuIGxlbmd0aCAtIE1hdGguYWJzKCBldWNsaWRlYW5Nb2R1bG8oIHgsIGxlbmd0aCAqIDIgKSAtIGxlbmd0aCApO1xuXG59XG5cbi8vIGh0dHA6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvU21vb3Roc3RlcFxuZnVuY3Rpb24gc21vb3Roc3RlcCggeCwgbWluLCBtYXggKSB7XG5cblx0aWYgKCB4IDw9IG1pbiApIHJldHVybiAwO1xuXHRpZiAoIHggPj0gbWF4ICkgcmV0dXJuIDE7XG5cblx0eCA9ICggeCAtIG1pbiApIC8gKCBtYXggLSBtaW4gKTtcblxuXHRyZXR1cm4geCAqIHggKiAoIDMgLSAyICogeCApO1xuXG59XG5cbmZ1bmN0aW9uIHNtb290aGVyc3RlcCggeCwgbWluLCBtYXggKSB7XG5cblx0aWYgKCB4IDw9IG1pbiApIHJldHVybiAwO1xuXHRpZiAoIHggPj0gbWF4ICkgcmV0dXJuIDE7XG5cblx0eCA9ICggeCAtIG1pbiApIC8gKCBtYXggLSBtaW4gKTtcblxuXHRyZXR1cm4geCAqIHggKiB4ICogKCB4ICogKCB4ICogNiAtIDE1ICkgKyAxMCApO1xuXG59XG5cbi8vIFJhbmRvbSBpbnRlZ2VyIGZyb20gPGxvdywgaGlnaD4gaW50ZXJ2YWxcbmZ1bmN0aW9uIHJhbmRJbnQoIGxvdywgaGlnaCApIHtcblxuXHRyZXR1cm4gbG93ICsgTWF0aC5mbG9vciggTWF0aC5yYW5kb20oKSAqICggaGlnaCAtIGxvdyArIDEgKSApO1xuXG59XG5cbi8vIFJhbmRvbSBmbG9hdCBmcm9tIDxsb3csIGhpZ2g+IGludGVydmFsXG5mdW5jdGlvbiByYW5kRmxvYXQoIGxvdywgaGlnaCApIHtcblxuXHRyZXR1cm4gbG93ICsgTWF0aC5yYW5kb20oKSAqICggaGlnaCAtIGxvdyApO1xuXG59XG5cbi8vIFJhbmRvbSBmbG9hdCBmcm9tIDwtcmFuZ2UvMiwgcmFuZ2UvMj4gaW50ZXJ2YWxcbmZ1bmN0aW9uIHJhbmRGbG9hdFNwcmVhZCggcmFuZ2UgKSB7XG5cblx0cmV0dXJuIHJhbmdlICogKCAwLjUgLSBNYXRoLnJhbmRvbSgpICk7XG5cbn1cblxuLy8gRGV0ZXJtaW5pc3RpYyBwc2V1ZG8tcmFuZG9tIGZsb2F0IGluIHRoZSBpbnRlcnZhbCBbIDAsIDEgXVxuZnVuY3Rpb24gc2VlZGVkUmFuZG9tKCBzICkge1xuXG5cdGlmICggcyAhPT0gdW5kZWZpbmVkICkgX3NlZWQgPSBzO1xuXG5cdC8vIE11bGJlcnJ5MzIgZ2VuZXJhdG9yXG5cblx0bGV0IHQgPSBfc2VlZCArPSAweDZEMkI3OUY1O1xuXG5cdHQgPSBNYXRoLmltdWwoIHQgXiB0ID4+PiAxNSwgdCB8IDEgKTtcblxuXHR0IF49IHQgKyBNYXRoLmltdWwoIHQgXiB0ID4+PiA3LCB0IHwgNjEgKTtcblxuXHRyZXR1cm4gKCAoIHQgXiB0ID4+PiAxNCApID4+PiAwICkgLyA0Mjk0OTY3Mjk2O1xuXG59XG5cbmZ1bmN0aW9uIGRlZ1RvUmFkKCBkZWdyZWVzICkge1xuXG5cdHJldHVybiBkZWdyZWVzICogREVHMlJBRDtcblxufVxuXG5mdW5jdGlvbiByYWRUb0RlZyggcmFkaWFucyApIHtcblxuXHRyZXR1cm4gcmFkaWFucyAqIFJBRDJERUc7XG5cbn1cblxuZnVuY3Rpb24gaXNQb3dlck9mVHdvKCB2YWx1ZSApIHtcblxuXHRyZXR1cm4gKCB2YWx1ZSAmICggdmFsdWUgLSAxICkgKSA9PT0gMCAmJiB2YWx1ZSAhPT0gMDtcblxufVxuXG5mdW5jdGlvbiBjZWlsUG93ZXJPZlR3byggdmFsdWUgKSB7XG5cblx0cmV0dXJuIE1hdGgucG93KCAyLCBNYXRoLmNlaWwoIE1hdGgubG9nKCB2YWx1ZSApIC8gTWF0aC5MTjIgKSApO1xuXG59XG5cbmZ1bmN0aW9uIGZsb29yUG93ZXJPZlR3byggdmFsdWUgKSB7XG5cblx0cmV0dXJuIE1hdGgucG93KCAyLCBNYXRoLmZsb29yKCBNYXRoLmxvZyggdmFsdWUgKSAvIE1hdGguTE4yICkgKTtcblxufVxuXG5mdW5jdGlvbiBzZXRRdWF0ZXJuaW9uRnJvbVByb3BlckV1bGVyKCBxLCBhLCBiLCBjLCBvcmRlciApIHtcblxuXHQvLyBJbnRyaW5zaWMgUHJvcGVyIEV1bGVyIEFuZ2xlcyAtIHNlZSBodHRwczovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9FdWxlcl9hbmdsZXNcblxuXHQvLyByb3RhdGlvbnMgYXJlIGFwcGxpZWQgdG8gdGhlIGF4ZXMgaW4gdGhlIG9yZGVyIHNwZWNpZmllZCBieSAnb3JkZXInXG5cdC8vIHJvdGF0aW9uIGJ5IGFuZ2xlICdhJyBpcyBhcHBsaWVkIGZpcnN0LCB0aGVuIGJ5IGFuZ2xlICdiJywgdGhlbiBieSBhbmdsZSAnYydcblx0Ly8gYW5nbGVzIGFyZSBpbiByYWRpYW5zXG5cblx0Y29uc3QgY29zID0gTWF0aC5jb3M7XG5cdGNvbnN0IHNpbiA9IE1hdGguc2luO1xuXG5cdGNvbnN0IGMyID0gY29zKCBiIC8gMiApO1xuXHRjb25zdCBzMiA9IHNpbiggYiAvIDIgKTtcblxuXHRjb25zdCBjMTMgPSBjb3MoICggYSArIGMgKSAvIDIgKTtcblx0Y29uc3QgczEzID0gc2luKCAoIGEgKyBjICkgLyAyICk7XG5cblx0Y29uc3QgYzFfMyA9IGNvcyggKCBhIC0gYyApIC8gMiApO1xuXHRjb25zdCBzMV8zID0gc2luKCAoIGEgLSBjICkgLyAyICk7XG5cblx0Y29uc3QgYzNfMSA9IGNvcyggKCBjIC0gYSApIC8gMiApO1xuXHRjb25zdCBzM18xID0gc2luKCAoIGMgLSBhICkgLyAyICk7XG5cblx0c3dpdGNoICggb3JkZXIgKSB7XG5cblx0XHRjYXNlICdYWVgnOlxuXHRcdFx0cS5zZXQoIGMyICogczEzLCBzMiAqIGMxXzMsIHMyICogczFfMywgYzIgKiBjMTMgKTtcblx0XHRcdGJyZWFrO1xuXG5cdFx0Y2FzZSAnWVpZJzpcblx0XHRcdHEuc2V0KCBzMiAqIHMxXzMsIGMyICogczEzLCBzMiAqIGMxXzMsIGMyICogYzEzICk7XG5cdFx0XHRicmVhaztcblxuXHRcdGNhc2UgJ1pYWic6XG5cdFx0XHRxLnNldCggczIgKiBjMV8zLCBzMiAqIHMxXzMsIGMyICogczEzLCBjMiAqIGMxMyApO1xuXHRcdFx0YnJlYWs7XG5cblx0XHRjYXNlICdYWlgnOlxuXHRcdFx0cS5zZXQoIGMyICogczEzLCBzMiAqIHMzXzEsIHMyICogYzNfMSwgYzIgKiBjMTMgKTtcblx0XHRcdGJyZWFrO1xuXG5cdFx0Y2FzZSAnWVhZJzpcblx0XHRcdHEuc2V0KCBzMiAqIGMzXzEsIGMyICogczEzLCBzMiAqIHMzXzEsIGMyICogYzEzICk7XG5cdFx0XHRicmVhaztcblxuXHRcdGNhc2UgJ1pZWic6XG5cdFx0XHRxLnNldCggczIgKiBzM18xLCBzMiAqIGMzXzEsIGMyICogczEzLCBjMiAqIGMxMyApO1xuXHRcdFx0YnJlYWs7XG5cblx0XHRkZWZhdWx0OlxuXHRcdFx0Y29uc29sZS53YXJuKCAnVEhSRUUuTWF0aFV0aWxzOiAuc2V0UXVhdGVybmlvbkZyb21Qcm9wZXJFdWxlcigpIGVuY291bnRlcmVkIGFuIHVua25vd24gb3JkZXI6ICcgKyBvcmRlciApO1xuXG5cdH1cblxufVxuXG5mdW5jdGlvbiBkZW5vcm1hbGl6ZSggdmFsdWUsIGFycmF5ICkge1xuXG5cdHN3aXRjaCAoIGFycmF5LmNvbnN0cnVjdG9yICkge1xuXG5cdFx0Y2FzZSBGbG9hdDMyQXJyYXk6XG5cblx0XHRcdHJldHVybiB2YWx1ZTtcblxuXHRcdGNhc2UgVWludDE2QXJyYXk6XG5cblx0XHRcdHJldHVybiB2YWx1ZSAvIDY1NTM1LjA7XG5cblx0XHRjYXNlIFVpbnQ4QXJyYXk6XG5cblx0XHRcdHJldHVybiB2YWx1ZSAvIDI1NS4wO1xuXG5cdFx0Y2FzZSBJbnQxNkFycmF5OlxuXG5cdFx0XHRyZXR1cm4gTWF0aC5tYXgoIHZhbHVlIC8gMzI3NjcuMCwgLSAxLjAgKTtcblxuXHRcdGNhc2UgSW50OEFycmF5OlxuXG5cdFx0XHRyZXR1cm4gTWF0aC5tYXgoIHZhbHVlIC8gMTI3LjAsIC0gMS4wICk7XG5cblx0XHRkZWZhdWx0OlxuXG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoICdJbnZhbGlkIGNvbXBvbmVudCB0eXBlLicgKTtcblxuXHR9XG5cbn1cblxuZnVuY3Rpb24gbm9ybWFsaXplKCB2YWx1ZSwgYXJyYXkgKSB7XG5cblx0c3dpdGNoICggYXJyYXkuY29uc3RydWN0b3IgKSB7XG5cblx0XHRjYXNlIEZsb2F0MzJBcnJheTpcblxuXHRcdFx0cmV0dXJuIHZhbHVlO1xuXG5cdFx0Y2FzZSBVaW50MTZBcnJheTpcblxuXHRcdFx0cmV0dXJuIE1hdGgucm91bmQoIHZhbHVlICogNjU1MzUuMCApO1xuXG5cdFx0Y2FzZSBVaW50OEFycmF5OlxuXG5cdFx0XHRyZXR1cm4gTWF0aC5yb3VuZCggdmFsdWUgKiAyNTUuMCApO1xuXG5cdFx0Y2FzZSBJbnQxNkFycmF5OlxuXG5cdFx0XHRyZXR1cm4gTWF0aC5yb3VuZCggdmFsdWUgKiAzMjc2Ny4wICk7XG5cblx0XHRjYXNlIEludDhBcnJheTpcblxuXHRcdFx0cmV0dXJuIE1hdGgucm91bmQoIHZhbHVlICogMTI3LjAgKTtcblxuXHRcdGRlZmF1bHQ6XG5cblx0XHRcdHRocm93IG5ldyBFcnJvciggJ0ludmFsaWQgY29tcG9uZW50IHR5cGUuJyApO1xuXG5cdH1cblxufVxuXG5jb25zdCBNYXRoVXRpbHMgPSB7XG5cdERFRzJSQUQ6IERFRzJSQUQsXG5cdFJBRDJERUc6IFJBRDJERUcsXG5cdGdlbmVyYXRlVVVJRDogZ2VuZXJhdGVVVUlELFxuXHRjbGFtcDogY2xhbXAsXG5cdGV1Y2xpZGVhbk1vZHVsbzogZXVjbGlkZWFuTW9kdWxvLFxuXHRtYXBMaW5lYXI6IG1hcExpbmVhcixcblx0aW52ZXJzZUxlcnA6IGludmVyc2VMZXJwLFxuXHRsZXJwOiBsZXJwLFxuXHRkYW1wOiBkYW1wLFxuXHRwaW5ncG9uZzogcGluZ3BvbmcsXG5cdHNtb290aHN0ZXA6IHNtb290aHN0ZXAsXG5cdHNtb290aGVyc3RlcDogc21vb3RoZXJzdGVwLFxuXHRyYW5kSW50OiByYW5kSW50LFxuXHRyYW5kRmxvYXQ6IHJhbmRGbG9hdCxcblx0cmFuZEZsb2F0U3ByZWFkOiByYW5kRmxvYXRTcHJlYWQsXG5cdHNlZWRlZFJhbmRvbTogc2VlZGVkUmFuZG9tLFxuXHRkZWdUb1JhZDogZGVnVG9SYWQsXG5cdHJhZFRvRGVnOiByYWRUb0RlZyxcblx0aXNQb3dlck9mVHdvOiBpc1Bvd2VyT2ZUd28sXG5cdGNlaWxQb3dlck9mVHdvOiBjZWlsUG93ZXJPZlR3byxcblx0Zmxvb3JQb3dlck9mVHdvOiBmbG9vclBvd2VyT2ZUd28sXG5cdHNldFF1YXRlcm5pb25Gcm9tUHJvcGVyRXVsZXI6IHNldFF1YXRlcm5pb25Gcm9tUHJvcGVyRXVsZXIsXG5cdG5vcm1hbGl6ZTogbm9ybWFsaXplLFxuXHRkZW5vcm1hbGl6ZTogZGVub3JtYWxpemVcbn07XG5cbmV4cG9ydCB7XG5cdERFRzJSQUQsXG5cdFJBRDJERUcsXG5cdGdlbmVyYXRlVVVJRCxcblx0Y2xhbXAsXG5cdGV1Y2xpZGVhbk1vZHVsbyxcblx0bWFwTGluZWFyLFxuXHRpbnZlcnNlTGVycCxcblx0bGVycCxcblx0ZGFtcCxcblx0cGluZ3BvbmcsXG5cdHNtb290aHN0ZXAsXG5cdHNtb290aGVyc3RlcCxcblx0cmFuZEludCxcblx0cmFuZEZsb2F0LFxuXHRyYW5kRmxvYXRTcHJlYWQsXG5cdHNlZWRlZFJhbmRvbSxcblx0ZGVnVG9SYWQsXG5cdHJhZFRvRGVnLFxuXHRpc1Bvd2VyT2ZUd28sXG5cdGNlaWxQb3dlck9mVHdvLFxuXHRmbG9vclBvd2VyT2ZUd28sXG5cdHNldFF1YXRlcm5pb25Gcm9tUHJvcGVyRXVsZXIsXG5cdG5vcm1hbGl6ZSxcblx0ZGVub3JtYWxpemUsXG5cdE1hdGhVdGlsc1xufTtcbiIsIi8qKlxuICogQGF1dGhvciBwc2Nocm9lbiAvIGh0dHBzOi8vdWZvLmFpL1xuICovXG5cbmltcG9ydCB7IHJhbmRJbnQgfSBmcm9tICd0aHJlZS9zcmMvbWF0aC9NYXRoVXRpbHMuanMnO1xuXG5leHBvcnQgKiBmcm9tICd0aHJlZS9zcmMvbWF0aC9NYXRoVXRpbHMuanMnO1xuXG5leHBvcnQgZnVuY3Rpb24gc2h1ZmZsZShhcnJheSkge1xuICAgIHJldHVybiBhcnJheS5zb3J0KCgpID0+IE1hdGgucmFuZG9tKCkgLSAwLjUpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaGVhZHNUYWlscyhoZWFkcywgdGFpbHMpIHtcbiAgICBpZiAodHlwZW9mIGhlYWRzID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICByZXR1cm4gcmFuZEludCgwLCAxKTtcbiAgICB9XG5cbiAgICByZXR1cm4gcmFuZEludCgwLCAxKSA/IHRhaWxzIDogaGVhZHM7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBndWlkKCkge1xuICAgIHJldHVybiAoRGF0ZS5ub3coKSArIHJhbmRJbnQoMCwgOTk5OTkpKS50b1N0cmluZygpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYnJpZ2h0bmVzcyhjb2xvcikge1xuICAgIHJldHVybiBjb2xvci5yICogMC4zICsgY29sb3IuZyAqIDAuNTkgKyBjb2xvci5iICogMC4xMTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGJhc2VuYW1lKHBhdGgsIGV4dCkge1xuICAgIGNvbnN0IG5hbWUgPSBwYXRoLnNwbGl0KCcvJykucG9wKCkuc3BsaXQoJz8nKVswXTtcblxuICAgIHJldHVybiAhZXh0ID8gbmFtZS5zcGxpdCgnLicpWzBdIDogbmFtZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGV4dGVuc2lvbihwYXRoKSB7XG4gICAgcmV0dXJuIHBhdGguc3BsaXQoJy4nKS5wb3AoKS5zcGxpdCgnPycpWzBdLnRvTG93ZXJDYXNlKCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhYnNvbHV0ZShwYXRoKSB7XG4gICAgaWYgKHBhdGguaW5jbHVkZXMoJy8vJykpIHtcbiAgICAgICAgcmV0dXJuIHBhdGg7XG4gICAgfVxuXG4gICAgY29uc3QgcG9ydCA9IE51bWJlcihsb2NhdGlvbi5wb3J0KSA+IDEwMDAgPyBgOiR7bG9jYXRpb24ucG9ydH1gIDogJyc7XG4gICAgY29uc3QgcGF0aG5hbWUgPSBwYXRoLnN0YXJ0c1dpdGgoJy8nKSA/IHBhdGggOiBgJHtsb2NhdGlvbi5wYXRobmFtZS5yZXBsYWNlKC9cXC9bXi9dKiQvLCAnLycpfSR7cGF0aH1gO1xuXG4gICAgcmV0dXJuIGAke2xvY2F0aW9uLnByb3RvY29sfS8vJHtsb2NhdGlvbi5ob3N0bmFtZX0ke3BvcnR9JHtwYXRobmFtZX1gO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0S2V5QnlWYWx1ZShvYmplY3QsIHZhbHVlKSB7XG4gICAgcmV0dXJuIE9iamVjdC5rZXlzKG9iamVjdCkuZmluZChrZXkgPT4gb2JqZWN0W2tleV0gPT09IHZhbHVlKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldENvbnN0cnVjdG9yKG9iamVjdCkge1xuICAgIGNvbnN0IGlzSW5zdGFuY2UgPSB0eXBlb2Ygb2JqZWN0ICE9PSAnZnVuY3Rpb24nO1xuICAgIGNvbnN0IGNvZGUgPSBpc0luc3RhbmNlID8gb2JqZWN0LmNvbnN0cnVjdG9yLnRvU3RyaW5nKCkgOiBvYmplY3QudG9TdHJpbmcoKTtcbiAgICBjb25zdCBuYW1lID0gY29kZS5tYXRjaCgvKD86Y2xhc3N8ZnVuY3Rpb24pXFxzKFteXFxzeyhdKykvKVsxXTtcblxuICAgIHJldHVybiB7IG5hbWUsIGNvZGUsIGlzSW5zdGFuY2UgfTtcbn1cbiIsIi8qKlxuICogQGF1dGhvciBwc2Nocm9lbiAvIGh0dHBzOi8vdWZvLmFpL1xuICovXG5cbmltcG9ydCB7IGd1aWQgfSBmcm9tICcuLi91dGlscy9VdGlscy5qcyc7XG5cbmV4cG9ydCBjbGFzcyBBc3NldHMge1xuICAgIHN0YXRpYyBwYXRoID0gJyc7XG4gICAgc3RhdGljIGNyb3NzT3JpZ2luO1xuICAgIHN0YXRpYyBvcHRpb25zO1xuICAgIHN0YXRpYyBjYWNoZSA9IGZhbHNlO1xuICAgIHN0YXRpYyBmaWxlcyA9IHt9O1xuXG4gICAgc3RhdGljIGFkZChrZXksIGZpbGUpIHtcbiAgICAgICAgaWYgKCF0aGlzLmNhY2hlKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmZpbGVzW2tleV0gPSBmaWxlO1xuICAgIH1cblxuICAgIHN0YXRpYyBnZXQoa2V5KSB7XG4gICAgICAgIGlmICghdGhpcy5jYWNoZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuZmlsZXNba2V5XTtcbiAgICB9XG5cbiAgICBzdGF0aWMgcmVtb3ZlKGtleSkge1xuICAgICAgICBkZWxldGUgdGhpcy5maWxlc1trZXldO1xuICAgIH1cblxuICAgIHN0YXRpYyBjbGVhcigpIHtcbiAgICAgICAgdGhpcy5maWxlcyA9IHt9O1xuICAgIH1cblxuICAgIHN0YXRpYyBmaWx0ZXIoY2FsbGJhY2spIHtcbiAgICAgICAgY29uc3QgZmlsZXMgPSBPYmplY3Qua2V5cyh0aGlzLmZpbGVzKS5maWx0ZXIoY2FsbGJhY2spLnJlZHVjZSgob2JqZWN0LCBrZXkpID0+IHtcbiAgICAgICAgICAgIG9iamVjdFtrZXldID0gdGhpcy5maWxlc1trZXldO1xuXG4gICAgICAgICAgICByZXR1cm4gb2JqZWN0O1xuICAgICAgICB9LCB7fSk7XG5cbiAgICAgICAgcmV0dXJuIGZpbGVzO1xuICAgIH1cblxuICAgIHN0YXRpYyBnZXRQYXRoKHBhdGgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucGF0aCArIHBhdGg7XG4gICAgfVxuXG4gICAgc3RhdGljIGxvYWRJbWFnZShwYXRoLCBjYWxsYmFjaykge1xuICAgICAgICBjb25zdCBpbWFnZSA9IG5ldyBJbWFnZSgpO1xuXG4gICAgICAgIGltYWdlLmNyb3NzT3JpZ2luID0gdGhpcy5jcm9zc09yaWdpbjtcbiAgICAgICAgaW1hZ2Uuc3JjID0gdGhpcy5nZXRQYXRoKHBhdGgpO1xuXG4gICAgICAgIGNvbnN0IHByb21pc2UgPSBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICBpbWFnZS5vbmxvYWQgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZShpbWFnZSk7XG5cbiAgICAgICAgICAgICAgICBpbWFnZS5vbmxvYWQgPSBudWxsO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgaW1hZ2Uub25lcnJvciA9IGV2ZW50ID0+IHtcbiAgICAgICAgICAgICAgICByZWplY3QoZXZlbnQpO1xuXG4gICAgICAgICAgICAgICAgaW1hZ2Uub25lcnJvciA9IG51bGw7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9KTtcblxuICAgICAgICBpZiAoY2FsbGJhY2spIHtcbiAgICAgICAgICAgIHByb21pc2UudGhlbihjYWxsYmFjayk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcHJvbWlzZTtcbiAgICB9XG5cbiAgICBzdGF0aWMgbG9hZERhdGEocGF0aCwgY2FsbGJhY2spIHtcbiAgICAgICAgY29uc3QgcHJvbWlzZSA9IGZldGNoKGAke3RoaXMuZ2V0UGF0aChwYXRoKX0/JHtndWlkKCl9YCwgdGhpcy5vcHRpb25zKS50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgIHJldHVybiByZXNwb25zZS5qc29uKCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmIChjYWxsYmFjaykge1xuICAgICAgICAgICAgcHJvbWlzZS50aGVuKGNhbGxiYWNrKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBwcm9taXNlO1xuICAgIH1cbn1cbiIsIi8qKlxuICogQGF1dGhvciBwc2Nocm9lbiAvIGh0dHBzOi8vdWZvLmFpL1xuICovXG5cbmV4cG9ydCBjbGFzcyBFdmVudEVtaXR0ZXIge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLmNhbGxiYWNrcyA9IHt9O1xuICAgIH1cblxuICAgIG9uKHR5cGUsIGNhbGxiYWNrKSB7XG4gICAgICAgIGlmICghdGhpcy5jYWxsYmFja3NbdHlwZV0pIHtcbiAgICAgICAgICAgIHRoaXMuY2FsbGJhY2tzW3R5cGVdID0gW107XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmNhbGxiYWNrc1t0eXBlXS5wdXNoKGNhbGxiYWNrKTtcbiAgICB9XG5cbiAgICBvZmYodHlwZSwgY2FsbGJhY2spIHtcbiAgICAgICAgaWYgKCF0aGlzLmNhbGxiYWNrc1t0eXBlXSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGNhbGxiYWNrKSB7XG4gICAgICAgICAgICBjb25zdCBpbmRleCA9IHRoaXMuY2FsbGJhY2tzW3R5cGVdLmluZGV4T2YoY2FsbGJhY2spO1xuXG4gICAgICAgICAgICBpZiAofmluZGV4KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jYWxsYmFja3NbdHlwZV0uc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzLmNhbGxiYWNrc1t0eXBlXTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGVtaXQodHlwZSwgZXZlbnQgPSB7fSkge1xuICAgICAgICBpZiAoIXRoaXMuY2FsbGJhY2tzW3R5cGVdKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBzdGFjayA9IHRoaXMuY2FsbGJhY2tzW3R5cGVdLnNsaWNlKCk7XG5cbiAgICAgICAgZm9yIChsZXQgaSA9IDAsIGwgPSBzdGFjay5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgICAgIHN0YWNrW2ldLmNhbGwodGhpcywgZXZlbnQpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZGVzdHJveSgpIHtcbiAgICAgICAgZm9yIChjb25zdCBwcm9wIGluIHRoaXMpIHtcbiAgICAgICAgICAgIHRoaXNbcHJvcF0gPSBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxufVxuIiwiLyoqXG4gKiBAYXV0aG9yIHBzY2hyb2VuIC8gaHR0cHM6Ly91Zm8uYWkvXG4gKi9cblxuaW1wb3J0IHsgRXZlbnRzIH0gZnJvbSAnLi4vY29uZmlnL0V2ZW50cy5qcyc7XG5pbXBvcnQgeyBFdmVudEVtaXR0ZXIgfSBmcm9tICcuLi91dGlscy9FdmVudEVtaXR0ZXIuanMnO1xuXG5leHBvcnQgY2xhc3MgTG9hZGVyIHtcbiAgICBjb25zdHJ1Y3Rvcihhc3NldHMgPSBbXSwgY2FsbGJhY2spIHtcbiAgICAgICAgdGhpcy5hc3NldHMgPSBhc3NldHM7XG4gICAgICAgIHRoaXMuY2FsbGJhY2sgPSBjYWxsYmFjaztcbiAgICAgICAgdGhpcy5ldmVudHMgPSBuZXcgRXZlbnRFbWl0dGVyKCk7XG4gICAgICAgIHRoaXMudG90YWwgPSAwO1xuICAgICAgICB0aGlzLmxvYWRlZCA9IDA7XG4gICAgICAgIHRoaXMucHJvZ3Jlc3MgPSAwO1xuICAgICAgICB0aGlzLnByb21pc2UgPSBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHRoaXMucmVzb2x2ZSA9IHJlc29sdmUpO1xuXG4gICAgICAgIGFzc2V0cy5mb3JFYWNoKHBhdGggPT4gdGhpcy5sb2FkKHBhdGgpKTtcbiAgICB9XG5cbiAgICBsb2FkKC8qIHBhdGgsIGNhbGxiYWNrICovKSB7fVxuXG4gICAgbG9hZEFzeW5jKHBhdGgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKHJlc29sdmUgPT4gdGhpcy5sb2FkKHBhdGgsIHJlc29sdmUpKTtcbiAgICB9XG5cbiAgICBpbmNyZW1lbnQoKSB7XG4gICAgICAgIHRoaXMucHJvZ3Jlc3MgPSArK3RoaXMubG9hZGVkIC8gdGhpcy50b3RhbDtcblxuICAgICAgICB0aGlzLmV2ZW50cy5lbWl0KEV2ZW50cy5QUk9HUkVTUywgeyBwcm9ncmVzczogdGhpcy5wcm9ncmVzcyB9KTtcblxuICAgICAgICBpZiAodGhpcy5sb2FkZWQgPT09IHRoaXMudG90YWwpIHtcbiAgICAgICAgICAgIHRoaXMuY29tcGxldGUoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGNvbXBsZXRlKCkge1xuICAgICAgICB0aGlzLnJlc29sdmUoKTtcblxuICAgICAgICB0aGlzLmV2ZW50cy5lbWl0KEV2ZW50cy5DT01QTEVURSk7XG5cbiAgICAgICAgaWYgKHRoaXMuY2FsbGJhY2spIHtcbiAgICAgICAgICAgIHRoaXMuY2FsbGJhY2soKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGFkZChudW0gPSAxKSB7XG4gICAgICAgIHRoaXMudG90YWwgKz0gbnVtO1xuICAgIH1cblxuICAgIHRyaWdnZXIobnVtID0gMSkge1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG51bTsgaSsrKSB7XG4gICAgICAgICAgICB0aGlzLmluY3JlbWVudCgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmVhZHkoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnRvdGFsID8gdGhpcy5wcm9taXNlIDogUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgfVxuXG4gICAgZGVzdHJveSgpIHtcbiAgICAgICAgdGhpcy5ldmVudHMuZGVzdHJveSgpO1xuXG4gICAgICAgIGZvciAoY29uc3QgcHJvcCBpbiB0aGlzKSB7XG4gICAgICAgICAgICB0aGlzW3Byb3BdID0gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbn1cbiIsIi8qKlxuICogQGF1dGhvciBwc2Nocm9lbiAvIGh0dHBzOi8vdWZvLmFpL1xuICovXG5cbmltcG9ydCB7IEV2ZW50cyB9IGZyb20gJy4uL2NvbmZpZy9FdmVudHMuanMnO1xuaW1wb3J0IHsgTG9hZGVyIH0gZnJvbSAnLi9Mb2FkZXIuanMnO1xuXG5leHBvcnQgY2xhc3MgTXVsdGlMb2FkZXIgZXh0ZW5kcyBMb2FkZXIge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBzdXBlcigpO1xuXG4gICAgICAgIHRoaXMubG9hZGVycyA9IFtdO1xuICAgICAgICB0aGlzLndlaWdodHMgPSBbXTtcbiAgICB9XG5cbiAgICBsb2FkKGxvYWRlciwgd2VpZ2h0ID0gMSkge1xuICAgICAgICBsb2FkZXIuZXZlbnRzLm9uKEV2ZW50cy5QUk9HUkVTUywgdGhpcy5vblByb2dyZXNzKTtcbiAgICAgICAgbG9hZGVyLmV2ZW50cy5vbihFdmVudHMuQ09NUExFVEUsIHRoaXMub25Db21wbGV0ZSk7XG5cbiAgICAgICAgdGhpcy5sb2FkZXJzLnB1c2gobG9hZGVyKTtcbiAgICAgICAgdGhpcy53ZWlnaHRzLnB1c2god2VpZ2h0KTtcblxuICAgICAgICB0aGlzLnRvdGFsICs9IHdlaWdodDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBFdmVudCBoYW5kbGVyc1xuICAgICAqL1xuXG4gICAgb25Qcm9ncmVzcyA9ICgpID0+IHtcbiAgICAgICAgbGV0IGxvYWRlZCA9IHRoaXMubG9hZGVkO1xuXG4gICAgICAgIGZvciAobGV0IGkgPSAwLCBsID0gdGhpcy5sb2FkZXJzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICAgICAgbG9hZGVkICs9IHRoaXMud2VpZ2h0c1tpXSAqIHRoaXMubG9hZGVyc1tpXS5wcm9ncmVzcztcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHByb2dyZXNzID0gbG9hZGVkIC8gdGhpcy50b3RhbDtcblxuICAgICAgICBpZiAocHJvZ3Jlc3MgPCAxKSB7XG4gICAgICAgICAgICB0aGlzLmV2ZW50cy5lbWl0KEV2ZW50cy5QUk9HUkVTUywgeyBwcm9ncmVzcyB9KTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBvbkNvbXBsZXRlID0gKCkgPT4ge1xuICAgICAgICB0aGlzLmluY3JlbWVudCgpO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBQdWJsaWMgbWV0aG9kc1xuICAgICAqL1xuXG4gICAgZGVzdHJveSA9ICgpID0+IHtcbiAgICAgICAgZm9yIChsZXQgaSA9IHRoaXMubG9hZGVycy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgICAgICAgaWYgKHRoaXMubG9hZGVyc1tpXSAmJiB0aGlzLmxvYWRlcnNbaV0uZGVzdHJveSkge1xuICAgICAgICAgICAgICAgIHRoaXMubG9hZGVyc1tpXS5kZXN0cm95KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gc3VwZXIuZGVzdHJveSgpO1xuICAgIH07XG59XG4iLCIvKipcbiAqIEBhdXRob3IgcHNjaHJvZW4gLyBodHRwczovL3Vmby5haS9cbiAqL1xuXG5pbXBvcnQgeyBMb2FkZXIgfSBmcm9tICcuL0xvYWRlci5qcyc7XG5cbmV4cG9ydCBjbGFzcyBGb250TG9hZGVyIGV4dGVuZHMgTG9hZGVyIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgc3VwZXIoKTtcblxuICAgICAgICB0aGlzLmxvYWQoKTtcbiAgICB9XG5cbiAgICBsb2FkKCkge1xuICAgICAgICBkb2N1bWVudC5mb250cy5yZWFkeS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuaW5jcmVtZW50KCk7XG4gICAgICAgIH0pLmNhdGNoKCgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuaW5jcmVtZW50KCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMudG90YWwrKztcbiAgICB9XG59XG4iLCIvKipcbiAqIEBhdXRob3IgcHNjaHJvZW4gLyBodHRwczovL3Vmby5haS9cbiAqL1xuXG5pbXBvcnQgeyBBc3NldHMgfSBmcm9tICcuL0Fzc2V0cy5qcyc7XG5pbXBvcnQgeyBMb2FkZXIgfSBmcm9tICcuL0xvYWRlci5qcyc7XG5cbmV4cG9ydCBjbGFzcyBBc3NldExvYWRlciBleHRlbmRzIExvYWRlciB7XG4gICAgbG9hZChwYXRoLCBjYWxsYmFjaykge1xuICAgICAgICBjb25zdCBjYWNoZWQgPSBBc3NldHMuZ2V0KHBhdGgpO1xuXG4gICAgICAgIGxldCBwcm9taXNlO1xuXG4gICAgICAgIGlmIChjYWNoZWQpIHtcbiAgICAgICAgICAgIHByb21pc2UgPSBQcm9taXNlLnJlc29sdmUoY2FjaGVkKTtcbiAgICAgICAgfSBlbHNlIGlmICgvXFwuKGpwZT9nfHBuZ3xnaWZ8c3ZnKS8udGVzdChwYXRoKSkge1xuICAgICAgICAgICAgcHJvbWlzZSA9IEFzc2V0cy5sb2FkSW1hZ2UocGF0aCk7XG4gICAgICAgIH0gZWxzZSBpZiAoL1xcLmpzb24vLnRlc3QocGF0aCkpIHtcbiAgICAgICAgICAgIHByb21pc2UgPSBBc3NldHMubG9hZERhdGEocGF0aCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBwcm9taXNlID0gZmV0Y2goQXNzZXRzLmdldFBhdGgocGF0aCksIEFzc2V0cy5vcHRpb25zKS50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoL1xcLihtcDN8bTRhfG9nZ3x3YXZ8YWlmZj8pLy50ZXN0KHBhdGgpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXNwb25zZS5hcnJheUJ1ZmZlcigpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXNwb25zZS50ZXh0KCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICBwcm9taXNlLnRoZW4oZGF0YSA9PiB7XG4gICAgICAgICAgICBBc3NldHMuYWRkKHBhdGgsIGRhdGEpO1xuXG4gICAgICAgICAgICB0aGlzLmluY3JlbWVudCgpO1xuXG4gICAgICAgICAgICBpZiAoY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhkYXRhKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSkuY2F0Y2goZXZlbnQgPT4ge1xuICAgICAgICAgICAgdGhpcy5pbmNyZW1lbnQoKTtcblxuICAgICAgICAgICAgaWYgKGNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2soZXZlbnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLnRvdGFsKys7XG4gICAgfVxufVxuIiwiLyoqXG4gKiBAYXV0aG9yIHBzY2hyb2VuIC8gaHR0cHM6Ly91Zm8uYWkvXG4gKlxuICogQmFzZWQgb24gaHR0cHM6Ly9naXRodWIuY29tL2dyZS9iZXppZXItZWFzaW5nXG4gKi9cblxuLy8gVGhlc2UgdmFsdWVzIGFyZSBlc3RhYmxpc2hlZCBieSBlbXBpcmljaXNtIHdpdGggdGVzdHMgKHRyYWRlb2ZmOiBwZXJmb3JtYW5jZSBWUyBwcmVjaXNpb24pXG5jb25zdCBORVdUT05fSVRFUkFUSU9OUyA9IDQ7XG5jb25zdCBORVdUT05fTUlOX1NMT1BFID0gMC4wMDE7XG5jb25zdCBTVUJESVZJU0lPTl9QUkVDSVNJT04gPSAwLjAwMDAwMDE7XG5jb25zdCBTVUJESVZJU0lPTl9NQVhfSVRFUkFUSU9OUyA9IDEwO1xuXG5jb25zdCBrU3BsaW5lVGFibGVTaXplID0gMTE7XG5jb25zdCBrU2FtcGxlU3RlcFNpemUgPSAxIC8gKGtTcGxpbmVUYWJsZVNpemUgLSAxKTtcblxuY29uc3QgZmxvYXQzMkFycmF5U3VwcG9ydGVkID0gdHlwZW9mIEZsb2F0MzJBcnJheSA9PT0gJ2Z1bmN0aW9uJztcblxuZnVuY3Rpb24gQShhQTEsIGFBMikge1xuICAgIHJldHVybiAxIC0gMyAqIGFBMiArIDMgKiBhQTE7XG59XG5cbmZ1bmN0aW9uIEIoYUExLCBhQTIpIHtcbiAgICByZXR1cm4gMyAqIGFBMiAtIDYgKiBhQTE7XG59XG5cbmZ1bmN0aW9uIEMoYUExKSB7XG4gICAgcmV0dXJuIDMgKiBhQTE7XG59XG5cbi8vIFJldHVybnMgeCh0KSBnaXZlbiB0LCB4MSwgYW5kIHgyLCBvciB5KHQpIGdpdmVuIHQsIHkxLCBhbmQgeTJcbmZ1bmN0aW9uIGNhbGNCZXppZXIoYVQsIGFBMSwgYUEyKSB7XG4gICAgcmV0dXJuICgoQShhQTEsIGFBMikgKiBhVCArIEIoYUExLCBhQTIpKSAqIGFUICsgQyhhQTEpKSAqIGFUO1xufVxuXG4vLyBSZXR1cm5zIGR4L2R0IGdpdmVuIHQsIHgxLCBhbmQgeDIsIG9yIGR5L2R0IGdpdmVuIHQsIHkxLCBhbmQgeTJcbmZ1bmN0aW9uIGdldFNsb3BlKGFULCBhQTEsIGFBMikge1xuICAgIHJldHVybiAzICogQShhQTEsIGFBMikgKiBhVCAqIGFUICsgMiAqIEIoYUExLCBhQTIpICogYVQgKyBDKGFBMSk7XG59XG5cbmZ1bmN0aW9uIGJpbmFyeVN1YmRpdmlkZShhWCwgYUEsIGFCLCBtWDEsIG1YMikge1xuICAgIGxldCBjdXJyZW50WDtcbiAgICBsZXQgY3VycmVudFQ7XG4gICAgbGV0IGkgPSAwO1xuXG4gICAgZG8ge1xuICAgICAgICBjdXJyZW50VCA9IGFBICsgKGFCIC0gYUEpIC8gMjtcbiAgICAgICAgY3VycmVudFggPSBjYWxjQmV6aWVyKGN1cnJlbnRULCBtWDEsIG1YMikgLSBhWDtcblxuICAgICAgICBpZiAoY3VycmVudFggPiAwKSB7XG4gICAgICAgICAgICBhQiA9IGN1cnJlbnRUO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgYUEgPSBjdXJyZW50VDtcbiAgICAgICAgfVxuICAgIH0gd2hpbGUgKE1hdGguYWJzKGN1cnJlbnRYKSA+IFNVQkRJVklTSU9OX1BSRUNJU0lPTiAmJiArK2kgPCBTVUJESVZJU0lPTl9NQVhfSVRFUkFUSU9OUyk7XG5cbiAgICByZXR1cm4gY3VycmVudFQ7XG59XG5cbmZ1bmN0aW9uIG5ld3RvblJhcGhzb25JdGVyYXRlKGFYLCBhR3Vlc3NULCBtWDEsIG1YMikge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgTkVXVE9OX0lURVJBVElPTlM7IGkrKykge1xuICAgICAgICBjb25zdCBjdXJyZW50U2xvcGUgPSBnZXRTbG9wZShhR3Vlc3NULCBtWDEsIG1YMik7XG5cbiAgICAgICAgaWYgKGN1cnJlbnRTbG9wZSA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIGFHdWVzc1Q7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBjdXJyZW50WCA9IGNhbGNCZXppZXIoYUd1ZXNzVCwgbVgxLCBtWDIpIC0gYVg7XG4gICAgICAgIGFHdWVzc1QgLT0gY3VycmVudFggLyBjdXJyZW50U2xvcGU7XG4gICAgfVxuXG4gICAgcmV0dXJuIGFHdWVzc1Q7XG59XG5cbmZ1bmN0aW9uIExpbmVhckVhc2luZyh4KSB7XG4gICAgcmV0dXJuIHg7XG59XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGJlemllcihtWDEsIG1ZMSwgbVgyLCBtWTIpIHtcbiAgICBpZiAoISgwIDw9IG1YMSAmJiBtWDEgPD0gMSAmJiAwIDw9IG1YMiAmJiBtWDIgPD0gMSkpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdCZXppZXIgeCB2YWx1ZXMgbXVzdCBiZSBpbiBbMCwgMV0gcmFuZ2UnKTtcbiAgICB9XG5cbiAgICBpZiAobVgxID09PSBtWTEgJiYgbVgyID09PSBtWTIpIHtcbiAgICAgICAgcmV0dXJuIExpbmVhckVhc2luZztcbiAgICB9XG5cbiAgICAvLyBQcmVjb21wdXRlIHNhbXBsZXMgdGFibGVcbiAgICBjb25zdCBzYW1wbGVWYWx1ZXMgPSBmbG9hdDMyQXJyYXlTdXBwb3J0ZWQgPyBuZXcgRmxvYXQzMkFycmF5KGtTcGxpbmVUYWJsZVNpemUpIDogbmV3IEFycmF5KGtTcGxpbmVUYWJsZVNpemUpO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwga1NwbGluZVRhYmxlU2l6ZTsgaSsrKSB7XG4gICAgICAgIHNhbXBsZVZhbHVlc1tpXSA9IGNhbGNCZXppZXIoaSAqIGtTYW1wbGVTdGVwU2l6ZSwgbVgxLCBtWDIpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdldFRGb3JYKGFYKSB7XG4gICAgICAgIGxldCBpbnRlcnZhbFN0YXJ0ID0gMDtcbiAgICAgICAgbGV0IGN1cnJlbnRTYW1wbGUgPSAxO1xuICAgICAgICBjb25zdCBsYXN0U2FtcGxlID0ga1NwbGluZVRhYmxlU2l6ZSAtIDE7XG5cbiAgICAgICAgZm9yICg7IGN1cnJlbnRTYW1wbGUgIT09IGxhc3RTYW1wbGUgJiYgc2FtcGxlVmFsdWVzW2N1cnJlbnRTYW1wbGVdIDw9IGFYOyBjdXJyZW50U2FtcGxlKyspIHtcbiAgICAgICAgICAgIGludGVydmFsU3RhcnQgKz0ga1NhbXBsZVN0ZXBTaXplO1xuICAgICAgICB9XG4gICAgICAgIGN1cnJlbnRTYW1wbGUtLTtcblxuICAgICAgICAvLyBJbnRlcnBvbGF0ZSB0byBwcm92aWRlIGFuIGluaXRpYWwgZ3Vlc3MgZm9yIHRcbiAgICAgICAgY29uc3QgZGlzdCA9IChhWCAtIHNhbXBsZVZhbHVlc1tjdXJyZW50U2FtcGxlXSkgLyAoc2FtcGxlVmFsdWVzW2N1cnJlbnRTYW1wbGUgKyAxXSAtIHNhbXBsZVZhbHVlc1tjdXJyZW50U2FtcGxlXSk7XG4gICAgICAgIGNvbnN0IGd1ZXNzRm9yVCA9IGludGVydmFsU3RhcnQgKyBkaXN0ICoga1NhbXBsZVN0ZXBTaXplO1xuXG4gICAgICAgIGNvbnN0IGluaXRpYWxTbG9wZSA9IGdldFNsb3BlKGd1ZXNzRm9yVCwgbVgxLCBtWDIpO1xuICAgICAgICBpZiAoaW5pdGlhbFNsb3BlID49IE5FV1RPTl9NSU5fU0xPUEUpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXd0b25SYXBoc29uSXRlcmF0ZShhWCwgZ3Vlc3NGb3JULCBtWDEsIG1YMik7XG4gICAgICAgIH0gZWxzZSBpZiAoaW5pdGlhbFNsb3BlID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gZ3Vlc3NGb3JUO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIGJpbmFyeVN1YmRpdmlkZShhWCwgaW50ZXJ2YWxTdGFydCwgaW50ZXJ2YWxTdGFydCArIGtTYW1wbGVTdGVwU2l6ZSwgbVgxLCBtWDIpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGZ1bmN0aW9uIEJlemllckVhc2luZyh4KSB7XG4gICAgICAgIC8vIEJlY2F1c2UgSmF2YVNjcmlwdCBudW1iZXJzIGFyZSBpbXByZWNpc2UsIHdlIHNob3VsZCBndWFyYW50ZWUgdGhlIGV4dHJlbWVzIGFyZSByaWdodFxuICAgICAgICBpZiAoeCA9PT0gMCB8fCB4ID09PSAxKSB7XG4gICAgICAgICAgICByZXR1cm4geDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBjYWxjQmV6aWVyKGdldFRGb3JYKHgpLCBtWTEsIG1ZMik7XG4gICAgfTtcbn1cbiIsIi8qKlxuICogQGF1dGhvciBwc2Nocm9lbiAvIGh0dHBzOi8vdWZvLmFpL1xuICpcbiAqIEJhc2VkIG9uIGh0dHBzOi8vZ2l0aHViLmNvbS9kYW5yby9lYXNpbmctanNcbiAqIEJhc2VkIG9uIGh0dHBzOi8vZ2l0aHViLmNvbS9DcmVhdGVKUy9Ud2VlbkpTXG4gKiBCYXNlZCBvbiBodHRwczovL2dpdGh1Yi5jb20vdHdlZW5qcy90d2Vlbi5qc1xuICogQmFzZWQgb24gaHR0cHM6Ly9lYXNpbmdzLm5ldC9cbiAqL1xuXG5pbXBvcnQgQmV6aWVyRWFzaW5nIGZyb20gJy4vQmV6aWVyRWFzaW5nLmpzJztcblxuZXhwb3J0IGNsYXNzIEVhc2luZyB7XG4gICAgc3RhdGljIGxpbmVhcih0KSB7XG4gICAgICAgIHJldHVybiB0O1xuICAgIH1cblxuICAgIHN0YXRpYyBlYXNlSW5RdWFkKHQpIHtcbiAgICAgICAgcmV0dXJuIHQgKiB0O1xuICAgIH1cblxuICAgIHN0YXRpYyBlYXNlT3V0UXVhZCh0KSB7XG4gICAgICAgIHJldHVybiB0ICogKDIgLSB0KTtcbiAgICB9XG5cbiAgICBzdGF0aWMgZWFzZUluT3V0UXVhZCh0KSB7XG4gICAgICAgIGlmICgodCAqPSAyKSA8IDEpIHtcbiAgICAgICAgICAgIHJldHVybiAwLjUgKiB0ICogdDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiAtMC41ICogKC0tdCAqICh0IC0gMikgLSAxKTtcbiAgICB9XG5cbiAgICBzdGF0aWMgZWFzZUluQ3ViaWModCkge1xuICAgICAgICByZXR1cm4gdCAqIHQgKiB0O1xuICAgIH1cblxuICAgIHN0YXRpYyBlYXNlT3V0Q3ViaWModCkge1xuICAgICAgICByZXR1cm4gLS10ICogdCAqIHQgKyAxO1xuICAgIH1cblxuICAgIHN0YXRpYyBlYXNlSW5PdXRDdWJpYyh0KSB7XG4gICAgICAgIGlmICgodCAqPSAyKSA8IDEpIHtcbiAgICAgICAgICAgIHJldHVybiAwLjUgKiB0ICogdCAqIHQ7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gMC41ICogKCh0IC09IDIpICogdCAqIHQgKyAyKTtcbiAgICB9XG5cbiAgICBzdGF0aWMgZWFzZUluUXVhcnQodCkge1xuICAgICAgICByZXR1cm4gdCAqIHQgKiB0ICogdDtcbiAgICB9XG5cbiAgICBzdGF0aWMgZWFzZU91dFF1YXJ0KHQpIHtcbiAgICAgICAgcmV0dXJuIDEgLSAtLXQgKiB0ICogdCAqIHQ7XG4gICAgfVxuXG4gICAgc3RhdGljIGVhc2VJbk91dFF1YXJ0KHQpIHtcbiAgICAgICAgaWYgKCh0ICo9IDIpIDwgMSkge1xuICAgICAgICAgICAgcmV0dXJuIDAuNSAqIHQgKiB0ICogdCAqIHQ7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gLTAuNSAqICgodCAtPSAyKSAqIHQgKiB0ICogdCAtIDIpO1xuICAgIH1cblxuICAgIHN0YXRpYyBlYXNlSW5RdWludCh0KSB7XG4gICAgICAgIHJldHVybiB0ICogdCAqIHQgKiB0ICogdDtcbiAgICB9XG5cbiAgICBzdGF0aWMgZWFzZU91dFF1aW50KHQpIHtcbiAgICAgICAgcmV0dXJuIC0tdCAqIHQgKiB0ICogdCAqIHQgKyAxO1xuICAgIH1cblxuICAgIHN0YXRpYyBlYXNlSW5PdXRRdWludCh0KSB7XG4gICAgICAgIGlmICgodCAqPSAyKSA8IDEpIHtcbiAgICAgICAgICAgIHJldHVybiAwLjUgKiB0ICogdCAqIHQgKiB0ICogdDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiAwLjUgKiAoKHQgLT0gMikgKiB0ICogdCAqIHQgKiB0ICsgMik7XG4gICAgfVxuXG4gICAgc3RhdGljIGVhc2VJblNpbmUodCkge1xuICAgICAgICByZXR1cm4gMSAtIE1hdGguc2luKCgoMSAtIHQpICogTWF0aC5QSSkgLyAyKTtcbiAgICB9XG5cbiAgICBzdGF0aWMgZWFzZU91dFNpbmUodCkge1xuICAgICAgICByZXR1cm4gTWF0aC5zaW4oKHQgKiBNYXRoLlBJKSAvIDIpO1xuICAgIH1cblxuICAgIHN0YXRpYyBlYXNlSW5PdXRTaW5lKHQpIHtcbiAgICAgICAgcmV0dXJuIDAuNSAqICgxIC0gTWF0aC5zaW4oTWF0aC5QSSAqICgwLjUgLSB0KSkpO1xuICAgIH1cblxuICAgIHN0YXRpYyBlYXNlSW5FeHBvKHQpIHtcbiAgICAgICAgcmV0dXJuIHQgPT09IDAgPyAwIDogTWF0aC5wb3coMTAyNCwgdCAtIDEpO1xuICAgIH1cblxuICAgIHN0YXRpYyBlYXNlT3V0RXhwbyh0KSB7XG4gICAgICAgIHJldHVybiB0ID09PSAxID8gMSA6IDEgLSBNYXRoLnBvdygyLCAtMTAgKiB0KTtcbiAgICB9XG5cbiAgICBzdGF0aWMgZWFzZUluT3V0RXhwbyh0KSB7XG4gICAgICAgIGlmICh0ID09PSAwIHx8IHQgPT09IDEpIHtcbiAgICAgICAgICAgIHJldHVybiB0O1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCh0ICo9IDIpIDwgMSkge1xuICAgICAgICAgICAgcmV0dXJuIDAuNSAqIE1hdGgucG93KDEwMjQsIHQgLSAxKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiAwLjUgKiAoLU1hdGgucG93KDIsIC0xMCAqICh0IC0gMSkpICsgMik7XG4gICAgfVxuXG4gICAgc3RhdGljIGVhc2VJbkNpcmModCkge1xuICAgICAgICByZXR1cm4gMSAtIE1hdGguc3FydCgxIC0gdCAqIHQpO1xuICAgIH1cblxuICAgIHN0YXRpYyBlYXNlT3V0Q2lyYyh0KSB7XG4gICAgICAgIHJldHVybiBNYXRoLnNxcnQoMSAtIC0tdCAqIHQpO1xuICAgIH1cblxuICAgIHN0YXRpYyBlYXNlSW5PdXRDaXJjKHQpIHtcbiAgICAgICAgaWYgKCh0ICo9IDIpIDwgMSkge1xuICAgICAgICAgICAgcmV0dXJuIC0wLjUgKiAoTWF0aC5zcXJ0KDEgLSB0ICogdCkgLSAxKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiAwLjUgKiAoTWF0aC5zcXJ0KDEgLSAodCAtPSAyKSAqIHQpICsgMSk7XG4gICAgfVxuXG4gICAgc3RhdGljIGVhc2VJbkJhY2sodCkge1xuICAgICAgICBjb25zdCBzID0gMS43MDE1ODtcblxuICAgICAgICByZXR1cm4gdCA9PT0gMSA/IDEgOiB0ICogdCAqICgocyArIDEpICogdCAtIHMpO1xuICAgIH1cblxuICAgIHN0YXRpYyBlYXNlT3V0QmFjayh0KSB7XG4gICAgICAgIGNvbnN0IHMgPSAxLjcwMTU4O1xuXG4gICAgICAgIHJldHVybiB0ID09PSAwID8gMCA6IC0tdCAqIHQgKiAoKHMgKyAxKSAqIHQgKyBzKSArIDE7XG4gICAgfVxuXG4gICAgc3RhdGljIGVhc2VJbk91dEJhY2sodCkge1xuICAgICAgICBjb25zdCBzID0gMS43MDE1OCAqIDEuNTI1O1xuXG4gICAgICAgIGlmICgodCAqPSAyKSA8IDEpIHtcbiAgICAgICAgICAgIHJldHVybiAwLjUgKiAodCAqIHQgKiAoKHMgKyAxKSAqIHQgLSBzKSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gMC41ICogKCh0IC09IDIpICogdCAqICgocyArIDEpICogdCArIHMpICsgMik7XG4gICAgfVxuXG4gICAgc3RhdGljIGVhc2VJbkVsYXN0aWModCwgYW1wbGl0dWRlID0gMSwgcGVyaW9kID0gMC4zKSB7XG4gICAgICAgIGlmICh0ID09PSAwIHx8IHQgPT09IDEpIHtcbiAgICAgICAgICAgIHJldHVybiB0O1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgcGkyID0gTWF0aC5QSSAqIDI7XG4gICAgICAgIGNvbnN0IHMgPSBwZXJpb2QgLyBwaTIgKiBNYXRoLmFzaW4oMSAvIGFtcGxpdHVkZSk7XG5cbiAgICAgICAgcmV0dXJuIC0oYW1wbGl0dWRlICogTWF0aC5wb3coMiwgMTAgKiAtLXQpICogTWF0aC5zaW4oKHQgLSBzKSAqIHBpMiAvIHBlcmlvZCkpO1xuICAgIH1cblxuICAgIHN0YXRpYyBlYXNlT3V0RWxhc3RpYyh0LCBhbXBsaXR1ZGUgPSAxLCBwZXJpb2QgPSAwLjMpIHtcbiAgICAgICAgaWYgKHQgPT09IDAgfHwgdCA9PT0gMSkge1xuICAgICAgICAgICAgcmV0dXJuIHQ7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBwaTIgPSBNYXRoLlBJICogMjtcbiAgICAgICAgY29uc3QgcyA9IHBlcmlvZCAvIHBpMiAqIE1hdGguYXNpbigxIC8gYW1wbGl0dWRlKTtcblxuICAgICAgICByZXR1cm4gYW1wbGl0dWRlICogTWF0aC5wb3coMiwgLTEwICogdCkgKiBNYXRoLnNpbigodCAtIHMpICogcGkyIC8gcGVyaW9kKSArIDE7XG4gICAgfVxuXG4gICAgc3RhdGljIGVhc2VJbk91dEVsYXN0aWModCwgYW1wbGl0dWRlID0gMSwgcGVyaW9kID0gMC4zICogMS41KSB7XG4gICAgICAgIGlmICh0ID09PSAwIHx8IHQgPT09IDEpIHtcbiAgICAgICAgICAgIHJldHVybiB0O1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgcGkyID0gTWF0aC5QSSAqIDI7XG4gICAgICAgIGNvbnN0IHMgPSBwZXJpb2QgLyBwaTIgKiBNYXRoLmFzaW4oMSAvIGFtcGxpdHVkZSk7XG5cbiAgICAgICAgaWYgKCh0ICo9IDIpIDwgMSkge1xuICAgICAgICAgICAgcmV0dXJuIC0wLjUgKiAoYW1wbGl0dWRlICogTWF0aC5wb3coMiwgMTAgKiAtLXQpICogTWF0aC5zaW4oKHQgLSBzKSAqIHBpMiAvIHBlcmlvZCkpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGFtcGxpdHVkZSAqIE1hdGgucG93KDIsIC0xMCAqIC0tdCkgKiBNYXRoLnNpbigodCAtIHMpICogcGkyIC8gcGVyaW9kKSAqIDAuNSArIDE7XG4gICAgfVxuXG4gICAgc3RhdGljIGVhc2VJbkJvdW5jZSh0KSB7XG4gICAgICAgIHJldHVybiAxIC0gdGhpcy5lYXNlT3V0Qm91bmNlKDEgLSB0KTtcbiAgICB9XG5cbiAgICBzdGF0aWMgZWFzZU91dEJvdW5jZSh0KSB7XG4gICAgICAgIGNvbnN0IG4xID0gNy41NjI1O1xuICAgICAgICBjb25zdCBkMSA9IDIuNzU7XG5cbiAgICAgICAgaWYgKHQgPCAxIC8gZDEpIHtcbiAgICAgICAgICAgIHJldHVybiBuMSAqIHQgKiB0O1xuICAgICAgICB9IGVsc2UgaWYgKHQgPCAyIC8gZDEpIHtcbiAgICAgICAgICAgIHJldHVybiBuMSAqICh0IC09IDEuNSAvIGQxKSAqIHQgKyAwLjc1O1xuICAgICAgICB9IGVsc2UgaWYgKHQgPCAyLjUgLyBkMSkge1xuICAgICAgICAgICAgcmV0dXJuIG4xICogKHQgLT0gMi4yNSAvIGQxKSAqIHQgKyAwLjkzNzU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gbjEgKiAodCAtPSAyLjYyNSAvIGQxKSAqIHQgKyAwLjk4NDM3NTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHN0YXRpYyBlYXNlSW5PdXRCb3VuY2UodCkge1xuICAgICAgICBpZiAodCA8IDAuNSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZWFzZUluQm91bmNlKHQgKiAyKSAqIDAuNTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzLmVhc2VPdXRCb3VuY2UodCAqIDIgLSAxKSAqIDAuNSArIDAuNTtcbiAgICB9XG5cbiAgICBzdGF0aWMgYWRkQmV6aWVyKG5hbWUsIG1YMSwgbVkxLCBtWDIsIG1ZMikge1xuICAgICAgICB0aGlzW25hbWVdID0gQmV6aWVyRWFzaW5nKG1YMSwgbVkxLCBtWDIsIG1ZMik7XG4gICAgfVxufVxuIiwiLyoqXG4gKiBAYXV0aG9yIHBzY2hyb2VuIC8gaHR0cHM6Ly91Zm8uYWkvXG4gKi9cblxudmFyIFJlcXVlc3RGcmFtZTtcbnZhciBDYW5jZWxGcmFtZTtcblxuaWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgUmVxdWVzdEZyYW1lID0gd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZTtcbiAgICBDYW5jZWxGcmFtZSA9IHdpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZTtcbn0gZWxzZSB7XG4gICAgY29uc3Qgc3RhcnRUaW1lID0gcGVyZm9ybWFuY2Uubm93KCk7XG4gICAgY29uc3QgdGltZXN0ZXAgPSAxMDAwIC8gNjA7XG5cbiAgICBSZXF1ZXN0RnJhbWUgPSBjYWxsYmFjayA9PiB7XG4gICAgICAgIHJldHVybiBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgIGNhbGxiYWNrKHBlcmZvcm1hbmNlLm5vdygpIC0gc3RhcnRUaW1lKTtcbiAgICAgICAgfSwgdGltZXN0ZXApO1xuICAgIH07XG5cbiAgICBDYW5jZWxGcmFtZSA9IGNsZWFyVGltZW91dDtcbn1cblxuZXhwb3J0IGNsYXNzIFRpY2tlciB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuY2FsbGJhY2tzID0gW107XG4gICAgICAgIHRoaXMubGFzdCA9IHBlcmZvcm1hbmNlLm5vdygpO1xuICAgICAgICB0aGlzLnRpbWUgPSAwO1xuICAgICAgICB0aGlzLmRlbHRhID0gMDtcbiAgICAgICAgdGhpcy5mcmFtZSA9IDA7XG4gICAgICAgIHRoaXMuaXNBbmltYXRpbmcgPSBmYWxzZTtcbiAgICB9XG5cbiAgICBvblRpY2sgPSB0aW1lID0+IHtcbiAgICAgICAgaWYgKHRoaXMuaXNBbmltYXRpbmcpIHtcbiAgICAgICAgICAgIHRoaXMucmVxdWVzdElkID0gUmVxdWVzdEZyYW1lKHRoaXMub25UaWNrKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuZGVsdGEgPSBNYXRoLm1pbigxNTAsIHRpbWUgLSB0aGlzLmxhc3QpO1xuICAgICAgICB0aGlzLmxhc3QgPSB0aW1lO1xuICAgICAgICB0aGlzLnRpbWUgPSB0aW1lICogMC4wMDE7XG4gICAgICAgIHRoaXMuZnJhbWUrKztcblxuICAgICAgICBmb3IgKGxldCBpID0gdGhpcy5jYWxsYmFja3MubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgICAgIGNvbnN0IGNhbGxiYWNrID0gdGhpcy5jYWxsYmFja3NbaV07XG5cbiAgICAgICAgICAgIGlmICghY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGNhbGxiYWNrLmZwcykge1xuICAgICAgICAgICAgICAgIGNvbnN0IGRlbHRhID0gdGltZSAtIGNhbGxiYWNrLmxhc3Q7XG5cbiAgICAgICAgICAgICAgICBpZiAoZGVsdGEgPCAxMDAwIC8gY2FsbGJhY2suZnBzKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGNhbGxiYWNrLmxhc3QgPSB0aW1lO1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrLmZyYW1lKys7XG5cbiAgICAgICAgICAgICAgICBjYWxsYmFjayh0aGlzLnRpbWUsIGRlbHRhLCBjYWxsYmFjay5mcmFtZSk7XG5cbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY2FsbGJhY2sodGhpcy50aW1lLCB0aGlzLmRlbHRhLCB0aGlzLmZyYW1lKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBhZGQoY2FsbGJhY2ssIGZwcykge1xuICAgICAgICBpZiAoZnBzKSB7XG4gICAgICAgICAgICBjYWxsYmFjay5mcHMgPSBmcHM7XG4gICAgICAgICAgICBjYWxsYmFjay5sYXN0ID0gcGVyZm9ybWFuY2Uubm93KCk7XG4gICAgICAgICAgICBjYWxsYmFjay5mcmFtZSA9IDA7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmNhbGxiYWNrcy51bnNoaWZ0KGNhbGxiYWNrKTtcbiAgICB9XG5cbiAgICByZW1vdmUoY2FsbGJhY2spIHtcbiAgICAgICAgY29uc3QgaW5kZXggPSB0aGlzLmNhbGxiYWNrcy5pbmRleE9mKGNhbGxiYWNrKTtcblxuICAgICAgICBpZiAofmluZGV4KSB7XG4gICAgICAgICAgICB0aGlzLmNhbGxiYWNrcy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgc3RhcnQoKSB7XG4gICAgICAgIGlmICh0aGlzLmlzQW5pbWF0aW5nKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmlzQW5pbWF0aW5nID0gdHJ1ZTtcblxuICAgICAgICB0aGlzLnJlcXVlc3RJZCA9IFJlcXVlc3RGcmFtZSh0aGlzLm9uVGljayk7XG4gICAgfVxuXG4gICAgc3RvcCgpIHtcbiAgICAgICAgaWYgKCF0aGlzLmlzQW5pbWF0aW5nKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmlzQW5pbWF0aW5nID0gZmFsc2U7XG5cbiAgICAgICAgQ2FuY2VsRnJhbWUodGhpcy5yZXF1ZXN0SWQpO1xuICAgIH1cblxuICAgIHNldFJlcXVlc3RGcmFtZShyZXF1ZXN0KSB7XG4gICAgICAgIFJlcXVlc3RGcmFtZSA9IHJlcXVlc3Q7XG4gICAgfVxuXG4gICAgc2V0Q2FuY2VsRnJhbWUoY2FuY2VsKSB7XG4gICAgICAgIENhbmNlbEZyYW1lID0gY2FuY2VsO1xuICAgIH1cbn1cblxuZXhwb3J0IGNvbnN0IHRpY2tlciA9IG5ldyBUaWNrZXIoKTtcbiIsIi8qKlxuICogQGF1dGhvciBwc2Nocm9lbiAvIGh0dHBzOi8vdWZvLmFpL1xuICovXG5cbmltcG9ydCB7IEVhc2luZyB9IGZyb20gJy4vRWFzaW5nLmpzJztcblxuaW1wb3J0IHsgdGlja2VyIH0gZnJvbSAnLi9UaWNrZXIuanMnO1xuXG5jb25zdCBUd2VlbnMgPSBbXTtcblxuZXhwb3J0IGNsYXNzIFR3ZWVuIHtcbiAgICBjb25zdHJ1Y3RvcihvYmplY3QsIHByb3BzLCBkdXJhdGlvbiwgZWFzZSwgZGVsYXkgPSAwLCBjb21wbGV0ZSwgdXBkYXRlKSB7XG4gICAgICAgIGlmICh0eXBlb2YgZGVsYXkgIT09ICdudW1iZXInKSB7XG4gICAgICAgICAgICB1cGRhdGUgPSBjb21wbGV0ZTtcbiAgICAgICAgICAgIGNvbXBsZXRlID0gZGVsYXk7XG4gICAgICAgICAgICBkZWxheSA9IDA7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLm9iamVjdCA9IG9iamVjdDtcbiAgICAgICAgdGhpcy5kdXJhdGlvbiA9IGR1cmF0aW9uO1xuICAgICAgICB0aGlzLmVsYXBzZWQgPSAwO1xuICAgICAgICB0aGlzLmVhc2UgPSB0eXBlb2YgZWFzZSA9PT0gJ2Z1bmN0aW9uJyA/IGVhc2UgOiBFYXNpbmdbZWFzZV0gfHwgRWFzaW5nWydlYXNlT3V0Q3ViaWMnXTtcbiAgICAgICAgdGhpcy5kZWxheSA9IGRlbGF5O1xuICAgICAgICB0aGlzLmNvbXBsZXRlID0gY29tcGxldGU7XG4gICAgICAgIHRoaXMudXBkYXRlID0gdXBkYXRlO1xuICAgICAgICB0aGlzLmlzQW5pbWF0aW5nID0gZmFsc2U7XG5cbiAgICAgICAgdGhpcy5mcm9tID0ge307XG4gICAgICAgIHRoaXMudG8gPSBPYmplY3QuYXNzaWduKHt9LCBwcm9wcyk7XG5cbiAgICAgICAgdGhpcy5zcHJpbmcgPSB0aGlzLnRvLnNwcmluZztcbiAgICAgICAgdGhpcy5kYW1waW5nID0gdGhpcy50by5kYW1waW5nO1xuXG4gICAgICAgIGRlbGV0ZSB0aGlzLnRvLnNwcmluZztcbiAgICAgICAgZGVsZXRlIHRoaXMudG8uZGFtcGluZztcblxuICAgICAgICBmb3IgKGNvbnN0IHByb3AgaW4gdGhpcy50bykge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiB0aGlzLnRvW3Byb3BdID09PSAnbnVtYmVyJyAmJiB0eXBlb2Ygb2JqZWN0W3Byb3BdID09PSAnbnVtYmVyJykge1xuICAgICAgICAgICAgICAgIHRoaXMuZnJvbVtwcm9wXSA9IG9iamVjdFtwcm9wXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuc3RhcnQoKTtcbiAgICB9XG5cbiAgICBvblVwZGF0ZSA9ICh0aW1lLCBkZWx0YSkgPT4ge1xuICAgICAgICB0aGlzLmVsYXBzZWQgKz0gZGVsdGE7XG5cbiAgICAgICAgY29uc3QgcHJvZ3Jlc3MgPSBNYXRoLm1heCgwLCBNYXRoLm1pbigxLCAodGhpcy5lbGFwc2VkIC0gdGhpcy5kZWxheSkgLyB0aGlzLmR1cmF0aW9uKSk7XG4gICAgICAgIGNvbnN0IGFscGhhID0gdGhpcy5lYXNlKHByb2dyZXNzLCB0aGlzLnNwcmluZywgdGhpcy5kYW1waW5nKTtcblxuICAgICAgICBmb3IgKGNvbnN0IHByb3AgaW4gdGhpcy5mcm9tKSB7XG4gICAgICAgICAgICB0aGlzLm9iamVjdFtwcm9wXSA9IHRoaXMuZnJvbVtwcm9wXSArICh0aGlzLnRvW3Byb3BdIC0gdGhpcy5mcm9tW3Byb3BdKSAqIGFscGhhO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMudXBkYXRlKSB7XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHByb2dyZXNzID09PSAxKSB7XG4gICAgICAgICAgICBjbGVhclR3ZWVuKHRoaXMpO1xuXG4gICAgICAgICAgICBpZiAodGhpcy5jb21wbGV0ZSkge1xuICAgICAgICAgICAgICAgIHRoaXMuY29tcGxldGUoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBzdGFydCgpIHtcbiAgICAgICAgaWYgKHRoaXMuaXNBbmltYXRpbmcpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuaXNBbmltYXRpbmcgPSB0cnVlO1xuXG4gICAgICAgIHRpY2tlci5hZGQodGhpcy5vblVwZGF0ZSk7XG4gICAgfVxuXG4gICAgc3RvcCgpIHtcbiAgICAgICAgaWYgKCF0aGlzLmlzQW5pbWF0aW5nKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmlzQW5pbWF0aW5nID0gZmFsc2U7XG5cbiAgICAgICAgdGlja2VyLnJlbW92ZSh0aGlzLm9uVXBkYXRlKTtcbiAgICB9XG59XG5cbi8qKlxuICogRGVmZXJzIGEgZnVuY3Rpb24gYnkgdGhlIHNwZWNpZmllZCBkdXJhdGlvbi5cbiAqXG4gKiBAZXhwb3J0XG4gKiBAcGFyYW0ge251bWJlcn0gZHVyYXRpb24gVGltZSB0byB3YWl0IGluIG1pbGxpc2Vjb25kcy5cbiAqIEBwYXJhbSB7ZnVuY3Rpb259IGNvbXBsZXRlIENhbGxiYWNrIGZ1bmN0aW9uLlxuICogQHJldHVybnMge1R3ZWVufVxuICogQGV4YW1wbGVcbiAqIGRlbGF5ZWRDYWxsKDUwMCwgYW5pbWF0ZUluKTtcbiAqIEBleGFtcGxlXG4gKiBkZWxheWVkQ2FsbCg1MDAsICgpID0+IGFuaW1hdGVJbihkZWxheSkpO1xuICogQGV4YW1wbGVcbiAqIHRpbWVvdXQgPSBkZWxheWVkQ2FsbCg1MDAsICgpID0+IGFuaW1hdGVJbihkZWxheSkpO1xuICovXG5leHBvcnQgZnVuY3Rpb24gZGVsYXllZENhbGwoZHVyYXRpb24sIGNvbXBsZXRlKSB7XG4gICAgY29uc3QgdHdlZW4gPSBuZXcgVHdlZW4oY29tcGxldGUsIG51bGwsIGR1cmF0aW9uLCAnbGluZWFyJywgMCwgY29tcGxldGUpO1xuXG4gICAgVHdlZW5zLnB1c2godHdlZW4pO1xuXG4gICAgcmV0dXJuIHR3ZWVuO1xufVxuXG4vKipcbiAqIERlZmVycyBieSB0aGUgc3BlY2lmaWVkIGR1cmF0aW9uLlxuICpcbiAqIEBleHBvcnRcbiAqIEBwYXJhbSB7bnVtYmVyfSBbZHVyYXRpb249MF0gVGltZSB0byB3YWl0IGluIG1pbGxpc2Vjb25kcy5cbiAqIEByZXR1cm5zIHtQcm9taXNlfVxuICogQGV4YW1wbGVcbiAqIGF3YWl0IHdhaXQoMjUwKTtcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHdhaXQoZHVyYXRpb24gPSAwKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKHJlc29sdmUgPT4gZGVsYXllZENhbGwoZHVyYXRpb24sIHJlc29sdmUpKTtcbn1cblxuLyoqXG4gKiBEZWZlcnMgdG8gdGhlIG5leHQgdGljay5cbiAqXG4gKiBAZXhwb3J0XG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBbY29tcGxldGVdIENhbGxiYWNrIGZ1bmN0aW9uLlxuICogQHJldHVybnMge1Byb21pc2V9XG4gKiBAZXhhbXBsZVxuICogZGVmZXIocmVzaXplKTtcbiAqIEBleGFtcGxlXG4gKiBkZWZlcigoKSA9PiByZXNpemUoKSk7XG4gKiBAZXhhbXBsZVxuICogYXdhaXQgZGVmZXIoKTtcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRlZmVyKGNvbXBsZXRlKSB7XG4gICAgY29uc3QgcHJvbWlzZSA9IG5ldyBQcm9taXNlKHJlc29sdmUgPT4gZGVsYXllZENhbGwoMCwgcmVzb2x2ZSkpO1xuXG4gICAgaWYgKGNvbXBsZXRlKSB7XG4gICAgICAgIHByb21pc2UudGhlbihjb21wbGV0ZSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHByb21pc2U7XG59XG5cbi8qKlxuICogVHdlZW4gdGhhdCBhbmltYXRlcyB0byB0aGUgc3BlY2lmaWVkIGRlc3RpbmF0aW9uIHByb3BlcnRpZXMuXG4gKlxuICogU2VlIHRoZSBFYXNpbmcgRnVuY3Rpb25zIENoZWF0IFNoZWV0IGZvciBleGFtcGxlcyBieSBuYW1lLlxuICogaHR0cHM6Ly9lYXNpbmdzLm5ldC9cbiAqXG4gKiBAZXhwb3J0XG4gKiBAcGFyYW0ge29iamVjdH0gb2JqZWN0IFRhcmdldCBvYmplY3QuXG4gKiBAcGFyYW0ge29iamVjdH0gcHJvcHMgVHdlZW4gcHJvcGVydGllcy5cbiAqIEBwYXJhbSB7bnVtYmVyfSBkdXJhdGlvbiBUaW1lIGluIG1pbGxpc2Vjb25kcy5cbiAqIEBwYXJhbSB7c3RyaW5nfGZ1bmN0aW9ufSBlYXNlIEVhc2Ugc3RyaW5nIG9yIGZ1bmN0aW9uLlxuICogQHBhcmFtIHtudW1iZXJ9IFtkZWxheT0wXSBUaW1lIHRvIHdhaXQgaW4gbWlsbGlzZWNvbmRzLlxuICogQHBhcmFtIHtmdW5jdGlvbn0gW2NvbXBsZXRlXSBDYWxsYmFjayBmdW5jdGlvbiB3aGVuIHRoZSBhbmltYXRpb24gaGFzIGNvbXBsZXRlZC5cbiAqIEBwYXJhbSB7ZnVuY3Rpb259IFt1cGRhdGVdIENhbGxiYWNrIGZ1bmN0aW9uIGV2ZXJ5IHRpbWUgdGhlIGFuaW1hdGlvbiB1cGRhdGVzLlxuICogQHJldHVybnMge1Byb21pc2V9XG4gKiBAZXhhbXBsZVxuICogdHdlZW4oZGF0YSwgeyB2YWx1ZTogMC4zIH0sIDEwMDAsICdsaW5lYXInKTtcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHR3ZWVuKG9iamVjdCwgcHJvcHMsIGR1cmF0aW9uLCBlYXNlLCBkZWxheSA9IDAsIGNvbXBsZXRlLCB1cGRhdGUpIHtcbiAgICBpZiAodHlwZW9mIGRlbGF5ICE9PSAnbnVtYmVyJykge1xuICAgICAgICB1cGRhdGUgPSBjb21wbGV0ZTtcbiAgICAgICAgY29tcGxldGUgPSBkZWxheTtcbiAgICAgICAgZGVsYXkgPSAwO1xuICAgIH1cblxuICAgIGNvbnN0IHByb21pc2UgPSBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHtcbiAgICAgICAgY29uc3QgdHdlZW4gPSBuZXcgVHdlZW4ob2JqZWN0LCBwcm9wcywgZHVyYXRpb24sIGVhc2UsIGRlbGF5LCByZXNvbHZlLCB1cGRhdGUpO1xuXG4gICAgICAgIFR3ZWVucy5wdXNoKHR3ZWVuKTtcbiAgICB9KTtcblxuICAgIGlmIChjb21wbGV0ZSkge1xuICAgICAgICBwcm9taXNlLnRoZW4oY29tcGxldGUpO1xuICAgIH1cblxuICAgIHJldHVybiBwcm9taXNlO1xufVxuXG4vKipcbiAqIEltbWVkaWF0ZWx5IGNsZWFycyBhbGwgZGVsYXllZENhbGxzIGFuZCB0d2VlbnMgb2YgdGhlIHNwZWNpZmllZCBvYmplY3QuXG4gKlxuICogQGV4cG9ydFxuICogQHBhcmFtIHtvYmplY3R9IG9iamVjdCBUYXJnZXQgb2JqZWN0LlxuICogQHJldHVybnMge3ZvaWR9XG4gKiBAZXhhbXBsZVxuICogZGVsYXllZENhbGwoNTAwLCBhbmltYXRlSW4pO1xuICogY2xlYXJUd2VlbihhbmltYXRlSW4pO1xuICogQGV4YW1wbGVcbiAqIGNsZWFyVHdlZW4odGltZW91dCk7XG4gKiB0aW1lb3V0ID0gZGVsYXllZENhbGwoNTAwLCAoKSA9PiBhbmltYXRlSW4oKSk7XG4gKiBAZXhhbXBsZVxuICogdHdlZW4oZGF0YSwgeyB2YWx1ZTogMC4zIH0sIDEwMDAsICdsaW5lYXInKTtcbiAqIGNsZWFyVHdlZW4oZGF0YSk7XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjbGVhclR3ZWVuKG9iamVjdCkge1xuICAgIGlmIChvYmplY3QgaW5zdGFuY2VvZiBUd2Vlbikge1xuICAgICAgICBvYmplY3Quc3RvcCgpO1xuXG4gICAgICAgIGNvbnN0IGluZGV4ID0gVHdlZW5zLmluZGV4T2Yob2JqZWN0KTtcblxuICAgICAgICBpZiAofmluZGV4KSB7XG4gICAgICAgICAgICBUd2VlbnMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAgIGZvciAobGV0IGkgPSBUd2VlbnMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgICAgIGlmIChUd2VlbnNbaV0ub2JqZWN0ID09PSBvYmplY3QpIHtcbiAgICAgICAgICAgICAgICBjbGVhclR3ZWVuKFR3ZWVuc1tpXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59XG4iLCIvKipcbiAqIEBhdXRob3IgcHNjaHJvZW4gLyBodHRwczovL3Vmby5haS9cbiAqL1xuXG5pbXBvcnQgeyBBc3NldHMgfSBmcm9tICcuLi9sb2FkZXJzL0Fzc2V0cy5qcyc7XG5pbXBvcnQgeyBFdmVudEVtaXR0ZXIgfSBmcm9tICcuL0V2ZW50RW1pdHRlci5qcyc7XG5cbmltcG9ydCB7IGNsZWFyVHdlZW4sIGRlbGF5ZWRDYWxsLCB0d2VlbiB9IGZyb20gJy4uL3R3ZWVuL1R3ZWVuLmpzJztcblxuLy8gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQ1NTL3RyYW5zZm9ybVxuLy8gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQ1NTL2ZpbHRlclxuY29uc3QgVHJhbnNmb3JtcyA9IFsneCcsICd5JywgJ3onLCAnc2tld1gnLCAnc2tld1knLCAncm90YXRpb24nLCAncm90YXRpb25YJywgJ3JvdGF0aW9uWScsICdyb3RhdGlvblonLCAnc2NhbGUnLCAnc2NhbGVYJywgJ3NjYWxlWScsICdzY2FsZVonXTtcbmNvbnN0IEZpbHRlcnMgPSBbJ2JsdXInLCAnYnJpZ2h0bmVzcycsICdjb250cmFzdCcsICdncmF5c2NhbGUnLCAnaHVlJywgJ2ludmVydCcsICdzYXR1cmF0ZScsICdzZXBpYSddO1xuY29uc3QgTnVtZXJpYyA9IFsnb3BhY2l0eScsICd6SW5kZXgnLCAnZm9udFdlaWdodCcsICdzdHJva2VXaWR0aCcsICdzdHJva2VEYXNob2Zmc2V0JywgJ3N0b3BPcGFjaXR5J107XG5jb25zdCBMYWN1bmExID0gWydvcGFjaXR5JywgJ2JyaWdodG5lc3MnLCAnY29udHJhc3QnLCAnc2F0dXJhdGUnLCAnc2NhbGUnLCAnc3RvcE9wYWNpdHknXTtcblxuZXhwb3J0IGNsYXNzIEludGVyZmFjZSB7XG4gICAgY29uc3RydWN0b3IobmFtZSwgdHlwZSA9ICdkaXYnLCBxdWFsaWZpZWROYW1lKSB7XG4gICAgICAgIHRoaXMuZXZlbnRzID0gbmV3IEV2ZW50RW1pdHRlcigpO1xuICAgICAgICB0aGlzLmNoaWxkcmVuID0gW107XG4gICAgICAgIHRoaXMudGltZW91dHMgPSBbXTtcbiAgICAgICAgdGhpcy5zdHlsZSA9IHt9O1xuICAgICAgICB0aGlzLmlzVHJhbnNmb3JtID0gZmFsc2U7XG4gICAgICAgIHRoaXMuaXNGaWx0ZXIgPSBmYWxzZTtcblxuICAgICAgICBpZiAodHlwZW9mIG5hbWUgPT09ICdvYmplY3QnICYmIG5hbWUgIT09IG51bGwpIHtcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudCA9IG5hbWU7XG4gICAgICAgIH0gZWxzZSBpZiAodHlwZSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgICAgICAgICAgIHRoaXMudHlwZSA9IHR5cGU7XG5cbiAgICAgICAgICAgIGlmICh0eXBlID09PSAnc3ZnJykge1xuICAgICAgICAgICAgICAgIHRoaXMuZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUygnaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnLCBxdWFsaWZpZWROYW1lIHx8ICdzdmcnKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5lbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCh0eXBlKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHR5cGVvZiBuYW1lID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgIGlmIChuYW1lLnN0YXJ0c1dpdGgoJy4nKSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmVsZW1lbnQuY2xhc3NOYW1lID0gbmFtZS5zbGljZSgxKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmVsZW1lbnQuaWQgPSBuYW1lO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIGFkZChjaGlsZCkge1xuICAgICAgICBpZiAoIXRoaXMuY2hpbGRyZW4pIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuY2hpbGRyZW4ucHVzaChjaGlsZCk7XG5cbiAgICAgICAgY2hpbGQucGFyZW50ID0gdGhpcztcblxuICAgICAgICBpZiAoY2hpbGQuZWxlbWVudCkge1xuICAgICAgICAgICAgdGhpcy5lbGVtZW50LmFwcGVuZENoaWxkKGNoaWxkLmVsZW1lbnQpO1xuICAgICAgICB9IGVsc2UgaWYgKGNoaWxkLm5vZGVOYW1lKSB7XG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQuYXBwZW5kQ2hpbGQoY2hpbGQpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGNoaWxkO1xuICAgIH1cblxuICAgIHJlbW92ZShjaGlsZCkge1xuICAgICAgICBpZiAoIXRoaXMuY2hpbGRyZW4pIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChjaGlsZC5lbGVtZW50KSB7XG4gICAgICAgICAgICBjaGlsZC5lbGVtZW50LnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoY2hpbGQuZWxlbWVudCk7XG4gICAgICAgIH0gZWxzZSBpZiAoY2hpbGQubm9kZU5hbWUpIHtcbiAgICAgICAgICAgIGNoaWxkLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoY2hpbGQpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgaW5kZXggPSB0aGlzLmNoaWxkcmVuLmluZGV4T2YoY2hpbGQpO1xuXG4gICAgICAgIGlmICh+aW5kZXgpIHtcbiAgICAgICAgICAgIHRoaXMuY2hpbGRyZW4uc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGNsb25lKCkge1xuICAgICAgICBpZiAoIXRoaXMuZWxlbWVudCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG5ldyBJbnRlcmZhY2UodGhpcy5lbGVtZW50LmNsb25lTm9kZSh0cnVlKSk7XG4gICAgfVxuXG4gICAgZW1wdHkoKSB7XG4gICAgICAgIGlmICghdGhpcy5lbGVtZW50KSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBmb3IgKGxldCBpID0gdGhpcy5jaGlsZHJlbi5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgICAgICAgaWYgKHRoaXMuY2hpbGRyZW5baV0gJiYgdGhpcy5jaGlsZHJlbltpXS5kZXN0cm95KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jaGlsZHJlbltpXS5kZXN0cm95KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmNoaWxkcmVuLmxlbmd0aCA9IDA7XG5cbiAgICAgICAgdGhpcy5lbGVtZW50LmlubmVySFRNTCA9ICcnO1xuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIGF0dHIocHJvcHMpIHtcbiAgICAgICAgaWYgKCF0aGlzLmVsZW1lbnQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAoY29uc3Qga2V5IGluIHByb3BzKSB7XG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQuc2V0QXR0cmlidXRlKGtleSwgcHJvcHNba2V5XSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBjc3MocHJvcHMpIHtcbiAgICAgICAgaWYgKCF0aGlzLmVsZW1lbnQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHN0eWxlID0gdGhpcy5zdHlsZTtcblxuICAgICAgICBmb3IgKGNvbnN0IGtleSBpbiBwcm9wcykge1xuICAgICAgICAgICAgaWYgKH5UcmFuc2Zvcm1zLmluZGV4T2Yoa2V5KSkge1xuICAgICAgICAgICAgICAgIHN0eWxlW2tleV0gPSBwcm9wc1trZXldO1xuICAgICAgICAgICAgICAgIHRoaXMuaXNUcmFuc2Zvcm0gPSB0cnVlO1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAofkZpbHRlcnMuaW5kZXhPZihrZXkpKSB7XG4gICAgICAgICAgICAgICAgc3R5bGVba2V5XSA9IHByb3BzW2tleV07XG4gICAgICAgICAgICAgICAgdGhpcy5pc0ZpbHRlciA9IHRydWU7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGxldCB2YWw7XG5cbiAgICAgICAgICAgIGlmICh+TnVtZXJpYy5pbmRleE9mKGtleSkpIHtcbiAgICAgICAgICAgICAgICB2YWwgPSBwcm9wc1trZXldO1xuICAgICAgICAgICAgICAgIHN0eWxlW2tleV0gPSB2YWw7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHZhbCA9IHR5cGVvZiBwcm9wc1trZXldICE9PSAnc3RyaW5nJyA/IHByb3BzW2tleV0gKyAncHgnIDogcHJvcHNba2V5XTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5lbGVtZW50LnN0eWxlW2tleV0gPSB2YWw7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5pc1RyYW5zZm9ybSkge1xuICAgICAgICAgICAgbGV0IHRyYW5zZm9ybSA9ICcnO1xuXG4gICAgICAgICAgICBpZiAodHlwZW9mIHN0eWxlLnggIT09ICd1bmRlZmluZWQnIHx8IHR5cGVvZiBzdHlsZS55ICE9PSAndW5kZWZpbmVkJyB8fCB0eXBlb2Ygc3R5bGUueiAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICBjb25zdCB4ID0gdHlwZW9mIHN0eWxlLnggIT09ICd1bmRlZmluZWQnID8gc3R5bGUueCA6IDA7XG4gICAgICAgICAgICAgICAgY29uc3QgeSA9IHR5cGVvZiBzdHlsZS55ICE9PSAndW5kZWZpbmVkJyA/IHN0eWxlLnkgOiAwO1xuICAgICAgICAgICAgICAgIGNvbnN0IHogPSB0eXBlb2Ygc3R5bGUueiAhPT0gJ3VuZGVmaW5lZCcgPyBzdHlsZS56IDogMDtcblxuICAgICAgICAgICAgICAgIHRyYW5zZm9ybSArPSBgdHJhbnNsYXRlM2QoJHt4fXB4LCAke3l9cHgsICR7en1weClgO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodHlwZW9mIHN0eWxlLnNrZXdYICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgIHRyYW5zZm9ybSArPSBgc2tld1goJHtzdHlsZS5za2V3WH1kZWcpYDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHR5cGVvZiBzdHlsZS5za2V3WSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICB0cmFuc2Zvcm0gKz0gYHNrZXdZKCR7c3R5bGUuc2tld1l9ZGVnKWA7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0eXBlb2Ygc3R5bGUucm90YXRpb24gIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgdHJhbnNmb3JtICs9IGByb3RhdGUoJHtzdHlsZS5yb3RhdGlvbn1kZWcpYDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHR5cGVvZiBzdHlsZS5yb3RhdGlvblggIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgdHJhbnNmb3JtICs9IGByb3RhdGVYKCR7c3R5bGUucm90YXRpb25YfWRlZylgO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodHlwZW9mIHN0eWxlLnJvdGF0aW9uWSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICB0cmFuc2Zvcm0gKz0gYHJvdGF0ZVkoJHtzdHlsZS5yb3RhdGlvbll9ZGVnKWA7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0eXBlb2Ygc3R5bGUucm90YXRpb25aICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgIHRyYW5zZm9ybSArPSBgcm90YXRlWigke3N0eWxlLnJvdGF0aW9uWn1kZWcpYDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHR5cGVvZiBzdHlsZS5zY2FsZSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICB0cmFuc2Zvcm0gKz0gYHNjYWxlKCR7c3R5bGUuc2NhbGV9KWA7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0eXBlb2Ygc3R5bGUuc2NhbGVYICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgIHRyYW5zZm9ybSArPSBgc2NhbGVYKCR7c3R5bGUuc2NhbGVYfSlgO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodHlwZW9mIHN0eWxlLnNjYWxlWSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICB0cmFuc2Zvcm0gKz0gYHNjYWxlWSgke3N0eWxlLnNjYWxlWX0pYDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHR5cGVvZiBzdHlsZS5zY2FsZVogIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgdHJhbnNmb3JtICs9IGBzY2FsZVooJHtzdHlsZS5zY2FsZVp9KWA7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5zdHlsZS50cmFuc2Zvcm0gPSB0cmFuc2Zvcm07XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5pc0ZpbHRlcikge1xuICAgICAgICAgICAgbGV0IGZpbHRlciA9ICcnO1xuXG4gICAgICAgICAgICBpZiAodHlwZW9mIHN0eWxlLmJsdXIgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgZmlsdGVyICs9IGBibHVyKCR7c3R5bGUuYmx1cn1weClgO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodHlwZW9mIHN0eWxlLmJyaWdodG5lc3MgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgZmlsdGVyICs9IGBicmlnaHRuZXNzKCR7c3R5bGUuYnJpZ2h0bmVzc30pYDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHR5cGVvZiBzdHlsZS5jb250cmFzdCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICBmaWx0ZXIgKz0gYGNvbnRyYXN0KCR7c3R5bGUuY29udHJhc3R9KWA7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0eXBlb2Ygc3R5bGUuZ3JheXNjYWxlICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgIGZpbHRlciArPSBgZ3JheXNjYWxlKCR7c3R5bGUuZ3JheXNjYWxlfSlgO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodHlwZW9mIHN0eWxlLmh1ZSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICBmaWx0ZXIgKz0gYGh1ZS1yb3RhdGUoJHtzdHlsZS5odWV9ZGVnKWA7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0eXBlb2Ygc3R5bGUuaW52ZXJ0ICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgIGZpbHRlciArPSBgaW52ZXJ0KCR7c3R5bGUuaW52ZXJ0fSlgO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodHlwZW9mIHN0eWxlLnNhdHVyYXRlICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgIGZpbHRlciArPSBgc2F0dXJhdGUoJHtzdHlsZS5zYXR1cmF0ZX0pYDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHR5cGVvZiBzdHlsZS5zZXBpYSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICBmaWx0ZXIgKz0gYHNlcGlhKCR7c3R5bGUuc2VwaWF9KWA7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5zdHlsZS5maWx0ZXIgPSBmaWx0ZXI7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICB0d2Vlbihwcm9wcywgZHVyYXRpb24sIGVhc2UsIGRlbGF5ID0gMCwgY29tcGxldGUsIHVwZGF0ZSkge1xuICAgICAgICBpZiAoIXRoaXMuZWxlbWVudCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHR5cGVvZiBkZWxheSAhPT0gJ251bWJlcicpIHtcbiAgICAgICAgICAgIHVwZGF0ZSA9IGNvbXBsZXRlO1xuICAgICAgICAgICAgY29tcGxldGUgPSBkZWxheTtcbiAgICAgICAgICAgIGRlbGF5ID0gMDtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHN0eWxlID0gZ2V0Q29tcHV0ZWRTdHlsZSh0aGlzLmVsZW1lbnQpO1xuXG4gICAgICAgIGZvciAoY29uc3Qga2V5IGluIHByb3BzKSB7XG4gICAgICAgICAgICBsZXQgdmFsO1xuXG4gICAgICAgICAgICBpZiAodHlwZW9mIHRoaXMuc3R5bGVba2V5XSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICB2YWwgPSB0aGlzLnN0eWxlW2tleV07XG4gICAgICAgICAgICB9IGVsc2UgaWYgKH5UcmFuc2Zvcm1zLmluZGV4T2Yoa2V5KSB8fCB+RmlsdGVycy5pbmRleE9mKGtleSkgfHwgfk51bWVyaWMuaW5kZXhPZihrZXkpKSB7XG4gICAgICAgICAgICAgICAgdmFsID0gfkxhY3VuYTEuaW5kZXhPZihrZXkpID8gMSA6IDA7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBzdHlsZVtrZXldID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgIHZhbCA9IHBhcnNlRmxvYXQoc3R5bGVba2V5XSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICghaXNOYU4odmFsKSkge1xuICAgICAgICAgICAgICAgIHRoaXMuc3R5bGVba2V5XSA9IHZhbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHByb21pc2UgPSB0d2Vlbih0aGlzLnN0eWxlLCBwcm9wcywgZHVyYXRpb24sIGVhc2UsIGRlbGF5LCBjb21wbGV0ZSwgKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5jc3ModGhpcy5zdHlsZSk7XG5cbiAgICAgICAgICAgIGlmICh1cGRhdGUpIHtcbiAgICAgICAgICAgICAgICB1cGRhdGUoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIHByb21pc2U7XG4gICAgfVxuXG4gICAgY2xlYXJUd2VlbigpIHtcbiAgICAgICAgY2xlYXJUd2Vlbih0aGlzLnN0eWxlKTtcblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBkZWxheWVkQ2FsbChkdXJhdGlvbiwgY29tcGxldGUpIHtcbiAgICAgICAgaWYgKCF0aGlzLnRpbWVvdXRzKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCB0aW1lb3V0ID0gZGVsYXllZENhbGwoZHVyYXRpb24sICgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuY2xlYXJUaW1lb3V0KHRpbWVvdXQsIHRydWUpO1xuXG4gICAgICAgICAgICBpZiAoY29tcGxldGUpIHtcbiAgICAgICAgICAgICAgICBjb21wbGV0ZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLnRpbWVvdXRzLnB1c2godGltZW91dCk7XG5cbiAgICAgICAgcmV0dXJuIHRpbWVvdXQ7XG4gICAgfVxuXG4gICAgY2xlYXJUaW1lb3V0KHRpbWVvdXQsIGlzU3RvcHBlZCkge1xuICAgICAgICBpZiAoIXRoaXMudGltZW91dHMpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghaXNTdG9wcGVkKSB7XG4gICAgICAgICAgICBjbGVhclR3ZWVuKHRpbWVvdXQpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgaW5kZXggPSB0aGlzLnRpbWVvdXRzLmluZGV4T2YodGltZW91dCk7XG5cbiAgICAgICAgaWYgKH5pbmRleCkge1xuICAgICAgICAgICAgdGhpcy50aW1lb3V0cy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgY2xlYXJUaW1lb3V0cygpIHtcbiAgICAgICAgaWYgKCF0aGlzLnRpbWVvdXRzKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBmb3IgKGxldCBpID0gdGhpcy50aW1lb3V0cy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgICAgICAgdGhpcy5jbGVhclRpbWVvdXQodGhpcy50aW1lb3V0c1tpXSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB0ZXh0KHN0cikge1xuICAgICAgICBpZiAoIXRoaXMuZWxlbWVudCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHR5cGVvZiBzdHIgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5lbGVtZW50LnRleHRDb250ZW50O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5lbGVtZW50LnRleHRDb250ZW50ID0gc3RyO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgaHRtbChzdHIpIHtcbiAgICAgICAgaWYgKCF0aGlzLmVsZW1lbnQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0eXBlb2Ygc3RyID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZWxlbWVudC5pbm5lckhUTUw7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQuaW5uZXJIVE1MID0gc3RyO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgaGlkZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY3NzKHsgZGlzcGxheTogJ25vbmUnIH0pO1xuICAgIH1cblxuICAgIHNob3coKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNzcyh7IGRpc3BsYXk6ICcnIH0pO1xuICAgIH1cblxuICAgIGludmlzaWJsZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY3NzKHsgdmlzaWJpbGl0eTogJ2hpZGRlbicgfSk7XG4gICAgfVxuXG4gICAgdmlzaWJsZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY3NzKHsgdmlzaWJpbGl0eTogJycgfSk7XG4gICAgfVxuXG4gICAgYmcocGF0aCwgYmFja2dyb3VuZFNpemUgPSAnY29udGFpbicsIGJhY2tncm91bmRQb3NpdGlvbiA9ICdjZW50ZXInLCBiYWNrZ3JvdW5kUmVwZWF0ID0gJ25vLXJlcGVhdCcpIHtcbiAgICAgICAgY29uc3Qgc3R5bGUgPSB7XG4gICAgICAgICAgICBiYWNrZ3JvdW5kSW1hZ2U6IGB1cmwoJHtBc3NldHMuZ2V0UGF0aChwYXRoKX0pYCxcbiAgICAgICAgICAgIGJhY2tncm91bmRTaXplLFxuICAgICAgICAgICAgYmFja2dyb3VuZFBvc2l0aW9uLFxuICAgICAgICAgICAgYmFja2dyb3VuZFJlcGVhdFxuICAgICAgICB9O1xuXG4gICAgICAgIHJldHVybiB0aGlzLmNzcyhzdHlsZSk7XG4gICAgfVxuXG4gICAgbGluZShwcm9ncmVzcyA9IHRoaXMucHJvZ3Jlc3MgfHwgMCkge1xuICAgICAgICBjb25zdCBzdGFydCA9IHRoaXMuc3RhcnQgfHwgMDtcbiAgICAgICAgY29uc3Qgb2Zmc2V0ID0gdGhpcy5vZmZzZXQgfHwgMDtcblxuICAgICAgICBjb25zdCBsZW5ndGggPSB0aGlzLmVsZW1lbnQuZ2V0VG90YWxMZW5ndGgoKTtcbiAgICAgICAgY29uc3QgZGFzaCA9IGxlbmd0aCAqIHByb2dyZXNzO1xuICAgICAgICBjb25zdCBnYXAgPSBsZW5ndGggLSBkYXNoO1xuXG4gICAgICAgIGNvbnN0IHN0eWxlID0ge1xuICAgICAgICAgICAgc3Ryb2tlRGFzaGFycmF5OiBgJHtkYXNofSwke2dhcH1gLFxuICAgICAgICAgICAgc3Ryb2tlRGFzaG9mZnNldDogLWxlbmd0aCAqIChzdGFydCArIG9mZnNldClcbiAgICAgICAgfTtcblxuICAgICAgICByZXR1cm4gdGhpcy5jc3Moc3R5bGUpO1xuICAgIH1cblxuICAgIGxvYWQocGF0aCkge1xuICAgICAgICBjb25zdCBwcm9taXNlID0gZmV0Y2goQXNzZXRzLmdldFBhdGgocGF0aCksIEFzc2V0cy5vcHRpb25zKS50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgIHJldHVybiByZXNwb25zZS50ZXh0KCk7XG4gICAgICAgIH0pLnRoZW4oc3RyID0+IHtcbiAgICAgICAgICAgIHRoaXMuaHRtbChzdHIpO1xuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gcHJvbWlzZTtcbiAgICB9XG5cbiAgICBkZXN0cm95KCkge1xuICAgICAgICBpZiAoIXRoaXMuY2hpbGRyZW4pIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLnBhcmVudCAmJiB0aGlzLnBhcmVudC5yZW1vdmUpIHtcbiAgICAgICAgICAgIHRoaXMucGFyZW50LnJlbW92ZSh0aGlzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuY2xlYXJUaW1lb3V0cygpO1xuICAgICAgICB0aGlzLmNsZWFyVHdlZW4oKTtcblxuICAgICAgICB0aGlzLmV2ZW50cy5kZXN0cm95KCk7XG5cbiAgICAgICAgZm9yIChsZXQgaSA9IHRoaXMuY2hpbGRyZW4ubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgICAgIGlmICh0aGlzLmNoaWxkcmVuW2ldICYmIHRoaXMuY2hpbGRyZW5baV0uZGVzdHJveSkge1xuICAgICAgICAgICAgICAgIHRoaXMuY2hpbGRyZW5baV0uZGVzdHJveSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5lbGVtZW50Lm9iamVjdCA9IG51bGw7XG5cbiAgICAgICAgZm9yIChjb25zdCBwcm9wIGluIHRoaXMpIHtcbiAgICAgICAgICAgIHRoaXNbcHJvcF0gPSBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxufVxuIiwiLyoqXG4gKiBAYXV0aG9yIHBzY2hyb2VuIC8gaHR0cHM6Ly91Zm8uYWkvXG4gKi9cblxuaW1wb3J0IHsgRXZlbnRzIH0gZnJvbSAnLi4vY29uZmlnL0V2ZW50cy5qcyc7XG5pbXBvcnQgeyBJbnRlcmZhY2UgfSBmcm9tICcuL0ludGVyZmFjZS5qcyc7XG5cbmltcG9ydCB7IHRpY2tlciB9IGZyb20gJy4uL3R3ZWVuL1RpY2tlci5qcyc7XG5cbmV4cG9ydCB2YXIgU3RhZ2U7XG5cbmlmICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJykge1xuICAgIFN0YWdlID0gbmV3IEludGVyZmFjZShudWxsLCBudWxsKTtcblxuICAgIGZ1bmN0aW9uIGFkZExpc3RlbmVycygpIHtcbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3BvcHN0YXRlJywgb25Qb3BTdGF0ZSk7XG4gICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgb25LZXlEb3duKTtcbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2tleXVwJywgb25LZXlVcCk7XG4gICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdrZXlwcmVzcycsIG9uS2V5UHJlc3MpO1xuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigncmVzaXplJywgb25SZXNpemUpO1xuICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCd2aXNpYmlsaXR5Y2hhbmdlJywgb25WaXNpYmlsaXR5KTtcblxuICAgICAgICB0aWNrZXIuc3RhcnQoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBFdmVudCBoYW5kbGVyc1xuICAgICAqL1xuXG4gICAgZnVuY3Rpb24gb25Qb3BTdGF0ZShlKSB7XG4gICAgICAgIFN0YWdlLnBhdGggPSBsb2NhdGlvbi5wYXRobmFtZTtcblxuICAgICAgICBTdGFnZS5ldmVudHMuZW1pdChFdmVudHMuU1RBVEVfQ0hBTkdFLCBlKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBvbktleURvd24oZSkge1xuICAgICAgICBTdGFnZS5ldmVudHMuZW1pdChFdmVudHMuS0VZX0RPV04sIGUpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIG9uS2V5VXAoZSkge1xuICAgICAgICBTdGFnZS5ldmVudHMuZW1pdChFdmVudHMuS0VZX1VQLCBlKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBvbktleVByZXNzKGUpIHtcbiAgICAgICAgU3RhZ2UuZXZlbnRzLmVtaXQoRXZlbnRzLktFWV9QUkVTUywgZSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gb25SZXNpemUoZSkge1xuICAgICAgICBTdGFnZS53aWR0aCA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGllbnRXaWR0aDtcbiAgICAgICAgU3RhZ2UuaGVpZ2h0ID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNsaWVudEhlaWdodDtcbiAgICAgICAgU3RhZ2UuZHByID0gd2luZG93LmRldmljZVBpeGVsUmF0aW87XG4gICAgICAgIFN0YWdlLmFzcGVjdCA9IFN0YWdlLndpZHRoIC8gU3RhZ2UuaGVpZ2h0O1xuXG4gICAgICAgIFN0YWdlLmV2ZW50cy5lbWl0KEV2ZW50cy5SRVNJWkUsIGUpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIG9uVmlzaWJpbGl0eShlKSB7XG4gICAgICAgIFN0YWdlLmV2ZW50cy5lbWl0KEV2ZW50cy5WSVNJQklMSVRZLCBlKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBQdWJsaWMgbWV0aG9kc1xuICAgICAqL1xuXG4gICAgU3RhZ2UuaW5pdCA9IGVsZW1lbnQgPT4ge1xuICAgICAgICBTdGFnZS5lbGVtZW50ID0gZWxlbWVudDtcblxuICAgICAgICBhZGRMaXN0ZW5lcnMoKTtcbiAgICAgICAgb25Qb3BTdGF0ZSgpO1xuICAgICAgICBvblJlc2l6ZSgpO1xuICAgIH07XG5cbiAgICBTdGFnZS5zZXRQYXRoID0gcGF0aCA9PiB7XG4gICAgICAgIGlmIChwYXRoID09PSBsb2NhdGlvbi5wYXRobmFtZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaGlzdG9yeS5wdXNoU3RhdGUobnVsbCwgbnVsbCwgcGF0aCk7XG5cbiAgICAgICAgb25Qb3BTdGF0ZSgpO1xuICAgIH07XG5cbiAgICBTdGFnZS5zZXRUaXRsZSA9IHRpdGxlID0+IHtcbiAgICAgICAgZG9jdW1lbnQudGl0bGUgPSB0aXRsZTtcbiAgICB9O1xuXG4gICAgU3RhZ2Uuc2V0Q29udGVudCA9Y29udGVudCA9PntcbiAgICAgICAgZG9jdW1lbnQudGV4dENvbnRlbnQgPSBjb250ZW50XG4gICAgfVxuIH1cbiIsImltcG9ydCB7IEV2ZW50cyB9IGZyb20gJy4uL2NvbmZpZy9FdmVudHMuanMnO1xuaW1wb3J0IHsgSW50ZXJmYWNlIH0gZnJvbSAnLi4vdXRpbHMvSW50ZXJmYWNlLmpzJztcbmltcG9ydCB7IFN0YWdlIH0gZnJvbSAnLi4vdXRpbHMvU3RhZ2UuanMnO1xuXG5pbXBvcnQgeyB0aWNrZXIgfSBmcm9tICcuLi90d2Vlbi9UaWNrZXIuanMnO1xuaW1wb3J0IHsgY2xlYXJUd2VlbiwgdHdlZW4gfSBmcm9tICcuLi90d2Vlbi9Ud2Vlbi5qcyc7XG5pbXBvcnQgeyBkZWdUb1JhZCB9IGZyb20gJy4uL3V0aWxzL1V0aWxzLmpzJztcblxuZXhwb3J0IGNsYXNzIFByb2dyZXNzQ2FudmFzIGV4dGVuZHMgSW50ZXJmYWNlIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgc3VwZXIobnVsbCwgJ2NhbnZhcycpO1xuXG4gICAgICAgIGNvbnN0IHNpemUgPSAzMjtcblxuICAgICAgICB0aGlzLndpZHRoID0gc2l6ZTtcbiAgICAgICAgdGhpcy5oZWlnaHQgPSBzaXplO1xuICAgICAgICB0aGlzLnggPSBzaXplIC8gMjtcbiAgICAgICAgdGhpcy55ID0gc2l6ZSAvIDI7XG4gICAgICAgIHRoaXMucmFkaXVzID0gc2l6ZSAqIDAuNDtcbiAgICAgICAgdGhpcy5zdGFydEFuZ2xlID0gZGVnVG9SYWQoLTkwKTtcbiAgICAgICAgdGhpcy5wcm9ncmVzcyA9IDA7XG4gICAgICAgIHRoaXMubmVlZHNVcGRhdGUgPSBmYWxzZTtcblxuICAgICAgICB0aGlzLmluaXRDYW52YXMoKTtcbiAgICB9XG5cbiAgICBpbml0Q2FudmFzKCkge1xuICAgICAgICB0aGlzLmNvbnRleHQgPSB0aGlzLmVsZW1lbnQuZ2V0Q29udGV4dCgnMmQnKTtcbiAgICB9XG5cbiAgICBhZGRMaXN0ZW5lcnMoKSB7XG4gICAgICAgIHRpY2tlci5hZGQodGhpcy5vblVwZGF0ZSk7XG4gICAgfVxuXG4gICAgcmVtb3ZlTGlzdGVuZXJzKCkge1xuICAgICAgICB0aWNrZXIucmVtb3ZlKHRoaXMub25VcGRhdGUpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEV2ZW50IGhhbmRsZXJzXG4gICAgICovXG5cbiAgICBvblVwZGF0ZSA9ICgpID0+IHtcbiAgICAgICAgaWYgKHRoaXMubmVlZHNVcGRhdGUpIHtcbiAgICAgICAgICAgIHRoaXMudXBkYXRlKCk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgb25Qcm9ncmVzcyA9ICh7IHByb2dyZXNzIH0pID0+IHtcbiAgICAgICAgY2xlYXJUd2Vlbih0aGlzKTtcblxuICAgICAgICB0aGlzLm5lZWRzVXBkYXRlID0gdHJ1ZTtcblxuICAgICAgICB0d2Vlbih0aGlzLCB7IHByb2dyZXNzIH0sIDUwMCwgJ2Vhc2VPdXRDdWJpYycsICgpID0+IHtcbiAgICAgICAgICAgIHRoaXMubmVlZHNVcGRhdGUgPSBmYWxzZTtcblxuICAgICAgICAgICAgaWYgKHRoaXMucHJvZ3Jlc3MgPj0gMSkge1xuICAgICAgICAgICAgICAgIHRoaXMub25Db21wbGV0ZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgb25Db21wbGV0ZSA9ICgpID0+IHtcbiAgICAgICAgdGhpcy5yZW1vdmVMaXN0ZW5lcnMoKTtcblxuICAgICAgICB0aGlzLmV2ZW50cy5lbWl0KEV2ZW50cy5DT01QTEVURSk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIFB1YmxpYyBtZXRob2RzXG4gICAgICovXG5cbiAgICByZXNpemUgPSAoKSA9PiB7XG4gICAgICAgIGNvbnN0IGRwciA9IDI7XG5cbiAgICAgICAgdGhpcy5lbGVtZW50LndpZHRoID0gTWF0aC5yb3VuZCh0aGlzLndpZHRoICogZHByKTtcbiAgICAgICAgdGhpcy5lbGVtZW50LmhlaWdodCA9IE1hdGgucm91bmQodGhpcy5oZWlnaHQgKiBkcHIpO1xuICAgICAgICB0aGlzLmVsZW1lbnQuc3R5bGUud2lkdGggPSB0aGlzLndpZHRoICsgJ3B4JztcbiAgICAgICAgdGhpcy5lbGVtZW50LnN0eWxlLmhlaWdodCA9IHRoaXMuaGVpZ2h0ICsgJ3B4JztcbiAgICAgICAgdGhpcy5jb250ZXh0LnNjYWxlKGRwciwgZHByKTtcblxuICAgICAgICB0aGlzLmNvbnRleHQubGluZVdpZHRoID0gMS41O1xuICAgICAgICB0aGlzLmNvbnRleHQuc3Ryb2tlU3R5bGUgPSBTdGFnZS5yb290U3R5bGUuZ2V0UHJvcGVydHlWYWx1ZSgnLS11aS1jb2xvcicpLnRyaW0oKTtcblxuICAgICAgICB0aGlzLnVwZGF0ZSgpO1xuICAgIH07XG5cbiAgICB1cGRhdGUgPSAoKSA9PiB7XG4gICAgICAgIHRoaXMuY29udGV4dC5jbGVhclJlY3QoMCwgMCwgdGhpcy5lbGVtZW50LndpZHRoLCB0aGlzLmVsZW1lbnQuaGVpZ2h0KTtcbiAgICAgICAgdGhpcy5jb250ZXh0LmJlZ2luUGF0aCgpO1xuICAgICAgICB0aGlzLmNvbnRleHQuYXJjKHRoaXMueCwgdGhpcy55LCB0aGlzLnJhZGl1cywgdGhpcy5zdGFydEFuZ2xlLCB0aGlzLnN0YXJ0QW5nbGUgKyBkZWdUb1JhZCgzNjAgKiB0aGlzLnByb2dyZXNzKSk7XG4gICAgICAgIHRoaXMuY29udGV4dC5zdHJva2UoKTtcbiAgICB9O1xuXG4gICAgYW5pbWF0ZUluID0gKCkgPT4ge1xuICAgICAgICB0aGlzLmFkZExpc3RlbmVycygpO1xuICAgICAgICB0aGlzLnJlc2l6ZSgpO1xuICAgIH07XG5cbiAgICBhbmltYXRlT3V0ID0gKCkgPT4ge1xuICAgICAgICB0aGlzLnR3ZWVuKHsgc2NhbGU6IDEuMSwgb3BhY2l0eTogMCB9LCA0MDAsICdlYXNlSW5DdWJpYycpO1xuICAgIH07XG5cbiAgICBkZXN0cm95ID0gKCkgPT4ge1xuICAgICAgICB0aGlzLnJlbW92ZUxpc3RlbmVycygpO1xuXG4gICAgICAgIGNsZWFyVHdlZW4odGhpcyk7XG5cbiAgICAgICAgcmV0dXJuIHN1cGVyLmRlc3Ryb3koKTtcbiAgICB9O1xufVxuIiwiaW1wb3J0IHsgRXZlbnRzIH0gZnJvbSAnLi4vY29uZmlnL0V2ZW50cy5qcyc7XG5pbXBvcnQgeyBJbnRlcmZhY2UgfSBmcm9tICcuLi91dGlscy9JbnRlcmZhY2UuanMnO1xuaW1wb3J0IHsgUHJvZ3Jlc3NDYW52YXMgfSBmcm9tICcuL1Byb2dyZXNzQ2FudmFzLmpzJztcblxuZXhwb3J0IGNsYXNzIFByZWxvYWRlclZpZXcgZXh0ZW5kcyBJbnRlcmZhY2Uge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBzdXBlcignLnByZWxvYWRlcicpO1xuXG4gICAgICAgIHRoaXMuaW5pdEhUTUwoKTtcbiAgICAgICAgdGhpcy5pbml0VmlldygpO1xuXG4gICAgICAgIHRoaXMuYWRkTGlzdGVuZXJzKCk7XG4gICAgfVxuXG4gICAgaW5pdEhUTUwoKSB7XG4gICAgICAgIHRoaXMuY3NzKHtcbiAgICAgICAgICAgIHBvc2l0aW9uOiAnZml4ZWQnLFxuICAgICAgICAgICAgbGVmdDogMCxcbiAgICAgICAgICAgIHRvcDogMCxcbiAgICAgICAgICAgIHdpZHRoOiAnMTAwJScsXG4gICAgICAgICAgICBoZWlnaHQ6ICcxMDAlJyxcbiAgICAgICAgICAgIGJhY2tncm91bmRDb2xvcjogJ3ZhcigtLWJnLWNvbG9yKScsXG4gICAgICAgICAgICB6SW5kZXg6IDEsXG4gICAgICAgICAgICBwb2ludGVyRXZlbnRzOiAnbm9uZSdcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgaW5pdFZpZXcoKSB7XG4gICAgICAgIHRoaXMudmlldyA9IG5ldyBQcm9ncmVzc0NhbnZhcygpO1xuICAgICAgICB0aGlzLnZpZXcuY3NzKHtcbiAgICAgICAgICAgIGxlZnQ6ICc1MCUnLFxuICAgICAgICAgICAgdG9wOiAnNTAlJyxcbiAgICAgICAgICAgIG1hcmdpbkxlZnQ6IC10aGlzLnZpZXcud2lkdGggLyAyLFxuICAgICAgICAgICAgbWFyZ2luVG9wOiAtdGhpcy52aWV3LmhlaWdodCAvIDJcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuYWRkKHRoaXMudmlldyk7XG4gICAgfVxuXG4gICAgYWRkTGlzdGVuZXJzKCkge1xuICAgICAgICB0aGlzLnZpZXcuZXZlbnRzLm9uKEV2ZW50cy5DT01QTEVURSwgdGhpcy5vbkNvbXBsZXRlKTtcbiAgICB9XG5cbiAgICByZW1vdmVMaXN0ZW5lcnMoKSB7XG4gICAgICAgIHRoaXMudmlldy5ldmVudHMub2ZmKEV2ZW50cy5DT01QTEVURSwgdGhpcy5vbkNvbXBsZXRlKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBFdmVudCBoYW5kbGVyc1xuICAgICAqL1xuXG4gICAgb25Qcm9ncmVzcyA9IGUgPT4ge1xuICAgICAgICB0aGlzLnZpZXcub25Qcm9ncmVzcyhlKTtcbiAgICB9O1xuXG4gICAgb25Db21wbGV0ZSA9ICgpID0+IHtcbiAgICAgICAgdGhpcy5ldmVudHMuZW1pdChFdmVudHMuQ09NUExFVEUpO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBQdWJsaWMgbWV0aG9kc1xuICAgICAqL1xuXG4gICAgYW5pbWF0ZUluID0gKCkgPT4ge1xuICAgICAgICB0aGlzLnZpZXcuYW5pbWF0ZUluKCk7XG4gICAgfTtcblxuICAgIGFuaW1hdGVPdXQgPSAoKSA9PiB7XG4gICAgICAgIHRoaXMudmlldy5hbmltYXRlT3V0KCk7XG4gICAgICAgIHJldHVybiB0aGlzLnR3ZWVuKHsgb3BhY2l0eTogMCB9LCAyNTAsICdlYXNlT3V0U2luZScsIDUwMCk7XG4gICAgfTtcblxuICAgIGRlc3Ryb3kgPSAoKSA9PiB7XG4gICAgICAgIHRoaXMucmVtb3ZlTGlzdGVuZXJzKCk7XG5cbiAgICAgICAgcmV0dXJuIHN1cGVyLmRlc3Ryb3koKTtcbiAgICB9O1xufVxuIiwiaW1wb3J0IHsgQ29uZmlnIH0gZnJvbSAnLi4vY29uZmlnL0NvbmZpZy5qcyc7XG5pbXBvcnQgeyBEZXZpY2UgfSBmcm9tICcuLi9jb25maWcvRGV2aWNlLmpzJztcbmltcG9ydCB7IEV2ZW50cyB9IGZyb20gJy4uL2NvbmZpZy9FdmVudHMuanMnO1xuaW1wb3J0IHsgQXNzZXRzIH0gZnJvbSAnLi4vbG9hZGVycy9Bc3NldHMuanMnO1xuaW1wb3J0IHsgTXVsdGlMb2FkZXIgfSBmcm9tICcuLi9sb2FkZXJzL011bHRpTG9hZGVyLmpzJztcbmltcG9ydCB7IEZvbnRMb2FkZXIgfSBmcm9tICcuLi9sb2FkZXJzL0ZvbnRMb2FkZXIuanMnO1xuaW1wb3J0IHsgQXNzZXRMb2FkZXIgfSBmcm9tICcuLi9sb2FkZXJzL0Fzc2V0TG9hZGVyLmpzJztcbmltcG9ydCB7IFN0YWdlIH0gZnJvbSAnLi4vdXRpbHMvU3RhZ2UuanMnO1xuaW1wb3J0IHsgUHJlbG9hZGVyVmlldyB9IGZyb20gJy4uL3ZpZXdzL1ByZWxvYWRlclZpZXcuanMnO1xuXG5leHBvcnQgY2xhc3MgUHJlbG9hZGVyIHtcbiAgICBzdGF0aWMgaW5pdCgpIHtcbiAgICAgICAgaWYgKCFEZXZpY2Uud2ViZ2wpIHtcbiAgICAgICAgICAgIHJldHVybiBsb2NhdGlvbi5ocmVmID0gJ2ZhbGxiYWNrLmh0bWwnO1xuICAgICAgICB9XG5cbiAgICAgICAgQXNzZXRzLnBhdGggPSBDb25maWcuQ0ROO1xuICAgICAgICBBc3NldHMuY3Jvc3NPcmlnaW4gPSAnYW5vbnltb3VzJztcblxuICAgICAgICBBc3NldHMub3B0aW9ucyA9IHtcbiAgICAgICAgICAgIG1vZGU6ICdjb3JzJyxcbiAgICAgICAgICAgIC8vIGNyZWRlbnRpYWxzOiAnaW5jbHVkZSdcbiAgICAgICAgfTtcblxuICAgICAgICBBc3NldHMuY2FjaGUgPSB0cnVlO1xuXG4gICAgICAgIHRoaXMuaW5pdFN0YWdlKCk7XG4gICAgICAgIHRoaXMuaW5pdFZpZXcoKTtcbiAgICAgICAgdGhpcy5pbml0TG9hZGVyKCk7XG5cbiAgICAgICAgdGhpcy5hZGRMaXN0ZW5lcnMoKTtcbiAgICB9XG5cbiAgICBzdGF0aWMgaW5pdFN0YWdlKCkge1xuICAgICAgICBTdGFnZS5pbml0KGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNyb290JykpO1xuXG4gICAgICAgIFN0YWdlLnJvb3QgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCc6cm9vdCcpO1xuICAgICAgICBTdGFnZS5yb290U3R5bGUgPSBnZXRDb21wdXRlZFN0eWxlKFN0YWdlLnJvb3QpO1xuICAgIH1cblxuICAgIHN0YXRpYyBpbml0VmlldygpIHtcbiAgICAgICAgdGhpcy52aWV3ID0gbmV3IFByZWxvYWRlclZpZXcoKTtcbiAgICAgICAgU3RhZ2UuYWRkKHRoaXMudmlldyk7XG4gICAgfVxuXG4gICAgc3RhdGljIGFzeW5jIGluaXRMb2FkZXIoKSB7XG4gICAgICAgIHRoaXMudmlldy5hbmltYXRlSW4oKTtcblxuICAgICAgICBsZXQgYXNzZXRzID0gQ29uZmlnLkFTU0VUUy5zbGljZSgpO1xuXG4gICAgICAgIGlmIChEZXZpY2UubW9iaWxlKSB7XG4gICAgICAgICAgICBhc3NldHMgPSBhc3NldHMuZmlsdGVyKHBhdGggPT4gIS9kZXNrdG9wLy50ZXN0KHBhdGgpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGFzc2V0cyA9IGFzc2V0cy5maWx0ZXIocGF0aCA9PiAhL21vYmlsZS8udGVzdChwYXRoKSk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmxvYWRlciA9IG5ldyBNdWx0aUxvYWRlcigpO1xuICAgICAgICB0aGlzLmxvYWRlci5sb2FkKG5ldyBGb250TG9hZGVyKCkpO1xuICAgICAgICB0aGlzLmxvYWRlci5sb2FkKG5ldyBBc3NldExvYWRlcihhc3NldHMpKTtcbiAgICAgICAgdGhpcy5sb2FkZXIuYWRkKDIpO1xuXG4gICAgICAgIGNvbnN0IHsgQXBwIH0gPSBhd2FpdCBpbXBvcnQoJy4vQXBwLmpzJyk7XG4gICAgICAgIHRoaXMubG9hZGVyLnRyaWdnZXIoMSk7XG5cbiAgICAgICAgdGhpcy5hcHAgPSBBcHA7XG5cbiAgICAgICAgYXdhaXQgdGhpcy5hcHAuaW5pdCh0aGlzLmxvYWRlci5sb2FkZXJzWzFdKTtcbiAgICAgICAgdGhpcy5sb2FkZXIudHJpZ2dlcigxKTtcbiAgICB9XG5cbiAgICBzdGF0aWMgYWRkTGlzdGVuZXJzKCkge1xuICAgICAgICB0aGlzLmxvYWRlci5ldmVudHMub24oRXZlbnRzLlBST0dSRVNTLCB0aGlzLnZpZXcub25Qcm9ncmVzcyk7XG4gICAgICAgIHRoaXMudmlldy5ldmVudHMub24oRXZlbnRzLkNPTVBMRVRFLCB0aGlzLm9uQ29tcGxldGUpO1xuICAgIH1cblxuICAgIHN0YXRpYyByZW1vdmVMaXN0ZW5lcnMoKSB7XG4gICAgICAgIHRoaXMubG9hZGVyLmV2ZW50cy5vZmYoRXZlbnRzLlBST0dSRVNTLCB0aGlzLnZpZXcub25Qcm9ncmVzcyk7XG4gICAgICAgIHRoaXMudmlldy5ldmVudHMub2ZmKEV2ZW50cy5DT01QTEVURSwgdGhpcy5vbkNvbXBsZXRlKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBFdmVudCBoYW5kbGVyc1xuICAgICAqL1xuXG4gICAgc3RhdGljIG9uQ29tcGxldGUgPSBhc3luYyAoKSA9PiB7XG4gICAgICAgIHRoaXMucmVtb3ZlTGlzdGVuZXJzKCk7XG5cbiAgICAgICAgdGhpcy5sb2FkZXIgPSB0aGlzLmxvYWRlci5kZXN0cm95KCk7XG5cbiAgICAgICAgYXdhaXQgdGhpcy52aWV3LmFuaW1hdGVPdXQoKTtcbiAgICAgICAgdGhpcy52aWV3ID0gdGhpcy52aWV3LmRlc3Ryb3koKTtcblxuICAgICAgICAvL3RoaXMuYXBwLmFuaW1hdGVJbigpO1xuICAgIH07XG59XG4iXSwibmFtZXMiOlsiQmV6aWVyRWFzaW5nIl0sIm1hcHBpbmdzIjoiQUFBTyxNQUFNLE1BQU0sQ0FBQztBQUNwQixJQUFJLE9BQU8sVUFBVSxHQUFHLElBQUksQ0FBQztBQUM3QixJQUFJLE9BQU8sS0FBSyxHQUFHLFFBQVEsQ0FBQyxNQUFNLEtBQUssUUFBUSxDQUFDO0FBQ2hEO0FBQ0EsSUFBSSxPQUFPLEdBQUcsR0FBRyxFQUFFLENBQUM7QUFDcEI7QUFDQSxJQUFJLE9BQU8sTUFBTSxHQUFHO0FBQ3BCLFFBQVEsOEJBQThCO0FBQ3RDLFFBQVEscUNBQXFDO0FBQzdDLEtBQUssQ0FBQztBQUNOO0FBQ0EsSUFBSSxPQUFPLEdBQUcsR0FBRyxRQUFRLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUNoRCxJQUFJLE9BQU8sS0FBSyxHQUFHLFdBQVcsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQ3JEOztBQ2JPLE1BQU0sTUFBTSxDQUFDO0FBQ3BC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LE1BQU0sSUFBSSxDQUFDLE1BQU0sRUFBRSxHQUFHLEdBQUcsQ0FBQyxDQUFDO0FBQ2pELENBQUM7QUFTRDtBQUNPLFNBQVMsSUFBSSxHQUFHO0FBQ3ZCLElBQUksT0FBTyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsR0FBRyxPQUFPLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxFQUFFLFFBQVEsRUFBRSxDQUFDO0FBQ3ZELENBQUM7QUFDRDtBQUNPLFNBQVMsVUFBVSxDQUFDLEtBQUssRUFBRTtBQUNsQyxJQUFJLE9BQU8sS0FBSyxDQUFDLENBQUMsR0FBRyxHQUFHLEdBQUcsS0FBSyxDQUFDLENBQUMsR0FBRyxJQUFJLEdBQUcsS0FBSyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUM7QUFDM0QsQ0FBQztBQVdEO0FBQ08sU0FBUyxRQUFRLENBQUMsSUFBSSxFQUFFO0FBQy9CLElBQUksSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxFQUFFO0FBQzdCLFFBQVEsT0FBTyxJQUFJLENBQUM7QUFDcEIsS0FBSztBQUNMO0FBQ0EsSUFBSSxNQUFNLElBQUksR0FBRyxNQUFNLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxHQUFHLElBQUksR0FBRyxDQUFDLENBQUMsRUFBRSxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUM7QUFDekUsSUFBSSxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxHQUFHLElBQUksR0FBRyxDQUFDLEVBQUUsUUFBUSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsVUFBVSxFQUFFLEdBQUcsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztBQUMxRztBQUNBLElBQUksT0FBTyxDQUFDLEVBQUUsUUFBUSxDQUFDLFFBQVEsQ0FBQyxFQUFFLEVBQUUsUUFBUSxDQUFDLFFBQVEsQ0FBQyxFQUFFLElBQUksQ0FBQyxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUM7QUFDMUUsQ0FBQztBQUNEO0FBQ08sU0FB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QSxJQUFJLElBQUksQ0FBQyxNQUFNLEVBQUUsTUFBTSxHQUFHLENBQUMsRUFBRTtBQUM3QixRQUFRLE1BQU0sQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO0FBQzNELFFBQVEsTUFBTSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7QUFDM0Q7QUFDQSxRQUFRLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQ2xDLFFBQVEsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDbEM7QUFDQSxRQUFRLElBQUksQ0FBQyxLQUFLLElBQUksTUFBTSxDQUFDO0FBQzdCLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBSSxVQUFVLEdBQUcsTUFBTTtBQUN2QixRQUFRLElBQUksTUFBTSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUM7QUFDakM7QUFDQSxRQUFRLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFO0FBQzdELFlBQVksTUFBTSxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUM7QUFDakUsU0FBUztBQUNUO0FBQ0EsUUFBUSxNQUFNLFFBQVEsR0FBRyxNQUFNLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQztBQUM3QztBQUNBLFFBQVEsSUFBSSxRQUFRLEdBQUcsQ0FBQyxFQUFFO0FBQzFCLFlBQVksSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxFQUFFLFFBQVEsRUFBRSxD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QUFPLEdBQUcsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQzNDLFNBQVM7QUFDVDtBQUNBLFFBQVEsT0FBTyxHQUFHLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztBQUNwRCxLQUFLO0FBQ0w7QUFDQSxJQUFJLE9BQU8sVUFBVSxDQUFDLENBQUMsRUFBRTtBQUN6QixRQUFRLE9BQU8sQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksSUFBSSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztBQUNyRCxLQUFLO0FBQ0w7QUFDQSxJQUFJLE9BQU8sV0FBVyxDQUFDLENBQUMsRUFBRTtBQUMxQixRQUFRLE9BQU8sSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO0FBQzNDLEtBQUs7QUFDTDtBQUNBLElBQUksT0FBTyxhQUFhLENBQUMsQ0FBQyxFQUFFO0FBQzVCLFFBQVEsT0FBTyxHQUFHLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsSUFBSSxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3pELEtBQUs7QUFDTDtBQUNBLElBQUksT0FBTyxVQUFVLENBQUMsQ0FBQyxFQUFFO0FBQ3pCLFFBQVEsT0FBTyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7QUFDbkQsS0FBSztBQUNMO0FBQ0EsSUFBSSxPQUFPLFdBQVcsQ0FBQyxDQUFDLEVBQUU7QUFDMUIsUUFBUSxPQUFPLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMs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Q0FBQztBQUNwQixJQUFJLFdBQVcsR0FBRztBQUNsQixRQUFRLElBQUksQ0FBQyxTQUFTLEdBQUcsRUFBRSxDQUFDO0FBQzVCLFFBQVEsSUFBSSxDQUFDLElBQUksR0FBRyxXQUFXLENBQUMsR0FBRyxFQUFFLENBQUM7QUFDdEMsUUFBUSxJQUFJLENBQUMsSUFBSSxHQUFHLENBQUMsQ0FBQztBQUN0QixRQUFRLElBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDO0FBQ3ZCLFFBQVEsSUFBSSxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUM7QUFDdkIsUUFBUSxJQUFJLENBQUMsV0FBVyxHQUFHLEtBQUssQ0FBQztBQUNqQyxLQUFLO0FBQ0w7QUFDQSxJQUFJLE1BQU0sR0FBRyxJQUFJLElBQUk7QUFDckIsUUFBUSxJQUFJLElBQUksQ0FBQyxXQUFXLEVBQUU7QUFDOUIsWUFBWSxJQUFJLENBQUMsU0FBUyxHQUFHLFlBQVksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDdkQsU0FBUztBQUNUO0FBQ0EsUUFBUSxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDckQsUUFBUSxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztBQUN6QixRQUFRLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxHQUFHLEtBQUssQ0FBQztBQUNqQyxRQUFRLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztBQUNyQjtBQUNBLFFBQVEsS0FBSyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRTtBQUM3RCxZQUFZLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDL0M7QUFDQSxZQUFZLElBQUksQ0FBQyxRQUFRLEVBQUU7QUFDM0IsZ0JBQWdCLFNBQVM7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T0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDcEQsUUFBUSxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUMvQixLQUFLO0FBQ0w7QUFDQSxJQUFJLE9BQU8sWUFBWSxHQUFHO0FBQzFCLFFBQVEsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUNyRSxRQUFRLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUM5RCxLQUFLO0FBQ0w7QUFDQSxJQUFJLE9BQU8sZUFBZSxHQUFHO0FBQzdCLFFBQVEsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUN0RSxRQUFRLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUMvRCxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUksT0FBTyxVQUFVLEdBQUcsWUFBWTtBQUNwQyxRQUFRLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQztBQUMvQjtBQUNBLFFBQVEsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sRUFBRSxDQUFDO0FBQzVDO0FBQ0EsUUFBUSxNQUFNLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7QUFDckMsUUFBUSxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7QUFDeEM7QUFDQTtBQUNBLEtBQUssQ0FBQztBQUNOOzs7OyJ9
