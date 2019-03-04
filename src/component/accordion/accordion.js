var acc = this._element.querySelector('data-toggle="collapse"');
var i;

for (i = 0; i < acc.length; i++) {
    acc[i].addEventListener("click", (event) => {
        this.classList.toggle("active");
        var panel = this.nextElementSibling;
        if (panel.style.display === "block") {
            panel.style.display = "none";
        } else {
            panel.style.display = "block";
        }
    });
}