/**
 * @author pschroen / https://ufo.ai/
 */

import { LinearFilter, Texture } from 'three';

import { Device } from '../../config/Device.js';
import { Thread } from '../../utils/Thread.js';
import { ImageBitmapLoaderThread } from '../ImageBitmapLoaderThread.js';
import { Assets } from '../Assets.js';
import { Loader } from '../Loader.js';

import { isPowerOfTwo } from '../../utils/Utils.js';

export class TextureLoader extends Loader {
    constructor(assets, callback) {
        super(assets, callback);

        this.defaultOptions = {
            imageOrientation: 'flipY',
            premultiplyAlpha: 'none',
            preserveData: false
        };

        this.options = this.defaultOptions;
    }

    load(path, callback) {
        const cached = Assets.get(path);

        let texture;
        let promise;

        if (cached && cached.isTexture) {
            texture = cached;

            this.increment();

            if (callback) {
                callback(texture);
            }
        } else {
            texture = new Texture();

            if (cached) {
                promise = Promise.resolve(cached);
            } else if (typeof createImageBitmap !== 'undefined' && !Device.agent.includes('firefox')) {
                const params = {
                    imageOrientation: this.options.imageOrientation,
                    premultiplyAlpha: this.options.premultiplyAlpha
                };

                if (Thread.threads) {
                    promise = ImageBitmapLoaderThread.load(Assets.getPath(path), Assets.options, params);
                } else {
                    promise = fetch(Assets.getPath(path), Assets.options).then(response => {
                        return response.blob();
                    }).then(blob => {
                        return createImageBitmap(blob, params);
                    });
                }
            } else {
                promise = Assets.loadImage(path);
            }

            promise.then(image => {
                if (image.error) {
                    throw new Error(image.error);
                }

                texture.image = image;

                if (!isPowerOfTwo(image.width) || !isPowerOfTwo(image.height)) {
                    texture.minFilter = LinearFilter;
                    texture.generateMipmaps = false;
                }

                texture.needsUpdate = true;

                texture.onUpdate = () => {
                    if (image.close && !this.options.preserveData) {
                        image.close();
                    }

                    texture.onUpdate = null;
                };

                this.increment();

                if (callback) {
                    callback(texture);
                }
            }).catch(event => {
                this.increment();

                if (callback) {
                    callback(event);
                }
            });

            Assets.add(path, texture);
        }

        this.total++;

        return texture;
    }

    setOptions(options) {
        this.options = Object.assign(this.defaultOptions, options);

        return this;
    }
}
