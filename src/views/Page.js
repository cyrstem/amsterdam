import { Global } from "../config/Global";

export class Page {
    
    constructor({ path, title, content  }){
        this.path = path;
        this.title = title;
        this.pageTitle =`${this.title} --Ascendis`;
        this.content = content
    }
}