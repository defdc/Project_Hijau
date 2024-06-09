function showModal(modalId) {
    document.querySelectorAll('.modal').forEach(modal => modal.style.display = "none")
    var modal = document.querySelector('[data-name="' + modalId + '"]');
    modal.style.display = "flex";
    document.querySelector('[data-name="' + modalId + '"]').addEventListener("click", function (event) {
        if (event.target == this) {
            this.style.display = "none";
        }
    });
}
