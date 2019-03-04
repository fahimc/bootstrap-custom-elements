
    class BootstrapElement extends HTMLElement {
           connectedCallback(){
                const element = document.createElement('div');
                const style = document.createElement('style');
                const shadow = this.attachShadow({mode: 'open'});

                element.innerHTML = `<slot/>`;
                style.innerHTML = `@import '${window.BOOTSTRAP_ELEMENTS_CSS_PATH ? window.BOOTSTRAP_ELEMENTS_CSS_PATH :'bootstrap-elements.css'}';`;

                shadow.appendChild(style);
                shadow.appendChild(element);
           }
       } 
       customElements.define('bootstrap-wrapper',BootstrapElement);
    