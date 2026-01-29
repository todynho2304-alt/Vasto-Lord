#!/system/bin/sh
# Do NOT assume where your module will be located.
# ALWAYS use $MODDIR if you need to know where this script
# and module is placed.
# This will make sure your module will still work
# if Magisk change its mount point in the future
MODDIR=${0%/*}

disable_kernel_panic() {
    sysctl -w kernel.panic=0
    sysctl -w vm.panic_on_oom=0
    sysctl -w kernel.panic_on_oops=0
    sysctl -w kernel.softlockup_panic=0
}

disable_printk() {
# Printk (thx to KNTD-reborn)
    echo "0 0 0 0" > /proc/sys/kernel/printk
    echo "off" > /proc/sys/kernel/printk_devkmsg
    echo "1" > /sys/module/printk/parameters/ignore_loglevel
    echo "1" > /sys/module/printk/parameters/console_suspend
    echo "0" > /sys/module/printk/parameters/cpu
    echo "0" > /sys/kernel/printk_mode/printk_mode
    echo "0" > /sys/module/printk/parameters/pid
    echo "0" > /sys/module/printk/parameters/time
    echo "0" > /sys/module/printk/parameters/printk_ratelimit
}

main() {
    disable_kernel_panic
    disable_printk
}

# Main Execution & Exit script successfully
sync && main
  
# This script will be executed in post-fs-data mode