// Import KernelSU functions from CDN
import { exec, spawn, toast, fullScreen } from 'https://cdn.jsdelivr.net/npm/kernelsu@1.0.6/+esm';

// A constant array of package name patterns used to identify games.
const GAME_PACKAGES = [
    "age.of.civilizations2.*", "com.bushiroad.*", "com.ChillyRoom.*", "com.Flanne.*", "com.GameCoaster.*", "com.HoYoverse.*", "com.RoamingStar.*", "com.Shooter.*", "com.Sunborn.*", "com.YoStar.*", "com.ZeroCastleGameStudio.*", "com.activision.*", "com.albiononline", "com.aligames.*", "com.autumn.*", "com.axlebolt.*", "com.bandainamcoent.*", "com.bhvr.*", "com.bilibili.*", "com.bilibiligame.*", "com.bingkolo.*", "com.blizzard.*", "com.carxtech.*", "com.citra.*", "com.cnvcs.*", "com.dgames.*", "com.dolphinemu.*", "com.dts.*", "com.ea.*", "com.epicgames.*", "com.fantablade.*", "com.firsttouchgames.*", "com.gameloft.*", "com.garena.*", "com.halo.*", "com.hermes.*", "com.hottapkgs.*", "com.hypergryph.*", "com.ignm.*", "com.jacksparrow.*", "com.je.*", "com.kakaogames.*", "com.kog.*", "com.komoe.*", "com.kurogame.*", "com.leiting.*", "com.levelinfinite.*", "com.lilithgames.*", "com.linegames.*", "com.madfingergames.*", "com.miHoYo.*", "com.miraclegames.*", "com.mobile.legends", "com.mobilelegends.*", "com.mojang", "com.nanostudios.*", "com.netease.*", "com.nexon.*", "com.nianticlabs.*", "com.olzhass.*", "com.pearlabyss.*", "com.pinkcore.*", "com.playdigious.*", "com.proximabeta.*", "com.prpr.*", "com.pubg.*", "com.pwrd.*", "com.r2games.*", "com.rayark.*", "com.riotgames", "com.roblox.*", "com.rockstargames.*", "com.sega.*", "com.shangyoo.*", "com.shenlan.*", "com.smokoko.*", "com.sofunny.*", "com.soulgamechst.*", "com.sprduck.*", "com.stove.*", "com.supercell.*", "com.sy.*", "com.t2ksports.*", "com.tencent.*", "com.tgc.*", "com.the10tons.*", "com.ubisoft.*", "com.unity.*", "com.valvesoftware.*", "com.vng.*", "com.xd.*", "com.xindong.*", "com.yongshi.*", "com.zlongame.*", "com.ztgame.*", "com.zy.*", "jp.co.craftegg.*", "jp.konami.*", "net.kdt.*", "net.wargaming.*", "org.mm.*", "org.vita3k.*", "pro.archiemeng.*", "skyline.*", "org.yuzu.*", "id.rj01117883.*", "xyz.aethersx2.*", "com.kurogame.gplay.*", "com.FosFenes.*", "com.devsisters.*", "ro.alyn_sampmobile.*", "com.netmarble.sololv", "com.hermes.p6gameos", "com.futuremark.dmandroid.application", "skynet.cputhrottlingtest", "com.tokyoghoulsea1.google", "com.gof.global",
    // Added packages from the original code that were on a single line and thus missed the previous array formatting
    "com.cnvcs.*", "com.dfjz.*", "com.dragonli.*", "com.gabama.*", "com.guyou.*", "com.heavenburnsred", "com.ilongyuan.*", "com.rekoo.*", "com.dena.*", "com.denachina.*", "com.miraclegames.*", "com.dgames.*"
];

// Utility function to safely get system properties
async function getProp(prop) {
    try {
        const { stdout } = await exec(`getprop ${prop}`);
        return stdout.trim();
    } catch (e) {
        return "";
    }
}

// Utility function to safely get shell output
async function getShellOutput(command, fallback = "") {
    try {
        const { stdout } = await exec(command);
        return stdout.trim();
    } catch (e) {
        return fallback;
    }
}

// =========================
// === SYSTEM MONITORING ===
// =========================

