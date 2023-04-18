export class Styles {
    static label = {
        fontFamily: 'Titillium Web, sans-serif',
        fontSize: 17,
        lineHeight: 15,
        padding:'3px',
        textTransform: 'uppercase',
        letterSpacing: '0.03em',
        backgroundColor:'#93C13E',
        color:'#ffffff',
    };
    static point= {
        fontFamily: 'Titillium Web, sans-serif',
        color:'#008EB0',
    }

    static small = {
        ...this.label,
        fontSize: 10,
        letterSpacing: 0.5
    };

    static number = {
        ...this.label,
        letterSpacing: 1
    };

    static panel = {
        ...this.label
    };
}
