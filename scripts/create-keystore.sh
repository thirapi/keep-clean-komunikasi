#!/usr/bin/env bash
#
# Creates the Android release keystore for this project.
#
# READ THIS FIRST. The keystore is the app's permanent identity. Android refuses
# to install an update signed with a different key, so if you lose the .jks or
# its password, the app can never be updated again — for Play Store or for
# sideloaded releases. There is no reset and no recovery.
#
# It is written outside the repository (~/.keystores) and gitignored, and the
# password is never echoed to stdout.
set -euo pipefail

KEYDIR="${KOMUNIKASI_KEYSTORE_DIR:-$HOME/.keystores}"
JKS="$KEYDIR/komunikasi-release.jks"
CREDS="$KEYDIR/komunikasi-release.credentials"
ALIAS="komunikasi"
DAYS=10950   # 30 years

if [ -f "$JKS" ]; then
  echo "keystore already exists: $JKS" >&2
  echo "refusing to overwrite it — that would change the app's signing identity" >&2
  exit 1
fi

mkdir -p "$KEYDIR"
chmod 700 "$KEYDIR"
umask 077

PASS="$(head -c 48 /dev/urandom | base64 | tr -d '/+=' | head -c 32)"

keytool -genkeypair -v \
  -keystore "$JKS" \
  -storetype PKCS12 \
  -alias "$ALIAS" \
  -keyalg RSA -keysize 4096 -validity "$DAYS" \
  -storepass "$PASS" -keypass "$PASS" \
  -dname "CN=Komunikasi, OU=Release, O=Thirapi, C=ID" >/dev/null 2>&1

cat > "$CREDS" <<EOF
# Keep this file and \$JKS together. They are a pair: the keystore is useless
# without this password, and this password is useless without the keystore.
# Back both up offline.
jks=$JKS
storePassword=$PASS
keyAlias=$ALIAS
keyPassword=$PASS
EOF

chmod 600 "$JKS" "$CREDS"

echo "created : $JKS"
echo "saved   : $CREDS  (mode 600)"
echo
echo "The password was not printed. To build a signed release, run:"
echo "  npm run android:signing-config"
echo "  npm run android:release"
echo
echo "Back up both files now. Losing them ends the app's ability to ship updates."
