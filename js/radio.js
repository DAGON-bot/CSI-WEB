(() => {

    "use strict";

    const API_URL =
        window.location.origin;

    const STORAGE_KEY =
        "csi_radio_preferences_v2";

    /*
        Türkiye radyolarını sonraki adımda bu listeye
        doğrulanmış resmi stream URL'leri ile ekleyeceğiz.
    */
    const stations = [];

    const root =
        document.getElementById(
            "csiRadio"
        );

    if (!root) {
        return;
    }

    const audio =
        document.getElementById("csiRadioAudio");

    const miniButton =
        document.getElementById("csiRadioMini");

    const panel =
        document.getElementById("csiRadioPanel");

    const collapseButton =
        document.getElementById("csiRadioCollapse");

    const playButton =
        document.getElementById("csiRadioPlay");

    const muteButton =
        document.getElementById("csiRadioMute");

    const volumeInput =
        document.getElementById("csiRadioVolume");

    const volumeValue =
        document.getElementById("csiRadioVolumeValue");

    const stationSelect =
        document.getElementById("csiRadioStation");

    const stationName =
        document.getElementById("csiRadioStationName");

    const stationMeta =
        document.getElementById("csiRadioStationMeta");

    const miniStatus =
        document.getElementById("csiRadioMiniStatus");

    const miniVolume =
        document.getElementById("csiRadioMiniVolume");

    const message =
        document.getElementById("csiRadioMessage");

    const adminPanel =
        document.getElementById("csiRadioAdmin");

    const djNameInput =
        document.getElementById("csiRadioDjName");

    const djUrlInput =
        document.getElementById("csiRadioDjUrl");

    const djStartButton =
        document.getElementById("csiRadioDjStart");

    const djStopButton =
        document.getElementById("csiRadioDjStop");

    const state = {
        stationId: "",
        volume: 55,
        muted: false,
        userPaused: true,
        isAdmin: false,
        globalRadio: {
            mode: "station",
            stationId: "",
            stationName: "",
            streamUrl: "",
            djName: "",
            updatedAt: null
        }
    };

    function getToken() {
        return String(
            localStorage.getItem("token") || ""
        ).trim();
    }

    function loadPreferences() {

        try {

            const saved =
                JSON.parse(
                    localStorage.getItem(
                        STORAGE_KEY
                    ) || "{}"
                );

            if (
                Number.isFinite(
                    Number(saved.volume)
                )
            ) {
                state.volume =
                    Math.min(
                        Math.max(
                            Number(saved.volume),
                            0
                        ),
                        100
                    );
            }

            state.muted =
                saved.muted === true;

            state.stationId =
                String(
                    saved.stationId || ""
                );

        } catch (_) {
            // Varsayılan değerlerle devam.
        }
    }

    function savePreferences() {

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({
                stationId:
                    state.stationId,
                volume:
                    state.volume,
                muted:
                    state.muted
            })
        );
    }

    function getSelectedStation() {

        return stations.find(
            station =>
                station.id ===
                state.stationId
        ) || null;
    }

    function fillStations() {

        stations.forEach(
            station => {

                const option =
                    document.createElement(
                        "option"
                    );

                option.value =
                    station.id;

                option.textContent =
                    station.name;

                stationSelect.appendChild(
                    option
                );
            }
        );

        stationSelect.value =
            state.stationId;
    }

    function getActiveSource() {

        if (
            state.globalRadio.mode === "dj" &&
            state.globalRadio.streamUrl
        ) {
            return {
                id: "csi-dj",
                name: "CSI DJ",
                meta:
                    state.globalRadio.djName
                        ? `🔴 CANLI • DJ: ${state.globalRadio.djName}`
                        : "🔴 CSI DJ CANLI",
                url:
                    state.globalRadio.streamUrl
            };
        }

        return getSelectedStation();
    }

    function updateVolumeUI() {

        audio.volume =
            state.volume / 100;

        audio.muted =
            state.muted;

        volumeInput.value =
            String(state.volume);

        volumeValue.textContent =
            `${state.volume}%`;

        const iconClass =
            state.muted ||
            state.volume === 0
                ? "fa-volume-xmark"
                : state.volume < 45
                    ? "fa-volume-low"
                    : "fa-volume-high";

        muteButton.innerHTML =
            `<i class="fa-solid ${iconClass}"></i>`;

        miniVolume.innerHTML =
            `<i class="fa-solid ${iconClass}"></i>`;
    }

    function updatePlayUI() {

        const playing =
            !audio.paused &&
            Boolean(audio.src);

        playButton.innerHTML =
            playing
                ? '<i class="fa-solid fa-pause"></i>'
                : '<i class="fa-solid fa-play"></i>';

        playButton.setAttribute(
            "aria-label",
            playing
                ? "Durdur"
                : "Oynat"
        );
    }

    function updateStationUI() {

        const source =
            getActiveSource();

        if (!source) {

            stationName.textContent =
                "Yayın bekleniyor";

            stationMeta.textContent =
                "CSI Radio";

            miniStatus.textContent =
                "Yayın bekleniyor";

            return;
        }

        stationName.textContent =
            source.name;

        stationMeta.textContent =
            source.meta ||
            "Canlı Yayın";

        miniStatus.textContent =
            state.globalRadio.mode === "dj"
                ? (
                    state.globalRadio.djName
                        ? `CSI DJ • ${state.globalRadio.djName}`
                        : "CSI DJ • Canlı"
                )
                : source.name;
    }

    async function playActiveSource() {

        const source =
            getActiveSource();

        if (
            !source ||
            !source.url
        ) {

            message.textContent =
                "Aktif bir yayın adresi bulunmuyor.";

            updatePlayUI();
            return;
        }

        const absoluteUrl =
            new URL(
                source.url,
                window.location.href
            ).href;

        if (
            audio.src !== absoluteUrl
        ) {
            audio.src =
                source.url;

            audio.load();
        }

        try {

            await audio.play();

            state.userPaused =
                false;

            message.textContent =
                state.globalRadio.mode === "dj"
                    ? "CSI DJ canlı yayını çalıyor."
                    : `${source.name} canlı yayını çalıyor.`;

        } catch (error) {

            state.userPaused =
                true;

            message.textContent =
                "Tarayıcı sesi engelledi. Oynat tuşuna basın.";

            console.warn(
                "CSI Radio oynatma engellendi:",
                error
            );
        }

        updatePlayUI();
    }

    function pauseRadio() {

        audio.pause();

        state.userPaused =
            true;

        updatePlayUI();
    }

    function switchSourceWithoutForcingPlayback() {

        const source =
            getActiveSource();

        const wasPlaying =
            !audio.paused &&
            Boolean(audio.src);

        const shouldResume =
            wasPlaying ||
            state.userPaused === false;

        audio.pause();
        audio.removeAttribute("src");
        audio.load();

        updateStationUI();
        updatePlayUI();

        if (
            source?.url &&
            shouldResume
        ) {
            playActiveSource();
        }
    }

    function setStation(stationId) {

        state.stationId =
            String(
                stationId || ""
            );

        savePreferences();

        if (
            state.globalRadio.mode !== "dj"
        ) {
            switchSourceWithoutForcingPlayback();
        }
    }

    function openPanel() {

        root.classList.add(
            "is-open"
        );

        panel.hidden =
            false;

        miniButton.setAttribute(
            "aria-expanded",
            "true"
        );
    }

    function closePanel() {

        root.classList.remove(
            "is-open"
        );

        panel.hidden =
            true;

        miniButton.setAttribute(
            "aria-expanded",
            "false"
        );
    }

    async function loadCurrentUser() {

        const token =
            getToken();

        if (!token) {
            state.isAdmin = false;
            adminPanel.hidden = true;
            return;
        }

        try {

            const response =
                await fetch(
                    `${API_URL}/api/me`,
                    {
                        headers: {
                            Authorization:
                                `Bearer ${token}`
                        }
                    }
                );

            const data =
                await response.json();

            if (
                !response.ok ||
                !data.success
            ) {
                state.isAdmin = false;
                adminPanel.hidden = true;
                return;
            }

            const roles =
                Array.isArray(
                    data.user?.roles
                )
                    ? data.user.roles
                    : [
                        data.user?.role ||
                        "member"
                    ];

            state.isAdmin =
                roles.includes(
                    "admin"
                );

            adminPanel.hidden =
                !state.isAdmin;

            if (
                state.isAdmin &&
                djNameInput &&
                !djNameInput.value
            ) {
                djNameInput.value =
                    data.user?.username ||
                    "Admin";
            }

        } catch (error) {

            console.warn(
                "CSI Radio kullanıcı yetkisi okunamadı:",
                error
            );

            state.isAdmin = false;
            adminPanel.hidden = true;
        }
    }

    async function fetchRadioState() {

        try {

            const response =
                await fetch(
                    `${API_URL}/api/radio/state`,
                    {
                        cache: "no-store"
                    }
                );

            const data =
                await response.json();

            if (
                !response.ok ||
                !data.success
            ) {
                return;
            }

            applyGlobalRadioState(
                data.radio || {}
            );

        } catch (error) {

            console.warn(
                "CSI Radio durumu alınamadı:",
                error
            );
        }
    }

    function applyGlobalRadioState(
        incoming
    ) {

        const previousSignature =
            JSON.stringify(
                state.globalRadio
            );

        state.globalRadio = {
            mode:
                incoming.mode === "dj"
                    ? "dj"
                    : "station",

            stationId:
                String(
                    incoming.stationId || ""
                ),

            stationName:
                String(
                    incoming.stationName || ""
                ),

            streamUrl:
                String(
                    incoming.streamUrl || ""
                ),

            djName:
                String(
                    incoming.djName || ""
                ),

            updatedAt:
                incoming.updatedAt ||
                null
        };

        const nextSignature =
            JSON.stringify(
                state.globalRadio
            );

        if (
            previousSignature !==
            nextSignature
        ) {

            if (
                state.globalRadio.mode === "dj"
            ) {
                message.textContent =
                    state.globalRadio.djName
                        ? `${state.globalRadio.djName} DJ yayını aktif.`
                        : "CSI DJ yayını aktif.";
            } else {
                message.textContent =
                    "Normal radyo modu aktif.";
            }

            switchSourceWithoutForcingPlayback();
        } else {
            updateStationUI();
        }
    }

    async function startDj() {

        if (!state.isAdmin) {
            return;
        }

        const token =
            getToken();

        const streamUrl =
            String(
                djUrlInput.value || ""
            ).trim();

        const djName =
            String(
                djNameInput.value || ""
            ).trim();

        if (!streamUrl) {
            message.textContent =
                "DJ yayın linkini girin.";
            djUrlInput.focus();
            return;
        }

        djStartButton.disabled = true;

        try {

            const response =
                await fetch(
                    `${API_URL}/api/radio/dj/start`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json",

                            Authorization:
                                `Bearer ${token}`
                        },

                        body:
                            JSON.stringify({
                                streamUrl,
                                djName
                            })
                    }
                );

            const data =
                await response.json();

            if (
                !response.ok ||
                !data.success
            ) {
                throw new Error(
                    data.message ||
                    "DJ yayını başlatılamadı."
                );
            }

            applyGlobalRadioState(
                data.radio || {}
            );

            message.textContent =
                "DJ yayını aktif edildi.";

        } catch (error) {

            message.textContent =
                error.message ||
                "DJ yayını başlatılamadı.";

        } finally {

            djStartButton.disabled =
                false;
        }
    }

    async function stopDj() {

        if (!state.isAdmin) {
            return;
        }

        const token =
            getToken();

        djStopButton.disabled = true;

        try {

            const response =
                await fetch(
                    `${API_URL}/api/radio/dj/stop`,
                    {
                        method: "POST",

                        headers: {
                            Authorization:
                                `Bearer ${token}`
                        }
                    }
                );

            const data =
                await response.json();

            if (
                !response.ok ||
                !data.success
            ) {
                throw new Error(
                    data.message ||
                    "DJ yayını kapatılamadı."
                );
            }

            applyGlobalRadioState(
                data.radio || {}
            );

            message.textContent =
                "DJ yayını kapatıldı.";

        } catch (error) {

            message.textContent =
                error.message ||
                "DJ yayını kapatılamadı.";

        } finally {

            djStopButton.disabled =
                false;
        }
    }

    loadPreferences();
    fillStations();
    updateVolumeUI();
    updateStationUI();
    updatePlayUI();

    miniButton.addEventListener(
        "click",
        openPanel
    );

    collapseButton.addEventListener(
        "click",
        closePanel
    );

    playButton.addEventListener(
        "click",
        () => {

            if (!audio.paused) {
                pauseRadio();
                return;
            }

            playActiveSource();
        }
    );

    muteButton.addEventListener(
        "click",
        () => {

            state.muted =
                !state.muted;

            updateVolumeUI();
            savePreferences();
        }
    );

    volumeInput.addEventListener(
        "input",
        event => {

            state.volume =
                Number(
                    event.target.value
                );

            if (
                state.volume > 0 &&
                state.muted
            ) {
                state.muted =
                    false;
            }

            updateVolumeUI();
            savePreferences();
        }
    );

    stationSelect.addEventListener(
        "change",
        event => {

            setStation(
                event.target.value
            );
        }
    );

    djStartButton?.addEventListener(
        "click",
        startDj
    );

    djStopButton?.addEventListener(
        "click",
        stopDj
    );

    audio.addEventListener(
        "play",
        updatePlayUI
    );

    audio.addEventListener(
        "pause",
        updatePlayUI
    );

    audio.addEventListener(
        "error",
        () => {

            message.textContent =
                "Radyo yayınına bağlanılamadı. Yayın linkini kontrol edin.";

            updatePlayUI();
        }
    );

    /*
        Socket.IO zaten projede mevcut.
        Varsa DJ modu değişikliklerini anlık alır.
        Yoksa 5 saniyelik polling yedek olarak çalışır.
    */
    if (
        typeof window.io ===
        "function"
    ) {

        try {

            const socket =
                window.io();

            socket.on(
                "radioStateChanged",
                data => {
                    applyGlobalRadioState(
                        data || {}
                    );
                }
            );

        } catch (_) {
            // Polling yedek olarak devam eder.
        }
    }

    Promise.all([
        loadCurrentUser(),
        fetchRadioState()
    ]);

    setInterval(
        fetchRadioState,
        5000
    );

})();
