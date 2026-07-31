const dialogOverlay =
    document.getElementById("dialogOverlay");

const dialogTitle =
    document.getElementById("dialogTitle");

const dialogMessage =
    document.getElementById("dialogMessage");

const dialogIcon =
    document.getElementById("dialogIcon");

const dialogOkBtn =
    document.getElementById("dialogOkBtn");

let dialogCallback = null;

function showDialog(
    title,
    message,
    type = "warning",
    callback = null
) {

    if (
        !dialogOverlay ||
        !dialogTitle ||
        !dialogMessage ||
        !dialogIcon ||
        !dialogOkBtn
    ) {

        console.error(
            "Dialog HTML elemanları bulunamadı.",
            {
                dialogOverlay,
                dialogTitle,
                dialogMessage,
                dialogIcon,
                dialogOkBtn
            }
        );

        return;
    }

    dialogTitle.textContent = title;
    dialogMessage.textContent = message;

    dialogCallback = callback;

    if (type === "success") {

        dialogIcon.textContent = "✓";

    } else if (type === "error") {

        dialogIcon.textContent = "×";

    } else {

        dialogIcon.textContent = "!";

    }

    dialogOverlay.classList.add("active");

}

function closeDialog() {

    if (!dialogOverlay) {
        return;
    }

    dialogOverlay.classList.remove("active");

    if (typeof dialogCallback === "function") {

        const callback = dialogCallback;

        dialogCallback = null;

        callback();

    }

}

dialogOkBtn?.addEventListener("click", closeDialog);