-- ========================================================
-- TalentMine Candidate Intelligence Platform
-- MySQL Database Schema
-- Pure Table Definitions (No Mock / Seed Data)
-- ========================================================

-- Create database if it does not already exist
CREATE DATABASE IF NOT EXISTS `talentmine_db`
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `talentmine_db`;

-- --------------------------------------------------------
-- 1. Users Table (Authentication & Recruiter Profiles)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(64) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) DEFAULT NULL,
  `role` VARCHAR(100) NOT NULL DEFAULT 'Recruiter / Workspace Admin',
  `provider` VARCHAR(50) NOT NULL DEFAULT 'local',
  `avatar` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 2. Candidates Table (Mined & Validated Profiles)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `candidates` (
  `id` VARCHAR(64) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `designation` VARCHAR(255) NOT NULL,
  `experience` INT NOT NULL DEFAULT 0,
  `skills` JSON NOT NULL,
  `type` ENUM('professional', 'student') NOT NULL DEFAULT 'professional',
  `country` VARCHAR(100) NOT NULL,
  `city` VARCHAR(100) NOT NULL,
  `location` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `phone` VARCHAR(50) DEFAULT NULL,
  `source` VARCHAR(100) DEFAULT NULL,
  `profile` VARCHAR(255) DEFAULT NULL,
  `education` VARCHAR(255) DEFAULT NULL,
  `verified` TINYINT(1) NOT NULL DEFAULT 1,
  `status` VARCHAR(100) NOT NULL DEFAULT 'Available',
  `matchScore` INT NOT NULL DEFAULT 90,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_country` (`country`),
  INDEX `idx_city` (`city`),
  INDEX `idx_type` (`type`),
  INDEX `idx_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 3. Mining History Table (Audit Log for API Searches)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `mining_history` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `country` VARCHAR(100) DEFAULT NULL,
  `city` VARCHAR(100) DEFAULT NULL,
  `type` VARCHAR(50) DEFAULT NULL,
  `skill` VARCHAR(100) DEFAULT NULL,
  `search_query` VARCHAR(255) DEFAULT NULL,
  `results_count` INT NOT NULL DEFAULT 0,
  `executed_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
