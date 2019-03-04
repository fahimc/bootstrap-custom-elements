class BootstrapAlert extends HTMLElement {
    connectedCallback() {
        const element = document.createElement('div');
        const style = document.createElement('style');
        const shadow = this.attachShadow({
            mode: 'open'
        });

        element.innerHTML = this.getTemplate();
        style.innerHTML = `@import '${window.BOOTSTRAP_CSS_PATH ? window.BOOTSTRAP_CSS_PATH :'bootstrap.css'}';`;

        shadow.appendChild(style);
        shadow.appendChild(element);
        
    }
    getTemplate(){
        return `
        <div class="alert alert-warning alert-dismissible fade show" role="alert">
        <slot></slot>
        <button type="button" class="close" data-dismiss="alert" aria-label="Close">
            <span aria-hidden="true">&times;</span>
        </button>
        </div>
         
        `;
    }
}
customElements.define('bootstrap-alert', BootstrapAlert);