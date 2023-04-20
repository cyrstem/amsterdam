import { Interface } from "../Interface";
import { Global } from "../../config/Global";
 import { Section } from './Section';

export class Container extends Interface {
    constructor() {
        super('.container');

        this.initHTML();
        this.initViews();
    }

    initHTML() {
        this.css({ position: 'static' });
    }

    initViews() {
        this.darkPlanet = new Section(Global.SECTIONS[0]);
        this.add(this.darkPlanet);

        this.floatingCrystal = new Section(Global.SECTIONS[1]);
        this.add(this.floatingCrystal);

        this.abstractCube = new Section(Global.SECTIONS[2]);
        this.add(this.abstractCube);

        this.abstractPlane= new Section(Global.SECTIONS[3]);
        this.add(this.abstractPlane);
    }
}