function updateDateBar() {
    const dateBar = document.getElementById("dateBar");
    const now = new Date();
    // Use a simpler format
    const formatted = now.toLocaleString("en-GB", {
        weekday: "short", year: "numeric", month: "short", day: "2-digit",
        hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false
    }).replace(",", "");
    if (dateBar) dateBar.textContent = formatted;
}

setInterval(updateDateBar, 1000);
updateDateBar();

// Fetches the current total CPU usage percentage.
async function getCPU() {
    try {
        const result = await exec("dumpsys cpuinfo | grep TOTAL | awk '{print $1}' | tr -d '%'");
        const cpu = parseInt(result.stdout.trim(), 10);
        if (!isNaN(cpu) && cpu > 0) {
            return cpu.toString();
        }

        // Fallback command if the first one fails
        const alt = await exec("dumpsys cpuinfo | head -n 1 | awk '{print $1}' | tr -d '%'");
        return alt.stdout.trim() || "0";
    } catch (e) {
        console.error("Failed to get CPU usage:", e);
        return "N/A";
    }
}

// Fetches the current RAM usage details.
async function getRAM() {
    try {
        const stdout = await getShellOutput("cat /proc/meminfo");
        
        // FIX: Handle empty stdout
        if (!stdout) return { used: "0", total: "0", percent: "0" };

        // Use more robust regex to extract values
        const memTotalMatch = stdout.match(/MemTotal:\s+(\d+)/); // in kB
        const memAvailMatch = stdout.match(/MemAvailable:\s+(\d+)/); // in kB

        if (!memTotalMatch || !memAvailMatch) return { used: "0", total: "0", percent: "0" };

        const memTotal = parseInt(memTotalMatch[1], 10);
        const memAvail = parseInt(memAvailMatch[1], 10);

        const totalGB = (memTotal / 1048576).toFixed(2); // KB to GB
        const usedGB = ((memTotal - memAvail) / 1048576).toFixed(2); // Used KB to GB
        const percent = ((memTotal - memAvail) / memTotal * 100).toFixed(0);

        return {
            used: usedGB,
            total: totalGB,
            percent: percent
        };
    } catch (e) {
        console.error("Failed to get RAM info:", e);
        return { used: "0", total: "0", percent: "0" };
    }
}

// Updates the CPU and RAM statistics in the UI.
async function updateSystemStats() {
    try {
        const cpu = await getCPU();
        const ram = await getRAM();

        const cpuEl = document.getElementById("cpuUsage");
        const ramEl = document.getElementById("ramUsage");

        if (cpuEl) cpuEl.innerText = `${cpu}%`;
        if (ramEl) ramEl.innerText = `${ram.used} / ${ram.total} GB`;
    } catch (e) {
        console.error("Failed to update system stats:", e);
    }
}

// MODE
async function activatePerformance() {
    const command = `
        cmd power set-fixed-performance-mode-enabled true;
        cmd power set-adaptive-power-saver-enabled false;
        setprop debug.performance.tuning 1;
        setprop debug.egl.hw 1;
        setprop debug.sf.hw 1;
        setprop debug.sf.disable_client_composition_cache 1;
        setprop debug.sf.kernel_idle_timer_update_overlay 0;
        setprop debug.hwui.disable_vsync true;
        cmd notification post -S bigtext -t 'Vasto-Lord' 'tags' 'Modo: Performance' >/dev/null 2>&1
    `;
    await exec(command).catch(e => console.error("Failed to activate Performance mode:", e));
}

async function activateEfficiency() {
    const command = `
        cmd power set-fixed-performance-mode-enabled false;
        cmd power set-adaptive-power-saver-enabled true;
        setprop debug.performance.tuning 0;
        setprop debug.egl.hw 0;
        setprop debug.sf.hw 0;
        setprop debug.sf.disable_client_composition_cache 0;
        setprop debug.sf.kernel_idle_timer_update_overlay 1;
        setprop debug.hwui.disable_vsync false;
        cmd notification post -S bigtext -t 'Vasto-Lord' 'tags' 'Modo: Eficiência' >/dev/null 2>&1
    `;
    await exec(command).catch(e => console.error("Failed to activate Efficiency mode:", e));
}

// =========================
// === TOGGLE FUNCTIONS ====
// =========================

