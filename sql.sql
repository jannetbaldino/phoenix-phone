CREATE TABLE IF NOT EXISTS `prp_phone_users` (
  `citizenid` VARCHAR(64) NOT NULL,
  `phone_number` VARCHAR(20) NOT NULL,
  `settings` JSON NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`citizenid`),
  UNIQUE KEY `uniq_phone_number` (`phone_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `prp_phone_contacts` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `owner_citizenid` VARCHAR(64) NOT NULL,
  `name` VARCHAR(128) NOT NULL,
  `phone_number` VARCHAR(20) NOT NULL,
  `notes` TEXT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_owner` (`owner_citizenid`),
  KEY `idx_phone` (`phone_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `prp_phone_threads` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `owner_citizenid` VARCHAR(64) NOT NULL,
  `other_number` VARCHAR(20) NOT NULL,
  `last_message` TEXT NULL,
  `last_at` INT NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_owner_other` (`owner_citizenid`, `other_number`),
  KEY `idx_owner` (`owner_citizenid`),
  KEY `idx_last_at` (`last_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `prp_phone_messages` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `thread_id` INT NOT NULL,
  `direction` ENUM('in','out') NOT NULL,
  `body` TEXT NOT NULL,
  `sent_at` INT NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_thread` (`thread_id`),
  KEY `idx_sent_at` (`sent_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `prp_phone_bank_accounts` (
  `citizenid` VARCHAR(64) NOT NULL,
  `balance` BIGINT NOT NULL DEFAULT 0,
  PRIMARY KEY (`citizenid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `prp_phone_bank_transactions` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `citizenid` VARCHAR(64) NOT NULL,
  `kind` VARCHAR(32) NOT NULL,
  `amount` BIGINT NOT NULL,
  `note` VARCHAR(255) NULL,
  `created_at` INT NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_citizenid` (`citizenid`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
