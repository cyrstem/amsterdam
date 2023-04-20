class Config {
    static PATH = '/';
    static BREAKPOINT = 1000;
    static DEBUG = location.search === '?debug';

    static CDN = '';

    static ASSETS = [
        'assets/images/alienkitty.svg',
        'assets/images/alienkitty_eyelid.svg'
    ];
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

        let assets = Config.ASSETS;

        // if (Device.mobile) {
        //     assets = assets.filter(path => !/desktop/.test(path));
        // } else {
        //     assets = assets.filter(path => !/mobile/.test(path));
        // }

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

export { AssetLoader, Assets, Config, Device, EventEmitter, Events, Interface, Loader, Preloader, Stage, absolute, brightness, clamp, clearTween, delayedCall, euclideanModulo, getConstructor, guid, isPowerOfTwo, lerp, radToDeg, shuffle, ticker, tween };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9hZGVyLmpzIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvY29uZmlnL0NvbmZpZy5qcyIsIi4uLy4uLy4uL3NyYy9jb25maWcvRGV2aWNlLmpzIiwiLi4vLi4vLi4vc3JjL2NvbmZpZy9FdmVudHMuanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvdGhyZWUvc3JjL21hdGgvTWF0aFV0aWxzLmpzIiwiLi4vLi4vLi4vc3JjL3V0aWxzL1V0aWxzLmpzIiwiLi4vLi4vLi4vc3JjL2xvYWRlcnMvQXNzZXRzLmpzIiwiLi4vLi4vLi4vc3JjL3V0aWxzL0V2ZW50RW1pdHRlci5qcyIsIi4uLy4uLy4uL3NyYy9sb2FkZXJzL0xvYWRlci5qcyIsIi4uLy4uLy4uL3NyYy9sb2FkZXJzL011bHRpTG9hZGVyLmpzIiwiLi4vLi4vLi4vc3JjL2xvYWRlcnMvRm9udExvYWRlci5qcyIsIi4uLy4uLy4uL3NyYy9sb2FkZXJzL0Fzc2V0TG9hZGVyLmpzIiwiLi4vLi4vLi4vc3JjL3R3ZWVuL0JlemllckVhc2luZy5qcyIsIi4uLy4uLy4uL3NyYy90d2Vlbi9FYXNpbmcuanMiLCIuLi8uLi8uLi9zcmMvdHdlZW4vVGlja2VyLmpzIiwiLi4vLi4vLi4vc3JjL3R3ZWVuL1R3ZWVuLmpzIiwiLi4vLi4vLi4vc3JjL3V0aWxzL0ludGVyZmFjZS5qcyIsIi4uLy4uLy4uL3NyYy91dGlscy9TdGFnZS5qcyIsIi4uLy4uLy4uL3NyYy92aWV3cy9Qcm9ncmVzc0NhbnZhcy5qcyIsIi4uLy4uLy4uL3NyYy92aWV3cy9QcmVsb2FkZXJWaWV3LmpzIiwiLi4vLi4vLi4vc3JjL2NvbnRyb2xsZXJzL1ByZWxvYWRlci5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgY2xhc3MgQ29uZmlnIHtcbiAgICBzdGF0aWMgUEFUSCA9ICcvJztcbiAgICBzdGF0aWMgQlJFQUtQT0lOVCA9IDEwMDA7XG4gICAgc3RhdGljIERFQlVHID0gbG9jYXRpb24uc2VhcmNoID09PSAnP2RlYnVnJztcblxuICAgIHN0YXRpYyBDRE4gPSAnJztcblxuICAgIHN0YXRpYyBBU1NFVFMgPSBbXG4gICAgICAgICdhc3NldHMvaW1hZ2VzL2FsaWVua2l0dHkuc3ZnJyxcbiAgICAgICAgJ2Fzc2V0cy9pbWFnZXMvYWxpZW5raXR0eV9leWVsaWQuc3ZnJ1xuICAgIF07XG59XG4iLCJleHBvcnQgY2xhc3MgRGV2aWNlIHtcbiAgICBzdGF0aWMgYWdlbnQgPSBuYXZpZ2F0b3IudXNlckFnZW50LnRvTG93ZXJDYXNlKCk7XG5cbiAgICBzdGF0aWMgbW9iaWxlID0gISFuYXZpZ2F0b3IubWF4VG91Y2hQb2ludHM7XG5cbiAgICBzdGF0aWMgdGFibGV0ID0gdGhpcy5tb2JpbGUgJiYgTWF0aC5tYXgoc2NyZWVuLndpZHRoLCBzY3JlZW4uaGVpZ2h0KSA+IDEwMDA7XG5cbiAgICBzdGF0aWMgcGhvbmUgPSB0aGlzLm1vYmlsZSAmJiAhdGhpcy50YWJsZXQ7XG5cbiAgICBzdGF0aWMgd2ViZ2wgPSAoKCkgPT4ge1xuICAgICAgICBpZiAodHlwZW9mIHdpbmRvdyA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGNvbnRleHRPcHRpb25zID0ge1xuICAgICAgICAgICAgZmFpbElmTWFqb3JQZXJmb3JtYW5jZUNhdmVhdDogdHJ1ZVxuICAgICAgICB9O1xuXG4gICAgICAgIGxldCBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcbiAgICAgICAgbGV0IGdsID0gY2FudmFzLmdldENvbnRleHQoJ3dlYmdsMicsIGNvbnRleHRPcHRpb25zKTtcblxuICAgICAgICBjb25zdCByZXN1bHQgPSAhIWdsO1xuXG4gICAgICAgIGdsID0gbnVsbDtcbiAgICAgICAgY2FudmFzID0gbnVsbDtcblxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH0pKCk7XG59XG4iLCJleHBvcnQgY2xhc3MgRXZlbnRzIHtcbiAgICBzdGF0aWMgU1RBVEVfQ0hBTkdFID0gJ3N0YXRlX2NoYW5nZSc7XG4gICAgc3RhdGljIFZJRVdfQ0hBTkdFID0gJ3ZpZXdfY2hhbmdlJztcbiAgICBzdGF0aWMgS0VZX0RPV04gPSAna2V5X2Rvd24nO1xuICAgIHN0YXRpYyBLRVlfVVAgPSAna2V5X3VwJztcbiAgICBzdGF0aWMgS0VZX1BSRVNTID0gJ2tleV9wcmVzcyc7XG4gICAgc3RhdGljIFJFU0laRSA9ICdyZXNpemUnO1xuICAgIHN0YXRpYyBWSVNJQklMSVRZID0gJ3Zpc2liaWxpdHknO1xuICAgIHN0YXRpYyBQUk9HUkVTUyA9ICdwcm9ncmVzcyc7XG4gICAgc3RhdGljIENPTVBMRVRFID0gJ2NvbXBsZXRlJztcbiAgICBzdGF0aWMgVVBEQVRFID0gJ3VwZGF0ZSc7XG4gICAgc3RhdGljIEhPVkVSID0gJ2hvdmVyJztcbiAgICBzdGF0aWMgQ0xJQ0sgPSAnY2xpY2snO1xuXG4gICAgc3RhdGljIENPTE9SX1BJQ0tFUiA9ICdjb2xvcl9waWNrZXInO1xuICAgIHN0YXRpYyBJTlZFUlQgPSAnaW52ZXJ0Jztcbn1cbiIsImNvbnN0IF9sdXQgPSBbICcwMCcsICcwMScsICcwMicsICcwMycsICcwNCcsICcwNScsICcwNicsICcwNycsICcwOCcsICcwOScsICcwYScsICcwYicsICcwYycsICcwZCcsICcwZScsICcwZicsICcxMCcsICcxMScsICcxMicsICcxMycsICcxNCcsICcxNScsICcxNicsICcxNycsICcxOCcsICcxOScsICcxYScsICcxYicsICcxYycsICcxZCcsICcxZScsICcxZicsICcyMCcsICcyMScsICcyMicsICcyMycsICcyNCcsICcyNScsICcyNicsICcyNycsICcyOCcsICcyOScsICcyYScsICcyYicsICcyYycsICcyZCcsICcyZScsICcyZicsICczMCcsICczMScsICczMicsICczMycsICczNCcsICczNScsICczNicsICczNycsICczOCcsICczOScsICczYScsICczYicsICczYycsICczZCcsICczZScsICczZicsICc0MCcsICc0MScsICc0MicsICc0MycsICc0NCcsICc0NScsICc0NicsICc0NycsICc0OCcsICc0OScsICc0YScsICc0YicsICc0YycsICc0ZCcsICc0ZScsICc0ZicsICc1MCcsICc1MScsICc1MicsICc1MycsICc1NCcsICc1NScsICc1NicsICc1NycsICc1OCcsICc1OScsICc1YScsICc1YicsICc1YycsICc1ZCcsICc1ZScsICc1ZicsICc2MCcsICc2MScsICc2MicsICc2MycsICc2NCcsICc2NScsICc2NicsICc2NycsICc2OCcsICc2OScsICc2YScsICc2YicsICc2YycsICc2ZCcsICc2ZScsICc2ZicsICc3MCcsICc3MScsICc3MicsICc3MycsICc3NCcsICc3NScsICc3NicsICc3NycsICc3OCcsICc3OScsICc3YScsICc3YicsICc3YycsICc3ZCcsICc3ZScsICc3ZicsICc4MCcsICc4MScsICc4MicsICc4MycsICc4NCcsICc4NScsICc4NicsICc4NycsICc4OCcsICc4OScsICc4YScsICc4YicsICc4YycsICc4ZCcsICc4ZScsICc4ZicsICc5MCcsICc5MScsICc5MicsICc5MycsICc5NCcsICc5NScsICc5NicsICc5NycsICc5OCcsICc5OScsICc5YScsICc5YicsICc5YycsICc5ZCcsICc5ZScsICc5ZicsICdhMCcsICdhMScsICdhMicsICdhMycsICdhNCcsICdhNScsICdhNicsICdhNycsICdhOCcsICdhOScsICdhYScsICdhYicsICdhYycsICdhZCcsICdhZScsICdhZicsICdiMCcsICdiMScsICdiMicsICdiMycsICdiNCcsICdiNScsICdiNicsICdiNycsICdiOCcsICdiOScsICdiYScsICdiYicsICdiYycsICdiZCcsICdiZScsICdiZicsICdjMCcsICdjMScsICdjMicsICdjMycsICdjNCcsICdjNScsICdjNicsICdjNycsICdjOCcsICdjOScsICdjYScsICdjYicsICdjYycsICdjZCcsICdjZScsICdjZicsICdkMCcsICdkMScsICdkMicsICdkMycsICdkNCcsICdkNScsICdkNicsICdkNycsICdkOCcsICdkOScsICdkYScsICdkYicsICdkYycsICdkZCcsICdkZScsICdkZicsICdlMCcsICdlMScsICdlMicsICdlMycsICdlNCcsICdlNScsICdlNicsICdlNycsICdlOCcsICdlOScsICdlYScsICdlYicsICdlYycsICdlZCcsICdlZScsICdlZicsICdmMCcsICdmMScsICdmMicsICdmMycsICdmNCcsICdmNScsICdmNicsICdmNycsICdmOCcsICdmOScsICdmYScsICdmYicsICdmYycsICdmZCcsICdmZScsICdmZicgXTtcblxubGV0IF9zZWVkID0gMTIzNDU2NztcblxuXG5jb25zdCBERUcyUkFEID0gTWF0aC5QSSAvIDE4MDtcbmNvbnN0IFJBRDJERUcgPSAxODAgLyBNYXRoLlBJO1xuXG4vLyBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzEwNTAzNC9ob3ctdG8tY3JlYXRlLWEtZ3VpZC11dWlkLWluLWphdmFzY3JpcHQvMjE5NjMxMzYjMjE5NjMxMzZcbmZ1bmN0aW9uIGdlbmVyYXRlVVVJRCgpIHtcblxuXHRjb25zdCBkMCA9IE1hdGgucmFuZG9tKCkgKiAweGZmZmZmZmZmIHwgMDtcblx0Y29uc3QgZDEgPSBNYXRoLnJhbmRvbSgpICogMHhmZmZmZmZmZiB8IDA7XG5cdGNvbnN0IGQyID0gTWF0aC5yYW5kb20oKSAqIDB4ZmZmZmZmZmYgfCAwO1xuXHRjb25zdCBkMyA9IE1hdGgucmFuZG9tKCkgKiAweGZmZmZmZmZmIHwgMDtcblx0Y29uc3QgdXVpZCA9IF9sdXRbIGQwICYgMHhmZiBdICsgX2x1dFsgZDAgPj4gOCAmIDB4ZmYgXSArIF9sdXRbIGQwID4+IDE2ICYgMHhmZiBdICsgX2x1dFsgZDAgPj4gMjQgJiAweGZmIF0gKyAnLScgK1xuXHRcdFx0X2x1dFsgZDEgJiAweGZmIF0gKyBfbHV0WyBkMSA+PiA4ICYgMHhmZiBdICsgJy0nICsgX2x1dFsgZDEgPj4gMTYgJiAweDBmIHwgMHg0MCBdICsgX2x1dFsgZDEgPj4gMjQgJiAweGZmIF0gKyAnLScgK1xuXHRcdFx0X2x1dFsgZDIgJiAweDNmIHwgMHg4MCBdICsgX2x1dFsgZDIgPj4gOCAmIDB4ZmYgXSArICctJyArIF9sdXRbIGQyID4+IDE2ICYgMHhmZiBdICsgX2x1dFsgZDIgPj4gMjQgJiAweGZmIF0gK1xuXHRcdFx0X2x1dFsgZDMgJiAweGZmIF0gKyBfbHV0WyBkMyA+PiA4ICYgMHhmZiBdICsgX2x1dFsgZDMgPj4gMTYgJiAweGZmIF0gKyBfbHV0WyBkMyA+PiAyNCAmIDB4ZmYgXTtcblxuXHQvLyAudG9Mb3dlckNhc2UoKSBoZXJlIGZsYXR0ZW5zIGNvbmNhdGVuYXRlZCBzdHJpbmdzIHRvIHNhdmUgaGVhcCBtZW1vcnkgc3BhY2UuXG5cdHJldHVybiB1dWlkLnRvTG93ZXJDYXNlKCk7XG5cbn1cblxuZnVuY3Rpb24gY2xhbXAoIHZhbHVlLCBtaW4sIG1heCApIHtcblxuXHRyZXR1cm4gTWF0aC5tYXgoIG1pbiwgTWF0aC5taW4oIG1heCwgdmFsdWUgKSApO1xuXG59XG5cbi8vIGNvbXB1dGUgZXVjbGlkZWFuIG1vZHVsbyBvZiBtICUgblxuLy8gaHR0cHM6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvTW9kdWxvX29wZXJhdGlvblxuZnVuY3Rpb24gZXVjbGlkZWFuTW9kdWxvKCBuLCBtICkge1xuXG5cdHJldHVybiAoICggbiAlIG0gKSArIG0gKSAlIG07XG5cbn1cblxuLy8gTGluZWFyIG1hcHBpbmcgZnJvbSByYW5nZSA8YTEsIGEyPiB0byByYW5nZSA8YjEsIGIyPlxuZnVuY3Rpb24gbWFwTGluZWFyKCB4LCBhMSwgYTIsIGIxLCBiMiApIHtcblxuXHRyZXR1cm4gYjEgKyAoIHggLSBhMSApICogKCBiMiAtIGIxICkgLyAoIGEyIC0gYTEgKTtcblxufVxuXG4vLyBodHRwczovL3d3dy5nYW1lZGV2Lm5ldC90dXRvcmlhbHMvcHJvZ3JhbW1pbmcvZ2VuZXJhbC1hbmQtZ2FtZXBsYXktcHJvZ3JhbW1pbmcvaW52ZXJzZS1sZXJwLWEtc3VwZXItdXNlZnVsLXlldC1vZnRlbi1vdmVybG9va2VkLWZ1bmN0aW9uLXI1MjMwL1xuZnVuY3Rpb24gaW52ZXJzZUxlcnAoIHgsIHksIHZhbHVlICkge1xuXG5cdGlmICggeCAhPT0geSApIHtcblxuXHRcdHJldHVybiAoIHZhbHVlIC0geCApIC8gKCB5IC0geCApO1xuXG5cdH0gZWxzZSB7XG5cblx0XHRyZXR1cm4gMDtcblxuXHR9XG5cbn1cblxuLy8gaHR0cHM6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvTGluZWFyX2ludGVycG9sYXRpb25cbmZ1bmN0aW9uIGxlcnAoIHgsIHksIHQgKSB7XG5cblx0cmV0dXJuICggMSAtIHQgKSAqIHggKyB0ICogeTtcblxufVxuXG4vLyBodHRwOi8vd3d3LnJvcnlkcmlzY29sbC5jb20vMjAxNi8wMy8wNy9mcmFtZS1yYXRlLWluZGVwZW5kZW50LWRhbXBpbmctdXNpbmctbGVycC9cbmZ1bmN0aW9uIGRhbXAoIHgsIHksIGxhbWJkYSwgZHQgKSB7XG5cblx0cmV0dXJuIGxlcnAoIHgsIHksIDEgLSBNYXRoLmV4cCggLSBsYW1iZGEgKiBkdCApICk7XG5cbn1cblxuLy8gaHR0cHM6Ly93d3cuZGVzbW9zLmNvbS9jYWxjdWxhdG9yL3Zjc2pueXo3eDRcbmZ1bmN0aW9uIHBpbmdwb25nKCB4LCBsZW5ndGggPSAxICkge1xuXG5cdHJldHVybiBsZW5ndGggLSBNYXRoLmFicyggZXVjbGlkZWFuTW9kdWxvKCB4LCBsZW5ndGggKiAyICkgLSBsZW5ndGggKTtcblxufVxuXG4vLyBodHRwOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL1Ntb290aHN0ZXBcbmZ1bmN0aW9uIHNtb290aHN0ZXAoIHgsIG1pbiwgbWF4ICkge1xuXG5cdGlmICggeCA8PSBtaW4gKSByZXR1cm4gMDtcblx0aWYgKCB4ID49IG1heCApIHJldHVybiAxO1xuXG5cdHggPSAoIHggLSBtaW4gKSAvICggbWF4IC0gbWluICk7XG5cblx0cmV0dXJuIHggKiB4ICogKCAzIC0gMiAqIHggKTtcblxufVxuXG5mdW5jdGlvbiBzbW9vdGhlcnN0ZXAoIHgsIG1pbiwgbWF4ICkge1xuXG5cdGlmICggeCA8PSBtaW4gKSByZXR1cm4gMDtcblx0aWYgKCB4ID49IG1heCApIHJldHVybiAxO1xuXG5cdHggPSAoIHggLSBtaW4gKSAvICggbWF4IC0gbWluICk7XG5cblx0cmV0dXJuIHggKiB4ICogeCAqICggeCAqICggeCAqIDYgLSAxNSApICsgMTAgKTtcblxufVxuXG4vLyBSYW5kb20gaW50ZWdlciBmcm9tIDxsb3csIGhpZ2g+IGludGVydmFsXG5mdW5jdGlvbiByYW5kSW50KCBsb3csIGhpZ2ggKSB7XG5cblx0cmV0dXJuIGxvdyArIE1hdGguZmxvb3IoIE1hdGgucmFuZG9tKCkgKiAoIGhpZ2ggLSBsb3cgKyAxICkgKTtcblxufVxuXG4vLyBSYW5kb20gZmxvYXQgZnJvbSA8bG93LCBoaWdoPiBpbnRlcnZhbFxuZnVuY3Rpb24gcmFuZEZsb2F0KCBsb3csIGhpZ2ggKSB7XG5cblx0cmV0dXJuIGxvdyArIE1hdGgucmFuZG9tKCkgKiAoIGhpZ2ggLSBsb3cgKTtcblxufVxuXG4vLyBSYW5kb20gZmxvYXQgZnJvbSA8LXJhbmdlLzIsIHJhbmdlLzI+IGludGVydmFsXG5mdW5jdGlvbiByYW5kRmxvYXRTcHJlYWQoIHJhbmdlICkge1xuXG5cdHJldHVybiByYW5nZSAqICggMC41IC0gTWF0aC5yYW5kb20oKSApO1xuXG59XG5cbi8vIERldGVybWluaXN0aWMgcHNldWRvLXJhbmRvbSBmbG9hdCBpbiB0aGUgaW50ZXJ2YWwgWyAwLCAxIF1cbmZ1bmN0aW9uIHNlZWRlZFJhbmRvbSggcyApIHtcblxuXHRpZiAoIHMgIT09IHVuZGVmaW5lZCApIF9zZWVkID0gcztcblxuXHQvLyBNdWxiZXJyeTMyIGdlbmVyYXRvclxuXG5cdGxldCB0ID0gX3NlZWQgKz0gMHg2RDJCNzlGNTtcblxuXHR0ID0gTWF0aC5pbXVsKCB0IF4gdCA+Pj4gMTUsIHQgfCAxICk7XG5cblx0dCBePSB0ICsgTWF0aC5pbXVsKCB0IF4gdCA+Pj4gNywgdCB8IDYxICk7XG5cblx0cmV0dXJuICggKCB0IF4gdCA+Pj4gMTQgKSA+Pj4gMCApIC8gNDI5NDk2NzI5NjtcblxufVxuXG5mdW5jdGlvbiBkZWdUb1JhZCggZGVncmVlcyApIHtcblxuXHRyZXR1cm4gZGVncmVlcyAqIERFRzJSQUQ7XG5cbn1cblxuZnVuY3Rpb24gcmFkVG9EZWcoIHJhZGlhbnMgKSB7XG5cblx0cmV0dXJuIHJhZGlhbnMgKiBSQUQyREVHO1xuXG59XG5cbmZ1bmN0aW9uIGlzUG93ZXJPZlR3byggdmFsdWUgKSB7XG5cblx0cmV0dXJuICggdmFsdWUgJiAoIHZhbHVlIC0gMSApICkgPT09IDAgJiYgdmFsdWUgIT09IDA7XG5cbn1cblxuZnVuY3Rpb24gY2VpbFBvd2VyT2ZUd28oIHZhbHVlICkge1xuXG5cdHJldHVybiBNYXRoLnBvdyggMiwgTWF0aC5jZWlsKCBNYXRoLmxvZyggdmFsdWUgKSAvIE1hdGguTE4yICkgKTtcblxufVxuXG5mdW5jdGlvbiBmbG9vclBvd2VyT2ZUd28oIHZhbHVlICkge1xuXG5cdHJldHVybiBNYXRoLnBvdyggMiwgTWF0aC5mbG9vciggTWF0aC5sb2coIHZhbHVlICkgLyBNYXRoLkxOMiApICk7XG5cbn1cblxuZnVuY3Rpb24gc2V0UXVhdGVybmlvbkZyb21Qcm9wZXJFdWxlciggcSwgYSwgYiwgYywgb3JkZXIgKSB7XG5cblx0Ly8gSW50cmluc2ljIFByb3BlciBFdWxlciBBbmdsZXMgLSBzZWUgaHR0cHM6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvRXVsZXJfYW5nbGVzXG5cblx0Ly8gcm90YXRpb25zIGFyZSBhcHBsaWVkIHRvIHRoZSBheGVzIGluIHRoZSBvcmRlciBzcGVjaWZpZWQgYnkgJ29yZGVyJ1xuXHQvLyByb3RhdGlvbiBieSBhbmdsZSAnYScgaXMgYXBwbGllZCBmaXJzdCwgdGhlbiBieSBhbmdsZSAnYicsIHRoZW4gYnkgYW5nbGUgJ2MnXG5cdC8vIGFuZ2xlcyBhcmUgaW4gcmFkaWFuc1xuXG5cdGNvbnN0IGNvcyA9IE1hdGguY29zO1xuXHRjb25zdCBzaW4gPSBNYXRoLnNpbjtcblxuXHRjb25zdCBjMiA9IGNvcyggYiAvIDIgKTtcblx0Y29uc3QgczIgPSBzaW4oIGIgLyAyICk7XG5cblx0Y29uc3QgYzEzID0gY29zKCAoIGEgKyBjICkgLyAyICk7XG5cdGNvbnN0IHMxMyA9IHNpbiggKCBhICsgYyApIC8gMiApO1xuXG5cdGNvbnN0IGMxXzMgPSBjb3MoICggYSAtIGMgKSAvIDIgKTtcblx0Y29uc3QgczFfMyA9IHNpbiggKCBhIC0gYyApIC8gMiApO1xuXG5cdGNvbnN0IGMzXzEgPSBjb3MoICggYyAtIGEgKSAvIDIgKTtcblx0Y29uc3QgczNfMSA9IHNpbiggKCBjIC0gYSApIC8gMiApO1xuXG5cdHN3aXRjaCAoIG9yZGVyICkge1xuXG5cdFx0Y2FzZSAnWFlYJzpcblx0XHRcdHEuc2V0KCBjMiAqIHMxMywgczIgKiBjMV8zLCBzMiAqIHMxXzMsIGMyICogYzEzICk7XG5cdFx0XHRicmVhaztcblxuXHRcdGNhc2UgJ1laWSc6XG5cdFx0XHRxLnNldCggczIgKiBzMV8zLCBjMiAqIHMxMywgczIgKiBjMV8zLCBjMiAqIGMxMyApO1xuXHRcdFx0YnJlYWs7XG5cblx0XHRjYXNlICdaWFonOlxuXHRcdFx0cS5zZXQoIHMyICogYzFfMywgczIgKiBzMV8zLCBjMiAqIHMxMywgYzIgKiBjMTMgKTtcblx0XHRcdGJyZWFrO1xuXG5cdFx0Y2FzZSAnWFpYJzpcblx0XHRcdHEuc2V0KCBjMiAqIHMxMywgczIgKiBzM18xLCBzMiAqIGMzXzEsIGMyICogYzEzICk7XG5cdFx0XHRicmVhaztcblxuXHRcdGNhc2UgJ1lYWSc6XG5cdFx0XHRxLnNldCggczIgKiBjM18xLCBjMiAqIHMxMywgczIgKiBzM18xLCBjMiAqIGMxMyApO1xuXHRcdFx0YnJlYWs7XG5cblx0XHRjYXNlICdaWVonOlxuXHRcdFx0cS5zZXQoIHMyICogczNfMSwgczIgKiBjM18xLCBjMiAqIHMxMywgYzIgKiBjMTMgKTtcblx0XHRcdGJyZWFrO1xuXG5cdFx0ZGVmYXVsdDpcblx0XHRcdGNvbnNvbGUud2FybiggJ1RIUkVFLk1hdGhVdGlsczogLnNldFF1YXRlcm5pb25Gcm9tUHJvcGVyRXVsZXIoKSBlbmNvdW50ZXJlZCBhbiB1bmtub3duIG9yZGVyOiAnICsgb3JkZXIgKTtcblxuXHR9XG5cbn1cblxuZnVuY3Rpb24gZGVub3JtYWxpemUoIHZhbHVlLCBhcnJheSApIHtcblxuXHRzd2l0Y2ggKCBhcnJheS5jb25zdHJ1Y3RvciApIHtcblxuXHRcdGNhc2UgRmxvYXQzMkFycmF5OlxuXG5cdFx0XHRyZXR1cm4gdmFsdWU7XG5cblx0XHRjYXNlIFVpbnQxNkFycmF5OlxuXG5cdFx0XHRyZXR1cm4gdmFsdWUgLyA2NTUzNS4wO1xuXG5cdFx0Y2FzZSBVaW50OEFycmF5OlxuXG5cdFx0XHRyZXR1cm4gdmFsdWUgLyAyNTUuMDtcblxuXHRcdGNhc2UgSW50MTZBcnJheTpcblxuXHRcdFx0cmV0dXJuIE1hdGgubWF4KCB2YWx1ZSAvIDMyNzY3LjAsIC0gMS4wICk7XG5cblx0XHRjYXNlIEludDhBcnJheTpcblxuXHRcdFx0cmV0dXJuIE1hdGgubWF4KCB2YWx1ZSAvIDEyNy4wLCAtIDEuMCApO1xuXG5cdFx0ZGVmYXVsdDpcblxuXHRcdFx0dGhyb3cgbmV3IEVycm9yKCAnSW52YWxpZCBjb21wb25lbnQgdHlwZS4nICk7XG5cblx0fVxuXG59XG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZSggdmFsdWUsIGFycmF5ICkge1xuXG5cdHN3aXRjaCAoIGFycmF5LmNvbnN0cnVjdG9yICkge1xuXG5cdFx0Y2FzZSBGbG9hdDMyQXJyYXk6XG5cblx0XHRcdHJldHVybiB2YWx1ZTtcblxuXHRcdGNhc2UgVWludDE2QXJyYXk6XG5cblx0XHRcdHJldHVybiBNYXRoLnJvdW5kKCB2YWx1ZSAqIDY1NTM1LjAgKTtcblxuXHRcdGNhc2UgVWludDhBcnJheTpcblxuXHRcdFx0cmV0dXJuIE1hdGgucm91bmQoIHZhbHVlICogMjU1LjAgKTtcblxuXHRcdGNhc2UgSW50MTZBcnJheTpcblxuXHRcdFx0cmV0dXJuIE1hdGgucm91bmQoIHZhbHVlICogMzI3NjcuMCApO1xuXG5cdFx0Y2FzZSBJbnQ4QXJyYXk6XG5cblx0XHRcdHJldHVybiBNYXRoLnJvdW5kKCB2YWx1ZSAqIDEyNy4wICk7XG5cblx0XHRkZWZhdWx0OlxuXG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoICdJbnZhbGlkIGNvbXBvbmVudCB0eXBlLicgKTtcblxuXHR9XG5cbn1cblxuY29uc3QgTWF0aFV0aWxzID0ge1xuXHRERUcyUkFEOiBERUcyUkFELFxuXHRSQUQyREVHOiBSQUQyREVHLFxuXHRnZW5lcmF0ZVVVSUQ6IGdlbmVyYXRlVVVJRCxcblx0Y2xhbXA6IGNsYW1wLFxuXHRldWNsaWRlYW5Nb2R1bG86IGV1Y2xpZGVhbk1vZHVsbyxcblx0bWFwTGluZWFyOiBtYXBMaW5lYXIsXG5cdGludmVyc2VMZXJwOiBpbnZlcnNlTGVycCxcblx0bGVycDogbGVycCxcblx0ZGFtcDogZGFtcCxcblx0cGluZ3Bvbmc6IHBpbmdwb25nLFxuXHRzbW9vdGhzdGVwOiBzbW9vdGhzdGVwLFxuXHRzbW9vdGhlcnN0ZXA6IHNtb290aGVyc3RlcCxcblx0cmFuZEludDogcmFuZEludCxcblx0cmFuZEZsb2F0OiByYW5kRmxvYXQsXG5cdHJhbmRGbG9hdFNwcmVhZDogcmFuZEZsb2F0U3ByZWFkLFxuXHRzZWVkZWRSYW5kb206IHNlZWRlZFJhbmRvbSxcblx0ZGVnVG9SYWQ6IGRlZ1RvUmFkLFxuXHRyYWRUb0RlZzogcmFkVG9EZWcsXG5cdGlzUG93ZXJPZlR3bzogaXNQb3dlck9mVHdvLFxuXHRjZWlsUG93ZXJPZlR3bzogY2VpbFBvd2VyT2ZUd28sXG5cdGZsb29yUG93ZXJPZlR3bzogZmxvb3JQb3dlck9mVHdvLFxuXHRzZXRRdWF0ZXJuaW9uRnJvbVByb3BlckV1bGVyOiBzZXRRdWF0ZXJuaW9uRnJvbVByb3BlckV1bGVyLFxuXHRub3JtYWxpemU6IG5vcm1hbGl6ZSxcblx0ZGVub3JtYWxpemU6IGRlbm9ybWFsaXplXG59O1xuXG5leHBvcnQge1xuXHRERUcyUkFELFxuXHRSQUQyREVHLFxuXHRnZW5lcmF0ZVVVSUQsXG5cdGNsYW1wLFxuXHRldWNsaWRlYW5Nb2R1bG8sXG5cdG1hcExpbmVhcixcblx0aW52ZXJzZUxlcnAsXG5cdGxlcnAsXG5cdGRhbXAsXG5cdHBpbmdwb25nLFxuXHRzbW9vdGhzdGVwLFxuXHRzbW9vdGhlcnN0ZXAsXG5cdHJhbmRJbnQsXG5cdHJhbmRGbG9hdCxcblx0cmFuZEZsb2F0U3ByZWFkLFxuXHRzZWVkZWRSYW5kb20sXG5cdGRlZ1RvUmFkLFxuXHRyYWRUb0RlZyxcblx0aXNQb3dlck9mVHdvLFxuXHRjZWlsUG93ZXJPZlR3byxcblx0Zmxvb3JQb3dlck9mVHdvLFxuXHRzZXRRdWF0ZXJuaW9uRnJvbVByb3BlckV1bGVyLFxuXHRub3JtYWxpemUsXG5cdGRlbm9ybWFsaXplLFxuXHRNYXRoVXRpbHNcbn07XG4iLCIvKipcbiAqIEBhdXRob3IgcHNjaHJvZW4gLyBodHRwczovL3Vmby5haS9cbiAqL1xuXG5pbXBvcnQgeyByYW5kSW50IH0gZnJvbSAndGhyZWUvc3JjL21hdGgvTWF0aFV0aWxzLmpzJztcblxuZXhwb3J0ICogZnJvbSAndGhyZWUvc3JjL21hdGgvTWF0aFV0aWxzLmpzJztcblxuZXhwb3J0IGZ1bmN0aW9uIHNodWZmbGUoYXJyYXkpIHtcbiAgICByZXR1cm4gYXJyYXkuc29ydCgoKSA9PiBNYXRoLnJhbmRvbSgpIC0gMC41KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGhlYWRzVGFpbHMoaGVhZHMsIHRhaWxzKSB7XG4gICAgaWYgKHR5cGVvZiBoZWFkcyA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgcmV0dXJuIHJhbmRJbnQoMCwgMSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJhbmRJbnQoMCwgMSkgPyB0YWlscyA6IGhlYWRzO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ3VpZCgpIHtcbiAgICByZXR1cm4gKERhdGUubm93KCkgKyByYW5kSW50KDAsIDk5OTk5KSkudG9TdHJpbmcoKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGJyaWdodG5lc3MoY29sb3IpIHtcbiAgICByZXR1cm4gY29sb3IuciAqIDAuMyArIGNvbG9yLmcgKiAwLjU5ICsgY29sb3IuYiAqIDAuMTE7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBiYXNlbmFtZShwYXRoLCBleHQpIHtcbiAgICBjb25zdCBuYW1lID0gcGF0aC5zcGxpdCgnLycpLnBvcCgpLnNwbGl0KCc/JylbMF07XG5cbiAgICByZXR1cm4gIWV4dCA/IG5hbWUuc3BsaXQoJy4nKVswXSA6IG5hbWU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBleHRlbnNpb24ocGF0aCkge1xuICAgIHJldHVybiBwYXRoLnNwbGl0KCcuJykucG9wKCkuc3BsaXQoJz8nKVswXS50b0xvd2VyQ2FzZSgpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYWJzb2x1dGUocGF0aCkge1xuICAgIGlmIChwYXRoLmluY2x1ZGVzKCcvLycpKSB7XG4gICAgICAgIHJldHVybiBwYXRoO1xuICAgIH1cblxuICAgIGNvbnN0IHBvcnQgPSBOdW1iZXIobG9jYXRpb24ucG9ydCkgPiAxMDAwID8gYDoke2xvY2F0aW9uLnBvcnR9YCA6ICcnO1xuICAgIGNvbnN0IHBhdGhuYW1lID0gcGF0aC5zdGFydHNXaXRoKCcvJykgPyBwYXRoIDogYCR7bG9jYXRpb24ucGF0aG5hbWUucmVwbGFjZSgvXFwvW14vXSokLywgJy8nKX0ke3BhdGh9YDtcblxuICAgIHJldHVybiBgJHtsb2NhdGlvbi5wcm90b2NvbH0vLyR7bG9jYXRpb24uaG9zdG5hbWV9JHtwb3J0fSR7cGF0aG5hbWV9YDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEtleUJ5VmFsdWUob2JqZWN0LCB2YWx1ZSkge1xuICAgIHJldHVybiBPYmplY3Qua2V5cyhvYmplY3QpLmZpbmQoa2V5ID0+IG9iamVjdFtrZXldID09PSB2YWx1ZSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRDb25zdHJ1Y3RvcihvYmplY3QpIHtcbiAgICBjb25zdCBpc0luc3RhbmNlID0gdHlwZW9mIG9iamVjdCAhPT0gJ2Z1bmN0aW9uJztcbiAgICBjb25zdCBjb2RlID0gaXNJbnN0YW5jZSA/IG9iamVjdC5jb25zdHJ1Y3Rvci50b1N0cmluZygpIDogb2JqZWN0LnRvU3RyaW5nKCk7XG4gICAgY29uc3QgbmFtZSA9IGNvZGUubWF0Y2goLyg/OmNsYXNzfGZ1bmN0aW9uKVxccyhbXlxcc3soXSspLylbMV07XG5cbiAgICByZXR1cm4geyBuYW1lLCBjb2RlLCBpc0luc3RhbmNlIH07XG59XG4iLCIvKipcbiAqIEBhdXRob3IgcHNjaHJvZW4gLyBodHRwczovL3Vmby5haS9cbiAqL1xuXG5pbXBvcnQgeyBndWlkIH0gZnJvbSAnLi4vdXRpbHMvVXRpbHMuanMnO1xuXG5leHBvcnQgY2xhc3MgQXNzZXRzIHtcbiAgICBzdGF0aWMgcGF0aCA9ICcnO1xuICAgIHN0YXRpYyBjcm9zc09yaWdpbjtcbiAgICBzdGF0aWMgb3B0aW9ucztcbiAgICBzdGF0aWMgY2FjaGUgPSBmYWxzZTtcbiAgICBzdGF0aWMgZmlsZXMgPSB7fTtcblxuICAgIHN0YXRpYyBhZGQoa2V5LCBmaWxlKSB7XG4gICAgICAgIGlmICghdGhpcy5jYWNoZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5maWxlc1trZXldID0gZmlsZTtcbiAgICB9XG5cbiAgICBzdGF0aWMgZ2V0KGtleSkge1xuICAgICAgICBpZiAoIXRoaXMuY2FjaGUpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzLmZpbGVzW2tleV07XG4gICAgfVxuXG4gICAgc3RhdGljIHJlbW92ZShrZXkpIHtcbiAgICAgICAgZGVsZXRlIHRoaXMuZmlsZXNba2V5XTtcbiAgICB9XG5cbiAgICBzdGF0aWMgY2xlYXIoKSB7XG4gICAgICAgIHRoaXMuZmlsZXMgPSB7fTtcbiAgICB9XG5cbiAgICBzdGF0aWMgZmlsdGVyKGNhbGxiYWNrKSB7XG4gICAgICAgIGNvbnN0IGZpbGVzID0gT2JqZWN0LmtleXModGhpcy5maWxlcykuZmlsdGVyKGNhbGxiYWNrKS5yZWR1Y2UoKG9iamVjdCwga2V5KSA9PiB7XG4gICAgICAgICAgICBvYmplY3Rba2V5XSA9IHRoaXMuZmlsZXNba2V5XTtcblxuICAgICAgICAgICAgcmV0dXJuIG9iamVjdDtcbiAgICAgICAgfSwge30pO1xuXG4gICAgICAgIHJldHVybiBmaWxlcztcbiAgICB9XG5cbiAgICBzdGF0aWMgZ2V0UGF0aChwYXRoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnBhdGggKyBwYXRoO1xuICAgIH1cblxuICAgIHN0YXRpYyBsb2FkSW1hZ2UocGF0aCwgY2FsbGJhY2spIHtcbiAgICAgICAgY29uc3QgaW1hZ2UgPSBuZXcgSW1hZ2UoKTtcblxuICAgICAgICBpbWFnZS5jcm9zc09yaWdpbiA9IHRoaXMuY3Jvc3NPcmlnaW47XG4gICAgICAgIGltYWdlLnNyYyA9IHRoaXMuZ2V0UGF0aChwYXRoKTtcblxuICAgICAgICBjb25zdCBwcm9taXNlID0gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgaW1hZ2Uub25sb2FkID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgIHJlc29sdmUoaW1hZ2UpO1xuXG4gICAgICAgICAgICAgICAgaW1hZ2Uub25sb2FkID0gbnVsbDtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGltYWdlLm9uZXJyb3IgPSBldmVudCA9PiB7XG4gICAgICAgICAgICAgICAgcmVqZWN0KGV2ZW50KTtcblxuICAgICAgICAgICAgICAgIGltYWdlLm9uZXJyb3IgPSBudWxsO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKGNhbGxiYWNrKSB7XG4gICAgICAgICAgICBwcm9taXNlLnRoZW4oY2FsbGJhY2spO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHByb21pc2U7XG4gICAgfVxuXG4gICAgc3RhdGljIGxvYWREYXRhKHBhdGgsIGNhbGxiYWNrKSB7XG4gICAgICAgIGNvbnN0IHByb21pc2UgPSBmZXRjaChgJHt0aGlzLmdldFBhdGgocGF0aCl9PyR7Z3VpZCgpfWAsIHRoaXMub3B0aW9ucykudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gcmVzcG9uc2UuanNvbigpO1xuICAgICAgICB9KTtcblxuICAgICAgICBpZiAoY2FsbGJhY2spIHtcbiAgICAgICAgICAgIHByb21pc2UudGhlbihjYWxsYmFjayk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcHJvbWlzZTtcbiAgICB9XG59XG4iLCIvKipcbiAqIEBhdXRob3IgcHNjaHJvZW4gLyBodHRwczovL3Vmby5haS9cbiAqL1xuXG5leHBvcnQgY2xhc3MgRXZlbnRFbWl0dGVyIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5jYWxsYmFja3MgPSB7fTtcbiAgICB9XG5cbiAgICBvbih0eXBlLCBjYWxsYmFjaykge1xuICAgICAgICBpZiAoIXRoaXMuY2FsbGJhY2tzW3R5cGVdKSB7XG4gICAgICAgICAgICB0aGlzLmNhbGxiYWNrc1t0eXBlXSA9IFtdO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5jYWxsYmFja3NbdHlwZV0ucHVzaChjYWxsYmFjayk7XG4gICAgfVxuXG4gICAgb2ZmKHR5cGUsIGNhbGxiYWNrKSB7XG4gICAgICAgIGlmICghdGhpcy5jYWxsYmFja3NbdHlwZV0pIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChjYWxsYmFjaykge1xuICAgICAgICAgICAgY29uc3QgaW5kZXggPSB0aGlzLmNhbGxiYWNrc1t0eXBlXS5pbmRleE9mKGNhbGxiYWNrKTtcblxuICAgICAgICAgICAgaWYgKH5pbmRleCkge1xuICAgICAgICAgICAgICAgIHRoaXMuY2FsbGJhY2tzW3R5cGVdLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBkZWxldGUgdGhpcy5jYWxsYmFja3NbdHlwZV07XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBlbWl0KHR5cGUsIGV2ZW50ID0ge30pIHtcbiAgICAgICAgaWYgKCF0aGlzLmNhbGxiYWNrc1t0eXBlXSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3Qgc3RhY2sgPSB0aGlzLmNhbGxiYWNrc1t0eXBlXS5zbGljZSgpO1xuXG4gICAgICAgIGZvciAobGV0IGkgPSAwLCBsID0gc3RhY2subGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgICAgICBzdGFja1tpXS5jYWxsKHRoaXMsIGV2ZW50KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGRlc3Ryb3koKSB7XG4gICAgICAgIGZvciAoY29uc3QgcHJvcCBpbiB0aGlzKSB7XG4gICAgICAgICAgICB0aGlzW3Byb3BdID0gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbn1cbiIsIi8qKlxuICogQGF1dGhvciBwc2Nocm9lbiAvIGh0dHBzOi8vdWZvLmFpL1xuICovXG5cbmltcG9ydCB7IEV2ZW50cyB9IGZyb20gJy4uL2NvbmZpZy9FdmVudHMuanMnO1xuaW1wb3J0IHsgRXZlbnRFbWl0dGVyIH0gZnJvbSAnLi4vdXRpbHMvRXZlbnRFbWl0dGVyLmpzJztcblxuZXhwb3J0IGNsYXNzIExvYWRlciB7XG4gICAgY29uc3RydWN0b3IoYXNzZXRzID0gW10sIGNhbGxiYWNrKSB7XG4gICAgICAgIHRoaXMuYXNzZXRzID0gYXNzZXRzO1xuICAgICAgICB0aGlzLmNhbGxiYWNrID0gY2FsbGJhY2s7XG4gICAgICAgIHRoaXMuZXZlbnRzID0gbmV3IEV2ZW50RW1pdHRlcigpO1xuICAgICAgICB0aGlzLnRvdGFsID0gMDtcbiAgICAgICAgdGhpcy5sb2FkZWQgPSAwO1xuICAgICAgICB0aGlzLnByb2dyZXNzID0gMDtcbiAgICAgICAgdGhpcy5wcm9taXNlID0gbmV3IFByb21pc2UocmVzb2x2ZSA9PiB0aGlzLnJlc29sdmUgPSByZXNvbHZlKTtcblxuICAgICAgICBhc3NldHMuZm9yRWFjaChwYXRoID0+IHRoaXMubG9hZChwYXRoKSk7XG4gICAgfVxuXG4gICAgbG9hZCgvKiBwYXRoLCBjYWxsYmFjayAqLykge31cblxuICAgIGxvYWRBc3luYyhwYXRoKSB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHRoaXMubG9hZChwYXRoLCByZXNvbHZlKSk7XG4gICAgfVxuXG4gICAgaW5jcmVtZW50KCkge1xuICAgICAgICB0aGlzLnByb2dyZXNzID0gKyt0aGlzLmxvYWRlZCAvIHRoaXMudG90YWw7XG5cbiAgICAgICAgdGhpcy5ldmVudHMuZW1pdChFdmVudHMuUFJPR1JFU1MsIHsgcHJvZ3Jlc3M6IHRoaXMucHJvZ3Jlc3MgfSk7XG5cbiAgICAgICAgaWYgKHRoaXMubG9hZGVkID09PSB0aGlzLnRvdGFsKSB7XG4gICAgICAgICAgICB0aGlzLmNvbXBsZXRlKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBjb21wbGV0ZSgpIHtcbiAgICAgICAgdGhpcy5yZXNvbHZlKCk7XG5cbiAgICAgICAgdGhpcy5ldmVudHMuZW1pdChFdmVudHMuQ09NUExFVEUpO1xuXG4gICAgICAgIGlmICh0aGlzLmNhbGxiYWNrKSB7XG4gICAgICAgICAgICB0aGlzLmNhbGxiYWNrKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBhZGQobnVtID0gMSkge1xuICAgICAgICB0aGlzLnRvdGFsICs9IG51bTtcbiAgICB9XG5cbiAgICB0cmlnZ2VyKG51bSA9IDEpIHtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBudW07IGkrKykge1xuICAgICAgICAgICAgdGhpcy5pbmNyZW1lbnQoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJlYWR5KCkge1xuICAgICAgICByZXR1cm4gdGhpcy50b3RhbCA/IHRoaXMucHJvbWlzZSA6IFByb21pc2UucmVzb2x2ZSgpO1xuICAgIH1cblxuICAgIGRlc3Ryb3koKSB7XG4gICAgICAgIHRoaXMuZXZlbnRzLmRlc3Ryb3koKTtcblxuICAgICAgICBmb3IgKGNvbnN0IHByb3AgaW4gdGhpcykge1xuICAgICAgICAgICAgdGhpc1twcm9wXSA9IG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG59XG4iLCIvKipcbiAqIEBhdXRob3IgcHNjaHJvZW4gLyBodHRwczovL3Vmby5haS9cbiAqL1xuXG5pbXBvcnQgeyBFdmVudHMgfSBmcm9tICcuLi9jb25maWcvRXZlbnRzLmpzJztcbmltcG9ydCB7IExvYWRlciB9IGZyb20gJy4vTG9hZGVyLmpzJztcblxuZXhwb3J0IGNsYXNzIE11bHRpTG9hZGVyIGV4dGVuZHMgTG9hZGVyIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgc3VwZXIoKTtcblxuICAgICAgICB0aGlzLmxvYWRlcnMgPSBbXTtcbiAgICAgICAgdGhpcy53ZWlnaHRzID0gW107XG4gICAgfVxuXG4gICAgbG9hZChsb2FkZXIsIHdlaWdodCA9IDEpIHtcbiAgICAgICAgbG9hZGVyLmV2ZW50cy5vbihFdmVudHMuUFJPR1JFU1MsIHRoaXMub25Qcm9ncmVzcyk7XG4gICAgICAgIGxvYWRlci5ldmVudHMub24oRXZlbnRzLkNPTVBMRVRFLCB0aGlzLm9uQ29tcGxldGUpO1xuXG4gICAgICAgIHRoaXMubG9hZGVycy5wdXNoKGxvYWRlcik7XG4gICAgICAgIHRoaXMud2VpZ2h0cy5wdXNoKHdlaWdodCk7XG5cbiAgICAgICAgdGhpcy50b3RhbCArPSB3ZWlnaHQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRXZlbnQgaGFuZGxlcnNcbiAgICAgKi9cblxuICAgIG9uUHJvZ3Jlc3MgPSAoKSA9PiB7XG4gICAgICAgIGxldCBsb2FkZWQgPSB0aGlzLmxvYWRlZDtcblxuICAgICAgICBmb3IgKGxldCBpID0gMCwgbCA9IHRoaXMubG9hZGVycy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgICAgIGxvYWRlZCArPSB0aGlzLndlaWdodHNbaV0gKiB0aGlzLmxvYWRlcnNbaV0ucHJvZ3Jlc3M7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBwcm9ncmVzcyA9IGxvYWRlZCAvIHRoaXMudG90YWw7XG5cbiAgICAgICAgaWYgKHByb2dyZXNzIDwgMSkge1xuICAgICAgICAgICAgdGhpcy5ldmVudHMuZW1pdChFdmVudHMuUFJPR1JFU1MsIHsgcHJvZ3Jlc3MgfSk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgb25Db21wbGV0ZSA9ICgpID0+IHtcbiAgICAgICAgdGhpcy5pbmNyZW1lbnQoKTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogUHVibGljIG1ldGhvZHNcbiAgICAgKi9cblxuICAgIGRlc3Ryb3kgPSAoKSA9PiB7XG4gICAgICAgIGZvciAobGV0IGkgPSB0aGlzLmxvYWRlcnMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgICAgIGlmICh0aGlzLmxvYWRlcnNbaV0gJiYgdGhpcy5sb2FkZXJzW2ldLmRlc3Ryb3kpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmxvYWRlcnNbaV0uZGVzdHJveSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHN1cGVyLmRlc3Ryb3koKTtcbiAgICB9O1xufVxuIiwiLyoqXG4gKiBAYXV0aG9yIHBzY2hyb2VuIC8gaHR0cHM6Ly91Zm8uYWkvXG4gKi9cblxuaW1wb3J0IHsgTG9hZGVyIH0gZnJvbSAnLi9Mb2FkZXIuanMnO1xuXG5leHBvcnQgY2xhc3MgRm9udExvYWRlciBleHRlbmRzIExvYWRlciB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHN1cGVyKCk7XG5cbiAgICAgICAgdGhpcy5sb2FkKCk7XG4gICAgfVxuXG4gICAgbG9hZCgpIHtcbiAgICAgICAgZG9jdW1lbnQuZm9udHMucmVhZHkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLmluY3JlbWVudCgpO1xuICAgICAgICB9KS5jYXRjaCgoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLmluY3JlbWVudCgpO1xuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLnRvdGFsKys7XG4gICAgfVxufVxuIiwiLyoqXG4gKiBAYXV0aG9yIHBzY2hyb2VuIC8gaHR0cHM6Ly91Zm8uYWkvXG4gKi9cblxuaW1wb3J0IHsgQXNzZXRzIH0gZnJvbSAnLi9Bc3NldHMuanMnO1xuaW1wb3J0IHsgTG9hZGVyIH0gZnJvbSAnLi9Mb2FkZXIuanMnO1xuXG5leHBvcnQgY2xhc3MgQXNzZXRMb2FkZXIgZXh0ZW5kcyBMb2FkZXIge1xuICAgIGxvYWQocGF0aCwgY2FsbGJhY2spIHtcbiAgICAgICAgY29uc3QgY2FjaGVkID0gQXNzZXRzLmdldChwYXRoKTtcblxuICAgICAgICBsZXQgcHJvbWlzZTtcblxuICAgICAgICBpZiAoY2FjaGVkKSB7XG4gICAgICAgICAgICBwcm9taXNlID0gUHJvbWlzZS5yZXNvbHZlKGNhY2hlZCk7XG4gICAgICAgIH0gZWxzZSBpZiAoL1xcLihqcGU/Z3xwbmd8Z2lmfHN2ZykvLnRlc3QocGF0aCkpIHtcbiAgICAgICAgICAgIHByb21pc2UgPSBBc3NldHMubG9hZEltYWdlKHBhdGgpO1xuICAgICAgICB9IGVsc2UgaWYgKC9cXC5qc29uLy50ZXN0KHBhdGgpKSB7XG4gICAgICAgICAgICBwcm9taXNlID0gQXNzZXRzLmxvYWREYXRhKHBhdGgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcHJvbWlzZSA9IGZldGNoKEFzc2V0cy5nZXRQYXRoKHBhdGgpLCBBc3NldHMub3B0aW9ucykudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKC9cXC4obXAzfG00YXxvZ2d8d2F2fGFpZmY/KS8udGVzdChwYXRoKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzcG9uc2UuYXJyYXlCdWZmZXIoKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzcG9uc2UudGV4dCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgcHJvbWlzZS50aGVuKGRhdGEgPT4ge1xuICAgICAgICAgICAgQXNzZXRzLmFkZChwYXRoLCBkYXRhKTtcblxuICAgICAgICAgICAgdGhpcy5pbmNyZW1lbnQoKTtcblxuICAgICAgICAgICAgaWYgKGNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2soZGF0YSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pLmNhdGNoKGV2ZW50ID0+IHtcbiAgICAgICAgICAgIHRoaXMuaW5jcmVtZW50KCk7XG5cbiAgICAgICAgICAgIGlmIChjYWxsYmFjaykge1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKGV2ZW50KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy50b3RhbCsrO1xuICAgIH1cbn1cbiIsIi8qKlxuICogQGF1dGhvciBwc2Nocm9lbiAvIGh0dHBzOi8vdWZvLmFpL1xuICpcbiAqIEJhc2VkIG9uIGh0dHBzOi8vZ2l0aHViLmNvbS9ncmUvYmV6aWVyLWVhc2luZ1xuICovXG5cbi8vIFRoZXNlIHZhbHVlcyBhcmUgZXN0YWJsaXNoZWQgYnkgZW1waXJpY2lzbSB3aXRoIHRlc3RzICh0cmFkZW9mZjogcGVyZm9ybWFuY2UgVlMgcHJlY2lzaW9uKVxuY29uc3QgTkVXVE9OX0lURVJBVElPTlMgPSA0O1xuY29uc3QgTkVXVE9OX01JTl9TTE9QRSA9IDAuMDAxO1xuY29uc3QgU1VCRElWSVNJT05fUFJFQ0lTSU9OID0gMC4wMDAwMDAxO1xuY29uc3QgU1VCRElWSVNJT05fTUFYX0lURVJBVElPTlMgPSAxMDtcblxuY29uc3Qga1NwbGluZVRhYmxlU2l6ZSA9IDExO1xuY29uc3Qga1NhbXBsZVN0ZXBTaXplID0gMSAvIChrU3BsaW5lVGFibGVTaXplIC0gMSk7XG5cbmNvbnN0IGZsb2F0MzJBcnJheVN1cHBvcnRlZCA9IHR5cGVvZiBGbG9hdDMyQXJyYXkgPT09ICdmdW5jdGlvbic7XG5cbmZ1bmN0aW9uIEEoYUExLCBhQTIpIHtcbiAgICByZXR1cm4gMSAtIDMgKiBhQTIgKyAzICogYUExO1xufVxuXG5mdW5jdGlvbiBCKGFBMSwgYUEyKSB7XG4gICAgcmV0dXJuIDMgKiBhQTIgLSA2ICogYUExO1xufVxuXG5mdW5jdGlvbiBDKGFBMSkge1xuICAgIHJldHVybiAzICogYUExO1xufVxuXG4vLyBSZXR1cm5zIHgodCkgZ2l2ZW4gdCwgeDEsIGFuZCB4Miwgb3IgeSh0KSBnaXZlbiB0LCB5MSwgYW5kIHkyXG5mdW5jdGlvbiBjYWxjQmV6aWVyKGFULCBhQTEsIGFBMikge1xuICAgIHJldHVybiAoKEEoYUExLCBhQTIpICogYVQgKyBCKGFBMSwgYUEyKSkgKiBhVCArIEMoYUExKSkgKiBhVDtcbn1cblxuLy8gUmV0dXJucyBkeC9kdCBnaXZlbiB0LCB4MSwgYW5kIHgyLCBvciBkeS9kdCBnaXZlbiB0LCB5MSwgYW5kIHkyXG5mdW5jdGlvbiBnZXRTbG9wZShhVCwgYUExLCBhQTIpIHtcbiAgICByZXR1cm4gMyAqIEEoYUExLCBhQTIpICogYVQgKiBhVCArIDIgKiBCKGFBMSwgYUEyKSAqIGFUICsgQyhhQTEpO1xufVxuXG5mdW5jdGlvbiBiaW5hcnlTdWJkaXZpZGUoYVgsIGFBLCBhQiwgbVgxLCBtWDIpIHtcbiAgICBsZXQgY3VycmVudFg7XG4gICAgbGV0IGN1cnJlbnRUO1xuICAgIGxldCBpID0gMDtcblxuICAgIGRvIHtcbiAgICAgICAgY3VycmVudFQgPSBhQSArIChhQiAtIGFBKSAvIDI7XG4gICAgICAgIGN1cnJlbnRYID0gY2FsY0JlemllcihjdXJyZW50VCwgbVgxLCBtWDIpIC0gYVg7XG5cbiAgICAgICAgaWYgKGN1cnJlbnRYID4gMCkge1xuICAgICAgICAgICAgYUIgPSBjdXJyZW50VDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGFBID0gY3VycmVudFQ7XG4gICAgICAgIH1cbiAgICB9IHdoaWxlIChNYXRoLmFicyhjdXJyZW50WCkgPiBTVUJESVZJU0lPTl9QUkVDSVNJT04gJiYgKytpIDwgU1VCRElWSVNJT05fTUFYX0lURVJBVElPTlMpO1xuXG4gICAgcmV0dXJuIGN1cnJlbnRUO1xufVxuXG5mdW5jdGlvbiBuZXd0b25SYXBoc29uSXRlcmF0ZShhWCwgYUd1ZXNzVCwgbVgxLCBtWDIpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IE5FV1RPTl9JVEVSQVRJT05TOyBpKyspIHtcbiAgICAgICAgY29uc3QgY3VycmVudFNsb3BlID0gZ2V0U2xvcGUoYUd1ZXNzVCwgbVgxLCBtWDIpO1xuXG4gICAgICAgIGlmIChjdXJyZW50U2xvcGUgPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybiBhR3Vlc3NUO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgY3VycmVudFggPSBjYWxjQmV6aWVyKGFHdWVzc1QsIG1YMSwgbVgyKSAtIGFYO1xuICAgICAgICBhR3Vlc3NUIC09IGN1cnJlbnRYIC8gY3VycmVudFNsb3BlO1xuICAgIH1cblxuICAgIHJldHVybiBhR3Vlc3NUO1xufVxuXG5mdW5jdGlvbiBMaW5lYXJFYXNpbmcoeCkge1xuICAgIHJldHVybiB4O1xufVxuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBiZXppZXIobVgxLCBtWTEsIG1YMiwgbVkyKSB7XG4gICAgaWYgKCEoMCA8PSBtWDEgJiYgbVgxIDw9IDEgJiYgMCA8PSBtWDIgJiYgbVgyIDw9IDEpKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignQmV6aWVyIHggdmFsdWVzIG11c3QgYmUgaW4gWzAsIDFdIHJhbmdlJyk7XG4gICAgfVxuXG4gICAgaWYgKG1YMSA9PT0gbVkxICYmIG1YMiA9PT0gbVkyKSB7XG4gICAgICAgIHJldHVybiBMaW5lYXJFYXNpbmc7XG4gICAgfVxuXG4gICAgLy8gUHJlY29tcHV0ZSBzYW1wbGVzIHRhYmxlXG4gICAgY29uc3Qgc2FtcGxlVmFsdWVzID0gZmxvYXQzMkFycmF5U3VwcG9ydGVkID8gbmV3IEZsb2F0MzJBcnJheShrU3BsaW5lVGFibGVTaXplKSA6IG5ldyBBcnJheShrU3BsaW5lVGFibGVTaXplKTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGtTcGxpbmVUYWJsZVNpemU7IGkrKykge1xuICAgICAgICBzYW1wbGVWYWx1ZXNbaV0gPSBjYWxjQmV6aWVyKGkgKiBrU2FtcGxlU3RlcFNpemUsIG1YMSwgbVgyKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZXRURm9yWChhWCkge1xuICAgICAgICBsZXQgaW50ZXJ2YWxTdGFydCA9IDA7XG4gICAgICAgIGxldCBjdXJyZW50U2FtcGxlID0gMTtcbiAgICAgICAgY29uc3QgbGFzdFNhbXBsZSA9IGtTcGxpbmVUYWJsZVNpemUgLSAxO1xuXG4gICAgICAgIGZvciAoOyBjdXJyZW50U2FtcGxlICE9PSBsYXN0U2FtcGxlICYmIHNhbXBsZVZhbHVlc1tjdXJyZW50U2FtcGxlXSA8PSBhWDsgY3VycmVudFNhbXBsZSsrKSB7XG4gICAgICAgICAgICBpbnRlcnZhbFN0YXJ0ICs9IGtTYW1wbGVTdGVwU2l6ZTtcbiAgICAgICAgfVxuICAgICAgICBjdXJyZW50U2FtcGxlLS07XG5cbiAgICAgICAgLy8gSW50ZXJwb2xhdGUgdG8gcHJvdmlkZSBhbiBpbml0aWFsIGd1ZXNzIGZvciB0XG4gICAgICAgIGNvbnN0IGRpc3QgPSAoYVggLSBzYW1wbGVWYWx1ZXNbY3VycmVudFNhbXBsZV0pIC8gKHNhbXBsZVZhbHVlc1tjdXJyZW50U2FtcGxlICsgMV0gLSBzYW1wbGVWYWx1ZXNbY3VycmVudFNhbXBsZV0pO1xuICAgICAgICBjb25zdCBndWVzc0ZvclQgPSBpbnRlcnZhbFN0YXJ0ICsgZGlzdCAqIGtTYW1wbGVTdGVwU2l6ZTtcblxuICAgICAgICBjb25zdCBpbml0aWFsU2xvcGUgPSBnZXRTbG9wZShndWVzc0ZvclQsIG1YMSwgbVgyKTtcbiAgICAgICAgaWYgKGluaXRpYWxTbG9wZSA+PSBORVdUT05fTUlOX1NMT1BFKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3dG9uUmFwaHNvbkl0ZXJhdGUoYVgsIGd1ZXNzRm9yVCwgbVgxLCBtWDIpO1xuICAgICAgICB9IGVsc2UgaWYgKGluaXRpYWxTbG9wZSA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIGd1ZXNzRm9yVDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBiaW5hcnlTdWJkaXZpZGUoYVgsIGludGVydmFsU3RhcnQsIGludGVydmFsU3RhcnQgKyBrU2FtcGxlU3RlcFNpemUsIG1YMSwgbVgyKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBmdW5jdGlvbiBCZXppZXJFYXNpbmcoeCkge1xuICAgICAgICAvLyBCZWNhdXNlIEphdmFTY3JpcHQgbnVtYmVycyBhcmUgaW1wcmVjaXNlLCB3ZSBzaG91bGQgZ3VhcmFudGVlIHRoZSBleHRyZW1lcyBhcmUgcmlnaHRcbiAgICAgICAgaWYgKHggPT09IDAgfHwgeCA9PT0gMSkge1xuICAgICAgICAgICAgcmV0dXJuIHg7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gY2FsY0JlemllcihnZXRURm9yWCh4KSwgbVkxLCBtWTIpO1xuICAgIH07XG59XG4iLCIvKipcbiAqIEBhdXRob3IgcHNjaHJvZW4gLyBodHRwczovL3Vmby5haS9cbiAqXG4gKiBCYXNlZCBvbiBodHRwczovL2dpdGh1Yi5jb20vZGFucm8vZWFzaW5nLWpzXG4gKiBCYXNlZCBvbiBodHRwczovL2dpdGh1Yi5jb20vQ3JlYXRlSlMvVHdlZW5KU1xuICogQmFzZWQgb24gaHR0cHM6Ly9naXRodWIuY29tL3R3ZWVuanMvdHdlZW4uanNcbiAqIEJhc2VkIG9uIGh0dHBzOi8vZWFzaW5ncy5uZXQvXG4gKi9cblxuaW1wb3J0IEJlemllckVhc2luZyBmcm9tICcuL0JlemllckVhc2luZy5qcyc7XG5cbmV4cG9ydCBjbGFzcyBFYXNpbmcge1xuICAgIHN0YXRpYyBsaW5lYXIodCkge1xuICAgICAgICByZXR1cm4gdDtcbiAgICB9XG5cbiAgICBzdGF0aWMgZWFzZUluUXVhZCh0KSB7XG4gICAgICAgIHJldHVybiB0ICogdDtcbiAgICB9XG5cbiAgICBzdGF0aWMgZWFzZU91dFF1YWQodCkge1xuICAgICAgICByZXR1cm4gdCAqICgyIC0gdCk7XG4gICAgfVxuXG4gICAgc3RhdGljIGVhc2VJbk91dFF1YWQodCkge1xuICAgICAgICBpZiAoKHQgKj0gMikgPCAxKSB7XG4gICAgICAgICAgICByZXR1cm4gMC41ICogdCAqIHQ7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gLTAuNSAqICgtLXQgKiAodCAtIDIpIC0gMSk7XG4gICAgfVxuXG4gICAgc3RhdGljIGVhc2VJbkN1YmljKHQpIHtcbiAgICAgICAgcmV0dXJuIHQgKiB0ICogdDtcbiAgICB9XG5cbiAgICBzdGF0aWMgZWFzZU91dEN1YmljKHQpIHtcbiAgICAgICAgcmV0dXJuIC0tdCAqIHQgKiB0ICsgMTtcbiAgICB9XG5cbiAgICBzdGF0aWMgZWFzZUluT3V0Q3ViaWModCkge1xuICAgICAgICBpZiAoKHQgKj0gMikgPCAxKSB7XG4gICAgICAgICAgICByZXR1cm4gMC41ICogdCAqIHQgKiB0O1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIDAuNSAqICgodCAtPSAyKSAqIHQgKiB0ICsgMik7XG4gICAgfVxuXG4gICAgc3RhdGljIGVhc2VJblF1YXJ0KHQpIHtcbiAgICAgICAgcmV0dXJuIHQgKiB0ICogdCAqIHQ7XG4gICAgfVxuXG4gICAgc3RhdGljIGVhc2VPdXRRdWFydCh0KSB7XG4gICAgICAgIHJldHVybiAxIC0gLS10ICogdCAqIHQgKiB0O1xuICAgIH1cblxuICAgIHN0YXRpYyBlYXNlSW5PdXRRdWFydCh0KSB7XG4gICAgICAgIGlmICgodCAqPSAyKSA8IDEpIHtcbiAgICAgICAgICAgIHJldHVybiAwLjUgKiB0ICogdCAqIHQgKiB0O1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIC0wLjUgKiAoKHQgLT0gMikgKiB0ICogdCAqIHQgLSAyKTtcbiAgICB9XG5cbiAgICBzdGF0aWMgZWFzZUluUXVpbnQodCkge1xuICAgICAgICByZXR1cm4gdCAqIHQgKiB0ICogdCAqIHQ7XG4gICAgfVxuXG4gICAgc3RhdGljIGVhc2VPdXRRdWludCh0KSB7XG4gICAgICAgIHJldHVybiAtLXQgKiB0ICogdCAqIHQgKiB0ICsgMTtcbiAgICB9XG5cbiAgICBzdGF0aWMgZWFzZUluT3V0UXVpbnQodCkge1xuICAgICAgICBpZiAoKHQgKj0gMikgPCAxKSB7XG4gICAgICAgICAgICByZXR1cm4gMC41ICogdCAqIHQgKiB0ICogdCAqIHQ7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gMC41ICogKCh0IC09IDIpICogdCAqIHQgKiB0ICogdCArIDIpO1xuICAgIH1cblxuICAgIHN0YXRpYyBlYXNlSW5TaW5lKHQpIHtcbiAgICAgICAgcmV0dXJuIDEgLSBNYXRoLnNpbigoKDEgLSB0KSAqIE1hdGguUEkpIC8gMik7XG4gICAgfVxuXG4gICAgc3RhdGljIGVhc2VPdXRTaW5lKHQpIHtcbiAgICAgICAgcmV0dXJuIE1hdGguc2luKCh0ICogTWF0aC5QSSkgLyAyKTtcbiAgICB9XG5cbiAgICBzdGF0aWMgZWFzZUluT3V0U2luZSh0KSB7XG4gICAgICAgIHJldHVybiAwLjUgKiAoMSAtIE1hdGguc2luKE1hdGguUEkgKiAoMC41IC0gdCkpKTtcbiAgICB9XG5cbiAgICBzdGF0aWMgZWFzZUluRXhwbyh0KSB7XG4gICAgICAgIHJldHVybiB0ID09PSAwID8gMCA6IE1hdGgucG93KDEwMjQsIHQgLSAxKTtcbiAgICB9XG5cbiAgICBzdGF0aWMgZWFzZU91dEV4cG8odCkge1xuICAgICAgICByZXR1cm4gdCA9PT0gMSA/IDEgOiAxIC0gTWF0aC5wb3coMiwgLTEwICogdCk7XG4gICAgfVxuXG4gICAgc3RhdGljIGVhc2VJbk91dEV4cG8odCkge1xuICAgICAgICBpZiAodCA9PT0gMCB8fCB0ID09PSAxKSB7XG4gICAgICAgICAgICByZXR1cm4gdDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICgodCAqPSAyKSA8IDEpIHtcbiAgICAgICAgICAgIHJldHVybiAwLjUgKiBNYXRoLnBvdygxMDI0LCB0IC0gMSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gMC41ICogKC1NYXRoLnBvdygyLCAtMTAgKiAodCAtIDEpKSArIDIpO1xuICAgIH1cblxuICAgIHN0YXRpYyBlYXNlSW5DaXJjKHQpIHtcbiAgICAgICAgcmV0dXJuIDEgLSBNYXRoLnNxcnQoMSAtIHQgKiB0KTtcbiAgICB9XG5cbiAgICBzdGF0aWMgZWFzZU91dENpcmModCkge1xuICAgICAgICByZXR1cm4gTWF0aC5zcXJ0KDEgLSAtLXQgKiB0KTtcbiAgICB9XG5cbiAgICBzdGF0aWMgZWFzZUluT3V0Q2lyYyh0KSB7XG4gICAgICAgIGlmICgodCAqPSAyKSA8IDEpIHtcbiAgICAgICAgICAgIHJldHVybiAtMC41ICogKE1hdGguc3FydCgxIC0gdCAqIHQpIC0gMSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gMC41ICogKE1hdGguc3FydCgxIC0gKHQgLT0gMikgKiB0KSArIDEpO1xuICAgIH1cblxuICAgIHN0YXRpYyBlYXNlSW5CYWNrKHQpIHtcbiAgICAgICAgY29uc3QgcyA9IDEuNzAxNTg7XG5cbiAgICAgICAgcmV0dXJuIHQgPT09IDEgPyAxIDogdCAqIHQgKiAoKHMgKyAxKSAqIHQgLSBzKTtcbiAgICB9XG5cbiAgICBzdGF0aWMgZWFzZU91dEJhY2sodCkge1xuICAgICAgICBjb25zdCBzID0gMS43MDE1ODtcblxuICAgICAgICByZXR1cm4gdCA9PT0gMCA/IDAgOiAtLXQgKiB0ICogKChzICsgMSkgKiB0ICsgcykgKyAxO1xuICAgIH1cblxuICAgIHN0YXRpYyBlYXNlSW5PdXRCYWNrKHQpIHtcbiAgICAgICAgY29uc3QgcyA9IDEuNzAxNTggKiAxLjUyNTtcblxuICAgICAgICBpZiAoKHQgKj0gMikgPCAxKSB7XG4gICAgICAgICAgICByZXR1cm4gMC41ICogKHQgKiB0ICogKChzICsgMSkgKiB0IC0gcykpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIDAuNSAqICgodCAtPSAyKSAqIHQgKiAoKHMgKyAxKSAqIHQgKyBzKSArIDIpO1xuICAgIH1cblxuICAgIHN0YXRpYyBlYXNlSW5FbGFzdGljKHQsIGFtcGxpdHVkZSA9IDEsIHBlcmlvZCA9IDAuMykge1xuICAgICAgICBpZiAodCA9PT0gMCB8fCB0ID09PSAxKSB7XG4gICAgICAgICAgICByZXR1cm4gdDtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHBpMiA9IE1hdGguUEkgKiAyO1xuICAgICAgICBjb25zdCBzID0gcGVyaW9kIC8gcGkyICogTWF0aC5hc2luKDEgLyBhbXBsaXR1ZGUpO1xuXG4gICAgICAgIHJldHVybiAtKGFtcGxpdHVkZSAqIE1hdGgucG93KDIsIDEwICogLS10KSAqIE1hdGguc2luKCh0IC0gcykgKiBwaTIgLyBwZXJpb2QpKTtcbiAgICB9XG5cbiAgICBzdGF0aWMgZWFzZU91dEVsYXN0aWModCwgYW1wbGl0dWRlID0gMSwgcGVyaW9kID0gMC4zKSB7XG4gICAgICAgIGlmICh0ID09PSAwIHx8IHQgPT09IDEpIHtcbiAgICAgICAgICAgIHJldHVybiB0O1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgcGkyID0gTWF0aC5QSSAqIDI7XG4gICAgICAgIGNvbnN0IHMgPSBwZXJpb2QgLyBwaTIgKiBNYXRoLmFzaW4oMSAvIGFtcGxpdHVkZSk7XG5cbiAgICAgICAgcmV0dXJuIGFtcGxpdHVkZSAqIE1hdGgucG93KDIsIC0xMCAqIHQpICogTWF0aC5zaW4oKHQgLSBzKSAqIHBpMiAvIHBlcmlvZCkgKyAxO1xuICAgIH1cblxuICAgIHN0YXRpYyBlYXNlSW5PdXRFbGFzdGljKHQsIGFtcGxpdHVkZSA9IDEsIHBlcmlvZCA9IDAuMyAqIDEuNSkge1xuICAgICAgICBpZiAodCA9PT0gMCB8fCB0ID09PSAxKSB7XG4gICAgICAgICAgICByZXR1cm4gdDtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHBpMiA9IE1hdGguUEkgKiAyO1xuICAgICAgICBjb25zdCBzID0gcGVyaW9kIC8gcGkyICogTWF0aC5hc2luKDEgLyBhbXBsaXR1ZGUpO1xuXG4gICAgICAgIGlmICgodCAqPSAyKSA8IDEpIHtcbiAgICAgICAgICAgIHJldHVybiAtMC41ICogKGFtcGxpdHVkZSAqIE1hdGgucG93KDIsIDEwICogLS10KSAqIE1hdGguc2luKCh0IC0gcykgKiBwaTIgLyBwZXJpb2QpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBhbXBsaXR1ZGUgKiBNYXRoLnBvdygyLCAtMTAgKiAtLXQpICogTWF0aC5zaW4oKHQgLSBzKSAqIHBpMiAvIHBlcmlvZCkgKiAwLjUgKyAxO1xuICAgIH1cblxuICAgIHN0YXRpYyBlYXNlSW5Cb3VuY2UodCkge1xuICAgICAgICByZXR1cm4gMSAtIHRoaXMuZWFzZU91dEJvdW5jZSgxIC0gdCk7XG4gICAgfVxuXG4gICAgc3RhdGljIGVhc2VPdXRCb3VuY2UodCkge1xuICAgICAgICBjb25zdCBuMSA9IDcuNTYyNTtcbiAgICAgICAgY29uc3QgZDEgPSAyLjc1O1xuXG4gICAgICAgIGlmICh0IDwgMSAvIGQxKSB7XG4gICAgICAgICAgICByZXR1cm4gbjEgKiB0ICogdDtcbiAgICAgICAgfSBlbHNlIGlmICh0IDwgMiAvIGQxKSB7XG4gICAgICAgICAgICByZXR1cm4gbjEgKiAodCAtPSAxLjUgLyBkMSkgKiB0ICsgMC43NTtcbiAgICAgICAgfSBlbHNlIGlmICh0IDwgMi41IC8gZDEpIHtcbiAgICAgICAgICAgIHJldHVybiBuMSAqICh0IC09IDIuMjUgLyBkMSkgKiB0ICsgMC45Mzc1O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIG4xICogKHQgLT0gMi42MjUgLyBkMSkgKiB0ICsgMC45ODQzNzU7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBzdGF0aWMgZWFzZUluT3V0Qm91bmNlKHQpIHtcbiAgICAgICAgaWYgKHQgPCAwLjUpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmVhc2VJbkJvdW5jZSh0ICogMikgKiAwLjU7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcy5lYXNlT3V0Qm91bmNlKHQgKiAyIC0gMSkgKiAwLjUgKyAwLjU7XG4gICAgfVxuXG4gICAgc3RhdGljIGFkZEJlemllcihuYW1lLCBtWDEsIG1ZMSwgbVgyLCBtWTIpIHtcbiAgICAgICAgdGhpc1tuYW1lXSA9IEJlemllckVhc2luZyhtWDEsIG1ZMSwgbVgyLCBtWTIpO1xuICAgIH1cbn1cbiIsIi8qKlxuICogQGF1dGhvciBwc2Nocm9lbiAvIGh0dHBzOi8vdWZvLmFpL1xuICovXG5cbnZhciBSZXF1ZXN0RnJhbWU7XG52YXIgQ2FuY2VsRnJhbWU7XG5cbmlmICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJykge1xuICAgIFJlcXVlc3RGcmFtZSA9IHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWU7XG4gICAgQ2FuY2VsRnJhbWUgPSB3aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWU7XG59IGVsc2Uge1xuICAgIGNvbnN0IHN0YXJ0VGltZSA9IHBlcmZvcm1hbmNlLm5vdygpO1xuICAgIGNvbnN0IHRpbWVzdGVwID0gMTAwMCAvIDYwO1xuXG4gICAgUmVxdWVzdEZyYW1lID0gY2FsbGJhY2sgPT4ge1xuICAgICAgICByZXR1cm4gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICBjYWxsYmFjayhwZXJmb3JtYW5jZS5ub3coKSAtIHN0YXJ0VGltZSk7XG4gICAgICAgIH0sIHRpbWVzdGVwKTtcbiAgICB9O1xuXG4gICAgQ2FuY2VsRnJhbWUgPSBjbGVhclRpbWVvdXQ7XG59XG5cbmV4cG9ydCBjbGFzcyBUaWNrZXIge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLmNhbGxiYWNrcyA9IFtdO1xuICAgICAgICB0aGlzLmxhc3QgPSBwZXJmb3JtYW5jZS5ub3coKTtcbiAgICAgICAgdGhpcy50aW1lID0gMDtcbiAgICAgICAgdGhpcy5kZWx0YSA9IDA7XG4gICAgICAgIHRoaXMuZnJhbWUgPSAwO1xuICAgICAgICB0aGlzLmlzQW5pbWF0aW5nID0gZmFsc2U7XG4gICAgfVxuXG4gICAgb25UaWNrID0gdGltZSA9PiB7XG4gICAgICAgIGlmICh0aGlzLmlzQW5pbWF0aW5nKSB7XG4gICAgICAgICAgICB0aGlzLnJlcXVlc3RJZCA9IFJlcXVlc3RGcmFtZSh0aGlzLm9uVGljayk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmRlbHRhID0gTWF0aC5taW4oMTUwLCB0aW1lIC0gdGhpcy5sYXN0KTtcbiAgICAgICAgdGhpcy5sYXN0ID0gdGltZTtcbiAgICAgICAgdGhpcy50aW1lID0gdGltZSAqIDAuMDAxO1xuICAgICAgICB0aGlzLmZyYW1lKys7XG5cbiAgICAgICAgZm9yIChsZXQgaSA9IHRoaXMuY2FsbGJhY2tzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgICAgICBjb25zdCBjYWxsYmFjayA9IHRoaXMuY2FsbGJhY2tzW2ldO1xuXG4gICAgICAgICAgICBpZiAoIWNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChjYWxsYmFjay5mcHMpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBkZWx0YSA9IHRpbWUgLSBjYWxsYmFjay5sYXN0O1xuXG4gICAgICAgICAgICAgICAgaWYgKGRlbHRhIDwgMTAwMCAvIGNhbGxiYWNrLmZwcykge1xuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBjYWxsYmFjay5sYXN0ID0gdGltZTtcbiAgICAgICAgICAgICAgICBjYWxsYmFjay5mcmFtZSsrO1xuXG4gICAgICAgICAgICAgICAgY2FsbGJhY2sodGhpcy50aW1lLCBkZWx0YSwgY2FsbGJhY2suZnJhbWUpO1xuXG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNhbGxiYWNrKHRoaXMudGltZSwgdGhpcy5kZWx0YSwgdGhpcy5mcmFtZSk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgYWRkKGNhbGxiYWNrLCBmcHMpIHtcbiAgICAgICAgaWYgKGZwcykge1xuICAgICAgICAgICAgY2FsbGJhY2suZnBzID0gZnBzO1xuICAgICAgICAgICAgY2FsbGJhY2subGFzdCA9IHBlcmZvcm1hbmNlLm5vdygpO1xuICAgICAgICAgICAgY2FsbGJhY2suZnJhbWUgPSAwO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5jYWxsYmFja3MudW5zaGlmdChjYWxsYmFjayk7XG4gICAgfVxuXG4gICAgcmVtb3ZlKGNhbGxiYWNrKSB7XG4gICAgICAgIGNvbnN0IGluZGV4ID0gdGhpcy5jYWxsYmFja3MuaW5kZXhPZihjYWxsYmFjayk7XG5cbiAgICAgICAgaWYgKH5pbmRleCkge1xuICAgICAgICAgICAgdGhpcy5jYWxsYmFja3Muc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHN0YXJ0KCkge1xuICAgICAgICBpZiAodGhpcy5pc0FuaW1hdGluZykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5pc0FuaW1hdGluZyA9IHRydWU7XG5cbiAgICAgICAgdGhpcy5yZXF1ZXN0SWQgPSBSZXF1ZXN0RnJhbWUodGhpcy5vblRpY2spO1xuICAgIH1cblxuICAgIHN0b3AoKSB7XG4gICAgICAgIGlmICghdGhpcy5pc0FuaW1hdGluZykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5pc0FuaW1hdGluZyA9IGZhbHNlO1xuXG4gICAgICAgIENhbmNlbEZyYW1lKHRoaXMucmVxdWVzdElkKTtcbiAgICB9XG5cbiAgICBzZXRSZXF1ZXN0RnJhbWUocmVxdWVzdCkge1xuICAgICAgICBSZXF1ZXN0RnJhbWUgPSByZXF1ZXN0O1xuICAgIH1cblxuICAgIHNldENhbmNlbEZyYW1lKGNhbmNlbCkge1xuICAgICAgICBDYW5jZWxGcmFtZSA9IGNhbmNlbDtcbiAgICB9XG59XG5cbmV4cG9ydCBjb25zdCB0aWNrZXIgPSBuZXcgVGlja2VyKCk7XG4iLCIvKipcbiAqIEBhdXRob3IgcHNjaHJvZW4gLyBodHRwczovL3Vmby5haS9cbiAqL1xuXG5pbXBvcnQgeyBFYXNpbmcgfSBmcm9tICcuL0Vhc2luZy5qcyc7XG5cbmltcG9ydCB7IHRpY2tlciB9IGZyb20gJy4vVGlja2VyLmpzJztcblxuY29uc3QgVHdlZW5zID0gW107XG5cbmV4cG9ydCBjbGFzcyBUd2VlbiB7XG4gICAgY29uc3RydWN0b3Iob2JqZWN0LCBwcm9wcywgZHVyYXRpb24sIGVhc2UsIGRlbGF5ID0gMCwgY29tcGxldGUsIHVwZGF0ZSkge1xuICAgICAgICBpZiAodHlwZW9mIGRlbGF5ICE9PSAnbnVtYmVyJykge1xuICAgICAgICAgICAgdXBkYXRlID0gY29tcGxldGU7XG4gICAgICAgICAgICBjb21wbGV0ZSA9IGRlbGF5O1xuICAgICAgICAgICAgZGVsYXkgPSAwO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5vYmplY3QgPSBvYmplY3Q7XG4gICAgICAgIHRoaXMuZHVyYXRpb24gPSBkdXJhdGlvbjtcbiAgICAgICAgdGhpcy5lbGFwc2VkID0gMDtcbiAgICAgICAgdGhpcy5lYXNlID0gdHlwZW9mIGVhc2UgPT09ICdmdW5jdGlvbicgPyBlYXNlIDogRWFzaW5nW2Vhc2VdIHx8IEVhc2luZ1snZWFzZU91dEN1YmljJ107XG4gICAgICAgIHRoaXMuZGVsYXkgPSBkZWxheTtcbiAgICAgICAgdGhpcy5jb21wbGV0ZSA9IGNvbXBsZXRlO1xuICAgICAgICB0aGlzLnVwZGF0ZSA9IHVwZGF0ZTtcbiAgICAgICAgdGhpcy5pc0FuaW1hdGluZyA9IGZhbHNlO1xuXG4gICAgICAgIHRoaXMuZnJvbSA9IHt9O1xuICAgICAgICB0aGlzLnRvID0gT2JqZWN0LmFzc2lnbih7fSwgcHJvcHMpO1xuXG4gICAgICAgIHRoaXMuc3ByaW5nID0gdGhpcy50by5zcHJpbmc7XG4gICAgICAgIHRoaXMuZGFtcGluZyA9IHRoaXMudG8uZGFtcGluZztcblxuICAgICAgICBkZWxldGUgdGhpcy50by5zcHJpbmc7XG4gICAgICAgIGRlbGV0ZSB0aGlzLnRvLmRhbXBpbmc7XG5cbiAgICAgICAgZm9yIChjb25zdCBwcm9wIGluIHRoaXMudG8pIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgdGhpcy50b1twcm9wXSA9PT0gJ251bWJlcicgJiYgdHlwZW9mIG9iamVjdFtwcm9wXSA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmZyb21bcHJvcF0gPSBvYmplY3RbcHJvcF07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnN0YXJ0KCk7XG4gICAgfVxuXG4gICAgb25VcGRhdGUgPSAodGltZSwgZGVsdGEpID0+IHtcbiAgICAgICAgdGhpcy5lbGFwc2VkICs9IGRlbHRhO1xuXG4gICAgICAgIGNvbnN0IHByb2dyZXNzID0gTWF0aC5tYXgoMCwgTWF0aC5taW4oMSwgKHRoaXMuZWxhcHNlZCAtIHRoaXMuZGVsYXkpIC8gdGhpcy5kdXJhdGlvbikpO1xuICAgICAgICBjb25zdCBhbHBoYSA9IHRoaXMuZWFzZShwcm9ncmVzcywgdGhpcy5zcHJpbmcsIHRoaXMuZGFtcGluZyk7XG5cbiAgICAgICAgZm9yIChjb25zdCBwcm9wIGluIHRoaXMuZnJvbSkge1xuICAgICAgICAgICAgdGhpcy5vYmplY3RbcHJvcF0gPSB0aGlzLmZyb21bcHJvcF0gKyAodGhpcy50b1twcm9wXSAtIHRoaXMuZnJvbVtwcm9wXSkgKiBhbHBoYTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLnVwZGF0ZSkge1xuICAgICAgICAgICAgdGhpcy51cGRhdGUoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChwcm9ncmVzcyA9PT0gMSkge1xuICAgICAgICAgICAgY2xlYXJUd2Vlbih0aGlzKTtcblxuICAgICAgICAgICAgaWYgKHRoaXMuY29tcGxldGUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNvbXBsZXRlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgc3RhcnQoKSB7XG4gICAgICAgIGlmICh0aGlzLmlzQW5pbWF0aW5nKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmlzQW5pbWF0aW5nID0gdHJ1ZTtcblxuICAgICAgICB0aWNrZXIuYWRkKHRoaXMub25VcGRhdGUpO1xuICAgIH1cblxuICAgIHN0b3AoKSB7XG4gICAgICAgIGlmICghdGhpcy5pc0FuaW1hdGluZykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5pc0FuaW1hdGluZyA9IGZhbHNlO1xuXG4gICAgICAgIHRpY2tlci5yZW1vdmUodGhpcy5vblVwZGF0ZSk7XG4gICAgfVxufVxuXG4vKipcbiAqIERlZmVycyBhIGZ1bmN0aW9uIGJ5IHRoZSBzcGVjaWZpZWQgZHVyYXRpb24uXG4gKlxuICogQGV4cG9ydFxuICogQHBhcmFtIHtudW1iZXJ9IGR1cmF0aW9uIFRpbWUgdG8gd2FpdCBpbiBtaWxsaXNlY29uZHMuXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBjb21wbGV0ZSBDYWxsYmFjayBmdW5jdGlvbi5cbiAqIEByZXR1cm5zIHtUd2Vlbn1cbiAqIEBleGFtcGxlXG4gKiBkZWxheWVkQ2FsbCg1MDAsIGFuaW1hdGVJbik7XG4gKiBAZXhhbXBsZVxuICogZGVsYXllZENhbGwoNTAwLCAoKSA9PiBhbmltYXRlSW4oZGVsYXkpKTtcbiAqIEBleGFtcGxlXG4gKiB0aW1lb3V0ID0gZGVsYXllZENhbGwoNTAwLCAoKSA9PiBhbmltYXRlSW4oZGVsYXkpKTtcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRlbGF5ZWRDYWxsKGR1cmF0aW9uLCBjb21wbGV0ZSkge1xuICAgIGNvbnN0IHR3ZWVuID0gbmV3IFR3ZWVuKGNvbXBsZXRlLCBudWxsLCBkdXJhdGlvbiwgJ2xpbmVhcicsIDAsIGNvbXBsZXRlKTtcblxuICAgIFR3ZWVucy5wdXNoKHR3ZWVuKTtcblxuICAgIHJldHVybiB0d2Vlbjtcbn1cblxuLyoqXG4gKiBEZWZlcnMgYnkgdGhlIHNwZWNpZmllZCBkdXJhdGlvbi5cbiAqXG4gKiBAZXhwb3J0XG4gKiBAcGFyYW0ge251bWJlcn0gW2R1cmF0aW9uPTBdIFRpbWUgdG8gd2FpdCBpbiBtaWxsaXNlY29uZHMuXG4gKiBAcmV0dXJucyB7UHJvbWlzZX1cbiAqIEBleGFtcGxlXG4gKiBhd2FpdCB3YWl0KDI1MCk7XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB3YWl0KGR1cmF0aW9uID0gMCkge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZShyZXNvbHZlID0+IGRlbGF5ZWRDYWxsKGR1cmF0aW9uLCByZXNvbHZlKSk7XG59XG5cbi8qKlxuICogRGVmZXJzIHRvIHRoZSBuZXh0IHRpY2suXG4gKlxuICogQGV4cG9ydFxuICogQHBhcmFtIHtmdW5jdGlvbn0gW2NvbXBsZXRlXSBDYWxsYmFjayBmdW5jdGlvbi5cbiAqIEByZXR1cm5zIHtQcm9taXNlfVxuICogQGV4YW1wbGVcbiAqIGRlZmVyKHJlc2l6ZSk7XG4gKiBAZXhhbXBsZVxuICogZGVmZXIoKCkgPT4gcmVzaXplKCkpO1xuICogQGV4YW1wbGVcbiAqIGF3YWl0IGRlZmVyKCk7XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkZWZlcihjb21wbGV0ZSkge1xuICAgIGNvbnN0IHByb21pc2UgPSBuZXcgUHJvbWlzZShyZXNvbHZlID0+IGRlbGF5ZWRDYWxsKDAsIHJlc29sdmUpKTtcblxuICAgIGlmIChjb21wbGV0ZSkge1xuICAgICAgICBwcm9taXNlLnRoZW4oY29tcGxldGUpO1xuICAgIH1cblxuICAgIHJldHVybiBwcm9taXNlO1xufVxuXG4vKipcbiAqIFR3ZWVuIHRoYXQgYW5pbWF0ZXMgdG8gdGhlIHNwZWNpZmllZCBkZXN0aW5hdGlvbiBwcm9wZXJ0aWVzLlxuICpcbiAqIFNlZSB0aGUgRWFzaW5nIEZ1bmN0aW9ucyBDaGVhdCBTaGVldCBmb3IgZXhhbXBsZXMgYnkgbmFtZS5cbiAqIGh0dHBzOi8vZWFzaW5ncy5uZXQvXG4gKlxuICogQGV4cG9ydFxuICogQHBhcmFtIHtvYmplY3R9IG9iamVjdCBUYXJnZXQgb2JqZWN0LlxuICogQHBhcmFtIHtvYmplY3R9IHByb3BzIFR3ZWVuIHByb3BlcnRpZXMuXG4gKiBAcGFyYW0ge251bWJlcn0gZHVyYXRpb24gVGltZSBpbiBtaWxsaXNlY29uZHMuXG4gKiBAcGFyYW0ge3N0cmluZ3xmdW5jdGlvbn0gZWFzZSBFYXNlIHN0cmluZyBvciBmdW5jdGlvbi5cbiAqIEBwYXJhbSB7bnVtYmVyfSBbZGVsYXk9MF0gVGltZSB0byB3YWl0IGluIG1pbGxpc2Vjb25kcy5cbiAqIEBwYXJhbSB7ZnVuY3Rpb259IFtjb21wbGV0ZV0gQ2FsbGJhY2sgZnVuY3Rpb24gd2hlbiB0aGUgYW5pbWF0aW9uIGhhcyBjb21wbGV0ZWQuXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBbdXBkYXRlXSBDYWxsYmFjayBmdW5jdGlvbiBldmVyeSB0aW1lIHRoZSBhbmltYXRpb24gdXBkYXRlcy5cbiAqIEByZXR1cm5zIHtQcm9taXNlfVxuICogQGV4YW1wbGVcbiAqIHR3ZWVuKGRhdGEsIHsgdmFsdWU6IDAuMyB9LCAxMDAwLCAnbGluZWFyJyk7XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0d2VlbihvYmplY3QsIHByb3BzLCBkdXJhdGlvbiwgZWFzZSwgZGVsYXkgPSAwLCBjb21wbGV0ZSwgdXBkYXRlKSB7XG4gICAgaWYgKHR5cGVvZiBkZWxheSAhPT0gJ251bWJlcicpIHtcbiAgICAgICAgdXBkYXRlID0gY29tcGxldGU7XG4gICAgICAgIGNvbXBsZXRlID0gZGVsYXk7XG4gICAgICAgIGRlbGF5ID0gMDtcbiAgICB9XG5cbiAgICBjb25zdCBwcm9taXNlID0gbmV3IFByb21pc2UocmVzb2x2ZSA9PiB7XG4gICAgICAgIGNvbnN0IHR3ZWVuID0gbmV3IFR3ZWVuKG9iamVjdCwgcHJvcHMsIGR1cmF0aW9uLCBlYXNlLCBkZWxheSwgcmVzb2x2ZSwgdXBkYXRlKTtcblxuICAgICAgICBUd2VlbnMucHVzaCh0d2Vlbik7XG4gICAgfSk7XG5cbiAgICBpZiAoY29tcGxldGUpIHtcbiAgICAgICAgcHJvbWlzZS50aGVuKGNvbXBsZXRlKTtcbiAgICB9XG5cbiAgICByZXR1cm4gcHJvbWlzZTtcbn1cblxuLyoqXG4gKiBJbW1lZGlhdGVseSBjbGVhcnMgYWxsIGRlbGF5ZWRDYWxscyBhbmQgdHdlZW5zIG9mIHRoZSBzcGVjaWZpZWQgb2JqZWN0LlxuICpcbiAqIEBleHBvcnRcbiAqIEBwYXJhbSB7b2JqZWN0fSBvYmplY3QgVGFyZ2V0IG9iamVjdC5cbiAqIEByZXR1cm5zIHt2b2lkfVxuICogQGV4YW1wbGVcbiAqIGRlbGF5ZWRDYWxsKDUwMCwgYW5pbWF0ZUluKTtcbiAqIGNsZWFyVHdlZW4oYW5pbWF0ZUluKTtcbiAqIEBleGFtcGxlXG4gKiBjbGVhclR3ZWVuKHRpbWVvdXQpO1xuICogdGltZW91dCA9IGRlbGF5ZWRDYWxsKDUwMCwgKCkgPT4gYW5pbWF0ZUluKCkpO1xuICogQGV4YW1wbGVcbiAqIHR3ZWVuKGRhdGEsIHsgdmFsdWU6IDAuMyB9LCAxMDAwLCAnbGluZWFyJyk7XG4gKiBjbGVhclR3ZWVuKGRhdGEpO1xuICovXG5leHBvcnQgZnVuY3Rpb24gY2xlYXJUd2VlbihvYmplY3QpIHtcbiAgICBpZiAob2JqZWN0IGluc3RhbmNlb2YgVHdlZW4pIHtcbiAgICAgICAgb2JqZWN0LnN0b3AoKTtcblxuICAgICAgICBjb25zdCBpbmRleCA9IFR3ZWVucy5pbmRleE9mKG9iamVjdCk7XG5cbiAgICAgICAgaWYgKH5pbmRleCkge1xuICAgICAgICAgICAgVHdlZW5zLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgICBmb3IgKGxldCBpID0gVHdlZW5zLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgICAgICBpZiAoVHdlZW5zW2ldLm9iamVjdCA9PT0gb2JqZWN0KSB7XG4gICAgICAgICAgICAgICAgY2xlYXJUd2VlbihUd2VlbnNbaV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufVxuIiwiLyoqXG4gKiBAYXV0aG9yIHBzY2hyb2VuIC8gaHR0cHM6Ly91Zm8uYWkvXG4gKi9cblxuaW1wb3J0IHsgQXNzZXRzIH0gZnJvbSAnLi4vbG9hZGVycy9Bc3NldHMuanMnO1xuaW1wb3J0IHsgRXZlbnRFbWl0dGVyIH0gZnJvbSAnLi9FdmVudEVtaXR0ZXIuanMnO1xuXG5pbXBvcnQgeyBjbGVhclR3ZWVuLCBkZWxheWVkQ2FsbCwgdHdlZW4gfSBmcm9tICcuLi90d2Vlbi9Ud2Vlbi5qcyc7XG5cbi8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0NTUy90cmFuc2Zvcm1cbi8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0NTUy9maWx0ZXJcbmNvbnN0IFRyYW5zZm9ybXMgPSBbJ3gnLCAneScsICd6JywgJ3NrZXdYJywgJ3NrZXdZJywgJ3JvdGF0aW9uJywgJ3JvdGF0aW9uWCcsICdyb3RhdGlvblknLCAncm90YXRpb25aJywgJ3NjYWxlJywgJ3NjYWxlWCcsICdzY2FsZVknLCAnc2NhbGVaJ107XG5jb25zdCBGaWx0ZXJzID0gWydibHVyJywgJ2JyaWdodG5lc3MnLCAnY29udHJhc3QnLCAnZ3JheXNjYWxlJywgJ2h1ZScsICdpbnZlcnQnLCAnc2F0dXJhdGUnLCAnc2VwaWEnXTtcbmNvbnN0IE51bWVyaWMgPSBbJ29wYWNpdHknLCAnekluZGV4JywgJ2ZvbnRXZWlnaHQnLCAnc3Ryb2tlV2lkdGgnLCAnc3Ryb2tlRGFzaG9mZnNldCcsICdzdG9wT3BhY2l0eSddO1xuY29uc3QgTGFjdW5hMSA9IFsnb3BhY2l0eScsICdicmlnaHRuZXNzJywgJ2NvbnRyYXN0JywgJ3NhdHVyYXRlJywgJ3NjYWxlJywgJ3N0b3BPcGFjaXR5J107XG5cbmV4cG9ydCBjbGFzcyBJbnRlcmZhY2Uge1xuICAgIGNvbnN0cnVjdG9yKG5hbWUsIHR5cGUgPSAnZGl2JywgcXVhbGlmaWVkTmFtZSkge1xuICAgICAgICB0aGlzLmV2ZW50cyA9IG5ldyBFdmVudEVtaXR0ZXIoKTtcbiAgICAgICAgdGhpcy5jaGlsZHJlbiA9IFtdO1xuICAgICAgICB0aGlzLnRpbWVvdXRzID0gW107XG4gICAgICAgIHRoaXMuc3R5bGUgPSB7fTtcbiAgICAgICAgdGhpcy5pc1RyYW5zZm9ybSA9IGZhbHNlO1xuICAgICAgICB0aGlzLmlzRmlsdGVyID0gZmFsc2U7XG5cbiAgICAgICAgaWYgKHR5cGVvZiBuYW1lID09PSAnb2JqZWN0JyAmJiBuYW1lICE9PSBudWxsKSB7XG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQgPSBuYW1lO1xuICAgICAgICB9IGVsc2UgaWYgKHR5cGUgIT09IG51bGwpIHtcbiAgICAgICAgICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gICAgICAgICAgICB0aGlzLnR5cGUgPSB0eXBlO1xuXG4gICAgICAgICAgICBpZiAodHlwZSA9PT0gJ3N2ZycpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMoJ2h0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnJywgcXVhbGlmaWVkTmFtZSB8fCAnc3ZnJyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQodHlwZSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0eXBlb2YgbmFtZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICBpZiAobmFtZS5zdGFydHNXaXRoKCcuJykpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5lbGVtZW50LmNsYXNzTmFtZSA9IG5hbWUuc2xpY2UoMSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5lbGVtZW50LmlkID0gbmFtZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBhZGQoY2hpbGQpIHtcbiAgICAgICAgaWYgKCF0aGlzLmNoaWxkcmVuKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmNoaWxkcmVuLnB1c2goY2hpbGQpO1xuXG4gICAgICAgIGNoaWxkLnBhcmVudCA9IHRoaXM7XG5cbiAgICAgICAgaWYgKGNoaWxkLmVsZW1lbnQpIHtcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5hcHBlbmRDaGlsZChjaGlsZC5lbGVtZW50KTtcbiAgICAgICAgfSBlbHNlIGlmIChjaGlsZC5ub2RlTmFtZSkge1xuICAgICAgICAgICAgdGhpcy5lbGVtZW50LmFwcGVuZENoaWxkKGNoaWxkKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBjaGlsZDtcbiAgICB9XG5cbiAgICByZW1vdmUoY2hpbGQpIHtcbiAgICAgICAgaWYgKCF0aGlzLmNoaWxkcmVuKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoY2hpbGQuZWxlbWVudCkge1xuICAgICAgICAgICAgY2hpbGQuZWxlbWVudC5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKGNoaWxkLmVsZW1lbnQpO1xuICAgICAgICB9IGVsc2UgaWYgKGNoaWxkLm5vZGVOYW1lKSB7XG4gICAgICAgICAgICBjaGlsZC5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKGNoaWxkKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGluZGV4ID0gdGhpcy5jaGlsZHJlbi5pbmRleE9mKGNoaWxkKTtcblxuICAgICAgICBpZiAofmluZGV4KSB7XG4gICAgICAgICAgICB0aGlzLmNoaWxkcmVuLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBjbG9uZSgpIHtcbiAgICAgICAgaWYgKCF0aGlzLmVsZW1lbnQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBuZXcgSW50ZXJmYWNlKHRoaXMuZWxlbWVudC5jbG9uZU5vZGUodHJ1ZSkpO1xuICAgIH1cblxuICAgIGVtcHR5KCkge1xuICAgICAgICBpZiAoIXRoaXMuZWxlbWVudCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgZm9yIChsZXQgaSA9IHRoaXMuY2hpbGRyZW4ubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgICAgIGlmICh0aGlzLmNoaWxkcmVuW2ldICYmIHRoaXMuY2hpbGRyZW5baV0uZGVzdHJveSkge1xuICAgICAgICAgICAgICAgIHRoaXMuY2hpbGRyZW5baV0uZGVzdHJveSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5jaGlsZHJlbi5sZW5ndGggPSAwO1xuXG4gICAgICAgIHRoaXMuZWxlbWVudC5pbm5lckhUTUwgPSAnJztcblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBhdHRyKHByb3BzKSB7XG4gICAgICAgIGlmICghdGhpcy5lbGVtZW50KSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBmb3IgKGNvbnN0IGtleSBpbiBwcm9wcykge1xuICAgICAgICAgICAgdGhpcy5lbGVtZW50LnNldEF0dHJpYnV0ZShrZXksIHByb3BzW2tleV0pO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgY3NzKHByb3BzKSB7XG4gICAgICAgIGlmICghdGhpcy5lbGVtZW50KSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBzdHlsZSA9IHRoaXMuc3R5bGU7XG5cbiAgICAgICAgZm9yIChjb25zdCBrZXkgaW4gcHJvcHMpIHtcbiAgICAgICAgICAgIGlmICh+VHJhbnNmb3Jtcy5pbmRleE9mKGtleSkpIHtcbiAgICAgICAgICAgICAgICBzdHlsZVtrZXldID0gcHJvcHNba2V5XTtcbiAgICAgICAgICAgICAgICB0aGlzLmlzVHJhbnNmb3JtID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKH5GaWx0ZXJzLmluZGV4T2Yoa2V5KSkge1xuICAgICAgICAgICAgICAgIHN0eWxlW2tleV0gPSBwcm9wc1trZXldO1xuICAgICAgICAgICAgICAgIHRoaXMuaXNGaWx0ZXIgPSB0cnVlO1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBsZXQgdmFsO1xuXG4gICAgICAgICAgICBpZiAofk51bWVyaWMuaW5kZXhPZihrZXkpKSB7XG4gICAgICAgICAgICAgICAgdmFsID0gcHJvcHNba2V5XTtcbiAgICAgICAgICAgICAgICBzdHlsZVtrZXldID0gdmFsO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB2YWwgPSB0eXBlb2YgcHJvcHNba2V5XSAhPT0gJ3N0cmluZycgPyBwcm9wc1trZXldICsgJ3B4JyA6IHByb3BzW2tleV07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5zdHlsZVtrZXldID0gdmFsO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuaXNUcmFuc2Zvcm0pIHtcbiAgICAgICAgICAgIGxldCB0cmFuc2Zvcm0gPSAnJztcblxuICAgICAgICAgICAgaWYgKHR5cGVvZiBzdHlsZS54ICE9PSAndW5kZWZpbmVkJyB8fCB0eXBlb2Ygc3R5bGUueSAhPT0gJ3VuZGVmaW5lZCcgfHwgdHlwZW9mIHN0eWxlLnogIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgeCA9IHR5cGVvZiBzdHlsZS54ICE9PSAndW5kZWZpbmVkJyA/IHN0eWxlLnggOiAwO1xuICAgICAgICAgICAgICAgIGNvbnN0IHkgPSB0eXBlb2Ygc3R5bGUueSAhPT0gJ3VuZGVmaW5lZCcgPyBzdHlsZS55IDogMDtcbiAgICAgICAgICAgICAgICBjb25zdCB6ID0gdHlwZW9mIHN0eWxlLnogIT09ICd1bmRlZmluZWQnID8gc3R5bGUueiA6IDA7XG5cbiAgICAgICAgICAgICAgICB0cmFuc2Zvcm0gKz0gYHRyYW5zbGF0ZTNkKCR7eH1weCwgJHt5fXB4LCAke3p9cHgpYDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHR5cGVvZiBzdHlsZS5za2V3WCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICB0cmFuc2Zvcm0gKz0gYHNrZXdYKCR7c3R5bGUuc2tld1h9ZGVnKWA7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0eXBlb2Ygc3R5bGUuc2tld1kgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgdHJhbnNmb3JtICs9IGBza2V3WSgke3N0eWxlLnNrZXdZfWRlZylgO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodHlwZW9mIHN0eWxlLnJvdGF0aW9uICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgIHRyYW5zZm9ybSArPSBgcm90YXRlKCR7c3R5bGUucm90YXRpb259ZGVnKWA7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0eXBlb2Ygc3R5bGUucm90YXRpb25YICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgIHRyYW5zZm9ybSArPSBgcm90YXRlWCgke3N0eWxlLnJvdGF0aW9uWH1kZWcpYDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHR5cGVvZiBzdHlsZS5yb3RhdGlvblkgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgdHJhbnNmb3JtICs9IGByb3RhdGVZKCR7c3R5bGUucm90YXRpb25ZfWRlZylgO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodHlwZW9mIHN0eWxlLnJvdGF0aW9uWiAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICB0cmFuc2Zvcm0gKz0gYHJvdGF0ZVooJHtzdHlsZS5yb3RhdGlvblp9ZGVnKWA7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0eXBlb2Ygc3R5bGUuc2NhbGUgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgdHJhbnNmb3JtICs9IGBzY2FsZSgke3N0eWxlLnNjYWxlfSlgO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodHlwZW9mIHN0eWxlLnNjYWxlWCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICB0cmFuc2Zvcm0gKz0gYHNjYWxlWCgke3N0eWxlLnNjYWxlWH0pYDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHR5cGVvZiBzdHlsZS5zY2FsZVkgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgdHJhbnNmb3JtICs9IGBzY2FsZVkoJHtzdHlsZS5zY2FsZVl9KWA7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0eXBlb2Ygc3R5bGUuc2NhbGVaICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgIHRyYW5zZm9ybSArPSBgc2NhbGVaKCR7c3R5bGUuc2NhbGVafSlgO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQuc3R5bGUudHJhbnNmb3JtID0gdHJhbnNmb3JtO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuaXNGaWx0ZXIpIHtcbiAgICAgICAgICAgIGxldCBmaWx0ZXIgPSAnJztcblxuICAgICAgICAgICAgaWYgKHR5cGVvZiBzdHlsZS5ibHVyICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgIGZpbHRlciArPSBgYmx1cigke3N0eWxlLmJsdXJ9cHgpYDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHR5cGVvZiBzdHlsZS5icmlnaHRuZXNzICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgIGZpbHRlciArPSBgYnJpZ2h0bmVzcygke3N0eWxlLmJyaWdodG5lc3N9KWA7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0eXBlb2Ygc3R5bGUuY29udHJhc3QgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgZmlsdGVyICs9IGBjb250cmFzdCgke3N0eWxlLmNvbnRyYXN0fSlgO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodHlwZW9mIHN0eWxlLmdyYXlzY2FsZSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICBmaWx0ZXIgKz0gYGdyYXlzY2FsZSgke3N0eWxlLmdyYXlzY2FsZX0pYDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHR5cGVvZiBzdHlsZS5odWUgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgZmlsdGVyICs9IGBodWUtcm90YXRlKCR7c3R5bGUuaHVlfWRlZylgO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodHlwZW9mIHN0eWxlLmludmVydCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICBmaWx0ZXIgKz0gYGludmVydCgke3N0eWxlLmludmVydH0pYDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHR5cGVvZiBzdHlsZS5zYXR1cmF0ZSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICBmaWx0ZXIgKz0gYHNhdHVyYXRlKCR7c3R5bGUuc2F0dXJhdGV9KWA7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0eXBlb2Ygc3R5bGUuc2VwaWEgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgZmlsdGVyICs9IGBzZXBpYSgke3N0eWxlLnNlcGlhfSlgO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQuc3R5bGUuZmlsdGVyID0gZmlsdGVyO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgdHdlZW4ocHJvcHMsIGR1cmF0aW9uLCBlYXNlLCBkZWxheSA9IDAsIGNvbXBsZXRlLCB1cGRhdGUpIHtcbiAgICAgICAgaWYgKCF0aGlzLmVsZW1lbnQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0eXBlb2YgZGVsYXkgIT09ICdudW1iZXInKSB7XG4gICAgICAgICAgICB1cGRhdGUgPSBjb21wbGV0ZTtcbiAgICAgICAgICAgIGNvbXBsZXRlID0gZGVsYXk7XG4gICAgICAgICAgICBkZWxheSA9IDA7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBzdHlsZSA9IGdldENvbXB1dGVkU3R5bGUodGhpcy5lbGVtZW50KTtcblxuICAgICAgICBmb3IgKGNvbnN0IGtleSBpbiBwcm9wcykge1xuICAgICAgICAgICAgbGV0IHZhbDtcblxuICAgICAgICAgICAgaWYgKHR5cGVvZiB0aGlzLnN0eWxlW2tleV0gIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgdmFsID0gdGhpcy5zdHlsZVtrZXldO1xuICAgICAgICAgICAgfSBlbHNlIGlmICh+VHJhbnNmb3Jtcy5pbmRleE9mKGtleSkgfHwgfkZpbHRlcnMuaW5kZXhPZihrZXkpIHx8IH5OdW1lcmljLmluZGV4T2Yoa2V5KSkge1xuICAgICAgICAgICAgICAgIHZhbCA9IH5MYWN1bmExLmluZGV4T2Yoa2V5KSA/IDEgOiAwO1xuICAgICAgICAgICAgfSBlbHNlIGlmICh0eXBlb2Ygc3R5bGVba2V5XSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICB2YWwgPSBwYXJzZUZsb2F0KHN0eWxlW2tleV0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoIWlzTmFOKHZhbCkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnN0eWxlW2tleV0gPSB2YWw7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBwcm9taXNlID0gdHdlZW4odGhpcy5zdHlsZSwgcHJvcHMsIGR1cmF0aW9uLCBlYXNlLCBkZWxheSwgY29tcGxldGUsICgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuY3NzKHRoaXMuc3R5bGUpO1xuXG4gICAgICAgICAgICBpZiAodXBkYXRlKSB7XG4gICAgICAgICAgICAgICAgdXBkYXRlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiBwcm9taXNlO1xuICAgIH1cblxuICAgIGNsZWFyVHdlZW4oKSB7XG4gICAgICAgIGNsZWFyVHdlZW4odGhpcy5zdHlsZSk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgZGVsYXllZENhbGwoZHVyYXRpb24sIGNvbXBsZXRlKSB7XG4gICAgICAgIGlmICghdGhpcy50aW1lb3V0cykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgdGltZW91dCA9IGRlbGF5ZWRDYWxsKGR1cmF0aW9uLCAoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLmNsZWFyVGltZW91dCh0aW1lb3V0LCB0cnVlKTtcblxuICAgICAgICAgICAgaWYgKGNvbXBsZXRlKSB7XG4gICAgICAgICAgICAgICAgY29tcGxldGUoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy50aW1lb3V0cy5wdXNoKHRpbWVvdXQpO1xuXG4gICAgICAgIHJldHVybiB0aW1lb3V0O1xuICAgIH1cblxuICAgIGNsZWFyVGltZW91dCh0aW1lb3V0LCBpc1N0b3BwZWQpIHtcbiAgICAgICAgaWYgKCF0aGlzLnRpbWVvdXRzKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIWlzU3RvcHBlZCkge1xuICAgICAgICAgICAgY2xlYXJUd2Vlbih0aW1lb3V0KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGluZGV4ID0gdGhpcy50aW1lb3V0cy5pbmRleE9mKHRpbWVvdXQpO1xuXG4gICAgICAgIGlmICh+aW5kZXgpIHtcbiAgICAgICAgICAgIHRoaXMudGltZW91dHMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGNsZWFyVGltZW91dHMoKSB7XG4gICAgICAgIGlmICghdGhpcy50aW1lb3V0cykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgZm9yIChsZXQgaSA9IHRoaXMudGltZW91dHMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgICAgIHRoaXMuY2xlYXJUaW1lb3V0KHRoaXMudGltZW91dHNbaV0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgdGV4dChzdHIpIHtcbiAgICAgICAgaWYgKCF0aGlzLmVsZW1lbnQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0eXBlb2Ygc3RyID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZWxlbWVudC50ZXh0Q29udGVudDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC50ZXh0Q29udGVudCA9IHN0cjtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIGh0bWwoc3RyKSB7XG4gICAgICAgIGlmICghdGhpcy5lbGVtZW50KSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodHlwZW9mIHN0ciA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmVsZW1lbnQuaW5uZXJIVE1MO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5lbGVtZW50LmlubmVySFRNTCA9IHN0cjtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIGhpZGUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNzcyh7IGRpc3BsYXk6ICdub25lJyB9KTtcbiAgICB9XG5cbiAgICBzaG93KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jc3MoeyBkaXNwbGF5OiAnJyB9KTtcbiAgICB9XG5cbiAgICBpbnZpc2libGUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNzcyh7IHZpc2liaWxpdHk6ICdoaWRkZW4nIH0pO1xuICAgIH1cblxuICAgIHZpc2libGUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNzcyh7IHZpc2liaWxpdHk6ICcnIH0pO1xuICAgIH1cblxuICAgIGJnKHBhdGgsIGJhY2tncm91bmRTaXplID0gJ2NvbnRhaW4nLCBiYWNrZ3JvdW5kUG9zaXRpb24gPSAnY2VudGVyJywgYmFja2dyb3VuZFJlcGVhdCA9ICduby1yZXBlYXQnKSB7XG4gICAgICAgIGNvbnN0IHN0eWxlID0ge1xuICAgICAgICAgICAgYmFja2dyb3VuZEltYWdlOiBgdXJsKCR7QXNzZXRzLmdldFBhdGgocGF0aCl9KWAsXG4gICAgICAgICAgICBiYWNrZ3JvdW5kU2l6ZSxcbiAgICAgICAgICAgIGJhY2tncm91bmRQb3NpdGlvbixcbiAgICAgICAgICAgIGJhY2tncm91bmRSZXBlYXRcbiAgICAgICAgfTtcblxuICAgICAgICByZXR1cm4gdGhpcy5jc3Moc3R5bGUpO1xuICAgIH1cblxuICAgIGxpbmUocHJvZ3Jlc3MgPSB0aGlzLnByb2dyZXNzIHx8IDApIHtcbiAgICAgICAgY29uc3Qgc3RhcnQgPSB0aGlzLnN0YXJ0IHx8IDA7XG4gICAgICAgIGNvbnN0IG9mZnNldCA9IHRoaXMub2Zmc2V0IHx8IDA7XG5cbiAgICAgICAgY29uc3QgbGVuZ3RoID0gdGhpcy5lbGVtZW50LmdldFRvdGFsTGVuZ3RoKCk7XG4gICAgICAgIGNvbnN0IGRhc2ggPSBsZW5ndGggKiBwcm9ncmVzcztcbiAgICAgICAgY29uc3QgZ2FwID0gbGVuZ3RoIC0gZGFzaDtcblxuICAgICAgICBjb25zdCBzdHlsZSA9IHtcbiAgICAgICAgICAgIHN0cm9rZURhc2hhcnJheTogYCR7ZGFzaH0sJHtnYXB9YCxcbiAgICAgICAgICAgIHN0cm9rZURhc2hvZmZzZXQ6IC1sZW5ndGggKiAoc3RhcnQgKyBvZmZzZXQpXG4gICAgICAgIH07XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuY3NzKHN0eWxlKTtcbiAgICB9XG5cbiAgICBsb2FkKHBhdGgpIHtcbiAgICAgICAgY29uc3QgcHJvbWlzZSA9IGZldGNoKEFzc2V0cy5nZXRQYXRoKHBhdGgpLCBBc3NldHMub3B0aW9ucykudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gcmVzcG9uc2UudGV4dCgpO1xuICAgICAgICB9KS50aGVuKHN0ciA9PiB7XG4gICAgICAgICAgICB0aGlzLmh0bWwoc3RyKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIHByb21pc2U7XG4gICAgfVxuXG4gICAgZGVzdHJveSgpIHtcbiAgICAgICAgaWYgKCF0aGlzLmNoaWxkcmVuKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5wYXJlbnQgJiYgdGhpcy5wYXJlbnQucmVtb3ZlKSB7XG4gICAgICAgICAgICB0aGlzLnBhcmVudC5yZW1vdmUodGhpcyk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmNsZWFyVGltZW91dHMoKTtcbiAgICAgICAgdGhpcy5jbGVhclR3ZWVuKCk7XG5cbiAgICAgICAgdGhpcy5ldmVudHMuZGVzdHJveSgpO1xuXG4gICAgICAgIGZvciAobGV0IGkgPSB0aGlzLmNoaWxkcmVuLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5jaGlsZHJlbltpXSAmJiB0aGlzLmNoaWxkcmVuW2ldLmRlc3Ryb3kpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNoaWxkcmVuW2ldLmRlc3Ryb3koKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuZWxlbWVudC5vYmplY3QgPSBudWxsO1xuXG4gICAgICAgIGZvciAoY29uc3QgcHJvcCBpbiB0aGlzKSB7XG4gICAgICAgICAgICB0aGlzW3Byb3BdID0gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbn1cbiIsIi8qKlxuICogQGF1dGhvciBwc2Nocm9lbiAvIGh0dHBzOi8vdWZvLmFpL1xuICovXG5cbmltcG9ydCB7IEV2ZW50cyB9IGZyb20gJy4uL2NvbmZpZy9FdmVudHMuanMnO1xuaW1wb3J0IHsgSW50ZXJmYWNlIH0gZnJvbSAnLi9JbnRlcmZhY2UuanMnO1xuXG5pbXBvcnQgeyB0aWNrZXIgfSBmcm9tICcuLi90d2Vlbi9UaWNrZXIuanMnO1xuXG5leHBvcnQgdmFyIFN0YWdlO1xuXG5pZiAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBTdGFnZSA9IG5ldyBJbnRlcmZhY2UobnVsbCwgbnVsbCk7XG5cbiAgICBmdW5jdGlvbiBhZGRMaXN0ZW5lcnMoKSB7XG4gICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdwb3BzdGF0ZScsIG9uUG9wU3RhdGUpO1xuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIG9uS2V5RG93bik7XG4gICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdrZXl1cCcsIG9uS2V5VXApO1xuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigna2V5cHJlc3MnLCBvbktleVByZXNzKTtcbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsIG9uUmVzaXplKTtcbiAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigndmlzaWJpbGl0eWNoYW5nZScsIG9uVmlzaWJpbGl0eSk7XG5cbiAgICAgICAgdGlja2VyLnN0YXJ0KCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRXZlbnQgaGFuZGxlcnNcbiAgICAgKi9cblxuICAgIGZ1bmN0aW9uIG9uUG9wU3RhdGUoZSkge1xuICAgICAgICBTdGFnZS5wYXRoID0gbG9jYXRpb24ucGF0aG5hbWU7XG5cbiAgICAgICAgU3RhZ2UuZXZlbnRzLmVtaXQoRXZlbnRzLlNUQVRFX0NIQU5HRSwgZSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gb25LZXlEb3duKGUpIHtcbiAgICAgICAgU3RhZ2UuZXZlbnRzLmVtaXQoRXZlbnRzLktFWV9ET1dOLCBlKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBvbktleVVwKGUpIHtcbiAgICAgICAgU3RhZ2UuZXZlbnRzLmVtaXQoRXZlbnRzLktFWV9VUCwgZSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gb25LZXlQcmVzcyhlKSB7XG4gICAgICAgIFN0YWdlLmV2ZW50cy5lbWl0KEV2ZW50cy5LRVlfUFJFU1MsIGUpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIG9uUmVzaXplKGUpIHtcbiAgICAgICAgU3RhZ2Uud2lkdGggPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xpZW50V2lkdGg7XG4gICAgICAgIFN0YWdlLmhlaWdodCA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGllbnRIZWlnaHQ7XG4gICAgICAgIFN0YWdlLmRwciA9IHdpbmRvdy5kZXZpY2VQaXhlbFJhdGlvO1xuICAgICAgICBTdGFnZS5hc3BlY3QgPSBTdGFnZS53aWR0aCAvIFN0YWdlLmhlaWdodDtcblxuICAgICAgICBTdGFnZS5ldmVudHMuZW1pdChFdmVudHMuUkVTSVpFLCBlKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBvblZpc2liaWxpdHkoZSkge1xuICAgICAgICBTdGFnZS5ldmVudHMuZW1pdChFdmVudHMuVklTSUJJTElUWSwgZSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUHVibGljIG1ldGhvZHNcbiAgICAgKi9cblxuICAgIFN0YWdlLmluaXQgPSBlbGVtZW50ID0+IHtcbiAgICAgICAgU3RhZ2UuZWxlbWVudCA9IGVsZW1lbnQ7XG5cbiAgICAgICAgYWRkTGlzdGVuZXJzKCk7XG4gICAgICAgIG9uUG9wU3RhdGUoKTtcbiAgICAgICAgb25SZXNpemUoKTtcbiAgICB9O1xuXG4gICAgU3RhZ2Uuc2V0UGF0aCA9IHBhdGggPT4ge1xuICAgICAgICBpZiAocGF0aCA9PT0gbG9jYXRpb24ucGF0aG5hbWUpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGhpc3RvcnkucHVzaFN0YXRlKG51bGwsIG51bGwsIHBhdGgpO1xuXG4gICAgICAgIG9uUG9wU3RhdGUoKTtcbiAgICB9O1xuXG4gICAgU3RhZ2Uuc2V0VGl0bGUgPSB0aXRsZSA9PiB7XG4gICAgICAgIGRvY3VtZW50LnRpdGxlID0gdGl0bGU7XG4gICAgfTtcblxuICAgIFN0YWdlLnNldENvbnRlbnQgPWNvbnRlbnQgPT57XG4gICAgICAgIGRvY3VtZW50LnRleHRDb250ZW50ID0gY29udGVudFxuICAgIH1cbiB9XG4iLCJpbXBvcnQgeyBFdmVudHMgfSBmcm9tICcuLi9jb25maWcvRXZlbnRzLmpzJztcbmltcG9ydCB7IEludGVyZmFjZSB9IGZyb20gJy4uL3V0aWxzL0ludGVyZmFjZS5qcyc7XG5pbXBvcnQgeyBTdGFnZSB9IGZyb20gJy4uL3V0aWxzL1N0YWdlLmpzJztcblxuaW1wb3J0IHsgdGlja2VyIH0gZnJvbSAnLi4vdHdlZW4vVGlja2VyLmpzJztcbmltcG9ydCB7IGNsZWFyVHdlZW4sIHR3ZWVuIH0gZnJvbSAnLi4vdHdlZW4vVHdlZW4uanMnO1xuaW1wb3J0IHsgZGVnVG9SYWQgfSBmcm9tICcuLi91dGlscy9VdGlscy5qcyc7XG5cbmV4cG9ydCBjbGFzcyBQcm9ncmVzc0NhbnZhcyBleHRlbmRzIEludGVyZmFjZSB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHN1cGVyKG51bGwsICdjYW52YXMnKTtcblxuICAgICAgICBjb25zdCBzaXplID0gMzI7XG5cbiAgICAgICAgdGhpcy53aWR0aCA9IHNpemU7XG4gICAgICAgIHRoaXMuaGVpZ2h0ID0gc2l6ZTtcbiAgICAgICAgdGhpcy54ID0gc2l6ZSAvIDI7XG4gICAgICAgIHRoaXMueSA9IHNpemUgLyAyO1xuICAgICAgICB0aGlzLnJhZGl1cyA9IHNpemUgKiAwLjQ7XG4gICAgICAgIHRoaXMuc3RhcnRBbmdsZSA9IGRlZ1RvUmFkKC05MCk7XG4gICAgICAgIHRoaXMucHJvZ3Jlc3MgPSAwO1xuICAgICAgICB0aGlzLm5lZWRzVXBkYXRlID0gZmFsc2U7XG5cbiAgICAgICAgdGhpcy5pbml0Q2FudmFzKCk7XG4gICAgfVxuXG4gICAgaW5pdENhbnZhcygpIHtcbiAgICAgICAgdGhpcy5jb250ZXh0ID0gdGhpcy5lbGVtZW50LmdldENvbnRleHQoJzJkJyk7XG4gICAgfVxuXG4gICAgYWRkTGlzdGVuZXJzKCkge1xuICAgICAgICB0aWNrZXIuYWRkKHRoaXMub25VcGRhdGUpO1xuICAgIH1cblxuICAgIHJlbW92ZUxpc3RlbmVycygpIHtcbiAgICAgICAgdGlja2VyLnJlbW92ZSh0aGlzLm9uVXBkYXRlKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBFdmVudCBoYW5kbGVyc1xuICAgICAqL1xuXG4gICAgb25VcGRhdGUgPSAoKSA9PiB7XG4gICAgICAgIGlmICh0aGlzLm5lZWRzVXBkYXRlKSB7XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZSgpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIG9uUHJvZ3Jlc3MgPSAoeyBwcm9ncmVzcyB9KSA9PiB7XG4gICAgICAgIGNsZWFyVHdlZW4odGhpcyk7XG5cbiAgICAgICAgdGhpcy5uZWVkc1VwZGF0ZSA9IHRydWU7XG5cbiAgICAgICAgdHdlZW4odGhpcywgeyBwcm9ncmVzcyB9LCA1MDAsICdlYXNlT3V0Q3ViaWMnLCAoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLm5lZWRzVXBkYXRlID0gZmFsc2U7XG5cbiAgICAgICAgICAgIGlmICh0aGlzLnByb2dyZXNzID49IDEpIHtcbiAgICAgICAgICAgICAgICB0aGlzLm9uQ29tcGxldGUoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIG9uQ29tcGxldGUgPSAoKSA9PiB7XG4gICAgICAgIHRoaXMucmVtb3ZlTGlzdGVuZXJzKCk7XG5cbiAgICAgICAgdGhpcy5ldmVudHMuZW1pdChFdmVudHMuQ09NUExFVEUpO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBQdWJsaWMgbWV0aG9kc1xuICAgICAqL1xuXG4gICAgcmVzaXplID0gKCkgPT4ge1xuICAgICAgICBjb25zdCBkcHIgPSAyO1xuXG4gICAgICAgIHRoaXMuZWxlbWVudC53aWR0aCA9IE1hdGgucm91bmQodGhpcy53aWR0aCAqIGRwcik7XG4gICAgICAgIHRoaXMuZWxlbWVudC5oZWlnaHQgPSBNYXRoLnJvdW5kKHRoaXMuaGVpZ2h0ICogZHByKTtcbiAgICAgICAgdGhpcy5lbGVtZW50LnN0eWxlLndpZHRoID0gdGhpcy53aWR0aCArICdweCc7XG4gICAgICAgIHRoaXMuZWxlbWVudC5zdHlsZS5oZWlnaHQgPSB0aGlzLmhlaWdodCArICdweCc7XG4gICAgICAgIHRoaXMuY29udGV4dC5zY2FsZShkcHIsIGRwcik7XG5cbiAgICAgICAgdGhpcy5jb250ZXh0LmxpbmVXaWR0aCA9IDEuNTtcbiAgICAgICAgdGhpcy5jb250ZXh0LnN0cm9rZVN0eWxlID0gU3RhZ2Uucm9vdFN0eWxlLmdldFByb3BlcnR5VmFsdWUoJy0tdWktY29sb3InKS50cmltKCk7XG5cbiAgICAgICAgdGhpcy51cGRhdGUoKTtcbiAgICB9O1xuXG4gICAgdXBkYXRlID0gKCkgPT4ge1xuICAgICAgICB0aGlzLmNvbnRleHQuY2xlYXJSZWN0KDAsIDAsIHRoaXMuZWxlbWVudC53aWR0aCwgdGhpcy5lbGVtZW50LmhlaWdodCk7XG4gICAgICAgIHRoaXMuY29udGV4dC5iZWdpblBhdGgoKTtcbiAgICAgICAgdGhpcy5jb250ZXh0LmFyYyh0aGlzLngsIHRoaXMueSwgdGhpcy5yYWRpdXMsIHRoaXMuc3RhcnRBbmdsZSwgdGhpcy5zdGFydEFuZ2xlICsgZGVnVG9SYWQoMzYwICogdGhpcy5wcm9ncmVzcykpO1xuICAgICAgICB0aGlzLmNvbnRleHQuc3Ryb2tlKCk7XG4gICAgfTtcblxuICAgIGFuaW1hdGVJbiA9ICgpID0+IHtcbiAgICAgICAgdGhpcy5hZGRMaXN0ZW5lcnMoKTtcbiAgICAgICAgdGhpcy5yZXNpemUoKTtcbiAgICB9O1xuXG4gICAgYW5pbWF0ZU91dCA9ICgpID0+IHtcbiAgICAgICAgdGhpcy50d2Vlbih7IHNjYWxlOiAxLjEsIG9wYWNpdHk6IDAgfSwgNDAwLCAnZWFzZUluQ3ViaWMnKTtcbiAgICB9O1xuXG4gICAgZGVzdHJveSA9ICgpID0+IHtcbiAgICAgICAgdGhpcy5yZW1vdmVMaXN0ZW5lcnMoKTtcblxuICAgICAgICBjbGVhclR3ZWVuKHRoaXMpO1xuXG4gICAgICAgIHJldHVybiBzdXBlci5kZXN0cm95KCk7XG4gICAgfTtcbn1cbiIsImltcG9ydCB7IEV2ZW50cyB9IGZyb20gJy4uL2NvbmZpZy9FdmVudHMuanMnO1xuaW1wb3J0IHsgSW50ZXJmYWNlIH0gZnJvbSAnLi4vdXRpbHMvSW50ZXJmYWNlLmpzJztcbmltcG9ydCB7IFByb2dyZXNzQ2FudmFzIH0gZnJvbSAnLi9Qcm9ncmVzc0NhbnZhcy5qcyc7XG5cbmV4cG9ydCBjbGFzcyBQcmVsb2FkZXJWaWV3IGV4dGVuZHMgSW50ZXJmYWNlIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgc3VwZXIoJy5wcmVsb2FkZXInKTtcblxuICAgICAgICB0aGlzLmluaXRIVE1MKCk7XG4gICAgICAgIHRoaXMuaW5pdFZpZXcoKTtcblxuICAgICAgICB0aGlzLmFkZExpc3RlbmVycygpO1xuICAgIH1cblxuICAgIGluaXRIVE1MKCkge1xuICAgICAgICB0aGlzLmNzcyh7XG4gICAgICAgICAgICBwb3NpdGlvbjogJ2ZpeGVkJyxcbiAgICAgICAgICAgIGxlZnQ6IDAsXG4gICAgICAgICAgICB0b3A6IDAsXG4gICAgICAgICAgICB3aWR0aDogJzEwMCUnLFxuICAgICAgICAgICAgaGVpZ2h0OiAnMTAwJScsXG4gICAgICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6ICd2YXIoLS1iZy1jb2xvciknLFxuICAgICAgICAgICAgekluZGV4OiAxLFxuICAgICAgICAgICAgcG9pbnRlckV2ZW50czogJ25vbmUnXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGluaXRWaWV3KCkge1xuICAgICAgICB0aGlzLnZpZXcgPSBuZXcgUHJvZ3Jlc3NDYW52YXMoKTtcbiAgICAgICAgdGhpcy52aWV3LmNzcyh7XG4gICAgICAgICAgICBsZWZ0OiAnNTAlJyxcbiAgICAgICAgICAgIHRvcDogJzUwJScsXG4gICAgICAgICAgICBtYXJnaW5MZWZ0OiAtdGhpcy52aWV3LndpZHRoIC8gMixcbiAgICAgICAgICAgIG1hcmdpblRvcDogLXRoaXMudmlldy5oZWlnaHQgLyAyXG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLmFkZCh0aGlzLnZpZXcpO1xuICAgIH1cblxuICAgIGFkZExpc3RlbmVycygpIHtcbiAgICAgICAgdGhpcy52aWV3LmV2ZW50cy5vbihFdmVudHMuQ09NUExFVEUsIHRoaXMub25Db21wbGV0ZSk7XG4gICAgfVxuXG4gICAgcmVtb3ZlTGlzdGVuZXJzKCkge1xuICAgICAgICB0aGlzLnZpZXcuZXZlbnRzLm9mZihFdmVudHMuQ09NUExFVEUsIHRoaXMub25Db21wbGV0ZSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRXZlbnQgaGFuZGxlcnNcbiAgICAgKi9cblxuICAgIG9uUHJvZ3Jlc3MgPSBlID0+IHtcbiAgICAgICAgdGhpcy52aWV3Lm9uUHJvZ3Jlc3MoZSk7XG4gICAgfTtcblxuICAgIG9uQ29tcGxldGUgPSAoKSA9PiB7XG4gICAgICAgIHRoaXMuZXZlbnRzLmVtaXQoRXZlbnRzLkNPTVBMRVRFKTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogUHVibGljIG1ldGhvZHNcbiAgICAgKi9cblxuICAgIGFuaW1hdGVJbiA9ICgpID0+IHtcbiAgICAgICAgdGhpcy52aWV3LmFuaW1hdGVJbigpO1xuICAgIH07XG5cbiAgICBhbmltYXRlT3V0ID0gKCkgPT4ge1xuICAgICAgICB0aGlzLnZpZXcuYW5pbWF0ZU91dCgpO1xuICAgICAgICByZXR1cm4gdGhpcy50d2Vlbih7IG9wYWNpdHk6IDAgfSwgMjUwLCAnZWFzZU91dFNpbmUnLCA1MDApO1xuICAgIH07XG5cbiAgICBkZXN0cm95ID0gKCkgPT4ge1xuICAgICAgICB0aGlzLnJlbW92ZUxpc3RlbmVycygpO1xuXG4gICAgICAgIHJldHVybiBzdXBlci5kZXN0cm95KCk7XG4gICAgfTtcbn1cbiIsImltcG9ydCB7IENvbmZpZyB9IGZyb20gJy4uL2NvbmZpZy9Db25maWcuanMnO1xuaW1wb3J0IHsgRGV2aWNlIH0gZnJvbSAnLi4vY29uZmlnL0RldmljZS5qcyc7XG5pbXBvcnQgeyBFdmVudHMgfSBmcm9tICcuLi9jb25maWcvRXZlbnRzLmpzJztcbmltcG9ydCB7IEFzc2V0cyB9IGZyb20gJy4uL2xvYWRlcnMvQXNzZXRzLmpzJztcbmltcG9ydCB7IE11bHRpTG9hZGVyIH0gZnJvbSAnLi4vbG9hZGVycy9NdWx0aUxvYWRlci5qcyc7XG5pbXBvcnQgeyBGb250TG9hZGVyIH0gZnJvbSAnLi4vbG9hZGVycy9Gb250TG9hZGVyLmpzJztcbmltcG9ydCB7IEFzc2V0TG9hZGVyIH0gZnJvbSAnLi4vbG9hZGVycy9Bc3NldExvYWRlci5qcyc7XG5pbXBvcnQgeyBQcmVsb2FkZXJWaWV3IH0gZnJvbSAnLi4vdmlld3MvUHJlbG9hZGVyVmlldy5qcyc7XG5pbXBvcnQgeyBTdGFnZSB9IGZyb20gJy4uL3V0aWxzL1N0YWdlLmpzJztcblxuZXhwb3J0IGNsYXNzIFByZWxvYWRlciB7XG4gICAgc3RhdGljIGluaXQoKSB7XG4gICAgICAgIGlmICghRGV2aWNlLndlYmdsKSB7XG4gICAgICAgICAgICByZXR1cm4gbG9jYXRpb24uaHJlZiA9ICdmYWxsYmFjay5odG1sJztcbiAgICAgICAgfVxuXG4gICAgICAgIEFzc2V0cy5wYXRoID0gQ29uZmlnLkNETjtcbiAgICAgICAgQXNzZXRzLmNyb3NzT3JpZ2luID0gJ2Fub255bW91cyc7XG5cbiAgICAgICAgQXNzZXRzLm9wdGlvbnMgPSB7XG4gICAgICAgICAgICBtb2RlOiAnY29ycycsXG4gICAgICAgICAgICAvLyBjcmVkZW50aWFsczogJ2luY2x1ZGUnXG4gICAgICAgIH07XG5cbiAgICAgICAgQXNzZXRzLmNhY2hlID0gdHJ1ZTtcblxuICAgICAgICB0aGlzLmluaXRTdGFnZSgpO1xuICAgICAgICB0aGlzLmluaXRWaWV3KCk7XG4gICAgICAgIHRoaXMuaW5pdExvYWRlcigpO1xuXG4gICAgICAgIHRoaXMuYWRkTGlzdGVuZXJzKCk7XG4gICAgfVxuXG4gICAgc3RhdGljIGluaXRTdGFnZSgpIHtcbiAgICAgICAgU3RhZ2UuaW5pdChkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjcm9vdCcpKTtcblxuICAgICAgICBTdGFnZS5yb290ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignOnJvb3QnKTtcbiAgICAgICAgU3RhZ2Uucm9vdFN0eWxlID0gZ2V0Q29tcHV0ZWRTdHlsZShTdGFnZS5yb290KTtcbiAgICB9XG5cbiAgICBzdGF0aWMgaW5pdFZpZXcoKSB7XG4gICAgICAgIHRoaXMudmlldyA9IG5ldyBQcmVsb2FkZXJWaWV3KCk7XG4gICAgICAgIFN0YWdlLmFkZCh0aGlzLnZpZXcpO1xuICAgIH1cblxuICAgIHN0YXRpYyBhc3luYyBpbml0TG9hZGVyKCkge1xuICAgICAgICB0aGlzLnZpZXcuYW5pbWF0ZUluKCk7XG5cbiAgICAgICAgbGV0IGFzc2V0cyA9IENvbmZpZy5BU1NFVFM7XG5cbiAgICAgICAgLy8gaWYgKERldmljZS5tb2JpbGUpIHtcbiAgICAgICAgLy8gICAgIGFzc2V0cyA9IGFzc2V0cy5maWx0ZXIocGF0aCA9PiAhL2Rlc2t0b3AvLnRlc3QocGF0aCkpO1xuICAgICAgICAvLyB9IGVsc2Uge1xuICAgICAgICAvLyAgICAgYXNzZXRzID0gYXNzZXRzLmZpbHRlcihwYXRoID0+ICEvbW9iaWxlLy50ZXN0KHBhdGgpKTtcbiAgICAgICAgLy8gfVxuXG4gICAgICAgIHRoaXMubG9hZGVyID0gbmV3IE11bHRpTG9hZGVyKCk7XG4gICAgICAgIHRoaXMubG9hZGVyLmxvYWQobmV3IEZvbnRMb2FkZXIoKSk7XG4gICAgICAgIHRoaXMubG9hZGVyLmxvYWQobmV3IEFzc2V0TG9hZGVyKGFzc2V0cykpO1xuICAgICAgICB0aGlzLmxvYWRlci5hZGQoMik7XG5cbiAgICAgICAgY29uc3QgeyBBcHAgfSA9IGF3YWl0IGltcG9ydCgnLi9BcHAuanMnKTtcbiAgICAgICAgdGhpcy5sb2FkZXIudHJpZ2dlcigxKTtcblxuICAgICAgICB0aGlzLmFwcCA9IEFwcDtcblxuICAgICAgICBhd2FpdCB0aGlzLmFwcC5pbml0KHRoaXMubG9hZGVyLmxvYWRlcnNbMV0pO1xuICAgICAgICB0aGlzLmxvYWRlci50cmlnZ2VyKDEpO1xuICAgIH1cblxuICAgIHN0YXRpYyBhZGRMaXN0ZW5lcnMoKSB7XG4gICAgICAgIHRoaXMubG9hZGVyLmV2ZW50cy5vbihFdmVudHMuUFJPR1JFU1MsIHRoaXMudmlldy5vblByb2dyZXNzKTtcbiAgICAgICAgdGhpcy52aWV3LmV2ZW50cy5vbihFdmVudHMuQ09NUExFVEUsIHRoaXMub25Db21wbGV0ZSk7XG4gICAgfVxuXG4gICAgc3RhdGljIHJlbW92ZUxpc3RlbmVycygpIHtcbiAgICAgICAgdGhpcy5sb2FkZXIuZXZlbnRzLm9mZihFdmVudHMuUFJPR1JFU1MsIHRoaXMudmlldy5vblByb2dyZXNzKTtcbiAgICAgICAgdGhpcy52aWV3LmV2ZW50cy5vZmYoRXZlbnRzLkNPTVBMRVRFLCB0aGlzLm9uQ29tcGxldGUpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEV2ZW50IGhhbmRsZXJzXG4gICAgICovXG5cbiAgICBzdGF0aWMgb25Db21wbGV0ZSA9IGFzeW5jICgpID0+IHtcbiAgICAgICAgdGhpcy5yZW1vdmVMaXN0ZW5lcnMoKTtcblxuICAgICAgICB0aGlzLmxvYWRlciA9IHRoaXMubG9hZGVyLmRlc3Ryb3koKTtcblxuICAgICAgICBhd2FpdCB0aGlzLnZpZXcuYW5pbWF0ZU91dCgpO1xuICAgICAgICB0aGlzLnZpZXcgPSB0aGlzLnZpZXcuZGVzdHJveSgpO1xuXG4gICAgICAgIHRoaXMuYXBwLmFuaW1hdGVJbigpO1xuICAgIH07XG59XG4iXSwibmFtZXMiOlsiQmV6aWVyRWFzaW5nIl0sIm1hcHBpbmdzIjoiQUFBTyxNQUFNLE1BQU0sQ0FBQztBQUNwQixJQUFJLE9BQU8sSUFBSSxHQUFHLEdBQUcsQ0FBQztBQUN0QixJQUFJLE9BQU8sVUFBVSxHQUFHLElBQUksQ0FBQztBQUM3QixJQUFJLE9BQU8sS0FBSyxHQUFHLFFBQVEsQ0FBQyxNQUFNLEtBQUssUUFBUSxDQUFDO0FBQ2hEO0FBQ0EsSUFBSSxPQUFPLEdBQUcsR0FBRyxFQUFFLENBQUM7QUFDcEI7QUFDQSxJQUFJLE9BQU8sTUFBTSxHQUFHO0FBQ3BCLFFBQVEsOEJBQThCO0FBQ3RDLFFBQVEscUNBQXFDO0FBQzdDLEtBQUssQ0FBQztBQUNOOztBQ1hPLE1BQU0sTUFBTSxDQUFDO0FBQ3BCLElBQUksT0FBTyxLQUFLLEdBQUcsU0FBUyxDQUFDLFNBQVMsQ0FBQyxXQUFXLEVBQUUsQ0FBQztBQUNyRDtBQUNBLElBQUksT0FBTyxNQUFNLEdBQUcsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxjQUFjLENBQUM7QUFDL0M7QUFDQSxJQUFJLE9BQU8sTUFBTSxHQUFHLElBQUksQ0FBQyxNQUFNLElBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxN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QUFPLEdBQUcsR0FBRyxJQUFJLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxNQUFNLEVBQUUsS0FBSyxJQUFJLEdBQUcsR0FBRyxHQUFHLENBQUMsRUFBRSxFQUFFLENBQUM7QUFDL0Q7QUFDQSxDQUFDO0FBZ0NEO0FBQ0EsU0FBUyxRQUFRLEVBQUUsT0FBTyxHQUFHO0FBQzdCO0FBQ0EsQ0FBQyxPQUFPLE9BQU8sR0FBRyxPQUFPLENBQUM7QUFDMUI7QUFDQSxDQUFDO0FBQ0Q7QUFDQSxTQUFTLFFBQVEsRUFBRSxPQUFPLEdBQUc7QUFDN0I7QUFDQSxDQUFDLE9BQU8sT0FBTyxHQUFHLE9BQU8sQ0FBQztBQUMxQjtBQUNBLENBQUM7QUFDRDtBQUNBLFNBQVMsWUFBWSxFQUFFLEtBQUssR0FBRztBQUMvQjtBQUNBLENBQUMsT0FBTyxFQUFFLEtBQUssS0FBSyxLQUFLLEdBQUcsQ0FBQyxFQUFFLE9BQU8sQ0FBQyxJQUFJLEtBQUssS0FBSyxDQUFDLENBQUM7QUFDdkQ7QUFDQTs7QUMvSkE7QUFDQTtBQUNBO0FBS0E7QUFDTyxTQUFTLE9BQU8sQ0FBQyxLQUFLLEVBQUU7QUFDL0IsSUFBSSxPQUFPLEtBQUssQ0FBQyxJQUFJLENBQUMsTUFBTSxJQUFJLENBQUMsTUFBTSxFQUFFLEdBQUcsR0FBRyxDQUFDLENBQUM7QUFDakQsQ0FBQztBQVNEO0FBQ08sU0FBUyxJQUFJLEdBQUc7QUFDdkIsSUFBSSxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxHQUFHLE9BQU8sQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLEVBQUUsUUFBUSxFQUFFLENBQUM7QUFDdkQsQ0FBQztBQUNEO0FBQ08sU0FBUyxVQUFVLENBQUMsS0FBSyxFQUFFO0FBQ2xDLElBQUksT0FBTyxLQUFLLENBQUMsQ0FBQyxHQUFHLEdBQUcsR0FBRyxLQUFLLENBQUMsQ0FBQyxHQUFHLElBQUksR0FBRyxLQUFLLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQztBQUMzRCxDQUFDO0FBV0Q7QUFDTyxTQUFTLFFBQVEsQ0FBQyxJQUFJLEVBQUU7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S0FBSztBQUNMO0FBQ0EsSUFBSSxPQUFPLFdBQVcsQ0FBQyxDQUFDLEVBQUU7QUFDMUIsUUFBUSxPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDakMsS0FBSztBQUNMO0FBQ0EsSUFBSSxPQUFPLFlBQVksQ0FBQyxDQUFDLEVBQUU7QUFDM0IsUUFBUSxPQUFPLEVBQUUsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDdkMsS0FBSztBQUNMO0FBQ0EsSUFBSSxPQUFPLGNBQWMsQ0FBQyxDQUFDLEVBQUU7QUFDN0IsUUFBUSxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUU7QUFDMUIsWUFBWSxPQUFPLEdBQUcsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQzNDLFNBQVM7QUFDVDtBQUNBLFFBQVEsT0FBTyxHQUFHLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztBQUNwRCxLQUFLO0FBQ0w7QUFDQSxJQUFJLE9BQU8sVUFBVSxDQUFDLENBQUMsRUFBRTtBQUN6QixRQUFRLE9BQU8sQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksSUFBSSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztBQUNyRCxLQUFLO0FBQ0w7QUFDQSxJQUFJLE9BQU8sV0FBVyxDQUFDLENBQUMsRUFBRTtBQUMxQixRQUFRLE9BQU8sSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO0FBQzNDLEtBQUs7QUFDTDtBQUNBLElBQUksT0FBTyxhQUFhLENBQUMsQ0FBQyxFQUFFO0FBQzVCLFFB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LENBQUMsQ0FBQztBQUMxRDtBQUNBLFFBQVEsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFO0FBQzFCLFlBQVksT0FBTyxDQUFDLEdBQUcsSUFBSSxTQUFTLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksR0FBRyxHQUFHLE1BQU0sQ0FBQyxDQUFDLENBQUM7QUFDakcsU0FBUztBQUNUO0FBQ0EsUUFBUSxPQUFPLFNBQVMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEdBQUcsR0FBRyxNQUFNLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQyxDQUFDO0FBQy9GLEtBQUs7QUFDTDtBQUNBLElBQUksT0FBTyxZQUFZLENBQUMsQ0FBQyxFQUFFO0FBQzNCLFFBQVEsT0FBTyxDQUFDLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7QUFDN0MsS0FBSztBQUNMO0FBQ0EsSUFBSSxPQUFPLGFBQWEsQ0FBQyxDQUFDLEVBQUU7QUFDNUIsUUFBUSxNQUFNLEVBQUUsR0FBRyxNQUFNLENBQUM7QUFDMUIsUUFBUSxNQUFNLEVBQUUsR0FBRyxJQUFJLENBQUM7QUFDeEI7QUFDQSxRQUFRLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLEVBQUU7QUFDeEIsWUFBWSxPQUFPLEVBQUUsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQzlCLFNBQVMsTUFBTSxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxFQUFFO0FBQy9CLFlBQVksT0FBTyxFQUFFLElBQUksQ0FBQyxJQUFJLEdBQUcsR0FBRyxFQUFFLENBQUMsR0FBRyxDQUFDLEdB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
