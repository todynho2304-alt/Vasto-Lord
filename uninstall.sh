#!/system/bin/sh
# ----------------- OPTIMIZATION SECTIONS -----------------
# Notify user of optimization completion
send_notification() {
    cmd notification post -S bigtext -t 'Vasto-Lord' 'tags' 'Status : System Shutdown' >/dev/null 2>&1
}

# Clean Tweak
cleanup_tweak() {
    PERFMIUI="POWER_PERFORMANCE_MODE_OPEN"
    TEMP="game_auto_temperature_control"
    # Disable the automatic temperature control feature
    if settings list secure | grep $TEMP; then
       settings put secure game_auto_temperature_control 1
    fi
    # Delete performance for miui
    if settings list system | grep $PERFMIUI; then
      cmd settings delete system POWER_PERFORMANCE_MODE_OPEN
      cmd settings delete system power_mode
      cmd settings delete system POWER_SAVE_PRE_HIDE_MODE
      cmd settings delete secure speed_mode
    fi
    settings put global app_standby_enabled 1
    settings put global window_animation_scale 1.0
    settings put global transition_animation_scale 1.0
    settings put global animator_duration_scale 1.0
    settings put secure long_press_timeout 300
    settings put secure multi_press_timeout 300
    settings put global private_dns_specifier ""
    settings put global private_dns_mode off
    settings put global activity_starts_logging_enabled 1
    settings put global activity_manager_constants 0
    
    # reset fps
    if settings list system|grep peak_refresh_rate;then settings put system peak_refresh_rate 60;fi
    if settings list system|grep user_refresh_rate;then settings put system user_refresh_rate 60;fi
    if settings list system|grep max_refresh_rate;then settings put system max_refresh_rate 60;fi
    if settings list system|grep min_refresh_rate;then settings put system min_refresh_rate 60;fi
    
    # deleted properties
    cmd setting delete global settings_enable_monitor_phantom_procs
    cmd settings delete global fstrim_mandatory_interval
    cmd settings delete global kernel_cpu_thread_reader
    cmd device_config delete activity_manager data_sync_fgs_timeout_duration
    cmd device_config delete activity_manager media_processing_fgs_timeout_duration
    cmd device_config delete activity_manager fgs_start_allowed_log_sample_rate
    cmd device_config delete activity_manager fgs_start_denied_log_sample_rate
    cmd device_config delete activity_manager_native_boot use_freezer
    cmd device_config delete activity_manager max_phantom_processes
    cmd device_config delete activity_manager max_cached_processes
    cmd device_config delete activity_manager max_empty_time_millis
    cmd device_config delete runtime_native_boot disable_lock_profiling
    cmd device_config delete interaction_jank_monitor enabled
    cmd device_config delete interaction_jank_monitor debug_overlay_enabled
    cmd device_config delete runtime_native_boot iorap_readahead_enable
    
    # reset cmd
    cmd activity memory-factor reset
    cmd devicestoragemonitor reset
    cmd display set-user-disabled-hdr-types
    cmd display set-match-content-frame-rate-pref 0
    cmd display ab-logging-enable
    cmd display dwb-logging-enable
    cmd display dmd-logging-enable
    cmd looper_stats reset
    cmd thermalservice reset
    
    # preload reset (unisoc)
    cmd ufw settings set-preload-disable all false;cmd ufw settings set-mem-reclaim-args 0 0

    # reset game dashboard
    for app in $(cmd package list packages -3|cut -f 2 -d ":");do cmd game reset "$app";cmd device_config delete game_overlay "$app";done
    
    # delete game driver
    cmd settings delete global angle_gl_driver_selection_pkgs
    cmd settings delete global angle_gl_driver_selection_values
    cmd settings delete global game_driver_opt_in_apps
    cmd settings delete global game_driver_opt_out_apps
    cmd settings delete global updatable_driver_production_opt_in_apps
    cmd settings delete global updatable_driver_production_opt_out_apps
}

# ----------------- MAIN EXECUTION -----------------
main() {
   touch /data/local/tmp/cgo_reset.flag
   cleanup_tweak
}

# Main Execution & Exit script successfully
sync;main;send_notification
