"use strict";

function getToastContainer() {

    let container =
        document.getElementById(
            "toastContainer"
        );

    if (!container) {

        container =
            document.createElement("div");

        container.id =
            "toastContainer";

        document.body.appendChild(
            container
        );
    }

    Object.assign(
        container.style,
        {
            position: "fixed",
            top: "25px",
            right: "25px",
            zIndex: "2147483647",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: "12px",
            pointerEvents: "none"
        }
    );

    return container;
}

function showToast(
    message,
    type = "success"
) {

    const cleanMessage =
        String(message || "").trim();

    if (!cleanMessage) {
        return;
    }

    const container =
        getToastContainer();

    const toast =
        document.createElement("div");

    const backgrounds = {
        success: "#28a745",
        error: "#dc3545",
        warning: "#d4a000",
        info: "#3498db"
    };

    toast.className =
        `toast ${type}`;

    toast.textContent =
        cleanMessage;

    Object.assign(
        toast.style,
        {
            minWidth: "280px",
            maxWidth: "420px",
            padding: "18px 22px",
            borderRadius: "14px",
            color:
                type === "warning"
                    ? "#111"
                    : "#fff",
            background:
                backgrounds[type] ||
                backgrounds.info,
            fontWeight: "700",
            lineHeight: "1.4",
            opacity: "0",
            transform:
                "translateX(30px)",
            transition:
                "opacity .25s ease, transform .25s ease",
            boxShadow:
                "0 15px 35px rgba(0, 0, 0, .45)",
            pointerEvents: "auto"
        }
    );

    container.appendChild(
        toast
    );

    requestAnimationFrame(
        () => {

            toast.style.opacity =
                "1";

            toast.style.transform =
                "translateX(0)";
        }
    );

    window.setTimeout(
        () => {

            toast.style.opacity =
                "0";

            toast.style.transform =
                "translateX(30px)";

            window.setTimeout(
                () => {
                    toast.remove();
                },
                300
            );
        },
        3000
    );
}

window.showToast = showToast;