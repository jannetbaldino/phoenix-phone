local PHONE_OPEN = false
local PEEKING = false

local phoneProp = 0

-- Phone prop setup
local PHONE_PROP_MODEL = `prop_npc_phone_02`
local PHONE_BONE = 28422 -- PH_R_Hand

-- Start with neutral; we can tune once it's visible
local PHONE_OFFSET = vec3(0.0, 0.0, 0.0)
local PHONE_ROT = vec3(0.0, 0.0, 0.0)

local function nui(msg)
  SendNUIMessage(msg)
end

local function setFocus(open)
  SetNuiFocus(open, open)
  SetNuiFocusKeepInput(open)
end

-- =========================
-- Prop helpers
-- =========================
local function loadModel(model)
  if not IsModelInCdimage(model) then return false end
  RequestModel(model)
  local timeout = GetGameTimer() + 5000
  while not HasModelLoaded(model) do
    if GetGameTimer() > timeout then return false end
    Wait(0)
  end
  return true
end

local function deletePhoneProp()
  if phoneProp ~= 0 and DoesEntityExist(phoneProp) then
    DeleteEntity(phoneProp)
  end
  phoneProp = 0
end

local function createAndAttachPhoneProp()
  deletePhoneProp()

  local ped = cache.ped
  if not ped or ped == 0 then return end
  if not loadModel(PHONE_PROP_MODEL) then
    print('[phoenix-phone] failed to load phone prop model')
    return
  end

  local coords = GetEntityCoords(ped)
  phoneProp = CreateObject(PHONE_PROP_MODEL, coords.x, coords.y, coords.z + 0.2, true, true, false)
  SetModelAsNoLongerNeeded(PHONE_PROP_MODEL)

  if phoneProp == 0 or not DoesEntityExist(phoneProp) then
    phoneProp = 0
    print('[phoenix-phone] failed to create phone prop entity')
    return
  end

  SetEntityCollision(phoneProp, false, false)
  SetEntityCompletelyDisableCollision(phoneProp, true, true)
  SetEntityAsMissionEntity(phoneProp, true, true)

  AttachEntityToEntity(
    phoneProp,
    ped,
    GetPedBoneIndex(ped, PHONE_BONE),
    PHONE_OFFSET.x, PHONE_OFFSET.y, PHONE_OFFSET.z,
    PHONE_ROT.x, PHONE_ROT.y, PHONE_ROT.z,
    true, true, false, true, 1, true
  )
end

-- =========================
-- Anim helpers
-- =========================
local function loadAnimDict(dict)
  RequestAnimDict(dict)
  local timeout = GetGameTimer() + 5000
  while not HasAnimDictLoaded(dict) do
    if GetGameTimer() > timeout then return false end
    Wait(0)
  end
  return true
end

local function playPhoneAnim(opening)
  local ped = cache.ped
  if not ped or ped == 0 then return end

  local dict = 'cellphone@'
  if not loadAnimDict(dict) then
    print('[phoenix-phone] failed to load anim dict')
    return
  end

  if opening then
    TaskPlayAnim(ped, dict, 'cellphone_text_in', 1.2, 1.2, 900, 50, 0, false, false, false)
    SetTimeout(650, function()
      if PHONE_OPEN then
        TaskPlayAnim(ped, dict, 'cellphone_text_read_base', 8.0, -8.0, -1, 49, 0, false, false, false)
      end
    end)
  else
    TaskPlayAnim(ped, dict, 'cellphone_text_out', 1.2, 1.2, 900, 50, 0, false, false, false)
    SetTimeout(950, function()
      ClearPedSecondaryTask(ped)
    end)
  end
end

-- =========================
-- Controls lock
-- =========================
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

-- =========================
-- Open/close
-- =========================
local function openPhone()
  if PHONE_OPEN then return end
  PHONE_OPEN = true

  print('[phoenix-phone] openPhone')

  createAndAttachPhoneProp()
  playPhoneAnim(true)

  SetTimeout(120, function()
    if not PHONE_OPEN then return end
    nui({ type = 'phone:setVisible', visible = true })
    setFocus(true)
    disableControlsTick()
  end)
end

local function closePhone()
  if not PHONE_OPEN then return end
  PHONE_OPEN = false

  print('[phoenix-phone] closePhone')

  setFocus(false)
  nui({ type = 'phone:setVisible', visible = false })

  playPhoneAnim(false)

  SetTimeout(700, function()
    deletePhoneProp()
  end)
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
local rpcPending = {}

local function rpcCall(name, payload)
  rpcSeq = rpcSeq + 1
  local id = rpcSeq

  local p = promise.new()
  rpcPending[id] = p

  TriggerServerEvent('phoenix-phone:rpc', id, name, payload)

  SetTimeout(8000, function()
    local pending = rpcPending[id]
    if pending then
      rpcPending[id] = nil
      pending:resolve({ ok = false, error = 'timeout' })
    end
  end)

  local res = Citizen.Await(p)
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

AddEventHandler('onResourceStop', function(res)
  if res ~= GetCurrentResourceName() then return end
  deletePhoneProp()
end)

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
