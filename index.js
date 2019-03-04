const fs = require('fs');
const variabilizeCSS = require('variabilize-css');

const variablePath = 'node_modules/bootstrap/dist/css/bootstrap.css';
const outputDir = './dist';

variabilizeCSS(variablePath, outputDir);

const Compiler = {
    components: [
        'alert',
        'accordion',
        'button',
        'dropdown',
        'collapse',
        'modal',
        'navbar',
        'carousel',
        'button-group',
        'list-group',
        'list-group-item',
        'container',
        'carousel-item',
    ],
    componentJSFiles:{
        navbar:['collapse'],
        'button-group': ['button']
    },
    componentAttributes:{
        alert: ['type', 'dismissible'],
        button: ['type'],
        'carousel-item':['active'],
    },
    componentEvents:{
        // alert: [
        //     {
        //         eventType: 'click',
        //         eventName: 'ON_CLOSE_CLICK',
        //         selector: '[data-close-button]'
        //     }
        // ]
    },
    template: `
    class {componentNameUpper} extends HTMLElement {
           connectedCallback(){
                const element = document.createElement('div');
                const style = document.createElement('style');
                const shadow = this.attachShadow({mode: 'open'});

                element.innerHTML = \`<slot/>\`;
                style.innerHTML = \`{style}\`;

                shadow.appendChild(style);
                shadow.appendChild(element);
           }
       } 
       customElements.define('bootstrap-{name}',{componentNameUpper});
    `,
    init(){
        this.convertBootstrap();
        this.createComponents();
    },
     convertBootstrap() {
         let css = fs.readFileSync(`${outputDir}/bootstrap.css`, 'utf8');
         const selectorList = [];
         let selector = '';
         let started = false;
         let openBrackets = 0;
         css = css.trim();
         let updatedCss = css;
         for (let a = 0; a < css.length; ++a) {
             let char = css.charAt(a);
             if (selector.indexOf('@') >= 0) {
                 selector += char;
                 if (char == '{') {
                     openBrackets++;

                 }
                 if (char == '}') {
                     openBrackets--;
                     if (openBrackets < 1) {
                         selector = '';
                         openBrackets = 0;
                     }
                 }
             } else {
                 if (started) {
                     selector += char;
                 }
                 if (char == '}') {
                     started = true;
                 } else if (char == '{') {
                     started = false;
                     if (isNaN(selector.trim().charAt(0)) && selector.indexOf('@media') < 0 && selector.indexOf('@') < 0 && selector.trim() != '') {
                         selectorList.push(`::slotted(${selector})`);
                         const slot = `\n::slotted(${selector})`;
                         if (selector.trim() !== '' && slot !== '\n::slotted(}') updatedCss = updatedCss.replace(selector, `\n::slotted(${selector.trim().replace('{','')}){`);
                     }
                     selector = '';
                 }
             }
         }

         updatedCss = updatedCss.replace(/\(\}\n/g, '(');
         updatedCss = updatedCss.replace(/\:\:slotted\(to\)/g, 'to');
         updatedCss = updatedCss.replace(/::slotted\(\n/g, '::slotted(');

         css = css.toString().replace(/([a-z.\:-\s,\]\[\"\=]+.)(?=\{)/gmi, '::slotted($1)');
         fs.writeFileSync('dist/bootstrap-elements.css', updatedCss, 'utf8');

         let template = this.template.replace(/{componentNameUpper}/g, 'BootstrapElement')
             .replace(/{style}/g, `@import '\${window.BOOTSTRAP_ELEMENTS_CSS_PATH ? window.BOOTSTRAP_ELEMENTS_CSS_PATH :'bootstrap-elements.css'}';`)
             .replace(/{name}/g, 'wrapper');

         fs.writeFileSync(`dist/bootstrap-wrapper.js`, template, 'utf8');
     },
     createEventListeners(component){
        let template ='';
        if(this.componentEvents[component]){
            this.componentEvents[component].forEach((item)=>{
                template += `if(this._element){
                    this.${item.eventName}_CALLBACK = () => {
                        const event = new CustomEvent('${item.eventName}', {
                            detail: ''
                        });
                        this.dispatchEvent(event);
                    };
                    this._element.addEventListener('${item.eventType}', this.${item.eventName}_CALLBACK);
                }\n`;
            });
        }
        return template;
     },
     removeListeners(component){
        let template = '';
        if (this.componentEvents[component]) {
            this.componentEvents[component].forEach((item) => {
                template += `if(this._element.querySelector('${item.selector}')){
                    this._element.querySelector('${item.selector}').removeEventListener('${item.eventType}',this.${item.eventName}_CALLBACK);
                }\n`;
            });
        }
        return template;
     },
     createComponents(){

        this.components.forEach((component)=>{
            this.writeJs(component);
        });
     },
     writeJs(component) {
          let util = '';
          let content = '';
          let html = '';
          let custom = '';
        try {
            util = fs.readFileSync(`node_modules/bootstrap/js/dist/util.js`, 'utf8');
        } catch(e) {

        }
        try {
            let collection = [component];
            if (this.componentJSFiles[component]) collection = [...this.componentJSFiles[component], component]
            collection.forEach((item)=>{
                content += '\n' + fs.readFileSync(`node_modules/bootstrap/js/dist/${item}.js`, 'utf8');
            });
        } catch (e) {

        }
        try {
            html = fs.readFileSync(`example/template/${component}.html`, 'utf8');
        } catch (e) {

        }
        try {
            custom = fs.readFileSync(`src/component/${component}/${component}.js`, 'utf8');
        } catch (e) {

        }
        

         util = util.replace('(this, function ', '(window, function ')
         util = util.replace(/document.querySelector/gim, ' _containerElement.querySelector')
         if (content) {
            content = content.replace('(this, function ', '(window, function ')
            content = content.replace(/\$\(document\).on/gim, '$(_containerElement).on')
            content = content.replace(/document.querySelector/gim, ' _containerElement.querySelector')
         }
         let className = component.replace(/\-/gim, '');
         let attributes = this.componentAttributes[component]  ? this.componentAttributes[component].map(item => `'${item}'`).toString() : '';
         let template = `class Bootstrap${className} extends HTMLElement {
                static get observedAttributes() {
                    return [${attributes}];
                }
                constructor(){
                    super();
                    this._element = null;
                    this.props ={};
                }
                connectedCallback() {
                    this._element = document.createElement('div');
                    const style = document.createElement('style');
                    const shadow = this.attachShadow({
                        mode: 'open'
                    });

                    style.innerHTML = \`@import '\${window.BOOTSTRAP_CSS_PATH ? window.BOOTSTRAP_CSS_PATH :'bootstrap.css'}';
                    
                    

                    \`;

                    shadow.appendChild(style);
                    shadow.appendChild(this._element);

                    const _containerElement = this._element;

                    this.render();
                    ${util ? util : ''}
                    ${content ? content : ''}
                    ${custom ? custom : ''}


                }
                attributeChangedCallback(name, oldValue, newValue) {
                    this.props[name] = newValue;
                    this.render();
                }
                render(){
                     ${this.removeListeners(component)}
                     this._element.innerHTML = this.getTemplate();
                      ${this.createEventListeners(component)}
                }
                getTemplate(){
                    return \`
                    ${html ? html : ''}
                    \`;
                }
            }
            customElements.define('bootstrap-${component}', Bootstrap${className});`
         fs.writeFileSync(`dist/bootstrap-${component}.js`, template, 'utf8');
     }
}.init();


