(() => {

    "use strict";

    const API_URL =
        window.location.origin;

    const STORAGE_KEY =
        "csi_radio_preferences_v3";

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
    const youtubeWrap =
        document.getElementById("csiRadioYoutubeWrap");

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
            youtubeVideoId: "",
            youtubeUrl: "",
            startedAt: null,
            djName: "",
            updatedAt: null
        },
        youtube: {
            apiReady: false,
            playerReady: false,
            player: null,
            pendingVideoId: "",
            pendingStartSeconds: 0
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

        } catch (_) {}
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

    function isYoutubeDjMode() {

        return (
            state.globalRadio.mode === "dj" &&
            Boolean(
                state.globalRadio.youtubeVideoId
            )
        );
    }

    function getSelectedStationSource() {

        return getSelectedStation();
    }

    function getYoutubeElapsedSeconds() {

        const startedAt =
            state.globalRadio.startedAt
                ? new Date(
                    state.globalRadio.startedAt
                ).getTime()
                : NaN;

        if (!Number.isFinite(startedAt)) {
            return 0;
        }

        return Math.max(
            0,
            Math.floor(
                (Date.now() - startedAt) /
                1000
            )
        );
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

        if (
            state.youtube.playerReady &&
            state.youtube.player
        ) {

            try {

                state.youtube.player.setVolume(
                    state.volume
                );

                if (
                    state.muted ||
                    state.volume === 0
                ) {
                    state.youtube.player.mute();
                } else {
                    state.youtube.player.unMute();
                }

            } catch (_) {}
        }

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

    function isCurrentlyPlaying() {

        if (
            isYoutubeDjMode() &&
            state.youtube.playerReady &&
            state.youtube.player &&
            window.YT
        ) {

            try {

                return (
                    state.youtube.player.getPlayerState() ===
                    window.YT.PlayerState.PLAYING
                );

            } catch (_) {
                return false;
            }
        }

        return (
            !audio.paused &&
            Boolean(audio.src)
        );
    }

    function updatePlayUI() {

        const playing =
            isCurrentlyPlaying();

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

        if (isYoutubeDjMode()) {

            stationName.textContent =
                "CSI DJ";

            stationMeta.textContent =
                state.globalRadio.djName
                    ? `🔴 CANLI • DJ: ${state.globalRadio.djName}`
                    : "🔴 CSI DJ";

            miniStatus.textContent =
                state.globalRadio.djName
                    ? `CSI DJ • ${state.globalRadio.djName}`
                    : "CSI DJ • YouTube";

            return;
        }

        const station =
            getSelectedStation();

        if (!station) {

            stationName.textContent =
                "Yayın bekleniyor";

            stationMeta.textContent =
                "CSI Radio";

            miniStatus.textContent =
                "Yayın bekleniyor";

            return;
        }

        stationName.textContent =
            station.name;

        stationMeta.textContent =
            station.meta ||
            "Canlı Yayın";

        miniStatus.textContent =
            station.name;
    }

    function loadYoutubeApi() {

        if (
            window.YT &&
            window.YT.Player
        ) {
            state.youtube.apiReady = true;
            createYoutubePlayer();
            return;
        }

        if (
            document.querySelector(
                'script[data-csi-youtube-api="1"]'
            )
        ) {
            return;
        }

        const script =
            document.createElement(
                "script"
            );

        script.src =
            "https://www.youtube.com/iframe_api";

        script.async = true;

        script.dataset.csiYoutubeApi =
            "1";

        document.head.appendChild(
            script
        );
    }

    const previousYoutubeReady =
        window.onYouTubeIframeAPIReady;

    window.onYouTubeIframeAPIReady =
        function () {

            if (
                typeof previousYoutubeReady ===
                "function"
            ) {
                try {
                    previousYoutubeReady();
                } catch (_) {}
            }

            state.youtube.apiReady =
                true;

            createYoutubePlayer();
        };

    function createYoutubePlayer() {

        if (
            !state.youtube.apiReady ||
            state.youtube.player
        ) {
            return;
        }

        state.youtube.player =
            new window.YT.Player(
                "csiRadioYoutubePlayer",
                {
                    width: "100%",
                    height: "200",

                    playerVars: {
                        autoplay: 0,
                        controls: 1,
                        playsinline: 1,
                        rel: 0,
                        origin:
                            window.location.origin
                    },

                    events: {

                        onReady:
                            event => {

                                state.youtube.playerReady =
                                    true;

                                event.target.setVolume(
                                    state.volume
                                );

                                if (
                                    state.muted ||
                                    state.volume === 0
                                ) {
                                    event.target.mute();
                                }

                                if (
                                    state.youtube.pendingVideoId
                                ) {

                                    if (
                                        isYoutubeDjMode() &&
                                        state.globalRadio.startedAt
                                    ) {

                                        state.youtube.pendingStartSeconds =
                                            getYoutubeElapsedSeconds();

                                        try {

                                            event.target.loadVideoById({
                                                videoId:
                                                    state.youtube.pendingVideoId,

                                                startSeconds:
                                                    state.youtube.pendingStartSeconds
                                            });

                                        } catch (_) {

                                            loadYoutubeVideo(
                                                false
                                            );
                                        }

                                    } else {

                                        loadYoutubeVideo(
                                            false
                                        );
                                    }
                                }

                                updatePlayUI();
                            },

                        onStateChange:
                            async event => {

                                updatePlayUI();

                                if (
                                    event.data ===
                                        window.YT.PlayerState.PLAYING &&
                                    state.isAdmin &&
                                    isYoutubeDjMode() &&
                                    !state.globalRadio.startedAt
                                ) {

                                    await ensureYoutubePlaybackStarted();

                                    state.youtube.pendingStartSeconds =
                                        0;
                                }
                            },

                        onAutoplayBlocked:
                            () => {

                                state.userPaused =
                                    true;

                                message.textContent =
                                    "Tarayıcı YouTube otomatik oynatmayı engelledi. Oynat tuşuna basın.";

                                updatePlayUI();
                            },

                        onError:
                            () => {

                                message.textContent =
                                    "YouTube videosu oynatılamadı. Video embed'e kapalı olabilir.";

                                updatePlayUI();
                            }
                    }
                }
            );
    }

    function prepareYoutubeVideo() {

        if (!isYoutubeDjMode()) {
            youtubeWrap.hidden = true;
            return;
        }

        youtubeWrap.hidden = false;

        state.youtube.pendingVideoId =
            state.globalRadio.youtubeVideoId;

        state.youtube.pendingStartSeconds =
            getYoutubeElapsedSeconds();

        loadYoutubeApi();

        if (
            state.youtube.playerReady
        ) {
            loadYoutubeVideo(
                false
            );
        }
    }

    function loadYoutubeVideo(
        autoplay
    ) {

        if (
            !state.youtube.playerReady ||
            !state.youtube.player ||
            !state.youtube.pendingVideoId
        ) {
            return;
        }

        const options = {
            videoId:
                state.youtube.pendingVideoId,

            startSeconds:
                state.youtube.pendingStartSeconds
        };

        try {

            if (autoplay) {

                state.youtube.player.loadVideoById(
                    options
                );

            } else {

                state.youtube.player.cueVideoById(
                    options
                );
            }

        } catch (error) {

            console.warn(
                "YouTube video yüklenemedi:",
                error
            );
        }
    }

    async function ensureYoutubePlaybackStarted() {

        if (
            !state.isAdmin ||
            state.globalRadio.startedAt
        ) {
            return;
        }

        const token =
            getToken();

        try {

            const response =
                await fetch(
                    `${API_URL}/api/radio/dj/play-start`,
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
                response.ok &&
                data.success &&
                data.radio
            ) {
                state.globalRadio.startedAt =
                    data.radio.startedAt ||
                    new Date().toISOString();
            }

        } catch (error) {

            console.warn(
                "YouTube DJ başlangıç saati kaydedilemedi:",
                error
            );
        }
    }

    async function playActiveSource() {

        if (isYoutubeDjMode()) {

            if (!root.classList.contains(
                "is-open"
            )) {

                openPanel();
            }

            youtubeWrap.hidden =
                false;

            state.youtube.pendingVideoId =
                state.globalRadio.youtubeVideoId;

            if (
                state.isAdmin &&
                !state.globalRadio.startedAt
            ) {

                state.youtube.pendingStartSeconds =
                    0;

                await ensureYoutubePlaybackStarted();

            } else {

                state.youtube.pendingStartSeconds =
                    getYoutubeElapsedSeconds();
            }

            loadYoutubeApi();

            if (
                !state.youtube.playerReady
            ) {

                message.textContent =
                    "YouTube oynatıcı hazırlanıyor. Birkaç saniye sonra tekrar Oynat'a basın.";

                return;
            }

            try {

                loadYoutubeVideo(
                    true
                );

                state.userPaused =
                    false;

                message.textContent =
                    "CSI DJ YouTube yayını çalıyor.";

            } catch (_) {}

            updatePlayUI();
            return;
        }

        const station =
            getSelectedStationSource();

        if (
            !station ||
            !station.url
        ) {

            message.textContent =
                "Aktif bir radyo yayını bulunmuyor.";

            updatePlayUI();
            return;
        }

        const absoluteUrl =
            new URL(
                station.url,
                window.location.href
            ).href;

        if (
            audio.src !==
            absoluteUrl
        ) {
            audio.src =
                station.url;

            audio.load();
        }

        try {

            await audio.play();

            state.userPaused =
                false;

            message.textContent =
                `${station.name} canlı yayını çalıyor.`;

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

        if (
            state.youtube.playerReady &&
            state.youtube.player
        ) {
            try {
                state.youtube.player.pauseVideo();
            } catch (_) {}
        }

        state.userPaused =
            true;

        updatePlayUI();
    }

    function stopAllSources() {

        audio.pause();
        audio.removeAttribute("src");
        audio.load();

        if (
            state.youtube.playerReady &&
            state.youtube.player
        ) {
            try {
                state.youtube.player.stopVideo();
            } catch (_) {}
        }

        updatePlayUI();
    }

    function setStation(
        stationId
    ) {

        state.stationId =
            String(
                stationId || ""
            );

        savePreferences();

        if (
            state.globalRadio.mode !==
            "dj"
        ) {
            stopAllSources();
            updateStationUI();
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

        if (isYoutubeDjMode()) {
            prepareYoutubeVideo();
        }
    }

    function closePanel() {

        /*
            YouTube resmi embed oynatıcısı gizlenmiş durumda
            arka plan player'ı gibi kullanılmamalı.
            DJ modunda panel küçültülünce playback durur.
        */
        if (isYoutubeDjMode()) {
            pauseRadio();
        }

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
                roles.includes("admin");

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

    async function tryAutoStartCurrentBroadcast() {

        if (isYoutubeDjMode()) {

            // YouTube player görünür kalmalı; DJ aktifse paneli aç.
            if (
                !root.classList.contains(
                    "is-open"
                )
            ) {
                openPanel();
            }

            prepareYoutubeVideo();

            // Player hazırsa yayının mevcut saniyesinden başlatmayı dene.
            if (
                state.youtube.playerReady &&
                state.youtube.player &&
                state.globalRadio.startedAt
            ) {

                state.youtube.pendingVideoId =
                    state.globalRadio.youtubeVideoId;

                state.youtube.pendingStartSeconds =
                    getYoutubeElapsedSeconds();

                try {

                    state.youtube.player.loadVideoById({
                        videoId:
                            state.youtube.pendingVideoId,

                        startSeconds:
                            state.youtube.pendingStartSeconds
                    });

                    state.userPaused =
                        false;

                    message.textContent =
                        "CSI DJ yayını otomatik başlatılıyor...";

                } catch (error) {

                    console.warn(
                        "YouTube otomatik başlatılamadı:",
                        error
                    );
                }
            }

            return;
        }

        const station =
            getSelectedStationSource();

        if (
            !station ||
            !station.url
        ) {
            return;
        }

        try {

            const absoluteUrl =
                new URL(
                    station.url,
                    window.location.href
                ).href;

            if (
                audio.src !==
                absoluteUrl
            ) {

                audio.src =
                    station.url;

                audio.load();
            }

            await audio.play();

            state.userPaused =
                false;

            message.textContent =
                `${station.name} otomatik olarak çalıyor.`;

            updatePlayUI();

        } catch (error) {

            // Tarayıcı sesli autoplay'i engellerse kullanıcı tek tıkla başlatır.
            state.userPaused =
                true;

            message.textContent =
                "Tarayıcı otomatik sesi engelledi. Oynat tuşuna bir kez basın.";

            updatePlayUI();
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

        const previousMode =
            state.globalRadio.mode;

        const previousVideoId =
            state.globalRadio.youtubeVideoId;

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

            youtubeVideoId:
                String(
                    incoming.youtubeVideoId || ""
                ),

            youtubeUrl:
                String(
                    incoming.youtubeUrl || ""
                ),

            startedAt:
                incoming.startedAt ||
                null,

            djName:
                String(
                    incoming.djName || ""
                ),

            updatedAt:
                incoming.updatedAt ||
                null
        };

        const sourceChanged =
            previousMode !==
                state.globalRadio.mode ||
            previousVideoId !==
                state.globalRadio.youtubeVideoId;

        updateStationUI();

        if (isYoutubeDjMode()) {

            // Aynı şarkının 5 saniyelik durum kontrolü
            // oynatıcıyı durdurmamalı / yeniden yüklememeli.
            if (sourceChanged) {

                stopAllSources();

                if (
                    root.classList.contains(
                        "is-open"
                    )
                ) {
                    prepareYoutubeVideo();
                } else {
                    youtubeWrap.hidden = true;
                }
            }

            message.textContent =
                state.globalRadio.djName
                    ? `${state.globalRadio.djName} YouTube DJ modu aktif.`
                    : "CSI DJ YouTube modu aktif.";

            if (sourceChanged) {

                setTimeout(
                    tryAutoStartCurrentBroadcast,
                    250
                );
            }

        } else {

            youtubeWrap.hidden =
                true;

            if (
                sourceChanged &&
                state.youtube.playerReady &&
                state.youtube.player
            ) {
                try {
                    state.youtube.player.stopVideo();
                } catch (_) {}
            }

            message.textContent =
                "Normal radyo modu aktif.";

            if (sourceChanged) {

                setTimeout(
                    tryAutoStartCurrentBroadcast,
                    250
                );
            }
        }
    }

    async function startDj() {

        if (!state.isAdmin) {
            return;
        }

        const token =
            getToken();

        const youtubeUrl =
            String(
                djUrlInput.value || ""
            ).trim();

        const djName =
            String(
                djNameInput.value || ""
            ).trim();

        if (!youtubeUrl) {

            message.textContent =
                "YouTube şarkı linkini girin.";

            djUrlInput.focus();
            return;
        }

        djStartButton.disabled =
            true;

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
                                youtubeUrl,
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
                    "YouTube DJ modu başlatılamadı."
                );
            }

            applyGlobalRadioState(
                data.radio || {}
            );

            openPanel();

            message.textContent =
                "YouTube şarkısı hazır. Oynat dediğinizde 0:00’dan başlayacak.";

        } catch (error) {

            message.textContent =
                error.message ||
                "YouTube DJ modu başlatılamadı.";

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

        djStopButton.disabled =
            true;

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
                    "DJ modu kapatılamadı."
                );
            }

            applyGlobalRadioState(
                data.radio || {}
            );

            message.textContent =
                "DJ modu kapatıldı.";

        } catch (error) {

            message.textContent =
                error.message ||
                "DJ modu kapatılamadı.";

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
    loadYoutubeApi();

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

            if (
                isCurrentlyPlaying()
            ) {
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
                "Radyo yayınına bağlanılamadı.";

            updatePlayUI();
        }
    );

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

        } catch (_) {}
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