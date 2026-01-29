#!/system/bin/sh
# Vasto-Lord by @astrasy
# Performance + efficiency module for POCO X6 Pro.
# System Properties Which has been adjusted so that the app runs more perfectly and is responsive.
#
MODDIR=${0%/*}

# ----------------- HELPER SECTIONS -----------------
TEMP="game_auto_temperature_control"
      
log() {
    echo "$1"
}

write_val() {
    local file="$1"
    local value="$2"
    if [ -e "$file" ]; then
        chmod +w "$file" 2>/dev/null
        echo "$value" > "$file" && log "Write : $file → $value" || log "Failed to Write : $file"
    fi
}

wait_until_boot_completed() {
    # Wait sys.boot_completed
    while [ "$(getprop sys.boot_completed)" != "1" ]; do
        sleep 2
    done

    # Wait for storage to mount
    until [ -d "/sdcard/Android" ] || [ -d "/storage/emulated/0/Android" ]; do
        sleep 1
    done
}

send_notification() {
    # Notify user of optimization completion
    if command -v su >/dev/null 2>&1; then
        su -lp 2000 -c "cmd notification post -S bigtext -t 'Vasto-Lord' tag 'Status : Optimization Completed!'" >/dev/null 2>&1
    else
        cmd notification post -S bigtext -t 'Vasto-Lord' 'tags' 'Status : Optimization Completed!' >/dev/null 2>&1
    fi
}

wait_until_boot_completed
# ----------------- OPTIMIZATION SECTIONS -----------------
root_optimization() {
  # file system tweak (thx to Matt Yang)
  if [ -d "/proc/sys/fs" ]; then 
     write_val "/proc/sys/fs/inotify/max_queued_events" "1048576"
     write_val "/proc/sys/fs/inotify/max_user_watches" "1048576"
     write_val "/proc/sys/fs/inotify/max_user_instances" "1024"
     write_val "/proc/sys/fs/dir-notify-enable" "0"
     write_val "/proc/sys/fs/lease-break-time" "20"
     write_val "/proc/sys/kernel/hung_task_timeout_secs" "0"
  fi
  
  # Disable Fsync
  if [ -d "/sys/module/sync/parameters" ]; then
     write_val "/sys/module/sync/parameters/fsync_enabled" "N"
  fi
  
  # Qualcomm enter C-state level 3 took ~500us
  if [ -d "/sys/module/lpm_levels/" ]; then
     write_val "/sys/module/lpm_levels/parameters/lpm_ipi_prediction" "0"
     write_val "/sys/module/lpm_levels/parameters/lpm_prediction" "0"
     write_val "/sys/module/lpm_levels/parameters/bias_hyst" "2"
  fi
  
  # Touch Boost
  write_val "/sys/module/msm_performance/parameters/touchboost" "1"
  write_val "/sys/power/pnpmgr/touch_boost" "1"
  
  # Cpu Efficient
  write_val "/sys/module/workqueue/parameters/power_efficient" "Y"
  
  # Disable logs & debuggers (thx to @Bias_Khaliq)
  for exception_trace in $(find /proc/sys/ -name exception-trace); do
    write_val "$exception_trace" "0"
  done

  for sched_schedstats in $(find /proc/sys/ -name sched_schedstats); do
    write_val "$sched_schedstats" "0"
  done

  for printk in $(find /proc/sys/ -name printk); do
    write_val "$printk" "0 0 0 0"
  done

  for printk_devkmsg in $(find /proc/sys/ -name printk_devkmsg); do
    write_val "$printk_devkmsg" "off"
  done

  for tracing_on in $(find /proc/sys/ -name tracing_on); do
    write_val "$tracing_on" "0"
  done

  for log_ecn_error in $(find /sys/ -name log_ecn_error); do
    write_val "$log_ecn_error" "0"
  done

  for snapshot_crashdumper in $(find /sys/ -name snapshot_crashdumper); do
    write_val "$snapshot_crashdumper" "0"
  done

  # Disable CRC check
  for use_spi_crc in $(find /sys/module -name use_spi_crc); do
    write_val "$use_spi_crc" "0"
  done
  
  # Release cache on boot (try cleaning)
  write_val "/proc/sys/vm/drop_caches" "3"
  write_val "/proc/sys/vm/compact_memory" "1"
}

lite_disablelog() {
  cmd stats clear-puller-cache
  cmd activity clear-debug-app
  cmd activity clear-watch-heap -a
  cmd stats print-logs 0
  cmd display ab-logging-disable
  cmd display dwb-logging-disable
  cmd display dmd-logging-disable
  cmd looper_stats disable
  simpleperf --log fatal --log-to-android-buffer 0
  cmd settings put global activity_starts_logging_enabled 0
  cmd settings put global kernel_cpu_thread_reader num_buckets=0,collected_uids=,minimum_total_cpu_usage_millis=999999999
  cmd device_config put runtime_native_boot disable_lock_profiling true
  cmd device_config put runtime_native_boot iorap_readahead_enable true
  cmd device_config put interaction_jank_monitor enabled false
  cmd device_config put interaction_jank_monitor debug_overlay_enabled false
  # Disable tracing & logging from CMD-Lite (@HoyoSlave)
  cmd accessibility stop-trace
  cmd migard dump-trace false
  cmd migard start-trace false
  cmd migard stop-trace true
  cmd migard trace-buffer-size 0
  cmd input_method tracing stop
  cmd window tracing size 0
  cmd window tracing stop
  cmd autofill set log_level off
  cmd miui_step_counter_service logging-disable
  cmd voiceinteraction set-debug-hotword-logging false
  cmd wifi set-verbose-logging disabled -l 0
  cmd window logging disable
  cmd window logging disable-text
  cmd window logging stop
}

game_optimization() {
  # Disable the automatic temperature control feature
  if settings list secure | grep $TEMP; then
     settings put secure game_auto_temperature_control 1
  fi
  
  # Removes and Stops the statistical testing mode of the process. from ZT @vestia_zeta
  for procstats_option in --clear --stop-testing;do dumpsys procstats "$procstats_option";done

  # limit or speed up the termination of auto-sync running in the background.
  /system/bin/device_config put activity_manager data_sync_fgs_timeout_duration 1

  # Prevent media applications from running for a long time in the foreground service.
  /system/bin/device_config put activity_manager media_processing_fgs_timeout_duration 1

  # Disables logging when FGS is allowed to start.
  /system/bin/device_config put activity_manager fgs_start_allowed_log_sample_rate 0

  # Disables logging when FGS is rejected from start.
  /system/bin/device_config put activity_manager fgs_start_denied_log_sample_rate 0

  # Enables the kernel cgroup "freezer" to freeze idle processes.
  /system/bin/device_config put activity_manager_native_boot use_freezer true
  
  # There is no limit to the number of phantom processes, the system will cache all apps as much as possible.
  /system/bin/device_config put activity_manager max_phantom_processes 2147483647
  
  # Sets the maximum number of cached (background inactive) applications stored by the system.
  /system/bin/device_config put activity_manager max_cached_processes 256
  
  # Empty process = app that is no longer active but has not been cleaned by the system → saved for fast start if opened again.
  /system/bin/device_config put activity_manager max_empty_time_millis 43200000
  
  # to assume storage space is not low
  cmd devicestoragemonitor force-not-low

  # Adjust refresh rate preferences
  cmd display set-match-content-frame-rate-pref 1

  # Disable HDR for smoothness 
  cmd display set-user-disabled-hdr-types 1 2 3 4
  
  # Disable monitoring/limiting phantom processes.
  settings put global settings_enable_monitor_phantom_procs false
  
  # Disable app standby ( battery usage may increase )
  settings put global app_standby_enabled 0
  
  # Touch enhancer
  settings put secure long_press_timeout 180
  settings put secure multi_press_timeout 200
}
  
# ----------------- MAIN EXECUTION -----------------
main() {
    root_optimization
    lite_disablelog
    game_optimization
}

# Main Execution & Exit script successfully
sync;main;send_notification;exit 1