async function applyChipsetOptimizer(enabled) {
    if (!enabled) return;
    try {
        const cpuinfo = await getShellOutput("cat /proc/cpuinfo");
        let command = '';

        if (cpuinfo.includes("MT")) {
            // MediaTek Optimizer
            command = `
                setprop debug.mediatek.appgamepq_compress 1;
                setprop debug.mediatek.disp_decompress 1;
                setprop debug.mediatek.appgamepq 1;
                setprop debug.mediatek.game_pq_enable 1;
                setprop debug.mediatek.high_frame_rate_sf_set_big_core_fps_threshold 90;
                setprop debug.mtklog.netlog.Running 0;
                setprop debug.mtklog.netlog.enable 0;
                setprop debug.mtklog.aee.Running 0;
                setprop debug.mtklog.aee.enable 0;
                setprop debug.mtk.aee.db 0;
                setprop debug.netlog.writtingpath disable;
                setprop debug.mtklog.log2sd.path disable;
                setprop debug.mtklog.init.flag 0;
                setprop debug.MB.running 0;
                setprop debug.mdlogger.Running 0;
            `;
        } else if (cpuinfo.includes("Qualcomm")) {
            // Qualcomm Optimizer
            command = `
                setprop debug.gralloc.gfx_ubwc_disable 0;
                setprop debug.qti.am.resource.type super-large;
                setprop debug.qc.hardware true;
                setprop debug.qctwa.statusbar 1;
                setprop debug.qctwa.preservebuf 1;
                setprop debug.qualcomm.sns.hal 0;
                setprop debug.qualcomm.sns.daemon 0;
                setprop debug.qualcomm.sns.libsensor1 0;
            `;
        }

        if (command) await exec(command);

        // UNISOC / GAME PRELOAD (Kept original logic which iterates over game dumpsys output)
        const ufw = `
            dumpsys game | while read -r line; do
                pkg="";
                case "$line" in
                    *"Name:"*)
                        pkg=$(echo "$line" | awk -F'Name:' '{print $2}' | awk '{print $1}' | tr -d '[]')
                        ;;
                    *"No intervention found for package"*)
                        pkg=$(echo "$line" | awk -F'package ' '{print $2}' | tr -d '[]')
                        ;;
                esac
                if [ -n "$pkg" ]; then
                    cmd ufw settings set-preload-enable "$pkg" true
                fi
            done
        `;
        await exec(ufw).catch(() => {}); // Catch silent failure

    } catch (e) {
        console.error("Failed to apply Chipset Optimizer:", e);
    }
}

async function applyActivityManager(enabled) {
    try {
        if (!enabled) {
            await exec(`settings put global activity_manager_constants 0`);
            return;
        }

        const cores = parseInt(await getShellOutput("grep -c ^processor /proc/cpuinfo", "1"));
        const load = parseFloat(await getShellOutput("awk '{print $1}' /proc/loadavg", "1.0"));
        const ram = parseInt(await getShellOutput("free -m | awk '/Mem:/ {print $2}'", "4096"));
        const base = parseFloat(await getShellOutput("cat /proc/sys/kernel/perf_cpu_time_max_percent", "25"));

        const usage = load / (cores || 1);
        const ramFactor = ram <= 3000 ? 0.85 : ram <= 5000 ? 0.95 : 1.0;
        const eff = usage > 2.0 ? 0.08 : usage > 1.0 ? 0.12 : usage > 0.5 ? 0.18 : 0.22;

        const calc = v => Math.max(3, Math.round(v * eff * ramFactor));
        const pc1 = calc(25), pc2 = calc(45), pc3 = calc(60), pc4 = calc(60);

        const hwui = Math.round(35 + ((load / base) * 15) / (1 + load / base));

        await exec(`
            setprop debug.hwui.target_cpu_time_percent ${hwui};
            settings put global activity_manager_constants "power_check_max_cpu_1=${pc1},power_check_max_cpu_2=${pc2},power_check_max_cpu_3=${pc3},power_check_max_cpu_4=${pc4}";
        `);
    } catch (e) {
        console.error("applyActivityManager failed:", e);
    }
}

