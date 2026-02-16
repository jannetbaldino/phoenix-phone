PHX_DB = PHX_DB or {}
local DB = PHX_DB

local function now()
  return os.time()
end

local DEFAULT_SETTINGS = {
  theme = "dark",
  notifications = true,
  ringtone = "default",
  vibrate = true
}

local function genPhoneNumber()
  -- Simple 555-XXXX. Replace with your own logic later.
  local n = math.random(1000, 9999)
  return ("555-%04d"):format(n)
end

function DB.ensureUser(citizenid)
  local row = MySQL.single.await('SELECT citizenid, phone_number, settings FROM prp_phone_users WHERE citizenid = ?', { citizenid })
  if row then
    return {
      citizenid = row.citizenid,
      phone_number = row.phone_number,
      settings = row.settings and json.decode(row.settings) or DEFAULT_SETTINGS
    }
  end

  local phone = genPhoneNumber()
  local settings = json.encode(DEFAULT_SETTINGS)

  -- ensure unique phone number
  local tries = 0
  while tries < 20 do
    local ok = pcall(function()
      MySQL.insert.await('INSERT INTO prp_phone_users (citizenid, phone_number, settings) VALUES (?, ?, ?)', { citizenid, phone, settings })
    end)
    if ok then
      break
    end
    tries += 1
    phone = genPhoneNumber()
  end

  -- create bank account if missing
  MySQL.insert.await('INSERT IGNORE INTO prp_phone_bank_accounts (citizenid, balance) VALUES (?, ?)', { citizenid, 0 })

  return {
    citizenid = citizenid,
    phone_number = phone,
    settings = DEFAULT_SETTINGS
  }
end

function DB.getProfile(citizenid)
  local u = DB.ensureUser(citizenid)
  return u
end

function DB.saveSettings(citizenid, settings)
  MySQL.update.await('UPDATE prp_phone_users SET settings = ? WHERE citizenid = ?', { json.encode(settings), citizenid })
  return true
end

-- Contacts
function DB.getContacts(citizenid)
  return MySQL.query.await('SELECT id, name, phone_number, notes FROM prp_phone_contacts WHERE owner_citizenid = ? ORDER BY name ASC', { citizenid }) or {}
end

function DB.addContact(citizenid, name, phone, notes)
  local id = MySQL.insert.await(
    'INSERT INTO prp_phone_contacts (owner_citizenid, name, phone_number, notes) VALUES (?, ?, ?, ?)',
    { citizenid, name, phone, notes }
  )
  return id
end

function DB.deleteContact(citizenid, id)
  MySQL.update.await('DELETE FROM prp_phone_contacts WHERE owner_citizenid = ? AND id = ?', { citizenid, id })
  return true
end

-- Messages
local function ensureThread(citizenid, otherNumber)
  local row = MySQL.single.await('SELECT id FROM prp_phone_threads WHERE owner_citizenid = ? AND other_number = ?', { citizenid, otherNumber })
  if row and row.id then return row.id end

  local id = MySQL.insert.await(
    'INSERT INTO prp_phone_threads (owner_citizenid, other_number, last_message, last_at) VALUES (?, ?, ?, ?)',
    { citizenid, otherNumber, '', 0 }
  )
  return id
end

function DB.getThreads(citizenid)
  return MySQL.query.await(
    'SELECT id, other_number, last_message, last_at FROM prp_phone_threads WHERE owner_citizenid = ? ORDER BY last_at DESC',
    { citizenid }
  ) or {}
end

function DB.getThreadMessages(citizenid, threadId, limit)
  limit = tonumber(limit or 50) or 50
  local t = MySQL.single.await('SELECT id FROM prp_phone_threads WHERE id = ? AND owner_citizenid = ?', { threadId, citizenid })
  if not t then return {} end

  return MySQL.query.await(
    'SELECT id, direction, body, sent_at FROM prp_phone_messages WHERE thread_id = ? ORDER BY sent_at DESC LIMIT ?',
    { threadId, limit }
  ) or {}
