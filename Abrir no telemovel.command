#!/bin/zsh
cd -- "$(dirname -- "$0")" || exit 1
if ! command -v node >/dev/null 2>&1; then
  for pequim_node_bin in "$HOME"/.nvm/versions/node/*/bin(N); do
    export PATH="$pequim_node_bin:$PATH"
  done
fi
if ! command -v node >/dev/null 2>&1; then
  echo "Não foi encontrado Node.js. Instala a versão LTS de nodejs.org."
  read -r "?Carrega em Enter para fechar."
  exit 1
fi
if [[ ! -d node_modules/qrcode ]]; then
  npm ci || exit 1
fi
node scripts/serve.mjs --lan --open