async function getInstalledGamePackages() {
    try {
        const pkgListRaw = await exec("cmd package list packages");
        
        // FIX: Ensure stdout exists before processing
        if (!pkgListRaw.stdout) return [];

        const installedPackages = pkgListRaw.stdout.split("\n")
            .map(line => line.replace("package:", "").trim())
            .filter(pkg => pkg.length > 0);

        const allMatchedPackages = [];
        for (const pattern of GAME_PACKAGES) {
            // Using a simple glob-to-regex conversion: replace '.' with '\.' and '*' with '.*'
            const regexPattern = pattern.replace(/\./g, '\\.').replace(/\*/g, '.*');
            const regex = new RegExp(`^${regexPattern}$`, "i");

            const matched = installedPackages.filter(pkg => regex.test(pkg));
            allMatchedPackages.push(...matched);
        }
        return [...new Set(allMatchedPackages)];
    } catch (e) {
        console.error("Failed to get installed game packages:", e);
        return [];
    }
}

async function applyGameManager(enabled) {
    try {
        const uniquePkgs = await getInstalledGamePackages();
        if (uniquePkgs.length === 0) return;
        const fpsRaw = await getShellOutput(`(dumpsys display | grep -m1 'mDefaultPeak' | grep -oE '[0-9]+(\\.[0-9]+)?' | head -n1 | awk -F. '{print $1}') || echo 60`);
        const FPS = parseInt(fpsRaw.trim()) || 60;
        const loadingBoost = 1073741824; // 2^30

        let command = '';
        if (enabled) {
            for (const pkg of uniquePkgs) {
                command += `
                    cmd game set performance ${pkg} || true;
                    cmd game set --mode 2 --downscale "disable" --fps ${FPS} ${pkg} || true;
                    cmd device_config put game_overlay ${pkg} mode=2,downscaleFactor=disable,useAngle=true,fps=${FPS},loadingBoost=${loadingBoost} || true;
                `;
            }
        } else {
            for (const pkg of uniquePkgs) {
                command += `
                    cmd game reset ${pkg} || true;
                    cmd device_config delete game_overlay ${pkg} || true;
                `;
            }
        }
        
        if (command) await exec(command);
    } catch (e) {
        console.error("Failed to apply Game Manager settings:", e);
    }
}

async function applyNetEnh(enabled) {
    const command = enabled ?
        `settings put global private_dns_mode hostname; settings put global private_dns_specifier 1dot1dot1dot1.cloudflare-dns.com` :
        `settings put global private_dns_specifier ""; settings put global private_dns_mode off`;
    await exec(command).catch(e => console.error("Failed to apply NetEnh settings:", e));
}

async function applyFstrimBoot(enabled) {
    await exec(`settings put global fstrim_mandatory_interval ${enabled ? 1 : 0}`)
        .catch(e => console.error("Failed to apply FstrimBoot settings:", e));
}

async function applyMiuiBoost(enabled) {
    try {
        const isMiui = await getProp("ro.miui.ui.version.name");
        if (!isMiui) return; // Skip if not MIUI

        const mode = enabled ? 'high' : 'middle';
        const saveMode = enabled ? 'ultimate' : 'normal';
        const speedMode = enabled ? 1 : 0;

        let command = `
            setprop debug.power.monitor_tools false;
            settings put system power_mode ${mode};
            settings put system POWER_SAVE_PRE_HIDE_MODE ${saveMode};
            settings put secure speed_mode ${speedMode};
        `;

        // Check for POWER_PERFORMANCE_MODE_OPEN and apply if exists
        const check = await getShellOutput("settings list system | grep POWER_PERFORMANCE_MODE_OPEN");
        if (check) command += `settings put system POWER_PERFORMANCE_MODE_OPEN ${speedMode};`;

        // Apply core scheduling (Logic maintained)
        const nr_cores = parseInt(await getShellOutput("awk -F- '{print $2+1}' /sys/devices/system/cpu/possible", "1")) || 1;
        let coreConfigCmd = '';
        switch (nr_cores) {
            case 8:
                coreConfigCmd = `
                    resetprop -n persist.sys.miui.sf_cores "4-7";
                    resetprop -n persist.sys.miui_animator_sched.bigcores "4-7";
                    resetprop -n persist.sys.miui_animator_sched.sched_threads "2";
                `;
                break;
            case 6:
                coreConfigCmd = `
                    resetprop -n persist.sys.miui.sf_cores "0-5";
                    resetprop -n persist.sys.miui_animator_sched.bigcores "2-5";
                `;
                break;
            case 4:
                coreConfigCmd = `
                    resetprop -n persist.sys.miui.sf_cores "0-3";
                    resetprop -n persist.sys.miui_animator_sched.bigcores "0-3";
                `;
                break;
        }
        command += coreConfigCmd;

        if (command.trim()) await exec(command);
    } catch (e) {
        console.error("Failed to apply MiuiBoost settings:", e);
    }
}