end

function DB.sendMessageFromCitizen(citizenid, fromNumber, toNumber, body)
  local sentAt = now()

  -- sender thread (out)
  local threadOut = ensureThread(citizenid, toNumber)
  MySQL.insert.await(
    'INSERT INTO prp_phone_messages (thread_id, direction, body, sent_at) VALUES (?, ?, ?, ?)',
    { threadOut, 'out', body, sentAt }
  )
  MySQL.update.await(
    'UPDATE prp_phone_threads SET last_message = ?, last_at = ? WHERE id = ?',
    { body, sentAt, threadOut }
  )

  -- receiver thread (in) if receiver exists
  local receiver = MySQL.single.await('SELECT citizenid FROM prp_phone_users WHERE phone_number = ?', { toNumber })
  if receiver and receiver.citizenid then
    local threadIn = ensureThread(receiver.citizenid, fromNumber)
    MySQL.insert.await(
      'INSERT INTO prp_phone_messages (thread_id, direction, body, sent_at) VALUES (?, ?, ?, ?)',
      { threadIn, 'in', body, sentAt }
    )
    MySQL.update.await(
      'UPDATE prp_phone_threads SET last_message = ?, last_at = ? WHERE id = ?',
      { body, sentAt, threadIn }
    )
    return receiver.citizenid
  end

  return nil
end

-- Banking
function DB.getBank(citizenid)
  MySQL.insert.await('INSERT IGNORE INTO prp_phone_bank_accounts (citizenid, balance) VALUES (?, ?)', { citizenid, 0 })
  local row = MySQL.single.await('SELECT balance FROM prp_phone_bank_accounts WHERE citizenid = ?', { citizenid })
  local tx = MySQL.query.await(
    'SELECT id, kind, amount, note, created_at FROM prp_phone_bank_transactions WHERE citizenid = ? ORDER BY created_at DESC LIMIT 50',
    { citizenid }
  ) or {}
  return { balance = row and tonumber(row.balance) or 0, transactions = tx }
end

function DB.addBankTx(citizenid, kind, amount, note)
  MySQL.insert.await(
    'INSERT INTO prp_phone_bank_transactions (citizenid, kind, amount, note, created_at) VALUES (?, ?, ?, ?, ?)',
    { citizenid, kind, amount, note, now() }
  )
end

function DB.transferByPhone(fromCitizen, toPhone, amount, note)
  amount = tonumber(amount or 0) or 0
  if amount <= 0 then return nil, 'bad_amount' end

  local toRow = MySQL.single.await('SELECT citizenid FROM prp_phone_users WHERE phone_number = ?', { toPhone })
  if not toRow or not toRow.citizenid then return nil, 'unknown_recipient' end

  local fromBal = MySQL.single.await('SELECT balance FROM prp_phone_bank_accounts WHERE citizenid = ?', { fromCitizen })
  if not fromBal then
    MySQL.insert.await('INSERT IGNORE INTO prp_phone_bank_accounts (citizenid, balance) VALUES (?, ?)', { fromCitizen, 0 })
    fromBal = { balance = 0 }
  end

  local fb = tonumber(fromBal.balance) or 0
  if fb < amount then return nil, 'insufficient_funds' end

  -- update balances
  MySQL.update.await('UPDATE prp_phone_bank_accounts SET balance = balance - ? WHERE citizenid = ?', { amount, fromCitizen })
  MySQL.insert.await('INSERT IGNORE INTO prp_phone_bank_accounts (citizenid, balance) VALUES (?, ?)', { toRow.citizenid, 0 })
  MySQL.update.await('UPDATE prp_phone_bank_accounts SET balance = balance + ? WHERE citizenid = ?', { amount, toRow.citizenid })

  DB.addBankTx(fromCitizen, 'transfer_out', -amount, note or ('To ' .. toPhone))
  DB.addBankTx(toRow.citizenid, 'transfer_in', amount, note or ('From ' .. '???'))

  return toRow.citizenid, nil
end

return DB
