local DB = PHX_DB
if not DB then
  error('[phoenix-phone] DB not loaded. Check fxmanifest server_scripts order (db.lua must be before main.lua).')
end

local function getCitizenId(src)
  local player = exports.qbx_core:GetPlayer(src)
  if not player then return nil end

  local pd = player.PlayerData or player

  -- try common shapes across qbx/qb forks
  local cid =
    (pd.citizenid or pd.citizenId)
    or (pd.charinfo and (pd.charinfo.citizenid or pd.charinfo.citizenId))
    or (player.PlayerData and (player.PlayerData.citizenid or player.PlayerData.citizenId))

  if cid and cid ~= '' then return cid end
  return nil
end


local function notifyByCitizenId(citizenid, payload)
  local players = exports.qbx_core:GetQBPlayers()
  for _, p in pairs(players or {}) do
    if p and p.PlayerData and p.PlayerData.citizenid == citizenid then
      TriggerClientEvent('prp-phone:notify', p.PlayerData.source, payload)
      return true
    end
  end
  return false
end

-- =========================
-- RPC handler table
-- =========================
local handlers = {}

handlers['prp-phone:getProfile'] = function(src, _payload)
  local cid = getCitizenId(src)
  if not cid then return nil, 'no_player' end
  return DB.getProfile(cid), nil
end

handlers['prp-phone:saveSettings'] = function(src, settings)
  local cid = getCitizenId(src)
  if not cid then return nil, 'no_player' end
  if type(settings) ~= 'table' then return nil, 'bad_settings' end
  DB.saveSettings(cid, settings)
  return true, nil
end

handlers['prp-phone:getContacts'] = function(src, _payload)
  local cid = getCitizenId(src)
  if not cid then return nil, 'no_player' end
  return DB.getContacts(cid), nil
end

handlers['prp-phone:addContact'] = function(src, payload)
  local cid = getCitizenId(src)
  if not cid then return nil, 'no_player' end

  local name = payload and tostring(payload.name or '') or ''
  local phone = payload and tostring(payload.phone_number or '') or ''
  local notes = payload and tostring(payload.notes or '') or nil

  name = name:gsub('^%s+', ''):gsub('%s+$', '')
  phone = phone:gsub('^%s+', ''):gsub('%s+$', '')

  if name == '' or phone == '' then return nil, 'missing_fields' end
  local id = DB.addContact(cid, name, phone, notes)
  return { id = id }, nil
end

handlers['prp-phone:deleteContact'] = function(src, payload)
  local cid = getCitizenId(src)
  if not cid then return nil, 'no_player' end
  local id = tonumber(payload and payload.id or 0) or 0
  if id <= 0 then return nil, 'bad_id' end
  DB.deleteContact(cid, id)
  return true, nil
end

handlers['prp-phone:getThreads'] = function(src, _payload)
  local cid = getCitizenId(src)
  if not cid then return nil, 'no_player' end
  return DB.getThreads(cid), nil
end

handlers['prp-phone:getThreadMessages'] = function(src, payload)
  local cid = getCitizenId(src)
  if not cid then return nil, 'no_player' end

  local threadId = tonumber(payload and payload.thread_id or 0) or 0
  local limit = tonumber(payload and payload.limit or 50) or 50

  if threadId <= 0 then return nil, 'bad_thread' end

  -- Mark messages as read when player opens thread
  DB.markThreadRead(cid, threadId)

  return DB.getThreadMessages(cid, threadId, limit), nil
end

handlers['prp-phone:sendMessage'] = function(src, payload)
  local cid = getCitizenId(src)
  if not cid then return nil, 'no_player' end

  local toNumber = payload and tostring(payload.to_number or '') or ''
  local body = payload and tostring(payload.body or '') or ''

  toNumber = toNumber:gsub('^%s+', ''):gsub('%s+$', '')
  body = body:gsub('^%s+', ''):gsub('%s+$', '')

  if toNumber == '' or body == '' then return nil, 'missing_fields' end

  local profile = DB.getProfile(cid)
  local receiverCid = DB.sendMessageFromCitizen(cid, profile.phone_number, toNumber, body)

  if receiverCid then
    notifyByCitizenId(receiverCid, {
      title = "New Message",
      body = body,
      app = "messages",
      from = profile.phone_number
    })
  end

  return true, nil
end

handlers['prp-phone:getOrCreateThread'] = function(src, payload)
  local cid = getCitizenId(src)
  if not cid then return nil, 'no_player' end

  local other = tostring(payload and payload.other_number or '')
  other = other:gsub('%s+', '')
  if other == '' then return nil, 'bad_number' end

  return DB.getOrCreateThread(cid, other), nil
end

handlers['prp-phone:getBank'] = function(src, _payload)
  local cid = getCitizenId(src)
  if not cid then return nil, 'no_player' end
  return DB.getBank(cid), nil
end

handlers['prp-phone:bankTransfer'] = function(src, payload)
  local cid = getCitizenId(src)
  if not cid then return nil, 'no_player' end

  local toPhone = payload and tostring(payload.to_phone or '') or ''
  local amount = tonumber(payload and payload.amount or 0) or 0
  local note = payload and tostring(payload.note or '') or ''

  toPhone = toPhone:gsub('^%s+', ''):gsub('%s+$', '')
  if toPhone == '' then return nil, 'missing_recipient' end

  local toCid, err = DB.transferByPhone(cid, toPhone, amount, note)
  if err then return nil, err end

  if toCid then
    notifyByCitizenId(toCid, {
      title = "Bank Transfer",
      body = ("You received $%d"):format(amount),
      app = "banking"
    })
  end

  return true, nil
end

handlers['prp-phone:getMail'] = function(_src, _payload)
  return {}, nil
end

-- =========================
-- RPC event
-- =========================
RegisterNetEvent('phoenix-phone:rpc', function(reqId, name, payload)
  local src = source
  if type(reqId) ~= 'number' or type(name) ~= 'string' then
    TriggerClientEvent('phoenix-phone:rpc:resp', src, reqId, false, 'bad_request')
    return
  end

  local fn = handlers[name]
  if not fn then
    TriggerClientEvent('phoenix-phone:rpc:resp', src, reqId, false, 'unknown_method')
    return
  end

  local ok, a, b = pcall(fn, src, payload)
  if not ok then
    TriggerClientEvent('phoenix-phone:rpc:resp', src, reqId, false, 'server_error')
    print(('[phoenix-phone] handler crash %s: %s'):format(name, a))
    return
  end

  if b ~= nil then
    TriggerClientEvent('phoenix-phone:rpc:resp', src, reqId, false, b)
    return
  end

  TriggerClientEvent('phoenix-phone:rpc:resp', src, reqId, true, a)
end)

RegisterCommand('phone_testnotif', function(src)
  if src <= 0 then return end
  TriggerClientEvent('prp-phone:notify', src, {
    title = "Test",
    body = "Notification peek works",
    app = "messages"
  })
end, false)