// =========================
// === SELECT FUNCTIONS ====
// =========================

async function applyRenderingEngine(value) {
    const prop = value === "SkiaVK" ? "skiavk" : "skiagl";
    let command = `
        setprop debug.hwui.renderer ${prop};
        setprop debug.renderengine.backend ${prop}threaded;
    `;
    // Disable tracing for OpenGL (skiagl) to reduce overhead
    if (prop === "skiagl") {
        command += `
            setprop debug.renderengine.capture_skia_ms 0;
            setprop debug.renderengine.skia_atrace_enabled false;
            setprop debug.hwui.skia_use_perfetto_track_events false;
            setprop debug.hwui.skia_tracing_enabled false;
            setprop debug.tracing.ctl.hwui.skia_tracing_enabled false;
            setprop debug.tracing.ctl.hwui.skia_use_perfetto_track_events false;
            setprop debug.tracing.ctl.renderengine.skia_tracing_enabled false;
            setprop debug.tracing.ctl.renderengine.skia_use_perfetto_track_events false;
        `;
    }
    await exec(command).catch(e => console.error("Failed to apply Rendering Engine:", e));
}

async function applyCompositionType(value) {
    await exec(`setprop debug.composition.type ${value.toLowerCase()}`)
        .catch(e => console.error("Failed to apply Composition Type:", e));
}

async function applyRefreshRate(value) {
    const FPS = parseInt(value.replace("Hz", "")) || 60;
    const command = `
        settings put system peak_refresh_rate ${FPS};
        settings put system user_refresh_rate ${FPS};
        settings put system max_refresh_rate ${FPS};
        settings put system min_refresh_rate ${FPS};
    `;
    await exec(command).catch(e => console.error("Failed to apply Refresh Rate:", e));
}

async function applyMemoryFactor(value) {
    const map = { "Critical": "CRITICAL", "Low": "LOW", "Normal": "NORMAL" };
    const factor = map[value] || "NORMAL";
    await exec(`am memory-factor set ${factor}`)
        .catch(e => console.error("Failed to apply Memory Factor:", e));
}

async function applyThermalService(value) {
    try {
        if (value === "Default") {
            await exec(`cmd thermalservice reset || true`);
            return;
        }
        const map = { "None": "0", "Light": "1", "Moderate": "2", "Severe": "3", "Critical": "4", "Emergency": "5", "Shutdown": "6" };
        const status = map[value] || "0";

        // Instead, just override the status.
        await exec(`cmd thermalservice override-status ${status}`);
    } catch (e) {
        console.error("Failed to apply Thermal Service settings:", e);
    }
}

async function applyDriver(value) {
    try {
        const uniquePkgs = await getInstalledGamePackages();
        if (uniquePkgs.length === 0) return;
        const joinedPkgs = uniquePkgs.join(",");

        const androidVersion = parseInt(await getProp("ro.build.version.release")) || 12;
        
        // FIX: Corrected logic for driver properties based on Android version (12+ vs <12)
        const driverIn = androidVersion >= 12 ? "updatable_driver_production_opt_in_apps" : "game_driver_opt_in_apps";
        const driverOut = androidVersion >= 12 ? "updatable_driver_production_opt_out_apps" : "game_driver_opt_out_apps";

        let command = '';
        if (value === "Reset") {
            command = `
                settings delete global angle_gl_driver_selection_pkgs || true;
                settings delete global angle_gl_driver_selection_values || true;
                settings delete global ${driverIn} || true;
                settings delete global ${driverOut} || true;
            `;
        } else if (value === "AngleNative") {
            command = `
                settings put global angle_gl_driver_selection_pkgs "${joinedPkgs}" || true;
                settings put global angle_gl_driver_selection_values "native" || true;
                settings put global ${driverIn} "${joinedPkgs}" || true;
                settings put global ${driverOut} "1" || true;
            `;
        } else if (value === "GameDriver") {
            command = `
                settings delete global angle_gl_driver_selection_pkgs || true;
                settings delete global angle_gl_driver_selection_values || true;
                settings put global ${driverIn} "${joinedPkgs}" || true;
                settings put global ${driverOut} "1" || true;
            `;
        }
        if (command) await exec(command);
    } catch (e) {
        console.error("Failed to apply Driver settings:", e);
    }
}

