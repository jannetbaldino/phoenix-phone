fx_version 'cerulean'
game 'gta5'
lua54 'yes'

name 'phoenix-phone'
author 'PRP'
version '0.1.0'

ui_page 'web/index.html'

files {
  'web/index.html',
  'web/assets/*.js',
  'web/assets/*.css',
  'web/assets/*.*'
}

client_scripts {
  '@ox_lib/init.lua',
  'client/main.lua',
}

server_scripts {
  '@ox_lib/init.lua',
  '@oxmysql/lib/MySQL.lua',
  'server/db.lua',
  'server/main.lua',
}

dependencies {
  'ox_lib',
  'oxmysql',
  'qbx_core'
}
