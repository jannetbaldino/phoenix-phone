local PHONE_OPEN = false
local PEEKING = false

local function nui(msg)
  SendNUIMessage(msg)
end

local function setFocus(open)
  SetNuiFocus(open, open)
  SetNuiFocusKeepInput(open)
end

local function playPhoneAnim(opening)
  local ped = cache.ped
  if not ped or ped == 0 then return end

  local dict = 'cellphone@'
  local animIn = 'cellphone_text_in'
  local animOut = 'cellphone_text_out'

  RequestAnimDict(dict)
  while not HasAnimDictLoaded(dict) do Wait(0) end

  if opening then
    TaskPlayAnim(ped, dict, animIn, 8.0, -8.0, 900, 50, 0, false, false, false)
  else
    TaskPlayAnim(ped, dict, animOut, 8.0, -8.0, 900, 50, 0, false, false, false)
  end
end

local function disableControlsTick()
  CreateThread(function()
    while PHONE_OPEN do
      DisableControlAction(0, 1, true)
      DisableControlAction(0, 2, true)
      DisableControlAction(0, 24, true)
      DisableControlAction(0, 25, true)
      DisableControlAction(0, 200, true)
      DisableControlAction(0, 322, true)
      DisableControlAction(0, 177, true)
      DisableControlAction(0, 199, true)
      Wait(0)
    end
  end)
end

local function openPhone()
  if PHONE_OPEN then return end
  PHONE_OPEN = true
  playPhoneAnim(true)
  nui({ type = 'phone:setVisible', visible = true })
  setFocus(true)
  disableControlsTick()
end

local function closePhone()
  if not PHONE_OPEN then return end
  PHONE_OPEN = false
  setFocus(false)
  playPhoneAnim(false)
  nui({ type = 'phone:setVisible', visible = false })
end

RegisterCommand('phone', function()
  if PHONE_OPEN then closePhone() else openPhone() end
end, false)
RegisterKeyMapping('phone', 'Open Phone', 'keyboard', 'F1')

RegisterNUICallback('phone:close', function(_, cb)
  closePhone()
  cb(true)
end)

RegisterNUICallback('phone:ready', function(_, cb)
  cb(true)
end)

-- =========================
-- RPC (NO ox_lib)
-- =========================
local rpcSeq = 0
local rpcPending = {} -- [id] = promise

local function rpcCall(name, payload)
  rpcSeq = rpcSeq + 1
  local id = rpcSeq

  local p = promise.new()
  rpcPending[id] = p

  TriggerServerEvent('phoenix-phone:rpc', id, name, payload)
  local res = Citizen.Await(p) -- { ok=true, data=? } or { ok=false, error=? }

  if not res or res.ok ~= true then
    return nil, (res and res.error) or 'rpc_failed'
  end

  return res.data, nil
end

RegisterNetEvent('phoenix-phone:rpc:resp', function(id, ok, dataOrErr)
  local p = rpcPending[id]
  if not p then return end
  rpcPending[id] = nil

  if ok then
    p:resolve({ ok = true, data = dataOrErr })
  else
    p:resolve({ ok = false, error = dataOrErr })
  end
end)

-- NUI bridge: UI -> client -> server RPC
RegisterNUICallback('phone:call', function(data, cb)
  local name = data and data.name
  local payload = data and data.payload

  if type(name) ~= 'string' or name == '' then
    cb({ ok = false, error = 'bad_request' })
    return
  end

  local out, err = rpcCall(name, payload)
  if err then
    cb({ ok = false, error = err })
    return
  end

  cb({ ok = true, data = out })
end)

-- Notifications from server
RegisterNetEvent('prp-phone:notify', function(payload)
  payload = payload or {}
  nui({ type = 'phone:toast', toast = payload })

  if PHONE_OPEN then return end
  if PEEKING then return end
  PEEKING = true

  nui({ type = 'phone:peek', peek = true })

  SetTimeout(2000, function()
    nui({ type = 'phone:peek', peek = false })
    PEEKING = false
  end)
end)