// =========================
// === UI AND STATE MGMT ===
// =========================
async function selectMode(mode, skipExec = false) {
    const adaptiveBtn = document.getElementById("adaptiveBtn");
    const xmodeBtn = document.getElementById("xmodeBtn");

    if (!adaptiveBtn || !xmodeBtn) return;

    if (mode === "performance") {
        xmodeBtn.classList.add("active");
        adaptiveBtn.classList.remove("active");
        localStorage.setItem("activeMode", "performance");
        if (!skipExec) await activatePerformance();
    } else {
        adaptiveBtn.classList.add("active");
        xmodeBtn.classList.remove("active");
        localStorage.setItem("activeMode", "efficiency");
        if (!skipExec) await activateEfficiency();
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const adaptiveBtn = document.getElementById("adaptiveBtn");
    const xmodeBtn = document.getElementById("xmodeBtn");

    if (adaptiveBtn && xmodeBtn) {
        const savedMode = localStorage.getItem("activeMode") || "efficiency";
        selectMode(savedMode, true);

        adaptiveBtn.addEventListener("click", () => selectMode("efficiency"));
        xmodeBtn.addEventListener("click", () => selectMode("performance"));
    }
});

// =========================
// === FALLBACK HELPERS ====
// =========================

function readToggleStored(id) {
    const val = localStorage.getItem(`toggle-${id}`);
    return val === "true" || val === "1";
}

function setToggleButtonState(btn, state) {
    if (!btn) return;
    btn.dataset.state = state ? "1" : "0";
    btn.textContent = state ? "ON" : "OFF";
    btn.classList.toggle("on", state);
}

// =========================
// === SETUP CONTROLS ======
// =========================

function setupControls() {
    const toggleMap = {
        "ChipsetOptimizer": applyChipsetOptimizer,
        "activityManager": applyActivityManager,
        "gameManager": applyGameManager,
        "fstrimBoot": applyFstrimBoot,
        "miuiBoost": applyMiuiBoost,
        "netEnh": applyNetEnh,
    };

    Object.keys(toggleMap).forEach(id => {
        const btn = document.getElementById(id);
        const handler = toggleMap[id];
        if (!btn) return;

        const stored = readToggleStored(id);
        setToggleButtonState(btn, stored);

        btn.addEventListener("click", async (e) => {
            e.preventDefault();
            const prev = btn.dataset.state === "1";
            const next = !prev;
            setToggleButtonState(btn, next);
            localStorage.setItem(`toggle-${id}`, next);

            // Visual feedback
            btn.classList.add("pulse");
            setTimeout(() => btn.classList.remove("pulse"), 300);

            try {
                if (typeof handler === "function") {
                    const r = handler(next);
                    if (r && typeof r.then === "function") await r;
                }
            } catch (err) {
                console.error(`Handler for ${id} failed:`, err);
            }
        });
    });

    // === SELECT + APPLY ===
    const selectMap = {
        "rendering": applyRenderingEngine,
        "composition": applyCompositionType,
        "refresh": applyRefreshRate,
        "memFactor": applyMemoryFactor,
        "thermal": applyThermalService,
        "driver": applyDriver
    };

    Object.entries(selectMap).forEach(([id, func]) => {
        const select = document.getElementById(id);
        let applyBtn = null;
        if (select) {
            const parent = select.parentElement;
            if (parent)
                applyBtn = parent.querySelector("button.apply-btn, button");
            else
                applyBtn = document.querySelector(`button[data-for='${id}']`);
        }

        if (select && applyBtn) {
            applyBtn.addEventListener("click", async () => {
                const val = select.value;
                localStorage.setItem(`select-${id}`, val);
                try {
                    await func(val);
                } catch (e) {
                    console.error(`apply ${id} failed:`, e);
                }
            });
        }
    });
}

