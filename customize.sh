#!/system/bin/sh
# Set logcat buffer size
logcat -G 64K &>/dev/null

if [ "$AXERON" == "true" ]; then
    PRINT="printf"
else
    PRINT="ui_print"
fi

# PRINT FUNCTION WRAPPER ===
print_msg() {
    case "$PRINT" in
        ui_print) ui_print "$1" ;;
        printf) printf "$1" ;;
    esac
}

# Function to print with a clearer format
print_line() {
    ui_print "***************************************"
}

# trimming
trim_partition () {
  if [ "$(id -u)" -eq 0 ]; then
    for partition in system vendor data cache metadata odm system_ext product; do
      fstrim -v "/$partition" &>/dev/null
    done
  else
    for partition in system vendor data cache metadata odm system_ext product; do
      sm fstrim "/$partition" &>/dev/null
    done
  fi
    sleep 3
}

# delete trash & log by @Bias_khaliq
delete_trash_logs () {
# Clear trash on /data/data
for DIR in /data/data/*; do
  if [ -d "${DIR}" ]; then
    rm -rf ${DIR}/cache/*
    rm -rf ${DIR}/no_backup/*
    rm -rf ${DIR}/app_webview/*
    rm -rf ${DIR}/code_cache/*
  fi
done

# Cache cleaner by Taka
    # Search and clear the apps cache in the "/data/data" directory
    find /data/data/*/cache/* -delete &>/dev/null
    # Search and clear the apps code_cache in the "/data/data" directory
    find /data/data/*/code_cache/* -delete &>/dev/null
    # Search and clear the apps cache in the "/data/user_de/{UID}" directory
    find /data/user_de/*/*/cache/* -delete &>/dev/null
    # Search and clear the apps code_cache in the "/data/user_de/{UID}" directory
    find /data/user_de/*/*/code_cache/* -delete &>/dev/null
    # Search and clear the apps cache in the "/sdcard/Android/data" directory
    find /sdcard/Android/data/*/cache/* -delete &>/dev/null
}

ANDROIDVERSION=$(getprop ro.build.version.release)
DEVICES=$(getprop ro.product.board)
MANUFACTURER=$(getprop ro.product.manufacturer)
API=$(getprop ro.build.version.sdk)
NAME="Vasto-Lord | @astrasy"
VERSION="2026.1"
DATE=$(date)

printf "░█▀▄▀█ ░█▀▀█ ░█▀▀▀ ░█▀▀▄ ░█▀▀▀ 
░█░█░█ ░█▄▄█ ░█▀▀▀ ░█─░█ ░█▀▀▀ 
░█──░█ ░█─── ░█▄▄▄ ░█▄▄▀ ░█▄▄▄"
ui_print ""
sleep 0.5
printf " Performance + efficiency tuning for POCO X6 Pro."
sleep 0.2
ui_print ""
print_line
print_msg "- Name            : ${NAME}"
sleep 0.2
print_msg "- Version         : ${VERSION}"
sleep 0.2
print_msg "- Android Version : ${ANDROIDVERSION:-Unknown}"
sleep 0.2
print_msg "- Current Date    : ${DATE}"
sleep 0.2
print_line
print_msg "- Devices         : ${DEVICES:-Unknown}"
sleep 0.2
print_msg "- Manufacturer    : ${MANUFACTURER:-Unknown}"
sleep 0.2
print_line
print_msg "- Trimming up Partitions"
trim_partition &>/dev/null
print_msg "- Deleting Cache and Trash"
delete_trash_logs &>/dev/null
sleep 2

# Set permissions
set_perm_recursive $MODPATH 0 0 0755 0644
set_perm_recursive $MODPATH/system/etc/init/surfaceflinger.rc 0 0 0755 0755

# closing or peak completion of the flash module
logcat -c &>/dev/null