// =========================
// === RESET & RESTORE =====
// =========================
async function resetAllSettings() {
    document.querySelectorAll("button.toggle").forEach(btn => {
        setToggleButtonState(btn, false);
        if (btn.id) localStorage.removeItem(`toggle-${btn.id}`);
    });

    for (const select of document.querySelectorAll("select")) {
        select.selectedIndex = 0;
        if (select.id) localStorage.removeItem(`select-${select.id}`);
        const applyBtn = select.parentElement
            ? (select.parentElement.querySelector("button.apply-btn") || select.parentElement.querySelector("button"))
            : null;
        if (applyBtn) await applyBtn.click();
    }

    // Reset saved states
    localStorage.removeItem('activeTab');
    localStorage.removeItem('activeMode');
    document.querySelectorAll(".popup").forEach(p => p.style.display = "none");

    if (typeof selectMode === "function") selectMode('efficiency');
}

async function restoreSession() {
    try {
        await new Promise(r => setTimeout(r, 500));
        try {
            const res = await exec("[ -f /data/local/tmp/cgo_reset.flag ] && echo 1 || echo 0");
            if ((res.stdout || "").trim() === "1") {
                localStorage.clear();
                await exec("rm /data/local/tmp/cgo_reset.flag").catch(() => {});
            }
        } catch (e) {}

        document.querySelectorAll("button.toggle").forEach(async btn => {
            const id = btn.id;
            if (!id) return;
            const stored = readToggleStored(id);
            setToggleButtonState(btn, stored);

            const restoreMap = {
                "ChipsetOptimizer": applyChipsetOptimizer,
                "activityManager": applyActivityManager,
                "gameManager": applyGameManager,
                "fstrimBoot": applyFstrimBoot,
                "miuiBoost": applyMiuiBoost,
                "netEnh": applyNetEnh,
            };
            const handler = restoreMap[id];
            if (handler && typeof handler === "function" && stored) {
                try { await handler(true); } catch (err) { console.error(`restore handler ${id} failed:`, err); }
            }
        });

        document.querySelectorAll("select").forEach(select => {
            if (!select.id) return;
            const saved = localStorage.getItem(`select-${select.id}`);
            if (saved) {
                const opt = Array.from(select.options).find(o => o.value === saved || o.text === saved);
                if (opt) select.value = opt.value;
                const applyBtn = select.parentElement
                    ? (select.parentElement.querySelector("button.apply-btn") || select.parentElement.querySelector("button"))
                    : null;
                if (applyBtn) applyBtn.click();
            }
        });

        // Restore mode & tab
        const savedMode = localStorage.getItem('activeMode') || 'efficiency';
        if (typeof selectMode === "function") selectMode(savedMode, true);

        const savedTab = localStorage.getItem('activeTab');
        if (savedTab && typeof window.switchTab === "function") switchTab(savedTab);

    } catch (err) {
        console.error("restoreSession failed:", err);
    }
}

// =========================
// === POPUP & UI =========
// =========================
function setupUIListeners() {
    const advanceBtn = document.getElementById("advance-feature");
    const supportBtn = document.getElementById("support-feature");
    const advancePopup = document.getElementById("advance-popup");
    const supportPopup = document.getElementById("support-popup");
    const closeButtons = document.querySelectorAll(".close-btn");

    if (advanceBtn && advancePopup)
        advanceBtn.addEventListener("click", () => advancePopup.style.display = "flex");

    if (supportBtn && supportPopup)
        supportBtn.addEventListener("click", () => supportPopup.style.display = "flex");

    closeButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            const targetId = btn.dataset.close;
            if (targetId) {
                const el = document.getElementById(targetId);
                if (el) el.style.display = "none";
            }
        });
    });

    [advancePopup, supportPopup].forEach(popup => {
        if (!popup) return;
        popup.addEventListener("click", e => {
            if (e.target === popup) popup.style.display = "none";
        });
    });

    updateSystemStats();
    setInterval(updateSystemStats, 3000);
}

// =========================
// === MAIN INIT ===========
document.addEventListener("DOMContentLoaded", async () => {
    setupUIListeners();
    setupControls();
    await restoreSession();
});

window.resetAllSettings = resetAllSettings;
window.selectMode = selectMode;
